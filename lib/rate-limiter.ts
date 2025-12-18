import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const BUCKET_SIZE = 10; // max requests per window
const REFILL_RATE = 1; // tokens per second
const REFILL_INTERVAL = 1000; // ms

// in-memory storage for development
const buckets = new Map<string, RateLimitEntry>();

// redis for prod
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

const isProduction = process.env.NODE_ENV === "production";

if (
  isProduction &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
    analytics: true,
    prefix: "unwrap-git:ratelimit",
  });
}

function refillBucket(entry: RateLimitEntry): RateLimitEntry {
  const now = Date.now();
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL) * REFILL_RATE;

  return {
    tokens: Math.min(BUCKET_SIZE, entry.tokens + tokensToAdd),
    lastRefill: now,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until a token is available
}

function checkMemoryRateLimit(identifier: string): RateLimitResult {
  let entry = buckets.get(identifier);

  if (!entry) {
    entry = { tokens: BUCKET_SIZE, lastRefill: Date.now() };
  } else {
    entry = refillBucket(entry);
  }

  if (entry.tokens > 0) {
    entry.tokens--;
    buckets.set(identifier, entry);
    return {
      allowed: true,
      remaining: entry.tokens,
      resetIn: 0,
    };
  }

  buckets.set(identifier, entry);

  const resetIn = Math.ceil(
    (REFILL_INTERVAL - (Date.now() - entry.lastRefill)) / 1000
  );

  return {
    allowed: false,
    remaining: 0,
    resetIn: Math.max(1, resetIn),
  };
}

async function checkRedisRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!ratelimit) {
    console.warn("Ratelimit not initialized, falling back to memory");
    return checkMemoryRateLimit(identifier);
  }

  const result = await ratelimit.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetIn: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (isProduction && ratelimit) {
    return checkRedisRateLimit(identifier);
  }
  return checkMemoryRateLimit(identifier);
}

export function checkRateLimitSync(identifier: string): RateLimitResult {
  return checkMemoryRateLimit(identifier);
}

if (typeof setInterval !== "undefined" && !isProduction) {
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [key, entry] of buckets.entries()) {
      if (now - entry.lastRefill > staleThreshold) {
        buckets.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}
