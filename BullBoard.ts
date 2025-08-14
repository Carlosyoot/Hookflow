import 'dotenv/config';
import express from 'express';
import expressBasicAuth from 'express-basic-auth';
import { Queue } from 'bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';

import RedisClient from './src/Client/QueueClient.js';
import logger from './Logger/Logger.js';

const app = express();
const port = Number(process.env.PAINEL_PORT) || 3001;

app.use(
  '/bull',
  expressBasicAuth({
    users: { admin: process.env.PAINEL_TOKEN || '' },
    challenge: true,
    unauthorizedResponse: () => 'Acesso negado ao painel Bull-Board.'
  })
);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull');

createBullBoard({
  queues: [
    new BullMQAdapter(new Queue('Envio', { connection: RedisClient })),
    new BullMQAdapter(new Queue('Nifi', { connection: RedisClient }))
  ],
  serverAdapter
});

app.use('/bull', serverAdapter.getRouter());

app.listen(port, () => {
  logger.trace?.(`[SERVER] Painel Bull-Board iniciado em http://localhost:${port}/bull`);
});

export default app;
