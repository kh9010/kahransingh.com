#!/usr/bin/env node
// verify.mjs — the checks that pin this site's rulings, one PASS line each.
// The expected block lives in HANDOFF.md under Verification.
//
// Run: node verify.mjs            (exits 1 on the first FAIL, naming it)
// Needs python3 and, for the home-page ruling, Chrome for Testing's headless
// shell under ~/.cache/puppeteer (tools/test_photo_stays.mjs says how).

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = path.join(ROOT, "tools");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}

function checkNow(name, fn) {
  let msg;
  try { msg = fn(); } catch (e) { console.log(`FAIL ${name}: ${e.message}`); process.exit(1); }
  console.log(`PASS ${name}: ${msg}`);
}

function unittest(mod) {
  const r = run("python3", ["-m", "unittest", mod], TOOLS);
  const ran = /Ran (\d+) tests?/.exec(r.out);
  if (!r.ok || !ran) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return `${ran[1]} tests`;
}

checkNow("daily pick follows the weather, then the archive, then the date hash", () => unittest("test_daily_pick"));
checkNow("place feed", () => unittest("test_place_feed"));
checkNow("adding photographs", () => unittest("test_add_photos"));
checkNow("About and Photos entry points", () => unittest("test_about_photos"));
checkNow("Lately feed layer", () => unittest("test_lately_feed"));

checkNow("pick.js agrees with daily_pick.py", () => {
  const r = run("node", ["tools/test_pick_js.mjs"], ROOT);
  if (!r.ok) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return r.out.trim().split("\n").pop();
});

checkNow("the photography walk goes on under a resting pointer and holds under a moving one", () => {
  const r = run("node", ["tools/test_photo_autoscroll.mjs"], ROOT);
  const oks = (r.out.match(/^ok /gm) || []).length;
  if (!r.ok) throw new Error(r.out.trim().split("\n").filter((l) => l.startsWith("FAIL")).join(" | ") || r.out.trim());
  return `${oks} checks at 1200x800`;
});

checkNow("the photograph never re-crops when the poem comes forward", () => {
  const r = run("node", ["tools/test_photo_stays.mjs"], ROOT);
  const oks = (r.out.match(/^ok /gm) || []).length;
  if (!r.ok) throw new Error(r.out.trim().split("\n").filter((l) => l.startsWith("FAIL")).join(" | ") || r.out.trim());
  return `${oks} checks at 1200x800`;
});

// ── studies rail checks (this branch): run after the site checks above, in one async pass ──
// Starts its own study server on a free port with a throwaway picks file, drives headless Chrome over the DevTools protocol.
import fs from 'node:fs'
import os from 'node:os'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const S = p => path.join(ROOT, 'studies', p)
const read = p => fs.readFileSync(p, 'utf8')
const sleep = ms => new Promise(r => setTimeout(r, ms))
const checks = []
const check = (name, fn) => checks.push([name, fn])
// the study 01 clips are gitignored third-party media that live on one machine; where they are absent, say so and go on
const NO_MEDIA = !fs.existsSync(S('01/media')) && 'studies/01/media is not on this machine (it lives in the MacBook worktree)'
const skipIf = (why, name, fn) => checks.push([name, fn, why])

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

const pile = JSON.parse(read(S('01/pile.json')))
skipIf(NO_MEDIA, 'the pile is whole', () => {
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
  // a Playwright cache can exist with its headless shell garbage-collected away, so fall back on either
  const d = fs.existsSync(base) && fs.readdirSync(base).filter(x => x.startsWith('chromium_headless_shell-')).sort().at(-1)
  if (d) return path.join(base, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
  // Chrome for Testing's headless shell, as tools/test_photo_stays.mjs finds it
  const cft = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell')
  return path.join(cft, fs.readdirSync(cft).sort().at(-1), 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
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
async function boot() { // one server and one browser for every check below, started by whichever runs first
  if (srv) return
  picksFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-picks-')), 'picks.json')
  fs.writeFileSync(picksFile, '{}')
  srv = await startServer(picksFile); chrome = await startChrome()
}
skipIf(NO_MEDIA, 'cards render blind', async () => {
  await boot()
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

skipIf(NO_MEDIA, 'a pick round-trips to storage', async () => {
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
    await chrome.open(srv.base + "/studies/05/" + p); await sleep(5000) // past S03.load: up to 3 s for the sky, then paint
    assert.deepEqual(chrome.errors.filter(e => !/favicon|api\.open-meteo\.com/.test(e)), [], `05/${p} loads without console errors`)
  }
  return `${pages.length} pages noindexed; on the rail; a–d load with 0 console errors`
})

let failed = false
// ── Studies 09–12 (2026-10-27): the About desk, Keeping track, a nav for the home, the walk with dials ──
const IDEAS_SRC = read(path.join(ROOT, 'v2/home.js'))
const ideaParts = name => JSON.parse(new RegExp(`name:\\s*'${name}'[\\s\\S]*?parts:\\s*(\\[[^\\]]*\\])`).exec(IDEAS_SRC)[1].replace(/'/g, '"'))
const plain = h => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim()

check('study 09: every line on the desk is a verbatim draft from 06, 07 or 08, the preview is the picks, and a rebuild changes nothing', () => {
  const lines = JSON.parse(read(S('09/lines.json')))
  const src = Object.fromEntries(['06', '07', '08'].map(n => [n, plain(/<main>([\s\S]*?)<\/main>/.exec(read(S(n + '/index.html')))[1])]))
  let options = 0
  for (const l of lines) for (const o of l.options) {
    for (const piece of plain(o.html).split(/(?<=\.)\s+(?=[A-Z0-9])/)) assert(src[o.from].includes(piece), `line ${l.id}: "${piece.slice(0, 50)}…" is not in study ${o.from}`)
    options++
  }
  const picks = JSON.parse(read(S('09/picks.json')))
  const html = read(S('09/index.html')), preview = plain(/<aside class="preview">([\s\S]*?)<\/aside>/.exec(html)[1])
  let picked = 0
  for (const l of lines) {
    const p = picks[l.id]; if (!p) continue
    const t = typeof p.edit === 'string' ? p.edit : plain(l.options[p.i].html)
    assert(preview.includes(t.replace(/\s+/g, ' ').trim()), `line ${l.id}: the picked text is not in the preview`); picked++
  }
  const before = read(S('09/index.html')) + read(S('09/about-draft.html')) + read(S('09/lines.json'))
  const r = spawnSync(process.execPath, [S('09/build.mjs'), '--about'], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr)
  assert.equal(read(S('09/index.html')) + read(S('09/about-draft.html')) + read(S('09/lines.json')), before, 'the committed desk is the build of the committed picks')
  return `${lines.length} lines, ${options} options all verbatim; ${picked} picked and present in the preview and about-draft; rebuild is a no-op`
})

check('study 09: the desk server takes a pick, refuses a malformed one and a foreign origin, and the file stays clean', async () => {
  const tmp = path.join(os.tmpdir(), 'ks-desk-' + process.pid + '.json'); fs.writeFileSync(tmp, '{}\n')
  const srv = spawn(process.execPath, [S('server.cjs')], { env: { ...process.env, PORT: '0', PICKS: tmp }, stdio: ['ignore', 'pipe', 'ignore'] })
  try {
    const port = await new Promise(res => srv.stdout.on('data', d => { const m = /:(\d+)\//.exec(String(d)); if (m) res(+m[1]) }))
    const post = (body, origin) => fetch(`http://127.0.0.1:${port}/api/study-09/pick`, { method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body })
    assert.equal((await post(JSON.stringify({ line: 'opening', pick: { from: '06', i: 1 } }))).status, 204)
    assert.equal((await post(JSON.stringify({ line: 'close', pick: { edit: 'Write to me.' } }))).status, 204)
    assert.deepEqual(JSON.parse(read(tmp)), { opening: { from: '06', i: 1 }, close: { edit: 'Write to me.' } })
    const bad = ['{nope', JSON.stringify({ line: 'nope', pick: null }), JSON.stringify({ line: 'opening', pick: { from: '06', i: 9 } }), JSON.stringify({ line: 'opening', pick: { from: '08', i: 1 } }), JSON.stringify({ line: 'years', pick: { edit: 'x' } }), JSON.stringify({ line: 'close', pick: { edit: 'x'.repeat(2001) } })]
    for (const b of bad) assert.equal((await post(b)).status, 400, 'refused: ' + b.slice(0, 40))
    assert.equal((await post(JSON.stringify({ line: 'opening', pick: null }), 'http://evil.example')).status, 403)
    assert.deepEqual(JSON.parse(read(tmp)), { opening: { from: '06', i: 1 }, close: { edit: 'Write to me.' } }, 'nothing refused reached the file')
    assert.equal((await post(JSON.stringify({ line: 'opening', pick: null }))).status, 204)
    assert.deepEqual(JSON.parse(read(tmp)), { close: { edit: 'Write to me.' } })
    assert.equal(read(S('09/index.html')).length > 0 && fs.statSync(S('09/index.html')).mtimeMs < Date.now(), true)
    return `2 picks and a clear written, ${bad.length} malformed writes 400, foreign origin 403, file untouched by them`
  } finally { srv.kill(); fs.rmSync(tmp, { force: true }) }
})

check('study 10: Keeping track is a mechanism page like /context/: same meta set, no script, the four tools it was cut against, each still a Keeping track part by name, no place and no person', () => {
  const ctx = read(path.join(ROOT, 'context/index.html')), s10 = read(S('10/index.html'))
  for (const re of [/<title>[^<]+ — Kahran Singh<\/title>/, /<meta name="description" content="[^"]{40,}">/, /<link rel="canonical" href="https:\/\/kahransingh\.com\/[a-z-]+\/">/, /<meta name="theme-color" content="#fafaf8"/, /<meta name="theme-color" content="#171613"/, /<meta property="og:title"/, /<meta property="og:description"/, /<meta property="og:type" content="article">/, /<meta property="og:url"/, /<meta property="og:image"/, /<meta name="twitter:card" content="summary_large_image">/, /<meta name="twitter:title"/, /<meta name="twitter:description"/, /<meta name="twitter:image"/])
    assert(re.test(ctx) && re.test(s10), 'both pages carry ' + re.source.slice(0, 40))
  assert.match(s10, NOINDEX, 'a study is noindexed')
  assert.doesNotMatch(s10, /<script/, 'no JS on a mechanism page')
  // Study 10 was cut against the five-idea wall (four Keeping track tools); the six-idea re-cut
  // (2026-10-27) added meeting follow-ups (and a groomer, retired again 2026-10-28). A study stays as it was drawn, so its
  // sections must still be Keeping track parts by name, in IDEAS order, not all of them.
  const parts = ideaParts('Keeping track'), h2s = [...s10.matchAll(/<h2 id="h-[a-z]+">([^<]+)<\/h2>/g)].map(m => m[1])
  assert.deepEqual(h2s, parts.filter(p => h2s.includes(p)), 'the sections are IDEAS parts, by name and in order')
  assert.equal(h2s.length, 4, 'the study holds the four tools it was cut against')
  const text = plain(/<body>([\s\S]*)<\/body>/.exec(s10)[1])
  for (const place of ['New York', 'Bangalore', 'Seattle', 'Manhattan', 'Provincetown', 'Jaisalmer', 'Telluride', 'Boulder']) assert(!text.includes(place), 'never a location: ' + place)
  const PUBLIC = ['index.html', 'context/index.html', 'about.html', 'cv.html', 'v2/home.js'].map(f => read(path.join(ROOT, f))).join(' ').replace(/<[^>]+>/g, ' ').toLowerCase()
  const dict = new Set(read('/usr/share/dict/words').split('\n').map(w => w.toLowerCase()))
  let names = 0
  for (const m of text.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) { const w = m[1].toLowerCase(); if (dict.has(w) || dict.has(w.replace(/s$/, ''))) continue; assert(PUBLIC.includes(m[1].toLowerCase()), `names "${m[1]}", which no public page does`); names++ }
  return `14 meta rules shared with /context/, 0 scripts, sections ${h2s.join(' · ')}, ${names} proper names all already public, 0 places`
})

check('study 11: the home with the eight-word nav, in about.html\'s order, and the photograph still never re-crops', () => {
  const nav = h => [...(/<nav[^>]*class="rail-nav"[\s\S]*?<\/nav>|<nav>[\s\S]*?<\/nav>/.exec(h) || [''])[0].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(m => m[1] + ' ' + m[2]).filter(x => !/nav-name|v1\//.test(x) && !x.endsWith(' kahran'))
  const want = nav(read(path.join(ROOT, 'about.html'))).filter(x => !x.startsWith('/v1/')), got = nav(read(S('11/index.html')))
  assert.deepEqual(got, want, 'the study nav is about.html\'s nav')
  assert.equal(got.length, 8)
  const r = spawnSync(process.execPath, ['tools/test_photo_stays.mjs'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PAGE: '/studies/11/' } })
  const oks = (r.stdout.match(/^ok /gm) || []).length
  assert.equal(r.status, 0, (r.stdout + r.stderr).split('\n').filter(l => l.startsWith('FAIL')).join(' | '))
  return `8 links in about.html's order; photograph ruling ${oks} checks at 1200x800 on the study`
})

check('study 12: the walk reads its numbers from the dials and pictures take their room before they load', () => {
  const h = read(S('12/index.html')), d = JSON.parse(read(S('12/defaults.json')))
  for (const k of ['start-ms', 'hold-ms', 'pace-ms-per-px', 'pace-cap-ms', 'manual-pause-ms', 'hover-still-ms']) assert(k in d, 'dial ' + k)
  const script = h.slice(h.lastIndexOf('const allPhotos'))
  assert.doesNotMatch(script, /\}, \d{4,5}\);/, 'no timer literal left in the walk')
  assert.doesNotMatch(script, /HOVER_STILL_MS = \d/, 'the hover let-go is a dial')
  assert.doesNotMatch(script, /\* 8, 8000\)/, 'the pace is a dial')
  const r = spawnSync(process.execPath, ['tools/test_photo_autoscroll.mjs'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PAGE: '/studies/12/', STABLE_HEIGHT: '1' } })
  const oks = (r.stdout.match(/^ok /gm) || []).length
  assert.equal(r.status, 0, (r.stdout + r.stderr).split('\n').filter(l => l.startsWith('FAIL')).join(' | '))
  return `${Object.keys(d).length} dials, 0 timing literals in the script; walk + height ruling ${oks} checks at 1200x800`
})

for (const [name, fn, skip] of checks) {
  if (skip) { console.log(`SKIP ${name}: ${skip}`); continue }
  try { await boot(); console.log(`PASS ${name}: ${await fn()}`) }
  catch (e) { console.log(`FAIL ${name}: ${e.message}`); failed = true; break }
}
chrome?.close(); srv?.proc.kill()
if (failed) process.exit(1)

// ── About studies (studies/06–08): the rulings of 2026-10-26; run after the studies pass above ──
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";

const STUDIES = readdirSync(path.join(ROOT, "studies")).filter((d) => /^\d\d$/.test(d)).sort();
const SINCE06 = STUDIES.filter((n) => n >= "06"); // 01–05 are the inspiration and gem studies, checked above
const ABOUT = ["06", "07", "08"];                      // the About pages proper; 09 is their desk
const TUNED = SINCE06.filter((n) => n !== "10");       // 10 is a mechanism page like /context/: no JS, so no ?tune (its dials arrive with its promotion)
const studyHtml = (n) => readFileSync(path.join(ROOT, "studies", n, "index.html"), "utf8");

checkNow("the rail matches the studies and opens on the newest", () => {
  const rail = readFileSync(path.join(ROOT, "studies", "index.html"), "utf8");
  const listed = [...rail.matchAll(/data-n="(\d\d)"/g)].map((m) => m[1]);
  if (listed.join() !== [...STUDIES].reverse().join()) throw new Error(`rail lists ${listed.join(",")}, studies on disk ${STUDIES.join(",")}`);
  const opens = /<iframe[^>]+src="(\d\d)\/"/.exec(rail)?.[1];
  if (opens !== STUDIES.at(-1)) throw new Error(`opens on ${opens}, newest is ${STUDIES.at(-1)}`);
  if (!/aria-current="page" data-n="(\d\d)"/.test(rail) || /aria-current="page" data-n="(\d\d)"/.exec(rail)[1] !== opens) throw new Error("current entry is not the one that opens");
  for (const n of STUDIES) if (!existsSync(path.join(ROOT, "studies", n, "index.html"))) throw new Error(`studies/${n}/index.html missing`);
  return `${STUDIES.length} studies (${STUDIES.join(", ")}), opens on ${opens}`;
});

checkNow("a study is a site page: noindex, title, description, the site nav with about current, and it reads without JS", () => {
  let words = 0;
  for (const n of ABOUT) {
    const h = studyHtml(n);
    for (const [label, re] of [["noindex", /<meta name="robots" content="noindex, nofollow">/], ["title", /<title>About — Kahran Singh<\/title>/], ["description", /<meta name="description" content="[^"]{20,}">/], ["site stylesheet", /href="\/style\.css"/], ["nav with about current", /<a href="\/about\.html" class="active" aria-current="page">about<\/a>/], ["mobile header", /class="mobile-header"/]])
      if (!re.test(h)) throw new Error(`study ${n} lacks ${label}`);
    const main = /<main>([\s\S]*?)<\/main>/.exec(h)?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.split(" ").length < 120) throw new Error(`study ${n}: main holds ${text.split(" ").length} words of static text; the page must read without JS`);
    words += text.split(" ").length;
  }
  return `${ABOUT.length} pages, ${words} words of static copy`;
});

checkNow("no instruction text and nothing a mock would not carry", () => {
  const banned = /\b(click|tap|hover|scroll|swipe|proposed|study|placeholder|lorem|todo|tbd)\b/i;
  for (const n of SINCE06) {
    const main = /<main>([\s\S]*?)<\/main>/.exec(studyHtml(n))?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ");
    const m = banned.exec(text);
    if (m) throw new Error(`study ${n} says "${m[0]}"`);
  }
  return `${SINCE06.length} pages, 0 hits`;
});

checkNow("every name and year on a study is already on the site", () => {
  // Public-safe by construction: a study may only say what the public pages already say.
  const PUBLIC = ["cv.html", "projects.html", "working-with-me.html", "speaking.html", "archive.html", "poetry.html", "photography.html", "index.html", "v1/index.html", "wedding-celebration.html", "elopement/index.html", "context/index.html", "v2/home.js", "v2/data.json"];
  const corpus = PUBLIC.map((f) => readFileSync(path.join(ROOT, f), "utf8")).join(" ").replace(/<[^>]+>/g, " ").toLowerCase();
  const dict = new Set(readFileSync("/usr/share/dict/words", "utf8").split("\n").map((w) => w.toLowerCase()));
  let names = 0, years = 0;
  for (const n of SINCE06) {
    const main = /<main>([\s\S]*?)<\/main>/.exec(studyHtml(n))?.[1] || "";
    const text = main.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
    for (const m of text.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) {
      const w = m[1];
      if (dict.has(w.toLowerCase())) continue; // plain English, capitalised by position
      if (!corpus.includes(w.toLowerCase())) throw new Error(`study ${n} names "${w}", which no public page does`);
      names++;
    }
    for (const m of text.matchAll(/\b(19|20)\d\d\b/g)) {
      if (!corpus.includes(m[0])) throw new Error(`study ${n} says ${m[0]}, a year no public page carries`);
      years++;
    }
  }
  return `${names} names and ${years} years checked against ${PUBLIC.length} public pages`;
});

checkNow("about.html is his desk picks as a site page: full meta set, the nav, no page JS, every name and year already public, links resolve", () => {
  // Picked 2026-10-28 from Study 09; the old About lives on at /v1/about.html.
  const h = readFileSync(path.join(ROOT, "about.html"), "utf8");
  const meta = [["title", /<title>About — Kahran Singh<\/title>/], ["description", /<meta name="description" content="[^"]{40,}">/], ["canonical", /<link rel="canonical" href="https:\/\/kahransingh\.com\/about\.html">/], ["og:title", /<meta property="og:title" content="[^"]+">/], ["og:description", /<meta property="og:description" content="[^"]{40,}">/], ["og:type", /<meta property="og:type" content="website">/], ["og:url", /<meta property="og:url" content="https:\/\/kahransingh\.com\/about\.html">/], ["og:image", /<meta property="og:image" content="https:\/\/kahransingh\.com\/[^"]+">/], ["twitter:card", /<meta name="twitter:card" content="summary_large_image">/], ["twitter:title", /<meta name="twitter:title" content="[^"]+">/], ["twitter:description", /<meta name="twitter:description" content="[^"]{40,}">/], ["twitter:image", /<meta name="twitter:image" content="https:\/\/kahransingh\.com\/[^"]+">/], ["site stylesheet", /href="\/style\.css"/], ["nav with about current", /<a href="\/about\.html" class="active" aria-current="page">about<\/a>/], ["nav name to the current home", /<a href="\/" class="nav-name">kahran<\/a>/], ["v1 in the nav", /<a href="\/v1\/">v1<\/a>/], ["mobile header", /class="mobile-header"/], ["16px phone gutters", /@media \(max-width: 768px\) \{ main\.about \{ padding-left: 16px; padding-right: 16px; \} \}/]];
  for (const [label, re] of meta) if (!re.test(h)) throw new Error(`about.html lacks ${label}`);
  for (const k of ["og:image", "twitter:image"]) {
    const u = new RegExp(`(?:property|name)="${k}" content="https://kahransingh\\.com(/[^"]+)"`).exec(h)[1];
    if (!existsSync(path.join(ROOT, u))) throw new Error(`about.html ${k} ${u} is not on disk`);
  }
  const scripts = [...h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const [, attrs, body] of scripts) if (!/googletagmanager\.com/.test(attrs) && !/gtag\('config'/.test(body)) throw new Error("about.html carries a script beyond the site's analytics");
  const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(h)?.[1] || "";
  const plain = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // The page is the desk's picks: every paragraph and year line of about-draft.html, verbatim.
  const draft = readFileSync(path.join(ROOT, "studies", "09", "about-draft.html"), "utf8");
  const pieces = [...draft.matchAll(/<p class="(?:lede|para|close)">([\s\S]*?)<\/p>|<span class="t">([\s\S]*?)<\/span><\/li>/g)].map((m) => plain(m[1] || m[2]));
  const mainText = plain(main);
  for (const p of pieces) if (!mainText.includes(p)) throw new Error(`about.html drops the picked line "${p.slice(0, 50)}…"`);
  // Public-safe by construction, as for the studies: the old About counts as public, the new one does not vouch for itself.
  const PUBLIC = ["cv.html", "projects.html", "working-with-me.html", "speaking.html", "archive.html", "poetry.html", "photography.html", "index.html", "v1/index.html", "v1/about.html", "wedding-celebration.html", "elopement/index.html", "context/index.html", "v2/home.js", "v2/data.json"];
  const corpus = PUBLIC.map((f) => readFileSync(path.join(ROOT, f), "utf8")).join(" ").replace(/<[^>]+>/g, " ").toLowerCase();
  const dict = new Set(readFileSync("/usr/share/dict/words", "utf8").split("\n").map((w) => w.toLowerCase()));
  const text = main.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  let names = 0, years = 0, links = 0;
  for (const m of text.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) {
    if (dict.has(m[1].toLowerCase())) continue;
    if (!corpus.includes(m[1].toLowerCase())) throw new Error(`about.html names "${m[1]}", which no other public page does`);
    names++;
  }
  for (const m of text.matchAll(/\b(19|20)\d\d\b/g)) {
    if (!corpus.includes(m[0])) throw new Error(`about.html says ${m[0]}, a year no other public page carries`);
    years++;
  }
  for (const m of h.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const u = m[1];
    if (/^(https?:|mailto:)/.test(u)) continue;
    let p = path.join(ROOT, u);
    if (u.endsWith("/")) p = path.join(p, "index.html");
    if (!existsSync(p)) throw new Error(`about.html: ${u} does not resolve`);
    links++;
  }
  if (!existsSync(path.join(ROOT, "v1", "about.html"))) throw new Error("the old About is gone from /v1/about.html");
  return `${meta.length} page rules, ${pieces.length} picked lines verbatim, ${names} names and ${years} years against ${PUBLIC.length} public pages, ${links} internal links on disk, old About at /v1/about.html`;
});

checkNow("tune: every dial lives in defaults.json and the CSS fallback equals it", () => {
  let dials = 0;
  for (const n of TUNED) {
    const f = path.join(ROOT, "studies", n, "defaults.json");
    if (!existsSync(f)) throw new Error(`study ${n} has no defaults.json`);
    const d = JSON.parse(readFileSync(f, "utf8"));
    const h = studyHtml(n);
    const used = new Map([...h.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].map((m) => [m[1], m[2].trim()]));
    for (const [k, v] of Object.entries(d)) {
      if (!used.has(k)) throw new Error(`study ${n}: "${k}" is in defaults.json but the CSS never reads it`);
      if (used.get(k) !== String(v)) throw new Error(`study ${n}: "${k}" falls back to ${used.get(k)} in CSS, defaults.json says ${v}`);
      dials++;
    }
    for (const k of used.keys()) if (!(k in d)) throw new Error(`study ${n}: CSS reads --${k}, not in defaults.json`);
    if (!/<script src="tune\.js"><\/script>/.test(h)) throw new Error(`study ${n} does not load tune.js`);
  }
  return `${dials} dials across ${TUNED.length} studies, fallbacks match`;
});

checkNow("every link out of a study resolves", () => {
  let n_int = 0, n_ext = 0;
  for (const n of SINCE06) {
    for (const m of studyHtml(n).matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1];
      if (/^(https?:|mailto:)/.test(u)) { n_ext++; continue; }
      let p = u.startsWith("/") ? path.join(ROOT, u) : path.join(ROOT, "studies", n, u);
      if (p.endsWith("/")) p = path.join(p, "index.html");
      if (!existsSync(p)) throw new Error(`study ${n}: ${u} does not resolve`);
      n_int++;
    }
  }
  return `${n_int} internal targets exist on disk, ${n_ext} external left to the link audit`;
});

checkNow("the wall is six ideas with Home the sixth, the noscript copy agrees, and the system's working name never shows", () => {
  const r = run("node", ["tools/test_wall.mjs"], ROOT);
  const oks = (r.out.match(/^ok /gm) || []).length;
  if (!r.ok) throw new Error(r.out.trim().split("\n").filter((l) => l.startsWith("FAIL")).join(" | ") || r.out.trim());
  return `${oks} checks, rendered at 1200x800 and 390x844`;
});

checkNow("Right now: the tools line still opens the wall; each line after it opens a short note whose link lives in v2/right-now.json", () => {
  const r = run("node", ["tools/test_right_now.mjs"], ROOT);
  const oks = (r.out.match(/^ok /gm) || []).length;
  if (!r.ok) throw new Error(r.out.trim().split("\n").filter((l) => l.startsWith("FAIL")).join(" | ") || r.out.trim());
  return `${oks} checks, rendered at 1200x800 and 390x844`;
});

checkNow("idea details: coverage, audited graph, public provenance", () => {
  const r = run("node", ["tools/test_idea_details.mjs"], ROOT);
  if (!r.ok) throw new Error(r.out.trim().split("\n").slice(-6).join(" | "));
  return r.out.trim().split("\n").filter((l) => l.startsWith("PASS")).map((l) => l.replace(/^PASS /, "")).join("; ");
});

process.exit(0)
