// node studies/server.cjs → http://127.0.0.1:8791/studies/
// Serves the repo as static files and keeps study 01's picks in studies/01/picks.json.
// PORT=0 picks a free port and prints it; PICKS=<path> writes picks elsewhere (verify uses a temp file).
const http = require('http'), fs = require('fs'), path = require('path')
const ROOT = path.resolve(__dirname, '..')
const picksFile = n => path.resolve(process.env.PICKS || path.join(__dirname, n, 'picks.json'))
const pileFile = n => path.join(__dirname, n, 'pile.json')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.md': 'text/plain; charset=utf-8' }
const TAGS = ['mechanical', 'linguistic', 'composition']

const readPicks = n => { try { return JSON.parse(fs.readFileSync(picksFile(n), 'utf8')) } catch { return {} } }
function valid(id, rec, ids) {
  if (typeof id !== 'string' || !ids.has(id)) return false
  if (rec === null) return true
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return false
  if (!['keep', 'skip', 'trim'].includes(rec.v)) return false
  if (!Array.isArray(rec.tags) || rec.tags.some(t => !TAGS.includes(t))) return false
  if (rec.note !== undefined && (typeof rec.note !== 'string' || rec.note.length > 500)) return false
  return Object.keys(rec).every(k => ['v', 'tags', 'note', 'at', 'name', 'url'].includes(k))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const origin = req.headers.origin
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) { res.writeHead(403); return res.end() }
  const api = /^\/api\/study-(01|02)\/(picks|pick)$/.exec(url.pathname), N = api && api[1]
  if (api && api[2] === 'picks' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    return res.end(JSON.stringify(readPicks(N)))
  }
  if (api && api[2] === 'pick' && req.method === 'POST') {
    let body = ''
    req.on('data', d => { body += d; if (body.length > 4096) req.destroy() })
    req.on('end', () => {
      let msg; try { msg = JSON.parse(body) } catch { res.writeHead(400); return res.end() }
      const ids = new Set(JSON.parse(fs.readFileSync(pileFile(N), 'utf8')).items.map(p => p.id))
      if (!msg || !valid(msg.id, msg.rec, ids)) { res.writeHead(400); return res.end() }
      const picks = readPicks(N)
      if (msg.rec === null) delete picks[msg.id]; else picks[msg.id] = msg.rec
      const sorted = Object.fromEntries(Object.keys(picks).sort().map(k => [k, picks[k]]))
      const PICKS = picksFile(N); fs.writeFileSync(PICKS + '.tmp', JSON.stringify(sorted, null, 1) + '\n'); fs.renameSync(PICKS + '.tmp', PICKS)
      res.writeHead(204); res.end()
    })
    return
  }
  let p = decodeURIComponent(url.pathname)
  if (p === '/studies/02/') p = '/studies/02/live.html'
  if (p === '/studies/01/') p = '/studies/01/live.html' // live is the default; index.html is the clip version
  if (p.endsWith('/')) p += 'index.html'
  const file = path.join(ROOT, p)
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(404); return res.end() }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end() }
    const type = TYPES[path.extname(file)] || 'application/octet-stream'
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range)
    if (range) {
      const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : st.size - 1
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 })
      return fs.createReadStream(file, { start, end }).pipe(res)
    }
    res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size })
    fs.createReadStream(file).pipe(res)
  })
})
server.listen(process.env.PORT === undefined ? 8791 : +process.env.PORT, '127.0.0.1', () => {
  console.log('http://127.0.0.1:' + server.address().port + '/studies/')
})
