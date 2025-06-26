import NodeCache from 'node-cache';

const DEFAULT_TTL_SECONDS = 300; 
const dynamicCache = new NodeCache({ stdTTL: DEFAULT_TTL_SECONDS, checkperiod: 60 });

export function setCache(key, value, ttl = DEFAULT_TTL_SECONDS * 1000) {
    const ttlInSeconds = ttl / 1000;
    dynamicCache.set(key, value, ttlInSeconds);
}

export function getCache(key) {
    return dynamicCache.get(key) ?? null;
}

export function invalidateCache(key) {
    dynamicCache.del(key);
}
