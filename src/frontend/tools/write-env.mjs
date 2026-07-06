import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawApiUrl = process.env.PETSENSE_API_URL
  || process.env.NG_APP_API_URL
  || process.env.NEXT_PUBLIC_API_URL
  || process.env.API_URL
  || '/api';
const apiUrl = normalizeApiUrl(rawApiUrl);

function normalizeApiUrl(value) {
  const normalized = value.trim().replace(/\/$/, '');

  if (!normalized) {
    return '/api';
  }

  if (normalized === '/api' || normalized.endsWith('/api')) {
    return normalized;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return `${normalized}/api`;
  }

  return normalized;
}

mkdirSync(join(frontendRoot, 'public'), { recursive: true });
writeFileSync(
  join(frontendRoot, 'public', 'env.js'),
  `window.__PETSENSE_CONFIG__ = Object.freeze({ apiUrl: ${JSON.stringify(apiUrl)} });\n`,
  'utf8'
);
