import Bee from 'bee-queue';
import RedisClient from './QueueClient.js';

export const FilaProcessamento = new Bee('Fila:processamento', {
  RedisClient,
  removeOnSuccess: false,
  removeOnFailure: false,
  isWorker: false,
});

export const FilaErro = new Bee('Fila:erro', {
  RedisClient,
  removeOnSuccess: false,
  removeOnFailure: false,
  isWorker: false,
});
