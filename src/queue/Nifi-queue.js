// WorkerNifi.js
import Bee from 'bee-queue';
import RedisClient from '../Client/QueueClient.js';

const queue = new Bee('Fila:nifi', {
  redis: RedisClient,
  isWorker: true
});

queue.process(1, async (job) => {
  console.log(`[WORKER-NIFI] Job recebido para reprocessamento: ${JSON.stringify(job.data)}`);
  // Aqui pode ser um log ou simulação de reprocessamento
  return `Reprocessado com sucesso`;
});

queue.on('succeeded', (job, result) => {
  console.log(`[WORKER-NIFI] Job ${job.id} concluído: ${result}`);
});

queue.on('failed', (job, err) => {
  console.error(`[WORKER-NIFI] Job ${job.id} falhou: ${err.message}`);
});

console.log('[WORKER-NIFI] Aguardando jobs na Fila:nifi...');
