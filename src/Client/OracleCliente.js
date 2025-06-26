import oracledb from 'oracledb';
import 'dotenv/config';

oracledb.initOracleClient(); 

const pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectString: process.env.DB_CONNECT,
});

export default pool;
