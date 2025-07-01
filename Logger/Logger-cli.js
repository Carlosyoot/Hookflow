import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import MuteStream from 'mute-stream';

const logFile = path.join(os.homedir(), 'Documents', 'webhook-redis', 'Webhook.log');
const exportFile = path.join(os.homedir(), 'Documents', 'webhook-redis', 'Webhook_filtered.log');

let cursor = 0;
let filterTag = null;
let filterDateType = null;
let filterDateRange = null;
let showingHelp = false;
let awaitingInput = false;

let rl = null;
let mutedOutput = null;

const MAX_REPLAY_LINES = 1000;

const tagColors = {
  '[SERVER]': chalk.hex('#ff66cc'),
  '[WORKER/ENVIO]': chalk.cyanBright,
  '[WORKER/RETRY]': chalk.cyanBright,
  '[WEBHOOK]': chalk.hex('#ebab34')
};

function extractDateFromLine(line) {
  const match = line.match(/\[(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : null;
}

function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

function isDateInRange(dateStr) {
  if (!filterDateType) return true;
  const [d, m, y] = dateStr.split('/');
  const date = new Date(`${y}/${m}/${d}`);

  const today = new Date();
  if (filterDateType === '1') return isSameDay(date, today);

  if (filterDateType === '2') {
    const sunday = new Date(today); sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday); saturday.setDate(sunday.getDate() + 6);
    return date >= sunday && date <= saturday;
  }

  if (filterDateType === '3') {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  if (filterDateType === '4' && filterDateRange) {
    return date >= filterDateRange.start && date <= filterDateRange.end;
  }

  return true;
}

function highlightLine(line) {
  const dateMatch = line.match(/\[(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}:\d{2})\]/);
  if (!dateMatch) return line;

  const fullDate = dateMatch[0];
  const time = dateMatch[2];
  let highlighted = line.replace(fullDate, chalk.yellow(`[${dateMatch[1]} `) + chalk.yellow(`${time}]`));

  Object.keys(tagColors).forEach(tag => {
    if (highlighted.includes(tag)) {
      highlighted = highlighted.replace(tag, tagColors[tag](tag));
    }
  });

  return highlighted;
}

function showActiveFilters() {
  let status = chalk.gray('[Filtros Ativos]');
  if (filterTag) status += chalk.white(`  TAG: `) + chalk.bold(filterTag);
  if (filterDateType === '1') status += chalk.white('  | DATA: ') + chalk.green('Hoje');
  else if (filterDateType === '2') status += chalk.white('  | DATA: ') + chalk.green('Semana');
  else if (filterDateType === '3') status += chalk.white('  | DATA: ') + chalk.green('Mês');
  else if (filterDateType === '4' && filterDateRange) {
    const start = filterDateRange.start.toLocaleDateString('pt-BR');
    const end = filterDateRange.end.toLocaleDateString('pt-BR');
    status += chalk.white('  | DATA: ') + chalk.magenta(`De ${start} até ${end}`);
  }
  console.log(status + '\n');
}

function printLine(line, saveToFile = false) {
  if (!line.trim()) return;
  const dateStr = extractDateFromLine(line);
  if (filterDateType && (!dateStr || !isDateInRange(dateStr))) return;
  if (filterTag && !line.includes(`[${filterTag}`)) return;

  const finalLine = highlightLine(line);
  console.log(finalLine);
  if (saveToFile) fs.appendFileSync(exportFile, stripAnsi(finalLine) + '\n');
}

function replayLogFromStart(saveToFile = false, callbackAfter = null) {
  fs.readFile(logFile, 'utf-8', (err, data) => {
    if (err) return;
    if (saveToFile) fs.writeFileSync(exportFile, '');
    if (!saveToFile) console.clear();
    showActiveFilters();

    const lines = data.split(/\r?\n/);
    lines.slice(-MAX_REPLAY_LINES).forEach(line => printLine(line, saveToFile));

    fs.stat(logFile, (err, stats) => {
      if (!err) cursor = stats.size;
      if (callbackAfter) callbackAfter();
    });
  });
}

function createReadlineWithMute(muted = false) {
  if (rl) rl.close();
  mutedOutput = new MuteStream();
  mutedOutput.pipe(process.stdout);
  if (muted) mutedOutput.mute();
  else mutedOutput.unmute();

  rl = readline.createInterface({
    input: process.stdin,
    output: mutedOutput
  });
}

function askDateRange() {
  console.clear();
  console.log(chalk.cyan('🔎 Filtro de data personalizada:'));
  console.log(chalk.gray('(Pressione ENTER em branco para cancelar)\n'));

  awaitingInput = true;
  process.stdin.setRawMode(false);
  createReadlineWithMute(false); 

  rl.question('Data início (dd/mm/yyyy): ', (startStrRaw) => {
    const startStr = startStrRaw.trim();
    if (!startStr) return cancelDateFilter();

    rl.question('Data fim (dd/mm/yyyy): ', (endStrRaw) => {
      const endStr = endStrRaw.trim();
      if (!endStr) return cancelDateFilter();

      const [d1, m1, y1] = startStr.split('/');
      const [d2, m2, y2] = endStr.split('/');

      const startDate = new Date(`${y1}/${m1}/${d1}`);
      const endDate = new Date(`${y2}/${m2}/${d2}`);

      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
        console.log(chalk.red('❌ Datas inválidas. Cancelando...'));
        return setTimeout(() => cancelDateFilter(), 1000);
      }

      filterDateType = '4';
      filterDateRange = { start: startDate, end: endDate };

      resetToLogMode();
    });
  });
}

function cancelDateFilter() {
  console.log(chalk.red('\n❌ Filtro de data personalizada cancelado.'));
  filterDateType = null;
  filterDateRange = null;

  setTimeout(() => resetToLogMode(), 1000);
}

function resetToLogMode() {
  if (rl) rl.close();
  awaitingInput = false;
  readline.emitKeypressEvents(process.stdin);
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  process.stdin.setRawMode(true);

  console.clear();
  replayLogFromStart();
}

fs.watchFile(logFile, { interval: 200 }, () => {
  if (!awaitingInput && !showingHelp) readNewLines();
});

function readNewLines() {
  fs.stat(logFile, (err, stats) => {
    if (err) return;
    if (stats.size < cursor) cursor = 0;
    const stream = fs.createReadStream(logFile, { start: cursor, end: stats.size });
    let buffer = '';

    stream.on('data', chunk => buffer += chunk.toString());
    stream.on('end', () => {
      const lines = buffer.split(/\r?\n/);
      lines.forEach(printLine);
      cursor = stats.size;
    });
  });
}

function showHelp() {
  console.clear();
  console.log(chalk.bold('🛠️ AJUDA - Teclas disponíveis:\n'));
  console.log(chalk.cyan(' s ') + '→ Filtro [SERVER]');
  console.log(chalk.cyan(' w ') + '→ Filtro [WORKER]');
  console.log(chalk.cyan(' e ') + '→ Filtro [WEBHOOK]');
  console.log(chalk.cyan(' a ') + '→ Mostrar tudo');
  console.log(chalk.cyan(' 1 ') + '→ Data: Hoje');
  console.log(chalk.cyan(' 2 ') + '→ Data: Semana (dom-sáb)');
  console.log(chalk.cyan(' 3 ') + '→ Data: Mês atual');
  console.log(chalk.cyan(' 4 ') + '→ Data personalizada');
  console.log(chalk.cyan(' 0 ') + '→ Remover filtro de data');
  console.log(chalk.cyan(' x ') + '→ Exportar log filtrado para .log');
  console.log(chalk.cyan(' h ') + '→ Mostrar ajuda');
  console.log(chalk.cyan(' q ') + '→ Sair\n');
  showingHelp = true;
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
rl = readline.createInterface({ input: process.stdin, output: process.stdout });

process.stdin.on('keypress', (_, key) => {
  if (awaitingInput) return;

  showingHelp = false;
  switch (key.name) {
    case 'q':
      console.log(chalk.gray('\nSaindo...'));
      fs.unwatchFile(logFile);
      process.exit(0);
    case 'h': showHelp(); break;
    case 's': filterTag = 'SERVER'; replayLogFromStart(); break;
    case 'w': filterTag = 'WORKER'; replayLogFromStart(); break;
    case 'e': filterTag = 'WEBHOOK'; replayLogFromStart(); break;
    case 'a': filterTag = null; replayLogFromStart(); break;
    case '1': case '2': case '3': filterDateType = key.name; replayLogFromStart(); break;
    case '0': filterDateType = null; filterDateRange = null; replayLogFromStart(); break;
    case '4':
      awaitingInput = true;
      process.stdin.setRawMode(false);
      rl.pause();
      setTimeout(() => askDateRange(), 10);
      return;
    case 'x':
      console.clear();
      console.log(chalk.gray('[Exportando para Webhook_filtered.log...]'));
      replayLogFromStart(true, () => {
        console.clear();
        console.log(chalk.green('[Exportação concluída ✔]'));
        replayLogFromStart();
      });
      break;
  }
});

console.clear();
console.log(chalk.blueBright('🔍 Visualizador de Log iniciado — pressione "h" para ajuda'));
replayLogFromStart();
