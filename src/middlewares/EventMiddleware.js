import { Envio, Nifi } from "../Client/BullClient.js";
import RedisClient from "../Client/QueueClient.js";
import logger from "../../Logger/Logger.js";

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

        const CountID = await RedisClient.incr("evento_contador");
        const id = `ID-${CountID}`

        await Envio.add('Envio/Principal',
        { evento, client: client?.nome , data },
        {
            jobId: id,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 }
        }
        );

        logger.info(`[WEBHOOK] Novo evento recebido de ${client?.nome}`)
        return res.sendStatus(202);
    }
    catch (err) {
        
        logger.fatal('[WEBHOOK] Falha ao enfileirar evento:', err);
        return res.status(500).json({ erro: 'Erro ao enfileirar evento.' });
    }
}

export async function FailedEvent(req, res) {
    const queueId =  req.params.Queue;

    if (!queueId || typeof queueId !== 'string' || !queueId.startsWith('ID-')) {
        return res.status(400).json({ error: 'Job ID inválido. Esperado formato "evento-<número>".' });
    }

    try {
        const job = await Envio.getJob(String(queueId));

        if (!job) {
            return res.status(404).json({ error: `Job com ID ${queueId} não encontrado.` });
        }

        const { evento, client, data, motivo } = job.data;
        const error =  req.body.error;

        const SuccededJob = await Nifi.getJob(String(queueId));
        if (SuccededJob){
            
            await SuccededJob.remove();
        }

        const retryJob = await Nifi.add(
            'Erro/Externo(NIFI)',
            { evento, client, motivo, data, error },
            {
                jobId: queueId,
                attempts: 1,
                backoff: {
                type: 'exponential',
                delay: 4000,},
            }
    );

    logger.warn(`[WEBHOOK] ${queueId} / ${client}  - falhou no endpoint externo`);

    return res.status(202).json({
        mensagem: 'Evento reencaminhado com sucesso',
        jobOriginal: queueId,
        jobRetry: retryJob.id,
    });
    } 
    catch (error) {
        logger.error('[WEBHOOK] Erro ao tentar reencaminhar evento:', error);
        return res.status(500).json({ erro: 'Erro interno ao tentar reprocessar evento.' });
    }
}