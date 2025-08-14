import type { Request, Response, NextFunction } from 'express';
import { encrypt } from './Encoder.js';
import pool from '../Client/OracleClient.js';
import { getClientByToken, addClientToSecretCache } from '../utils/SecretsCache.js';
import console from 'node:console';

export function Manager(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'];
  const token = auth?.replace('Bearer ', '');

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acesso não autorizado, privilégios insuficientes' });
  }

  const hora = new Date().getHours();
  if (hora < 7 || hora > 20) {
    return res
      .status(403)
      .json({ error: 'Acesso permitido apenas em horário comercial (07h às 20h)' });
  }

  next();
}

export async function Client(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'];
  const token = auth?.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(403).json({ error: 'Token ausente ou inválido' });
  }

  const cachedClient = getClientByToken(token);
  if (cachedClient) {
    (req as any).client = cachedClient;
    return next();
  }

  const secretEnc = encrypt(token);

  let conn: any;
  try {
    conn = await pool.getConnection();
    const result = await conn.execute(
      `SELECT CLIENT, SECRET_ENC, ACTIVE 
         FROM U_WEBHOOK_CLIENTS 
        WHERE SECRET_ENC = :secretEnc`,
      [secretEnc]
    );

    if (!result.rows?.length) {
      return res.status(403).json({ error: 'Token inválido ou não registrado' });
    }

    const [clientName, secret_enc, active] = result.rows[0] as [string, string, 'Y' | 'N'];

    if (active !== 'Y') {
      return res
        .status(403)
        .json({ error: 'Cliente inativo. Solicite reativação do acesso.' });
    }

    addClientToSecretCache(secret_enc, clientName);
    (req as any).client = clientName;
    return next();
  } catch (err) {
    console.error('[CLIENT MIDDLEWARE ERROR]', err);
    return res.status(500).json({ error: 'Erro ao validar token do cliente' });
  } finally {
    try {
      await conn?.close();
    } catch {}
  }
}
