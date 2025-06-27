import { Queue } from "bullmq";
import RedisClient from "./QueueClient.js";

export const Envio = new Queue('Envio', {
    connection: RedisClient,
    defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: true,
    },
});


export const Nifi = new Queue('Nifi', {
    connection: RedisClient,
    defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
    },
});