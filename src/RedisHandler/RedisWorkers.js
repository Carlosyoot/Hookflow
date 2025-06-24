// RedisHandler/RedisWorkers.js
const filaRedis = [];

export function adicionarNaFila(dado) {
  filaRedis.push(dado);
}

function processarFila(redis, logger) {
  if (filaRedis.length === 0) return setImmediate(() => processarFila(redis, logger));

  const batch = filaRedis.splice(0, 300); // envia em lotes de 100 (ajustável)

  Promise.allSettled(
    batch.map(id => redis.xAdd('estresse', '*', { id }))
  ).then(results => {
    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        logger.erro(`[REDIS FAIL] ID ${batch[i]}: ${res.reason}`);
        filaRedis.push(batch[i]); // retry manual
      }
    });

    setImmediate(() => processarFila(redis, logger));
  });
}

export function iniciarRedisWorker(redis, logger) {
  processarFila(redis, logger);
}
