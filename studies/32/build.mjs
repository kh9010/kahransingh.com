#!/usr/bin/env node
// Study 32: every crossing between a world (a photograph and a poem) and 27 a's years, with its recorded basis.
// Reads only what the site already holds: v2/data.json, each photograph's own EXIF date (exif.mjs), the poems' pages
// (og:image), v2/days.json (the home's own pairs), and 27's years.json + links.json (rows, lanes, facts, kin).
// Writes crossings.json. check.mjs recounts every basis from the same sources, never from this file.
// node studies/32/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { taken } from './exif.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const J = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const data = J('v2/data.json'), days = J('v2/days.json').days, Y = J('studies/27/years.json'), L = J('studies/27/links.json');
const onSite = (s) => existsSync(path.join(ROOT, 'poems', s + '.html'));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯʻ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 5).join('-');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fact = Object.fromEntries(L.facts.map((f) => [f.id, f]));
const rowOf = Object.fromEntries(Y.facts.map((f) => [f.id, f]));
const NOW = 2026; // the About's "now" row: the year its weeks are dated in (lately/entries.json), and where every running lane ends
const rowFor = (y) => (y >= NOW ? 'now' : String(y));
const MAKING = /^(row|film|talk):/;
// a year's own facts on the About, in the block's order: the makings and the life (not the poems, places, weeks or lifted insides)
const yearFacts = (row) => Y.facts.filter((f) => f.row === row && f.y && MAKING.test(f.id)).map((f) => f.id);
const lanesIn = (y) => Y.lanes.filter((l) => l.from <= Math.min(y, NOW) && Math.min(y, NOW) <= l.to).map((l) => l.g);

// the poem a photograph is paired with: the home showed them together (latest day first), else a poem whose page carries it
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
  const y = +date.slice(0, 4), row = rowFor(y), place = p.caption.split(' — ')[0];
  if (!Y.rows.includes(row)) throw new Error(`build: ${p.src} taken ${y}, no such row on the About`);
  const names = (fact[`place:${slug(place)}`]?.kin || []).filter((k) => k.kind === 'name' && MAKING.test(k.id)).map((k) => ({ id: k.id, why: k.why }));
  const pair = pairOf(p.src);
  return { src: p.src, place, taken: date, y, row, ...(pair ? { poem: pair.poem, poemWhy: pair.why, poemSrc: pair.src } : {}), yearFacts: yearFacts(row), lanes: lanesIn(y), names };
});

// a poem's own making: its film (27's kin, from poem-films.html), and the photograph its page carries
const poems = {};
for (const p of data.poems) {
  if (!onSite(p.slug)) continue;
  const film = (fact[`poem:${p.slug}`]?.kin || []).find((k) => k.kind === 'page' && k.id.startsWith('film:'))?.id || null;
  const og = ogOf.get(p.slug) || null;
  poems[p.slug] = { film, photo: og && data.photos.some((x) => x.src === og) ? og : null };
}

// the facts any crossing names, with the words and year the About shows
const used = new Set();
photos.forEach((p) => { p.yearFacts.forEach((x) => used.add(x)); p.lanes.forEach((x) => used.add(x)); p.names.forEach((x) => used.add(x.id)); });
Object.values(poems).forEach((p) => p.film && used.add(p.film));
const facts = Object.fromEntries([...used].map((id) => {
  const f = fact[id], r = rowOf[id];
  if (!f || !r) throw new Error(`build: ${id} is not on 27 a`);
  return [id, { t: f.text, y: r.y, row: r.row, k: f.making }];
}));

const out = {
  made_by: 'studies/32/build.mjs',
  from: ['v2/data.json', 'photos/*.jpg EXIF DateTimeOriginal', 'poems/*.html og:image', 'v2/days.json', 'studies/27/years.json', 'studies/27/links.json'],
  rows: Y.rows,
  photos, poems, facts,
  // every making or life fact on 27 a and its row, so a lifted fact can open the worlds photographed in its year
  rowsOf: Object.fromEntries(Y.facts.filter((f) => f.y && MAKING.test(f.id)).map((f) => [f.id, f.row])),
};
writeFileSync(path.join(HERE, 'crossings.json'), JSON.stringify(out, null, 1) + '\n');
const paired = photos.filter((p) => p.poem).length, years = new Set(photos.map((p) => p.row));
console.log(`crossings.json: ${photos.length} photographs in ${years.size} years (${[...years].join(' ')}), ${paired} with a recorded poem, ${Object.values(poems).filter((p) => p.film).length} poems with a film, ${photos.filter((p) => p.names.length).length} places named on the About`);
