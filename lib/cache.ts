import { KEY_PREFIX, markRedisDown, redis, redisAvailable } from "./redis";

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

export async function cacheGet<T>(key: string): Promise<T | null> {
  const fullKey = `${KEY_PREFIX}:${key}`;
  if (!redis || !redisAvailable()) return memoryGet<T>(fullKey);
  try {
    return await redis.get<T>(fullKey);
  } catch (error) {
    markRedisDown("Cache read", error);
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
    markRedisDown("Cache write", error);
    memorySet(fullKey, value, ttlSeconds);
  }
}
