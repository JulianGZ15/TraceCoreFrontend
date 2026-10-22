import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const root = resolve('dist/TraceCore/browser');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.html': 'text/html', '.json': 'application/json' };
createServer(async (request, response) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4300').pathname));
    if (path !== root && !path.startsWith(root + sep)) { response.writeHead(404).end(); return; }
    const extension = extname(path);
    const body = await readFile(extension ? path : resolve(root, 'index.html'));
    response.writeHead(200, { 'Content-Type': types[extension] ?? 'text/html', 'Cache-Control': 'no-store' }).end(body);
  } catch { response.writeHead(404).end(); }
}).listen(4300, '127.0.0.1');
