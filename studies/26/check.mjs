#!/usr/bin/env node
// Study 26 check: what a facet does, in each ?f= (a the moment's matches · b photo door · c the back · d the lift · e the line · f kept), at 1440x900 (mouse)
// and by touch at 390x844, 844x390 and 590x330 (a phone held sideways, a small one):
//   a: pressed on one of today's matches, the stone lands in that match; a match facet crosses to its own match, every other facet answers 'own';
//   every drawn facet of every world walked has a place a finger can land that is its own (a finger's width from a link), and in the first world a tap
//   there does what its variant says it does (no dead facet);
//   a tap on a door line (its anchor, or the row just above it, inside the slop) goes to the door, never to a facet;
//   a walk of WALK worlds mixing facet moves and door lines lands where each move promised, every world with two doors, no console error;
//   reduced motion: each variant still answers, crossings and lifts by a calm crossfade; no dial shadows a page CSS variable; nothing counts down.
// The harness (CDP, server, helpers) is 24's, copied; some of its helpers are not called here. Screenshots: studies/26/shots/.
// Run: node studies/26/check.mjs   (FS=a,b WALK=4 ONLY_VP=phone to narrow; non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const VOCABS = (process.env.VOCABS || 'pairs,questions,nouns,his').split(',')
const WALK = +(process.env.WALK || 8), PHONE_WALK = +(process.env.PHONE_WALK || 8), FS = (process.env.FS || 'a,b,c,d,e,f').split(',')
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false, walk: WALK }, { id: 'phone', w: 390, h: 844, mobile: true, walk: PHONE_WALK },
  { id: 'side', w: 844, h: 390, mobile: true, walk: 4 }, { id: 'small', w: 590, h: 330, mobile: true, walk: 4 }].filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id)) // a phone held sideways, and a small one (Kahran, 7 Nov, on 24)
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
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}
// the poems as written, read the way the home reads them (v2/home.js stanzasOf)
const DATA = JSON.parse(readFileSync(path.join(ROOT, 'v2/data.json'), 'utf8'))
const norm = s => String(s).replace(/[^0-9a-z]+/gi, ' ').trim().toLowerCase()
function linesOf(slug) { const poem = DATA.poems.find(p => p.slug === slug); let st = poem.stanzas.slice()
  while (st.length && /^[←→\s]*poems?$/i.test(st[st.length - 1].trim())) st.pop()
  if (st.length) { const ls = st[0].split('\n'); if (norm(ls[0]) === norm(poem.title)) { ls.shift(); const rest = ls.join('\n').trim(); if (rest) st[0] = rest; else st.shift() } }
  return st.flatMap(s => s.split('\n').map(l => l.trim()).filter(Boolean)) }

const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
const server = spawn('python3', ['-m', 'http.server', String(HTTP), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.kill() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = [], report = {}
const SKIP_EXTRA = !!process.env.SKIP_EXTRA

try {
  await waitFor(() => fetch(`${BASE}/studies/26/index.html`).then(r => r.ok), 'static server')
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
    await cdp.send('Page.navigate', { url: `${BASE}/studies/26/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S26.world`), 'page ' + q, 300)
    await sleep(500) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  // while it moves: never bare black (20's mid-move gaps), and the idea's name only where ?name= allows it
  const watchMove = async (label, want) => { let worstBare = 0, ideaMax = 0, ideaText = '', midShot = false, before = want.before ?? 0
    for (let i = 0; i < 120; i++) { const s = await cdp.eval(`({ at: S26.at, busy: S26.busy, t: S26.t, r: S26.read(), idea: +getComputedStyle(document.getElementById('idea')).opacity, it: document.getElementById('idea').textContent })`)
      if (!s.busy && s.at === 'world') break
      worstBare = Math.max(worstBare, s.r.bare); if (s.idea > ideaMax) { ideaMax = s.idea; ideaText = s.it }
      if (want.shot && !midShot && s.t > .3) { midShot = true; await shot(want.shot) }
      await sleep(50) }
    await sleep(200); const after = (await cdp.eval('S26.read()')).bare, rest = Math.max(before, after)
    check(worstBare <= rest + .15, // dark photographs, magnified by the lens, move this too; the gap the check is for reads as most of the screen
      `${label}: no bare black mid-move`, `worst ${worstBare.toFixed(3)} of the screen near-black mid-move, ${before.toFixed(3)} before, ${after.toFixed(3)} after`)
    return { ideaMax, ideaText } }
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S26.at, busy: S26.busy, arrived: S26.world.arrived, lines: S26.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const plainHidden = s.lines.filter(l => !l.door && !l.shown).length, doorsShown = s.lines.filter(l => l.door && l.shown).length
        if (doorsShown > 0 && plainHidden > 0) bad = { plainHidden, doorsShown }
        if (s.arrived) break }
      await sleep(50) }
    check(!bad, `${label}: the poem arrives line by line, doors last`, bad && JSON.stringify(bad))
    check(last && last.arrived && last.lines.every(l => l.shown), `${label}: the whole poem arrives`, JSON.stringify(last && last.lines.filter(l => !l.shown).length)) }
  const landedIn = async (label, want) => {
    await waitFor(() => cdp.eval(`S26.at === 'world' && !S26.busy`), label + ' landing', 200).catch(e => { throw new Error(e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) })
    const s = await cdp.eval(`({ w: S26.world, verses: document.querySelectorAll('.verse').length, h2: document.querySelector('.verse h2').textContent })`)
    check(s.verses === 1, `${label}: one world on screen`, `${s.verses} poems laid out`)
    check(s.w.key === want, `${label}: landed in the promised world`, `${s.w.key} vs ${want}`)
    check(s.w.imgOk && s.h2 === s.w.title, `${label}: its photograph and poem are there`, JSON.stringify(s))
    return s.w }
  const doorsHold = async (label, trail, name) => {
    const ds = await cdp.eval('S26.doors'), w = await cdp.eval('S26.world'), lines = linesOf(w.slug)
    const seenP = new Set(trail.map(k => k.split('~')[0])), seenF = new Set(trail.map(k => k.split('~')[1]))
    check(ds.length >= 2, `${label}: at least two doors`, `${ds.length} in ${w.slug}`)
    const ahead = ds.filter(d => !seenP.has(d.to.split('~')[0]) && !seenF.has(d.to.split('~')[1]))
    check(ahead.length === ds.length && ahead.length >= 2, `${label}: every door leads somewhere not yet walked`, JSON.stringify(ds.map(d => d.to)))
    check(new Set(ds.map(d => d.to.split('~')[0])).size === ds.length, `${label}: the doors lead to different poems`)
    for (const d of ds) { const line = name === 'door' ? d.line.slice(0, d.line.length - d.word.length) : d.line
      check(d.text === d.phrase && line.includes(d.phrase) && lines.includes(line), `${label}: "${d.phrase}" is verbatim in its line, and the line is the poem's`, JSON.stringify({ text: d.text, line })) }
    return ds }


  const waitArrived = () => waitFor(() => cdp.eval(`S26.at === 'world' && !S26.busy && S26.world.arrived`), 'arrival', 300)
  const settle = () => waitFor(() => cdp.eval(`S26.at === 'world' && !S26.busy`), 'landing', 300)
  const firstWorld = async f => { await open(`f=${f}`); const k = (await cdp.eval('S26.doors'))[0].to; return k }
  const openWorld = async (f, key) => { await open(`f=${f}&w=${encodeURIComponent(key)}`); await settle() }
  const tapFacet = async i => { const pt = await cdp.eval(`S26.tapPoint(${i})`); if (!pt) return null; await tap(pt[0], pt[1]); return pt }
  const nextSeq = async seq0 => waitFor(() => cdp.eval(`S26.seq > ${seq0} && S26.last`), 'a facet answer', 30).catch(() => null)
  const doorPoint = async (k, edge) => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); a.scrollIntoView({ block: 'nearest' })
    const b = a.getClientRects()[0], l = a.closest('.l').getClientRects()[0]; return ${edge ? `[b.left + b.width / 2, l.top - 2]` : `[b.left + b.width / 2, b.top + b.height / 2]`} })()`)
  const waitDoorShown = k => waitFor(() => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); return !!a && !!a.closest('.l.shown') && !S26.busy })()`), 'door shown', 200)

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const f of FS) {
      errors.length = 0
      const L = `f=${f} ${tag}`
      await open(`f=${f}`); await cdp.eval('sessionStorage.clear()')
      const key = await firstWorld(f)
      if (f === 'a') { const M = await cdp.eval('S26.matches'); console.log(`     ${L}: today's matches ${JSON.stringify(M)}`)
        await shot(`26-a-home-${tag}.png`)
        if (M.at.length) { const i = M.at[0], plan = await cdp.eval(`S26.plan(${i})`), want = plan.poem + '~' + plan.photo.replace('/photos/', ''); await tapFacet(i)
          await waitFor(() => cdp.eval(`S26.at === 'world' && !S26.busy`), 'home press', 200).catch(() => {}); const w = await cdp.eval('typeof S26 === "object" ? S26.world : { key: "left the page for " + location.href }')
          check(w.key === want, `${L}: pressed on one of today's matches, the world beneath is that match`, `${w.key} vs ${want}`) } }
      await openWorld(f, key)
      // every facet answers
      if (f === 'e') await waitArrived()
      const ids = await cdp.eval('S26.drawn'); let dead = [], wrong = []
      for (const i of ids) {
        const plan = await cdp.eval(`S26.plan(${i})`), seq0 = await cdp.eval('S26.seq')
        const pt = await tapFacet(i); if (!pt) { dead.push(i); continue }
        if (process.env.DEBUG) console.log('  tapped', i, JSON.stringify(pt), await cdp.eval('location.href'), JSON.stringify(plan))
        const last = await nextSeq(seq0)
        if (!last || last.i !== i) { wrong.push(`${i}: ${JSON.stringify(last)} ` + JSON.stringify(await cdp.eval(`({ at: S26.at, busy: S26.busy, expect: S26.expect, href: location.search, pt: ${JSON.stringify(pt)}, el: document.elementFromPoint(${pt[0]}, ${pt[1]}).className || document.elementFromPoint(${pt[0]}, ${pt[1]}).tagName, back: document.getElementById('back').className })`))); continue }
        if (f === 'a') { if (plan.match) { const ex = await cdp.eval('S26.expect'); if (last.kind !== 'match' || ex !== last.to || !ex.startsWith(plan.poem + '~')) wrong.push(`${i}: went for ${ex}, the match was ${JSON.stringify(plan)}`); await openWorld(f, key) }
          else if (last.kind !== 'own') wrong.push(`${i}: ${last.kind} on a facet with no match`) }
        if (f === 'b') { const ex = await cdp.eval('S26.expect'); if (last.kind !== 'door' || ex !== plan) wrong.push(`${i}: went for ${ex}, promised ${plan}`); await openWorld(f, key) }
        if (f === 'c') { await sleep(80); const t = await cdp.eval('S26.turned'); if (last.kind !== 'turn' || !t || t.i !== i || t.back !== plan.kind) wrong.push(`${i}: ${JSON.stringify(t)}`) }
        if (f === 'd') { await settle(); const w = await cdp.eval('S26.world'); if (w.key !== plan || !w.imgOk) wrong.push(`${i}: lifted to ${w.key}, promised ${plan}`) }
        if (f === 'e') { await sleep(60); const l = await cdp.eval('S26.litLine'); if (last.kind !== 'light' || !l || l.i !== i || l.k !== plan.k) wrong.push(`${i}: ${JSON.stringify(l)} vs ${JSON.stringify(plan)}`) }
        if (f === 'f') { if (last.kind !== 'keep') wrong.push(`${i}: ${last.kind}`) }
        if (i === ids[Math.floor(ids.length / 2)] && ['a', 'c', 'e', 'f'].includes(f)) { await sleep(f === 'c' ? 700 : 250); await shot(`26-${f}-facet-${tag}.png`) }
      }
      check(!dead.length, `${L}: every facet has a place of its own to touch`, `dead: ${dead.join(', ')}`)
      check(!wrong.length, `${L}: every one of ${ids.length} facets answers`, wrong.slice(0, 4).join(' | '))
      // door lines win: the anchor, and the row just above it inside the slop
      for (const edge of [false, true]) {
        await openWorld(f, key); await cdp.eval('sessionStorage.clear()')
        const ds = await cdp.eval('S26.doors'), d = ds[edge ? 1 % ds.length : 0]; await waitDoorShown(d.k)
        const seq0 = await cdp.eval('S26.seq'), pt = await doorPoint(d.k, edge); await tap(...pt)
        await waitFor(() => cdp.eval('S26.expect'), 'door').catch(() => null)
        const s = await cdp.eval(`({ expect: S26.expect, seq: S26.seq })`)
        check(s.expect === d.to && s.seq === seq0, `${L}: a tap on a door line${edge ? "'s row, above its words," : ''} goes to its door`, JSON.stringify({ ...s, want: d.to, seq0 }))
        await settle()
      }
      // the walk: facet moves and door lines, mixed (kept, f, goes back to a kept world once every four steps: that is the point of it)
      await openWorld(f, key); await cdp.eval('sessionStorage.clear()'); await sleep(50)
      const keys = [key], seenM = []; let moves = { facet: 0, door: 0 }
      for (let step = 1; step < vp.walk; step++) {
        if (f === 'e') await waitArrived()
        const w0 = await cdp.eval('S26.world'), ds = await cdp.eval('S26.doors')
        check(ds.length >= 2, `${L} walk ${step}: at least two doors`, `${ds.length} in ${w0.slug}`)
        const ids = await cdp.eval('S26.drawn'); let want = null, how = 'door'
        const deadHere = await cdp.eval('S26.drawn.filter(i => !S26.tapPoint(i))')
        check(!deadHere.length, `${L} walk ${step}: every facet of ${w0.slug} has a place of its own to touch`, `dead: ${deadHere.join(', ')}`)
        if (step % 2 === 1) {
          if (f === 'a') { const M = await cdp.eval('S26.matches'); seenM.push(M.real); if (M.at.length) { const i = M.at[step % M.at.length], seq0 = await cdp.eval('S26.seq'); await tapFacet(i); want = (await nextSeq(seq0)).to; how = 'facet'
              if (step === 1) { await waitFor(() => cdp.eval('S26.t > .35'), 'mid-crossing', 60).catch(() => {}); await shot(`26-a-through-${tag}.png`) } } }
          if (f === 'b') { const i = ids[(step * 5) % ids.length]; want = await cdp.eval(`S26.plan(${i})`); await tapFacet(i); how = 'facet' }
          if (f === 'c') { for (const i of ids) { const p = await cdp.eval(`S26.plan(${i})`); if (p.kind === 'line') { if (!(await tapFacet(i))) continue; await waitFor(() => cdp.eval('S26.turned && S26.turned.u >= 1'), 'turned', 40)
              if (step === 1) await shot(`26-c-back-${tag}.png`)
              const bp = await cdp.eval(`(() => { const b = document.querySelector('#back a').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2] })()`); want = p.to; await tap(...bp); how = 'facet'; break } } }
          if (f === 'd') { const i = ids[(step * 3) % ids.length]; want = await cdp.eval(`S26.plan(${i})`); await tapFacet(i); how = 'facet'
            if (step === 1) { await sleep(800); await shot(`26-d-lift-${tag}.png`) } }
          if (f === 'e') { for (const i of ids) { const p = await cdp.eval(`S26.plan(${i})`); if (p.door) { if (!(await tapFacet(i))) continue; await sleep(500); if (step === 1) await shot(`26-e-line-${tag}.png`); await tapFacet(i); want = p.door; how = 'facet'; break } } }
          if (f === 'f') { const c = await cdp.eval('S26.carried'); if (c.length && step % 4 === 3) { const i = c[0].i; want = c[0].key; if (step === 3) await shot(`26-f-carried-${tag}.png`); await tapFacet(i); how = 'facet' }
            else { await tapFacet(ids[(step * 5) % ids.length]); await sleep(300) } }
          if (f === 'b' && step === 1) { await waitFor(() => cdp.eval('S26.t > .35'), 'mid-crossing', 60).catch(() => {}); await shot(`26-b-through-${tag}.png`) }
        }
        if (!want) { const d = ds[(step * 7) % ds.length]; await waitDoorShown(d.k); const pt = await doorPoint(d.k); await tap(...pt); want = d.to; how = 'door' }
        moves[how]++
        await waitFor(() => cdp.eval(`S26.world.key === ${JSON.stringify(want)} && !S26.busy`), `walk ${step} landing`, 200).catch(() => {})
        const w = await cdp.eval('S26.world')
        check(w.key === want && w.imgOk, `${L} walk ${step}: a ${how} move lands where it promised`, `${w.key} vs ${want}`)
        if (w.key !== want) break
        keys.push(w.key)
        if (step === 2) { await sleep(1500); await shot(`26-${f}-world-${tag}.png`) }
      }
      check(new Set(keys).size >= Math.min(vp.walk, 8) - (f === 'f' ? Math.floor(vp.walk / 4) : 0), `${L}: ${keys.length} worlds walked (${moves.facet} by a facet, ${moves.door} by a door line)`, keys.join(' '))
      if (f === 'a') console.log(`     ${L}: real matches per world on the walk: ${seenM.join(', ')}`)
      check(moves.facet >= Math.min(2, Math.floor((vp.walk - 1) / 2)), `${L}: facets moved the walk`, JSON.stringify(moves))
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!tm, `${L}: nothing counts down`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // reduced motion: each variant still answers; a photo door and a lift land by a crossfade
  if (!SKIP_EXTRA) {
    await view(VIEWPORTS[0])
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    for (const f of FS) { errors.length = 0
      const key = await firstWorld(f); await openWorld(f, key); await cdp.eval('sessionStorage.clear()')
      const ids = await cdp.eval('S26.drawn'), i = ids[1], plan = await cdp.eval(`S26.plan(${i})`), seq0 = await cdp.eval('S26.seq')
      await tapFacet(i); const last = await nextSeq(seq0)
      check(last && last.i === i, `reduced motion f=${f}: the facet answers`, JSON.stringify(last))
      if (f === 'b' || f === 'd') { await settle(); const w = await cdp.eval('S26.world'); check(w.key === plan, `reduced motion f=${f}: lands`, `${w.key} vs ${plan}`) }
      check(errors.length === 0, `reduced motion f=${f}: no console errors`, errors.join(' | ')) }
    await cdp.send('Emulation.setEmulatedMedia', { features: [] })
  }
  console.log('shots: studies/26/shots/')
} catch (e) { failures++; console.log(e.stack); console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 26 the facets')
process.exit(failures ? 1 : 0)
