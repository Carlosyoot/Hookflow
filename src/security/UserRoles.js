import { encrypt } from '../security/Encoder.js';
import pool from '../Client/OracleCliente.js';
import { getClientByToken, addClientToSecretCache } from '../utils/SecretsCache.js';

export function Manager(req, res, next) {
    const auth = req.headers['authorization'];
    const token = auth?.replace('Bearer ', '');

    if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Acesso não autorizado, privilégios insuficientes' });
    }

    const hora = new Date().getHours();
    if (hora < 7 || hora > 20) {
        return res.status(403).json({ error: 'Acesso permitido apenas em horário comercial (07h às 20h)' });
    }

    next();
}

export async function Client(req, res, next) {
    const auth = req.headers['authorization'];
    const token = auth?.replace('Bearer ', '');

    if (!token) {
        return res.status(403).json({ error: 'Token ausente ou inválido' });
    }

    let clientData = getClientByToken(token);
    if (clientData) {
        req.client = clientData;
        return next();
    }

    const enc = encrypt(token);

    try {
    const conn = await pool.getConnection();
    const result = await conn.execute( `SELECT NOME, SECRET_ENC FROM CLIENTES_API WHERE SECRET_ENC = :enc`, [enc]);
    await conn.close();

    if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Token não autorizado' });
    }

    const [nome, secret_enc] = result.rows[0];
    const client = { nome };
    addClientToSecretCache(secret_enc, nome);
    req.client = client;

    return next();
    } catch (err) {
        console.error('[CLIENT MIDDLEWARE ERROR]', err);
        return res.status(500).json({ error: 'Erro ao validar token do cliente' });
    }
}
