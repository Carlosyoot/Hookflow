import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import Utils from './src/routes/UtilsRoutes.ts';
import WebhookRoutes from './src/routes/ClientRoutes.ts';
import ManagerRoutes from './src/routes/ManagerRoutes.ts';

import { preloadClientSecrets } from './src/utils/SecretsCache.ts';
import { ClearQueues } from './src/utils/Scheduling.ts';

import logger from './Logger/Logger.js';
import httpLogger from './Logger/MorganLogger.js';
import console from 'node:console';

const app = express();
const port = Number(process.env.PORT) || 4545;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use(
  morgan('short', {
    skip: (req) => req.originalUrl.startsWith('/bull'),
    stream: { write: (msg: string) => httpLogger.info(msg.trim()) }
  })
);

app.use(WebhookRoutes);
app.use('/admin', ManagerRoutes);
app.use(Utils);

preloadClientSecrets()
  .then(() => {
    app.listen(port, () => {
      logger.trace?.(`[SERVER] Servidor iniciado na porta ${port}`);
      void ClearQueues();
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

export default app;
