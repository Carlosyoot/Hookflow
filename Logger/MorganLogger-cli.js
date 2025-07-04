import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import chalk from 'chalk';

const accessLogFile = path.join(os.homedir(), 'Documents', 'webhook-redis', 'Access.log');
let cursor = 0;
let filterMethod = null;
let showingHelp = false;

const methodColors = {
  GET: chalk.green,
  POST: chalk.yellow,
  PUT: chalk.blue,
  DELETE: chalk.red
};

function colorizeLine(line) {
  let colored = line;

  const methodMatch = line.match(/- (GET|POST|PUT|DELETE) /);
  const statusMatch = line.match(/HTTP\/1\.1 (\d{3})/);

  if (methodMatch) {
    const method = methodMatch[1];
    const color = methodColors[method] || chalk.white;
    colored = colored.replace(method, color(method));
  }

  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    let color = chalk.gray;
    if (status >= 200 && status < 300) color = chalk.green;
    else if (status >= 400) color = chalk.red;
    colored = colored.replace(statusMatch[1], color(statusMatch[1]));
  }

  return colored;
}

function printLine(line) {
  if (!line.trim()) return;
  if (filterMethod) {
    const regex = new RegExp(`- ${filterMethod} `);
    if (!regex.test(line)) return;
  }
  console.log(colorizeLine(line));
}

function replayAccessLog() {
  fs.readFile(accessLogFile, 'utf-8', (err, data) => {
    if (err) return;
    console.clear();
    showFilterInfo();
    const lines = data.split(/\r?\n/);
    lines.slice(-500).forEach(printLine);
    fs.stat(accessLogFile, (_, stats) => {
      cursor = stats.size;
    });
  });
}

function readNewLines() {
  fs.stat(accessLogFile, (err, stats) => {
    if (err) return;
    if (stats.size < cursor) cursor = 0;
    const stream = fs.createReadStream(accessLogFile, { start: cursor, end: stats.size });
    let buffer = '';

    stream.on('data', chunk => buffer += chunk.toString());
    stream.on('end', () => {
      const lines = buffer.split(/\r?\n/);
      lines.forEach(printLine);
      cursor = stats.size;
    });
  });
}

function showFilterInfo() {
  let tag = filterMethod ? chalk.bold(filterMethod) : chalk.white('TODOS');
  console.log(chalk.gray('[Filtro de método: ') + tag + chalk.gray(']\n'));
}

function showHelp() {
  console.clear();
  showingHelp = true;
  console.log(chalk.bold('🛠️ AJUDA - Teclas disponíveis:\n'));
  console.log(chalk.cyan(' g ') + '→ Filtro GET');
  console.log(chalk.cyan(' p ') + '→ Filtro POST');
  console.log(chalk.cyan(' u ') + '→ Filtro PUT');
  console.log(chalk.cyan(' d ') + '→ Filtro DELETE');
  console.log(chalk.cyan(' a ') + '→ Mostrar TODOS os métodos');
  console.log(chalk.cyan(' h ') + '→ Mostrar ajuda');
  console.log(chalk.cyan(' q ') + '→ Sair\n');
}

fs.watchFile(accessLogFile, { interval: 300 }, () => {
  if (!showingHelp) readNewLines();
});

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (_, key) => {
  showingHelp = false;

  switch (key.name) {
    case 'q':
      console.log(chalk.gray('\nSaindo...'));
      fs.unwatchFile(accessLogFile);
      process.exit(0);
    case 'h':
      showHelp();
      break;
    case 'g':
      filterMethod = 'GET';
      replayAccessLog();
      break;
    case 'p':
      filterMethod = 'POST';
      replayAccessLog();
      break;
    case 'u':
      filterMethod = 'PUT';
      replayAccessLog();
      break;
    case 'd':
      filterMethod = 'DELETE';
      replayAccessLog();
      break;
    case 'a':
      filterMethod = null;
      replayAccessLog();
      break;
  }
});

console.clear();
console.log(chalk.cyan('🔍 Visualizador de Access.log iniciado'));
console.log(chalk.gray('Teclas: g=GET, p=POST, u=PUT, d=DELETE, a=Todos, h=Ajuda, q=Sair\n'));
replayAccessLog();
