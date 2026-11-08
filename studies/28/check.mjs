#!/usr/bin/env node
// Study 28 check: the photograph stays whole, and every facet of it goes somewhere (?f= a windows · b matches · c kin · d joined),
// at 1440x900 (mouse) and by touch at 390x844, 844x390 and 590x330:
//   at rest every facet samples the current photograph: read off the canvas, each facet is nearer this photograph than the one it leads to
//     (after the best fit of light, so the lamp may change brightness but never content);
//   every drawn facet has a destination (a world, or in a, a window with something true to say), the same one on a second tap,
//     and the same again after a reload in the same visit;
//   the poem arrives line by line in its own order, a door line in its place (not after the others), its door open the moment it shows;
//   a tap on a door line (its words, or its row just above them) goes to the door, never to the facet beneath;
//   a facet's crossing lands where the facet promised, first showing the next photograph's answering region in that facet;
//   reduced motion: a facet still answers, a crossing is a calm crossfade; no dial shadows a page CSS variable; nothing counts down; no console error.
// The harness (CDP, server, helpers) is 26's. Screenshots: studies/28/shots/ (gitignored).
// Run: node studies/28/check.mjs   (FS=a,b ONLY_VP=desk,phone to narrow; non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const FS = (process.env.FS || 'a,b,c,d').split(',')
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false, full: true }, { id: 'phone', w: 390, h: 844, mobile: true, full: true },
  { id: 'side', w: 844, h: 390, mobile: true, full: false }, { id: 'small', w: 590, h: 330, mobile: true, full: false }].filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
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
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}
// every poem the study can reach is a poem on the site: four were taken off on 7 Nov while out for submission, and must not come back through a copy
const onSite = slug => existsSync(path.join(ROOT, 'poems', slug + '.html'))
{ const DJ = JSON.parse(readFileSync(path.join(HERE, 'doors.json'), 'utf8')), DATA = JSON.parse(readFileSync(path.join(ROOT, 'v2/data.json'), 'utf8')), slugs = new Set(DATA.poems.map(p => p.slug))
  for (const v of Object.values(DJ.vocabs)) { Object.keys(v.poems).forEach(x => slugs.add(x)); v.words.forEach(w => w.poems.forEach(x => slugs.add(x))) }
  const gone = [...slugs].filter(x => !onSite(x)); check(!gone.length, `every one of ${slugs.size} poems the study can reach is /poems/<slug>.html on disk`, gone.join(', ')) }
const reached = new Set()

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.kill() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
const t0 = Date.now()

try {
  await waitFor(() => fetch(`${BASE}/studies/28/index.html`).then(r => r.ok), 'static server')
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
  const open = async q => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/28/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S28.world`), 'page ' + q, 300)
    await sleep(300) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 }) // the pointer off every facet, so nothing is lifted
  const settle = () => waitFor(() => cdp.eval(`S28.at === 'world' && !S28.busy`), 'landing', 300)
  const openWorld = async (f, key) => { await open(`f=${f}&w=${encodeURIComponent(key)}`); await settle() }
  const tapFacet = async i => { const pt = await cdp.eval(`S28.tapPoint(${i})`); if (!pt) return null; await tap(pt[0], pt[1]); return pt }
  const nextSeq = async seq0 => waitFor(() => cdp.eval(`S28.seq > ${seq0} && S28.last`), 'a facet answer', 60, 30).catch(() => null)
  const doorPoint = async (k, edge) => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); a.scrollIntoView({ block: 'nearest' })
    const b = a.getClientRects()[0], l = a.closest('.l').getClientRects()[0]; return ${edge ? `[b.left + b.width / 2, l.top - 2]` : `[b.left + b.width / 2, b.top + b.height / 2]`} })()`)
  const waitDoorShown = k => waitFor(() => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); return !!a && !!a.closest('.l.shown') && !S28.busy })()`), 'door shown', 200)
  // the arrival: what is shown is always the lines up to some point, in order; a door line shows in its place and its door opens with it
  const watchArrival = async label => { let bad = null, shut = null, last = null, sawDoorFirst = false
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S28.at, busy: S28.busy, arrived: S28.world.arrived, lines: S28.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length
        if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join('')
        const sd = s.lines.find(l => l.door && l.shown && l.open === false); if (sd) shut = 'a shown door line whose door does not answer'
        if (s.lines.some((l, j) => l.door && l.shown && s.lines.slice(j + 1).some(m => !m.door && !m.shown))) sawDoorFirst = true
        if (s.arrived) break }
      await sleep(40) }
    check(!bad, `${label}: the poem arrives in its own order, door lines in their place`, bad)
    check(!shut, `${label}: a door opens as its line appears`, shut)
    const doorBeforePlain = last && last.lines.some((l, j) => l.door && last.lines.slice(j + 1).some(m => !m.door))
    check(!doorBeforePlain || sawDoorFirst, `${label}: a door line shows before the plain lines after it`, JSON.stringify(last && last.lines.map(l => l.door ? 'D' : 'x').join('')))
    check(last && last.arrived && last.lines.every(l => l.shown), `${label}: the whole poem arrives`) }
  const restHolds = async label => { await park(); await cdp.eval('S28.still = true'); await sleep(700)
    const r = await cdp.eval('S28.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .012))
    check(r.length >= 6 && !bad.length, `${label}: at rest all ${r.length} facets read as this photograph`, bad.slice(0, 5).map(x => `#${x.i} own ${x.own} vs led-to ${x.other}`).join(' | ') || `${r.length} sampled`)
    await cdp.eval('S28.still = false') }
  // every facet has somewhere to go, the same on a second tap and after a reload in the visit
  const everyFacet = async (label, f, all) => {
    await cdp.eval('S28.dry = true'); const ids = await cdp.eval('S28.drawn'), plans = await cdp.eval('S28.plans'), wrong = [], dead = []
    for (const i of ids) { const p = plans[i]; if (!p) { wrong.push(`${i}: no destination`); continue }
      for (const round of all || ids.indexOf(i) % 3 === 0 ? [1, 2] : [1]) { const seq0 = await cdp.eval('S28.seq'), pt = await tapFacet(i); if (!pt) { dead.push(i); break }
        const last = await nextSeq(seq0)
        if (!last || last.i !== i) { wrong.push(`${i} tap ${round}: ${JSON.stringify(last)}`); break }
        if (p.kind === 'door' && (last.kind !== 'door' || last.to !== p.to)) wrong.push(`${i} tap ${round}: went for ${last.to}, promised ${p.to}`)
        if (p.kind === 'window') { const wv = await cdp.eval('S28.win'); if (last.kind !== 'window' || !wv || wv.i !== i || !wv.text.startsWith(p.text)) wrong.push(`${i} tap ${round}: window ${JSON.stringify(wv)} vs ${p.text}`) } } }
    await cdp.eval('S28.dry = false')
    for (const p of plans) if (p && p.kind === 'door') reached.add(p.to.split('~')[0]); for (const d of await cdp.eval('S28.doors')) reached.add(d.to.split('~')[0]); reached.add((await cdp.eval('S28.world')).slug)
    const kinds = plans.filter(Boolean).reduce((o, p) => (o[p.kind] = (o[p.kind] || 0) + 1, o), {})
    check(!dead.length, `${label}: every facet has a place of its own to touch`, `dead: ${dead.join(', ')}`)
    check(!wrong.length, `${label}: every one of ${ids.length} facets goes somewhere, the same on a second tap (${JSON.stringify(kinds)})`, wrong.slice(0, 4).join(' | '))
    if (f === 'a') check(kinds.door >= 2 && kinds.door <= 3 && kinds.window >= 1, `${label}: two or three photo doors, the rest windows`, JSON.stringify(kinds))
    else check(!kinds.window, `${label}: every facet is a door`, JSON.stringify(kinds))
    return plans }

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const f of FS) {
      errors.length = 0
      const L = `f=${f} ${tag}`
      await open(`f=${f}`); await cdp.eval('sessionStorage.clear()'); await open(`f=${f}`)
      await shot(`28-${f}-home-${tag}.png`)
      if (f === 'a' || vp.full) await restHolds(`${L} home`)
      if (f === 'a') { const plans = await cdp.eval('S28.plans'), i = plans.findIndex(p => p && p.kind === 'window'), seq0 = await cdp.eval('S28.seq')
        if (i >= 0) { await tapFacet(i); const last = await nextSeq(seq0); await sleep(400); const s = await cdp.eval('({ at: S28.at, busy: S28.busy, win: S28.win })')
          check(last && last.kind === 'window' && s.at === 'stone' && !s.busy && s.win && s.win.text, `${L} home: a window says its piece and the stone stays`, JSON.stringify({ last, s }))
          await shot(`28-a-home-window-${tag}.png`) } }
      const key = (await cdp.eval('S28.doors'))[0].to
      await open(`f=${f}&w=${encodeURIComponent(key)}`)
      if (f === 'a') await watchArrival(L)
      await restHolds(L)
      await shot(`28-${f}-world-${tag}.png`)
      const plans = await everyFacet(L, f, vp.full)
      if (f === 'a') { const i = plans.findIndex(p => p && p.kind === 'window'); if (i >= 0) { await tapFacet(i); await sleep(500); await shot(`28-a-window-${tag}.png`) } }
      await open(`f=${f}&w=${encodeURIComponent(key)}`); await settle()
      const again = await cdp.eval('S28.plans')
      check(JSON.stringify(again.map(p => p && (p.to || p.text))) === JSON.stringify(plans.map(p => p && (p.to || p.text))), `${L}: after a reload in the visit, every facet goes where it went`)
      // door lines win: the words, and the row just above them inside the slop
      for (const edge of vp.full && f === 'a' ? [false, true] : [false]) {
        if (edge) await openWorld(f, key)
        const ds = await cdp.eval('S28.doors'), d = ds[edge ? 1 % ds.length : 0]; await waitDoorShown(d.k)
        const seq0 = await cdp.eval('S28.seq'), pt = await doorPoint(d.k, edge); await tap(...pt)
        await waitFor(() => cdp.eval('S28.expect'), 'door').catch(() => null)
        const s = await cdp.eval(`({ expect: S28.expect, seq: S28.seq })`)
        check(s.expect === d.to && s.seq === seq0, `${L}: a tap on a door line${edge ? "'s row, above its words," : ''} goes to its door, not the facet beneath`, JSON.stringify({ ...s, want: d.to, seq0 }))
        await settle() }
      // a facet's crossing: from that facet, landing where it promised; then (full viewports) on through a door line and another facet
      const steps = vp.full && f === 'a' ? 3 : 1; let at = key
      await openWorld(f, at)
      for (let s = 0; s < steps; s++) {
        const ps = await cdp.eval('S28.plans'), doorsF = ps.map((p, i) => p && p.kind === 'door' ? i : -1).filter(i => i >= 0)
        let want, how
        if (s === 1) { const ds = await cdp.eval('S28.doors'), d = ds[1 % ds.length]; await waitDoorShown(d.k); await tap(...await doorPoint(d.k)); want = d.to; how = 'door line' }
        else { const i = doorsF[(s * 2) % doorsF.length]; want = ps[i].to; how = 'facet'; await tapFacet(i)
          if (s === 0) { await waitFor(() => cdp.eval('S28.t > .12'), 'mid-crossing', 60).catch(() => {}); const al = await cdp.eval('S28.align')
            check(al && al.r, `${L}: the facet's crossing starts from the answering region of the next photograph`, JSON.stringify(al))
            if (vp.full) await shot(`28-${f}-through-${tag}.png`) } }
        await waitFor(() => cdp.eval(`S28.world.key === ${JSON.stringify(want)} && !S28.busy`), `step ${s} landing`, 200).catch(() => {})
        const w = await cdp.eval('S28.world')
        check(w.key === want && w.imgOk, `${L} step ${s + 1}: a ${how} lands where it promised`, `${w.key} vs ${want}`)
        if (w.key !== want) break }
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!tm, `${L}: nothing counts down`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // reduced motion: a facet still answers, and a crossing is a calm crossfade
  if (!process.env.SKIP_EXTRA) {
    await view(VIEWPORTS[0])
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    for (const f of FS) { errors.length = 0
      await open(`f=${f}`); const key = (await cdp.eval('S28.doors'))[0].to; await openWorld(f, key)
      const ps = await cdp.eval('S28.plans'), i = ps.findIndex(p => p && p.kind === 'door'), seq0 = await cdp.eval('S28.seq')
      check(await cdp.eval('S28.lines.every(l => l.shown)'), `reduced motion f=${f}: the poem is there at once`)
      await tapFacet(i); const last = await nextSeq(seq0)
      check(last && last.i === i, `reduced motion f=${f}: the facet answers`, JSON.stringify(last))
      await sleep(300); check((await cdp.eval('S28.t')) === null, `reduced motion f=${f}: the crossing is a crossfade`)
      await settle(); const w = await cdp.eval('S28.world'); check(w.key === ps[i].to, `reduced motion f=${f}: lands`, `${w.key} vs ${ps[i].to}`)
      check(errors.length === 0, `reduced motion f=${f}: no console errors`, errors.join(' | ')) }
    await cdp.send('Emulation.setEmulatedMedia', { features: [] })
  }
  { const gone = [...reached].filter(x => !onSite(x)); check(reached.size > 0 && !gone.length, `every poem reached on the walks (${reached.size}) is on the site`, gone.join(', ')) }
  console.log(`shots: studies/28/shots/  (${Math.round((Date.now() - t0) / 1000)}s)`)
} catch (e) { failures++; console.log(e.stack); console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 28 where the facets go')
process.exit(failures ? 1 : 0)
