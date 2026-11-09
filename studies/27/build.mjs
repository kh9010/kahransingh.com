#!/usr/bin/env node
// Study 27: 19 b's years holding 18 d's makings-out-of-facts, with 25 d's lift. The units, doors and kin are 25's,
// built the same way from the same sources (sources.json copied from studies/25; this part kept in step by hand);
// new here: each fact's row in the years, with a reason when the fact carries no year, and 19 b's lanes.
// Writes index.html (style from page.css, dials from defaults.json) + links.json (25's doors and kin) + years.json.
// node studies/27/build.mjs   (check.mjs then proves it)
// node studies/27/build.mjs --about [--check]   the live About: /about.html is version a of the committed index.html, as a site
//   page (Kahran picked 27 a, 8 Nov; live 9 Nov), and /about.js is kin.js byte for byte. It reads only this study's committed
//   page and touches none of the study's files, so the About is exactly what he picked, and a rebuild changes nothing until
//   the study itself is rebuilt. --check exits 1 if either file differs from what this would write.
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

if (process.argv.includes('--about')) {
  const s = readFileSync(path.join(HERE, 'index.html'), 'utf8');
  const take = (re, what) => { const m = re.exec(s); if (!m) throw new Error(`build --about: ${what} not found in studies/27/index.html`); return m[1]; };
  const desc = take(/<meta name="description" content="([^"]+)">/, 'description');
  const style = take(/<style>\n([\s\S]*?)<\/style>/, 'style');
  const a = take(/(<div class="v v-a" data-v="a">[\s\S]*?<\/div>\n)<div class="v v-b"/, 'version a');
  const head = take(/<main>\n([\s\S]*?)<div class="v v-a"/, 'the page header');
  const nav = take(/(<nav>[\s\S]*?<\/nav>)/, 'nav');
  const units = take(/(<script type="application\/json" id="units">[\s\S]*?<\/script>)/, 'units');
  // the wall's flow view moved to /v2/#flow on 9 Nov; the stone forwards /#flow, but a link should not need forwarding
  const flow = (h) => h.replaceAll('"/#flow"', '"/v2/#flow"');
  // The tools making's caption is 07's "the five ideas on the home page", written when the wall had five. The live page counts:
  // the ideas from IDEAS in /v2/home.js (the one table), the ones listed from the list above the caption. Not one of the facts.
  const homeJs = read('v2/home.js');
  const IDEAS = new Function(homeJs.slice(homeJs.indexOf('var IDEAS'), homeJs.indexOf('];', homeJs.indexOf('var IDEAS')) + 2) + '; return IDEAS')();
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const ideasLine = (h) => {
    const re = /(<a class="lh u" data-id="lift:tools"[\s\S]*?)<span data-t="p" class="from">the five ideas on the <a href="\/">home page<\/a><\/span data-t="p">/;
    const m = re.exec(h); if (!m) throw new Error('build --about: the tools caption "the five ideas on the home page" moved; look again');
    const listed = (m[1].match(/data-id="item:/g) || []).length, all = IDEAS.length;
    const words = listed === all ? `the ${NUM[all]} ideas` : `${NUM[listed]} of the ${NUM[all]} ideas`;
    return h.replace(re, `$1<span data-t="p" class="from">${words} on the <a href="/">home page</a></span data-t="p">`);
  };
  const URL_ = 'https://kahransingh.com/about.html', IMG = 'https://kahransingh.com/wedding/photos/wedding-day/NVP_KAHRANXGOURAV_WEDDING-1361.jpg';
  const page = `<!DOCTYPE html>
<html lang="en" data-v="a">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>About — Kahran Singh</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="About — Kahran Singh">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${URL_}">
<meta property="og:image" content="${IMG}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="About — Kahran Singh">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${IMG}">
<link rel="canonical" href="${URL_}">
<link rel="stylesheet" href="/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">
<style>
${style}</style>
<!-- Google tag (gtag.js). The home opens this page inside itself to fly a photograph into its year; that is the home's
     year_open event, not a visit here, so a framed copy sends no page view. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H63H3KD6WQ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  if (window.top === window) gtag('config', 'G-H63H3KD6WQ');
</script>
</head>
<body>
<main>
${head}${ideasLine(flow(a))}</main>
${nav}
${flow(units)}
<script src="/about.js"></script>
<script src="/track.js"></script>
</body>
</html>
`;
  const kin = readFileSync(path.join(HERE, 'kin.js'), 'utf8');
  const outs = [[path.join(ROOT, 'about.html'), page], [path.join(ROOT, 'about.js'), kin]];
  if (process.argv.includes('--check')) {
    const stale = outs.filter(([f, t]) => !existsSync(f) || readFileSync(f, 'utf8') !== t).map(([f]) => path.relative(ROOT, f));
    if (stale.length) { console.log(`about: ${stale.join(', ')} not what studies/27/build.mjs --about writes`); process.exit(1); }
    console.log('about: about.html and about.js are 27 a as built'); process.exit(0);
  }
  for (const [f, t] of outs) writeFileSync(f, t);
  console.log(`about: about.html ${page.length} bytes (27 a), about.js ${kin.length} bytes (kin.js)`);
  process.exit(0);
}
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
const sAbout = read('v2/about.html'); // the desk's About (the letter), archived at /v2/ on 9 Nov
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
  if (r.week) return { id: `week:${r.week.id.replace('record-', '')}`, k, y: r.y, date: r.week.date, text: r.week.summary, html: esc(r.week.summary), href: r.week.link, how: 'the week’s own page (lately/entries.json)' };
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


// ---- kin: every tie between two facts, with its kind and its reason, from data already on the site
// name: a proper name both carry (23's rule, minus Washington DC vs Washington state) · page: both open the same page
// hand: sources.json's pairs, each with its reason · photo: a poem's page carries the photograph from that place (its og:image)
// home: the home showed the poem and the photograph together that day (v2/days.json) · next: the week or the job before/after
// theme: the poems the site files under the same themes (poems/related.js) · year: the same year on the ledger
// making: a making and the things lifted inside it
const KINDS = ['hand', 'photo', 'home', 'name', 'page', 'next', 'theme', 'year', 'making'];
const kin = new Map(units.map((u) => [u.id, new Map()]));
const tie = (a, b, kind, ab, ba = ab) => {
  if (a === b) return;
  for (const [x, y, why] of [[a, b, ab], [b, a, ba]]) {
    const m = kin.get(x), cur = m.get(y);
    if (!cur || KINDS.indexOf(kind) < KINDS.indexOf(cur.kind)) m.set(y, { kind, why });
  }
};
const byId = Object.fromEntries(units.map((u) => [u.id, u]));
const group = (ids, kind, why, max = 16) => { if (ids.length >= 2 && ids.length <= max) for (const a of ids) for (const b of ids) tie(a, b, kind, why); };

// name
const dict = new Set(readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((w) => w.toLowerCase()));
const ALLOW = new Set(['washington', 'colorado', 'japan', 'california', 'telluride', 'armoire', 'boulder', 'maine']);
const english = (w) => [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'), w.replace(/ed$/, ''), w.replace(/d$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e')].some((x) => dict.has(x));
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f\u02bb]/g, '');
const shown = new Map();
const tokens = (u) => {
  const s = norm(u.text + ' ' + (u.sub || '')).replace(/\bWashington, DC\b/g, 'DC');
  const out = new Set();
  for (const m of s.matchAll(/\b[A-Z][A-Za-z]{2,}\b/g)) { const w = m[0].toLowerCase(); if ((!english(w) || ALLOW.has(w)) && w !== 'kahran') { out.add(w); if (!shown.has(w)) shown.set(w, m[0] === 'Hawaii' ? 'Hawaiʻi' : m[0]); } }
  return out;
};
const byTok = new Map();
for (const u of units) for (const t of tokens(u)) byTok.set(t, [...(byTok.get(t) || []), u.id]);
for (const [t, ids] of byTok) group(ids, 'name', shown.get(t), 12);

// page (the generic pages many facts land on are not a kinship)
const generic = new Set(['/cv.html', '/#flow', '/photography.html', '/speaking.html', '/lately/', '/projects.html']);
const byHref = new Map();
for (const u of units) if (u.href && !generic.has(u.href)) byHref.set(u.href, [...(byHref.get(u.href) || []), u.id]);
for (const ids of byHref.values()) for (const a of ids) for (const b of ids) {
  const fa = a.startsWith('film:'), pb = b.startsWith('poem:');
  if (fa && pb) tie(a, b, 'page', 'the poem', 'its film'); else if (!(b.startsWith('film:') && a.startsWith('poem:'))) tie(a, b, 'page', 'the same page');
}

// hand
const match = (p) => { if (units.some((u) => u.id === p)) return [p]; const star = p.endsWith(':*'), hits = units.filter((u) => star ? u.id.startsWith(p.slice(0, -1)) : u.id === p || u.id.startsWith(p + '-')).map((u) => u.id); if (!hits.length || (!star && hits.length > 1)) throw new Error(`build: see names ${p} (${hits.length})`); return hits; };
for (const [a, b, why] of SRC.see) { if (!why) throw new Error(`build: hand pair ${a} ${b} has no reason`); for (const x of match(a)) for (const y of match(b)) tie(x, y, 'hand', why.replace(/ \(cv\.html.*\)$/, '')); }

// photo: the photograph a poem's own page carries (og:image), when it is one of the site's captioned photographs
const placeOfSrc = new Map(data.photos.map((p) => [p.src, p.caption.split(' — ')[0]]));
const placeId = (k) => `place:${slug(k)}`;
for (const p of data.poems) {
  const og = /<meta property="og:image" content="https:\/\/kahransingh\.com([^"]+)"/.exec(read(`poems/${p.slug}.html`))?.[1];
  const k = og && placeOfSrc.get(og);
  if (k && byId[placeId(k)]) tie(`poem:${p.slug}`, placeId(k), 'photo', 'its photograph', 'poems with this photograph');
}
// home: the day's pair
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
for (const [day, d] of Object.entries(JSON.parse(read('v2/days.json')).days)) {
  const k = placeOfSrc.get(d.photo), a = `poem:${d.poem}`;
  if (k && byId[a] && byId[placeId(k)]) { const [, m, dd] = day.split('-'); tie(a, placeId(k), 'home', `the home, ${+dd} ${MON[m - 1]}`); }
}

// next: the weeks in order; the jobs in the CV's order (sub-lines that belong to a job are hand pairs, not jobs)
const wk = units.filter((u) => u.id.startsWith('week:'));
wk.forEach((u, i) => { if (wk[i + 1]) tie(u.id, wk[i + 1].id, 'next', 'the week before', 'the week after'); });
const startYear = (y) => +(/(\d{4})/.exec(y || '')?.[1] || 0);
const sub = /^row:(portfolio-includes|clients-included|mobile-product-lead)/;
const jobs = units.filter((u) => u.k === 'companies' && u.id.startsWith('row:') && !sub.test(u.id)).sort((a, b) => startYear(a.y) - startYear(b.y));
jobs.forEach((u, i) => { if (jobs[i + 1]) tie(u.id, jobs[i + 1].id, 'next', 'after', 'before'); });

// theme: the exact set of themes poems/related.js gives a poem
const themes = new Map([...read('poems/related.js').matchAll(/'([a-z0-9-]+)': \{ themes: \[([^\]]*)\]/g)].map((m) => [m[1], m[2].match(/[a-z]+/g).sort()]));
const byTheme = new Map();
for (const p of data.poems) { const t = themes.get(p.slug); if (t) { const k = t.join(' · '); byTheme.set(k, [...(byTheme.get(k) || []), `poem:${p.slug}`]); } }
for (const [k, ids] of byTheme) group(ids, 'theme', k);

// year: facts that start in the same year, or are all now
const byYear = new Map();
for (const u of units) { if (u.id.startsWith('week:')) continue; const y = u.y === 'now' ? 'now' : startYear(u.y) || null; if (y) byYear.set(y, [...(byYear.get(y) || []), u.id]); }
for (const [y, ids] of byYear) group(ids, 'year', String(y));

// making: a making and what is lifted inside it, or its few facts when nothing is
for (const k of ORDER) {
  const l = `lift:${slug(k)}`, inside = units.filter((u) => u.k === k && /^(art|item):/.test(u.id)).map((u) => u.id);
  const run = units.filter((u) => u.k === k && !u.lift && !/^(art|item):/.test(u.id)).map((u) => u.id);
  for (const x of inside.length ? inside : run.length <= 13 ? run : []) tie(l, x, 'making', k);
}

const order = new Map(units.map((u, i) => [u.id, i]));
for (const u of units) u.kin = [...kin.get(u.id)].map(([id, t]) => ({ id, ...t })).sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || order.get(a.id) - order.get(b.id));
for (const u of units) { u.to = u.href ? titleOf(u.href) : null; if (u.href && /^\//.test(u.href)) { let f = path.join(ROOT, u.href.replace(/[#?].*$/, '')); if (f.endsWith('/')) f = path.join(f, 'index.html'); if (!existsSync(f)) throw new Error(`build: ${u.id} → ${u.href} not on disk`); } }


// ---- the years: every fact's row, and when it is not the fact's own year, the reason it sits there
const ROWS = ['now', ...Array.from({ length: 2025 - 2006 + 1 }, (_, i) => String(2025 - i))];
const rowOfY = (y) => { if (y === 'now') return 'now'; const s = startYear(y); return s >= 2026 ? 'now' : s ? String(s) : null; };
const isInside = (u) => /^(art|item):/.test(u.id);
const runOf = (k) => units.filter((u) => u.k === k && !u.lift && !isInside(u));
const place = {};
for (const u of units) {
  if (u.lift || isInside(u)) continue;
  if (u.id.startsWith('week:')) { const y = u.date.slice(0, 4); place[u.id] = { row: y === '2026' ? 'now' : y, how: `dated ${u.date} in lately/entries.json` }; continue; }
  if (u.id.startsWith('poem:')) { place[u.id] = { row: 'now', how: 'no year on the poem’s page; one of the home’s poems now (v2/data.json)' }; continue; }
  if (u.id.startsWith('place:')) { place[u.id] = { row: 'now', how: 'no year on the photograph; one of the home’s photographs now (v2/data.json)' }; continue; }
  const r = rowOfY(u.y);
  if (!r || !ROWS.includes(r)) throw new Error(`build: ${u.id} (${u.y}) has no row`);
  place[u.id] = { row: r, how: null };
}
for (const k of ORDER) {
  const first = runOf(k)[0], row = place[first.id].row;
  place[`lift:${slug(k)}`] = { row, how: `lifted at its first line (${first.id})` };
  for (const u of units.filter((x) => x.k === k && isInside(x))) place[u.id] = { row, how: `inside ${k}, lifted at ${row}` };
}
for (const u of units) if (!place[u.id]) throw new Error(`build: ${u.id} has no row`);

// the long things, as 19 b: a lane each, packed; the CV's sub-lines ride their job's lane
const spans = [];
for (const u of units) {
  if (sub.test(u.id)) continue;
  const m = /^(\d{4})–(\d{2,4})?$/.exec(u.y || ''); if (!m) continue;
  const to = m[2] ? +(m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]) : 2026;
  spans.push({ g: u.id, from: +m[1], to });
}
const laneEnd = [];
for (const s of spans.sort((a, b) => a.from - b.from)) {
  let L = laneEnd.findIndex((end) => end < s.from);
  if (L < 0) { L = laneEnd.length; laneEnd.push(0); }
  laneEnd[L] = s.to; s.lane = L;
}
const yearNum = (r) => (r === 'now' ? 2026 : +r);
const lanes = (r) => `<span class="ln">${laneEnd.map((_, L) => {
  const s = spans.find((x) => x.lane === L && x.from <= yearNum(r) && yearNum(r) <= x.to);
  return s ? `<span class="lane on${s.from === yearNum(r) ? ' start' : ''}" data-g="${s.g}"></span>` : '<span class="lane"></span>';
}).join('')}</span>`;

// ---- the block: 18 d's markup, each fact a door (as 23 and 25), now held by the years
const fact = (u) => {
  const y = u.y ? `<b>${u.y}</b> ` : '';
  const body = u.href ? `<a class="u" href="${u.href}">${u.html}</a>` : u.html;
  return `<span class="f" data-id="${u.id}">${y}${body}</span>`;
};
const lift = (k, side) => {
  const u = byId[`lift:${slug(k)}`];
  return `<span class="lift ${side}"><a class="lh u" data-id="${u.id}" href="${u.href}">${k}</a>${liftArt[k] ? `<span class="la">${liftArt[k]}</span>` : ''}</span>`;
};
const side = (k) => (ORDER.indexOf(k) % 2 ? 'r' : 'l');
const facts = units.filter((u) => !u.lift && !isInside(u)); // 18 d's order
const inRow = (r) => facts.filter((u) => place[u.id].row === r);
const liftsIn = (r) => ORDER.filter((k) => place[`lift:${slug(k)}`].row === r);
const chars = (r) => inRow(r).reduce((n, u) => n + u.text.length + (u.y || '').length + 3, 0);
// a, d: the lifts sit in the run, before their making's first fact of that year; b, c: in a column of their own
const runHtml = (r, inline) => {
  const out = [], due = new Set(inline ? liftsIn(r) : []);
  for (const u of inRow(r)) { if (due.has(u.k)) { out.push(lift(u.k, side(u.k))); due.delete(u.k); } out.push(fact(u)); }
  return out.join(' ');
};
const yearRow = (v, r) => {
  const empty = !inRow(r).length, inline = v === 'a' || v === 'd';
  const mk = inline ? '' : `<div class="mk">${liftsIn(r).map((k) => lift(k, side(k))).join('')}</div>`;
  return `<div class="yr${empty ? ' empty' : ''}" data-y="${r}"><span class="yl">${empty ? '' : r}</span>${lanes(r)}<div class="run"><span class="ya"${v === 'd' && !empty ? ` id="d-y-${r}"` : ''}></span>${runHtml(r, inline)}</div>${mk}</div>`;
};
const spine = () => `<div class="spine">${ROWS.map((r) => inRow(r).length
  ? `<a class="sy" href="#d-y-${r}" data-y="${r}" style="flex-grow:${chars(r)}"><span class="yl">${r}</span>${lanes(r)}</a>`
  : `<span class="sy empty" data-y="${r}">${lanes(r)}</span>`).join('')}</div>`;
const D = (v) => `<div class="v v-${v}" data-v="${v}">
<p class="lede">${lede07}</p>
<div class="body">${v === 'd' ? spine() : ''}<div class="tex">${ROWS.map((r) => yearRow(v, r)).join('\n')}</div></div>
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

// ---- links.json (25's doors and kin, unchanged) and years.json (where each fact sits, and why)
const linked = units.filter((u) => u.href).length;
const withKin = units.filter((u) => u.kin.length).length;
const byKind = Object.fromEntries(KINDS.map((k) => [k, units.filter((u) => u.kin.some((x) => x.kind === k)).length]));
const ledgerOut = { coverage: { linked, of: units.length, internal: units.filter((u) => u.href?.startsWith('/')).length, external: units.filter((u) => /^https?:/.test(u.href || '')).length, with_kin: withKin, by_kind: byKind }, checked: SRC.checked, kinds: KINDS,
  facts: units.map((u) => ({ id: u.id, making: u.k, text: u.text, href: u.href, to: u.to, how: u.how ?? null, ...(u.href ? {} : { why: u.why }), ...(u.img ? { img: u.img } : {}), ...(u.lines ? { lines: u.lines } : {}), kin: u.kin })) };
writeFileSync(path.join(HERE, 'links.json'), JSON.stringify(ledgerOut, null, 1) + '\n');
const yearsOut = { rows: ROWS, lanes: spans.map(({ g, from, to, lane }) => ({ g, from, to, lane })),
  facts: units.map((u) => ({ id: u.id, y: u.y || null, row: place[u.id].row, ...(place[u.id].how ? { how: place[u.id].how } : {}) })) };
writeFileSync(path.join(HERE, 'years.json'), JSON.stringify(yearsOut, null, 1) + '\n');
const pageData = Object.fromEntries(units.map((u) => [u.id, { k: u.k, y: u.y || '', t: u.text, h: u.href, to: u.to, ...(u.img ? { i: u.img, a: u.alt || '' } : {}), ...(u.lines ? { l: u.lines } : {}), s: u.kin.map((x) => [x.id, x.why]) }]));

const defaults = JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8'));
const V = (k) => `var(--${k}, ${defaults[k]})`;
const css = readFileSync(path.join(HERE, 'page.css'), 'utf8').replace(/\$\{V\('([a-z0-9-]+)'\)\}/g, (m, k) => { if (!(k in defaults)) throw new Error(`build: page.css reads ${k}, not in defaults.json`); return V(k); });
const JSDIALS = ['trail-max', 'jump-max', 'lift-top'];
const undated = units.filter((u) => place[u.id].how).length;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>About — Kahran Singh</title>
<meta name="description" content="${esc(lede06)} The things he makes, lifted out of the years.">
<link rel="stylesheet" href="/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,600&display=swap" rel="stylesheet">
<style>
:root { ${JSDIALS.map((k) => `--${k}: ${defaults[k]};`).join(' ')} }
${css.trim()}
</style>
<script>{ const v = new URLSearchParams(location.search).get('v'); if (/^[abcd]$/.test(v || '')) document.documentElement.dataset.v = v; }</script>
</head>
<body>
<header class="ask">
<h1>27 · The years hold the block</h1>
<p>18 d's makings, 19 b's years, 25 d's lift, as one page. ${units.length} facts, ${units.length - undated} at their own year, ${undated} placed by a recorded reason.</p>
<ol>
<li><a href="?v=a"><b>a</b><span>the block is the years: a run a year, busy years long, each making lifted out at its year</span></a></li>
<li><a href="?v=b"><b>b</b><span>19 b's rows: year, lanes, the run, and the making lifted beside its year</span></a></li>
<li><a href="?v=c"><b>c</b><span>the makings large, the years a small dense ground beside them</span></a></li>
<li><a href="?v=d"><b>d</b><span>18 d's block whole, the years a spine down its side</span></a></li>
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
<script src="kin.js"></script>
<script src="tune.js"></script>
</body>
</html>
`;
const out = path.join(HERE, 'index.html');
if (existsSync(out) && readFileSync(out, 'utf8') !== html) { mkdirSync(path.join(HERE, '.prev'), { recursive: true }); copyFileSync(out, path.join(HERE, '.prev', `index-${Date.now()}.html`)); }
writeFileSync(out, html);
console.log(`studies/27: ${linked} of ${units.length} link; ${withKin} have kin; ${units.length - undated} at their own year, ${undated} placed by reason; ${laneEnd.length} lanes`);
