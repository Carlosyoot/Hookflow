import Bee from 'bee-queue';
import redis from './QueueClient.js';

const queue = new Bee('Fila:processamento', {
  redis,
  removeOnSuccess: false,
  removeOnFailure: false,
  isWorker: false,
});

export default queue;
