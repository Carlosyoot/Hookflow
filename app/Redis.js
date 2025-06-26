import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import NIFIROUTES from '../src/routes/NifiRoutes.js';
import ClientRoutes from '../src/routes/ClientRoutes.js';
import ManagerRoutes from '../src/routes/ManagerRoutes.js';
import expressBasicAuth from 'express-basic-auth';
import arenaMiddleware from '../console/Dashboard.js';
import { preloadClientSecrets } from '../src/utils/SecretsCache.js';

const app = express();
const port = process.env.PORT;

// Middlewares de segurança e performance
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Logger com filtro para ignorar /arena
app.use(
  morgan('dev', {
    skip: (req) => req.originalUrl.startsWith('/arena'),
  })
);

// Rotas principais
app.use(ClientRoutes);
app.use('/admin', ManagerRoutes);

// Proteção do painel Arena
app.use('/arena', expressBasicAuth({
  users: {
    'admin': process.env.ADMIN_TOKEN
  },
  challenge: true,
  unauthorizedResponse: () => 'Acesso não autorizado ao painel Arena.'
}));

app.use('/arena', arenaMiddleware);

// Inicialização do cache + servidor
preloadClientSecrets()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
      console.log(`Arena protegido em http://localhost:${port}/arena`);
    });
  })
  .catch((err) => {
    console.error('[CACHE INIT ERROR]', err);
    process.exit(1);
  });
