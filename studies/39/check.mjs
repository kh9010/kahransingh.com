#!/usr/bin/env node
// Study 39 check: 33's masses cut, through a crossing. Every crossing must land on the next photograph's own masses cut, and every frame
// between must account for every facet.
//   1 · in node, over the corpus (photograph pairs x 3 sizes x every ?x= and reduced motion), from cross.js's own poses:
//       the first frame is this cut and the last is the next one, exactly; the count of facets never changes in a morph; no facet leaves
//       or joins the ledger while it is seen; and every big step between two frames is a fast move, not a jump: cut finer, it spreads out
//       (a facet that vanishes, appears or snaps stays one step however fine the clock).
//   2 · in the page at 1440x900, 390x844 and 844x390, for every ?x=: a crossing through a door line and one through a facet door, each
//       driven frame by frame on the page's own clock (S39.step), the drawn ledger held to the same rules, the frame at t = 0 equal to the
//       stone at rest before and the frame at t = 1 equal to the stone at rest after (nothing snaps at either end); after it, the cut is
//       recounted with 33's method (studies/33/cut.js and 33's recount, copied below): the next photograph's masses cut, its sites the
//       ones 33's cut gives for that photograph at that size, every anchor on a border regions.json records, every seam where it says.
//       Reduced motion: the same rules, and no facet moves. 33 as loved stays held: the photograph whole at rest, the door lines arriving
//       in their order, no console error.
// Screenshots, mid-crossing frames among them: studies/39/shots/ (gitignored). Run: node studies/39/check.mjs
//   (ONLY_VP=desk,phone,side · XS=slide,grow · PAIRS=77 for the whole corpus in node)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync, createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const req = createRequire(import.meta.url)
const K33 = req(path.join(ROOT, 'studies/33/cut.js')) // 33's method, from 33's own file
const K = req(path.join(HERE, 'cut.js')), X = req(path.join(HERE, 'cross.js'))
const REG = JSON.parse(readFileSync(path.join(HERE, 'regions.json'), 'utf8')).photos
const DATA = JSON.parse(readFileSync(path.join(ROOT, 'v2/data.json'), 'utf8'))
const DEF = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'))
const XS = (process.env.XS || X.XS.join(',')).split(',')
const SIZES = [{ id: 'desk', w: 1440, h: 900, n: +DEF['facets-desk'], mobile: false }, { id: 'phone', w: 390, h: 844, n: +DEF['facets-phone'], mobile: true }, { id: 'side', w: 844, h: 390, n: +DEF['facets-low'], mobile: true }]
  .filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
const DIALS = { share: +DEF['cut-share'], gap: +DEF['cut-gap'], spacing: +DEF['cut-spacing'], fillGap: +DEF['cut-fill-gap'], lineMin: +DEF['cut-line-min'] }
const XD = { fire: +DEF['cross-fire'], gap: +DEF['cut-gap'], holdTone: +DEF['hold-tone'], holdNear: +DEF['hold-near'], growSpread: +DEF['grow-spread'], border: +DEF['grow-border'], tone: +DEF['grow-tone'],
  crack: +DEF['shatter-crack-px'], drop: +DEF['shatter-drop'], spin: +DEF['shatter-spin'], sink: +DEF['shatter-sink'], seamReach: +DEF['seam-reach'] }
const WIND = +DEF.wind, MOMENT = { at: '2026-11-08T15:00:00.000Z', lat: 40.71, lon: -74.01, place: 'New York' }
const sleep = ms => new Promise(r => setTimeout(r, ms))
let failures = 0
const check = (ok, label, detail) => { if (ok) { if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }

/* ---------- 33's recount, copied verbatim from studies/33/check.mjs (the masses parts are what 39 needs; the rest is kept whole) ---------- */
function coverTo(R, W, H, u, v) { const a = R.a, b = W / H; return a > b ? [((u - .5) * (a / b) + .5) * W, v * H] : [u * W, ((v - .5) * (b / a) + .5) * H] }
const distLine = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return Math.abs(dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / (Math.hypot(dx, dy) || 1) }
function recount(C, R, W, H, cells, claimed) {
  const bad = [], st = 1 + Math.min(C.wind ?? 8, 40) / 45, dS = (p, q) => Math.hypot((p[0] - q[0]) / st, p[1] - q[1]), S = C.sites, T = C.tags
  const near = p => S.map((s, i) => [dS(s, p), i]).sort((a, b) => a[0] - b[0])
  let anchors = 0
  for (const F of C.features) for (const A of F.anchors) { anchors++
    const where = `${F.kind}#${F.id}.${A.k}`
    if (F.kind === 'horizon' || F.kind === 'line') { const L0 = F.kind === 'horizon' ? R.horizon : R.line
      if (!L0) { bad.push(where + ': no such line in regions.json'); continue }
      const e = distLine(A.p, coverTo(R, W, H, ...L0.p0), coverTo(R, W, H, ...L0.p1)); if (e > .75) bad.push(`${where}: ${e.toFixed(2)}px off the ${F.kind} regions.json records`) }
    else if (F.kind === 'mass-border' || F.kind === 'edge' || F.kind === 'eye-outline') {
      const list = F.kind === 'mass-border' ? R.masses.anchors : F.kind === 'edge' ? R.edges.anchors : (R.eye || {}).outline || [], E = list[A.k]
      if (!E) { bad.push(where + ': no such point in regions.json'); continue }
      const q = coverTo(R, W, H, E[0], E[1]); if (Math.hypot(q[0] - A.p[0], q[1] - A.p[1]) > .75) bad.push(`${where}: not at the recorded point`)
      if (Math.abs(E[2] - A.n[0]) > .01 || Math.abs(E[3] - A.n[1]) > .01) bad.push(`${where}: not across the recorded direction`)
      if (F.kind === 'mass-border' && (A.between[0] !== E[4] || A.between[1] !== E[5])) bad.push(`${where}: names the wrong tones`) }
    else bad.push(`${where}: a kind of line the masses cut does not have`)
    const nn = near(A.p), two = [nn[0][1], nn[1][1]].sort((a, b) => a - b).join(), pair = [...A.pair].sort((a, b) => a - b).join()
    if (two !== pair) bad.push(`${where}: the seam does not lie there (nearest sites ${two}, its pair ${pair})`)
    else if (Math.abs(nn[0][0] - nn[1][0]) > .01 * nn[0][0] + .05) bad.push(`${where}: its pair is not mirrored across it`)
    if (T[A.pair[0]].kind !== 'pair' || T[A.pair[0]].mate !== A.pair[1] || T[A.pair[0]].f !== F.id) bad.push(`${where}: its sites do not say so`) }
  const basis = (i, j) => { const a = T[i], b = T[j]
    if (a.kind === 'geometric' || b.kind === 'geometric') return 'geometric'
    if (a.kind === 'pair' && a.mate === j) return 'on'
    if (a.kind === 'pair' && b.kind === 'pair') return a.f === b.f ? 'along' : 'meet'
    if (a.kind === 'pair' || b.kind === 'pair') return 'beside'
    return 'split' }
  const kinds = {}; let edges = 0
  cells.forEach((P, i) => { if (P.length < 3) return
    P.forEach((a, e) => { const b = P[(e + 1) % P.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], fr = v => Math.abs(v) < .6
      const frame = (fr(a[0]) && fr(b[0])) || (fr(a[0] - W) && fr(b[0] - W)) || (fr(a[1]) && fr(b[1])) || (fr(a[1] - H) && fr(b[1] - H))
      const got = claimed[i] && claimed[i].edges[e]; edges++
      if (frame) { kinds.frame = (kinds.frame || 0) + 1; if (!got || got.kind !== 'frame') bad.push(`facet ${i} edge ${e}: the frame, claimed ${got && got.kind}`); return }
      const nn = near(m).filter(x => x[1] !== i), j = nn[0][1], k = basis(i, j); kinds[k] = (kinds[k] || 0) + 1
      if (!got || got.to !== j || got.kind !== k) bad.push(`facet ${i} edge ${e}: recount ${k} with site ${j}, claimed ${got && got.kind} with ${got && got.to}`) }) })
  const geo = T.filter(t => t.kind === 'geometric').length, paired = T.filter(t => t.kind === 'pair').length
  if (geo && !(C.fallback && /geometric/.test(C.fallback.to) && C.fallback.why && C.fallback.why !== 'none')) bad.push(`${geo} geometric sites with no declared fallback`)
  if (!C.fallback) { if (C.ran !== C.logic) bad.push(`ran ${C.ran} for ${C.logic} without saying so`); const own = paired + T.filter(t => t.kind === 'eye').length; if (anchors < 2 || own / S.length < .3) bad.push(`undeclared, yet only ${anchors} anchors and ${own}/${S.length} sites from the photograph's lines`) }
  else { if (!C.fallback.why) bad.push('fell back without a reason'); if (C.fallback.from !== C.logic || C.ran === C.logic) bad.push('the fallback does not name where it came from') }
  if (S.length !== cells.length) bad.push(`${S.length} sites, ${cells.length} facets`)
  return { bad, anchors, edges, kinds, paired, geo } }

/* ---------- the ledger rules, the same in node and in the page ---------- */
const SEEN = .02 // below this a facet is not seen
function diff(a, b, W, H) { // how far one facet travelled between two frames, in the worst of its three measures, each over its bound
  const s = Math.abs(a.seen - b.seen) / .2; if (a.seen <= SEEN || b.seen <= SEEN) return s // unseen, a facet's shape is nobody's business
  const ar = Math.abs(a.area - b.area) / (.03 * W * H), c = a.c && b.c && a.area > .002 * W * H && b.area > .002 * W * H ? Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) / (.04 * Math.max(W, H)) : 0
  return Math.max(s, ar, c) }
const lost = (e, W, H) => e.seen > SEEN && e.area > .0005 * W * H
function compare(A, B, W, H) { // [problems, worst step]: a facet seen in one frame and missing from the next (or back) is unaccounted
  const bad = [], ma = new Map(A.map(e => [e.id, e])), mb = new Map(B.map(e => [e.id, e])); let worst = 0, who = null
  for (const [id, e] of ma) if (!mb.has(id) && lost(e, W, H)) bad.push(`${id} vanished (seen ${e.seen}, ${Math.round(e.area)}px²)`)
  for (const [id, e] of mb) if (!ma.has(id) && lost(e, W, H)) bad.push(`${id} appeared from nowhere (seen ${e.seen})`)
  for (const [id, e] of ma) { const f = mb.get(id); if (!f) continue; const d = diff(e, f, W, H); if (d > worst) { worst = d; who = id } }
  return { bad, worst, who } }
/* walk a crossing's clock: every step, and where a step is big, the same interval cut 8 and then 64 times finer. A move spreads out; a jump does not */
async function walk(get, W, H, steps = 90) {
  const bad = []; let prev = await get(0), first = prev, biggest = 0, fine = 0; const frames = [prev]
  for (let s = 1; s <= steps; s++) { const t = s / steps, cur = await get(t), r = compare(prev.list, cur.list, W, H)
    bad.push(...r.bad.map(b => `t=${t.toFixed(3)}: ${b}`)); biggest = Math.max(biggest, r.worst)
    if (r.worst > 1) { let lo = (s - 1) / steps, span = 1 / steps, worst = r.worst, who = r.who
      for (const cut of [8, 8]) { let p = await get(lo), wmax = 0, at = lo; span /= cut
        for (let k = 1; k <= cut; k++) { const q = await get(lo + k * span), rr = compare(p.list, q.list, W, H); bad.push(...rr.bad.map(b => `t=${(lo + k * span).toFixed(4)}: ${b}`)); if (rr.worst > wmax) { wmax = rr.worst; at = lo + (k - 1) * span } p = q }
        fine++; lo = at; if (wmax <= Math.max(1, worst / cut * 2.5)) { worst = 0; break } worst = wmax }
      if (worst > 1) bad.push(`t=${t.toFixed(3)}: ${who} jumps (a step of ${worst.toFixed(2)}x its bound does not spread out on a finer clock)`) }
    prev = cur; frames.push(cur) }
  return { bad, first, last: prev, biggest, fine, frames } }
const seenSet = list => list.filter(e => e.seen > .99 && e.area > 0)
function same(list, rest, W, H, tol = 1) { // the seen facets of one frame are, one for one, the facets of the stone at rest
  const a = seenSet(list), b = rest.filter(e => e.area > 0), bad = []
  if (list.some(e => e.seen > .01 && e.seen <= .99 && e.area > .0005 * W * H)) bad.push('a facet half seen')
  if (a.length !== b.length) bad.push(`${a.length} facets seen, ${b.length} at rest`)
  const used = new Set()
  for (const e of a) { let best = -1, bd = Infinity; b.forEach((f, j) => { if (used.has(j)) return; const d = Math.hypot(e.c[0] - f.c[0], e.c[1] - f.c[1]); if (d < bd) { bd = d; best = j } })
    if (best < 0 || bd > tol || Math.abs(e.area - b[best].area) > Math.max(2, b[best].area * .005)) { bad.push(`a facet at ${e.c.map(Math.round)} matches none at rest (${bd.toFixed(2)}px, ${Math.round(e.area)} vs ${best < 0 ? '-' : Math.round(b[best].area)}px²)`); continue } used.add(best) }
  return bad }

/* ---------- 1 · the corpus, in node ---------- */
{ const photos = DATA.photos.map(p => p.src).filter(s => REG[s]), N = Math.min(photos.length, +(process.env.PAIRS || 26)), tally = {}, problems = []
  const cutOf = (src, vp) => { const C = K.cut({ R: REG[src], W: vp.w, H: vp.h, count: vp.n, logic: 'masses', wind: WIND, seed: src, moment: MOMENT, dials: DIALS }); C.cells = K.voronoi(C.sites, vp.w, vp.h, WIND); return C }
  const rest = C => C.cells.map(P => ({ ...X.seenOf({ P }), seen: 1 })).map(e => ({ area: e.area, c: e.c }))
  for (const vp of SIZES) for (let k = 0; k < N; k++) { const a = photos[Math.floor(k * photos.length / N)], b = photos[(Math.floor(k * photos.length / N) * 11 + 5) % photos.length]; if (a === b) continue
    const A = cutOf(a, vp), B = cutOf(b, vp), origin = [vp.w * (.2 + .6 * ((k * 37) % 100) / 100), vp.h * (.2 + .6 * ((k * 53) % 100) / 100)]
    for (const x of [...XS, 'calm']) { const P = X.plan({ x, A, B, RA: REG[a], RB: REG[b], W: vp.w, H: vp.h, wind: WIND, origin, D: XD })
      const get = t => ({ list: X.pose(P, t).entries.map(e => ({ id: e.id, seen: e.seen * (e.alpha > .002 ? 1 : 0), ...X.seenOf(e) })) })
      const r = await walk(get, vp.w, vp.h, 60), tl = tally[x] ||= { n: 0, biggest: 0, fine: 0, held: 0, movers: 0, tangled: 0 }; tl.n++; tl.biggest = Math.max(tl.biggest, r.biggest); tl.fine += r.fine
      if (P.movers) { tl.movers += P.movers.length; tl.held += P.movers.filter(m => m.held).length; if (P.tangle) tl.tangled++ }
      const ends = [...same(r.first.list, rest(A), vp.w, vp.h, .01).map(b => 't=0: ' + b), ...same(r.last.list, rest(B), vp.w, vp.h, .01).map(b => 't=1: ' + b)]
      if (P.movers) { const ids = new Set(); for (let s = 0; s <= 20; s++) { const L = X.pose(P, s / 20).entries; if (L.length !== vp.n) ends.push(`${L.length} facets at t=${s / 20}`) } }
      if (x === 'calm') { for (let s = 0; s <= 10; s++) if (X.pose(P, s / 10).entries.some(e => e.m.some((v, j) => v !== [1, 0, 0, 1, 0, 0][j]))) { ends.push('reduced motion moves a facet'); break } }
      if (r.bad.length || ends.length) problems.push(`${x} ${vp.id} ${a.replace('/photos/', '')}→${b.replace('/photos/', '')}: ${[...ends, ...r.bad].slice(0, 2).join(' | ')}`) } }
  const n = Object.values(tally).reduce((s, t) => s + t.n, 0)
  check(!problems.length, `corpus: ${n} crossings (${N} photograph pairs × ${SIZES.length} sizes × ${XS.length} ways + reduced motion) start on this cut, land on the next one exactly, and account for every facet in every frame`, `${problems.length} wrong: ${problems.slice(0, 3).join(' || ')}`)
  for (const [x, t] of Object.entries(tally)) console.log(`     ${x.padEnd(8)} fastest step ${t.biggest.toFixed(2)}x its bound, ${t.fine} steps cut finer and spread out${t.movers ? `; ${t.movers} movers${t.held ? ', ' + t.held + ' held' : ''}${t.tangled ? ', ' + t.tangled + ' left a near pass' : ''}` : ''}`) }

{ const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(DEF)
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)), clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
  check(X.XS.includes(DEF['crossing-way']) && DEF['cut-way'] === 'masses', `the defaults: ?x=${DEF['crossing-way']}, cut by masses`)
  const DJ = JSON.parse(readFileSync(path.join(HERE, 'doors.json'), 'utf8')), slugs = new Set(DATA.poems.map(p => p.slug))
  for (const v of Object.values(DJ.vocabs)) { Object.keys(v.poems).forEach(x => slugs.add(x)); v.words.forEach(w => w.poems.forEach(x => slugs.add(x))) }
  const gone = [...slugs].filter(x => !existsSync(path.join(ROOT, 'poems', x + '.html'))); check(!gone.length, `every one of ${slugs.size} poems the study can reach is a page on the site`, gone.join(', ')) }

/* ---------- 2 · in the page ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = http.createServer((q, res) => { // in-process: Python's http.server resets connections under a page this busy
  try { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
    const f = path.join(ROOT, path.normalize(p)); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) }
  catch { res.writeHead(500); res.end() } })
await new Promise(r => server.listen(0, '127.0.0.1', r))
const HTTP = server.address().port
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
function findShell() { if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p } return null }
class CDP { constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value } }

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const CDPP = await freePort()
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
process.on('exit', () => { try { chrome.kill() } catch {} })
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], t0 = Date.now()
try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  let VP = SIZES[0]
  const view = async vp => { VP = vp; await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const reduceMotion = on => cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] })
  const open = async q => { await cdp.send('Page.navigate', { url: `${BASE}/studies/39/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S39.world`), 'page ' + q, 300); await sleep(300) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 })
  const tap = async (x, y) => { if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(40); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) } }
  const restLedger = async () => { await park(); await cdp.eval('S39.still = true'); await sleep(900); return (await cdp.eval('S39.ledger')).list }
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S39.at, arrived: S39.world.arrived, lines: S39.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length
        if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join('')
        if (s.lines.some(l => l.door && l.shown && l.open === false)) bad = 'a shown door line whose door does not answer'
        if (s.arrived) break } await sleep(40) }
    check(!bad && last && last.arrived && last.lines.every(l => l.shown), `${label}: the poem arrives line by line in its order, doors open with their lines`, bad) }
  const restHolds = async label => { await cdp.eval('S39.still = true'); await sleep(500)
    const r = await cdp.eval('S39.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .02))
    check(r.length >= 6 && !bad.length, `${label}: at rest all ${r.length} sampled facets read as this photograph`, bad.slice(0, 4).map(x => `#${x.i} ${x.own} vs ${x.other}`).join(' | ')) }
  const masses = async label => { // the cut now, recounted with 33's method
    const C = await cdp.eval('S39.cut'), R = REG[C.src]
    const K0 = K33.cut({ R, W: C.W, H: C.H, count: C.count, logic: 'masses', wind: C.wind, seed: C.seed, moment: C.moment, dials: DIALS })
    const sameSites = K0.sites.length === C.sites.length && K0.sites.every((p, i) => Math.hypot(p[0] - C.sites[i][0], p[1] - C.sites[i][1]) < .01)
    const cells = K33.voronoi(K0.sites, C.W, C.H, C.wind), r = recount({ ...K0, wind: C.wind }, R, C.W, C.H, cells, K33.facets(K0, cells, C.W, C.H, C.wind, R))
    const drawn = cells.length === C.cells.length && cells.every((P, i) => P.length === C.cells[i].length && P.every((p, k) => Math.hypot(p[0] - C.cells[i][k][0], p[1] - C.cells[i][k][1]) < .01))
    check(sameSites && drawn && C.ran === 'masses' && !C.fallback && K0.ran === 'masses' && !r.bad.length,
      `${label}: the stone is ${C.src.replace('/photos/', '')}'s own masses cut (33's cut.js gives the same ${C.count} sites; ${r.anchors} anchors on its borders, ${r.edges} edges recount)`,
      [!sameSites && 'the sites are not 33\'s cut of this photograph', !drawn && 'the drawn cells are not their Voronoi', C.ran !== 'masses' && 'ran ' + C.ran, ...r.bad.slice(0, 3)].filter(Boolean).join(' | ')) }
  const crossOnce = async (label, how, x, name) => { // set the clock, touch, walk it, land
    await restLedger(); const from = await cdp.eval('S39.world.key')
    await cdp.eval('S39.clock = 0; S39.still = false')
    let pt
    if (how === 'door') { const d = await cdp.eval('S39.doors.find(d => d.box[1] > 0 && d.box[1] + d.box[3] < innerHeight)'); if (!d) { check(false, `${label}: a door line on screen`); return false } pt = [d.box[0] + d.box[2] / 2, d.box[1] + d.box[3] / 2] }
    else { const i = await cdp.eval('S39.plans.findIndex((p, i) => p && p.kind === "door" && S39.tapPoint(i))')
      if (i < 0) { check(false, `${label}: a facet door`, JSON.stringify(await cdp.eval('S39.plans.map((p, i) => p && p.kind === "door" ? [i, S39.tapPoint(i)] : p && p.kind).filter(Boolean)'))); return false } pt = await cdp.eval(`S39.tapPoint(${i})`) }
    await tap(...pt)
    await waitFor(() => cdp.eval(`!!S39.crossing && S39.crossing.from === ${JSON.stringify(from)} && S39.t !== null`), label + ' crossing', 150)
    const info = await cdp.eval('S39.crossing'), shots = { .25: 0, .5: 0, .75: 0 }
    const get = async t => { const L = await cdp.eval(`S39.step(${t})`); if (L.t !== t) throw new Error(`the page drew t=${L.t} for ${t}`)
      for (const k of Object.keys(shots)) if (!shots[k] && Math.abs(t - k) < 1e-9 && name) { shots[k] = 1; await shot(`${name}-${String(Math.round(k * 100)).padStart(2, '0')}.png`) } return L }
    const r = await walk(get, VP.w, VP.h, 60)
    await cdp.eval('S39.step(1)'); await cdp.eval('S39.clock = null')
    await waitFor(() => cdp.eval(`S39.at === 'world' && !S39.busy && S39.world.key !== ${JSON.stringify(from)}`), label + ' landing', 150)
    await watchArrival(label)
    const { before, after } = await waitFor(() => cdp.eval('S39.ends && S39.ends.after && S39.ends'), label + ' the first frame after', 100)
    const ends = [...same(r.first.list, before, VP.w, VP.h).map(b => 't=0 against the stone before: ' + b), ...same(r.last.list, after, VP.w, VP.h).map(b => 't=1 against the stone after: ' + b)]
    if (x === 'calm') { const at = new Map(), moved = new Set()
      for (const F of r.frames) for (const e of F.list) { if (!e.c || e.area <= 0) continue; const p = at.get(e.id); if (!p) at.set(e.id, e.c); else if (Math.hypot(p[0] - e.c[0], p[1] - e.c[1]) > .5) moved.add(e.id) }
      check(info.x === 'calm' && !moved.size, `${label}: reduced motion takes the calm crossing and no facet moves in any of ${r.frames.length} frames`, info.x + ' ' + [...moved].slice(0, 5).join(', ')) }
    check(!r.bad.length && !ends.length, `${label}: ${info.x}${info.held != null && info.x === 'hold' ? ` (${info.held} of ${info.movers} held)` : ''} from ${how === 'door' ? 'a door line' : 'a facet door'}, every facet accounted in every frame (fastest step ${r.biggest.toFixed(2)}x, ${r.fine} cut finer), starts on the stone at rest and lands on the next exactly`, [...ends, ...r.bad].slice(0, 4).join(' | '))
    await masses(label)
    return r }

  for (const vp of SIZES) {
    await view(vp); await reduceMotion(false); const tag = `${vp.w}x${vp.h}`
    await open(`now=${MOMENT.at}`); const key = await cdp.eval('S39.doors[0] && S39.doors[0].to'); await restHolds(`${tag} the home`)
    check(!!key, `${tag}: the home has a door`); if (!key) continue
    for (const x of XS) {
      await open(`x=${x}&now=${MOMENT.at}&w=${encodeURIComponent(key)}`)
      await waitFor(() => cdp.eval('S39.world.arrived'), 'arrival', 200)
      if (x === XS[0]) { await masses(`${tag} a world`); await shot(`${vp.id}-rest.png`) }
      await crossOnce(`${tag} ?x=${x} door line`, 'door', x, `${vp.id}-${x}-door`)
      for (let k = 0; k < 3 && !(await cdp.eval('S39.plans.some((p, i) => p && p.kind === "door" && S39.tapPoint(i))')); k++) await crossOnce(`${tag} ?x=${x} door line ${k + 2}`, 'door', x, null) // a world whose facets are all windows (28 a finds no room beside the poem) has no facet door: walk on
      await crossOnce(`${tag} ?x=${x} facet door`, 'facet', x, `${vp.id}-${x}-facet`)
      await shot(`${vp.id}-${x}-landed.png`) }
    await reduceMotion(true)
    await open(`now=${MOMENT.at}&w=${encodeURIComponent(key)}`); await waitFor(() => cdp.eval('S39.world.arrived'), 'arrival', 200)
    await crossOnce(`${tag} reduced motion`, 'door', 'calm', `${vp.id}-calm`)
    await reduceMotion(false) }
  check(!errors.length, 'no console error', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) }
server.close()
console.log(failures ? `\n${failures} FAILED (${((Date.now() - t0) / 1000).toFixed(0)}s)` : `\nPASS study 39: every crossing (${XS.join(', ')}, and reduced motion) starts on this photograph's masses cut, lands on the next one's as 33 counts it, and accounts for every facet in every frame, at ${SIZES.map(v => v.w + 'x' + v.h).join(', ')} (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
process.exit(failures ? 1 : 0)
