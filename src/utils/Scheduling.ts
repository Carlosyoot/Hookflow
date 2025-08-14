import { Envio, Nifi } from '../Client/BullClient.js';
import RedisClient from '../Client/QueueClient.js';
import logger from '../../Logger/Logger.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function ClearQueues(): Promise<void> {
  const isScheduled = await RedisClient.get('Limpeza:agendada');
  if (isScheduled) return;

  try {
    const [nifiSchedulers, envioSchedulers] = await Promise.all([
      (Nifi as any).getJobSchedulers?.() ?? [],
      (Envio as any).getJobSchedulers?.() ?? []
    ]);

    if ((nifiSchedulers as any[]).length > 0 || (envioSchedulers as any[]).length > 0) {
      await RedisClient.set('Limpeza:agendada', 'true');
      return;
    }

    await Promise.all([
      Envio.add('Limpeza', {}, { repeat: { every: ONE_DAY_MS }, jobId: 'Limpeza-Envio' }),
      Nifi.add('Limpeza', {}, { repeat: { every: ONE_DAY_MS }, jobId: 'Limpeza-Nifi' })
    ]);

    await RedisClient.set('Limpeza:agendada', 'true');
  } catch (error) {
    logger.error('[CODE] Erro ao tentar agendar a limpeza:', error as any);
  }
}
