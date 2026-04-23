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
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' };

export async function lookupLicense(key: string, hwid: string): Promise<LookupResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.NODE_ENV === 'production' && !supabaseUrl) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not configured');
  }

  // -- Development stub --
  // Any key of shape SS-<8+ alnum>-<4+ alnum> is treated as a 30-day Pro license.
  // Replace with real Supabase call before production.
  if (!/^SS-[A-Z0-9]{8,}-[A-Z0-9]{4,}$/i.test(key)) {
    return { ok: false, reason: 'not_found' };
  }

  void hwid; // Real impl binds hwid on first activation and checks seatLimit.

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    ok: true,
    row: {
      id: `dev-${key.slice(-4)}`,
      plan: 'pro',
      features: ['wa_send', 'wa_group_add', 'wa_extract', 'wa_validate', 'wa_auto_responder'],
      expiresAt,
      seatLimit: 1,
      boundHwids: [hwid],
    },
  };
}
