import { Redis, type RedisOptions } from 'ioredis';
import process from "node:process";

const options: RedisOptions = {
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
};

const RedisClient = new Redis(options);
export default RedisClient;
