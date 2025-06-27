import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import Utils from '../src/routes/UtilsRoutes.js';
import ClientRoutes from '../src/routes/ClientRoutes.js';
import ManagerRoutes from '../src/routes/ManagerRoutes.js';
import { preloadClientSecrets } from '../src/utils/SecretsCache.js';

const app = express();
const port = process.env.PORT;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use(
  morgan('dev', {
    skip: (req) => req.originalUrl.startsWith('/bull')
  })
);

app.use(ClientRoutes);
app.use('/admin', ManagerRoutes);
app.use(Utils); 


preloadClientSecrets()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
    });
  })
  .catch((err) => {
    console.error('[CACHE INIT ERROR]', err);
    process.exit(1);
  });
