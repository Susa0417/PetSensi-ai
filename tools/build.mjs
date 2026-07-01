import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(root, 'src', 'frontend');
const dotnet = process.platform === 'win32'
  ? join(root, '.dotnet', 'dotnet.exe')
  : join(root, '.dotnet', 'dotnet');

function npmCommand(args) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }

  if (process.platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...args]
    };
  }

  return { command: 'npm', args };
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(dotnet, ['build', join(root, 'PetSenseAI.sln'), '--no-restore']);
const web = npmCommand(['run', 'build']);
run(web.command, web.args, frontendDir);
