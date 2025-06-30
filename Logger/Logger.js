import pino from 'pino';
import os from 'os';
import path from 'path';
import fs from 'fs';

// Define caminho do log
const logPath = path.join(os.homedir(), 'Documents', 'webhook-redis');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const completeLogFile = path.join(logPath, 'Webhook.log');

// Transportes combinados: terminal e arquivo (ambos com pino-pretty)
const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd/MM/yyyy HH:mm:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
        singleLine: false
      },
      level: 'trace'
    },
    {
      target: 'pino-pretty',
      options: {
        destination: completeLogFile,
        colorize: false,
        translateTime: 'SYS:dd/MM/yyyy HH:mm:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
        singleLine: false
      },
      level: 'trace'
    }
  ]
});

const logger = pino({ level: 'trace', base: null }, transport);

export default logger;
