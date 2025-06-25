import { createClient } from 'redis';
import 'dotenv/config';

const redisCache = createClient({
    url: process.env.URL_REDIS,
        database: 1,
});
redisCache.on('error', err => console.error('[REDIS CACHE] Erro:', err));
await redisCache.connect();

export default redisCache;
