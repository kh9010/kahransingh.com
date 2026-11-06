#!/usr/bin/env node
// Study 16 check: in headless Chrome, every crossing (a–e, and the reduced-motion calm one) is clicked
// through a door and must land in exactly one world with the right poem title and photograph, no console
// errors; a double-click and a stray click mid-crossing must still end in one world. Writes a six-frame
// strip per crossing to studies/16/shots/<x>.jpg.
// Run: node studies/16/check.mjs   (exits non-zero on any failure)

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
{ // a dial becomes a CSS variable on :root, so a dial named like one of the page's own variables would overwrite it
  const fs = await import('node:fs'), page = fs.readFileSync(path.join(HERE, 'world.html'), 'utf8'), dials = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)), clash = dials.filter(k => own.includes(k))
  check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []

try {
  await waitFor(() => fetch(`${BASE}/studies/16/world.html`).then(r => r.ok), 'static server')
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })

  const open = async (x, w = 'A') => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/16/world.html?x=${x}&w=${w}` })
    await waitFor(() => cdp.eval(`document.documentElement.dataset.ready === '1' && document.fonts.status === 'loaded' && [...document.querySelectorAll('.world img')].every(i => i.complete)`), 'world ' + w)
    await sleep(500)
  }
  const door = (i = 0) => cdp.eval(`(() => { const a = document.querySelectorAll('.world .door')[${i}]; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, to: a.dataset.to } })()`)
  const click = async (x, y, n = 1) => { for (const type of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: n }) }
  const settle = () => waitFor(() => cdp.eval('!window.S16.busy'), 'crossing to finish', 80)
  const landed = async (to, label) => {
    const s = await cdp.eval(`(() => { const w = [...document.querySelectorAll('.world')]; const p = w[0]?.querySelector('.poem'); const im = w[0]?.querySelector('img')
      return { n: w.length, key: w[0]?.dataset.key, title: p?.querySelector('b')?.textContent, op: p && getComputedStyle(p).opacity, img: im?.getAttribute('src'), nw: im?.naturalWidth,
        left: document.querySelectorAll('.gem,.bridge,.veil').length, want: window.S16.worlds['${to}'] } })()`)
    check(s.n === 1 && s.key === to, `${label}: exactly one world, ${to}`, `${s.n} worlds, key ${s.key}`)
    check(s.title === s.want.title && s.op === '1', `${label}: poem "${s.want.title}" arrived`, `title ${s.title}, opacity ${s.op}`)
    check(s.img === '/photos/' + s.want.photo && s.nw > 0, `${label}: photo ${s.want.photo} arrived`, `${s.img} (${s.nw}px)`)
    check(s.left === 0, `${label}: nothing of the crossing left behind`, `${s.left} leftovers`)
  }
  const shot = async () => (await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 72, clip: { x: 0, y: 0, width: W, height: H, scale: .5 } })).data

  for (const x of ['a', 'b', 'c', 'd', 'e']) {
    errors.length = 0
    await open(x)
    const total = await cdp.eval(`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--${x}-ms'))`)
    const d = await door(0)
    const t0 = Date.now(); await click(d.x, d.y)
    const frames = []
    for (const f of [.04, .2, .36, .52, .72]) { const wait = t0 + f * total - Date.now(); if (wait > 0) await sleep(wait); frames.push(await shot()) }
    await settle(); frames.push(await shot())
    await landed(d.to, `${x} crossing`)
    writeFileSync(path.join(HERE, 'shots', `.${x}.frames.json`), JSON.stringify(frames))
    // double-click on a door, then a stray click on where the doors were, all mid-crossing
    const d2 = await door(0)
    await click(d2.x, d2.y, 1); await click(d2.x, d2.y, 2)
    await sleep(total * .3); await click(d2.x, d2.y, 1); await click(W * .8, H * .5, 1)
    await sleep(total * .3); await click(d2.x, d2.y, 1)
    await settle(); await sleep(200)
    await landed(d2.to, `${x} double-click`)
    check(errors.length === 0, `${x}: no console errors`, errors.join(' | '))
  }

  // keyboard: Enter twice on a focused door (keys reach a link even where the pointer can't)
  errors.length = 0
  await open('d')
  const k = await door(0)
  await cdp.eval(`document.querySelectorAll('.world .door')[0].focus()`)
  for (let i = 0; i < 2; i++) for (const type of ['keyDown', 'keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await sleep(400)
  for (const type of ['keyDown', 'keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await settle(); await sleep(200); await landed(k.to, 'keyboard twice')
  check(errors.length === 0, 'keyboard: no console errors', errors.join(' | '))

  // reduced motion: the calm crossing still lands
  errors.length = 0
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await open('a')
  const d = await door(1); await click(d.x, d.y); await click(d.x, d.y, 2)
  await settle(); await landed(d.to, 'reduced motion')
  check(errors.length === 0, 'reduced motion: no console errors', errors.join(' | '))
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })

  // the strips: six frames per crossing, three by two, into shots/<x>.jpg
  for (const x of ['a', 'b', 'c', 'd', 'e']) {
    const fp = path.join(HERE, 'shots', `.${x}.frames.json`)
    const frames = JSON.parse((await import('node:fs')).readFileSync(fp, 'utf8'))
    await cdp.eval(`(() => { document.documentElement.innerHTML = '<body style="margin:0;background:#0d0c0b;display:grid;grid-template-columns:repeat(3,400px);gap:2px;width:1204px"></body>';
      for (const f of ${JSON.stringify(frames)}) { const i = new Image(); i.src = 'data:image/jpeg;base64,' + f; i.style.cssText = 'width:400px;height:auto;display:block'; document.body.append(i) } })()`)
    await sleep(300)
    const img = (await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 1204, height: 2 * 267 + 2, scale: 1 } })).data
    writeFileSync(path.join(HERE, 'shots', `${x}.jpg`), Buffer.from(img, 'base64'))
    ;(await import('node:fs')).unlinkSync(fp)
  }
  console.log('strips: studies/16/shots/{a,b,c,d,e}.jpg')
} catch (e) { failures++; console.log('FAIL ' + e.message) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 16 crossings')
process.exit(failures ? 1 : 0)
