import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// SendGovernor reads/writes a JSON file under app.getPath('userData'). Each
// test gets a fresh tmp dir as that path so persistence behavior is exercised
// without leaking state between tests.
let tmpDir: string

vi.mock('electron', () => ({
  app: { getPath: () => tmpDir },
}))

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ss-rl-'))
})
afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
  vi.resetModules()
  vi.useRealTimers()
})

describe('SendGovernor', () => {
  it('allows the first send and consumes a minute token', async () => {
    const { SendGovernor } = await import('../rateLimiter')
    const g = new SendGovernor()
    const decision = await g.request('acct-a')
    expect(decision.allow).toBe(true)
    if (decision.allow) {
      expect(decision.waitMs).toBeGreaterThanOrEqual(250)
      expect(decision.remainingToday).toBeGreaterThan(0)
    }
  })

  it('exhausts the per-minute bucket after capacity hits', async () => {
    const { SendGovernor } = await import('../rateLimiter')
    const g = new SendGovernor()
    // Capacity is 15. Burn through it and expect the next request to block.
    for (let i = 0; i < 15; i++) {
      const d = await g.request('acct-b')
      expect(d.allow).toBe(true)
    }
    const denied = await g.request('acct-b')
    expect(denied.allow).toBe(false)
    if (!denied.allow) {
      expect(denied.reason).toBe('minute_exhausted')
      expect(denied.retryAfterMs).toBeGreaterThan(0)
    }
  })

  it('enforces the day-0 cap (~20/day) for a brand-new account', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    const { SendGovernor } = await import('../rateLimiter')
    const g = new SendGovernor()

    let allowed = 0
    let dailyCap = false
    // Try far more than 20; we expect to be capped out by the daily limit.
    for (let i = 0; i < 50; i++) {
      // Refill minute tokens so we test the daily cap, not the minute cap.
      vi.advanceTimersByTime(60_000)
      const d = await g.request('acct-day0')
      if (d.allow) allowed += 1
      else if (!d.allow && d.reason === 'daily_cap') { dailyCap = true; break }
    }
    expect(dailyCap).toBe(true)
    expect(allowed).toBeGreaterThanOrEqual(15)
    expect(allowed).toBeLessThanOrEqual(25)
  })

  it('resets the daily counter when the UTC day rolls over', async () => {
    vi.useFakeTimers()
    // Start mid-day so the burn loop can advance time without crossing UTC
    // midnight on its own — we want the rollover to happen as a single
    // explicit setSystemTime jump.
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    const { SendGovernor } = await import('../rateLimiter')
    const g = new SendGovernor()

    // Burn through the day-0 cap (~20). 25 iterations is plenty; each
    // advance of 60s refills the minute bucket but stays well within the day.
    let lastReason: string | undefined
    for (let i = 0; i < 25; i++) {
      vi.advanceTimersByTime(60_000)
      const d = await g.request('acct-rollover')
      if (!d.allow) lastReason = d.reason
    }
    expect(lastReason).toBe('daily_cap')

    // Now explicitly cross UTC midnight and confirm the next request is allowed.
    vi.setSystemTime(new Date('2025-06-16T00:01:00Z'))
    const post = await g.request('acct-rollover')
    expect(post.allow).toBe(true)
  })
})
