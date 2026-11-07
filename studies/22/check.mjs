#!/usr/bin/env node
// Study 22 check: in headless Chrome, every crossing (a–f, and the reduced-motion calm one) is clicked
// through a door and must land in exactly one world with the right poem, opened 17 d's way (lines one by one,
// doors last), no console errors. The stone is 05 B's cut (its cell count), its seams read at rest, and no
// mid-crossing frame goes pale or empty (16's rough spots). A double-click and a stray click mid-crossing
// still end in one world; phone width and reduced motion land too. Writes a six-frame strip per crossing
// to studies/22/shots/<x>.jpg.
// Run: node studies/22/check.mjs   (exits non-zero on any failure)

import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const W = 1200, H = 800
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const HTTP = await freePort(), CDPP = await freePort()

function findShell() {
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell')
  if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) {
    const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
    if (existsSync(p)) return p
  }
  return null
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 100) {
  for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(100) }
  throw new Error('timed out waiting for ' + label)
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data)
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) }
      else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value }
}

const shell = findShell()
if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.kill() } catch {} }
process.on('exit', cleanup)

let failures = 0
const check = (ok, label, detail) => { if (ok) console.log('ok   ' + label); else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const fs = await import('node:fs')
{ // a dial becomes a CSS variable on :root, so a dial named like one of the page's own variables would overwrite it
  const page = fs.readFileSync(path.join(HERE, 'world.html'), 'utf8'), dials = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)), clash = dials.filter(k => own.includes(k))
  check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
const XS = ['a', 'b', 'c', 'd', 'e', 'f']
// 05 B's count at cloud 40: 26 + 40% of 8 on a desk, 14 + 40% of 4 on a phone
const COUNT = phoneW => Math.round((phoneW ? 14 : 26) + .4 * (phoneW ? 4 : 8))

try {
  await waitFor(() => fetch(`${BASE}/studies/22/world.html`).then(r => r.ok), 'static server')
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
  let VW = W, VH = H
  const viewport = async (w, h, mobile = false) => { VW = w; VH = h; await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }) }
  await viewport(W, H)

  const doorsOpen = () => waitFor(() => cdp.eval(`(() => { const d = [...document.querySelectorAll('.poem .ln.has-door')]; return d.length && d.every(l => l.classList.contains('shown') && getComputedStyle(l).opacity === '1') })()`), 'the doors to open', 160)
  const open = async (x, w = 'A') => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/22/world.html?x=${x}&w=${w}` })
    await waitFor(() => cdp.eval(`document.documentElement.dataset.ready === '1' && document.fonts.status === 'loaded'`), 'world ' + w)
    await doorsOpen(); await sleep(200)
  }
  const door = (i = 0) => cdp.eval(`(() => { const a = document.querySelectorAll('.poem .door')[${i}]; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, to: a.dataset.to } })()`)
  const click = async (x, y, n = 1) => { for (const type of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: n }) }
  const settle = () => waitFor(() => cdp.eval('!window.S22.busy'), 'crossing to finish', 120)
  const landed = async (to, label) => {
    const s = await cdp.eval(`(() => { const p = document.querySelectorAll('.poem'); return { n: p.length, caps: document.querySelectorAll('.cap').length, key: window.S22.world,
      title: p[0]?.querySelector('b')?.textContent, op: p[0] && getComputedStyle(p[0]).opacity, want: window.S22.worlds['${to}'] } })()`)
    check(s.n === 1 && s.caps === 1 && s.key === to, `${label}: exactly one world, ${to}`, `${s.n} poems, ${s.caps} places, key ${s.key}`)
    check(s.title === s.want.title && s.op === '1', `${label}: poem "${s.want.title}" arrived`, `title ${s.title}, opacity ${s.op}`)
    // 17 d: the first door to show waits for every plain line
    await waitFor(() => cdp.eval(`!!document.querySelector('.poem .ln.has-door.shown')`), 'a door line', 160)
    const order = await cdp.eval(`[...document.querySelectorAll('.poem .ln:not(.has-door)')].every(l => l.classList.contains('shown'))`)
    check(order, `${label}: lines one by one, the doors last`)
    await doorsOpen()
  }
  const shot = async () => (await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 72, clip: { x: 0, y: 0, width: VW, height: VH, scale: VW > 600 ? .5 : 1 } })).data
  const read = () => cdp.eval('window.S22.read()')

  for (const x of XS) {
    errors.length = 0
    await open(x)
    if (x === 'a') { // the stone at rest, once: 05 B's cut, and seams that read (16's were faint)
      check(await cdp.eval('window.S22.cells') === COUNT(false), `the cut is 05 B's: ${COUNT(false)} facets at ${W}x${H}`, `${await cdp.eval('window.S22.cells')} facets`)
      const lum = await cdp.eval('window.S22.at(window.S22.edges)'), dark = lum.filter(l => l < .1).length / lum.length
      check(dark >= .9, `seams read: ${Math.round(dark * 100)}% of seam midpoints are stone-dark`)
    }
    const total = await cdp.eval(`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--${x}-ms'))`)
    const rA = await read(), d = await door(0)
    const t0 = Date.now(); await click(d.x, d.y)
    const frames = [], reads = []
    for (const f of [.06, .22, .38, .54, .72]) { const wait = t0 + f * total - Date.now(); if (wait > 0) await sleep(wait); frames.push(await shot()); if (f > .2 && f < .8) reads.push([f, await read()]) }
    await settle(); await doorsOpen(); frames.push(await shot())
    // 16 went pale midway and had an empty beat: measured against the two worlds' own rest frames (night photographs are dark at rest)
    const rB = await read()
    for (const [f, r] of reads) check(r.mean < Math.max(rA.mean, rB.mean) * 1.35 + .02 && r.mean > Math.min(rA.mean, rB.mean) * .6 && r.bare < Math.max(rA.bare, rB.bare) + .18 && r.sd > .05,
      `${x} at ${Math.round(f * 100)}%: neither paler nor emptier than the worlds either side`, `mean ${r.mean.toFixed(3)} (rest ${rA.mean.toFixed(3)}/${rB.mean.toFixed(3)}), bare ${r.bare.toFixed(2)} (rest ${rA.bare.toFixed(2)}/${rB.bare.toFixed(2)}), spread ${r.sd.toFixed(3)}`)
    await landed(d.to, `${x} crossing`)
    fs.writeFileSync(path.join(HERE, 'shots', `.${x}.frames.json`), JSON.stringify(frames))
    // double-click on a door, then a stray click on where the doors were, all mid-crossing
    const d2 = await door(0)
    await click(d2.x, d2.y, 1); await click(d2.x, d2.y, 2)
    await sleep(total * .3); await click(d2.x, d2.y, 1); await click(W * .8, H * .5, 1)
    await sleep(total * .3); await click(d2.x, d2.y, 1)
    await settle(); await sleep(200)
    await landed(d2.to, `${x} double-click`)
    check(errors.length === 0, `${x}: no console errors`, errors.join(' | '))
  }

  // keyboard: Enter twice on a focused door
  errors.length = 0
  await open('f')
  const k = await door(0)
  await cdp.eval(`document.querySelectorAll('.poem .door')[0].focus()`)
  for (let i = 0; i < 2; i++) for (const type of ['keyDown', 'keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await sleep(400)
  for (const type of ['keyDown', 'keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await settle(); await sleep(200); await landed(k.to, 'keyboard twice')
  check(errors.length === 0, 'keyboard: no console errors', errors.join(' | '))

  // phone: 05 B's phone cut, the card on screen, a crossing lands (shatter and fall, the two he liked)
  for (const x of ['a', 'b']) {
    errors.length = 0
    await viewport(390, 844, true)
    await open(x)
    check(await cdp.eval('window.S22.cells') === COUNT(true), `phone ${x}: the cut is 05 B's phone cut, ${COUNT(true)} facets`)
    const r = await cdp.eval(`(() => { const b = document.querySelector('.poem').getBoundingClientRect(); return { l: b.left, r: b.right, b: b.bottom, sw: document.documentElement.scrollWidth } })()`)
    check(r.l >= 0 && r.r <= 390 && r.b <= 844 && r.sw <= 390, `phone ${x}: the poem sits on screen, no sideways scroll`, JSON.stringify(r))
    const d = await door(0); const t0 = Date.now(); await click(d.x, d.y)
    const total = await cdp.eval(`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--${x}-ms'))`)
    const frames = []
    for (const f of [.06, .22, .38, .54, .72]) { const wait = t0 + f * total - Date.now(); if (wait > 0) await sleep(wait); frames.push(await shot()) }
    await settle(); await doorsOpen(); frames.push(await shot())
    await landed(d.to, `phone ${x}`)
    fs.writeFileSync(path.join(HERE, 'shots', `.phone-${x}.frames.json`), JSON.stringify(frames))
    check(errors.length === 0, `phone ${x}: no console errors`, errors.join(' | '))
  }
  await viewport(W, H)

  // reduced motion: the calm crossing still lands
  errors.length = 0
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await open('a')
  const d = await door(1); await click(d.x, d.y); await click(d.x, d.y, 2)
  await settle(); await landed(d.to, 'reduced motion')
  check(errors.length === 0, 'reduced motion: no console errors', errors.join(' | '))
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })

  // the strips: six frames per crossing into shots/<x>.jpg (desk 3x2, phone 6 across)
  for (const x of [...XS, 'phone-a', 'phone-b']) {
    const fp = path.join(HERE, 'shots', `.${x}.frames.json`)
    const frames = JSON.parse(fs.readFileSync(fp, 'utf8')), ph = x.startsWith('phone')
    const [cols, fw, fh] = ph ? [6, 200, 433] : [3, 400, 267]
    await cdp.eval(`(() => { document.documentElement.innerHTML = '<body style="margin:0;background:#0d0c0b;display:grid;grid-template-columns:repeat(${cols},${fw}px);gap:2px;width:${cols * fw + (cols - 1) * 2}px"></body>';
      for (const f of ${JSON.stringify(frames)}) { const i = new Image(); i.src = 'data:image/jpeg;base64,' + f; i.style.cssText = 'width:${fw}px;height:${fh}px;display:block'; document.body.append(i) } })()`)
    await sleep(300)
    const rows = 6 / cols
    const img = (await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: cols * fw + (cols - 1) * 2, height: rows * fh + (rows - 1) * 2, scale: 1 } })).data
    fs.writeFileSync(path.join(HERE, 'shots', `${x}.jpg`), Buffer.from(img, 'base64'))
    fs.unlinkSync(fp)
  }
  console.log('strips: studies/22/shots/{a,b,c,d,e,f,phone-a,phone-b}.jpg')
} catch (e) { failures++; console.log('FAIL ' + e.message) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 22 crossings')
process.exit(failures ? 1 : 0)
