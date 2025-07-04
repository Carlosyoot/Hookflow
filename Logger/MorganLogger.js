import pino from 'pino';
import os from 'os';
import path from 'path';
import fs from 'fs';

const logPath = path.join(os.homedir(), 'Documents', 'webhook-redis');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const accessLogFile = path.join(logPath, 'Access.log');

const morganTransport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        destination: accessLogFile,
        colorize: false,
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
        singleLine: false
      },
      level: 'info'
    }
  ]
});

const httpLogger = pino({ level: 'info', base: null }, morganTransport);

export default httpLogger;
