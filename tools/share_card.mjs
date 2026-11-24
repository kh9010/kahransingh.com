#!/usr/bin/env node
// share_card.mjs: the picture a link to the home shows when it is shared (og:image), made from the home itself.
//
// A link preview is fetched by a crawler that runs no script, and the home's pair is chosen in the visitor's browser
// from the live sky, so no static tag can know it. This opens the real home in headless Chrome (the same /v4/stone.js,
// the same /v2/pick.js, the sky read at that moment for the place in /v2/place.json), asks it which photograph and
// poem it is showing, and draws a 1200x630 card of that pair: the photograph whole behind, his name, the poem's title
// and its opening lines, and the line that says where he is and the sky. (No line saying what the site is: it stood
// under his name, "A different photograph and a different poem every day", and he did not like it, 24 Nov.)
//
//   share/home.jpg    the card (index.html's og:image and twitter:image point at it)
//   share/home.json   what the card shows: the day, the poem, the photograph, how the pair was reached, when it was made
//
// It writes only when the pair (or the day) differs from share/home.json's, or the card's look has changed (LOOK,
// below: raise it with any change to what the card shows), so a run that finds the same pair touches nothing. The sky is asked for from here, with patience, and handed to the page. If it still cannot be read, today's card is
// kept as it is, and a card from an earlier day is redrawn with the day's kept pair; FORCE=1 draws whatever the page shows.
//
// Run: node tools/share_card.mjs            (CHROME=/path/to/chrome to choose the browser; FORCE=1; OUT=dir)
// It is run on a schedule by .github/workflows/share-card.yml, which commits the card when it changed.
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, createReadStream, mkdtempSync, rmSync, statSync } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..')
const OUT = path.resolve(process.env.OUT || path.join(ROOT, 'share')), FORCE = process.env.FORCE === '1'
const W = 1200, H = 630
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, ms = 60000) { const end = Date.now() + ms; let last
  for (;;) { try { const v = await fn(); if (v) return v; last = v } catch (e) { last = 'threw: ' + e.message }
    if (Date.now() > end) throw new Error(`timed out waiting for ${label} (last: ${JSON.stringify(last)})`); await sleep(100) } }

function findChrome() { // CHROME, then the headless shell the site's tests use, then whatever Chrome the machine has
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell')
  if (existsSync(base)) for (const v of readdirSync(base).sort().reverse()) for (const d of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-linux64']) { const p = path.join(base, v, d, 'chrome-headless-shell'); if (existsSync(p)) return p }
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) if (existsSync(p)) return p
  return null }

/* the site, served as Pages serves it (static files; a folder is its index.html) */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' }
let CARD = '' // the card's own page, held here and served at /__card (it is never written into the site)
const server = http.createServer((req, res) => { try { let u = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (u === '/__card') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(CARD) }
  if (u.endsWith('/')) u += 'index.html'
  const f = path.join(ROOT, path.normalize(u)); if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) } catch { res.writeHead(500); res.end() } })
await new Promise(r => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`

const chromePath = findChrome(); if (!chromePath) { console.error('no Chrome found (set CHROME)'); process.exit(2) }
const PROFILE = mkdtempSync(path.join(os.tmpdir(), 'share-')), port = await new Promise(r => { const s = http.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const chrome = spawn(chromePath, ['--headless', '--hide-scrollbars', '--no-first-run', '--use-mock-keychain', '--password-store=basic', ...(process.env.CI || (process.getuid && process.getuid() === 0) ? ['--no-sandbox'] : []), `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)

class CDP { constructor(ws) { this.ws = ws; this.id = 0; this.wait = new Map(); this.on = null; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && this.wait.has(m.id)) { const [res, rej] = this.wait.get(m.id); this.wait.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result) } else if (this.on) this.on(m) } }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.wait.set(id, [res, rej])) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value } }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()), 'Chrome')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws); await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

  /* 1. the home, as a visitor has it at this moment: which pair is it showing?
     The page gives the sky four seconds; from a shared machine the weather service can take longer or refuse the first try. So the page's
     own request for the sky is held here, asked again from Node with patience, and answered to the page with what came back: the page
     still builds its reading from the service's reply by its own code. */
  let skyUrl = null, skyBody = null, skyNote = 'the page asked for no sky'
  const b64 = t => Buffer.from(t).toString('base64'), cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
  cdp.on = m => { if (m.method !== 'Fetch.requestPaused') return; skyUrl = m.params.request.url
    cdp.send('Fetch.fulfillRequest', skyBody ? { requestId: m.params.requestId, responseCode: 200, responseHeaders: cors, body: b64(skyBody) } : { requestId: m.params.requestId, responseCode: 503, responseHeaders: cors, body: '' }).catch(() => {}) }
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const home = async () => { await cdp.send('Page.navigate', { url: BASE + '/' }); await waitFor(() => cdp.eval(`document.body && document.body.dataset.ready === 'yes' && !!window.HOME && !!HOME.world0 && !!HOME.ctx`), 'the home') }
  await home() // the first load only to learn what the page asks the weather service
  if (skyUrl) for (let k = 0; k < 5 && !skyBody; k++) { if (k) await sleep(4000 * k)
    try { const r = await fetch(skyUrl, { signal: AbortSignal.timeout(20000) }); if (r.ok) { const t = await r.text(); JSON.parse(t).current && (skyBody = t); skyNote = 'the sky was read on try ' + (k + 1) } else skyNote = 'the weather service answered ' + r.status } catch (e) { skyNote = 'the weather service could not be reached: ' + (e.cause && e.cause.code || e.name) } }
  console.log(skyNote)
  await cdp.eval(`(() => { try { sessionStorage.clear() } catch {} })()`); await home()
  const day = await cdp.eval(`(() => { const c = HOME.ctx, w = HOME.world0, line = (document.querySelector('#where .sent') || document.getElementById('where')).textContent.trim()
    return { date: c.iso, how: c.how, poem: c.poem.slug, title: c.poem.title, stanzas: c.stanzas, photo: c.photo.src, alt: c.photo.alt, caption: c.photo.caption, where: /^We.re in /.test(line) ? line : '', onStone: [w.poem, w.photo] } })()`)
  if (day.onStone[0] !== day.poem || day.onStone[1] !== day.photo) throw new Error('the stone is not showing the day\'s pair: ' + JSON.stringify(day.onStone))
  const LOOK = 2 // the card's design: 2 is without the line under his name
  const key = `${day.date} ${day.poem} ${day.photo}`, was = existsSync(path.join(OUT, 'home.json')) ? JSON.parse(readFileSync(path.join(OUT, 'home.json'), 'utf8')) : null
  // no sky: today's card, if there is one, is left as it is; a card from another day is redrawn with the day's kept pair, which is at least today's
  if (day.how !== 'live' && !FORCE && was && was.date === day.date) { console.log(`the sky could not be read (the pair would be the ${day.how} one): today's card is left as it is, ${was.poem}`); process.exit(0) }
  if (was && was.key === key && was.look === LOOK && existsSync(path.join(OUT, 'home.jpg')) && !FORCE) { console.log(`unchanged: ${day.title}, ${day.caption.split(' — ')[0]} (${day.date})`); process.exit(0) }

  /* 2. the card. The poem's opening: whole lines, as many as fit the measure, never a cut line. */
  const lines = day.stanzas.flat().map(l => l.trim()).filter(Boolean), open = []
  for (const l of lines) { if (open.length >= 4 || l.length > 64 || open.join(' ').length + l.length > 150) break; open.push(l) }
  if (!open.length && lines[0]) open.push(lines[0].length > 96 ? lines[0].slice(0, lines[0].lastIndexOf(' ', 92)) + ' …' : lines[0])
  const mono = /Monochrome/.test(day.caption || ''), place = (day.caption || '').split(' — ')[0]
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0d0c0b; color: #f3efe6; }
.ph { position: absolute; inset: 0; background: url("${BASE}${day.photo}") center / cover no-repeat; ${mono ? 'filter: grayscale(1) contrast(1.06) brightness(.94);' : ''} }
.shade { position: absolute; inset: 0; background: linear-gradient(to right, rgba(8,8,7,.9) 0%, rgba(8,8,7,.78) 38%, rgba(8,8,7,.28) 68%, rgba(8,8,7,.06) 100%), linear-gradient(to top, rgba(8,8,7,.55) 0%, rgba(8,8,7,0) 34%); }
.t { position: absolute; left: 64px; top: 54px; bottom: 50px; width: 690px; display: flex; flex-direction: column; }
.name { font: 500 30px/1 'Space Grotesk', sans-serif; letter-spacing: .04em; }
.poem { margin-top: auto; }
h1 { font: italic 400 ${day.title.length > 34 ? 46 : day.title.length > 22 ? 56 : 68}px/1.08 'Fraunces', Georgia, serif; letter-spacing: -.01em; margin-bottom: 20px; }
.l { font: 300 31px/1.34 'Fraunces', Georgia, serif; padding-left: 1em; text-indent: -1em; }
.foot { margin-top: 26px; display: flex; gap: 26px; align-items: baseline; font: 400 17px/1.3 'Space Grotesk', sans-serif; color: #c9c3b6; }
.foot i { font: italic 300 20px/1.3 'Fraunces', Georgia, serif; color: #ede7d9; }
.cap { position: absolute; right: 44px; bottom: 34px; font: 400 15px/1.3 'Space Grotesk', sans-serif; color: #c9c3b6; text-shadow: 0 1px 8px rgba(0,0,0,.7); }
</style></head><body>
<div class="ph"></div><div class="shade"></div>
<div class="t"><div class="name">kahran singh</div>
<div class="poem"><h1>${esc(day.title)}</h1>${open.map(l => `<div class="l">${esc(l)}</div>`).join('')}</div>
<div class="foot">${day.where ? `<i>${esc(day.where)}</i>` : ''}<span>kahransingh.com</span></div></div>
<div class="cap">${esc(place)}</div>
</body></html>`
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
  CARD = html; await cdp.send('Page.navigate', { url: BASE + '/__card' })
  await waitFor(() => cdp.eval(`document.readyState === 'complete' && !!document.querySelector('.poem')`), 'the card')
  await waitFor(() => cdp.eval(`document.fonts.ready.then(() => document.fonts.status === 'loaded' && [...document.fonts].filter(f => f.status === 'loaded').length >= 2)`), 'the fonts', 30000).catch(() => console.error('the fonts did not load: the card is drawn in the fallback faces'))
  await cdp.eval(`new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(i.naturalWidth); i.src = ${JSON.stringify(BASE + day.photo)} })`)
  const fits = await cdp.eval(`(() => { const t = document.querySelector('.t'), p = document.querySelector('.poem'), w = document.querySelector('.name'); return p.getBoundingClientRect().top >= w.getBoundingClientRect().bottom + 18 && t.scrollWidth <= t.clientWidth + 1 })()`)
  if (!fits) throw new Error('the card\'s words do not fit: ' + JSON.stringify({ title: day.title, open }))
  await sleep(300)
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 74, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } })
  mkdirSync(OUT, { recursive: true }); writeFileSync(path.join(OUT, 'home.jpg'), Buffer.from(shot.data, 'base64'))
  writeFileSync(path.join(OUT, 'home.json'), JSON.stringify({ key, look: LOOK, date: day.date, poem: day.poem, title: day.title, photo: day.photo, place, how: day.how, where: day.where, lines: open, made: new Date().toISOString() }, null, 1) + '\n')
  console.log(`share/home.jpg: ${day.title}, ${place} (${day.date}, ${day.how}); ${open.length} line${open.length === 1 ? '' : 's'}; ${Math.round(Buffer.from(shot.data, 'base64').length / 1024)} KB`)
  process.exit(0)
} catch (e) { console.error('share card: ' + (e.stack || e)); process.exit(1) }
