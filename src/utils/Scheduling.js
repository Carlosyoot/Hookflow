import { Envio, Nifi } from "../Client/BullClient.js";
import RedisClient from "../Client/QueueClient.js";
import logger from "../../Logger/Logger.js";

export async function ClearQueues() {
    const isScheduled = await RedisClient.get("Limpeza:agendada");
    if (isScheduled) {
        return;
    }

    try {

        const [nifiSchedulers, envioSchedulers] = await Promise.all([
            Nifi.getJobSchedulers(),
            Envio.getJobSchedulers()
        ]);

        if (nifiSchedulers.length > 0 || envioSchedulers.length > 0) {
            await RedisClient.set("Limpeza:agendada", "true"); 
            return;
        }

        await Promise.all([
            Envio.add("Limpeza", {}, {
                repeat: { every: 24 * 60 * 60 * 1000 }, 
                jobId: 'Limpeza-Envio'
            }),
            Nifi.add("Limpeza", {}, {
                repeat: { every: 24 * 60 * 60 * 1000 }, 
                jobId: 'Limpeza-Nifi'
            })
        ]);
        await RedisClient.set("Limpeza:agendada", "true");
    } catch (error) {
        logger.error("[CODE] Erro ao tentar agendar a limpeza:", error);
    }
}
