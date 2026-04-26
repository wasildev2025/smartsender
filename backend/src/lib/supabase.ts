import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase clients are lazy-initialised so that:
//   * `next build` and CI builds without env vars don't crash at import time
//     (the previous eager non-null assertions threw before any code ran).
//   * Tests can vi.mock this module without instantiating a real client.
//
// Both exported `supabase` and `supabaseAdmin` are Proxy objects that defer
// client construction until first access, then memoise. From the caller's
// perspective they look exactly like a SupabaseClient.

let anonClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

function getAnonClient(): SupabaseClient {
  if (anonClient) return anonClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set')
  }
  anonClient = createClient(url, key)
  return anonClient
}

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  }
  adminClient = createClient(url, key)
  return adminClient
}

function lazyClient(getter: () => SupabaseClient): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const real = getter() as unknown as Record<PropertyKey, unknown>
      const value = real[prop]
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(real) : value
    },
  })
}

export const supabase: SupabaseClient = lazyClient(getAnonClient)
export const supabaseAdmin: SupabaseClient = lazyClient(getAdminClient)
