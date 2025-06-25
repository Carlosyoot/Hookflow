import Bee from 'bee-queue';
import redisQueue from './QueueClient.js';

const queue = new Bee('Fila:processamento', {
    redis: redisQueue,
    isWorker: false,
});

export default queue;
