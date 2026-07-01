import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = process.env.PETSENSE_API_URL
  || process.env.NG_APP_API_URL
  || process.env.API_URL
  || '/api';

mkdirSync(join(frontendRoot, 'public'), { recursive: true });
writeFileSync(
  join(frontendRoot, 'public', 'env.js'),
  `window.__PETSENSE_CONFIG__ = Object.freeze({ apiUrl: ${JSON.stringify(apiUrl.replace(/\/$/, ''))} });\n`,
  'utf8'
);

