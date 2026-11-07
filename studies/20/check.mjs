#!/usr/bin/env node
// Study 20 check: the stone is the way in. In headless Chrome at 1440x900 (mouse) and 390x844 (touch), for ?v=a…e:
//   the home stone holds today's photograph across its facets and today's poem broken across at least three of them;
//   the way out (about, photos, poems) is there; nothing on the page counts down;
//   a: one glimpse facet per door · b: one carved facet per door line, holding it · c, d: no glimpses · e: more glimpses than doors;
//   the variant's own gesture enters exactly the world it promised (c: a short drag springs back first; d: a long press let go
//   early springs back first), and lands with one layer, that world's photograph and poem;
//   the poem arrives line by line with the doors last (no door line shows while a plain line is still hidden);
//   a door in the world, clicked twice, crosses once into that door's world; reduced motion still lands every entrance;
//   no dial shadows a page CSS variable; no console errors.
// Screenshots: studies/20/shots/20-<v>-<home|world>-<w>x<h>.png (gitignored).
// Run: node studies/20/check.mjs   (non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const VARIANTS = (process.env.VARIANTS || 'a,b,c,d,e').split(',')
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }]
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
const check = (ok, label, detail) => { if (ok) console.log('ok   ' + label); else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g), ...page.matchAll(/setProperty\('(--[\w-]+)'/g)].map(m => m[1].slice(2))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.kill() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []

// the page's own state, read in one go
const STATE = `(() => { const ly = [...document.querySelectorAll('.layer')], c = S20.cur
  return { at: S20.at, busy: S20.busy, n: ly.length, key: c && S20.keyOf(c.w), expect: S20.expect, arrived: ly[0]?.dataset.arrived === '1',
    title: c && c.w.poem.title, h2: ly[0]?.querySelector('.read h2')?.textContent,
    photoOk: [...(ly[0]?.querySelectorAll('.s img') || [])].some(i => i.naturalWidth > 0 && i.getAttribute('src') === c.w.photo.src) } })()`
const ARRIVAL = `(() => { const ly = S20.cur.el, ls = [...S20.cur.v.querySelectorAll('.l')], arr = ly.classList.contains('arriving')
  const shown = l => !arr || l.classList.contains('shown')
  const plain = ls.filter(l => !('door' in l.dataset)), doors = ls.filter(l => 'door' in l.dataset)
  return { arr, plainHidden: plain.filter(l => !shown(l)).length, doorsShown: doors.filter(shown).length, doors: doors.length, plain: plain.length } })()`

try {
  await waitFor(() => fetch(`${BASE}/studies/20/index.html`).then(r => r.ok), 'static server')
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

  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async (q) => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/20/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && [...document.querySelectorAll('.s img')].every(i => i.complete)`), 'page ' + q, 300)
    await sleep(600)
  }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  // input: mouse on desktop, touch on the phone
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const move = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const drag = async (x0, y, dx, steps = 12) => { await press(x0, y); for (let i = 1; i <= steps; i++) { await move(x0 + dx * i / steps, y); await sleep(16) } await sleep(60); await release(x0 + dx, y) }
  // the arrival is watched while it happens: a door line must never show while a plain line is still hidden
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 300; i++) { const s = await cdp.eval(`S20.at === 'world' ? ${ARRIVAL} : null`).catch(() => null)
      if (s) { last = s; if (s.arr && s.doorsShown > 0 && s.plainHidden > 0) bad = s; if (!s.arr || (await cdp.eval(`S20.cur.el.dataset.arrived === '1'`))) break }
      await sleep(60) }
    check(!bad, `${label}: the poem arrives line by line, doors last`, bad && JSON.stringify(bad))
    check(last && (last.doors > 0), `${label}: the world has doors`, JSON.stringify(last)) }
  const landedIn = async (label, want) => {
    await waitFor(() => cdp.eval(`S20.at === 'world' && !S20.busy`), label + ' landing', 200).catch(e => { throw new Error(e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) })
    const s = await cdp.eval(STATE)
    check(s.n === 1, `${label}: exactly one world on screen`, `${s.n} layers`)
    check(s.key === want, `${label}: landed in the promised world`, `${s.key} vs ${want}`)
    check(s.photoOk && s.h2 === s.title, `${label}: its photograph and poem are there`, JSON.stringify(s))
    return s }
  const stateIs = async (label, want) => { await sleep(900); const s = await cdp.eval(STATE); check(s.at === want && !s.busy && s.n === 1, label, JSON.stringify({ at: s.at, busy: s.busy, n: s.n })) }

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const v of VARIANTS) {
      errors.length = 0
      const L = `${v} ${tag}`
      await open('v=' + v)
      const home = await cdp.eval(`(() => { const c = S20.cur, fs = c.facets.filter(F => F.c)
        const nav = [...document.querySelectorAll('header nav a')].filter(a => a.getBoundingClientRect().width > 0).map(a => a.getAttribute('href'))
        const text = document.body.innerText.replace(document.getElementById('where').innerText, '')
        const carved = fs.filter(F => F.carved != null).map(F => { const a = c.v.querySelector('.door[data-k="' + F.carved + '"]').getClientRects()[0]; return { k: F.carved, holds: !!a && (() => { const x = a.left + a.width / 2, y = a.top + a.height / 2; let ins = false; for (let i = 0, j = F.p.length - 1; i < F.p.length; j = i++) { const [xi, yi] = F.p[i], [xj, yj] = F.p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins } return ins })() } })
        return { at: S20.at, facets: fs.length, today: fs.filter(F => !F.world && F.img && F.img.getAttribute('src') === c.w.photo.src && F.img.naturalWidth > 0).length,
          broken: fs.filter(F => F.clone).length, glimpses: fs.filter(F => F.world).length, doors: c.doors.length, carved, nav,
          timer: /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') } })()`)
      check(home.at === 'stone' && home.facets >= 10, `${L}: the stone is cut`, `${home.facets} facets`)
      check(home.today >= 8, `${L}: today's photograph is broken across the stone`, `${home.today} facets`)
      check(home.broken >= 3, `${L}: today's poem is broken across the stone`, `${home.broken} facets`)
      check(['/about.html', '/photography.html', '/poetry.html'].every(h => home.nav.includes(h)), `${L}: the way out is there`, home.nav.join(' '))
      check(!home.timer, `${L}: nothing counts down`)
      if (v === 'a') check(home.glimpses === home.doors && home.doors >= 2, `${L}: one glimpse per door`, `${home.glimpses} glimpses, ${home.doors} doors`)
      if (v === 'e') check(home.glimpses > home.doors, `${L}: the stone is made of more worlds than the doors`, `${home.glimpses} glimpses, ${home.doors} doors`)
      if (v === 'b') check(home.carved.length === home.doors && home.carved.every(c => c.holds), `${L}: each door line is carved into a facet of its own`, JSON.stringify(home.carved))
      if (v === 'c' || v === 'd') check(home.glimpses === 0, `${L}: no glimpses`)
      await shot(`20-${v}-home-${tag}.png`)

      // the way in
      if (v === 'a' || v === 'e') {
        const g = await cdp.eval(`(() => { const b = [...document.querySelectorAll('.gl')][0].getBoundingClientRect(), F = S20.cur.facets.filter(F => F.world)[0]; return { x: b.left + b.width / 2, y: b.top + b.height / 2, want: S20.keyOf(F.world) } })()`)
        await tap(g.x, g.y); await sleep(80); await tap(g.x, g.y)
        await watchArrival(L); await landedIn(L, g.want)
      }
      if (v === 'b') {
        const d = await cdp.eval(`(() => { const a = S20.cur.v.querySelector('.door'), r = a.getClientRects()[0]; return { x: r.left + r.width / 2, y: r.top + r.height / 2, want: S20.keyOf(S20.cur.doors.find(d => String(d.k) === a.dataset.k).to) } })()`)
        await tap(d.x, d.y); await sleep(80); await tap(d.x, d.y)
        await watchArrival(L); await landedIn(L, d.want)
      }
      if (v === 'c') {
        const want0 = await cdp.eval(`S20.keyOf(S20.cur.doors[0].to)`)
        await drag(vp.w * .7, vp.h * .5, -vp.w * .08); await stateIs(`${L}: a short drag springs back to the stone`, 'stone')
        if (!vp.mobile) { await drag(vp.w * .8, vp.h * .5, -vp.w * .6); await watchArrival(L + ' drag'); await landedIn(L + ' drag', want0); await open('v=' + v) }
        await tap(vp.w * .3, vp.h * .3); await sleep(60); await tap(vp.w * .3, vp.h * .3)
        await watchArrival(L); await landedIn(L, want0)
      }
      if (v === 'd') {
        const pt = [vp.w * .3, vp.h * .3]
        await press(...pt); await sleep(450); await release(...pt); await stateIs(`${L}: a press let go early springs back`, 'stone')
        await press(...pt); await sleep(30)
        const want = await cdp.eval('S20.expect'); await release(...pt)
        await watchArrival(L); await landedIn(L, want)
      }
      await waitFor(() => cdp.eval(`S20.cur.el.dataset.arrived === '1'`), 'arrival', 200); await sleep(900)
      await shot(`20-${v}-world-${tag}.png`)

      // one crossing inside the worlds: a door, twice
      const d = await cdp.eval(`(() => { const a = S20.cur.v.querySelector('.door'); a.scrollIntoView({ block: 'nearest' }); const r = a.getClientRects()[0]; return { x: r.left + r.width / 2, y: r.top + r.height / 2, want: S20.keyOf(S20.cur.doors.find(d => String(d.k) === a.dataset.k).to) } })()`)
      await tap(d.x, d.y); await sleep(60); await tap(d.x, d.y)
      await landedIn(`${L} door`, d.want)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // reduced motion: every entrance still lands, by a plain crossfade
  await view(VIEWPORTS[0])
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  for (const v of VARIANTS) {
    errors.length = 0
    await open('v=' + v)
    const p = await cdp.eval(`(() => { const c = S20.cur
      if ('${v}' === 'a' || '${v}' === 'e') { const b = document.querySelector('.gl').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }
      if ('${v}' === 'b') { const r = c.v.querySelector('.door').getClientRects()[0]; return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
      return { x: innerWidth * .3, y: innerHeight * .3 } })()`)
    await tap(p.x, p.y)
    const want = await cdp.eval('S20.expect')
    await landedIn(`${v} reduced motion`, want)
    check(await cdp.eval(`!S20.cur.el.classList.contains('arriving')`), `${v} reduced motion: the poem is there at once`)
    check(errors.length === 0, `${v} reduced motion: no console errors`, errors.join(' | '))
  }
  console.log('shots: studies/20/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 20 the stone is the way in')
process.exit(failures ? 1 : 0)
