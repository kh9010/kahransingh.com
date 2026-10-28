#!/usr/bin/env node
// Dev only: serves the site root and writes studies/NN/defaults.json from the ?tune panel.
// node studies/tune-server.cjs → http://127.0.0.1:8792/studies/06/?tune
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = +process.env.PORT || 8792;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/__tune') {
    const n = u.searchParams.get('study');
    if (!/^\d\d$/.test(n || '')) { res.writeHead(400); return res.end(); }
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        const o = JSON.parse(body);
        if (!o || typeof o !== 'object' || Array.isArray(o) || !Object.values(o).every((v) => typeof v === 'string' || typeof v === 'number')) throw 0;
        fs.writeFileSync(path.join(ROOT, 'studies', n, 'defaults.json'), JSON.stringify(o, null, 2) + '\n');
        res.writeHead(204); res.end();
      } catch { res.writeHead(400); res.end(); }
    });
    return;
  }
  let p = path.normalize(decodeURIComponent(u.pathname)); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORT}/studies/`));
