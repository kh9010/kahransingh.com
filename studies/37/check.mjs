#!/usr/bin/env node
// Study 37 check: every facet gives a segment of his work, word for word, for a reason that can be recounted.
// Its own readers, kept apart from build.mjs and segs.js, so that loosening one is caught by the other:
//   every segment in segments.json is in its source on the site as written (a poem's page, the About, the films page, the wall's ideas, the photographs);
//   every poem a segment shows or a facet reaches is a live page (poems/*.html);
//   a sample of worlds (every photograph, every poem, each of the four ways, at desk and phone sizes), dealt in node on 33's real cut:
//     every facet yields; no two facets share a segment, a poem, a place, a destination or a basis; every basis is recounted from the sources;
//     no text a facet shows is commentary: it is the segment itself, a source label from a closed list, or a basis line in the closed grammar below;
//     every way's taps say something new each time and end in its one move.
// In Chrome (1440x900 by mouse; 390x844 and 844x390 by touch), for ?y= shape lines mixed whole, at home and in a world:
//   every drawn facet holds a segment; the same rules over what the page actually dealt and drew, the facet's region recounted from regions.json at its centre;
//   each facet's first tap shows its segment and nothing else (segment, source, basis), a second tap something new or the move; a photograph or film still shows inside its facet;
//   words of any length at any facet keep clear of the poem, the name and the caption (30's placement); a door line wins over the facet beneath;
//   the last tap lands where it promised; at rest every facet is this photograph; reduced motion answers; nothing counts down; no console errors.
// Run: node studies/37/check.mjs   (YS=shape,lines ONLY_VP=desk STATIC=0 BROWSER=0 to narrow; non-zero exit on any failure). Screenshots: studies/37/shots/ (gitignored).
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync, statSync, createReadStream } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const WAYS = ['shape', 'lines', 'mixed', 'whole'], YS = (process.env.YS || WAYS.join(',')).split(',')
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false, full: true }, { id: 'phone', w: 390, h: 844, mobile: true, full: true },
  { id: 'side', w: 844, h: 390, mobile: true, full: false }].filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
let failures = 0
const check = (ok, label, detail) => { if (ok) { if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8'), J = f => JSON.parse(read(f))
const live = new Set(readdirSync(path.join(ROOT, 'poems')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)))
const require = createRequire(import.meta.url), S37 = require('./segs.js'), CUT = require('../33/cut.js')

/* ---------- the check's own reading of the site (not segs.js's) ---------- */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', rarr: '→', hellip: '…' }
const flat = s => String(s).replace(/\s+/g, ' ').trim()
const asRead = h => flat(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/gi, (m, e) => NAMED[e] ?? m))
const pageCache = new Map(), pageText = f => pageCache.get(f) ?? (pageCache.set(f, /\.(js|json)$/.test(f) ? flat(read(f)) : asRead(read(f))), pageCache.get(f))
const verbatim = (f, t) => !!t && pageText(f).includes(flat(t))
const wholeWord = (text, w) => new RegExp(`(^|[^a-zà-ÿ’'])${w.replace(/[’']/g, '[’\']')}([^a-zà-ÿ’']|$)`, 'i').test(text)

const data = J('v2/data.json'), SEG = J('studies/37/segments.json'), VOC = J('studies/21/doors.json').vocabs.his, KIN = J('studies/28/kin.json').photos, REG = J('studies/33/regions.json').photos
const CROSS = Object.fromEntries(J('studies/32/crossings.json').photos.map(p => [p.src, p])), IDEAS21 = J('studies/21/ideas.json')
const home = read('v2/home.js'), a0 = home.indexOf('function norm'), b0 = home.indexOf('/* ---------------------------------------------------------- the render', a0)
const { stanzasOf } = new Function(home.slice(a0, b0) + '; return { stanzasOf }')()
const IDEAS = new Function(home.slice(home.indexOf('var IDEAS'), home.indexOf('];', home.indexOf('var IDEAS')) + 2) + '; return IDEAS')()
const segBy = Object.fromEntries(SEG.segs.map(s => [s.id, s])), photoSeg = src => segBy['photo:' + src]
const poemOf = slug => data.poems.find(p => p.slug === slug), titleOf = slug => (poemOf(slug) || {}).title
const linesOf = slug => stanzasOf(poemOf(slug)).flat()
const readings = {}; { let cur = null; for (const raw of read('studies/21/readings.txt').split('\n')) { if (raw.startsWith('@ ')) { cur = raw.slice(2).trim(); readings[cur] = []; continue }
  if (!cur || !raw.trim() || raw.startsWith('#') || /^\s+note:/.test(raw)) continue; const [ph, tags] = raw.split(' | '); if (tags) readings[cur].push({ phrase: ph.trim().split('\\n'), concepts: tags.trim().split(/\s+/) }) } }
const conceptsOfLine = (slug, lines) => new Set((readings[slug] || []).filter(r => r.phrase.some(p => lines.some(l => l.includes(p)))).flatMap(r => r.concepts))
const conceptsOfPoem = slug => new Set((readings[slug] || []).flatMap(r => r.concepts))
const conceptsOfPhoto = src => (IDEAS21.photos[src.split('/').pop().replace(/\.[a-z]+$/i, '')] || '').split(/\s+/).filter(Boolean)
const aboutYears = [...read('about.html').matchAll(/<li><b>([^<]+)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map(m => ({ y: m[1].trim(), text: asRead(m[2]) }))

/* the check's own reading of where a facet sits (33's regions at its centre), and of 28's regions */
const REGION_WORDS = { eye: 'see seen saw seeing eyes eye look looked looking watch watched watching gaze face mirror', sky: 'sky skies cloud clouds heaven heavens moon stars star birds bird wind air blue fly flying rain',
  dark: 'night nights dark darkness shadow shadows black midnight evening dusk shade', light: 'light lights sun sunlight sunset sunrise bright shine shining glow morning dawn gold golden luminous white fire',
  ground: 'earth ground sea ocean water river lake shore sand stone stones rock field grass land waves beach feet', edge: 'tree trees wall walls house door doors window windows city street streets road branches room building' }
const LABELS = { door: 'a door line', eye: 'where the eye goes', sky: 'high and bright', dark: 'the dark', light: 'the light', ground: 'below the horizon', edge: 'its edges', mid: 'even tone' }
function classOf(f) { if (f.door != null) return 'door'; if (f.sal >= .6) return 'eye'; if (f.side === 'above' || (f.tone === 'light' && f.uv[1] < .4)) return 'sky'
  if (f.tone === 'dark') return 'dark'; if (f.tone === 'light') return 'light'; if (f.side === 'below') return 'ground'; if (f.edges >= .5) return 'edge'; return 'mid' }
function regionAt(src, c, W, H) { // a facet's centre, read off regions.json as the photograph lies on this screen (cover, centred)
  const R = REG[src]; if (!R) return null; const a = R.a, b = W / H
  const [u, v] = a > b ? [(c[0] / W - .5) / (a / b) + .5, c[1] / H] : [c[0] / W, (c[1] / H - .5) / (b / a) + .5]
  const at = rows => { if (!rows || u < 0 || u > 1 || v < 0 || v > 1) return null; const r = Math.min(rows.length - 1, Math.floor(v * rows.length)), row = rows[r]; return +row[Math.min(row.length - 1, Math.floor(u * row.length))] }
  const m = at(R.masses.grid), h = R.horizon && R.horizon.score >= .25 ? R.horizon : null
  let side = null; if (h) { const uu = Math.max(0, Math.min(1, u)), vv = Math.max(0, Math.min(1, v)), y = h.p0[1] + (h.p1[1] - h.p0[1]) * ((uu - h.p0[0]) / ((h.p1[0] - h.p0[0]) || 1e-6)); side = vv < y ? 'above' : 'below' }
  return { uv: [Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))], tone: m == null ? null : R.masses.names[m], sal: (at(R.salience) ?? 0) / 9, edges: (at(R.edges.grid) ?? 0) / 9, side } }
const cell = uv => Math.min(3, Math.max(0, Math.floor(uv[1] * 4))) * 6 + Math.min(5, Math.max(0, Math.floor(uv[0] * 6)))
const where = j => { const r = Math.floor(j / 6), c = j % 6, v = r === 0 ? 'top' : r === 3 ? 'foot' : 'middle', h = c < 2 ? 'left' : c < 4 ? 'centre' : 'right'; return v === 'middle' && h === 'centre' ? 'centre' : v + ' ' + h }
function nearestCell(mine, j, other) { const A = KIN[mine], B = KIN[other]; let best = Infinity, bj = -1
  B.cells.forEach((c, k) => { const [L, a, b, con, ho, ve, de] = c, [L0, a1, b1, con0, ho0, ve0, de0] = A.cells[j]
    const d = Math.hypot((L0 - L) / 12, (con0 - con) / 8) + (A.mono && B.mono ? 0 : A.mono || B.mono ? .8 : Math.hypot(a1 - a, b1 - b) / 10) + 2 * (Math.abs(ho0 - ho) + Math.abs(ve0 - ve)) + Math.abs(de0 - de) / Math.max(1, (de0 + de) / 2)
    if (d < best) { best = d; bj = k } }); return { theirs: bj, d: Math.round(best * 100) / 100 } }

/* ---------- a basis, recounted from the sources; null when it holds, else why not ---------- */
function recount(world, f, seg, L, cls) {
  const ph = photoSeg(world.photo) || {}, text = seg.lines ? seg.lines.join(' ') : seg.text
  if (classOf(f) !== cls) return `region: the facet reads ${classOf(f)}, the plan says ${cls}`
  switch (L.k) {
    case 'door': { const d = world.doors[f.door]; if (!d || d.phrase !== L.phrase || d.word !== L.word) return 'door: not this facet\'s door line'
      if (!linesOf(world.poem).some(l => l.includes(L.phrase))) return 'door: the phrase is not in this poem'
      const Wd = VOC.words.find(x => x.word === L.word); if (!Wd || !Wd.poems.includes(seg.poem)) return 'door: the other poem was not read for it'
      return (VOC.poems[seg.poem] || []).some(x => x.word === L.word && x.phrase === L.held && seg.lines.some(l => l.includes(x.phrase))) ? null : 'door: the segment does not hold the reading' }
    case 'region': return (REGION_WORDS[cls] || '').split(' ').includes(L.word) && wholeWord(text, L.word) ? null : `region: ‘${L.word}’ is not a ${cls} word in it`
    case 'kin': { if (seg.kind !== 'photo') return 'kin: not a photograph'; const j = cell(f.uv); if (L.mine !== j) return `kin: the facet's region is ${j}, not ${L.mine}`
      const n = nearestCell(world.photo, j, seg.img); return n.theirs === L.theirs && Math.abs(n.d - L.d) < .011 ? null : `kin: nearest is ${n.theirs} at ${n.d}, not ${L.theirs} at ${L.d}` }
    case 'word': { const l = linesOf(world.poem)[L.line - 1]; return l && wholeWord(l, L.word) && wholeWord(text, L.word) ? null : `word: ‘${L.word}’ is not in line ${L.line} and the segment` }
    case 'place': return seg.kind === 'photo' ? (seg.place === ph.place && seg.img !== world.photo ? null : 'place: not the same place') : (ph.place && ph.place.split(/,\s*/).includes(L.place) && text.includes(L.place) ? null : 'place: not in both')
    case 'year': { const y = String((CROSS[world.photo] || {}).y || ''); if (y !== L.year) return `year: the photograph is ${y}`
      const row = aboutYears.find(r => r.y === L.year); return row && (seg.kind === 'film' ? row.text.includes('Poem Films') : row.text.includes(seg.text)) ? null : 'year: the About does not put it in that year' }
    case 'paired': { const c = seg.kind === 'photo' ? CROSS[seg.img] : CROSS[world.photo], other = seg.kind === 'photo' ? world.poem : seg.poem
      return c && c.poem === other && c.poemWhy === L.why ? null : 'paired: crossings.json does not pair them' }
    case 'film': return seg.kind === 'film' && seg.poem === world.poem && new RegExp(`/poems/${world.poem}\\.html">[^<]+</a></h2>\\s*<p class="film-meta">[^<]*${seg.text}`).test(read('poem-films.html')) ? null : 'film: not this poem\'s film'
    case 'idea': { const mine = seg.kind === 'photo' ? new Set(conceptsOfPhoto(seg.img)) : conceptsOfLine(seg.poem, seg.lines || []); if (!mine.has(L.concept)) return `idea: the segment was not read for ${L.concept}`
      if (L.line) return conceptsOfLine(world.poem, [linesOf(world.poem)[L.line - 1] || '\u0000']).has(L.concept) ? null : `idea: line ${L.line} of this poem was not read for ${L.concept}`
      return (L.as === 'photograph' ? conceptsOfPhoto(world.photo).includes(L.concept) : conceptsOfPoem(world.poem).has(L.concept)) ? null : `idea: this ${L.as} was not read for ${L.concept}` }
  }
  return 'an unknown link ' + L.k }

/* ---------- commentary: any text a facet shows that is not the segment, a source label, or a basis token from this closed grammar ---------- */
const CONCEPTS = Object.keys(IDEAS21.concepts), PLACES = new Set(SEG.segs.filter(s => s.kind === 'photo').map(s => s.place))
const TOKENS = [/^door ‘(.+)’$/, /^‘(.+)’ in both$/, /^‘([a-zà-ÿ’']+)’$/, /^its (top|middle|foot)?\s?(left|centre|right)$|^its centre$/, /^their (top|middle|foot)?\s?(left|centre|right)$|^their centre$/, /^\d\.\d\d apart$/, /^line \d{1,3}$/,
  /^(.+), both$/, /^on the home together, \d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/, /^its page carries this photograph$/, /^this poem’s page carries it$/, /^this poem’s film$/, /^read for ([a-z]+)$/, /^as this (photograph|poem) was$/, /^as line \d{1,3} was$/, /^of those left$/]
function commentary(basis, world, seg) { // why a basis line is commentary, or null
  const t = basis.split(' · '); if (!Object.values(LABELS).includes(t[0])) return `it opens on "${t[0]}", not a region`
  for (const k of t.slice(1)) { const m = TOKENS.map(re => re.exec(k)).find(Boolean); if (!m) return `"${k}" is not a basis token`
    if (/^door ‘/.test(k) && !linesOf(world.poem).some(l => l.includes(m[1]))) return `"${k}": not a line of this poem`
    if (/^‘[^’]+’ in both$/.test(k) && !VOC.words.some(x => x.word === m[1])) return `"${k}": not a door word read by hand`
    if (/^‘[a-zà-ÿ’']+’$/.test(k) && !wholeWord(seg.lines ? seg.lines.join(' ') : seg.text, m[1])) return `"${k}": not a word of the segment`
    if (/, both$/.test(k) && !/^(19|20)\d\d$/.test(m[1]) && ![...PLACES].some(p => p.split(/,\s*/).includes(m[1]) || p === m[1])) return `"${k}": not a place or a year`
    if (/^read for /.test(k) && !CONCEPTS.includes(m[1])) return `"${k}": not one of 21's ideas` }
  return null }
const LABEL_OK = (seg, small) => small === (seg.kind === 'line' ? seg.title : seg.kind === 'photo' ? [seg.place, seg.year].filter(Boolean).join(', ') : seg.kind === 'film' ? `Poem films · ${seg.title}` : seg.kind === 'about' ? (seg.row ? `About · ${seg.row}` : 'About') : `${seg.title} · on the home`)
const SRC_OK = (small) => data.poems.some(p => p.title === small) || /^Poem films · /.test(small) || /^About( · (now|\d{4}))?$/.test(small) || IDEAS.some(I => small === `${I.name} · on the home`) || [...PLACES].some(p => small === p || small.startsWith(p + ', '))
function stepText(st, seg, world, to) { // why a step's words are not the site's own, or null
  if (st.t === 'move') return null
  if (!SRC_OK(st.small)) return `source "${st.small}" is not a label`
  if (st.t === 'lines') { const slug = data.poems.find(p => p.title === st.small) ? data.poems.find(p => p.title === st.small).slug : null
    if (!slug || !live.has(slug)) return `lines from ${st.small}, not a live poem`; const bad = st.lines.find(l => !verbatim(`poems/${slug}.html`, l)); return bad ? `"${bad}" is not on ${slug}'s page` : null }
  if (st.t === 'glimpse') { if (!existsSync(path.join(ROOT, st.src))) return `${st.src} is not on the site`
    if (st.src.startsWith('/photos/')) { const ph = data.photos.find(p => p.src === st.src); return ph && ph.caption.startsWith(st.big + ' — ') ? null : `"${st.big}" is not ${st.src}'s caption` } }
  const file = st.t === 'glimpse' ? 'poem-films.html' : seg.kind === 'photo' ? 'v2/data.json' : seg.src
  for (const piece of st.big.split(' · ')) if (!verbatim(file, piece) && !(seg.kind === 'about' && read('about.html').includes(piece.replace(/’/g, '\\u2019')))) return `"${piece.slice(0, 50)}" is not in ${file}`
  if (st.href && !existsSync(path.join(ROOT, st.href.replace(/^\//, '').replace(/#.*$/, '') || 'index.html').replace(/\/$/, '/index.html'))) return `${st.href} does not resolve`
  return null }

/* ---------- static ---------- */
let segN = 0, dealt = 0, facetsN = 0, basesN = 0, stepsN = 0
const reached = new Set(), kindsSeen = {}
{ const bad = []
  for (const s of SEG.segs) { segN++
    if (s.kind === 'line') { if (!live.has(s.poem)) bad.push(`${s.id}: not a live poem`); for (const l of s.lines) if (!verbatim(`poems/${s.poem}.html`, l)) bad.push(`${s.id}: "${l}"`) }
    if (s.kind === 'photo' && (!existsSync(path.join(ROOT, s.img)) || !data.photos.some(p => p.src === s.img && p.caption.startsWith(s.place + ' — ')))) bad.push(`${s.id}: not a photograph on the site`)
    if (s.kind === 'film' && (!existsSync(path.join(ROOT, s.img)) || !verbatim('poem-films.html', s.text) || !live.has(s.poem))) bad.push(`${s.id}: not on the films page`)
    if (s.kind === 'about' && !verbatim('about.html', s.text) && !read('about.html').includes(s.text.replace(/’/g, '\\u2019'))) bad.push(`${s.id}: "${s.text}" is not on the About`)
    if (s.kind === 'idea' && !IDEAS.some(I => [I.detail.intro, ...(I.detail.tools || []), I.detail.boundary].some(t => t && t.includes(s.text)) && I.name === s.title)) bad.push(`${s.id}: not on the wall`)
    if (/\b(Divya|Sweta|Sahil|Rachna|Gourav)\b/.test(s.text || '')) bad.push(`${s.id}: names someone else`) }
  check(!bad.length, `every one of ${segN.toLocaleString('en-US')} segments is in its source on the site, word for word, and names no one but him`, bad.slice(0, 6).join(' | ')) }

// a world's facets as the page would cut them: 33's masses on the photograph, at this size; the poem line beside each by its height
function facetsFor(photo, poem, W, H) { const count = W < 640 ? 15 : H < 560 ? 15 : 26, R = REG[photo], key = poem + '~' + photo.replace('/photos/', '')
  const K = CUT.cut({ R, W, H, count, logic: 'masses', wind: 8, seed: key, dials: { share: .75, gap: .03, spacing: .16, fillGap: .13, lineMin: .25 } }), cells = CUT.voronoi(K.sites, W, H, 8), n = linesOf(poem).length
  return CUT.facets(K, cells, W, H, 8, R).filter(f => f.edges.length && f.region).map(f => S37.describe(f, R, { line: Math.min(n - 1, Math.floor(f.centroid[1] / H * n)), c: f.centroid })) }
const D = { SEG, data, VOC, KIN, stanzasOf }
function plansHold(world, plan, facets, y, tag, bad) { // the rules every dealt world obeys, static or drawn
  const say = m => { if (bad.length < 14) bad.push(`${tag}: ${m}`) }, uniq = (f, what) => { const m = new Map(); plan.forEach((p, i) => { if (!p) return; const k = f(p); if (k == null) return; if (m.has(k)) say(`#${m.get(k)} and #${i} share ${what} ${k}`); else m.set(k, i) }) }
  plan.forEach((p, i) => { if (!p) say(`facet ${i} yields nothing`) })
  uniq(p => p.seg.id, 'a segment'); uniq(p => p.seg.poem ? 'poem:' + p.seg.poem : null, 'a poem'); uniq(p => p.seg.kind === 'photo' ? p.seg.place : null, 'a place'); uniq(p => p.to.photo, 'a destination'); uniq(p => p.to.poem, 'a destination poem'); uniq(p => p.basis, 'a basis')
  plan.forEach((p, i) => { if (!p) return; facetsN++; kindsSeen[p.seg.kind] = (kindsSeen[p.seg.kind] || 0) + 1
    if (y === 'lines' && p.seg.kind !== 'line') say(`#${i}: lines gave a ${p.seg.kind}`)
    if (p.to.photo === world.photo) say(`#${i}: leads back to this photograph`)
    for (const s of [p.seg.poem, p.to.poem].filter(Boolean)) { reached.add(s); if (!live.has(s)) say(`#${i}: reaches ${s}, not a live poem`) }
    if (!data.photos.some(q => q.src === p.to.photo)) say(`#${i}: leads to ${p.to.photo}, not a photograph on the site`)
    const r = recount(world, facets[i], p.seg, p.link, p.cls); basesN++; if (r) say(`#${i} ${p.seg.id}: ${r}`)
    const c = commentary(p.basis, world, p.seg); if (c) say(`#${i} commentary: ${c}`)
    const keys = p.steps.map(S37.stepKey); stepsN += p.steps.length
    if (new Set(keys).size !== keys.length) say(`#${i}: a tap says the same thing twice`)
    if (p.steps.at(-1).t !== 'move' || p.steps.slice(0, -1).some(s => s.t === 'move') || p.steps.length < 3) say(`#${i}: does not unfold and end in its one move`)
    if (!LABEL_OK(p.seg, p.steps[0].small)) say(`#${i}: the first tap is labelled "${p.steps[0].small}"`)
    for (const st of p.steps) { const e = stepText(st, p.seg, world, p.to); if (e) say(`#${i} ${st.t}: ${e}`); if (st.poem) reached.add(st.poem) }
    if (p.steps.at(-1).to.photo !== p.to.photo || p.steps.at(-1).to.poem !== p.to.poem) say(`#${i}: the move is not where it promised`) }) }
if (process.env.STATIC !== '0') {
  const bad = [], t0 = Date.now(), sizes = [[1440, 900], [390, 844]]
  data.photos.forEach((ph, pi) => { for (let k = 0; k < 3; k++) { const q = data.poems[(pi * 7 + k * 31) % data.poems.length]; if (!live.has(q.slug)) continue
    for (const y of YS) { const [W, H] = sizes[(pi + k) % 2], facets = facetsFor(ph.src, q.slug, W, H), world = { photo: ph.src, poem: q.slug, trail: [], doors: [] }
      const plan = S37.deal(world, facets, D, y); dealt++; plansHold(world, plan, facets, y, `${ph.src.split('/').pop()} × ${q.slug} ${y} ${W}x${H}`, bad) } } })
  const poemsHit = new Set(data.photos.flatMap((ph, pi) => [0, 1, 2].map(k => data.poems[(pi * 7 + k * 31) % data.poems.length].slug)))
  check(!bad.length && poemsHit.size === data.poems.length, `${dealt} worlds dealt on 33's cut (all ${data.photos.length} photographs, all ${poemsHit.size} poems, ${YS.length} ways): ${facetsN.toLocaleString('en-US')} facets each yield, none shares a segment, poem, place, destination or basis, ${basesN.toLocaleString('en-US')} bases recounted, no commentary, every tap new (${Math.round((Date.now() - t0) / 1000)}s)`, bad.join(' | '))
}

/* ---------- the check's own mutation guard: its readers must reject what they exist to reject ---------- */
{ const w = { photo: data.photos[0].src, poem: data.poems[0].slug, doors: [] }, seg = SEG.segs.find(s => s.kind === 'line' && /\bnight\b/.test(s.lines.join(' ')))
  const f = { uv: [.5, .9], tone: 'dark', sal: 0, edges: 0, side: null, door: null }
  const fake = [commentary('the dark · a lovely quiet moment', w, seg), commentary('the dark · this one waits for 4°', w, seg), commentary('the night · ‘night’', w, seg), stepText({ t: 'say', big: seg.lines[0] + ' indeed', small: seg.title }, { ...seg, kind: 'about', src: 'about.html', text: '' }, w)]
  const wrong = [recount(w, f, seg, { k: 'region', cls: 'dark', word: 'moon' }, 'dark'), recount(w, f, seg, { k: 'region', cls: 'dark', word: 'night' }, 'light'), recount(w, { ...f, door: null }, seg, { k: 'word', word: 'zebra', line: 1 }, 'dark')]
  check(fake.every(Boolean) && wrong.every(Boolean) && !commentary('the dark · ‘night’', w, seg) && !recount(w, f, seg, { k: 'region', cls: 'dark', word: 'night' }, 'dark'), 'the check rejects invented commentary, a non-verbatim piece and a basis that does not hold', JSON.stringify({ fake, wrong })) }

/* ---------- in Chrome ---------- */
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
const SHELL = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/mac_arm-150.0.7871.24/chrome-headless-shell-mac-arm64/chrome-headless-shell')
function findShell() { if (process.env.CHROME) return process.env.CHROME; if (existsSync(SHELL)) return SHELL
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p } return null }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value } }

{ const page = read('studies/37/index.html'), dials = Object.keys(J('studies/37/defaults.json')), own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2))
  const clash = dials.filter(k => own.includes(k)); check(!clash.length, 'no dial shadows a page variable', clash.join(', ')) }
{ const page = read('studies/37/index.html'), body = /<body>([\s\S]*?)<script/.exec(page)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems tools shape lines mixed whole', 'no instruction text on the page: the name, the way out, the four switches', body) }

let walks = 0, tapsN = 0, probes = 0, drawnN = 0
const shell = process.env.BROWSER === '0' ? null : findShell()
if (process.env.BROWSER !== '0' && !shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = shell ? await freePort() : 0, CDPP = shell ? await freePort() : 0
// a static server in this process (python's http.server reset connections under the walk's load: a red that was the harness, not the page)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const server = shell && http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = shell && spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome && chrome.kill() } catch {} try { server && server.close() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], t0 = Date.now()

if (shell) try {
  await waitFor(() => fetch(`${BASE}/studies/37/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  // pinned: the clock (8:40 in the evening, New York, 8 Nov 2026) and the sky the site reads, so a run tomorrow deals what a run today dealt
  const PIN = Date.UTC(2026, 10, 9, 1, 40)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-08T06:35'], sunset: ['2026-11-08T16:44'] } }
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }
  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => { await cdp.send('Page.navigate', { url: `${BASE}/studies/37/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S37P.world`), 'page ' + q, 300); await sleep(300) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 })
  const settle = () => waitFor(() => cdp.eval(`S37P.at === 'world' && !S37P.busy`), 'landing', 300)
  const fresh = async q => { await open(q); await cdp.eval('sessionStorage.removeItem("s37-depth")'); await open(q); await settle(); await waitFor(() => cdp.eval('S37P.world.arrived'), 'arrival', 200) }
  const tapFacet = async i => { const pt = await cdp.eval(`S37P.tapPoint(${i})`); if (!pt) return null; await tap(pt[0], pt[1]); return pt }
  const nextSeq = seq0 => waitFor(() => cdp.eval(`S37P.seq > ${seq0} && S37P.last`), 'a facet answer', 60, 30).catch(() => null)
  const doorPoint = async k => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); a.scrollIntoView({ block: 'nearest' }); const b = a.getClientRects()[0]; return [b.left + b.width / 2, b.top + b.height / 2] })()`)
  const waitDoorShown = k => waitFor(() => cdp.eval(`(() => { const a = [...document.querySelectorAll('.verse .door')].find(a => a.dataset.k === ${JSON.stringify(String(k))}); return !!a && !!a.closest('.l.shown') && !S37P.busy })()`), 'door shown', 200)
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: S37P.at, arrived: S37P.world.arrived, lines: S37P.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length; if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join(''); if (s.arrived) break }
      await sleep(40) }
    check(!bad && last && last.arrived && last.lines.every(l => l.shown), `${label}: the poem arrives in its own order, whole`, bad) }
  const restHolds = async label => { await park(); await cdp.eval('S37P.still = true'); await sleep(700)
    const r = await cdp.eval('S37P.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .012)), need = Math.min(6, Math.ceil((await cdp.eval('S37P.drawn')).length / 3)) // a phone's poem and name cover most of its fifteen
    check(r.length >= need && !bad.length, `${label}: at rest all ${r.length} facets read as this photograph`, bad.slice(0, 5).map(x => `#${x.i} own ${x.own} vs ${x.other}`).join(' | '))
    await cdp.eval('S37P.still = false') }
  // what the page dealt and drew, held to the static rules, the facet's region recounted from regions.json at the centre the page cut
  const drawnHold = async (label, y) => {
    const ids = await cdp.eval('S37P.drawn'), plans = await cdp.eval('S37P.plans'), w0 = await cdp.eval('S37P.world0'), bad = [], world = { photo: w0.photo, poem: w0.poem, doors: w0.doors }
    const plan = [], facets = []
    for (const i of ids) { const p = plans[i]; if (!p) { bad.push(`facet ${i} holds nothing`); continue } drawnN++
      const g = regionAt(w0.photo, p.facet.c, w0.W, w0.H); if (!g || g.tone !== p.facet.tone || g.side !== p.facet.side || Math.abs(g.sal - p.facet.sal) > .002 || Math.abs(g.edges - p.facet.edges) > .002 || Math.hypot(g.uv[0] - p.facet.uv[0], g.uv[1] - p.facet.uv[1]) > .002) bad.push(`#${i}: its region is not what regions.json holds at its centre ${JSON.stringify({ g, f: p.facet })}`)
      const seg = segBy[p.id]; if (!seg) { bad.push(`#${i}: ${p.id} is not a segment`); continue }
      plan.push({ seg, link: p.link, cls: p.cls, basis: p.basis, to: { photo: '/photos/' + p.to.split('~')[1], poem: p.to.split('~')[0] }, steps: p.steps.map(st => ({ ...st, to: st.to ? { photo: '/photos/' + st.to.split('~')[1], poem: st.to.split('~')[0] } : undefined })) }); facets.push(p.facet) }
    plan.forEach(p => p.steps.forEach(st => { if (st.t !== 'move') { delete st.to } }))
    const n0 = bad.length; plansHold(world, plan, facets, y, label, bad)
    check(!bad.length, `${label}: all ${ids.length} facets hold a segment of his work, verbatim, its basis recounted, none shared, no commentary`, bad.slice(0, 5).join(' | '))
    return plans }
  // every facet answers its first tap with its segment, its source and its basis and nothing else; a second tap says something new or moves
  const tapsHold = async (label, twice) => {
    await cdp.eval('S37P.dry = true'); const ids = await cdp.eval('S37P.drawn'), plans = await cdp.eval('S37P.plans'), bad = []
    for (const i of ids) { const p = plans[i]; if (!p) continue; const depth0 = await cdp.eval(`S37P.depth(${i})`)
      for (let round = 0; round < (twice ? 2 : 1); round++) { const seq0 = await cdp.eval('S37P.seq'), pt = await tapFacet(i)
        if (!pt) { bad.push(`#${i}: nowhere to touch`); break }
        const last = await nextSeq(seq0); tapsN++
        const want = p.steps[Math.min(depth0 + round, p.steps.length - 1)]
        if (!last || last.i !== i) { bad.push(`#${i} tap ${round + 1}: no answer ${JSON.stringify(last)}`); break }
        if (last.key !== want.key) bad.push(`#${i} tap ${round + 1}: said ${last.key.slice(0, 60)}, planned ${want.key.slice(0, 60)}`)
        if (want.t !== 'move') { const parts = await cdp.eval(`[...document.getElementById('back').children].map(e => [e.tagName + '.' + e.className, e.textContent])`)
          const expect = [[want.t === 'lines' ? 'SPAN.lines' : want.t === 'say' ? 'SPAN.say' : 'SPAN.named', want.t === 'lines' ? want.lines.join('') : want.big], ['SMALL.src', want.small], ['SMALL.basis', p.basis]]
          if (JSON.stringify(parts) !== JSON.stringify(expect)) bad.push(`#${i} tap ${round + 1}: shows ${JSON.stringify(parts).slice(0, 160)}`)
          if (await cdp.eval('S37P.clash')) bad.push(`#${i} tap ${round + 1}: its words lie over the poem, the name or the caption`)
          if (want.t === 'glimpse') { const g = await waitFor(() => cdp.eval('S37P.glimpse'), 'glimpse', 40, 50).catch(() => null); if (!g || g.i !== i || g.src !== want.src) bad.push(`#${i}: the picture does not show inside its facet ${JSON.stringify(g)}`) } }
        if (round === 1 && last.key === p.steps[Math.min(depth0, p.steps.length - 1)].key) bad.push(`#${i}: the second tap repeats the first`) } }
    await cdp.eval('S37P.dry = false')
    check(!bad.length, `${label}: every facet answers with its segment, its source and its basis, clear of the poem${twice ? '; a second tap says something new or moves' : ''}`, bad.slice(0, 5).join(' | ')) }

  for (const vp of VIEWPORTS) {
    await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const y of YS) {
      if (!vp.full && !['shape', 'lines'].includes(y)) continue
      errors.length = 0; walks++
      const L = `y=${y} ${tag}`
      await open(`y=${y}`); await cdp.eval('sessionStorage.clear()'); await open(`y=${y}`)
      await shot(`37-${y}-home-${tag}.png`)
      { const pin = await cdp.eval(`({ where: document.getElementById('where').innerText, hour: new Date().getHours() })`)
        check(/mostly clear/.test(pin.where) && pin.hour === 20, `${L}: the walk runs under the pinned clock and sky`, JSON.stringify(pin)) }
      await drawnHold(`${L} home`, y)
      { const plans = await cdp.eval('S37P.plans'), i = plans.findIndex(p => p && p.kind !== 'photo'), seq0 = await cdp.eval('S37P.seq')
        if (i >= 0) { await tapFacet(i); const last = await nextSeq(seq0); await sleep(400); const s = await cdp.eval('({ at: S37P.at, busy: S37P.busy, win: S37P.win })')
          check(last && last.i === i && s.at === 'stone' && !s.busy && s.win && s.win.text, `${L} home: a facet gives its segment and the stone stays`, JSON.stringify({ last, s }))
          await shot(`37-${y}-home-yield-${tag}.png`) } }
      const key = (await cdp.eval('S37P.doors'))[0].to
      await open(`y=${y}&w=${encodeURIComponent(key)}`)
      if (y === 'shape') await watchArrival(L)
      await waitFor(() => cdp.eval('S37P.world.arrived && S37P.lines.every(l => l.a > .99)'), 'the whole poem', 200)
      await restHolds(L)
      await shot(`37-${y}-world-${tag}.png`)
      const plans = await drawnHold(L, y)
      await tapsHold(L, vp.full)
      { const ids = await cdp.eval('S37P.drawn'), bad = [] // whatever a facet gives, at any length, its words keep clear
        for (const i of ids) for (const [n, lines] of [[60, 0], [220, 0], [480, 0], [200, 6], [1400, 0]]) { probes++; if (await cdp.eval(`S37P.probe(${i}, ${n}, ${lines})`)) bad.push(`#${i} at ${n}${lines ? ' in ' + lines + ' lines' : ''}`) }
        check(!bad.length, `${L}: words of any length, at any facet, keep clear of the poem, the name and the caption (${ids.length * 5} placed)`, bad.slice(0, 6).join(' | ')) }
      for (const kind of ['photo', 'film', 'line', 'about', 'idea']) { const i = plans.findIndex(p => p && p.kind === kind); if (i < 0 || !vp.full) continue
        await fresh(`y=${y}&w=${encodeURIComponent(key)}`); await cdp.eval('S37P.dry = true'); await tapFacet(i); await sleep(kind === 'photo' || kind === 'film' ? 900 : 450); await shot(`37-${y}-${kind}-${tag}.png`)
        if (y === 'whole') { await tapFacet(i); await sleep(450); await shot(`37-${y}-${kind}-whole-${tag}.png`) }
        await cdp.eval('S37P.dry = false') }
      await open(`y=${y}&w=${encodeURIComponent(key)}`); await settle()
      const again = await cdp.eval('S37P.plans')
      check(JSON.stringify(again.map(p => p && p.id)) === JSON.stringify(plans.map(p => p && p.id)), `${L}: after a reload in the visit, every facet holds what it held`)
      { const ds = await cdp.eval('S37P.doors'), d = ds[0]; await waitDoorShown(d.k)
        const seq0 = await cdp.eval('S37P.seq'); await tap(...await doorPoint(d.k))
        await waitFor(() => cdp.eval('S37P.expect'), 'door').catch(() => null)
        const s = await cdp.eval('({ expect: S37P.expect, seq: S37P.seq })')
        check(s.expect === d.to && s.seq === seq0, `${L}: a tap on a door line goes to its door, not the facet beneath`, JSON.stringify({ ...s, want: d.to }))
        await settle() }
      { await fresh(`y=${y}&w=${encodeURIComponent(key)}`)
        const ps = await cdp.eval('S37P.plans'), i = ps.findIndex(p => p), p = ps[i], want = p.steps.at(-1).to
        for (let k = 0; k < p.steps.length; k++) { const seq0 = await cdp.eval('S37P.seq'); await tapFacet(i); await nextSeq(seq0); if (k === p.steps.length - 1 && vp.full) { await waitFor(() => cdp.eval('S37P.t > .15'), 'mid-crossing', 60).catch(() => {}); await shot(`37-${y}-through-${tag}.png`) } else await sleep(250) }
        await waitFor(() => cdp.eval(`S37P.world.key === ${JSON.stringify(want)} && !S37P.busy`), 'landing', 200).catch(() => {})
        const w = await cdp.eval('S37P.world'); check(w.key === want && w.imgOk, `${L}: a facet's last tap (${p.steps.length}) lands where it promised`, `${w.key} vs ${want}`)
        reached.add(w.slug) }
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!tm, `${L}: nothing counts down`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }
  if (!process.env.SKIP_EXTRA) { // reduced motion
    await view(VIEWPORTS[0]); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); errors.length = 0
    await open('y=shape'); const key = (await cdp.eval('S37P.doors'))[0].to; await open(`y=shape&w=${encodeURIComponent(key)}`); await settle()
    check(await cdp.eval('S37P.lines.every(l => l.shown)'), 'reduced motion: the poem is there at once')
    const ps = await cdp.eval('S37P.plans'), i = ps.findIndex(p => p), seq0 = await cdp.eval('S37P.seq'); await tapFacet(i); const last = await nextSeq(seq0)
    check(last && last.i === i && (await cdp.eval('S37P.win')), 'reduced motion: a facet still gives its segment')
    check(errors.length === 0, 'reduced motion: no console errors', errors.join(' | '))
    await cdp.send('Emulation.setEmulatedMedia', { features: [] }) }
  console.log(`shots: studies/37/shots/  (${Math.round((Date.now() - t0) / 1000)}s)`)
} catch (e) { failures++; console.log(e.stack); console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }
{ const gone = [...reached].filter(x => !live.has(x)); check(reached.size > 0 && !gone.length, `every poem a segment shows or a facet reaches (${reached.size}) is live`, gone.join(', ')) }
cleanup()
const kinds = Object.entries(kindsSeen).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')
console.log(failures ? `\n${failures} failing` : `\nPASS study 37 every facet gives his work: ${segN.toLocaleString('en-US')} segments verbatim on the site; ${dealt} worlds dealt in node, ${basesN.toLocaleString('en-US')} bases recounted, ${stepsN.toLocaleString('en-US')} taps planned, none repeats, no commentary; in Chrome ${walks} walks, ${drawnN} drawn facets recounted, ${tapsN} taps answered, ${probes} worst-case placements clear; given: ${kinds}`)
process.exit(failures ? 1 : 0)
