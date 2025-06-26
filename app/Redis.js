import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import expressBasicAuth from 'express-basic-auth';
import NIFIROUTES from '../src/routes/NifiRoutes.js';
import ClientRoutes from '../src/routes/ClientRoutes.js';
import ManagerRoutes from '../src/routes/ManagerRoutes.js';
import arenaMiddleware from '../console/Dashboard.js';
import { preloadClientSecrets } from '../src/utils/SecretsCache.js';

const app = express();
const port = process.env.PORT;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use(
  morgan('dev', {
    skip: (req) => req.originalUrl.startsWith('/arena'),
  })
);

app.use(ClientRoutes);
app.use('/admin', ManagerRoutes);
app.use(NIFIROUTES); 

app.use('/arena', expressBasicAuth({
  users: {
    'admin': process.env.ADMIN_TOKEN
  },
  challenge: true,
  unauthorizedResponse: () => 'Acesso não autorizado ao painel Arena.'
}));

app.use((_, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src * 'unsafe-inline' 'unsafe-eval'");
  next();
});

app.use('/arena', arenaMiddleware);

preloadClientSecrets()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
      console.log(`Arena disponível em http://localhost:${port}/arena`);
    });
  })
  .catch((err) => {
    console.error('[CACHE INIT ERROR]', err);
    process.exit(1);
  });
