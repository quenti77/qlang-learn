// Serves site/ (see build-versions.mjs) as GitHub Pages does: index.html for a folder, 404.html for the rest.
//   npm run serve:versions            # http://127.0.0.1:4322/  (PORT=… to change it)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = Number(process.env.PORT || 4322);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
};

const find = (pathname) => {
  const file = path.normalize(path.join(site, decodeURIComponent(pathname)));
  if (!file.startsWith(site)) return null;
  for (const candidate of [file, path.join(file, 'index.html')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
};

http
  .createServer((req, res) => {
    const file = find(new URL(req.url, 'http://x').pathname);
    const found = file ?? path.join(site, '404.html');
    res.writeHead(file ? 200 : 404, { 'content-type': types[path.extname(found)] ?? 'application/octet-stream' });
    fs.createReadStream(found).pipe(res);
  })
  .listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
