import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve('dist/TraceCore/browser');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.html': 'text/html' };
createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://127.0.0.1:4300').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(404).end(); return; }
    const extension = extname(path);
    const file = extension ? path : resolve(root, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extension] ?? 'text/html' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(4300, '127.0.0.1');
