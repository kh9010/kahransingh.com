#!/usr/bin/env node
// Study 25 check: 23 c + d as one behaviour, on 18 d's block.
// - links.json: every fact still links (206 of 206), every internal href is a file, every external one https with a note;
//   every kin tie has a known kind and a reason, points at a fact, and is mutual; at least MIN_KIN facts have kin;
//   Washington DC is not kin to Washington state (the false tie 23's name rule made)
// - the page: each variant's block says exactly what 18 d says; every fact is an anchor to its links.json href;
//   no instruction words in <main>; every dial's CSS fallback equals defaults.json; no dial shares a name with a
//   variable the page or the site sets for itself
// - headless Chrome, 1440x900 and 390x844 (touch): a tap lifts the fact, and it stays on screen, uncovered;
//   its kin light (a b c) or gather in the lift (d); its way out is its href; a step to a kin grows the trail to two;
//   the trail walks back to the first fact; no horizontal scroll; shots into shots/
// node studies/25/check.mjs   → PASS line, or FAIL lines and exit 1
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const MIN = 206, MIN_KIN = 203; // reached on 6 Nov: 206 of 206 link; 203 have kin (Singapore, Barcelona, Costa Rica have none)
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
if (L.coverage.linked !== linked.length || L.coverage.of !== L.facts.length) fail('links.json coverage line disagrees with its facts');
let ties = 0;
for (const f of L.facts) {
  if (!f.href) { if (!f.why || !String(f.why).trim()) fail(`${f.id} has no link and no reason`); }
  else {
    if (f.href.startsWith('/')) { if (!onDisk(f.href)) fail(`${f.id}: ${f.href} is not a file in the repo`); }
    else if (!/^https:\/\//.test(f.href)) fail(`${f.id}: ${f.href} is neither internal nor https`);
    if (!f.how || !f.how.trim()) fail(`${f.id}: no note of how ${f.href} was found`);
    if (!f.to) fail(`${f.id}: no destination name`);
  }
  if (f.img && !onDisk(f.img)) fail(`${f.id}: picture ${f.img} is not on disk`);
  for (const k of f.kin) {
    ties++;
    if (!L.kinds.includes(k.kind)) fail(`${f.id} → ${k.id}: kind "${k.kind}" is not one of ${L.kinds.join(', ')}`);
    if (!k.why || !String(k.why).trim()) fail(`${f.id} → ${k.id}: kin without a reason`);
    if (!byId[k.id]) fail(`${f.id} is kin to ${k.id}, which is not a fact`);
    else if (!byId[k.id].kin.some((x) => x.id === f.id)) fail(`${f.id} → ${k.id} is not mutual`);
  }
}
const withKin = L.facts.filter((f) => f.kin.length).length;
if (withKin < MIN_KIN) fail(`${withKin} facts have kin, fewer than ${MIN_KIN}`);
if (L.coverage.with_kin !== withKin) fail('links.json kin count disagrees with its facts');
for (const s of L.facts.filter((f) => /^place:.*washington$/.test(f.id))) if (byId['place:washington-dc'].kin.some((k) => k.id === s.id)) fail(`Washington DC is kin to ${s.id}`);

// ---- the page, statically
const html = readFileSync(path.join(HERE, 'index.html'), 'utf8');
const js = readFileSync(path.join(HERE, 'kin.js'), 'utf8');
const main = /<main>([\s\S]*?)<\/main>/.exec(html)?.[1] || '';
const pl = (h) => h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, (m) => ({ '&amp;': '&', '&rarr;': '→', '&mdash;': '—', '&middot;': '·' })[m] || m).replace(/\s+/g, ' ').replace(/ ([,.;:])/g, '$1').trim();
const d18 = pl(read('studies/18/index.html').split('<div class="v v-d" data-v="d">')[1].split('</main>')[0]);
const parts = main.split(/(?=<div class="v v-[a-z]" data-v="[a-z]">)/).filter((p) => p.startsWith('<div class="v'));
const vs = parts.map((p) => /data-v="([a-z])"/.exec(p)[1]);
if (vs.join('') !== 'abcd') fail(`variants ${vs.join(',')}, want a,b,c,d`);
for (const [i, p] of parts.entries()) {
  if (pl(p) !== d18) fail(`${vs[i]}: the block no longer says exactly what 18 d says`);
  const ids = [...p.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== L.facts.length) fail(`${vs[i]}: ${new Set(ids).size} facts on the page, ${L.facts.length} in links.json`);
  for (const m of p.matchAll(/<(span|li|a)\b([^>]*)data-id="([^"]+)"([^>]*)>([\s\S]*?)(?=<\/\1>|<span class="f"|$)/g)) {
    const [, tag, pre, id, post, inner] = m;
    const href = tag === 'a' ? /href="([^"]+)"/.exec(pre + post)?.[1] : /<a class="u" href="([^"]+)"/.exec(inner)?.[1];
    if ((href || null) !== (byId[id]?.href || null)) fail(`${vs[i]}: ${id} opens ${href}, links.json says ${byId[id]?.href}`);
  }
}
const banned = /\b(click|tap|hover|scroll|swipe|proposed|study|placeholder|lorem|todo|tbd)\b/i.exec(pl(main));
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
const own = new Set([...js.matchAll(/setProperty\('--([a-z0-9-]+)'/g), ...read('style.css').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1].replace(/^--/, '')));
for (const k of Object.keys(d)) if (own.has(k)) fail(`dial ${k} collides with --${k}, which the page sets for itself`);

// ---- headless
const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell');
const shell = readdirSync(base).sort().reverse().map((x) => path.join(base, x, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')).find(existsSync);
if (!shell) { console.log('FAIL study 25: no chrome-headless-shell'); process.exit(1); }
const PORT = 8700 + Math.floor(Math.random() * 90), CDP = PORT + 1000, OUT = path.join(HERE, 'shots');
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
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/studies/25/?v=${v}` });
  await sleep(500);
  await ev('document.fonts.ready.then(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete || new Promise(r => { i.onload = i.onerror = r }))))');
  await sleep(200);
};
const shot = async (name) => writeFileSync(path.join(OUT, name + '.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const at = (fid) => ev(`(() => { const r = document.querySelector('.v-' + document.documentElement.dataset.v + ' .tex [data-id="${fid}"]'); r.scrollIntoView({ block: 'center' }); const a = r.matches('a') ? r : r.querySelector('a.u'); const b = a.getClientRects()[0]; return { x: b.left + Math.min(8, b.width / 2), y: b.top + b.height / 2 }; })()`);
const tapAt = async ({ x, y }, touch) => {
  if (touch) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
  await sleep(900);
};
// the state after a tap: the trail, where the current fact shows (the lift's words, or in c the fact in the block) and whether
// that is on screen above the nav and nothing covers it, how many kin are lit or offered, and the way out
const state = (v) => ev(`(() => {
  const root = document.querySelector('.v-${v}'), trail = (root.dataset.trail || '').split(' ').filter(Boolean), cur = trail.at(-1);
  const nb = document.querySelector('nav').getBoundingClientRect(), floor = nb.top > innerHeight / 2 ? nb.top : innerHeight;
  const shown = '${v}' === 'c' ? (() => { const n = root.querySelector('.tex [data-id="' + CSS.escape(cur || '') + '"]'); return n && (n.querySelector('a.u') || n); })() : root.querySelector('.fl .ct');
  let seen = false, rect = null;
  if (shown) { const b = shown.getClientRects()[0]; rect = b && { top: Math.round(b.top), bottom: Math.round(b.bottom) }; if (b && b.top >= 0 && b.bottom <= floor + 1) { const hit = document.elementFromPoint(b.left + Math.min(10, b.width / 2), b.top + b.height / 2); seen = !!hit && (shown.contains(hit) || hit.contains(shown)); } }
  const out = root.querySelector('${v === 'c' ? '.col .now' : '.fl'} .co');
  return { trail, seen, rect, floor: Math.round(floor), rel: root.querySelectorAll('.tex .rel').length, lit: root.querySelector('.tex').classList.contains('lit'), jumps: root.querySelectorAll('.jb, .gb').length, out: out && out.getAttribute('href'), url: location.pathname };
})()`);
const ROW = L.facts.find((f) => f.id.startsWith('row:co-founded')).id;
let runs = 0;
for (const [w, h, touch, tag] of [[1440, 900, false, 'desktop'], [390, 844, true, 'phone']]) {
  for (const v of ['a', 'b', 'c', 'd']) {
    await load(v, w, h, touch);
    runs++;
    const n = await ev(`document.querySelectorAll('.v-${v} .tex a.u').length`);
    if (n !== linked.length) fail(`${v} ${tag}: ${n} doors in the block, links.json has ${linked.length}`);
    await shot(`${v}-${tag}`);
    // lift
    await tapAt(await at(ROW), touch);
    let s = await state(v);
    if (s.url !== '/studies/25/') fail(`${v} ${tag}: the tap left the page`);
    if (s.trail.join() !== ROW) fail(`${v} ${tag}: after one tap the trail is ${s.trail.join(' › ')}`);
    if (!s.seen) fail(`${v} ${tag}: the tapped fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
    if (s.out !== byId[ROW].href) fail(`${v} ${tag}: the way out is ${s.out}, links.json says ${byId[ROW].href}`);
    if (v === 'd' ? s.lit || s.jumps < 2 : s.rel < 2) fail(`${v} ${tag}: ${s.rel} kin lit, ${s.jumps} offered${v === 'd' ? ', and the block should stay still' : ''}`);
    if ((v === 'a' || v === 'c') && s.jumps < 2) fail(`${v} ${tag}: the lift offers ${s.jumps} jumps`);
    if (await ev('document.documentElement.scrollWidth > innerWidth')) fail(`${v} ${tag}: horizontal scroll`);
    await shot(`${v}-${tag}-lifted`);
    // a step to a kin
    if (v === 'b') { const rid = await ev(`document.querySelector('.v-b .tex .f.rel').dataset.id`); await tapAt(await at(rid), touch); }
    else { await ev(`document.querySelector('.v-${v} ${v === 'c' ? '.col' : '.fl'} .${v === 'd' ? 'gb' : 'jb'}').click()`); await sleep(900); }
    s = await state(v);
    if (s.trail.length !== 2 || s.trail[0] !== ROW) fail(`${v} ${tag}: a step to a kin left the trail ${s.trail.join(' › ')}`);
    if (!s.seen) fail(`${v} ${tag}: after the step the fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
    await shot(`${v}-${tag}-step`);
    // and back
    if (v === 'b') await tapAt(await at(ROW), touch);
    else { await ev(`document.querySelector('.v-${v} ${{ a: '.fl .tr button', c: '.col .tl', d: '.fl .tl' }[v]}').click()`); await sleep(900); }
    s = await state(v);
    if (s.trail.join() !== ROW) fail(`${v} ${tag}: walking back left the trail ${s.trail.join(' › ')}`);
    if (!s.seen) fail(`${v} ${tag}: walked back, the fact is not on screen and uncovered (${JSON.stringify(s.rect)}, floor ${s.floor})`);
  }
}
ws.close(); cleanup();
if (fails.length) { for (const f of fails) console.log('FAIL study 25: ' + f); process.exit(1); }
const by = Object.entries(L.coverage.by_kind).map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`PASS study 25: ${linked.length} of ${L.facts.length} facts link (${L.coverage.internal} in the site, ${L.coverage.external} out); ${withKin} have kin (${by}), ${ties} ties each with a kind and a reason, all mutual; 4 variants say exactly 18 d's block; ${Object.keys(d).length} dials match, none collide; ${runs} headless runs (lift, lit or gathered kin, the way out, a step, the walk back, the tapped fact on screen and uncovered), shots in studies/25/shots/`);
process.exit(0);
