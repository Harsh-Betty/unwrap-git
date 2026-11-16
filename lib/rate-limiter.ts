import { Ratelimit } from "@upstash/ratelimit";
import { KEY_PREFIX, markRedisDown, redis, redisAvailable } from "./redis";

const MAX_REQUESTS = 10;
const WINDOW_SECONDS = 60;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until another request is allowed
}

const isProduction = process.env.NODE_ENV === "production";

// Redis-backed in production. `ephemeralCache` remembers blocked identifiers
// in memory so a client that is already over the limit costs no Redis calls,
// and analytics stays off because it doubles the commands per check.
const ratelimit =
  isProduction && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SECONDS} s`),
        analytics: false,
        // If Redis does not answer within a second, let the request through.
        timeout: 1000,
        ephemeralCache: new Map(),
        prefix: `${KEY_PREFIX}:ratelimit`,
      })
    : null;

// Fixed-window counter for development and for when Redis is unavailable.
const windows = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(identifier);
  const current =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  windows.set(identifier, { ...current, count: current.count + 1 });
  if (windows.size > 5000) {
    for (const [key, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(key);
    }
  }
  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count - 1,
    resetIn: 0,
  };
}

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!ratelimit || !redisAvailable()) return checkMemoryRateLimit(identifier);

  try {
    const result = await ratelimit.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetIn: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    markRedisDown("Rate limit check", error);
    return checkMemoryRateLimit(identifier);
  }
}
