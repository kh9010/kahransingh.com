#!/usr/bin/env node
// Study 18 check: the page says only what the site already says.
// - every line on each variant (a–d) is verbatim in a source: studies 06/07, about.html, cv.html, a public page or its data
// - every capitalised name and 4-digit year is already on a public page (verify.mjs's list, the same rule)
// - no poem count, no camera line (rulings, 28 Oct); his close on every variant
// - no instruction words in the page (verify.mjs's list); every internal link resolves on disk
// node studies/18/check.mjs   → PASS line, or FAIL lines and exit 1
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', rarr: '→', larr: '←', middot: '·', hellip: '…' };
const decode = (s) => s.replace(/&(#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(+e.slice(1)) : ENT[e.toLowerCase()] ?? m);
const plain = (h) => decode(h.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const strings = (o) => typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(strings) : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : [];

const SOURCES = ['studies/06/index.html', 'studies/07/index.html', 'about.html', 'cv.html', 'v1/about.html', 'projects.html', 'speaking.html', 'poem-films.html', 'poetry.html', 'photography.html', 'archive.html', 'working-with-me.html', 'wedding-celebration.html', 'elopement/index.html', 'index.html', 'context/index.html', 'v2/data.json', 'lately/entries.json'];
const corpus = SOURCES.map((f) => f.endsWith('.json') ? strings(JSON.parse(read(f))).join('\n') : plain(read(f))).join('\n').replace(/[ \t]+/g, ' ');
// verify.mjs's public list for studies: names and years must already be on one of these
const PUBLIC = ['cv.html', 'projects.html', 'working-with-me.html', 'speaking.html', 'archive.html', 'poetry.html', 'photography.html', 'index.html', 'v1/index.html', 'wedding-celebration.html', 'elopement/index.html', 'context/index.html', 'v2/home.js', 'v2/data.json'];
const pub = PUBLIC.map((f) => read(f)).join(' ').replace(/<[^>]+>/g, ' ').toLowerCase();
const dict = new Set(readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((w) => w.toLowerCase()));

const file = process.argv[2] || path.join(HERE, 'index.html');
const html = readFileSync(file, 'utf8');
const main = /<main>([\s\S]*?)<\/main>/.exec(html)?.[1] || '';
const fails = [];
const fail = (m) => fails.push(m);

// the variants: <div class="v v-x" data-v="x"> … up to the next one
const parts = main.split(/(?=<div class="v v-[a-z]" data-v="[a-z]">)/).filter((p) => p.startsWith('<div class="v'));
const vs = parts.map((p) => /data-v="([a-z])"/.exec(p)[1]);
if (vs.join('') !== 'abcd') fail(`variants on the page: ${vs.join(',') || 'none'}, want a,b,c,d`);

// a "line" is the text between any two tags other than a/q/i/strong: one fact, one label, one sentence run
const BLOCK = /<(?!\/?(?:a|q|i|strong)\b)[^>]+>/gi; // every tag but the inline ones ends a line
let lines = 0;
const close = 'Write to me. Especially if you are drawing up your own contract with the world instead of signing the one you were handed: what it gives you, what you give back, and which of the settled questions you are asking again. Tell me what’s going on.';
for (const [i, p] of parts.entries()) {
  const v = vs[i], segs = p.split(BLOCK).map(plain).filter((s) => /[A-Za-z0-9]/.test(s));
  for (const s of segs) {
    lines++;
    if (corpus.includes(s)) continue;
    const sentences = s.split(/(?<=[.!?;:])\s+/);
    for (const t of sentences) if (!corpus.includes(t)) fail(`${v}: "${t.slice(0, 90)}" is in no source`);
  }
  const text = plain(p);
  if (!text.includes(close)) fail(`${v}: his close is missing`);
  if (/\b\d+\s+poems\b|\ball \d+ poems/i.test(text)) fail(`${v}: a poem count`);
  if (/\b(Leica|Q2|camera|Fuji|Canon)\b/i.test(text)) fail(`${v}: a camera line`);
}

// names and years, as verify.mjs does it for studies
const mtext = plain(main);
let names = 0, years = 0;
for (const m of mtext.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) {
  if (dict.has(m[1].toLowerCase())) continue;
  if (!pub.includes(m[1].toLowerCase())) fail(`names "${m[1]}", which no public page does`); else names++;
}
for (const m of mtext.matchAll(/\b(19|20)\d\d\b/g)) { if (!pub.includes(m[0])) fail(`says ${m[0]}, a year no public page carries`); else years++; }

// no instruction text in <main> (verify.mjs's words)
const banned = /\b(click|tap|hover|scroll|swipe|proposed|study|placeholder|lorem|todo|tbd)\b/i.exec(mtext);
if (banned) fail(`main says "${banned[0]}"`);

// links resolve on disk
let ints = 0, exts = 0;
for (const m of html.matchAll(/(?:href|src)="([^"#?]+)/g)) {
  const u = m[1];
  if (/^(https?:|mailto:)/.test(u)) { exts++; continue; }
  let f = u.startsWith('/') ? path.join(ROOT, u) : path.join(HERE, u);
  if (f.endsWith('/') || f === HERE) f = path.join(f, 'index.html');
  if (!existsSync(f)) fail(`${u} does not resolve`); else ints++;
}

// dials: every key in defaults.json is read with its own value as the CSS fallback
const d = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'));
const used = new Map([...html.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].map((m) => [m[1], m[2].trim()]));
for (const [k, v] of Object.entries(d)) if (used.get(k) !== String(v)) fail(`dial ${k}: CSS falls back to ${used.get(k)}, defaults.json says ${v}`);
for (const k of used.keys()) if (!(k in d)) fail(`CSS reads --${k}, not in defaults.json`);

if (fails.length) { for (const f of fails) console.log('FAIL study 18: ' + f); process.exit(1); }
console.log(`PASS study 18: ${vs.length} variants, ${lines} lines verbatim in ${SOURCES.length} sources; ${names} names and ${years} years already public; no poem count, no camera, his close on each; ${ints} internal links on disk (${exts} external); ${Object.keys(d).length} dials match`);
