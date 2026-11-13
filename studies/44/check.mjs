#!/usr/bin/env node
// Study 44 check: the card says there is more. On a phone (390x844, and 844x390) every answer (?v= a b c d) opens an idea and the chain as the
// live home's card, and:
//   cue       it shows exactly while there is more below and is gone at the end, read after every real touch drag down to the end and back
//             (a b c: drawn in the card's cut; d: the words lift once as it opens, only when there is more); b's measure shortens as you read;
//             c's next line shows beneath its seam
//   contrast  the cue's own pixels stand at least 3:1 against the card's ground under them (rendered pixels), for every idea's hue and the chain
//   words     no words in the cue, the card's only text outside its words is its close mark; no instruction text on the page; no system name
//   still     once the card has settled nothing moves: two frames a second apart are identical, at its start and at its end
//   page      a: a touch on its facet, its key (Shift+Tab from the card, then Enter) and Page Down each turn one whole-line screenful (no line
//             sliced at the top or the foot, the first line not wholly seen before is the new top) to the end; target 44px; a visible focus ring
//   read      the card's words still read at AA against the pixels behind them, body text at least 16px
//   reduce    under reduced motion the card crossfades and nothing of the cue moves (d does not lift)
//   rest      at rest the study is the live home (served from git, LIVE_REF, default d25ea66), pixel for pixel, at 390x844, 844x390, 1440x900
//   desk      at 1440x900 an idea and the chain open exactly as on the live home, no card, no cue
// Run: node studies/44/check.mjs   (ANSWERS=a,b · KINDS=idea,chain · GROUPS=static,rest,open,landscape,hues,reduce,desk · SHOTS=dir · MUTATE=<name> · QUIET=1)
// Screenshots go to $SHOTS (default: a temp folder), named <answer>-<kind>-<top|end>[-844x390].png.
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, createReadStream, rmSync, mkdtempSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = process.env.SHOTS || path.join(os.tmpdir(), 's44-shots'); mkdirSync(SHOTS, { recursive: true })
const ANSWERS = (process.env.ANSWERS || 'a,b,c,d').split(','), KINDS = (process.env.KINDS || 'idea,chain').split(',')
const GROUPS = new Set((process.env.GROUPS || 'static,rest,open,landscape,hues,reduce,desk').split(','))
const LIVE_REF = process.env.LIVE_REF || 'd25ea66' // the live home as it is on main when the study was cut (12 Nov)
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8')
const BANNED = /day[\s-]?flow|raw\.db/i

/* ---------- MUTATE: each changes only the served bytes, never a file ---------- */
const MUT = process.env.MUTATE || ''
const MUTS = {
  end: ['/studies/44/stone.js', s => s.replace('more = below > 1, frac = more ? below / Math.max(1, last) : 0', 'more = true, frac = .3')], // the cue stays at the end
  none: ['/studies/44/stone.js', s => s.replace("if (!CARD.open || !G || !el || !cardMode()) { hideBtn(); return }", "if (true) { hideBtn(); return }").replace("if (WAY !== 'd' || reduce()", "if (true || reduce()")], // never says there is more
  faint: ['/studies/44/stone.js', s => s.replace('function cueInk(k0) {', 'function cueInk(k0) { return (CARD.groundRgb || GROUND).map(v => Math.round(v * 1.3 + 3));')], // the cue in the ground's own colour, barely there
  words: ['/studies/44/stone.js', s => s.replace('aria-label="next lines" hidden></button>', 'aria-label="next lines" hidden>more</button>')], // a word in the cue
  moves: ['/studies/44/stone.css', s => s + '\n#card svg.cut, #card .card-slot > * { animation: m44 1.37s linear infinite; } @keyframes m44 { 50% { opacity: .6; } }'], // something breathes at rest
  page: ['/studies/44/stone.js', s => s.replace('let top = Math.floor(next[0])', 'let top = Math.floor(next[0]) + 9')], // a page lands mid-line
  key: ['/studies/44/stone.js', s => s.replace('<button class="card-more" type="button"', '<button class="card-more" tabindex="-1" type="button"').replace("if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey))", "if (false)")], // no way in by keyboard
  ring: ['/studies/44/stone.css', s => s.replace('#card .card-more:focus-visible { outline: 1.5px solid var(--ink-on); outline-offset: -3px; }', '#card .card-more:focus-visible { outline: none; }')],
  target: ['/studies/44/stone.css', s => s.replace('#card .card-more { position: absolute; z-index: 3; width: 44px; height: 44px;', '#card .card-more { position: absolute; z-index: 3; width: 26px; height: 26px;')],
  reduce: ['/studies/44/stone.js', s => s.replace("if (WAY !== 'd' || reduce() || !CARD.open", "if (WAY !== 'd' || !CARD.open")], // d lifts under reduced motion
  nolift: ['/studies/44/stone.js', s => s.replace("if (WAY !== 'd' || reduce()", "if (true || reduce()")], // d never lifts
  measure: ['/studies/44/stone.js', s => s.replace('points: polyPts(part(Q, frac))', 'points: polyPts(part(Q, .5))')], // b's lit rim not driven by what is below
  glimpse: ['/studies/44/defaults.json', s => s.replace('"cue-c-veil": "0.55"', '"cue-c-veil": "1"')], // c: nothing shows beneath the seam
  small: ['/studies/44/defaults.json', s => s.replace('"card-body-px": "16"', '"card-body-px": "13"')],
  restlive: ['/studies/44/defaults.json', s => s.replace('"seam-px": "2.2"', '"seam-px": "2.6"')],
  desk: ['/studies/44/stone.js', s => s.replace("const cardMode = () => phone() || low()", "const cardMode = () => true")],
  name: ['/studies/44/stone.js', s => s.replace("add('polygon', { class: 'cue-facet'", "gq.append(Object.assign(document.createElementNS(SVGNS, 'text'), { textContent: 'day-flow' })); add('polygon', { class: 'cue-facet'")],
}
if (MUT && !MUTS[MUT]) { console.error('unknown MUTATE ' + MUT + '; one of ' + Object.keys(MUTS).join(' ')); process.exit(2) }
let mutHit = false
const serve = (u, s) => { if (MUT && MUTS[MUT][0] === u) { const t = MUTS[MUT][1](s); if (t !== s) mutHit = true; return t } return s }
const live = f => { try { return execFileSync('git', ['show', `${LIVE_REF}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 }) } catch { return null } }

/* ---------- static ---------- */
const page = read('studies/44/index.html'), stone = read('studies/44/stone.js'), css = read('studies/44/stone.css'), defaults = JSON.parse(read('studies/44/defaults.json'))
if (GROUPS.has('static')) {
  const body = /<body>([\s\S]*?)<noscript>/.exec(page)[1].replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems × v3 v2 v1', 'no instruction text: the page\'s own words are the name, the way out, the chain\'s close mark and the switch', body)
  const made = (stone.match(/innerHTML: '([^']*)'/) || [])[1] || '', madeText = made.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(madeText === '×' && !/<text|textContent = '[^']/.test(stone.slice(stone.indexOf('/* ---------- 44:'), stone.indexOf('function cardPose'))), 'the card the script makes carries no word: its one mark is ×, and the cue code writes no text', madeText)
  const src = page + '\n' + stone + '\n' + css, unread = Object.keys(defaults).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(src) && !src.includes(`var(--${k}`))
  check(!unread.length && ['a', 'b', 'c', 'd'].includes(defaults['cue-way']), `every dial is read (${Object.keys(defaults).length}), the default answer is one of the four (${defaults['cue-way']})`, unread.join(', '))
  const L = JSON.parse(live('v3/defaults.json')), served = JSON.parse(serve('/studies/44/defaults.json', JSON.stringify(defaults, null, 2) + '\n')), drift = Object.keys(L).filter(k => served[k] !== L[k])
  check(!drift.length && Object.keys(served).filter(k => !(k in L)).every(k => k.startsWith('cue-')), `the live home's ${Object.keys(L).length} dials are the live values; the study adds only cue- dials`, drift.join(', '))
  check(!BANNED.test(page.replace(/<!--[\s\S]*?-->/g, '')) && !BANNED.test(serve('/studies/44/stone.js', stone).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')), 'no system name in the study\'s served page or script')
}

/* ---------- PNG, decoded here ---------- */
function png(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = []
  while (p < buf.length) { const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('png: only 8-bit, not interlaced') } else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break; p += 12 + len }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error('png: colour type ' + ct)
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0
      line[x] = (line[x] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (() => { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c })() : 0)) & 255 }
    for (let x = 0; x < w; x++) { out[(y * w + x) * 4] = line[x * bpp]; out[(y * w + x) * 4 + 1] = line[x * bpp + 1]; out[(y * w + x) * 4 + 2] = line[x * bpp + 2]; out[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255 }
    prev = line }
  return { w, h, d: out } }
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, lum = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
const mix = (top, a, bot) => [0, 1, 2].map(j => top[j] * a + bot[j] * (1 - a))
let VPW = 390
function diff(A, B, box) {
  const s = A.w / VPW, [x0, y0, x1, y1] = box ? [Math.max(0, Math.floor(box[0] * s)), Math.max(0, Math.floor(box[1] * s)), Math.min(A.w, Math.ceil((box[0] + box[2]) * s)), Math.min(A.h, Math.ceil((box[1] + box[3]) * s))] : [0, 0, A.w, A.h]
  let n = 0, max = 0, first = null
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * A.w + x) * 4, m = Math.max(Math.abs(A.d[k] - B.d[k]), Math.abs(A.d[k + 1] - B.d[k + 1]), Math.abs(A.d[k + 2] - B.d[k + 2])); if (m > 2) { n++; if (!first) first = [x / s | 0, y / s | 0] } if (m > max) max = m }
  return { n, max, first } }

function diffIn(A, B, poly) { // as diff, only inside the card's own cut (its sheared corners show the stone, which is the live home's)
  const s = A.w / VPW, xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), inP = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
  let n = 0, max = 0, first = null
  for (let y = Math.max(0, Math.floor(Math.min(...ys) * s)); y < Math.min(A.h, Math.ceil(Math.max(...ys) * s)); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs) * s)); x < Math.min(A.w, Math.ceil(Math.max(...xs) * s)); x++) {
    const X = x / s, Y = y / s; if (![[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].every(([u, v]) => inP(X + u, Y + v))) continue; /* 2px in from the cut: its antialiased edge is half stone */ const k = (y * A.w + x) * 4, m = Math.max(Math.abs(A.d[k] - B.d[k]), Math.abs(A.d[k + 1] - B.d[k + 1]), Math.abs(A.d[k + 2] - B.d[k + 2])); if (m > 2) { n++; if (!first) first = [x / s | 0, y / s | 0] } if (m > max) max = m }
  return { n, max, first } }

/* ---------- in Chrome ---------- */
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
function findShell() { if (process.env.CHROME) return process.env.CHROME; const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p } return null }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value } }

const shell = findShell()
if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 's44-'))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' }
const LIVE = new Map() // the live home's own files, from git: other work in this checkout does not move what "live" means
const server = http.createServer((req, res) => { const u0 = decodeURIComponent(new URL(req.url, 'http://x').pathname), u = u0.endsWith('/') ? u0 + 'index.html' : u0
  const type = TYPES[path.extname(u).toLowerCase()] || 'application/octet-stream'
  if (u === '/index.html' || u.startsWith('/v3/')) { if (!LIVE.has(u)) LIVE.set(u, live(u.slice(1))); const b = LIVE.get(u); if (!b) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); return res.end(b) }
  const f = path.join(ROOT, u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' })
  if (/^\/studies\/44\//.test(u) && /\.(html|js|json|css)$/.test(u)) return res.end(serve(u, readFileSync(f, 'utf8')))
  createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup); process.on('SIGINT', () => process.exit(130))
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, drags = 0, pages = 0, measured = 0, worst = Infinity, worstAt = '', minBody = Infinity, cueWorst = Infinity, cueWorstAt = '', cueBest = 0, cueBestAt = ''
const SAWTEXT = []

const PIN = Date.UTC(2026, 10, 10, 1, 40)
const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-09T06:36'], sunset: ['2026-11-09T16:43'] } }

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' ')) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {}
    window.__T = []; document.addEventListener('home:track', e => window.__T.push(JSON.parse(JSON.stringify(e.detail)))) })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }

  let VP
  const view = async ([w, h, mobile], reduce = false) => { VP = { w, h, mobile }; VPW = w
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 })
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] }) }
  const open = async (url, still = true) => { loads++; await cdp.send('Page.navigate', { url: BASE + url })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!window.HOME && !!HOME.world && HOME.at === 'stone' && HOME.dealt`), 'page ' + url, 300)
    if (still) await cdp.eval('HOME.still = true')
    await sleep(900) }
  const study = (way, q = '') => `/studies/44/index.html?v=${way}${q}`
  const shotBuf = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  const shot = async name => { const b = await shotBuf(); writeFileSync(path.join(SHOTS, name), b); return b }
  const tap = async ([x, y]) => {
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(40); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) }
    await sleep(120) }
  const KEYS = { Escape: 27, Enter: 13, Tab: 9, PageDown: 34 }
  const key = async (k, mods = 0) => { const text = k === 'Enter' ? '\r' : undefined
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: KEYS[k] || 0, modifiers: mods, text }); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: KEYS[k] || 0, modifiers: mods }); await sleep(80) }
  const card = () => cdp.eval('HOME.card')
  const settle = async (label, open = true) => waitFor(async () => { const c = await card(); return open ? c.open && c.phase === 'open' : !c.open && c.phase === null && !c.on }, label + (open ? ' to open' : ' to close'), 120)
  const liftDone = () => waitFor(async () => { const c = await card(); return !c.cue || !c.cue.lift || c.cue.lift.done }, 'the lift to end', 60)
  const quiet = async () => { let last = null; for (let i = 0; i < 40; i++) { const t = await cdp.eval(`HOME.card.scroll ? HOME.card.scroll.top : -1`); if (t === last) return t; last = t; await sleep(90) } return last } // the scroller has stopped
  const rest = async (asLive = false) => {
    if (!asLive) { const v = await cdp.eval(`(() => { const r = document.querySelector('.vs [aria-current]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`)
      if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: v[0], y: v[1] }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
      else await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: v[0], y: v[1] }) }
    await waitFor(() => cdp.eval(`HOME.phase === 'resolved' || HOME.phase === 'none'`), 'the line resolved', 80)
    if (!asLive) await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(1300)
    await cdp.eval('HOME.ground()'); await sleep(250); const b = await shotBuf(), P = png(b); P.raw = b; return P }
  const sameRest = (A, B, label) => { const d = diff(A, B); check(d.n <= 40, `${label}: the rest state after is the rest state before`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) }
  async function opener(kind, k = 0) {
    if (kind === 'idea') { const x = await cdp.eval(`HOME.tapIdea(${k})`); return { pt: x.pt, i: x.i } }
    const r = await cdp.eval(`(() => { const r = document.querySelector('#where').getBoundingClientRect(); return [r.left + Math.min(60, r.width / 2), r.top + r.height / 2] })()`); return { pt: r, i: -1 } }
  async function openCard(kind, label, k = 0) { const o = await opener(kind, k); await tap(o.pt); await settle(label); if (kind === 'chain') await sleep(3200); await liftDone(); await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(300); return card() }
  const scroller = `document.querySelector('.card-slot > *')`
  const state = () => cdp.eval(`(() => { const e = ${scroller}, c = HOME.card, g = document.querySelector('#card g.cue'), b = document.querySelector('#card .card-more')
    const r0 = e.getBoundingClientRect().top, wk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let last = 0; for (let n; (n = wk.nextNode());) if (n.data.trim()) { const q = document.createRange(); q.selectNodeContents(n); for (const b of q.getClientRects()) if (b.height) last = Math.max(last, b.bottom - r0 + e.scrollTop) }
    const rim = g ? [...g.querySelectorAll('.cue-rim')].reduce((t, p) => t + p.getTotalLength(), 0) : 0
    return { rim, top: e.scrollTop, room: e.clientHeight, height: e.scrollHeight, more: last - e.scrollTop - e.clientHeight > 1, cue: c.cue, drawn: g ? g.childElementCount : 0, btn: !b.hidden && b.getClientRects().length > 0 } })()`)
  const shownNow = s => s.cue && s.cue.way === 'd' ? false : !!(s.cue && s.cue.shown) && s.drawn > 0
  async function drag(dir = 1) { drags++; const mid = await cdp.eval(`(() => { const r = ${scroller}.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.height] })()`)
    await cdp.send('Input.synthesizeScrollGesture', { x: mid[0], y: mid[1], yDistance: -dir * Math.round(mid[2] * .45), gestureSourceType: VP.mobile ? 'touch' : 'mouse', speed: 1600, preventFling: true }); await quiet(); await sleep(60) }
  async function readCard(label) { // AA against the pixels, sizes, nothing showing through (Study 43's measure)
    const T = await cdp.eval('HOME.cardTexts()'); SAWTEXT.push(...T.map(t => t.t))
    await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'clear44'; s.textContent = '#card, #card * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; border-bottom-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }'; document.head.append(s) })()`)
    await sleep(120); const A = png(await shotBuf())
    await cdp.eval(`document.getElementById('clear44').remove()`); await sleep(80)
    const s = A.w / VPW, bad = [], small = []
    for (const t of T) { const ink = t.color, a = (ink[3] ?? 1) * t.op, px = t.px * (Math.abs(t.z - 1) > .001 ? t.z : 1)
      if (t.body && px < 15.95) small.push(`${t.t.slice(0, 30)} ${px.toFixed(1)}px`); if (t.body) minBody = Math.min(minBody, px)
      for (const r of t.rects) { const ls = []; const x0 = Math.floor(r[0] * s), y0 = Math.floor(r[1] * s), x1 = Math.ceil((r[0] + r[2]) * s), y1 = Math.ceil((r[1] + r[3]) * s)
        for (let y = Math.max(0, y0); y < Math.min(A.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(A.w, x1); x++) { const k = (y * A.w + x) * 4; ls.push([lum([A.d[k], A.d[k + 1], A.d[k + 2]]), A.d[k], A.d[k + 1], A.d[k + 2]]) }
        if (!ls.length) continue; ls.sort((p, q) => p[0] - q[0]); const bg = ls[Math.min(ls.length - 1, Math.floor(ls.length * .99))].slice(1), cr = ratio(mix(ink, a, bg), bg); measured++
        if (cr < worst) { worst = cr; worstAt = `${label} “${t.t.slice(0, 28)}”` } if (cr < 4.5) bad.push(`“${t.t.slice(0, 26)}” ${cr.toFixed(2)}:1`) } }
    check(T.length > 0 && !bad.length, `${label}: every text in the card (${T.length}) reads at AA against the pixels behind it`, bad.slice(0, 4).join(' | '))
    check(!small.length, `${label}: body text at least 16px`, small.slice(0, 4).join(' | ')) }
  async function cueContrast(label, need = true) { // the cue's own pixels against the card's ground under them: shown, then hidden, the same frame otherwise
    const A = png(await shotBuf())
    await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'hide44'; s.textContent = '#card g.cue { visibility: hidden !important; }'; document.head.append(s) })()`); await sleep(120)
    const B = png(await shotBuf()); await cdp.eval(`document.getElementById('hide44').remove()`); await sleep(80)
    const c = await card(), gr = (/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c.ground.split('),').pop()) || []).slice(1).map(Number), [x, y, w, h] = c.rect, s = A.w / VPW, R = []
    for (let py = Math.max(0, Math.floor(y * s)); py < Math.min(A.h, Math.ceil((y + h) * s)); py++) for (let px = Math.max(0, Math.floor(x * s)); px < Math.min(A.w, Math.ceil((x + w) * s)); px++) {
      const k = (py * A.w + px) * 4, a = [A.d[k], A.d[k + 1], A.d[k + 2]], b = [B.d[k], B.d[k + 1], B.d[k + 2]]
      if (Math.max(...a.map((v, j) => Math.abs(v - b[j]))) <= 2) continue // not the cue
      if (gr.length === 3 && ratio(b, gr) > 1.15) continue // the cue over words or the rim: only its pixels over plain ground are measured
      R.push(ratio(a, gr.length === 3 ? gr : b)) }
    R.sort((p, q) => p - q); const p90 = R.length ? R[Math.floor(R.length * .9)] : 0
    if (!need) return { n: R.length, p90 }
    if (R.length) { if (p90 < cueWorst) { cueWorst = p90; cueWorstAt = label } if (p90 > cueBest) { cueBest = p90; cueBestAt = label } }
    check(R.length >= 20 && p90 >= 3, `${label}: the cue stands against the card's ground, ${p90.toFixed(2)}:1 (90th percentile of its ${R.length} pixels over plain ground)`, `${R.length} pixels, ${p90.toFixed(2)}:1`)
    return { n: R.length, p90 } }
  async function still(label) { // two frames a second apart, the card open and settled (the light that follows a finger held where it starts, as the live check holds it)
    await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(400); const c = await card()
    const A = png(await shotBuf()); await sleep(1000); const B = png(await shotBuf()), d = diffIn(A, B, c.poly)
    check(d.n === 0, `${label}: nothing in the card moves at rest (two frames a second apart identical over the card)`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) }
  let goneN = 0
  async function cueGone(label) { // at the end the cue is gone from the rendered pixels too
    await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(400); const r = await cueContrast(label, false); goneN = r.n; return r.n === 0 }
  async function wholeLines() { return cdp.eval(`(() => { const e = ${scroller}, top = e.getBoundingClientRect().top, st = e.scrollTop, room = e.clientHeight, L = []
    const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.height) L.push([q.top - top + st, q.bottom - top + st]) } else n.childNodes.forEach(walk) }
    walk(e); const vis = L.filter(([t, b]) => b > st + .5 && t < st + room - .5)
    return { st, room, sliced: vis.filter(([t, b]) => t < st - 1 || b > st + room + 1).length, first: vis.length ? Math.min(...vis.map(([t]) => t)) : null, firstUnseen: (L.filter(([t, b]) => b > st + room + .5).sort((a, b) => a[0] - b[0])[0] || [null])[0], n: vis.length } })()`) }
  async function paging(label, via) { // a: from the start, one whole-line screenful at a time to the end
    await cdp.eval('HOME.cardResnap()'); await sleep(200); let ok = true, why = '', n = 0
    for (; n < 30; n++) { const s0 = await state(); if (!s0.more) break; const w0 = await wholeLines(); pages++
      if (via === 'tap') { const b = await cdp.eval(`(() => { const r = document.querySelector('#card .card-more').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`); await tap(b) }
      else if (via === 'key') { await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await key('Tab', 8); const f = await cdp.eval(`document.activeElement && document.activeElement.className`); if (f !== 'card-more') { ok = false; why = 'Shift+Tab from the card lands on ' + f; break } await key('Enter') }
      else { await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await key('PageDown') }
      await sleep(150); await quiet(); const w1 = await wholeLines()
      if (w1.st <= w0.st + 1) { ok = false; why = `page ${n + 1}: did not move (${w0.st} → ${w1.st})`; break }
      if (w1.sliced) { ok = false; why = `page ${n + 1}: ${w1.sliced} line(s) sliced at the top or the foot`; break }
      if (w0.firstUnseen != null && Math.abs(w1.first - w0.firstUnseen) > 1.5) { ok = false; why = `page ${n + 1}: the new top ${w1.first} is not the first line unseen before ${w0.firstUnseen}`; break } }
    const s1 = await state()
    check(ok && n > 0 && !s1.more && !s1.btn && !shownNow(s1), `${label}: ${via === 'tap' ? 'a touch on its facet' : via === 'key' ? 'its key (Shift+Tab, Enter)' : 'Page Down in the card'} turns whole-line screenfuls to the end (${n}), and there the cue is gone`, why || JSON.stringify({ n, more: s1.more, btn: s1.btn }))
    await cdp.eval('HOME.cardResnap()'); await sleep(200) }

  /* ---------- the cue, read after every real drag ---------- */
  async function cueWalk(label, way, kind) {
    await cdp.eval('HOME.cardResnap()'); await sleep(250)
    const s0 = await state(), scrolls = s0.more, seen = [] // words below the room
    if (way === 'd') { const c = await card(); return { scrolls, lift: c.cue && c.cue.lift } }
    check(shownNow(s0) === scrolls && s0.btn === (way === 'a' && scrolls), `${label}: at its start the cue is ${scrolls ? 'there: there is more below' : 'absent: everything is in view'}`, JSON.stringify({ shown: shownNow(s0), scrolls, btn: s0.btn }))
    if (!scrolls) return { scrolls }
    let bad = '', last = s0, fr = [s0.cue && s0.cue.frac], rims = [s0.rim]
    for (let k = 0; k < 40; k++) { await drag(1); const s = await state(); seen.push(s.more)
      if (shownNow(s) !== s.more) { bad = `after drag ${k + 1}: shown ${shownNow(s)} while more ${s.more} (top ${s.top})`; break }
      if (way === 'a' && s.btn !== s.more) { bad = `after drag ${k + 1}: its facet's button ${s.btn} while more ${s.more}`; break }
      fr.push(s.cue ? s.cue.frac : 0); rims.push(s.rim)
      if (s.top === last.top) break; last = s }
    const end = await state()
    check(!bad && !end.more, `${label}: dragged by touch to its end (${seen.length} drags), the cue was there exactly while there was more`, bad || JSON.stringify({ more: end.more }))
    const goneEnd = !shownNow(end) && !end.btn && await cueGone(label + ' end')
    check(goneEnd, `${label}: at the end the cue is gone, from the card's state and from its pixels`, JSON.stringify({ shown: shownNow(end), btn: end.btn, pixels: goneN }))
    if (way === 'b') { const k0 = rims[0] / fr[0], off = fr.map((f, i) => f > .02 ? Math.abs(rims[i] / f / k0 - 1) : 0)
      check(fr.every((f, i) => !i || f <= fr[i - 1] + 1e-6) && fr[0] > .05 && fr.at(-1) === 0 && rims.at(-1) === 0 && Math.max(...off) < .06, `${label}: b's lit rim is drawn as long as the fraction still below, shortening as you read (${fr.map(f => f.toFixed(2)).join(' ')})`, `fractions ${fr.map(f => f.toFixed(3)).join(' ')}; lit lengths ${rims.map(r => r.toFixed(0)).join(' ')}`) }
    return { scrolls, end } }
  async function cueBack(label) { for (let k = 0; k < 40; k++) { const t0 = (await state()).top; if (t0 <= 0) break; await drag(-1) } const s = await state()
    check(s.top === 0 && shownNow(s) === s.more, `${label}: dragged back to its start, the cue is back`, JSON.stringify({ top: s.top, shown: shownNow(s), more: s.more })) }
  async function glimpse(label) { // c: beneath the seam, the next line shows, dimmed
    const g = await cdp.eval(`(() => { const c = HOME.card, s = c.cue && c.cue.seam; if (!s) return null; const e = ${scroller}, r = e.getBoundingClientRect(), y = c.rect[1] + s.y, L = []
      const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const q = document.createRange(); q.selectNodeContents(n); for (const b of q.getClientRects()) if (b.height && b.top < r.bottom && b.bottom > y + 2) L.push([b.left, Math.max(b.top, y + 2), b.width, Math.min(b.bottom, r.bottom) - Math.max(b.top, y + 2)]) } else n.childNodes.forEach(walk) }
      walk(e); return { y, L } })()`)
    if (!g || !g.L.length) return check(false, `${label}: c's seam has a line beneath it`, JSON.stringify(g))
    const A = png(await shotBuf()); await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'g44'; s.textContent = '.card-slot > * { color: transparent !important; -webkit-text-fill-color: transparent !important; }'; document.head.append(s) })()`); await sleep(120)
    const B = png(await shotBuf()); await cdp.eval(`document.getElementById('g44').remove()`); await sleep(60)
    let n = 0; for (const r of g.L) n += diff(A, B, r).n
    check(n > 30, `${label}: beneath c's seam the next line shows, dimmed (${n} pixels of its words)`, `${n} pixels`) }

  /* ---------- rest: the study at rest is the live home, pixel for pixel ---------- */
  if (GROUPS.has('rest')) for (const sc of [[390, 844, true], [844, 390, true], [1440, 900, false]]) {
    await view(sc, true); await open('/'); const L = await rest(true)
    for (const way of ANSWERS) { await open(study(way)); const S = await rest(true), d = diff(L, S)
      check(d.n <= 40, `rest ${sc[0]}x${sc[1]} ${way}: the study at rest is the live home, pixel for pixel`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) } }

  /* ---------- 390x844 and 844x390: every answer, the idea and the chain ---------- */
  for (const [grp, sc, tag] of [['open', [390, 844, true], ''], ['landscape', [844, 390, true], '-844x390']]) if (GROUPS.has(grp)) for (const way of ANSWERS) {
    await view(sc); await open(study(way)); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(300)
    const ideaK = await cdp.eval(`HOME.ideas.findIndex(I => I.name === 'Context')`), lifts0 = await cdp.eval('HOME.cueLifts || 0')
    for (const kind of KINDS) {
      const label = `${way} ${kind} ${sc[0]}x${sc[1]}`, before = grp === 'open' ? await rest() : null
      const c = await openCard(kind, label, ideaK), scrolls = (await state()).more
      const words = await cdp.eval(`(() => { const out = []; const w = document.createTreeWalker(document.querySelector('#card'), NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { if (n.data.trim() && !n.parentElement.closest('.card-slot')) out.push(n.data.trim()) } return out.concat([...document.querySelectorAll('#card svg text')].map(t => 'svg:' + t.textContent)) })()`)
      check(words.join('|') === '×', `${label}: no words in the cue: outside its words the card's only text is its close mark`, words.join(' | '))
      if (way === 'd') { const L = c.cue && c.cue.lift, lifts = await cdp.eval('HOME.cueLifts || 0')
        check(scrolls ? !!L && L.peak >= 8 && L.done === true && c.scroll.top === 0 : !L, `${label}: d's words ${scrolls ? `lifted once as it opened (by ${L && L.peak}px, the hidden next line) and settled back to the start` : 'did not lift: everything is in view'}`, JSON.stringify({ scrolls, lift: L, top: c.scroll.top }))
        check(lifts - lifts0 <= KINDS.indexOf(kind) + 1, `${label}: one lift per opening, none after`, `${lifts - lifts0}`) }
      await shot(`${way}-${kind}-top${tag}.png`)
      await still(`${label} at its start`)
      if (way !== 'd' && scrolls) await cueContrast(label)
      if (way === 'c' && scrolls) await glimpse(label)
      await readCard(label)
      const r = await cueWalk(label, way, kind)
      if (scrolls) { await cdp.eval(`(() => { const e = ${scroller}; e.scrollTop = e.scrollHeight })()`); await sleep(250); await shot(`${way}-${kind}-end${tag}.png`); await still(`${label} at its end`) }
      if (scrolls && way !== 'd') await cueBack(label)
      if (way === 'a' && scrolls) {
        const t = await cdp.eval(`(() => { const b = document.querySelector('#card .card-more'), r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
          const hits = [[cx, cy], [cx - 18, cy], [cx + 18, cy], [cx, cy - 18], [cx, cy + 18]].map(([x, y]) => document.elementFromPoint(x, y) === b); return { w: r.width, h: r.height, hits } })()`)
        check(t.w >= 44 && t.h >= 44 && t.hits.every(Boolean), `${label}: a's facet is a target of ${t.w}x${t.h}px, taken at its centre and 18px out each way`, JSON.stringify(t))
        await paging(label, 'tap')
        if (grp === 'open') { await paging(label, 'key'); await paging(label, 'pagedown')
          await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await key('Tab', 8)
          const bx = await cdp.eval(`(() => { const b = document.querySelector('#card .card-more'), r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { at: document.activeElement === b, fv: b.matches(':focus-visible'), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), box: [r.left, r.top, r.width, r.height] } })()`)
          const A = png(await shotBuf()); await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await sleep(120); const B = png(await shotBuf()), d = diff(A, B, bx.box)
          check(bx.at && bx.fv && bx.style !== 'none' && bx.width >= 1 && d.n >= 40, `${label}: by keyboard its facet takes the focus with a visible ring (${bx.style} ${bx.width}px, ${d.n} pixels change)`, JSON.stringify({ ...bx, changed: d.n })) } }
      await key('Escape'); await settle(label, false)
      if (before) { await cdp.eval('document.activeElement && document.activeElement.blur()'); sameRest(before, await rest(), `${label} after Escape`) } } }

  /* ---------- every hue: the cue against each idea's ground and the chain's (the darkest and the brightest card) ---------- */
  if (GROUPS.has('hues')) for (const sc of [[390, 844, true], [844, 390, true]]) for (const way of ANSWERS) {
    await view(sc); await open(study(way)); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(300)
    const names = await cdp.eval('HOME.ideas.map(I => I.name)'), lifts0 = await cdp.eval('HOME.cueLifts || 0'); let lifted = 0, scrolled = 0
    for (const [kind, k] of [...names.map((_, k) => ['idea', k]), ['chain', 0]]) { const label = `${way} ${kind === 'idea' ? names[k] : 'chain'} ${sc[0]}x${sc[1]}`
      const c = await openCard(kind, label, k), s = await state(), scrolls = s.more; if (scrolls) scrolled++
      if (way === 'd') { if (c.cue && c.cue.lift) lifted++; check(!!(c.cue && c.cue.lift) === scrolls, `${label}: d lifts exactly when there is more (${scrolls})`, JSON.stringify(c.cue)) }
      else { check(shownNow(s) === scrolls, `${label}: the cue is there exactly when there is more (${scrolls})`, JSON.stringify({ shown: shownNow(s), scrolls }))
        if (scrolls) await cueContrast(label) }
      await key('Escape'); await settle(label, false) }
    if (way === 'd') check((await cdp.eval('HOME.cueLifts || 0')) - lifts0 === lifted && lifted === scrolled, `${way} ${sc[0]}x${sc[1]}: ${lifted} lifts for ${scrolled} cards with more, of 7`, `${lifted} / ${scrolled}`) }

  /* ---------- reduced motion: a crossfade; nothing of the cue moves ---------- */
  if (GROUPS.has('reduce')) for (const way of ANSWERS) {
    await view([390, 844, true], true); await open(study(way)); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(300)
    const label = `${way} reduced motion 390x844`, before = await rest(), ideaK = await cdp.eval(`HOME.ideas.findIndex(I => I.name === 'Context')`)
    await cdp.eval('HOME.cardClock = 0.5'); const o = await opener('idea', ideaK); await tap(o.pt); await waitFor(() => cdp.eval('HOME.card.open && Math.abs(HOME.card.t - .5) < .01'), 'half way')
    const m = await card(); check(m.motion === 'fade' && m.transform === 'none', `${label}: half way it is a crossfade`, JSON.stringify({ motion: m.motion, transform: m.transform }))
    await cdp.eval('HOME.cardClock = null'); await settle(label); await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(300) // the light the touch moved, held where it starts
    const c0 = await card(), A = png(await shotBuf()); await sleep(1000); const B = png(await shotBuf()), d = diffIn(A, B, c0.poly), c = await card()
    check(d.n === 0 && !(c.cue && c.cue.lift) && c.scroll.top === 0, `${label}: from the moment it settles nothing moves${way === 'd' ? ' (d does not lift)' : ''}`, JSON.stringify({ px: d.n, max: d.max, at: d.first, lift: c.cue && c.cue.lift, top: c.scroll.top }))
    if (way !== 'd' && (await state()).more) check(!!(c.cue && c.cue.shown), `${label}: the still cue is there`, JSON.stringify(c.cue))
    await key('Escape'); await settle(label, false); sameRest(before, await rest(), `${label} after Escape`) }

  /* ---------- 1440x900: the study is the live home ---------- */
  if (GROUPS.has('desk')) { const DESK = [1440, 900, false], got = {}
    for (const at of ['/', ...ANSWERS.map(w => study(w))]) { await view(DESK); await open(at); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(600)
      const out = {}; const o = await opener('idea', 0); await tap(o.pt); await sleep(700)
      out.idea = await cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(); return { on: t.classList.contains('on'), box: [r.left, r.top, r.width, r.height].map(Math.round), text: t.textContent.slice(0, 400), parent: t.parentElement.id || t.parentElement.tagName, card: !!document.querySelector('#card.on') } })()`)
      await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(900); out.shot = png(await shotBuf()); out.track = await cdp.eval('window.__T.slice(-1)[0] || null'); await key('Escape'); await sleep(500)
      const w = await opener('chain'); await tap(w.pt); await waitFor(() => cdp.eval(`document.body.classList.contains('why')`), 'the chain', 100); await sleep(3400)
      out.chain = await cdp.eval(`(() => { const r = document.querySelector('#why').getBoundingClientRect(); return { box: [r.left, r.top, r.width, r.height].map(Math.round), parent: document.querySelector('#why').parentElement.id, card: !!document.querySelector('#card.on') } })()`)
      got[at] = out }
    const L = got['/']
    for (const way of ANSWERS) { const S = got[study(way)], d = diff(L.shot, S.shot)
      check(S.idea.on && !S.idea.card && JSON.stringify(S.idea.box) === JSON.stringify(L.idea.box) && S.idea.text === L.idea.text && S.idea.parent === L.idea.parent && d.n <= 40, `desk ${way}: an idea opens as on the live home (the same panel, box ${S.idea.box.join(',')}, the same words, the same pixels), no card`, JSON.stringify({ s: S.idea.box, l: L.idea.box, card: S.idea.card, px: d.n }))
      check(JSON.stringify(S.track) === JSON.stringify(L.track), `desk ${way}: the same event as the live home`, JSON.stringify([S.track, L.track]))
      check(!S.chain.card && S.chain.parent === 'app' && JSON.stringify(S.chain.box) === JSON.stringify(L.chain.box), `desk ${way}: the chain opens as on the live home (box ${S.chain.box.join(',')}), no card`, JSON.stringify([S.chain, L.chain])) } }

  if (SAWTEXT.length) { const hits = SAWTEXT.filter(t => BANNED.test(t) || /\b(tap|click|swipe|scroll|press|hover)\b/i.test(t))
    check(!hits.length, `no system name and no instruction in any card's words (${SAWTEXT.length} texts read)`, hits.slice(0, 3).join(' | ')) }
  const svgWords = await cdp.eval(`[...document.querySelectorAll('#card svg text')].length`).catch(() => 0)
  check(!svgWords, 'the cut holds no words', String(svgWords))
  check(!errors.length, 'no page errors', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL ' + (e && e.stack || e)); if (errors.length) console.log('page errors: ' + errors.slice(0, 4).join(' | ')) }

if (MUT && !mutHit) { console.log(`FAIL MUTATE=${MUT} changed nothing it was meant to`); failures++ }
const line = `${oks} checks; answers ${ANSWERS.join(', ')}; ${loads} loads, ${drags} touch drags, ${pages} pages turned; the cue at least ${cueWorst === Infinity ? '-' : cueWorst.toFixed(2)}:1 against its ground (${cueWorstAt}), at most ${cueBest ? cueBest.toFixed(2) : '-'}:1 (${cueBestAt}); ${measured} lines measured, the least ${worst === Infinity ? '-' : worst.toFixed(2)}:1 (${worstAt}); body text at least ${minBody === Infinity ? '-' : minBody.toFixed(1)}px`
console.log(failures ? `FAIL study 44: ${failures} failing, ${line}` : `PASS study 44: ${line}`)
cleanup(); process.exit(failures ? 1 : 0)
