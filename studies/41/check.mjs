#!/usr/bin/env node
// Study 41 check: the six ideas live BEHIND six facets of the stone, never on screen at rest; a tap on its facet opens an idea, its tools and
// the one line that says why that facet holds it. Its own readers, kept apart from the page: IDEAS is read out of /v2/home.js here, and every
// way's rule is recounted here in node from the geometry the page reports (the cut, the poem's title and door lines, the where line, the name,
// the version mark, the date's facet), never taken from the page's answer.
//   static: six ideas, every tool with its sentence; the page copies none of IDEAS' words; no instruction text (the page's own words are the name,
//           the way out and the switch); every dial in defaults.json is read; way b has a stated reason for every idea in IDEAS
//   sweep (HOME.plant, makeWorld itself, off screen): every photograph with two poems (154 worlds) x 390x844, 375x667, 430x932, 844x390,
//           1440x900, fresh and crossed: in every way, six ideas behind six distinct drawn facets, none the title's, a door's or the date's,
//           each a finger can land on; the facets are the ones the way's rule picks, recounted; each basis line says what the recount says
//   live, at 390x844, 375x667, 430x932, 844x390 and 1440x900 (touch on the phones), every way, on today's stone and two worlds (Rainier with
//           "An Ode to Aspens", Provincetown with "Large objects exert a gravitational pull"): no idea's name on screen at rest; the marks the way
//           promises (a: six threads at rest, b: six washes, d: none until the first facet tap, then six); each facet's tap opens its own idea
//           (name, intro, every tool, boundary, the basis line), nothing else of IDEAS; a second tap on the same facet opens its first tool;
//           a touch elsewhere only closes it; what opens reads to WCAG AA (4.5:1) against the real pixels under it; no console errors.
// Run: node studies/41/check.mjs   (ONLY_VP=390x844,... · WAYS=a,b · SWEEP=0 skips the sweep · SWEEP=only stops after it · MUTATE=share|names
// to watch it go red). Screenshots: studies/41/shots/ (gitignored).
import { spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, createReadStream, rmSync, mkdtempSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const SCREENS = [[390, 844, true], [375, 667, true], [430, 932, true], [844, 390, true], [1440, 900, false]]
const VPS = SCREENS.filter(([w, h]) => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(w + 'x' + h))
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8')

/* ---------- IDEAS, read here on its own (test_wall's way: the literal, evaluated alone) ---------- */
function literal(src, name) { const at = src.indexOf('var ' + name + ' = '); const s0 = at + ('var ' + name + ' = ').length; let depth = 0, q = null
  for (let i = s0; i < src.length; i++) { const c = src[i]
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue } if (c === "'" || c === '"') { q = c; continue }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue }
    if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return vm.runInNewContext('(' + src.slice(s0, i + 1) + ')') } }
const IDEAS = literal(read('v2/home.js'), 'IDEAS')
const NAMES = IDEAS.map(I => I.name)
const WORDS = new Set(IDEAS.flatMap(I => [I.name, ...I.parts, I.detail.intro, ...I.detail.tools, I.detail.boundary]))
const BANNED = /day[\s-]?flow/i // the system's working name (tools/test_wall.mjs, Kahran 2026-10-27)
const WAYS = (process.env.WAYS || 'a,b,d').split(',')
const DATA = JSON.parse(read('v2/data.json')), XJ = JSON.parse(read('v3/crossings.json'))
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const dateOf = src => { const r = XJ.photos.find(p => p.src === src); if (!r) return null; const [y, m] = r.taken.split('-'); return MON[+m - 1] + ' ' + y }

/* ---------- static ---------- */
const page = read('studies/41/index.html'), stone = read('studies/41/stone.js'), defaults = JSON.parse(read('studies/41/defaults.json'))
check(IDEAS.length === 6 && IDEAS.every(I => I.parts.length === I.detail.tools.length), 'six ideas, every tool with its sentence', IDEAS.map(I => I.name + ' ' + I.parts.length).join(', '))
{ const copied = [...WORDS].filter(t => t.length > 24 && (page.includes(t) || stone.includes(t) || JSON.stringify(defaults).includes(t)))
  check(!copied.length, 'the page reads IDEAS live and copies none of its words', copied.slice(0, 2).join(' | ')) }
{ const body = /<body>([\s\S]*?)<noscript>/.exec(page)[1].replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems × v3 v2 v1', 'no instruction text: the page\'s own words are the name, the way out, the close and the switch', body) }
{ const src = page + '\n' + stone, unread = Object.keys(defaults).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(src) && !src.includes(`var(--${k}`))
  const css = [...src.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].filter(m => m[1] in defaults && Number(m[2]) !== Number(defaults[m[1]]) && m[2] !== String(defaults[m[1]]))
  check(!unread.length && !css.length && ['a', 'b', 'd'].includes(defaults['ideas-way']), `every dial is read (${Object.keys(defaults).length}), CSS fallbacks equal defaults.json, the default way is one of the three (${defaults['ideas-way']})`, unread.concat(css.map(m => m[1])).join(', ')) }
{ const table = /const MEANING = \[([\s\S]*?)\]\]\n/.exec(stone)?.[1] || '', named = [...table.matchAll(/^\s*\['([^']+)'/gm)].map(m => m[1])
  check(NAMES.every(n => named.includes(n)) && named.every(n => NAMES.includes(n)) && named.length === 6, 'way b states a reason for every idea in IDEAS, and for nothing else', `table: ${named.join(', ')}`) }
check(!/id="names"/.test(page) && !/namesEl|#names/.test(stone), 'the always-on names are gone: no #names, nothing draws them')

/* ---------- geometry, recounted here ---------- */
const inPoly = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
const gap = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3])))
function reach(P, r) { if (inPoly([r[0] + r[2] / 2, r[1] + r[3] / 2], P)) return 0; let d = Infinity
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
    for (let s = 0; s <= n; s++) d = Math.min(d, gap([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n, 0, 0], r)) } return d }
const seam = (P, Q) => P.filter(p => Q.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5)).length >= 2
const crossed = (r, cells, drawn) => { const out = new Set(); for (const b of r) { const p = [b[0] + b[2] / 2, b[1] + b[3] / 2]; for (const i of drawn) if (inPoly(p, cells[i])) out.add(i) } return out } // the facet under each line of the words' middle
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'], px = d => Math.round(d) + ' px'
/* each way's rule, recounted from the page's geometry: a, d the six legal facets nearest the where line, IDEAS' order left to right along it;
   b each idea the nearest free facet to its thing, in the table's order, Self-healing the one sharing most seams with the other five */
function recount(r, way) {
  const L = r.legal, C = r.cells, ct = r.cents
  if (way !== 'b') { const near = L.map(i => ({ i, d: reach(C[i], r.where) })).sort((a, b) => a.d - b.d || a.i - b.i).slice(0, 6), along = near.slice().sort((a, b) => ct[a.i][0] - ct[b.i][0] || ct[a.i][1] - ct[b.i][1])
    return along.map((x, k) => ({ k, i: x.i, basis: `nearest ‘${r.whereWords}’ · ${px(x.d)} · ${ORD[k]} of six along it` })) }
  const free = new Set(L), out = [], take = (name, i, basis) => { free.delete(i); out[NAMES.indexOf(name)] = { k: NAMES.indexOf(name), i, basis } }
  const nearest = rect => [...free].map(i => ({ i, d: reach(C[i], rect) })).sort((a, b) => a.d - b.d || a.i - b.i)[0]
  let x = nearest(r.where); take('Context', x.i, `nearest ‘${r.whereWords}’ · ${px(x.d)} · the place and the sky it states are what this idea gathers`)
  x = nearest(r.titleBox); take('Topically suggesting', x.i, `nearest the title, ‘${r.poemTitle}’ · ${px(x.d)} · today’s poem is the suggestion this moment made`)
  x = nearest(r.name); take('Home', x.i, `nearest his name · ${px(x.d)} · this page is one of the things the home runs`)
  { // no date facet: the caption, as the page falls back
    const Y = r.year >= 0 ? C[r.year] : null, yc = Y ? [ct[r.year][0], ct[r.year][1], 0, 0] : r.cap, y = [...free].map(i => ({ i, nb: !!Y && seam(C[i], Y), d: reach(C[i], yc) })).sort((a, b) => b.nb - a.nb || a.d - b.d || a.i - b.i)[0]
    take('Keeping track', y.i, !Y ? `nearest the caption, the photograph’s place · ${px(y.d)} · the record is kept by where and when` : y.nb ? `beside the date, ${r.date} · a seam shared with it · the record is kept by when` : `nearest the date, ${r.date} · ${px(y.d)} · the record is kept by when`) }
  x = nearest(r.vs); take('Staying up to date', x.i, `nearest v3 · v2 · v1 · ${px(x.d)} · the site kept current, its earlier versions still open`)
  { const five = out.filter(Boolean).map(o => o.i), mid = five.reduce((s, i) => [s[0] + ct[i][0] / 5, s[1] + ct[i][1] / 5], [0, 0])
    const y = [...free].map(i => ({ i, n: five.filter(j => seam(C[i], C[j])).length, d: Math.hypot(ct[i][0] - mid[0], ct[i][1] - mid[1]) })).sort((a, b) => b.n - a.n || a.d - b.d || a.i - b.i)[0]
    take('Self-healing', y.i, y.n ? `sharing a seam with ${y.n} of the five it watches · they are kept running from here` : `nearest the middle of the five it watches · ${px(y.d)}`) }
  return out }

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
const HTTP = await freePort(), CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 's41-'))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' }
/* MUTATE (to watch this check go red, never committed): share = two ideas behind one facet; names = the six names back on screen */
const MUT = process.env.MUTATE || ''
const mutate = (u, body) => {
  if (u !== '/studies/41/stone.js') return body
  let s = body.toString('utf8')
  if (MUT === 'share') s = s.replace("return IDEAS.map((I, k) => ({ k, i: along[k].i,", "return IDEAS.map((I, k) => ({ k, i: along[k === 1 ? 0 : k].i,").replace("free.delete(pick.i); out[k]", "if (name !== 'Context') free.delete(pick.i); out[k]")
  if (MUT === 'names') s = s.replace("document.body.dataset.ready = 'yes'", "{ const n = document.createElement('div'); n.id = 'names-back'; n.style.cssText = 'position:fixed;left:20px;top:120px;z-index:6;font:400 11px/2 sans-serif;color:#fff'; n.textContent = IDEAS.map(I => I.name).join(' '); document.body.append(n) }\ndocument.body.dataset.ready = 'yes'")
  if (MUT && s === body.toString('utf8')) throw new Error('mutation ' + MUT + ' found nothing to change')
  return Buffer.from(s) }
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
  if (MUT && u === '/studies/41/stone.js') return res.end(mutate(u, readFileSync(f)))
  createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, taps = 0, sweepLine = ''

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' ')) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  // pinned, as 37 and 40 pin them: the clock (8:40 pm New York, 8 Nov 2026) and the sky, so a run tomorrow places what a run today placed
  const PIN = Date.UTC(2026, 10, 9, 1, 40)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {} })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-08T06:35'], sunset: ['2026-11-08T16:44'] } }
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }

  let VP
  const view = async ([w, h, mobile]) => { VP = { w, h, mobile }; await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 }) }
  const open = async q => { loads++; await cdp.send('Page.navigate', { url: `${BASE}/studies/41/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!window.HOME && !!HOME.world && ['stone', 'world'].includes(HOME.at) && (HOME.at === 'stone' || HOME.world.arrived) && HOME.dealt`), 'page ' + q, 300); await sleep(900) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')); return path.join(SHOTS, name) }
  const tap = async ([x, y]) => { taps++
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(30); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) }
    await sleep(160) }
  // what a visitor can read at rest: every visible text node, and every title and label a pointer or a screen reader would surface
  const restText = () => cdp.eval(`(() => { const out = []; const walk = n => { if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(), p = n.parentElement
      if (t && p.getClientRects().length && !p.closest('[hidden], noscript, #why') && getComputedStyle(p).visibility !== 'hidden' && +getComputedStyle(p).opacity > .02 && (() => { for (let e = p; e; e = e.parentElement) if (+getComputedStyle(e).opacity < .02) return false; return true })()) out.push(t) } else n.childNodes.forEach(walk) }
    walk(document.body); document.querySelectorAll('[title], [aria-label]').forEach(e => out.push(e.getAttribute('title') || '', e.getAttribute('aria-label') || '')); return out.join(' | ') })()`)

  /* ---------- the sweep: every world, five screens, fresh and crossed, every way ---------- */
  const live = new Set(readdirSync(path.join(ROOT, 'poems')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)))
  const poems = DATA.poems.filter(p => live.has(p.slug)), photos = DATA.photos.filter(p => existsSync(path.join(ROOT, 'v3/regions', p.src.split('/').pop().replace(/\.[a-z]+$/i, '') + '.json')))
  const keys = photos.flatMap((p, k) => [0, 46].map(o => poems[(k * 7 + o) % poems.length].slug + '~' + p.src.replace('/photos/', '')))
  if (process.env.SWEEP !== '0') {
    const bad = [], seen = { n: 0, slow: 0, recut: 0, nb: 0, watch: [] }
    for (const sc of SCREENS) { await view(sc); await open('t=a')
      for (const key of keys) for (const cr of [false, true]) {
        const trail = cr ? [keys[(keys.indexOf(key) + 1) % keys.length]] : [], t1 = Date.now(), r = await cdp.eval(`HOME.plant(${JSON.stringify(key)}, ${JSON.stringify(trail)})`); seen.n++; seen.slow = Math.max(seen.slow, Date.now() - t1)
        const tag = `${sc[0]}x${sc[1]} ${cr ? 'crossed into' : 'fresh'} ${key}`
        if (!r) { bad.push(`${tag}: no world`); continue } if (r.cutT) seen.recut++
        // the barred facets, recounted from the words' own boxes
        const title = crossed(r.titleRects, r.cells, r.drawn), doors = crossed(r.doorRects, r.cells, r.drawn)
        for (const way of WAYS) { const got = r.ways[way]
          if (!got || got.length !== 6 || got.some(x => !x)) { bad.push(`${tag} ${way}: not six ideas (${got ? got.filter(Boolean).length : 0})`); continue }
          const fs = got.map(x => x.i)
          if (new Set(fs).size !== 6) bad.push(`${tag} ${way}: two ideas share a facet (${fs})`)
          for (const x of got) { const why = [!r.drawn.includes(x.i) && 'not drawn', title.has(x.i) && 'the title\'s', doors.has(x.i) && 'a door\'s', x.i === r.year && 'the date\'s', !r.touch[x.i] && 'no place for a finger'].filter(Boolean)
            if (why.length) bad.push(`${tag} ${way}: ${NAMES[x.k]} behind facet ${x.i}, ${why.join(', ')}`) }
          const want = recount(r, way)
          for (const [k, x] of got.entries()) { if (x.k !== k) bad.push(`${tag} ${way}: idea ${k} out of order`)
            if (!want[k] || want[k].i !== x.i) bad.push(`${tag} ${way}: ${NAMES[k]} behind ${x.i}, the rule says ${want[k] && want[k].i}`)
            else if (want[k].basis !== x.basis) bad.push(`${tag} ${way}: ${NAMES[k]}'s basis says “${x.basis}”, the recount “${want[k].basis}”`) }
          if (way === 'b') { if (/beside the date/.test(got[NAMES.indexOf('Keeping track')].basis)) seen.nb++; seen.watch.push(got[NAMES.indexOf('Self-healing')].n || 0) } } } }
    sweepLine = `${keys.length} worlds (all ${photos.length} photographs, ${new Set(keys.map(k => k.split('~')[0])).size} poems) x ${SCREENS.length} screens x fresh and crossed = ${seen.n} placements x ${WAYS.length} ways`
    const watch = seen.watch.length ? (seen.watch.reduce((a, b) => a + b, 0) / seen.watch.length).toFixed(1) : '-'
    check(!bad.length, `every way puts all six ideas behind six distinct facets, never the title's, a door's or the date's, each where a finger can land, as its rule says, recounted, its basis line word for word: ${sweepLine}; ${seen.recut} on a re-seeded cut; in b Keeping track shares a seam with the date in ${seen.nb} of ${seen.watch.length}, Self-healing touches ${watch} of the five on average; slowest world ${seen.slow} ms`, `${bad.length} wrong: ` + bad.slice(0, 6).join(' | '))
    if (process.env.SWEEP === 'only') { console.log(bad.slice(0, 40).join('\n')); throw new Error('SWEEP=only: stopped after the sweep') } }

  /* ---------- live: rest, marks, taps, depth, readability ---------- */
  const RAINIER = 'an-ode-to-aspens~alpine-lake.jpg'
  const PTOWN = 'large-objects~' + (photos.find(p => /Provincetown/.test(p.caption) && keys.includes('large-objects~' + p.src.replace('/photos/', ''))) || photos.find(p => /Provincetown/.test(p.caption))).src.replace('/photos/', '')
  const SHOT = []
  for (const sc of VPS) { await view(sc); const vtag = `${sc[0]}x${sc[1]}`
    for (const way of WAYS) for (const wk of [null, RAINIER, PTOWN]) {
      const label = `${vtag} ${way} ${wk ? wk.split('~')[0] : 'home'}`
      await open('t=' + way + (wk ? '&w=' + encodeURIComponent(wk) : ''))
      const s = await cdp.eval('HOME.state')
      check(s.way === way && s.ideas.length === 6 && new Set(s.ideas.map(x => x.i)).size === 6 && s.kinds.filter(k => k === 'idea').length === 6, `${label}: six facets hold the six ideas`, JSON.stringify(s.ideas.map(x => x.i)))
      /* at rest: no name, the marks the way promises */
      const rest = await restText(), shown = NAMES.filter(n => new RegExp('(^|[^a-z])' + n.replace(/ /g, '\\s+') + '([^a-z]|$)', 'i').test(rest))
      check(!shown.length, `${label}: at rest no idea's name is on screen, in a title or in a label`, shown.join(', '))
      const marks = await cdp.eval('HOME.marks()'), on = marks.filter(m => m.thread > .05 || m.wash > .05).length
      const promised = way === 'd' ? 0 : 6
      check(on === promised && (way !== 'b' || marks.every(m => m.wash > .05 && !m.thread)) && (way === 'b' || marks.every(m => !m.wash)), `${label}: at rest ${promised ? 'six facets carry their idea\'s hue (' + (way === 'b' ? 'a breath through it' : 'a thread round the rim') + ')' : 'the stone is pure: no facet marked'}`, JSON.stringify(marks))
      if (sc[0] === 390 && wk) SHOT.push(await shot(`41-${way}-${wk === RAINIER ? 'rainier' : 'provincetown'}-rest.png`))
      /* every idea's facet, tapped */
      const wrong = [], clash = [], aa = [], seenCovered = []
      for (const [k, I] of IDEAS.entries()) {
        const at = await cdp.eval(`HOME.tapIdea(${k})`); if (!at || !at.pt) { wrong.push(`${I.name}: no place to tap`); continue }
        await tap(at.pt)
        const st = await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.openAt === ${at.i} && document.querySelector('#tools').classList.contains('on') && (() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect()
          return { box: [r.left, r.top, r.width, r.height], h2: t.querySelector('h2').textContent, href: t.querySelector('h2 a')?.getAttribute('href') ?? null, parts: [...t.querySelectorAll('li > button')].map(b => b.textContent),
            sents: [...t.querySelectorAll('li > p')].map(p => p.textContent), basis: t.querySelector('.basis')?.textContent ?? null, basisSeen: (() => { const b = t.querySelector('.basis'); if (!b) return false; const q = b.getBoundingClientRect(); return q.height > 0 && q.top >= r.top - 1 && q.bottom <= r.bottom + 1 })(), text: t.innerText } })()`), 'idea ' + I.name, 30, 60).catch(() => null)
        if (!st) { wrong.push(`${I.name}: its facet ${at.i} at ${at.pt.map(Math.round)} did not open it (${await cdp.eval('JSON.stringify({ open: HOME.open, at: HOME.at, key: HOME.world.key, last: HOME.last, why: HOME.whyOpen, el: document.elementFromPoint(' + at.pt + ').id || document.elementFromPoint(' + at.pt + ').className })')})`); await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); continue }
        await sleep(380)
        const plan = s.ideas.find(x => x.k === k)
        if (st.h2 !== I.name || st.href !== (I.href || null) || st.parts.join('|') !== I.parts.join('|') || st.sents.join('|') !== I.detail.tools.join('|') || !st.text.includes(I.detail.intro) || !st.text.includes(I.detail.boundary)) wrong.push(`${I.name}: not its own words`)
        if (st.basis !== plan.basis || !st.basis || !st.basisSeen) wrong.push(`${I.name}: basis “${st.basis}” vs plan “${plan.basis}”${st.basisSeen ? '' : ', not in view as it opens'}`)
        const bare = [I.detail.intro, ...I.detail.tools, I.detail.boundary, ...I.parts].reduce((t, w) => t.split(w).join(' '), st.text), others = NAMES.filter(n => n !== I.name && bare.includes(n)); // its own sentences may say a word like Home if (others.length) wrong.push(`${I.name} shows ${others.join(', ')}`)
        const tb = st.box; for (const [n, r] of [['poem', s.poem], ['name', s.mat], ['switch', s.vs]]) if (r[2] > 0 && tb[0] < r[0] + r[2] && tb[0] + tb[2] > r[0] && tb[1] < r[1] + r[3] && tb[1] + tb[3] > r[1]) clash.push(`${I.name} over the ${n}`)
        if (tb[0] < 0 || tb[1] < 0 || tb[0] + tb[2] > s.W + .5 || tb[1] + tb[3] > s.H + .5) clash.push(`${I.name} off the screen`)
        // WCAG AA against the real pixels: the stone's canvas under the panel, its ground laid over each pixel, every text colour (its opacity included) against the worst of them
        const c = await cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(), cv = document.getElementById('stone'), d = devicePixelRatio, x = cv.getContext('2d')
          const img = x.getImageData(Math.max(0, Math.floor(r.left * d)), Math.max(0, Math.floor(r.top * d)), Math.max(1, Math.floor(r.width * d)), Math.max(1, Math.floor(r.height * d))).data
          const bg = getComputedStyle(t).backgroundColor.match(/[\\d.]+/g).map(Number), A = bg[3] ?? 1
          const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, Lof = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
          const grounds = []; for (let k = 0; k < img.length; k += 4 * 7) grounds.push([0, 1, 2].map(j => bg[j] * A + img[k + j] * (1 - A)))
          const texts = [...t.querySelectorAll('h2, p:not([hidden]), li > button, .basis')].map(e => { const cs = getComputedStyle(e), m = cs.color.match(/[\\d.]+/g).map(Number); let op = 1; for (let n = e; n && n !== t.parentElement; n = n.parentElement) op *= +getComputedStyle(n).opacity; return { sel: e.tagName + (e.className ? '.' + e.className : ''), c: m, a: (m[3] ?? 1) * op } })
          let worst = { r: 99 }
          for (const T of texts) for (const G of grounds) { const fg = [0, 1, 2].map(j => T.c[j] * T.a + G[j] * (1 - T.a)), L1 = Lof(fg), L2 = Lof(G), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); if (ratio < worst.r) worst = { r: ratio, sel: T.sel } }
          return { r: +worst.r.toFixed(2), sel: worst.sel, n: grounds.length } })()`)
        aa.push(c.r); if (c.r < 4.5) wrong.push(`${I.name}: ${c.sel} reads ${c.r}:1 against the stone under it`)
        if (sc[0] === 390 && wk && k === 0) SHOT.push(await shot(`41-${way}-${wk === RAINIER ? 'rainier' : 'provincetown'}-open.png`))
        // tap two: its own facet again (where the open panel leaves it showing) opens its first tool
        const at2 = await cdp.eval(`HOME.tapIdea(${k}, true)`)
        if (at2 && at2.pt) await tap(at2.pt); await sleep(150)
        const two = await cdp.eval(`({ open: HOME.open, first: document.querySelector('#tools li:first-child > button')?.getAttribute('aria-expanded'), said: document.querySelector('#tools li:first-child > p')?.hidden === false ? document.querySelector('#tools li:first-child > p').textContent : null })`)
        if (!at2 || !at2.pt) seenCovered.push(I.name)
        else if (two.open !== k || two.first !== 'true' || two.said !== I.detail.tools[0]) wrong.push(`${I.name}: a second tap on its facet did not open its first tool (${JSON.stringify(two).slice(0, 80)})`)
        // a touch elsewhere only closes it, and goes nowhere
        const at0 = await cdp.eval('HOME.at + "|" + HOME.world.key')
        const free = await cdp.eval(`(() => { const r = document.querySelector('#tools').getBoundingClientRect(), mine = ${at.i}, cs = HOME.state.cells, inP = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
          for (const [x, y] of [[innerWidth / 2, 6], [innerWidth - 8, innerHeight / 2], [8, innerHeight / 2], [innerWidth / 2, innerHeight - 6], [innerWidth - 8, 8], [8, 8]]) if ((x < r.left || x > r.right || y < r.top || y > r.bottom) && !document.elementFromPoint(x, y).closest('a, button, .verse') && !inP([x, y], cs[mine])) return [x, y]; return null })()`)
        if (free) { await tap(free); await sleep(250)
          const after = await cdp.eval('({ open: HOME.open, at: HOME.at + "|" + HOME.world.key, busy: HOME.busy })')
          if (after.open !== -1 || after.at !== at0 || after.busy) wrong.push(`${I.name}: a touch elsewhere ${after.open !== -1 ? 'left it open' : 'moved the stone to ' + after.at}`) }
        else { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150) } }
      check(!wrong.length, `${label}: each of the six facets opens its own idea (name, page, sentence, every tool, boundary) with its basis line and no other idea's name; a second tap opens its first tool; a touch elsewhere only closes it; AA against the pixels under it (worst ${Math.min(...aa).toFixed(1)}:1)`, wrong.slice(0, 3).join(' | '))
      if (seenCovered.length) console.log(`note ${label}: the open panel covers the whole of ${seenCovered.join(', ')}'s facet; its tools are in the panel`)
      check(!clash.length, `${label}: an open idea keeps clear of the poem, the name and the switch, on the screen`, clash.slice(0, 3).join(', '))
      if (way === 'd') { const m2 = await cdp.eval('HOME.marks()'); check(m2.length === 6 && m2.every(m => m.thread > .05), `${label}: after the first facet tap the six threads show`, JSON.stringify(m2)) }
      const txt = await cdp.eval('document.body.innerText')
      check(!BANNED.test(txt), `${label}: the system's working name never shows`) } }
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '))
  if (SHOT.length) console.log('shots: ' + SHOT.join(' '))
} catch (e) { if (!/SWEEP=only/.test(e.message)) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) } }

console.log(failures ? `FAIL study 41: ${failures} of ${oks + failures} checks failed` : `PASS study 41: ${oks} checks; ${sweepLine || 'sweep skipped'}; in ${loads} loads at ${VPS.map(([w, h]) => w + 'x' + h).join(', ')}, ${taps} taps, each idea behind its own facet in ways ${WAYS.join(', ')}, no name on screen at rest`)
cleanup(); process.exit(failures ? 1 : 0)
