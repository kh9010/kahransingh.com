#!/usr/bin/env node
// Study 27 check: 19 b's years holding 18 d's makings-out-of-facts, with 25 d's lift, four ways.
// - links.json: every fact still links (202 of 202 since 7 Nov), each href resolves; 25's doors and kin are all still here, unchanged
//   (a tie may be added only where the site's own data grew), every tie has a kind and a reason, points at a fact, is mutual
// - years.json: every fact has a row; a fact sits at its own year, or carries the recorded reason it sits where it does
// - the poems (9 Nov, "I thought things were broken up by year"): every poem sits in the year poem-years.json evidences, with
//   that how; the poems with no evidence are not on the page one by one but one line in now ("and N more poems", /poetry.html);
//   now holds no poem title and no row holds more than a third of the poems
// - the page: in each variant every fact appears once, its markup exactly 25's (so 18 d's words), inside its year's row;
//   each making's lift sits in its row with 25's insides; no instruction words in <main>; years only those with facts are
//   labelled; dials match defaults.json and collide with nothing the page sets for itself
// - headless Chrome, 1440x900 and 390x844 (touch): in every variant, a tap lifts the fact where it sits, its kin gathered
//   inside, the block does not dim or move; the tapped fact is on screen and uncovered; the way out is its href; a step
//   to a kin folds the trail above; the trail walks back; no horizontal scroll; shots into shots/
// node studies/27/check.mjs   → PASS line, or FAIL lines and exit 1
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const MIN = 194, MIN_KIN = 191; // 206 and 203 until 7 Nov, when four poems came off the site (out for submission); 202 and 199
// until 9 Nov, when the 10 poems with no evidence of their year folded into one line (and the week of 2026-W45 arrived)
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const fails = [];
const fail = (m) => fails.push(m);
const onDisk = (u) => { let f = path.join(ROOT, u.replace(/[#?].*$/, '')); if (f.endsWith('/') || u.replace(/[#?].*$/, '') === '/') f = path.join(f, 'index.html'); return existsSync(f) && !f.endsWith(path.sep) ? f : null; };

// ---- links.json
const L = JSON.parse(readFileSync(path.join(HERE, 'links.json'), 'utf8'));
const byId = Object.fromEntries(L.facts.map((f) => [f.id, f]));
const linked = L.facts.filter((f) => f.href);
if (linked.length < MIN) fail(`${linked.length} of ${L.facts.length} facts link, fewer than ${MIN}`);
let ties = 0;
for (const f of L.facts) {
  if (!f.href) fail(`${f.id} has no link`);
  else if (f.href.startsWith('/')) { if (!onDisk(f.href)) fail(`${f.id}: ${f.href} is not a file in the repo`); }
  else if (!/^https:\/\//.test(f.href)) fail(`${f.id}: ${f.href} is neither internal nor https`);
  for (const k of f.kin) {
    ties++;
    if (!L.kinds.includes(k.kind) || !k.why) fail(`${f.id} → ${k.id}: kin without a known kind and a reason`);
    if (!byId[k.id]) fail(`${f.id} is kin to ${k.id}, which is not a fact`);
    else if (!byId[k.id].kin.some((x) => x.id === f.id)) fail(`${f.id} → ${k.id} is not mutual`);
  }
}
const withKin = L.facts.filter((f) => f.kin.length).length;
if (withKin < MIN_KIN) fail(`${withKin} facts have kin, fewer than ${MIN_KIN}`);
// 25 is where the doors and kin were picked (25 d, 7 Nov); nothing of it may go missing or change here
// except: the poems with no evidence of their year, folded into one line (poem-years.json, undated), and the ties to them;
// beyond 25 there may only be that line and the weeks the record has published since
const L25 = JSON.parse(read('studies/25/links.json'));
const PY = JSON.parse(readFileSync(path.join(HERE, 'poem-years.json'), 'utf8'));
const folded = new Set(Object.keys(PY.undated).map((s) => `poem:${s}`));
const ids25 = new Set(L25.facts.map((f) => f.id));
for (const f of L.facts) if (!ids25.has(f.id) && f.id !== 'more:poems' && !(f.id.startsWith('week:') && f.id > L25.facts.filter((x) => x.id.startsWith('week:')).map((x) => x.id).sort().at(-1))) fail(`${f.id} is in 27 but not 25, and is neither the undated line nor a newer week`);
let kept = 0;
for (const f of L25.facts) {
  const g = byId[f.id];
  if (folded.has(f.id)) { if (g) fail(`${f.id} has no evidenced year, yet is a fact of its own`); continue; }
  if (!g) { fail(`${f.id} (25) is gone`); continue; }
  for (const k of ['text', 'href', 'to', 'making']) if (f[k] !== g[k]) fail(`${f.id}: ${k} is ${g[k]}, 25 says ${f[k]}`);
  for (const k of f.kin) { if (folded.has(k.id)) continue; const h = g.kin.find((x) => x.id === k.id); if (!h || h.kind !== k.kind || h.why !== k.why) fail(`${f.id} → ${k.id}: 25's tie (${k.kind}, ${k.why}) is lost or changed`); else kept++; }
}

// ---- years.json
const Y = JSON.parse(readFileSync(path.join(HERE, 'years.json'), 'utf8'));
const place = Object.fromEntries(Y.facts.map((f) => [f.id, f]));
const startYear = (y) => +(/(\d{4})/.exec(y || '')?.[1] || 0);
let own = 0, reasoned = 0;
for (const f of L.facts) {
  const p = place[f.id];
  if (!p) { fail(`${f.id} has no row`); continue; }
  if (!Y.rows.includes(p.row)) fail(`${f.id}: row ${p.row} is not one of the years`);
  const ownRow = p.y === 'now' ? 'now' : startYear(p.y) ? (startYear(p.y) >= 2026 ? 'now' : String(startYear(p.y))) : null;
  if (ownRow === p.row && !p.how) own++;
  else if (p.how && p.how.trim()) reasoned++;
  else fail(`${f.id} sits at ${p.row}, not its own year (${p.y}), with no reason`);
}

// ---- the poems: each in its evidenced year, the rest one line in now; no wall of titles
const data = JSON.parse(read('v2/data.json'));
const poemFacts = L.facts.filter((f) => f.id.startsWith('poem:'));
const rowFor = (y) => (y >= 2026 ? 'now' : String(y));
for (const p of data.poems) {
  const e = PY.poems[p.slug], u = PY.undated[p.slug], id = `poem:${p.slug}`;
  if (!e === !u) { fail(`${p.slug}: in ${e ? 'both' : 'neither'} of poem-years.json's poems and undated`); continue; }
  if (u) { if (!u.trim()) fail(`${p.slug}: undated with no reason`); continue; }
  if (!Number.isInteger(e.year) || !e.how?.trim() || !e.how.includes(String(e.year)) || Object.keys(e).join() !== 'year,how') fail(`${p.slug}: poem-years.json holds a year and a how that says it, nothing else (the sources are kept privately)`);
  if (!byId[id]) { fail(`${id} has an evidenced year but is not a fact`); continue; }
  if (place[id]?.row !== rowFor(e.year)) fail(`${id} sits in ${place[id]?.row}; its evidence says ${e.year}`);
  if (!place[id]?.how?.startsWith(e.how)) fail(`${id}: its row's reason is "${place[id]?.how}", not its evidence ("${e.how}")`);
}
for (const s of [...Object.keys(PY.poems), ...Object.keys(PY.undated)]) if (!data.poems.some((p) => p.slug === s)) fail(`poem-years.json names ${s}, not a poem on the site`);
// the repo is public: no private channel is named in what it says about a poem's year (9 Nov)
const PRIVATE = /raw\W?db|e-?mail|voice note|sent it|message|whatsapp|\.txt\b/i;
for (const [what, t] of [['about', PY.about], ...Object.entries(PY.poems).map(([s, e]) => [s, e.how]), ...Object.entries(PY.undated)]) if (PRIVATE.test(t || '')) fail(`poem-years.json ${what} names a private channel ("${PRIVATE.exec(t)[0]}")`);
const nUndated = Object.keys(PY.undated).length, more = byId['more:poems'];
if (nUndated && (!more || more.text !== `and ${nUndated} more poems` || more.href !== '/poetry.html' || place['more:poems']?.row !== 'now')) fail(`the undated poems are not one line in now, "and ${nUndated} more poems" to /poetry.html`);
const perRow = {};
for (const f of poemFacts) perRow[place[f.id]?.row] = (perRow[place[f.id]?.row] || 0) + 1;
const fullest = Object.entries(perRow).sort((a, b) => b[1] - a[1])[0] || ['', 0], cap = Math.ceil(data.poems.length / 3);
if (perRow.now) fail(`now holds ${perRow.now} poem titles; a poem goes in its year or in the one undated line`);
if (fullest[1] > cap) fail(`${fullest[0]} holds ${fullest[1]} poem titles, more than a third of the ${data.poems.length} poems (${cap})`);

// ---- the page, statically
const html = readFileSync(path.join(HERE, 'index.html'), 'utf8');
const js = readFileSync(path.join(HERE, 'kin.js'), 'utf8');
const main = /<main>([\s\S]*?)<\/main>/.exec(html)?.[1] || '';
const h25 = read('studies/25/index.html');
const d25 = h25.split('<div class="v v-d" data-v="d">')[1].split('<p class="close">')[0];
const span25 = new Map([...d25.matchAll(/<span class="f" data-id="([^"]+)">[\s\S]*?<\/span>/g)].map((m) => [m[1], m[0]]));
const lift25 = new Map([...d25.matchAll(/<span class="lift [lr]"><a class="lh u" data-id="([^"]+)"[\s\S]*?(?=<span class="f"|<span class="lift)/g)].map((m) => [m[1], m[0].trim()]));
if (span25.size !== 181 || lift25.size !== 7) fail(`read ${span25.size} facts and ${lift25.size} lifts from 25 d`);
const parts = main.split(/(?=<div class="v v-[a-z]" data-v="[a-z]">)/).filter((p) => p.startsWith('<div class="v'));
const vs = parts.map((p) => /data-v="([a-z])"/.exec(p)[1]);
if (vs.join('') !== 'abcd') fail(`variants ${vs.join(',')}, want a,b,c,d`);
for (const [i, p] of parts.entries()) {
  const v = vs[i];
  const ids = [...p.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
  if (ids.length !== L.facts.length || new Set(ids).size !== L.facts.length) fail(`${v}: ${ids.length} facts on the page (${new Set(ids).size} distinct), ${L.facts.length} in links.json`);
  const rows = [...p.matchAll(/<div class="yr( empty)?" data-y="([^"]+)">([\s\S]*?)(?=<div class="yr|<\/div><\/div>\s*<p class="close">)/g)];
  if (rows.map((r) => r[2]).join() !== Y.rows.join()) fail(`${v}: rows ${rows.map((r) => r[2]).join()}, years.json ${Y.rows.join()}`);
  for (const [, empty, row, inner] of rows) {
    const label = /<span class="yl">([^<]*)<\/span>/.exec(inner)?.[1];
    if (label !== (empty ? '' : row)) fail(`${v} ${row}: labelled "${label}"`);
    for (const m of inner.matchAll(/data-id="([^"]+)"/g)) if (place[m[1]]?.row !== row) fail(`${v}: ${m[1]} sits in ${row}, years.json says ${place[m[1]]?.row}`);
  }
  for (const [id, s] of span25) if (!folded.has(id) && !p.includes(s)) fail(`${v}: ${id} is not word for word 25 d's (18 d's)`);
  for (const [id, s] of lift25) if (!p.includes(s)) fail(`${v}: the lift ${id} is not 25 d's`);
  for (const m of p.matchAll(/<(span|a)\b[^>]*data-id="([^"]+)"[^>]*>(?:[\s\S]{0,40}?<a class="u" href="([^"]+)")?/g)) {
    const href = m[1] === 'a' ? /href="([^"]+)"/.exec(m[0])?.[1] : m[3];
    if (m[1] === 'span' && !/class="f"/.test(m[0])) continue;
    if (href !== byId[m[2]]?.href) fail(`${v}: ${m[2]} opens ${href}, links.json says ${byId[m[2]]?.href}`);
  }
}
const banned = /\b(click|tap|hover|scroll|swipe|proposed|study|placeholder|lorem|todo|tbd)\b/i.exec(main.replace(/<[^>]+>/g, ' '));
if (banned) fail(`main says "${banned[0]}"`);
for (const m of html.matchAll(/(?:href|src)="([^"#?]+)/g)) { const u = m[1]; if (!/^(https?:|mailto:)/.test(u) && !(u.startsWith('/') ? onDisk(u) : existsSync(path.join(HERE, u)))) fail(`${u} does not resolve`); }
const d = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'));
const used = new Map([...html.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].map((m) => [m[1], m[2].trim()]));
for (const [k, v] of Object.entries(d)) {
  if (used.has(k)) { if (used.get(k) !== String(v)) fail(`dial ${k}: CSS falls back to ${used.get(k)}, defaults.json says ${v}`); continue; }
  const decl = new RegExp(`--${k}: ([^;]+);`).exec(html);
  if (!decl || decl[1] !== String(v)) fail(`dial ${k}: not read with its default (${decl?.[1]})`);
  else if (!js.includes(`'${k}'`)) fail(`dial ${k}: declared but the script never reads it`);
}
for (const k of used.keys()) if (!(k in d) && k !== 'nav-h') fail(`CSS reads --${k}, not in defaults.json`);
const ownVars = new Set([...js.matchAll(/setProperty\('--([a-z0-9-]+)'/g), ...read('style.css').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1].replace(/^--/, '')));
for (const k of Object.keys(d)) if (ownVars.has(k)) fail(`dial ${k} collides with --${k}, which the page sets for itself`);

// ---- headless
const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell');
const shell = readdirSync(base).sort().reverse().map((x) => path.join(base, x, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')).find(existsSync);
if (!shell) { console.log('FAIL study 27: no chrome-headless-shell'); process.exit(1); }
const PORT = 8600 + Math.floor(Math.random() * 90), CDP = PORT + 1000, OUT = path.join(HERE, 'shots');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${CDP}`, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill(); } catch {} try { server.kill(); } catch {} };
process.on('exit', cleanup);
let tabs;
for (let i = 0; i < 100 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); } catch { await sleep(100); } }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval'); return r.result.value; };
await send('Page.enable');
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await sleep(100); } }
const load = async (v, w, h, touch) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: touch });
  await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: touch ? 'none' : 'hover' }, { name: 'pointer', value: touch ? 'coarse' : 'fine' }] });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/studies/27/${v ? '?v=' + v : ''}` });
  await sleep(500);
  await ev('document.fonts.ready.then(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete || new Promise(r => { i.onload = i.onerror = r }))))');
  await sleep(250);
};
const shot = async (name) => writeFileSync(path.join(OUT, name + '.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const at = (fid) => ev(`(() => { const r = document.querySelector('.v-' + document.documentElement.dataset.v + ' .tex [data-id="${fid}"]'); r.scrollIntoView({ block: 'center' }); const a = r.matches('a') ? r : r.querySelector('a.u'); const b = a.getClientRects()[0]; return { x: b.left + Math.min(8, b.width / 2), y: b.top + b.height / 2 }; })()`);
const tapAt = async ({ x, y }, touch) => {
  if (touch) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
  await sleep(900);
};
// the block's facts: where each sits in the page and how opaque it is, so a lift can be shown not to dim or reorder them
const blockState = (v) => ev(`[...document.querySelectorAll('.v-${v} .tex .f')].map((n) => n.dataset.id + ':' + getComputedStyle(n).opacity).join('|')`);
const state = (v) => ev(`(() => {
  const root = document.querySelector('.v-${v}'), trail = (root.dataset.trail || '').split(' ').filter(Boolean);
  const nb = document.querySelector('nav').getBoundingClientRect(), floor = nb.top > innerHeight / 2 ? nb.top : innerHeight;
  const fl = root.querySelector('.fl'), shown = fl && fl.querySelector('.ct');
  let seen = false, rect = null;
  if (shown) { const b = shown.getClientRects()[0]; rect = b && { top: Math.round(b.top), bottom: Math.round(b.bottom) }; if (b && b.top >= 0 && b.bottom <= floor + 1) { const hit = document.elementFromPoint(b.left + Math.min(10, b.width / 2), b.top + b.height / 2); seen = !!hit && (shown.contains(hit) || hit.contains(shown)); } }
  const out = fl && fl.querySelector('.co');
  const yr = fl && fl.closest('.yr')?.dataset.y;
  return { trail, seen, rect, floor: Math.round(floor), yr, ct: shown && shown.textContent, folded: [...(fl?.querySelectorAll('.tl') || [])].map((b) => b.dataset.to), gathered: root.querySelectorAll('.fl .gk .gb').length, out: out && out.getAttribute('href'), url: location.pathname, hscroll: document.documentElement.scrollWidth > innerWidth };
})()`);
const TAPS = [L.facts.find((f) => f.id.startsWith('row:co-founded')).id, L.facts.find((f) => f.id === 'talk:curating-your-story').id, 'poem:being-loved'];
let runs = 0;
for (const [w, h, touch, tag] of [[1440, 900, false, 'desktop'], [390, 844, true, 'phone']]) {
  await load('', w, h, touch); await shot(`ask-${tag}`);
  for (const v of ['a', 'b', 'c', 'd']) {
    await load(v, w, h, touch);
    const n = await ev(`document.querySelectorAll('.v-${v} .tex a.u').length`);
    if (n !== linked.length) fail(`${v} ${tag}: ${n} doors, links.json has ${linked.length}`);
    if (await ev('document.documentElement.scrollWidth > innerWidth')) fail(`${v} ${tag}: horizontal scroll at rest`);
    await shot(`${v}-${tag}`);
    for (const [ti, FID] of TAPS.entries()) {
      runs++;
      await load(v, w, h, touch);
      const before = await blockState(v);
      await tapAt(await at(FID), touch);
      let s = await state(v);
      const T = `${v} ${tag} ${FID}`;
      if (s.url !== '/studies/27/') fail(`${T}: the tap left the page`);
      if (s.trail.join() !== FID) fail(`${T}: after one tap the trail is ${s.trail.join(' › ')}`);
      if (s.ct !== byId[FID].text) fail(`${T}: the lift says "${s.ct}"`);
      if (s.yr !== place[FID].row) fail(`${T}: lifted in ${s.yr}, the fact's year is ${place[FID].row}`);
      if (!s.seen) fail(`${T}: the tapped fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
      if (s.out !== byId[FID].href) fail(`${T}: the way out is ${s.out}, links.json says ${byId[FID].href}`);
      if (s.gathered < 2) fail(`${T}: ${s.gathered} kin gathered in the lift`);
      if (await blockState(v) !== before) fail(`${T}: the block dimmed or moved its facts`);
      if (s.hscroll) fail(`${T}: horizontal scroll`);
      if (ti === 0) await shot(`${v}-${tag}-lifted`);
      // a step to a kin: the trail folds above
      const to = await ev(`document.querySelector('.v-${v} .fl .gb').dataset.to`);
      await ev(`document.querySelector('.v-${v} .fl .gb').click()`); await sleep(900);
      s = await state(v);
      if (s.trail.join() !== `${FID},${to}` || s.folded.join() !== FID) fail(`${T}: a step to a kin left the trail ${s.trail.join(' › ')}, folded ${s.folded.join(' › ')}`);
      if (!s.seen) fail(`${T}: after the step the fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
      if (ti === 0) await shot(`${v}-${tag}-step`);
      // and back
      await ev(`document.querySelector('.v-${v} .fl .tl').click()`); await sleep(900);
      s = await state(v);
      if (s.trail.join() !== FID) fail(`${T}: walking back left the trail ${s.trail.join(' › ')}`);
      if (!s.seen) fail(`${T}: walked back, the fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
    }
  }
}
ws.close(); cleanup();
if (fails.length) { for (const f of fails) console.log('FAIL study 27: ' + f); process.exit(1); }
console.log(`PASS study 27: ${linked.length} of ${L.facts.length} facts link; 25's ${kept} ties all kept, but for those to the ${folded.size} undated poems (${ties} now, ${withKin} facts with kin, all mutual, each with a reason); every fact in a year: ${own} at their own, ${reasoned} by a recorded reason; ${poemFacts.length} poems each in its evidenced year across ${Object.keys(perRow).length} years (at most ${fullest[1]}, in ${fullest[0]}), ${nUndated} undated as one line in now; 4 variants each hold all ${L.facts.length} word for word as 25 d, in their years; ${Object.keys(d).length} dials match, none collide; ${runs} headless lifts (where it sits, kin gathered, block still, on screen and uncovered, the way out, a step, the walk back) at 1440x900 and 390x844; shots in studies/27/shots/`);
process.exit(0);
