import pino from 'pino';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logPath = path.resolve(__dirname, '../../Logs');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const completeLogFile = path.join(logPath, 'Webhook.log');

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
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
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
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
