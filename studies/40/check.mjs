#!/usr/bin/env node
// Study 40 check: the six ideas and every tool under them live in one facet of the stone, the one beside the where line,
// and a visitor reaches all of them, in the idea's own words, in every world and at every size.
// Its own readers, kept apart from the page: IDEAS is read out of /v2/home.js here too, and the geometry is recounted in node.
//   static: six ideas; the page copies none of their words (it reads IDEAS live); the page's own words are the name, the way out and the switch;
//           every dial in defaults.json is read by the page
//   in Chrome, at 1440x900 (mouse), 390x844 and 844x390 (touch), on today's stone and in three worlds behind its doors:
//     one facet holds the six names; the names sit on it (centre in its cut, most of them inside) and clear of the poem, the name, the caption, the switch;
//     the basis is recounted: of the facets the page says could hold them, this one's names are nearest the where line, at the distance it recorded;
//     every name is the topmost thing where it sits and opens its idea; every tool is a button there that opens its sentence;
//     everything that shows is IDEAS verbatim (name, parts, intro, each tool's sentence, boundary; the idea's page as its link) and nothing else;
//     the open idea keeps clear of the poem, the name and the switch, inside the screen; a touch elsewhere closes it and goes nowhere;
//     the system's working name never shows; no console errors.
// Run: node studies/40/check.mjs   (ONLY_VP=desk to narrow; non-zero exit on any failure). Screenshots: studies/40/shots/ (gitignored).
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
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false }, { id: 'phone', w: 390, h: 844, mobile: true }, { id: 'side', w: 844, h: 390, mobile: true }]
  .filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
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
const WORDS = new Set(IDEAS.flatMap(I => [I.name, I.line, ...I.parts, I.detail.intro, ...I.detail.tools, I.detail.boundary]))
const BY = 110 // px: beside the line, never across the screen from it (the most any world has needed is a short screen's slim facets, 98px)
const BANNED = /day[\s-]?flow/i // the system's working name (tools/test_wall.mjs, Kahran 2026-10-27)

/* ---------- static ---------- */
const page = read('studies/40/index.html'), defaults = JSON.parse(read('studies/40/defaults.json'))
check(IDEAS.length === 6 && IDEAS.every(I => I.parts.length === I.detail.tools.length), 'six ideas, every tool with its sentence', IDEAS.map(I => I.name + ' ' + I.parts.length).join(', '))
{ const copied = [...WORDS].filter(t => t.length > 24 && (page.includes(t) || JSON.stringify(defaults).includes(t)))
  check(!copied.length, 'the page reads IDEAS live and copies none of its words', copied.slice(0, 2).join(' | ')) }
{ const body = /<body>([\s\S]*?)<script/.exec(page)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems where', 'no instruction text: the page\'s own words are the name, the way out and the switch', body) }
{ const unread = Object.keys(defaults).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(page) && !page.includes(`var(--${k}`))
  const css = [...page.matchAll(/var\(--(tools-[a-z-]+),\s*([^)]+)\)/g)].filter(m => Number(m[2]) !== Number(defaults[m[1]]))
  check(!unread.length && !css.length, `every dial is read (${Object.keys(defaults).length}), CSS fallbacks equal defaults.json`, unread.concat(css.map(m => m[1])).join(', ')) }

/* ---------- geometry, recounted here ---------- */
const inPoly = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
const meet = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]
const gap = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3])))
const share = (box, P) => { let n = 0, t = 0; for (let a = 0; a <= 4; a++) for (let b = 0; b <= 2; b++) { t++; if (inPoly([box[0] + box[2] * a / 4, box[1] + box[3] * b / 2], P)) n++ } return n / t }
const centre = r => [r[0] + r[2] / 2, r[1] + r[3] / 2]
const r1 = a => a.map(v => Math.round(v))

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
const HTTP = await freePort(), CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 's40-'))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, taps = 0

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' ')) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  // pinned, as 37 pins them: the clock (8:40 pm New York, 8 Nov 2026) and the sky, so a run tomorrow places what a run today placed
  const PIN = Date.UTC(2026, 10, 9, 1, 40)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {} })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-08T06:35'], sunset: ['2026-11-08T16:44'] } }
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }

  let VP
  const view = async vp => { VP = vp; await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => { loads++; await cdp.send('Page.navigate', { url: `${BASE}/studies/40/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!window.S40P && !!S37P.world && ['stone', 'world'].includes(S37P.at) && (S37P.at === 'stone' || S37P.world.arrived)`), 'page ' + q, 300); await sleep(700) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const tap = async ([x, y]) => { taps++
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(30); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) }
    await sleep(120) }
  // a control's centre, if it is the topmost thing there (what a finger or a pointer would actually reach)
  const reach = sel => cdp.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
    const top = document.elementFromPoint(x, y); return top && (top === e || e.contains(top)) && r.width > 0 && x > 0 && y > 0 && x < innerWidth && y < innerHeight ? [x, y] : null })()`)
  const shown = () => cdp.eval(`(() => { const out = []; const walk = n => { if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(); const p = n.parentElement; if (t && p.getClientRects().length && !p.closest('[hidden]') && getComputedStyle(p).visibility !== 'hidden') out.push(t) } else n.childNodes.forEach(walk) }
    walk(document.querySelector('#tools')); return out })()`)

  for (const vp of VIEWPORTS) {
    await view(vp)
    await open('t=where')
    const home = await cdp.eval('S37P.doors.map(d => d.to)')
    const worlds = [null, ...home.slice(0, 3)]
    check(worlds.length >= 3, `${vp.id}: today's stone and at least two worlds behind its doors`, worlds.length)
    for (const wk of worlds) {
      const label = `${vp.id} ${wk ? 'world ' + wk : 'home'}`
      if (wk) await open('t=where&w=' + encodeURIComponent(wk))
      const s = await cdp.eval('S40P.state'), P = s.cells[s.tools] || []
      /* the one facet, and the names on it */
      check(s.tools >= 0 && s.namesOn && s.kinds.filter(k => k === 'tools').length === 1, `${label}: one facet holds the six names`, `facet ${s.tools}, on ${s.namesOn}`)
      if (s.tools < 0) continue
      const box = s.plan.box, nm = s.names
      check(Math.abs(nm[0] - box[0]) < 1.5 && Math.abs(nm[1] - box[1]) < 1.5 && nm[2] <= box[2] + 1.5 && nm[3] <= box[3] + 1.5, `${label}: the names are where the plan put them`, `${r1(nm)} vs ${r1(box)}`)
      const need = Math.max(Number(defaults['tools-inside-floor']), Math.min(Number(defaults['tools-inside']), s.plan.basis.inside ?? 1))
      check(inPoly(centre(nm), P) && share(nm, P) >= need - .01 && need >= .25, `${label}: the names sit on their facet (centre in the cut, ${Math.round(share(nm, P) * 100)}% inside${need < Number(defaults['tools-inside']) ? ', leaning over a seam to stay by the line' : ''})`, `${Math.round(share(nm, P) * 100)}% < ${need}`)
      const hit = [['poem', s.poem], ['name', s.mat], ['caption', s.cap], ['switch', s.vs]].filter(([, r]) => r[2] > 0 && meet(nm, r)).map(([k]) => k)
      check(!hit.length && nm[0] >= 0 && nm[1] >= 0 && nm[0] + nm[2] <= s.W && nm[1] + nm[3] <= s.H, `${label}: the names keep clear of the poem, the name, the caption and the switch`, hit.join(', '))
      /* the basis, recounted */
      const fits = s.fits.filter(f => f.box), lies = fits.filter(f => meet(f.box, s.poem) || meet(f.box, s.mat) || !inPoly(centre(f.box), s.cells[f.i]))
      const d = fits.map(f => ({ i: f.i, d: gap(f.box, s.where) })).sort((a, b) => a.d - b.d), mine = gap(box, s.where)
      check(!lies.length && d.length && fits.some(f => f.i === s.tools) && mine <= d[0].d + .5 && Math.abs(mine - s.plan.basis.d) < .6,
        `${label}: basis recounted: of ${fits.length} facets that could hold them, facet ${s.tools} is nearest the where line (${mine.toFixed(1)}px${d.find(x => x.i !== s.tools) ? ', next ' + d.find(x => x.i !== s.tools).d.toFixed(1) + 'px' : ''})`,
        `nearest ${d[0]?.i} at ${d[0]?.d.toFixed(1)}, recorded ${s.plan.basis.d}, false fits ${lies.map(f => f.i)}`)
      check(mine <= BY, `${label}: the names read as the where line's own: within ${BY}px of it`, `${mine.toFixed(1)}px`)
      if (!wk || vp.id === 'desk') await shot(`40-${vp.id}-${wk ? 'world' : 'home'}.png`)
      /* every idea and every tool, reached */
      let missed = [], wrong = [], extra = new Set(), clash = []
      for (const [k, I] of IDEAS.entries()) {
        const pt = await reach(`#names button[data-k="${k}"]`); if (!pt) { missed.push(I.name); continue }
        await tap(pt)
        const st = await waitFor(() => cdp.eval(`S40P.open === ${k} && document.querySelector('#tools').classList.contains('on') && (() => { const r = document.querySelector('#tools').getBoundingClientRect(); return { box: [r.left, r.top, r.width, r.height], h2: document.querySelector('#tools h2').textContent, href: document.querySelector('#tools h2 a')?.getAttribute('href') ?? null } })()`), 'idea ' + I.name, 30, 50).catch(() => null)
        if (!st) { missed.push(I.name); continue }
        await sleep(350)
        if (st.h2 !== I.name || st.href !== (I.href || null)) wrong.push(`${I.name}: heading ${st.h2} ${st.href}`)
        const tb = st.box; for (const [n, r] of [['poem', s.poem], ['name', s.mat], ['switch', s.vs]]) if (meet(tb, r)) clash.push(`${I.name} over the ${n}`)
        if (tb[0] < 0 || tb[1] < 0 || tb[0] + tb[2] > s.W + .5 || tb[1] + tb[3] > s.H + .5) clash.push(`${I.name} off the screen`)
        for (const [j, part] of I.parts.entries()) {
          const bp = await reach(`#tools li:nth-child(${j + 1}) button`); if (!bp) { missed.push(`${I.name} / ${part}`); continue }
          const name = await cdp.eval(`document.querySelector('#tools li:nth-child(${j + 1}) button').textContent`); if (name !== part) wrong.push(`${part} named ${name}`)
          await tap(bp)
          const said = await cdp.eval(`(() => { const p = document.querySelector('#tools li:nth-child(${j + 1}) p'); return !p.hidden && p.getClientRects().length ? p.textContent : null })()`)
          if (said !== I.detail.tools[j]) wrong.push(`${I.name} / ${part}: ${said === null ? 'did not open' : 'says ' + said.slice(0, 40)}`)
          if (k === 0 && j === 0 && !wk) await shot(`40-${vp.id}-open.png`) }
        for (const t of await shown()) if (!WORDS.has(t)) extra.add(t)
        const whole = await cdp.eval(`document.querySelector('#tools').innerText`); if (!whole.includes(I.detail.intro) || !whole.includes(I.detail.boundary)) wrong.push(`${I.name}: intro or boundary missing`)
        // a touch elsewhere closes it, and goes nowhere
        const at0 = await cdp.eval('S37P.at + "|" + S37P.world.key')
        const away = [Math.round(s.W / 2), Math.round(s.H * .04)].map((v, i) => i ? Math.max(v, 4) : v)
        const free = await cdp.eval(`(() => { const r = document.querySelector('#tools').getBoundingClientRect(), pts = [[${away}], [innerWidth - 8, innerHeight / 2], [8, innerHeight / 2], [innerWidth / 2, innerHeight - 6]]
          return pts.find(([x, y]) => (x < r.left || x > r.right || y < r.top || y > r.bottom) && !document.elementFromPoint(x, y).closest('a, button, .verse')) || null })()`)
        if (free) { await tap(free); await sleep(250)
          const after = await cdp.eval('({ open: S40P.open, at: S37P.at + "|" + S37P.world.key, busy: S37P.busy })')
          if (after.open !== -1 || after.at !== at0 || after.busy) wrong.push(`${I.name}: a touch elsewhere ${after.open !== -1 ? 'left it open' : 'moved the stone to ' + after.at}`) }
        else { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150) } }
      check(!missed.length, `${label}: all 6 ideas and all ${IDEAS.reduce((n, I) => n + I.parts.length, 0)} tools reached, each the topmost thing where it sits`, missed.join(', '))
      check(!wrong.length, `${label}: each opens in its own words (name, page, intro, every tool's sentence, boundary); a touch elsewhere only closes it`, wrong.slice(0, 3).join(' | '))
      check(!extra.size, `${label}: nothing shows that is not IDEAS verbatim`, [...extra].slice(0, 3).join(' | '))
      check(!clash.length, `${label}: an open idea keeps clear of the poem, the name and the switch, on the screen`, clash.slice(0, 3).join(', '))
      const txt = await cdp.eval('document.body.innerText + " " + [...document.querySelectorAll("#names button")].map(b => b.title).join(" ")')
      check(!BANNED.test(txt), `${label}: the system's working name never shows`)
    }
  }
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e)) }

console.log(failures ? `FAIL study 40: ${failures} of ${oks + failures} checks failed` : `PASS study 40: ${oks} checks; the six ideas and all ${IDEAS.reduce((n, I) => n + I.parts.length, 0)} tools reached under one facet, nearest the where line, in ${loads} loads at ${VIEWPORTS.map(v => v.w + 'x' + v.h).join(', ')}, ${taps} taps, every word IDEAS verbatim`)
cleanup(); process.exit(failures ? 1 : 0)
