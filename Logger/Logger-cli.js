import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const logPath = path.join(os.homedir(), 'Documents', 'webhook-redis', 'Complete-log.log');

spawn('wt.exe', [
  'powershell', '-NoExit', '-Command', `Get-Content -Path "${logPath}" -Wait`
], {
  detached: true,
  shell: true,
  stdio: 'ignore'
});
