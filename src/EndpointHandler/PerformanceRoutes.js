// middleware/PerformanceMiddleware.js
export function createPerformanceMonitor(logger, stats) {
  const logQueue = [];

  // Escreve logs em lote
  setInterval(() => {
    while (logQueue.length > 0) {
      const msg = logQueue.shift();
      logger.aviso(msg);
    }
  }, 100);

  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      stats.total++;
      const msg = `[PERF] ${req.method} ${req.originalUrl} demorou ${ms}ms`;

      if (ms > 500) {
        stats.lentas++;
        logQueue.push(msg);
      } else {
        stats.rapidas++;
      }

      if (stats.total % 50 === 0) {
        logQueue.push(`[STATS] Total: ${stats.total} | Lentas: ${stats.lentas} | Rápidas: ${stats.rapidas}`);
      }
    });
    next();
  };
}
