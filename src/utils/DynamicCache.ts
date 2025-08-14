import NodeCache from 'node-cache';

const DEFAULT_TTL_SECONDS = 300; // 5 min
const dynamicCache = new NodeCache({ stdTTL: DEFAULT_TTL_SECONDS, checkperiod: 60 });

export function setCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_SECONDS * 1000): void {
  const ttlInSeconds = Math.floor(ttlMs / 1000);
  dynamicCache.set<T>(key, value, ttlInSeconds);
}

export function getCache<T = unknown>(key: string): T | null {
  const v = dynamicCache.get<T>(key);
  return v === undefined ? null : v;
}

export function invalidateCache(key: string): void {
  dynamicCache.del(key);
}
