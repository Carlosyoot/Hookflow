import { Worker } from "bullmq";
import RedisClient from "../Client/QueueClient.js";



async function Clear(queue) {
    const limite = 0; 
    const Estados = ['completed', 'failed', 'active'];
    const resumo = [];

    for (const status of Estados) {
        const removidos = await queue.clean(limite, 1000, status);
        const msg = `[Limpeza agendada] Apagado ${removidos} jobs com status: ${status}`;
        console.log(msg);
        resumo.push(msg);
    }

    return resumo.join('\n');
}

const worker = new Worker("Nifi", async (job) => {
    const { evento, data, client, status, error, motivo } = job.data;

    if (status === 'ok') {
        console.log(`[NIFI:SUCESSO] Evento ${evento} do cliente ${client} foi processado com sucesso.`);
        return 'Processado com sucesso.';
    }

    if (error) {
        console.warn(`[NIFI:ERRO] Evento ${evento} do cliente ${client} falhou com erro: ${error} | Motivo: ${motivo ?? 'não informado'}`);
    }

    throw new Error(`Job ${job.id} inválido ou malformado: sem status ou error.`);
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

worker.on('completed', (job, result) => {
    console.log(`[NIFI-WORKER] Job ${job.id} concluído: ${result}`);
});

worker.on('failed', (job, err) => {
    console.error(`[NIFI-WORKER] Job ${job.id} falhou. Erro: ${err.message}`);
});

worker.on('ready', () => {
    console.log(`[NIFI-WORKER] Pronto para processar jobs na fila Nifi`);
});
