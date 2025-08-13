import { Redis, type RedisOptions } from 'ioredis';

const options: RedisOptions = {
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
};

const RedisClient = new Redis(options);
export default RedisClient;
