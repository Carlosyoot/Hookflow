import NodeCache from 'node-cache';
import pool from '../Client/OracleClient.ts';
import { encrypt } from '../security/Encoder.ts';
import logger from '../../Logger/Logger.js';

const staticCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

export async function preloadClientSecrets(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    const result = await conn.execute(`
      SELECT CLIENT, SECRET_ENC 
        FROM U_WEBHOOK_CLIENTS 
       WHERE ACTIVE = 'Y'
    `);
    await conn.close();

    const rows = (result.rows || []) as [string, string][];
    for (const [clientName, secretEnc] of rows) {
      staticCache.set(secretEnc, clientName);
    }

    logger.trace?.(`[SERVER] ${rows.length} secrets carregadas no cache.`);
  } catch (error: any) {
    logger.error?.(`[SERVER] Erro ao carregar secrets: ${error.message || String(error)}`);
  }
}

export function getClientByToken(token: string): string | null {
  const secretEnc = encrypt(token);
  const v = staticCache.get<string>(secretEnc);
  return v ?? null;
}

export function addClientToSecretCache(secretEnc: string, clientName: string): void {
  staticCache.set(secretEnc, clientName);
}

export function removeClientFromSecretCache(secretEnc: string): void {
  staticCache.del(secretEnc);
}
