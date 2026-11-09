#!/usr/bin/env node
// Study 37: the segments a facet can give, every one cut verbatim from something he made that is on the site.
// Reads only the site and the studies' readings:
//   poems/*.html            the live poems (a line is kept only if it is on its page, word for word)
//   v2/data.json            the poems' lines as the home reads them (stanzasOf, from v2/home.js) and the 77 photographs
//   poem-films.html         the four poem films: each film's two worlds, and their posters (video-poems/posters/)
//   about.html              the About: its sentences, its years, the word pile's six lines
//   v2/home.js              the wall's ideas (IDEAS): each idea's sentences
//   studies/21/readings.txt every poem read by hand: its strongest lines and the ideas they hold
//   studies/21/ideas.json   the ideas each photograph was read for
//   studies/32/crossings.json each photograph's year (its own EXIF) and the poem it was paired with (the home's days, or the poem's page)
// Writes segments.json beside this file. Nothing is phrased here: a segment is the site's own text, and what it is linked by.
// Run: node studies/37/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const read = f => readFileSync(path.join(ROOT, f), 'utf8'), J = f => JSON.parse(read(f))
const S = createRequire(import.meta.url)('./segs.js') // the one plain-text reading and word list, shared with the page and the check
const data = J('v2/data.json'), IDEAS21 = J('studies/21/ideas.json'), CROSS = J('studies/32/crossings.json')
const home = read('v2/home.js'), a0 = home.indexOf('function norm'), b0 = home.indexOf('/* ---------------------------------------------------------- the render', a0)
const { stanzasOf } = new Function(home.slice(a0, b0) + '; return { stanzasOf }')()
const live = s => existsSync(path.join(ROOT, 'poems', s + '.html'))
const plainOf = new Map(), plain = f => plainOf.get(f) || (plainOf.set(f, S.plain(read(f), f)), plainOf.get(f))
const onPage = (f, t) => plain(f).includes(S.squash(t))
const dropped = []

// 21's readings: a poem's strongest lines and the ideas each holds
const readings = {}; { let cur = null
  for (const raw of read('studies/21/readings.txt').split('\n')) {
    if (raw.startsWith('@ ')) { cur = raw.slice(2).trim(); readings[cur] = []; continue }
    if (!cur || !raw.trim() || raw.startsWith('#') || /^\s+note:/.test(raw)) continue
    const [phrase, tags] = raw.split(' | '); if (tags) readings[cur].push({ phrase: phrase.trim().split('\\n'), concepts: tags.trim().split(/\s+/) }) } }

// people the About names besides him: a sentence that names one is left out (his work, not his company's or his family's)
const OTHERS = /\b(Divya|Tak|Sweta|Jagirdar|Sahil|Sagar|Rachna|Nivas|Gourav)\b/
const segs = []
const add = s => { segs.push(s) }

/* ---- poem lines: every line of every live poem that is on its page as written; a short line keeps the next with it ---- */
const poems = data.poems.filter(p => live(p.slug))
for (const p of poems) {
  const st = stanzasOf(p), file = `poems/${p.slug}.html`, R = readings[p.slug] || []
  st.forEach((lines, si) => { for (let k = 0; k < lines.length; k++) {
    let take = [lines[k]]; if (S.words(lines[k], true).length < 4 && lines[k + 1]) take.push(lines[k + 1])
    if (take.some(l => !onPage(file, l))) { dropped.push(`${p.slug}: "${take.join(' / ')}"`); continue }
    if (S.words(take.join(' '), true).length < 3 || take.join(' ').length > 140) continue // a segment, not a page: a long prose line is left to its poem
    const concepts = [...new Set(R.filter(r => r.phrase.some(ph => take.some(l => l.includes(ph)))).flatMap(r => r.concepts))]
    const readAt = {}; take.forEach((l, j) => R.filter(r => r.phrase.some(ph => l.includes(ph))).forEach(r => r.concepts.forEach(c => { if (!(c in readAt)) readAt[c] = j }))) // which of its lines 21 read each idea in
    const after = lines.slice(k + take.length, k + take.length + 2).filter(l => onPage(file, l))
    add({ id: `line:${p.slug}:${si}.${k}`, kind: 'line', lines: take, src: file, poem: p.slug, title: p.title, stanza: si, at: k, after, concepts, readAt }) } })
}

/* ---- photographs: his own, with the place in their caption, the year in their EXIF, the ideas they were read for, the poem they were paired with ---- */
const crossBy = Object.fromEntries(CROSS.photos.map(p => [p.src, p]))
for (const ph of data.photos) {
  const place = ph.caption.split(' — ')[0], c = crossBy[ph.src] || {}, slug = ph.src.split('/').pop().replace(/\.[a-z]+$/i, '')
  if (!existsSync(path.join(ROOT, ph.src)) || !onPage('v2/data.json', place)) { dropped.push(ph.src); continue }
  add({ id: 'photo:' + ph.src, kind: 'photo', text: place, img: ph.src, src: 'v2/data.json', place, year: c.y ? String(c.y) : null, taken: c.taken || null,
    concepts: (IDEAS21.photos[slug] || '').split(/\s+/).filter(Boolean), paired: c.poem && live(c.poem) ? { poem: c.poem, why: c.poemWhy, from: c.poemSrc } : null })
}

/* ---- the poem films: each film's two worlds, each with its poster ---- */
{ const page = read('poem-films.html')
  for (const m of page.matchAll(/<h2><a href="\/poems\/([^"]+)\.html">([^<]+)<\/a><\/h2>\s*<p class="film-meta">([^<]+)<\/p>/g)) {
    const [, slug, title, meta] = m; if (!live(slug)) { dropped.push('film ' + slug); continue }
    const worlds = S.plain(meta).split(' · ').map(s => s.trim())
    worlds.forEach((w, k) => { const img = `/video-poems/posters/${slug}-${k + 1}.jpg`; if (!existsSync(path.join(ROOT, img)) || !onPage('poem-films.html', w)) { dropped.push(img); return }
      add({ id: `film:${slug}:${k + 1}`, kind: 'film', text: w, img, src: 'poem-films.html', poem: slug, title, other: worlds[1 - k], year: '2024' }) }) } }

/* ---- the About: its sentences, its years, the word pile's lines ---- */
{ const h = read('about.html'), main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(h)[1]
  const paras = [...main.matchAll(/<p(?: class="lede")?>([\s\S]*?)<\/p>/g)].map(m => S.plain(m[1].replace(/<span class="sign">[\s\S]*?<\/span>/, '')).replace(/ ([,.;:])/g, '$1'))
  paras.forEach((p, pi) => { const sents = S.sentences(p)
    sents.forEach((t, k) => { if (OTHERS.test(t) || !onPage('about.html', t) || S.words(t, true).length < 4) return
      add({ id: `about:p${pi}.${k}`, kind: 'about', text: t, src: 'about.html', title: 'About', year: (/\b(19|20)\d\d\b/.exec(t) || [null])[0], after: sents[k + 1] && !OTHERS.test(sents[k + 1]) && onPage('about.html', sents[k + 1]) ? sents[k + 1] : null, whole: sents.filter(x => !OTHERS.test(x) && onPage('about.html', x)) }) }) })
  for (const m of main.matchAll(/<li><b>([^<]+)<\/b><span>([\s\S]*?)<\/span><\/li>/g)) { const y = m[1].trim(), sents = S.sentences(S.plain(m[2]).replace(/ ([,.;:])/g, '$1'))
    sents.forEach((t, k) => { if (OTHERS.test(t) || !onPage('about.html', t)) return
      add({ id: `about:${y}.${k}`, kind: 'about', text: t, src: 'about.html', title: 'About', year: /^\d{4}$/.test(y) ? y : null, row: y, after: null, whole: sents.filter(x => !OTHERS.test(x)) }) }) }
  const q = (/var quotes = \[([\s\S]*?)\];/.exec(h) || [, ''])[1]
  ;[...q.matchAll(/'((?:[^'\\]|\\.)+)'/g)].map(m => m[1].replace(/\\u([0-9a-f]{4})/gi, (_, x) => String.fromCharCode(parseInt(x, 16))).replace(/\\'/g, '\''))
    .forEach((t, k) => { if (!h.includes(t) && !h.includes(t.replace(/’/g, '\\u2019'))) return dropped.push('quote ' + k); add({ id: `about:said.${k}`, kind: 'about', text: t, src: 'about.html', title: 'About', year: null, said: true, after: null, whole: [t] }) }) }

/* ---- the wall: each idea's sentences, as v2/home.js holds them ---- */
{ const IDEAS = new Function(home.slice(home.indexOf('var IDEAS'), home.indexOf('];', home.indexOf('var IDEAS')) + 2) + '; return IDEAS')()
  for (const I of IDEAS) { const d = I.detail || {}, all = [d.intro, ...(d.tools || []), d.boundary].filter(Boolean)
    all.forEach((block, bi) => S.sentences(block).forEach((t, k) => { if (!home.includes(t) || S.words(t, true).length < 5) return
      add({ id: `idea:${S.slug(I.name)}:${bi}.${k}`, kind: 'idea', text: t, src: 'v2/home.js', title: I.name, part: bi === 0 ? null : bi <= (d.tools || []).length ? I.parts[bi - 1] : null, href: I.href || '/#flow',
        after: S.sentences(block)[k + 1] || null, whole: S.sentences(d.intro || '') }) })) } }

// how often a word comes up across the poems: a word most poems share links nothing
const df = {}; for (const p of poems) for (const w of new Set(S.words(stanzasOf(p).flat().join(' ')))) df[w] = (df[w] || 0) + 1
const common = Object.entries(df).filter(([, n]) => n > poems.length * S.COMMON).map(([w]) => w).sort()

const out = { made_by: 'studies/37/build.mjs', from: ['poems/*.html', 'v2/data.json', 'v2/home.js', 'poem-films.html', 'about.html', 'studies/21/readings.txt', 'studies/21/ideas.json', 'studies/32/crossings.json'],
  counts: Object.fromEntries(['line', 'photo', 'film', 'about', 'idea'].map(k => [k, segs.filter(s => s.kind === k).length])), poems: poems.length, common, df, dropped, segs }
writeFileSync(path.join(HERE, 'segments.json'), JSON.stringify(out))
console.log(`${segs.length} segments: ${Object.entries(out.counts).map(([k, n]) => `${n} ${k}`).join(', ')}; ${common.length} words too common to link; ${dropped.length} left out (not on their page as written)`)
