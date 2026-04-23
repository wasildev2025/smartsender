// -----------------------------------------------------------------
// Storage adapter for license lookups.
//
// This file is the integration seam for Supabase. For now it returns a
// deterministic dev-mode response so the endpoint is usable without the
// database, but throws in production if SUPABASE_URL is not set.
//
// When Supabase is wired up, replace the body of `lookupLicense` with:
//   const { data } = await supabaseAdmin
//     .from('licenses')
//     .select('id, plan, features, status, expires_at, seat_limit')
//     .eq('key', key)
//     .single();
//   and check the `devices` table to enforce hwid binding.
// -----------------------------------------------------------------

import { supabaseAdmin } from './supabase';

export type LicenseRow = {
  id: string;
  plan: string;
  features: string[];
  expiresAt: string | null;
  seatLimit: number;
  boundHwids: string[];
};

export type LookupResult =
  | { ok: true; row: LicenseRow }
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' | 'seat_limit_exceeded' };

export async function lookupLicense(key: string, hwid: string): Promise<LookupResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // 1. Fetch the license from Supabase
  const { data: license, error } = await supabaseAdmin
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !license) {
    return { ok: false, reason: 'not_found' };
  }

  // 2. Check Status
  if (license.status !== 'active') {
    return { ok: false, reason: 'revoked' };
  }

  // 3. Check Expiration
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }

  // 4. Handle HWID Binding
  // If machine_id is null, this is the first activation.
  if (!license.machine_id) {
    const { error: updateError } = await supabaseAdmin
      .from('licenses')
      .update({ machine_id: hwid })
      .eq('id', license.id);

    if (updateError) {
      console.error('Failed to bind HWID:', updateError);
      return { ok: false, reason: 'revoked' }; // Fallback
    }
  } 
  // If machine_id is set, it MUST match the current hwid.
  else if (license.machine_id !== hwid) {
    return { ok: false, reason: 'revoked' }; // Or 'hwid_mismatch' if we wanted
  }

  // 5. Success
  return {
    ok: true,
    row: {
      id: license.id,
      plan: license.plan || 'pro',
      features: license.features || ['wa_send', 'wa_group_add', 'wa_extract', 'wa_validate', 'wa_auto_responder'],
      expiresAt: license.expires_at,
      seatLimit: license.seat_limit || 1,
      boundHwids: [license.machine_id || hwid],
    },
  };
}
