import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import NIFIROUTES from '../routes/NifiRoutes.js';
import ADMINROUTES from '../routes/O.js';

const app = express();
const port = process.env.PORT || 4545;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(NIFIROUTES);
app.use(ADMINROUTES);

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
