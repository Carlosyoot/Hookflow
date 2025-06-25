// src/RedisHandler/worker.js

import { createClient } from 'redis';
import 'dotenv/config';

// --- Constantes ---
// Devem ser as mesmas usadas nas rotas para que o worker "enxergue" a fila correta.
const NOME_DA_FILA_REDIS = 'fila:processamento';
const NOME_DA_STREAM_REDIS = 'estresse'; // Onde os dados serão salvos no final
const TAMANHO_MAX_LOTE = 50; // Mesmo tamanho de lote que você usava

// --- Cliente Redis ---
const redis = createClient({ url: process.env.URL_REDIS });

// --- Lógica de Processamento ---
async function processarLote(lote) {
    if (lote.length === 0) return;

    console.info(`[WORKER] Processando um lote com ${lote.length} itens.`);

    // Mapeia cada ID do lote para uma promessa de XADD
    const promessas = lote.map(id => redis.xAdd(NOME_DA_STREAM_REDIS, '*', { id }));
    const resultados = await Promise.allSettled(promessas);

    // Opcional: verifica se algum item do lote falhou
    resultados.forEach((resultado, index) => {
        if (resultado.status === 'rejected') {
            const idComFalha = lote[index];
            console.error(`[WORKER] Falha ao processar ID ${idComFalha} no XADD. Motivo: ${resultado.reason.message}`);
            // Aqui você poderia adicionar a uma fila de falhas (Dead Letter Queue) se quisesse
            // redis.lPush('fila:falhas', idComFalha);
        }
    });
}

// --- Loop Principal do Worker ---
async function iniciarWorker() {
    await redis.connect();
    console.info('[WORKER] Conectado ao Redis.');
    console.info('[WORKER] Aguardando por trabalho na fila...');

    while (true) {
        try {
            // BRPOP espera eficientemente por um item na fila.
            // O worker não consome CPU enquanto espera.
            const resultado = await redis.brPop(NOME_DA_FILA_REDIS, 0);

            // Assim que um item chega, montamos o lote.
            const loteAtual = [resultado.element];

            // Pega mais itens que já estejam na fila para processar em lote
            while (loteAtual.length < TAMANHO_MAX_LOTE) {
                const proximoItem = await redis.lPop(NOME_DA_FILA_REDIS);
                if (proximoItem) {
                    loteAtual.push(proximoItem);
                } else {
                    break; // A fila está vazia.
                }
            }

            // Processa o lote que foi montado
            await processarLote(loteAtual);

            await new Promise(resolve => setTimeout(resolve, 10));



        } catch (error) {
            console.error(`[WORKER] Erro crítico: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

iniciarWorker();