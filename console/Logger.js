import fs from 'fs';
import path from 'path';
import os from 'os';

function generateTimestamp() {
    return `[${new Date().toLocaleString('pt-BR', { hour12: false })}]`;
}

const LEVELS = ['INFO', 'SUCESSO', 'AVISO', 'ERRO', 'DEBUG'];

class Logger {
constructor(fileName = 'Redis.log') {
    const logDir = path.join(os.homedir(), 'Documents', 'Integra-webhook', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    this.logPath = path.join(logDir, fileName);
}

    write(tag, message) {
    const line = `${generateTimestamp()} [${tag.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(this.logPath, line, 'utf8');
}

    info(msg)    { this.write('INFO', msg); }
    sucesso(msg){ this.write('SUCESSO', msg); }
    aviso(msg)  { this.write('AVISO', msg); }
    erro(msg)   { this.write('ERRO', msg); }
    debug(msg)  { this.write('PERF', msg); }
}

export default Logger;
