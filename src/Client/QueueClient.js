import IORedis from 'ioredis';

const RedisClient = new IORedis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });

export default RedisClient;
