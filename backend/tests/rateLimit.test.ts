import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, ipFromRequest } from '@/lib/rateLimit'

// Each test uses a unique key so the module-level bucket map doesn't leak
// state between cases. We don't reset the map directly because that's an
// implementation detail; uniqueness gives the same isolation for free.
let counter = 0
const k = () => `test-${counter++}-${Math.random()}`

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to capacity in a burst', () => {
    const key = k()
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 1).ok).toBe(true)
    }
    expect(rateLimit(key, 5, 1).ok).toBe(false)
  })

  it('refills at refillPerSec', () => {
    const key = k()
    // Burn capacity.
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 1)
    expect(rateLimit(key, 3, 1).ok).toBe(false)

    vi.advanceTimersByTime(1000) // 1 token at refillPerSec=1
    expect(rateLimit(key, 3, 1).ok).toBe(true)
    expect(rateLimit(key, 3, 1).ok).toBe(false)
  })

  it('does not refill above capacity', () => {
    const key = k()
    rateLimit(key, 2, 10) // consume 1
    vi.advanceTimersByTime(10_000) // 100s worth of refill
    // Capacity is 2, so we can take exactly 2 more, then hit the limit.
    expect(rateLimit(key, 2, 10).ok).toBe(true)
    expect(rateLimit(key, 2, 10).ok).toBe(true)
    expect(rateLimit(key, 2, 10).ok).toBe(false)
  })

  it('reports retryAfterMs when rejected', () => {
    const key = k()
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 1)
    const denied = rateLimit(key, 5, 1)
    expect(denied.ok).toBe(false)
    expect(denied.retryAfterMs).toBeGreaterThan(0)
    expect(denied.retryAfterMs).toBeLessThanOrEqual(1000)
  })
})

describe('ipFromRequest', () => {
  it('uses the first hop in x-forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(ipFromRequest(req)).toBe('1.2.3.4')
  })
  it('falls back to x-real-ip', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '9.9.9.9' },
    })
    expect(ipFromRequest(req)).toBe('9.9.9.9')
  })
  it('returns "unknown" when no header is present', () => {
    const req = new Request('https://example.com')
    expect(ipFromRequest(req)).toBe('unknown')
  })
})
