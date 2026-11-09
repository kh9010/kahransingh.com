#!/usr/bin/env node
// Study 38 check: in every way (?d=a b c d) the way from a world to the About is there at rest, and it goes and comes back right.
//   the data: every photograph's date in crossings.json is recounted from its own EXIF, its About row by the one rule (2026 is "now"),
//     its place from v2/data.json, its poem from v2/days.json or a poem's own og:image; every poem it reaches is a page on the site;
//   the page: no dial shadows a page variable; no instruction text, in the file or rendered (the poem itself aside: it is his work);
//   in the browser, at 1440x900, 390x844 and 844x390, for each way and three worlds (a year with a place on the About; a poem with a
//     film; a quiet year): the world rests whole; the way in carries the photograph's own EXIF date, is inside the screen, fully
//     opaque, clear of the poem, the name and the caption, and a finger reaches it (the middle and the four corners of a hit-px square);
//     it is measured against a door line (the poem's own type: size and contrast on the rendered pixels) and against 32 a's year;
//     tapping it flies the photograph into its year's row, on screen; tapping the lifted photograph brings back the same world;
//     the site nav's "about" does the same, and the browser's back brings it home; in d, the first visit crosses once by itself and
//     comes back, and the second does not; no console error.
// Pages are served from an in-process Node server (python's http.server resets connections under this load).
// Screenshots: studies/38/shots/ (gitignored). Run: node studies/38/check.mjs   (WAYS=a,b ONLY_VP=desk to narrow)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { taken } from './exif.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const WAYS = (process.env.WAYS || 'a,b,c,d').split(',')
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false }, { id: 'phone', w: 390, h: 844, mobile: true }, { id: 'side', w: 844, h: 390, mobile: true }]
  .filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const DEF = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'))
const HIT = parseFloat(DEF['hit-px'])
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* ---------- the data, recounted from the site itself ---------- */
const X = JSON.parse(readFileSync(path.join(HERE, 'crossings.json'), 'utf8'))
const data = J('v2/data.json'), days = J('v2/days.json').days, Y = J('studies/27/years.json')
const onSite = s => existsSync(path.join(ROOT, 'poems', s + '.html'))
const truth = {}
for (const p of data.photos) {
  const date = taken(path.join(ROOT, p.src)), y = date ? +date.slice(0, 4) : null, row = y >= 2026 ? 'now' : String(y)
  const pairs = Object.entries(days).filter(([, e]) => e.photo === p.src).sort((a, b) => b[0].localeCompare(a[0]))
  const ogPoems = data.poems.filter(q => onSite(q.slug) && new RegExp(`<meta property="og:image" content="https://kahransingh\\.com${p.src.replace(/[.]/g, '\\.')}"`).test(readFileSync(path.join(ROOT, 'poems', q.slug + '.html'), 'utf8'))).map(q => q.slug)
  const dayPoem = pairs.map(([, e]) => e.poem).find(onSite)
  truth[p.src] = { date, y, row, place: p.caption.split(' — ')[0], camera: p.caption.split(' — ')[1] || '', poems: new Set([...pairs.map(([, e]) => e.poem).filter(onSite), ...ogPoems]), poem: dayPoem || ogPoems[0] || null }
}
const dateOf = t => MON[+t.date.slice(5, 7) - 1] + ' ' + t.date.slice(0, 4)
const yearOf = t => t.row === 'now' ? String(t.y) : t.row
{
  const bad = []
  check(X.photos.length === data.photos.length && X.photos.every(p => truth[p.src]), `every one of ${data.photos.length} home photographs has a record`)
  for (const p of X.photos) { const t = truth[p.src]
    if (!t.date || p.taken !== t.date || p.y !== t.y || p.row !== t.row) bad.push(`${p.src} ${p.taken}/${p.row} vs EXIF ${t.date}/${t.row}`)
    if (/Q2/.test(t.camera) && t.y < 2019) bad.push(`${p.src} taken ${t.y} on a camera released in 2019`)
    if (!Y.rows.includes(p.row)) bad.push(`${p.src} row ${p.row} is not a row of 27 a`)
    if (p.place !== t.place) bad.push(`${p.src} place ${p.place} vs ${t.place}`)
    if ((p.poem || null) !== t.poem) bad.push(`${p.src} poem ${p.poem} vs ${t.poem}`)
    if (p.poem && !t.poems.has(p.poem)) bad.push(`${p.src} poem ${p.poem} has no recorded pairing`) }
  check(!bad.length, `every photograph's date is its own EXIF date (${new Set(X.photos.map(p => p.row)).size} rows), its place the home's caption, its poem (${X.photos.filter(p => p.poem).length} of ${X.photos.length}) the home's own pair or a poem whose page carries it`, bad.slice(0, 4).join(' | '))
  check(JSON.stringify(X.rows) === JSON.stringify(Y.rows), `the rows are 27 a's own (${Y.rows.length}, ${Y.rows[0]} to ${Y.rows.at(-1)})`)
  const gone = X.photos.filter(p => p.poem && !onSite(p.poem)).map(p => p.poem); check(!gone.length, 'every poem in crossings.json is /poems/<slug>.html on disk', gone.join(', '))
}
{
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8')
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)); const clash = Object.keys(DEF).filter(k => own.includes(k))
  check(!clash.length, 'no dial shadows a page variable', clash.join(', '))
  const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
  check(!INSTR().test(text), 'no instruction text in the page source', (INSTR().exec(text) || [])[0])
}
function INSTR() { return /\b(tap|click|scroll|swipe|press|choose|select|here|hint|try|explore|discover|learn more|see more|go to|open|enter|back)\b|[→←↑↓↗]/i }

/* ---------- the server and the browser ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' }
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = path.normalize(decodeURIComponent(u.pathname)); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(ROOT, p)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const HTTP = server.address().port
const WORLDS = [{ at: 'kitchen-night', why: 'a year and a place the About names' }, { at: 'staircase', p: 'when-i-dance-with-you', why: 'a poem with a film' }, { at: 'berlin-street', why: 'a quiet year' }]
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 150, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
function findShell() {
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p }
  return null
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value }
}
const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const CDPP = await freePort()
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
process.on('exit', () => { try { chrome.kill() } catch {} try { server.close() } catch {} })
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], seenPoems = new Set(), t0 = Date.now(), table = []
const H = `(() => { const f = document.getElementById('about'), fd = f.contentDocument;
  const rect = (el, inFrame) => { const r = el.getBoundingClientRect(), o = inFrame ? f.getBoundingClientRect() : { left: 0, top: 0 }; return { x: r.left + o.left, y: r.top + o.top, w: r.width, h: r.height } };
  const textRect = el => { const g = document.createRange(); g.selectNodeContents(el); const r = g.getClientRects()[0] || g.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } };
  const ov = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  const opac = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= +s.opacity } return o };
  return { f, fd, rect, textRect, ov, opac, onScreen: r => r.w > 4 && r.h > 4 && r.x >= -1 && r.y >= -1 && r.x + r.w <= innerWidth + 1 && r.y + r.h <= innerHeight + 1 } })()`

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url)
  }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64')) }
  const go = async url => { await cdp.eval(`window.__old = 1`).catch(() => {}); await cdp.send('Page.navigate', { url }); await waitFor(() => cdp.eval(`!window.__old`), 'navigation ' + url); await waitFor(() => cdp.eval(`document.readyState === 'complete' && location.href === ${JSON.stringify(url)}`), 'load ' + url) }
  const tapAt = async (x, y) => { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }) }
  const still = at => waitFor(() => cdp.eval(`document.body.dataset.at === ${JSON.stringify(at)} && document.body.dataset.still === '1'`), 'rest at ' + at, 200)
  async function tap(expr, label, inFrame = false) {
    const r = await cdp.eval(`(() => { const h = ${H}; const el = ${expr}; if (!el) return null; if (${inFrame}) { const q = el.getBoundingClientRect(); const fh = h.f.contentWindow.innerHeight; if (q.top < 0 || q.bottom > fh) h.f.contentWindow.scrollBy(0, q.top + q.height / 2 - fh / 2) } const r = h.rect(el, ${inFrame}); return { ...r, cx: r.x + r.w / 2, cy: r.y + r.h / 2 } })()`)
    if (!r) throw new Error('nothing to tap: ' + label)
    const hit = await cdp.eval(`(() => { const h = ${H}; const el = ${expr}; const top = document.elementFromPoint(${r.cx}, ${r.cy}); if (${inFrame}) { if (top !== h.f) return 'covered by ' + (top && (top.id || top.className || top.tagName)); const fr = h.f.getBoundingClientRect(); const t2 = h.fd.elementFromPoint(${r.cx} - fr.left, ${r.cy} - fr.top); return t2 && (el === t2 || el.contains(t2)) ? 'ok' : 'frame hit ' + (t2 && (t2.className || t2.tagName)) } return top && (el === top || el.contains(top)) ? 'ok' : 'covered by ' + (top && (top.id || top.className || top.tagName)) })()`)
    check(hit === 'ok', `${label}: a finger reaches it`, hit)
    await tapAt(r.cx, r.cy)
  }
  // the rendered pixels behind a box, with the thing itself hidden: mean and 90th-percentile relative luminance
  async function behind(sel, rect) {
    await cdp.eval(`(() => { for (const e of document.querySelectorAll(${JSON.stringify(sel)})) e.style.visibility = 'hidden' })()`); await sleep(60)
    const c = { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: Math.max(2, rect.w), height: Math.max(2, rect.h), scale: 1 }
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: c, captureBeyondViewport: false })
    await cdp.eval(`(() => { for (const e of document.querySelectorAll(${JSON.stringify(sel)})) e.style.visibility = '' })()`)
    return cdp.eval(`(async () => { const im = new Image(); im.src = 'data:image/png;base64,${r.data}'; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data, f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, L = [];
      for (let i = 0; i < d.length; i += 4) L.push(.2126 * f(d[i]) + .7152 * f(d[i + 1]) + .0722 * f(d[i + 2])); L.sort((a, b) => a - b);
      return { mean: L.reduce((a, b) => a + b, 0) / L.length, p90: L[Math.floor(L.length * .9)] } })()`)
  }
  const inkL = async sel => cdp.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const m = getComputedStyle(e).color.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]) })()`)
  const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
  async function measure(sel, hideSel) { // size and contrast of a thing, on the photograph as rendered
    const m = await cdp.eval(`(() => { const h = ${H}; const e = document.querySelector(${JSON.stringify(sel)}); const r = h.textRect(e); return { r, px: parseFloat(getComputedStyle(e).fontSize), w: r.w, h: r.h } })()`)
    const bg = await behind(hideSel || sel, m.r), ink = await inkL(sel)
    return { px: m.px, mean: ratio(ink, bg.mean), worst: ratio(ink, bg.p90), r: m.r }
  }
  async function atRest(tag, want) { // the world as it rests
    await still('world')
    await waitFor(() => cdp.eval(`[...document.querySelectorAll('#world .fade')].filter(e => !e.closest('[hidden]')).every(e => e.classList.contains('shown'))`), 'the poem arrived', 150)
    await sleep(550)
    const s = await cdp.eval(`(() => { const h = ${H}; const ph = document.getElementById('ph'), p = document.getElementById('poem'), r = h.rect(ph);
      const pr = h.rect(p), hd = h.rect(document.querySelector('header')), cpE = document.getElementById('cap'), cp = cpE.textContent ? h.rect(cpE) : null;
      const way = document.documentElement.dataset.way, w = way === 'b' ? document.querySelector('#ruler .door') : way === 'c' ? document.getElementById('f-door') : document.getElementById('dl-door');
      const wr = w ? h.rect(w) : null, carrier = way === 'a' || way === 'd' ? h.rect(document.getElementById('dl')) : wr;
      return { src: ph.getAttribute('src'), hidden: ph.hidden, full: Math.abs(r.x) < 1 && Math.abs(r.y) < 1 && Math.abs(r.w - innerWidth) < 1 && Math.abs(r.h - innerHeight) < 1, poem: p.dataset.poem,
        fits: p.scrollHeight <= p.clientHeight + 1 || (parseFloat(getComputedStyle(p).fontSize) <= ${parseFloat(DEF['poem-min-px'])} + .01 && getComputedStyle(p).overflowY === 'auto'),
        poemIn: h.onScreen(pr), hdIn: h.onScreen(hd), capIn: !cp || h.onScreen(cp), clear: !h.ov(pr, hd) && (!cp || (!h.ov(pr, cp) && !h.ov(hd, cp))), sideways: document.scrollingElement.scrollWidth > innerWidth + 1,
        way: w && { text: w.textContent, basis: w.dataset.basis, on: h.onScreen(wr), opac: h.opac(w), clearOf: [['poem', pr], ['name', hd], ['caption', cp]].filter(([, b]) => b && h.ov(carrier, b)).map(([n]) => n), rect: wr },
        chrome: [...document.querySelectorAll('#world > :not(#poem):not(canvas):not(.scrim), .vs')].filter(e => !e.closest('[hidden]')).map(e => e.innerText).join(' ') } })()`)
    seenPoems.add(s.poem)
    const t = truth[s.src], v = s.way
    check(s.src === want.src && !s.hidden && s.full, `${tag}: the photograph is whole, full screen`, `${s.src} full=${s.full}`)
    check(s.poem === want.poem && onSite(s.poem), `${tag}: the poem is ${want.poem}, a page on the site`, s.poem)
    check(s.poemIn && s.capIn && s.hdIn && s.clear && !s.sideways, `${tag}: poem, name and caption inside the screen and clear of each other, no sideways scroll`, JSON.stringify({ poemIn: s.poemIn, capIn: s.capIn, hdIn: s.hdIn, clear: s.clear, sideways: s.sideways }))
    check(s.fits, `${tag}: the whole poem fits its place, or at its smallest size reads on inside it`)
    const wantText = s.way && (await cdp.eval(`document.documentElement.dataset.way`)) === 'b' ? yearOf(t) : dateOf(t)
    check(v && v.text === wantText && v.basis === 'exif:' + t.date, `${tag}: the way in carries the photograph's own EXIF date (${wantText})`, v && `${v.text} ${v.basis} vs ${t.date}`)
    check(v && v.on && v.opac > .99 && !v.clearOf.length, `${tag}: the way in is visible at rest: inside the screen, fully opaque, clear of the poem, the name and the caption`, v && JSON.stringify({ on: v.on, opac: v.opac, over: v.clearOf }))
    const m = INSTR().exec(s.chrome); check(!m, `${tag}: no instruction text on screen`, m && `"${m[0]}" in ${s.chrome.slice(0, 80)}`)
    return s
  }
  async function reach(tag) { // a finger: the middle and the four corners of a hit-px square around it all land on the way in
    const r = await cdp.eval(`(() => { const way = document.documentElement.dataset.way, w = way === 'b' ? document.querySelector('#ruler .door') : way === 'c' ? document.getElementById('f-door') : document.getElementById('dl-door');
      const q = w.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2, d = ${HIT / 2 - 1};
      const pts = [[cx, cy], [cx - d, cy - d], [cx + d, cy - d], [cx - d, cy + d], [cx + d, cy + d]].map(([x, y]) => [Math.min(innerWidth - 1, Math.max(0, x)), Math.min(innerHeight - 1, Math.max(0, y))]);
      const facet = way === 'c' ? +document.getElementById('fdoor').dataset.facet : null;
      const miss = pts.filter(([x, y]) => { const e = document.elementFromPoint(x, y); return !(e && (e === w || w.contains(e))) }); return { miss: miss.length, cx, cy } })()`)
    check(r.miss === 0, `${tag}: a finger reaches the way in (middle and the corners of a ${HIT}px square)`, `${r.miss} of 5 points miss`)
    return r
  }
  async function lifted(tag, t, src) {
    const s = await cdp.eval(`(() => { const h = ${H}; const l = h.fd.querySelector('[data-w38="lift"]'); if (!l) return null; const im = l.querySelector('img'); return { row: l.closest('.yr').dataset.y, src: im.getAttribute('src'), basis: l.dataset.basis, cap: l.querySelector('[data-t="figcaption"]').textContent, on: h.onScreen(h.rect(im, true)), ph: document.getElementById('ph').hidden } })()`)
    check(s && s.row === t.row && s.src === src && s.basis === 'exif:' + t.date && s.on && s.ph && s.cap === `${t.place} · ${dateOf(t)}`, `${tag}: the photograph itself is lifted in its year's row (${t.row}), on screen, captioned with its place and date`, JSON.stringify(s))
  }
  const meas = {}
  for (const vp of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 2, mobile: vp.mobile })
    for (const w of WORLDS) { // 32 a, as Kahran saw it: its year in the caption, measured the same way
      await go(`${BASE}/studies/32/index.html?v=a&at=${w.at}${w.p ? '&p=' + w.p : ''}`)
      await waitFor(() => cdp.eval(`document.body.dataset.at === 'world' && document.body.dataset.still === '1' && [...document.querySelectorAll('#poem .l')].every(e => e.classList.contains('shown'))`), '32 at rest', 200); await sleep(600)
      ;(meas[vp.id + ' 32a'] ||= []).push({ ...(await measure('#year')), door: await measure('#poem .l'), at: w.at })
    }
    for (const v of WAYS) for (const [wi, w] of WORLDS.entries()) {
      const tag = `${vp.id} ${v} ${w.at}`, src = `/photos/${w.at}.jpg`, t = truth[src], poem = w.p || X.photos.find(p => p.src === src).poem
      const url = `${BASE}/studies/38/index.html?d=${v}&at=${w.at}${w.p ? '&p=' + w.p : ''}`
      if (v === 'd') { // a returning visitor: the first crossing has happened; the first visit is checked below
        await go(url); await cdp.eval(`localStorage.setItem('s38-once', '1')`); await go(url) } else await go(url)
      await atRest(tag, { src, poem })
      {
        const door = await measure('#poem .l'), way = v === 'b' ? '#ruler .door' : v === 'c' ? '#f-door' : '#dl-door'
        const m = await measure(way, v === 'b' ? '#ruler' : v === 'c' ? '#fdoor' : '#dl'); (meas[`${vp.id} ${v}`] ||= []).push({ ...m, door, at: w.at })
        check(m.px >= door.px - .01, `${tag}: the way in is set no smaller than a door line (${m.px.toFixed(1)}px vs ${door.px.toFixed(1)}px)`)
        check(m.mean >= 4.5, `${tag}: the way in reads on the photograph as rendered (contrast ${m.mean.toFixed(1)}:1 on the mean, door line ${door.mean.toFixed(1)}:1)`)
      }
      await reach(tag)
      await shot(`${vp.id}-${v}-${wi}-world`)
      const wayExpr = v === 'b' ? `document.querySelector('#ruler .door')` : v === 'c' ? `document.getElementById('f-door')` : `document.getElementById('dl-door')`
      await tap(wayExpr, `${tag} the way in`)
      await still('about'); await sleep(150)
      await shot(`${vp.id}-${v}-${wi}-about`)
      await lifted(tag, t, src)
      await tap(`document.getElementById('about').contentDocument.querySelector('[data-w38="lift"] img')`, `${tag} the lifted photograph`, true)
      await atRest(tag + ' back', { src, poem })
      if (wi === 0 && v === 'a') { // the site nav's about makes the same crossing; the browser's back brings the photograph home
        await tap(`document.getElementById('to-about')`, `${tag} the nav's about`)
        await still('about'); await lifted(tag + ' nav', t, src)
        await cdp.eval(`history.back()`)
        await atRest(tag + ' browser back', { src, poem })
      }
      if (wi === 0 && v === 'c') { // the whole facet is the door, not only its words
        const p = await cdp.eval(`(() => { const f = +document.getElementById('fdoor').dataset.facet, cv = document.getElementById('stone'), d = document.getElementById('f-door').getBoundingClientRect();
          for (let y = 4; y < innerHeight; y += 6) for (let x = 4; x < innerWidth; x += 6) { const e = document.elementFromPoint(x, y); if (e !== cv) continue; if (y > d.top - 30 && y < d.bottom + 30 && x > d.left - 30 && x < d.right + 30) continue; if (window.S38.inFacet(x, y)) return [x, y] } return null })()`)
        if (p) { await tapAt(p[0], p[1]); await still('about'); await lifted(tag + ' facet', t, src); await cdp.eval(`history.back()`); await atRest(tag + ' facet back', { src, poem }) }
        check(!!p, `${tag}: the date's facet takes a tap anywhere in it, away from the words`)
      }
      await shot(`${vp.id}-${v}-${wi}-back`)
    }
    if (WAYS.includes('d')) { // d, a first visit: the crossing happens once by itself, comes back, and never again
      const w = WORLDS[1], src = `/photos/${w.at}.jpg`, t = truth[src], poem = w.p, url = `${BASE}/studies/38/index.html?d=d&at=${w.at}&p=${w.p}` // the shortest poem: its reading time is the wait
      await go(url); await cdp.eval(`localStorage.removeItem('s38-once')`); await go(url)
      await atRest(`${vp.id} d first`, { src, poem })
      const wpm = +DEF['read-wpm'], words = await cdp.eval(`(document.getElementById('poem').innerText.match(/\\S+/g) || []).length`), restMs = +(await cdp.eval(`document.body.dataset.onceRest`))
      check(Math.abs(restMs - Math.max(+DEF['once-rest-ms'], words / wpm * 60000)) < 2, `${vp.id} d: the first crossing waits the poem's own reading time (${words} words at ${wpm} a minute, ${(restMs / 1000).toFixed(1)}s)`, String(restMs))
      await waitFor(() => cdp.eval(`document.body.dataset.once === 'out' && document.body.dataset.at === 'about' && document.body.dataset.still === '1'`), 'the first crossing', 400)
      await shot(`${vp.id}-d-once-about`); await lifted(`${vp.id} d first, by itself`, t, src)
      await waitFor(() => cdp.eval(`document.body.dataset.once === 'done'`), 'the first crossing home', 120)
      await atRest(`${vp.id} d first, home by itself`, { src, poem })
      await go(url); await atRest(`${vp.id} d second visit`, { src, poem })
      await sleep(+DEF['once-rest-ms'] + 800)
      const s = await cdp.eval(`({ once: document.body.dataset.once, at: document.body.dataset.at })`)
      check(s.once === 'skipped' && s.at === 'world', `${vp.id} d: the second visit does not cross by itself`, JSON.stringify(s))
    }
  }
  const gone = [...seenPoems].filter(s => !onSite(s))
  check(seenPoems.size >= 3 && !gone.length, `every one of ${seenPoems.size} poems the page showed is /poems/<slug>.html on disk`, gone.join(', '))
  check(!errors.length, 'no console error', errors.slice(0, 3).join(' | '))
  console.log(`\nthe way in, measured as rendered in the ${WORLDS.length} worlds (size; the lowest contrast on the mean and on the 90th-percentile pixel behind it, and where), against a door line (a poem line, the type doors are set in):`)
  for (const [k, ms] of Object.entries(meas)) { const lo = ms.reduce((a, b) => b.mean < a.mean ? b : a), lw = ms.reduce((a, b) => b.worst < a.worst ? b : a), dl = ms.reduce((a, b) => b.door.mean < a.door.mean ? b : a)
    console.log(`  ${k.padEnd(10)} ${lo.px.toFixed(1).padStart(5)}px  ${lo.mean.toFixed(1).padStart(5)}:1 mean  ${lw.worst.toFixed(1).padStart(5)}:1 p90 (${lw.at})  ${String(Math.round(lo.r.w)).padStart(4)}x${Math.round(lo.r.h)}  ·  door line ${lo.door.px.toFixed(1)}px ${dl.door.mean.toFixed(1)}:1`) }
} catch (e) { failures++; console.log('FAIL ' + (e.stack || e)); if (errors.length) console.log('     page errors: ' + errors.slice(0, 3).join(' | ')) }

const secs = ((Date.now() - t0) / 1000).toFixed(0)
if (failures) { console.log(`\nFAIL study 38: ${failures} of ${failures + oks} checks failed`); process.exit(1) }
console.log(`\nPASS study 38: ${oks} checks — every date recounted from EXIF; ${WAYS.length} ways × ${VIEWPORTS.length} screens × ${WORLDS.length} worlds: the way in visible at rest and in reach, out to its year and back${WAYS.includes('d') ? "; d's first crossing once, by itself, after the poem's reading time" : ''} (${secs}s)`)
process.exit(0)
