const cache = {};
const DEFAULT_TTL = 5 * 60 * 1000; 

export function setCache(key, value, ttl = DEFAULT_TTL) {
    cache[key] = {
        value,
        expires: Date.now() + ttl
    };
}

export function getCache(key) {
    const entry = cache[key];
        if (!entry || Date.now() > entry.expires) {
            delete cache[key];
        return null;
    }
    
    return entry.value;
}

export function invalidateCache(key) {
    delete cache[key];
}
