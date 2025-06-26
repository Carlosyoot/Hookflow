import { encrypt, generateSecretWithSalt } from '../security/Encoder.js';
import pool from '../Client/OracleCliente.js';
import { getCache, setCache } from "../utils/Cache.js";



export async function AddClientMiddleware(req,res,next){

    const requiredFields = ['cnpj', 'nome'];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const {  cnpj, nome } = req.body;

    const secret = generateSecretWithSalt();
    const secret_enc = encrypt(secret);

    try{
        const conn = await pool.getConnection();

        const result = await conn.execute(
        `SELECT 1 FROM CLIENTES_API WHERE CNPJ = :cnpj`, [cnpj]);

        if (result.rows.length > 0) {
            await conn.close();
            return res.status(409).json({ error: 'Cliente já existente' });
        }

        await conn.execute(
            `INSERT INTO CLIENTES_API (CNPJ, NOME, SECRET_ENC)
            VALUES (:cnpj, :nome, :secret_enc)`,
            { cnpj, nome, secret_enc },
            { autoCommit: true }
        );

        await conn.close();
            return res.status(201).json({ success: true, cnpj, secret });

    } catch (err) {
        console.error('[ORACLE ERROR]', err);
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
            `SELECT CNPJ, NOME FROM CLIENTES_API ORDER BY NOME`
        );

        await conn.close();

        const formatted = result.rows.map(([cnpj, nome]) => ({ cnpj, nome }));
        setCache(cacheKey, formatted);

        return res.status(200).json(formatted);
    } catch (err) {
        console.error('[GET ALL CLIENTES ERROR]', err);
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
            `SELECT CNPJ, NOME FROM CLIENTES_API WHERE CNPJ = :cnpj`, [cnpj]);

        await conn.close();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const [CNPJ, NOME] = result.rows[0];
        const response = { cnpj: CNPJ, nome: NOME };
        setCache(cacheKey, response);

        return res.status(200).json(response);
    } catch (err) {
        console.error('[GET CLIENTE ERROR]', err);
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

        const result = await conn.execute(
            `DELETE FROM CLIENTES_API WHERE CNPJ = :cnpj`, [cnpj], { autoCommit: true });

        await conn.close();

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado para exclusão' });
        }

        return res.status(200).json({ success: true, cnpj });
    } catch (err) {
        console.error('[DELETE CLIENTE ERROR]', err);
        return res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
}

    