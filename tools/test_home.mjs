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
//     every drawn facet yields (six the ideas, one the date, one the title, the rest a door chosen by a piece of his work, the piece verbatim
//       in its source, its basis recounted at the region it sits on);
//     the doors (12 Nov): every facet that is not an idea, the title or the date, tapped once from rest, crosses to exactly its plan's pair,
//       and nothing of its piece is on the page, before or through the crossing; the rest state is d25ea66's, pixel for pixel;
//     41 b, 42 a: each of the six ideas behind the facet its meaning puts it on, nothing named at rest, only its hue (154 worlds x five screens,
//       fresh and crossed, recounted); a tap opens this world first and largest, every sentence recounted here word for word for 158 worlds and
//       under every state a visitor can reach (daytime, no sky, the archive's day, where he is unknown, a source that failed, another time
//       zone), the general read live from IDEAS (a mark only the served home.js carries), the basis line, whole lines, on screen, clear of the
//       mat and the switch, AA against the real pixels; the six hidden keys: Tab, a ring on the facet, Enter or Space, Escape;
//     38 c: the date is the photograph's own, in a facet where it reads clear, and flies the photograph into its year in the About;
//     39: a crossing through a door line (and, at 1440, a facet's one tap) walked frame by frame lands on the next photograph's masses cut
//       as 33 counts it; reduced motion crossfades and no facet moves;
//     the title (9 Nov): its own facet, drawn as one piece, the title underlined where main lays it; a tap on the title or on its facet opens
//       the whole poem (poem_open, via title | facet); no seam eats a letter of it (nor of the poem): the seams drawn in a colour no photograph
//       has, none shows inside a letter;
//     the home reads (9 Nov): every text at rest, with each idea open and with the chain open, against the canvas
//       pixels behind it (the stone without the poem's words, any ground and panel included): WCAG AA for 98% of them, 11px and up (the chain's
//       sizes are its own: reported);
//     no system name, no instruction, nothing counts down, no console error.
// Run: node tools/test_home.mjs [--shots DIR]   (ONLY_VP=desk,phone,side · PAIRS=26 · STATIC=0 · CARDS=only (43 c's card alone) to narrow). Non-zero exit on any failure.
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
/* 43 c's pixels: Chrome's screenshots decoded here (8-bit RGB or RGBA, not interlaced), contrast by WCAG, and two shots compared */
function png(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = []
  while (p < buf.length) { const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9] } else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break; p += 12 + len }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4); let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0
      line[x] = (line[x] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (() => { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c })() : 0)) & 255 }
    for (let x = 0; x < w; x++) for (let j = 0; j < 3; j++) out[(y * w + x) * 4 + j] = line[x * bpp + j]
    prev = line }
  return { w, h, d: out } }
const pLin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, pLum = c => .2126 * pLin(c[0]) + .7152 * pLin(c[1]) + .0722 * pLin(c[2])
const pRatio = (a, b) => { const x = pLum(a), y = pLum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
function pixDiff(A, B, vpw, box) { const s = A.w / vpw, [x0, y0, x1, y1] = box ? [Math.max(0, Math.floor(box[0] * s)), Math.max(0, Math.floor(box[1] * s)), Math.min(A.w, Math.ceil((box[0] + box[2]) * s)), Math.min(A.h, Math.ceil((box[1] + box[3]) * s))] : [0, 0, A.w, A.h]
  let n = 0, max = 0, first = null
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * A.w + x) * 4, m = Math.max(Math.abs(A.d[k] - B.d[k]), Math.abs(A.d[k + 1] - B.d[k + 1]), Math.abs(A.d[k + 2] - B.d[k + 2])); if (m > 2) { n++; if (!first) first = [x / s | 0, y / s | 0] } if (m > max) max = m }
  return { n, max, first } }
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
{ const head = trackJs.slice(0, trackJs.indexOf('*/')), names = ['tools_open', 'year_open', 'line_open', 'crossing', 'poem_open']
  const listed = names.filter(n => new RegExp('\\*\\s+' + n + '\\s').test(head)), set = Object.keys(vm.runInNewContext('(' + /var HOME_EVENTS = (\{[^}]*\})/.exec(trackJs)[1] + ')'))
  const sent = [...new Set([...stoneJs.matchAll(/\btrack\('([a-z_]+)'/g)].map(m => m[1]))]
  check(listed.length === names.length && JSON.stringify(set.sort()) === JSON.stringify([...names].sort()) && JSON.stringify(sent.sort()) === JSON.stringify([...names].sort()),
    `track.js lists the stone's ${names.length} events at its top and passes on only those; the stone sends exactly them`, JSON.stringify({ listed, set, sent }))
  const via = [...new Set([...stoneJs.matchAll(/track\('tools_open', \{[^}]*via: '([a-z]+)'/g)].map(m => m[1]))].sort(), doc = (/\*\s+tools_open\s.*via: ([a-z |]+) \}/.exec(head) || [])[1]
  check(!!doc && JSON.stringify(doc.split('|').map(x => x.trim()).sort()) === JSON.stringify(via), `track.js documents tools_open's via as the stone sends it: ${via.join(' | ')}`, JSON.stringify({ doc, via }))
  const pvia = [...new Set([...stoneJs.matchAll(/track\('poem_open', \{[^}]*via: '([a-z]+)'/g)].map(m => m[1]))].sort(), pdoc = (/\*\s+poem_open\s.*via: ([a-z |]+) \}/.exec(head) || [])[1]
  check(!!pdoc && JSON.stringify(pdoc.split('|').map(x => x.trim()).sort()) === JSON.stringify(pvia) && pvia.join() === 'facet,title', `track.js documents poem_open's via as the stone sends it: ${pvia.join(' | ')}`, JSON.stringify({ pdoc, pvia })) }
{ // 41 b and 42 a, in the files: the names that stood by the line are gone; every idea has its reason; IDEAS is read, never copied; here.js is not first-screen weight
  const hereJs = read('v3/here.js'), table = /const MEANING = \[([\s\S]*?)\]\]\n/.exec(stoneJs)?.[1] || '', named = [...table.matchAll(/^\s*\['([^']+)'/gm)].map(m => m[1])
  const W24 = HOME_IDEAS.flatMap(I => [I.name, ...I.parts, I.detail.intro, ...I.detail.tools, I.detail.boundary]).filter(t => t.length > 24), copied = W24.filter(t => [page, stoneJs, stoneCss, hereJs, JSON.stringify(DEF)].some(f => f.includes(t)))
  check(!/id="names"|#names|namesEl|showNames|namesBoxes/.test(page + stoneJs + stoneCss) && named.length === 6 && HOME_IDEAS.every(I => named.includes(I.name)) && !/\$\{px\(|' px'|" px"/.test(stoneJs) && !copied.length,
    'the six names by the where line are gone from the page, its script and its styles; 41 b gives every idea in IDEAS its reason and no other; no basis carries a pixel count; IDEAS is read live, none of its words copied', [named.join(','), ...copied.map(t => t.slice(0, 40))].join(' | '))
  check(!/here\.js/.test(page) && /script\('\/v3\/here\.js'\)/.test(stoneJs) && /setTimeout\(\(\) => hereReady\(\), num\('why-idle-ms'/.test(stoneJs), 'here.js and what it reads are not on the first screen: the stone asks for them once it is up (why-idle-ms), or on the first tap') }
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
    if (!p.to.poem || !live.has(p.to.poem)) say(`#${i}: leads to no live poem (${p.to.poem}): a dead door`) // 12 Nov: the move is all a facet does
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

/* ---------- 42 a, in node: what each idea's facet says of this world, written again here in this check's own words from the committed files and
   the pinned moment (clock, sky, which of the page's sources reached it), to be compared with the page word for word ---------- */
const P42 = (() => {
  const { PS, QS, PICK_SRC } = P36, PLACE0 = J('v2/place.json'), PY0 = J('v3/poem-years.json'), DAYS0 = J('v2/days.json').days, WALL = J('tools/wall-map.json')
  const REL0 = (() => { const c = { window: { location: { pathname: '/' } }, document: { createElement: () => ({}), head: { appendChild() {} }, querySelector: () => null } }
    const R = read('poems/related.js'); vm.runInNewContext(R.slice(0, R.indexOf('\n(function', R.indexOf('const themeLabels'))) + '\n;globalThis.__P = poemData; globalThis.__L = themeLabels', c); return { P: c.__P, L: c.__L } })()
  const PHRASE = (() => { const c = {}; vm.runInNewContext(/function phraseFor[\s\S]*?\n {2}\}/.exec(read('v2/weather.js'))[0] + ';globalThis.f = phraseFor', c); return c.f })()
  const STEP = (() => { const w = {}; vm.runInNewContext(read('v3/why.js'), { window: w, fetch: () => {}, document: {} }); return w.S34.stepOf })()
  const FREEZE = /Each night at (\d{1,2}:\d\d)/.exec(read('tools/daily_pick.py'))[1], ZONE = /timeZone: '([A-Za-z_/]+)'/.exec(read('v3/today.js'))[1]
  const NOV = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICK_SRC), PEN = +/NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(PICK_SRC)[1]
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const ISOD = /^\d{4}-\d\d-\d\d$/
  const homeFns = (() => { const t = read('v2/home.js'), g = (a, b) => t.slice(t.indexOf(a), t.indexOf(b, t.indexOf(a))); return new Function(g('function cyrb53', '/* ----------------------------------------------------------- the poem') + g('function norm', '/* ---------------------------------------------------------- the render') + '; return { photoFor, poemFor }')() })()
  const shift = (iso, d) => new Date(Date.parse(iso + 'T00:00:00Z') + d * 864e5).toISOString().slice(0, 10)
  // pick.js's formula, run here: closeness by its weights, the place lift, the novelty penalty, the date's tiebreak
  function ranks(iso, R, days) { const K = P36.pickJS(R, { days }), T = K.__test, day = T.dayVectorFromCurrent(iso, R, R.lat), real = Object.keys(days).filter(d => ISOD.test(d))
    const rk = (kind, items, kf, sc, win) => { const cut = shift(iso, -win), recent = new Set(real.filter(d => d >= cut && d < iso).map(d => days[d][kind]))
      return items.map((it, i) => { const key = it[kf], e = kind === 'photo' ? (sc.photos[key] || {}) : null, bonus = e ? T.placeBonus(e.place, R.lat, R.lon) : 0
        return { i, key, it, km: e && e.place && e.place.lat != null ? T.haversineKm(R.lat, R.lon, e.place.lat, e.place.lon) : null, v: T.itemVector(sc, key), score: -T.weightedDistance(day, T.itemVector(sc, key)) + bonus + (recent.has(key) ? PEN : 0) + T.tiebreak(iso, key) } })
        .sort((a, b) => b.score - a.score || a.i - b.i).map((x, r) => ({ ...x, rank: r + 1 })) }
    const Z = { light: 0, warmth: 0, wet: 0, stillness: 0, season: 0, inside: 0, mood: 0 }, W8 = Object.fromEntries(Object.keys(Z).map(a => [a, T.weightedDistance({ ...Z, [a]: 1 }, Z) ** 2]))
    return { day, W8, photos: rk('photo', DATA.photos, 'src', PS, +NOV[2]), poems: rk('poem', DATA.poems, 'slug', QS, +NOV[1]) } }
  // today's pair as the page resolves it: the live pick, else the day the archive kept, else the date's hash
  function today(iso, R, days) { if (R) { const k = ranks(iso, R, days); return { photo: k.photos[0].key, poem: k.poems[0].key, how: 'live' } }
    if (days[iso]) return { photo: days[iso].photo, poem: days[iso].poem, how: 'frozen' }
    return { photo: DATA.photos[homeFns.photoFor(iso, DATA.photos.length)].src, poem: DATA.poems[homeFns.poemFor(iso, DATA.poems.length)].slug, how: 'hash' } }
  const clockIn = (ms, tz) => { const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date(ms)).forEach(x => p[x.type] = x.value)
    const h = +p.hour % 24; return `${h % 12 || 12}:${p.minute} ${h < 12 ? 'am' : 'pm'}` }
  const offsetMs = (iso, tz) => { const n = /GMT([+-]\d+)?(?::(\d+))?/.exec(new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).format(new Date(iso + 'T12:00:00Z'))); return n && n[1] ? (Math.sign(+n[1]) || 1) * (Math.abs(+n[1]) * 60 + +(n[2] || 0)) * 6e4 : 0 }
  /* one world, one moment. m: { src, slug, mode, iso, R (the sky's reading, or null), readAt, gone (a Set of the paths that did not load), place (place.json as served, or null) } */
  function expected(m) {
    const gone = m.gone || new Set(), days = m.days || DAYS0, iso = m.iso, now0 = iso.slice(0, 4), R = m.R
    const PY = gone.has('/v3/poem-years.json') ? null : PY0, REL = gone.has('/poems/related.js') ? null : (m.rel || REL0), place = gone.has('/v2/place.json') ? null : (m.place === undefined ? PLACE0 : m.place)
    const dayOf = d => `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]}${d.slice(0, 4) === now0 ? '' : ' ' + d.slice(0, 4)}`
    const listOf = L => L.length === 1 ? dayOf(L[0]) : L.length === 2 ? `${dayOf(L[0])} and ${dayOf(L[1])}` : `${L.length} days, last ${dayOf(L.at(-1))}`
    const photo = DATA.photos.find(p => p.src === m.src), poem = DATA.poems.find(p => p.slug === m.slug), rec = XJ.photos.find(p => p.src === m.src)
    const placeP = rec ? rec.place : photo.caption.split(' — ')[0], camera = photo.caption.split(' — ')[1] || null, mon = rec ? MONTHS[+rec.taken.slice(5, 7) - 1] : null, yr = rec ? +rec.taken.slice(0, 4) : null
    const T = `“${poem.title}”`, night = !!R && R.is_day === 0, Now = night ? 'Tonight' : 'Today', now = night ? 'tonight' : 'today'
    const py = PY && PY.poems[m.slug], undated = PY && PY.undated[m.slug] ? Object.keys(PY.undated).length : 0
    const city = R ? R.place : place ? place.place : undefined, phrase = R ? PHRASE(R.weather_code, R.is_day !== 0) : null
    const tp = today(iso, R, days), how = tp.how, K = R ? ranks(iso, R, days) : null, Pk = K && K.photos.find(x => x.key === m.src), Qk = K && K.poems.find(x => x.key === m.slug)
    const real = Object.keys(days).filter(d => ISOD.test(d)).sort(), written = place && place.updated ? dayOf(place.updated) : null
    const out = {}
    // Context
    const kept = py ? `The earliest copy he kept of ${T} is from ${py.year}` : undated ? `No copy of ${T} can yet be dated` : ''
    const made = [mon && `in ${mon} ${yr}`, camera && `on a ${camera}`].filter(Boolean).join(' '), is = `his photograph is from ${placeP}${made ? ', made ' + made : ''}`
    out['Context'] = [kept ? `${kept}; t${is}.` : `T${is}.`]
    const km = Pk && Pk.km != null ? `, ${Math.round(Pk.km).toLocaleString('en-US')} km away` : ''
    if (R && city) out['Context'].push(`${Now} he is in ${city}${km}${phrase ? `, where ${phrase} at ${Math.round(R.temperature_2m)} °C` : `, at ${Math.round(R.temperature_2m)} °C`}.`)
    else if (city) out['Context'].push(`He is in ${city}; the sky there could not be read.`)
    else if (city === null) out['Context'].push('Where he is goes unsaid: it is not known with enough confidence.')
    // Topically suggesting
    const pickRec = XJ.photos.find(p => p.src === tp.photo), pickTitle = DATA.poems.find(p => p.slug === tp.poem).title, mine = m.mode === 'home', tail = mine ? '' : `: ${pickRec.place} with “${pickTitle}”`
    const ts = out['Topically suggesting'] = []
    if (how === 'live') { const near = key => { const v = (key.startsWith('/') ? Pk : Qk).v; return ['light', 'warmth', 'wet', 'stillness', 'season', 'inside'].reduce((b, a) => K.W8[a] * (K.day[a] - v[a]) ** 2 < K.W8[b] * (K.day[b] - v[b]) ** 2 ? a : b, 'light') }
      const noun = a => ({ light: 'light', warmth: 'warmth', wet: K.day.wet >= .5 ? 'wet' : 'dryness', stillness: 'stillness', season: 'the time of year', inside: K.day.inside >= .5 ? 'being out of doors' : 'shelter' })[a]
      const [l, wa, we, st] = ['light', 'warmth', 'wet', 'stillness'].map(a => STEP(a, K.day[a]))
      ts.push(`${Now}’s sky reads ${l}, ${wa}, ${we} and ${st}; ${T} answers it most in ${noun(near(m.slug))}, this photograph in ${noun(near(m.src))}.`)
      const sp = tp.photo === m.src, sq = tp.poem === m.slug
      ts.push(mine ? `Of ${DATA.poems.length} poems it came first ${now}.` : `Of ${DATA.poems.length} poems it stands ${Qk.rank}${Qk.rank % 100 >= 11 && Qk.rank % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[Qk.rank % 10] || 'th'} ${now}${sp && sq ? '' : `; the home itself pairs ${sp ? 'this photograph' : pickRec.place} with ${sq ? 'this poem' : `“${pickTitle}”`}`}.`) }
    else if (how === 'frozen') ts.push(`Today’s pair is the one the archive kept for ${dayOf(iso)}, chosen from that day’s whole sky${tail}.`)
    else ts.push(`No reading of the sky reached this page, so today’s pair falls to the date itself${tail}.`)
    if (REL && REL.P[m.slug]) { const th = REL.P[m.slug].themes, labels = th.map(t => REL.L[t] || t), kin = Object.entries(REL.P).filter(([s, e]) => s !== m.slug && e.themes.some(t => th.includes(t))).length
      if (kin) ts.push(`Its page offers three of the ${kin} other poems that also hold ${labels.length === 1 ? labels[0] : labels.slice(0, -1).join(', ') + ' or ' + labels.at(-1)}.`) }
    // Keeping track
    const sameMonth = rec ? XJ.photos.filter(p => p.taken.slice(0, 7) === rec.taken.slice(0, 7)).length : 0
    const ph = !rec ? 'undated' : sameMonth > 1 ? `one of ${sameMonth} he made in ${mon} ${yr}` : `the only one he made in ${mon} ${yr}`, row = rec && String(rec.row) !== String(yr) ? `, kept in the About under ${rec.row}` : ''
    const poemIs = py ? `${T} is one of the ${Object.values(PY.poems).filter(e => e.year === py.year).length} poems he kept from ${py.year}` : undated ? `${T} is one of the ${undated} poems no copy yet dates` : ''
    out['Keeping track'] = [poemIs ? `${poemIs}, this photograph ${ph}${row}.` : `This photograph is ${ph}${row}.`]
    const ps = real.filter(d => days[d].photo === m.src), qs = real.filter(d => days[d].poem === m.slug)
    const shown = ps.length && qs.length ? `this photograph stood on the home on ${listOf(ps)}, ${T} on ${listOf(qs)}` : ps.length ? `this photograph stood on the home on ${listOf(ps)}` : qs.length ? `${T} stood on the home on ${listOf(qs)}` : 'neither has yet stood on the home'
    if (real.length) out['Keeping track'].push(`The archive holds ${real.length} day${real.length === 1 ? '' : 's'} since ${dayOf(real[0])}; ${shown}.`)
    // Staying up to date
    const up = out['Staying up to date'] = []
    if (R && city) up.push(`The sky was read ${m.readAt ? 'at ' + clockIn(m.readAt, R.tz) : 'as this page opened'}${written ? `, and where he is was last set on ${written}` : ''}.`)
    else if (written) up.push(`Where he is was last set on ${written}${city ? '; the sky could not be read' : city === null ? ', with no city this page may name' : ''}.`)
    else if (city) up.push(`The sky over ${city} could not be read.`)
    const fz = !gone.has('/v2/pick.js') && !gone.has('/v3/today.js') && R ? clockIn(Date.parse(`${iso}T${FREEZE.padStart(5, '0')}:00Z`) - offsetMs(iso, ZONE), R.tz) : null
    up.push(how === 'live' ? (days[iso] ? 'Today’s pair follows the sky; the archive already holds this day, and once it has passed it replays exactly as kept.' : `Today’s pair follows the sky until ${fz ? fz + ', when ' : ''}the archive freezes it; after that the day replays exactly as kept.`)
      : how === 'frozen' ? 'Today’s pair is already frozen in the archive and replays exactly as kept.' : 'With no reading, today’s pair falls to the date, the same on every visit.')
    // Self-healing
    const two = !gone.has('/v2/flow.js') && WALL.parts['This page'].filter(r => /publish/.test(r)).length === 2, last = real.length ? dayOf(real.at(-1)) : null
    out['Self-healing'] = two ? ['Two jobs keep this page right, one noting where he is and one keeping each day’s pair, and both are watched for going quiet.',
      written && last ? `The first last checked in on ${written}, the second on ${last}.` : written ? `The first last checked in on ${written}.` : last ? `The second last checked in on ${last}.` : ''].filter(Boolean)
      : [[written && `Where he is was last set on ${written}`, last && `${written ? 'the' : 'The'} archive last kept ${last}`].filter(Boolean).join('; ')].filter(Boolean).map(s => s + '.')
    // Home
    const Hm = HOME_IDEAS.find(I => I.name === 'Home'), at = Hm.parts.indexOf('This page'), dec = place && place.lat != null ? Math.max(...[place.lat, place.lon].map(v => (String(v).split('.')[1] || '').length)) : null
    out['Home'] = [`This page is the ${at === Hm.parts.length - 1 ? 'last' : ['first', 'second', 'third', 'fourth', 'fifth'][at]} of the ${['none', 'one', 'two', 'three', 'four', 'five', 'six'][Hm.parts.length]} surfaces Home looks after; ${now} it carries a photograph from ${placeP}${/,/.test(placeP) ? ',' : ''} and ${T}.`]
    const KMW = { 1: 'about ten kilometres', 2: 'about a kilometre', 3: 'about a hundred metres' }
    if (city && KMW[dec]) out['Home'].push(`His city shows under his name only when it is known with confidence, and never more closely than ${KMW[dec]}.`)
    else if (city === null) out['Home'].push(`Where he is goes unsaid ${now}: it is not known with confidence.`)
    return out }
  const NAMES = HOME_IDEAS.map(I => I.name)
  const differ = (got, want) => NAMES.flatMap(n => { const g = (got && got[n] || []).map(x => x.s).join(' '), w = (want[n] || []).join(' '); return g === w ? [] : [`${n}: page “${g}” vs recount “${w}”`] })
  // the words a sentence may hold in capitals: the data's own names, and a sentence's first word
  const KNOWN = [...XJ.photos.map(p => p.place), ...DATA.poems.map(p => p.title), ...DATA.photos.map(p => p.caption.split(' — ')[1]).filter(Boolean), ...MONTHS, ...NAMES, ...HOME_IDEAS.flatMap(I => I.parts), PLACE0.place, 'About'].filter(Boolean).sort((a, b) => b.length - a.length)
  const unaccounted = s => { let t = s; for (const k of KNOWN) t = t.split(k).join(' '); return [...t.matchAll(/(?<![.;:]\s|^)\b([A-Z][a-z’']+)/g)].map(x => x[1]) }
  const PRIVATE = /raw\W?(db|store)|day[\s-]?flow|e-?mail|voice note|whatsapp|message|granola|hermes|kmini|\bthe mini\b|sync\/|pending-work|\.txt\b|~\//i
  const BROKEN = /\bnull\b|\bundefined\b|\bNaN\b|“\s*”|‘\s*’|  |,,|, ,|\s[,.;:]|\.\.|^\s|\s$|\[object|Infinity/ // a sentence that is not whole
  return { expected, today, ranks, differ, unaccounted, PRIVATE, BROKEN, NAMES, DAYS0, PY0, REL0, PLACE0, clockIn }
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
/* what the server says, beyond the files: IDEAS' intros and boundaries carry an invisible mark (U+200B), so a general part the panel
   copied rather than read shows unmarked (42's trick); GONE holds paths that fail (a source that did not load); OVER replaces a file's bytes
   for one state; MUTATE (never committed, to watch a check go red) changes only the served bytes:
     fact    = a this-world sentence takes another world's photograph record     copy  = Context's general intro written in, not read
     shown   = an idea's name visible at rest                                    keys  = the six hidden buttons gone
     null    = the guard on a fact that may not load taken away (last set on)     names = the old names code path back (a #names row)
     ground  = the caption's ground never laid                                    moved = the title moved 20px along its row
     event   = a tap on the title sent under another name                         piece = the title's facet not drawn as its own piece
     seam    = the poem's words drawn inside each facet again, as before 9 Nov, where the seams cut them
   43 c's card (11 Nov), each against one group of cardHold's checks:
     cread   = the card's ground lets the stone through (alpha .35)     csmall = body text at 13px          creach = the card cannot scroll
     cline   = the room not ended on a whole line (no snap)             cmore  = the foot never points       cclose = Escape ignored
     cfocus  = the focus not given back                                  crest  = the stone left 3px off      cevent = tools_open without its via
     cone    = two cards at once                                         cturn  = it grows but never turns    creduce = it turns under reduced motion
     cdesk   = the card on a desktop too
   the doors (12 Nov), each against its own check in doorsHold or restSame:
     dwait   = a door facet's first tap only answers (it no longer crosses)          dwrong = it crosses to another facet's pair
     dpiece  = the tap crosses but writes its piece onto the page as it goes          drest  = the rest state changed (the title's tone .3 -> .36; run with REST_REF=d25ea66)
     dhold   = a tap at home told from a hold by when its handler ran, not by its events' times (a world being made held the page up: the
               press came back instead of crossing, as it did before 12 Nov's fix)
   44 a with d (13 Nov), each against its own check in cueHold or deskNoCard:
     qnone   = the point never a facet              qfaint = the facet in the ground's own colour      qsmall = its button 26px
     qlabel  = its button unnamed                   qwords = a word in its button                      qpage  = a press lands 9px into a line
     qkey    = no way in by keyboard (no Tab stop, no Page Down)                                       qend   = the cue left at the end
     qfits   = a cue when everything fits           qlift  = the words never lift                      qback  = the lift ends where it peaked
     qtwice  = a re-snap lifts them again           qreduce = they lift under reduced motion           qdesk  = the card, and its cue, on a desktop */
const MARK = '\u200b', MUT = process.env.MUTATE || '', GONE = new Set(), OVER = new Map(), MUTHIT = new Set()
let REFLOAD = false // serving d25ea66's home (restSame's reference): no mutation reaches it
const served = (u, f) => { let s = OVER.has(u) ? OVER.get(u) : readFileSync(f, 'utf8'); const was = s
  if (u === '/v2/home.js') s = s.replace(/("intro": ")|("boundary": ")/g, m => m + MARK)
  if (REFLOAD) return s
  if (MUT === 'dhold' && u === '/v3/stone.js') s = s.replace("  if (up - p.down < num('press-tap-ms', 260)) {", "  if (performance.now() - p.t0 < num('press-tap-ms', 260)) {")
  if (MUT === 'fact' && u === '/v3/here.js') s = s.replace('const rec = XJ.photos.find(p => p.src === photo.src) || null', 'const rec = XJ.photos[(XJ.photos.findIndex(p => p.src === photo.src) + 1) % XJ.photos.length]')
  if (MUT === 'copy' && u === '/v3/stone.js') s = s.replace("gen.append(mk('p', 'intro', d.intro || ''))", `gen.append(mk('p', 'intro', I.name === 'Context' ? ${JSON.stringify(HOME_IDEAS[0].detail.intro)} : d.intro || ''))`)
  if (MUT === 'shown' && u === '/v3/stone.js') s = s.replace("document.body.dataset.ready = 'yes'", "{ const n = document.createElement('p'); n.style.cssText = 'position:fixed;left:20px;top:140px;z-index:6;font:400 11px/2 sans-serif;color:#fff'; n.textContent = IDEAS[2].name; document.body.append(n) }\ndocument.body.dataset.ready = 'yes'")
  if (MUT === 'keys' && u === '/v3/stone.js') s = s.replace('  keysEl.append(b) })', '  })')
  if (MUT === 'null' && u === '/v3/here.js') s = s.replace("${S.written ? `, and where he is was last set on ${S.written}` : ''}.`", ", and where he is was last set on ${S.written}.`") // the guard on a fact that may not have loaded, gone
  if (MUT === 'names' && u === '/v3/stone.js') s = s.replace("document.body.dataset.ready = 'yes'", "{ const n = document.createElement('div'); n.id = 'names'; n.className = 'on'; n.style.cssText = 'position:fixed;left:16px;bottom:150px;z-index:6;display:flex;gap:12px;font:400 11px/2 sans-serif;color:#f3efe6;text-transform:uppercase'; IDEAS.forEach((I, k) => { const b = document.createElement('button'); b.textContent = I.name; b.dataset.k = k; n.append(b) }); document.body.append(n) }\ndocument.body.dataset.ready = 'yes'")
  if (MUT === 'ground' && u === '/v3/stone.js') s = s.replace('const t = Math.max(0, ...T.parts.map(([rs, inks]) => needOf(rs, inks, d)))', "const t = T.key === 'cap' ? 0 : Math.max(0, ...T.parts.map(([rs, inks]) => needOf(rs, inks, d)))")
  if (MUT === 'moved' && u === '/v3/stone.js') s = s.replace("h.append(a); v.append(h)", "h.append(a); v.append(h); h.style.paddingLeft = '20px'")
  if (MUT === 'event' && u === '/v3/stone.js') s = s.replace("track('poem_open', { poem: w.poem.slug, via: 'title' })", "track('poem_opened', { poem: w.poem.slug, via: 'title' })")
  if (MUT === 'piece' && u === '/v3/stone.js') s = s.replace('function titlePiece(w, i, o, layers) { if (w.titleI !== i || o.plain) return o', 'function titlePiece(w, i, o, layers) { return o')
  if (MUT === 'seam' && u === '/v3/stone.js') s = s.replace('const base = [{ img: w.img }] //', 'const base = [{ img: w.img }, ...textLayer(w, i, w.normals[i], P)] //').replace('drawGrounds(w); if (o.bare) return', 'drawGrounds(w); return')
  if (MUT === 'cread' && u === '/v3/defaults.json') s = s.replace('"card-ground-alpha": "1"', '"card-ground-alpha": "0.35"')
  if (MUT === 'csmall' && u === '/v3/defaults.json') s = s.replace('"card-body-px": "16"', '"card-body-px": "13"')
  if (MUT === 'creach' && u === '/v3/stone.css') s = s.replace('overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y;', 'overflow: hidden; touch-action: pan-y;')
  if (MUT === 'cline' && u === '/v3/stone.js') s = s.replace("  if (fit) cardEl.style.setProperty('--ci-b'", "  if (false) cardEl.style.setProperty('--ci-b'")
  if (MUT === 'cmore' && u === '/v3/stone.js') s = s.replace('more = el.scrollHeight - el.clientHeight - el.scrollTop > 2', 'more = false')
  if (MUT === 'cclose' && u === '/v3/stone.js') s = s.replace("addEventListener('keydown', e => { if (!CARD.open || e.key !== 'Escape') return;", "addEventListener('keydown', e => { if (true) return;")
  if (MUT === 'cfocus' && u === '/v3/stone.js') s = s.replace('if (back && back.isConnected && back !== document.body) back.focus({ preventScroll: true }); else if (cardEl.contains(document.activeElement)) document.activeElement.blur()', 'void back')
  if (MUT === 'crest' && u === '/v3/stone.js') s = s.replace("cardSvg.textContent = ''; cardSlot.style.opacity = ''; for (const e of shifted()) e.style.transform = ''", "cardSvg.textContent = ''; cardSlot.style.opacity = ''; for (const e of shifted()) e.style.transform = 'translate(0px, 3px)'")
  if (MUT === 'cevent' && u === '/v3/stone.js') s = s.replace("track('tools_open', { idea: IDEAS[p.k].name, via: 'facet' })", "track('tools_open', { idea: IDEAS[p.k].name })")
  if (MUT === 'cone' && u === '/v3/stone.js') s = s.replace("function cardRoom() { if (CARD.open) cardClose('another'); cardFinish() }", 'function cardRoom() {}').replace("cardFinish(); if (CARD.open) cardClose('another'); cardFinish()", '')
  if (MUT === 'cturn' && u === '/v3/stone.js') s = s.replace("perspective(${num('card-perspective-px', 900)}px) rotate3d(", "perspective(${num('card-perspective-px', 900)}px) translate3d(")
  if (MUT === 'creduce' && u === '/v3/stone.js') s = s.replace("way: reduce() ? 'fade' : 'c' }", "way: 'c' }")
  if (MUT === 'cdesk' && u === '/v3/stone.js') s = s.replace('const cardMode = () => phone() || low()', 'const cardMode = () => true')
  if (MUT === 'dwait' && u === '/v3/stone.js') s = s.replace("else if (pl && nextStep(cur, ci).t !== 'move') { homeWin = ci;", "else if (pl) { homeWin = ci;").replace("  said(i, 'move', { to: s.to.poem", "  if (s) return said(i, 'wait'); said(i, 'move', { to: s.to.poem")
  if (MUT === 'dwrong' && u === '/v3/stone.js') s = s.replace("const nextStep = (w, i) => { const p = planOf(w)[i]; return p ? p.steps[p.steps.length - 1] : null }", "const nextStep = (w, i) => { const p = planOf(w)[i]; if (!p || !p.to) return p ? p.steps.at(-1) : null; const o = planOf(w).filter(q => q && q.to && q !== p); return o.length ? o[0].steps.at(-1) : p.steps.at(-1) }")
  if (MUT === 'dpiece' && u === '/v3/stone.js') s = s.replace("const nextStep = (w, i) => { const p = planOf(w)[i]; return", "const nextStep = (w, i) => { const p = planOf(w)[i]; if (p && p.to) { const f = p.steps[0], e = document.getElementById('piece') || document.body.appendChild(Object.assign(document.createElement('p'), { id: 'piece' })); e.textContent = f.big || f.lines.join(' ') } return")
  if (MUT === 'drest' && u === '/v3/defaults.json') s = s.replace('"title-tone": "0.3"', '"title-tone": "0.36"')
  if (MUT === 'qnone' && u === '/v3/stone.js') s = s.replace('if (!more) return hideBtn() //', 'if (true) return hideBtn() //')
  if (MUT === 'qfaint' && u === '/v3/stone.js') s = s.replace('function cueInk(k0) {', 'function cueInk(k0) { return (CARD.groundRgb || GROUND).map(v => Math.round(v * 1.3 + 3));')
  if (MUT === 'qsmall' && u === '/v3/stone.css') s = s.replace('#card .card-more { position: absolute; z-index: 3; width: 44px; height: 44px;', '#card .card-more { position: absolute; z-index: 3; width: 26px; height: 26px;')
  if (MUT === 'qlabel' && u === '/v3/stone.js') s = s.replace('<button class="card-more" type="button" aria-label="next lines" hidden>', '<button class="card-more" type="button" hidden>')
  if (MUT === 'qwords' && u === '/v3/stone.js') s = s.replace('aria-label="next lines" hidden></button>', 'aria-label="next lines" hidden>more</button>')
  if (MUT === 'qpage' && u === '/v3/stone.js') s = s.replace('let top = Math.floor(next[0])', 'let top = Math.floor(next[0]) + 9')
  if (MUT === 'qkey' && u === '/v3/stone.js') s = s.replace('<button class="card-more" type="button"', '<button class="card-more" tabindex="-1" type="button"').replace("if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey))", 'if (false)')
  if (MUT === 'qend' && u === '/v3/stone.js') s = s.replace('if (!more) return hideBtn() //', 'if (!more && el.scrollTop === 0) return hideBtn() //')
  if (MUT === 'qfits' && u === '/v3/stone.js') s = s.replace('if (!more) return hideBtn() //', 'if (!more && el.scrollTop > 0) return hideBtn() //')
  if (MUT === 'qlift' && u === '/v3/stone.js') s = s.replace('if (reduce() || !CARD.open || !CARD.el || !CARD.cue || CARD.cue.lift) return', 'if (true) return')
  if (MUT === 'qback' && u === '/v3/stone.js') s = s.replace('el.scrollTop = 0; L.done = true; cueRaf = 0; return', 'el.scrollTop = L.peak; L.done = true; cueRaf = 0; return')
  if (MUT === 'qtwice' && u === '/v3/stone.js') s = s.replace("G.snapDue = false; cardEl.style.setProperty('--ci-b', G.bottom + 'px');", "G.snapDue = false; if (CARD.phase === 'open' && CARD.cue && CARD.cue.lift && CARD.cue.lift.done) { CARD.cue.lift = null; setTimeout(cueLift, 0) } cardEl.style.setProperty('--ci-b', G.bottom + 'px');")
  if (MUT === 'qreduce' && u === '/v3/stone.js') s = s.replace('if (reduce() || !CARD.open || !CARD.el || !CARD.cue || CARD.cue.lift) return', 'if (!CARD.open || !CARD.el || !CARD.cue || CARD.cue.lift) return')
  if (MUT === 'qdesk' && u === '/v3/stone.js') s = s.replace('const cardMode = () => phone() || low()', 'const cardMode = () => true')
  if (s !== was && u !== '/v2/home.js') MUTHIT.add(MUT); return s }
const server = http.createServer((req, res) => { try { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, path.normalize(u.endsWith('/') ? u + 'index.html' : u))
  if (GONE.has(u) || !f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
  if (u === '/v2/home.js' || OVER.has(u) || (MUT && /^\/v3\/(here\.js|stone\.js|stone\.css|defaults\.json)$/.test(u))) return res.end(served(u, f))
  createReadStream(f).pipe(res) } catch { res.writeHead(500); res.end() } })
await new Promise(r => server.listen(0, '127.0.0.1', r))
const HTTP = server.address().port, CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 'home-'))
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = [], tracked = [], READS = { all: [], worst: {} }
let loads = 0, taps = 0, crossings = 0, doorsN = 0, drawnN = 0, weight = null

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  const b64 = s => Buffer.from(s).toString('base64'), cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
  let SKY = FIXTURE
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'log' && /^TRACK /.test(msg.params.args[0]?.value || '')) tracked.push(JSON.parse(msg.params.args[0].value.slice(6))) // what the page sent, across its unload
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url)
    if (msg.method === 'Fetch.requestPaused') { P36.setAsked(new URL(msg.params.request.url).searchParams.get('current')) // SKY null: the sky cannot be read
      cdp.send('Fetch.fulfillRequest', SKY ? { requestId: msg.params.requestId, responseCode: 200, responseHeaders: cors, body: b64(SKY) } : { requestId: msg.params.requestId, responseCode: 503, responseHeaders: cors, body: b64('') }).catch(() => {}) } }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  // pinned: the clock (4:50 pm New York, 8 Nov 2026, the minute 36's real sky was read) and that sky, so a run tomorrow sees what a run today saw
  const PIN = Date.UTC(2026, 10, 8, 21, 50)
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  let pinId = null
  const setPin = async ms => { if (pinId) await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: pinId })
    pinId = (await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${ms}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {} })()` })).identifier }
  await setPin(PIN)
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
  const defaults = DEF, IDEAS = HOME_IDEAS

  // what the page dealt and drew, held to 37's rules, each facet's region recounted from regions.json at the centre the page cut
  const drawnHold = async label => {
    const ids = await cdp.eval('HOME.drawn'), plans = await cdp.eval('HOME.plans'), w0 = await cdp.eval('HOME.world0'), bad = [], world = { photo: w0.photo, poem: w0.poem, doors: w0.doors }
    const plan = [], facets = [], kinds = { idea: 0, year: 0, title: 0, work: 0 }
    for (const i of ids) { const p = plans[i]; if (!p) { bad.push(`facet ${i} yields nothing`); continue } drawnN++
      if (p.kind === 'idea' || p.kind === 'year' || p.kind === 'title') { kinds[p.kind]++; continue } kinds.work++
      const g = P37.regionAt(w0.photo, p.facet.c, w0.W, w0.H); if (!g || g.tone !== p.facet.tone || g.side !== p.facet.side || Math.abs(g.sal - p.facet.sal) > .002 || Math.abs(g.edges - p.facet.edges) > .002) bad.push(`#${i}: its region is not what regions.json holds at its centre`)
      const seg = P37.segBy[p.id]; if (!seg) { bad.push(`#${i}: ${p.id} is not a segment`); continue }
      plan.push({ seg, link: p.link, cls: p.cls, basis: p.basis, to: { photo: '/photos/' + p.to.split('~')[1], poem: p.to.split('~')[0] }, steps: p.steps.map(st => ({ ...st, to: st.to ? { photo: '/photos/' + st.to.split('~')[1], poem: st.to.split('~')[0] } : undefined })) }); facets.push(p.facet) }
    plan.forEach(p => p.steps.forEach(st => { if (st.t !== 'move') delete st.to }))
    P37.plansHold(world, plan, facets, 'shape', label, bad)
    check(!bad.length && kinds.idea === 6 && kinds.year === 1 && kinds.title === 1, `${label}: every one of ${ids.length} facets yields: six ideas, the photograph's date, the poem's title, and ${kinds.work} doors, each chosen by a piece of his work (the piece verbatim in its source, never shown), each basis recounted, none shared, no commentary`, bad.slice(0, 5).join(' | ') || JSON.stringify(kinds))
    return plans }

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
    else { const ps = await cdp.eval('HOME.plans'), i = ps.findIndex(p => p && p.to); if (i < 0) { check(false, `${label}: a facet with a move`); return false }
      await cdp.eval('HOME.still = true'); await sleep(300); pt = await cdp.eval(`HOME.tapPoint(${i})`) } // 12 Nov: its one tap crosses
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
    check(info.x === x && !r.bad.length && !ends.length, `${label}: ${info.x} from ${how === 'door' ? 'a door line' : 'a facet\'s one tap'}, every facet accounted in every frame (fastest step ${r.biggest.toFixed(2)}x, ${r.fine} cut finer), starts on the stone at rest and lands on the next exactly`, [...ends, ...r.bad].slice(0, 4).join(' | '))
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

  /* 41 b / 42 a readers, shared by the live loads and the states below */
  const IDEAS42 = HOME_IDEAS
  const key = async (k, extra = {}) => { const map = { Enter: [13, '\r'], ' ': [32, ' '], Escape: [27, ''], Tab: [9, ''], PageDown: [34, ''] }, [code, text] = map[k]
    await cdp.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: code, text: text || undefined, ...extra })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: code, ...extra }); await sleep(120) }
  // what a sighted visitor reads at rest: every visible text, title and label, except the six keys' labels, which are proved hidden instead
  const restText = () => cdp.eval(`(() => { const out = []; const walk = n => { if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(), p = n.parentElement
      if (t && p.getClientRects().length && !p.closest('[hidden], noscript, #why') && getComputedStyle(p).visibility !== 'hidden' && (() => { for (let e = p; e; e = e.parentElement) if (+getComputedStyle(e).opacity < .02) return false; return true })()) out.push(t) } else n.childNodes.forEach(walk) }
    walk(document.body); document.querySelectorAll('[title], [aria-label]').forEach(e => { if (!e.closest('#keys')) out.push(e.getAttribute('title') || '', e.getAttribute('aria-label') || '') }); return out.join(' | ') })()`)
  const rested = async label => {
    const rest = await restText(), shownN = IDEAS42.map(I => I.name).filter(n => new RegExp('(^|[^a-z])' + n.replace(/ /g, '\\s+') + '([^a-z]|$)', 'i').test(rest))
    const ks = await cdp.eval(`[...document.querySelectorAll('#keys button')].map(b => { const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { name: b.getAttribute('aria-label'), w: r.width, h: r.height, text: b.textContent, clip: cs.clipPath, exp: b.getAttribute('aria-expanded'), ctl: b.getAttribute('aria-controls'), tab: b.tabIndex } })`)
    check(!shownN.length && ks.length === 6 && ks.map(x => x.name).join('|') === IDEAS42.map(I => I.name).join('|') && ks.every(x => x.w <= 1 && x.h <= 1 && !x.text && /inset\(50%\)/.test(x.clip) && x.exp === 'false' && x.ctl === 'tools' && x.tab === 0),
      `${label}: at rest no idea's name is visible, in a title or a label; the six keys carry them, in IDEAS' order, focusable, taking no room and showing nothing`, shownN.join(', ') || JSON.stringify(ks).slice(0, 200))
    const marks = await cdp.eval('HOME.marks()')
    check(marks.length === 6 && marks.every(m => m.wash > .05 && !m.thread), `${label}: at rest six facets carry a breath of their idea's hue, nothing more`, JSON.stringify(marks)) }
  const panelNow = () => cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(), vis = e => !!e && e.getClientRects().length > 0 && !e.closest('[hidden]')
    const kids = [...t.children].filter(vis).map(e => e.tagName + (e.className ? '.' + e.className.replace(/ /g, '.') : '')), gen = t.querySelector('.gen'), fs = e => parseFloat(getComputedStyle(e).fontSize)
    const lines = []; const walk = n => { if (n.nodeType === 3 && n.textContent.trim() && vis(n.parentElement)) { const q = document.createRange(); q.selectNodeContents(n); for (const b of q.getClientRects()) if (b.height) lines.push([b.top, b.bottom]) } else n.childNodes.forEach(walk) }; walk(t)
    return { box: [r.left, r.top, r.width, r.height], kids, h2: t.querySelector('h2').textContent, href: t.querySelector('h2 a')?.getAttribute('href') ?? null, text: t.innerText,
      here: [...t.querySelectorAll('p.here')].filter(vis).map(p => p.textContent), hereBig: Math.min(...[...t.querySelectorAll('p.here')].filter(vis).map(fs), 99), genMax: Math.max(...[...t.querySelectorAll('.gen p, .gen li button')].filter(vis).map(fs), 0),
      genHidden: !gen || !vis(gen), intro: gen?.querySelector('p.intro')?.textContent ?? null, boundary: gen?.querySelector('p.boundary')?.textContent ?? null,
      parts: [...t.querySelectorAll('li > button')].map(b => b.textContent), sents: [...t.querySelectorAll('li > p')].map(p => p.textContent),
      basis: t.querySelector('.basis')?.textContent ?? null, cut: lines.filter(([a, b]) => a < r.bottom - 1 && b > r.bottom + 1).length } })()`)
  const panelWrong = (I, st, W0, plan) => { const out = []
    if (st.h2 !== I.name || st.href !== (I.href || null)) out.push(`${I.name}: not its name`)
    if (st.parts.join('|') !== I.parts.join('|') || st.sents.join('|') !== I.detail.tools.join('|') || st.intro !== MARK + I.detail.intro || st.boundary !== MARK + I.detail.boundary || st.genHidden)
      out.push(`${I.name}: the general is not IDEAS' own words, read live (intro “${(st.intro || '').slice(0, 40)}”, ${st.intro && st.intro[0] === MARK ? 'marked' : 'no mark: a copy'})`)
    if (plan && (st.basis !== plan.basis || / px\b/.test(st.basis || ''))) out.push(`${I.name}: basis “${st.basis}” vs plan “${plan.basis}”`)
    if (st.here.join(' ') !== W0.join(' ')) out.push(`${I.name}: this world says “${st.here.join(' ').slice(0, 120)}”, the recount “${W0.join(' ').slice(0, 120)}”`)
    if (W0.length && st.kids[1] !== 'P.here') out.push(`${I.name}: this world is not first under the name (${st.kids.slice(0, 3)})`)
    if (W0.length && !(st.hereBig > st.genMax)) out.push(`${I.name}: this world (${st.hereBig}px) is not larger than the general (${st.genMax}px)`)
    if (/\bnull\b|\bundefined\b|\bNaN\b/.test(st.text)) out.push(`${I.name}: the panel shows a missing value`)
    if (st.cut) out.push(`${I.name}: ${st.cut} line(s) cut at the panel's edge`)
    return out }
  const panelClash = (name, tb, s) => { const out = [], where = s.where, nav = s.nav || null
    for (const [n, r] of [['poem', s.poem], ['name', s.name], ['where line', where], ['mat (name, where line, nav)', s.mat], ['switch', s.vs]]) if (r && r[2] > 0 && meet(tb, r)) out.push(`${name} over the ${n}`)
    if (tb[0] < 0 || tb[1] < 0 || tb[0] + tb[2] > s.W + .5 || tb[1] + tb[3] > s.H + .5) out.push(`${name} off the screen`); return out }
  const contrast = () => cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(), cv = document.getElementById('stone'), d = devicePixelRatio, x = cv.getContext('2d')
    const img = x.getImageData(Math.max(0, Math.floor(r.left * d)), Math.max(0, Math.floor(r.top * d)), Math.max(1, Math.floor(r.width * d)), Math.max(1, Math.floor(r.height * d))).data
    const bg = getComputedStyle(t).backgroundColor.match(/[\\d.]+/g).map(Number), A = bg[3] ?? 1
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, Lof = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
    const grounds = []; for (let k = 0; k < img.length; k += 4 * 7) grounds.push([0, 1, 2].map(j => bg[j] * A + img[k + j] * (1 - A)))
    const texts = [...t.querySelectorAll('h2, p, li > button, .basis')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).map(e => { const cs = getComputedStyle(e), m = cs.color.match(/[\\d.]+/g).map(Number); let op = 1; for (let n = e; n && n !== t.parentElement; n = n.parentElement) op *= +getComputedStyle(n).opacity; return { sel: e.tagName + (e.className ? '.' + e.className : ''), c: m, a: (m[3] ?? 1) * op } })
    let worst = { r: 99 }
    for (const T of texts) for (const G of grounds) { const fg = [0, 1, 2].map(j => T.c[j] * T.a + G[j] * (1 - T.a)), L1 = Lof(fg), L2 = Lof(G), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); if (ratio < worst.r) worst = { r: ratio, sel: T.sel } }
    return { r: +worst.r.toFixed(2), sel: worst.sel } })()`)
  // B8: the six keys. Tab reaches each in order; focus rings its facet (pixels, not code); Enter or Space opens its own idea; Escape closes it and gives focus back
  const keyboard = async label => { await park(); await cdp.eval('HOME.still = true; document.activeElement && document.activeElement.blur && document.activeElement.blur()'); await sleep(900)
    const order = []; for (let n = 0; n < 40 && order.length < 6; n++) { await key('Tab'); const a = await cdp.eval(`(() => { const e = document.activeElement; return e && e.closest && e.closest('#keys') ? +e.dataset.k : null })()`); if (a != null && !order.includes(a)) order.push(a) }
    check(order.join() === '0,1,2,3,4,5', `${label} B8: Tab reaches all six keys, in IDEAS' order`, order.join())
    const ideas = (await cdp.eval('HOME.state')).ideas, bad = [], rings = []
    for (const [k, I] of IDEAS42.entries()) { const x = ideas.find(q => q.k === k)
      await cdp.eval('document.activeElement && document.activeElement.blur && document.activeElement.blur()'); await sleep(250); await cdp.eval(`(() => { const c = document.getElementById('stone'); window.__a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return 1 })()`)
      await cdp.eval(`document.querySelector('#keys button[data-k="${k}"]').focus()`); await sleep(250)
      const r = await cdp.eval(`(() => { const c = document.getElementById('stone'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, a = window.__a, P = HOME.state.cells[${x.i}], dpr = c.width / innerWidth
        const inP = ([x, y], Q) => { let q = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) q = !q } return q }
        let inside = 0, outside = 0; for (let k = 0; k < d.length; k += 4) { const dd = Math.abs(d[k] - a[k]) + Math.abs(d[k + 1] - a[k + 1]) + Math.abs(d[k + 2] - a[k + 2]); if (dd < 60) continue; const p = [((k >> 2) % c.width) / dpr, Math.floor((k >> 2) / c.width) / dpr]; inP(p, P) ? inside++ : outside++ }
        return { inside, outside, keyAt: HOME.keyAt } })()`)
      rings.push(r.inside); if (!(r.keyAt === k && r.inside > 200 && r.outside < r.inside * .05)) bad.push(`${I.name}: focus drew ${r.inside} changed pixels in its facet, ${r.outside} outside (keyAt ${r.keyAt})`)
      if (k === 0 && label.includes('home')) await shot(`focus-ring-${label.split(' ')[0]}.png`)
      await key(k % 2 ? ' ' : 'Enter')
      const st = await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.openAt === ${x.i} && document.querySelector('#tools').classList.contains('on') && ({ h2: document.querySelector('#tools h2').textContent, exp: [...document.querySelectorAll('#keys button')].map(b => b.getAttribute('aria-expanded')) })`), 'key ' + I.name, 40, 50).catch(() => null)
      if (!st || st.h2 !== I.name || st.exp.join() !== IDEAS42.map((_, j) => String(j === k)).join()) bad.push(`${I.name}: ${k % 2 ? 'Space' : 'Enter'} did not open it (${JSON.stringify(st)})`)
      await key('Escape'); const back = await cdp.eval(`({ open: HOME.open, focus: document.activeElement === document.querySelector('#keys button[data-k="${k}"]'), exp: document.querySelector('#keys button[data-k="${k}"]').getAttribute('aria-expanded') })`)
      if (back.open !== -1 || !back.focus || back.exp !== 'false') bad.push(`${I.name}: Escape ${back.open !== -1 ? 'left it open' : 'did not give the focus back'}`) }
    await cdp.eval('document.activeElement && document.activeElement.blur && document.activeElement.blur(); HOME.still = false')
    check(!bad.length, `${label} B8: each key's focus draws a ring on its own facet (${Math.min(...rings)} to ${Math.max(...rings)} pixels changed, none elsewhere to speak of), Enter or Space opens its own idea with aria-expanded true, Escape closes it and gives the focus back`, bad.slice(0, 3).join(' | ')) }

  /* 42 a, the texts: every this-world sentence of every world (today's pair, all 77 photographs with two poems each, and the worlds holding the
     rarer forms: an undated poem, a poem of one theme, a photograph and a poem shown on the home once, twice and three or more times), as the
     live page writes them, against this check's own recount, word for word; none names a private channel, the system, or anyone */
  const readAtOf = () => cdp.eval(`(() => { try { return JSON.parse(sessionStorage.getItem('kahranWeatherCache')).at } catch { return null } })()`)
  const kp = (photo, slug) => slug + '~' + photo.replace('/photos/', '')
  const POEMS42 = DATA.poems.filter(p => live.has(p.slug)), PHOTOS42 = DATA.photos.filter(p => REGIONS[p.src])
  const KEYS = PHOTOS42.flatMap((p, k) => [0, 46].map(o => POEMS42[(k * 7 + o) % POEMS42.length].slug + '~' + p.src.replace('/photos/', '')))
  const RARE = (() => { const D = P42.DAYS0, real = Object.keys(D).filter(d => /^\d{4}-/.test(d)), n = (f, v) => real.filter(d => D[d][f] === v).length, out = {}
    const ph = c => PHOTOS42.find(p => c(n('photo', p.src))), po = c => POEMS42.find(p => c(n('poem', p.slug)))
    const P1 = ph(x => x === 1), P2 = ph(x => x === 2), P3 = ph(x => x >= 3), Q1 = po(x => x === 1), Q2 = po(x => x === 2), Q3 = po(x => x >= 3), U = POEMS42.find(p => P42.PY0.undated[p.slug]), O = POEMS42.find(p => P42.REL0.P[p.slug] && P42.REL0.P[p.slug].themes.length === 1)
    for (const [k, p, q] of [['an undated poem', P1, U], ['a poem of one theme', P2, O], ['shown once', P1, Q1], ['shown twice', P2, Q2], ['shown three or more times', P3, Q3]]) if (p && q) out[k] = kp(p.src, q.slug)
    return out })()
  const M0 = { iso: '2026-11-08', R: P36.READING }, SAID = {}
  if (process.env.CARDS !== 'only') { await view({ id: 'texts', w: 390, h: 844, mobile: true }); await open('')
    const today = await cdp.eval('HOME.todayKey'), at = await readAtOf(), tp = P42.today(M0.iso, M0.R, P42.DAYS0), bad = [], priv = [], caps = []
    check(today === kp(tp.photo, tp.poem) && tp.how === 'live', `42 a: the page's pair today is the one pick.js picks in the recount here (${today})`)
    const all = [today, ...KEYS, ...Object.values(RARE)]
    for (const key of all) { const [slug, f] = key.split('~'), got = await cdp.eval(`HOME.hereFor(${JSON.stringify(key)})`), want = P42.expected({ ...M0, readAt: at, src: '/photos/' + f, slug, mode: key === today ? 'home' : 'world' })
      bad.push(...P42.differ(got, want).map(b => key + ' ' + b))
      for (const n of P42.NAMES) for (const x of got[n] || []) { if (P42.PRIVATE.test(x.s)) priv.push(`${key} ${n}: “${P42.PRIVATE.exec(x.s)[0]}”`); const u = P42.unaccounted(x.s); if (u.length) caps.push(`${key} ${n}: ${u.join(', ')}`) }
      if (key === today) SAID['today'] = got; for (const [k, v] of Object.entries(RARE)) if (v === key) SAID[k + ' (' + key + ')'] = got }
    check(!bad.length, `42 a: every this-world sentence equals the recount here, word for word: ${all.length} worlds (today's pair, ${KEYS.length} worlds, ${Object.keys(RARE).length} holding the rarer forms: ${Object.keys(RARE).join(', ')}) x six ideas`, `${bad.length} differ: ` + bad.slice(0, 3).join(' | '))
    check(!priv.length, '42 a: no this-world sentence names a private channel, the system or a private place', priv.slice(0, 3).join(' | '))
    check(!caps.length, '42 a: no this-world sentence holds a capitalised word the data does not account for (no person is named)', caps.slice(0, 3).join(' | '))
    /* B4: every fact that can be missing, missing (one at a time and all at once), in every one of the three ways today's pair is chosen,
       for every world: no sentence holds null, undefined, NaN, an empty quote, a doubled space or comma, or loses its capital or its stop */
    const ns = await cdp.eval(`(async () => { const keys = ${JSON.stringify([today, ...KEYS])}, BROKEN = new RegExp(${JSON.stringify(P42.BROKEN.source)}), bad = []; let says = 0
      const knock = [['written', F => { F.sky.written = null }], ['last', F => { F.archive.last = null }], ['since', F => { F.archive.since = null; F.archive.days = 0 }], ['freeze', F => { F.archive.freeze = null; F.archive.hasToday = false }],
        ['publishers', F => { F.publishers = null }], ['years', F => { F.poem.year = null; F.poem.undated = 0 }], ['undated', F => { F.poem.year = null }], ['themes', F => { F.themes = null }],
        ['place unknown', F => { F.sky.place = null; F.sky.read = false }], ['place unsaid', F => { F.sky.place = undefined; F.sky.read = false }], ['sky unread', F => { F.sky.read = false }], ['no phrase', F => { F.sky.phrase = null }],
        ['no temperature', F => { F.sky.temp = null }], ['readAt', F => { F.sky.readAt = null }], ['ranked', F => { F.pick.ranked = false }], ['km', F => { F.km = null }], ['home', F => { F.home = null }],
        ['camera', F => { F.photo.camera = null }], ['month', F => { F.photo.month = null; F.photo.year = null }], ['decimals', F => { F.sky.decimals = null }], ['shown', F => { F.photo.shown = []; F.poem.shown = [] }]]
      for (const key of keys) { const F0 = await HOME.factsFor(key)
        for (const how of ['live', 'frozen', 'hash']) for (const set of [[], ...knock.map(k => [k]), knock]) { const F = structuredClone(F0); F.how = how; set.forEach(([, f]) => f(F)); says++
          const tag = key + ' ' + how + (set.length ? ' without ' + (set === knock ? 'any' : set[0][0]) : '')
          let S; try { S = S42.say(F) } catch (e) { bad.push(tag + ': threw ' + e.message); continue }
          for (const [n, L] of Object.entries(S)) for (const x of L) if (typeof x.s !== 'string' || BROKEN.test(x.s) || !/^[A-Z“]/.test(x.s) || !/\\.$/.test(x.s)) bad.push(tag + ' ' + n + ': “' + x.s + '”')
          if (F.sky.read && F.sky.place && Object.values(S).flat().some(x => /could not be read/.test(x.s))) bad.push(tag + ': says the sky could not be read when it was') } }
      return { bad: bad.slice(0, 8), n: bad.length, says, worlds: keys.length, states: 3 * (knock.length + 2) } })()`)
    check(!ns.n, `B4: no sentence is ever broken or false for a fact that did not load: ${ns.worlds} worlds x ${ns.states} states (three ways the pair is chosen x every fact missing, alone and all together) = ${ns.says.toLocaleString('en-US')} writings, none holding null, undefined, NaN, an empty quote or a doubled space or comma; the sky is said unread only when it was not read`, `${ns.n} wrong: ${ns.bad.join(' | ')}`) }

  /* 41 b's placement on the live stone: every world at five screens, fresh and crossed (HOME.plant: makeWorld itself, off screen); six ideas
     behind six distinct legal facets (never the title's, a door's or the date's, each with a place for a finger), as the rule says, recounted
     here, each basis line word for word with no pixel count; the poem clear of the caption and the switch, never a half line.
     Reported, not ruled (B13): where an open panel would cover the whole of its own idea's facet. SWEEP=0 skips it, SWEEP=only stops after it */
  const inPolyN = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
  const gapR = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3])))
  const reachN = (P, r) => { if (inPolyN([r[0] + r[2] / 2, r[1] + r[3] / 2], P)) return 0; let d = Infinity
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
      for (let s = 0; s <= n; s++) d = Math.min(d, gapR([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n, 0, 0], r)) } return d }
  const seamN = (P, Q) => P.filter(p => Q.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5)).length >= 2
  const hitN = (rs, cells, drawn) => { const out = new Set(); for (const b of rs) { const p = [b[0] + b[2] / 2, b[1] + b[3] / 2]; for (const i of drawn) if (inPolyN(p, cells[i])) out.add(i) } return out }
  function rule41(r) { const NAMES = P42.NAMES, C = r.cells, ct = r.cents, free = new Set(r.legal), out = [], take = (name, i, basis) => { free.delete(i); out[NAMES.indexOf(name)] = { k: NAMES.indexOf(name), i, basis } }
    const nearest = rect => [...free].map(i => ({ i, d: reachN(C[i], rect) })).sort((a, b) => a.d - b.d || a.i - b.i)[0]
    let x = nearest(r.where); take('Context', x.i, `nearest ‘${r.whereWords}’ · the place and the sky it states are what this idea gathers`)
    x = nearest(r.titleBox); take('Topically suggesting', x.i, `nearest the title, ‘${r.poemTitle}’ · today’s poem is the suggestion this moment made`)
    x = nearest(r.name); take('Home', x.i, 'nearest his name · this page is one of the things the home runs')
    { const Y = r.year >= 0 ? C[r.year] : null, yc = Y ? [ct[r.year][0], ct[r.year][1], 0, 0] : r.cap, y = [...free].map(i => ({ i, nb: !!Y && seamN(C[i], Y), d: reachN(C[i], yc) })).sort((a, b) => b.nb - a.nb || a.d - b.d || a.i - b.i)[0]
      take('Keeping track', y.i, !Y ? 'nearest the caption, the photograph’s place · the record is kept by where and when' : y.nb ? `beside the date, ${r.date} · a seam shared with it · the record is kept by when` : `nearest the date, ${r.date} · the record is kept by when`) }
    x = nearest(r.vs); take('Staying up to date', x.i, 'nearest v3 · v2 · v1 · the site kept current, its earlier versions still open')
    { const five = out.filter(Boolean).map(o => o.i), mid = five.reduce((s, i) => [s[0] + ct[i][0] / 5, s[1] + ct[i][1] / 5], [0, 0])
      const y = [...free].map(i => ({ i, n: five.filter(j => seamN(C[i], C[j])).length, d: Math.hypot(ct[i][0] - mid[0], ct[i][1] - mid[1]) })).sort((a, b) => b.n - a.n || a.d - b.d || a.i - b.i)[0]
      take('Self-healing', y.i, y.n ? `sharing a seam with ${y.n} of the five it watches · they are kept running from here` : 'nearest the middle of the five it watches · they are kept running from here') }
    return out }
  if (process.env.SWEEP !== '0' && process.env.CARDS !== 'only') {
    const SW = [[390, 844, true], [375, 667, true], [430, 932, true], [844, 390, true], [1440, 900, false]], bad = [], seen = { n: 0, recut: 0, slow: 0, scroll: 0, covered: 0, coveredIdeas: 0, coveredAt: {} }, ts = Date.now()
    for (const [w, h, mobile] of SW) { await view({ id: 'sweep', w, h, mobile }); await open('')
      for (const key of KEYS) for (const crossed of [false, true]) {
        const trail = crossed ? [KEYS[(KEYS.indexOf(key) + 1) % KEYS.length]] : [], t1 = Date.now(), r = await cdp.eval(`HOME.plant(${JSON.stringify(key)}, ${JSON.stringify(trail)})`); seen.n++; seen.slow = Math.max(seen.slow, Date.now() - t1)
        const tag = `${w}x${h} ${crossed ? 'crossed into' : 'fresh'} ${key}`
        if (!r) { bad.push(`${tag}: no world`); continue } if (r.cutT) seen.recut++; if (r.scroll) seen.scroll++
        if (r.half) bad.push(`${tag}: the poem's box cuts ${r.half} line(s) in half`)
        { const ph = [['caption', r.cap], ['switch', r.vs]].filter(([, o]) => o[2] > 0 && meet(r.poem, o)).map(([k]) => k); if (ph.length || r.poem[1] < 0 || r.poem[1] + r.poem[3] > h + .5) bad.push(`${tag}: the poem ${ph.length ? 'is on the ' + ph.join(', ') : 'leaves the screen'}`) }
        const got = r.ideas, title = hitN(r.titleRects, r.cells, r.drawn), doors = hitN(r.doorRects, r.cells, r.drawn)
        if (!got || got.length !== 6 || got.some(x => !x)) { bad.push(`${tag}: not six ideas`); continue }
        if (new Set(got.map(x => x.i)).size !== 6) bad.push(`${tag}: two ideas share a facet`)
        for (const x of got) { const why = [!r.drawn.includes(x.i) && 'not drawn', title.has(x.i) && 'the title\'s', doors.has(x.i) && 'a door\'s', x.i === r.year && 'the date\'s', !r.touch[x.i] && 'no place for a finger'].filter(Boolean)
          if (why.length) bad.push(`${tag}: ${P42.NAMES[x.k]} behind facet ${x.i}, ${why.join(', ')}`) }
        const want = rule41(r)
        for (const [k, x] of got.entries()) { if (!want[k] || want[k].i !== x.i) bad.push(`${tag}: ${P42.NAMES[k]} behind ${x.i}, the rule says ${want[k] && want[k].i}`)
          else if (want[k].basis !== x.basis || / px\b/.test(x.basis)) bad.push(`${tag}: ${P42.NAMES[k]}'s basis says “${x.basis}”, the recount “${want[k].basis}”`) }
        if (r.covered.length) { seen.covered++; seen.coveredIdeas += r.covered.length; seen.coveredAt[w + 'x' + h] = (seen.coveredAt[w + 'x' + h] || 0) + 1 } } }
    check(!bad.length, `41 b's placement holds on the live stone: six ideas behind six distinct legal facets, as the rule says, recounted, each basis line word for word with no pixel count; the poem clear of the caption and the switch, never a half line: ${KEYS.length} worlds x ${SW.length} screens x fresh and crossed = ${seen.n} placements; ${seen.recut} on a re-seeded cut; ${seen.scroll} poems shown in whole lines, the rest a scroll; slowest world made in ${seen.slow}ms (${Math.round((Date.now() - ts) / 1000)}s)`, `${bad.length} wrong: ${bad.slice(0, 6).join(' | ')}`)
    console.log(`note B13: in ${seen.covered} of ${seen.n} placements the open panel, at its full height, covers the whole of its own idea's facet (${seen.coveredIdeas} idea-facets; ${Object.entries(seen.coveredAt).map(([k, v]) => k + ' ' + v).join(', ') || 'none'}); there the next tool is in the panel`)
    { await view({ id: 'wash', w: 390, h: 844, mobile: true }); await open(''); const ws = []
      for (const key of [await cdp.eval('HOME.todayKey'), ...KEYS]) { const r = await cdp.eval(`HOME.washOf(${JSON.stringify(key)})`); if (r) ws.push(...r.map(x => ({ key, ...x }))) }
      ws.sort((a, b) => a.dE - b.dE); const per = new Map(); for (const x of ws) per.set(x.key, Math.max(per.get(x.key) ?? 0, x.dE)); const worlds = [...per].sort((a, b) => a[1] - b[1])
      console.log(`note B13: the hue wash at rest (390x844, ΔE76 between each idea's facet with its wash and without, mean over its pixels): faintest facet ${ws[0].dE.toFixed(1)} (${P42.NAMES[ws[0].k]}, ${ws[0].key}), median facet ${ws[ws.length >> 1].dE.toFixed(1)}; the faintest world's most visible facet ${worlds[0][1].toFixed(1)} (${worlds[0][0]}); ${ws.filter(x => x.dE < 2.3).length} of ${ws.length} facets under 2.3, the just-noticeable difference`) }
    if (process.env.SWEEP === 'only') { console.log(bad.join('\n')); throw new Error('SWEEP=only: stopped after the sweep') } }

  /* the title (9 Nov): its own facet, drawn as one piece, underlined where main lays it; a tap on the title or its facet opens the whole poem */
  const titleHold = async label => {
    const s = await cdp.eval('HOME.state'), w = await cdp.eval('HOME.world'), href = `/poems/${w.slug}.html`, P = s.cells[s.title] || []
    const ctr = r => [r[0] + r[2] / 2, r[1] + r[3] / 2], holds = s.titleRects.some(r => inPoly(ctr(r), P))
    check(s.title >= 0 && holds && !s.ideas.some(x => x.i === s.title) && s.title !== s.year && s.kinds[s.title] === 'title' && s.titlePlan && s.titlePlan.href === href && s.titleHref === href,
      `${label}: the title has a facet of its own (${s.title}), one it lies in, no idea's and not the date's, and it leads to ${href}`, JSON.stringify({ title: s.title, holds, ideas: s.ideas.map(x => x.i), year: s.year, plan: s.titlePlan, href: s.titleHref }))
    check(!!s.piece && s.piece.i === s.title && s.piece.tone >= Number(DEF['title-tone']) && s.piece.edge >= Number(DEF['title-edge']) && s.titleUnder,
      `${label}: the title's facet is drawn as one piece (its ground toned ${DEF['title-tone']}, its rim ${DEF['title-edge']}) and the title is underlined as every way on is`, JSON.stringify({ piece: s.piece, under: s.titleUnder }))
    /* where main lays it: the title is the verse's first line, at its very corner (h2 margin 0 above, no indent), and drawn on the stone where
       the page holds it, only ever moved up or down by its facet, within word-shift x refract-px x the reach of a facet's lean (.45) */
    const ws = (await cdp.eval('HOME.words')).filter(x => x.title), reach = Number(DEF['refract-px']) * Number(DEF['word-shift']) * .45 + .01, t0 = s.titleRects[0]
    const atCorner = !!t0 && Math.abs(t0[0] - s.verse[0]) < .5 && Math.abs(t0[1] - s.verse[1]) < 3 && Math.abs(s.titleBox[0] - s.verse[0]) < .5 && Math.abs(s.titleBox[1] - s.verse[1]) < .5
    const drawnAt = ws.length > 0 && ws.every(x => x.d[0] === 0 && Math.abs(x.d[1]) <= reach && s.titleRects.some(r => x.box[0] >= r[0] - .5 && x.box[0] + x.box[2] <= r[0] + r[2] + .5))
    check(atCorner && drawnAt, `${label}: the title sits where main lays it, at the poem's top left corner (${r1(t0 || [])}), and is drawn there, off by at most ${reach.toFixed(2)}px up or down`, JSON.stringify({ t0, verse: s.verse, box: s.titleBox, ws: ws.map(x => [x.t, r1(x.box), x.d]) })) }
  /* no seam eats a letter: the stone drawn twice, its seams the second time in a colour no photograph has; inside each word's letters (the
     solid ink of the page's own composited words, where the page lays that word) not one pixel may show the seam's colour */
  const seamEats = () => cdp.eval(`(() => { const cv = document.getElementById('stone'), g = cv.getContext('2d'), d = cv.width / innerWidth, T = HOME.text.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
    HOME.draw(); const A = g.getImageData(0, 0, cv.width, cv.height).data; HOME.draw({ tint: true }); const B = g.getImageData(0, 0, cv.width, cv.height).data; HOME.draw()
    const out = { title: [], poem: [], words: 0, cores: 0 }
    for (const w of HOME.words) { if (!w.shown) continue; out.words++; let core = 0, hit = 0
      const dx = Math.round(w.d[0] * d), dy = Math.round(w.d[1] * d), x0 = Math.floor(w.box[0] * d), y0 = Math.floor(w.box[1] * d), x1 = Math.ceil((w.box[0] + w.box[2]) * d), y1 = Math.ceil((w.box[1] + w.box[3]) * d)
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * cv.width + x) * 4; if (T[k + 3] < 250) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue
        core++; const j = (Y * cv.width + X) * 4; if (Math.abs(A[j] - B[j]) + Math.abs(A[j + 1] - B[j + 1]) + Math.abs(A[j + 2] - B[j + 2]) > 40) hit++ }
      out.cores += core; if (hit) out[w.title ? 'title' : 'poem'].push(w.t + ' (' + hit + ' of ' + core + ')') }
    return out })()`)
  const seamHold = async label => { const r = await seamEats()
    check(r.words > 0 && r.cores > 200 && !r.title.length, `${label}: no seam eats a letter of the title: the seams drawn in a colour no photograph has, none shows inside its letters`, r.title.slice(0, 4).join(', '))
    check(r.words > 0 && !r.poem.length, `${label}: nor of the poem: none of the seams shows inside a letter of its ${r.words} words on screen (${r.cores.toLocaleString('en-US')} letter pixels read)`, r.poem.slice(0, 4).join(', ')) }
  /* the taps: on the title's words, then on its facet away from them; each opens the whole poem, sent as poem_open with its own via */
  const titleTaps = async label => { const w = await cdp.eval('HOME.world'), href = `/poems/${w.slug}.html`, out = []
    for (const via of ['title', 'facet']) { await open(''); await cdp.eval(`document.addEventListener('home:track', e => console.log('TRACK ' + JSON.stringify(e.detail)))`); tracked.length = 0
      const pt = via === 'title' ? await reach('.verse h2 a') : await cdp.eval(`HOME.tapPoint(HOME.state.title)`); if (!pt) { out.push(via + ': no place to tap'); continue }
      await tapAt(pt[0], pt[1])
      const at = await waitFor(() => cdp.eval(`location.pathname !== '/' && document.readyState !== 'loading' && location.pathname`), 'the poem', 100).catch(() => null)
      const ev = tracked.find(e => e.name === 'poem_open' && e.params && e.params.via === via && e.params.poem === w.slug)
      if (at !== href || !ev) out.push(`${via}: went to ${at}, sent ${JSON.stringify(tracked)}`) }
    await open('')
    check(!out.length, `${label}: a tap on the title, or on its facet away from its words, opens the whole poem (${href}), sent as poem_open via title and via facet`, out.join(' | ')) }
  /* the home reads: every text, in its own colour and strength, against the canvas pixels behind it (the stone without the poem's words, any
     ground included) and any panel or scrim between: WCAG AA (4.5:1) for 98% of them; 11px and up (the chain's sizes are its own, reported) */
  const MEASURE = String.raw`(sels) => { HOME.draw({ bare: true })
    const cv = document.getElementById('stone'), g = cv.getContext('2d'), k = cv.width / innerWidth
    const rgba = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return [0, 0, 0, 0]; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] }
    const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, Y = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]), over = (top, a, bot) => [0, 1, 2].map(j => top[j] * a + bot[j] * (1 - a))
    const why = document.body.classList.contains('why'), sc = document.getElementById('why-scrim'), scrim = rgba(getComputedStyle(sc).backgroundColor), sop = +getComputedStyle(sc).opacity
    const out = {}, add = (group, label, rects, col, op, bgs, under, px) => { const cons = []
      for (const q of rects) { const x0 = Math.max(0, Math.floor(q[0] * k)), y0 = Math.max(0, Math.floor(q[1] * k)), x1 = Math.min(cv.width, Math.ceil((q[0] + q[2]) * k)), y1 = Math.min(cv.height, Math.ceil((q[1] + q[3]) * k)); if (x1 <= x0 || y1 <= y0) continue
        const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data
        for (let i = 0; i < d.length; i += 8) { let bg = [d[i], d[i + 1], d[i + 2]]; if (under && why) bg = over(scrim, scrim[3] * sop, bg); for (const b of bgs) bg = over(b, b[3], bg); const a = Y(over(col, op, bg)), c = Y(bg); cons.push((Math.max(a, c) + .05) / (Math.min(a, c) + .05)) } }
      if (!cons.length) return; cons.sort((a, c) => a - c); const p02 = +cons[Math.floor(cons.length * .02)].toFixed(2), o = out[group] ||= { n: 0, p02: 99, px: 99, text: '' }
      o.n++; if (p02 < o.p02) { o.p02 = p02; o.text = label.slice(0, 30) } o.px = Math.min(o.px, px) }
    if (sels.includes('.verse')) for (const w of HOME.words) if (w.shown) add(w.title ? 'title' : 'poem', w.t, [[w.box[0] + w.d[0], w.box[1] + w.d[1], w.box[2], w.box[3]]], [243, 239, 230], 1, [], true, parseFloat(w.font.split(' ')[2]))
    for (const [q, group] of [['#tools', 'idea'], ['#why', 'chain'], ['.cap', 'caption'], ['#year', 'date'], ['header h1', 'name'], ['#where', 'where'], ['header nav', 'nav'], ['.vs', 'switch']]) { if (!sels.includes(q)) continue
      const root = document.querySelector(q), tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let n; (n = tw.nextNode());) { if (!n.data.trim()) continue; const el = n.parentElement, cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[hidden]')) continue
        let col = rgba(cs.color), op = col[3], bgs = [], clip = [0, 0, innerWidth, innerHeight]
        for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); op *= +s.opacity; const b = rgba(s.backgroundColor); if (b[3] > 0) bgs.unshift(b)
          if (s.overflowY !== 'visible' || s.overflowX !== 'visible') { const r = e.getBoundingClientRect(); clip = [Math.max(clip[0], r.left), Math.max(clip[1], r.top), Math.min(clip[2], r.right), Math.min(clip[3], r.bottom)] } }
        if (op < .05) continue
        const r = document.createRange(); r.selectNodeContents(n); const rs = [...r.getClientRects()].map(q => { const l = Math.max(q.left, clip[0]), t = Math.max(q.top, clip[1]); return [l, t, Math.min(q.right, clip[2]) - l, Math.min(q.bottom, clip[3]) - t] }).filter(q => q[2] > 0 && q[3] > 0)
        add(group, n.data.trim(), rs, col, op, bgs, false, parseFloat(cs.fontSize)) } }
    HOME.draw(); return out }`
  const reads = async label => { const bad = [], seen = new Set(), worst = READS.worst
    const note = (where, m) => { for (const [k, o] of Object.entries(m)) { seen.add(k); if (!worst[k] || o.p02 < worst[k].p02) worst[k] = { ...o, where: label + ' ' + where }
      if (o.p02 < 4.5) bad.push(`${where} ${k}: ${o.p02}:1 "${o.text}"`); if (o.px < 11 && k !== 'chain') bad.push(`${where} ${k}: ${o.px}px`) } }
    const measure = sels => cdp.eval(`(${MEASURE})(${JSON.stringify(sels)})`), STONE = ['.verse', '.cap', '#year', 'header h1', '#where', 'header nav', '.vs']
    await open(''); await settled(); await park(); await cdp.eval('HOME.still = true'); await sleep(300); await cdp.eval('HOME.ground()')
    note('at rest', await measure(STONE))
    for (const [k] of IDEAS42.entries()) { await cdp.eval(`document.querySelector('#keys button[data-k="${k}"]').click()`); await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.hereReadyNow`), 'idea', 100, 60); await sleep(400); await cdp.eval('HOME.finishCard(); HOME.cardResnap()'); await cdp.eval('HOME.ground()')
      note(`idea ${k} open`, await measure(VP.mobile ? ['#tools'] : ['.verse', '#tools', 'header h1', '#where', 'header nav', '.vs'])); await key('Escape') }
    await cdp.eval('HOME.openWhy()'); await sleep(D('why-ms') + 400); await cdp.eval('HOME.finishCard(); HOME.cardResnap()'); note('the chain open', await measure(VP.mobile ? ['#why'] : ['#why', 'header h1', 'header nav', '.vs'])); await cdp.eval('HOME.closeWhy()'); await sleep(300)
    await cdp.eval('HOME.still = false')
    const want = ['poem', 'title', 'caption', 'date', 'name', 'where', 'nav', 'switch', 'idea', 'chain'], missing = want.filter(k => !seen.has(k))
    READS.all.push(label)
    check(!bad.length && !missing.length, `${label}: the home reads: every text at rest, with each idea open and with the chain open keeps AA against the pixels behind it (98% of them), 11px and up`, bad.slice(0, 5).join(' | ') || 'not measured: ' + missing.join(', ')) }

  /* 43 c (11 Nov): on a phone whatever a tap opens is one card cut like a facet, turning over out of the facet that gave it. Carried from
     studies/43/check.mjs: it opens from a real touch; every text in it reads at AA against the rendered pixels behind it (a screenshot with the
     card's text made clear, the 99th-percentile pixel under each line) and nothing of the stone shows through (the same with the stone hidden);
     body text 16px, nothing under 12px; reachable by real touch drags, nothing hidden sideways, its foot pointed while there is more; the
     scroller ends on a whole line (the one change from 43 c); the four ways of closing, the focus back, the rest state restored pixel for pixel;
     one card at a time; the key's way in; the events as before; mid-way it is turning; under reduced motion only a crossfade */
  const cardNow = () => cdp.eval('HOME.card')
  const cardSettle = (label, open = true) => waitFor(async () => { const c = await cardNow(); return open ? c.open && c.phase === 'open' : !c.open && c.phase === null && !c.on }, label + (open ? ' to open' : ' to close'), 120)
  const restPic = async () => { const v = await cdp.eval(`(() => { const r = document.querySelector('.vs [aria-current]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`) // a touch on the tab's own word, which opens nothing: no sticky hover left on what was touched last
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: v[0], y: v[1] }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await waitFor(() => cdp.eval(`HOME.phase === 'resolved' || HOME.phase === 'none'`), 'the line resolved', 80)
    await cdp.eval('HOME.lamp(innerWidth * .7, innerHeight * .2)'); await sleep(1300); await cdp.eval('HOME.ground()'); await sleep(250)
    const b = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'), P = png(b); P.raw = b; return P }
  const shotNow = async () => png(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  const sameRest = (A, B, label) => { const d = pixDiff(A, B, VP.w); check(d.n <= 40, `${label}: the rest state after is the rest state before, pixel for pixel`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`) }
  const focusName = () => cdp.eval(`(() => { const a = document.activeElement; return !a || a === document.body ? 'body' : a.id ? '#' + a.id : a.closest('#keys') ? 'key ' + a.dataset.k : a.tagName.toLowerCase() })()`)
  const tracks = () => cdp.eval('window.__T || []')
  const opener = async (kind, k) => {
    if (kind === 'idea') return cdp.eval(`HOME.tapIdea(${k})`)
    return { pt: await cdp.eval(`(() => { const r = document.querySelector('#where').getBoundingClientRect(); return [r.left + Math.min(60, r.width / 2), r.top + r.height / 2] })()`), i: -1 } }
  const openCard = async (kind, label, k) => { const o = await opener(kind, k), n0 = (await tracks()).length, seq0 = await cdp.eval('HOME.seq'); await tap(o.pt); await cardSettle(label); await liftDone(); return { o, c: await cardNow(), n0, seq0 } }
  const liftDone = () => waitFor(async () => { const c = await cardNow(); return !c.cue || !c.cue.lift || c.cue.lift.done }, 'the lift to end', 60) // 44 d: the words settle back before anything is read
  const readCard = async label => {
    await cdp.eval('HOME.lamp(innerWidth * .7, innerHeight * .2)'); await sleep(300)
    const T = await cdp.eval('HOME.cardTexts()')
    await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'clear43'; s.textContent = '#card, #card * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; border-bottom-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }'; document.head.append(s) })()`)
    await sleep(120); const A = await shotNow(); await cdp.eval(`document.querySelector('#app').style.visibility = 'hidden'`); await sleep(120); const B = await shotNow()
    await cdp.eval(`document.querySelector('#app').style.visibility = ''; document.getElementById('clear43').remove()`); await sleep(80)
    const s = A.w / VP.w, bad = [], through = [], small = []; let least = 99
    for (const t of T) { const ink = t.color, a = (ink[3] ?? 1) * t.op, px = t.px * (Math.abs(t.z - 1) > .001 ? t.z : 1)
      if ((t.body && px < 15.95) || px < 11.95) small.push(`${t.t.slice(0, 30)} ${px.toFixed(1)}px`)
      for (const r of t.rects) { const ls = [], x0 = Math.floor(r[0] * s), y0 = Math.floor(r[1] * s), x1 = Math.ceil((r[0] + r[2]) * s), y1 = Math.ceil((r[1] + r[3]) * s)
        for (let y = Math.max(0, y0); y < Math.min(A.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(A.w, x1); x++) { const k = (y * A.w + x) * 4; ls.push([pLum([A.d[k], A.d[k + 1], A.d[k + 2]]), A.d[k], A.d[k + 1], A.d[k + 2]]) }
        if (!ls.length) continue; ls.sort((p, q) => p[0] - q[0]); const bg = ls[Math.min(ls.length - 1, Math.floor(ls.length * .99))].slice(1), cr = pRatio([0, 1, 2].map(j => ink[j] * a + bg[j] * (1 - a)), bg); least = Math.min(least, cr)
        if (cr < 4.5) bad.push(`“${t.t.slice(0, 26)}” ${cr.toFixed(2)}:1`); const d = pixDiff(A, B, VP.w, r); if (d.n) through.push(`“${t.t.slice(0, 26)}” ${d.n}px`) } }
    CARDS.lines += T.length; CARDS.least = Math.min(CARDS.least, least)
    check(T.length > 0 && !bad.length, `${label}: every text in the card (${T.length}) reads at AA against the rendered pixels behind it (least ${least.toFixed(2)}:1)`, bad.slice(0, 4).join(' | '))
    check(!through.length, `${label}: nothing of the stone shows through under its words (with the stone hidden, the same pixels)`, through.slice(0, 3).join(' | '))
    check(!small.length, `${label}: body text 16px and up, nothing under 12px`, small.slice(0, 4).join(' | ')) }
  const reachCard = async label => {
    const c0 = await cardNow(), sc = c0.scroll, scrolls = sc.height - sc.client > 2
    const sliced = await cdp.eval(`(() => { const e = document.querySelector('.card-slot > *'), r = e.getBoundingClientRect(), out = [], w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT)
      for (let n; (n = w.nextNode());) { if (!n.data.trim() || n.parentElement.closest('[hidden]')) continue; const q = document.createRange(); q.selectNodeContents(n); for (const b of q.getClientRects()) if (b.height && b.top < r.bottom - .5 && b.bottom > r.bottom + .5) out.push(n.data.trim().slice(0, 30)) } return out })()`)
    check(!sliced.length, `${label}: its words end on a whole line at the card's foot, none sliced`, sliced.slice(0, 2).join(' | '))
    check(sc.width <= sc.cw + 1, `${label}: nothing hides sideways (${sc.width} in ${sc.cw})`)
    check(c0.more === scrolls, `${label}: the foot ${scrolls ? 'comes to a point while there is more' : 'is flat: everything is in view'}`, `more ${c0.more}, scrolls ${scrolls}`)
    if (!scrolls) return
    const mid = await cdp.eval(`(() => { const r = document.querySelector('.card-slot > *').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.height] })()`)
    let last = -1; for (let k = 0; k < 40; k++) { const st = await cdp.eval(`document.querySelector('.card-slot > *').scrollTop`); if (st === last) break; last = st
      await cdp.send('Input.synthesizeScrollGesture', { x: mid[0], y: mid[1], yDistance: -Math.round(mid[2] * .7), gestureSourceType: 'touch', speed: 2400, preventFling: true }); await sleep(120) }
    await sleep(200)
    const end = await cdp.eval(`(() => { const e = document.querySelector('.card-slot > *'), r = e.getBoundingClientRect(), w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let last = null; for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement.getClientRects().length && !n.parentElement.closest('[hidden]')) last = n
      const q = document.createRange(); q.selectNodeContents(last); const b = [...q.getClientRects()].pop(); return { at: e.scrollTop + e.clientHeight >= e.scrollHeight - 1, lastIn: b.bottom <= r.bottom + 1 && b.top >= r.top - 1, more: HOME.card.more } })()`)
    check(end.at && end.lastIn && end.more === false, `${label}: touch drags scroll it to its last line, and there its foot is flat`, JSON.stringify(end))
    await cdp.eval(`document.querySelector('.card-slot > *').scrollTop = 0`); await sleep(150) }
  const CARDS = { lines: 0, least: 99 }
  const cardHold = async tag => {
    await reduceMotion(false); await open(''); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await settled(); await cdp.eval('HOME.still = true; document.activeElement && document.activeElement.blur()'); await sleep(300)
    await cdp.eval(`window.__T = []; document.addEventListener('home:track', e => window.__T.push(JSON.parse(JSON.stringify(e.detail))))`)
    const ideaK = HOME_IDEAS.findIndex(I => I.name === 'Context'), side = VP.id === 'side'
    await shot(`card-${VP.id}-rest.png`)
    for (const kind of ['idea', 'chain']) { // 12 Nov: no piece card; a facet of his work crosses (doorsHold)
      const label = `${tag} 43 c ${kind}`, before = await restPic()
      if (kind === 'idea') { await cdp.eval('HOME.cardClock = 0.4'); const o = await opener('idea', ideaK); await tap(o.pt); await waitFor(() => cdp.eval('HOME.card.open && Math.abs(HOME.card.t - .4) < .01'), 'mid-turn'); await sleep(200)
        const m = await cardNow(); check(m.motion === 'c' && /rotate3d/.test(m.transform), `${label}: part way, the facet is turning over (${m.transform.slice(0, 60)}…)`, m.transform)
        await shot(`card-${VP.id}-turn.png`); await cdp.eval('HOME.cardClock = null'); await cardSettle(label); await key('Escape'); await cardSettle(label, false); await cdp.eval('document.activeElement && document.activeElement.blur()'); await restPic() }
      const { o, c, n0, seq0 } = await openCard(kind, label, ideaK)
      const single = await cdp.eval(`document.querySelectorAll('#card.on').length === 1 && !!document.querySelector('.card-slot > #${kind === 'idea' ? 'tools' : 'why'}') && !document.querySelector('#piece, #back')`)
      check(c.open && c.kind === kind && c.on && c.mode && single && c.poly.every(([x, y]) => x >= -1 && y >= -1 && x <= VP.w + 1 && y <= VP.h + 1), `${label}: a touch opens it as one card, wholly on screen`, JSON.stringify({ open: c.open, kind: c.kind, single }))
      check(c.focusIn, `${label}: focus goes into the card`, await focusName())
      const T = await tracks(), t = T[T.length - 1]
      if (kind === 'idea') check(T.length === n0 + 1 && t.name === 'tools_open' && t.params.idea === 'Context' && t.params.via === 'facet' && Object.keys(t.params).length === 2, `${label}: tools_open { idea, via: facet }, as before`, JSON.stringify(t))
      if (kind === 'chain') check(T.length === n0 + 1 && t.name === 'line_open' && 'phase' in t.params && Object.keys(t.params).length === 1, `${label}: line_open { phase }, as before`, JSON.stringify(t))
      if (kind === 'chain') await sleep(3200) // the readings it lights as it opens (36 c's echo) have faded
      await shot(`card-${VP.id}-${kind}.png`)
      await readCard(label); await reachCard(label)
      for (const how of side ? ['mark', 'escape'] : ['mark', 'outside', 'escape', 'facet']) {
        const cc = how === 'mark' ? c : (await openCard(kind, label, ideaK)).c
        if (how === 'mark') { const x = await cdp.eval(`(() => { const r = document.querySelector('#card .card-x').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`); await sleep(420); await tap(x) }
        if (how === 'outside') { const p = await cdp.eval('HOME.outsidePoint()'); if (!p) { check(false, `${label}: a place on the stone outside the card`); await key('Escape'); await cardSettle(label, false); continue } await tap(p) }
        if (how === 'escape') await key('Escape')
        if (how === 'facet') { const p = kind === 'chain' ? (await opener('chain')).pt : await cdp.eval('HOME.cardPoint()'); if (!p) { check(false, `${label}: the facet that spoke keeps a place for a finger beside the card`, JSON.stringify(cc.rect)); await key('Escape'); await cardSettle(label, false); continue } await tap(p) }
        await cardSettle(`${label} ${how}`, false)
        const c2 = await cardNow(), fz = await focusName(), want = kind === 'chain' ? '#where' : 'body'
        await cdp.eval('document.activeElement && document.activeElement.blur()') // the focus is checked here; the rest state is compared without its ring
        check(!c2.open && c2.closes.length && c2.closes.at(-1).how === how && c2.closes.at(-1).kind === kind, `${label}: ${how === 'mark' ? 'its close mark' : how === 'outside' ? 'a touch on the stone outside it' : how === 'escape' ? 'Escape' : kind === 'chain' ? 'the line again' : 'the same facet again'} closes it`, JSON.stringify(c2.closes.at(-1)))
        check(fz === want, `${label}: after ${how}, the focus is back where it came from (${want})`, fz)
        sameRest(before, await restPic(), `${label} after ${how}`) } }
    if (!side) { // one at a time, and the key's way in
      { const label = `${tag} 43 c one`; await openCard('idea', label, ideaK); const w = await opener('chain'); await tap(w.pt); await cardSettle(label)
        const s = await cdp.eval(`({ c: HOME.card, open: HOME.open, n: document.querySelectorAll('#card.on').length, tools: document.querySelector('#tools').closest('.card-slot') ? 'in' : 'out' })`)
        check(s.c.kind === 'chain' && s.open === -1 && s.n === 1 && s.tools === 'out', `${label}: the line over an open idea closes the idea first; one card`, JSON.stringify({ kind: s.c.kind, open: s.open, n: s.n, tools: s.tools }))
        await key('Escape'); await cardSettle(label, false); await cdp.eval('document.activeElement && document.activeElement.blur()') }
      { const label = `${tag} 43 c key`, n0 = (await tracks()).length; await cdp.eval(`document.querySelector('#keys button[data-k="${ideaK}"]').focus()`); await key('Enter'); await cardSettle(label)
        const c = await cardNow(), T = await tracks(), t = T[T.length - 1]
        check(c.kind === 'idea' && c.focusIn && T.length === n0 + 1 && t.name === 'tools_open' && t.params.via === 'key', `${label}: its key opens the idea as the card, focus inside, tools_open { via: key }`, JSON.stringify(t))
        await key('Escape'); await cardSettle(label, false); const f = await focusName(); check(f === 'key ' + ideaK, `${label}: Escape closes it and the focus is back on its key`, f); await cdp.eval('document.activeElement.blur()') }
      { const label = `${tag} 43 c reduced motion`; await reduceMotion(true); await open(''); await cdp.eval('HOME.still = true'); const before = await restPic()
        await cdp.eval('HOME.cardClock = 0.5'); const o = await opener('idea', ideaK); await tap(o.pt); await waitFor(() => cdp.eval('HOME.card.open && Math.abs(HOME.card.t - .5) < .01'), 'half way')
        const m = await cardNow(); check(m.motion === 'fade' && m.transform === 'none' && m.opacity > .3 && m.opacity < .7, `${label}: half way it is a crossfade (opacity ${m.opacity}, nothing turns)`, JSON.stringify({ motion: m.motion, transform: m.transform, opacity: m.opacity }))
        await cdp.eval('HOME.cardClock = null'); await cardSettle(label); await key('Escape'); await cardSettle(label, false); sameRest(before, await restPic(), `${label} after Escape`); await reduceMotion(false) } }
    await cdp.eval('HOME.still = false')
    await cueHold(tag) }
  /* 44 a with d (13 Nov, Kahran: "i think i like something a and d"): the card says there is more. Carried from studies/44/check.mjs, run on
     both phone screens for each of the six ideas and the chain:
       qfacet  while words lie below the room, the point is a facet: drawn, standing at cue-contrast or better against the card's ground (its
               ink computed, and its rendered pixels over plain ground, the cue shown then hidden), its button at least 44px and labelled
       qpage   one press on it (and, for Context and the chain, its key by Shift+Tab then Enter, and Page Down in the card) turns exactly one
               whole-line screenful: the first line not wholly seen becomes the top, no line cut at the top or the foot; at the end no cue
       qfits   with everything in view (the words cut short after it opened), no cue and no button
       qlift   as it settles open the words lift once (by the hidden next line) and come back to the start; a re-snap does not lift them again;
               under reduced motion they never lift
       qwords  no words in the cue: the button's only name is its screen-reader label, no text in the cut (and at 1440x900 none of it: deskNoCard) */
  const scroller = `document.querySelector('.card-slot > *')`
  const cueState = () => cdp.eval(`(() => { const e = ${scroller}, c = HOME.card, g = document.querySelector('#card g.cue'), b = document.querySelector('#card .card-more'), r = b.getBoundingClientRect()
    const r0 = e.getBoundingClientRect().top, wk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let last = 0; for (let n; (n = wk.nextNode());) if (n.data.trim()) { const q = document.createRange(); q.selectNodeContents(n); for (const x of q.getClientRects()) if (x.height) last = Math.max(last, x.bottom - r0 + e.scrollTop) }
    return { top: e.scrollTop, more: last - e.scrollTop - e.clientHeight > 1, cue: c.cue, drawn: g ? g.querySelectorAll('.cue-facet').length : 0, btn: !b.hidden && b.getClientRects().length > 0, bw: r.width, bh: r.height,
      label: b.getAttribute('aria-label') || '', btext: b.textContent, gtext: g ? g.textContent + g.querySelectorAll('text').length : '' } })()`)
  const wholeLines = () => cdp.eval(`(() => { const e = ${scroller}, top = e.getBoundingClientRect().top, st = e.scrollTop, room = e.clientHeight, L = []
    const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.height) L.push([q.top - top + st, q.bottom - top + st]) } else n.childNodes.forEach(walk) }
    walk(e); const vis = L.filter(([t, b]) => b > st + .5 && t < st + room - .5)
    return { st, room, sliced: vis.filter(([t, b]) => t < st - 1 || b > st + room + 1).length, first: vis.length ? Math.min(...vis.map(([t]) => t)) : null, firstUnseen: (L.filter(([t, b]) => b > st + room + .5).sort((a, b) => a[0] - b[0])[0] || [null])[0] } })()`)
  const quietTop = async () => { let last = null; for (let i = 0; i < 40; i++) { const t = await cdp.eval(`${scroller}.scrollTop`); if (t === last) return t; last = t; await sleep(90) } return last }
  const cuePixels = async () => { // the cue's own pixels against the card's ground: the frame with it, the frame without it
    await cdp.eval('HOME.lamp(innerWidth * .7, innerHeight * .2)'); await sleep(300); const A = await shotNow()
    await cdp.eval(`(() => { const s = document.createElement('style'); s.id = 'hide44'; s.textContent = '#card g.cue { visibility: hidden !important; }'; document.head.append(s) })()`); await sleep(120)
    const B = await shotNow(); await cdp.eval(`document.getElementById('hide44').remove()`); await sleep(80)
    const c = await cardNow(), gr = (/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c.ground.split('),').pop()) || []).slice(1).map(Number), [x, y, w, h] = c.rect, s = A.w / VP.w, R = []
    for (let py = Math.max(0, Math.floor(y * s)); py < Math.min(A.h, Math.ceil((y + h) * s)); py++) for (let px = Math.max(0, Math.floor(x * s)); px < Math.min(A.w, Math.ceil((x + w) * s)); px++) {
      const k = (py * A.w + px) * 4, a = [A.d[k], A.d[k + 1], A.d[k + 2]], b = [B.d[k], B.d[k + 1], B.d[k + 2]]
      if (Math.max(...a.map((v, j) => Math.abs(v - b[j]))) <= 2) continue // not the cue
      if (gr.length === 3 && pRatio(b, gr) > 1.15) continue // over words or the rim: only its pixels over plain ground are measured
      R.push(pRatio(a, gr.length === 3 ? gr : b)) }
    R.sort((p, q) => p - q); return { n: R.length, p90: R.length ? R[Math.floor(R.length * .9)] : 0, gr } }
  const CUE = { cards: 0, pages: 0, lifts: 0, worst: 99 }
  const cueHold = async tag => {
    const need = Number(DEF['cue-contrast']), side = VP.id === 'side'
    await reduceMotion(false); await open(''); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); await settled(); await cdp.eval('HOME.still = true; document.activeElement && document.activeElement.blur()'); await sleep(300)
    const kinds = [...HOME_IDEAS.map((I, k) => ['idea', k, I.name]), ['chain', -1, 'the chain']]
    for (const [kind, k, name] of kinds) {
      const label = `${tag} 44 ${name}`, full = name === 'Context' || kind === 'chain', lifts0 = await cdp.eval('HOME.cueLifts || 0')
      const o = await opener(kind, k); if (!o || !o.pt) { check(false, `${label}: a place to open it`); continue }
      await tap(o.pt); await cardSettle(label); if (kind === 'chain') await sleep(3200); await liftDone(); CUE.cards++
      const c0 = await cardNow(), s0 = await cueState(), scrolls = s0.more, L = c0.cue && c0.cue.lift
      // qlift: once on open, back at the start
      check(scrolls ? !!L && L.peak >= 8 && L.done === true && c0.scroll.top === 0 && (await cdp.eval('HOME.cueLifts || 0')) - lifts0 === 1 : !L, `${label}: ${scrolls ? `as it opened the words lifted once (${L && L.peak}px, the hidden next line) and came back to the start` : 'everything in view: the words did not lift'}`, JSON.stringify({ scrolls, lift: L, top: c0.scroll.top }))
      if (L) CUE.lifts++
      await cdp.eval('HOME.cardResnap()'); await sleep(1300); const c1 = await cardNow()
      check((await cdp.eval('HOME.cueLifts || 0')) - lifts0 === (scrolls ? 1 : 0) && c1.scroll.top === 0, `${label}: a re-snap does not lift the words again`, JSON.stringify({ lifts: (await cdp.eval('HOME.cueLifts || 0')) - lifts0, top: c1.scroll.top }))
      // qwords
      check(!s0.btext.trim() && !s0.gtext.replace(/0$/, '').trim() && s0.gtext.endsWith('0') && /\S/.test(s0.label), `${label}: no words in the cue: its button is named for a screen reader only (“${s0.label}”)`, JSON.stringify({ text: s0.btext, cut: s0.gtext, label: s0.label }))
      // qfacet
      if (scrolls) { const ink = c0.cue && c0.cue.ink, P = await cuePixels(), inkR = ink && P.gr.length === 3 ? pRatio(ink, P.gr) : 0; CUE.worst = Math.min(CUE.worst, P.p90)
        check(s0.cue && s0.cue.shown && s0.drawn === 1 && s0.btn && s0.bw >= 44 && s0.bh >= 44 && /\S/.test(s0.label), `${label}: words lie below: the point is a facet, its button ${s0.bw}x${s0.bh}px and labelled`, JSON.stringify({ shown: s0.cue && s0.cue.shown, drawn: s0.drawn, btn: s0.btn, w: s0.bw, h: s0.bh, label: s0.label }))
        check(inkR >= need - .005 && P.n >= 20 && P.p90 >= need - .05, `${label}: the facet stands against the card's ground at ${need}:1 or better (its ink ${inkR.toFixed(2)}:1; rendered, ${P.p90.toFixed(2)}:1 at the 90th percentile of ${P.n} pixels over plain ground)`, `ink ${inkR.toFixed(2)}, pixels ${P.p90.toFixed(2)} of ${P.n}`)
        if (kind === 'idea' && k === HOME_IDEAS.findIndex(I => I.name === 'Context') && !side) await shot('cue-phone-top.png') }
      else check(!s0.btn && !s0.drawn, `${label}: everything in view: no cue, no button`, JSON.stringify(s0))
      // qpage
      if (scrolls) for (const via of full ? ['tap', 'key', 'pagedown'] : ['tap']) {
        await cdp.eval('HOME.cardResnap()'); await sleep(200); let ok = true, why = '', n = 0
        for (; n < 30; n++) { const a = await cueState(); if (!a.more) break; const w0 = await wholeLines(); CUE.pages++
          if (via === 'tap') { const b = await cdp.eval(`(() => { const r = document.querySelector('#card .card-more').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`); await tap(b) }
          else if (via === 'key') { await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await key('Tab', { modifiers: 8 }); const f = await cdp.eval('document.activeElement && document.activeElement.className'); if (f !== 'card-more') { ok = false; why = 'Shift+Tab from the card lands on ' + f; break } await key('Enter') }
          else { await cdp.eval(`${scroller}.focus({ preventScroll: true })`); await key('PageDown') }
          await sleep(150); await quietTop(); const w1 = await wholeLines()
          if (n === 0 && via === 'tap' && kind === 'idea' && k === HOME_IDEAS.findIndex(I => I.name === 'Context') && !side) await shot('cue-phone-page.png')
          if (w1.st <= w0.st + 1) { ok = false; why = `page ${n + 1}: did not move (${w0.st} → ${w1.st})`; break }
          if (w1.sliced) { ok = false; why = `page ${n + 1}: ${w1.sliced} line(s) cut at the top or the foot`; break }
          if (w0.firstUnseen == null || Math.abs(w1.first - w0.firstUnseen) > 1.5) { ok = false; why = `page ${n + 1}: the new top ${w1.first} is not the first line not wholly seen before (${w0.firstUnseen})`; break } }
        const e = await cueState(), pe = e.more ? null : await cuePixels()
        check(ok && n > 0 && !e.more && !e.btn && !e.drawn && pe.n === 0, `${label}: ${via === 'tap' ? 'a press on its facet' : via === 'key' ? 'its key (Shift+Tab, Enter)' : 'Page Down in the card'} turns one whole-line screenful at a time to the end (${n}), and there the cue is gone`, why || JSON.stringify({ n, more: e.more, btn: e.btn, drawn: e.drawn, pixels: pe && pe.n })) }
      // qfits: the words cut short, everything in view
      if (scrolls) { await cdp.eval(`(() => { const e = ${scroller}; e.scrollTop = 0; window.__cut44 = []; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), T = []; for (let n; (n = w.nextNode());) if (n.data.trim()) T.push(n)
          for (const n of T.reverse().slice(0, -1)) { if (e.scrollHeight <= e.clientHeight - 4) break; window.__cut44.push([n, n.data]); n.data = '' }
          [...e.querySelectorAll('svg, canvas, img')].forEach(n => { if (e.scrollHeight > e.clientHeight - 4) { window.__cut44.push([n, null, n.style.display]); n.style.display = 'none' } }) })()`)
        await cdp.eval('HOME.cardResnap()'); await sleep(200); const f = await cueState()
        check(!f.more && !f.btn && !f.drawn && !(f.cue && f.cue.shown), `${label}: everything in view: no cue and no button`, JSON.stringify({ more: f.more, btn: f.btn, drawn: f.drawn })) }
      await key('Escape'); await cardSettle(label, false); await cdp.eval(`(window.__cut44 || []).forEach(([n, d, v]) => d == null ? (n.style.display = v) : (n.data = d)); window.__cut44 = []; document.activeElement && document.activeElement.blur()`) }
    { const label = `${tag} 44 reduced motion`; await reduceMotion(true); await open(''); await cdp.eval('HOME.still = true'); const lifts0 = await cdp.eval('HOME.cueLifts || 0'), ideaK = HOME_IDEAS.findIndex(I => I.name === 'Context')
      const o = await opener('idea', ideaK); await tap(o.pt); await cardSettle(label); await sleep(1300); const c = await cardNow(), s = await cueState()
      check(s.more && !(c.cue && c.cue.lift) && (await cdp.eval('HOME.cueLifts || 0')) === lifts0 && c.scroll.top === 0 && s.btn, `${label}: the words never lift; the facet is there`, JSON.stringify({ more: s.more, lift: c.cue && c.cue.lift, top: c.scroll.top, btn: s.btn }))
      await key('Escape'); await cardSettle(label, false); await reduceMotion(false); await cdp.eval('HOME.still = false') } }
  /* and at 1440x900, nothing of the card: the idea's panel and the chain as they were (the floating piece retired 12 Nov) */
  const deskNoCard = async tag => { await open(''); await cdp.eval('HOME.whyReady().then(() => HOME.hereFor()).then(() => true)'); const out = []
    const at = await cdp.eval('HOME.tapIdea(0)'); await tap(at.pt); await sleep(500); out.push(await cdp.eval(`({ idea: document.querySelector('#tools').classList.contains('on') && document.querySelector('#tools').parentElement === document.body, card: !!document.querySelector('#card.on') })`)); await key('Escape')
    await tapEl('#where'); await waitFor(() => cdp.eval(`document.body.classList.contains('why')`), 'the chain', 100); await sleep(500); out.push(await cdp.eval(`({ chain: document.querySelector('#why').parentElement.id === 'app', card: !!document.querySelector('#card.on') })`))
    check(out.length === 2 && out.every(o => !o.card && (o.idea ?? o.chain)), `${tag}: on a desktop nothing opens as a card: the idea's panel and the chain are as they were`, JSON.stringify(out))
    const q = await cdp.eval(`({ btn: (() => { const b = document.querySelector('#card .card-more'); return !!b && !b.hidden && b.getClientRects().length > 0 })(), cue: document.querySelectorAll('#card g.cue *').length, state: HOME.card.cue, lifts: HOME.cueLifts || 0 })`)
    check(!q.btn && !q.cue && !q.state && !q.lifts, `${tag}: and none of 44's cue: no facet, no button, no lift`, JSON.stringify(q)) }
  /* 12 Nov, the doors (Kahran: "I want the facets to just take you to other poems … The cards can just be the context cards"). Every facet
     that is not an idea, the title or the date, tapped once from rest, crosses at once to exactly its plan's pair: the first state after the
     tap is the crossing, expecting that pair, and it lands there. And nothing of its piece is on the page, at the tap or through the
     crossing: no #piece or #back, no card open, and no text anywhere outside the parts the home always has (the poem, the mat, the caption,
     the date, the switch, the chain, the idea panel, the keys). The glimpse needs no reader of its own: drawWorld paints one only at rest,
     and the door leaves rest at once */
  const PIECE = `(() => { const KNOWN = '#read, #mat, #cap, #year, .vs, #why, #tools, #keys, #idea, noscript, script, style', out = [], on = !!document.querySelector('#card.on')
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n; (n = tw.nextNode());) { if (!n.data.trim()) continue; const p = n.parentElement; if (p.closest(KNOWN) || (!on && p.closest('#card'))) continue; out.push(n.data.trim().slice(0, 40)) }
    const c = HOME.card; return { foreign: out, card: !!(c.open || c.kind || on), el: !!document.querySelector('#piece, #back'), at: HOME.at, busy: HOME.busy, expect: HOME.expect, key: HOME.world && HOME.world.key } })()`
  const doorsHold = async (label, plans, q = '') => {
    const ids = plans.map((p, i) => p && p.to ? i : -1).filter(i => i >= 0), wrong = [], shown = [], lands = []; let shotDone = false
    const arrive = async () => { await open(q); if (q) await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200) }
    for (const i of ids) { const want = plans[i].to; await arrive(); await park()
      const pt = await cdp.eval(`HOME.tapPoint(${i}, true)`); if (!pt) { wrong.push(`#${i}: no place to tap clear of the door lines: a dead facet`); continue } // a door line's row is its door's, at home too
      const from = await cdp.eval('HOME.world.key'), t0 = Date.now(); await tapAt(pt[0], pt[1]); doorsN++
      let first = null, last = null, bad = null
      while (Date.now() - t0 < 25000) { const s = await cdp.eval(PIECE); last = s
        if (!bad && (s.foreign.length || s.card || s.el)) bad = s
        if (!first && s.busy) first = { ...s, ms: Date.now() - t0 }
        if (first && !shotDone && SHOTS && Date.now() - t0 > first.ms + 700) { shotDone = true; await shot(`door-${VP.id}-mid.png`) }
        if (!s.busy && s.at === 'world' && s.key !== from) break
        if (!first && Date.now() - t0 > 1500) break
        await sleep(40) }
      if (!first || first.expect !== want || first.ms > 1200) wrong.push(`#${i}: ${first ? 'crossed toward ' + first.expect + ' after ' + first.ms + 'ms' : 'did not cross'}, its pair ${want}`)
      else if (!last || last.key !== want) lands.push(`#${i}: ${last && last.busy ? 'still crossing after 25s' : 'came to rest on ' + (last && last.key + ' (' + last.at + ')')}, its pair ${want}`)
      if (bad) shown.push(`#${i}: ${bad.el ? 'a piece element' : bad.card ? 'a card' : 'text “' + bad.foreign[0] + '”'}`) }
    check(ids.length > 0 && !wrong.length && !lands.length, `${label}: each of ${ids.length} facets of his work, tapped once from rest, crosses at once to exactly its plan's pair`, [...wrong, ...lands].slice(0, 4).join(' | '))
    check(ids.length > 0 && !shown.length, `${label}: and nothing of its piece is on the page, at the tap or through the crossing (no piece, no card, no text beyond the home's own)`, shown.slice(0, 4).join(' | '))
    await arrive() }
  /* and nothing at rest changed: with REST_REF=<commit> the home at rest is that commit's, pixel for pixel (REST_REF=d25ea66 is the home the
     day of the ruling, its pieces still on: passed 12 Nov, and red under MUTATE=drest). It reads the old home from git history, which a clean
     copy does not have and which stops being the right answer the day rest changes on purpose, so it is asked for, not standing */
  const REST_REF = process.env.REST_REF || ''
  const refBytes = Object.fromEntries([['/', 'index.html'], ['/v3/stone.js', 'v3/stone.js'], ['/v3/stone.css', 'v3/stone.css'], ['/v3/defaults.json', 'v3/defaults.json']]
    .map(([u, f]) => { const r = REST_REF ? spawnSync('git', ['show', REST_REF + ':' + f], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }) : { status: 1 }; return [u, r.status === 0 ? r.stdout : null] }))
  const restShot = async () => { await settled(); await park(); await cdp.eval('HOME.still = true; document.activeElement && document.activeElement.blur && document.activeElement.blur()')
    await cdp.eval('HOME.lamp(innerWidth * .7, innerHeight * .2)'); await sleep(1300); await cdp.eval('HOME.ground()'); await sleep(250); return shotNow() }
  const restSame = async tag => { if (!REST_REF) return; if (Object.values(refBytes).some(v => v == null)) return check(false, `${tag}: ${REST_REF}'s home, to compare the rest state against`)
    for (const [u, b] of Object.entries(refBytes)) OVER.set(u, b); REFLOAD = true
    try { await open(''); var A = await restShot() } finally { for (const u of Object.keys(refBytes)) OVER.delete(u); REFLOAD = false }
    await open(''); const B = await restShot(), d = pixDiff(A, B, VP.w)
    check(d.n <= 40, `${tag}: at rest the home is ${REST_REF}'s, pixel for pixel (nothing at rest changed with the doors)`, `${d.n} pixels differ (max ${d.max}), first at ${d.first}`)
    await cdp.eval('HOME.still = false') }
  for (const vp of VIEWPORTS) {
    await view(vp); await reduceMotion(false); errors.length = 0; const tag = `${vp.w}x${vp.h}`
    if (process.env.CARDS === 'only') { if (vp.mobile) await cardHold(tag); else await deskNoCard(tag); continue } // a narrow run: the card's checks alone
    const first = await open('')
    const p0 = await cdp.eval('({ how: HOME.how, world: HOME.world, iso: new Date().toISOString().slice(0, 10), where: document.getElementById("where").innerText, hour: new Date().getHours() })')
    const TODAY = '2026-11-08', T0 = truthFor(TODAY, READING, DAYS)
    check(p0.how === 'live' && p0.hour === 16 && p0.world.mode === 'home' && p0.world.photo === T0.photos[0] && p0.world.slug === T0.poems[0], `${tag}: under the pinned clock and sky the stone is today's pair, as pick.js picks it (${p0.world.slug}, ${p0.world.photo.replace('/photos/', '')})`, JSON.stringify(p0))
    { const paths = first.map(f => f[0]), regs = paths.filter(u => u.startsWith('/v3/regions/')), photos = paths.filter(u => u.startsWith('/photos/'))
      const total = first.reduce((s, f) => s + f[2], 0), pic = first.filter(f => f[0].startsWith('/photos/')).reduce((s, f) => s + f[2], 0)
      if (vp.id === 'phone') weight = { total, pic, files: first.length, rest: total - pic }
      const late = ['/v3/here.js', '/poems/related.js', '/v2/flow.js', '/v3/poem-years.json', '/v3/why.js', '/v3/body.js'].filter(u => paths.includes(u))
      check(!paths.includes('/v3/segments.json') && !paths.some(u => /regions\.json$/.test(u)) && regs.length === 1 && photos.length === 1 && !late.length && total - pic < 300 * 1024,
        `${tag}: the first screen is quick: ${first.length} files, ${Math.round((total - pic) / 1024)} KB gzipped before the photograph's ${Math.round(pic / 1024)} KB; one photograph and its regions, no segments.json, nothing an idea's facet or the chain reads`, JSON.stringify({ regs, photos, kb: Math.round((total - pic) / 1024) })) }
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
    await doorsHold(`${tag} home`, plans) // 12 Nov: each facet of his work is a door, and nothing of its piece shows
    await restSame(tag)

    // 38 c: the date facet, and the flight into the years
    { const s = await cdp.eval('HOME.state'), w = await cdp.eval('HOME.world'), rec = XJ.photos.find(p => p.src === w.photo), d = taken(path.join(ROOT, w.photo)), want = MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4)
      const P = s.cells[s.year] || [], b = s.yearBox, corners = [[b[0], b[1]], [b[0] + b[2], b[1]], [b[0], b[1] + b[3]], [b[0] + b[2], b[1] + b[3]]]
      const hit = [['poem', s.poem], ['name', s.mat], ['caption', s.cap], ['tab', s.vs]].filter(([, r]) => r[2] > 0 && meet(b, r)).map(([k]) => k)
      check(s.year >= 0 && !s.ideas.some(x => x.i === s.year) && s.yearOn && s.yearText === want && corners.every(c => inPoly(c, P)) && !hit.length && s.yearPlan.basis.taken === d,
        `${tag}: the photograph's own facet holds its EXIF month and year (${want}), inside the facet, clear of the poem, the name, the caption and the tab, no idea's facet`, JSON.stringify({ year: s.year, ideas: s.ideas.map(x => x.i), text: s.yearText, hit, corners: corners.map(c => inPoly(c, P)) }))
      if (vp.id !== 'side') {
        const key0 = w.key, pt = await reach('#year a'); if (pt) await tap(pt)
        const ab = await waitFor(() => cdp.eval(`HOME.about && HOME.about.at === 'about' && HOME.about.lift && !HOME.busy && HOME.about`), 'the years', 200).catch(() => null)
        await sleep(300); await shot(`years-${vp.id}.png`)
        const inRow = ab && await cdp.eval(`(() => { const f = document.getElementById('about'), d = f.contentDocument, l = d.querySelector('.home-lift'), r = l && l.getBoundingClientRect(); return !!l && l.closest('.yr').dataset.y === ${JSON.stringify(rec.row)} && r.top < innerHeight && r.bottom > 0 && l.querySelector('img').getAttribute('src') === ${JSON.stringify(w.photo)} })()`)
        check(!!pt && !!ab && ab.src === YEARS && ab.row === rec.row && inRow, `${tag}: tapping the date flies the photograph into its year (${rec.row}) in the About's years, in view`, JSON.stringify({ pt, ab }))
        await cdp.eval('history.back()'); const back = await waitFor(() => cdp.eval(`HOME.at === 'stone' && document.getElementById('ph').hidden && HOME.world.key`), 'home again', 100).catch(() => null)
        check(back === key0, `${tag}: the browser's back brings it home to the same stone`, String(back)) } }

    // 41 b and 42 a on the live page: nothing named at rest; each idea's facet opens this world first and largest, the general beneath, read live
    const home = await cdp.eval('HOME.doors.map(d => d.to)')
    for (const wk of [null, home[0]]) {
      const label = `${tag} ${wk ? 'world ' + wk : 'home'}`
      if (wk) await open('?w=' + encodeURIComponent(wk))
      const s = await cdp.eval('HOME.state'), wkey = await cdp.eval('HOME.world.key')
      const want = P42.expected({ ...M0, readAt: await readAtOf(), src: '/photos/' + wkey.split('~')[1], slug: wkey.split('~')[0], mode: wk ? 'world' : 'home' })
      check(s.ideas.length === 6 && new Set(s.ideas.map(x => x.i)).size === 6 && s.kinds.filter(k => k === 'idea').length === 6 && !s.ideas.some(x => x.i === s.year), `${label}: six facets hold the six ideas, none the date's`, JSON.stringify(s.ideas.map(x => x.i)))
      await rested(label)
      const wrong = [], clash = [], aa = [], covered = []
      for (const [k, I] of IDEAS42.entries()) {
        const at = await cdp.eval(`HOME.tapIdea(${k})`); if (!at || !at.pt) { wrong.push(`${I.name}: no place to tap`); continue }
        await tap(at.pt)
        const ok = await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.openAt === ${at.i} && HOME.hereReadyNow`), 'idea ' + I.name, 250, 60).catch(() => null)
        if (!ok) { wrong.push(`${I.name}: its facet ${at.i} did not open it with this world's words`); await key('Escape'); continue }
        await sleep(380); if (vp.mobile) await cdp.eval('HOME.finishCard(); HOME.cardResnap()')
        const st = await panelNow()
        wrong.push(...panelWrong(I, st, want[I.name] || [], s.ideas.find(x => x.k === k)))
        if (!vp.mobile) { clash.push(...panelClash(I.name, st.box, s)) // 43 c: on a phone the idea is the card, which lies over the poem by design; its placement, contrast and closing are cardHold's
          const c = await contrast(); aa.push(c.r); if (c.r < 4.5) wrong.push(`${I.name}: ${c.sel} reads ${c.r}:1 against the stone under it`) }
        if (!wk && vp.id !== 'side') await shot(`idea-${vp.id}-${I.name.toLowerCase().replace(/ /g, '-')}.png`)
        // the same facet again opens its first tool
        const at2 = await cdp.eval(`HOME.tapIdea(${k}, true)`)
        if (vp.mobile) { const p2 = await cdp.eval('HOME.cardPoint()') // 43 c: on a phone the same facet again closes the card (its tools open in it)
          if (p2) { await tap(p2); await cardSettle(I.name + ' again', false).catch(() => null); const two = await cdp.eval('({ open: HOME.open, card: HOME.card.open })'); if (two.open !== -1 || two.card) wrong.push(`${I.name}: the same facet again did not close its card (${JSON.stringify(two)})`)
            await tap(at.pt); await cardSettle(I.name + ' reopened').catch(() => null) } else covered.push(I.name) }
        else if (at2 && at2.pt) { await tap(at2.pt); await sleep(200)
          const two = await cdp.eval(`({ open: HOME.open, opened: [...document.querySelectorAll('#tools li > button[aria-expanded="true"]')].map(b => b.textContent) })`)
          if (!(two.open === k && two.opened.join('|') === I.parts[0])) wrong.push(`${I.name}: a second tap on its facet did not open its first tool (${JSON.stringify(two)})`) }
        else covered.push(I.name)
        const at0 = await cdp.eval('HOME.at + "|" + HOME.world.key')
        const free = vp.mobile ? await cdp.eval('HOME.outsidePoint()') : await cdp.eval(`(() => { const r = document.querySelector('#tools').getBoundingClientRect(), mine = ${at.i}, cs = HOME.state.cells, inP = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
          for (const [x, y] of [[innerWidth / 2, 6], [innerWidth - 8, innerHeight / 2], [8, innerHeight / 2], [innerWidth / 2, innerHeight - 6], [innerWidth - 8, 8], [8, 8]]) if ((x < r.left || x > r.right || y < r.top || y > r.bottom) && !document.elementFromPoint(x, y).closest('a, button, .verse') && !inP([x, y], cs[mine])) return [x, y]; return null })()`)
        if (free) { await tap(free); await sleep(vp.mobile ? 900 : 250)
          const after = await cdp.eval('({ open: HOME.open, at: HOME.at + "|" + HOME.world.key, busy: HOME.busy })')
          if (after.open !== -1 || after.at !== at0 || after.busy) wrong.push(`${I.name}: a touch elsewhere ${after.open !== -1 ? 'left it open' : 'moved the stone to ' + after.at}`) }
        else await key('Escape') }
      check(!wrong.length, `${label}: each facet opens its own idea: this world first and largest, word for word as recounted, the general beneath read live (marked), the basis line, whole lines; the next tap opens its first tool; a touch elsewhere only closes it; AA against the pixels under it (worst ${Math.min(...aa).toFixed(1)}:1)`, wrong.slice(0, 3).join(' | '))
      if (covered.length) console.log(`note ${label}: the open panel covers the whole of ${covered.join(', ')}'s facet; deeper is in the panel`)
      check(!clash.length, `${label}: an open idea keeps clear of the poem, the name, the where line, the nav and the switch, on the screen`, clash.slice(0, 3).join(', '))
      const txt = await cdp.eval('document.body.innerText + " " + [...document.querySelectorAll("#keys button")].map(b => b.getAttribute("aria-label")).join(" ")')
      check(!BANNED.test(txt), `${label}: the system's working name never shows`)
      if (!wk) await keyboard(label)
      if (wk && vp.id === 'desk') { // B9: a crossing with an idea open closes it, and what opens next is the new world's
        await cdp.eval(`document.querySelector('#keys button[data-k="0"]').focus()`); await key('Enter'); await waitFor(() => cdp.eval('HOME.open === 0 && HOME.hereReadyNow'), 'Context open', 100)
        const from = await cdp.eval('HOME.world.key'); await cdp.eval(`(() => { const d = [...document.querySelectorAll('.verse .l.shown .door')][0]; d.focus(); d.click() })()`)
        await waitFor(() => cdp.eval(`HOME.at === 'world' && !HOME.busy && HOME.world.key !== ${JSON.stringify(from)} && HOME.world.arrived`), 'crossed', 200)
        const after = await cdp.eval(`({ open: HOME.open, on: document.querySelector('#tools').classList.contains('on'), exp: [...document.querySelectorAll('#keys button')].map(b => b.getAttribute('aria-expanded')).join(''), key: HOME.world.key })`)
        await cdp.eval(`document.querySelector('#keys button[data-k="0"]').focus()`); await key('Enter'); await waitFor(() => cdp.eval('HOME.open === 0 && HOME.hereReadyNow'), 'Context open again', 100); await sleep(300)
        const st = await panelNow(), w2 = P42.expected({ ...M0, readAt: await readAtOf(), src: '/photos/' + after.key.split('~')[1], slug: after.key.split('~')[0], mode: 'world' })
        check(after.open === -1 && !after.on && after.exp === 'falsefalsefalsefalsefalsefalse' && st.here.join(' ') === w2['Context'].join(' '), `${label}: crossing with an idea open closes it; opened again, it speaks of the new world (${after.key})`, JSON.stringify({ after, here: st.here }))
        await key('Escape') }
    }

    // the title, and the home read
    { await open(''); await settled(); await park(); await cdp.eval('HOME.still = true'); await sleep(400)
      await titleHold(`${tag} home`); await seamHold(`${tag} home`); await cdp.eval('HOME.still = false')
      if (vp.id === 'desk') { await open('?w=' + encodeURIComponent(home[0])); await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200); await park(); await cdp.eval('HOME.still = true'); await sleep(400)
        await titleHold(`${tag} world ${home[0]}`); await seamHold(`${tag} world ${home[0]}`); await cdp.eval('HOME.still = false') }
      await reads(tag); await titleTaps(`${tag} home`) }

    // 34 b, opened from the line (36 c): every number recounted, every label re-run
    { await open(''); await settled(); const L = `${tag} 34 b`
      await openWhy(); await sleep(D('why-ms') + 200); await cdp.eval('HOME.finishCard(); HOME.cardResnap()')
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
      const before = s.stone.key, pt = vp.mobile ? await cdp.eval('HOME.outsidePoint()') : await scrimPt(vp) // 43 c: on a phone no scrim; a touch on the stone outside the card closes it
      if (pt) await tapAt(...pt); await sleep(FADE + 500)
      const after = await cdp.eval(`({ open: HOME.whyOpen, at: HOME.at, key: HOME.world.key, busy: HOME.busy, line: HOME.line })`)
      check(!!pt && !after.open && after.at === 'stone' && after.key === before && !after.busy && after.line.sop > .98 && after.line.ops.every(o => o < .02), `${L}: closing returns to the same stone and the sentence`, JSON.stringify({ ...after, line: null, pt })) }

    // 43 c: the card on a phone; and on a desktop, none
    if (vp.mobile) await cardHold(tag); else await deskNoCard(tag)

    // 39: crossings
    { await open('?w=' + encodeURIComponent(home[0])); await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200)
      await masses(`${tag} a world`)
      { await park(); await cdp.eval('HOME.still = true'); await sleep(500); const r = await cdp.eval('HOME.rest()'), bad = r.filter(x => !(x.own < x.other || x.own < .02))
        check(r.length >= 4 && !bad.length, `${tag}: at rest all ${r.length} sampled facets read as this photograph`, bad.slice(0, 4).map(x => `#${x.i} ${x.own} vs ${x.other}`).join(' | ')); await cdp.eval('HOME.still = false') }
      if (vp.id === 'desk') await doorsHold(`${tag} a world`, await cdp.eval('HOME.plans'), '?w=' + encodeURIComponent(home[0])) // the same door from a world (facetTap's cross); the phones take it from home
      await crossOnce(`${tag} door line`, 'door', `cross-${vp.id}-door`)
      if (vp.id === 'desk') await crossOnce(`${tag} facet`, 'facet', `cross-${vp.id}-facet`)
      await drawnHold(`${tag} after crossing`) }

    // the rendered page: no system name, no instruction, nothing counts down
    { const t = await cdp.eval(`document.body.innerText + ' ' + [...document.querySelectorAll('#keys button')].map(b => b.getAttribute('aria-label')).join(' ')`)
      const tm = await cdp.eval(`(() => { const text = document.body.innerText.replace(document.getElementById('where').innerText, ''); return /\\b\\d{1,2}:\\d{2}\\b|\\b\\d+\\s?(s|sec|secs|seconds)\\b/i.test(text) || !!document.querySelector('progress,[role=timer]') })()`)
      check(!BANNED.test(t) && !/\b(click|tap|hover|scroll|swipe|press|touch) (here|to|on)\b/i.test(t) && !tm, `${tag}: the system's working name never shows, no instruction, nothing counts down`) }
    check(!errors.length, `${tag}: no console errors`, errors.slice(0, 3).join(' | '))
  }

  /* B: every state a real visitor can reach, each pinned (the clock, the sky, the time zone, which sources load), at 390x844: today's pair as the
     page resolves it, its six this-world texts word for word against the recount, each idea's panel opened (the general always there, read
     live, nothing missing said); the texts are printed for the record. The first screen's are B1 */
  if (process.env.CARDS !== 'only') { const sky = (o, cur = {}) => { const j = JSON.parse(FIXTURE); Object.assign(j.current, cur); return JSON.stringify(j) }
    const relWithout = slug => { const R = read('poems/related.js'), at = R.indexOf(`'${slug}':`) >= 0 ? R.indexOf(`'${slug}':`) : R.indexOf(`"${slug}":`), end = R.indexOf('\n', at); return R.slice(0, at) + R.slice(end + 1) }
    const REPEAT = (() => { const D = JSON.parse(JSON.stringify(P42.DAYS0)), real = Object.keys(D).filter(d => /^\d{4}-/.test(d)), n = f => v => real.filter(d => D[d][f] === v).length
      const X = PHOTOS42.find(p => n('photo')(p.src) === 2).src, Y = POEMS42.find(p => n('poem')(p.slug) === 1).slug
      D['2025-03-14'] = { ...D[real[0]], photo: X, poem: Y }; return { days: D, key: kp(X, Y) } })()
    const N9 = Date.UTC(2026, 10, 10, 1, 40), UNKNOWN = { place: null, lat: null, lon: null, tz: null, updated: '2026-11-09' }
    const STATES = [
      { id: 'first', what: 'B1 the first screen: 8 Nov, 4:50 pm, the sky as it was read (after dark, clear, 12.9 °C)', pin: PIN, sky: FIXTURE, iso: '2026-11-08' },
      { id: 'day', what: 'B2 daytime: 8 Nov, 1:10 pm, the same sky by day', pin: Date.UTC(2026, 10, 8, 18, 10), sky: sky(FIXTURE, { is_day: 1, time: '2026-11-08T13:00' }), iso: '2026-11-08' },
      { id: 'unheld', what: 'B2 a day the archive does not yet hold: 9 Nov, 8:40 pm', pin: N9, sky: FIXTURE, iso: '2026-11-09' },
      { id: 'frozen', what: 'B3 no sky, on a day the archive already holds (8 Nov after it froze)', pin: PIN, sky: null, iso: '2026-11-08' },
      { id: 'hash', what: 'B3 no sky, on a day the archive does not hold (9 Nov)', pin: N9, sky: null, iso: '2026-11-09' },
      { id: 'unknown', what: 'B4 where he is not known with confidence (place.json says no city)', pin: PIN, sky: FIXTURE, iso: '2026-11-08', over: { '/v2/place.json': JSON.stringify(UNKNOWN) }, place: UNKNOWN },
      { id: 'gone', what: 'B4 the poems\' years, related.js and flow.js fail to load', pin: PIN, sky: FIXTURE, iso: '2026-11-08', gone: ['/v3/poem-years.json', '/poems/related.js', '/v2/flow.js'] },
      { id: 'nohere', what: 'B4 here.js itself fails to load', pin: PIN, sky: FIXTURE, iso: '2026-11-08', gone: ['/v3/here.js'], none: true },
      { id: 'repeat', what: 'B5, B7 a photograph shown three times and a poem twice, the archive reaching back into 2025 (a served days.json)', pin: PIN, sky: FIXTURE, iso: '2026-11-08', days: REPEAT.days, world: REPEAT.key },
      { id: 'norel', what: 'B5 today\'s poem missing from related.js', pin: PIN, sky: FIXTURE, iso: '2026-11-08', rel: true },
      { id: 'london', what: 'B6 a visitor in Europe/London', pin: PIN, sky: FIXTURE, iso: '2026-11-08', tz: 'Europe/London', same: 'first' },
      { id: 'kolkata', what: 'B6 a visitor in Asia/Kolkata', pin: PIN, sky: FIXTURE, iso: '2026-11-08', tz: 'Asia/Kolkata', same: 'first' }]
    const got0 = {}, bad = []
    await view({ id: 'states', w: 390, h: 844, mobile: true })
    for (const S of STATES) {
      await setPin(S.pin); SKY = S.sky; GONE.clear(); (S.gone || []).forEach(u => GONE.add(u)); OVER.clear(); for (const [u, b] of Object.entries(S.over || {})) OVER.set(u, b); if (S.days) OVER.set('/v2/days.json', JSON.stringify({ ...J('v2/days.json'), days: S.days }))
      const R = S.sky && !(S.place && S.place.place === null) ? (S.id === 'day' ? { ...P36.READING, is_day: 1 } : P36.READING) : null, t = P42.today(S.iso, R, S.days || P42.DAYS0) // no city: no sky is asked for
      let rel = null; if (S.rel) { const slug = t.poem; OVER.set('/poems/related.js', relWithout(slug)); rel = { P: Object.fromEntries(Object.entries(P42.REL0.P).filter(([k]) => k !== slug)), L: P42.REL0.L } }
      await cdp.send('Emulation.setTimezoneOverride', { timezoneId: S.tz || 'America/New_York' }); errors.length = 0
      await open('')
      const today = await cdp.eval('HOME.todayKey'), how = await cdp.eval('HOME.how'), where = await cdp.eval('document.getElementById("where").innerText.trim()')
      if (today !== kp(t.photo, t.poem) || how !== t.how) bad.push(`${S.id}: the pair is ${today} (${how}), the recount ${kp(t.photo, t.poem)} (${t.how})`)
      await cdp.eval('HOME.whyReady()'); const said = await cdp.eval('HOME.hereFor()'); got0[S.id] = said
      const want = S.none ? {} : P42.expected({ iso: S.iso, R, readAt: await readAtOf(), src: t.photo, slug: t.poem, mode: 'home', gone: new Set(S.gone || []), place: S.place, rel, days: S.days })
      if (S.world) { const g2 = await cdp.eval(`HOME.hereFor(${JSON.stringify(S.world)})`), w2 = P42.expected({ iso: S.iso, R, readAt: await readAtOf(), src: '/photos/' + S.world.split('~')[1], slug: S.world.split('~')[0], mode: 'world', days: S.days })
        bad.push(...P42.differ(g2, w2).map(b => `${S.id} ${S.world}: ${b}`)); console.log(`\n== ${S.what}: the world ${S.world}`); for (const n of P42.NAMES) console.log(`  ${n}: ${(g2[n] || []).map(x => x.s).join(' ')}`) }
      if (S.none) { if (Object.keys(said || {}).length) bad.push(`${S.id}: here.js did not load, yet the page wrote ${JSON.stringify(said).slice(0, 80)}`) }
      else bad.push(...P42.differ(said, want).map(b => `${S.id}: ${b}`))
      if (S.same && P42.differ(said, Object.fromEntries(Object.entries(got0[S.same]).map(([k, L]) => [k, L.map(x => x.s)]))).length) bad.push(`${S.id}: the texts differ from New York's: ${P42.differ(said, Object.fromEntries(Object.entries(got0[S.same]).map(([k, L]) => [k, L.map(x => x.s)])))[0]}`)
      const s = await cdp.eval('HOME.state')
      for (const [k, I] of IDEAS42.entries()) { const at = await cdp.eval(`HOME.tapIdea(${k})`); if (!at || !at.pt) { bad.push(`${S.id} ${I.name}: no place to tap`); continue }
        await tap(at.pt); const ok = await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.hereReadyNow`), 'idea', 250, 60).catch(() => null)
        if (!ok) { bad.push(`${S.id} ${I.name}: did not open`); await key('Escape'); continue } await sleep(350); await cdp.eval('HOME.finishCard(); HOME.cardResnap()')
        const st = await panelNow(); bad.push(...panelWrong(I, st, S.none ? [] : (want[I.name] || []), s.ideas.find(x => x.k === k)).map(b => `${S.id} ${b}`)) // 43 c: these are phones; the card's placement is cardHold's
        if (k === 0 && !S.same) await shot(`state-${S.id}-context.png`)
        await key('Escape') }
      if (S.id === 'first') await shot('state-first-rest.png')
      const errs = errors.filter(e => !(S.gone || []).some(u => e.includes(u)) && !/the server responded with a status of 404|here: /.test(e)); if (errs.length) bad.push(`${S.id}: console errors: ${errs.slice(0, 2).join(' | ')}`)
      console.log(`\n== ${S.what} — ${today} (${how}); the where line: “${where}”`); for (const n of P42.NAMES) console.log(`  ${n}: ${(said && said[n] || []).map(x => x.s).join(' ') || '(nothing of this world: the general alone)'}`) }
    check(!bad.length, `B1–B6: in ${STATES.length} states (the first screen, daytime, a day the archive does not hold, no sky on a held and an unheld day, where he is unknown, three sources failing, here.js failing, the poem missing from related.js, London and Kolkata) today's pair is resolved as the recount says and its six texts are the recount's word for word; every panel opens with the general read live, nothing missing said, clear of the mat and the switch; another time zone reads exactly as New York`, bad.slice(0, 4).join(' | '))
    await setPin(PIN); SKY = FIXTURE; GONE.clear(); OVER.clear(); await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
    // B9: a short phone, and a phone on its side: the open panel never covers the where line, the nav or the switch, and stays on screen
    for (const v of [{ id: 'short', w: 375, h: 667, mobile: true }, { id: 'side', w: 844, h: 390, mobile: true }]) { await view(v); await open(''); const s = await cdp.eval('HOME.state'), clash = []
      for (const [k, I] of IDEAS42.entries()) { const at = await cdp.eval(`HOME.tapIdea(${k})`); if (!at || !at.pt) { clash.push(I.name + ': no place to tap'); continue } await tap(at.pt)
        if (!(await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.hereReadyNow`), 'idea', 250, 60).catch(() => null))) { clash.push(I.name + ': did not open'); continue } await sleep(350)
        await cdp.eval('HOME.finishCard(); HOME.cardResnap()'); const st = await panelNow(), c = await cdp.eval('HOME.card') // 43 c: on a phone the idea is the card: on screen, its words in whole lines
        if (!c.open || !c.poly.every(([x, y]) => x >= -1 && y >= -1 && x <= v.w + 1 && y <= v.h + 1)) clash.push(`${I.name}: the card is not wholly on screen`); if (st.cut) clash.push(`${I.name}: a line cut at the edge`); await key('Escape'); await cardSettle(I.name, false).catch(() => null) }
      check(!clash.length, `B9 ${v.w}x${v.h}: every open idea opens as the card, wholly on screen, its words in whole lines`, clash.slice(0, 3).join(', ')) } }

  // reduced motion: the poem is there at once, a facet still answers, a crossing is a crossfade where no facet moves
  if (VIEWPORTS.some(v => v.id === 'desk') && process.env.CARDS !== 'only') { await view(VIEWPORTS.find(v => v.id === 'desk')); await reduceMotion(true); errors.length = 0
    await open(''); const dk = (await cdp.eval('HOME.doors'))[0].to; await open('?w=' + encodeURIComponent(dk)); await waitFor(() => cdp.eval('HOME.world.arrived'), 'arrival', 200)
    check(await cdp.eval('HOME.lines.every(l => l.shown)'), 'reduced motion: the poem is there at once')
    { const at = await cdp.eval('HOME.tapIdea(0)'); if (at && at.pt) await tap(at.pt); const ok = await waitFor(() => cdp.eval('HOME.open === 0 && HOME.hereReadyNow && +getComputedStyle(document.querySelector("#tools")).opacity > .98'), 'idea', 250, 60).catch(() => null)
      const st = ok && await panelNow(), wk = await cdp.eval('HOME.world.key'), W0 = P42.expected({ ...M0, readAt: await readAtOf(), src: '/photos/' + wk.split('~')[1], slug: wk.split('~')[0], mode: 'world' })
      check(!!ok && st.here.join(' ') === W0['Context'].join(' '), 'reduced motion: an idea opens on its facet, this world first, word for word', JSON.stringify(st && st.here)); await key('Escape') }
    await crossOnce('reduced motion door line', 'door', 'cross-calm')
    check(!errors.length, 'reduced motion: no console errors', errors.slice(0, 3).join(' | '))
    await reduceMotion(false) }
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) }

{ const gone = [...P37.reached].filter(x => !live.has(x)); check(P37.reached.size > 0 && !gone.length, `every poem a segment shows or a facet reaches (${P37.reached.size}) is live`, gone.join(', ')) }
const w8 = weight ? `; first screen on a phone ${Math.round(weight.rest / 1024)} KB gzipped + the photograph ${Math.round(weight.pic / 1024)} KB` : ''
for (const [k, o] of Object.entries(READS.worst)) console.log(`     reads, worst ${k}: ${o.p02}:1, ${o.px}px, at ${o.where} "${o.text}"`)
console.log(failures ? `FAIL the home: ${failures} of ${oks + failures} checks failed` : `PASS the home: ${oks} checks in ${loads} loads at ${VIEWPORTS.map(v => v.w + 'x' + v.h).join(', ')}: every facet yields (${drawnN} drawn), ${doorsN} door facets tapped once and crossed to their pair with nothing of a piece shown, ${crossings} crossings walked frame by frame onto the next masses cut, the line and the chain recounted, the six ideas opened on this world and the years reached${w8} (${Math.round((Date.now() - t0) / 1000)}s)`)
cleanup(); process.exit(failures ? 1 : 0)
