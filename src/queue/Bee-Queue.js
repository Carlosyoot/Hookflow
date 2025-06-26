import Bee from 'bee-queue';
import { FilaErro } from '../Client/BeeClient.js';
import RedisClient from '../Client/QueueClient.js';
import { request } from 'undici';
import 'dotenv/config';

const queue = new Bee('Fila:processamento', { 
  redis: RedisClient, 
  isWorker: true 
});


async function QueueProcess(job) {
  
  const { evento, data, client } = job.data;

  try {
        const { statusCode } = await request("http://localhost:7878/nifi",{
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(job.data),
          signal: AbortSignal.timeout(5000)
        });

        if( statusCode < 200 || statusCode >= 300) {
          throw new Error(`Falha no envio: status HTTP ${statusCode}`)
        }

        return `Evento  ${evento} enviado com sucesso para endpoint externo`
  } catch (error) {
    
        console.error(`[WORKER] Falha ao enviar evento para o endpoint externo: ${error.message}`);
        throw error;

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
        await FilaErro.createJob({
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
