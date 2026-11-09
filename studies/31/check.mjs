#!/usr/bin/env node
// Study 31 check: the line under his name opens the whole decision behind today's photograph and poem.
// The sky is stubbed with a real Open-Meteo response (fixtures/open-meteo-2026-11-08.json, fetched once, read-only, kept verbatim).
// Everything the page shows is recounted here in Node from the same files, independently of why.js:
//   every count (data-n) and every measure (data-f) shown equals the count or measure computed from v2/ and pick.js run in Node;
//   the ledger lists all 170 works in pick.js's own order (ask pickFor, take the winner out, ask again);
//   each signal the page names actually moved the computation (taking it away changes the scores), and the pick it says
//   would have won without it is pick.js's pickBest run with that signal taken away;
//   every live field the sky line counts is one pick.js reads (changing it alone changes the day), and the count is the
//   number of fields the page actually asked the weather service for;
//   the stone's door lines listed are the doors on the stone;
//   no casual filler (a blacklist, including 29's "closest photo" register) and no system names;
//   it opens on screen, clear of the line, with nothing wider than the panel, at 1440x900, 390x844 and 844x390;
//   closing (the stone, Escape) returns to the same stone. Fallbacks: no sky, and a kept day, say so and invent no reading.
// No dial shadows a page CSS variable; no console errors. Screenshots: studies/31/shots/.
// Run: node studies/31/check.mjs   (WAYS=a,b to narrow; non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync, statSync, createReadStream } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const WAYS = (process.env.WAYS || 'a,b,c,d,e').split(',')
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }, { w: 844, h: 390, mobile: true }].filter(v => !process.env.VPS || process.env.VPS.split(',').includes(v.w + 'x' + v.h))
const FIXTURE = readFileSync(path.join(HERE, 'fixtures/open-meteo-2026-11-08.json'), 'utf8')
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(100) } throw new Error('timed out waiting for ' + label) }
function findShell() {
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p }
  return null
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data)
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value }
}

let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)).filter(k => !['mat-h', 'v', 'near', 'mono'].includes(k))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}

/* ---------- the truth, in Node ---------- */
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const DATA = J('v2/data.json'), DAYS = J('v2/days.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), PLACE = J('v2/place.json')
const PICK_SRC = readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8')
const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
function readingOf(om) { const c = om.current, d = om.daily || {}
  return { place: PLACE.place, lat: PLACE.lat, lon: PLACE.lon, tz: om.timezone || PLACE.tz, away: !!PLACE.away, weather_code: c.weather_code, is_day: c.is_day,
    temperature_2m: c.temperature_2m, cloud_cover: c.cloud_cover, wind_speed_10m: c.wind_speed_10m, precipitation: c.precipitation, rain: c.rain, showers: c.showers,
    snowfall: c.snowfall, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0] } }
function pickJS(reading, days) {
  const win = { kahranWeather: { current: reading } }
  vm.runInNewContext(PICK_SRC, { window: win, Math, Date, JSON, Object, Array, Number, String, parseInt })
  const K = win.kahranPick; K.__test.setScores(QS, PS); K.setDays(days); return K
}
const READING = readingOf(JSON.parse(FIXTURE))
const objKeys = name => Object.keys(new Function('return {' + new RegExp(name + '\\s*=\\s*\\{([\\s\\S]*?)\\}').exec(PICK_SRC)[1] + '}')()).length
const constOf = name => +new RegExp(name + '\\s*=\\s*(-?[\\d.]+)').exec(PICK_SRC)[1]

function truthFor(iso, reading, days) {
  const K = pickJS(reading, days), T = K.__test, day = T.dayVectorFromCurrent(iso, reading, reading.lat)
  const order = (kind, key) => { const items = DATA[kind === 'photo' ? 'photos' : 'poems'].slice(), out = []
    while (items.length) { K.setData(kind === 'photo' ? { poems: DATA.poems, photos: items } : { poems: items, photos: DATA.photos }); const r = K.pickFor(iso, true)
      const k = kind === 'photo' ? r.photo : r.poem; out.push(k); items.splice(items.findIndex(x => x[key] === k), 1) }
    return out }
  const photos = order('photo', 'src'), poems = order('poem', 'slug')
  // independent recount of everything shown
  const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICK_SRC)
  const shown = (kind, win) => { const s = new Set(), cut = new Date(Date.parse(iso + 'T00:00:00Z') - win * 864e5).toISOString().slice(0, 10)
    for (const [d, e] of Object.entries(days.days)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e[kind]) s.add(e[kind]); return s }
  const sp = shown('photo', +nov[2]), sq = shown('poem', +nov[1])
  const nearKm = constOf('PLACE_BONUS_NEAR_KM'), farKm = constOf('PLACE_BONUS_FAR_KM')
  const kms = DATA.photos.map(p => PS.photos[p.src] && PS.photos[p.src].place).filter(p => p && p.lat != null).map(p => T.haversineKm(reading.lat, reading.lon, p.lat, p.lon))
  const vecOf = (doc, k) => T.itemVector(doc, k), dist = (doc, k) => T.weightedDistance(day, vecOf(doc, k))
  const score = (kind, k, dd = day, lat = reading.lat, lon = reading.lon, ds = days) => { const doc = kind === 'photo' ? PS : QS
    let s = -T.weightedDistance(dd, vecOf(doc, k)); if (kind === 'photo') s += T.placeBonus((PS.photos[k] || {}).place, lat, lon)
    if ((kind === 'photo' ? shown('photo', +nov[2]) : shown('poem', +nov[1])).has(k) && ds) s += constOf('NOVELTY_PENALTY'); return s + T.tiebreak(iso, k) }
  const feelRank = (kind, k) => { const doc = kind === 'photo' ? PS : QS, list = DATA[kind === 'photo' ? 'photos' : 'poems'].map(x => x[kind === 'photo' ? 'src' : 'slug'])
    return list.slice().sort((a, b) => dist(doc, a) - dist(doc, b) || list.indexOf(a) - list.indexOf(b)).indexOf(k) + 1 }
  const entries = [...DATA.photos.map(p => PS.photos[p.src]), ...DATA.poems.map(p => QS.poems[p.slug])].filter(Boolean)
  const kept = Object.keys(days.days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d))
  const N = { photos: DATA.photos.length, poems: DATA.poems.length, candidates: DATA.photos.length + DATA.poems.length, measures: AX.length,
    scoredPhotos: DATA.photos.filter(p => PS.photos[p.src]).length, scoredPoems: DATA.poems.filter(p => QS.poems[p.slug]).length, scored: entries.length,
    judgements: entries.reduce((s, e) => s + AX.filter(a => typeof e[a] === 'number').length, 0), located: kms.length,
    places: new Set(DATA.photos.map(p => PS.photos[p.src]?.place?.name).filter(Boolean)).size, kept: kept.length,
    comparisons: (DATA.photos.length + DATA.poems.length) * AX.length, distances: kms.length, near: kms.filter(k => k <= nearKm).length, far: kms.filter(k => k > nearKm && k <= farKm).length,
    setPhotos: DATA.photos.filter(p => sp.has(p.src)).length, setPoems: DATA.poems.filter(p => sq.has(p.slug)).length, digests: DATA.photos.length + DATA.poems.length,
    farthest: Math.round(Math.max(...kms)), nearestKm: Math.round(Math.min(...kms)), nearKm, farKm, winPhoto: +nov[2], winPoem: +nov[1],
    wetCodes: objKeys('WET_CODE_FLOORS'), fogCodes: objKeys('FOG_OR_OVERCAST_CODES'), photoFeel: feelRank('photo', photos[0]), poemFeel: feelRank('poem', poems[0]) }
  N.setBack = N.setPhotos + N.setPoems
  const F = { photoGap: score('photo', photos[0]) - score('photo', photos[1]), poemGap: score('poem', poems[0]) - score('poem', poems[1]),
    photoDist: dist(PS, photos[0]), poemDist: dist(QS, poems[0]) }
  AX.forEach(a => { F['day_' + a] = day[a]; F['w_' + a] = T.weightedDistance({ ...Object.fromEntries(AX.map(x => [x, 0])), [a]: 1 }, Object.fromEntries(AX.map(x => [x, 0]))) ** 2 })
  // each signal taken away: pickBest's answer, and whether any score moved
  const best = (dd, lat, lon, ds) => ({ photo: T.pickBest(DATA.photos, 'src', dd, PS, iso, 'photo', ds, lat, lon), poem: T.pickBest(DATA.poems, 'slug', dd, QS, iso, 'poem', ds, null, null) })
  const allScores = (dd, lat, lon, ds) => [...DATA.photos.map(p => score('photo', p.src, dd, lat, lon, ds)), ...DATA.poems.map(p => score('poem', p.slug, dd, lat, lon, ds))]
  const base = allScores(day, reading.lat, reading.lon, days)
  const sig = {}
  const away = (k, dd, lat, lon, ds) => { const s = allScores(dd, lat, lon, ds); sig[k] = { ...best(dd, lat, lon, ds), moved: s.some((v, i) => Math.abs(v - base[i]) > 1e-12) } }
  away('place', day, null, null, days)
  for (const a of ['light', 'warmth', 'wet', 'stillness', 'season', 'inside']) away(a, { ...day, [a]: .5 }, reading.lat, reading.lon, days)
  away('memory', day, reading.lat, reading.lon, null)
  // which live fields dayVectorFromCurrent reads: change one, see the day move
  const reads = f => { const r2 = { ...reading }, probe = { weather_code: 65, is_day: reading.is_day ? 0 : 1, temperature_2m: reading.temperature_2m + 7, cloud_cover: 50 + (reading.cloud_cover > 50 ? -40 : 40),
      wind_speed_10m: reading.wind_speed_10m + 9, precipitation: 6, rain: 6, showers: 6, snowfall: 6 }
    if (!(f in probe)) return false; r2[f] = probe[f]; const d2 = T.dayVectorFromCurrent(iso, r2, reading.lat); return AX.some(a => Math.abs(d2[a] - day[a]) > 1e-12) }
  N.signals = Object.keys(sig).length; F.photoLift = T.placeBonus(PS.photos[photos[0]].place, reading.lat, reading.lon)
  return { photos, poems, day, N, F, sig, reads }
}
const BLACK = [/closest photo/i, /nearest to that/i, /nothing else came close/i, /a hair behind/i, /a shade nearer/i, /won on feel/i, /out in front/i, /so today leaned/i,
  /\bjust\b/i, /\bsimply\b/i, /\bbasically\b/i, /\bkind of\b/i, /\bsort of\b/i, /\bpretty\b/i, /\bnice\b/i, /\bfun\b/i, /\bmagic/i, /\bvibes?\b/i, /\bwe think\b/i,
  /\bprobably\b/i, /\bguess/i, /\bhappens to\b/i, /\bluck/i, /\brandom/i, /!/, /\bfeel alone\b/i, /\bit's clear and\b/i]
const DOORS = JSON.parse(readFileSync(path.join(HERE, 'doors.json'), 'utf8'))
const WORKS = [...DATA.poems.map(p => p.title), ...DATA.photos.map(p => p.alt), ...DATA.poems.flatMap(p => p.stanzas.join('\n').split(/\n| \/ /)).map(l => l.trim()).filter(l => l.length > 2),
  ...Object.values(DOORS.vocabs).flatMap(v => v.words.map(w => w.word))].sort((a, b) => b.length - a.length)
const SYSTEM = /\b(day-?flow|pick\.js|weather\.js|home\.js|open-?meteo|json|kmini|presence\.json|daily_pick)\b/i

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
// a small static server in this process (python's http.server resets connections when the page asks for many photographs at once)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.webp': 'image/webp' }
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(ROOT, path.normalize(p)); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
let SKY = 'real', KEEP_TODAY = false, TODAY = null, ASKED = null

try {
  await waitFor(() => fetch(`${BASE}/studies/31/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  const b64 = s => Buffer.from(s).toString('base64')
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url)
    if (msg.method === 'Fetch.requestPaused') { const { requestId, request } = msg.params, cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
      if (/open-meteo\.com/.test(request.url)) {
        ASKED = new URL(request.url).searchParams.get('current')
        if (SKY === 'none') cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 503, responseHeaders: cors, body: b64('{}') })
        else cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(FIXTURE) })
      } else if (/\/v2\/days\.json/.test(request.url) && KEEP_TODAY && TODAY) {
        const d = structuredClone(DAYS), last = Object.keys(d.days).sort().pop(); d.days[TODAY] = { ...d.days[last] }
        cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(JSON.stringify(d)) })
      } else cdp.send('Fetch.continueRequest', { requestId }) }
  }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*open-meteo.com*' }, { urlPattern: '*/v2/days.json*' }] })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { sessionStorage.clear() } catch {}' })

  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/31/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S24.world && !!window.S31P`), 'page ' + q, 300)
    await cdp.eval('S31P.ready'); await sleep(400) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const boxOf = sel => cdp.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [b.left, b.top, b.width, b.height] })()`)
  const tapEl = async sel => { const b = await boxOf(sel); await tap(b[0] + Math.min(b[2] / 2, 60), b[1] + b[3] / 2) }
  const openWhy = async () => { await tapEl('#where'); await waitFor(() => cdp.eval(`document.body.classList.contains('why') && +getComputedStyle(document.getElementById('why')).opacity > .98`), 'the panel opens', 60) }
  const panel = () => cdp.eval(`(() => { const p = document.getElementById('why'), b = p.getBoundingClientRect(), w = document.getElementById('where').getBoundingClientRect(), body = p.querySelector('.why-body')
    const wide = [...p.querySelectorAll('.why-body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1) }).map(e => e.className || e.tagName).slice(0, 4)
    return { scrollH: p.scrollHeight, clientH: p.clientHeight, clientW: p.clientWidth, text: p.innerText, box: [b.left, b.top, b.right, b.bottom], where: [w.left, w.top, w.right, w.bottom], wide, done: body.dataset.done,
      ns: [...p.querySelectorAll('[data-n]')].map(e => ({ k: e.dataset.n, t: e.textContent })), fs: [...p.querySelectorAll('[data-f]')].map(e => ({ k: e.dataset.f, d: +e.dataset.d, t: e.textContent })),
      ledger: [...p.querySelectorAll('.l-box')].map(l => [...l.querySelectorAll('.l-row[data-key]')].map(r => r.dataset.key)),
      gauges: [...p.querySelectorAll('.b-g')].map(g => g.dataset.axis),
      sigs: [...p.querySelectorAll('.b-sig')].map(s => ({ k: s.dataset.sig, photo: s.dataset.photo, poem: s.dataset.poem, t: s.innerText })),
      doors: [...p.querySelectorAll('.b-door')].map(d => d.dataset.door), stoneDoors: S24.doors.map(d => d.phrase),
      tiles: [...p.querySelectorAll('.c-photo .c-t')].length + '/' + [...p.querySelectorAll('.c-poem .c-t')].length, tileWin: [...p.querySelectorAll('.c-win')].map(e => e.dataset.key),
      dots: p.querySelectorAll('.e-dot').length, dotWin: [...p.querySelectorAll('.e-win')].map(e => e.dataset.key),
      model: (m => m && { mode: m.mode, iso: m.iso, agrees: m.agrees, fields: m.src.fields })(S31P.model), stone: S24.world } })()`)
  const num = t => +t.replace(/,/g, '').replace('−', '-')
  const fx = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d)

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      errors.length = 0; SKY = 'real'; KEEP_TODAY = false
      const L = `w=${way} ${tag}`
      await open('w=' + way)
      check(await cdp.eval(`S31P.how`) === 'live', `${L}: today is a live pick`)
      await openWhy()
      if (way === 'd') await waitFor(() => cdp.eval(`document.querySelector('.why-body').dataset.done === 'yes'`), 'the run to finish', 80)
      const s = await panel(); TODAY = s.model.iso
      const truth = truthFor(s.model.iso, READING, DAYS); truth.N.skyFields = (ASKED || '').split(',').filter(Boolean).length
      check(s.stone.photo === truth.photos[0] && s.stone.slug === truth.poems[0] && s.model.agrees, `${L}: the stone shows pick.js's two`, JSON.stringify(s.stone))
      // the numbers shown equal the numbers computed
      const badN = s.ns.filter(x => !(x.k in truth.N) || num(x.t) !== truth.N[x.k]).map(x => `${x.k}=${x.t} (want ${truth.N[x.k]})`)
      const badF = s.fs.filter(x => !(x.k in truth.F) || x.t !== fx(truth.F[x.k], x.d)).map(x => `${x.k}=${x.t} (want ${fx(truth.F[x.k], x.d)})`)
      check(s.ns.length >= 4 && badN.length === 0, `${L}: ${s.ns.length} counts shown equal the counts computed`, badN.join(', '))
      check(badF.length === 0, `${L}: ${s.fs.length} measures shown equal pick.js's`, badF.join(', '))
      const need = { a: ['candidates', 'comparisons', 'distances', 'digests', 'setBack', 'photos', 'poems'], b: ['signals', 'skyFields', 'comparisons', 'distances', 'near', 'far', 'setBack', 'kept', 'digests', 'photoFeel', 'poemFeel'],
        c: ['scored', 'judgements', 'located', 'kept', 'scoredPhotos', 'scoredPoems'], d: ['candidates', 'comparisons', 'distances', 'digests', 'setBack'], e: ['candidates', 'comparisons', 'distances', 'setBack'] }[way]
      const missing = need.filter(k => !s.ns.some(x => x.k === k)); check(!missing.length, `${L}: it shows the scale (${need.length} counts)`, missing.join(', '))
      if (way === 'a') check(s.ledger.length === 2 && s.ledger[0].join() === truth.photos.join() && s.ledger[1].join() === truth.poems.join(), `${L}: the ledger lists all ${truth.photos.length + truth.poems.length} works in pick.js's order`,
        JSON.stringify(s.ledger.map(l => l.slice(0, 3))) + ' vs ' + JSON.stringify([truth.photos.slice(0, 3), truth.poems.slice(0, 3)]))
      if (way === 'b') {
        check(s.gauges.join() === AX.join(), `${L}: the moment has all seven measures`)
        const asked = (ASKED || '').split(','), unread = asked.filter(f => !truth.reads(f))
        check(asked.length > 0 && unread.length === 0, `${L}: every live field counted moves the moment`, unread.join(', '))
        check(s.sigs.length >= 7, `${L}: ${s.sigs.length} signals, each taken away in turn`)
        for (const g of s.sigs) {
          const t = truth.sig[g.k]
          check(t && t.moved, `${L}: signal "${g.k}" moved the computation`, t ? 'no score changed without it' : 'not a signal the computation reads')
          check(t && t.photo === g.photo && t.poem === g.poem, `${L}: without "${g.k}", the two are pickBest's`, t && `${g.photo} ${g.poem} vs ${t.photo} ${t.poem}`)
        }
        check(s.doors.length > 0 && s.doors.join('|') === s.stoneDoors.join('|'), `${L}: the stone's door lines listed are the doors on the stone`, s.doors.join('|') + ' vs ' + s.stoneDoors.join('|'))
        const photo = DATA.photos.find(p => p.src === truth.photos[0]), poem = DATA.poems.find(p => p.slug === truth.poems[0])
        check(s.text.includes(photo.alt) && s.text.includes(poem.title), `${L}: it names the two chosen`)
        check(s.text.includes(READING.place) && s.text.includes(READING.temperature_2m.toFixed(1) + ' °C') && s.text.includes(READING.wind_speed_10m + ' km/h'), `${L}: it carries the reading itself`)
      }
      if (way === 'c') check(s.tiles === `${truth.N.photos}/${truth.N.poems}` && s.tileWin.join() === [truth.photos[0], truth.poems[0]].join(), `${L}: every work is a tile, the two chosen lit`, s.tiles + ' ' + s.tileWin)
      if (way === 'e') check(s.dots === truth.N.candidates && s.dotWin.join() === [truth.photos[0], truth.poems[0]].join(), `${L}: every work is placed, the two chosen marked`, s.dots + ' ' + s.dotWin)
      const own = WORKS.reduce((t, w) => t.split(w).join(' '), s.text) // the works' own titles and descriptions are theirs, not the page's register
      const black = BLACK.find(r => r.test(own)); check(!black, `${L}: no casual filler`, black && (own.match(black) || [])[0])
      const sys = SYSTEM.exec(s.text); check(!sys, `${L}: no system names`, sys && sys[0])
      const [x0, y0, x1, y1] = s.box
      check(x0 >= 0 && y0 >= 0 && x1 <= vp.w + .5 && y1 <= vp.h + .5, `${L}: the panel is on screen`, JSON.stringify(s.box))
      check(y1 <= s.where[1] + 1 || x0 >= s.where[2] || x1 <= s.where[0], `${L}: it leaves the line clear`, JSON.stringify({ box: s.box, where: s.where }))
      check(s.clientH + 1 >= Math.min(s.scrollH, vp.h * .6) && s.clientW >= 300, `${L}: the panel has room to read (three fifths of the screen, or all of it)`, `${s.clientW}x${s.clientH} of ${s.scrollH}`)
      check(s.wide.length === 0, `${L}: nothing is wider than the panel`, s.wide.join(', '))
      await shot(`31-${way}-${tag}.png`)
      await cdp.eval(`document.getElementById('why').scrollTop = 1e5`); await sleep(150); await shot(`31-${way}-${tag}-end.png`); await cdp.eval(`document.getElementById('why').scrollTop = 0`)
      const before = s.stone.key
      const pt = await cdp.eval(`(() => { for (const [x, y] of [[${vp.w} - 20, ${vp.h} * .4], [20, 20], [${vp.w} * .5, 40], [${vp.w} - 20, ${vp.h} - 20], [${vp.w} * .5, ${vp.h} * .5]]) { const e = document.elementFromPoint(x, y); if (e && e.id === 'why-scrim') return [x, y] } return null })()`)
      check(!!pt, `${L}: some of the stone stays in view around the panel`)
      if (pt) await tap(...pt); await sleep(700)
      const after = await cdp.eval(`({ open: S31P.open, cls: document.body.classList.contains('why'), at: S24.at, key: S24.world.key, busy: S24.busy })`)
      check(!after.open && !after.cls && after.at === 'stone' && after.key === before && !after.busy, `${L}: closing returns to the same stone`, JSON.stringify({ after, pt }))
      await openWhy(); await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(500)
      check(!(await cdp.eval('S31P.open')) && (await cdp.eval('S24.at')) === 'stone', `${L}: Escape closes it too`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // fallbacks, honestly: no sky at all, then a kept day
  for (const vp of VIEWPORTS.filter(v => v.w !== 844)) { await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      errors.length = 0; SKY = 'none'; KEEP_TODAY = false
      await open('w=' + way)
      const how = await cdp.eval('S31P.how'), line = await cdp.eval(`document.getElementById('where').textContent`)
      check(how === 'hash' && /can.t see the sky/i.test(line), `no sky w=${way} ${tag}: the line says it cannot see the sky`, `${how} "${line}"`)
      await openWhy(); const s = await panel()
      check(/no live sky reached the page/i.test(s.text) && /from the date alone/i.test(s.text), `no sky w=${way} ${tag}: it says the pair comes from the date`, s.text.slice(0, 160))
      check(!/°C/.test(s.text) && !s.sigs.length, `no sky w=${way} ${tag}: it invents no reading and no signal`, s.text.slice(0, 160))
      const t0 = truthFor(TODAY, READING, DAYS); t0.N.skyFields = (ASKED || '').split(',').filter(Boolean).length; const badN = s.ns.filter(x => !(x.k in t0.N) || num(x.t) !== t0.N[x.k]).map(x => x.k + '=' + x.t)
      check(badN.length === 0, `no sky w=${way} ${tag}: the counts it still shows are true`, badN.join(', '))
      if (way === 'b') await shot(`31-nosky-${tag}.png`)
      errors.length = 0; SKY = 'none'; KEEP_TODAY = true
      await open('w=' + way)
      const how2 = await cdp.eval('S31P.how'); await openWhy(); const k = await panel()
      check(how2 === 'frozen' && /no live sky right now/i.test(k.text) && /kept for/i.test(k.text), `kept day w=${way} ${tag}: it says this is the pair kept for today`, `${how2}: ${k.text.slice(0, 160)}`)
      const kd = DAYS.days[Object.keys(DAYS.days).sort().pop()]
      check(k.stone.photo === kd.photo && k.stone.slug === kd.poem, `kept day w=${way} ${tag}: the stone shows the kept pair`)
      check(!k.sigs.length && !/\d+\.\d °C ·/.test(k.text), `kept day w=${way} ${tag}: no live signal is claimed`)
      if (way === 'b') await shot(`31-kept-${tag}.png`)
      check(errors.length === 0, `fallbacks w=${way} ${tag}: no console errors`, errors.join(' | '))
    } }
  console.log('shots: studies/31/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : `\nPASS study 31 the decision: ${oks} checks, 5 ways at 1440x900, 390x844 and 844x390, every number recounted`)
process.exit(failures ? 1 : 0)
