#!/usr/bin/env node
// Study 32 check: a world and 27 a's years lead into each other, and every crossing stands on something recorded.
//   the data: every crossing in crossings.json is recounted from the site itself, never from build.mjs's output:
//     each photograph's year from its own EXIF date, its About row by the one rule (2026 is "now"), that row's facts and running lanes
//     from 27's years.json, the places the About names from 27's links.json, its poem from v2/days.json or a poem's own og:image,
//     each film from poem-films.html; every fact's words and row are 27's;
//   nothing reaches a poem that is not /poems/<slug>.html on disk, in the data or on the page;
//   in the browser, at 1440x900, 390x844 and 844x390, for each way (?v=a b c d) and three worlds (a year with a place named on the
//     About; a poem with a film; a quiet year): the world rests whole (photograph full screen, poem inside the screen, clear of the
//     name and the caption, no sideways scroll); its year is the photograph's EXIF year; the escape lands where its basis says
//     (a: the photograph lifted in its year's row · b: the strip in its year's row · c: the band, its year lit, every year's worlds
//     true to their year and poem · d: its making lifted, by its strongest basis, the world inside) and on screen;
//     the way back lands in a world whose photograph and poem the basis names; no console error.
// Screenshots: studies/32/shots/ (gitignored). Run: node studies/32/check.mjs   (WAYS=a,b ONLY_VP=desk to narrow)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }

/* ---------- the data, recounted ---------- */
const X = JSON.parse(readFileSync(path.join(HERE, 'crossings.json'), 'utf8'))
const data = J('v2/data.json'), days = J('v2/days.json').days, Y = J('studies/27/years.json'), L = J('studies/27/links.json')
const onSite = s => existsSync(path.join(ROOT, 'poems', s + '.html'))
const fact = Object.fromEntries(L.facts.map(f => [f.id, f])), yrow = Object.fromEntries(Y.facts.map(f => [f.id, f]))
const slug = s => s.normalize('NFD').replace(/[̀-ͯʻ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 5).join('-')
const MAKING = /^(row|film|talk):/
const truth = {} // src → what the site itself says
for (const p of data.photos) {
  const date = taken(path.join(ROOT, p.src)), y = date ? +date.slice(0, 4) : null, row = y >= 2026 ? 'now' : String(y), place = p.caption.split(' — ')[0]
  const pairs = Object.entries(days).filter(([, e]) => e.photo === p.src).sort((a, b) => b[0].localeCompare(a[0]))
  const ogPoems = data.poems.filter(q => onSite(q.slug) && new RegExp(`<meta property="og:image" content="https://kahransingh\\.com${p.src.replace(/[.]/g, '\\.')}"`).test(readFileSync(path.join(ROOT, 'poems', q.slug + '.html'), 'utf8'))).map(q => q.slug)
  const dayPoem = pairs.map(([, e]) => e.poem).find(onSite)
  truth[p.src] = { date, y, row, place, camera: p.caption.split(' — ')[1] || '', poems: new Set([...pairs.map(([, e]) => e.poem).filter(onSite), ...ogPoems]), poem: dayPoem || ogPoems[0] || null,
    yearFacts: Y.facts.filter(f => f.row === row && f.y && MAKING.test(f.id)).map(f => f.id),
    lanes: Y.lanes.filter(l => l.from <= Math.min(y, 2026) && Math.min(y, 2026) <= l.to).map(l => l.g),
    names: (fact[`place:${slug(place)}`]?.kin || []).filter(k => k.kind === 'name' && MAKING.test(k.id)).map(k => k.id) }
}
const films = [...readFileSync(path.join(ROOT, 'poem-films.html'), 'utf8').matchAll(/<h2><a href="\/poems\/([^"]+)\.html">/g)].map(m => m[1])
{
  const bad = []
  check(X.photos.length === data.photos.length && X.photos.every(p => truth[p.src]), `every one of ${data.photos.length} home photographs has a crossing record`)
  for (const p of X.photos) { const t = truth[p.src]
    if (!t.date || p.taken !== t.date || p.y !== t.y || p.row !== t.row) bad.push(`${p.src} year ${p.taken}/${p.row} vs EXIF ${t.date}/${t.row}`)
    if (/Q2/.test(t.camera) && t.y < 2019) bad.push(`${p.src} taken ${t.y} on a camera released in 2019`)
    if (!Y.rows.includes(p.row)) bad.push(`${p.src} row ${p.row} is not a row of 27 a`)
    if (JSON.stringify(p.yearFacts) !== JSON.stringify(t.yearFacts)) bad.push(`${p.src} year facts`)
    if (JSON.stringify(p.lanes) !== JSON.stringify(t.lanes)) bad.push(`${p.src} lanes`)
    if (JSON.stringify(p.names.map(n => n.id)) !== JSON.stringify(t.names)) bad.push(`${p.src} names`)
    if ((p.poem || null) !== t.poem) bad.push(`${p.src} poem ${p.poem} vs ${t.poem}`)
    if (p.poem && !t.poems.has(p.poem)) bad.push(`${p.src} poem ${p.poem} has no recorded pairing`) }
  const nY = new Set(X.photos.map(p => p.row)).size, nP = X.photos.filter(p => p.poem).length
  check(!bad.length, `every photograph's year is its own EXIF date (${nY} rows), its row's facts and lanes are 27's, its poem (${nP} of ${X.photos.length}) the home's own pair or a poem whose page carries it`, bad.slice(0, 4).join(' | '))
  const fb = []
  for (const [s, p] of Object.entries(X.poems)) { const want = films.includes(s) ? 'film:' + s : null; if (p.film !== want) fb.push(`${s} film ${p.film} vs ${want}`) }
  check(films.length === 4 && !fb.length && films.every(f => X.poems[f]), `the ${films.length} poems with a film are poem-films.html's own`, fb.join(' | '))
  const ff = []
  for (const [id, f] of Object.entries(X.facts)) if (!fact[id] || f.t !== fact[id].text || f.row !== yrow[id]?.row) ff.push(id)
  for (const [id, row] of Object.entries(X.rowsOf)) if (yrow[id]?.row !== row) ff.push(id)
  check(!ff.length, `every fact a crossing names (${Object.keys(X.facts).length}) carries 27 a's words and row`, ff.join(', '))
  const refs = []; const walk = x => { if (Array.isArray(x)) return x.forEach(walk); if (!x || typeof x !== 'object') return; for (const [k, v] of Object.entries(x)) { if ((k === 'poem' || k === 'slug') && typeof v === 'string') refs.push(v); walk(v) } }
  walk(X); Object.keys(X.poems).forEach(s => refs.push(s))
  const gone = refs.filter(s => !onSite(s)); check(refs.length > 100 && !gone.length, `every one of ${refs.length} poem references in crossings.json is /poems/<slug>.html on disk`, gone.join(', '))
}
{ // tune writes every dial as --<name> on :root; a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)); const clash = dials.filter(k => own.includes(k))
  check(!clash.length, 'no dial shadows a page variable', clash.join(', '))
  const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
  check(!/\b(tap|click|scroll|swipe|press|choose|select)\b/i.test(text), 'no instruction text on the page')
}

/* ---------- the browser ---------- */
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
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
process.on('exit', () => { try { chrome.kill() } catch {} try { server.kill() } catch {} })
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], seenPoems = new Set(), t0 = Date.now()
// in-page helpers: where an element (in the page or in the About's frame) sits on screen, and whether it is inside the screen
const H = `(() => { const f = document.getElementById('about'), fd = f.contentDocument;
  const rect = (el, inFrame) => { const r = el.getBoundingClientRect(), o = inFrame ? f.getBoundingClientRect() : { left: 0, top: 0 }; return { x: r.left + o.left, y: r.top + o.top, w: r.width, h: r.height } };
  return { f, fd, rect, onScreen: r => r.w > 4 && r.h > 4 && r.x >= -1 && r.y >= -1 && r.x + r.w <= innerWidth + 1 && r.y + r.h <= innerHeight + 1 } })()`

try {
  await waitFor(() => fetch(`${BASE}/studies/32/index.html`).then(r => r.ok), 'static server')
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
  const tapAt = async (x, y) => { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }) }
  const still = (at) => waitFor(() => cdp.eval(`document.body.dataset.at === ${JSON.stringify(at)} && document.body.dataset.still === '1'`), 'rest at ' + at, 200)
  // tap the middle of a thing, after making sure it is the thing a finger there would reach
  async function tap(expr, label, inFrame = false) {
    const r = await cdp.eval(`(() => { const h = ${H}; const el = ${expr}; if (!el) return null; if (${inFrame}) { const q = el.getBoundingClientRect(); const fh = h.f.contentWindow.innerHeight; if (q.top < 0 || q.bottom > fh) h.f.contentWindow.scrollBy(0, q.top + q.height / 2 - fh / 2) } const r = h.rect(el, ${inFrame}); return { ...r, cx: r.x + r.w / 2, cy: r.y + r.h / 2 } })()`)
    if (!r) throw new Error('nothing to tap: ' + label)
    const hit = await cdp.eval(`(() => { const h = ${H}; const el = ${expr}; const top = document.elementFromPoint(${r.cx}, ${r.cy}); if (${inFrame}) { if (top !== h.f) return 'covered by ' + (top && (top.id || top.className || top.tagName)); const fr = h.f.getBoundingClientRect(); const t2 = h.fd.elementFromPoint(${r.cx} - fr.left, ${r.cy} - fr.top); return t2 && (el === t2 || el.contains(t2)) ? 'ok' : 'frame hit ' + (t2 && (t2.className || t2.tagName)) } return top && (el === top || el.contains(top)) ? 'ok' : 'covered by ' + (top && (top.id || top.className || top.tagName)) })()`)
    check(hit === 'ok', `${label}: a finger reaches it`, hit)
    await tapAt(r.cx, r.cy)
  }
  async function atRest(tag, want) { // the world as it rests
    await still('world')
    await waitFor(() => cdp.eval(`[...document.querySelectorAll('#poem h2, #poem .l')].every(e => e.classList.contains('shown'))`), 'the poem arrived', 120)
    const s = await cdp.eval(`(() => { const h = ${H}; const ph = document.getElementById('ph'), p = document.getElementById('poem'), r = h.rect(ph); const ov = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
      const pr = h.rect(p), hd = h.rect(document.querySelector('header')), cp = h.rect(document.getElementById('cap'));
      return { src: ph.getAttribute('src'), hidden: ph.hidden, full: Math.abs(r.x) < 1 && Math.abs(r.y) < 1 && Math.abs(r.w - innerWidth) < 1 && Math.abs(r.h - innerHeight) < 1, poem: p.dataset.poem,
        fits: p.scrollHeight <= p.clientHeight + 1 || (parseFloat(getComputedStyle(p).fontSize) <= parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--poem-min-px')) + .01 && getComputedStyle(p).overflowY === 'auto'), poemIn: h.onScreen(pr), clear: !ov(pr, hd) && !ov(pr, cp) && !ov(hd, cp), capIn: h.onScreen(cp), hdIn: h.onScreen(hd), sideways: document.scrollingElement.scrollWidth > innerWidth + 1,
        year: document.getElementById('year').textContent, basis: document.getElementById('year').dataset.basis } })()`)
    seenPoems.add(s.poem); await sleep(550)
    const t = truth[s.src]
    check(s.src === want.src && !s.hidden && s.full, `${tag}: the photograph is whole, full screen`, `${s.src} full=${s.full}`)
    check(s.poem === want.poem && onSite(s.poem), `${tag}: the poem is ${want.poem}, a page on the site`, s.poem)
    check(s.poemIn && s.capIn && s.hdIn && s.clear && !s.sideways, `${tag}: poem, name and caption inside the screen and clear of each other, no sideways scroll`, JSON.stringify({ poemIn: s.poemIn, capIn: s.capIn, hdIn: s.hdIn, clear: s.clear, sideways: s.sideways }))
    check(s.fits, `${tag}: the whole poem fits its place, or at its smallest size reads on inside it, nothing cut`)
    check(t && s.year === (t.row === 'now' ? String(t.y) : t.row) && s.basis === 'exif:' + t.date, `${tag}: the year shown is the photograph's EXIF year`, `${s.year} ${s.basis} vs ${t && t.date}`)
    return s
  }

  for (const vp of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 2, mobile: vp.mobile })
    for (const v of WAYS) for (const [wi, w] of WORLDS.entries()) {
      if (v === 'd' && wi === 2) continue // d's quiet year adds nothing its year fact does not; its third world is the one it opens
      const tag = `${vp.id} ${v} ${w.at}`, src = `/photos/${w.at}.jpg`, t = truth[src], poem = w.p || X.photos.find(p => p.src === src).poem
      await cdp.send('Page.navigate', { url: `${BASE}/studies/32/index.html?v=${v}&at=${w.at}${w.p ? '&p=' + w.p : ''}` })
      await atRest(tag, { src, poem })
      await shot(`${vp.id}-${v}-${wi}-world`)
      if (v === 'd') await tap(`document.getElementById('making')`, `${tag} making`)
      else await tap(`document.getElementById('year')`, `${tag} year`)
      await still('about'); await sleep(150)
      await shot(`${vp.id}-${v}-${wi}-about`)
      if (v === 'a') {
        const s = await cdp.eval(`(() => { const h = ${H}; const l = h.fd.querySelector('[data-w32="lift"]'); if (!l) return null; const im = l.querySelector('img'); return { row: l.closest('.yr').dataset.y, src: im.getAttribute('src'), basis: l.dataset.basis, on: h.onScreen(h.rect(im, true)), ph: document.getElementById('ph').hidden } })()`)
        check(s && s.row === t.row && s.src === src && s.basis === 'exif:' + t.date && s.on && s.ph, `${tag}: the photograph itself is lifted in its year's row (${t.row}), on screen`, JSON.stringify(s))
        await tap(`document.getElementById('about').contentDocument.querySelector('[data-w32="lift"] img')`, `${tag} the lifted photograph`, true)
        await atRest(tag + ' back', { src, poem })
      }
      if (v === 'b') {
        const s = await cdp.eval(`(() => { const h = ${H}; const l = h.fd.querySelector('[data-w32="strip"]'); if (!l) return null; return { row: l.closest('.yr').dataset.y, bg: l.style.backgroundImage, basis: l.dataset.basis, on: h.onScreen(h.rect(l, true)) } })()`)
        check(s && s.row === t.row && s.bg.includes(src) && s.basis === 'exif:' + t.date && s.on, `${tag}: the facets left the photograph as a strip in its year's row (${t.row}), on screen`, JSON.stringify(s))
        await tap(`document.getElementById('about').contentDocument.querySelector('[data-w32="strip"]')`, `${tag} the strip`, true)
        await atRest(tag + ' back', { src, poem })
      }
      if (v === 'c') {
        const s = await cdp.eval(`(() => { const h = ${H}; const ph = document.getElementById('ph'), lit = h.fd.querySelector('.w32-lit'); const th = [...h.fd.querySelectorAll('[data-w32="thumbs"]')].map(b => ({ row: b.dataset.row, items: [...b.querySelectorAll('button')].map(x => ({ src: x.dataset.src, poem: x.dataset.poem, basis: x.dataset.basis })) }));
          const hot = lit ? [...lit.querySelectorAll('.lane.hot')].map(l => l.dataset.g) : [];
          return { band: ph.classList.contains('band') && !ph.hidden && h.onScreen(h.rect(ph)), src: ph.getAttribute('src'), lit: lit && lit.dataset.y, litOn: lit && h.rect(lit, true).y >= h.f.getBoundingClientRect().top - 1 && h.rect(lit, true).y < innerHeight - 20, hot, th } })()`)
        check(s.band && s.src === src, `${tag}: the photograph stays as the band`, JSON.stringify({ band: s.band, src: s.src }))
        check(s.lit === t.row && s.litOn, `${tag}: its year (${t.row}) is lit, at the top of the About`, `${s.lit} on=${s.litOn}`)
        check(s.hot.length && s.hot.every(g => t.lanes.includes(g)), `${tag}: the long things running then (${s.hot.length}) are the year's own`, s.hot.join(', '))
        const bad = []; let n = 0
        for (const b of s.th) for (const it of b.items) { n++; const tt = truth[it.src]; if (!tt || tt.row !== b.row || it.basis !== 'exif:' + tt.date || it.poem !== tt.poem || !onSite(it.poem)) bad.push(`${it.src} in ${b.row}`); seenPoems.add(it.poem) }
        check(n > 20 && !bad.length, `${tag}: every year's worlds (${n} in ${s.th.length} years) were photographed in that year, each with its recorded poem`, bad.slice(0, 3).join(' | '))
        if (wi === 0) { // the band takes you back to the same world
          await tap(`document.getElementById('ph')`, `${tag} the band`)
          await atRest(tag + ' back', { src, poem })
        } else { // a year's photograph opens its world
          const other = s.th.flatMap(b => b.items).find(it => it.src !== src && truth[it.src].row !== t.row)
          await tap(`document.getElementById('about').contentDocument.querySelector('[data-w32="thumbs"] button[data-src="${other.src}"]')`, `${tag} a world from ${truth[other.src].row}`, true)
          await atRest(tag + ' into ' + other.src, { src: other.src, poem: truth[other.src].poem })
        }
      }
      if (v === 'd') {
        const want = (w.p && films.includes(w.p)) ? 'film:' + w.p : t.names[0] || t.yearFacts[0] || t.lanes[0]
        const s = await cdp.eval(`(() => { const h = ${H}; const box = h.fd.querySelector('.fl'), on = h.fd.querySelector('.v-a .tex .on'); const wv = box && box.querySelector('[data-w32="world"] img');
          const ws = box ? [...box.querySelectorAll('[data-w32="worlds"] button')].map(b => ({ src: b.dataset.src, poem: b.dataset.poem, basis: b.dataset.basis })) : [];
          return { id: on && on.dataset.id, world: wv && wv.getAttribute('src'), on: wv && h.onScreen(h.rect(wv, true)), ws, of: box && box.querySelector('[data-w32="worlds"]')?.dataset.of } })()`)
        check(s.id === want, `${tag}: the making lifted is the world's strongest basis (${want})`, s.id)
        check(s.world === src && s.on, `${tag}: the world sits inside the lifted making, on screen`, JSON.stringify({ world: s.world, on: s.on }))
        const bad = []
        for (const it of s.ws) { const tt = truth[it.src], [k, val] = it.basis.split(':'); seenPoems.add(it.poem)
          const okB = k === 'film' ? s.id === 'film:' + val && it.poem === val && tt.poems.has(val) : k === 'name' ? t && tt.names.includes(s.id) && it.poem === tt.poem : k === 'year' ? tt.row === val && yrow[s.id]?.row === val && it.poem === tt.poem : false
          if (!okB || !onSite(it.poem)) bad.push(`${it.src} ${it.basis}`) }
        check(s.ws.length > 0 && !bad.length, `${tag}: the lifted making's worlds (${s.ws.length}) each stand on its film, its place or its year`, bad.join(' | '))
        if (wi === 1) { // the world inside takes you back
          await tap(`document.getElementById('about').contentDocument.querySelector('[data-w32="world"] img')`, `${tag} the world inside`, true)
          await atRest(tag + ' back', { src, poem })
        } else { // another world the making opens
          const it = s.ws.find(x => x.src !== src)
          await tap(`document.getElementById('about').contentDocument.querySelector('[data-w32="worlds"] button[data-src="${it.src}"]')`, `${tag} a world it opens`, true)
          await atRest(tag + ' into ' + it.src, { src: it.src, poem: it.poem })
        }
      }
      await shot(`${vp.id}-${v}-${wi}-back`)
    }
  }
  const gone = [...seenPoems].filter(s => !onSite(s))
  check(seenPoems.size > 5 && !gone.length, `every one of ${seenPoems.size} poems the page showed or offered is /poems/<slug>.html on disk`, gone.join(', '))
  check(!errors.length, 'no console error', errors.slice(0, 3).join(' | '))
} catch (e) { failures++; console.log('FAIL ' + (e.stack || e)); if (errors.length) console.log('     page errors: ' + errors.slice(0, 3).join(' | ')) }

const secs = ((Date.now() - t0) / 1000).toFixed(0)
if (failures) { console.log(`\nFAIL study 32: ${failures} of ${failures + oks} checks failed`); process.exit(1) }
console.log(`\nPASS study 32: ${oks} checks — every crossing recounted from EXIF, 27's years and links, days.json, og:image and poem-films.html; ${WAYS.length} ways × ${VIEWPORTS.length} screens, out and back (${secs}s)`)
process.exit(0)
