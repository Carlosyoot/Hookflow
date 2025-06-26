import IORedis from 'ioredis';
import 'dotenv/config';

const RedisClient = new IORedis(process.env.URL_REDIS);

export default RedisClient;
