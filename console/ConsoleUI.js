import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function OpenConsole() {
    const exePath = path.resolve(__dirname, 'ConsoleUi.exe');

    spawn('cmd.exe', ['/c', 'start', '', exePath], {
        detached: true,
        stdio: 'ignore'
    }).unref();
}
