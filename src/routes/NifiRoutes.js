import express from 'express';
import queue from '../Client/BeeClient.js';

const router = express.Router();

router.post('/nifi/confirm/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido ou ausente' });
  }

  try {
    await queue.createJob({ id }).retries(3).backoff('exponential', 2000).save();
    console.info(`[API] Job criado ID ${id}`);
    res.status(202).json({ message: 'Job enfileirado com sucesso', id });
  } catch (err) {
    console.error(`[API] Falha ao enfileirar job: ${err.message}`);
    res.status(500).json({ message: 'Erro ao enfileirar job' });
  }
});

export default router;
