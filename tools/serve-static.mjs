import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'src/frontend/dist/petsense-ai-web/browser');
const port = Number(process.env.PORT ?? process.argv[3] ?? 4200);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon']
]);

createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url ?? '/', `http://${request.headers.host}`).pathname);
  const relativePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]/, '');
  let filePath = join(root, relativePath);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  response.writeHead(200, {
    'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
    'Cache-Control': extname(filePath) === '.html' ? 'no-store' : 'public, max-age=3600'
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`PetSense AI preview running at http://localhost:${port}`);
});
