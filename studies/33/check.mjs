#!/usr/bin/env node
// Study 33 check: where the facets ARE. Every seam must be cut from something in the photograph or the moment, and say which.
//   The recount is the check's own: it maps regions.json onto the screen with its own cover crop, finds which site lies across each seam
//   by its own nearest-site search, and works out each edge's basis from the sites' tags, then compares with what the page (cut.js) claims:
//     every anchor of a photograph line is where regions.json puts it (a horizon on its line, a border, outline or edge on its recorded point,
//     a ray on the line from the photograph's light at the sun's position, recomputed here from the moment);
//     the seam truly lies there: the two sites nearest each anchor are its mirrored pair (and along a straight line, the stretch between anchors too);
//     every edge of every facet carries the basis the recount gives it;
//     no world is the plain geometric cut without saying so: a geometric site means a declared fallback with a reason, and an undeclared cut
//     must be mostly the photograph's (at least 30% of sites in mirrored pairs or on the eye's peak, two anchors or more).
//   Over the whole corpus (77 photographs x 5 logics x 3 sizes) in node, then in the page at 1440x900, 390x844 and 844x390 for every ?c=,
//   with the page's drawn cells equal to the Voronoi of its sites, the caption line naming the basis (and the fallback's reason when it fell),
//   the hour moving with the minute, and 28 a held: the photograph whole at rest, the poem arriving in order, no console error.
// Screenshots: studies/33/shots/ (gitignored). Run: node studies/33/check.mjs   (ONLY_VP=desk,phone,side · CUTS=line,eye to narrow)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const K = createRequire(import.meta.url)(path.join(HERE, 'cut.js'))
const REG = JSON.parse(readFileSync(path.join(HERE, 'regions.json'), 'utf8')).photos
const DATA = JSON.parse(readFileSync(path.join(ROOT, 'v2/data.json'), 'utf8'))
const LOGICS = ['line', 'masses', 'eye', 'edges', 'hour'], CUTS = (process.env.CUTS || LOGICS.join(',')).split(',')
const SIZES = [{ id: 'desk', w: 1440, h: 900, n: 26, mobile: false }, { id: 'phone', w: 390, h: 844, n: 15, mobile: true }, { id: 'side', w: 844, h: 390, n: 15, mobile: true }]
  .filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
const DIALS = (d => ({ share: +d['cut-share'], gap: +d['cut-gap'], spacing: +d['cut-spacing'], fillGap: +d['cut-fill-gap'], lineMin: +d['cut-line-min'] }))(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'))) // the corpus is cut with the page's own dials
const MOMENT = { at: '2026-11-08T15:00:00.000Z', lat: 40.71, lon: -74.01, place: 'New York' }
const sleep = ms => new Promise(r => setTimeout(r, ms))
let failures = 0
const check = (ok, label, detail) => { if (ok) { if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }

/* ---------- the check's own arithmetic ---------- */
function coverTo(R, W, H, u, v) { const a = R.a, b = W / H; return a > b ? [((u - .5) * (a / b) + .5) * W, v * H] : [u * W, ((v - .5) * (b / a) + .5) * H] }
function sunAt(at, lat, lon) { // the Astronomical Almanac's low-precision formulas, written out again here
  const rad = Math.PI / 180, n = Date.parse(at) / 864e5 + 2440587.5 - 2451545
  const g = (357.528 + .9856003 * n) * rad, L = 280.46 + .9856474 * n, lam = (L + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * rad, eps = (23.439 - 4e-7 * n) * rad
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam))
  const lst = ((280.46061837 + 360.98564736629 * n + lon) % 360) * rad, ha = lst - ra
  const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha))
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat * rad) - Math.sin(lat * rad) * Math.cos(ha))
  return { alt: alt / rad, az: ((az / rad) % 360 + 360) % 360 } }
const distLine = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return Math.abs(dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / (Math.hypot(dx, dy) || 1) }
const angDiff = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180)

/* recount one cut against the photograph's reading; returns a list of problems and a tally */
function recount(C, R, W, H, cells, claimed) {
  const bad = [], st = 1 + Math.min(C.wind ?? 8, 40) / 45, dS = (p, q) => Math.hypot((p[0] - q[0]) / st, p[1] - q[1]), S = C.sites, T = C.tags
  const near = p => S.map((s, i) => [dS(s, p), i]).sort((a, b) => a[0] - b[0])
  // 1 · each anchor is where the photograph's reading puts it, and the seam lies on it
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
    else if (F.kind === 'ray') { const s = sunAt(F.at, C.moment.lat, C.moment.lon), lp = coverTo(R, W, H, ...R.light.peak), m = Math.min(W, H) * .04
      const src = [Math.max(m, Math.min(W - m, lp[0])), Math.max(m, Math.min(H - m, lp[1]))]
      if (Math.abs(s.alt - F.sun.alt) > .6 || angDiff(s.az, F.sun.az) > .6) bad.push(`${where}: the sun was at ${s.alt.toFixed(1)}°/${s.az.toFixed(1)}°, the cut says ${F.sun.alt}/${F.sun.az}`)
      if (Math.hypot(src[0] - F.source[0], src[1] - F.source[1]) > .75) bad.push(`${where}: does not start at the photograph's light`)
      if (distLine(A.p, src, [src[0] + Math.cos(F.angle * Math.PI / 180), src[1] + Math.sin(F.angle * Math.PI / 180)]) > .75) bad.push(`${where}: off its ray`) }
    else bad.push(`${where}: a kind of line the reading does not have`)
    const nn = near(A.p), two = [nn[0][1], nn[1][1]].sort((a, b) => a - b).join(), pair = [...A.pair].sort((a, b) => a - b).join()
    if (two !== pair) bad.push(`${where}: the seam does not lie there (nearest sites ${two}, its pair ${pair})`)
    else if (Math.abs(nn[0][0] - nn[1][0]) > .01 * nn[0][0] + .05) bad.push(`${where}: its pair is not mirrored across it`)
    if (T[A.pair[0]].kind !== 'pair' || T[A.pair[0]].mate !== A.pair[1] || T[A.pair[0]].f !== F.id) bad.push(`${where}: its sites do not say so`) }
  for (const [f, k] of C.chains || []) { const A = C.features[f].anchors, p = A[k].p, q = A[k + 1].p, m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], nn = near(m)
    const tied = nn.filter(x => x[0] <= nn[0][0] * 1.002 + .05).map(x => T[x[1]]), both = nn.slice(0, 2).map(x => T[x[1]])
    if (!both.every(t => t.kind === 'pair' && t.f === f) || !tied.some(t => t.side === 1) || !tied.some(t => t.side === -1)) bad.push(`${C.features[f].kind}#${f}: between anchors ${k} and ${k + 1} the seam leaves the line`) }
  // 2 · every edge of every facet: which site lies across it, and so what made it
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
      if (!got || got.to !== j || got.kind !== k) bad.push(`facet ${i} edge ${e}: recount ${k} with site ${j}, claimed ${got && got.kind} with ${got && got.to}`)
      if (got && ['on', 'along', 'beside', 'meet'].includes(k) && C.features[got.f] == null) bad.push(`facet ${i} edge ${e}: names a line that is not in the cut`) }) })
  // 3 · no plain geometric cut without saying so
  const geo = T.filter(t => t.kind === 'geometric').length, paired = T.filter(t => t.kind === 'pair').length
  if (geo && !(C.fallback && /geometric/.test(C.fallback.to) && C.fallback.why && C.fallback.why !== 'none')) bad.push(`${geo} geometric sites with no declared fallback`)
  if (kinds.geometric && !(C.fallback && /geometric/.test(C.fallback.to))) bad.push(`${kinds.geometric} geometric edges with no declared fallback`)
  if (!C.fallback) { if (C.ran !== C.logic) bad.push(`ran ${C.ran} for ${C.logic} without saying so`); const own = paired + T.filter(t => t.kind === 'eye').length; if (anchors < 2 || own / S.length < .3) bad.push(`undeclared, yet only ${anchors} anchors and ${own}/${S.length} sites from the photograph's lines`) }
  else { if (!C.fallback.why) bad.push('fell back without a reason'); if (C.fallback.from !== C.logic || C.ran === C.logic) bad.push('the fallback does not name where it came from') }
  if (S.length !== cells.length) bad.push(`${S.length} sites, ${cells.length} facets`)
  return { bad, anchors, edges, kinds, paired, geo } }

/* ---------- 1 · the corpus, in node: every photograph, every logic, every size ---------- */
{ const tally = {}, problems = []
  for (const lg of CUTS) for (const vp of SIZES) for (const p of DATA.photos) { const R = REG[p.src]
    if (!R) { problems.push(`${p.src}: not in regions.json`); continue }
    const C = K.cut({ R, W: vp.w, H: vp.h, count: vp.n, logic: lg, wind: 8, seed: p.src, moment: MOMENT, dials: DIALS }), cells = K.voronoi(C.sites, vp.w, vp.h, 8)
    const r = recount({ ...C, wind: 8, moment: MOMENT }, R, vp.w, vp.h, cells, K.facets(C, cells, vp.w, vp.h, 8, R))
    const t = tally[lg] ||= { worlds: 0, fell: 0, geo: 0, anchors: 0, edges: 0, to: {} }; t.worlds++; t.anchors += r.anchors; t.edges += r.edges
    if (C.fallback) { t.fell++; t.to[C.ran] = (t.to[C.ran] || 0) + 1 } if (r.geo) t.geo++
    if (r.bad.length) problems.push(`${lg} ${vp.id} ${p.src}: ${r.bad.slice(0, 2).join(' | ')}`) }
  check(!problems.length, `corpus: every seam of ${Object.values(tally).reduce((n, t) => n + t.worlds, 0)} cuts (${DATA.photos.length} photographs × ${CUTS.length} logics × ${SIZES.length} sizes) recounts to its basis`, `${problems.length} cuts wrong: ${problems.slice(0, 3).join(' || ')}`)
  for (const [lg, t] of Object.entries(tally)) console.log(`     ${lg.padEnd(6)} ${t.anchors} anchors, ${t.edges} edges; fell back ${t.fell}/${t.worlds}${t.fell ? ' (to ' + Object.entries(t.to).map(([k, v]) => k + ' ' + v).join(', ') + ')' : ''}, geometric ${t.geo}`)
  // the moment moves the hour: the same photograph cut at two minutes is cut differently, and the photograph alone does not
  const R0 = REG[DATA.photos[5].src], A = K.cut({ R: R0, W: 1440, H: 900, count: 26, logic: 'hour', wind: 8, seed: 'x', moment: MOMENT, dials: DIALS }), B = K.cut({ R: R0, W: 1440, H: 900, count: 26, logic: 'hour', wind: 8, seed: 'x', moment: { ...MOMENT, at: '2026-11-08T20:30:00.000Z' }, dials: DIALS })
  const M = K.cut({ R: R0, W: 1440, H: 900, count: 26, logic: 'masses', wind: 8, seed: 'x', moment: MOMENT, dials: DIALS }), M2 = K.cut({ R: R0, W: 1440, H: 900, count: 26, logic: 'masses', wind: 8, seed: 'x', moment: { ...MOMENT, at: '2026-11-08T20:30:00.000Z' }, dials: DIALS })
  check(JSON.stringify(A.features.map(f => f.angle)) !== JSON.stringify(B.features.map(f => f.angle)) && JSON.stringify(M.sites) === JSON.stringify(M2.sites), 'the hour moves with the minute; the photograph\'s own cuts do not', `${A.features.map(f => f.angle)} vs ${B.features.map(f => f.angle)}`) }

{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)), clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
  const DJ = JSON.parse(readFileSync(path.join(HERE, 'doors.json'), 'utf8')), slugs = new Set(DATA.poems.map(p => p.slug))
  for (const v of Object.values(DJ.vocabs)) { Object.keys(v.poems).forEach(x => slugs.add(x)); v.words.forEach(w => w.poems.forEach(x => slugs.add(x))) }
  const gone = [...slugs].filter(x => !existsSync(path.join(ROOT, 'poems', x + '.html'))); check(!gone.length, `every one of ${slugs.size} poems the study can reach is a page on the site`, gone.join(', '))
  check(DATA.photos.every(p => REG[p.src]), `regions.json reads all ${DATA.photos.length} photographs`) }

/* ---------- 2 · in the page ---------- */
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
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
process.on('exit', () => { try { chrome.kill() } catch {} try { server.kill() } catch {} })
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], t0 = Date.now()
try {
  await waitFor(() => fetch(`${BASE}/studies/33/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE) && !/ERR_(ABORTED|CONNECTION_RESET|SOCKET_NOT_CONNECTED)/.test(msg.params.entry.text)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  let VP = SIZES[0]
  const view = async vp => { VP = vp; await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => { await cdp.send('Page.navigate', { url: `${BASE}/studies/33/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S33.world`), 'page ' + q, 300); await sleep(300) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 })
  const pageCut = async label => { const C = await cdp.eval('S33.cut'), R = REG[C.src]
    const r = recount(C, R, C.W, C.H, C.cells, C.facets), again = K.voronoi(C.sites, C.W, C.H, C.wind)
    const same = again.length === C.cells.length && again.every((P, i) => P.length === C.cells[i].length && P.every((p, k) => Math.hypot(p[0] - C.cells[i][k][0], p[1] - C.cells[i][k][1]) < .01))
    const cap = await cdp.eval('S33.cap'), body = await cdp.eval('({ ran: document.body.dataset.ran, fell: document.body.dataset.fell })')
    check(C.W === VP.w && C.H === VP.h && same, `${label}: the stone drawn is the Voronoi of the cut's ${C.sites.length} sites`)
    check(!r.bad.length, `${label}: ${r.anchors} anchors and ${r.edges} edges recount to their basis (${Object.entries(r.kinds).map(([k, v]) => k + ' ' + v).join(', ')})${C.fallback ? `; fell back to ${C.ran}: ${C.fallback.why}` : ''}`, r.bad.slice(0, 4).join(' | '))
    check(cap.includes(C.summary) && (!C.fallback || cap.includes(C.fallback.why)) && body.ran === C.ran && body.fell === (C.fallback ? 'yes' : 'no'), `${label}: the caption names the basis${C.fallback ? ' and why it fell back' : ''}`, cap)
    check(C.facets.filter(f => f.region).length === C.cells.filter(P => P.length > 2).length && C.facets.every(f => !f.region || (f.region.page && f.region.uv && 'tone' in f.region && 'salience' in f.region)), `${label}: every facet carries the region it lies over`)
    return C }
  const restHolds = async label => { await park(); await cdp.eval('S33.still = true'); await sleep(700)
    const r = await cdp.eval('S33.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .02)) // a flat facet (sand, sky) reads as near any flat photograph; below .02 it is this one
    check(r.length >= 6 && !bad.length, `${label}: at rest all ${r.length} sampled facets read as this photograph`, bad.slice(0, 4).map(x => `#${x.i} ${x.own} vs ${x.other}`).join(' | '))
    await cdp.eval('S33.still = false') }
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S33.at, arrived: S33.world.arrived, lines: S33.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length
        if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join('')
        if (s.lines.some(l => l.door && l.shown && l.open === false)) bad = 'a shown door line whose door does not answer'
        if (s.arrived) break } await sleep(40) }
    check(!bad && last && last.arrived && last.lines.every(l => l.shown), `${label}: the poem arrives line by line in its order, doors open with their lines`, bad) }

  for (const vp of SIZES) {
    await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const c of CUTS) { await open(`c=${c}&now=${MOMENT.at}`); await park(); await sleep(400); await shot(`${vp.id}-${c}.png`); await pageCut(`${tag} ?c=${c}`) }
    await open(`now=${MOMENT.at}`); const def = await cdp.eval('S33.c'), dflt = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'))['cut-way']
    check(def === dflt, `${tag}: with no ?c= the stone is cut by the default, ${dflt}`, def)
    await restHolds(`${tag} default`)
    const key = await cdp.eval('S33.doors[0] && S33.doors[0].to'); if (key) { await cdp.send('Page.navigate', { url: `${BASE}/studies/33/index.html?now=${MOMENT.at}&w=${encodeURIComponent(key)}` })
      await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && !!S33.world`), 'world', 300); await watchArrival(`${tag} a world`); await pageCut(`${tag} a world`); await shot(`${vp.id}-world.png`) }
  }
  if (CUTS.includes('hour') && SIZES.some(v => v.id === 'desk')) { await view(SIZES.find(v => v.id === 'desk'))
    await open('c=hour&now=2026-11-09T03:30:00.000Z'); const C = await pageCut('1440x900 ?c=hour after dark'); await shot('desk-hour-night.png')
    check(C.features.some(f => f.kind === 'ray' && f.sun.alt < -6) || C.fallback, 'after dark the hour reads the sun below the horizon', JSON.stringify(C.features.map(f => f.sun))) }
  check(!errors.length, 'no console error', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) }
console.log(failures ? `\n${failures} FAILED (${((Date.now() - t0) / 1000).toFixed(0)}s)` : `\nPASS study 33: every facet's seams recount to the photograph or the moment that cut them, at ${SIZES.map(v => v.w + 'x' + v.h).join(', ')} (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
process.exit(failures ? 1 : 0)
