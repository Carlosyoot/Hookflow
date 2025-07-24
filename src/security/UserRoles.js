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
    const token = auth?.replace('Bearer ', '').trim();

    if (!token) {
        return res.status(403).json({ error: 'Token ausente ou inválido' });
    }

    const clientName = getClientByToken(token);
    if (clientName) {
        req.client = clientName;
        return next();
    }

    const secretEnc = encrypt(token);

    try {
    const conn = await pool.getConnection();
    const result = await conn.execute(
        `SELECT CLIENT, SECRET_ENC, ACTIVE 
            FROM U_WEBHOOK_CLIENTS 
            WHERE SECRET_ENC = :secretEnc`,
        [secretEnc]
    );
    await conn.close();

    if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Token inválido ou não registrado' });
    }

    const [clientName, secret_enc, active] = result.rows[0];

    if (active !== 'Y') {
        return res.status(403).json({ error: 'Cliente inativo. Solicite reativação do acesso.' });
    }

    addClientToSecretCache(secret_enc, clientName);
    req.client = clientName;

    return next();
} catch (err) {
    console.error('[CLIENT MIDDLEWARE ERROR]', err);
    return res.status(500).json({ error: 'Erro ao validar token do cliente' });
}
}
