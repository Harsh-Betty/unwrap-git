import { KEY_PREFIX, redis } from "./redis";

// In-process fallback used when Redis is not configured or a call fails.
// Bounded so a long-lived dev server cannot grow without limit.
const memory = new Map<string, { value: unknown; expiresAt: number }>();
const MEMORY_LIMIT = 200;

function memoryGet<T>(key: string): T | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value as T;
}

function memorySet(key: string, value: unknown, ttlSeconds: number): void {
  if (memory.size >= MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// Circuit breaker: after a Redis failure, skip it for a minute and serve from
// memory, so an outage costs one slow request instead of every request.
const RETRY_AFTER_MS = 60_000;
let redisDownUntil = 0;

function redisAvailable(): boolean {
  return redis !== null && Date.now() >= redisDownUntil;
}

function markRedisDown(action: string, error: unknown): void {
  redisDownUntil = Date.now() + RETRY_AFTER_MS;
  console.error(
    `Cache ${action} failed, using memory for ${RETRY_AFTER_MS / 1000}s:`,
    error instanceof Error ? error.message : error
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const fullKey = `${KEY_PREFIX}:${key}`;
  if (!redis || !redisAvailable()) return memoryGet<T>(fullKey);
  try {
    return await redis.get<T>(fullKey);
  } catch (error) {
    markRedisDown("read", error);
    return memoryGet<T>(fullKey);
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const fullKey = `${KEY_PREFIX}:${key}`;
  if (!redis || !redisAvailable()) {
    memorySet(fullKey, value, ttlSeconds);
    return;
  }
  try {
    await redis.set(fullKey, value, { ex: ttlSeconds });
  } catch (error) {
    markRedisDown("write", error);
    memorySet(fullKey, value, ttlSeconds);
  }
}
