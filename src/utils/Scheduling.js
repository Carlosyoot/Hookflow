import { Envio, Nifi } from "../Client/BullClient.js";


export async function ClearQueues(){

    console.log("LIMPEZA AGENDADA")

    await Envio.add("Limpeza", {}, {
        repeat: { every: 24 * 60 * 60 * 1000},
        jobId: 'Limpeza-Envio'
    });

    await Nifi.add("Limpeza", {}, {
        repeat: { every: 24 * 60 * 60 * 1000},
        jobId: 'Limpeza-Nifi'
    });
}