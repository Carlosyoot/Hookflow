import express from 'express';
import { FilaNifi } from "../Client/BeeClient.js";

const router = express.Router();

router.post('/nifi/falha/:Queue', async (req, res) => {
  const id = parseInt(req.params.Queue, 10);
  const { evento, data, client, motivo } = req.body;

  if (!id || !evento || !client) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes (id, evento, client)' });
  }

  try {
    const job = await FilaNifi
      .createJob({
        id,
        evento,
        data,
        client,
        motivo,
        origem: 'callback-nifi'
      })
      .retries(5)
      .backoff('exponential', 5000)
      .save();

    console.log(`[NIFI-FALHA] Evento ${evento} do cliente ${client} reencaminhado para reprocessamento com ID: ${job.id}`);

    return res.status(202).json({ mensagem: 'Evento enviado para reprocessamento', jobId: job.id });
  } catch (err) {
    console.error(`[NIFI-FALHA] Erro ao reencaminhar evento para reprocessamento: ${err.message}`);
    return res.status(500).json({ erro: 'Falha ao reencaminhar evento para fila de reprocessamento' });
  }
});

export default router;
