import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import expressStatusMonitor from 'express-status-monitor';
import ADMINROUTES from '../routes/O.js'
import NIFIROUTES from '../routes/NifiRoutes.js'
import Logger from '../../console/Logger.js';
import { OpenConsole } from '../../console/ConsoleUI.js';
import { createPerformanceMonitor } from '../EndpointHandler/PerformanceRoutes.js';
import { iniciarRedisWorker } from '../RedisHandler/RedisWorkers.js';
import { createClient } from 'redis';

const logger =  new Logger();
const app = express();
const redis = createClient({ url: process.env.URL_REDIS });

await redis.connect();
iniciarRedisWorker(redis, logger);

let stats = { total: 0, lentas: 0, rapidas: 0 };

app.use(express.json());
app.use(morgan('dev'));
app.use(createPerformanceMonitor(logger, stats));
app.use(expressStatusMonitor({ path: '/status' }));
app.use(NIFIROUTES);
app.use(ADMINROUTES);

app.get('/metrics', (req, res) => res.json({ ...stats, fila: 'ativa' }));


(async () => {

    try{
    const port = process.env.PORT;
    app.listen(port , () => {
        logger.info(`servidor rodando na porta ${port}`);
        OpenConsole();
    });
    }
    catch(err){
        console.log('erro: ',err);
    }
})();