import RedisClient from "./src/Client/QueueClient.js";

const info = await RedisClient.info('memory');
console.log(info);