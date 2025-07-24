import NodeCache from 'node-cache';
import pool from '../Client/OracleCliente.js';
import { encrypt } from '../security/Encoder.js';
import logger from '../../Logger/Logger.js';

const staticCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

export async function preloadClientSecrets() {
    try {
        const conn = await pool.getConnection();
        const result = await conn.execute(`
            SELECT CLIENT, SECRET_ENC 
            FROM U_WEBHOOK_CLIENTS 
            WHERE ACTIVE = 'Y'
        `);
        await conn.close();

        for (const [clientName, secretEnc] of result.rows) {
            staticCache.set(secretEnc, clientName);
        }

        logger.trace(`[SERVER] ${result.rows.length} secrets carregadas no cache.`);
    } catch (error) {
        logger.error(`[SERVER] Erro ao carregar secrets: ${error.message}`);
    }
}

export function getClientByToken(token) {
    const secretEnc = encrypt(token);
    return staticCache.get(secretEnc) ?? null;
}

export function addClientToSecretCache(secretEnc, clientName) {
    staticCache.set(secretEnc, clientName);
}

export function removeClientFromSecretCache(secretEnc) {
    staticCache.del(secretEnc);
}
