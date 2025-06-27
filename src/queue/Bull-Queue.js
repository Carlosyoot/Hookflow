import { Queue, Worker } from "bullmq";
import RedisClient from "../Client/QueueClient.js";
import { Nifi } from "../Client/BullClient.js";
import { request } from "undici";
import 'dotenv/config';


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
        console.error(`[WORKER] Falha ao enviar evento: ${mensagemErro}`);
        throw new Error(mensagemErro);
    }
}

const worker = new Worker("Envio", QueueProcess,{
    concurrency: 50,
    connection: RedisClient,
    removeOnComplete: false,
    removeOnFail: false,
    settings: {
        backoffStrategies:{
            exponential : () => 2000,
        },
    },
});

worker.on('completed', (job, result) => {
    console.log(`[WORKER ${process.pid}] Job ${job.id} concluído. Resultado: ${result}`);
});

worker.on('failed', async (job, err) => {
    console.error(`[WORKER ${process.pid}] Job ${job.id} falhou. Erro: ${err.message}`);
});

worker.on('ready', () => {
    console.log(`[WORKER ${process.pid}] Pronto para processar jobs (BullMQ).`);
});