import RedisClient from "./src/Client/QueueClient.js";
import { Queue } from "bullmq";


const fila = new Queue('Envio', {RedisClient});

async function limparTudo() {
  try {
    // 🔁 1. Remover jobs repeatables
    const repeatables = await fila.getJobSchedulers();
    console.log(`Encontrados ${repeatables.length} jobs repeatables.`);

    for (const job of repeatables) {
      await fila.removeJobScheduler(job.key);
      console.log(`🔁 Job repeat removido: ${job.key}`);
    }

    // 💥 2. Flush geral do Redis
    const resultadoFlush = await RedisClient.flushall();
    console.log('🧹 Redis zerado:', resultadoFlush);

    await fila.close();
    await RedisClient.quit();
    console.log('✅ Fila encerrada e Redis limpo com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao limpar fila/Redis:', err);
  }
}

limparTudo();