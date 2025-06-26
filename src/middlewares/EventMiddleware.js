import { FilaProcessamento } from "../Client/BeeClient.js";

export async function AddEvent(req, res, next){
    
    const requiredFields = ['evento', 'data'];

    const missing = requiredFields.filter(field => {
        const val = req.body[field];
        return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });

    if(missing.length > 0){
        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }

    const { evento, data } = req.body;
    const { client } = req; 

    try{
        const job = await FilaProcessamento
            .createJob({evento, data, client: client?.nome})
            .retries(3)
            .backoff('exponential', 2000)
            .save();

        return res.sendStatus(202);
    }
    catch (err) {
        
        console.error('[Webhook] Falha ao enfileirar evento:', err);
        return res.status(500).json({ erro: 'Erro ao enfileirar evento.' });
    }
}