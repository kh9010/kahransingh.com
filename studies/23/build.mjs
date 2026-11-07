#!/usr/bin/env node
// Study 23: 18 d (the makings lifted out of a block of facts) with every fact a door.
// Reads the same sources as studies/18/build.mjs, gives every fact and making an id, a destination
// (sources.json for the hand-sourced ones, the fact's own page for poems, places, weeks, talks, films),
// the facts it shares a name with, and writes index.html + links.json (the per-fact ledger of links).
// node studies/23/build.mjs   (check.mjs then proves it)
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const one = (re, s, what) => { const m = re.exec(s); if (!m) throw new Error(`build: ${what} not found`); return m; };
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', middot: '·', rarr: '→' };
const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&([a-z]+);/g, (m, e) => ENT[e] ?? m).replace(/\s+/g, ' ').trim();
const slug = (s) => plain(s).normalize('NFD').replace(/[\u0300-\u036f\u02bb]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 5).join('-');
const SRC = JSON.parse(readFileSync(path.join(HERE, 'sources.json'), 'utf8'));

// ---- the same extraction as studies/18/build.mjs (kept in step by hand; 18 is frozen)
const s06 = read('studies/06/index.html');
const ledger = [...one(/<ol class="ledger">([\s\S]*?)<\/ol>/, s06, '06 ledger')[1].matchAll(/<li><span class="y">([^<]*)<\/span><span class="t">([\s\S]*?)<\/span><\/li>/g)].map((m) => ({ y: m[1], t: m[2] }));
const row = (start) => { const r = ledger.find((l) => plain(l.t).startsWith(start)); if (!r) throw new Error(`build: 06 line "${start}" missing`); return r; };
const lede06 = one(/<p class="lede">([^<]*)<\/p>/, s06, '06 lede')[1];
const s07 = read('studies/07/index.html');
const makes = Object.fromEntries([...s07.matchAll(/<section class="make">\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => [m[1], m[2]]));
const lede07 = one(/<p class="lede">([^.]*\.)/, s07, '07 lede')[1];
const art = (k) => one(/<figure class="art">([\s\S]*?)<\/figure>/, makes[k], `07 ${k} art`)[1].trim();
const sAbout = read('about.html');
const close = one(/<p>(Write to me\.[\s\S]*?Tell me what’s going on\.) <span class="sign">/, sAbout, 'his close')[1];
const sCv = read('cv.html');
const cvLine = (s) => { if (!sCv.replace(/&amp;/g, '&').includes(s)) throw new Error(`build: cv lacks "${s}"`); return esc(s); };
const talks = [...sCv.matchAll(/<p class="cv-entry-title">(?:<a href="(https:\/\/www\.youtube[^"]+)"[^>]*>)?([^<]+)(?:<\/a>)?<\/p>\s*(?:<p class="cv-entry-role">([^<]*)<\/p>\s*)?(?:<p class="cv-entry-desc">[^<]*<\/p>\s*)?<\/div>\s*<p class="cv-entry-year">((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})<\/p>/g)]
  .map((m) => ({ y: m[4], t: m[1] ? `<a href="${m[1]}">${m[2]}</a>` : m[2], talk: true }));
const films = [...read('poem-films.html').matchAll(/<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>\s*<p class="film-meta">([^<]+)<\/p>/g)].map((m) => ({ y: '2024', t: `<a href="${m[1]}">${m[2]}</a> <em>${m[3]}</em>`, film: m[1] }));
if (talks.length < 8 || films.length !== 4) throw new Error('build: talks or films moved');
const data = JSON.parse(read('v2/data.json'));
const placeOf = new Map();
for (const p of data.photos) { const k = p.caption.split(' — ')[0]; if (!placeOf.has(k)) placeOf.set(k, p); }
const weeks = JSON.parse(read('lately/entries.json')).entries.map((e) => ({ y: e.title, t: `<a href="${e.link}">${esc(e.summary)}</a>`, week: e }));
const howBook = { y: '2022', t: 'How the World Works, a first book of poems.' };
const runs = {
  poems: [row('MFA candidate'), howBook, ...data.poems.map((p) => ({ poem: p }))],
  photographs: [...placeOf.keys()].map((k) => ({ place: k })),
  tools: [row('Building software'), ...weeks],
  companies: [row('Board of TomboyX'), row('Chief Revenue Officer'), row('Co-founded'), row('Advisor to Armoire'), row('General Partner'), { y: '2017–', t: cvLine('Portfolio includes Armoire, Humanly, and Kosha.') }, row('Vidyanext'), row('Aditi Technologies'), { y: '2012–15', t: cvLine('Clients included Dodge Data & Analytics (McGraw-Hill) and TUI Travel.') }, row('DataSphere'), { y: '2011–12', t: cvLine('Mobile product lead for a late-stage 300-person startup.') }, row('TravelPost'), row('Microsoft')],
  speaking: [row('A panel at the Common Ground'), row('Mentor at StartOut'), ...talks],
  'films and installations': [row('Poem Films'), ...films],
  dance: [row('Learning Kathak')],
};
const rest = [row('Married Gourav'), row('Eloped with Gourav'), row('Tufts University')];
const ORDER = ['poems', 'photographs', 'tools', 'companies', 'speaking', 'films and installations', 'dance'];

// ---- destinations
const titleOf = (href) => {
  if (/^https?:/.test(href)) { const h = new URL(href).hostname.replace(/^www\./, ''); return h === 'en.wikipedia.org' ? 'Wikipedia' : h; }
  let f = path.join(ROOT, href.replace(/[#?].*$/, '')); if (f.endsWith('/')) f = path.join(f, 'index.html');
  const t = plain(one(/<title>([^<]*)<\/title>/, readFileSync(f, 'utf8'), `title of ${href}`)[1]).replace(/ — Kahran Singh$/, '');
  return href.startsWith('/#flow') ? 'how they fit together' : t === 'Kahran Singh' ? 'home' : t;
};
const units = [];
const add = (u) => { if (units.some((x) => x.id === u.id)) throw new Error(`build: id ${u.id} twice`); units.push(u); return u; };
const rowSrc = (t) => SRC.rows.find((r) => plain(t).startsWith(r.start));
const ownHref = (t) => /<a href="([^"]+)"/.exec(t)?.[1];
const unitFor = (k, r) => {
  if (r.poem) { const p = r.poem; return { id: `poem:${p.slug}`, k, text: p.title, html: esc(p.title), href: `/poems/${p.slug}.html`, how: 'the poem’s own page (v2/data.json)', lines: p.stanzas[0].split('\n').filter(Boolean).slice(0, 3) }; }
  if (r.place) { const p = placeOf.get(r.place); return { id: `place:${slug(r.place)}`, k, text: r.place, html: esc(r.place), href: '/photography.html', how: `the photograph from there is on the photography page (v2/data.json, ${p.src})`, img: p.src, alt: p.alt }; }
  if (r.week) return { id: `week:${r.week.id.replace('record-', '')}`, k, y: r.y, text: r.week.summary, html: esc(r.week.summary), href: r.week.link, how: 'the week’s own page (lately/entries.json)' };
  if (r.talk) { const h = ownHref(r.t); const t = plain(r.t); return { id: `talk:${slug(t)}`, k, y: r.y, text: t, html: esc(t), href: h || SRC.rows.find((s) => t.startsWith(s.start))?.href || null, how: h ? 'the talk’s own video, linked from cv.html and speaking.html' : SRC.rows.find((s) => t.startsWith(s.start))?.how, why: h ? undefined : 'no video' }; }
  if (r.film) { const t = plain(r.t); const sl = r.film.replace(/^.*\//, '').replace('.html', ''); return { id: `film:${sl}`, k, y: r.y, text: t, html: r.t.replace(/<\/?a[^>]*>/g, ''), href: r.film, how: 'the poem the film is of (poem-films.html)', img: `/video-poems/posters/${sl}-1.jpg`, alt: '' }; }
  const s = rowSrc(r.t); const t = plain(r.t);
  return { id: `row:${slug(t)}`, k, y: r.y, text: t, html: r.t.replace(/<\/?a[^>]*>/g, ''), href: s?.href ?? null, how: s?.how, why: s ? undefined : 'not sourced yet' };
};
for (const k of ORDER) {
  add({ id: `lift:${slug(k)}`, k, lift: true, text: k, href: SRC.lifts[k].href, how: SRC.lifts[k].how });
  for (const r of runs[k]) add(unitFor(k, r));
}
for (const r of rest) add(unitFor('years', r));

// the lifts' own insides: the art and each list item
const liftArt = {};
for (const k of ORDER) {
  if (k === 'speaking') continue;
  let a = art(k).replace(/ &mdash; Leica Q2 Monochrome/, '');
  if (SRC.art[k]) {
    const u = add({ id: `art:${k}`, k, text: k === 'poems' ? plain(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/.exec(a)[1].replace(/<br>/g, ' / ')) : plain(/alt="([^"]+)"/.exec(a)[1]), href: SRC.art[k].href, how: SRC.art[k].how });
    a = k === 'photographs' ? a.replace(/<img [^>]+>/, (m) => `<a class="u" data-id="${u.id}" href="${u.href}">${m}</a>`) : a.replace(/<figcaption><a href="([^"]+)">/, (m, h) => `<figcaption><a class="u" data-id="${u.id}" href="${h}">`);
  }
  a = a.replace(/<li>(?:<a href="[^"]+">)?([^<]+)(?:<\/a>)?<span>([^<]*)<\/span><\/li>/g, (m, name, sub) => {
    const s = SRC.items[name]; if (!s) throw new Error(`build: no source for item ${name}`);
    const u = add({ id: `item:${slug(name)}`, k, text: name, sub, href: s.href, how: s.how });
    return `<li data-id="${u.id}"><a class="u" href="${u.href}">${name}</a><span>${sub}</span></li>`;
  });
  liftArt[k] = a.replace(/<(\/?)(figcaption|blockquote|ul|li|p)\b/g, '<$1span data-t="$2"');
}

// ---- see: facts that name the same thing; then sources.json's hand pairs
const dict = new Set(readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((w) => w.toLowerCase()));
const ALLOW = new Set(['washington', 'colorado', 'japan', 'california', 'telluride', 'armoire', 'boulder', 'maine']);
const english = (w) => [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'), w.replace(/ed$/, ''), w.replace(/d$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e')].some((x) => dict.has(x));
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f\u02bb]/g, '');
const tokens = (u) => new Set([...norm(u.text + ' ' + (u.sub || '')).matchAll(/\b[A-Z][A-Za-z]{2,}\b/g)].map((m) => m[0].toLowerCase()).filter((w) => (!english(w) || ALLOW.has(w)) && w !== 'kahran'));
const byTok = new Map();
for (const u of units) for (const t of tokens(u)) byTok.set(t, [...(byTok.get(t) || []), u.id]);
const generic = new Set(['/cv.html', '/#flow', '/photography.html', '/speaking.html', '/lately/', '/projects.html']);
for (const u of units) if (u.href && !generic.has(u.href)) byTok.set('href ' + u.href, [...(byTok.get('href ' + u.href) || []), u.id]);
const see = new Map(units.map((u) => [u.id, new Set()]));
const link = (a, b) => { if (a !== b) { see.get(a).add(b); see.get(b).add(a); } };
for (const ids of byTok.values()) if (ids.length >= 2 && ids.length <= 12) for (const a of ids) for (const b of ids) link(a, b);
const match = (p) => { const star = p.endsWith(':*'), hits = units.filter((u) => star ? u.id.startsWith(p.slice(0, -1)) : u.id === p || u.id.startsWith(p + '-')).map((u) => u.id); if (!hits.length || (!star && hits.length > 1)) throw new Error(`build: see names ${p} (${hits.length})`); return hits; };
for (const [a, b] of SRC.see) for (const x of match(a)) for (const y of match(b)) link(x, y);
const wk = units.filter((u) => u.id.startsWith('week:'));
wk.forEach((u, i) => { if (wk[i + 1]) link(u.id, wk[i + 1].id); });
for (const u of units) u.see = [...see.get(u.id)];
for (const u of units) { u.to = u.href ? titleOf(u.href) : null; if (u.href && /^\//.test(u.href)) { let f = path.join(ROOT, u.href.replace(/[#?].*$/, '')); if (f.endsWith('/')) f = path.join(f, 'index.html'); if (!existsSync(f)) throw new Error(`build: ${u.id} → ${u.href} not on disk`); } }

// ---- the block: 18 d's markup, each fact a door
const byId = Object.fromEntries(units.map((u) => [u.id, u]));
const fact = (u) => {
  const y = u.y ? `<b>${u.y}</b> ` : '';
  const body = u.href ? `<a class="u" href="${u.href}">${u.html}</a>` : u.html;
  return `<span class="f" data-id="${u.id}">${y}${body}</span>`;
};
const lift = (k, side) => {
  const u = byId[`lift:${slug(k)}`];
  return `<span class="lift ${side}"><a class="lh u" data-id="${u.id}" href="${u.href}">${k}</a>${liftArt[k] ? `<span class="la">${liftArt[k]}</span>` : ''}</span>`;
};
const runOf = (k) => units.filter((u) => u.k === k && !u.lift && !/^(art|item):/.test(u.id));
const D = (v) => `<div class="v v-${v}" data-v="${v}">\n<p class="lede">${lede07}</p>\n<p class="tex">${ORDER.map((k, i) => `${lift(k, i % 2 ? 'r' : 'l')}${runOf(k).map(fact).join(' ')}`).join(' ')} ${runOf('years').map(fact).join(' ')}</p>
<p class="close">${close}</p>
<div class="foot">
<a class="cv" href="/cv.html">Full CV &rarr;</a>
<div class="contact-row">
<a href="mailto:hello@joyus.studio">hello@joyus.studio</a>
<a href="https://instagram.com/kahran">Instagram</a>
<a href="https://medium.com/@kahrans">Medium</a>
</div>
</div>
</div>`;

// ---- links.json: the ledger of every door
const linked = units.filter((u) => u.href).length;
const ledgerOut = { coverage: { linked, of: units.length, internal: units.filter((u) => u.href?.startsWith('/')).length, external: units.filter((u) => /^https?:/.test(u.href || '')).length, with_see: units.filter((u) => u.see.length).length }, checked: SRC.checked,
  facts: units.map((u) => ({ id: u.id, making: u.k, text: u.text, href: u.href, to: u.to, how: u.how ?? null, ...(u.href ? {} : { why: u.why }), ...(u.img ? { img: u.img } : {}), ...(u.lines ? { lines: u.lines } : {}), see: u.see })) };
const outJ = path.join(HERE, 'links.json');
writeFileSync(outJ, JSON.stringify(ledgerOut, null, 1) + '\n');
// what the page needs, inline (no fetch before the first click)
const pageData = Object.fromEntries(units.map((u) => [u.id, { k: u.k, y: u.y || '', t: u.text, h: u.href, to: u.to, ...(u.img ? { i: u.img, a: u.alt || '' } : {}), ...(u.lines ? { l: u.lines } : {}), s: u.see }]));

const defaults = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'));
const V = (k) => `var(--${k}, ${defaults[k]})`;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>About — Kahran Singh</title>
<meta name="description" content="${esc(lede06)} The things he makes, with the facts beneath them.">
<link rel="stylesheet" href="/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">
<style>
:root { ${['near-r', 'near-ease'].map((k) => `--${k}: ${defaults[k]};`).join(' ')} }
/* the ask (no ?v) */
.ask { display: none; padding: 15vh 16px 4rem; margin: 0 auto; max-width: 560px; font: 400 .78rem/1.5 'Space Grotesk', sans-serif; color: #1a1a1a; }
.ask h1 { font: 500 .72rem 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: 1rem; }
.ask p { font: 400 1.0625rem/1.55 'Fraunces', Georgia, serif; margin-bottom: 1.25rem; }
.ask ol { list-style: none; display: grid; gap: 8px; }
.ask a { display: grid; grid-template-columns: 1.5rem 1fr; text-decoration: none; color: inherit; background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; padding: 12px; }
.ask a b { font-weight: 500; }
.ask a span { color: #6e6e6e; }
html:not([data-v]) .ask { display: block; }
html:not([data-v]) main, html:not([data-v]) nav { display: none; }
.v { display: none; }
html[data-v="a"] .v-a, html[data-v="b"] .v-b, html[data-v="c"] .v-c, html[data-v="d"] .v-d { display: block; }

/* 18 d, as it was */
main { max-width: ${V('measure')}; }
.lede { font-family: 'Fraunces', Georgia, serif; font-size: ${V('lede-size')}; line-height: 1.5; margin-bottom: ${V('section-gap')}; }
.poem { font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.6; color: #1a1a1a; }
.list { list-style: none; font-size: ${V('body-size')}; line-height: 1.6; }
.close { font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.75; max-width: 560px; margin: ${V('section-gap')} 0 0; padding-top: 1.5rem; border-top: 1px solid #e0ddd8; clear: both; }
.foot { margin-top: 1.5rem; }
.foot .cv { font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; color: #1a1a1a; text-decoration: none; }
.foot .contact-row { margin-top: 1.25rem; padding-top: 0; border-top: 0; }
.f b { font-weight: 500; font-size: .85em; letter-spacing: .06em; }
em { font-style: normal; color: #9a958c; }
.tex { font-size: ${V('d-size')}; line-height: ${V('d-lh')}; color: ${V('d-ink')}; text-align: justify; hyphens: auto; position: relative; }
.tex .f + .f::before { content: "· "; }
.lift { float: left; clear: left; width: ${V('lift-w')}; margin: .4rem 1.5rem 1rem 0; padding-top: .6rem; border-top: 1px solid #1a1a1a; color: #1a1a1a; font-size: ${V('body-size')}; line-height: 1.55; text-align: left; hyphens: none; }
.lift.r { float: right; clear: right; margin: .4rem 0 1rem 1.5rem; }
.lift .lh { display: block; font: 500 .72rem 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: .5rem; }
.lift .la { display: block; }
.lift img { width: 100%; max-height: ${V('photo-max-h')}; object-fit: cover; display: block; filter: contrast(1.05); }
.lift [data-t="blockquote"] { display: block; font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; line-height: 1.5; }
.lift [data-t="figcaption"], .lift [data-t="p"] { display: block; font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: .8rem; color: #6e6e6e; padding-top: .4rem; }
.lift [data-t="ul"] { display: block; }
.lift [data-t="li"] { display: block; border-top: 1px solid #f0ede8; padding: .2rem 0; }
.lift [data-t="li"] span { display: block; color: #6e6e6e; font-size: .8rem; }
.lift a { color: #1a1a1a; text-decoration: none; }

/* every door: the same ink as the fact, no underline at rest */
.tex a { color: inherit; text-decoration: none; }
a.u { text-decoration-line: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; text-decoration-color: transparent; transition: text-decoration-color .2s cubic-bezier(.4,0,.2,1), color .2s cubic-bezier(.4,0,.2,1); }
a.u:focus-visible { outline: 1px solid #1a1a1a; outline-offset: 1px; }
@media (hover: none) { a.u { text-decoration-color: ${V('touch-line')}; } }

/* a: the doors show near the pointer */
.v-a a.u { --n: 0; text-decoration-color: rgb(26 26 26 / calc(var(--n) * ${V('near-line')})); color: color-mix(in srgb, #1a1a1a calc(var(--n) * 100%), currentColor); }
.v-a .lift a.u { color: #1a1a1a; }
.v-a .lift a.lh { color: color-mix(in srgb, #1a1a1a calc(var(--n) * 100%), #6e6e6e); }
@media (hover: none) { .v-a a.u { text-decoration-color: ${V('touch-line')}; } }

/* b, d: the card */
.card { position: absolute; z-index: 20; width: min(${V('card-w')}, calc(100vw - 32px)); background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; box-shadow: 0 6px 24px rgb(26 26 26 / .08); padding: 12px 14px 12px; color: #1a1a1a; text-align: left; hyphens: none; font-size: ${V('body-size')}; line-height: 1.5; }
.card .ck { display: block; font: 500 .72rem 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: .4rem; }
.card .ct { display: block; font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.45; }
.card img { display: block; width: 100%; max-height: ${V('card-img-h')}; object-fit: cover; margin: .6rem 0 0; }
.card .cl { display: block; font-family: 'Fraunces', Georgia, serif; font-style: italic; color: #6e6e6e; margin-top: .5rem; }
.card .co { display: inline-block; margin-top: .7rem; font: 500 .78rem 'Space Grotesk', sans-serif; color: #1a1a1a; text-decoration: none; border-bottom: 1px solid #1a1a1a; }
.card .cs { display: block; margin-top: .8rem; padding-top: .5rem; border-top: 1px solid #f0ede8; font-size: .8rem; color: #6e6e6e; }
.card .cs button { font: inherit; color: #1a1a1a; background: none; border: 0; padding: 0; cursor: pointer; text-align: left; }
.card .cs button + button::before { content: " · "; color: #ccc; }
.card .tr { display: block; font: 400 .72rem 'Space Grotesk', sans-serif; color: #9a958c; margin-bottom: .5rem; }
.card .tr button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.card .tr button + button::before { content: " › "; }
.f.on, .f.on a { color: #1a1a1a; }
.v-b .tex a.u, .v-d .tex a.u { cursor: pointer; }
.v-b .tex .f:hover a.u, .v-d .tex .f:hover a.u, .v-c .tex .f:hover a.u { color: #1a1a1a; }

/* c: a fact lifted out like a making */
.fl { float: left; clear: left; width: ${V('fl-w')}; margin: .4rem 1.5rem 1rem 0; padding-top: .6rem; border-top: 1px solid #1a1a1a; color: #1a1a1a; font-size: ${V('body-size')}; line-height: 1.55; text-align: left; hyphens: none; animation: up .28s cubic-bezier(.4,0,.2,1); }
.fl.r { float: right; clear: right; margin: .4rem 0 1rem 1.5rem; }
.fl .ck { display: block; font: 500 .72rem 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: .5rem; }
.fl .ct { display: block; font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; line-height: 1.45; }
.fl img { display: block; width: 100%; max-height: ${V('photo-max-h')}; object-fit: cover; margin-top: .6rem; }
.fl .cl { display: block; font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: .85rem; color: #6e6e6e; margin-top: .4rem; }
.fl .co { display: inline-block; margin-top: .6rem; font: 500 .78rem 'Space Grotesk', sans-serif; color: #1a1a1a; text-decoration: none; border-bottom: 1px solid #1a1a1a; }
.f.gone { opacity: ${V('gone')}; }
@keyframes up { from { opacity: 0; transform: translateY(6px); } }

/* d: the rabbit hole lights what a fact shares */
.v-d .tex.lit .f { opacity: ${V('dim')}; transition: opacity .2s cubic-bezier(.4,0,.2,1); }
.v-d .tex.lit .f.on, .v-d .tex.lit .f.rel { opacity: 1; }
.v-d .tex .f.rel, .v-d .tex .f.rel a { color: #1a1a1a; }
.v-d .tex .f.rel a.u { text-decoration-color: ${V('rel-line')}; }
.v-d .tex .f.on a.u { text-decoration-color: #1a1a1a; }
.v-d .card { position: fixed; right: 16px; bottom: 16px; max-height: calc(100vh - 32px); overflow: auto; }

@media (max-width: 768px) { main { padding-left: 16px; padding-right: 16px; } }
@media (max-width: 700px) {
  .lift, .lift.r, .fl, .fl.r { float: none; width: auto; margin: 1rem 0; display: block; }
  .v-d .card { left: 16px; right: 16px; width: auto; max-height: 50vh; }
}
@media (prefers-reduced-motion: reduce) { .fl { animation: none; } }
</style>
<script>{ const v = new URLSearchParams(location.search).get('v'); if (/^[abcd]$/.test(v || '')) document.documentElement.dataset.v = v; }</script>
</head>
<body>
<header class="ask">
<h1>23 · Every fact a door</h1>
<p>18 d, with ${linked} of its ${units.length} facts and makings opening onto a page of the site or a page out. What does each one open?</p>
<ol>
<li><a href="?v=a"><b>a</b><span>plain links, shown only near the pointer</span></a></li>
<li><a href="?v=b"><b>b</b><span>a small card: what it is, a picture or a line, then the way out</span></a></li>
<li><a href="?v=c"><b>c</b><span>the fact is lifted out of the block, like the makings</span></a></li>
<li><a href="?v=d"><b>d</b><span>facts that share a name light each other, a trail, then out</span></a></li>
</ol>
</header>
<main>
<a href="/" class="mobile-header">kahran</a>
<div class="page-header">
<h1>about</h1>
</div>
${['a', 'b', 'c', 'd'].map(D).join('\n')}
</main>
<nav>
<a href="/" class="nav-name">kahran</a>
<a href="/poetry.html">poetry</a>
<a href="/photography.html">photography</a>
<a href="/projects.html">projects</a>
<a href="/lately/">lately</a>
<a href="/working-with-me.html">work with me</a>
<a href="/speaking.html">speaking</a>
<a href="/archive.html">archive</a>
<a href="/about.html" class="active" aria-current="page">about</a>
<a href="/v1/">v1</a>
</nav>
<script type="application/json" id="units">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
<script src="doors.js"></script>
<script src="tune.js"></script>
</body>
</html>
`;
const out = path.join(HERE, 'index.html');
if (existsSync(out) && readFileSync(out, 'utf8') !== html) { mkdirSync(path.join(HERE, '.prev'), { recursive: true }); copyFileSync(out, path.join(HERE, '.prev', `index-${Date.now()}.html`)); }
writeFileSync(out, html);
console.log(`studies/23: ${linked} of ${units.length} facts and makings link (${ledgerOut.coverage.internal} in the site, ${ledgerOut.coverage.external} out); ${ledgerOut.coverage.with_see} share a name with another`);
