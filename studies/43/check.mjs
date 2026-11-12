#!/usr/bin/env node
// Study 43 check: the opened facet. On a phone (390x844, and lighter at 844x390) every answer (?v= a b c) opens each of the three things
// a tap opens on the live home (a piece of his work from a facet, an idea from its facet, the chain from the where line) as one card, and:
//   open      it opens from a real touch; one card, inside the screen; focus goes into it; the live events fire with the live names and props
//   read      every text in it measures at least 4.5:1 against the rendered pixels behind it (a screenshot with the card's text made clear,
//             the 99th-percentile brightest pixel under each line); body text at least 16px, no text under 12px; nothing of the stone
//             shows through under its words (the same screenshot with the stone hidden is the same, pixel for pixel, under every line)
//   reach     all of it is reachable: it scrolls to its last line, nothing hides sideways, no line starts under the close mark; when it scrolls,
//             its foot comes to a point (the cut says there is more) and goes flat at the end
//   close     its close mark, a tap on the stone outside it, Escape, and the same facet (the line, for the chain) again each close it; focus
//             comes back to where it came from; the rest state after is the rest state before, pixel for pixel (the light held still)
//   one       opening another closes the first: never two cards, the first one's state closed too
//   motion    a grows, b rises, c turns (mid-way the card is neither the facet nor the card); under reduced motion it only fades
//   rest      at rest the study is the live home, pixel for pixel, at 390x844, 844x390 and 1440x900 (reduced motion: the light still)
//   desk      at 1440x900 an idea, a piece and the chain open exactly as on the live home (same element, same box, same words), no card
//   words     no instruction text; no system name in anything served or shown; every dial is read
// Run: node studies/43/check.mjs   (ANSWERS=a,b · KINDS=piece,idea,chain · GROUPS=static,rest,open,landscape,desk,reduce · SHOTS=dir · MUTATE=<name> to see it go red)
// Screenshots go to $SHOTS (default: a temp folder), named <answer>-<opening>.png.
import { spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, createReadStream, rmSync, mkdtempSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = process.env.SHOTS || path.join(os.tmpdir(), 's43-shots'); mkdirSync(SHOTS, { recursive: true })
const ANSWERS = (process.env.ANSWERS || 'a,b,c').split(','), KINDS = (process.env.KINDS || 'piece,idea,chain').split(',')
const GROUPS = new Set((process.env.GROUPS || 'static,rest,open,landscape,desk,reduce').split(','))
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8')
const BANNED = /day[\s-]?flow|raw\.db/i // the system's working name and its database file (never named on the site, Kahran 2026-10-27); "raw store" is a public part name in IDEAS
const INSTRUCT = /\b(tap|click|swipe|scroll|press|close this|to close|hover)\b/i

/* ---------- MUTATE: each changes only the served bytes, never a file; one per group, to see that group go red ---------- */
const MUT = process.env.MUTATE || ''
const MUTS = {
  read: ['/studies/43/defaults.json', s => s.replace('"card-ground-alpha": "1"', '"card-ground-alpha": "0.35"')], // the ground lets the stone through
  small: ['/studies/43/defaults.json', s => s.replace('"card-body-px": "16"', '"card-body-px": "13"')],
  reach: ['/studies/43/index.html', s => s.replace('overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y;', 'overflow: hidden; touch-action: pan-y;')],
  more: ['/studies/43/stone.js', s => s.replace("more = el.scrollHeight - el.clientHeight - el.scrollTop > 2", "more = false")],
  close: ['/studies/43/stone.js', s => s.replace("addEventListener('keydown', e => { if (!CARD.open || e.key !== 'Escape') return;", "addEventListener('keydown', e => { if (true) return;")],
  focus: ['/studies/43/stone.js', s => s.replace("if (back && back.isConnected && back !== document.body) back.focus({ preventScroll: true }); else if (cardEl.contains(document.activeElement)) document.activeElement.blur()", "void back")],
  rest: ['/studies/43/stone.js', s => s.replace("cardSvg.textContent = ''; cardSlot.style.opacity = ''; app.style.transform = ''", "cardSvg.textContent = ''; cardSlot.style.opacity = ''; app.style.transform = 'translate(0px, 3px)'")],
  events: ['/studies/43/stone.js', s => s.replace("track('tools_open', { idea: IDEAS[p.k].name, via: 'facet' })", "track('tools_open', { idea: IDEAS[p.k].name })")],
  one: ['/studies/43/stone.js', s => s.replace("function cardRoom() { if (CARD.open) cardClose('another'); cardFinish() }", "function cardRoom() {}").replace("cardFinish(); if (CARD.open) cardClose('another'); cardFinish()\n", "\n")],
  motion: ['/studies/43/stone.js', s => s.replace("if (way === 'a') { s.transform = base;", "if (way === 'a') { s.transform = 'none';")],
  reduce: ['/studies/43/stone.js', s => s.replace("CARD.geo = { x, y, w: cw, h: ch, shift, P, shape, way: reduce() ? 'fade' : WAY }", "CARD.geo = { x, y, w: cw, h: ch, shift, P, shape, way: WAY }")],
  restlive: ['/studies/43/defaults.json', s => s.replace('"seam-px": "2.2"', '"seam-px": "2.6"')],
  desk: ['/studies/43/stone.js', s => s.replace("const cardMode = () => phone() || low()", "const cardMode = () => true")],
  name: ['/studies/43/stone.js', s => s.replace("pieceEl.append(src);", "pieceEl.append(src, mk('small', 'basis', 'kept by day-flow'));")],
}
if (MUT && !MUTS[MUT]) { console.error('unknown MUTATE ' + MUT + '; one of ' + Object.keys(MUTS).join(' ')); process.exit(2) }
let mutHit = false
const serve = (u, s) => { if (MUT && MUTS[MUT][0] === u) { const t = MUTS[MUT][1](s); if (t !== s) mutHit = true; return t } return s }

/* ---------- static ---------- */
const page = read('studies/43/index.html'), stone = read('studies/43/stone.js'), defaults = JSON.parse(read('studies/43/defaults.json'))
if (GROUPS.has('static')) {
  const body = /<body>([\s\S]*?)<noscript>/.exec(page)[1].replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems × × v3 v2 v1', 'no instruction text: the page\'s own words are the name, the way out, the two close marks and the switch', body)
  const src = page + '\n' + stone, unread = Object.keys(defaults).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(src) && !src.includes(`var(--${k}`))
  const css = [...src.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].filter(m => m[1] in defaults && Number(m[2]) !== Number(defaults[m[1]]) && m[2] !== String(defaults[m[1]]))
  check(!unread.length && !css.length && ['a', 'b', 'c'].includes(defaults['card-way']), `every dial is read (${Object.keys(defaults).length}), CSS fallbacks equal defaults.json, the default answer is one of the three (${defaults['card-way']})`, unread.concat(css.map(m => m[1])).join(', '))
  const live = JSON.parse(read('v3/defaults.json')), drift = Object.keys(live).filter(k => defaults[k] !== live[k])
  check(!drift.length, `the live home's ${Object.keys(live).length} dials are the live values (the rest state is the live home's)`, drift.join(', '))
  check(!BANNED.test(page.replace(/<!--[\s\S]*?-->/g, '')) && !BANNED.test(stone.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')), 'no system name in the study\'s served page or script')
}

/* ---------- PNG, decoded here (Chrome's screenshots: 8-bit RGB or RGBA, not interlaced) ---------- */
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
function diff(A, B, box) { // pixels that differ by more than 2 in any channel (inside box, css px, if given), and the largest difference
  const s = A.w / VPW, [x0, y0, x1, y1] = box ? [Math.max(0, Math.floor(box[0] * s)), Math.max(0, Math.floor(box[1] * s)), Math.min(A.w, Math.ceil((box[0] + box[2]) * s)), Math.min(A.h, Math.ceil((box[1] + box[3]) * s))] : [0, 0, A.w, A.h]
  let n = 0, max = 0, first = null
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * A.w + x) * 4, m = Math.max(Math.abs(A.d[k] - B.d[k]), Math.abs(A.d[k + 1] - B.d[k + 1]), Math.abs(A.d[k + 2] - B.d[k + 2])); if (m > 2) { n++; if (!first) first = [x / s | 0, y / s | 0] } if (m > max) max = m }
  return { n, max, first } }
let VPW = 390

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
const HTTP = await freePort(), CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 's43-'))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' }
const served = [] // every text file the study's page fetched, for the system-name guard
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
  if (/^\/studies\/43\//.test(u) && /\.(html|js|json)$/.test(u)) return res.end(serve(u.endsWith('/') ? u + 'index.html' : u, readFileSync(f, 'utf8')))
  createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup); process.on('SIGINT', () => process.exit(130))
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, taps = 0, measured = 0, worst = Infinity, worstAt = '', minBody = Infinity, minAny = Infinity
const SAWTEXT = []

/* the moment, pinned as tools/test_home.mjs and Study 42 pin it: 8:40 pm New York, 9 Nov 2026, and the sky */
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
  const study = (way, q = '') => `/studies/43/index.html?v=${way}${q}`
  const shotBuf = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
  const shot = async name => { const b = await shotBuf(); writeFileSync(path.join(SHOTS, name), b); return path.join(SHOTS, name) }
  const tap = async ([x, y]) => { taps++
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(40); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) }
    await sleep(120) }
  const key = async k => { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 }); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 }); await sleep(80) }
  const card = () => cdp.eval('HOME.card')
  const settle = async (label, open = true) => waitFor(async () => { const c = await card(); return open ? c.open && c.phase === 'open' : !c.open && c.phase === null && !c.on }, label + (open ? ' to open' : ' to close'), 120)
  const rest = async (asLive = false) => { // the rest state as a screenshot: the light held still, lifts and grounds settled, the line resolved
    if (!asLive) { const v = await cdp.eval(`(() => { const r = document.querySelector('.vs [aria-current]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`) // no hover left on whatever was touched last: a touch on the version mark's own word, which opens nothing
      if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: v[0], y: v[1] }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
      else await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: v[0], y: v[1] }) }
    await waitFor(() => cdp.eval(`HOME.phase === 'resolved' || HOME.phase === 'none'`), 'the line resolved', 80)
    if (!asLive) await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(1300); // against the live home: no touch at all, the light where both pages start it (reduced motion: it does not walk)
    await cdp.eval('HOME.ground()'); await sleep(250); const b = await shotBuf(), P = png(b); P.raw = b; return P }
  let restFails = 0
  const sameRest = (A, B, label) => { const d = diff(A, B); if (d.n > 40 && A.raw && restFails++ < 4) { writeFileSync(path.join(SHOTS, `restfail-${restFails}-before.png`), A.raw); writeFileSync(path.join(SHOTS, `restfail-${restFails}-after.png`), B.raw) } check(d.n <= 40, `${label}: the rest state after is the rest state before`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) }
  const focusName = () => cdp.eval(`(() => { const a = document.activeElement; return !a || a === document.body ? 'body' : a.id ? '#' + a.id : a.closest('#keys') ? 'key ' + a.dataset.k : a.tagName.toLowerCase() + '.' + a.className })()`)
  const lastTrack = () => cdp.eval('window.__T.slice(-1)[0] || null'), nTrack = () => cdp.eval('window.__T.length')
  async function pieceFacet(avoid = []) { // a facet whose next tap gives a piece (not a move, not an idea, the date or the title), with a place for a finger
    return cdp.eval(`(() => { const out = []; HOME.plans.forEach((p, i) => { if (!p || ['idea', 'year', 'title'].includes(p.kind) || !p.steps) return
      const s = p.steps[Math.min(HOME.depth(i), p.steps.length - 1)]; if (!s || s.t === 'move') return; const pt = HOME.tapPoint(i); if (pt && !${JSON.stringify(avoid)}.includes(i)) out.push({ i, pt, t: s.t }) }); return out })()`) }
  async function opener(kind, k = 0) { // [a point to touch, what the touch should open, the facet]
    if (kind === 'piece') { const L = await pieceFacet(); if (!L.length) throw new Error('no piece facet'); return { pt: L[0].pt, i: L[0].i, t: L[0].t } }
    if (kind === 'idea') { const x = await cdp.eval(`HOME.tapIdea(${k})`); return { pt: x.pt, i: x.i } }
    const r = await cdp.eval(`(() => { const r = document.querySelector('#where').getBoundingClientRect(); return [r.left + Math.min(60, r.width / 2), r.top + r.height / 2] })()`); return { pt: r, i: -1 } }
  async function openCard(kind, label, k = 0) { const o = await opener(kind, k), n0 = await nTrack(), seq0 = await cdp.eval('HOME.seq')
    await tap(o.pt); await settle(label); const c = await card()
    return { o, c, n0, seq0 } }
  async function readCard(label, kinds) { // AA against the pixels, sizes, nothing showing through
    await cdp.eval(`HOME.lamp(innerWidth * .7, innerHeight * .2)`); await sleep(300)
    const T = await cdp.eval('HOME.cardTexts()'); SAWTEXT.push(...T.map(t => t.t))
    await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'clear43'; s.textContent = '#card, #card * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; border-bottom-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }'; document.head.append(s) })()`)
    await sleep(120); const A = png(await shotBuf())
    await cdp.eval(`document.querySelector('#app').style.visibility = 'hidden'`); await sleep(120); const B = png(await shotBuf())
    await cdp.eval(`document.querySelector('#app').style.visibility = ''; document.getElementById('clear43').remove()`); await sleep(80)
    const s = A.w / VPW, bad = [], through = [], small = [], tiny = []
    for (const t of T) { const ink = t.color, a = (ink[3] ?? 1) * t.op, px = t.px * (Math.abs(t.z - 1) > .001 ? t.z : 1)
      if (t.body && px < 15.95) small.push(`${t.t.slice(0, 30)} ${px.toFixed(1)}px`); if (px < 11.95) tiny.push(`${t.t.slice(0, 30)} ${px.toFixed(1)}px`)
      if (t.body) minBody = Math.min(minBody, px); minAny = Math.min(minAny, px)
      for (const r of t.rects) { const ls = []; const x0 = Math.floor(r[0] * s), y0 = Math.floor(r[1] * s), x1 = Math.ceil((r[0] + r[2]) * s), y1 = Math.ceil((r[1] + r[3]) * s)
        for (let y = Math.max(0, y0); y < Math.min(A.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(A.w, x1); x++) { const k = (y * A.w + x) * 4; ls.push([lum([A.d[k], A.d[k + 1], A.d[k + 2]]), A.d[k], A.d[k + 1], A.d[k + 2]]) }
        if (!ls.length) continue; ls.sort((p, q) => p[0] - q[0]); const bg = ls[Math.min(ls.length - 1, Math.floor(ls.length * .99))].slice(1), cr = ratio(mix(ink, a, bg), bg); measured++
        if (cr < worst) { worst = cr; worstAt = `${label} “${t.t.slice(0, 28)}”` } if (cr < 4.5) bad.push(`“${t.t.slice(0, 26)}” ${cr.toFixed(2)}:1`)
        const d = diff(A, B, r); if (d.n) through.push(`“${t.t.slice(0, 26)}” ${d.n}px`) } }
    check(T.length > 0 && !bad.length, `${label}: every text in the card (${T.length}) reads at AA against the pixels behind it`, bad.slice(0, 4).join(' | '))
    check(!through.length, `${label}: nothing of the stone shows through under its words (the stone hidden, the same pixels)`, through.slice(0, 3).join(' | '))
    check(!small.length && !tiny.length, `${label}: body text at least 16px, nothing under 12px`, small.concat(tiny).slice(0, 4).join(' | ')) }
  async function reach(label) { // the whole of it reachable; the cut says when there is more
    const c0 = await card(), sc = c0.scroll, scrolls = sc.height - sc.client > 2
    const top = await cdp.eval(`(() => { const c = HOME.card, x = c.xf, T = HOME.cardTexts().filter(t => t.cls !== 'card-x'), inTri = ([px, py]) => { const [[ax, ay], [bx, by], [cx, cy]] = x, s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]); const d1 = s([px, py], [ax, ay], [bx, by]), d2 = s([px, py], [bx, by], [cx, cy]), d3 = s([px, py], [cx, cy], [ax, ay]); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) }
      return T.flatMap(t => t.rects.filter(r => [[r[0] + 1, r[1] + 1], [r[0] + r[2] - 1, r[1] + 1], [r[0] + r[2] - 1, r[1] + r[3] - 1]].some(inTri)).map(() => t.t.slice(0, 30))) })()`)
    check(!top.length, `${label}: at its start no line lies under the close mark's facet`, top.slice(0, 2).join(' | '))
    check(sc.width <= sc.cw + 1, `${label}: nothing hides sideways (${sc.width} in ${sc.cw})`)
    check(c0.more === scrolls, `${label}: the foot ${scrolls ? 'comes to a point while there is more' : 'is flat: everything is in view'}`, `more ${c0.more}, scrolls ${scrolls}`)
    if (scrolls) { // scrolled as a finger scrolls it: touch drags on the card until it moves no further
      const mid = await cdp.eval(`(() => { const r = document.querySelector('.card-slot > *').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.height] })()`)
      let last = -1; for (let k = 0; k < 40; k++) { const st = await cdp.eval(`document.querySelector('.card-slot > *').scrollTop`); if (st === last) break; last = st
        await cdp.send('Input.synthesizeScrollGesture', { x: mid[0], y: mid[1], yDistance: -Math.round(mid[2] * .7), gestureSourceType: VP.mobile ? 'touch' : 'mouse', speed: 2400, preventFling: true }); await sleep(120) }
      await sleep(200)
      const end = await cdp.eval(`(() => { const e = document.querySelector('.card-slot > *'), r = e.getBoundingClientRect(), w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let last = null; for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement.getClientRects().length && !n.parentElement.closest('[hidden]')) last = n
        const rg = document.createRange(); rg.selectNodeContents(last); const b = [...rg.getClientRects()].pop(); return { at: e.scrollTop + e.clientHeight >= e.scrollHeight - 1, lastIn: b.bottom <= r.bottom + 1 && b.top >= r.top - 1, more: HOME.card.more } })()`)
      check(end.at && end.lastIn && end.more === false, `${label}: it scrolls to its last line, and there the foot is flat`, JSON.stringify(end))
      await cdp.eval(`document.querySelector('.card-slot > *').scrollTop = 0`); await sleep(150) } }

  /* ---------- rest: the study at rest is the live home, pixel for pixel ---------- */
  if (GROUPS.has('rest')) for (const sc of [[390, 844, true], [844, 390, true], [1440, 900, false]]) {
    await view(sc, true); await open('/'); const L = await rest(true)
    for (const way of ANSWERS) { await open(study(way)); const S = await rest(true), d = diff(L, S)
      check(d.n <= 40, `rest ${sc[0]}x${sc[1]} ${way}: the study at rest is the live home, pixel for pixel`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) } }

  /* ---------- the card at 390x844, every answer, every opening ---------- */
  const PHONE = [390, 844, true]
  if (GROUPS.has('open')) for (const way of ANSWERS) {
    await view(PHONE); await open(study(way)); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(300)
    const ideaK = await cdp.eval(`HOME.ideas.findIndex(I => I.name === 'Context')`), ideaName = 'Context'
    for (const kind of KINDS) {
      const label = `${way} ${kind} 390x844`, before = await rest(), f0 = await focusName()
      // the motion, held half way once per answer, on the idea
      if (kind === 'idea') { await cdp.eval('HOME.cardClock = 0.4'); const o = await opener('idea', ideaK); await tap(o.pt); await waitFor(() => cdp.eval('HOME.card.open && Math.abs(HOME.card.t - .4) < .01'), 'mid-motion'); await sleep(200)
        const m = await card(), tf = m.transform
        const mid = way === 'a' ? /scale\(/.test(tf) && m.opacity === 1 : way === 'b' ? /translateY\((?!0px)/.test(tf) : /rotate3d/.test(tf)
        check(mid && m.motion === way, `${label}: half way it is in motion (${way === 'a' ? 'the facet growing' : way === 'b' ? 'the face rising' : 'the facet turning'})`, tf)
        await shot(`${way}-motion.png`); await cdp.eval('HOME.cardClock = null'); await settle(label); await key('Escape'); await settle(label, false); await rest() }
      const { o, c, n0, seq0 } = await openCard(kind, label, ideaK)
      check(c.open && c.kind === kind && c.on && c.mode, `${label}: a touch opens it as the card`, JSON.stringify({ open: c.open, kind: c.kind }))
      const inScreen = c.poly.every(([x, y]) => x >= -1 && y >= -1 && x <= VP.w + 1 && y <= VP.h + 1)
      const single = await cdp.eval(`document.querySelectorAll('#card.on').length === 1 && !document.querySelector('#tools.on:not(.card-slot > *)') && !document.body.classList.contains('why') && +getComputedStyle(document.querySelector('#back')).opacity === 0`)
      check(inScreen && single, `${label}: one card, wholly on screen, nothing else open the old way`)
      check(c.focusIn, `${label}: focus goes into the card`, await focusName())
      if (kind === 'idea') { const t = await lastTrack(); check((await nTrack()) === n0 + 1 && t && t.name === 'tools_open' && t.params.idea === ideaName && t.params.via === 'facet' && Object.keys(t.params).length === 2, `${label}: tools_open fires as on the live home { idea, via: facet }`, JSON.stringify(t)) }
      if (kind === 'chain') { const t = await lastTrack(); check((await nTrack()) === n0 + 1 && t && t.name === 'line_open' && 'phase' in t.params && Object.keys(t.params).length === 1, `${label}: line_open fires as on the live home { phase }`, JSON.stringify(t)) }
      if (kind === 'piece') { const l = await cdp.eval('HOME.last'); check((await nTrack()) === n0 && l && l.seq === seq0 + 1 && l.i === o.i && l.kind === o.t, `${label}: the piece is said as on the live home (its kind ${o.t}, no event, as the live home sends none)`, JSON.stringify(l)) }
      if (kind === 'chain') await sleep(3200) // the readings it lights as it opens (36 c's echo) have faded
      await shot(`${way}-${kind}.png`)
      await readCard(label); await reach(label)
      // the four ways of closing, each from a fresh opening; each returns the focus and the rest state
      for (const how of ['mark', 'outside', 'escape', 'facet']) {
        const cc = how === 'mark' ? c : (await openCard(kind, label)).c, f1 = f0
        if (how === 'mark') { const x = await cdp.eval(`(() => { const r = document.querySelector('#card .card-x').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`); await sleep(420); await tap(x) }
        if (how === 'outside') { const p = await cdp.eval('HOME.outsidePoint()'); if (!p) { check(false, `${label}: a place on the stone outside the card`); continue } await tap(p) }
        if (how === 'escape') await key('Escape')
        if (how === 'facet') { const p = kind === 'chain' ? (await opener('chain')).pt : await cdp.eval('HOME.cardPoint()'); if (!p) { check(false, `${label}: the facet that spoke keeps a place for a finger beside the card`, JSON.stringify(cc.rect)); await key('Escape'); await settle(label, false); continue } await tap(p) }
        await settle(`${label} ${how}`, false)
        const c2 = await card(), fz = await focusName(), want = kind === 'chain' ? '#where' : f1
        await cdp.eval('document.activeElement && document.activeElement.blur()') // the focus is checked here; the rest state is compared without its ring
        check(!c2.open && c2.closes.length && c2.closes.at(-1).how === how && c2.closes.at(-1).kind === kind, `${label}: ${how === 'mark' ? 'its close mark' : how === 'outside' ? 'a tap on the stone outside' : how === 'escape' ? 'Escape' : kind === 'chain' ? 'the line again' : 'the same facet again'} closes it`, JSON.stringify(c2.closes.at(-1)))
        check(fz === want, `${label}: after ${how}, focus is back where it came from (${want})`, fz)
        const after = await rest(); sameRest(before, after, `${label} after ${how}`)
      }
    }
    // one at a time: an idea open, then the line: the chain replaces it, the idea's state closed too
    { const label = `${way} one 390x844`; await openCard('idea', label, ideaK); const w = await opener('chain')
      const free = await cdp.eval(`(() => { const c = HOME.card.rect, r = document.querySelector('#where').getBoundingClientRect(); return !(r.bottom > c[1] && r.top < c[1] + c[3]) })()`)
      if (free) await tap(w.pt); else await cdp.eval('HOME.join()') // b's sheet lies over the line: the line's own way in, as a tap would take it
      await settle(label)
      const s = await cdp.eval(`({ c: HOME.card, open: HOME.open, n: document.querySelectorAll('#card.on').length, tools: document.querySelector('#tools').closest('.card-slot') ? 'in' : 'out' })`)
      check(s.c.kind === 'chain' && s.open === -1 && s.n === 1 && s.tools === 'out', `${label}: opening the chain over an open idea closes the idea first; one card`, JSON.stringify({ kind: s.c.kind, open: s.open, n: s.n, tools: s.tools }))
      await key('Escape'); await settle(label, false) }
    // the keyboard's way in (the six hidden buttons): the card opens from the key, and Escape gives the focus back to that key
    { const label = `${way} key 390x844`; await cdp.eval(`document.querySelector('#keys button[data-k="${ideaK}"]').focus()`); const n0 = await nTrack()
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await settle(label)
      const c = await card(), t = await lastTrack()
      check(c.kind === 'idea' && c.focusIn && (await nTrack()) === n0 + 1 && t.name === 'tools_open' && t.params.via === 'key', `${label}: its key opens the idea as the card, focus inside, tools_open { via: key }`, JSON.stringify(t))
      await key('Escape'); await settle(label, false); const f = await focusName()
      check(f === 'key ' + ideaK, `${label}: Escape closes it and the focus is back on its key`, f); await cdp.eval('document.activeElement.blur()') }
  }

  /* ---------- 844x390, lighter: open, read, reach, two ways of closing ---------- */
  if (GROUPS.has('landscape')) for (const way of ANSWERS) {
    await view([844, 390, true]); await open(study(way)); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(300)
    const ideaK = await cdp.eval(`HOME.ideas.findIndex(I => I.name === 'Context')`)
    for (const kind of KINDS) { const label = `${way} ${kind} 844x390`, before = await rest()
      const { c } = await openCard(kind, label, ideaK)
      check(c.open && c.kind === kind && c.poly.every(([x, y]) => x >= -1 && y >= -1 && x <= 845 && y <= 391), `${label}: opens as one card, wholly on screen`)
      if (kind === 'chain') await sleep(3200)
      await shot(`${way}-${kind}-844x390.png`); await readCard(label); await reach(label)
      await sleep(420); const x = await cdp.eval(`(() => { const r = document.querySelector('#card .card-x').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`); await tap(x); await settle(label, false)
      await cdp.eval('document.activeElement && document.activeElement.blur()'); sameRest(before, await rest(), `${label} after its close mark`)
      await openCard(kind, label, ideaK); await key('Escape'); await settle(label, false); await cdp.eval('document.activeElement && document.activeElement.blur()'); sameRest(before, await rest(), `${label} after Escape`) } }

  /* ---------- reduced motion: a crossfade, nothing grows, rises or turns ---------- */
  if (GROUPS.has('reduce')) for (const way of ANSWERS) {
    await view(PHONE, true); await open(study(way)); const label = `${way} reduced motion 390x844`, before = await rest()
    await cdp.eval('HOME.cardClock = 0.5'); const o = await opener('idea', 0); await tap(o.pt); await waitFor(() => cdp.eval('HOME.card.open && Math.abs(HOME.card.t - .5) < .01'), 'half way')
    const m = await card()
    check(m.motion === 'fade' && m.transform === 'none' && m.opacity > .3 && m.opacity < .7 && (m.appShift === '' || !/[1-9]\.\d+px.*[1-9]\.\d+px/.test('')), `${label}: half way it is a crossfade (opacity ${m.opacity}, no transform)`, JSON.stringify({ motion: m.motion, transform: m.transform, opacity: m.opacity }))
    await cdp.eval('HOME.cardClock = null'); await settle(label); await key('Escape'); await settle(label, false); sameRest(before, await rest(), `${label} after Escape`) }

  /* ---------- 1440x900: the study is the live home ---------- */
  if (GROUPS.has('desk')) { const DESK = [1440, 900, false], got = {}
    for (const at of ['/', ...ANSWERS.map(w => study(w))]) { await view(DESK); await open(at); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await sleep(600)
      const out = {}; const o = await opener('idea', 0); await tap(o.pt); await sleep(700)
      out.idea = await cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(); return { on: t.classList.contains('on'), box: [r.left, r.top, r.width, r.height].map(Math.round), text: t.textContent.slice(0, 400), parent: t.parentElement.id || t.parentElement.tagName, card: !!document.querySelector('#card.on') } })()`)
      out.track = await lastTrack(); await key('Escape'); await sleep(500)
      const P = await pieceFacet(); if (P.length) { await tap(P[0].pt); await sleep(700); out.piece = await cdp.eval(`({ text: document.querySelector('#back').textContent, op: +document.querySelector('#back').style.opacity > .5, card: !!document.querySelector('#card.on') })`); await sleep(4200) }
      const w = await opener('chain'); await tap(w.pt); await waitFor(() => cdp.eval(`document.body.classList.contains('why')`), 'the chain', 100); await sleep(500)
      out.chain = await cdp.eval(`(() => { const r = document.querySelector('#why').getBoundingClientRect(); return { box: [r.left, r.top, r.width, r.height].map(Math.round), parent: document.querySelector('#why').parentElement.id, card: !!document.querySelector('#card.on') } })()`)
      got[at] = out }
    const L = got['/']
    for (const way of ANSWERS) { const S = got[study(way)]
      check(S.idea.on && !S.idea.card && JSON.stringify(S.idea.box) === JSON.stringify(L.idea.box) && S.idea.text === L.idea.text && S.idea.parent === L.idea.parent, `desk ${way}: an idea opens as on the live home (the same panel, box ${S.idea.box.join(',')}, the same words), no card`, JSON.stringify({ s: S.idea.box, l: L.idea.box, card: S.idea.card }))
      check(JSON.stringify(S.track) === JSON.stringify(L.track), `desk ${way}: the same event as the live home`, JSON.stringify([S.track, L.track]))
      check(S.piece && L.piece && S.piece.op && !S.piece.card && S.piece.text === L.piece.text, `desk ${way}: a piece opens as on the live home (the same words, floating, no card)`, JSON.stringify([S.piece, L.piece]))
      check(!S.chain.card && S.chain.parent === 'app' && JSON.stringify(S.chain.box) === JSON.stringify(L.chain.box), `desk ${way}: the chain opens as on the live home (box ${S.chain.box.join(',')}), no card`, JSON.stringify([S.chain, L.chain])) } }

  /* ---------- words: no system name in anything shown or served ---------- */
  if (GROUPS.has('open') || GROUPS.has('landscape')) { const hits = SAWTEXT.filter(t => BANNED.test(t) || INSTRUCT.test(t))
    check(!hits.length, `no system name and no instruction in any card's words (${SAWTEXT.length} texts read)`, hits.slice(0, 3).join(' | ')) }
  check(!errors.length, 'no page errors', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL ' + (e && e.stack || e)); if (errors.length) console.log('page errors: ' + errors.slice(0, 4).join(' | ')) }

if (MUT && !mutHit) { console.log(`FAIL MUTATE=${MUT} changed nothing it was meant to`); failures++ }
const line = `${oks} checks; answers ${ANSWERS.join(', ')}; ${loads} loads, ${taps} taps; ${measured} lines measured against their pixels, the least ${worst === Infinity ? '-' : worst.toFixed(2)}:1 (${worstAt}); body text at least ${minBody === Infinity ? '-' : minBody.toFixed(1)}px, any text at least ${minAny === Infinity ? '-' : minAny.toFixed(1)}px`
console.log(failures ? `FAIL study 43: ${failures} failing, ${line}` : `PASS study 43: ${line}`)
cleanup(); process.exit(failures ? 1 : 0)
