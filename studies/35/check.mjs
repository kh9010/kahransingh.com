#!/usr/bin/env node
// Study 35 check: before any tap, each first-seconds answer is moved by a signal that also fed today's pick, and by nothing else.
// The sky is stubbed with a real Open-Meteo response (fixtures/open-meteo-2026-11-08.json, fetched once, read-only, kept verbatim);
// every other sky here is that response with one named field changed. The pair is held with ?at= (a world in the address, held as
// today's stone) so only the sky moves between runs. The truth is recomputed in Node from v2/pick.js itself, independently of moment.js:
//   the day's measures the page used are pick.js's dayVectorFromCurrent of the fixture;
//   the deciding signal is the one whose removal costs the held pair most against the best of the rest (recounted here);
//   light: the grade, lamp and sun height follow warmth, light and season, and the pixels warm, brighten and dim with them;
//   line: the readings shown are the fixture's own numbers, each a field that moves pick.js's day, resolving into weather.js's sentence;
//   settle: how far the facets come follows the wind, the fall follows the wet, and the stone comes to rest;
//   answer: the facets answer in order of how nearly their fragment holds the deciding measure; another decider, another order;
//   trace: the line names how much was weighed and the decider, and changes when the decider does.
// Held from 28: the photograph whole (pixels at rest are this photograph's, not the next), door lines arriving in order.
// No sky: nothing is shown as read. No timer, no instruction words, nothing off screen at 1440x900, 390x844, 844x390.
// Run: node studies/35/check.mjs   (WAYS=line,trace to narrow; non-zero exit on any failure). Screenshots: studies/35/shots/.
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
const WAYS = (process.env.WAYS || 'light,line,settle,answer,trace').split(',')
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }, { w: 844, h: 390, mobile: true }]
const REAL = JSON.parse(readFileSync(path.join(HERE, 'fixtures/open-meteo-2026-11-08.json'), 'utf8'))
const sky = (cur = {}) => ({ ...REAL, current: { ...REAL.current, ...cur } })
const SKIES = { real: sky(), warm: sky({ temperature_2m: 29 }), day: sky({ is_day: 1 }), windy: sky({ wind_speed_10m: 38 }), wet: sky({ rain: 6, precipitation: 6, weather_code: 63 }), cold: sky({ temperature_2m: -4 }) }
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
const DEF = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')), D = k => parseFloat(DEF[k])
{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8')
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2))
  const clash = Object.keys(DEF).filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
  const body = page.slice(page.indexOf('<body>'), page.indexOf('<script')).replace(/<[^>]+>/g, ' ')
  check(!/\b(click|tap|hover|scroll|swipe|press|touch)\b/i.test(body), 'no instruction text in the markup')
}

/* ---------- the truth, in Node, from v2/pick.js itself ---------- */
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const DATA = J('v2/data.json'), DAYS = J('v2/days.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), PLACE = J('v2/place.json')
const PICK_SRC = readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8'), WEATHER_SRC = readFileSync(path.join(ROOT, 'v2/weather.js'), 'utf8')
const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside']
const readingOf = om => { const c = om.current, d = om.daily || {}
  return { place: PLACE.place, lat: PLACE.lat, lon: PLACE.lon, tz: om.timezone, away: !!PLACE.away, weather_code: c.weather_code, is_day: c.is_day, temperature_2m: c.temperature_2m,
    cloud_cover: c.cloud_cover, wind_speed_10m: c.wind_speed_10m, precipitation: c.precipitation, rain: c.rain, showers: c.showers, snowfall: c.snowfall, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0] } }
function pickJS(reading) { const win = { kahranWeather: { current: reading } }
  vm.runInNewContext(PICK_SRC, { window: win, Math, Date, JSON, Object, Array, Number, String, parseInt })
  const K = win.kahranPick; K.__test.setScores(QS, PS); K.setDays(DAYS); K.setData(DATA); return K }
const sentence = r => { const phrase = new Function(/function phraseFor[\s\S]*?\n {2}\}/.exec(WEATHER_SRC)[0] + '; return phraseFor')()(r.weather_code, r.is_day !== 0); return "We're in " + r.place + ' and ' + phrase + '.' }
const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICK_SRC), PEN = +/NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(PICK_SRC)[1]
function truthFor(iso, om, photo, poem) { // recounted here: what each signal's absence costs the held pair
  const reading = readingOf(om), K = pickJS(reading), T = K.__test, day = T.dayVectorFromCurrent(iso, reading, reading.lat)
  const shown = (kind, win, dd) => { const s = new Set(); if (!dd) return s; const cut = new Date(Date.parse(iso + 'T00:00:00Z') - win * 864e5).toISOString().slice(0, 10)
    for (const [d, e] of Object.entries(dd.days)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e[kind]) s.add(e[kind]); return s }
  const lead = (kind, own, dy, lat, lon, dd) => { const items = kind === 'photo' ? DATA.photos.map(p => p.src) : DATA.poems.map(p => p.slug), sc = kind === 'photo' ? PS : QS, seen = shown(kind, kind === 'photo' ? +nov[2] : +nov[1], dd)
    const s = k => -T.weightedDistance(dy, T.itemVector(sc, k)) + (kind === 'photo' ? T.placeBonus((PS.photos[k] || {}).place, lat, lon) : 0) + (seen.has(k) ? PEN : 0) + T.tiebreak(iso, k)
    const mine = s(own); return mine - Math.max(...items.filter(k => k !== own).map(s)) }
  const both = (dy, lat, lon, dd) => lead('photo', photo, dy, lat, lon, dd) + lead('poem', poem, dy, null, null, dd)
  const m0 = both(day, reading.lat, reading.lon, DAYS)
  const cost = { ...Object.fromEntries(AX.map(a => [a, m0 - both({ ...day, [a]: .5 }, reading.lat, reading.lon, DAYS)])), place: m0 - both(day, null, null, DAYS), memory: m0 - both(day, reading.lat, reading.lon, null) }
  const decisive = Object.entries(cost).reduce((a, b) => b[1] > a[1] ? b : a)[0]
  return { reading, day, cost, decisive, pick: K.pickFor(iso, true), sentence: sentence(reading) }
}

/* ---------- the page ---------- */
const shell = findShell(); if (!shell) { console.log('FAIL no headless Chrome found (set CHROME=)'); process.exit(1) }
const HTTP = await freePort(), CDPP = await freePort()
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(ROOT, path.normalize(p)); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
let SKY = 'real'

try {
  await waitFor(() => fetch(`${BASE}/studies/35/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  const b64 = s => Buffer.from(s).toString('base64')
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Fetch.requestPaused') { const { requestId } = msg.params, cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
      if (SKY === 'none') cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 503, responseHeaders: cors, body: b64('{}') })
      else cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(JSON.stringify(SKIES[SKY])) }) }
  }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*open-meteo.com*' }] })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { sessionStorage.clear() } catch {}' })
  const view = vp => cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
  const open = async (q, sk = 'real') => { SKY = sk
    await cdp.send('Page.navigate', { url: `${BASE}/studies/35/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && !!(window.S35 && S35.world && S35.world.imgOk)`), 'page ' + q, 300)
    return cdp.eval('({ how: S35.how, first: S35.first, world: S35.world, iso: S35.first.m && S35.first.m.iso })') }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e
  const dayOk = (pg, tr) => AX.every(a => near(pg.m.day[a], tr.day[a]))

  // today, as the page picks it under the real sky; that pair is then held while the sky changes
  await view(VIEWPORTS[0])
  const p0 = await open('a=line')
  check(p0.how === 'live', 'today is a live pick under the real sky')
  const ISO = p0.iso, T0 = truthFor(ISO, SKIES.real, p0.world.photo, p0.world.slug)
  check(p0.world.photo === T0.pick.photo && p0.world.slug === T0.pick.poem, "the stone is today's pick, as pick.js picks it", `${p0.world.slug} / ${T0.pick.poem}`)
  const HELD = p0.world.key, hold = a => `a=${a}&at=${encodeURIComponent(HELD)}`
  const truth = sk => truthFor(ISO, SKIES[sk], p0.world.photo, p0.world.slug)
  const TR = Object.fromEntries(Object.keys(SKIES).map(k => [k, truth(k)]))
  const other = Object.keys(SKIES).find(k => TR[k].decisive !== TR.real.decisive)
  check(!!other, 'some sky decides the held pair differently', Object.entries(TR).map(([k, t]) => k + ':' + t.decisive).join(' '))

  for (const way of WAYS) {
    errors.length = 0
    const pr = await open(hold(way)), pg = pr.first
    check(pr.world.key === HELD && pr.world.mode === 'home', `${way}: ?at= holds the pair as today's stone`)
    check(pg.m && dayOk(pg, TR.real), `${way}: the measures it acts on are pick.js's own day for this sky`)
    check(pg.m && pg.m.decisive.key === TR.real.decisive, `${way}: the deciding signal is the one whose absence costs the pair most`, `${pg.m && pg.m.decisive.key} vs ${TR.real.decisive}`)

    if (way === 'light') {
      const L = pg.light, d = TR.real.day
      check(near(L.lamp, D('sky-lamp-lo') + (D('sky-lamp-hi') - D('sky-lamp-lo')) * d.light) && near(L.sunY, D('sky-sun-top') + (D('sky-sun-low') - D('sky-sun-top')) * (1 - d.season)) && near(L.dim, D('sky-dim') * (1 - d.light)) && near(L.veil, D('sky-veil') * d.wet),
        'light: lamp from light, sun height from season, dim from light, veil from wet')
      await sleep(D('sky-ms') + 1600); const t0 = await cdp.eval('S35.tone()'); await shot('35-light-real-1440.png')
      const at = async sk => { const r = await open(hold('light'), sk); await sleep(D('sky-ms') + 1600); return { f: r.first, t: await cdp.eval('S35.tone()') } }
      const warm = await at('warm'), cold = await at('cold'), day = await at('day'), wet = await at('wet'); await shot('35-light-wet-1440.png')
      check(warm.f.light.tint[0] > pg.light.tint[0] && warm.f.light.tint[2] < pg.light.tint[2] && cold.f.light.tint[2] > pg.light.tint[2], 'light: a warmer reading warms the grade, a colder one cools it', JSON.stringify([cold.f.light.tint, pg.light.tint, warm.f.light.tint]))
      check(warm.t.r - warm.t.b > t0.r - t0.b + 1 && cold.t.r - cold.t.b < t0.r - t0.b - 1, 'light: and the pixels follow (red over blue)', [cold.t, t0, warm.t].map(t => (t.r - t.b).toFixed(1)).join(' < '))
      check(day.f.light.lamp > pg.light.lamp && day.t.l > t0.l + .01, 'light: daylight raises the lamp and the stone brightens', `${t0.l.toFixed(3)} -> ${day.t.l.toFixed(3)}`)
      check(wet.f.light.veil > 0 && pg.light.veil === 0, 'light: rain lays a veil a dry hour does not')
      check(Math.abs(warm.f.light.sunY - pg.light.sunY) < 1e-9, 'light: the sun height moves only with the season, not the warmth')
    }
    if (way === 'line') {
      const r = TR.real.reading, rd = await cdp.eval(`[...document.querySelectorAll('#where .rd i')].map(i => i.textContent.replace(/ ·$/, ''))`)
      check(rd.length === 7 && rd.includes(r.temperature_2m.toFixed(1) + ' °C') && rd.includes(r.wind_speed_10m + ' km/h') && rd.includes(r.cloud_cover + '% cloud') && rd.includes(r.is_day ? 'daylight' : 'after dark'), "line: the readings shown are this sky's own numbers", rd.join(' | '))
      await shot('35-line-reading-1440.png')
      // every reading shown is a field pick.js reads: changing it alone changes the day
      const K = pickJS(r), base = K.__test.dayVectorFromCurrent(ISO, r, r.lat)
      const moves = [['temperature_2m', 25], ['wind_speed_10m', 30], ['cloud_cover', 90], ['is_day', 1 - r.is_day], ['rain', 5]].every(([f, v]) => { const d2 = K.__test.dayVectorFromCurrent(ISO, { ...r, [f]: v }, r.lat); return AX.some(a => !near(d2[a], base[a])) })
      check(moves, 'line: each reading it shows moves pick.js\'s day when it changes')
      await waitFor(() => cdp.eval(`S35.first.line && S35.first.line.phase === 'resolved'`), 'the line resolves', 80)
      check(await cdp.eval(`document.getElementById('where').textContent`) === TR.real.sentence, "line: it resolves into weather.js's sentence, as on the home", TR.real.sentence)
      const w2 = await open(hold('line'), 'warm'), rd2 = await cdp.eval(`[...document.querySelectorAll('#where .rd i')].map(i => i.textContent.replace(/ ·$/, ''))`)
      check(rd2.includes('29.0 °C') && !rd2.includes(r.temperature_2m.toFixed(1) + ' °C'), 'line: another temperature, another reading', rd2.join(' | '))
      const w3 = await open(hold('line'), 'windy'), rd3 = await cdp.eval(`[...document.querySelectorAll('#where .rd i')].map(i => i.textContent.replace(/ ·$/, ''))`)
      check(rd3.includes('38 km/h'), 'line: another wind, another reading', rd3.join(' | '))
    }
    if (way === 'settle') {
      const S = pg.settle, gust = 1 - TR.real.day.stillness
      check(near(S.amp, D('settle-px') * (.3 + 1.7 * gust)) && near(S.fall, D('settle-fall-px') * TR.real.day.wet) && near(S.ms, D('settle-ms') * (1 + .8 * gust)), 'settle: how far and how long from the wind, the fall from the wet')
      const a0 = await cdp.eval('S35.pose(0)'), aEnd = await cdp.eval(`S35.pose(${S.delay + S.ms * (1 + S.stagger) + 50})`)
      check(a0 > 1 && aEnd === 0, 'settle: the facets start out of place and come to rest', `${a0.toFixed(1)}px -> ${aEnd}`)
      const wi = await open(hold('settle'), 'windy'), aw = await cdp.eval('S35.pose(0)'); await sleep(250); await shot('35-settle-windy-1440.png')
      check(wi.first.settle.amp > S.amp && aw > a0 * 1.5, 'settle: a windier reading, a longer way to come', `${a0.toFixed(1)} -> ${aw.toFixed(1)}px`)
      const we = await open(hold('settle'), 'wet')
      check(we.first.settle.fall > 0 && S.fall === 0, 'settle: rain makes them fall into place; a dry hour does not')
    }
    if (way === 'answer') {
      const A = pg.answer, sorted = A.order.every((id, k) => k === 0 || Math.abs(A.vals[A.order[k - 1]] - A.target) <= Math.abs(A.vals[id] - A.target) + 1e-12)
      check(A.key === TR.real.decisive && sorted && A.order.length >= 10, 'answer: the facets answer in order of how nearly they hold the deciding measure', `${A.key} as ${A.feature}, ${A.order.length} facets`)
      const spread = Math.max(...Object.values(A.vals)) - Math.min(...Object.values(A.vals))
      check(spread > .05, 'answer: the measure differs from facet to facet, so the order is earned, not the cut\'s own', spread.toFixed(3))
      if (!A.radial) check(near(A.target, TR.real.day[A.key]), "answer: the target is that measure's value today")
      const step = Math.min(D('answer-step-ms'), D('answer-span-ms') / A.order.length), first = await cdp.eval(`S35.glowAt(${D('answer-delay-ms') + D('answer-glow-ms') / 2})`)
      check(first[0] > 0 && first[first.length - 1] === 0, 'answer: the nearest answers first, the farthest not yet')
      const ob = await open(hold('answer'), other)
      check(ob.first.answer.key === TR[other].decisive && ob.first.answer.key !== A.key && ob.first.answer.order.join() !== A.order.join(), `answer: under the ${other} sky another signal decides, and another order answers`, `${A.key} -> ${ob.first.answer.key}`)
      await sleep(D('answer-delay-ms') + 300); await shot(`35-answer-${other}-1440.png`)
    }
    if (way === 'trace') {
      const said = t => ({ season: (d => (d <= 10 ? 'Early ' : d <= 20 ? 'Mid-' : 'Late ') + new Date(ISO + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }))(+ISO.slice(8, 10)), light: t.reading.is_day ? (t.reading.cloud_cover >= 70 ? 'The cloud' : 'The light') : 'The dark',
        warmth: t.reading.temperature_2m.toFixed(1) + ' °C', place: t.reading.place, memory: 'What came before' })[t.decisive]
      const want = t => `${DATA.photos.length} photographs and ${DATA.poems.length} poems, weighed against this hour.` + (said(t) ? ` ${said(t)} decided.` : '')
      await sleep(D('trace-delay-ms') + D('trace-ms') + 200)
      const tx = await cdp.eval(`(() => { const t = document.getElementById('trace'); return { t: t.textContent, o: +getComputedStyle(t).opacity } })()`)
      check(said(TR.real) ? tx.t === want(TR.real) : tx.t.startsWith(want(TR.real)) && / decided\.$/.test(tx.t), 'trace: how much was weighed, and the decider, in words', tx.t)
      check(tx.o > .5, 'trace: it is there to be read', String(tx.o))
      const ob = await open(hold('trace'), other); await sleep(D('trace-delay-ms') + D('trace-ms') + 200); await shot(`35-trace-${other}-1440.png`)
      check(ob.first.trace !== pg.trace && ob.first.trace.startsWith(want(TR[other]).split('.')[0]), `trace: under the ${other} sky it names another decider`, ob.first.trace)
    }
    // held from 28: the photograph stays whole once the first seconds are over
    await open(hold(way)); await sleep(4200)
    const rest = await cdp.eval('S35.rest()'), whole = rest.filter(x => x.own < x.other).length
    check(rest.length >= 8 && whole >= rest.length - 1, `${way}: at rest every facet is this photograph`, `${whole}/${rest.length}`)
    check(errors.length === 0, `${way}: no console errors`, errors.join(' | '))
  }

  // no live sky: nothing is shown as read
  for (const way of WAYS) { errors.length = 0
    const ns = await open(hold(way), 'none'); await sleep(2600)
    const dom = await cdp.eval(`({ rd: document.querySelectorAll('#where .rd').length, trace: document.getElementById('trace').textContent, lamp: S35.fs.lamp, sun: S35.fs.sun })`)
    check(!ns.first.m && !dom.rd && !dom.trace && dom.lamp === 1 && !dom.sun && !ns.first.settle && !ns.first.answer, `no sky ${way}: nothing is shown as read`)
    check(errors.length === 0, `no sky ${way}: no console errors`, errors.join(' | ')) }

  // every way, every screen: nothing off screen, nothing over the poem, no timer, no instruction
  for (const vp of VIEWPORTS) { await view(vp); const tag = vp.w + 'x' + vp.h
    for (const way of WAYS) {
      await open(hold(way)); await sleep(way === 'line' ? 300 : 1400)
      if (vp.w !== 1440) await shot(`35-${way}-${tag}.png`)
      await sleep(3600)
      const L = await cdp.eval(`(() => { const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom] }, v = document.querySelector('.verse:not(.gone)')
        const hits = ['#mat', '#where', '#trace', '#mat nav'].map(s => document.querySelector(s)).filter(e => e && e.getBoundingClientRect().height)
        return { W: innerWidth, H: innerHeight, sw: document.documentElement.scrollWidth, boxes: hits.map(r), verse: r(v), text: document.body.innerText } })()`)
      const inside = L.boxes.every(([l, t, r, b]) => l >= 0 && t >= 0 && r <= L.W + .5 && b <= L.H + .5)
      const over = L.boxes.some(([l, t, r, b]) => l < L.verse[2] && r > L.verse[0] && t < L.verse[3] && b > L.verse[1])
      check(inside && L.sw <= L.W, `${way} ${tag}: the line and the mat sit on screen`, JSON.stringify(L.boxes))
      check(!over, `${way} ${tag}: nothing lies over the poem`)
      check(!/\b\d+\s?(s|sec|secs|seconds)\b|\b\d{1,2}:\d{2}\b/.test(L.text), `${way} ${tag}: no timer anywhere`)
      check(!/\b(click|tap|hover|scroll|swipe|press|touch|explore)\b/i.test(L.text), `${way} ${tag}: no instruction text`)
      if (vp.w === 1440 && way === 'line') await shot('35-line-resolved-1440.png')
    } }

  // held from 28: a world reached by walking arrives line by line, in order
  await view(VIEWPORTS[0]); await open(hold('line')); await sleep(300)
  const db = await cdp.eval('S35.doors[0].box'), dx = db[0] + Math.min(db[2] / 2, 40), dy = db[1] + db[3] / 2
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dx, y: dy, button: 'left', buttons: 1, clickCount: 1 }); await sleep(40)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dx, y: dy, button: 'left', buttons: 0, clickCount: 1 })
  await waitFor(() => cdp.eval(`S35.at === 'world'`), 'a world', 80)
  const seen = []; for (let k = 0; k < 70; k++) { seen.push(await cdp.eval('S35.lines.map(l => l.shown)')); await sleep(120) }
  const prefix = seen.every(s => s.every((v, i) => !v || s.slice(0, i).every(Boolean))), done = seen.at(-1).every(Boolean)
  check(prefix && done, 'a world arrives line by line, in order, door lines among them')
  console.log('shots: studies/35/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : `\nPASS study 35 before any tap: ${oks} checks, 5 ways at 1440x900, 390x844 and 844x390, each effect moved by its signal in a fixture`)
process.exit(failures ? 1 : 0)
