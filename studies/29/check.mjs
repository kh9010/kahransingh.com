#!/usr/bin/env node
// Study 29 check: the line under his name opens why THIS photograph and THIS poem today.
// The sky is stubbed with a real Open-Meteo response (fixtures/open-meteo-2026-11-08.json, fetched once, read-only, kept verbatim).
// In headless Chrome at 1440x900 (mouse), 390x844 and 844x390 (touch), for each ?w= (a words, b gauges, c the line, d the race):
//   the line opens the why, on screen, clear of the line itself; it names today's photograph and poem, which are on the stone;
//   its winner and next two, photographs and poems, are pick.js's own: v2/pick.js run here in Node on the same reading,
//   asked again with each winner taken out; the gauges' "now" marks are pick.js's day axes; the words carry the reading's
//   own temperature and wind; no system names, no inside words (vector, weighted, sha, score, algorithm...);
//   closing (the stone, Escape) returns to the stone with the same pair, and inside a world, to the same world.
// Fallbacks: no sky (the weather fetch fails) says the pair comes from the date; a kept day (today in days.json, no sky) says so.
// No dial shadows a page CSS variable; no console errors. Screenshots: studies/29/shots/.
// Run: node studies/29/check.mjs   (WAYS=a,b to narrow; non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const WAYS = (process.env.WAYS || 'a,b,c,d').split(',')
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }, { w: 844, h: 390, mobile: true }]
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

let failures = 0
const check = (ok, label, detail) => { if (ok) { if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)).filter(k => k !== 'mat-h' && !k.startsWith('g-') && !k.startsWith('r-') && !k.startsWith('c-'))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}

/* ---------- the truth: v2/pick.js itself, in Node, on the stubbed reading (built the way v2/weather.js builds it) ---------- */
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const DATA = J('v2/data.json'), DAYS = J('v2/days.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), PLACE = J('v2/place.json')
function readingOf(om) { const c = om.current, d = om.daily || {}
  return { place: PLACE.place, lat: PLACE.lat, lon: PLACE.lon, tz: om.timezone || PLACE.tz, away: !!PLACE.away, weather_code: c.weather_code, is_day: c.is_day,
    temperature_2m: c.temperature_2m, cloud_cover: c.cloud_cover, wind_speed_10m: c.wind_speed_10m, precipitation: c.precipitation, rain: c.rain, showers: c.showers,
    snowfall: c.snowfall, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0] } }
function pickJS(reading, days) {
  const win = { kahranWeather: { current: reading } }
  vm.runInNewContext(readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8'), { window: win, Math, Date, JSON, Object, Array, Number, String, parseInt })
  const K = win.kahranPick; K.__test.setScores(QS, PS); K.setDays(days); return K
}
function ranking(reading, iso, days, n = 3) { // pick.js's own order: ask, take the winner out, ask again
  const K = pickJS(reading, days), poems = DATA.poems.slice(), photos = DATA.photos.slice(), P = [], F = []
  for (let i = 0; i < n; i++) { K.setData({ poems, photos }); const r = K.pickFor(iso, true); if (!r) break
    P.push(r.poem); F.push(r.photo); poems.splice(poems.findIndex(p => p.slug === r.poem), 1); photos.splice(photos.findIndex(p => p.src === r.photo), 1) }
  return { poems: P, photos: F, day: K.__test.dayVectorFromCurrent(iso, reading, reading.lat) }
}
const READING = readingOf(JSON.parse(FIXTURE))
const INSIDE = /\b(day-?flow|samwise|curator|vector|weighted|distance|sha-?256|hash|score|scoring|algorithm|tiebreak|novelty|penalty|axis|axes|pick\.js|open-?meteo|json)\b/i

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.kill() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
let SKY = 'real', KEEP_TODAY = false, TODAY = null

try {
  await waitFor(() => fetch(`${BASE}/studies/29/index.html`).then(r => r.ok), 'static server')
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
        if (SKY === 'none') cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 503, responseHeaders: cors, body: b64('{}') })
        else cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(FIXTURE) })
      } else if (/\/v2\/days\.json/.test(request.url) && KEEP_TODAY && TODAY) { // a kept day: today's entry, as the 23:50 job writes it
        const d = structuredClone(DAYS), last = Object.keys(d.days).sort().pop(); d.days[TODAY] = { ...d.days[last] }
        cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(JSON.stringify(d)) })
      } else cdp.send('Fetch.continueRequest', { requestId }) }
  }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*open-meteo.com*' }, { urlPattern: '*/v2/days.json*' }] })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { sessionStorage.clear() } catch {}' }) // no cached sky between runs

  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/29/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S24.world && !!window.S29P`), 'page ' + q, 300)
    await cdp.eval('S29P.ready'); await sleep(400) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const boxOf = sel => cdp.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [b.left, b.top, b.width, b.height] })()`)
  const tapEl = async sel => { const b = await boxOf(sel); await tap(b[0] + Math.min(b[2] / 2, 60), b[1] + b[3] / 2) }
  const openWhy = async () => { await tapEl('#where'); await waitFor(() => cdp.eval(`document.body.classList.contains('why') && +getComputedStyle(document.getElementById('why')).opacity > .98`), 'the why opens', 60) }
  const panel = () => cdp.eval(`(() => { const p = document.getElementById('why'), b = p.getBoundingClientRect(), w = document.getElementById('where').getBoundingClientRect()
    return { text: p.innerText, box: [b.left, b.top, b.right, b.bottom], where: [w.left, w.top, w.right, w.bottom], scrollH: p.scrollHeight, clientH: p.clientHeight,
      day: [...p.querySelectorAll('.g-row')].map(r => ({ a: r.dataset.axis, v: +r.querySelector('.g-day').dataset.v })),
      race: [...p.querySelectorAll('.r-lane')].map(l => [...l.querySelectorAll('.r-row:not(.r-seen)')].map(r => r.dataset.key)),
      model: (m => m && { mode: m.mode, iso: m.iso, photos: m.photos && m.photos.slice(0, 3).map(x => x.key), poems: m.poems && m.poems.slice(0, 3).map(x => x.key), agrees: m.agrees, day: m.day, rule: m.rule })(S29P.model),
      stone: S24.world, how: S29P.how } })()`)

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      errors.length = 0; SKY = 'real'; KEEP_TODAY = false
      const L = `w=${way} ${tag}`
      await open('w=' + way)
      check(await cdp.eval(`S29P.how`) === 'live', `${L}: today is a live pick`, await cdp.eval('S29P.how'))
      await openWhy()
      const s = await panel(), M = s.model; TODAY = M.iso
      const truth = ranking(READING, M.iso, DAYS)
      check(M.rule.fromSource, `${L}: the not-seen-lately rule and the place distances are read out of v2/pick.js`)
      check(M.photos.join() === truth.photos.join(), `${L}: the photographs, first to third, are pick.js's`, `${M.photos.join(' ')} vs ${truth.photos.join(' ')}`)
      check(M.poems.join() === truth.poems.join(), `${L}: the poems, first to third, are pick.js's`, `${M.poems.join(' ')} vs ${truth.poems.join(' ')}`)
      check(s.stone.photo === truth.photos[0] && s.stone.slug === truth.poems[0] && M.agrees, `${L}: the stone shows the winners`, JSON.stringify(s.stone))
      check(Object.keys(truth.day).every(a => Math.abs(truth.day[a] - M.day[a]) < 1e-9), `${L}: today's seven are pick.js's`, JSON.stringify(M.day))
      const photo = DATA.photos.find(p => p.src === truth.photos[0]), poem = DATA.poems.find(p => p.slug === truth.poems[0])
      const t = s.text, has = (x, n = 999) => t.toLowerCase().includes(x.slice(0, n).toLowerCase())
      if (way !== 'c') check(has(photo.alt, 24), `${L}: it names today's photograph`, photo.alt)
      check(t.includes(poem.title) || way === 'c', `${L}: it names today's poem`, poem.title)
      if (way === 'a') check(t.includes(Math.round(READING.temperature_2m) + '°C') && t.includes(READING.place), `${L}: the words carry the reading's temperature and place`, t.slice(0, 120))
      if (way === 'b') { check(s.day.length === 7 && s.day.every(r => Math.abs(r.v - truth.day[r.a]) < 5e-4), `${L}: the seven "now" marks sit at pick.js's values`, JSON.stringify(s.day))
        check(t.includes(Math.round(READING.wind_speed_10m) + ' km/h'), `${L}: the wind gauge carries the reading's wind`) }
      if (way === 'd') check(s.race[0][0] === truth.photos[0] && s.race[0][1] === truth.photos[1] && s.race[1][0] === truth.poems[0] && s.race[1][1] === truth.poems[1], `${L}: the race runs in pick.js's order`, JSON.stringify(s.race.map(r => r.slice(0, 2))))
      if (way === 'c') {
        check(t.includes(Math.round(READING.temperature_2m) + '°C') && t.includes(Math.round(READING.wind_speed_10m) + ' km/h'), `${L}: the line unfolds the reading's temperature and wind`, t.slice(0, 120))
        const n = await cdp.eval(`document.querySelectorAll('.c-piece').length`)
        await tapEl(`.c-piece:nth-of-type(${n})`); await sleep(200)
        const s2 = await panel()
        check(s2.text.includes(poem.title) && s2.text.toLowerCase().includes(photo.alt.slice(0, 24).toLowerCase()), `${L}: the last piece opens the two it chose`, s2.text.slice(-200))
        await tapEl('.c-piece:nth-of-type(3)'); await sleep(200)
        check(await cdp.eval(`[...document.querySelectorAll('.c-note .g-row')].map(r => r.dataset.axis).join()`) === 'warmth,inside', `${L}: the temperature opens warmth and in-or-out`)
      }
      const inside = INSIDE.exec(t); check(!inside, `${L}: plain words only`, inside && inside[0])
      const [x0, y0, x1, y1] = s.box
      check(x0 >= 0 && y0 >= 0 && x1 <= vp.w + .5 && y1 <= vp.h + .5, `${L}: the why is on screen`, JSON.stringify(s.box))
      check(y1 <= s.where[1] + 1 || x0 >= s.where[2] || x1 <= s.where[0], `${L}: it leaves the line clear`, JSON.stringify({ box: s.box, where: s.where }))
      await shot(`29-${way}-${tag}.png`)
      if (way === 'c' || way === 'd') { await cdp.eval(`document.getElementById('why').scrollTop = 1e5`); await sleep(150); await shot(`29-${way}-${tag}-end.png`); await cdp.eval(`document.getElementById('why').scrollTop = 0`) }
      // close on the stone: back where you were
      const before = s.stone.key
      const pt = vp.w > vp.h ? [vp.w - 30, vp.h * .5] : [vp.w * .5, 30]
      await tap(...pt); await sleep(700)
      const after = await cdp.eval(`({ open: S29P.open, cls: document.body.classList.contains('why'), at: S24.at, key: S24.world.key, busy: S24.busy })`)
      check(!after.open && !after.cls && after.at === 'stone' && after.key === before && !after.busy, `${L}: closing returns to the same stone`, JSON.stringify(after))
      await openWhy(); await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(500)
      check(!(await cdp.eval('S29P.open')) && (await cdp.eval('S24.at')) === 'stone', `${L}: Escape closes it too`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // inside a world: the why is still today's, and closing keeps you in the world you were in
  await view(VIEWPORTS[0]); errors.length = 0
  await open('w=a'); await tap(500, 300)
  await waitFor(() => cdp.eval(`S24.at === 'world' && !S24.busy && S24.world.arrived`), 'a world', 200)
  const inWorld = await cdp.eval('S24.world.key'); await openWhy(); const sw = await panel()
  check(sw.model.photos[0] !== undefined && sw.text.toLowerCase().includes(DATA.photos.find(p => p.src === sw.model.photos[0]).alt.toLowerCase()), 'in a world: the why is today\'s pair')
  await shot('29-a-in-a-world-1440x900.png')
  await tap(1400, 450); await sleep(700)
  const back = await cdp.eval(`({ at: S24.at, key: S24.world.key, open: S29P.open, url: location.search })`)
  check(back.at === 'world' && back.key === inWorld && !back.open && /[?&]at=/.test(back.url) && /[?&]w=a/.test(back.url), 'in a world: closing keeps the world and the way', JSON.stringify(back))
  check(errors.length === 0, 'in a world: no console errors', errors.join(' | '))

  // fallbacks, honestly: no sky at all, then a kept day
  for (const vp of [VIEWPORTS[0], VIEWPORTS[1]]) { await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      errors.length = 0; SKY = 'none'; KEEP_TODAY = false
      await open('w=' + way)
      const how = await cdp.eval('S29P.how'), line = await cdp.eval(`document.getElementById('where').textContent`)
      check(how === 'hash' && /can.t see the sky/i.test(line), `no sky w=${way} ${tag}: the line says it cannot see the sky`, `${how} "${line}"`)
      await openWhy(); const s = await panel()
      check(/no weather reached the page/i.test(s.text) && /from the date alone/i.test(s.text), `no sky w=${way} ${tag}: it says the pair comes from the date`, s.text.slice(0, 160))
      check(!/\d+°C/.test(s.text), `no sky w=${way} ${tag}: it invents no reading`, s.text.slice(0, 160))
      if (way === 'a') await shot(`29-nosky-${tag}.png`)
      errors.length = 0; SKY = 'none'; KEEP_TODAY = true
      await open('w=' + way)
      const how2 = await cdp.eval('S29P.how'); await openWhy(); const k = await panel()
      check(how2 === 'frozen' && /no live sky right now/i.test(k.text) && /kept for/i.test(k.text), `kept day w=${way} ${tag}: it says this is the pair kept for today`, `${how2}: ${k.text.slice(0, 160)}`)
      const kd = DAYS.days[Object.keys(DAYS.days).sort().pop()]
      check(k.stone.photo === kd.photo && k.stone.slug === kd.poem, `kept day w=${way} ${tag}: the stone shows the kept pair`)
      if (way === 'b') await shot(`29-kept-b-${tag}.png`)
      check(errors.length === 0, `fallbacks w=${way} ${tag}: no console errors`, errors.join(' | '))
    } }
  console.log('shots: studies/29/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 29 the why')
process.exit(failures ? 1 : 0)
