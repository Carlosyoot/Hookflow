import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import ADMINROUTES from '../routes/O.js'
import NIFIROUTES from '../routes/NifiRoutes.js'

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));
app.use(NIFIROUTES);
app.use(ADMINROUTES);


(async () => {

    try{
    const port = process.env.PORT;
    app.listen(port , () => {
        console.log("servidor iniciado")
    });
    }
    catch(err){
        console.log('erro: ',err);
    }
})();