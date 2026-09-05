/**
 * Simple in-memory, fixed-window rate limiter.
 *
 * Scope and limitations: this stores counters in process memory, so it
 * only coordinates within a single running server instance. That's fine
 * for a single Node server (e.g. `next start` on one machine), but it will
 * NOT correctly rate-limit across multiple serverless invocations or
 * horizontally-scaled replicas — each instance would track its own count.
 * For production at scale, replace the `buckets` Map below with a shared
 * store (e.g. Redis/Upstash). This is intentionally kept dependency-free
 * for the MVP per spec #11 ("rate limiting for AI endpoints"), which asked
 * for the protection to exist, not for a specific backing store.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}
