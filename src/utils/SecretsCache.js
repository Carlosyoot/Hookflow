import NodeCache from 'node-cache';
import pool from '../Client/OracleCliente.js';
import { encrypt } from '../security/Encoder.js';

const staticCache = new NodeCache({ stdTTL: 0, checkperiod: 0 }); 

export async function preloadClientSecrets() {
    const conn = await pool.getConnection();
    const result = await conn.execute(`SELECT nome, SECRET_ENC FROM CLIENTES_API`);
    await conn.close();

    for (const [nome, enc] of result.rows) {
        staticCache.set(enc, { nome });
    }

    console.log(`[CACHE] ${result.rows.length} secrets carregadas no cache.`);
}

export function getClientByToken(token) {
    const enc = encrypt(token);
    return staticCache.get(enc) ?? null;
}

export function addClientToSecretCache(secret_enc, nome) {
    staticCache.set(secret_enc, { nome });
}

export function removeClientFromSecretCache(secret_enc) {
    staticCache.del(secret_enc);
}
