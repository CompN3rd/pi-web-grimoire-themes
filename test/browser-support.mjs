import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');

// Isolated loopback fixture server: no Python startup race or fixed-port collisions.
export async function serve(root = new URL('../', import.meta.url), files = new Map()) {
  const directory = fileURLToPath(root);
  const prefix = '/nested/';
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://fixture.invalid').pathname);
      if (!pathname.startsWith(prefix)) throw Error('outside prefix');
      const name = pathname.slice(prefix.length);
      const path = resolve(directory, name.endsWith('/') ? `${name}index.html` : name);
      if (relative(directory, path).startsWith('..')) throw Error('outside root');
      const body = files.get(name) ?? await readFile(path);
      res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}${prefix}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    },
  };
}
