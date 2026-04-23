import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

// -----------------------------------------------------------------
// Per-account send-rate governor.
//
// WhatsApp bans aggressive senders. We enforce:
//
//   1. A per-minute cap (token bucket).
//   2. A per-day cap that grows on a warm-up curve — new accounts
//      start at 20/day and climb to 400/day over 14 days.
//   3. Randomised humanised jitter (log-normal distribution) so
//      consecutive sends don't fire on a robotic beat.
//
// State is persisted inside userData so it survives restarts — a
// naive in-memory limit would reset when the user reboots.
// -----------------------------------------------------------------

type DailyRecord = {
  dateIso: string  // yyyy-mm-dd
  sent: number
}

type Persisted = {
  accountId: string
  firstSeenAt: number   // ms
  minuteTokens: number
  minuteRefillAt: number
  daily: DailyRecord
}

const DEFAULT_ACCOUNT = 'default'
const MAX_PER_MINUTE = 15         // token-bucket capacity
const REFILL_PER_MIN = 10         // tokens refilled per minute
const WARMUP_DAYS = 14
const DAY_0_CAP = 20
const DAY_WARM_CAP = 400

function today(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Log-normal sample — produces a humanised delay distribution where most
 * delays cluster around `medianMs` but with a long right tail.
 */
function humanisedDelayMs(medianMs: number): number {
  const mu = Math.log(medianMs)
  const sigma = 0.35
  const u1 = Math.max(1e-9, Math.random())
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(250, Math.round(Math.exp(mu + sigma * z)))
}

function statePath(accountId: string) {
  return join(app.getPath('userData'), 'ratelimits', `${accountId}.json`)
}

async function load(accountId: string): Promise<Persisted> {
  try {
    const raw = await readFile(statePath(accountId), 'utf-8')
    const parsed = JSON.parse(raw) as Persisted
    if (parsed.accountId === accountId && parsed.daily && typeof parsed.firstSeenAt === 'number') {
      return parsed
    }
  } catch { /* ignore */ }
  return {
    accountId,
    firstSeenAt: Date.now(),
    minuteTokens: MAX_PER_MINUTE,
    minuteRefillAt: Date.now(),
    daily: { dateIso: today(), sent: 0 },
  }
}

async function save(rec: Persisted) {
  const p = statePath(rec.accountId)
  await mkdir(join(app.getPath('userData'), 'ratelimits'), { recursive: true })
  await writeFile(p, JSON.stringify(rec), 'utf-8')
}

function dailyCap(firstSeenAt: number): number {
  const days = Math.floor((Date.now() - firstSeenAt) / (24 * 60 * 60 * 1000))
  if (days >= WARMUP_DAYS) return DAY_WARM_CAP
  const t = days / WARMUP_DAYS
  return Math.round(DAY_0_CAP + (DAY_WARM_CAP - DAY_0_CAP) * t)
}

export type GovernorDecision =
  | { allow: true; waitMs: number; remainingToday: number }
  | { allow: false; reason: 'minute_exhausted' | 'daily_cap'; retryAfterMs: number }

export class SendGovernor {
  private cache = new Map<string, Persisted>()

  async request(accountId: string = DEFAULT_ACCOUNT): Promise<GovernorDecision> {
    const rec = this.cache.get(accountId) ?? await load(accountId)

    // Reset daily counter at UTC day boundary.
    const t = today()
    if (rec.daily.dateIso !== t) rec.daily = { dateIso: t, sent: 0 }

    // Refill minute tokens.
    const now = Date.now()
    const minutesElapsed = (now - rec.minuteRefillAt) / 60_000
    rec.minuteTokens = Math.min(MAX_PER_MINUTE, rec.minuteTokens + minutesElapsed * REFILL_PER_MIN)
    rec.minuteRefillAt = now

    const cap = dailyCap(rec.firstSeenAt)
    if (rec.daily.sent >= cap) {
      this.cache.set(accountId, rec)
      // Retry tomorrow.
      const tomorrow = new Date()
      tomorrow.setUTCHours(24, 0, 0, 0)
      return { allow: false, reason: 'daily_cap', retryAfterMs: tomorrow.getTime() - now }
    }

    if (rec.minuteTokens < 1) {
      this.cache.set(accountId, rec)
      const retryAfterMs = Math.ceil(((1 - rec.minuteTokens) / REFILL_PER_MIN) * 60_000)
      return { allow: false, reason: 'minute_exhausted', retryAfterMs }
    }

    // Consume a token. Persist best-effort.
    rec.minuteTokens -= 1
    rec.daily.sent += 1
    this.cache.set(accountId, rec)
    save(rec).catch(() => { /* best-effort */ })

    return {
      allow: true,
      waitMs: humanisedDelayMs(2_000),   // minimum humanised delay
      remainingToday: cap - rec.daily.sent,
    }
  }
}
