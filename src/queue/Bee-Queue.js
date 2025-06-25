import Bee from 'bee-queue';
import redis from '../Client/QueueClient.js';
import 'dotenv/config';

const queue = new Bee('Fila:processamento', { redis, isWorker: true });
const filaErro = new Bee('Fila:erro', { redis });


async function QueueProcess(job) {
  try {
    const { id } = job.data;
    if (!id) throw new Error('ID ausente');
    if (id === 999) throw new Error('Erro forçado');

    await redis.xadd('estresse', '*', 'id', id.toString());
    return `ID ${id} adicionado à sucesso.`;
  } catch (err) {
    console.error(`[WORKER] Erro job ${job.id}: ${err.message}`);
    throw err;
  }
}

async function iniciarWorker() {
  queue.process(50, QueueProcess);

  queue.on('ready', () => {
    console.log(`[WORKER ${process.pid}] Worker pronto para processar jobs.`);
  });

  queue.on('succeeded', (job, result) => {
    console.log(`[WORKER ${process.pid}] Job ${job.id} concluído. Resultado: ${result}`);
  });

  queue.on('retrying', (job, err) => {
    console.warn(`[WORKER ${process.pid}] Job ${job.id} falhou. Tentando novamente... Erro: ${err.message}`);
  });

  queue.on('failed', async (job, err) => {
    console.error(`[WORKER] Job ${job.id} falhou permanentemente. Erro: ${err.message}`);

    try {
        await filaErro.createJob({
        ...job.data,             
        Error: err.message     
    }).save();

    console.log(`[WORKER] Job ${job.id} movido para Fila:erro`);
  } catch (movErr) {
    console.error(`[WORKER] Falha ao mover para Fila:erro: ${movErr.message}`);
  }
});
}

iniciarWorker();
