import { Worker, type Job } from 'bullmq';
import RedisClient from '../Client/QueueClient.ts';
import { Envio, Nifi } from '../Client/BullClient.ts';
import { request } from 'undici';
import 'dotenv/config';
import logger from '../../Logger/Logger.js';

type JobName = 'Envio/Principal' | 'Limpeza';

interface EnvioPrincipalData {
  evento: string;
  data: unknown;
  client: string;
}

type JobResult = string;

async function QueueProcess(
  job: Job<EnvioPrincipalData, JobResult, 'Envio/Principal'>
): Promise<JobResult> {
  const { evento, data, client } = job.data;

  const payload = {
    QueueJob: String(job.id),
    evento,
    client,
    data
  };

  try {
    const { statusCode } = await request('http://localhost:7878/nifi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });

    if (statusCode < 200 || statusCode > 300) {
      throw new Error(`Falha no envio: status HTTP ${statusCode}`);
    }

    await Nifi.add(
      'Sucesso/Externo(NIFI)',
      { QueueJob: String(job.id), evento, client, data, status: 'ok' as const },
      { jobId: String(job.id), removeOnComplete: false }
    );

    return `Evento ${evento} enviado com sucesso para endpoint externo`;
  } catch (error: any) {
    const mensagemErro =
      error?.message || error?.cause?.message || JSON.stringify(error);
    logger.error(`[WORKER/ENVIO] Falha ao enviar evento: ${mensagemErro}`);
    throw new Error(mensagemErro);
  }
}

async function Clear(): Promise<JobResult> {
  const limite = 14 * 24 * 60 * 60 * 1000; // 14 dias
  const estados = ['completed', 'failed', 'active'] as const;

  for (const status of estados) {
    await Envio.clean(limite, 1000, status as any);
  }
  return `Eventos com mais de 14 dias limpos`;
}

const worker = new Worker<EnvioPrincipalData | Record<string, never>, JobResult, JobName>(
  'Envio',
  async (job) => {
    switch (job.name) {
      case 'Envio/Principal':
        return QueueProcess(job as Job<EnvioPrincipalData, JobResult, 'Envio/Principal'>);
      case 'Limpeza':
        return Clear();
      default:
        throw new Error(`Job desconhecido: ${String(job.name)}`);
    }
  },
  {
    concurrency: 50,
    connection: RedisClient,
    settings: {
    backoffStrategy: (attemptsMade) => {
    return Math.pow(2, attemptsMade) * 1000; 
  }
}
  }
);

worker.on('failed', (job, err) => {
  logger.error(`[WORKER/ENVIO] Evento ${job?.id} falhou - Erro: ${err?.message}`);
});

worker.on('ready', () => {
  logger.trace(`[WORKER/ENVIO] Worker de envio iniciado`);
});

export default worker;
