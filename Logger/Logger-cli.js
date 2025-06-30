import fs from 'fs';
import os from 'os';
import path from 'path';
import blessed from 'blessed';
import chokidar from 'chokidar';

const logFile = path.join(os.homedir(), 'Documents', 'webhook-redis', 'Webhook.log');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Logs - Webhook'
});

screen.program.enableMouse();  // ativa mouse no terminal
process.stdin.resume();        // garante que stdin está ativo

// Debug - para ver se teclas chegam
screen.on('keypress', (ch, key) => {
  // Para debugar, imprime tecla no console externo (terminal que executa o script)
  // console.log(`Tecla: ${ch} - ${key?.name}`);
});

const logBox = blessed.log({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  scrollable: true,
  alwaysScroll: true,
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  scrollbar: {
    ch: ' ',
    inverse: true
  }
});

const helpBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  tags: true,
  align: 'left',
  valign: 'top',
  keys: false,    // remove keys para evitar conflito
  mouse: true,
  scrollable: true,
  hidden: true,
  style: {
    fg: 'white',
    bg: 'black'
  },
  content: `
{bold}COMANDOS DISPONÍVEIS{/bold}
────────────────────────────

{cyan-fg}Q{/cyan-fg}  → Sair da aplicação
{cyan-fg}H{/cyan-fg}  → Alternar entre log e ajuda
{cyan-fg}J/K{/cyan-fg}  → Scroll para cima/baixo
{cyan-fg}Mouse{/cyan-fg}  → Navegação com scroll

{white-fg}Pressione H novamente para retornar aos logs{/gray-fg}
`
});

screen.append(logBox);
screen.append(helpBox);

// Garante que o foco inicial está no logBox
logBox.focus();

let showingHelp = false;

screen.key(['h', 'H'], () => {
  showingHelp = !showingHelp;
  if (showingHelp) {
    logBox.hide();
    helpBox.show();
  } else {
    helpBox.hide();
    logBox.show();
    logBox.focus();
  }
  screen.render();
});

screen.key(['q', 'C-c'], () => process.exit(0));

let fileSize = 0;

const watchLog = () => {
  try {
    const stat = fs.statSync(logFile);
    if (stat.size < fileSize) fileSize = 0;

    const stream = fs.createReadStream(logFile, {
      encoding: 'utf8',
      start: fileSize
    });

    stream.on('data', data => {
      fileSize += data.length;
      logBox.log(data.trim());
      screen.render();
    });
  } catch (err) {
    logBox.log(`Erro ao ler arquivo: ${err.message}`);
  }
};

chokidar.watch(logFile).on('change', watchLog);
watchLog();
