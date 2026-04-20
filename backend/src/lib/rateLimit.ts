// In-memory token-bucket rate limiter. Good enough for a single-instance
// deployment or development. For multi-instance production, swap the storage
// for Upstash Redis (@upstash/ratelimit) — the interface stays the same.

type Bucket = { tokens: number; lastRefill: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, capacity: number, refillPerSec: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, lastRefill: now };
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  b.lastRefill = now;

  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return { ok: true, retryAfterMs: 0 };
  }
  buckets.set(key, b);
  const retryAfterMs = Math.ceil(((1 - b.tokens) / refillPerSec) * 1000);
  return { ok: false, retryAfterMs };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
