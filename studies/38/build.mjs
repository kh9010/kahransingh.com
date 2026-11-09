#!/usr/bin/env node
// Study 38: the date each home photograph carries, and the poem it is paired with. Same sources and rules as 32:
// the photograph's own EXIF date (exif.mjs), its About row (2026 is "now"), the home's own pair (v2/days.json, latest day first)
// or a poem whose page carries it (og:image). Writes crossings.json. check.mjs recounts every field from the same sources.
// node studies/38/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { taken } from './exif.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const J = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const data = J('v2/data.json'), days = J('v2/days.json').days, Y = J('studies/27/years.json');
const onSite = (s) => existsSync(path.join(ROOT, 'poems', s + '.html'));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NOW = 2026; // the About's "now" row
const rowFor = (y) => (y >= NOW ? 'now' : String(y));

const ogOf = new Map();
for (const p of data.poems) {
  if (!onSite(p.slug)) continue;
  const og = /<meta property="og:image" content="https:\/\/kahransingh\.com([^"]+)"/.exec(readFileSync(path.join(ROOT, 'poems', p.slug + '.html'), 'utf8'))?.[1];
  if (og) ogOf.set(p.slug, og);
}
const pairOf = (src) => {
  const d = Object.entries(days).filter(([, e]) => e.photo === src && onSite(e.poem)).sort((a, b) => b[0].localeCompare(a[0]))[0];
  if (d) { const [, m, dd] = d[0].split('-'); return { poem: d[1].poem, why: `the home, ${+dd} ${MON[m - 1]}`, src: `v2/days.json ${d[0]}` }; }
  const p = data.poems.find((q) => ogOf.get(q.slug) === src);
  return p ? { poem: p.slug, why: 'its page carries this photograph', src: `poems/${p.slug}.html og:image` } : null;
};

const photos = data.photos.map((p) => {
  const date = taken(path.join(ROOT, p.src));
  if (!date) throw new Error(`build: no EXIF date in ${p.src}`);
  const y = +date.slice(0, 4), row = rowFor(y);
  if (!Y.rows.includes(row)) throw new Error(`build: ${p.src} taken ${y}, no such row on the About`);
  const pair = pairOf(p.src);
  return { src: p.src, place: p.caption.split(' — ')[0], taken: date, y, row, ...(pair ? { poem: pair.poem, poemWhy: pair.why, poemSrc: pair.src } : {}) };
});

const out = { made_by: 'studies/38/build.mjs', from: ['v2/data.json', 'photos/*.jpg EXIF DateTimeOriginal', 'poems/*.html og:image', 'v2/days.json', 'studies/27/years.json'], rows: Y.rows, photos };
writeFileSync(path.join(HERE, 'crossings.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`crossings.json: ${photos.length} photographs in ${new Set(photos.map((p) => p.row)).size} years, ${photos.filter((p) => p.poem).length} with a recorded poem`);
