#!/usr/bin/env node
// Study 18: builds index.html from the site's own words. Every line is lifted from studies/06, studies/07,
// about.html, cv.html or another public page at build time; nothing is typed here but labels and order.
// node studies/18/build.mjs   (check.mjs then proves it)
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const one = (re, s, what) => { const m = re.exec(s); if (!m) throw new Error(`build: ${what} not found`); return m; };

// ---- 06: the ledger, as rows {y, t}
const s06 = read('studies/06/index.html');
const ledger = [...one(/<ol class="ledger">([\s\S]*?)<\/ol>/, s06, '06 ledger')[1].matchAll(/<li><span class="y">([^<]*)<\/span><span class="t">([\s\S]*?)<\/span><\/li>/g)]
  .map((m) => ({ y: m[1], t: m[2] }));
const row = (start) => { const r = ledger.find((l) => l.t.replace(/<[^>]+>/g, '').startsWith(start)); if (!r) throw new Error(`build: 06 line "${start}" missing`); return r; };
const lede06 = one(/<p class="lede">([^<]*)<\/p>/, s06, '06 lede')[1];

// ---- 07: the six makings
const s07 = read('studies/07/index.html');
const makes = Object.fromEntries([...s07.matchAll(/<section class="make">\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)].map((m) => [m[1], m[2]]));
const lede07 = one(/<p class="lede">([^.]*\.)/, s07, '07 lede')[1]; // first sentence: "One of each." is the opposite of this study
const art = (k) => one(/<figure class="art">([\s\S]*?)<\/figure>/, makes[k], `07 ${k} art`)[1].trim();
const txt = (k) => one(/<div class="text">([\s\S]*?)<\/div>/, makes[k], `07 ${k} text`)[1].trim();

// ---- about.html: the poems line, the photograph-and-poem sentence, his close (rulings 28 Oct)
const sAbout = read('v2/about.html'); // the desk's About (the letter), archived at /v2/ on 9 Nov
const aboutPoems = one(/<p>(How the World Works, a first book, 2022, and one a day[^<]*)<\/p>/, sAbout, 'about poems line')[1];
const aboutPhoto = one(/(The <a href="\/">photograph and poem on the home page<\/a> come out of the same machine, one of each a day\.)/, sAbout, 'about photo sentence')[1];
const close = one(/<p>(Write to me\.[\s\S]*?Tell me what’s going on\.) <span class="sign">/, sAbout, 'his close')[1];

// ---- cv.html, speaking, poem films, data.json, lately
const sCv = read('cv.html');
const cvLine = (s) => { if (!sCv.replace(/&amp;/g, '&').includes(s)) throw new Error(`build: cv lacks "${s}"`); return esc(s); };
const talks = [...sCv.matchAll(/<p class="cv-entry-title">(?:<a href="(https:\/\/www\.youtube[^"]+)"[^>]*>)?([^<]+)(?:<\/a>)?<\/p>\s*(?:<p class="cv-entry-role">([^<]*)<\/p>\s*)?(?:<p class="cv-entry-desc">[^<]*<\/p>\s*)?<\/div>\s*<p class="cv-entry-year">((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})<\/p>/g)]
  .map((m) => ({ y: m[4], t: m[1] ? `<a href="${m[1]}">${m[2]}</a>` : m[2] }));
if (talks.length < 8) throw new Error(`build: ${talks.length} talks in cv.html`);
const films = [...read('poem-films.html').matchAll(/<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>\s*<p class="film-meta">([^<]+)<\/p>/g)].map((m) => ({ y: '2024', t: `<a href="${m[1]}">${m[2]}</a> <em>${m[3]}</em>` }));
if (films.length !== 4) throw new Error(`build: ${films.length} poem films`);
const data = JSON.parse(read('v2/data.json'));
const poems = data.poems.map((p) => `<a href="/poems/${p.slug}.html">${esc(p.title)}</a>`);
const places = [...new Set(data.photos.map((p) => p.caption.split(' — ')[0]))].map(esc);
const weeks = JSON.parse(read('lately/entries.json')).entries.map((e) => ({ y: e.title, t: `<a href="${e.link}">${esc(e.summary)}</a>` }));

// ---- the runs: each making's own facts (no poem count, no camera: rulings of 28 Oct)
const howBook = { y: '2022', t: 'How the World Works, a first book of poems.' };
if (!row('How the World Works').t.startsWith(howBook.t)) throw new Error('build: 06 book line moved');
const runs = {
  poems: { rows: [row('MFA candidate'), howBook], list: poems, kind: 'cols' },
  photographs: { list: places, kind: 'inline', more: '<a href="/photography.html">the photographs &rarr;</a>' },
  tools: { rows: [row('Building software'), ...weeks] },
  companies: { rows: [row('Board of TomboyX'), row('Chief Revenue Officer'), row('Co-founded'), row('Advisor to Armoire'), row('General Partner'), { y: '2017–', t: cvLine('Portfolio includes Armoire, Humanly, and Kosha.') }, row('Vidyanext'), row('Aditi Technologies'), { y: '2012–15', t: cvLine('Clients included Dodge Data & Analytics (McGraw-Hill) and TUI Travel.') }, row('DataSphere'), { y: '2011–12', t: cvLine('Mobile product lead for a late-stage 300-person startup.') }, row('TravelPost'), row('Microsoft')] },
  speaking: { rows: [row('A panel at the Common Ground'), row('Mentor at StartOut'), ...talks] },
  'films and installations': { rows: [row('Poem Films'), ...films] },
  dance: { rows: [row('Learning Kathak')] },
};
const rest = [row('Married Gourav'), row('Eloped with Gourav'), row('Tufts University')];
const ORDER = ['poems', 'photographs', 'tools', 'companies', 'speaking', 'films and installations', 'dance'];

// ---- pieces
const piece = (k) => k === 'speaking' ? null : {
  poems: { art: art('poems'), text: `<p>${aboutPoems}</p>\n<a class="more" href="/poetry.html">all the poems &rarr;</a>` },
  photographs: { art: art('photographs').replace(/ &mdash; Leica Q2 Monochrome/, ''), text: `<p>${aboutPhoto}</p>\n<a class="more" href="/photography.html">the photographs &rarr;</a>` },
}[k] || { art: art(k), text: txt(k) };
for (const k of ORDER) if (k !== 'speaking' && !makes[k]) throw new Error(`build: 07 has no "${k}"`);

const rowsHtml = (rows, cls = 'ledger') => `<ol class="${cls}">\n${rows.map((r) => `<li><span class="y">${r.y}</span><span class="t">${r.t}</span></li>`).join('\n')}\n</ol>`;
const listHtml = (items, cls) => `<ul class="${cls}">\n${items.map((t) => `<li>${t}</li>`).join('\n')}\n</ul>`;
const runHtml = (k) => { const r = runs[k]; return `<div class="run">${r.rows ? rowsHtml(r.rows) : ''}${r.list ? listHtml(r.list, r.kind === 'cols' ? 'cols' : 'inline') : ''}</div>`; };
const makeHtml = (k, extra = '', i = 0) => { const p = piece(k); return `<section class="make" style="--i:${i}">\n<h2>${k}</h2>\n${p ? `<figure class="art">\n${p.art}\n</figure>\n<div class="text">\n${p.text}\n</div>\n` : ''}${extra}</section>`; };
const foot = `<p class="close">${close}</p>
<div class="foot">
<a class="cv" href="/cv.html">Full CV &rarr;</a>
<div class="contact-row">
<a href="mailto:hello@joyus.studio">hello@joyus.studio</a>
<a href="https://instagram.com/kahran">Instagram</a>
<a href="https://medium.com/@kahrans">Medium</a>
</div>
</div>`;
const head = (v) => `<div class="v v-${v}" data-v="${v}">\n<p class="lede">${lede07}</p>`;

// a: each making opens onto its own run of facts
const A = `${head('a')}\n${ORDER.map((k) => makeHtml(k, runHtml(k))).join('\n')}\n<section class="make rest"><h2>years</h2>${rowsHtml(rest)}</section>\n${foot}\n</div>`;

// the whole ledger, flat, newest kinds first: what b runs beside, c dissolves into, d is made of
const flatRows = [...ORDER.flatMap((k) => runs[k].rows || []), ...rest];
const fact = (r) => `<span class="f"><b>${r.y}</b> ${r.t}</span>`;
const flat = [...flatRows.map(fact), ...places.map((p) => `<span class="f">${p}</span>`), ...poems.map((p) => `<span class="f">${p}</span>`)];

// b: 07 in front; the ledger the full height beside it
const B = `${head('b')}\n<div class="b-grid">\n<div class="front">\n${ORDER.filter((k) => k !== 'speaking').map((k) => makeHtml(k)).join('\n')}\n${foot}\n</div>\n<aside class="behind" aria-label="ledger"><p>${flat.join(' ')}</p></aside>\n</div>\n</div>`;

// c: starts as 07; each step down is smaller and quieter until the makings are the ledger
const cSteps = [
  ...ORDER.filter((k) => k !== 'speaking').map((k) => ({ html: (i) => makeHtml(k, '', i) })),
  { html: (i) => `<section class="step" style="--i:${i}">${rowsHtml(flatRows.filter((r) => ledger.includes(r) || r === howBook))}</section>` },
  { html: (i) => `<section class="step" style="--i:${i}">${rowsHtml([...talks, ...films, runs.companies.rows.find((r) => r.t.startsWith('Portfolio')), ...runs.companies.rows.filter((r) => /^(Clients|Mobile product lead)/.test(r.t))])}</section>` },
  { html: (i) => `<section class="step" style="--i:${i}">${rowsHtml(weeks)}</section>` },
  { html: (i) => `<section class="step" style="--i:${i}"><p class="mass">${places.map((p) => `<span class="f">${p}</span>`).join(' ')}</p></section>` },
  { html: (i) => `<section class="step" style="--i:${i}"><p class="mass">${poems.map((p) => `<span class="f">${p}</span>`).join(' ')}</p></section>` },
];
const C = `${head('c')}\n${cSteps.map((s, i) => s.html(i)).join('\n')}\n${foot}\n</div>`;

// d: the facts are the ground; each making is lifted out of the run of its own facts
const lift = (k, side) => { const p = piece(k); return `<span class="lift ${side}"><span class="lh">${k}</span>${p ? `<span class="la">${p.art.replace(/<(\/?)(figcaption|blockquote|ul|li|p)\b/g, '<$1span data-t="$2"')}</span>` : ''}</span>`; };
const dRun = (k) => [...(runs[k].rows || []).map(fact), ...(runs[k].list || []).map((t) => `<span class="f">${t}</span>`)];
const D = `${head('d')}\n<p class="tex">${ORDER.map((k, i) => `${lift(k, i % 2 ? 'r' : 'l')}${dRun(k).join(' ')}`).join(' ')} ${rest.map(fact).join(' ')}</p>\n${foot}\n</div>`;

const defaults = JSON.parse(read('studies/18/defaults.json'));
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
/* the ask (no ?v) */
.ask { display: none; padding: 15vh 16px 4rem; margin: 0 auto; max-width: 560px; font: 400 .78rem/1.5 'Space Grotesk', sans-serif; color: #1a1a1a; }
.ask h1 { font: 500 .72rem 'Space Grotesk', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: 1rem; }
.ask p { font: 400 1.0625rem/1.55 'Fraunces', Georgia, serif; margin-bottom: 1.25rem; }
.ask ol { list-style: none; display: grid; gap: 8px; }
.ask a { display: grid; grid-template-columns: 1.5rem 1fr; text-decoration: none; color: inherit; background: #fff; border: 1px solid #e0ddd8; border-radius: 6px; padding: 12px; }
.ask a b { font-weight: 500; }
.ask a span { color: #6e6e6e; }
html:not([data-v]) body { display: block; }
html:not([data-v]) .ask { display: block; }
html:not([data-v]) main, html:not([data-v]) nav { display: none; }
.v { display: none; }
html[data-v="a"] .v-a, html[data-v="b"] .v-b, html[data-v="c"] .v-c, html[data-v="d"] .v-d { display: block; }

/* shared: 07's frame */
main { max-width: ${V('measure')}; }
.lede { font-family: 'Fraunces', Georgia, serif; font-size: ${V('lede-size')}; line-height: 1.5; margin-bottom: ${V('section-gap')}; }
.make { display: grid; grid-template-columns: ${V('art-w')} 1fr; gap: 0 ${V('gap')}; padding-top: 1.25rem; margin-bottom: ${V('section-gap')}; border-top: 1px solid ${V('rule')}; }
.make h2 { grid-column: 1 / -1; font-family: 'Space Grotesk', sans-serif; font-size: .72rem; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: #6e6e6e; margin-bottom: 1rem; }
.art { margin: 0; line-height: 0; }
.art img { width: 100%; max-height: ${V('photo-max-h')}; object-fit: cover; display: block; filter: contrast(1.05); }
.art figcaption, .art .from { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: .8rem; color: #6e6e6e; line-height: 1.5; padding-top: .5rem; }
.art figcaption a, .art .from a { color: #6e6e6e; text-decoration: none; }
.poem { font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.6; color: #1a1a1a; }
.list { list-style: none; font-size: ${V('body-size')}; line-height: 1.6; }
.list li { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid #f0ede8; padding: .3rem 0; }
.list li:first-child { border-top: 0; padding-top: 0; }
.list li span { color: #6e6e6e; white-space: nowrap; }
.list li a { color: #1a1a1a; text-decoration: none; }
.list.stack li { display: block; }
.list.stack li span { display: block; white-space: normal; font-size: .8rem; line-height: 1.5; }
.text p { font-size: ${V('body-size')}; line-height: 1.7; color: #1a1a1a; }
.text p + p { margin-top: .6rem; }
.text a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 2px; text-decoration-color: #ccc; }
.text .more { display: inline-block; margin-top: .75rem; font-size: .85rem; color: #6e6e6e; text-decoration: none; }
.close { font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.75; max-width: 560px; margin: ${V('section-gap')} 0 0; padding-top: 1.5rem; border-top: 1px solid #e0ddd8; }
.foot { margin-top: 1.5rem; }
.foot .cv { font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; color: #1a1a1a; text-decoration: none; }
.foot .contact-row { margin-top: 1.25rem; padding-top: 0; border-top: 0; }
.f b, .ledger .y { font-weight: 500; font-size: .85em; letter-spacing: .06em; color: #6e6e6e; }
.f a, .ledger a, .cols a, .mass a { color: inherit; text-decoration: none; }
em { font-style: normal; color: #9a958c; }

/* a: under each making, its run */
.run { grid-column: 1 / -1; margin-top: 1.25rem; font-size: ${V('fact-size')}; line-height: ${V('fact-lh')}; color: ${V('fact-ink')}; }
.run .ledger { list-style: none; }
.run .ledger li { display: grid; grid-template-columns: ${V('year-w')} 1fr; gap: 0 1rem; padding: .2rem 0; border-top: 1px solid #f0ede8; }
.run .ledger .t { color: #1a1a1a; }
.run .cols { list-style: none; columns: ${V('run-cols')}; column-gap: 1.5rem; margin-top: .75rem; }
.run .cols li { break-inside: avoid; padding: .05rem 0; }
.run .inline { list-style: none; }
.run .inline li { display: inline; }
.run .inline li + li::before { content: " · "; color: #ccc; }
.rest .ledger { grid-column: 1 / -1; list-style: none; font-size: ${V('fact-size')}; line-height: ${V('fact-lh')}; }
.rest .ledger li { display: grid; grid-template-columns: ${V('year-w')} 1fr; gap: 0 1rem; padding: .2rem 0; border-top: 1px solid #f0ede8; }

/* b: the ledger beside, the full height, quiet */
html[data-v="b"] main { max-width: ${V('b-wide')}; }
.b-grid { display: grid; grid-template-columns: minmax(0, ${V('measure')}) minmax(0, 1fr); gap: 0 ${V('gap')}; }
.behind p { font-size: ${V('b-size')}; line-height: ${V('b-lh')}; color: ${V('b-ink')}; text-align: justify; hyphens: auto; }
.behind .f b { color: inherit; }
.behind .f + .f::before { content: "· "; }

/* c: each step smaller and quieter than the last */
.v-c .make, .v-c .step { font-size: max(${V('c-min')}, calc(${V('c-start')} - var(--i) * ${V('c-step')})); }
.v-c .make { grid-template-columns: max(200px, calc(${V('art-w')} - var(--i) * 16px)) 1fr; opacity: calc(1 - var(--i) * .03); }
.v-c .make .text p, .v-c .make .list, .v-c .make .poem { font-size: 1em; }
.v-c .step { margin-bottom: 1.5rem; padding-top: .75rem; border-top: 1px solid #f0ede8; line-height: 1.45; color: #6e6e6e; }
.v-c .step .ledger { list-style: none; }
.v-c .step .ledger li { display: grid; grid-template-columns: ${V('year-w')} 1fr; gap: 0 1rem; padding: .1rem 0; }
.v-c .mass { text-align: justify; }
.v-c .mass .f + .f::before { content: "· "; color: #ccc; }

/* d: the facts are the ground; the makings are lifted out of it */
.tex { font-size: ${V('d-size')}; line-height: ${V('d-lh')}; color: ${V('d-ink')}; text-align: justify; hyphens: auto; }
.tex .f b { color: inherit; }
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
.v-d .close { clear: both; }

@media (max-width: 900px) { .b-grid { grid-template-columns: 1fr; } .behind { margin-top: ${V('section-gap')}; } }
@media (max-width: 768px) { main { padding-left: 16px; padding-right: 16px; } }
@media (max-width: 700px) {
  .make, .v-c .make { grid-template-columns: 1fr; }
  .art { margin-bottom: 1rem; }
  .list li { flex-wrap: wrap; }
  .run .cols { columns: 2; }
  .lift, .lift.r { float: none; width: auto; margin: 1rem 0; display: block; }
}
</style>
<script>{ const v = new URLSearchParams(location.search).get('v'); if (/^[abcd]$/.test(v || '')) document.documentElement.dataset.v = v; }</script>
</head>
<body>
<header class="ask">
<h1>18 · The things I make, with the weight of the facts</h1>
<p>07 is the spine and carries 06’s whole ledger: every poem, place, week, company and talk already on the site. Where should the volume sit?</p>
<ol>
<li><a href="?v=a"><b>a</b><span>under each making, its own run of facts</span></a></li>
<li><a href="?v=b"><b>b</b><span>07 in front, the ledger the full height beside it</span></a></li>
<li><a href="?v=c"><b>c</b><span>starts as 07, shrinks into the ledger</span></a></li>
<li><a href="?v=d"><b>d</b><span>the ledger as a block of type, each making lifted out</span></a></li>
</ol>
</header>
<main>
<a href="/" class="mobile-header">kahran</a>
<div class="page-header">
<h1>about</h1>
</div>
${A}
${B}
${C}
${D}
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
<script src="tune.js"></script>
</body>
</html>
`;

const out = path.join(HERE, 'index.html');
if (existsSync(out) && readFileSync(out, 'utf8') !== html) { mkdirSync(path.join(HERE, '.prev'), { recursive: true }); copyFileSync(out, path.join(HERE, '.prev', `index-${Date.now()}.html`)); }
writeFileSync(out, html);
console.log(`studies/18/index.html: ${flat.length} facts, ${poems.length} poems, ${places.length} places, ${weeks.length} weeks, ${talks.length} talks`);
