import { encrypt, generateSecretWithSalt } from '../security/Encoder.js';
import pool from '../Client/OracleCliente.js';
import { getCache, setCache, invalidateCache } from "../utils/DynamicCache.js";
import { removeClientFromSecretCache, addClientToSecretCache } from '../utils/SecretsCache.js';
import logger from '../../Logger/Logger.js';



export async function AddClientMiddleware(req, res) {
    const requiredFields = ['cnpj', 'nome'];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const cnpj = req.body.cnpj.trim();
    const nome = req.body.nome.trim();
    const token = req.body.voors?.trim();
    const authorization = req.body.authorization?.trim();
    const lwclient = req.body.lwclient?.trim();

    const secret = generateSecretWithSalt();
    const secret_enc = encrypt(secret);

    try {
        const conn = await pool.getConnection();

        const result = await conn.execute(
            `SELECT 1 FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`, [cnpj]
        );

        if (result.rows.length > 0) {
            await conn.close();
            return res.status(409).json({ error: 'Cliente já existente' });
        }

        await conn.execute(
            `INSERT INTO U_WEBHOOK_CLIENTS (CNPJ, CLIENT, SECRET_ENC)
            VALUES (:cnpj, :nome, :secret_enc)`,
            { cnpj, nome, secret_enc },
            { autoCommit: false } 
        );

        await conn.execute(
            `INSERT INTO U_HOK_CONFIG (CNPJ, TOKEN, AUTHORIZATION, LW_CLIENT)
            VALUES (:cnpj, :token, :authorization, :lwclient)`,
            {
                cnpj,
                token: token || null,
                authorization: authorization || null,
                lwclient: lwclient || null
            },
            { autoCommit: false }
        );

        await conn.commit();

        addClientToSecretCache(secret_enc, nome);
        invalidateCache('CLIENTES:ALL');
        invalidateCache(`CLIENTES:${cnpj}`);

        await conn.close();

        return res.status(201).json({ success: true, token: secret });

    } catch (err) {
        logger.error("[CODE] Erro ao registrar cliente: ", err);
        return res.status(500).json({ error: 'Erro interno ao registrar cliente' });
    }
}


export async function GetAllClientsMiddleware(req, res) {
    const cacheKey = 'CLIENTES:ALL';
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const conn = await pool.getConnection();

        const result = await conn.execute(
            `SELECT CNPJ, CLIENT, ACTIVE FROM U_WEBHOOK_CLIENTS ORDER BY CLIENT`
        );

        await conn.close();

        const formatted = result.rows.map(([cnpj, client, active]) => ({
            cnpj,
            client,
            active: active === 'Y'
        }));
        setCache(cacheKey, formatted);

        return res.status(200).json(formatted);
    } catch (err) {
        logger.error("[CODE] Erro ao obter clientes: ", err);
        return res.status(500).json({ error: 'Erro ao obter clientes' });
    }
}

export async function GetClientByCNPJMiddleware(req, res) {
    const { cnpj } = req.params;
        if (!cnpj) return res.status(400).json({ error: 'CNPJ não informado' });

    const cacheKey = `CLIENTES:${cnpj}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    try {
        const conn = await pool.getConnection();

        const result = await conn.execute(
            `SELECT CNPJ, CLIENT FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`, [cnpj]);

        await conn.close();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const [CNPJ, CLIENT] = result.rows[0];
        const response = { cnpj: CNPJ, nome: CLIENT };
        setCache(cacheKey, response);

        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        logger.error("[CODE] Erro ao buscar cliente: ", err)
        return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
}

export async function DeleteClientMiddleware(req, res) {
    const { cnpj } = req.params;

    if (!cnpj) {
        return res.status(400).json({ error: 'CNPJ não informado' });
    }

    try {
        const conn = await pool.getConnection();

        const resultGet = await conn.execute(
            `SELECT SECRET_ENC FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`, [cnpj]
        );

        if (resultGet.rows.length === 0) {
            await conn.close();
            return res.status(404).json({ error: 'Cliente não encontrado para exclusão' });
        }

        const [secret_enc] = resultGet.rows[0];

        const result = await conn.execute(
            `DELETE FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`, [cnpj], { autoCommit: true });

        invalidateCache('CLIENTES:ALL'); 
        invalidateCache(`CLIENTES:${cnpj}`); 
        removeClientFromSecretCache(secret_enc); 

        await conn.close();

        return res.status(200).json({ success: true, cnpj });
    } catch (err) {
        console.error(err);
        logger.error("[CODE] Erro ao excluir cliente: ", err)
        return res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
}

export async function UpdateClientStatusMiddleware(req, res) {
    const { cnpj } = req.params;
    const activeParam = req.query.active;

    if (!cnpj) {
        return res.status(400).json({ error: 'CNPJ não informado' });
    }

    if (activeParam === undefined) {
        return res.status(400).json({ error: 'Parâmetro "active" não informado' });
    }

    const lowered = String(activeParam).trim().toLowerCase();
    const validValues = ['true', 'false'];

    if (!validValues.includes(lowered)) {
        return res.status(400).json({ error: 'Status inválido. Use "true" ou "false".' });
    }

    const status = (lowered === 'true') ? 'Y' : 'N';

    try {
        const conn = await pool.getConnection();

        const resultGet = await conn.execute(
            `SELECT 1 FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`,
            [cnpj]
        );

        if (resultGet.rows.length === 0) {
            await conn.close();
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        await conn.execute(
            `UPDATE U_WEBHOOK_CLIENTS SET ACTIVE = :status WHERE CNPJ = :cnpj`,
            { status, cnpj },
            { autoCommit: true }
        );

        if (status === 'N') {
            const resultSecret = await conn.execute(
                `SELECT SECRET_ENC FROM U_WEBHOOK_CLIENTS WHERE CNPJ = :cnpj`,
                [cnpj]
            );
        
            if (resultSecret.rows.length > 0) {
                const [secret_enc] = resultSecret.rows[0];
                removeClientFromSecretCache(secret_enc);
            }
        }

        await conn.close();

        return res.status(200).json({
            success: true,
            message: `Cliente ${status === 'Y' ? 'ativado' : 'desativado'} com sucesso`,
            cnpj,
            active: status === 'Y'
        });
    } catch (err) {
        console.error(err);
        logger.error("[CODE] Erro ao atualizar status do cliente: ", err);
        return res.status(500).json({ error: 'Erro ao atualizar status do cliente' });
    }
}
