#!/usr/bin/env node
// Study 30 check: every facet of every world yields, for a reason of its own.
// Static, over every pairing of the site's photographs and poems (a superset of the worlds a walk can reach), with a recorded morning as the sky:
//   the deck holds at least as many distinct yields as the most facets a world has, minus its fewest doors; no two share a key, a first word or a destination;
//   every insight clears the bar (its own words, a number, nothing on the filler list, nothing the photograph already shows), from data files that exist;
//   under every ?y= a facet's taps never say the same thing twice and end in a move; every poem a yield shows or reaches is a page on the site.
// In Chrome (1440x900 by mouse; 390x844 and 844x390 by touch), for ?y= a b c d, at home and in a world:
//   every drawn facet holds a door or a yield; two or three doors; no two facets share a yield, a destination or a basis; every basis names its signals
//   and where the facet sits; under a and d a facet's yield is of the family its region calls for, or records the fallback;
//   each facet's first tap answers, a second tap says something new or moves; a photo yield shows that photograph inside its facet only;
//   at rest every facet is this photograph; the poem arrives in line order, a door line in its place; a door line wins over the facet beneath;
//   a yield's last tap crosses to the world it promised; reduced motion still answers; nothing counts down; no console errors.
// Run: node studies/30/check.mjs   (YS=a,b ONLY_VP=desk STATIC=0 to narrow; non-zero exit on any failure). Screenshots: studies/30/shots/ (gitignored).
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync, statSync, createReadStream } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const YS = (process.env.YS || 'a,b,c,d').split(',')
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false, full: true }, { id: 'phone', w: 390, h: 844, mobile: true, full: true },
  { id: 'side', w: 844, h: 390, mobile: true, full: false }].filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
let failures = 0
const check = (ok, label, detail) => { if (ok) { if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const onSite = slug => existsSync(path.join(ROOT, 'poems', slug + '.html'))

// the check's own bar, kept apart from deck.js's judge so that loosening one is caught by the other
const SUBSTANCE = 44
const FILLER = [/\bgr[ae]y sk(y|ies)\b/i, /\b(blue|clear|cloudy|overcast|sunny|dark|bright) sk(y|ies)\b/i, /\b(beautiful|lovely|stunning|nice|pretty|gorgeous|amazing)\b/i, /\b(a|this) (photo|photograph|picture) of\b/i,
  /\bleica\b|\bmonochrome\b|\bq2\b/i, /^\s*(day|night|dawn|dusk|sky|light|water|trees?|clouds?|sea|the sea)\s*\.?\s*$/i, /\bundefined\b|\bNaN\b|\bnull\b|\[object/, /\?\s*%|\? km/]
const data = J('v2/data.json'), PS = J('v2/scores-photos.json')
const titles = data.poems.map(p => p.title)
function weak(text, photoSrc, deeper) { // why a piece of insight is not worth a tap, or null (a deeper layer may be shorter, never filler)
  if (!text || !text.trim()) return 'empty'
  if (!deeper && text.length < SUBSTANCE) return `under ${SUBSTANCE} characters`
  if (!deeper && !/\d/.test(text)) return 'no number in it'
  const prose = titles.reduce((t, x) => t.split(x).join(' '), text).replace(/“[^”]*”/g, ' ')
  const f = FILLER.find(re => re.test(prose)); if (f) return 'filler ' + f
  const ph = data.photos.find(p => p.src === photoSrc), sc = PS.photos[photoSrc] || {}
  for (const seen of [ph && ph.alt, ph && ph.caption, sc.notes && sc.notes.split(',')[0]].filter(Boolean)) if (text.toLowerCase().includes(seen.toLowerCase())) return 'says what the photograph shows: ' + seen
  return null }

/* ---------- static: every pairing ---------- */
const require = createRequire(import.meta.url), Deck = require('./deck.js')
const win = {}; new Function('window', readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8'))(win)
const home = readFileSync(path.join(ROOT, 'v2/home.js'), 'utf8'), a0 = home.indexOf('function norm'), b0 = home.indexOf('/* ---------------------------------------------------------- the render', a0)
const { stanzasOf } = new Function(home.slice(a0, b0) + '; return { stanzasOf }')()
const D = { data, PS, QS: J('v2/scores-poems.json'), days: J('v2/days.json'), Y: J('studies/30/yields.json'), VOC: J('studies/21/doors.json').vocabs.his, stanzasOf, K: win.kahranPick.__test, here: J('v2/place.json'), KIN: J('studies/28/kin.json').photos }
const MOST = Math.max(...['facets-desk', 'facets-phone', 'facets-low'].map(k => +J('studies/30/defaults.json')[k])), FEWEST_DOORS = 2, NEED = MOST - FEWEST_DOORS
let worlds = 0, itemsN = 0, insightsN = 0, minDeck = Infinity, stepsN = 0
const reached = new Set()
if (process.env.STATIC !== '0') {
  const mornings = Object.values(D.days.days).filter(e => e && e.why), parts = ['dawn', 'day', 'dusk', 'night'], bad = []
  const say = (m) => { if (bad.length < 12) bad.push(m) }
  data.photos.forEach((ph, pi) => data.poems.forEach((q, qi) => {
    const e = mornings[(pi + qi) % mornings.length], doors = D.VOC.poems[q.slug] || [], came = qi % 2 && doors.length ? { phrase: doors[0].phrase, title: q.title } : null
    const ctx = { day: D.K.dayVectorFromWhy(e.why), reading: { temperature_2m: e.why.tmax, cloud_cover: e.why.cloud_pct, wind_speed_10m: e.why.wind_kmh, is_day: 1 },
      local: { part: parts[(pi * 7 + qi) % 4], zone: 'UTC', offset: (qi % 5 - 2) * 180 }, today: { rank: 1 + (pi % 9), d: .3, near: 'light', far: 'wet', pick: data.photos[(pi + 1) % data.photos.length].src, next: data.photos[(pi + 2) % data.photos.length].src } }
    const W = { photo: ph.src, poem: q.slug, from: came, word: came ? doors[0].word : null, trail: [] }, r = Deck.make(W, D, ctx), it = r.items, tag = `${ph.src.split('/').pop()} × ${q.slug}`
    worlds++; itemsN += it.length; minDeck = Math.min(minDeck, it.length)
    if (it.length < NEED) say(`${tag}: ${it.length} yields for up to ${NEED} facets`)
    const dup = (f, label) => { const seen = new Set(); for (const x of it) { const k = f(x); if (seen.has(k)) say(`${tag}: two yields share ${label} ${k}`); seen.add(k) } }
    dup(x => x.key, 'a key'); dup(x => x.to.photo, 'a destination'); dup(x => x.layers[0].big || x.layers[0].lines.join('/'), 'a first word')
    if (it.some(x => x.to.photo === ph.src)) say(`${tag}: a yield leads back to its own photograph`)
    for (const x of it) {
      if (!x.signals || !x.signals.length) say(`${tag} ${x.key}: no signals`)
      for (const f of x.from || []) if (!existsSync(path.join(ROOT, f))) say(`${tag} ${x.key}: from ${f}, not on disk`)
      for (const s of [x.slug, x.to.poem].filter(Boolean)) { reached.add(s); if (!onSite(s)) say(`${tag} ${x.key}: reaches ${s}, not a poem on the site`) }
      if (!D.Y.photos[x.to.photo]) say(`${tag} ${x.key}: leads to ${x.to.photo}, not a photograph on the site`)
      if (x.kind === 'insight') { insightsN++; x.layers.forEach((l, k) => { const w = weak(`${l.big} ${l.small}`, ph.src, k > 0); if (w) say(`${tag} ${x.key} layer ${k + 1}: ${w} — "${l.big} ${l.small}"`) }) }
      for (const y of YS) { const st = Deck.steps(x, y, D), keys = st.map(Deck.stepKey); stepsN += st.length
        if (st.length < 2) say(`${tag} ${x.key} y=${y}: one tap and nothing after`)
        if (new Set(keys).size !== keys.length) say(`${tag} ${x.key} y=${y}: a tap says the same thing twice`)
        if (st.at(-1).t !== 'move' || st.slice(0, -1).some(s => s.t === 'move')) say(`${tag} ${x.key} y=${y}: does not end in its one move`)
        for (const s of st) if (s.t === 'lines' && (!s.lines.length || s.lines.some(l => !l))) say(`${tag} ${x.key} y=${y}: an empty line`) } } }))
  check(!bad.length, `every one of ${worlds.toLocaleString('en-US')} pairings yields at least ${NEED} distinct things, every insight clears the bar, every tap is new, every poem live`, bad.join(' | '))
}

/* ---------- in Chrome ---------- */
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
function findShell() {
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p }
  return null }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data)
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value } }

{ const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(J('studies/30/defaults.json')), own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2))
  const clash = dials.filter(k => own.includes(k)); check(!clash.length, 'no dial shadows a page variable', clash.join(', ')) }

let facetsSeen = 0, tapsN = 0, basesN = 0, walks = 0, probes = 0
const kindsSeen = {}
const shell = process.env.BROWSER === '0' ? null : findShell()
if (process.env.BROWSER !== '0' && !shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
// a static server in this process (python's http.server reset connections under the walk's load: a red that was the harness, not the page)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = shell && http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = shell && spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome && chrome.kill() } catch {} try { server && server.close() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], t0 = Date.now()

if (shell) try {
  await waitFor(() => fetch(`${BASE}/studies/30/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  // the walks are pinned: the visitor's clock (8:40 in the evening, New York, 8 Nov 2026) and the sky the site reads (a fixed Open-Meteo answer),
  // so a run tomorrow sees the yields a run today saw; the worst case of every length is probed separately, below
  const PIN = Date.UTC(2026, 10, 9, 1, 40)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-08T06:35'], sunset: ['2026-11-08T16:44'] } }
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }
  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => { await cdp.send('Page.navigate', { url: `${BASE}/studies/30/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S30.world`), 'page ' + q, 300); await sleep(300) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 })
  const settle = () => waitFor(() => cdp.eval(`S30.at === 'world' && !S30.busy`), 'landing', 300)
  const fresh = async q => { await open(q); await cdp.eval('sessionStorage.removeItem("s30-depth")'); await open(q); await settle(); await waitFor(() => cdp.eval('S30.world.arrived'), 'arrival', 200) }
  const tapFacet = async i => { const pt = await cdp.eval(`S30.tapPoint(${i})`); if (!pt) return null; await tap(pt[0], pt[1]); return pt }
  const nextSeq = seq0 => waitFor(() => cdp.eval(`S30.seq > ${seq0} && S30.last`), 'a facet answer', 60, 30).catch(() => null)
  const doorPoint = async (k, edge) => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); a.scrollIntoView({ block: 'nearest' })
    const b = a.getClientRects()[0], l = a.closest('.l').getClientRects()[0]; return ${edge ? `[b.left + b.width / 2, l.top - 2]` : `[b.left + b.width / 2, b.top + b.height / 2]`} })()`)
  const waitDoorShown = k => waitFor(() => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); return !!a && !!a.closest('.l.shown') && !S30.busy })()`), 'door shown', 200)
  const watchArrival = async label => { let bad = null, shut = null, last = null, sawDoorFirst = false
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S30.at, arrived: S30.world.arrived, lines: S30.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length
        if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join('')
        if (s.lines.find(l => l.door && l.shown && l.open === false)) shut = 'a shown door line whose door does not answer'
        if (s.lines.some((l, j) => l.door && l.shown && s.lines.slice(j + 1).some(m => !m.door && !m.shown))) sawDoorFirst = true
        if (s.arrived) break }
      await sleep(40) }
    check(!bad, `${label}: the poem arrives in its own order, door lines in their place`, bad)
    check(!shut, `${label}: a door opens as its line appears`, shut)
    const doorBeforePlain = last && last.lines.some((l, j) => l.door && last.lines.slice(j + 1).some(m => !m.door))
    check(!doorBeforePlain || sawDoorFirst, `${label}: a door line shows before the plain lines after it`)
    check(last && last.arrived && last.lines.every(l => l.shown), `${label}: the whole poem arrives`) }
  const restHolds = async label => { await park(); await cdp.eval('S30.still = true'); await sleep(700)
    const r = await cdp.eval('S30.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .012))
    check(r.length >= 6 && !bad.length, `${label}: at rest all ${r.length} facets read as this photograph`, bad.slice(0, 5).map(x => `#${x.i} own ${x.own} vs ${x.other}`).join(' | '))
    await cdp.eval('S30.still = false') }
  const RULE = { door: 'line', verse: 'poem', sky: 'sky', horizon: 'place', edge: 'photo', figure: 'region', shadow: 'time', field: 'scores' }
  // the plan: every facet held, nothing shared, every basis legible and true to its rule
  const plansHold = async (label, y) => {
    const ids = await cdp.eval('S30.drawn'), plans = await cdp.eval('S30.plans'), world = await cdp.eval('S30.world'), bad = []
    const held = ids.filter(i => plans[i]); facetsSeen += ids.length
    if (held.length !== ids.length) bad.push(`${ids.length - held.length} facets hold nothing: ${ids.filter(i => !plans[i]).join(',')}`)
    const doors = held.filter(i => plans[i].kind === 'door').length
    if (doors < 2 || doors > 3) bad.push(`${doors} doors`)
    const uniq = (f, what) => { const m = new Map(); for (const i of held) { const k = f(plans[i]); if (k == null) continue; if (m.has(k)) bad.push(`#${m.get(k)} and #${i} share ${what}: ${k}`); else m.set(k, i) } }
    uniq(p => p.key, 'a yield'); uniq(p => p.to, 'a destination'); uniq(p => p.steps[0].key, 'a first tap')
    const bases = new Map()
    for (const i of held) { const p = plans[i], b = p.basis; kindsSeen[p.family] = (kindsSeen[p.family] || 0) + 1
      if (!b || !b.at || !b.cls || !(b.signals || []).length) { bad.push(`#${i}: no basis (${JSON.stringify(b)})`); continue }
      basesN++
      const region = b.cls + '|' + b.at + '|' + (b.line || b.rank || ''), basis = region + '|' + b.signals.join('+') + '|' + p.family
      for (const [j, o] of bases) if (o.region !== region && o.basis === basis) bad.push(`#${j} and #${i} sit in different regions and share a basis`)
      if ([...bases.values()].some(o => o.full === basis + p.key)) bad.push(`#${i}: the same basis twice`)
      bases.set(i, { region, basis, full: basis + p.key })
      if ((y === 'a' || y === 'd') && p.kind !== 'door' && RULE[b.cls] !== p.family && b.fallback !== RULE[b.cls]) bad.push(`#${i}: a ${b.cls} facet gave ${p.family} without saying why`)
      if (p.poem && !onSite(p.poem)) bad.push(`#${i}: shows ${p.poem}, not a poem on the site`)
      for (const s of p.steps) { if (s.poem) { reached.add(s.poem); if (!onSite(s.poem)) bad.push(`#${i}: reaches ${s.poem}`) }
        if (s.t === 'say' && p.kind === 'insight') { const w = weak(`${s.big} ${s.small}`, world.photo); if (w && p.steps.indexOf(s) === 0) bad.push(`#${i} ${p.key}: ${w}`) } }
      if (p.to && p.to.split('~')[1] === world.photo.replace('/photos/', '')) bad.push(`#${i}: leads back to this photograph`) }
    check(!bad.length, `${label}: all ${ids.length} facets hold something (${doors} doors), none shares a yield, a destination or a basis, every basis legible`, bad.slice(0, 5).join(' | '))
    return plans }
  // every facet answers its first tap; on full screens, a second tap says something new or moves
  const tapsHold = async (label, twice) => {
    await cdp.eval('S30.dry = true'); const ids = await cdp.eval('S30.drawn'), plans = await cdp.eval('S30.plans'), bad = []
    for (const i of ids) { const p = plans[i]; if (!p) continue; const depth0 = await cdp.eval(`S30.depth(${i})`)
      for (let round = 0; round < (twice && p.kind !== 'door' ? 2 : 1); round++) { const seq0 = await cdp.eval('S30.seq'), pt = await tapFacet(i)
        if (!pt) { bad.push(`#${i}: nowhere to touch`); break }
        const last = await nextSeq(seq0); tapsN++
        const want = p.steps[Math.min(depth0 + round, p.steps.length - 1)]
        if (!last || last.i !== i) { bad.push(`#${i} tap ${round + 1}: no answer ${JSON.stringify(last)}`); break }
        if (last.key !== want.key) bad.push(`#${i} tap ${round + 1}: said ${last.key.slice(0, 60)}, planned ${want.key.slice(0, 60)}`)
        if (want.t !== 'move') { const wv = await cdp.eval('S30.win'); if (!wv || !wv.text || wv.i !== i) bad.push(`#${i} tap ${round + 1}: nothing shown`)
          if (await cdp.eval('S30.clash')) bad.push(`#${i} tap ${round + 1}: its words lie over the poem, the name or the caption`)
          if (want.t === 'glimpse') { const g = await waitFor(() => cdp.eval('S30.glimpse'), 'glimpse', 40, 50).catch(() => null); if (!g || g.i !== i || g.src !== want.src) bad.push(`#${i}: the photograph does not show inside its facet ${JSON.stringify(g)}`) } }
        if (round === 1 && last.key === p.steps[Math.min(depth0, p.steps.length - 1)].key) bad.push(`#${i}: the second tap repeats the first`) } }
    await cdp.eval('S30.dry = false')
    check(!bad.length, `${label}: every facet answers, its words clear of the poem${twice ? ', and a second tap says something new or moves' : ''}`, bad.slice(0, 5).join(' | ')) }

  for (const vp of VIEWPORTS) {
    await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const y of YS) {
      if (!vp.full && y !== 'a') continue
      errors.length = 0; walks++
      const L = `y=${y} ${tag}`
      await open(`y=${y}`); await cdp.eval('sessionStorage.clear()'); await open(`y=${y}`)
      await shot(`30-${y}-home-${tag}.png`)
      { const pin = await cdp.eval(`({ where: document.getElementById('where').innerText, hour: new Date().getHours(), how: S30.how })`)
        check(/mostly clear/.test(pin.where) && pin.hour === 20, `${L}: the walk runs under the pinned clock and sky`, JSON.stringify(pin)) }
      await plansHold(`${L} home`, y)
      { const plans = await cdp.eval('S30.plans'), i = plans.findIndex(p => p && p.kind === 'insight'), seq0 = await cdp.eval('S30.seq')
        if (i >= 0) { await tapFacet(i); const last = await nextSeq(seq0); await sleep(400); const s = await cdp.eval('({ at: S30.at, busy: S30.busy, win: S30.win })')
          check(last && last.i === i && s.at === 'stone' && !s.busy && s.win && s.win.text, `${L} home: a yield says its piece and the stone stays`, JSON.stringify({ last, s }))
          await shot(`30-${y}-home-yield-${tag}.png`) } }
      const key = (await cdp.eval('S30.doors'))[0].to
      await open(`y=${y}&w=${encodeURIComponent(key)}`)
      if (y === 'a') await watchArrival(L)
      await restHolds(L)
      await shot(`30-${y}-world-${tag}.png`)
      const plans = await plansHold(L, y)
      await tapsHold(L, vp.full)
      { const ids = await cdp.eval('S30.drawn'), bad = [] // whatever a yield says, at any length, its words keep clear
        for (const i of ids) for (const [n, lines] of [[60, 0], [220, 0], [480, 0], [200, 6], [1400, 0]]) { probes++; if (await cdp.eval(`S30.probe(${i}, ${n}, ${lines})`)) bad.push(`#${i} at ${n}${lines ? ' in ' + lines + ' lines' : ''}`) }
        check(!bad.length, `${L}: words of any length, at any facet, keep clear of the poem, the name and the caption (${ids.length * 5} placed)`, bad.slice(0, 6).join(' | ')) }
      { const i = plans.findIndex(p => p && p.kind === 'photo'); if (i >= 0) { await fresh(`y=${y}&w=${encodeURIComponent(key)}`); await cdp.eval('S30.dry = true'); await tapFacet(i); await sleep(900); await shot(`30-${y}-glimpse-${tag}.png`); await cdp.eval('S30.dry = false') } }
      { const i = plans.findIndex(p => p && p.kind === 'insight'); if (i >= 0) { await fresh(`y=${y}&w=${encodeURIComponent(key)}`); await cdp.eval('S30.dry = true'); await tapFacet(i); await sleep(500); await shot(`30-${y}-insight-${tag}.png`); await cdp.eval('S30.dry = false') } }
      await open(`y=${y}&w=${encodeURIComponent(key)}`); await settle()
      const again = await cdp.eval('S30.plans')
      check(JSON.stringify(again.map(p => p && p.key)) === JSON.stringify(plans.map(p => p && p.key)), `${L}: after a reload in the visit, every facet holds what it held`)
      // a door line wins over the facet beneath it
      { const ds = await cdp.eval('S30.doors'), d = ds[0]; await waitDoorShown(d.k)
        const seq0 = await cdp.eval('S30.seq'); await tap(...await doorPoint(d.k, false))
        await waitFor(() => cdp.eval('S30.expect'), 'door').catch(() => null)
        const s = await cdp.eval('({ expect: S30.expect, seq: S30.seq })')
        check(s.expect === d.to && s.seq === seq0, `${L}: a tap on a door line goes to its door, not the facet beneath`, JSON.stringify({ ...s, want: d.to }))
        await settle() }
      // a yield's last tap crosses where it promised
      { await fresh(`y=${y}&w=${encodeURIComponent(key)}`)
        const ps = await cdp.eval('S30.plans'), i = ps.findIndex(p => p && p.kind !== 'door'), p = ps[i], want = p.steps.at(-1).to
        for (let k = 0; k < p.steps.length; k++) { const seq0 = await cdp.eval('S30.seq'); await tapFacet(i); await nextSeq(seq0); if (k === p.steps.length - 1 && vp.full) { await waitFor(() => cdp.eval('S30.t > .15'), 'mid-crossing', 60).catch(() => {}); await shot(`30-${y}-through-${tag}.png`) } else await sleep(250) }
        await waitFor(() => cdp.eval(`S30.world.key === ${JSON.stringify(want)} && !S30.busy`), 'landing', 200).catch(() => {})
        const w = await cdp.eval('S30.world'); check(w.key === want && w.imgOk, `${L}: a yield's last tap (${p.steps.length}) lands where it promised`, `${w.key} vs ${want}`)
        reached.add(w.slug) }
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!tm, `${L}: nothing counts down`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }
  if (!process.env.SKIP_EXTRA) { // reduced motion
    await view(VIEWPORTS[0]); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); errors.length = 0
    await open('y=a'); const key = (await cdp.eval('S30.doors'))[0].to; await open(`y=a&w=${encodeURIComponent(key)}`); await settle()
    check(await cdp.eval('S30.lines.every(l => l.shown)'), 'reduced motion: the poem is there at once')
    const ps = await cdp.eval('S30.plans'), i = ps.findIndex(p => p && p.kind !== 'door'), seq0 = await cdp.eval('S30.seq'); await tapFacet(i); const last = await nextSeq(seq0)
    check(last && last.i === i && (await cdp.eval('S30.win')), 'reduced motion: a yield still answers')
    const j = ps.findIndex(p => p && p.kind === 'door'), s1 = await cdp.eval('S30.seq'); await tapFacet(j); await nextSeq(s1); await sleep(300)
    check((await cdp.eval('S30.t')) === null, 'reduced motion: the crossing is a crossfade'); await settle()
    check((await cdp.eval('S30.world')).key === ps[j].to, 'reduced motion: lands')
    check(errors.length === 0, 'reduced motion: no console errors', errors.join(' | '))
    await cdp.send('Emulation.setEmulatedMedia', { features: [] }) }
  console.log(`shots: studies/30/shots/  (${Math.round((Date.now() - t0) / 1000)}s)`)
} catch (e) { failures++; console.log(e.stack); console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }
{ const gone = [...reached].filter(x => !onSite(x)); check(reached.size > 0 && !gone.length, `every poem a yield shows or reaches (${reached.size}) is on the site`, gone.join(', ')) }
cleanup()
const fams = Object.entries(kindsSeen).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')
console.log(failures ? `\n${failures} failing` : `\nPASS study 30 every facet yields: ${worlds.toLocaleString('en-US')} pairings, ${itemsN.toLocaleString('en-US')} yields (${insightsN.toLocaleString('en-US')} insights over the bar, at least ${minDeck} a world for ${NEED} facets), ${stepsN.toLocaleString('en-US')} taps planned, none repeats; in Chrome ${walks} walks, ${facetsSeen} facets held, ${tapsN} taps answered, ${basesN} bases legible, ${probes} worst-case placements clear, clock and sky pinned, 0 dead, 0 shared (${fams}); ${reached.size} poems reached, all live`)
process.exit(failures ? 1 : 0)
