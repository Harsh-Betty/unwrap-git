// @TODO: switch to Upstash Redis on prod

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const BUCKET_SIZE = 10; // max requests per window
const REFILL_RATE = 1; // tokens per second
const REFILL_INTERVAL = 1000; // ms

const buckets = new Map<string, RateLimitEntry>();

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

export function checkRateLimit(identifier: string): RateLimitResult {
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

  // time until next token
  const resetIn = Math.ceil(
    (REFILL_INTERVAL - (Date.now() - entry.lastRefill)) / 1000
  );

  return {
    allowed: false,
    remaining: 0,
    resetIn: Math.max(1, resetIn),
  };
}

// clean up every 10 minutes
if (typeof setInterval !== "undefined") {
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
