// -----------------------------------------------------------------
// License lookup + device binding.
//
// A successful lookup returns both the license row AND the device row id, so
// the caller can mint a JWT with `jti = device.id`. On every subsequent sync
// the backend re-resolves that jti and rejects the request if the device has
// been revoked — this is what makes admin "reset device" actually invalidate
// outstanding tokens.
// -----------------------------------------------------------------

import { supabaseAdmin } from './supabase';

export type LicenseRow = {
  id: string;
  plan: string;
  features: string[];
  expiresAt: string | null;
  seatLimit: number;
};

export type LookupSuccess = {
  ok: true;
  row: LicenseRow;
  deviceId: string;
  isNewDevice: boolean;
};

export type LookupFailure = {
  ok: false;
  reason: 'not_found' | 'revoked' | 'expired' | 'seat_limit_exceeded' | 'internal_error';
};

export type LookupResult = LookupSuccess | LookupFailure;

const DEFAULT_FEATURES = ['wa_send', 'wa_group_add', 'wa_extract', 'wa_validate', 'wa_auto_responder'];

export async function lookupLicense(key: string, hwid: string): Promise<LookupResult> {
  // 1. Resolve the license by key.
  const { data: license, error: licenseErr } = await supabaseAdmin
    .from('licenses')
    .select('id, status, plan, features, expires_at, seat_limit')
    .eq('key', key)
    .maybeSingle();

  if (licenseErr) {
    console.error('lookupLicense: supabase error', licenseErr);
    return { ok: false, reason: 'internal_error' };
  }
  if (!license) return { ok: false, reason: 'not_found' };

  if (license.status === 'revoked') return { ok: false, reason: 'revoked' };
  if (license.status === 'expired') return { ok: false, reason: 'expired' };
  if (license.status !== 'active') return { ok: false, reason: 'revoked' };

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }

  const seatLimit: number = license.seat_limit ?? 1;

  // 2. Look for ANY binding for this HWID (active or revoked). A revoked row
  //    means an admin specifically pushed this device off the license — that
  //    hwid should not be allowed to silently re-bind. Without this check,
  //    "reset device" is a no-op against an attacker still calling /verify
  //    from the original machine.
  const { data: anyBinding, error: existingErr } = await supabaseAdmin
    .from('license_devices')
    .select('id, revoked_at')
    .eq('license_id', license.id)
    .eq('hwid', hwid)
    .order('bound_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.error('lookupLicense: device lookup error', existingErr);
    return { ok: false, reason: 'internal_error' };
  }

  if (anyBinding) {
    if (anyBinding.revoked_at) {
      // Hwid was explicitly revoked. Stay rejected until an admin deletes the
      // row (or manually clears revoked_at) — the user can move to a new
      // machine, but the revoked one cannot self-rehabilitate.
      return { ok: false, reason: 'revoked' };
    }
    // Active binding — refresh last_seen and reissue.
    await supabaseAdmin
      .from('license_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', anyBinding.id);

    return {
      ok: true,
      row: rowFromLicense(license, seatLimit),
      deviceId: anyBinding.id,
      isNewDevice: false,
    };
  }

  // 3. No binding for this HWID. Check whether a new seat is available.
  const { count, error: countErr } = await supabaseAdmin
    .from('license_devices')
    .select('id', { count: 'exact', head: true })
    .eq('license_id', license.id)
    .is('revoked_at', null);

  if (countErr) {
    console.error('lookupLicense: count error', countErr);
    return { ok: false, reason: 'internal_error' };
  }

  if ((count ?? 0) >= seatLimit) {
    return { ok: false, reason: 'seat_limit_exceeded' };
  }

  // 4. Bind a new device. The unique-active-binding exclusion constraint
  // protects against a race between two concurrent activators on the same
  // hwid; only one insert wins.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('license_devices')
    .insert({ license_id: license.id, hwid })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    // Most likely an exclusion-constraint conflict from a parallel activation.
    // Re-read the now-existing row.
    const { data: retry } = await supabaseAdmin
      .from('license_devices')
      .select('id')
      .eq('license_id', license.id)
      .eq('hwid', hwid)
      .is('revoked_at', null)
      .maybeSingle();
    if (retry) {
      return {
        ok: true,
        row: rowFromLicense(license, seatLimit),
        deviceId: retry.id,
        isNewDevice: false,
      };
    }
    console.error('lookupLicense: insert failed', insertErr);
    return { ok: false, reason: 'internal_error' };
  }

  return {
    ok: true,
    row: rowFromLicense(license, seatLimit),
    deviceId: inserted.id,
    isNewDevice: true,
  };
}

/**
 * Re-resolve a previously-issued device by id. Used during sync to detect
 * revocation server-side without trusting the desktop's cached JWT alone.
 */
export async function resolveDevice(deviceId: string, hwid: string): Promise<
  | { ok: true; licenseId: string }
  | { ok: false; reason: 'not_found' | 'revoked' | 'hwid_mismatch' }
> {
  const { data, error } = await supabaseAdmin
    .from('license_devices')
    .select('id, license_id, hwid, revoked_at')
    .eq('id', deviceId)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: 'not_found' };
  if (data.revoked_at) return { ok: false, reason: 'revoked' };
  if (data.hwid !== hwid) return { ok: false, reason: 'hwid_mismatch' };
  return { ok: true, licenseId: data.license_id };
}

/**
 * Soft-revoke every active binding on a license. Used by the admin "reset
 * machine id" action — outstanding JWTs become invalid on the next sync
 * because their jti now points at a revoked row.
 */
export async function revokeAllDevices(licenseId: string): Promise<{ revoked: number }> {
  const { data, error } = await supabaseAdmin
    .from('license_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('license_id', licenseId)
    .is('revoked_at', null)
    .select('id');

  if (error) {
    console.error('revokeAllDevices: supabase error', error);
    return { revoked: 0 };
  }
  return { revoked: data?.length ?? 0 };
}

export async function revokeDevice(deviceId: string): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin
    .from('license_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', deviceId)
    .is('revoked_at', null);
  return { ok: !error };
}

function rowFromLicense(license: any, seatLimit: number): LicenseRow {
  return {
    id: license.id,
    plan: license.plan || 'pro',
    features: Array.isArray(license.features) ? license.features : DEFAULT_FEATURES,
    expiresAt: license.expires_at,
    seatLimit,
  };
}
