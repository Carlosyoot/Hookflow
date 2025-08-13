import { Queue, type JobsOptions } from 'bullmq';
import RedisClient from './QueueClient.ts';

const defaultJobOptions: JobsOptions = {
  removeOnComplete: false,
  removeOnFail: false
};

export const Envio = new Queue<unknown, unknown, string>('Envio', {
  connection: RedisClient,
  defaultJobOptions
});

export const Nifi = new Queue<unknown, unknown, string>('Nifi', {
  connection: RedisClient,
  defaultJobOptions
});
