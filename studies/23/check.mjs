#!/usr/bin/env node
// Study 23 check: every fact a door, and 18 d's block unchanged.
// - links.json: at least MIN of its facts link; every null link says why; every internal href is a file in the repo;
//   every external href is https and carries a note of how it was checked
// - the page: each variant's block says exactly what 18 d says; every fact in it is an anchor to its links.json href;
//   no instruction words in <main>; every dial's CSS fallback equals defaults.json
// - headless Chrome, 1440x900 and 390x844 (touch): a lights links near the pointer and none far away, and on touch
//   every door carries a faint line at rest; b opens a card whose way out is the fact's href; c lifts the fact out of
//   the block; d lights the facts that share a name and walks to one; no horizontal scroll; shots into shots/
// node studies/23/check.mjs   → PASS line, or FAIL lines and exit 1
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const MIN = 206; // the coverage reached on 6 Nov: 206 of 206
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const fails = [];
const fail = (m) => fails.push(m);
const onDisk = (u) => { let f = path.join(ROOT, u.replace(/[#?].*$/, '')); if (f.endsWith('/') || u.replace(/[#?].*$/, '') === '/') f = path.join(f, 'index.html'); return existsSync(f) && !f.endsWith(path.sep) ? f : null; };

// ---- links.json
const L = JSON.parse(readFileSync(path.join(HERE, 'links.json'), 'utf8'));
const linked = L.facts.filter((f) => f.href);
if (linked.length < MIN) fail(`${linked.length} of ${L.facts.length} facts link, fewer than ${MIN}`);
if (L.coverage.linked !== linked.length || L.coverage.of !== L.facts.length) fail('links.json coverage line disagrees with its facts');
for (const f of L.facts) {
  if (!f.href) { if (!f.why || !String(f.why).trim()) fail(`${f.id} has no link and no reason`); continue; }
  if (f.href.startsWith('/')) { if (!onDisk(f.href)) fail(`${f.id}: ${f.href} is not a file in the repo`); }
  else if (!/^https:\/\//.test(f.href)) fail(`${f.id}: ${f.href} is neither internal nor https`);
  if (!f.how || !f.how.trim()) fail(`${f.id}: no note of how ${f.href} was found`);
  if (!f.to) fail(`${f.id}: no destination name`);
  if (f.img && !onDisk(f.img)) fail(`${f.id}: picture ${f.img} is not on disk`);
  for (const s of f.see) if (!L.facts.some((x) => x.id === s)) fail(`${f.id} sees ${s}, which is not a fact`);
}

// ---- the page, statically
const html = readFileSync(path.join(HERE, 'index.html'), 'utf8');
const main = /<main>([\s\S]*?)<\/main>/.exec(html)?.[1] || '';
const pl = (h) => h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, (m) => ({ '&amp;': '&', '&rarr;': '→', '&mdash;': '—', '&middot;': '·' })[m] || m).replace(/\s+/g, ' ').replace(/ ([,.;:])/g, '$1').trim();
const s18 = read('studies/18/index.html');
const d18 = pl(s18.split('<div class="v v-d" data-v="d">')[1].split('</main>')[0]);
const parts = main.split(/(?=<div class="v v-[a-z]" data-v="[a-z]">)/).filter((p) => p.startsWith('<div class="v'));
const vs = parts.map((p) => /data-v="([a-z])"/.exec(p)[1]);
if (vs.join('') !== 'abcd') fail(`variants ${vs.join(',')}, want a,b,c,d`);
const byId = Object.fromEntries(L.facts.map((f) => [f.id, f]));
for (const [i, p] of parts.entries()) {
  if (pl(p) !== d18) fail(`${vs[i]}: the block no longer says exactly what 18 d says`);
  const ids = [...p.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== L.facts.length) fail(`${vs[i]}: ${new Set(ids).size} facts on the page, ${L.facts.length} in links.json`);
  // each fact's door: the first a.u inside (or on) its data-id element, with links.json's href
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
const src = html + readFileSync(path.join(HERE, 'doors.js'), 'utf8');
const used = new Map([...html.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].map((m) => [m[1], m[2].trim()]));
for (const [k, v] of Object.entries(d)) {
  if (used.has(k)) { if (used.get(k) !== String(v)) fail(`dial ${k}: CSS falls back to ${used.get(k)}, defaults.json says ${v}`); continue; }
  const decl = new RegExp(`--${k}: ([^;]+);`).exec(html);
  if (!decl || decl[1] !== String(v)) fail(`dial ${k}: not read with its default (${decl?.[1]})`);
  else if (!src.includes(`'${k}'`)) fail(`dial ${k}: declared but the script never reads it`);
}
for (const k of used.keys()) if (!(k in d)) fail(`CSS reads --${k}, not in defaults.json`);

// ---- headless
const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell');
const shell = readdirSync(base).sort().reverse().map((x) => path.join(base, x, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')).find(existsSync);
if (!shell) { console.log('FAIL study 23: no chrome-headless-shell'); process.exit(1); }
const PORT = 8800 + Math.floor(Math.random() * 90), CDP = PORT + 1000, OUT = path.join(HERE, 'shots');
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
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/studies/23/?v=${v}` });
  await sleep(500);
  await ev('document.fonts.ready.then(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete || new Promise(r => { i.onload = i.onerror = r }))))');
  await sleep(200);
};
const shot = async (name, full) => {
  const p = { format: 'png' };
  if (full) { const H = await ev('Math.ceil(document.documentElement.scrollHeight)'); const W = await ev('innerWidth'); Object.assign(p, { captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } }); }
  writeFileSync(path.join(OUT, name + '.png'), Buffer.from((await send('Page.captureScreenshot', p)).data, 'base64'));
};
// a fact on screen, by id, scrolled into view; returns its centre
const at = (fid) => ev(`(() => { const r = document.querySelector('.v-' + document.documentElement.dataset.v + ' .tex [data-id="${fid}"]'); r.scrollIntoView({ block: 'center' }); const a = r.matches('a') ? r : r.querySelector('a.u'); const b = a.getClientRects()[0]; return { x: b.left + Math.min(8, b.width / 2), y: b.top + b.height / 2 }; })()`);
const tapAt = async ({ x, y }, touch) => {
  if (touch) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); }
  await sleep(350);
};
const ID = { place: 'place:telluride-colorado', row: L.facts.find((f) => f.id.startsWith('row:co-founded')).id, poem: 'poem:teental' };
let runs = 0;
for (const [w, h, touch, tag] of [[1440, 900, false, 'desktop'], [390, 844, true, 'phone']]) {
  for (const v of ['a', 'b', 'c', 'd']) {
    await load(v, w, h, touch);
    runs++;
    const n = await ev(`document.querySelectorAll('.v-${v} .tex a.u').length`);
    if (n !== linked.length) fail(`${v} ${tag}: ${n} doors in the block, links.json has ${linked.length}`);
    if (await ev('document.documentElement.scrollWidth > innerWidth')) fail(`${v} ${tag}: horizontal scroll`);
    await shot(`${v}-${tag}`);
    if (v === 'a') {
      if (!touch) {
        const p = await at(ID.row);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await sleep(300);
        const lit = await ev(`[...document.querySelectorAll('.v-a .tex a.u')].filter(a => +a.style.getPropertyValue('--n') > .5).length`);
        const far = await ev(`(() => { const r = +getComputedStyle(document.documentElement).getPropertyValue('--near-r'); return [...document.querySelectorAll('.v-a .tex a.u')].filter(a => { const b = a.getBoundingClientRect(); return a.style.getPropertyValue('--n') && Math.hypot(Math.max(b.left - ${p.x}, 0, ${p.x} - b.right), Math.max(b.top - ${p.y}, 0, ${p.y} - b.bottom)) > r; }).length; })()`);
        if (lit < 1) fail('a desktop: nothing lights under the pointer');
        if (far) fail(`a desktop: ${far} doors lit beyond the radius`);
        const line = await ev(`getComputedStyle(document.querySelector('.v-a .tex [data-id="${ID.row}"] a.u')).textDecorationColor`);
        if (/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(line)) fail('a desktop: the door under the pointer shows no line');
        await shot('a-desktop-near');
      } else {
        const line = await ev(`getComputedStyle(document.querySelector('.v-a .tex a.u')).textDecorationColor`);
        if (/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(line)) fail('a phone: doors carry no line at rest on touch, so nothing says they open');
      }
    }
    if (v === 'b' || v === 'd') {
      const fid = v === 'b' ? ID.place : ID.row;
      await tapAt(await at(fid), touch); await sleep(600);
      const c = await ev(`(() => { const c = document.querySelector('.v-${v} .card'); if (!c) return null; const b = c.getBoundingClientRect(); const n = document.querySelector('nav').getBoundingClientRect(); return { bottom: b.bottom, floor: n.top > innerHeight / 2 ? n.top : innerHeight, href: c.querySelector('.co')?.getAttribute('href'), img: !!c.querySelector('img'), left: b.left, right: b.right, w: innerWidth, rel: document.querySelectorAll('.v-${v} .tex .f.rel').length, see: c.querySelectorAll('.cs button').length, url: location.pathname }; })()`);
      if (!c) fail(`${v} ${tag}: a ${touch ? 'tap' : 'click'} on ${fid} opens no card${''}`);
      else {
        if (c.url !== '/studies/23/') fail(`${v} ${tag}: the ${touch ? 'tap' : 'click'} left the page instead of opening the card`);
        if (c.href !== byId[fid].href) fail(`${v} ${tag}: the card's way out is ${c.href}, links.json says ${byId[fid].href}`);
        if (v === 'b' && !c.img) fail(`b ${tag}: a place's card has no photograph`);
        if (c.bottom > c.floor + 1) fail(`${v} ${tag}: the card runs under the nav (${Math.round(c.bottom)} > ${Math.round(c.floor)})`);
        if (c.left < 0 || c.right > c.w + 1) fail(`${v} ${tag}: the card leaves the screen (${Math.round(c.left)}–${Math.round(c.right)} of ${c.w})`);
        if (v === 'd') {
          if (c.rel < 2 || c.see < 2) fail(`d ${tag}: ${fid} lights ${c.rel} facts and offers ${c.see}`);
          await shot(`d-${tag}-lit`);
          // walk to the first fact it shares a name with; the trail grows
          await ev(`document.querySelector('.v-d .card .cs button').click()`); await sleep(700);
          const walked = await ev(`({ on: document.querySelector('.v-d .tex .on')?.dataset.id, trail: document.querySelectorAll('.v-d .card .tr button').length })`);
          if (!walked.on || walked.on === fid || walked.trail !== 2) fail(`d ${tag}: walking from ${fid} landed on ${walked.on} with a trail of ${walked.trail}`);
          await shot(`d-${tag}-walked`);
        } else await shot(`b-${tag}-card`);
      }
    }
    if (v === 'c') {
      await tapAt(await at(ID.poem), touch);
      const c = await ev(`(() => { const f = document.querySelector('.v-c .tex .fl'); return f && { href: f.querySelector('.co')?.getAttribute('href'), gone: document.querySelector('.v-c .tex [data-id="${ID.poem}"]').classList.contains('gone'), float: getComputedStyle(f).float, lines: !!f.querySelector('.cl'), url: location.pathname }; })()`);
      if (!c) fail(`c ${tag}: the fact is not lifted`);
      else {
        if (c.href !== byId[ID.poem].href || !c.gone || !c.lines) fail(`c ${tag}: the lifted poem ${JSON.stringify(c)}`);
        if (!touch && c.float === 'none') fail('c desktop: the lifted fact does not float out of the block');
      }
      await shot(`c-${tag}-lifted`);
    }
    if (v === 'd' || v === 'a') await shot(`${v}-${tag}-full`, true);
  }
}
ws.close(); cleanup();
if (fails.length) { for (const f of fails) console.log('FAIL study 23: ' + f); process.exit(1); }
console.log(`PASS study 23: ${linked.length} of ${L.facts.length} facts link (${L.coverage.internal} in the site, all on disk; ${L.coverage.external} out, each with how it was checked), 0 without a reason; 4 variants say exactly 18 d's block, every door its links.json href; ${Object.keys(d).length} dials match; ${runs} headless runs (near-pointer lines, touch lines at rest, card, lift, shared-name walk), shots in studies/23/shots/`);
process.exit(0);
