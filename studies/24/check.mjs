#!/usr/bin/env node
// Study 24 check: the walk. In headless Chrome at 1440x900 (mouse) and 390x844 (touch), for each ?vocab= (pairs, questions, nouns, his):
//   home is today's stone: its photograph across the facets, its poem broken across at least three, the way out there, nothing counts down;
//   a press let go early springs back (desktop); a press goes in, to the world the press promised;
//   then a walk of WALK worlds (10 on desktop, 3 on the phone), each entered by a door line and crossed through the gem:
//     every world's poem arrives line by line with the door lines last; every world has at least two doors, and every door leads to a
//     poem and a photograph not yet on the trail (no dead end, no loop back); every door is a verbatim phrase of a line of its poem, and
//     that line is the poem's own line, as written in v2/data.json; the crossing lands in the door's world; no bare black mid-move;
//   no console errors.
// ?name=: never shows the idea nowhere; crossing shows it only while crossing; door sets it beside each door line.
// Reduced motion: the press and the door both land by a calm crossfade, the poem whole at once.
// No dial shadows a page CSS variable.
// Screenshots: studies/24/shots/ (desktop + phone, home, mid-crossing, a world).
// Run: node studies/24/check.mjs   (VOCABS=his WALK=4 to narrow; non-zero exit on any failure)
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
const WALK = +(process.env.WALK || 10), PHONE_WALK = +(process.env.PHONE_WALK || 3)
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false, walk: WALK }, { w: 390, h: 844, mobile: true, walk: PHONE_WALK }].filter(v => !process.env.ONLY_VP || process.env.ONLY_VP === (v.mobile ? 'phone' : 'desk'))
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
  await waitFor(() => fetch(`${BASE}/studies/24/index.html`).then(r => r.ok), 'static server')
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
    await cdp.send('Page.navigate', { url: `${BASE}/studies/24/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S24.world`), 'page ' + q, 300)
    await sleep(500) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  // while it moves: never bare black (20's mid-move gaps), and the idea's name only where ?name= allows it
  const watchMove = async (label, want) => { let worstBare = 0, ideaMax = 0, ideaText = '', midShot = false, before = want.before ?? 0
    for (let i = 0; i < 120; i++) { const s = await cdp.eval(`({ at: S24.at, busy: S24.busy, t: S24.t, r: S24.read(), idea: +getComputedStyle(document.getElementById('idea')).opacity, it: document.getElementById('idea').textContent })`)
      if (!s.busy && s.at === 'world') break
      worstBare = Math.max(worstBare, s.r.bare); if (s.idea > ideaMax) { ideaMax = s.idea; ideaText = s.it }
      if (want.shot && !midShot && s.t > .3) { midShot = true; await shot(want.shot) }
      await sleep(50) }
    await sleep(200); const after = (await cdp.eval('S24.read()')).bare, rest = Math.max(before, after)
    check(worstBare <= rest + .15, // dark photographs, magnified by the lens, move this too; the gap the check is for reads as most of the screen
      `${label}: no bare black mid-move`, `worst ${worstBare.toFixed(3)} of the screen near-black mid-move, ${before.toFixed(3)} before, ${after.toFixed(3)} after`)
    return { ideaMax, ideaText } }
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S24.at, busy: S24.busy, arrived: S24.world.arrived, lines: S24.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const plainHidden = s.lines.filter(l => !l.door && !l.shown).length, doorsShown = s.lines.filter(l => l.door && l.shown).length
        if (doorsShown > 0 && plainHidden > 0) bad = { plainHidden, doorsShown }
        if (s.arrived) break }
      await sleep(50) }
    check(!bad, `${label}: the poem arrives line by line, doors last`, bad && JSON.stringify(bad))
    check(last && last.arrived && last.lines.every(l => l.shown), `${label}: the whole poem arrives`, JSON.stringify(last && last.lines.filter(l => !l.shown).length)) }
  const landedIn = async (label, want) => {
    await waitFor(() => cdp.eval(`S24.at === 'world' && !S24.busy`), label + ' landing', 200).catch(e => { throw new Error(e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) })
    const s = await cdp.eval(`({ w: S24.world, verses: document.querySelectorAll('.verse').length, h2: document.querySelector('.verse h2').textContent })`)
    check(s.verses === 1, `${label}: one world on screen`, `${s.verses} poems laid out`)
    check(s.w.key === want, `${label}: landed in the promised world`, `${s.w.key} vs ${want}`)
    check(s.w.imgOk && s.h2 === s.w.title, `${label}: its photograph and poem are there`, JSON.stringify(s))
    return s.w }
  const doorsHold = async (label, trail, name) => {
    const ds = await cdp.eval('S24.doors'), w = await cdp.eval('S24.world'), lines = linesOf(w.slug)
    const seenP = new Set(trail.map(k => k.split('~')[0])), seenF = new Set(trail.map(k => k.split('~')[1]))
    check(ds.length >= 2, `${label}: at least two doors`, `${ds.length} in ${w.slug}`)
    const ahead = ds.filter(d => !seenP.has(d.to.split('~')[0]) && !seenF.has(d.to.split('~')[1]))
    check(ahead.length === ds.length && ahead.length >= 2, `${label}: every door leads somewhere not yet walked`, JSON.stringify(ds.map(d => d.to)))
    check(new Set(ds.map(d => d.to.split('~')[0])).size === ds.length, `${label}: the doors lead to different poems`)
    for (const d of ds) { const line = name === 'door' ? d.line.slice(0, d.line.length - d.word.length) : d.line
      check(d.text === d.phrase && line.includes(d.phrase) && lines.includes(line), `${label}: "${d.phrase}" is verbatim in its line, and the line is the poem's`, JSON.stringify({ text: d.text, line })) }
    return ds }

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const vocab of VOCABS) {
      errors.length = 0
      const L = `${vocab} ${tag}`, rep = report[L] = { worlds: [], how: {} }
      await open('vocab=' + vocab)
      const home = await cdp.eval(`(() => { const nav = [...document.querySelectorAll('header nav a')].filter(a => a.getBoundingClientRect().width > 0).map(a => a.getAttribute('href'))
        const text = document.body.innerText.replace(document.getElementById('where').innerText, '')
        return { at: S24.at, facets: S24.facets, broken: S24.broken, w: S24.world, nav, vocab: S24.vocab,
          timer: /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') } })()`)
      check(home.at === 'stone' && home.facets >= 10 && home.vocab === vocab, `${L}: today's stone is cut`, JSON.stringify(home))
      check(home.w.imgOk, `${L}: today's photograph is on the stone`)
      check(home.broken >= 3, `${L}: today's poem is broken across the stone`, `${home.broken} facets`)
      check(['/about.html', '/photography.html', '/poetry.html'].every(h => home.nav.includes(h)), `${L}: the way out is there`, home.nav.join(' '))
      check(!home.timer, `${L}: nothing counts down`)
      await shot(`24-${vocab}-home-${tag}.png`)
      const pt = [vp.w * .3, vp.h * .3]
      if (!vp.mobile) { await press(...pt); await sleep(450); await release(...pt); await sleep(900)
        const s = await cdp.eval(`({ at: S24.at, busy: S24.busy, verses: document.querySelectorAll('.verse').length })`)
        check(s.at === 'stone' && !s.busy && s.verses === 1, `${L}: a press let go early springs back`, JSON.stringify(s)) }
      const bare0 = (await cdp.eval('S24.read()')).bare
      await tap(...pt)
      const want0 = await waitFor(() => cdp.eval('S24.expect'), 'press target')
      await watchMove(`${L} press`, { before: bare0 })
      let trail = [home.w.key, want0]
      await watchArrival(`${L} world 1`); let w = await landedIn(`${L} world 1`, want0)
      for (let i = 1; i <= vp.walk; i++) {
        const ds = await doorsHold(`${L} world ${i}`, trail, 'crossing')
        ds.forEach(d => { rep.how[d.how] = (rep.how[d.how] || 0) + 1 })
        rep.worlds.push(`${w.slug} [${ds.map(d => d.word).join(' | ')}]`)
        if (i === 2) { await sleep(1200); await shot(`24-${vocab}-world-${tag}.png`) }
        if (i === vp.walk) break
        const d = ds[(i * 7 + vocab.length) % ds.length]
        await cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.textContent === ${JSON.stringify(d.text)}); a.scrollIntoView({ block: 'nearest' }) })()`); await sleep(120)
        const box = (await cdp.eval('S24.doors')).find(x => x.k === d.k).box, x = box[0] + box[2] / 2, y = box[1] + box[3] / 2
        const bare1 = (await cdp.eval('S24.read()')).bare
        await tap(x, y); await sleep(60); await tap(x, y)
        const seen = await watchMove(`${L} crossing ${i}`, { before: bare1, shot: i === 1 || process.env.SHOT_ALL ? `24-${vocab}-through${i > 1 ? i : ""}-${tag}.png` : null })
        check(seen.ideaMax > .3 && seen.ideaText === d.word, `${L} crossing ${i}: the idea is named while crossing (?name=crossing)`, JSON.stringify(seen))
        await watchArrival(`${L} world ${i + 1}`); w = await landedIn(`${L} world ${i + 1}`, d.to)
        if (w.key !== d.to) break // a missed crossing would only cascade
        check(await cdp.eval(`+getComputedStyle(document.getElementById('idea')).opacity`) < .02, `${L} world ${i + 1}: at rest the idea is not named`)
        trail.push(d.to)
      }
      check(new Set(trail.map(k => k.split('~')[0])).size === trail.length, `${L}: ${trail.length} worlds, no poem twice`, trail.join(' '))
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // ?name=never and ?name=door, one crossing each
  await view(VIEWPORTS[0])
  for (const name of SKIP_EXTRA ? [] : ['never', 'door']) {
    errors.length = 0
    await open(`vocab=his&name=${name}`)
    await tap(500, 300); const want = await waitFor(() => cdp.eval('S24.expect'), 'press'); await watchArrival(`name=${name}`); await landedIn(`name=${name}`, want)
    const s = await cdp.eval(`({ tags: [...document.querySelectorAll('.verse .tag')].map(t => t.textContent), words: S24.doors.map(d => d.word) })`)
    await sleep(1200); await shot(`24-name-${name}-1440x900.png`)
    if (name === 'door') check(s.tags.length === s.words.length && s.tags.every((t, i) => t === s.words[i]), `name=door: each door line carries its idea beside it`, JSON.stringify(s))
    else check(s.tags.length === 0, `name=never: no door carries its idea`, JSON.stringify(s))
    await doorsHold(`name=${name}`, [], name)
    const box = (await cdp.eval('S24.doors'))[0].box, before = (await cdp.eval('S24.read()')).bare; await tap(box[0] + box[2] / 2, box[1] + box[3] / 2)
    const seen = await watchMove(`name=${name} crossing`, { before })
    check(seen.ideaMax < .02, `name=${name}: the crossing does not name the idea`, JSON.stringify(seen))
    await sleep(300); check(errors.length === 0, `name=${name}: no console errors`, errors.join(' | '))
  }

  // reduced motion: the press and the door land by a calm crossfade, the poem whole at once
  if (!SKIP_EXTRA) {
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  errors.length = 0
  await open('vocab=his')
  await tap(500, 300); const want = await waitFor(() => cdp.eval('S24.expect'), 'press')
  await landedIn('reduced motion press', want)
  check(await cdp.eval(`S24.lines.every(l => l.shown && l.a === 1)`), 'reduced motion: the poem is there at once')
  const d = (await cdp.eval('S24.doors'))[0]; await tap(d.box[0] + d.box[2] / 2, d.box[1] + d.box[3] / 2)
  await landedIn('reduced motion door', d.to)
  check(errors.length === 0, 'reduced motion: no console errors', errors.join(' | '))
  await cdp.send('Emulation.setEmulatedMedia', { features: [] })
  }

  for (const [k, v] of Object.entries(report)) console.log(`walk ${k}: door targets by ${JSON.stringify(v.how)}\n  ` + v.worlds.join('\n  '))
  console.log('shots: studies/24/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : '\nPASS study 24 the walk')
process.exit(failures ? 1 : 0)
