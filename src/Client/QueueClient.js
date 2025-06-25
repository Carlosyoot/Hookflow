import IORedis from 'ioredis';
import 'dotenv/config';

const redis = new IORedis(process.env.URL_REDIS);
export default redis;
