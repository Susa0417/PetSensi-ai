import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(root, 'src', 'frontend');
const dotnet = process.platform === 'win32'
  ? join(root, '.dotnet', 'dotnet.exe')
  : join(root, '.dotnet', 'dotnet');
const children = [];
let shuttingDown = false;

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

function requestOk(url) {
  return new Promise((resolveRequest) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolveRequest(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.on('error', () => resolveRequest(false));
    request.setTimeout(1200, () => {
      request.destroy();
      resolveRequest(false);
    });
  });
}

function start(name, command, args, options = {}) {
  console.log(`[${name}] starting ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
    shell: false
  });

  children.push({ name, child });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[${name}] exited with ${reason}`);
    shutdown(code && code !== 0 ? code : 1);
  });

  return child;
}

function shutdown(code = 0) {
  shuttingDown = true;

  for (const { child } of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => process.exit(code), 400);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

if (!existsSync(dotnet)) {
  console.error(`Local .NET SDK was not found at ${dotnet}.`);
  console.error('Install/restore the local SDK first, then run npm run dev again.');
  process.exit(1);
}

if (!existsSync(join(frontendDir, 'node_modules'))) {
  console.error('Frontend dependencies are missing.');
  console.error('Run: npm --prefix src/frontend install');
  process.exit(1);
}

const apiRunning = await requestOk('http://localhost:5000/swagger');
const frontendRunning = await requestOk('http://localhost:4200');

if (apiRunning) {
  console.log('[api] already running at http://localhost:5000/swagger');
} else {
  start('api', dotnet, [
    'run',
    '--project',
    join('src', 'backend', 'PetSenseAI.API', 'PetSenseAI.API.csproj'),
    '--no-launch-profile'
  ], {
    cwd: root,
    env: {
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: 'http://localhost:5000',
      Database__Provider: 'Sqlite',
      ConnectionStrings__DefaultConnection: 'Data Source=petsense-dev.db'
    }
  });
}

if (frontendRunning) {
  console.log('[web] already running at http://localhost:4200');
} else {
  const web = npmCommand(['start']);
  start('web', web.command, web.args, { cwd: frontendDir });
}

console.log('');
console.log('PetSense AI dev URLs:');
console.log('  Web:     http://localhost:4200');
console.log('  API:     http://localhost:5000/swagger');
console.log('');

if (apiRunning && frontendRunning) {
  console.log('Both services were already running, so there is nothing new to hold open.');
  process.exit(0);
}
