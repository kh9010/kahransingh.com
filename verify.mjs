// verify.mjs — node verify.mjs
// Pins the rulings for studies/ (house way: ~/dev/house/HANDOFF.md). Starts its own study server
// on a free port with a throwaway picks file, drives headless Chrome over the DevTools protocol
// (no dependencies), prints one PASS line per ruling, exits 1 on the first FAIL.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const ROOT = path.dirname(new URL(import.meta.url).pathname)
const S = p => path.join(ROOT, 'studies', p)
const read = p => fs.readFileSync(p, 'utf8')
const sleep = ms => new Promise(r => setTimeout(r, ms))
const checks = []
const check = (name, fn) => checks.push([name, fn])

const NOINDEX = /<meta name="robots" content="noindex, nofollow">/

check('studies are noindexed', () => {
  const pages = ['index.html', '01/index.html', '01/live.html', '02/live.html', '02/index.html']
  for (const p of pages) assert.match(read(S(p)), NOINDEX, `studies/${p} must carry the noindex meta`)
  assert.doesNotMatch(read(path.join(ROOT, 'robots.txt')), /Disallow:\s*\/studies/, 'no robots Disallow for studies: it hides the noindex')
  return `${pages.length} pages carry noindex, nofollow; robots.txt leaves them crawlable so the tag is read`
})

check('the rail matches the studies', () => {
  const dirs = fs.readdirSync(S('')).filter(d => /^\d\d$/.test(d)).sort()
  const rail = [...read(S('index.html')).matchAll(/<a href="(\d\d)\/"[^>]*data-n="(\d\d)"/g)].map(m => m[1])
  assert.deepEqual(rail, dirs.slice().reverse(), 'rail entries, newest first, must equal the numbered study folders')
  dirs.forEach((d, i) => { assert.equal(d, String(i + 1).padStart(2, '0'), 'studies are numbered 01..N'); assert(fs.existsSync(S(d + '/index.html')), d + ' must open') })
  assert.match(read(S('index.html')), new RegExp(`<iframe[^>]*src="${dirs.at(-1)}/"`), 'the rail opens on the newest study')
  assert.match(read(S('index.html')), new RegExp(`href="${dirs.at(-1)}/"[^>]*aria-current`), 'the newest entry is current')
  return `${dirs.length} study listed, opens on ${dirs.at(-1)}`
})

check('study 03: the board holds every keep in his words, four directions, all noindexed and on the rail', () => {
  const pages = ['index.html', 'a.html', 'b.html', 'c.html', 'd.html']
  for (const p of pages) assert.match(read(S('03/' + p)), NOINDEX, `studies/03/${p} must carry the noindex meta`)
  assert.match(read(S('index.html')), /<a href="03\/"[^>]*data-n="03"/, '03 is on the rail')
  const board = read(S('03/index.html')), esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  let n = 0
  for (const s of ['01', '02']) for (const [id, p] of Object.entries(JSON.parse(read(S(s + '/picks.json'))))) {
    if (p.v !== 'keep') continue; n++
    assert.match(board, new RegExp(`data-id="${id}"`), `kept ${id} (study ${s}) is on the board`)
    if (p.note) assert(board.includes(esc(p.note)), `kept ${id}: his note, verbatim, is on the board`)
  }
  for (const d of 'abcd') assert.match(board, new RegExp(`href="${d}.html"`), `the board links direction ${d}`)
  return `${n} keeps on the board with their notes verbatim; 4 directions linked; ${pages.length} pages noindexed`
})

check('no instruction text', () => {
  const html = read(S('01/index.html'))
  assert.doesNotMatch(html, /<p[\s>]/, 'no <p> in the study')
  const body = html.split('<body>')[1].split('<script>')[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = body.split(' ').filter(Boolean)
  assert(words.length < 40, 'the study chrome is labels only: ' + words.length + ' words')
  return `0 <p>; ${words.length} words of chrome, all labels`
})

let pile
check('the pile is whole', () => {
  pile = JSON.parse(read(S('01/pile.json')))
  const ids = new Set()
  for (const p of pile.items) {
    assert(p.id && p.url && p.name && p.source, 'every card has id, url, name, source')
    assert(/^[0-9a-f]{8}$/.test(p.id), 'ids are opaque hashes, never a name')
    assert(!ids.has(p.id), 'ids are unique'); ids.add(p.id)
    for (const k of ['.jpg', '.mp4']) assert(fs.existsSync(S('01/media/' + p.id + k)), 'media for ' + p.id + k)
    if (p.phone) { assert(/^phones-\d\d\.jpg$/.test(p.phone[0]) && fs.existsSync(S('01/media/' + p.phone[0])), 'phone sheet for ' + p.id); assert(p.phone[1] < p.phone[2], 'phone slot inside its sheet') }
  }
  assert(pile.items.length >= 80, 'at least 80 candidates survive')
  assert(Number.isInteger(pile.seed), 'the shuffle has a fixed seed')
  const bytes = fs.readdirSync(S('01/media')).reduce((a, f) => a + fs.statSync(S('01/media/' + f)).size, 0)
  const src = {}; pile.items.forEach(p => { src[p.source] = (src[p.source] || 0) + 1 })
  const files = fs.readdirSync(S('01/media')).length
  assert(files + 2 <= 511, 'media, page and pile fit the artifact file cap of 511')
  return `${pile.items.length} cards from ${Object.entries(src).map(([k, v]) => k + ' ' + v).join(', ')}; ${pile.items.filter(p => p.phone).length} with a phone still; media ${files} files, ${(bytes / 1e6).toFixed(1)} MB`
})

// ── browser checks ──
function chromePath() {
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright')
  const d = fs.readdirSync(base).filter(x => x.startsWith('chromium_headless_shell-')).sort().at(-1)
  return path.join(base, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
}
async function startServer(picksFile) {
  const p = spawn(process.execPath, [S('server.cjs')], { env: { ...process.env, PORT: '0', PICKS: picksFile } })
  const url = await new Promise((res, rej) => { p.stdout.on('data', d => { const m = /http:\/\/[^\s]+/.exec(String(d)); if (m) res(m[0]) }); p.on('exit', () => rej(new Error('server exited'))) })
  return { proc: p, base: url.replace(/\/studies\/$/, '') }
}
async function startChrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-chrome-'))
  // the two flags keep macOS from raising a keychain prompt at Kahran
  const p = spawn(chromePath(), ['--headless', '--use-mock-keychain', '--password-store=basic', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--autoplay-policy=no-user-gesture-required', '--window-size=1280,800', 'about:blank'])
  const ws = await new Promise((res, rej) => { let buf = ''; p.stderr.on('data', d => { buf += d; const m = /ws:\/\/[^\s]+/.exec(buf); if (m) res(m[0]) }); p.on('exit', () => rej(new Error('chrome exited'))) })
  const port = new URL(ws).port
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise(r => sock.addEventListener('open', r))
  let n = 0; const pending = new Map()
  const errors = []
  sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '))
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || '')) })
  const send = (method, params = {}) => new Promise(r => { const id = ++n; pending.set(id, r); sock.send(JSON.stringify({ id, method, params })) })
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text); return r.result?.result?.value }
  const key = async k => { const code = { ArrowRight: 39, ArrowLeft: 37 }[k] || k.toUpperCase().charCodeAt(0); for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, windowsVirtualKeyCode: code, text: type === 'keyDown' && k.length === 1 ? k : undefined }) }
  const go = async url => { await send('Page.enable'); await send('Page.navigate', { url }); for (let i = 0; i < 100; i++) { await sleep(100); if (await ev(`document.readyState === 'complete' && /\\d+ \\/ [1-9]/.test(document.querySelector('#count')?.textContent || '')`).catch(() => false)) return } throw new Error('page did not load ' + url) }
  // open a page fresh and collect what it throws or logs as an error
  const open = async url => { await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Page.navigate', { url: 'about:blank' }); await sleep(200); errors.length = 0; await send('Page.navigate', { url }); for (let i = 0; i < 100; i++) { await sleep(100); if (await ev(`document.readyState === 'complete'`).catch(() => false)) break } }
  return { ev, key, go, open, errors, close: () => { sock.close(); p.kill(); try { fs.rmSync(dir, { recursive: true, force: true }) } catch {} } }
}

let srv, chrome, picksFile
check('cards render blind', async () => {
  picksFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-picks-')), 'picks.json')
  fs.writeFileSync(picksFile, '{}')
  srv = await startServer(picksFile); chrome = await startChrome()
  await chrome.go(srv.base + '/studies/01/index.html')
  const dom = await chrome.ev(`(() => { const parts = []; for (const el of document.querySelectorAll('body *')) { if (el.tagName === 'SCRIPT') continue; for (const a of el.attributes) parts.push(a.value); if (!el.children.length) parts.push(el.textContent) } return parts.join(' \\n ').toLowerCase() })()`)
  const shown = (await chrome.ev(`document.querySelector('#clip').getAttribute('src')`)).slice(6, 14)
  const leaks = []
  for (const p of pile.items) {
    const host = p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '').toLowerCase()
    if (dom.includes(host)) leaks.push(host)
    // the card on screen: its name at any length; the rest of the pile: names long enough not to collide with labels
    if ((p.id === shown || p.name.length >= 5) && dom.includes(p.name.toLowerCase())) leaks.push(p.name)
  }
  assert.deepEqual(leaks, [], 'no name or address in the DOM before a verdict')
  const src = await chrome.ev(`document.querySelector('#clip').getAttribute('src')`)
  assert.match(src, /^media\/[0-9a-f]{8}\.mp4$/, 'the clip is addressed by an opaque id')
  return `${pile.items.length} names and addresses checked against the DOM, 0 present; the clip plays from ${src.replace(/[0-9a-f]{8}/, '<id>')}`
})

check('a pick round-trips to storage', async () => {
  const first = await chrome.ev(`document.querySelector('#clip').getAttribute('src').slice(6, 14)`)
  await chrome.key('ArrowRight'); await sleep(400)
  await chrome.key('1'); await sleep(400)
  let stored = JSON.parse(read(picksFile))
  assert.equal(stored[first]?.v, 'keep', 'keep is written to the picks file')
  assert.deepEqual(stored[first].tags, ['mechanical'], 'a tag on the kept card is written')
  const name = pile.items.find(p => p.id === first).name
  assert(await chrome.ev(`document.querySelector('#reveal').textContent.includes(${JSON.stringify(name)})`), 'the name is revealed after the verdict')
  await chrome.go(srv.base + '/studies/01/index.html')
  const count = await chrome.ev(`document.querySelector('#count').textContent`)
  assert.equal(count, `1 / ${pile.items.length}`, 'a reload resumes from storage')
  const now = await chrome.ev(`document.querySelector('#clip').getAttribute('src').slice(6, 14)`)
  assert.notEqual(now, first, 'the judged card does not come back')
  await chrome.key('z'); await sleep(400)
  stored = JSON.parse(read(picksFile))
  assert.equal(stored[first], undefined, 'undo removes the pick from storage')
  return `keep + tag written, name revealed after, reload resumes at 1 / ${pile.items.length}, undo deletes it`
})

check('the server keeps the picks file clean', async () => {
  const post = (body, headers = {}) => fetch(srv.base + '/api/study-01/pick', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }).then(r => r.status)
  const id = pile.items[0].id
  const codes = [
    await post({ id: 'deadbeef', rec: { v: 'keep', tags: [] } }),
    await post({ id, rec: { v: 'love', tags: [] } }),
    await post({ id, rec: { v: 'keep', tags: ['vibes'] } }),
    await post({ id, rec: { v: 'keep', tags: [], note: 'x'.repeat(501) } }),
    await post({ id, rec: { v: 'keep', tags: [] } }, { origin: 'https://evil.example' }),
  ]
  assert.deepEqual(codes, [400, 400, 400, 400, 403], 'unknown card, bad verdict, bad tag, long note refused; foreign origin 403')
  assert.equal(read(picksFile).trim(), '{}', 'refused writes leave the file untouched')
  return '4 malformed writes 400, foreign origin 403, file untouched'
})

check('live: notes do not fire shortcuts, a keep with a note round-trips, blocked sites get no iframe', async () => {
  fs.writeFileSync(picksFile, '{}')
  const L = srv.base + '/studies/01/'
  assert.match(await (await fetch(L)).text(), /id="site"/, '/studies/01/ serves live.html')
  await chrome.go(L)
  const cnt = () => chrome.ev(`document.querySelector('#count').textContent`)
  const id = () => chrome.ev(`document.body.dataset.id`)
  assert(await chrome.ev(`document.activeElement.id === 'note'`), 'the note field has focus on load')
  for (const c of 'jkxz1') await chrome.key(c)
  await sleep(300)
  assert.equal(await cnt(), `0 / ${pile.items.length}`, 'typing j k x z in the note triggers nothing')
  assert.equal(await chrome.ev(`document.querySelector('#note').value`), 'jkxz1', 'the letters land in the note')
  await chrome.ev(`document.querySelector('#note').value = 'a dictated sentence'`)
  const first = await id()
  await chrome.key('Enter'); await sleep(500)
  const rec = JSON.parse(read(picksFile))[first]
  assert.equal(rec?.v, 'keep', 'Enter in the note keeps'); assert.equal(rec.note, 'a dictated sentence', 'the note is saved with it')
  await chrome.go(L); assert.equal(await cnt(), `1 / ${pile.items.length}`, 'a reload resumes')
  let sawBlocked = false, sawFramed = false
  for (let i = 0; i < 30 && !(sawBlocked && sawFramed); i++) {
    const cid = await id(), c = pile.items.find(p => p.id === cid), has = await chrome.ev(`!document.querySelector('#site').hidden && !!document.querySelector('#site').getAttribute('src')`)
    assert.equal(has, c.frames !== false, 'iframe present exactly when the site allows frames')
    c.frames === false ? sawBlocked = true : sawFramed = true
    await chrome.ev(`document.querySelector('#skip').click()`); await sleep(150)
  }
  assert(sawBlocked && sawFramed, 'saw one blocked and one framed card')
  return 'note typing inert, Enter keeps with its note, resume works, blocked cards get no iframe'
})

check('study 04: three gems, noindexed, on the rail, each loads clean with his content on its faces', async () => {
  const pages = ['index.html', 'a.html', 'b.html', 'c.html']
  for (const p of pages) assert.match(read(S('04/' + p)), NOINDEX, `studies/04/${p} must carry the noindex meta`)
  assert.match(read(S('index.html')), /<a href="04\/"[^>]*data-n="04"/, '04 is on the rail')
  // each take: no exception or console error, the floor is there, and the faces carry real content
  const filled = { 'a.html': `typeof items !== 'undefined' && items.length >= 17 && !!document.querySelector('canvas')`,
    'b.html': `typeof dealt !== 'undefined' && dealt >= 80 && face.some(f => f.kind === 'photo') && face.some(f => f.kind === 'poem')`,
    'c.html': `document.querySelectorAll('.cube .f').length === 6 && document.querySelectorAll('.cube video').length === 2 && !!document.querySelector('.cube img')` }
  const out = []
  for (const p of ['a.html', 'b.html', 'c.html']) {
    await chrome.open(srv.base + '/studies/04/' + p)
    let ok = false; for (let i = 0; i < 80 && !ok; i++) { await sleep(100); ok = await chrome.ev(filled[p]).catch(() => false) }
    await sleep(800)
    assert(ok, `04/${p}: the faces are filled from his real content`)
    assert.deepEqual(chrome.errors.filter(e => !/favicon|api\.open-meteo\.com/.test(e)) /* the live sky is allowed to be down: shared.js falls back */, [], `04/${p} loads without console errors`)
    assert(await chrome.ev(`/kahran singh/.test(document.querySelector('h1')?.textContent) && ['/poetry.html', '/photography.html', '/context/'].every(h => document.querySelector('header a[href="' + h + '"]')) && /^draws on: .+ · his words: “/.test(document.querySelector('.cap').textContent)`), `04/${p}: name, the way in to poems, photographs and tools, and the draws-on caption`)
    out.push(p[0])
  }
  return `${pages.length} pages noindexed; on the rail; ${out.join(', ')} load with 0 console errors, faces filled, floor and caption present`
})

check('study 05: four beautiful gems, noindexed, on the rail, each loads clean', async () => {
  const pages = ['index.html', 'a.html', 'b.html', 'c.html', 'd.html']
  for (const p of pages) assert.match(read(S('05/' + p)), NOINDEX, `studies/05/${p} must carry the noindex meta`)
  assert.match(read(S('index.html')), /<a href="05\/"[^>]*data-n="05"/, '05 is on the rail')
  for (const p of pages.slice(1)) {
    await chrome.open(srv.base + '/studies/05/' + p); await sleep(3000)
    assert.deepEqual(chrome.errors.filter(e => !/favicon|api\.open-meteo\.com/.test(e)), [], `05/${p} loads without console errors`)
  }
  return `${pages.length} pages noindexed; on the rail; a–d load with 0 console errors`
})

let failed = false
for (const [name, fn] of checks) {
  try { console.log(`PASS ${name}: ${await fn()}`) }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed = true; break }
}
chrome?.close(); srv?.proc.kill()
process.exit(failed ? 1 : 0)
