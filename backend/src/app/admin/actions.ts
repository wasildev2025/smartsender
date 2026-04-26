'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revokeAllDevices, revokeDevice } from '@/lib/licenseStore'
import { rateLimit } from '@/lib/rateLimit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// -----------------------------------------------------------------
// EVERY mutating action below MUST call assertAdmin() first.
//
// Server Actions in Next.js can be invoked by anyone who knows the action id,
// even if the page that exposed them is gated by middleware. Relying on the
// middleware redirect alone is not enough. assertAdmin() does an authoritative
// session lookup against Supabase Auth on every call.
// -----------------------------------------------------------------

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('forbidden')
  return user
}

async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? 'unknown'
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) {
    redirect('/admin/login?error=' + encodeURIComponent('Email and password are required'))
  }

  // Two-tier rate limit:
  //   * per-IP: 10 attempts per 5 minutes — slows distributed brute-force
  //   * per-email: 5 attempts per 5 minutes — slows targeted credential
  //     stuffing even when the attacker rotates IPs
  // In-memory map: each warm Next.js instance enforces independently. For
  // multi-instance production swap rateLimit storage for Vercel KV / Upstash.
  const ip = await getClientIp()
  const ipLimit = rateLimit(`admin-login-ip:${ip}`, 10, 10 / (5 * 60))
  const emailLimit = rateLimit(`admin-login-email:${email}`, 5, 5 / (5 * 60))
  if (!ipLimit.ok || !emailLimit.ok) {
    redirect('/admin/login?error=' + encodeURIComponent('Too many attempts. Try again in a few minutes.'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Generic message — never reveal whether the email exists.
    redirect('/admin/login?error=' + encodeURIComponent('Invalid email or password.'))
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function createLicense(formData: FormData) {
  await assertAdmin()
  const supabase = await createAdminClient()

  // Custom key or generate one. Strip whitespace and validate against the
  // same regex the verify endpoint accepts so we can't create un-verifiable keys.
  let key = String(formData.get('key') ?? '').trim()
  if (!key) {
    const randomChars = () => Math.random().toString(36).substring(2, 6).toUpperCase()
    key = `VIP-${randomChars()}-${randomChars()}`
  }
  if (!/^[A-Za-z0-9_\-]{8,128}$/.test(key)) {
    throw new Error('invalid_key_format')
  }

  const daysString = String(formData.get('days') ?? '')
  const daysParsed = parseInt(daysString, 10)
  const days = Number.isFinite(daysParsed) && daysParsed > 0 && daysParsed <= 3650 ? daysParsed : 365

  const seatLimitRaw = parseInt(String(formData.get('seat_limit') ?? '1'), 10)
  const seatLimit = Number.isFinite(seatLimitRaw) && seatLimitRaw >= 1 && seatLimitRaw <= 100 ? seatLimitRaw : 1

  const expires_at = new Date()
  expires_at.setUTCDate(expires_at.getUTCDate() + days)

  const { error } = await supabase
    .from('licenses')
    .insert([
      {
        key,
        status: 'active',
        expires_at: expires_at.toISOString(),
        seat_limit: seatLimit,
      },
    ])

  if (error) {
    console.error('Error creating license:', error)
    throw new Error('create_failed')
  }

  revalidatePath('/admin')
}

export async function updateLicenseStatus(id: string, status: string) {
  await assertAdmin()
  if (!['active', 'revoked', 'expired'].includes(status)) {
    throw new Error('invalid_status')
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('licenses')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error(`Error updating license ${id} to ${status}:`, error.message)
    throw new Error('update_failed')
  }

  // Revoking the license also revokes all currently-bound devices so the
  // tokens sitting in those desktops invalidate on next sync.
  if (status === 'revoked') {
    await revokeAllDevices(id)
  }

  revalidatePath('/admin')
}

export async function deleteLicense(id: string) {
  await assertAdmin()
  const supabase = await createAdminClient()

  // Devices cascade via FK on delete.
  const { error } = await supabase
    .from('licenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting license:', error)
    throw new Error('delete_failed')
  }

  revalidatePath('/admin')
}

/**
 * Soft-revoke every active device on this license. The desktop's persisted
 * JWT survives until exp (≤24h) but the very next sync hits resolveDevice()
 * and gets rejected, so the entitlement is wiped client-side too.
 */
export async function resetMachineIdAction(id: string) {
  await assertAdmin()
  await revokeAllDevices(id)

  // Clear the legacy machine_id column so the admin UI doesn't display a stale
  // bound device. The column itself is dropped in a follow-up migration once
  // every running build is on the new device-binding code path.
  const supabase = await createAdminClient()
  await supabase.from('licenses').update({ machine_id: null }).eq('id', id)

  revalidatePath('/admin')
}

export async function revokeDeviceAction(deviceId: string) {
  await assertAdmin()
  await revokeDevice(deviceId)
  revalidatePath('/admin')
}
