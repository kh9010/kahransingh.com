#!/usr/bin/env node
// test_home.mjs: the stone that is the home (/, /v3/stone.js) does what the studies it was assembled from were held to.
// Its own readers, kept apart from the page; the load-bearing parts of the studies' checks are carried over whole, each in its own scope:
//   the page:   the full meta set, Analytics, JSON-LD, /track.js and the four events it counts; the noscript copy pinned to IDEAS, its poem and
//               photograph the site's own; no instruction text, no study switch, no tune panel; every dial in v3/defaults.json read; the
//               old home at /v2/ with its wall; the home's copies of the studies' code and data are the studies' (v3/build.mjs --check)
//   37 (node):  every segment is in its source on the site, word for word; 77 photographs x 3 poems dealt on 33's cut: every facet yields,
//               none shares, every basis recounted, no commentary; the check's own readers reject what they exist to reject
//   38:         every photograph's month and year recounted from its own EXIF; the About's years hold a row for each
//   39 (node):  the grow crossing and the calm one, over the corpus, start on this cut, land on the next exactly, every facet accounted
//   in Chrome, clock and sky pinned (the real Open-Meteo reply kept by 36, 8 Nov 2026, 4:50 pm New York), at 1440x900 (mouse),
//   390x844 and 844x390 (touch):
//     the stone is pick.js's pair; the first screen loads without segments.json or more than one photograph's regions;
//     35 line: its readings are the sky's own and resolve into weather.js's sentence; 36 c: tapping it opens 34 b's chain, the readings
//       come back and light where the chain reads them; 34: every count, measure, reading and label in the chain recounted in Node;
//     every drawn facet yields (one the tools, one the date, the rest his work, verbatim, its basis recounted at the region it sits on);
//     words of any length at any facet keep clear of the poem, the name and the caption (30's and 37's worst case);
//     40: the six names WHOLLY inside the facet nearest the where line that can hold them (every photograph x two poems x five screens,
//       fresh and crossed, besides the live loads), every idea and tool reached, IDEAS verbatim;
//     38 c: the date is the photograph's own, in a facet where it reads clear, and flies the photograph into its year in the About;
//     39: a crossing through a door line (and, at 1440, a facet's last tap) walked frame by frame lands on the next photograph's masses cut
//       as 33 counts it; reduced motion crossfades and no facet moves;
//     no system name, no instruction, nothing counts down, no console error.
// Run: node tools/test_home.mjs [--shots DIR]   (ONLY_VP=desk,phone,side · PAIRS=26 · STATIC=0 to narrow). Non-zero exit on any failure.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync, createReadStream, mkdtempSync, rmSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..')
const shotsAt = process.argv.indexOf('--shots'), SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1]) : null
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8'), J = f => JSON.parse(read(f))
const t0 = Date.now()
const require = createRequire(import.meta.url)
const live = new Set(readdirSync(path.join(ROOT, 'poems')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)))
const DEF = J('v3/defaults.json'), DATA = J('v2/data.json')
const REGIONS = Object.fromEntries(readdirSync(path.join(ROOT, 'v3/regions')).map(f => { const j = J('v3/regions/' + f); return [j.src, j.photo] }))
const page = read('index.html'), stoneJs = read('v3/stone.js'), stoneCss = read('v3/stone.css'), trackJs = read('track.js'), homeJs = read('v2/home.js')
const BANNED = /day[\s-]?flow/i // the system's working name (Kahran, 2026-10-27)
function literal(src, name) { const at = src.indexOf('var ' + name + ' = '); if (at < 0) throw new Error(name + ' not found'); const s0 = at + ('var ' + name + ' = ').length; let depth = 0, q = null
  for (let i = s0; i < src.length; i++) { const c = src[i]
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue } if (c === "'" || c === '"') { q = c; continue }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue }
    if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return vm.runInNewContext('(' + src.slice(s0, i + 1) + ')') } }
const HOME_IDEAS = literal(homeJs, 'IDEAS')
const plain = h => h.replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

/* ---------- the page and the swap ---------- */
{ const r = spawnSync(process.execPath, ['v3/build.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' })
  check(r.status === 0, `the home's copies are the studies' code and data, byte for byte (regions split per photograph): ${(r.stdout || '').trim()}`, (r.stdout + r.stderr).trim().slice(0, 300)) }
{ const head = page.slice(0, page.indexOf('</head>'))
  const meta = [['title', /<title>Kahran Singh<\/title>/], ['description', /<meta name="description" content="[^"]{40,}">/], ['canonical', /<link rel="canonical" href="https:\/\/kahransingh\.com\/">/],
    ['og:title', /<meta property="og:title" content="[^"]+">/], ['og:description', /<meta property="og:description" content="[^"]{40,}">/], ['og:type', /<meta property="og:type" content="website">/],
    ['og:url', /<meta property="og:url" content="https:\/\/kahransingh\.com\/">/], ['og:image', /<meta property="og:image" content="https:\/\/kahransingh\.com\/[^"]+">/],
    ['twitter:card', /<meta name="twitter:card" content="summary_large_image">/], ['twitter:title', /<meta name="twitter:title" content="[^"]+">/],
    ['twitter:description', /<meta name="twitter:description" content="[^"]{40,}">/], ['twitter:image', /<meta name="twitter:image" content="https:\/\/kahransingh\.com\/[^"]+">/],
    ['Analytics', /googletagmanager\.com\/gtag\/js\?id=G-H63H3KD6WQ[\s\S]*gtag\('config', 'G-H63H3KD6WQ'\)/], ['track.js', /<script src="\/track\.js"><\/script>/]]
  const miss = meta.filter(([, re]) => !re.test(page)).map(([k]) => k)
  let ld = null; try { ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(head)[1]) } catch {}
  check(!miss.length && ld && ld['@type'] === 'Person' && ld.name === 'Kahran Singh' && ld.url === 'https://kahransingh.com', `the home keeps its full meta set, the JSON-LD Person, Analytics and /track.js (${meta.length} rules)`, miss.join(', ') || JSON.stringify(ld && ld['@type'])) }
{ const nos = (page.match(/<noscript>\s*<div class="plain">([\s\S]*?)<\/noscript>/) || [])[1] || ''
  const items = [...((nos.match(/<ul class="wall-plain">([\s\S]*?)<\/ul>/) || [])[1] || '').matchAll(/<li>\s*<b>([\s\S]*?)<\/b>([\s\S]*?)<\/li>/g)].map(m => [plain(m[1]), plain(m[2])])
  check(JSON.stringify(items) === JSON.stringify(HOME_IDEAS.map(I => [I.name, I.line])), 'without script the six ideas\' lines are there, as IDEAS has them', JSON.stringify(items))
  const a0 = homeJs.indexOf('function norm'), b0 = homeJs.indexOf('/* ---------------------------------------------------------- the render', a0), { stanzasOf } = new Function(homeJs.slice(a0, b0) + '; return { stanzasOf }')()
  const slug = (/<h2><a href="\/poems\/([a-z0-9-]+)\.html">([^<]+)<\/a><\/h2>/.exec(nos) || [])[1], poem = DATA.poems.find(p => p.slug === slug)
  const shownLines = [...nos.matchAll(/<p>([\s\S]*?)<\/p>/g)].flatMap(m => m[1].split(/<br>/)).map(plain).filter(Boolean)
  const img = /<img src="([^"]+)" alt="([^"]*)"/.exec(nos), ph = img && DATA.photos.find(p => p.src === img[1])
  check(!!poem && live.has(slug) && JSON.stringify(shownLines) === JSON.stringify(stanzasOf(poem).flat().map(l => l.trim()).filter(Boolean)) && !!ph && ph.alt === img[2] && existsSync(path.join(ROOT, img[1])),
    `without script a photograph and a poem of the site's own, word for word (${slug}, ${img && img[1]})`, JSON.stringify(shownLines)) }
{ const head = trackJs.slice(0, trackJs.indexOf('*/')), names = ['tools_open', 'year_open', 'line_open', 'crossing']
  const listed = names.filter(n => new RegExp('\\*\\s+' + n + '\\s').test(head)), set = Object.keys(vm.runInNewContext('(' + /var HOME_EVENTS = (\{[^}]*\})/.exec(trackJs)[1] + ')'))
  const sent = [...new Set([...stoneJs.matchAll(/\btrack\('([a-z_]+)'/g)].map(m => m[1]))]
  check(listed.length === names.length && JSON.stringify(set.sort()) === JSON.stringify([...names].sort()) && JSON.stringify(sent.sort()) === JSON.stringify([...names].sort()),
    `track.js lists the stone's ${names.length} events at its top and passes on only those; the stone sends exactly them`, JSON.stringify({ listed, set, sent })) }
{ const body = page.slice(page.indexOf('<body>'), page.indexOf('<script', page.indexOf('<body>'))).replace(/<noscript>[\s\S]*?<\/noscript>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const words = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(words === 'kahran singh about photos poems × v3 v2 v1', 'no instruction text: the page\'s own words are the name, the way out, the close mark and the version tab', words)
  check(!/tune\.js|\?tune/.test(page + stoneJs) && [...stoneJs.matchAll(/\bQ\.get\('([a-z]+)'\)/g)].every(m => m[1] === 'w'), 'no tune panel and no study switch on the live page: the address carries only the world')
  const unread = Object.keys(DEF).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(stoneJs) && !stoneCss.includes(`var(--${k},`))
  const css = [...stoneCss.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].filter(m => m[1] in DEF && Number(m[2]) !== Number(DEF[m[1]]) && m[2].trim() !== String(DEF[m[1]]))
  const own = [...stoneCss.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)), clash = Object.keys(DEF).filter(k => own.includes(k))
  check(!unread.length && !css.length && !clash.length, `every one of ${Object.keys(DEF).length} dials in v3/defaults.json is read, CSS fallbacks equal it, none shadows a page variable`, [...unread, ...css.map(m => m[1] + ' fallback'), ...clash.map(k => k + ' shadows')].join(', ')) }
{ const v2 = read('v2/index.html'), v1 = read('v1/index.html')
  const ok = /id="wall-block"/.test(v2) && /id="doing-tools"/.test(v2) && /class="doing-item" data-line=/.test(v2) && /<link rel="canonical" href="https:\/\/kahransingh\.com\/v2\/">/.test(v2)
    && /<a href="\/">v3<\/a>\s*<span class="vswitch-here" aria-current="page">v2<\/span>\s*<a href="\/v1\/">v1<\/a>/.test(v2) && /<a href="\/">v3<\/a>\s*<a href="\/v2\/">v2<\/a>\s*<span class="vswitch-here" aria-current="page">v1<\/span>/.test(v1)
    && /<span aria-current="page">v3<\/span><a href="\/v2\/">v2<\/a><a href="\/v1\/">v1<\/a>/.test(page) && !/wall-block|doing-item|doing-tools|Right now/.test(page)
  const assets = [...v2.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)].map(m => m[1]).filter(u => !/^\/(about|photography|poetry|context|lately|v1)\b|^\/$|^\/v2\/$/.test(u)).filter(u => !existsSync(path.join(ROOT, u)))
  check(ok && !assets.length, 'the wall\'s home lives on at /v2/ (its wall, flow view and Right now lines, its own canonical); the tab reads v3 · v2 · v1 on all three; the stone carries none of the wall', assets.join(', ') || 'markup') }

/* ---------- 37, in node: the segments and the deal ---------- */
const P37 = (() => { const S37 = require('../v3/segs.js'), CUT = require('../v3/cut.js'), YS = ['shape']
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', rarr: '→', hellip: '…' }
const flat = s => String(s).replace(/\s+/g, ' ').trim()
const asRead = h => flat(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/gi, (m, e) => NAMED[e] ?? m))
const pageCache = new Map(), pageText = f => pageCache.get(f) ?? (pageCache.set(f, /\.(js|json)$/.test(f) ? flat(read(f)) : asRead(read(f))), pageCache.get(f))
const verbatim = (f, t) => !!t && pageText(f).includes(flat(t))
const wholeWord = (text, w) => new RegExp(`(^|[^a-zà-ÿ’'])${w.replace(/[’']/g, '[’\']')}([^a-zà-ÿ’']|$)`, 'i').test(text)

const data = J('v2/data.json'), SEG = J('v3/segments.json'), VOC = J('v3/doors.json').vocabs.his, KIN = J('v3/kin.json').photos, REG = REGIONS
const CROSS = Object.fromEntries(J('studies/32/crossings.json').photos.map(p => [p.src, p])), IDEAS21 = J('v3/body/ideas.json')
const home = read('v2/home.js'), a0 = home.indexOf('function norm'), b0 = home.indexOf('/* ---------------------------------------------------------- the render', a0)
const { stanzasOf } = new Function(home.slice(a0, b0) + '; return { stanzasOf }')()
const IDEAS = new Function(home.slice(home.indexOf('var IDEAS'), home.indexOf('];', home.indexOf('var IDEAS')) + 2) + '; return IDEAS')()
const segBy = Object.fromEntries(SEG.segs.map(s => [s.id, s])), photoSeg = src => segBy['photo:' + src]
const poemOf = slug => data.poems.find(p => p.slug === slug), titleOf = slug => (poemOf(slug) || {}).title
const linesOf = slug => stanzasOf(poemOf(slug)).flat()
const readings = {}; { let cur = null; for (const raw of read('v3/body/readings.txt').split('\n')) { if (raw.startsWith('@ ')) { cur = raw.slice(2).trim(); readings[cur] = []; continue }
  if (!cur || !raw.trim() || raw.startsWith('#') || /^\s+note:/.test(raw)) continue; const [ph, tags] = raw.split(' | '); if (tags) readings[cur].push({ phrase: ph.trim().split('\\n'), concepts: tags.trim().split(/\s+/) }) } }
const conceptsOfLine = (slug, lines) => new Set((readings[slug] || []).filter(r => r.phrase.some(p => lines.some(l => l.includes(p)))).flatMap(r => r.concepts))
const conceptsOfPoem = slug => new Set((readings[slug] || []).flatMap(r => r.concepts))
const conceptsOfPhoto = src => (IDEAS21.photos[src.split('/').pop().replace(/\.[a-z]+$/i, '')] || '').split(/\s+/).filter(Boolean)
const aboutYears = [...read('v2/about.html').matchAll(/<li><b>([^<]+)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map(m => ({ y: m[1].trim(), text: asRead(m[2]) }))

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
  for (const piece of st.big.split(' · ')) if (!verbatim(file, piece) && !(seg.kind === 'about' && read('v2/about.html').includes(piece.replace(/’/g, '\\u2019')))) return `"${piece.slice(0, 50)}" is not in ${file}`
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
    if (s.kind === 'about' && !verbatim('v2/about.html', s.text) && !read('v2/about.html').includes(s.text.replace(/’/g, '\\u2019'))) bad.push(`${s.id}: "${s.text}" is not on the About`)
    if (s.kind === 'idea' && !IDEAS.some(I => [I.detail.intro, ...(I.detail.tools || []), I.detail.boundary].some(t => t && t.includes(s.text)) && I.name === s.title)) bad.push(`${s.id}: not on the wall`)
    if (/\b(Divya|Sweta|Sahil|Rachna|Gourav)\b/.test(s.text || '')) bad.push(`${s.id}: names someone else`) }
  check(!bad.length, `every one of ${segN.toLocaleString('en-US')} segments is in its source on the site, word for word, and names no one but him`, bad.slice(0, 6).join(' | ')) }

// a world's facets as the page would cut them: 33's masses on the photograph, at this size; the poem line beside each by its height
function facetsFor(photo, poem, W, H) { const count = W < 640 ? 15 : H < 560 ? 15 : 26, R = REG[photo], key = poem + '~' + photo.replace('/photos/', '')
  const K = CUT.cut({ R, W, H, count, logic: 'masses', wind: 8, seed: key, dials: { share: .75, gap: .03, spacing: .16, fillGap: .13, lineMin: .25 } }), cells = CUT.voronoi(K.sites, W, H, 8), n = linesOf(poem).length
  return CUT.facets(K, cells, W, H, 8, R).filter(f => f.edges.length && f.region).map(f => S37.describe(f, R, { line: Math.min(n - 1, Math.floor(f.centroid[1] / H * n)), c: f.centroid })) }
const D = { SEG, data, VOC, KIN, stanzasOf }
/* every segment's way out lands where its words are written: each step the page builds with a link (S37.steps itself, both ways a
   tap unfolds) must carry words that are on that page, word for word. /#flow counts as /v2/#flow (the stone forwards it), and a page
   that loads /v2/home.js shows the IDEAS written there. 9 Nov: the About's segments are the letter's, so they go to /v2/about.html */
{ const bad = [], seen = new Set(), known = new Set(); let links = 0
  // The one link that does not (9 Nov, left for Kahran): the Context idea's opening, unfolded whole, goes to the idea's own page
  // (its IDEAS href), which says the same thing in other words. Listed so it cannot spread; the check fails if it stops being true.
  const KNOWN = { 'idea:context /context/': 'IDEAS gives Context an href to its own page; the opening is written on the wall, not there' }
  const fileOf = h => { const u = h.startsWith('/#flow') ? '/v2/' : h.replace(/[#?].*$/, ''); return u.replace(/^\//, '').replace(/(^|\/)$/, '$1index.html') }
  const holds = (f, t) => { if (!existsSync(path.join(ROOT, f))) return false; const raw = read(f)
    return verbatim(f, t) || raw.includes(t) || raw.includes(t.replace(/’/g, '\\u2019')) || (raw.includes('<script src="/v2/home.js">') && verbatim('v2/home.js', t)) }
  for (const s of SEG.segs) { const to = { photo: data.photos.find(q => q.src !== s.img).src, poem: data.poems.find(q => q.slug !== s.poem && live.has(q.slug)).slug }
    for (const y of ['shape', 'whole']) for (const st of S37.steps({ seg: s, link: { k: 'word' }, to }, y, D)) { if (!st.href || st.t === 'move') continue
      const f = fileOf(st.href), pieces = st.t === 'lines' ? st.lines : st.big.split(' · '), key = st.href + '|' + pieces.join('|'); if (seen.has(key)) continue; seen.add(key); links++
      const miss = pieces.find(t => !holds(f, t)); if (!miss) continue
      if (KNOWN[s.id.split(':').slice(0, 2).join(':') + ' ' + st.href]) { known.add(s.id.split(':').slice(0, 2).join(':') + ' ' + st.href); continue }
      bad.push(`${s.id} → ${st.href}: "${miss.slice(0, 50)}" is not there`) } }
  for (const k of Object.keys(KNOWN)) if (!known.has(k)) bad.push(`${k} is listed as known but now lands on its words: take it off the list`)
  check(!bad.length && links > 0, `every one of ${links.toLocaleString('en-US')} links a segment opens lands on a page holding its words, word for word (the About's at /v2/about.html; ${known.size} known exception, named in the check)`, bad.slice(0, 6).join(' | ')) }

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
  const fake = [commentary('the dark · a lovely quiet moment', w, seg), commentary('the dark · this one waits for 4°', w, seg), commentary('the night · ‘night’', w, seg), stepText({ t: 'say', big: seg.lines[0] + ' indeed', small: seg.title }, { ...seg, kind: 'about', src: 'v2/about.html', text: '' }, w)]
  const wrong = [recount(w, f, seg, { k: 'region', cls: 'dark', word: 'moon' }, 'dark'), recount(w, f, seg, { k: 'region', cls: 'dark', word: 'night' }, 'light'), recount(w, { ...f, door: null }, seg, { k: 'word', word: 'zebra', line: 1 }, 'dark')]
  check(fake.every(Boolean) && wrong.every(Boolean) && !commentary('the dark · ‘night’', w, seg) && !recount(w, f, seg, { k: 'region', cls: 'dark', word: 'night' }, 'dark'), 'the check rejects invented commentary, a non-verbatim piece and a basis that does not hold', JSON.stringify({ fake, wrong })) }
  return { plansHold, regionAt, segBy, reached, LABEL_OK, kindsSeen }
})()

/* ---------- 38: every photograph's date, from its own EXIF; the About's years have its row ---------- */
const XJ = J('v3/crossings.json'), MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const { taken } = await import(path.join(ROOT, 'studies/38/exif.mjs'))
const YEARS = /const YEARS = '([^']+)'/.exec(stoneJs)[1]
{ const bad = DATA.photos.filter(p => { const r = XJ.photos.find(x => x.src === p.src), d = taken(path.join(ROOT, p.src)); return !r || r.taken !== d || r.row !== (+d.slice(0, 4) >= 2026 ? 'now' : d.slice(0, 4)) }).map(p => p.src)
  const target = (() => { const u = new URL(YEARS, 'https://kahransingh.com'), f = path.join(ROOT, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname); return existsSync(f) ? readFileSync(f, 'utf8') : '' })()
  const rows = [...new Set(XJ.photos.map(p => p.row))], missing = rows.filter(r => !new RegExp(`class="yr[^"]*" data-y="${r}"`).test(target))
  const seam = (stoneJs.match(new RegExp(YEARS.replace(/[.?]/g, '\\$&'), 'g')) || []).length
  check(!bad.length && !missing.length && seam === 1, `every one of ${DATA.photos.length} photographs' month and year is its own EXIF's; the About's years at ${YEARS} (one address in the code) hold all ${rows.length} of their rows`, [...bad.slice(0, 3), ...missing.map(r => 'no row ' + r), seam !== 1 && `the address appears ${seam} times`].filter(Boolean).join(', ')) }

/* ---------- 39, in node: the crossing over the corpus ---------- */
const P39 = await (async () => { const K = require('../v3/cut.js'), K33 = require('../studies/33/cut.js'), X = require('../v3/cross.js'), REG = REGIONS, XS = ['grow']
  const SIZES = [{ id: 'desk', w: 1440, h: 900, n: +DEF['facets-desk'], mobile: false }, { id: 'phone', w: 390, h: 844, n: +DEF['facets-phone'], mobile: true }, { id: 'side', w: 844, h: 390, n: +DEF['facets-low'], mobile: true }]
  const DIALS = { share: +DEF['cut-share'], gap: +DEF['cut-gap'], spacing: +DEF['cut-spacing'], fillGap: +DEF['cut-fill-gap'], lineMin: +DEF['cut-line-min'] }
  const XD = { fire: +DEF['cross-fire'], gap: +DEF['cut-gap'], holdTone: +DEF['hold-tone'], holdNear: +DEF['hold-near'], growSpread: +DEF['grow-spread'], border: +DEF['grow-border'], tone: +DEF['grow-tone'],
    crack: +DEF['shatter-crack-px'], drop: +DEF['shatter-drop'], spin: +DEF['shatter-spin'], sink: +DEF['shatter-sink'], seamReach: +DEF['seam-reach'] }
  const WIND = +DEF.wind, MOMENT = null
/* ---------- 33's recount, copied verbatim from studies/33/check.mjs (the masses parts are what 39 needs; the rest is kept whole) ---------- */
function coverTo(R, W, H, u, v) { const a = R.a, b = W / H; return a > b ? [((u - .5) * (a / b) + .5) * W, v * H] : [u * W, ((v - .5) * (b / a) + .5) * H] }
const distLine = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return Math.abs(dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / (Math.hypot(dx, dy) || 1) }
function recount(C, R, W, H, cells, claimed) {
  const bad = [], st = 1 + Math.min(C.wind ?? 8, 40) / 45, dS = (p, q) => Math.hypot((p[0] - q[0]) / st, p[1] - q[1]), S = C.sites, T = C.tags
  const near = p => S.map((s, i) => [dS(s, p), i]).sort((a, b) => a[0] - b[0])
  let anchors = 0
  for (const F of C.features) for (const A of F.anchors) { anchors++
    const where = `${F.kind}#${F.id}.${A.k}`
    if (F.kind === 'horizon' || F.kind === 'line') { const L0 = F.kind === 'horizon' ? R.horizon : R.line
      if (!L0) { bad.push(where + ': no such line in regions.json'); continue }
      const e = distLine(A.p, coverTo(R, W, H, ...L0.p0), coverTo(R, W, H, ...L0.p1)); if (e > .75) bad.push(`${where}: ${e.toFixed(2)}px off the ${F.kind} regions.json records`) }
    else if (F.kind === 'mass-border' || F.kind === 'edge' || F.kind === 'eye-outline') {
      const list = F.kind === 'mass-border' ? R.masses.anchors : F.kind === 'edge' ? R.edges.anchors : (R.eye || {}).outline || [], E = list[A.k]
      if (!E) { bad.push(where + ': no such point in regions.json'); continue }
      const q = coverTo(R, W, H, E[0], E[1]); if (Math.hypot(q[0] - A.p[0], q[1] - A.p[1]) > .75) bad.push(`${where}: not at the recorded point`)
      if (Math.abs(E[2] - A.n[0]) > .01 || Math.abs(E[3] - A.n[1]) > .01) bad.push(`${where}: not across the recorded direction`)
      if (F.kind === 'mass-border' && (A.between[0] !== E[4] || A.between[1] !== E[5])) bad.push(`${where}: names the wrong tones`) }
    else bad.push(`${where}: a kind of line the masses cut does not have`)
    const nn = near(A.p), two = [nn[0][1], nn[1][1]].sort((a, b) => a - b).join(), pair = [...A.pair].sort((a, b) => a - b).join()
    if (two !== pair) bad.push(`${where}: the seam does not lie there (nearest sites ${two}, its pair ${pair})`)
    else if (Math.abs(nn[0][0] - nn[1][0]) > .01 * nn[0][0] + .05) bad.push(`${where}: its pair is not mirrored across it`)
    if (T[A.pair[0]].kind !== 'pair' || T[A.pair[0]].mate !== A.pair[1] || T[A.pair[0]].f !== F.id) bad.push(`${where}: its sites do not say so`) }
  const basis = (i, j) => { const a = T[i], b = T[j]
    if (a.kind === 'geometric' || b.kind === 'geometric') return 'geometric'
    if (a.kind === 'pair' && a.mate === j) return 'on'
    if (a.kind === 'pair' && b.kind === 'pair') return a.f === b.f ? 'along' : 'meet'
    if (a.kind === 'pair' || b.kind === 'pair') return 'beside'
    return 'split' }
  const kinds = {}; let edges = 0
  cells.forEach((P, i) => { if (P.length < 3) return
    P.forEach((a, e) => { const b = P[(e + 1) % P.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], fr = v => Math.abs(v) < .6
      const frame = (fr(a[0]) && fr(b[0])) || (fr(a[0] - W) && fr(b[0] - W)) || (fr(a[1]) && fr(b[1])) || (fr(a[1] - H) && fr(b[1] - H))
      const got = claimed[i] && claimed[i].edges[e]; edges++
      if (frame) { kinds.frame = (kinds.frame || 0) + 1; if (!got || got.kind !== 'frame') bad.push(`facet ${i} edge ${e}: the frame, claimed ${got && got.kind}`); return }
      const nn = near(m).filter(x => x[1] !== i), j = nn[0][1], k = basis(i, j); kinds[k] = (kinds[k] || 0) + 1
      if (!got || got.to !== j || got.kind !== k) bad.push(`facet ${i} edge ${e}: recount ${k} with site ${j}, claimed ${got && got.kind} with ${got && got.to}`) }) })
  const geo = T.filter(t => t.kind === 'geometric').length, paired = T.filter(t => t.kind === 'pair').length
  if (geo && !(C.fallback && /geometric/.test(C.fallback.to) && C.fallback.why && C.fallback.why !== 'none')) bad.push(`${geo} geometric sites with no declared fallback`)
  if (!C.fallback) { if (C.ran !== C.logic) bad.push(`ran ${C.ran} for ${C.logic} without saying so`); const own = paired + T.filter(t => t.kind === 'eye').length; if (anchors < 2 || own / S.length < .3) bad.push(`undeclared, yet only ${anchors} anchors and ${own}/${S.length} sites from the photograph's lines`) }
  else { if (!C.fallback.why) bad.push('fell back without a reason'); if (C.fallback.from !== C.logic || C.ran === C.logic) bad.push('the fallback does not name where it came from') }
  if (S.length !== cells.length) bad.push(`${S.length} sites, ${cells.length} facets`)
  return { bad, anchors, edges, kinds, paired, geo } }

/* ---------- the ledger rules, the same in node and in the page ---------- */
const SEEN = .02 // below this a facet is not seen
function diff(a, b, W, H) { // how far one facet travelled between two frames, in the worst of its three measures, each over its bound
  const s = Math.abs(a.seen - b.seen) / .2; if (a.seen <= SEEN || b.seen <= SEEN) return s // unseen, a facet's shape is nobody's business
  const ar = Math.abs(a.area - b.area) / (.03 * W * H), c = a.c && b.c && a.area > .002 * W * H && b.area > .002 * W * H ? Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) / (.04 * Math.max(W, H)) : 0
  return Math.max(s, ar, c) }
const lost = (e, W, H) => e.seen > SEEN && e.area > .0005 * W * H
function compare(A, B, W, H) { // [problems, worst step]: a facet seen in one frame and missing from the next (or back) is unaccounted
  const bad = [], ma = new Map(A.map(e => [e.id, e])), mb = new Map(B.map(e => [e.id, e])); let worst = 0, who = null
  for (const [id, e] of ma) if (!mb.has(id) && lost(e, W, H)) bad.push(`${id} vanished (seen ${e.seen}, ${Math.round(e.area)}px²)`)
  for (const [id, e] of mb) if (!ma.has(id) && lost(e, W, H)) bad.push(`${id} appeared from nowhere (seen ${e.seen})`)
  for (const [id, e] of ma) { const f = mb.get(id); if (!f) continue; const d = diff(e, f, W, H); if (d > worst) { worst = d; who = id } }
  return { bad, worst, who } }
/* walk a crossing's clock: every step, and where a step is big, the same interval cut 8 and then 64 times finer. A move spreads out; a jump does not */
async function walk(get, W, H, steps = 90) {
  const bad = []; let prev = await get(0), first = prev, biggest = 0, fine = 0; const frames = [prev]
  for (let s = 1; s <= steps; s++) { const t = s / steps, cur = await get(t), r = compare(prev.list, cur.list, W, H)
    bad.push(...r.bad.map(b => `t=${t.toFixed(3)}: ${b}`)); biggest = Math.max(biggest, r.worst)
    if (r.worst > 1) { let lo = (s - 1) / steps, span = 1 / steps, worst = r.worst, who = r.who
      for (const cut of [8, 8]) { let p = await get(lo), wmax = 0, at = lo; span /= cut
        for (let k = 1; k <= cut; k++) { const q = await get(lo + k * span), rr = compare(p.list, q.list, W, H); bad.push(...rr.bad.map(b => `t=${(lo + k * span).toFixed(4)}: ${b}`)); if (rr.worst > wmax) { wmax = rr.worst; at = lo + (k - 1) * span } p = q }
        fine++; lo = at; if (wmax <= Math.max(1, worst / cut * 2.5)) { worst = 0; break } worst = wmax }
      if (worst > 1) bad.push(`t=${t.toFixed(3)}: ${who} jumps (a step of ${worst.toFixed(2)}x its bound does not spread out on a finer clock)`) }
    prev = cur; frames.push(cur) }
  return { bad, first, last: prev, biggest, fine, frames } }
const seenSet = list => list.filter(e => e.seen > .99 && e.area > 0)
function same(list, rest, W, H, tol = 1) { // the seen facets of one frame are, one for one, the facets of the stone at rest
  const a = seenSet(list), b = rest.filter(e => e.area > 0), bad = []
  if (list.some(e => e.seen > .01 && e.seen <= .99 && e.area > .0005 * W * H)) bad.push('a facet half seen')
  if (a.length !== b.length) bad.push(`${a.length} facets seen, ${b.length} at rest`)
  const used = new Set()
  for (const e of a) { let best = -1, bd = Infinity; b.forEach((f, j) => { if (used.has(j)) return; const d = Math.hypot(e.c[0] - f.c[0], e.c[1] - f.c[1]); if (d < bd) { bd = d; best = j } })
    if (best < 0 || bd > tol || Math.abs(e.area - b[best].area) > Math.max(2, b[best].area * .005)) { bad.push(`a facet at ${e.c.map(Math.round)} matches none at rest (${bd.toFixed(2)}px, ${Math.round(e.area)} vs ${best < 0 ? '-' : Math.round(b[best].area)}px²)`); continue } used.add(best) }
  return bad }

  if (process.env.STATIC !== '0') {
/* ---------- 1 · the corpus, in node ---------- */
{ const photos = DATA.photos.map(p => p.src).filter(s => REG[s]), N = Math.min(photos.length, +(process.env.PAIRS || 26)), tally = {}, problems = []
  const cutOf = (src, vp) => { const C = K.cut({ R: REG[src], W: vp.w, H: vp.h, count: vp.n, logic: 'masses', wind: WIND, seed: src, moment: MOMENT, dials: DIALS }); C.cells = K.voronoi(C.sites, vp.w, vp.h, WIND); return C }
  const rest = C => C.cells.map(P => ({ ...X.seenOf({ P }), seen: 1 })).map(e => ({ area: e.area, c: e.c }))
  for (const vp of SIZES) for (let k = 0; k < N; k++) { const a = photos[Math.floor(k * photos.length / N)], b = photos[(Math.floor(k * photos.length / N) * 11 + 5) % photos.length]; if (a === b) continue
    const A = cutOf(a, vp), B = cutOf(b, vp), origin = [vp.w * (.2 + .6 * ((k * 37) % 100) / 100), vp.h * (.2 + .6 * ((k * 53) % 100) / 100)]
    for (const x of [...XS, 'calm']) { const P = X.plan({ x, A, B, RA: REG[a], RB: REG[b], W: vp.w, H: vp.h, wind: WIND, origin, D: XD })
      const get = t => ({ list: X.pose(P, t).entries.map(e => ({ id: e.id, seen: e.seen * (e.alpha > .002 ? 1 : 0), ...X.seenOf(e) })) })
      const r = await walk(get, vp.w, vp.h, 60), tl = tally[x] ||= { n: 0, biggest: 0, fine: 0, held: 0, movers: 0, tangled: 0 }; tl.n++; tl.biggest = Math.max(tl.biggest, r.biggest); tl.fine += r.fine
      if (P.movers) { tl.movers += P.movers.length; tl.held += P.movers.filter(m => m.held).length; if (P.tangle) tl.tangled++ }
      const ends = [...same(r.first.list, rest(A), vp.w, vp.h, .01).map(b => 't=0: ' + b), ...same(r.last.list, rest(B), vp.w, vp.h, .01).map(b => 't=1: ' + b)]
      if (P.movers) { const ids = new Set(); for (let s = 0; s <= 20; s++) { const L = X.pose(P, s / 20).entries; if (L.length !== vp.n) ends.push(`${L.length} facets at t=${s / 20}`) } }
      if (x === 'calm') { for (let s = 0; s <= 10; s++) if (X.pose(P, s / 10).entries.some(e => e.m.some((v, j) => v !== [1, 0, 0, 1, 0, 0][j]))) { ends.push('reduced motion moves a facet'); break } }
      if (r.bad.length || ends.length) problems.push(`${x} ${vp.id} ${a.replace('/photos/', '')}→${b.replace('/photos/', '')}: ${[...ends, ...r.bad].slice(0, 2).join(' | ')}`) } }
  const n = Object.values(tally).reduce((s, t) => s + t.n, 0)
  check(!problems.length, `corpus: ${n} crossings (${N} photograph pairs × ${SIZES.length} sizes × ${XS.length} ways + reduced motion) start on this cut, land on the next one exactly, and account for every facet in every frame`, `${problems.length} wrong: ${problems.slice(0, 3).join(' || ')}`)
  for (const [x, t] of Object.entries(tally)) console.log(`     ${x.padEnd(8)} fastest step ${t.biggest.toFixed(2)}x its bound, ${t.fine} steps cut finer and spread out${t.movers ? `; ${t.movers} movers${t.held ? ', ' + t.held + ' held' : ''}${t.tangled ? ', ' + t.tangled + ' left a near pass' : ''}` : ''}`) }
  }
  return { recount, compare, walk, same, K33, DIALS, SIZES }
})()

/* ---------- 34 and 35, in node: the truth the chain and the line are held to ---------- */
const FIXTURE = readFileSync(path.join(HERE, 'fixtures/open-meteo-2026-11-08.json'), 'utf8')
const P36 = (() => { let ASKED = null
  const DAYS = J('v2/days.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), PLACE = J('v2/place.json')
  const PICK_SRC = read('v2/pick.js'), WEATHER_SRC = read('v2/weather.js')
const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
function readingOf(om) { const c = om.current, d = om.daily || {}
  return { place: PLACE.place, lat: PLACE.lat, lon: PLACE.lon, tz: om.timezone || PLACE.tz, away: !!PLACE.away, weather_code: c.weather_code, is_day: c.is_day,
    temperature_2m: c.temperature_2m, cloud_cover: c.cloud_cover, wind_speed_10m: c.wind_speed_10m, precipitation: c.precipitation, rain: c.rain, showers: c.showers,
    snowfall: c.snowfall, sunrise: d.sunrise && d.sunrise[0], sunset: d.sunset && d.sunset[0] } }
function pickJS(reading, days) {
  const win = { kahranWeather: { current: reading } }
  vm.runInNewContext(PICK_SRC, { window: win, Math, Date, JSON, Object, Array, Number, String, parseInt })
  const K = win.kahranPick; K.__test.setScores(QS, PS); K.setDays(days); return K
}
const READING = readingOf(JSON.parse(FIXTURE))
const objKeys = name => Object.keys(new Function('return {' + new RegExp(name + '\\s*=\\s*\\{([\\s\\S]*?)\\}').exec(PICK_SRC)[1] + '}')()).length
const constOf = name => +new RegExp(name + '\\s*=\\s*(-?[\\d.]+)').exec(PICK_SRC)[1]

function truthFor(iso, reading, days) {
  const K = pickJS(reading, days), T = K.__test, day = T.dayVectorFromCurrent(iso, reading, reading.lat)
  const order = (kind, key) => { const items = DATA[kind === 'photo' ? 'photos' : 'poems'].slice(), out = []
    while (items.length) { K.setData(kind === 'photo' ? { poems: DATA.poems, photos: items } : { poems: items, photos: DATA.photos }); const r = K.pickFor(iso, true)
      const k = kind === 'photo' ? r.photo : r.poem; out.push(k); items.splice(items.findIndex(x => x[key] === k), 1) }
    return out }
  const photos = order('photo', 'src'), poems = order('poem', 'slug')
  // independent recount of everything shown
  const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICK_SRC)
  const shown = (kind, win) => { const s = new Set(), cut = new Date(Date.parse(iso + 'T00:00:00Z') - win * 864e5).toISOString().slice(0, 10)
    for (const [d, e] of Object.entries(days.days)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e[kind]) s.add(e[kind]); return s }
  const sp = shown('photo', +nov[2]), sq = shown('poem', +nov[1])
  const nearKm = constOf('PLACE_BONUS_NEAR_KM'), farKm = constOf('PLACE_BONUS_FAR_KM')
  const kms = DATA.photos.map(p => PS.photos[p.src] && PS.photos[p.src].place).filter(p => p && p.lat != null).map(p => T.haversineKm(reading.lat, reading.lon, p.lat, p.lon))
  const vecOf = (doc, k) => T.itemVector(doc, k), dist = (doc, k) => T.weightedDistance(day, vecOf(doc, k))
  const score = (kind, k, dd = day, lat = reading.lat, lon = reading.lon, ds = days) => { const doc = kind === 'photo' ? PS : QS
    let s = -T.weightedDistance(dd, vecOf(doc, k)); if (kind === 'photo') s += T.placeBonus((PS.photos[k] || {}).place, lat, lon)
    if ((kind === 'photo' ? shown('photo', +nov[2]) : shown('poem', +nov[1])).has(k) && ds) s += constOf('NOVELTY_PENALTY'); return s + T.tiebreak(iso, k) }
  const feelRank = (kind, k) => { const doc = kind === 'photo' ? PS : QS, list = DATA[kind === 'photo' ? 'photos' : 'poems'].map(x => x[kind === 'photo' ? 'src' : 'slug'])
    return list.slice().sort((a, b) => dist(doc, a) - dist(doc, b) || list.indexOf(a) - list.indexOf(b)).indexOf(k) + 1 }
  const entries = [...DATA.photos.map(p => PS.photos[p.src]), ...DATA.poems.map(p => QS.poems[p.slug])].filter(Boolean)
  const kept = Object.keys(days.days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d))
  const N = { photos: DATA.photos.length, poems: DATA.poems.length, candidates: DATA.photos.length + DATA.poems.length, measures: AX.length,
    scoredPhotos: DATA.photos.filter(p => PS.photos[p.src]).length, scoredPoems: DATA.poems.filter(p => QS.poems[p.slug]).length, scored: entries.length,
    judgements: entries.reduce((s, e) => s + AX.filter(a => typeof e[a] === 'number').length, 0), located: kms.length,
    places: new Set(DATA.photos.map(p => PS.photos[p.src]?.place?.name).filter(Boolean)).size, kept: kept.length,
    comparisons: (DATA.photos.length + DATA.poems.length) * AX.length, distances: kms.length, near: kms.filter(k => k <= nearKm).length, far: kms.filter(k => k > nearKm && k <= farKm).length,
    setPhotos: DATA.photos.filter(p => sp.has(p.src)).length, setPoems: DATA.poems.filter(p => sq.has(p.slug)).length, digests: DATA.photos.length + DATA.poems.length,
    farthest: Math.round(Math.max(...kms)), nearestKm: Math.round(Math.min(...kms)), nearKm, farKm, winPhoto: +nov[2], winPoem: +nov[1],
    wetCodes: objKeys('WET_CODE_FLOORS'), fogCodes: objKeys('FOG_OR_OVERCAST_CODES'), photoFeel: feelRank('photo', photos[0]), poemFeel: feelRank('poem', poems[0]) }
  N.setBack = N.setPhotos + N.setPoems
  const F = { photoGap: score('photo', photos[0]) - score('photo', photos[1]), poemGap: score('poem', poems[0]) - score('poem', poems[1]),
    photoDist: dist(PS, photos[0]), poemDist: dist(QS, poems[0]) }
  AX.forEach(a => { F['day_' + a] = day[a]; F['w_' + a] = T.weightedDistance({ ...Object.fromEntries(AX.map(x => [x, 0])), [a]: 1 }, Object.fromEntries(AX.map(x => [x, 0]))) ** 2 })
  // each signal taken away: pickBest's answer, and whether any score moved
  const best = (dd, lat, lon, ds) => ({ photo: T.pickBest(DATA.photos, 'src', dd, PS, iso, 'photo', ds, lat, lon), poem: T.pickBest(DATA.poems, 'slug', dd, QS, iso, 'poem', ds, null, null) })
  const allScores = (dd, lat, lon, ds) => [...DATA.photos.map(p => score('photo', p.src, dd, lat, lon, ds)), ...DATA.poems.map(p => score('poem', p.slug, dd, lat, lon, ds))]
  const base = allScores(day, reading.lat, reading.lon, days)
  const sig = {}
  const away = (k, dd, lat, lon, ds) => { const s = allScores(dd, lat, lon, ds); sig[k] = { ...best(dd, lat, lon, ds), moved: s.some((v, i) => Math.abs(v - base[i]) > 1e-12) } }
  away('place', day, null, null, days)
  for (const a of ['light', 'warmth', 'wet', 'stillness', 'season', 'inside']) away(a, { ...day, [a]: .5 }, reading.lat, reading.lon, days)
  away('memory', day, reading.lat, reading.lon, null)
  // which live fields dayVectorFromCurrent reads: change one, see the day move
  const reads = f => { const r2 = { ...reading }, probe = { weather_code: 65, is_day: reading.is_day ? 0 : 1, temperature_2m: reading.temperature_2m + 7, cloud_cover: 50 + (reading.cloud_cover > 50 ? -40 : 40),
      wind_speed_10m: reading.wind_speed_10m + 9, precipitation: 6, rain: 6, showers: 6, snowfall: 6 }
    if (!(f in probe)) return false; r2[f] = probe[f]; const d2 = T.dayVectorFromCurrent(iso, r2, reading.lat); return AX.some(a => Math.abs(d2[a] - day[a]) > 1e-12) }
  N.signals = Object.keys(sig).length; F.photoLift = T.placeBonus(PS.photos[photos[0]].place, reading.lat, reading.lon)
  return { photos, poems, day, N, F, sig, reads }
}

/* ---------- the body, recounted in Node from the files, and what each piece did, tested on pick.js ---------- */
const S21 = J('v3/doors.json'), I21 = J('v3/body/ideas.json'), D15 = J('v3/body/doors15.json'), KIN26 = J('v3/kin.json'), FEAT = J('v3/body/features.json')
const READ_TXT = readFileSync(path.join(ROOT, 'v3/body/readings.txt'), 'utf8')
const HAND = (() => { const out = {}; let slug = null, notes = 0
  for (const l of READ_TXT.split(/\r?\n/)) { if (/^#/.test(l)) continue; const m = l.match(/^@\s+(.+?)\s*$/); if (m) { slug = m[1]; out[slug] = []; continue }
    if (/^\s+note:/.test(l)) { notes++; continue }
    if (slug && l.includes(' | ')) { const [ph, cs] = l.split(' | '); out[slug].push({ phrase: ph.trim(), tags: cs.trim().split(/\s+/) }) } }
  return { poems: out, notes } })()
const countNums = v => Array.isArray(v) ? v.reduce((s, x) => s + countNums(x), 0) : typeof v === 'number' ? 1 : 0
function bodyTruth(iso, reading, days, stoneDoors, live) {
  const K = pickJS(reading, days), T = K.__test, day = T.dayVectorFromCurrent(iso, reading, reading.lat)
  const SRCS = DATA.photos.map(p => p.src), SLUGS = DATA.poems.map(p => p.slug), base = n => n.split('/').pop().replace(/\.\w+$/, '')
  const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICK_SRC), pen = constOf('NOVELTY_PENALTY')
  const recent = (ds, kind, win) => { const s = new Set(); if (!ds) return s; const cut = new Date(Date.parse(iso + 'T00:00:00Z') - win * 864e5).toISOString().slice(0, 10)
    for (const [d, e] of Object.entries(ds.days)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e && e[kind]) s.add(e[kind]); return s }
  const run = I => { const rp = recent(I.days, 'photo', +nov[2]), rq = recent(I.days, 'poem', +nov[1])
    const sc = [...I.data.photos.map(p => -T.weightedDistance(I.day, T.itemVector(I.ps, p.src)) + T.placeBonus(I.ps.photos[p.src] && I.ps.photos[p.src].place, I.lat, I.lon) + (rp.has(p.src) ? pen : 0)),
      ...I.data.poems.map(p => -T.weightedDistance(I.day, T.itemVector(I.qs, p.slug)) + (rq.has(p.slug) ? pen : 0))]
    return { sc, photo: T.pickBest(I.data.photos, 'src', I.day, I.ps, iso, 'photo', I.days, I.lat, I.lon), poem: T.pickBest(I.data.poems, 'slug', I.day, I.qs, iso, 'poem', I.days, null, null) } }
  const B0 = { day, lat: reading.lat, lon: reading.lon, ps: PS, qs: QS, days, data: DATA }, R0 = run(B0)
  const did = f => { if (!live) return 'read'; const I = structuredClone(B0); f(I); const r = run(I)
    return r.photo !== R0.photo || r.poem !== R0.poem ? 'moved' : r.sc.some((v, i) => Math.abs(v - R0.sc[i]) > 1e-12) ? 'weighed' : 'unused' }
  const drop = (doc, coll, f) => { for (const k of Object.keys(doc[coll])) delete doc[coll][k][f] }
  const N = {}, ST = {}
  const L = (k, n, st) => { N['L_' + k] = n; ST[k] = st }
  const P = (k, a, n, st) => { N['P_' + k + '_' + a] = n; ST[k + '.' + a] = st }
  // read at this visit
  L('where', 1, did(I => { I.lat = null; I.lon = null }))
  const FIELDS = { light: ['is_day', 'cloud_cover'], warmth: ['temperature_2m'], wet: ['precipitation', 'rain', 'showers', 'snowfall', 'weather_code'], stillness: ['wind_speed_10m'], inside: [] }
  const asked = (ASKED || '').split(',').filter(Boolean)
  for (const [a, fs] of Object.entries(FIELDS)) P('sky', a, fs.filter(f => asked.includes(f)).length, did(I => { I.day[a] = .5 }))
  N.L_sky = asked.length
  L('season', 1, did(I => { I.day.season = .5 }))
  L('sun', 2, did(I => { const r = { ...reading }; delete r.sunrise; delete r.sunset; I.day = T.dayVectorFromCurrent(iso, r, reading.lat) }))
  const kept = Object.keys(days.days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d))
  L('memory', kept.length, did(I => { I.days = null }))
  L('keptWhy', kept.reduce((s, d) => s + Object.values(days.days[d].why || {}).filter(v => typeof v === 'number').length, 0), did(I => { for (const d in I.days.days) delete I.days.days[d].why }))
  // the works
  for (const [k, coll, keys, doc] of [['photoM', 'photos', SRCS, PS], ['poemM', 'poems', SLUGS, QS]]) {
    let tot = 0; for (const a of AX) { const n = keys.filter(x => typeof (doc[coll][x] || {})[a] === 'number').length; tot += n; P(k, a, n, did(I => drop(k === 'photoM' ? I.ps : I.qs, coll, a))) }
    N['L_' + k] = tot }
  L('places', SRCS.filter(s => PS.photos[s].place && PS.photos[s].place.lat != null).length, did(I => drop(I.ps, 'photos', 'place')))
  L('hour', SRCS.filter(s => PS.photos[s].hour).length + SLUGS.filter(s => QS.poems[s].hour).length, did(I => { drop(I.ps, 'photos', 'hour'); drop(I.qs, 'poems', 'hour') }))
  L('photoNotes', SRCS.filter(s => PS.photos[s].notes).length, did(I => drop(I.ps, 'photos', 'notes')))
  L('poemNotes', SLUGS.filter(s => QS.poems[s].notes).length, did(I => drop(I.qs, 'poems', 'notes')))
  L('words', DATA.poems.filter(p => Number.isFinite(p.words)).length, did(I => I.data.poems.forEach(p => delete p.words)))
  N.D_words = DATA.poems.reduce((s, p) => s + (p.words || 0), 0)
  // read by hand: what shaped the stone is read off the stone itself
  const today = DAY_POEM, lines = (HAND.poems[today] || []).map(x => x.phrase), SD = live ? stoneDoors : []
  const his = S21.vocabs.his, hisW = new Set(his.words.map(w => w.word)), others = Object.entries(S21.vocabs).filter(([k]) => k !== 'his')
  const st = ok => live ? (ok ? 'stone' : 'unused') : 'read', allHis = SD.length > 0 && SD.every(d => hisW.has(d.word))
  const handLines = SLUGS.flatMap(s => HAND.poems[s] || [])
  L('lines', handLines.length, st(SD.length > 0 && SD.every(d => lines.includes(d.phrase))))
  N.D_lineTags = handLines.reduce((s, x) => s + x.tags.length, 0); N.D_doorsToday = stoneDoors.length
  const tiesOf = v => SLUGS.reduce((s, x) => s + ((v.poems || {})[x] || []).length, 0) + SRCS.reduce((s, x) => s + ((v.photos || {})[x] || []).length, 0)
  L('his', tiesOf(his), st(allHis && SD.some(d => ['word', 'near'].includes(d.how)))); N.D_hisIdeas = his.words.length
  L('photoIdeas', SRCS.reduce((s, x) => s + (I21.photos[base(x)] ? I21.photos[base(x)].trim().split(/\s+/).length : 0), 0), st(allHis && SD.some(d => ['word', 'near'].includes(d.phow))))
  L('concepts', Object.keys(S21.concepts).length, st(allHis && SD.some(d => d.how === 'near' || d.phow === 'near')))
  L('vocabs', others.reduce((s, [, v]) => s + tiesOf(v), 0), st(SD.some(d => !hisW.has(d.word) && others.some(([, v]) => v.words.some(w => w.word === d.word)))))
  N.D_otherIdeas = others.reduce((s, [, v]) => s + v.words.length, 0)
  L('strains', HAND.notes + Object.keys(I21.photo_notes).filter(k => SRCS.some(s => base(s) === k)).length, st(false))
  L('earlier', Object.values(D15.vocabs).reduce((s, v) => s + tiesOf(v), 0), st(false)); N.D_earlierWords = Object.values(D15.vocabs).reduce((s, v) => s + v.words.length, 0)
  // measured in each photograph
  L('regions', SRCS.reduce((s, x) => s + countNums((KIN26.photos[x] || {}).cells || []), 0), st(false))
  L('months', SRCS.filter(x => (KIN26.photos[x] || {}).when).length, st(false))
  const FK = ['L', 'contrast', 'a', 'b', 'chroma', 'hue', 'orient', 'density', 'horizon', 'hstrength', 'layout', 'mass'], feat = FEAT.photos.filter(x => SRCS.includes('/photos/' + x.f))
  L('features', feat.reduce((s, x) => s + FK.reduce((t, k) => t + countNums(x[k] ?? []), 0), 0), st(false)); N.D_featPhotos = feat.length
  // totals by what each piece did
  const units = Object.keys(ST).filter(k => !(k in { sky: 1, photoM: 1, poemM: 1 })).map(k => [ST[k], k.includes('.') ? N['P_' + k.replace('.', '_')] : N['L_' + k]])
  N.S_all = units.reduce((s, [, n]) => s + n, 0); N.S_pieces = new Set(Object.keys(ST).map(k => k.split('.')[0])).size
  for (const s of ['moved', 'stone', 'weighed', 'unused']) N['S_' + s] = live ? units.filter(([x]) => x === s).reduce((t, [, n]) => t + n, 0) : 0
  const b = iso.split('-').map(Number); N.doy = Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(b[0], 0, 1)) / 864e5) + 1; N.peak = constOf('SEASON_PEAK_DOY')
  const top = PS.photos[DAY_PHOTO]; if (top && top.place) N.D_chosenKm = Math.round(T.haversineKm(reading.lat, reading.lon, top.place.lat, top.place.lon))
  N.D_chosenRegions = countNums((KIN26.photos[DAY_PHOTO] || {}).cells || [])
  return { N, ST }
}
let DAY_PHOTO = null, DAY_POEM = null
const BLACK = [/closest photo/i, /nearest to that/i, /nothing else came close/i, /a hair behind/i, /a shade nearer/i, /won on feel/i, /out in front/i, /so today leaned/i,
  /\bjust\b/i, /\bsimply\b/i, /\bbasically\b/i, /\bkind of\b/i, /\bsort of\b/i, /\bpretty\b/i, /\bnice\b/i, /\bfun\b/i, /\bmagic/i, /\bvibes?\b/i, /\bwe think\b/i,
  /\bprobably\b/i, /\bguess/i, /\bhappens to\b/i, /\bluck/i, /\brandom/i, /!/, /\bfeel alone\b/i, /\bit's clear and\b/i]
const WORKS = [...DATA.poems.map(p => p.title), ...DATA.photos.map(p => p.alt), ...DATA.photos.map(p => (PS.photos[p.src] || {}).place && PS.photos[p.src].place.name).filter(Boolean),
  ...DATA.poems.flatMap(p => p.stanzas.join('\n').split(/\n| \/ /)).map(l => l.trim()).filter(l => l.length > 2),
  ...Object.values(S21.vocabs).flatMap(v => v.words.map(w => w.word)), ...Object.values(HAND.poems).flatMap(v => v.map(x => x.phrase)), 'SHA-256'].sort((a, b) => b.length - a.length)
const SYSTEM = /\b(day-?flow|pick\.js|weather\.js|home\.js|body\.js|open-?meteo|json|kmini|presence\.json|daily_pick|readings\.txt)\b/i
  return { AX, READING, DAYS, PS, QS, PLACE, PICK_SRC, WEATHER_SRC, pickJS, truthFor, bodyTruth, I21, KIN26, BLACK, WORKS, SYSTEM, setAsked: v => { ASKED = v }, setDay: (p, q) => { DAY_PHOTO = p; DAY_POEM = q } }
})()

/* ---------- in Chrome ---------- */
const VIEWPORTS = [{ id: 'desk', w: 1440, h: 900, mobile: false }, { id: 'phone', w: 390, h: 844, mobile: true }, { id: 'side', w: 844, h: 390, mobile: true }]
  .filter(v => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(v.id))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
async function waitFor(fn, label, tries = 200, every = 100) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(every) } throw new Error('timed out waiting for ' + label) }
function findShell() { if (process.env.CHROME) return process.env.CHROME; const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p } return null }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data); if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value } }
const shell = findShell()
if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.txt': 'text/plain', '.woff2': 'font/woff2' }
const gz = new Map(), gzOf = f => gz.get(f) ?? (gz.set(f, /\.(jpe?g|png|webp|woff2)$/i.test(f) ? statSync(f).size : zlib.gzipSync(readFileSync(f), { level: 9 }).length), gz.get(f))
const server = http.createServer((req, res) => { try { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, path.normalize(u.endsWith('/') ? u + 'index.html' : u))
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); createReadStream(f).pipe(res) } catch { res.writeHead(500); res.end() } })
await new Promise(r => server.listen(0, '127.0.0.1', r))
const HTTP = server.address().port, CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 'home-'))
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, taps = 0, crossings = 0, probes = 0, drawnN = 0, weight = null

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  const b64 = s => Buffer.from(s).toString('base64'), cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
  let SKY = FIXTURE
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url)
    if (msg.method === 'Fetch.requestPaused') { P36.setAsked(new URL(msg.params.request.url).searchParams.get('current'))
      cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: cors, body: b64(SKY) }).catch(() => {}) } }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  // pinned: the clock (4:50 pm New York, 8 Nov 2026, the minute 36's real sky was read) and that sky, so a run tomorrow sees what a run today saw
  const PIN = Date.UTC(2026, 10, 8, 21, 50)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {} })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })

  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp; await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const reduceMotion = on => cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] })
  const open = async (q = '') => { loads++; await cdp.send('Page.navigate', { url: `${BASE}/${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!window.HOME && !!HOME.world && HOME.world.imgOk`), 'page /' + q, 300)
    const first = (await cdp.eval('HOME.firstLoad')).map(u => { const f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u); return [u, statSync(f).size, gzOf(f)] })
    await waitFor(() => cdp.eval('HOME.dealt && !HOME.busy'), 'the deal', 200); await sleep(400); return first }
  const shot = async name => { if (!SHOTS) return; const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const park = () => VP.mobile ? null : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VP.h / 2 })
  const tapAt = async (x, y) => { taps++
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(40); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) } }
  const tap = async ([x, y]) => { await tapAt(x, y); await sleep(120) } // 40's
  const reach = sel => cdp.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
    const top = document.elementFromPoint(x, y); return top && (top === e || e.contains(top)) && r.width > 0 && x > 0 && y > 0 && x < innerWidth && y < innerHeight ? [x, y] : null })()`)
  const shown = () => cdp.eval(`(() => { const out = []; const walk = n => { if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(); const p = n.parentElement; if (t && p.getClientRects().length && !p.closest('[hidden]') && getComputedStyle(p).visibility !== 'hidden') out.push(t) } else n.childNodes.forEach(walk) }
    walk(document.querySelector('#tools')); return out })()`)
  const tapFacet = async i => { const pt = await cdp.eval(`HOME.tapPoint(${i})`); if (!pt) return null; await tapAt(pt[0], pt[1]); return pt }
  const nextSeq = seq0 => waitFor(() => cdp.eval(`HOME.seq > ${seq0} && HOME.last`), 'a facet answer', 60, 30).catch(() => null)
  const watchArrival = async label => { let bad = null, last = null
    for (let i = 0; i < 400; i++) { const s = await cdp.eval(`({ at: HOME.at, arrived: HOME.world.arrived, lines: HOME.lines })`).catch(() => null)
      if (s && s.at === 'world') { last = s; const n = s.lines.filter(l => l.shown).length
        if (s.lines.some((l, j) => l.shown !== (j < n))) bad = s.lines.map(l => l.shown ? (l.door ? 'D' : 'x') : '.').join('')
        if (s.lines.some(l => l.door && l.shown && l.open === false)) bad = 'a shown door line whose door does not answer'
        if (s.arrived) break } await sleep(40) }
    check(!bad && last && last.arrived && last.lines.every(l => l.shown), `${label}: the poem arrives line by line in its order, doors open with their lines`, bad) }
  const inPoly = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
  const meet = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]
  const gap = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3])))
  const share = (box, P) => { let n = 0, t = 0; for (let a = 0; a <= 4; a++) for (let b = 0; b <= 2; b++) { t++; if (inPoly([box[0] + box[2] * a / 4, box[1] + box[3] * b / 2], P)) n++ } return n / t }
  const centre = r => [r[0] + r[2] / 2, r[1] + r[3] / 2]
  // wholly inside: every corner and every point of the box's edge (each 4px) inside the raw cell and a seam's width from its every side, measured here, not with the page's inset
  const seam = Number(DEF['seam-px'])
  const edgeD = ([x, y], P) => { let d = Infinity; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, ay] = P[j], [bx, by] = P[i], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2)); d = Math.min(d, Math.hypot(x - ax - t * vx, y - ay - t * vy)) } return d }
  const ring = b => { const pts = [], n = k => Math.max(2, Math.ceil(k / 4)); for (let a = 0; a <= n(b[2]); a++) { const x = b[0] + b[2] * a / n(b[2]); pts.push([x, b[1]], [x, b[1] + b[3]]) } for (let a = 0; a <= n(b[3]); a++) { const y = b[1] + b[3] * a / n(b[3]); pts.push([b[0], y], [b[0] + b[2], y]) } return pts }
  const wholly = (b, P) => P.length > 2 && ring(b).every(p => inPoly(p, P) && edgeD(p, P) >= seam - .01)
  const r1 = a => a.map(v => Math.round(v))
  const defaults = DEF, IDEAS = HOME_IDEAS, WORDS = new Set(IDEAS.flatMap(I => [I.name, I.line, ...I.parts, I.detail.intro, ...I.detail.tools, I.detail.boundary])), BY = Number(DEF['tools-near-px'])

  // what the page dealt and drew, held to 37's rules, each facet's region recounted from regions.json at the centre the page cut
  const drawnHold = async label => {
    const ids = await cdp.eval('HOME.drawn'), plans = await cdp.eval('HOME.plans'), w0 = await cdp.eval('HOME.world0'), bad = [], world = { photo: w0.photo, poem: w0.poem, doors: w0.doors }
    const plan = [], facets = [], kinds = { tools: 0, year: 0, work: 0 }
    for (const i of ids) { const p = plans[i]; if (!p) { bad.push(`facet ${i} yields nothing`); continue } drawnN++
      if (p.kind === 'tools' || p.kind === 'year') { kinds[p.kind]++; continue } kinds.work++
      const g = P37.regionAt(w0.photo, p.facet.c, w0.W, w0.H); if (!g || g.tone !== p.facet.tone || g.side !== p.facet.side || Math.abs(g.sal - p.facet.sal) > .002 || Math.abs(g.edges - p.facet.edges) > .002) bad.push(`#${i}: its region is not what regions.json holds at its centre`)
      const seg = P37.segBy[p.id]; if (!seg) { bad.push(`#${i}: ${p.id} is not a segment`); continue }
      plan.push({ seg, link: p.link, cls: p.cls, basis: p.basis, to: { photo: '/photos/' + p.to.split('~')[1], poem: p.to.split('~')[0] }, steps: p.steps.map(st => ({ ...st, to: st.to ? { photo: '/photos/' + st.to.split('~')[1], poem: st.to.split('~')[0] } : undefined })) }); facets.push(p.facet) }
    plan.forEach(p => p.steps.forEach(st => { if (st.t !== 'move') delete st.to }))
    P37.plansHold(world, plan, facets, 'shape', label, bad)
    check(!bad.length && kinds.tools === 1 && kinds.year === 1, `${label}: every one of ${ids.length} facets yields: the tools, the photograph's date, and ${kinds.work} pieces of his work, verbatim, each basis recounted, none shared, no commentary`, bad.slice(0, 5).join(' | ') || JSON.stringify(kinds))
    return plans }
  const probeHold = async label => { const ids = await cdp.eval('HOME.drawn'), bad = []
    for (const i of ids) for (const [n, lines] of [[60, 0], [220, 0], [480, 0], [200, 6], [1400, 0]]) { probes++; if (await cdp.eval(`HOME.probe(${i}, ${n}, ${lines})`)) bad.push(`#${i} at ${n}${lines ? ' in ' + lines + ' lines' : ''}`) }
    check(!bad.length, `${label}: words of any length, at any facet, keep clear of the poem, the name and the caption (${ids.length * 5} placed, worst case)`, bad.slice(0, 6).join(' | ')) }

  /* 39's: the stone now, recounted with 33's method; a crossing walked frame by frame */
  const masses = async label => {
    const C = await cdp.eval('HOME.cut'), R = REGIONS[C.src], K33 = P39.K33
    const K0 = K33.cut({ R, W: C.W, H: C.H, count: C.count, logic: 'masses', wind: C.wind, seed: C.seed, moment: null, dials: P39.DIALS })
    const sameSites = K0.sites.length === C.sites.length && K0.sites.every((p, i) => Math.hypot(p[0] - C.sites[i][0], p[1] - C.sites[i][1]) < .01)
    const cells = K33.voronoi(K0.sites, C.W, C.H, C.wind), r = P39.recount({ ...K0, wind: C.wind }, R, C.W, C.H, cells, K33.facets(K0, cells, C.W, C.H, C.wind, R))
    const drawn = cells.length === C.cells.length && cells.every((P, i) => P.length === C.cells[i].length && P.every((p, k) => Math.hypot(p[0] - C.cells[i][k][0], p[1] - C.cells[i][k][1]) < .01))
    check(sameSites && drawn && C.ran === 'masses' && !C.fallback && !r.bad.length,
      `${label}: the stone is ${C.src.replace('/photos/', '')}'s own masses cut (33's cut.js gives the same ${C.count} sites; ${r.anchors} anchors on its borders, ${r.edges} edges recount)`,
      [!sameSites && 'the sites are not 33\'s cut of this photograph', !drawn && 'the drawn cells are not their Voronoi', C.ran !== 'masses' && 'ran ' + C.ran, ...r.bad.slice(0, 3)].filter(Boolean).join(' | ')) }
  const restLedger = async () => { await park(); await cdp.eval('HOME.still = true'); await sleep(900); return (await cdp.eval('HOME.ledger')).list }
  const crossOnce = async (label, how, name) => {
    await restLedger(); const from = await cdp.eval('HOME.world.key'), x = await cdp.eval(`matchMedia('(prefers-reduced-motion: reduce)').matches ? 'calm' : 'grow'`)
    let pt
    if (how === 'door') { const d = await cdp.eval('HOME.doors.find(d => d.box[1] > 0 && d.box[1] + d.box[3] < innerHeight)'); if (!d) { check(false, `${label}: a door line on screen`); return false } pt = [d.box[0] + d.box[2] / 2, d.box[1] + d.box[3] / 2] }
    else { const ps = await cdp.eval('HOME.plans'), i = ps.findIndex((p, j) => p && p.steps && p.steps.length > 1); if (i < 0) { check(false, `${label}: a facet with a move`); return false }
      for (let k = 0; k < ps[i].steps.length - 1; k++) { const seq0 = await cdp.eval('HOME.seq'); await tapFacet(i); await nextSeq(seq0); await sleep(200) }
      await cdp.eval('HOME.still = true'); await sleep(300); pt = await cdp.eval(`HOME.tapPoint(${i})`) }
    await cdp.eval('HOME.clock = 0')
    await tapAt(...pt); crossings++
    await waitFor(() => cdp.eval(`!!HOME.crossing && HOME.crossing.from === ${JSON.stringify(from)} && HOME.t !== null`), label + ' crossing', 150)
    const info = await cdp.eval('HOME.crossing'), shots = { .25: 0, .5: 0, .75: 0 }
    const get = async t => { const L = await cdp.eval(`HOME.step(${t})`); if (L.t !== t) throw new Error(`the page drew t=${L.t} for ${t}`)
      for (const k of Object.keys(shots)) if (!shots[k] && Math.abs(t - k) < 1e-9 && name) { shots[k] = 1; await shot(`${name}-${String(Math.round(k * 100)).padStart(2, '0')}.png`) } return L }
    const r = await P39.walk(get, VP.w, VP.h, 60)
    await cdp.eval('HOME.step(1)'); await cdp.eval('HOME.clock = null')
    await waitFor(() => cdp.eval(`HOME.at === 'world' && !HOME.busy && HOME.world.key !== ${JSON.stringify(from)}`), label + ' landing', 150)
    await watchArrival(label)
    const { before, after } = await waitFor(() => cdp.eval('HOME.ends && HOME.ends.after && HOME.ends'), label + ' the first frame after', 100)
    const ends = [...P39.same(r.first.list, before, VP.w, VP.h).map(b => 't=0 against the stone before: ' + b), ...P39.same(r.last.list, after, VP.w, VP.h).map(b => 't=1 against the stone after: ' + b)]
    if (x === 'calm') { const at = new Map(), moved = new Set()
      for (const F of r.frames) for (const e of F.list) { if (!e.c || e.area <= 0) continue; const p = at.get(e.id); if (!p) at.set(e.id, e.c); else if (Math.hypot(p[0] - e.c[0], p[1] - e.c[1]) > .5) moved.add(e.id) }
      check(info.x === 'calm' && !moved.size, `${label}: reduced motion takes the calm crossing and no facet moves in any of ${r.frames.length} frames`, info.x + ' ' + [...moved].slice(0, 5).join(', ')) }
    check(info.x === x && !r.bad.length && !ends.length, `${label}: ${info.x} from ${how === 'door' ? 'a door line' : 'a facet\'s last tap'}, every facet accounted in every frame (fastest step ${r.biggest.toFixed(2)}x, ${r.fine} cut finer), starts on the stone at rest and lands on the next exactly`, [...ends, ...r.bad].slice(0, 4).join(' | '))
    await masses(label)
    await cdp.eval('HOME.still = false')
    return r }

  /* 36 and 34: the line, and the chain behind it */
  const { AX, READING, DAYS, truthFor, bodyTruth } = P36, WORKS = P36.WORKS, BLACK = P36.BLACK, SYSTEM = P36.SYSTEM, KIN26 = P36.KIN26, PS = P36.PS, QS = P36.QS, PLACE = P36.PLACE
  const panel = () => cdp.eval(`(() => { const p = document.getElementById('why'), b = p.getBoundingClientRect(), w = document.getElementById('where').getBoundingClientRect(), body = p.querySelector('.why-body')
    const wide = [...p.querySelectorAll('.why-body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1) }).map(e => e.className || e.tagName).slice(0, 4)
    const bare = body.cloneNode(true); bare.querySelectorAll('[data-n],[data-f],[data-r],[data-v],[data-date],canvas,img').forEach(e => e.remove())
    const m = HOME.model
    const tw = document.createTreeWalker(bare, NodeFilter.SHOW_TEXT), bits = []; for (let t; (t = tw.nextNode());) bits.push(t.data)
    return { scrollH: p.scrollHeight, clientH: p.clientHeight, clientW: p.clientWidth, text: p.innerText, bare: bits.join(' '), box: [b.left, b.top, b.right, b.bottom], where: [w.left, w.top, w.right, w.bottom], wide, dots: body.dataset.dots,
      ns: [...p.querySelectorAll('[data-n]')].map(e => ({ k: e.dataset.n, t: e.textContent })), fs: [...p.querySelectorAll('[data-f]')].map(e => ({ k: e.dataset.f, d: +e.dataset.d, t: e.textContent })),
      rs: [...p.querySelectorAll('[data-r]')].map(e => ({ k: e.dataset.r, d: e.dataset.d, clock: !!e.dataset.clock, t: e.textContent })),
      vs: [...p.querySelectorAll('[data-v]')].map(e => ({ k: e.dataset.v, d: e.dataset.d, t: e.textContent })), dates: [...p.querySelectorAll('[data-date]')].map(e => ({ iso: e.dataset.date, t: e.textContent })),
      unlabelled: [...p.querySelectorAll('[data-layer]')].filter(e => { const own = [...e.querySelectorAll('.y-st')].some(x => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden')
        const sec = e.closest('.a-sec,.v-sec'); return !own && !(sec && sec.dataset.status === e.dataset.status && sec.querySelector('.a-h').getClientRects().length) }).map(e => e.dataset.layer),
      layers: [...p.querySelectorAll('[data-layer]')].map(e => ({ k: e.dataset.layer, s: e.dataset.status, parts: [...e.querySelectorAll('[data-part]')].map(q => ({ k: q.dataset.part, s: q.dataset.status })), part: e.dataset.part || null })),
      gauges: [...p.querySelectorAll('.b-g')].map(g => g.dataset.axis),
      sigs: [...p.querySelectorAll('.b-sig')].map(s => ({ k: s.dataset.sig, photo: s.dataset.photo, poem: s.dataset.poem, t: s.innerText })),
      doors: [...p.querySelectorAll('.b-door')].map(d => d.dataset.door), stoneDoors: HOME.doors.map(d => ({ phrase: d.phrase, word: d.word, how: d.how, phow: d.phow })),
      notes: m && m.B ? [m.B.today.photo && m.B.today.photo.notes, m.B.today.poem && m.B.today.poem.notes, m.B.today.photo && m.B.today.photo.hour, m.B.today.poem && m.B.today.poem.hour, m.B.today.ideas, m.place].filter(Boolean) : [],
      model: m && { mode: m.mode, iso: m.iso, agrees: m.agrees, fields: m.src.fields, live: m.B && m.B.live }, stone: HOME.world, home: HOME.at === 'stone' && !!HOME.world && HOME.world.mode === 'home' } })()`)
  const num = t => +t.replace(/,/g, '').replace('−', '-')
  const fx = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d)
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const nice = iso => { const [y, mo, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[mo - 1] + ' ' + y }
  const RFIX = (() => { const om = JSON.parse(FIXTURE), c = om.current; return { temp: c.temperature_2m, cloud: c.cloud_cover, wind: c.wind_speed_10m, lat: PLACE.lat, lon: PLACE.lon,
    wetmax: Math.max(c.precipitation, c.rain, c.showers, c.snowfall), sunrise: om.daily.sunrise[0].slice(11, 16), sunset: om.daily.sunset[0].slice(11, 16) } })()
  const vOf = k => { const [kind, key, f] = k.split('|'); return kind === 'photo' ? PS.photos[key][f] : kind === 'poem' ? (f === 'words' ? DATA.poems.find(p => p.slug === key).words : QS.poems[key][f]) : kind === 'kin' ? KIN26.photos[key][f] : undefined }
  const ALL_LAYERS = ['where', 'sky', 'season', 'sun', 'memory', 'keptWhy', 'photoM', 'poemM', 'places', 'hour', 'photoNotes', 'poemNotes', 'words', 'lines', 'his', 'photoIdeas', 'concepts', 'vocabs', 'strains', 'earlier', 'regions', 'months', 'features']

  // the shared core: every number is a recount, every label is what the piece did, nothing stray, nothing casual
  function honest(L, s, truth, body, live) {
    const N = { ...truth.N, ...body.N }
    const badN = s.ns.filter(x => !(x.k in N) || num(x.t) !== N[x.k]).map(x => `${x.k}=${x.t} (want ${N[x.k]})`)
    check(s.ns.length >= 6 && badN.length === 0, `${L}: ${s.ns.length} counts shown equal the recount`, badN.slice(0, 6).join(', '))
    const badF = s.fs.filter(x => !(x.k in truth.F) || x.t !== fx(truth.F[x.k], x.d)).map(x => `${x.k}=${x.t} (want ${fx(truth.F[x.k], x.d)})`)
    check(badF.length === 0, `${L}: ${s.fs.length} measures shown equal pick.js's`, badF.join(', '))
    const badR = s.rs.filter(x => { const v = RFIX[x.k]; return v == null || (x.clock ? x.t !== v : x.d != null ? x.t !== Math.abs(v).toFixed(+x.d) : x.t !== String(v)) }).map(x => `${x.k}=${x.t}`)
    check(badR.length === 0, `${L}: ${s.rs.length} live readings shown equal the sky's`, badR.join(', '))
    const badV = s.vs.filter(x => { const v = vOf(x.k); return v == null || x.t !== (x.d != null ? Number(v).toFixed(+x.d) : String(v)) }).map(x => `${x.k}=${x.t}`)
    check(badV.length === 0, `${L}: ${s.vs.length} stored values shown equal the files`, badV.join(', '))
    check(s.dates.every(x => x.t === nice(x.iso) && x.iso === s.model.iso), `${L}: the date shown is today's`)
    const own = [...WORKS, ...s.notes].filter(w => w.length >= 12 || /\d/.test(w)).sort((a, b) => b.length - a.length).reduce((t, w) => t.split(w).join(' '), s.bare)
    const stray = own.match(/[^\s]*\d[^\s]*/g)
    check(!stray, `${L}: every number on the page is one of the recounted`, stray && stray.slice(0, 6).join(' '))
    const badS = []
    for (const l of s.layers) {
      if (!ALL_LAYERS.includes(l.k)) { badS.push(l.k + ' unknown'); continue }
      if (l.part) { if (body.ST[l.k + '.' + l.part] !== l.s) badS.push(`${l.k}.${l.part} says ${l.s}, did ${body.ST[l.k + '.' + l.part]}`); continue }
      if (l.parts.length) { for (const q of l.parts) if (body.ST[l.k + '.' + q.k] !== q.s) badS.push(`${l.k}.${q.k} says ${q.s}, did ${body.ST[l.k + '.' + q.k]}`) }
      else if (l.k in body.ST && body.ST[l.k] !== l.s) badS.push(`${l.k} says ${l.s}, did ${body.ST[l.k]}`)
    }
    check(!s.unlabelled.length, `${L}: every piece shown carries its label`, s.unlabelled.join(', '))
    check(s.layers.length > 0 && badS.length === 0, `${L}: ${s.layers.length} pieces each labelled with what it did (taken away and re-run on pick.js, or read off the stone)`, badS.slice(0, 5).join('; '))
    if (!live) check(!s.layers.some(l => ['moved', 'weighed', 'stone'].includes(l.s) || l.parts.some(q => q.s !== 'read')), `${L}: with no live pick, nothing claims to have moved it`)
    const black = BLACK.find(r => r.test(own)); check(!black, `${L}: no casual filler`, black && (own.match(black) || [])[0])
    const sys = SYSTEM.exec(s.text); check(!sys, `${L}: no system names`, sys && sys[0])
  }

  const D = k => parseFloat(DEF[k]), ST = D('line-stagger-ms'), FADE = ST * 7 + D('line-out-ms')
  const line = () => cdp.eval('HOME.line'), phase = () => cdp.eval('HOME.phase')
  const settled = async () => { await waitFor(async () => ['resolved', 'none'].includes(await phase()), 'the line resolves', 100); await sleep(300) }
  const sentence = r => { const phrase = new Function(/function phraseFor[\s\S]*?\n {2}\}/.exec(P36.WEATHER_SRC)[0] + '; return phraseFor')()(r.weather_code, r.is_day !== 0); return "We're in " + r.place + ' and ' + phrase + '.' }
  const echoOk = e => { const n = parseFloat(e.reading), t = parseFloat(e.text.replace('−', '-'))
    if (/November|January|February|March|April|May|June|July|August|September|October|December/.test(e.reading)) return e.text.startsWith(e.reading)
    if (!Number.isFinite(n)) return e.text.includes(e.reading)
    return Number.isFinite(t) && Math.abs(Math.abs(t) - n) < .051 }
  const rects = () => cdp.eval(`(() => { const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom] }
    return { where: r(document.getElementById('where')), why: r(document.getElementById('why')), open: HOME.whyOpen } })()`)
  const clear = (a, b) => a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] + 1 || b[3] <= a[1] + 1
  const tapEl = async sel => { const b = await cdp.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [b.left, b.top, b.width, b.height] })()`); await tapAt(b[0] + Math.min(b[2] / 2, 60), b[1] + b[3] / 2) }
  const openWhy = async () => { await tapEl('#where'); await waitFor(() => cdp.eval(`document.body.classList.contains('why') && +getComputedStyle(document.getElementById('why')).opacity > .98 && document.querySelector('.why-body').dataset.drawn === 'yes'`), 'the chain opens', 120) }
  const scrimPt = vp => cdp.eval(`(() => { for (const [x, y] of [[${vp.w} - 20, ${vp.h} * .4], [20, 20], [${vp.w} * .5, 40], [${vp.w} - 20, ${vp.h} - 20], [${vp.w} * .5, ${vp.h} * .5]]) { const e = document.elementFromPoint(x, y); if (e && e.id === 'why-scrim') return [x, y] } return null })()`)

  /* the six names sit WHOLLY inside one facet (Kahran, 9 Nov: "are tools just randomly floating what is that"): every photograph, each with two
     poems (every live poem in turn), at five screens, as a visit makes the world and as a crossing does (HOME.plant: makeWorld itself, off
     screen); every corner and every point of the names' edge inside the facet's cut, a seam's width in, and clear of the poem, the name,
     the caption, the switch and the where line. SWEEP=0 skips it, SWEEP=only stops after it */
  if (process.env.SWEEP !== '0') {
    const SW = [[390, 844, true], [375, 667, true], [430, 932, true], [844, 390, true], [1440, 900, false]]
    const poems = DATA.poems.filter(p => live.has(p.slug)), photos = DATA.photos.filter(p => REGIONS[p.src])
    const keys = photos.flatMap((p, k) => [0, 46].map(o => poems[(k * 7 + o) % poems.length].slug + '~' + p.src.replace('/photos/', '')))
    const bad = [], seen = { n: 0, dots: 0, recut: 0, far: 0, slow: 0 }, ts = Date.now()
    for (const [w, h, mobile] of SW) {
      await view({ id: 'sweep', w, h, mobile }); await open('')
      for (const key of keys) for (const crossed of [false, true]) {
        const trail = crossed ? [keys[(keys.indexOf(key) + 1) % keys.length]] : [], t1 = Date.now(), r = await cdp.eval(`HOME.plant(${JSON.stringify(key)}, ${JSON.stringify(trail)})`); seen.n++; seen.slow = Math.max(seen.slow, Date.now() - t1)
        const tag = `${w}x${h} ${crossed ? 'crossed into' : 'fresh'} ${key}`
        if (!r || r.tools < 0 || !r.box) { bad.push(`${tag}: no facet holds the names`); continue }
        if (r.dots) seen.dots++; if (r.cutT) seen.recut++; if (r.basis.d > BY) seen.far++
        const P = r.cells[r.tools], b = r.box.slice(0, 4), hit = [['poem', r.poem], ['name', r.mat], ['caption', r.cap], ['switch', r.vs], ['where line', r.where]].filter(([, o]) => o[2] > 0 && meet(b, o)).map(([k]) => k)
        if (!r.drawn.includes(r.tools) || !wholly(b, P) || hit.length || b[0] < 0 || b[1] < 0 || b[0] + b[2] > w || b[1] + b[3] > h) bad.push(`${tag}: ${!wholly(b, P) ? 'over a seam' : ''}${hit.length ? ' on the ' + hit.join(', ') : ''} ${r1(b)}`) } }
    check(!bad.length, `the six names sit wholly inside one facet, a seam's width in, clear of the poem, the name, the caption, the switch and the where line: ${keys.length} worlds (all ${photos.length} photographs, ${new Set(keys.map(k => k.split('~')[0])).size} poems) x ${SW.length} screens x fresh and crossed = ${seen.n} placements; ${seen.recut} on a cut re-seeded to hold them, ${seen.dots} as the six dots where no cut holds a name whole; ${seen.far} farther than ${BY}px from the line, none nearer could hold them; slowest world made in ${seen.slow}ms (${Math.round((Date.now() - ts) / 1000)}s)`, `${bad.length} wrong: ${bad.slice(0, 8).join(' | ')}`)
    if (process.env.SWEEP === 'only') { console.log(bad.join('\n')); throw new Error('SWEEP=only: stopped after the sweep') } }

  for (const vp of VIEWPORTS) {
    await view(vp); await reduceMotion(false); errors.length = 0; const tag = `${vp.w}x${vp.h}`
    const first = await open('')
    const p0 = await cdp.eval('({ how: HOME.how, world: HOME.world, iso: new Date().toISOString().slice(0, 10), where: document.getElementById("where").innerText, hour: new Date().getHours() })')
    const TODAY = '2026-11-08', T0 = truthFor(TODAY, READING, DAYS)
    check(p0.how === 'live' && p0.hour === 16 && p0.world.mode === 'home' && p0.world.photo === T0.photos[0] && p0.world.slug === T0.poems[0], `${tag}: under the pinned clock and sky the stone is today's pair, as pick.js picks it (${p0.world.slug}, ${p0.world.photo.replace('/photos/', '')})`, JSON.stringify(p0))
    { const paths = first.map(f => f[0]), regs = paths.filter(u => u.startsWith('/v3/regions/')), photos = paths.filter(u => u.startsWith('/photos/'))
      const total = first.reduce((s, f) => s + f[2], 0), pic = first.filter(f => f[0].startsWith('/photos/')).reduce((s, f) => s + f[2], 0)
      if (vp.id === 'phone') weight = { total, pic, files: first.length, rest: total - pic }
      check(!paths.includes('/v3/segments.json') && !paths.some(u => /regions\.json$/.test(u)) && regs.length === 1 && photos.length === 1 && total - pic < 300 * 1024,
        `${tag}: the first screen is quick: ${first.length} files, ${Math.round((total - pic) / 1024)} KB gzipped before the photograph's ${Math.round(pic / 1024)} KB; one photograph and its regions, no segments.json`, JSON.stringify({ regs, photos, kb: Math.round((total - pic) / 1024) })) }
    await shot(`home-${vp.id}.png`)
    { const c = await cdp.eval('HOME.crop')
      check(c && Math.abs(c.shown - c.screen) / c.screen < .01, `${tag}: the photograph covers the screen as a crop in the screen's own shape, never stretched (file ${c && c.file.toFixed(2)}, shown ${c && c.shown.toFixed(2)})`, JSON.stringify(c)) }

    // 35 line: the readings the pick read, then the sentence
    { const r = READING, rd = await cdp.eval(`[...document.querySelectorAll('#where .rd i')].map(i => i.textContent.replace(/ ·$/, ''))`)
      check(rd.length === 7 && rd.includes(r.temperature_2m.toFixed(1) + ' °C') && rd.includes(r.wind_speed_10m + ' km/h') && rd.includes(r.cloud_cover + '% cloud') && rd.includes(r.is_day ? 'daylight' : 'after dark'), `${tag} 35 line: the readings shown are this sky's own numbers`, rd.join(' | '))
      if (vp.id === 'desk') { const K = P36.pickJS(r, DAYS), base = K.__test.dayVectorFromCurrent(TODAY, r, r.lat)
        const moves = [['temperature_2m', 25], ['wind_speed_10m', 30], ['cloud_cover', 90], ['is_day', 1 - r.is_day], ['rain', 5]].every(([f, v]) => { const d2 = K.__test.dayVectorFromCurrent(TODAY, { ...r, [f]: v }, r.lat); return AX.some(a => Math.abs(d2[a] - base[a]) > 1e-12) })
        check(moves, "35 line: each reading it shows moves pick.js's day when it changes") }
      await settled(); const L1 = await line()
      check(L1 && L1.sentence === sentence(r) && L1.sop > .98 && L1.ops.every(o => o < .02), `${tag} 35 line: it resolves into weather.js's sentence`, L1 && L1.sentence) }

    // the facets
    const plans = await drawnHold(`${tag} home`)
    await probeHold(`${tag} home`)
    { const pl = plans.findIndex(p => p && p.kind !== 'tools' && p.kind !== 'year'), seq0 = await cdp.eval('HOME.seq')
      if (pl >= 0) { await cdp.eval('HOME.dry = true'); await tapFacet(pl); const last = await nextSeq(seq0); await sleep(400); const s = await cdp.eval('({ at: HOME.at, busy: HOME.busy, win: HOME.win, clash: HOME.clash })')
        check(last && last.i === pl && s.at === 'stone' && !s.busy && s.win && s.win.text && !s.clash, `${tag} home: a facet gives its piece, clear of the poem, and the stone stays`, JSON.stringify({ last, s }))
        await shot(`home-yield-${vp.id}.png`); await cdp.eval('HOME.dry = false') } }

    // 38 c: the date facet, and the flight into the years
    { const s = await cdp.eval('HOME.state'), w = await cdp.eval('HOME.world'), rec = XJ.photos.find(p => p.src === w.photo), d = taken(path.join(ROOT, w.photo)), want = MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4)
      const P = s.cells[s.year] || [], b = s.yearBox, corners = [[b[0], b[1]], [b[0] + b[2], b[1]], [b[0], b[1] + b[3]], [b[0] + b[2], b[1] + b[3]]]
      const hit = [['poem', s.poem], ['name', s.mat], ['caption', s.cap], ['tab', s.vs], ['six names', s.names]].filter(([, r]) => r[2] > 0 && meet(b, r)).map(([k]) => k)
      check(s.year >= 0 && s.year !== s.tools && s.yearOn && s.yearText === want && corners.every(c => inPoly(c, P)) && !hit.length && s.yearPlan.basis.taken === d,
        `${tag}: the photograph's own facet holds its EXIF month and year (${want}), inside the facet, clear of the poem, the name, the caption, the tab and the six names, not the tools' facet`, JSON.stringify({ year: s.year, tools: s.tools, text: s.yearText, hit, corners: corners.map(c => inPoly(c, P)) }))
      if (vp.id !== 'side') {
        const key0 = w.key, pt = await reach('#year a'); if (pt) await tap(pt)
        const ab = await waitFor(() => cdp.eval(`HOME.about && HOME.about.at === 'about' && HOME.about.lift && !HOME.busy && HOME.about`), 'the years', 200).catch(() => null)
        await sleep(300); await shot(`years-${vp.id}.png`)
        const inRow = ab && await cdp.eval(`(() => { const f = document.getElementById('about'), d = f.contentDocument, l = d.querySelector('.home-lift'), r = l && l.getBoundingClientRect(); return !!l && l.closest('.yr').dataset.y === ${JSON.stringify(rec.row)} && r.top < innerHeight && r.bottom > 0 && l.querySelector('img').getAttribute('src') === ${JSON.stringify(w.photo)} })()`)
        check(!!pt && !!ab && ab.src === YEARS && ab.row === rec.row && inRow, `${tag}: tapping the date flies the photograph into its year (${rec.row}) in the About's years, in view`, JSON.stringify({ pt, ab }))
        await cdp.eval('history.back()'); const back = await waitFor(() => cdp.eval(`HOME.at === 'stone' && document.getElementById('ph').hidden && HOME.world.key`), 'home again', 100).catch(() => null)
        check(back === key0, `${tag}: the browser's back brings it home to the same stone`, String(back)) } }

    // 40: the tools under the facet nearest the where line, here and in a world behind a door
    const home = await cdp.eval('HOME.doors.map(d => d.to)')
    for (const wk of [null, home[0]]) {
      const label = `${tag} ${wk ? 'world ' + wk : 'home'}`
      if (wk) await open('?w=' + encodeURIComponent(wk))
      const s = await cdp.eval('HOME.state'), P = s.cells[s.tools] || []
      /* the one facet, and the names on it */
      check(s.tools >= 0 && s.namesOn && s.kinds.filter(k => k === 'tools').length === 1, `${label}: one facet holds the six names`, `facet ${s.tools}, on ${s.namesOn}`)
      if (s.tools < 0) continue
      const box = s.plan.box, nm = s.namesAll // every name to its last letter, not only the row they wrap in
      check(Math.abs(nm[0] - box[0]) < 1.5 && Math.abs(nm[1] - box[1]) < 1.5 && Math.abs(nm[2] - box[2]) < 1.5 && Math.abs(nm[3] - box[3]) < 1.5, `${label}: the names are where the plan put them, at the size it measured`, `${r1(nm)} vs ${r1(box)}`)
      check(wholly(nm, P), `${label}: the names sit wholly inside their facet, a seam's width in at every corner and edge`, `${r1(nm)} in facet ${s.tools}`)
      const hit = [['poem', s.poem], ['name', s.mat], ['caption', s.cap], ['switch', s.vs], ['where line', s.where]].filter(([, r]) => r[2] > 0 && meet(nm, r)).map(([k]) => k)
      check(!hit.length && nm[0] >= 0 && nm[1] >= 0 && nm[0] + nm[2] <= s.W && nm[1] + nm[3] <= s.H, `${label}: the names keep clear of the poem, the name, the caption, the switch and the where line`, hit.join(', '))
      /* the basis, recounted */
      const fits = s.fits.filter(f => f.box), lies = fits.filter(f => meet(f.box, s.poem) || meet(f.box, s.mat) || !inPoly(centre(f.box), s.cells[f.i]))
      const d = fits.map(f => ({ i: f.i, d: gap(f.box, s.where) })).sort((a, b) => a.d - b.d), mine = gap(box, s.where)
      check(!lies.length && d.length && fits.some(f => f.i === s.tools) && mine <= d[0].d + .5 && Math.abs(mine - s.plan.basis.d) < .6,
        `${label}: basis recounted: of ${fits.length} facets that could hold them, facet ${s.tools} is nearest the where line (${mine.toFixed(1)}px${d.find(x => x.i !== s.tools) ? ', next ' + d.find(x => x.i !== s.tools).d.toFixed(1) + 'px' : ''})`,
        `nearest ${d[0]?.i} at ${d[0]?.d.toFixed(1)}, recorded ${s.plan.basis.d}, false fits ${lies.map(f => f.i)}`)
      check(mine <= BY, `${label}: the names read as the where line's own: within ${BY}px of it`, `${mine.toFixed(1)}px`)
      await shot(`tools-${vp.id}-${wk ? 'world' : 'home'}.png`)
      /* every idea and every tool, reached */
      let missed = [], wrong = [], extra = new Set(), clash = []
      for (const [k, I] of IDEAS.entries()) {
        const pt = await reach(`#names button[data-k="${k}"]`); if (!pt) { missed.push(I.name); continue }
        await tap(pt)
        const st = await waitFor(() => cdp.eval(`HOME.open === ${k} && document.querySelector('#tools').classList.contains('on') && (() => { const r = document.querySelector('#tools').getBoundingClientRect(); return { box: [r.left, r.top, r.width, r.height], h2: document.querySelector('#tools h2').textContent, href: document.querySelector('#tools h2 a')?.getAttribute('href') ?? null } })()`), 'idea ' + I.name, 30, 50).catch(() => null)
        if (!st) { missed.push(I.name); continue }
        await sleep(350)
        if (st.h2 !== I.name || st.href !== (I.href || null)) wrong.push(`${I.name}: heading ${st.h2} ${st.href}`)
        const tb = st.box; for (const [n, r] of [['poem', s.poem], ['name', s.mat], ['switch', s.vs]]) if (meet(tb, r)) clash.push(`${I.name} over the ${n}`)
        if (tb[0] < 0 || tb[1] < 0 || tb[0] + tb[2] > s.W + .5 || tb[1] + tb[3] > s.H + .5) clash.push(`${I.name} off the screen`)
        for (const [j, part] of I.parts.entries()) {
          const bp = await reach(`#tools li:nth-child(${j + 1}) button`); if (!bp) { missed.push(`${I.name} / ${part}`); continue }
          const name = await cdp.eval(`document.querySelector('#tools li:nth-child(${j + 1}) button').textContent`); if (name !== part) wrong.push(`${part} named ${name}`)
          await tap(bp)
          const said = await cdp.eval(`(() => { const p = document.querySelector('#tools li:nth-child(${j + 1}) p'); return !p.hidden && p.getClientRects().length ? p.textContent : null })()`)
          if (said !== I.detail.tools[j]) wrong.push(`${I.name} / ${part}: ${said === null ? 'did not open' : 'says ' + said.slice(0, 40)}`)
          if (k === 0 && j === 0 && !wk) await shot(`tools-${vp.id}-open.png`) }
        for (const t of await shown()) if (!WORDS.has(t)) extra.add(t)
        const whole = await cdp.eval(`document.querySelector('#tools').innerText`); if (!whole.includes(I.detail.intro) || !whole.includes(I.detail.boundary)) wrong.push(`${I.name}: intro or boundary missing`)
        // a touch elsewhere closes it, and goes nowhere
        const at0 = await cdp.eval('HOME.at + "|" + HOME.world.key')
        const away = [Math.round(s.W / 2), Math.round(s.H * .04)].map((v, i) => i ? Math.max(v, 4) : v)
        const free = await cdp.eval(`(() => { const r = document.querySelector('#tools').getBoundingClientRect(), pts = [[${away}], [innerWidth - 8, innerHeight / 2], [8, innerHeight / 2], [innerWidth / 2, innerHeight - 6]]
          return pts.find(([x, y]) => (x < r.left || x > r.right || y < r.top || y > r.bottom) && !document.elementFromPoint(x, y).closest('a, button, .verse')) || null })()`)
        if (free) { await tap(free); await sleep(250)
          const after = await cdp.eval('({ open: HOME.open, at: HOME.at + "|" + HOME.world.key, busy: HOME.busy })')
          if (after.open !== -1 || after.at !== at0 || after.busy) wrong.push(`${I.name}: a touch elsewhere ${after.open !== -1 ? 'left it open' : 'moved the stone to ' + after.at}`) }
        else { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150) } }
      check(!missed.length, `${label}: all 6 ideas and all ${IDEAS.reduce((n, I) => n + I.parts.length, 0)} tools reached, each the topmost thing where it sits`, missed.join(', '))
      check(!wrong.length, `${label}: each opens in its own words (name, page, intro, every tool's sentence, boundary); a touch elsewhere only closes it`, wrong.slice(0, 3).join(' | '))
      check(!extra.size, `${label}: nothing shows that is not IDEAS verbatim`, [...extra].slice(0, 3).join(' | '))
      check(!clash.length, `${label}: an open idea keeps clear of the poem, the name and the switch, on the screen`, clash.slice(0, 3).join(', '))
      const txt = await cdp.eval('document.body.innerText + " " + [...document.querySelectorAll("#names button")].map(b => b.title).join(" ")')
      check(!BANNED.test(txt), `${label}: the system's working name never shows`)
    }

    // 34 b, opened from the line (36 c): every number recounted, every label re-run
    { await open(''); await settled(); const L = `${tag} 34 b`
      await openWhy(); await sleep(D('why-ms') + 200)
      const s = await panel()
      const truth = truthFor(s.model.iso, READING, DAYS); truth.N.skyFields = (s.model.fields || []).length
      P36.setDay(truth.photos[0], truth.poems[0])
      const body = bodyTruth(s.model.iso, READING, DAYS, s.stoneDoors, true)
      check(s.stone.photo === truth.photos[0] && s.stone.slug === truth.poems[0] && s.model.agrees && s.home, `${L}: the chain is about the stone on screen, pick.js's two`, JSON.stringify(s.stone))
      honest(L, s, truth, body, true)
      check(s.sigs.length >= 7 && s.sigs.every(g => { const t = truth.sig[g.k]; return t && t.moved && t.photo === g.photo && t.poem === g.poem }), `${L}: ${s.sigs.length} signals, each taken away in turn, and without it the two are pickBest's`)
      check(s.doors.length > 0 && s.doors.join('|') === s.stoneDoors.map(d => d.phrase).join('|'), `${L}: the door lines it lists are the doors on the stone`)
      const echoed = await cdp.eval('HOME.JN.echoed'), ks = new Set(echoed.map(e => e.k)), bad = echoed.filter(e => !echoOk(e))
      check(ks.size >= 6 && !bad.length, `${L}: 36 c: opening, the sentence turns back into its readings and ${ks.size} of 7 light where the chain reads that value`, JSON.stringify(bad.length ? bad : echoed.map(e => e.reading + '→' + e.text)))
      const [x0, y0, x1, y1] = s.box, R = await rects()
      check(x0 >= 0 && y0 >= 0 && x1 <= vp.w + .5 && y1 <= vp.h + .5 && clear(R.why, R.where) && s.wide.length === 0, `${L}: the chain is on screen, clear of the line, nothing wider than it`, JSON.stringify({ box: s.box, R, wide: s.wide }))
      await shot(`chain-${vp.id}.png`)
      const before = s.stone.key, pt = await scrimPt(vp)
      if (pt) await tapAt(...pt); await sleep(FADE + 500)
      const after = await cdp.eval(`({ open: HOME.whyOpen, at: HOME.at, key: HOME.world.key, busy: HOME.busy, line: HOME.line })`)
      check(!!pt && !after.open && after.at === 'stone' && after.key === before && !after.busy && after.line.sop > .98 && after.line.ops.every(o => o < .02), `${L}: closing returns to the same stone and the sentence`, JSON.stringify({ ...after, line: null, pt })) }

    // 39: crossings
    { await open('?w=' + encodeURIComponent(home[0])); await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200)
      await masses(`${tag} a world`)
      { await park(); await cdp.eval('HOME.still = true'); await sleep(500); const r = await cdp.eval('HOME.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .02))
        check(r.length >= 4 && !bad.length, `${tag}: at rest all ${r.length} sampled facets read as this photograph`, bad.slice(0, 4).map(x => `#${x.i} ${x.own} vs ${x.other}`).join(' | ')); await cdp.eval('HOME.still = false') }
      await probeHold(`${tag} a world`)
      await crossOnce(`${tag} door line`, 'door', `cross-${vp.id}-door`)
      if (vp.id === 'desk') await crossOnce(`${tag} facet`, 'facet', `cross-${vp.id}-facet`)
      await drawnHold(`${tag} after crossing`) }

    // the rendered page: no system name, no instruction, nothing counts down
    { const t = await cdp.eval(`document.body.innerText + ' ' + [...document.querySelectorAll('#names button')].map(b => b.title).join(' ')`)
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!BANNED.test(t) && !/\b(click|tap|hover|scroll|swipe|press|touch) (here|to|on)\b/i.test(t) && !tm, `${tag}: the system's working name never shows, no instruction, nothing counts down`) }
    check(!errors.length, `${tag}: no console errors`, errors.slice(0, 3).join(' | '))
  }

  // reduced motion: the poem is there at once, a facet still answers, a crossing is a crossfade where no facet moves
  if (VIEWPORTS.some(v => v.id === 'desk')) { await view(VIEWPORTS.find(v => v.id === 'desk')); await reduceMotion(true); errors.length = 0
    await open(''); const key = (await cdp.eval('HOME.doors'))[0].to; await open('?w=' + encodeURIComponent(key)); await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200)
    check(await cdp.eval('HOME.lines.every(l => l.shown)'), 'reduced motion: the poem is there at once')
    await crossOnce('reduced motion door line', 'door', 'cross-calm')
    check(!errors.length, 'reduced motion: no console errors', errors.slice(0, 3).join(' | '))
    await reduceMotion(false) }
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) }

{ const gone = [...P37.reached].filter(x => !live.has(x)); check(P37.reached.size > 0 && !gone.length, `every poem a segment shows or a facet reaches (${P37.reached.size}) is live`, gone.join(', ')) }
const w8 = weight ? `; first screen on a phone ${Math.round(weight.rest / 1024)} KB gzipped + the photograph ${Math.round(weight.pic / 1024)} KB` : ''
console.log(failures ? `FAIL the home: ${failures} of ${oks + failures} checks failed` : `PASS the home: ${oks} checks in ${loads} loads at ${VIEWPORTS.map(v => v.w + 'x' + v.h).join(', ')}: every facet yields (${drawnN} drawn), ${probes} worst-case words placed clear, ${crossings} crossings walked frame by frame onto the next masses cut, the line and the chain recounted, the tools and the years reached${w8} (${Math.round((Date.now() - t0) / 1000)}s)`)
cleanup(); process.exit(failures ? 1 : 0)
