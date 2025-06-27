import express from 'express';
import 'dotenv/config';
import { Queue } from 'bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import expressBasicAuth from 'express-basic-auth';
import RedisClient from '../src/Client/QueueClient.js'; 

const app = express();
const port = 4546; 

app.use('/bull', expressBasicAuth({
    users: {
        'admin': process.env.ADMIN_TOKEN
    },
    challenge: true,
    unauthorizedResponse: () => 'Acesso negado ao painel Bull-Board.'
}));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull');

createBullBoard({
  queues: [
    new BullMQAdapter(new Queue('Envio', { connection: RedisClient })),
    new BullMQAdapter(new Queue('Nifi', { connection: RedisClient }))
  ],
  serverAdapter,
});

app.use('/bull', serverAdapter.getRouter());

app.listen(port, () => {
    console.log(`Painel Bull-Board disponível em http://localhost:${port}/bull`);
});
