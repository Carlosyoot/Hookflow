import { Queue, Worker } from "bullmq";
import RedisClient from "../Client/QueueClient.js";
import { Envio, Nifi } from "../Client/BullClient.js";
import { request } from "undici";
import 'dotenv/config';
import logger from "../../Logger/Logger.js";


async function QueueProcess(Job){
    const { evento, data, client } = Job.data;

    const payload = {
        QueueJob: Job.id,
        evento,
        client,
        data
    };
    try {
        const { statusCode } = await request("http://localhost:7878/nifi",{

            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
        });

        if ( statusCode < 200 || statusCode > 300){
            throw new Error(`Falha no envio: status HTTP ${statusCode}`);
        }

        await Nifi.add('Sucesso/Externo(NIFI)',
            { QueueJob: String(Job.id), evento, client, data, status: 'ok'},
            { jobId: String(Job.id) , removeOnComplete: false }
        )

        return `Evento ${evento} enviado com sucesso para endpoint externo`;
    }
    catch(error){
        const mensagemErro = error?.message || error?.cause?.message || JSON.stringify(error);
        logger.error(`[WORKER/ENVIO] Falha ao enviar evento: ${mensagemErro}`);
        throw new Error(mensagemErro);
    }
}

async function Clear(){
    
    const limite = 14 * 24 * 60 * 60 * 1000;
    const Estados = ['completed', 'failed', 'active'];
    for (const status of Estados){
        await Envio.clean(limite, 1000, status);
    }
    return `Eventos com mais de 14 dias limpos`
}

const worker = new Worker("Envio", async (job) => {
    switch (job.name) {
        case "Envio/Principal":
        return await QueueProcess(job);
    case "Limpeza":
        return await Clear(job);
    default:
        throw new Error(`Job desconhecido: ${job.name}`);
    }
}, {
    concurrency: 50,
    connection: RedisClient,
    removeOnComplete: false,
    removeOnFail: false,
    settings: {
        backoffStrategies: {
        exponential: () => 2000,
        },
    },
});

worker.on('failed', async (job, err) => {
    logger.error(`[WORKER/ENVIO] Evento ${job.id} falhou - Erro: ${err.message}`);
});

worker.on('ready', () => {
    logger.trace(`[WORKER/ENVIO] Worker de envio iniciado`);
});