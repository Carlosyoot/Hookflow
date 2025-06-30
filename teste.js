import { spawn } from 'child_process';
const child = spawn('wt.exe', [
  'powershell', '-NoExit', '-Command', `node "./Logger/Logger-cli.js"`
], {
  detached: true,
  stdio: 'ignore',
  shell: true
});
child.unref();
