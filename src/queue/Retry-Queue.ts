import { Worker, type Job } from 'bullmq';
import RedisClient from '../Client/QueueClient.ts';
import { Nifi } from '../Client/BullClient.ts';
import logger from '../../Logger/Logger.js';

type JobName = 'Limpeza' | 'Sucesso/Externo(NIFI)' | 'Erro/Externo(NIFI)';

interface NifiJobData {
  evento?: string;
  client?: string;
  status?: 'ok' | string;   
  error?: unknown;
  motivo?: string;
}

type JobResult = string;

async function Clear(): Promise<JobResult> {
  const limite = 14 * 24 * 60 * 60 * 1000; 
  const estados = ['completed', 'failed', 'active'] as const;

  for (const status of estados) {
    await Nifi.clean(limite, 1000, status as any);
  }
  return 'Limpeza concluída';
}

async function RetryQueues(
  job: Job<NifiJobData, JobResult, 'Sucesso/Externo(NIFI)'>
): Promise<JobResult> {
  const { status } = job.data;

  if (status === 'ok') {
    return 'Processado com sucesso';
  }

  throw new Error(`Job ${job.id} inválido ou malformado: sem status ou error.`);
}

const worker = new Worker<NifiJobData | Record<string, never>, JobResult, JobName>(
  'Nifi',
  // deno-lint-ignore require-await
  async (job) => {
    switch (job.name) {
      case 'Limpeza':
        return Clear();

      case 'Sucesso/Externo(NIFI)':
        return RetryQueues(job as Job<NifiJobData, JobResult, 'Sucesso/Externo(NIFI)'>);

      case 'Erro/Externo(NIFI)':
        throw new Error(`[NIFI] Job encerrado como falha para fins de auditoria.`);

      default:
        logger.info?.('NOME DO JOB', job.name);
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
  logger.error(`[WORKER/RETRY] Evento ${job?.id} falhou - Erro: ${err?.message}`);
});

worker.on('ready', () => {
  logger.trace(`[WORKER/RETRY] Worker de reprocessamento iniciado`);
});

export default worker;
