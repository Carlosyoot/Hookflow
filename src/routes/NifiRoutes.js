import express from 'express';
import { createClient } from 'redis';
import Logger from '../../console/Logger.js'; 
import { adicionarNaFila } from '../RedisHandler/RedisWorkers.js';

const redis = createClient({ url: process.env.URL_REDIS });
await redis.connect();

const router = express.Router();
const logger = new Logger();

router.post('/nifi/confirm/:id', (req, res) => {
  const { id } = req.params;
  const mathId = Number(id) * 3;

  adicionarNaFila(mathId.toString());
  logger.info(`Enfileirado ID ${id} como ${mathId}`);
  res.status(200).json({ message: 'Enfileirado', id: mathId });
});

export default router;