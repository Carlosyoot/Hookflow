import type { Request, Response, NextFunction } from 'express';
import { Envio, Nifi } from '../Client/BullClient.js';
import RedisClient from '../Client/QueueClient.js';
import logger from '../../Logger/Logger.js';

export async function AddEvent(req: Request, res: Response, _next: NextFunction) {
  const requiredFields = ['evento', 'data'] as const;

  const missing = requiredFields.filter((field) => {
    const val = (req.body as any)?.[field];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });

  if (missing.length > 0) {
    return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
  }

  const { evento, data } = req.body as { evento: string; data: unknown };
  const client = (req as any).client as string | undefined; 

  try {
    const CountID = await RedisClient.incr('evento_contador');
    const id = `ID-${CountID}`;

    await Envio.add(
      'Envio/Principal',
      { evento, client, data },
      {
        jobId: id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );

    logger.info?.(`[WEBHOOK] Novo evento recebido de ${client}`);
    return res.sendStatus(202);
  } catch (err) {
    logger.fatal?.('[WEBHOOK] Falha ao enfileirar evento:', err);
    return res.status(500).json({ erro: 'Erro ao enfileirar evento.' });
  }
}

export async function FailedEvent(req: Request, res: Response) {
  const queueIdRaw = req.params.Queue as string | undefined;

  if (!queueIdRaw || !queueIdRaw.startsWith('ID-')) {
    return res
      .status(400)
      .json({ error: 'Job ID inválido. Esperado formato "ID-<número>".' });
  }

  const queueId = String(queueIdRaw);

  try {
    const job = await Envio.getJob(queueId);
    if (!job) {
      return res.status(404).json({ error: `Job com ID ${queueId} não encontrado.` });
    }

    const { evento, client, data } = job.data as {
      evento: string;
      client?: string;
      data: unknown;
    };
    const { error, nifierror } = req.body as { error?: unknown; nifierror?: unknown };
    const succeededJob = await Nifi.getJob(queueId);
    if (succeededJob) {
      await succeededJob.remove();
    }

    const retryJob = await Nifi.add(
      'Erro/Externo(NIFI)',
      { evento, client, data, error, nifierror },
      {
        jobId: queueId,
        attempts: 1,
        backoff: { type: 'exponential', delay: 4000 }
      }
    );

    logger.warn?.(`[WEBHOOK] ${queueId} / ${client}  - falhou no endpoint externo`);
    return res.status(202).json({
      mensagem: 'Evento reencaminhado com sucesso',
      jobOriginal: queueId,
      jobRetry: retryJob.id
    });
  } catch (error) {
    logger.error?.('[WEBHOOK] Erro ao tentar reencaminhar evento:', error);
    return res.status(500).json({ erro: 'Erro interno ao tentar reprocessar evento.' });
  }
}
