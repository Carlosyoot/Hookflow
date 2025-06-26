import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import NIFIROUTES from '../src/routes/NifiRoutes.js';
import ADMINROUTES from '../src/routes/O.js'
import ManagerRoutes from '../src/routes/ManagerRoutes.js'

const app = express();
const port = process.env.PORT

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(NIFIROUTES);
app.use(ADMINROUTES);
app.use('/admin', ManagerRoutes);

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
