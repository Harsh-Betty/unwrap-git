import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// One shared client for caching and rate limiting. Null when Upstash is not
// configured (local development without credentials).
//
// Fails fast: a cache that takes seconds to say "no" is worse than no cache,
// so one quick retry and a short timeout instead of the client defaults.
export const redis: Redis | null =
  url && token
    ? new Redis({
        url,
        token,
        retry: { retries: 1, backoff: () => 100 },
        signal: () => AbortSignal.timeout(1500),
      })
    : null;

// Keeps development data out of the production keyspace when both point at
// the same database.
export const KEY_PREFIX =
  process.env.NODE_ENV === "production" ? "unwrap-git" : "unwrap-git:dev";
