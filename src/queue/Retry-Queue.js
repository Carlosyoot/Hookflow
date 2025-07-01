import { Worker } from "bullmq";
import RedisClient from "../Client/QueueClient.js";
import { Nifi } from "../Client/BullClient.js";
import logger from "../../Logger/Logger.js";


async function Clear(){
    const limite = 14 * 24 * 60 * 60 * 1000;
    const Estados = ['completed', 'failed', 'active'];

    for (const status of Estados){
        await Nifi.clean(limite, 1000, status);
    }

    return
}

async function RetryQueues(job) {
    
    const { evento, client, status, error, motivo} = job.data;

    if ( status === 'ok') {
        return "Processado com sucesso";
    }

    else {
        throw new Error(`Job ${job.id} inválido ou malformado: sem status ou error.`);
    }
}

const worker = new Worker("Nifi", async (job) => {

    switch (job.name) {
        case "Limpeza":
            return await Clear(Nifi);

        case "Sucesso/Externo(NIFI)":
            return await RetryQueues(job);

        case "Erro/Externo(NIFI)":

            throw new Error(`[NIFI] Job encerrado como falha para fins de auditoria.`);

        default:
                logger.info("NOME DO JOB", job.name);

            throw new Error(`Job desconhecido: ${job.name}`);
    }
}, {
    concurrency: 50,
    connection: RedisClient,
    removeOnComplete: false,
    removeOnFail: false,
    settings: {
        backoffStrategies: {
            exponential: (attemptsMade) => Math.pow(2, attemptsMade) * 1000,
        },
    },
    attempts: 1,
    backoff: {
        type: 'exponential',
        delay: 2000,
    }
});


worker.on('failed', (job, err) => {
    logger.error(`[WORKER/RETRY] Evento ${job.id} falhou - Erro: ${err.message}`);
});

worker.on('ready', () => {
    logger.trace(`[WORKER/RETRY] Worker de reprocessamento iniciado`);
});
