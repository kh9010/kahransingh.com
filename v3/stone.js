/* v3/stone.js, the home (live since Kahran's call of 8 Nov: "lets plan on 2"). Assembled from the studies he picked, their code carried over:
     the stone over the day's photograph, cut by its masses (33; cut.js) · the poem broken across it, door lines arriving in line order (28)
     the walk between worlds through door lines and facet doors (24, 28) · the grow crossing, re-cut to the next photograph's masses (39; cross.js),
     a crossfade under reduced motion · every other facet a door to another poem and photograph, the one the piece of his work dealt to it
       by its shape leads to (37 ?y=shape; segs.js, segments.json); the piece itself is never shown (Kahran, 12 Nov: "the cards can just be the context cards")
     the six ideas each behind the facet its meaning puts it on, nothing named at rest, only a breath of its hue (41 b); a tap opens the idea
       at work on this world first (here.js, every fact live), then the general from IDEAS (read live from /v2/home.js), then why that facet;
       a further tap on the facet opens its next tool (42 a). Six hidden buttons, one per idea, are the way in without a pointer
     the where line arriving as 35 ?a=line, and opening 34 b's chain, joined as 36 c (moment.js, why.js, body.js, ways.js)
     the photograph's own facet holding its EXIF month and year, the way into the About's years (38 ?d=c; 27 a)
     on a phone (upright or on its side), an idea or the chain opens as one card cut like a facet of the stone, turning over out of the facet
       that gave it, and closing four ways (43 c; a crossfade under reduced motion); while it holds more than fits, its point is a facet that turns
       one whole-line screenful, and as it opens the words lift once by the hidden next line (44 a with d)
   Every number is a dial in /v3/defaults.json. HOME (at the end) is what tools/test_home.mjs reads. */
addEventListener('unhandledrejection', e => console.error('unhandled: ' + (e.reason && e.reason.stack || e.reason)))
if (location.hash === '#flow') location.replace('/v2/#flow') // the wall's flow view lives on at /v2/; old links to it still land
const Q = new URLSearchParams(location.search)
const T = await fetch('/v3/defaults.json').then(r => r.json()).catch(() => ({}))
for (const [k, v] of Object.entries(T)) document.documentElement.style.setProperty('--' + k, String(v)) // the dials CSS reads
const num = (k, f) => { const x = parseFloat(T[k]); return Number.isFinite(x) ? x : f }
// his picks, held: 24's vocabulary and naming, 37's shape, 39's grow, 36's return
const VOCAB = 'his', NAME = 'crossing', Y = 'shape', X = 'grow', JW = 'c'
/* the way into the About's years, ONE seam: where it lives, and the flight into it (yearsOut below). 27 a became about.html on 9 Nov
   (built by studies/27/build.mjs --about). A page here without 27 a's year rows is opened plainly. */
const YEARS = '/about.html'
const qs = (o = {}) => '?' + new URLSearchParams(o).toString()
document.body.dataset.a = 'line'
const track = (name, params = {}) => document.dispatchEvent(new CustomEvent('home:track', { detail: { name, params } })) // track.js counts it

const $ = s => document.querySelector(s)
const app = $('#app'), cv = $('#stone'), g = cv.getContext('2d'), readEl = $('#read'), mat = $('#mat'), cap = $('#cap'), ideaEl = $('#idea')
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const sleep = ms => new Promise(r => setTimeout(r, ms))
let W = 0, H = 0, DPR = 1
const phone = () => W < 640 && H > W * .9 // a phone held upright; a phone on its side is short, see low() (carried from 24, 7 Nov)
const low = () => H < 560 && W > H
function size() { W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR) }
size()
await Promise.race([Promise.all(['300 18px Fraunces', 'italic 400 18px Fraunces', 'italic 300 30px Fraunces', '400 12px "Space Grotesk"'].map(f => document.fonts.load(f))), sleep(3000)]) // the poem is measured and drawn in its own face
/* what the first screen needs, and nothing more: today's pick (the home's own parts), the doors, each photograph's date; the photograph's
   regions one file per photograph; what the facets deal from (segments, kin) once the stone is up */
const stem = src => src.split('/').pop().replace(/\.[a-z]+$/i, '')
const REG = {}, regAsk = {}
const regOf = src => regAsk[src] ||= fetch('/v3/regions/' + stem(src) + '.json').then(r => r.ok ? r.json() : null).then(j => (REG[src] = j ? j.photo : null)).catch(() => (REG[src] = null))
const [ctx, DJ, XJ] = await Promise.all([S14.load($('#where')), fetch('/v3/doors.json').then(r => r.json()), fetch('/v3/crossings.json').then(r => r.json())])
let KIN = {}, SEG = null, segGo = null
const segReady = () => segGo ||= Promise.all([fetch('/v3/segments.json').then(r => r.json()), fetch('/v3/kin.json').then(r => r.json())])
  .then(([S, K]) => { KIN = K.photos; SEG = S; D37.SEG = { ...SEG, segs: SEG.segs.filter(s => s.kind !== 'idea') }; D37.KIN = KIN; segById = new Map(SEG.segs.map(s => [s.id, s])) })
/* the six ideas, read where they live: IDEAS in /v2/home.js (the literal itself, nothing copied), and each one's hue from /v2/home.css */
function literal(src, name) { const at = src.indexOf('var ' + name + ' = '); if (at < 0) throw new Error(name + ' moved'); const s0 = at + name.length + 7
  let depth = 0, q = null; for (let i = s0; i < src.length; i++) { const c = src[i]
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue } if (c === "'" || c === '"') { q = c; continue }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue } if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return new Function('return ' + src.slice(s0, i + 1))() } }
const [homeJs, homeCss] = await Promise.all(['/v2/home.js', '/v2/home.css'].map(u => fetch(u).then(r => r.text())))
const IDEAS = literal(homeJs, 'IDEAS')
const HUE = Object.fromEntries([...homeCss.matchAll(/\.(tile--[a-z]+)\s*\{\s*--h:\s*([\d.]+);\s*--s:\s*([\d.]+)%;\s*--l:\s*([\d.]+)%/g)].map(m => [m[1], `hsl(${m[2]} ${Math.min(70, +m[3] + 20)}% ${Math.min(78, +m[4] + 38)}%)`]))
const VOC = DJ.vocabs[VOCAB], data = ctx.data, stanzasOf = ctx.stanzasOf

/* ---------- 34's chain, opened from the line (34 b; why.js, body.js, ways.js, loaded once the stone is up or when first asked) ---------- */
const whereEl = $('#where'), whyEl = $('#why'), whyBody = whyEl.querySelector('.why-body')
if (!whereEl.textContent.trim()) whereEl.textContent = 'We can’t see the sky right now.' // no reading: the line still opens the honest answer
let whyOpen = false, whyModel = null, whyDrawn = false, whyGo = null
const script = src => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.append(el) })
const whyReady = () => whyGo ||= script('/v3/why.js').then(() => script('/v3/body.js')).then(() => script('/v3/ways.js'))
  .then(() => S34.explain({ ...ctx, how: ctx.how, doors: DJ })).then(m => (whyModel = m)).catch(e => { console.error('why: ' + (e && e.stack || e)); return null })
const matH = () => document.documentElement.style.setProperty('--mat-h', mat.offsetHeight + 'px')
async function openWhy() { if (whyOpen) return true; if (cardMode()) cardRoom(); whyOpen = true; matH(); closeTools()
  const m = await whyReady(); if (!m || !whyOpen) return false
  const doors = cur && cur.mode === 'home' && cur.poem.slug === m.poem.slug ? HOME.doors : null
  if (!whyDrawn) { await S34B.build(m, ctx, DJ, doors); if (!whyOpen) return false; S34W.draw('b', m, whyBody, { dotPx: num('why-dot-px', 3), doors }); whyDrawn = true; whyBody.dataset.drawn = 'yes' }
  whyEl.setAttribute('aria-hidden', 'false'); whereEl.setAttribute('aria-expanded', 'true')
  if (cardMode()) { cardOpen('chain', -1, whyEl); document.body.classList.add('why'); return whyOpen } // 43 c: on a phone the chain is the card (no scrim: the card is its own ground)
  await new Promise(r => requestAnimationFrame(() => { document.body.classList.add('why'); r() })); return whyOpen }
function closeWhy() { if (!whyOpen) return; whyOpen = false
  document.body.classList.remove('why'); whyEl.setAttribute('aria-hidden', 'true'); whereEl.setAttribute('aria-expanded', 'false'); whereEl.focus({ preventScroll: true })
  JN.closes++; if (LN.L && FS.line.phase !== 'resolved') resolveLine(); cardShut('chain') } // c: closing, the readings fade into the sentence again
whereEl.addEventListener('click', e => { e.stopPropagation(); whyOpen ? closeWhy() : join() })
whereEl.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); whyOpen ? closeWhy() : join() } })
whyEl.querySelector('.why-x').addEventListener('click', closeWhy)
$('#why-scrim').addEventListener('click', closeWhy)

/* ---------- 36 c: where the line and the chain meet. The sentence turns back into its readings as the chain opens, each lighting where the chain reads it ---------- */
const FS = { line: null }
const LN = { L: null, timers: [] }
const JN = { taps: [], echoed: [], closes: 0, opens: 0 }
const later = (f, ms) => { LN.timers.push(setTimeout(f, ms)) }
const hush = () => { LN.timers.forEach(clearTimeout); LN.timers = [] }
const tokEls = () => LN.L ? [...LN.L.rd.children] : []
// where the chain reads each reading the line showed (readingsOf's order: latitude, date, light, cloud, warmth, wind, wet)
const TO = ['[data-r="lat"]', '[data-date]', 'light', '[data-r="cloud"]', '[data-r="temp"]', '[data-r="wind"]', '[data-r="wetmax"]']
function targetOf(k) { const q = TO[k]; if (!whyDrawn || !q) return null
  if (q !== 'light') return whyBody.querySelector(q)
  const word = FS.line.readings[k] // daylight / after dark: the smallest piece of the chain whose own words say it
  return [...whyBody.querySelectorAll('p, span, div')].find(e => [...e.childNodes].some(n => n.nodeType === 3 && n.data.includes(word))) || null }
function echo(k) { const t = targetOf(k); if (!t) return null
  t.classList.add('lit'); t.classList.add('echo'); setTimeout(() => t.classList.remove('echo'), num('echo-ms', 1400))
  JN.echoed.push({ k, reading: FS.line.readings[k], text: t.textContent.trim(), seen: inView(t) }); return t }
const inView = t => { const a = t.getBoundingClientRect(), b = whyEl.getBoundingClientRect(); /* in the card, #why is the card's own scroller */ return a.height > 0 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1 }
function unresolve() { // the sentence turns back into the readings it was made of, in the line's own order and pace
  hush(); const { se } = LN.L, st = num('line-stagger-ms', 110); FS.line.phase = 'returning'; document.body.dataset.line = 'read'
  se.classList.remove('on'); tokEls().forEach((x, k) => later(() => x.classList.remove('out'), k * st))
  later(() => { FS.line.phase = 'read'; groundSoon() }, st * tokEls().length + num('line-out-ms', 900)) }
async function join() { // the line is the way into the chain
  const ph = FS.line ? FS.line.phase : 'none'
  JN.taps.push(ph); JN.opens++; track('line_open', { phase: ph })
  if (!LN.L) return openWhy()
  const st = num('line-stagger-ms', 110), t0 = performance.now()
  unresolve(); if (await openWhy()) tokEls().forEach((x, k) => setTimeout(() => whyOpen && echo(k), Math.max(0, k * st - (performance.now() - t0)))) }

/* ---------- 35 line: the readings the pick read (moment.js, through pick.js's own parts) show under his name and fade, one by one, into the sentence ---------- */
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], MONTHS = MON
const deg = t => (Math.round(t * 10) / 10).toFixed(1) + ' °C'
const mmOf = r => Math.max(r.precipitation || 0, r.rain || 0, r.showers || 0, r.snowfall || 0)
const niceDate = iso => +iso.slice(8, 10) + ' ' + MONTHS[+iso.slice(5, 7) - 1]
function readingsOf(m) { const r = m.reading
  return [{ t: Math.abs(r.lat).toFixed(1) + '° ' + (r.lat >= 0 ? 'N' : 'S'), feeds: ['season', 'place'] }, { t: niceDate(m.iso), feeds: ['season', 'memory'] },
    { t: r.is_day !== 0 ? 'daylight' : 'after dark', feeds: ['light'] }, { t: r.cloud_cover + '% cloud', feeds: ['light'] }, { t: deg(r.temperature_2m), feeds: ['warmth', 'inside'] },
    { t: r.wind_speed_10m + ' km/h', feeds: ['stillness'] }, { t: mmOf(r).toFixed(1) + ' mm', feeds: ['wet', 'inside'] }] }
function setLine(m) { // laid in before the poem is, so the mat already has the height the readings need
  const el = $('#where'), sent = el.textContent; if (!m || !sent) return null
  const toks = readingsOf(m); FS.line = { readings: toks.map(x => x.t), feeds: toks.map(x => x.feeds), sentence: sent, phase: 'read' }
  el.textContent = ''; const rd = document.createElement('span'), se = document.createElement('span'); rd.className = 'rd'; rd.setAttribute('aria-hidden', 'true'); se.className = 'sent'; se.textContent = sent
  toks.forEach((x, k) => { if (k) rd.append(' '); rd.append(Object.assign(document.createElement('i'), { textContent: x.t + (k < toks.length - 1 ? ' ·' : '') })) })
  el.append(rd, se); return { el, rd, se, sent, toks } }
function runLine(L) { // its timers kept so a tap can turn the fade (36)
  if (!L) { document.body.dataset.line = 'none'; return }
  LN.L = L; const { rd } = L; document.body.dataset.line = 'read'
  rd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: num('line-in-ms', 500), easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' })
  later(resolveLine, num('line-hold-ms', 1500)) }
function resolveLine() { // each reading out in turn, the sentence in halfway; the readings stay in the line, faded, so they can come back
  hush(); const { rd, se, toks } = LN.L, st = num('line-stagger-ms', 110), left = [...rd.children].filter(x => !x.classList.contains('out'))
  FS.line.phase = 'resolving'; document.body.dataset.line = 'read'
  left.forEach((x, k) => later(() => x.classList.add('out'), k * st))
  later(() => se.classList.add('on'), st * toks.length / 2)
  later(() => { FS.line.phase = 'resolved'; document.body.dataset.line = 'done'; groundSoon() }, st * left.length + num('line-out-ms', 900)) }

/* ---------- small geometry ---------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = Math.imul(s ^ s >>> 15, 2246822507) + 0x9e3779b9 >>> 0, ((s ^ s >>> 13) >>> 0) / 4294967296) }
function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v
const ss = (a, b, t) => clamp01((t - a) / (b - a))
const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
function centroid(p) { let a = 0, x = 0, y = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length], c = x0 * y1 - x1 * y0; a += c; x += (x0 + x1) * c; y += (y0 + y1) * c } a *= .5; return a ? [x / (6 * a), y / (6 * a)] : p[0] || [0, 0] }
const area2 = P => P.reduce((a, [x0, y0], i) => { const [x1, y1] = P[(i + 1) % P.length]; return a + x0 * y1 - x1 * y0 }, 0)
const bbox = p => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of p) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y } return [x0, y0, x1, y1] }
const meets = (b, [x, y, w, h], pad = 0) => b[2] > x - pad && b[0] < x + w + pad && b[3] > y - pad && b[1] < y + h + pad
const inPoly = ([x, y], p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
const voronoi = S => S33Cut.voronoi(S, W, H, num('wind', 8)) // 05 B's, from 33's cut.js: the wind draws the facets out
function inset(P, s) { // a true offset of every edge, so the seam is the same width all round
  const n = P.length; if (n < 3 || s <= 0) return P
  const sg = area2(P) > 0 ? 1 : -1, c = centroid(P)
  const L = P.map((a, i) => { const b = P[(i + 1) % n]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; return { p: [a[0] - dy * sg * s, a[1] + dx * sg * s], d: [dx, dy] } })
  const Qp = P.map((v, i) => { const A = L[(i - 1 + n) % n], B = L[i], den = A.d[0] * B.d[1] - A.d[1] * B.d[0]
    if (Math.abs(den) < 1e-6) return B.p
    const t = ((B.p[0] - A.p[0]) * B.d[1] - (B.p[1] - A.p[1]) * B.d[0]) / den, q = [A.p[0] + A.d[0] * t, A.p[1] + A.d[1] * t]
    if (Math.hypot(q[0] - v[0], q[1] - v[1]) > s * 5) { const dx = c[0] - v[0], dy = c[1] - v[1], d = Math.hypot(dx, dy) || 1; return [v[0] + dx / d * s * 1.5, v[1] + dy / d * s * 1.5] }
    return q })
  return area2(Qp) * area2(P) > 0 ? Qp : [] }
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]
const tr = (x, y) => [1, 0, 0, 1, x, y], sc = (x, y = x) => [x, 0, 0, y, 0, 0]
const about = ([cx, cy], ...ms) => [tr(cx, cy), ...ms, tr(-cx, -cy)].reduce(mul)

/* ---------- the cut: 33's, from the photograph's own regions (cut.js, regions.json); always the same count, so cuts morph cell for cell ---------- */
function cutFor(w, t) { // t only re-seeds where the filling sites fall, never the photograph's lines
  const count = Math.round(phone() ? num('facets-phone', 15) : low() ? num('facets-low', 15) : num('facets-desk', 26))
  const K = S33Cut.cut({ R: REG[w.photo.src] || null, W, H, count, logic: 'masses', wind: num('wind', 8), seed: w.key + (t ? '|' + t : ''), moment: null,
    dials: { share: num('cut-share', .75), gap: num('cut-gap', .03), spacing: num('cut-spacing', .16), fillGap: num('cut-fill-gap', .13), lineMin: num('cut-line-min', .25) } })
  w.cut = K; w.cutT = t || 0; w.fixed = null; w.sites = K.sites; const r2 = rng(hash(w.key + '|n' + (t || ''))); w.normals = w.sites.map(() => [(r2() - .5) * .9, (r2() - .5) * .9])
  w.cells = voronoi(w.sites); w.cents = w.cells.map(centroid); w.frags = null; w.plan = null }

/* ---------- the worlds and their doors (the vocabulary chooses both) ---------- */
const poemBy = s => data.poems.find(p => p.slug === s), photoBy = src => data.photos.find(p => p.src === src)
const keyOf = w => w.poem.slug + '~' + w.photo.src.replace('/photos/', '')
const pairOf = key => { const [s, f] = String(key || '').split('~'); const poem = poemBy(s), photo = photoBy('/photos/' + f); return poem && photo ? { poem, photo } : null }
const placedCache = new Map()
function placed(poem) { // the doors a poem can show: one per line, each phrase inside one line as written
  if (placedCache.has(poem.slug)) return placedCache.get(poem.slug)
  const list = VOC.poems[poem.slug] || [], used = new Set(), out = []
  stanzasOf(poem).flat().forEach((line, li) => { const k = list.findIndex((d, k) => !used.has(k) && line.includes(d.phrase)); if (k >= 0) { used.add(k); out.push({ ...list[k], k, line }) } })
  placedCache.set(poem.slug, out); return out }
const good = slug => { const p = poemBy(slug); return !!p && placed(p).length >= 2 } // somewhere with a way on
const wordOf = word => VOC.words.find(x => x.word === word) || { word, concepts: [], poems: [], photos: [] }
function target(from, d, seen, taken) { // the door's idea, carried to a poem and a photograph that hold it and are not behind you
  const Wd = wordOf(d.word), h = hash(from.poem.slug + '|' + d.word + '|' + VOCAB)
  const near = VOC.words.filter(x => x !== Wd && x.concepts.some(c => Wd.concepts.includes(c)))
  const free = s => good(s) && !seen.poems.has(s) && !taken.has(s) && s !== from.poem.slug
  let how = 'word', ps = Wd.poems.filter(free)
  if (!ps.length) { how = 'near'; ps = [...new Set(near.flatMap(x => x.poems))].filter(free) }
  if (!ps.length) { how = 'any'; ps = data.poems.map(p => p.slug).filter(free) }
  const pfree = s => photoBy(s) && !seen.photos.has(s) && s !== from.photo.src
  let fs = Wd.photos.filter(pfree), phow = 'word'
  if (!fs.length) { phow = 'near'; fs = [...new Set(near.flatMap(x => x.photos))].filter(pfree) }
  if (!fs.length) { phow = 'any'; fs = data.photos.map(p => p.src).filter(pfree) }
  const poem = poemBy(ps[h % ps.length]), photo = photoBy(fs[(h >>> 7) % fs.length])
  return { poem, photo, how, phow } }
function doorsFor(w, trail) {
  const seen = { poems: new Set(trail.map(k => k.split('~')[0])), photos: new Set(trail.map(k => '/photos/' + k.split('~')[1])) }, taken = new Set()
  let ds = placed(w.poem).map(d => { const to = target(w, d, seen, taken); taken.add(to.poem.slug); seen.photos.add(to.photo.src); return { ...d, to } })
  return ds }

/* ---------- photographs: covering the screen once, the shade under the poem laid into them ---------- */
const raw = {}, prepared = new Map()
const loadImg = src => raw[src] ||= new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src })
function poemRect() { // 20's, as it was before the names needed room: on a phone it stands on the where line, in the shade; on its side it takes the right half
  if (phone()) { const bottom = H - mat.offsetHeight - num('poem-foot-px', 34), top = Math.min(Math.round(H * .34), bottom - 160); return [16, top, W - 32, bottom - top] }
  if (low()) { const right = Math.max(16, W * .03), w = Math.min(440, W * .48), top = Math.round(H * .16); return [W - w - right, top, w, H - top - 14] } // on its side: the poem takes the right half, the mat keeps the left
  const w = Math.min(440, W * .36), right = Math.max(32, W * .06), top = Math.round(H * .13); return [W - w - right, top, w, H * .74] }
async function photo(p) {
  const tag = `${p.src}@${cv.width}x${cv.height}`
  if (prepared.has(tag)) return prepared.get(tag)
  const im = await loadImg(p.src), c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height
  const x = c.getContext('2d'); x.fillStyle = '#24221f'; x.fillRect(0, 0, c.width, c.height); c.ok = false
  if (im && im.naturalWidth) {
    const a = im.naturalWidth / im.naturalHeight, b = c.width / c.height, [sw, sh] = a > b ? [im.naturalHeight * b, im.naturalHeight] : [im.naturalWidth, im.naturalWidth / b]
    if (/Monochrome/.test(p.caption || '')) x.filter = 'grayscale(1) contrast(1.06) brightness(.94)'
    x.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, c.width, c.height); x.filter = 'none'; c.ok = true; c.im = im; c.crop = [sw, sh, im.naturalWidth, im.naturalHeight]
  }
  const A = num('scrim-alpha', .72), s = (g0, stops) => { stops.forEach(([o, al]) => g0.addColorStop(o, `rgba(8,8,7,${al})`)); x.fillStyle = g0; x.fillRect(0, 0, c.width, c.height) }
  x.setTransform(DPR, 0, 0, DPR, 0, 0)
  if (phone()) s(x.createLinearGradient(0, H, 0, 0), [[0, A], [.48, A * .8], [.66, 0]])
  else { s(x.createLinearGradient(W, 0, 0, 0), [[0, A], [.32, A * .7], [.52, 0]])
    const L = W * Math.sin(.35) + H * Math.cos(.35); s(x.createLinearGradient(0, H, Math.sin(.35) * L, H - Math.cos(.35) * L), [[0, A * .9], [.38, 0]]) }
  prepared.set(tag, c); if (prepared.size > 8) prepared.delete(prepared.keys().next().value)
  return c }

/* ---------- the poem: laid out in the page (to be read, selected, tapped), drawn on the stone in its own face ---------- */
function verseEl(w, doors) {
  const v = document.createElement('div'); v.className = 'verse'
  const h = document.createElement('h2'), a = document.createElement('a'); a.href = '/poems/' + w.poem.slug + '.html'; a.textContent = w.poem.title; h.append(a); v.append(h)
  a.addEventListener('click', () => track('poem_open', { poem: w.poem.slug, via: 'title' })) // the title is the way to the whole poem
  let i = 0
  stanzasOf(w.poem).forEach((st, si) => {
    if (si) v.append(Object.assign(document.createElement('span'), { className: 'gap' }))
    st.forEach(t => { const l = document.createElement('span'); l.className = 'l'; l.dataset.i = i++
      const d = doors.find(d => d.line === t && !d.el)
      if (d) { const at = t.indexOf(d.phrase), door = document.createElement('a')
        door.className = 'door'; door.dataset.k = d.k; door.href = qs({ w: keyOf(d.to) }); door.textContent = d.phrase; d.el = door
        l.dataset.door = ''; l.append(t.slice(0, at), door, t.slice(at + d.phrase.length))
        if (NAME === 'door') l.append(Object.assign(document.createElement('span'), { className: 'tag', textContent: d.word })) }
      else l.textContent = t
      v.append(l) }) })
  return v }
function fit(v, w, h) { const max = num('poem-max-px', 18), min = num('poem-min-px', 13)
  Object.assign(v.style, { width: w + 'px', height: 'auto' }); v.classList.remove('scroll')
  const at = px => { v.style.fontSize = px + 'px'; return v.scrollHeight <= h }
  let lo = 0, hi = Math.round((max - min) * 2) // the largest half-pixel size that fits, or the smallest (as stepping down from the largest would find)
  if (!at(max)) { while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at(max - m * .5)) hi = m; else lo = m } at(max - hi * .5) }
  v.style.height = Math.min(h, v.scrollHeight) + 'px'
  if (v.scrollHeight > h + 1) { v.classList.add('scroll') // more than fits at its smallest: it shows whole lines only, and the rest scrolls
    const top = v.getBoundingClientRect().top - v.scrollTop; let last = 0; for (const k of v.querySelectorAll(':scope > h2, :scope > .l')) { const b = k.getBoundingClientRect().bottom - top; if (b <= h + .5) last = b }
    v.style.height = (last || h) + 'px' } }
const metrics = new Map()
function descent(font) { if (!metrics.has(font)) { g.save(); g.font = font; const m = g.measureText('Hg'); metrics.set(font, [m.fontBoundingBoxAscent || 14, m.fontBoundingBoxDescent || 4]); g.restore() } return metrics.get(font) }
function lineCanvases(w) { // each line drawn once, in its face and shadow; the stone composites them as they arrive
  const v = w.v, vr = v.getBoundingClientRect(), out = w.lines.map(() => ({ runs: [], unders: [] }))
  for (const [li, el] of w.lines.entries()) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n; (n = walk.nextNode());) {
      const p = n.parentElement, cs = getComputedStyle(p), font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, tag = !!p.closest('.tag'), door = p.closest('.door'), title = !!p.closest('h2')
      for (const m of n.data.matchAll(/\S+/g)) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const r = rg.getClientRects()[0]; if (!r) continue
        const [, dsc] = descent(font); out[li].runs.push({ t: m[0], x: r.left - vr.left, y: r.bottom - vr.top + v.scrollTop - dsc, w: r.width, top: r.top - vr.top + v.scrollTop, bot: r.bottom - vr.top + v.scrollTop, font, tag, k: door ? door.dataset.k : title ? 'title' : null, ls: cs.letterSpacing }) } } }
  for (const L of out) {
    if (!L.runs.length) continue
    const pad = 22, x0 = Math.min(...L.runs.map(r => r.x)) - pad, x1 = Math.max(...L.runs.map(r => r.x + r.w)) + pad, y0 = Math.min(...L.runs.map(r => r.top)) - pad, y1 = Math.max(...L.runs.map(r => r.bot)) + pad
    const c = document.createElement('canvas'); c.width = Math.ceil((x1 - x0) * DPR); c.height = Math.ceil((y1 - y0) * DPR); const x = c.getContext('2d')
    x.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR)
    for (const [blur, al] of [[16, .7], [2, .35]]) { x.shadowColor = `rgba(0,0,0,${al})`; x.shadowBlur = blur * DPR; x.shadowOffsetY = DPR
      for (const r of L.runs) { x.font = r.font; x.letterSpacing = r.ls === 'normal' ? '0px' : r.ls; x.globalAlpha = r.tag ? .6 : 1; x.fillStyle = r.tag ? '#c9c3b6' : '#f3efe6'; x.fillText(r.t, r.x, r.y) } }
    Object.assign(L, { c, x0, y0, w: x1 - x0, h: y1 - y0 })
    const rows = new Map(); for (const r of L.runs) if (r.k != null) { const key = r.k + '|' + Math.round(r.y); const o = rows.get(key); if (o) { o[0] = Math.min(o[0], r.x); o[1] = Math.max(o[1], r.x + r.w) } else rows.set(key, [r.x, r.x + r.w, r.y, r.k, parseFloat(r.font.split(' ')[2])]) }
    L.unders = [...rows.values()] }
  return out }
function placePoem(w) { // where the poem sits; on a phone, if it cannot fit at its smallest size it rises to just under the caption first
  const R = poemRect(), ceil = phone() ? ceilOf(w) : 0; if (R[1] < ceil) { R[3] -= ceil - R[1]; R[1] = ceil } // never up onto the caption
  Object.assign(w.v.style, { left: R[0] + 'px', top: R[1] + 'px' }); fit(w.v, R[2], R[3])
  if (phone() && w.v.classList.contains('scroll')) { const top = ceil; if (top < R[1]) { R[3] += R[1] - top; R[1] = top; w.v.style.top = R[1] + 'px'; fit(w.v, R[2], R[3]) } }
  if (phone()) { R[1] = R[1] + R[3] - w.v.offsetHeight; w.v.style.top = R[1] + 'px' } // on the phone the poem sits down on the where line, in the shade
  const r = w.v.getBoundingClientRect(); w.R = [r.left, r.top, r.width, r.height] }
const ceilOf = w => { const c = capFor(w), v = rectOf('.vs'); return Math.max(c[1] + c[3], v[1] + v[3]) + num('poem-rise-gap-px', 16) } // the highest a phone's poem may rise: under the caption and the switch
function layoutPoem(w) {
  w.v = verseEl(w, w.doors); readEl.append(w.v)
  placePoem(w)
  w.lines = [w.v.querySelector('h2'), ...w.v.querySelectorAll('.l')]
  w.doors = w.doors.filter(d => d.el) // only doors the page actually shows
  w.lc = lineCanvases(w)
  w.A = w.lines.map(() => 0); w.Tg = w.lines.map(() => 0); w.dirty = true; w.lit = null
  w.text = document.createElement('canvas'); w.text.width = cv.width; w.text.height = cv.height
  w.v.addEventListener('scroll', () => { w.dirty = true })
  w.v.querySelectorAll('.door').forEach(a => { const on = k => () => { w.lit = k; w.dirty = true }
    a.addEventListener('pointerenter', on(a.dataset.k)); a.addEventListener('pointerleave', on(null)); a.addEventListener('focus', on(a.dataset.k)); a.addEventListener('blur', on(null)) }) }
function composite(w) {
  const x = w.text.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w.text.width, w.text.height)
  const [rx, ry, rw, rh] = w.R, st = w.v.scrollTop, da = num('door-alpha', .3)
  x.setTransform(DPR, 0, 0, DPR, 0, 0); x.beginPath(); x.rect(rx - 30, ry - 2, rw + 60, rh + 4); x.clip(); x.translate(rx, ry - st)
  w.lc.forEach((L, i) => { const a = w.A[i]; if (a < .003 || !L.c) return; x.globalAlpha = a; x.drawImage(L.c, L.x0, L.y0, L.w, L.h)
    for (const [u0, u1, y, k, px] of L.unders) { if (w.mode !== 'world' && k !== 'title') continue // the title is a way on at home too: to the whole poem
      if (k === 'title') w.drewTitleUnder = a > .5
      x.globalAlpha = a; x.strokeStyle = `rgba(243,239,230,${w.lit === k ? .85 : da})`; x.lineWidth = 1; x.beginPath(); x.moveTo(u0, y + px * .28); x.lineTo(u1, y + px * .28); x.stroke() } })
  w.dirty = false }

/* ---------- a world ---------- */
let trail = []
async function makeWorld(pair, mode, tr0) {
  const w = { ...pair, key: keyOf(pair), mode }
  w.trail = [...tr0, w.key]; w.doors = doorsFor(w, w.trail)
  if (!w.doors.length) { const any = data.poems.filter(p => good(p.slug) && p.slug !== w.poem.slug)[hash(w.key) % 50]; w.doors = [] ; w.fallback = { poem: any, photo: data.photos[hash(w.key) % data.photos.length] } }
  const [img] = await Promise.all([photo(w.photo), regOf(w.photo.src)])
  cutFor(w)
  w.img = img
  layoutPoem(w)
  { // no dead facet, and room for the six ideas: a cut is cut again (the filling sites re-seeded, the same way each time, never the photograph's lines)
    // until at least seven of its facets may hold an idea (six, and the date's), keeping of those the cut with the fewest dead facets
    const deadOf = () => drawn(w).filter(i => !touchAt(w, i, { first: true, all: true })).length
    let best = null, at = -1
    const cut = t => { if (at !== t) { cutFor(w, t); at = t } }
    for (let t = 0; t <= num('recut-tries', 64); t++) { cut(t); const room = Math.min(7, legalOf(w).length), dead = deadOf()
      if (!best || room > best.room || (room === best.room && dead < best.dead)) best = { t, room, dead }
      if (best.room >= 7 && !best.dead) break }
    cut(best.t); w.lc = lineCanvases(w); w.dirty = true }
  fixedOf(w)
  w.lv = new Float32Array(w.cells.length)
  return w }
function drop(w) { if (!w) return; w.run = -1; w.v.remove() }

/* ---------- the arrival (17 d, without doors last): the title, then every line in its own place and order, a door line among them,
   its door open the moment its line is there; the whole capped, nothing counts ---------- */
async function arrive(w, delay) {
  const run = w.run = (w.run || 0) + 1, show = i => { w.Tg[i] = 1; w.lines[i].classList.add('shown') }
  if (reduce()) { w.lines.forEach((_, i) => { show(i); w.A[i] = 1 }); w.dirty = true; w.arrived = true; return }
  await sleep(delay); if (run !== w.run) return
  show(0)
  const idx = w.lines.map((_, i) => i).slice(1)
  const step = Math.min(num('line-ms', 320), num('arrive-cap-ms', 5200) / Math.max(1, idx.length))
  for (const i of idx) { await sleep(step); if (run !== w.run) return; show(i) }
  w.arrived = true; breathe(w)
  warm(w) }
function warm(w) { setTimeout(() => w.doors.map(d => d.to.photo).forEach(p => { photo(p); regOf(p.src) }), num('warm-ms', 2500)) } // the doors' worlds, ready before they are asked for, once the stone has settled

/* ---------- drawing: one facet, clipped to its cut, its layers, the lamp on its own angle, its bevel ---------- */
let Lx = innerWidth * .7, Ly = innerHeight * .2, Tx = Lx, Ty = Ly, lastMove = -1e9
addEventListener('pointermove', e => { Tx = e.clientX; Ty = e.clientY; lastMove = performance.now() })
function facet(P, c, n, layers, o = {}) {
  const Qp = inset(P, num('seam-px', 2.2) / 2 + (o.crack || 0))
  if (Qp.length < 3) return null
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); if (o.m) g.transform(...o.m)
  g.beginPath(); Qp.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip()
  const [x0, y0, x1, y1] = bbox(Qp), A = o.alpha ?? 1
  layers.forEach((L, li) => { const a = (L.alpha ?? 1) * A; if (a > .002 && L.img) { g.globalAlpha = a; g.save(); if (L.m) g.transform(...L.m); g.drawImage(L.img, 0, 0, W, H); g.restore() }
    if (li === 0 && o.wash && o.wash.a > .005) { g.globalCompositeOperation = 'color'; g.globalAlpha = A * o.wash.a; g.fillStyle = o.wash.hue; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.globalCompositeOperation = 'source-over' } }) // the idea's hue through the photograph in this facet, its light kept; the poem's words over it keep theirs
  g.globalAlpha = A
  let dx = Lx - c[0], dy = Ly - c[1]; const Z = Math.max(W, H) * .55, d = Math.hypot(dx, dy, Z); dx /= d; dy /= d
  const nz = Math.sqrt(Math.max(0, 1 - n[0] ** 2 - n[1] ** 2)), k = clamp01((n[0] * dx + n[1] * dy + nz * Z / d - .55) / .45) * num('lamp', .75)
  let ux = dx + n[0] * .6, uy = dy + n[1] * .6; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul
  const R = Math.max(x1 - x0, y1 - y0) / 2 || 1, gr = g.createLinearGradient(c[0] + ux * R, c[1] + uy * R, c[0] - ux * R, c[1] - uy * R)
  gr.addColorStop(0, `rgba(255,250,240,${.04 + k * .62})`); gr.addColorStop(.46, 'rgba(255,250,240,0)'); gr.addColorStop(1, `rgba(0,0,0,${.5 - k * .46})`)
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0)
  const gl = Math.max(0, 1 - Math.hypot(dx * .9 - n[0], dy * .9 - n[1]) * 2.2)
  if (gl > .02) { g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(Lx + n[0] * 120, Ly + n[1] * 120, 0, Lx + n[0] * 120, Ly + n[1] * 120, Math.max(W, H) * .22)
    rg.addColorStop(0, `rgba(255,246,228,${gl * gl * .3})`); rg.addColorStop(1, 'rgba(255,246,228,0)'); g.fillStyle = rg; g.fillRect(x0, y0, x1 - x0, y1 - y0) }
  g.globalCompositeOperation = 'source-over'
  if (o.shade) { g.fillStyle = `rgba(0,0,0,${o.shade})`; g.fillRect(x0, y0, x1 - x0, y1 - y0) }
  if (o.glow) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,248,232,${o.glow})`; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.globalCompositeOperation = 'source-over' }
  const bev = num('bevel', .6), sg = area2(Qp) > 0 ? 1 : -1, lk = o.k ?? 1
  g.lineWidth = num('bevel-px', 1.4) * 2 * lk
  for (let i = 0; i < Qp.length; i++) { const a = Qp[i], b = Qp[(i + 1) % Qp.length]; let ex = b[1] - a[1], ey = -(b[0] - a[0]); const el = Math.hypot(ex, ey); if (el < 1) continue
    ex = ex / el * sg; ey = ey / el * sg; const f = ex * ux + ey * uy
    g.strokeStyle = TINT ? '#f0f' : f > 0 ? `rgba(255,244,222,${bev * (.15 + .85 * k) * f})` : `rgba(0,0,0,${bev * .8 * -f})`
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke() }
  if (o.under > .01) { const Ui = inset(Qp, 5); let bi = -1, by = -1e9 // a photo door's mark: the quiet underline of a door line, along the facet's lowest side
    for (let i = 0; i < Ui.length; i++) { const a = Ui[i], b = Ui[(i + 1) % Ui.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dy = Math.abs(b[1] - a[1]) / (l || 1); if (l < 18 || dy > .5 || Math.max(a[1], b[1]) > H - 8) continue; const y = (a[1] + b[1]) / 2; if (y > by) { by = y; bi = i } }
    if (bi >= 0) { const a = Ui[bi], b = Ui[(bi + 1) % Ui.length], t0 = .18, t1 = .82; g.lineWidth = lk; g.strokeStyle = `rgba(243,239,230,${o.under})`; g.beginPath(); g.moveTo(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0); g.lineTo(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1); g.stroke() } }
  if (o.thread && o.thread.a > .005) { const Ti = inset(Qp, o.thread.px * .5 + .6); if (Ti.length > 2) { g.globalAlpha = A * o.thread.a; g.lineWidth = o.thread.px * lk; g.strokeStyle = o.thread.hue; g.beginPath(); Ti.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); g.globalAlpha = A } } // a ring round the rim: the facet whose idea's key has the focus
  if (o.edge > .01) { g.lineWidth = (o.edgePx || 1.2) * lk; g.strokeStyle = `rgba(255,246,228,${o.edge})`; g.beginPath(); Qp.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke() }
  if (o.fire > .01) { g.globalCompositeOperation = 'screen' // light split at the facet's edge: spectral fringes, the only colour, and only while the light passes through; set inside the edge (22 c set them outside, past its own clip: that was the faintness)
    ;[[255, 64, 40], [60, 255, 120], [70, 110, 255]].forEach(([rr, gg, bb], j) => { g.lineWidth = 1.6 - j * .3; g.strokeStyle = `rgba(${rr},${gg},${bb},${Math.min(1, o.fire) * .65})`
      for (let i = 0; i < Qp.length; i++) { const a = Qp[i], b = Qp[(i + 1) % Qp.length]; let ex = -(b[1] - a[1]), ey = b[0] - a[0]; const el = Math.hypot(ex, ey); if (el < 1) continue
        const s = (2 + j * 2.2) * sg; ex = ex / el * s; ey = ey / el * s; g.beginPath(); g.moveTo(a[0] + ex, a[1] + ey); g.lineTo(b[0] + ex, b[1] + ey); g.stroke() } })
    g.globalCompositeOperation = 'source-over' }
  g.restore(); return Qp }
const refr = () => num('refract-px', 5)
const textLayer = (w, i, n, cell, alpha = 1) => meets(bbox(cell), w.R, 24) ? [{ img: w.text, alpha, m: tr(n[0] * refr(), n[1] * refr()) }] : [] // each facet holds the poem a little off, so it breaks at the seams
/* the poem's words at rest: laid over the stone whole, each word as the facet under it holds it, a little off (the title as one piece, as its
   own facet holds it), so the poem still breaks from facet to facet but a seam passes behind a word and never eats a letter (9 Nov: a seam
   through the title read "thrum thrum" as "thrun thrum"; the crossing still breaks the words at the seams, as 39 drew it). Each word may be
   drawn in its own share of the line: from the middle of the space before it to the middle of the space after, between the rows above and below */
function chunksOf(w) {
  if (w.chunks && w.chunksLc === w.lc) return w.chunks
  const runs = w.lc.flatMap((L, li) => L.runs.map(r => ({ ...r, li }))), rows = new Map()
  for (const r of runs.sort((a, b) => a.top - b.top)) { const c = (r.top + r.bot) / 2, o = [...rows.values()].find(o => c > o.top && c < o.bot) // one row: the words whose middles lie within it (a door phrase can sit a pixel off its line)
    if (o) { o.top = Math.min(o.top, r.top); o.bot = Math.max(o.bot, r.bot); o.runs.push(r) } else rows.set(rows.size, { top: r.top, bot: r.bot, runs: [r] }) }
  const R = [...rows.values()].sort((a, b) => a.top - b.top), out = [], m = 24
  R.forEach((row, j) => { const y0 = j ? (R[j - 1].bot + row.top) / 2 : row.top - m, y1 = j < R.length - 1 ? (row.bot + R[j + 1].top) / 2 : row.bot + m
    const rs = row.runs.sort((a, b) => a.x - b.x)
    rs.forEach((r, k) => out.push({ r, li: r.li, title: r.k === 'title', x0: k ? (rs[k - 1].x + rs[k - 1].w + r.x) / 2 : r.x - m, x1: k < rs.length - 1 ? (r.x + r.w + rs[k + 1].x) / 2 : r.x + r.w + m, y0, y1, i: -1 })) })
  w.chunkSt = null; w.chunksLc = w.lc; return w.chunks = out }
function wordsAt(w) { // each word's facet (where its middle lies) and the shift that facet gives it, again whenever the poem scrolls
  const ch = chunksOf(w), st = w.v.scrollTop; if (w.chunkSt === st && w.chunkCut === w.cells && w.chunkT === w.titleI) return ch
  const [rx, ry] = w.R, ds = drawn(w)
  for (const c of ch) { const p = [rx + c.r.x + c.r.w / 2, ry - st + (c.r.top + c.r.bot) / 2]; c.i = c.title && w.titleI >= 0 ? w.titleI : ds.find(i => inPoly(p, w.cells[i])) ?? -1
    const n = c.i >= 0 ? w.normals[c.i] : [0, 0]; c.d = [0, Math.round(n[1] * refr() * num('word-shift', .6) * DPR) / DPR] } // up or down only, and less than the stone's own: the spaces between words keep their width; by whole pixels, so a word is copied, never resampled
  w.chunkSt = st; w.chunkCut = w.cells; w.chunkT = w.titleI; return ch }
function words(w, o = {}) { if (!w.text || !w.lc) return
  const ch = wordsAt(w), [rx, ry] = w.R, st = w.v.scrollTop
  drawGrounds(w); if (o.bare) return // bare: the stone and its grounds, as the words are read against
  const by = new Map(); for (const c of ch) { const k = c.d[0] + ',' + c.d[1]; if (!by.has(k)) by.set(k, { d: c.d, cs: [] }); by.get(k).cs.push(c) }
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalAlpha = 1
  for (const { d, cs } of by.values()) { g.save(); g.beginPath(); for (const c of cs) g.rect(rx + c.x0 + d[0], ry - st + c.y0 + d[1], c.x1 - c.x0, c.y1 - c.y0); g.clip(); g.drawImage(w.text, d[0], d[1], W, H); g.restore() }
  g.restore() }

/* the grounds: under each text on the stone that would not read at AA over what is drawn there (the lamp and a lifted facet included),
   the lightest shade that makes it read, feathered so it is no box; none where it reads already. Read off the stone before the words, every
   ground-ms and whenever what shows changes, and eased, never jumping; not while a key's ring is on a facet (it is gone in a moment) */
const GROUND = [13, 12, 11], INK = [243, 239, 230] // --ink-seam, the stone's own dark; --ink-on, the poem's
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, lumRGB = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
const ratio = (a, b) => { const x = lumRGB(a), y = lumRGB(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
const blend = (top, a, bot) => [0, 1, 2].map(j => top[j] * a + bot[j] * (1 - a))
const rgbOf = s => { const v = (/rgba?\(([^)]+)\)/.exec(s) || [, '0 0 0'])[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] }
const opOf = e => { let op = 1; for (let q = e; q && q !== document.body; q = q.parentElement) op *= +getComputedStyle(q).opacity; return op }
const GR = { t: -1e9, due: true, snap: false, list: new Map() }
const groundSoon = () => { GR.due = true }
const LABELS = [['cap', '#cap', 1], ['year', '#year', 1], ['name', 'header h1 a'], ['where', '#where'], ['nav', 'header nav'], ['vs', '.vs']] // [key, the text, its opacity when shown, where it comes and goes]
function groundTargets(w) { const out = [], [rx, ry, rw, rh] = w.R, st = w.v.scrollTop
  const lines = new Map(); for (const c of wordsAt(w)) { const y = ry - st + c.r.top + c.d[1]; if (y > ry + rh || y + c.r.bot - c.r.top < ry) continue
    if (!lines.has(c.li)) lines.set(c.li, []); lines.get(c.li).push([rx + c.r.x + c.d[0], y, c.r.w, c.r.bot - c.r.top]) }
  for (const [li, rects] of lines) out.push({ key: 'l' + li, rects, parts: rects.map(r => [[r], [[INK, 1]]]), fade: () => w.A[li] }) // each word must read, not the line on average
  for (const [key, q, shown] of LABELS) { const e = $(q); if (!e) continue; const rects = [], parts = [], own = () => +getComputedStyle(e).opacity, rest = shown ?? own(), up = opOf(e) / (own() || 1)
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); for (let n; (n = tw.nextNode());) { if (!n.data.trim()) continue
      const p = n.parentElement, c = rgbOf(getComputedStyle(p).color); let op = up * rest; for (let x = p; x && x !== e; x = x.parentElement) op *= +getComputedStyle(x).opacity
      if (op * c[3] < .5 || p.closest('.out')) continue // a text on its way out (35's readings fading into the sentence) is not read; the sentence it becomes is
      const rg = document.createRange(); rg.selectNodeContents(n); const rs = [...rg.getClientRects()].filter(b => b.width > 0).map(b => [b.left, b.top, b.width, b.height]); rects.push(...rs); parts.push([rs, [[c, c[3] * op]]]) }
    if (rects.length) out.push({ key, rects, parts, fade: () => own() / (rest || 1) }) }
  return out }
function needOf(rects, inks, d) { // how dark a ground under these rects must be for every ink to read at AA over all but the brightest few of the pixels there (d: the stone as read)
  const px = [], q = num('ground-quantile', .99)
  for (const [x, y, ww, hh] of rects) { const x0 = Math.max(0, Math.floor(x * DPR)), y0 = Math.max(0, Math.floor(y * DPR)), x1 = Math.min(cv.width, Math.ceil((x + ww) * DPR)), y1 = Math.min(cv.height, Math.ceil((y + hh) * DPR))
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx += 2) { const j = (yy * cv.width + xx) * 4; px.push([lumRGB([d[j], d[j + 1], d[j + 2]]), d[j], d[j + 1], d[j + 2]]) } }
  if (!px.length) return 0
  px.sort((a, b) => a[0] - b[0]); const bg = px[Math.min(px.length - 1, Math.floor(px.length * q))].slice(1), aa = num('ground-aa', 4.8), max = num('ground-max', .9)
  const reads = a => { const b = blend(GROUND, a, bg); return inks.every(([c, op]) => ratio(blend(c, op, b), b) >= aa) }
  let a = 0; while (a < max && !reads(a)) a = Math.min(max, a + .02); return a }
function spriteOf(rects) { // the shade itself: the text's boxes widened and blurred, so it is full strength under every word and fades out past them
  const f = num('ground-feather-px', 8), m = f * 2.6, b = rects.reduce((o, [x, y, ww, hh]) => [Math.min(o[0], x), Math.min(o[1], y), Math.max(o[2], x + ww), Math.max(o[3], y + hh)], [1e9, 1e9, -1e9, -1e9])
  const c = document.createElement('canvas'); c.width = Math.ceil((b[2] - b[0] + m * 2) * DPR); c.height = Math.ceil((b[3] - b[1] + m * 2) * DPR); const x = c.getContext('2d')
  x.setTransform(DPR, 0, 0, DPR, (m - b[0]) * DPR, (m - b[1]) * DPR); x.filter = `blur(${f / 2 * DPR}px)`; x.fillStyle = `rgb(${GROUND})`
  for (const [rx0, ry0, ww, hh] of rects) { x.beginPath(); x.roundRect(rx0 - f * 1.5, ry0 - f * 1.5, ww + f * 3, hh + f * 3, f); x.fill() }
  return { c, at: [(b[0] - m) * DPR, (b[1] - m) * DPR] } }
function groundRead(w) { const seen = new Set(), d = g.getImageData(0, 0, cv.width, cv.height).data // one read of the stone, every ground from it
  for (const T of groundTargets(w)) { seen.add(T.key); const t = Math.max(0, ...T.parts.map(([rs, inks]) => needOf(rs, inks, d))), sig = T.rects.map(r => r.map(v => Math.round(v)).join(',')).join(';'), G = GR.list.get(T.key) || { a: 0 }
    G.t = t; G.fade = T.fade; if (G.sig !== sig) { G.sig = sig; G.sprite = t > 0 || G.a > .004 ? spriteOf(T.rects) : null; G.rects = T.rects } else if (!G.sprite && t > 0) G.sprite = spriteOf(T.rects)
    if (GR.snap) G.a = t; GR.list.set(T.key, G) }
  for (const [k, G] of GR.list) if (!seen.has(k)) { G.t = 0; if (GR.snap) G.a = 0 }
  GR.due = false; GR.snap = false }
function drawGrounds(w) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0)
  for (const G of GR.list.values()) { const a = G.a * (G.fade ? G.fade() : 1); if (a < .004 || !G.sprite) continue; g.globalAlpha = Math.min(1, a); g.drawImage(G.sprite.c, G.sprite.at[0], G.sprite.at[1]) }
  g.restore() }
function groundEase(dt) { const k = 1 - Math.exp(-dt / num('ground-ease-ms', 160)); for (const G of GR.list.values()) if (Math.abs(G.t - G.a) > .002) G.a += (G.t - G.a) * k; else G.a = G.t }

/* ---------- the title's facet: the poem's own piece of the stone, and the way to the whole poem ---------- */
function titleFacet(w, skip) { // of the facets the title lies in (barred to the ideas), the one holding most of it that is not the date's
  const a = w.v && w.v.querySelector('h2 a'); if (!a) return null
  const cand = [...barred(w).title].filter(i => i !== skip), pts = []; if (!cand.length) return null
  for (const r of a.getClientRects()) for (let u = 0; u <= 6; u++) for (let v = 0; v <= 2; v++) pts.push([r.left + r.width * u / 6, r.top + r.height * v / 2])
  const [i, n] = cand.map(i => [i, pts.filter(p => inPoly(p, w.cells[i])).length]).sort((x, y) => y[1] - x[1] || x[0] - y[0])[0]
  return { i, href: '/poems/' + w.poem.slug + '.html', basis: { rule: 'the facet the title lies in', share: +(n / pts.length).toFixed(2), title: w.poem.title } } }
/* a facet that is one thing to take: its ground toned down under the title, its rim drawn clear all round, brighter under a pointer */
const DARK = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = 'rgb(13,12,11)'; x.fillRect(0, 0, 1, 1); return c })()
function titlePiece(w, i, o, layers) { if (w.titleI !== i || o.plain) return o
  const tone = num('title-tone', .3), edge = num('title-edge', .55), lit = FX.hover === i || FX.press === i; layers.splice(1, 0, { img: DARK, alpha: tone })
  const o2 = { ...o, edge: Math.max(o.edge || 0, lit ? Math.min(1, edge * num('piece-lit', 1.6)) : edge), edgePx: num('piece-edge-px', 1.4) }; w.drewPiece = { i, tone, edge: o2.edge }; return o2 }
function drawWorld(w, o = {}) { const touched = w === cur && !crossing && !pressing && !o.plain
  w.drewPiece = null
  w.cells.forEach((P, i) => { const base = [{ img: w.img }] // the poem's words are laid over the stone afterwards, whole (words below)
    const k = w.ideaAt ? w.ideaAt.get(i) : undefined, o2 = k != null && !o.plain ? markOf(w, i, k, o) : o // a facet that holds an idea: its mark, nothing written
    if (!touched) { const o3 = titlePiece(w, i, o2, base); return note('r' + i, facet(P, w.cents[i], w.normals[i], base, o3), o3.m, o.alpha ?? 1) }
    const f0 = { ...o2, ...fxOf(w, i) }; f0.glow = Math.max(f0.glow || 0, o2.glow || 0); if (CARD.open && CARD.i === i) { f0.edge = Math.max(f0.edge || 0, num('card-lit-edge', 0.9)); f0.edgePx = num('piece-edge-px', 1.4) * 1.5; f0.glow = Math.max(f0.glow || 0, num('card-lit-glow', 0.1)) } /* 43: the facet that is speaking, lit */ const fx = titlePiece(w, i, f0, base); note('r' + i, facet(P, w.cents[i], w.normals[i], base, fx), fx.m, 1) }) } // at rest and touched alike, every facet holds this photograph: nothing is swapped in
/* the ledger (39's): every facet drawn this frame, as drawn (its polygon after the seam and any transform), and how much of it is seen.
   The check reads it frame by frame: nothing may leave it, or join it, while it is seen */
let ledger = { t: null, list: [] }
function note(id, Qp, m, seen) { const e = { id, seen: +(+seen).toFixed(4), area: 0, c: null, Q: null }
  if (Qp) { const M = m || [1, 0, 0, 1, 0, 0], Q = Qp.map(([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]), A = Math.abs(area2(Q)) / 2
    Object.assign(e, { area: +A.toFixed(1), c: centroid(Q).map(v => +v.toFixed(2)), Q: Q.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]) }) }
  ledger.list.push(e) }
function clear() { g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalAlpha = 1; g.fillStyle = TINT ? '#f0f' : '#0d0c0b'; g.fillRect(0, 0, W, H) }
let TINT = false // the check's: the seams drawn in a colour no photograph has, to see whether any reaches into a word

/* ---------- the facets, touched ---------- */
const FX = { hover: -1, press: -1, pulses: [], seq: 0, last: null }
const drawn = w => w.cells.map((P, i) => P.length > 2 && inset(P, num('seam-px', 2.2) / 2).length > 2 ? i : -1).filter(i => i >= 0)
function touchAt(w, i, o = {}) { // a place a finger can land on facet i that is the facet's: not a door line's row (all of them, o.all), not on or a finger's width from a link
  const P = inset(w.cells[i], 5); if (P.length < 3) return null
  const m = navigator.maxTouchPoints > 0 ? 26 : 4, step = o.first ? 8 : 4, rect = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom] }
  const links = [...document.querySelectorAll('#mat a, #where, .vs a'), ...w.v.querySelectorAll('h2 a, .door')].map(rect), sw = o.avoid || [] // the where line is one too: a tap there opens the chain, not the facet
  const [x0, y0, x1, y1] = bbox(P), c = w.cents[i]; let best = null, bd = Infinity
  for (let y = Math.ceil(y0); y <= y1; y += step) for (let x = Math.ceil(x0); x <= x1; x += step) {
    if (x < 1 || y < 1 || x > W - 1 || y > H - 1 || !inPoly([x, y], P) || doorAt(x, y, w, o.all)) continue
    if (links.some(([l, t, r, b]) => Math.hypot(Math.max(l - x, 0, x - r), Math.max(t - y, 0, y - b)) < m) || sw.some(([l, t, r, b]) => x >= l && x <= r && y >= t && y <= b)) continue
    if (o.first) return [x, y]
    const d = Math.hypot(x - c[0], y - c[1]); if (d < bd) { bd = d; best = [x, y] } }
  return best }
function facetAt(x, y) { if (!cur) return -1; for (const i of drawn(cur)) if (inPoly([x, y], cur.cells[i])) return i; return -1 }
function doorAt(x, y, w = cur, all = false) { // a door line's row, a little taller than it reads: the poem's, never a facet's
  if (!w || (w.mode !== 'world' && !all)) return null
  const vr = w.v.getBoundingClientRect(), s = phone() || low() ? num('door-slop-phone-px', 10) : num('door-slop-px', 4)
  let best = null, bd = Infinity
  for (const d of w.doors) { const l = d.el.closest('.l'); if (!l || (!all && !l.classList.contains('shown'))) continue
    for (const r of l.getClientRects()) { const top = Math.max(r.top, vr.top), bot = Math.min(r.bottom, vr.bottom); if (bot - top < 4) continue
      if (x >= r.left - s && x <= r.right + s && y >= top - s && y <= bot + s) { const dd = Math.abs(y - (top + bot) / 2); if (dd < bd) { bd = dd; best = d } } } }
  return best }
const said = (i, kind, more = {}) => { FX.seq++; FX.last = { i, kind, seq: FX.seq, ...more } }
function pulse(i, amp = 1.4, ms = 650) { FX.pulses.push({ i, amp, ms, t0: performance.now() }) }
function breathe(w) { if (!reduce()) w.breath0 = performance.now() + num('breath-delay-ms', 400) }

/* ---------- Study 37's one question: every facet is dealt a segment of his work, linked by something real to where it sits; since 12 Nov the
   segment is never shown, only where it leads (its move: a poem and a photograph that hold what it holds) ---------- */
const PLAN = 'home-plan-2' // (was home-plan, before the ideas took six facets and the cut its own re-seeds: a plan kept from then is for another cut) a facet's segment is dealt once and kept for the visit: the same facet, the same door
const planStore = () => { try { return JSON.parse(sessionStorage.getItem(PLAN)) || {} } catch { return {} } }
const planKey = w => [Y, W, H, w.key].join('|')
const D37 = { SEG: null, data, VOC, KIN, stanzasOf } // filled when segments.json arrives; the wall's sentences are the tools facet's now, whole
let segById = new Map()
const segBy = id => segById.get(id)
function facetsOf(w) { // each drawn facet as 33's cut describes it (its centre on the photograph, the tone mass, salience, edges), with the door line that crosses it and the poem line beside it
  const R = REG[w.photo.src] || null, fcs = S33Cut.facets(w.cut, w.cells, W, H, num('wind', 8), R)
  const ls = [...w.v.querySelectorAll('.l')].map((l, k) => { const r = l.getBoundingClientRect(); return { k, y: r.top + r.height / 2 } })
  return drawn(w).map(i => { const P = w.cells[i]
    const door = w.doors.findIndex(d => { const l = d.el.closest('.l'); return [...l.getClientRects()].some(r => { for (let a = 0; a <= 4; a++) for (let b = 0; b <= 1; b++) if (inPoly([r.left + r.width * a / 4, r.top + r.height * (.25 + b * .5)], P)) return true; return false }) })
    const near = ls.length ? ls.reduce((b, l) => Math.abs(l.y - w.cents[i][1]) < Math.abs(b.y - w.cents[i][1]) ? l : b, ls[0]) : null
    return S37.describe(fcs[i], R, { door: door >= 0 ? door : null, line: near ? near.k : null, c: fcs[i].centroid }) }) }
/* ---------- the six ideas BEHIND six facets, never on screen at rest; which facet holds which, and why (41 b, by meaning) ---------- */
const toolsEl = $('#tools')
const rectOf = q => { const e = typeof q === 'string' ? document.querySelector(q) : q, r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }
const meet = (a, b, pad = 0) => a[0] < b[0] + b[2] + pad && a[0] + a[2] + pad > b[0] && a[1] < b[1] + b[3] + pad && a[1] + a[3] + pad > b[1]
const gapOf = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3]))) // edge to edge, 0 when they touch
function whereRect() { const r = rectOf('#where'); return r[3] > 0 ? r : rectOf('#mat h1') } // the line that says where he is and the sky; before it is written, the name it sits under
function capFor(w) { const was = cap.textContent; cap.textContent = w.photo.caption || ''; const r = rectOf('#cap'); cap.textContent = was; return r } // this world's caption, where it will sit (a world is planned before it is shown)
const whereWords = () => (FS.line ? FS.line.sentence : whereEl.textContent).trim()
function reachOf(P, r) { // how far a facet's own cut is from a thing on the stone: 0 when it holds the thing's centre or touches it, else edge to edge
  if (inPoly([r[0] + r[2] / 2, r[1] + r[3] / 2], P)) return 0
  let d = Infinity; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
    for (let s = 0; s <= n; s++) d = Math.min(d, gapOf([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n, 0, 0], r)) }
  return d }
const seamWith = (P, Q) => P.filter(p => Q.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5)).length >= 2 // two facets share a seam: two corners in common
function hitsOf(w, rects) { const out = new Set() // the facet a run of words sits in: the one under its middle (each line of it, if it wraps)
  for (const r of rects) { const p = [r.left + r.width / 2, r.top + r.height / 2]; for (const i of drawn(w)) if (inPoly(p, w.cells[i])) out.add(i) }
  return out }
function barred(w) { // the facets no idea may take: the title's (it is a link to the poem) and each door's, the facet its words sit in (a crossing leaves from there)
  return { title: hitsOf(w, [...w.v.querySelector('h2 a').getClientRects()]), doors: hitsOf(w, w.doors.flatMap(d => [...d.el.getClientRects()])) } }
function legalOf(w, yearI = -1) { const { title, doors } = barred(w) // and a finger must be able to land on it, clear of every door row and link
  return drawn(w).filter(i => i !== yearI && !title.has(i) && !doors.has(i) && touchAt(w, i, { first: true, all: true })) }
/* b's table: each idea and the thing on the stone it answers to, chosen in this order, each the nearest free facet to its thing.
   Keyed by name: re-cut IDEAS and check.mjs says which idea has no reason */
const MEANING = [
  ['Context', w => ({ r: whereRect(), said: d => `nearest ‘${whereWords()}’ · the place and the sky it states are what this idea gathers` })],
  ['Topically suggesting', w => ({ r: rectOf(w.v.querySelector('h2')), said: d => `nearest the title, ‘${w.poem.title}’ · today’s poem is the suggestion this moment made` })],
  ['Home', w => ({ r: rectOf('#mat h1'), said: d => `nearest his name · this page is one of the things the home runs` })],
  ['Keeping track', w => ({ year: true, said: (d, nb, lab, none) => none ? `nearest the caption, the photograph’s place · the record is kept by where and when` : nb ? `beside the date, ${lab} · a seam shared with it · the record is kept by when` : `nearest the date, ${lab} · the record is kept by when` })],
  ['Staying up to date', w => ({ r: rectOf('.vs'), said: d => `nearest v3 · v2 · v1 · the site kept current, its earlier versions still open` })],
  ['Self-healing', w => ({ watch: true, said: (n, d) => n ? `sharing a seam with ${n} of the five it watches · they are kept running from here` : `nearest the middle of the five it watches · they are kept running from here` })]]
function assign(w, legal, yearI) { // the six ideas, each { k, i, d, basis }, in IDEAS' order (41 b, by meaning); null if this cut cannot seat them all
  if (legal.length < IDEAS.length) return null
  const out = new Array(IDEAS.length).fill(null), free = new Set(legal), yr = recOf(w.photo.src), lab = yr ? dateLabel(yr) : 'unknown'
  for (const [name, f] of MEANING) { const k = IDEAS.findIndex(I => I.name === name); if (k < 0) continue; const m = f(w)
    if (m.watch) continue
    let pick
    if (m.year) { const Y0 = yearI >= 0 ? w.cells[yearI] : null, yb = yearI >= 0 ? (() => { const c = w.cents[yearI]; return [c[0], c[1], 0, 0] })() : capFor(w)
      const c = [...free].map(i => ({ i, nb: !!Y0 && seamWith(w.cells[i], Y0), d: reachOf(w.cells[i], yb) })).sort((a, b) => b.nb - a.nb || a.d - b.d || a.i - b.i)[0]
      if (c) pick = { i: c.i, d: c.d, basis: m.said(c.d, c.nb, lab, !Y0) } } // no date on this stone: the caption, which names the photograph's place
    else { const c = [...free].map(i => ({ i, d: reachOf(w.cells[i], m.r) })).sort((a, b) => a.d - b.d || a.i - b.i)[0]; if (c) pick = { i: c.i, d: c.d, basis: m.said(c.d) } }
    if (!pick) return null; free.delete(pick.i); out[k] = { k, i: pick.i, d: +pick.d.toFixed(1), basis: pick.basis } }
  for (const [name, f] of MEANING) { const k = IDEAS.findIndex(I => I.name === name); if (k < 0) continue; const m = f(w); if (!m.watch) continue
    const five = out.filter(Boolean).map(x => x.i), mid = five.reduce((s, i) => [s[0] + w.cents[i][0] / five.length, s[1] + w.cents[i][1] / five.length], [0, 0])
    const c = [...free].map(i => ({ i, n: five.filter(j => seamWith(w.cells[i], w.cells[j])).length, d: Math.hypot(w.cents[i][0] - mid[0], w.cents[i][1] - mid[1]) })).sort((a, b) => b.n - a.n || a.d - b.d || a.i - b.i)[0]
    if (!c) return null; free.delete(c.i); out[k] = { k, i: c.i, d: +c.d.toFixed(1), n: c.n, basis: m.said(c.n, c.d) } }
  return out.every(Boolean) ? out : null }
function markOf(w, i, k, o) { // how a holding facet reads as different at rest, without a word: a breath of its idea's hue through the facet (41 b);
  // its key focused from the keyboard, a ring round its rim, so the eye finds the facet the key opens
  const hue = HUE[IDEAS[k].hue] || 'rgb(243,239,230)', open = toolsOpen === k && toolsAt === i && w === cur
  return { ...o, wash: { hue, a: num('idea-wash', .2) + (open ? num('idea-open-lift', .2) : 0) }, thread: keyAt === k && w === cur ? { hue: 'rgb(243,239,230)', a: num('focus-ring-alpha', .95), px: num('focus-ring-px', 2.5) } : null } }
let toolsOpen = -1, toolsAt = -1, keyAt = -1
function toolsBand(w) { // the clear band for an idea: away from the poem and the name; the caption steps aside while it is open
  const R = w.R, m = rectOf('#mat'), v = rectOf('.vs'), pad = 16, cands = []
  if (phone()) cands.push([pad, v[1] + v[3] + 6, W - pad * 2, R[1] - 12 - (v[1] + v[3] + 6)])
  else { const left = Math.max(16, Math.min(56, W * .034)), top = low() ? 12 : Math.max(48, H * .07)
    cands.push([left, top, Math.min(low() ? 9999 : num('tools-band-px', 440), R[0] - 24 - left), m[1] - 14 - top]) }
  const b = cands[0]; return [b[0], b[1], Math.max(0, b[2]), Math.max(0, b[3])] }
/* ---------- what opens (42 a). First and largest, the idea at work on this world (/v3/here.js, every fact live); beneath, smaller, how it
   works generally (IDEAS' intro, tools and boundary, read from /v2/home.js); the one quiet line that says why this facet. here.js and what it
   reads are fetched once the stone is up, never for the first screen; if any of it fails, the panel opens with the general alone ---------- */
let hereGo = null, openedAt = 0
const hereReady = () => hereGo ||= Promise.all([script('/v3/here.js').then(() => S42.load()), whyReady()]).catch(e => { console.error('here: ' + (e && e.stack || e)); return null })
const readAt = () => { try { const c = JSON.parse(sessionStorage.getItem('kahranWeatherCache')); return c && typeof c.at === 'number' ? c.at : null } catch { return null } } // weather.js's own note of when it read the sky
async function hereFor(photo, poem, mode) { const ok = await hereReady(); if (!ok || !window.S42) return {} // nothing of this world to say: the general alone
  try { return S42.say(S42.facts({ photo, poem, mode, ctx, model: whyModel, stepOf: window.S34 ? S34.stepOf : null, where: whereWords(), readAt: readAt(), XJ, IDEAS, src: await S42.load() })) }
  catch (e) { console.error('here: ' + (e && e.stack || e)); return {} } }
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
function snap() { // the panel shows whole lines: where its room ends inside a line, it ends at the line before, and scrolls for the rest
  if (cardMode()) { cardSnap(); return cardMore() } // 43 c: the card's room ends on a whole line, and its own cut says there is more
  const t = toolsEl, room = parseFloat(t.dataset.room || '0'); if (!room) return
  t.style.maxHeight = room + 'px'; if (t.scrollHeight <= room + 1) return
  const top = t.getBoundingClientRect().top, pad = parseFloat(getComputedStyle(t).paddingBottom) || 0, lines = []
  const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.height) lines.push(q.bottom - top + t.scrollTop) } else n.childNodes.forEach(walk) }
  t.querySelectorAll(':scope > *:not([hidden])').forEach(c => { if (c.offsetParent !== null) walk(c) })
  const fit = lines.filter(b => b <= room - pad).sort((a, b) => b - a)[0]; if (fit) t.style.maxHeight = Math.ceil(fit) + 'px' } // the edge on a line's foot: the next line starts below it, none is cut
function toolItem(I, j, open) { const li = mk('li'), b = mk('button', null, I.parts[j]), q = mk('p', null, (I.detail.tools || [])[j] || '')
  b.type = 'button'; b.dataset.part = j; b.setAttribute('aria-expanded', String(!!open)); q.hidden = !open; li.append(b, q); return li }
function fill(k, said) { // lays the panel for idea k: this world's sentences (none yet, or none to say), the basis line, the general
  const I = IDEAS[k], d = I.detail || {}, p = cur && planOf(cur)[toolsAt], t = toolsEl
  t.textContent = ''
  const h = mk('h2'); if (I.href) h.append(Object.assign(mk('a', null, I.name), { href: I.href })); else h.textContent = I.name
  const basis = p && p.basis ? mk('small', 'basis', p.basis) : null, gen = mk('div', 'gen'), L = said ? said[I.name] || [] : []
  t.append(h)
  if (L.length) t.append(mk('p', 'here', L.map(x => x.s).join(' '))); if (basis) t.append(basis)
  gen.append(mk('p', 'intro', d.intro || '')); const ul = mk('ul'); I.parts.forEach((_, j) => ul.append(toolItem(I, j, false))); gen.append(ul)
  if (d.boundary) gen.append(mk('p', 'boundary', d.boundary))
  t.append(gen)
  t.dataset.ready = said ? 'yes' : 'no'; snap() }
function openTools(k, i) { const w = cur, I = IDEAS[k]; if (!w || !I) return
  if (cardMode()) cardRoom()
  openedAt = performance.now()
  toolsOpen = k; toolsAt = i; keysOpen(); document.body.classList.add('tools-open'); toolsEl.style.setProperty('--hue', HUE[I.hue] || ''); toolsEl.textContent = ''
  const [l, t, bw, bh] = toolsBand(w); Object.assign(toolsEl.style, { left: l + 'px', top: t + 'px', width: bw + 'px', maxHeight: bh + 'px' }); toolsEl.dataset.room = bh
  if (!phone()) Object.assign(toolsEl.style, { top: '', bottom: H - t - bh + 'px' }) // it rises from the name and the where line, and grows upward as tools open
  else toolsEl.style.bottom = ''
  fill(k, w.said || null); toolsEl.scrollTop = 0
  toolsEl.classList.add('on'); said(i, 'idea', { idea: I.name, k })
  if (cardMode()) cardOpen('idea', i, toolsEl, { hue: HUE[I.hue] }) // 43: on a phone the idea is the card
  if (!w.said) hereFor(w.photo, w.poem, w.mode).then(S => { w.said = S; if (cur === w && toolsOpen === k && toolsAt === i) { fill(k, S); toolsEl.scrollTop = 0 } }) }
function closeTools() { if (toolsOpen < 0) return; toolsOpen = -1; toolsAt = -1; keysOpen(); toolsEl.classList.remove('on'); document.body.classList.remove('tools-open'); cardShut('idea') }
/* the way in without a pointer (the canvas is hidden from assistive tech): six buttons, one per idea in IDEAS' order, named for it and never
   shown; focusing one rings its facet, Enter or Space opens it, Escape closes it and gives the focus back */
const keysEl = $('#keys')
IDEAS.forEach((I, k) => { const b = mk('button'); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-label', I.name); b.setAttribute('aria-controls', 'tools'); b.setAttribute('aria-expanded', 'false')
  b.addEventListener('focus', () => { keyAt = k }); b.addEventListener('blur', () => { if (keyAt === k) keyAt = -1 })
  b.addEventListener('click', () => { const x = cur && !busy && fixedOf(cur).ideas.find(x => x.k === k); if (!x) return
    if (toolsOpen === k) return closeTools(); track('tools_open', { idea: I.name, via: 'key' }); openTools(k, x.i) })
  keysEl.append(b) })
function keysOpen() { for (const b of keysEl.children) b.setAttribute('aria-expanded', String(+b.dataset.k === toolsOpen)) }
const toolSet = (b, open) => { b.nextElementSibling.hidden = !open; b.setAttribute('aria-expanded', String(open)); snap() }
function deeper() { // the idea's own facet again: its next tool opens, in the table's order; past the last, the facet has given all it holds and closes
  const i = toolsAt; pulse(i, .8, 500); openedAt = performance.now() // the click this touch sends next must not land on what it lays open
  const b = [...toolsEl.querySelectorAll('li > button')].find(b => b.getAttribute('aria-expanded') === 'false')
  if (!b) { said(i, 'closed', { idea: IDEAS[toolsOpen].name }); return closeTools() }
  toolSet(b, true); b.parentElement.scrollIntoView({ block: 'nearest' }); said(i, 'tool', { idea: IDEAS[toolsOpen].name, part: +b.dataset.part }) }
toolsEl.addEventListener('click', e => { const b = e.target.closest('li > button'); if (b && performance.now() - openedAt > 400) toolSet(b, b.getAttribute('aria-expanded') !== 'true') }) // not the click a touch on the facet sends after it, landing on the panel that touch just opened
addEventListener('pointerdown', e => { if (cardMode() || toolsOpen < 0 || e.target.closest('#tools')) return; e.stopImmediatePropagation() // with an idea open, a touch elsewhere only closes it; its own facet goes deeper
  if (cur && !e.target.closest('a, button, header') && facetAt(e.clientX, e.clientY) === toolsAt && !doorAt(e.clientX, e.clientY, cur, true)) return deeper()
  closeTools() }, true)
addEventListener('keydown', e => { if (e.key !== 'Escape' || toolsOpen < 0 || cardMode()) return; const k = toolsOpen; closeTools(); if (e.target.closest?.('#keys, #tools')) keysEl.children[k].focus({ preventScroll: true }) })
/* the facets placed by a reason of their own, before anything is dealt: the photograph's date (38 c: the facet where its month and year
   read clearest on the photograph itself), then the six ideas by 41 b's rule, never on the date's, the title's or a door's facet (the facet its words lie on) */
function fixedOf(w) {
  if (w.fixed) return w.fixed
  const fs = facetsOf(w), year = yearFacet(w, fs, null), yearI = year ? year.i : -1, legal = legalOf(w, yearI), ideas = assign(w, legal, yearI) || []
  const title = titleFacet(w, yearI) // the title's own facet, among those no idea may take
  w.yearI = yearI; w.titleI = title ? title.i : -1; w.ideaAt = new Map(ideas.map(x => [x.i, x.k])); w.chunkSt = null
  return w.fixed = { fs, year, ideas, legal, title } }
function planOf(w) {
  if (w.plan) return w.plan
  const { fs, year, ideas, title } = fixedOf(w), plan = w.cells.map(() => null)
  if (title) plan[title.i] = { kind: 'title', id: 'title', facet: fs.find(f => f.i === title.i), href: title.href, basis: title.basis, steps: [{ t: 'title' }] }
  for (const x of ideas) plan[x.i] = { kind: 'idea', id: 'idea:' + x.k, k: x.k, facet: fs.find(f => f.i === x.i), basis: x.basis, d: x.d, steps: [{ t: 'idea' }] }
  if (year) plan[year.i] = { kind: 'year', id: 'year', facet: fs.find(f => f.i === year.i), box: year.box, at: year.at, basis: year.basis, rec: year.rec, steps: [{ t: 'year' }] }
  if (!SEG) return plan // the rest is dealt when segments.json is here (segReady); until then only these are known
  const st = planStore(), key = planKey(w), fixed = p => p && (p.kind === 'idea' || p.kind === 'year' || p.kind === 'title')
  if (st[key] && st[key].length === w.cells.length && st[key].every((p, i) => fixed(plan[i]) ? true : !p || segBy(p.id))) { w.plan = st[key].map((p, i) => fixed(plan[i]) ? plan[i] : p && { ...p, seg: segBy(p.id) }); return w.plan } // the visit's plan, verbatim
  const world = { photo: w.photo.src, poem: w.poem.slug, trail: w.trail, doors: w.doors.map(d => ({ phrase: d.phrase, word: d.word, line: d.line })),
    taken: w.doors.map(d => d.to.photo.src), takenPoems: w.doors.map(d => d.to.poem.slug) } // the door lines' worlds are theirs: no facet promises one
  const rest = fs.filter(f => !w.ideaAt.has(f.i) && f.i !== w.yearI && f.i !== w.titleI) // the ideas, the date and the title take their facets first; the rest give his work
  const dealt = S37.deal(world, rest, D37, Y)
  rest.forEach((f, k) => { const p = dealt[k]; if (p) plan[f.i] = { kind: p.seg.kind, id: p.seg.id, seg: p.seg, link: p.link, cls: p.cls, basis: p.basis, facet: f, to: p.to, steps: p.steps } })
  st[key] = plan.map(p => p && (fixed(p) ? { kind: p.kind } : { ...p, seg: undefined })); try { sessionStorage.setItem(PLAN, JSON.stringify(st)) } catch {}
  return w.plan = plan }
/* ---------- the year facet (38 c): the photograph's month and year from its own EXIF (crossings.json, from the file itself), in the facet where it reads clearest ---------- */
const yearEl = $('#year'), yearA = yearEl.querySelector('a')
const recOf = src => XJ.photos.find(p => p.src === src)
const dateLabel = r => { const [y, m] = r.taken.split('-'); return MON[+m - 1] + ' ' + y }
const lumCache = new WeakMap()
function lumOf(img) { // the photograph as it lies on the screen, the shade under the poem included, at a sixth of the size: what the date is read against
  const had = lumCache.get(img); if (had) return had
  const s = 1 / 6, w = Math.max(1, Math.ceil(img.width * s)), h = Math.max(1, Math.ceil(img.height * s)), c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h); const px = x.getImageData(0, 0, w, h).data
  const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }
  const out = (X0, Y0) => { const i = (Math.min(h - 1, Math.max(0, Math.round(Y0 * DPR * s))) * w + Math.min(w - 1, Math.max(0, Math.round(X0 * DPR * s)))) * 4; return .2126 * f(px[i]) + .7152 * f(px[i + 1]) + .0722 * f(px[i + 2]) }
  lumCache.set(img, out); return out }
function yearFacet(w, fs, tools) {
  const toolsI = tools ? tools.i : -1
  const rec = recOf(w.photo.src); if (!rec) return null
  yearA.textContent = dateLabel(rec); const was = yearEl.style.cssText; yearEl.style.cssText = 'opacity:0;left:0;top:0'
  const lw = yearA.offsetWidth, lh = yearA.offsetHeight; yearEl.style.cssText = was
  const hit = num('hit-px', 44), bw = Math.max(lw + 12, hit), bh = Math.max(lh, hit), m = 10, lum = lumOf(w.img)
  const keep = [w.R, rectOf('#mat'), capFor(w), rectOf('.vs'), ...(tools ? [tools.box.slice(0, 4)] : [])].filter(b => b[2] > 0 && b[3] > 0)
  // where in a facet the date can sit: at its centre with a finger's reach inside the cut (38's), else anywhere in it with that reach, else anywhere its words fit
  const spot = (P, cx, cy, bw0, bh0) => { const L = [cx - bw0 / 2, cy - bh0 / 2, bw0, bh0]
    return L[0] >= m && L[1] >= m && L[0] + L[2] <= W - m && L[1] + L[3] <= H - m && [[L[0], L[1]], [L[0] + L[2], L[1]], [L[0], L[1] + L[3]], [L[0] + L[2], L[1] + L[3]]].every(p => inPoly(p, P)) && !keep.some(k => meet(L, k, m)) }
  const levels = [[bw, bh, false], [bw, bh, true], [lw + 4, lh + 2, true]]
  let best = null, n0 = 0
  for (const [bw0, bh0, roam] of levels) {
    for (const f of fs) { if (f.i === toolsI) continue; const P = w.cells[f.i]
      let cx = 0, cy = 0, n = 0; for (let yy = 0; yy < H; yy += 8) for (let xx = 0; xx < W; xx += 8) if (inPoly([xx, yy], P)) { cx += xx; cy += yy; n++ }
      if (!n) continue; cx /= n; cy /= n
      let at = spot(P, cx, cy, bw0, bh0) ? [cx, cy] : null
      if (!at && roam) { const [x0, y0, x1, y1] = bbox(P); let bd = Infinity
        for (let yy = y0; yy <= y1; yy += 6) for (let xx = x0; xx <= x1; xx += 6) { const d = Math.hypot(xx - cx, yy - cy); if (d < bd && spot(P, xx, yy, bw0, bh0)) { bd = d; at = [xx, yy] } } }
      if (!at) continue
      n0++; let sum = 0, k = 0; for (let yy = at[1] - lh / 2; yy <= at[1] + lh / 2; yy += 4) for (let xx = at[0] - lw / 2; xx <= at[0] + lw / 2; xx += 4) { sum += lum(xx, yy); k++ }
      const contrast = (.86 + .05) / (sum / k + .05)
      if (!best || contrast > best.contrast) best = { i: f.i, at, box: [at[0] - lw / 2, at[1] - lh / 2, lw, lh], contrast, reach: [bw0, bh0], roam } }
    if (best) break }
  return best && { ...best, rec, basis: { rule: 'where the date reads clearest', contrast: +best.contrast.toFixed(2), of: n0, roam: best.roam, reach: best.reach, taken: rec.taken } } }
function showYear(w) { const p = planOf(w)[w.yearI]
  yearEl.classList.toggle('on', !!p); if (!p) return
  yearA.textContent = dateLabel(p.rec); yearA.href = YEARS; yearA.dataset.basis = 'exif:' + p.rec.taken
  Object.assign(yearEl.style, { left: p.at[0] + 'px', top: p.at[1] + 'px' }) }
/* 32 a's flight, as 38 made it findable: the photograph flies itself into its EXIF year's row in the About's years, lifted like a making,
   and the browser's back brings it home. The About is loaded the first time it is wanted, never before (YEARS above is the one address) */
const phEl = $('#ph')
let aboutAsk = null, aboutF = null, lift = null, yearsBusy = false
function aboutFrame() { if (aboutAsk) return aboutAsk
  const f = aboutF = document.createElement('iframe'); f.id = 'about'; f.title = 'About'; f.tabIndex = -1; f.src = YEARS; document.body.append(f)
  return aboutAsk = new Promise(res => f.addEventListener('load', () => { try { const b = f.contentDocument.createElement('base'); b.target = '_top'; f.contentDocument.head.prepend(b) } catch {} res(f) }, { once: true })) }
const rowIn = (fd, row) => fd.querySelector(`.v-a .yr[data-y="${row}"]`) || [...fd.querySelectorAll(`.yr[data-y="${row}"]`)].find(e => e.getClientRects().length) || null
const rectIn = el => { const f = aboutF.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left + f.left, y: r.top + f.top, w: r.width, h: r.height } }
const placeEl = (el, r) => Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' })
const lerp = (a, b, t) => a + (b - a) * t
function flyRect(a, b, ms) { return new Promise(res => { if (reduce() || ms <= 0) { placeEl(phEl, b); return res() } const t0 = performance.now()
  const f = now => { const t = Math.min(1, (now - t0) / ms), e = io(t); placeEl(phEl, { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) }); t < 1 ? requestAnimationFrame(f) : res() }; requestAnimationFrame(f) }) }
function cleanAbout(fd) { fd.querySelectorAll('[data-home]').forEach(n => n.remove())
  fd.querySelectorAll('.yr[data-home-was="empty"]').forEach(n => { n.classList.add('empty'); const yl = n.querySelector('.yl'); if (yl) yl.textContent = ''; delete n.dataset.homeWas }) }
async function yearsOut(via) {
  if (yearsBusy || busy || !cur) return; const w = cur, rec = recOf(w.photo.src); if (!rec) return
  yearsBusy = true; busy = true; track('year_open', { year: rec.row, via }); closeTools()
  try {
    const f = await aboutFrame(), fd = f.contentDocument, row = fd && rowIn(fd, rec.row)
    if (!row) { location.href = YEARS; return } // a page there without the years: open it as it is
    cleanAbout(fd); if (row.classList.contains('empty')) { row.classList.remove('empty'); row.dataset.homeWas = 'empty'; const yl = row.querySelector('.yl'); if (yl) yl.textContent = rec.row }
    const st = fd.getElementById('home-lift') || Object.assign(fd.createElement('style'), { id: 'home-lift' })
    st.textContent = `.home-lift { cursor: pointer; } .lift.home-lift img { max-height: none; aspect-ratio: 3 / 2; width: 100%; object-fit: cover; } .lift.home-lift .home-p { display: block; font-family: 'Fraunces', Georgia, serif; font-size: 1.05rem; line-height: 1.4; padding-top: .3rem; }`; fd.head.append(st)
    lift = fd.createElement('span'); lift.className = 'lift home-lift'; lift.dataset.home = 'lift'; lift.dataset.basis = 'exif:' + rec.taken
    lift.innerHTML = '<span class="lh">photographs</span><img alt=""><span data-t="figcaption"></span><span class="home-p"></span>'
    lift.querySelector('img').src = w.photo.src; lift.querySelector('[data-t="figcaption"]').textContent = rec.place + ' · ' + dateLabel(rec); lift.querySelector('.home-p').textContent = w.poem.title
    ;(row.querySelector('.run') || row).prepend(lift); lift.style.visibility = 'hidden'
    try { await lift.querySelector('img').decode() } catch {}
    const r = row.getBoundingClientRect(); f.contentWindow.scrollTo(0, Math.max(0, f.contentWindow.scrollY + r.top - Math.round(H * num('row-at', .22))))
    await new Promise(r0 => requestAnimationFrame(r0))
    const to = rectIn(lift.querySelector('img'))
    phEl.src = w.photo.src; phEl.alt = (w.photo.alt || ''); placeEl(phEl, { x: 0, y: 0, w: W, h: H }); phEl.hidden = false; try { await phEl.decode() } catch {}
    at('about'); history.pushState({ years: true, trail: w.trail }, '', location.href)
    await flyRect({ x: 0, y: 0, w: W, h: H }, to, num('fly-ms', 1100))
    lift.style.visibility = ''; phEl.hidden = true
    lift.onclick = e => { e.preventDefault(); e.stopPropagation(); history.back() }
  } finally { yearsBusy = false; busy = false } }
async function yearsBack() {
  if (yearsBusy || document.body.dataset.at !== 'about' || !lift) return; yearsBusy = true
  try { const from = rectIn(lift.querySelector('img')); placeEl(phEl, from); phEl.hidden = false; lift.style.visibility = 'hidden'
    at(cur && cur.mode === 'home' ? 'stone' : 'world')
    await flyRect(from, { x: 0, y: 0, w: W, h: H }, num('fly-ms', 1100))
    phEl.hidden = true; cleanAbout(aboutF.contentDocument); lift = null; if (cur) showYear(cur) } finally { yearsBusy = false } }
yearA.addEventListener('click', e => { e.preventDefault(); if (!busy && cur) yearsOut('date') })
yearA.addEventListener('pointerenter', () => aboutFrame()) // a pointer on its way to the date: the About starts loading
/* 12 Nov (Kahran: "I want the facets to just take you to other poems"): a facet of his work no longer unfolds its piece tap by tap (37's steps,
   the floating words, 43 c's piece card); its one step is the move its piece promised, the same crossing that step always made */
const nextStep = (w, i) => { const p = planOf(w)[i]; return p ? p.steps[p.steps.length - 1] : null }

const pairTo = to => ({ poem: poemBy(to.poem), photo: photoBy(to.photo) })
async function facetTap(i) {
  const w0 = cur; if (!w0) return
  if (!planOf(w0)[i] && !SEG) { await segReady(); if (cur !== w0) return }
  const w = cur, p = planOf(w)[i]; if (!p) return
  if (p.kind === 'idea') { pulse(i, .8, 500); track('tools_open', { idea: IDEAS[p.k].name, via: 'facet' }); return openTools(p.k, i) } // the facet opens the idea it holds
  if (p.kind === 'title') { pulse(i, .8, 500); said(i, 'title', { href: p.href }); track('poem_open', { poem: w.poem.slug, via: 'facet' }); if (!HOME.dry) location.href = p.href; return } // the title's facet: the whole poem
  if (p.kind === 'year') { pulse(i, .8, 500); said(i, 'year', { taken: p.rec.taken }); return yearsOut('facet') } // the photograph's date: into its year in the About
  const s = nextStep(w, i) // any other facet: straight to where its piece leads
  said(i, 'move', { to: s.to.poem + '~' + s.to.photo.replace('/photos/', ''), key: S37.stepKey(s) }); pulse(i, 1, 500); if (HOME.dry) return
  return cross({ to: pairTo(s.to), word: null, phrase: null }, w.cents[i], i) }

/* the response to a hand stays small and keeps the photograph: a lift under the pointer, a sink under a press, a breath after each arrival */
function liftOf(w, i, now) { let t = 0
  if (i === FX.hover) t = num('hover-lift', 1)
  if (i === FX.press) t = -1
  if (w.breath0 && !reduce() && !HOME.still) { const st = Math.hypot(w.cents[i][0] - w.cents[0][0], w.cents[i][1] - w.cents[0][1]) / Math.max(W, H), u = (now - w.breath0 - st * num('breath-ms', 1400)) / 520
    if (u > 0 && u < 1) t = Math.max(t, Math.sin(u * Math.PI) * num('breath', .8)); if (now - w.breath0 > num('breath-ms', 1400) * 1.5 + 600) w.breath0 = 0 }
  for (const p of FX.pulses) if (p.i === i) { const u = (now - p.t0) / p.ms; if (u > 0 && u < 1) t = Math.max(t, Math.sin(u * Math.PI) * p.amp) }
  if (toolsOpen >= 0 && toolsAt === i && w === cur) t = Math.max(t, .5) // the facet whose idea is open stays lifted while it is
  if (CARD.open && CARD.i === i && w === cur) t = Math.max(t, .5) // 43: and the facet whose card is open
  return t }
function fxOf(w, i) { const lv = w.lv ? w.lv[i] : 0, c = w.cents[i], o = { glow: .05 * Math.max(0, lv), shade: .1 * Math.max(0, -lv) }, s = 1 + .018 * lv
  if (s !== 1) o.m = about(c, sc(s))
  return o }
/* ---------- 43 c: the opened facet. On a phone (upright or on its side) an idea and the chain open as one card cut like a facet
   of this stone, turning over out of the facet that gave it, and close four ways: its close mark, a tap on the stone outside it, Escape, the
   same facet (or line) again. Under reduced motion it crossfades. One change from 43 c: where it scrolls, its words end on a whole line ---------- */
const cardMode = () => phone() || low()
document.querySelector('#tools').after(Object.assign(document.createElement('div'), { id: 'card', innerHTML: '<canvas class="face" aria-hidden="true"></canvas><button class="card-more" type="button" aria-label="next lines" hidden></button><div class="card-slot"></div><svg class="cut" aria-hidden="true"></svg><button class="card-x" type="button" aria-label="close">×</button>' }))
$('#card').setAttribute('aria-hidden', 'true') // made here, not in the page: only a phone ever opens one
const cardEl = $('#card'), cardSvg = cardEl.querySelector('svg.cut'), cardFace = cardEl.querySelector('canvas.face'), cardSlot = cardEl.querySelector('.card-slot'), cardX = cardEl.querySelector('.card-x'), cardMoreBtn = cardEl.querySelector('.card-more')
const SVGNS = 'http://www.w3.org/2000/svg'
const shifted = () => [cv, readEl, mat, cap] // what steps aside with the stone: #app itself stays put, so a touch anywhere still lands in it
const CARD = { open: false, kind: null, i: -1, el: null, ph: null, back: null, geo: null, anim: null, phase: null, openedAt: 0, opens: 0, closes: [], t: 0 }
const deg2 = a => a * Math.PI / 180
function edgesOf(P) { return P.map((a, i) => { const b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1]; return { a, b, len: Math.hypot(dx, dy), ang: ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 180 } }).filter(e => e.len > 6) }
function cutAngles(P) { // the card's corners are sheared at the angles of the facet it came from: its edge nearest each diagonal, kept within reach of it
  const E = edgesOf(P), near = t => E.length ? E.reduce((b, e) => Math.abs(e.ang - t) < Math.abs(b.ang - t) ? e : b, E[0]).ang : t
  const lo = num('card-cut-min-deg', 30), hi = num('card-cut-max-deg', 60), fold = a => Math.min(hi, Math.max(lo, a > 90 ? 180 - a : a))
  return { slash: fold(near(135)), back: fold(near(45)) } } // slash: the "/" corners (top left, bottom right); back: the "\" corners
function resample(P, n) { // a closed polygon as n points evenly along its outline, from its top-left-most corner, clockwise on screen
  let Q = P.slice(); if (area2(Q) < 0) Q.reverse()
  const s0 = Q.reduce((b, p, i) => p[0] + p[1] < Q[b][0] + Q[b][1] ? i : b, 0); Q = [...Q.slice(s0), ...Q.slice(0, s0)]
  const L = Q.map((a, i) => Math.hypot(Q[(i + 1) % Q.length][0] - a[0], Q[(i + 1) % Q.length][1] - a[1])), tot = L.reduce((a, b) => a + b, 0) || 1, out = []
  for (let k = 0, i = 0, acc = 0; k < n; k++) { const d = k * tot / n; while (i < Q.length - 1 && acc + L[i] < d) { acc += L[i]; i++ }
    const a = Q[i], b = Q[(i + 1) % Q.length], u = L[i] ? (d - acc) / L[i] : 0; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]) }
  return out }
const polyCss = P => 'polygon(' + P.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(', ') + ')'
const polyPts = P => P.map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')
const HUECV = document.createElement('canvas').getContext('2d')
const toRgb = c => { HUECV.fillStyle = '#000'; HUECV.fillStyle = c; const h = HUECV.fillStyle; return /^#/.test(h) ? [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)) : rgbOf(h) }
function groundOf(hue) { const c = toRgb(hue), k = num('card-tint', 0.14), a = num('card-ground-alpha', 1), m = blend(c, k, GROUND).map(v => Math.round(v))
  CARD.groundRgb = m; CARD.xfRgb = blend([255, 246, 228], num('card-x-tone', 0.07), m).map(v => Math.round(v))
  return `linear-gradient(160deg, rgba(255,248,236,${num('card-sheen', 0.05)}), rgba(255,248,236,0) 42%), rgba(${m.join(',')},${a})` }
function srcPoly(kind, i) { // where the card comes from, on the stone at rest: the facet, or for the chain the line that opens it
  if (kind === 'chain' || i < 0) { const r = whereEl.getBoundingClientRect(); return [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]] }
  const Q = inset(cur.cells[i], num('seam-px', 2.2) / 2); return Q.length > 2 ? Q : cur.cells[i] }
function cardShape(w, h, P, more) { // the card's own cut, in its own coordinates; and its close mark's small facet
  const A = cutAngles(P), c = num('card-cut-px', 22), xw = num('card-x-px', 72), d = more ? num('card-more-px', 12) : 0, foot = h - num('card-more-px', 12)
  const tl = [c * Math.cos(deg2(A.slash)) * 1.3, c * Math.sin(deg2(A.slash)) * 1.3], br = tl, tr = 7, bl = [c * Math.cos(deg2(A.back)) * 1.3, c * Math.sin(deg2(A.back)) * 1.3]
  const xh = xw * Math.tan(deg2(Math.max(num('card-x-min-deg', 38), Math.min(58, A.back))))
  const poly = [[tl[0], 0], [w - tr, 0], [w, tr], [w, foot - br[1]], [w - br[0], foot], [w / 2, foot + d], [bl[0], foot], [0, foot - bl[1]], [0, tl[1]]]
  const xf = [[w - xw, 0], [w, 0], [w, xh]] // the close mark's facet: the corner cut off by a seam at the facet's own angle
  return { poly, xf, top: 0, foot, xw, xh } }
function uncovered(P, rect, shift) { // how much of the facet a finger can still reach beside the card: points inside it, on screen, not under the card
  const Q = inset(P, 8); if (Q.length < 3) return 0; const [x0, y0, x1, y1] = bbox(Q); let n = 0
  for (let y = Math.ceil(y0); y <= y1; y += 6) for (let x = Math.ceil(x0); x <= x1; x += 6) { if (!inPoly([x, y], Q)) continue; const X = x + shift[0], Y = y + shift[1]
    if (X < 4 || Y < 4 || X > W - 4 || Y > H - 4) continue; if (X > rect[0] - 6 && X < rect[0] + rect[2] + 6 && Y > rect[1] - 6 && Y < rect[1] + rect[3] + 6) continue; n++ }
  return n }
function cardPlace(kind, i, natural) { // where the card sits, how big, and how far the stone steps aside so the facet that spoke stays in view
  const P = srcPoly(kind, i), m = num('card-margin-px', 12), vsB = rectOf('.vs'), mat = rectOf('#mat'), need = num('card-reach-pts', 40)
  let rect, shift = [0, 0]
  const port = !low(), band = port ? [m, vsB[1] + vsB[3] + 8, W - m * 2, (H - mat[3] - num('card-mat-gap-px', 16) - 16) - (vsB[1] + vsB[3] + 8)] : [m, Math.max(34, vsB[1] + vsB[3] + 6), W - m * 2, H - Math.max(34, vsB[1] + vsB[3] + 6) - m]
  const cw = port ? band[2] : Math.min(num('card-side-max-px', 470), Math.round(W * .54)), hMax = Math.round(band[3] * (port ? num('card-max', 0.74) : 1)), h = Math.min(hMax, Math.max(num('card-min-px', 120), natural))
  const cands = []
  if (port) for (let y = band[1]; y <= band[1] + band[3] - h + .5; y += 8) cands.push([band[0], y, cw, h])
  else for (const x of [m, W - cw - m]) for (let y = band[1]; y <= band[1] + band[3] - h + .5; y += 8) cands.push([x, y, cw, h])
  if (!cands.length) cands.push([band[0], band[1], cw, Math.min(h, band[3])])
  const c = centroid(P), dist = r => Math.hypot(r[0] + r[2] / 2 - c[0], r[1] + r[3] / 2 - c[1])
  const scored = cands.map(r => ({ r, u: Math.min(need * 3, uncovered(P, r, [0, 0])), d: dist(r) })).sort((a, b) => b.u - a.u || a.d - b.d)
  rect = scored[0].r
  if (kind !== 'chain' && scored[0].u < need) { // the card would hide the facet that spoke: the stone steps aside, away from the card, just far enough
    const away = port ? [0, rect[1] + rect[3] / 2 < c[1] ? 1 : -1] : [rect[0] + rect[2] / 2 < c[0] ? 1 : -1, 0]
    for (let s = 8; s < (port ? H : W) * .7; s += 8) { const sh = [away[0] * s, away[1] * s]; if (uncovered(P, rect, sh) >= need) { shift = sh; break } } }
  return { rect, shift, P } }
function cardRoom() { if (CARD.open) cardClose('another'); cardFinish() } // one open at a time: opening another closes the first
function cardOpen(kind, i, el, o = {}) {
  cardFinish(); if (CARD.open) cardClose('another'); cardFinish()
  const w = cur; CARD.back = document.activeElement && document.activeElement !== document.body && !cardEl.contains(document.activeElement) ? document.activeElement : null
  Object.assign(CARD, { open: true, kind, i, el, phase: 'opening', openedAt: performance.now(), how: null }); CARD.opens++
  CARD.ph = document.createComment('card'); el.before(CARD.ph); cardSlot.append(el); el.tabIndex = -1
  const hue = o.hue || 'rgb(201,195,182)'; CARD.hue = hue // an idea's own hue; the chain's, the stone's warm grey
  // the card's room for words, measured at its width before it is placed
  const pad = num('card-pad-px', 18)
  const port = !low(), cw0 = port ? W - num('card-margin-px', 12) * 2 : Math.min(num('card-side-max-px', 470), Math.round(W * .54))
  Object.assign(cardEl.style, { width: cw0 + 'px', height: '60px', transform: 'none', clipPath: 'none', opacity: '0' }); cardEl.classList.add('on', 'measure')
  setInsets(cw0, 60, { top: 0, foot: 60 }, kind) // a short card: the scroller's height is then its words'
  const natural = el.scrollHeight + pad * 2 + num('card-more-px', 12)
  cardEl.classList.remove('measure')
  const { rect, shift, P } = cardPlace(kind, i, natural)
  const [x, y, cw, ch] = rect, shape = cardShape(cw, ch, P, false)
  CARD.geo = { x, y, w: cw, h: ch, shift, P, shape, way: reduce() ? 'fade' : 'c' }
  Object.assign(cardEl.style, { left: x + 'px', top: y + 'px', width: cw + 'px', height: ch + 'px', background: groundOf(hue) })
  setInsets(cw, ch, shape, kind)
  drawCut(shape, cw, ch, false)
  // the face: the facet's own pixels, at the card's size, for the moment it is still the facet, turning over
  cardFace.width = Math.round(cw * DPR); cardFace.height = Math.round(ch * DPR); const fx = cardFace.getContext('2d'), [bx0, by0, bx1, by1] = bbox(P)
  fx.clearRect(0, 0, cardFace.width, cardFace.height); try { fx.drawImage(cv, bx0 * DPR, by0 * DPR, Math.max(1, (bx1 - bx0) * DPR), Math.max(1, (by1 - by0) * DPR), 0, 0, cardFace.width, cardFace.height) } catch {}
  const loc = P.map(([px, py]) => [(px - bx0) / Math.max(1, bx1 - bx0) * cw, (py - by0) / Math.max(1, by1 - by0) * ch])
  CARD.geo.src = { box: [bx0, by0, bx1 - bx0, by1 - by0], loc: resample(loc, 48), card: resample(shape.poly, 48), axis: (() => { const E = edgesOf(P), e = E.reduce((b, e) => e.len > b.len ? e : b, E[0] || { a: [0, 0], b: [1, 0], len: 1 }); return [(e.b[0] - e.a[0]) / e.len, (e.b[1] - e.a[1]) / e.len] })() }
  document.body.classList.add('card-open'); document.body.dataset.card = kind; cardEl.setAttribute('aria-hidden', 'false')
  el.scrollTop = 0; cardSnap(); cardMore()
  el.focus({ preventScroll: true }) // focus goes into the card
  cardRun(1) }
function setInsets(cw, ch, shape, kind) { const pad = num('card-pad-px', 18), s = cardEl.style
  const top = pad * .8, foot = shape.foot ?? ch, right = pad * .7, bottom = Math.max(pad * .6, ch - foot + pad * .6)
  s.setProperty('--ci-l', pad + 'px'); s.setProperty('--ci-r', right + 'px'); s.setProperty('--ci-t', top + 'px'); s.setProperty('--ci-b', bottom + 'px'); if (CARD.geo) CARD.geo.bottom = bottom
  const xw = shape.xw || num('card-x-px', 72), xh = shape.xh || xw
  s.setProperty('--cx-w', Math.max(0, xw - right + 4) + 'px'); s.setProperty('--cx-h', Math.max(0, xh - top + 4) + 'px') }
function cardSnap() { // the one change from 43 c: where the words scroll, the card's room ends on a line's foot, so no line is sliced at the foot (snap()'s rule)
  const el = CARD.el, G = CARD.geo; if (!el || !G || G.bottom == null) return; if (CARD.anim && CARD.anim.dir > 0) { G.snapDue = true; return } // measured once it has settled, never mid-turn
  G.snapDue = false; cardEl.style.setProperty('--ci-b', G.bottom + 'px'); el.style.removeProperty('padding-bottom')
  if (el.scrollHeight <= el.clientHeight + 1) return
  const top = el.getBoundingClientRect().top, room = el.clientHeight, feet = []
  const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.height) feet.push([q.top - top + el.scrollTop, q.bottom - top + el.scrollTop]) } else n.childNodes.forEach(walk) }
  walk(el); const fit = feet.filter(([, b]) => b <= room).map(([, b]) => b).sort((a, b) => b - a)[0]
  if (fit) cardEl.style.setProperty('--ci-b', G.bottom + (room - Math.ceil(fit)) + 'px') } // the scroller's own edge on that foot: the next line starts below it
function drawCut(shape, cw, ch) { // the rim (the title's piece's line), the hue's thread inside it, and the close mark's facet with its seam
  cardSvg.setAttribute('viewBox', `0 0 ${cw} ${ch}`); cardSvg.textContent = ''
  const el = (tag, at) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); cardSvg.append(e); return e }
  const ep = num('piece-edge-px', 1.4)
  const th = inset(shape.poly, 5); if (th.length > 2) el('polygon', { class: 'thread', points: polyPts(th), fill: 'none', stroke: CARD.hue, 'stroke-opacity': num('card-thread', 0.5), 'stroke-width': 1 }) // the hue's thread, under the close mark's facet
  el('polygon', { class: 'xf', points: polyPts(shape.xf), fill: `rgb(${(CARD.xfRgb || [30, 28, 26]).join(',')})` }) // its own small facet, solid: words scrolling under it go under it
  el('line', { class: 'seam', x1: shape.xf[0][0], y1: shape.xf[0][1], x2: shape.xf[2][0], y2: shape.xf[2][1], stroke: '#0d0c0b', 'stroke-width': num('seam-px', 2.2) })
  el('line', { class: 'bevel', x1: shape.xf[0][0] + 1, y1: shape.xf[0][1] + 1.4, x2: shape.xf[2][0] - .6, y2: shape.xf[2][1] + 1.4, stroke: `rgba(255,244,222,${num('card-rim', 0.5) * .5})`, 'stroke-width': 1 })
  el('polygon', { class: 'rim', points: polyPts(shape.poly), fill: 'none', stroke: `rgba(255,246,228,${num('card-rim', 0.5)})`, 'stroke-width': ep * 2, 'vector-effect': 'non-scaling-stroke' })
  const [p, q, r] = shape.xf, la = Math.hypot(q[0] - r[0], q[1] - r[1]), lb = Math.hypot(p[0] - r[0], p[1] - r[1]), lc = Math.hypot(p[0] - q[0], p[1] - q[1]), sum = la + lb + lc // the mark at the heart of its facet (the incentre), clear of its seam
  const c = [(la * p[0] + lb * q[0] + lc * r[0]) / sum, (la * p[1] + lb * q[1] + lc * r[1]) / sum]; Object.assign(cardX.style, { left: c[0] - 22 + 'px', top: c[1] - 22 + 'px' }) }
function cardMore() { // the cut itself says there is more: while words lie below the card's foot, the foot comes to a point
  if (!CARD.open || !CARD.geo) return; const el = CARD.el, G = CARD.geo, more = el.scrollHeight - el.clientHeight - el.scrollTop > 2
  if (G.more !== more || !G.drawn) { G.more = more; G.drawn = true
    const shape = cardShape(G.w, G.h, G.P, more); G.shape = shape; drawCut(shape, G.w, G.h)
    if (CARD.phase === 'open') cardEl.style.clipPath = polyCss(shape.poly) }
  cardCue() }
/* ---------- 44 a with d (Kahran, 13 Nov: "i think i like something a and d"): the card says there is more. a: the point is a facet, a small
   facet of its own at the pointed foot, lit in the facet's hue, and a 44px button over it that turns one whole-line screenful (a touch, its
   key, Page Down or Space in the card); it reads the real scroll state, shows only while words lie below and is gone at the end. d: once, as
   the card settles open, the words lift by the hidden next line and settle back; none under reduced motion, a touch or a wheel stops it.
   While the lift runs the cut and the facet hold as they were at its start (the scroll listener waits for it), so nothing else moves ---------- */
const LIGHT = [255, 246, 228]
function cueInk(k0) { const h = toRgb(CARD.hue || 'rgb(201,195,182)'), gr = CARD.groundRgb || GROUND, min = num('cue-contrast', 3.6); let k = k0, c = blend(LIGHT, k, h)
  while (ratio(c, gr) < min && k < 1) { k = Math.min(1, k + .02); c = blend(LIGHT, k, h) } return c.map(v => Math.round(v)) }
function cueLines(el) { // every line of words in the scroller, [top, bottom] in its own scrolled coordinates
  const top = el.getBoundingClientRect().top, out = []
  const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.height) out.push([q.top - top + el.scrollTop, q.bottom - top + el.scrollTop]) } else n.childNodes.forEach(walk) }
  walk(el); return out.sort((a, b) => a[0] - b[0]) }
function cardCue() {
  let gq = cardSvg.querySelector('g.cue'); if (!gq) { gq = document.createElementNS(SVGNS, 'g'); gq.setAttribute('class', 'cue'); cardSvg.append(gq) } gq.textContent = ''
  const G = CARD.geo, el = CARD.el, hideBtn = () => { if (document.activeElement === cardMoreBtn && el) el.focus({ preventScroll: true }); cardMoreBtn.hidden = true }
  if (!CARD.open || !G || !el || !cardMode()) { hideBtn(); return }
  const L = cueLines(el), last = L.reduce((m, [, b]) => Math.max(m, b), 0) // more means words below the room, not a margin's pixels
  const below = Math.max(0, last - el.scrollTop - el.clientHeight), more = below > 1
  const lift = CARD.cue && CARD.cue.lift; CARD.cue = { more, below: Math.round(below), shown: false, lift }
  const add = (tag, at) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); gq.append(e); return e }
  const foot = G.shape.foot, w = G.w, d = num('card-more-px', 12)
  if (!more) return hideBtn() // the point, a facet of its own: a kite whose lowest corner is the card's point, its two upper edges seams, a ridge to the point
  const kw = num('cue-a-w-px', 22), kh = num('cue-a-h-px', 12), cx = w / 2, ink = cueInk(num('cue-a-lift', 0.35))
  const K = [[cx - kw, foot], [cx, foot - kh], [cx + kw, foot], [cx, foot + d]]
  add('polygon', { class: 'cue-facet', points: polyPts(K), fill: `rgb(${ink.join(',')})` })
  add('polyline', { class: 'cue-seam', points: polyPts([K[0], K[1], K[2]]), fill: 'none', stroke: '#0d0c0b', 'stroke-width': num('seam-px', 2.2), 'stroke-linejoin': 'miter' })
  add('line', { class: 'cue-ridge', x1: cx, y1: foot - kh + 2, x2: cx, y2: foot + d, stroke: `rgba(${blend(GROUND, num('cue-a-ridge', 0.35), ink).map(v => Math.round(v)).join(',')},1)`, 'stroke-width': 1 })
  Object.assign(cardMoreBtn.style, { left: cx - 22 + 'px', top: foot - num('cue-a-hit-up-px', 32) + 'px' }); cardMoreBtn.hidden = CARD.phase !== 'open'
  CARD.cue.shown = true; CARD.cue.ink = ink }
let cueRaf = 0
function cueStop() { const was = cueRaf; if (cueRaf) cancelAnimationFrame(cueRaf); cueRaf = 0; if (CARD.cue && CARD.cue.lift && !CARD.cue.lift.done) CARD.cue.lift.done = 'stopped'; if (was) cardMore() }
function cueLift() { // d: once, as the card settles, the words rise by the height of the hidden next line and settle back; then nothing moves
  if (reduce() || !CARD.open || !CARD.el || !CARD.cue || CARD.cue.lift) return
  const el = CARD.el, room = el.clientHeight, below = el.scrollHeight - room - el.scrollTop; if (below <= 2 || el.scrollTop > 0) return
  const next = cueLines(el).find(([, b]) => b > room + .5); if (!next) return
  const r = Math.min(below, Math.ceil(next[1] - room) + 2), ms = num('cue-d-ms', 900), t0 = performance.now(), L = CARD.cue.lift = { r, peak: 0, done: false, n: (HOME.cueLifts = (HOME.cueLifts || 0) + 1) }
  const step = () => { if (CARD.el !== el || L.done) return; const u = HOME.cueClock != null ? clamp01(HOME.cueClock) : clamp01((performance.now() - t0) / ms)
    const y = Math.round(r * Math.sin(Math.PI * (u < .4 ? io(u / .4) * .5 : .5 + io((u - .4) / .6) * .5))); el.scrollTop = y; L.peak = Math.max(L.peak, y)
    if (u >= 1 && HOME.cueClock == null) { el.scrollTop = 0; L.done = true; cueRaf = 0; return } cueRaf = requestAnimationFrame(step) }
  cueRaf = requestAnimationFrame(step) }
function cuePage() { // a: one whole-line screenful on: the first line not wholly seen becomes the top, and the room ends on a whole line again
  const el = CARD.el, G = CARD.geo; if (!el || !G || !CARD.open) return
  cueStop(); el.style.removeProperty('padding-bottom'); cardEl.style.setProperty('--ci-b', G.bottom + 'px')
  const room = el.clientHeight, st = el.scrollTop, L = cueLines(el), next = L.find(([, b]) => b > st + room + .5); if (!next) return
  let top = Math.floor(next[0])
  const fit = L.filter(([t, b]) => t >= top - .5 && b <= top + room).map(([, b]) => b).sort((a, b) => b - a)[0]
  if (fit && L.some(([t, b]) => t >= top - .5 && b > top + room)) cardEl.style.setProperty('--ci-b', G.bottom + (room - Math.ceil(fit - top)) + 'px') // the room ends on a whole line
  const max = el.scrollHeight - el.clientHeight; if (top > max) el.style.setProperty('padding-bottom', 6 + Math.ceil(top - max) + 'px', 'important') // the last screenful still starts on a whole line
  el.scrollTo({ top, behavior: reduce() ? 'auto' : 'smooth' }); CARD.paged = (CARD.paged || 0) + 1 }
cardMoreBtn.addEventListener('click', e => { e.stopPropagation(); cuePage() })
cardEl.addEventListener('keydown', e => { if (!CARD.open || !CARD.el || e.target !== CARD.el) return
  if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { if (!(CARD.cue && CARD.cue.more)) return; e.preventDefault(); cuePage() } })
cardEl.addEventListener('pointerdown', () => cueStop(), true); cardEl.addEventListener('wheel', () => cueStop(), { passive: true, capture: true })
function cardPose(t) { // the card at t of its opening: 0 is the facet it came from, 1 the card (it turns over; under reduced motion it fades)
  const G = CARD.geo; if (!G) return; CARD.t = t; const e = io(clamp01(t)), way = G.way, s = cardEl.style
  const sx = G.shift[0] * (way === 'fade' ? (t > 0 ? 1 : 0) : e), sy = G.shift[1] * (way === 'fade' ? (t > 0 ? 1 : 0) : e)
  const tf = sx || sy ? `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px)` : ''; for (const e of shifted()) e.style.transform = tf; CARD.shiftNow = [sx, sy]
  const content = v => { cardSlot.style.opacity = v; cardSvg.style.opacity = v; cardX.style.opacity = v }
  if (way === 'fade') { s.transform = 'none'; s.opacity = clamp01(t); s.clipPath = polyCss(G.shape.poly); cardFace.style.opacity = 0; content(1); return }
  s.opacity = 1
  const [bx, by, bw, bh] = G.src.box, f = [bx + sx, by + sy, Math.max(1, bw), Math.max(1, bh)]
  const X = lerp(f[0], G.x, e), Y = lerp(f[1], G.y, e), SX = lerp(f[2], G.w, e) / G.w, SY = lerp(f[3], G.h, e) / G.h
  const base = `translate(${(X - G.x).toFixed(2)}px, ${(Y - G.y).toFixed(2)}px) scale(${SX.toFixed(4)}, ${SY.toFixed(4)})`
  // the facet turns on its long axis; past the edge-on moment its back, the card, faces you
  const ang = 180 * e, [ax, ay] = G.src.axis, back = ang > 90, rot = back ? ang - 180 : ang
  s.transform = `${base} translate(${G.w / 2}px, ${G.h / 2}px) perspective(${num('card-perspective-px', 900)}px) rotate3d(${ax.toFixed(4)}, ${ay.toFixed(4)}, 0, ${rot.toFixed(2)}deg) translate(${-G.w / 2}px, ${-G.h / 2}px)`
  s.clipPath = polyCss(back ? (t >= 1 ? G.shape.poly : G.src.card) : G.src.loc); cardFace.style.opacity = back ? 0 : 1; content(back ? ss(.55, .8, t) : 0) }
function cardRun(dir) { // one motion, its own clock (HOME.cardClock holds it still for the check)
  const ms = num(reduce() ? 'card-fade-ms' : 'card-turn-ms', 680) * (dir < 0 ? num('card-close-k', 0.8) : 1)
  const A = CARD.anim = { dir, t0: performance.now(), ms, done: null }; A.done = new Promise(r => { A.end = r })
  const step = () => { if (CARD.anim !== A) return A.end()
    const u = HOME.cardClock != null ? clamp01(HOME.cardClock) : clamp01((performance.now() - A.t0) / Math.max(1, ms)), t = dir > 0 ? u : 1 - u
    cardPose(t)
    if (HOME.cardClock == null && u >= 1) return cardSettle(A)
    requestAnimationFrame(step) }
  cardPose(dir > 0 ? 0 : 1); requestAnimationFrame(step); return A.done }
function cardSettle(A) { if (CARD.anim !== A) return; CARD.anim = null
  if (A.dir > 0) { CARD.phase = 'open'; cardEl.style.transform = 'none'; cardEl.style.clipPath = polyCss(CARD.geo.shape.poly); cardSnap(); cardMore(); cueLift() } else cardGone()
  A.end() }
function cardFinish() { const A = CARD.anim; if (!A) return; CARD.anim = null; if (A.dir > 0) { cardPose(1); CARD.phase = 'open'; cardSnap(); cardMore(); cueLift() } else cardGone(); A.end() }
function cardGone() { // closed: the words go home, the stone comes back to rest exactly as it was
  cueStop(); if (CARD.el) CARD.el.style.removeProperty('padding-bottom'); cardMoreBtn.hidden = true; CARD.cue = null
  if (CARD.el && CARD.ph) { CARD.ph.replaceWith(CARD.el); CARD.el.removeAttribute('tabindex') }
  CARD.el = null; CARD.ph = null; CARD.geo = null; CARD.phase = null; CARD.kind = null; CARD.i = -1; CARD.shiftNow = [0, 0]
  cardEl.classList.remove('on', 'closing'); cardEl.setAttribute('aria-hidden', 'true'); for (const k of ['left', 'top', 'width', 'height', 'transform', 'clipPath', 'opacity', 'background']) cardEl.style[k] = ''
  cardSvg.textContent = ''; cardSlot.style.opacity = ''; for (const e of shifted()) e.style.transform = ''
  delete document.body.dataset.card; document.body.classList.remove('card-open'); groundSoon(); if (cur) cur.dirty = true }
function cardShut(kind) { // the visual close; the state was already closed by closeTools or closeWhy
  if (!CARD.open || CARD.kind !== kind) return; CARD.open = false; CARD.phase = 'closing'; cardEl.classList.add('closing') /* a touch while it closes goes to the stone */; CARD.closes.push({ kind, how: CARD.how || 'other' })
  const back = CARD.back; CARD.back = null
  if (back && back.isConnected && back !== document.body) back.focus({ preventScroll: true }); else if (cardEl.contains(document.activeElement)) document.activeElement.blur() // focus returns to where it came from
  cardFinish(); if (!CARD.geo) return cardGone(); cardRun(-1) }
function cardClose(how) { if (!CARD.open) return; CARD.how = how; const k = CARD.kind
  if (k === 'idea') closeTools(); else closeWhy() }
cardX.addEventListener('click', e => { e.stopPropagation(); if (performance.now() - CARD.openedAt < 400) return; cardClose('mark') })
cardEl.addEventListener('click', e => { if (performance.now() - CARD.openedAt < 400 && e.target !== cardX) { e.preventDefault(); e.stopPropagation() } }, true) // not the click a touch on the facet sends after it, landing on what it just opened
cardEl.addEventListener('scroll', () => { if (!cueRaf) cardMore() }, true) // 44 d: not while the words lift
addEventListener('mousedown', e => { if (CARD.open && performance.now() - CARD.openedAt < 500 && !e.target.closest('#card')) e.preventDefault() }, true) // the touch that opened it does not take the focus back out
addEventListener('pointerdown', e => { if (!CARD.open && CARD.anim) cardFinish() // a touch while a card closes: it is closed now, and the stone back where the touch lands
  if (!CARD.open || e.target.closest('#card')) return; if (!e.target.closest('a, button, [role="button"]')) e.preventDefault() // with a card open, a touch on the stone only closes it; the same facet (or the line, for the chain) closes it too
  if (CARD.kind === 'chain' && e.target.closest('#where')) { CARD.how = 'facet'; return } // the line opens and closes its chain, as on the live home
  e.stopImmediatePropagation(); const [sx, sy] = CARD.shiftNow || [0, 0]
  const i = cur && !e.target.closest('a, button, header') ? facetAt(e.clientX - sx, e.clientY - sy) : -1
  cardClose(i >= 0 && i === CARD.i ? 'facet' : 'outside') }, true)
addEventListener('keydown', e => { if (!CARD.open || e.key !== 'Escape') return; e.preventDefault(); e.stopImmediatePropagation(); cardClose('escape') }, true)

/* ---------- state ---------- */
let cur = null, busy = false, pressing = null, crossing = null, homeWin = -1
const at = s => { document.body.dataset.at = s }
function show(w) { cur = w; cap.textContent = w.photo.caption || ''; document.body.dataset.poem = w.poem.slug; document.body.dataset.photo = w.photo.src; closeTools(); showYear(w); groundSoon() }
const live = () => [cur, pressing && pressing.next, crossing && crossing.next].filter(Boolean)

/* pressing in (20 d): the stone gives under the finger, its seams open onto the world beneath; let go early and it comes back */
function pressPose(p, d, gv) { const W0 = W, H0 = H, m = Math.min(W0, H0), sink = num('press-sink', .16), push = num('press-push-px', 28)
  return p.old.cells.map((P, i) => { const c = p.old.cents[i], dx = c[0] - p.pt[0], dy = c[1] - p.pt[1], dist = Math.hypot(dx, dy) || 1, fall = Math.exp(-dist / (m * .55)), off = push * d * (.35 + fall)
    return { m: mul(tr(dx / dist * off, dy / dist * off), about(c, sc((1 - sink * d * (.4 + fall)) * (1 - .45 * gv)))), shade: .42 * d * fall, alpha: 1 - Math.min(1, gv * (1.4 - fall * .6)) } }) }
let pressGo = null
async function pressStart(pt, down = performance.now()) { // down: when the finger landed (the event's own time)
  if (busy || !cur || cur.mode !== 'home') return
  const hd = doorAt(pt[0], pt[1], cur, true), ci = facetAt(pt[0], pt[1])
  if (!hd && ci >= 0 && !SEG && !planOf(cur)[ci]) await segReady() // the first second: where the facets lead is still on its way
  if (busy || !cur || cur.mode !== 'home') return
  const pl = ci >= 0 ? planOf(cur)[ci] : null
  let to, word = null
  if (hd) { to = hd.to; word = hd.word } // a door line: its door
  else if (pl && nextStep(cur, ci).t !== 'move') { homeWin = ci; FX.press = ci; return } // an idea, the title, the date: it answers on the way up
  else if (pl) { const st = nextStep(cur, ci); to = pairTo(st.to); said(ci, 'move', { to: keyOf(to), key: S37.stepKey(st) }) } // any other facet: pressed into where its piece leads
  else { let best = cur.doors[0], bd = Infinity // elsewhere: the world behind the door line nearest the finger
    for (const d of cur.doors) { const b = d.el.getBoundingClientRect(), dd = Math.hypot(b.left + b.width / 2 - pt[0], b.top + b.height / 2 - pt[1]); if (dd < bd) { bd = dd; best = d } }
    to = best ? best.to : cur.fallback; word = best ? best.word : null }
  busy = true; at('entering'); HOME.expect = keyOf(to); HOME.word = word
  const p = pressing = { old: cur, pt, d: 0, gv: 0, t0: performance.now(), down, held: true, next: null }
  p.ready = makeWorld({ ...to, word, from: { phrase: hd ? hd.phrase : null, title: cur.poem.title }, via: 'press' }, 'world', cur.trail).then(w => { p.next = w; return w })
  if (reduce()) { const w = await p.ready; pressing = null; return calmTo(w) }
  const ms = num('press-ms', 1100)
  const step = () => { if (pressing !== p || !p.held) return; p.d = Math.min(1, (performance.now() - p.t0) / ms); if (p.d >= 1) giveWay(p); else requestAnimationFrame(step) }
  requestAnimationFrame(step) }
async function pressUp(up = performance.now()) { // a tap or a hold is told by the events' own times: a world being made can hold the page up past press-tap-ms between them (12 Nov)
  if (pressGo) await pressGo
  if (homeWin >= 0) { const i = homeWin; homeWin = -1; FX.press = -1; return facetTap(i) }
  const p = pressing; if (!p || !p.held) return; p.held = false
  if (up - p.down < num('press-tap-ms', 260)) { const from = p.d, ms = num('press-ms', 1100) * (1 - from), t0 = performance.now()
    await new Promise(r => { const f = () => { if (pressing !== p) return r(); p.d = from + (1 - from) * Math.min(1, (performance.now() - t0) / ms); if (p.d >= 1) r(); else requestAnimationFrame(f) }; requestAnimationFrame(f); setTimeout(r, ms + 400) })
    return giveWay(p) }
  const from = p.d, t0 = performance.now()
  await new Promise(r => { const f = () => { p.d = from * (1 - Math.min(1, (performance.now() - t0) / 500)); if (p.d <= 0) r(); else requestAnimationFrame(f) }; requestAnimationFrame(f); setTimeout(r, 900) })
  p.d = 0; await p.ready; drop(p.next); pressing = null; busy = false; at('stone'); HOME.expect = null }
async function giveWay(p) { if (p.gave) return; p.gave = true; p.held = false; p.d = 1
  await p.ready
  const ms = num('fall-ms', 900), t0 = performance.now()
  await new Promise(r => { const f = () => { const u = Math.min(1, (performance.now() - t0) / ms); p.gv = u * u; if (u >= 1) r(); else requestAnimationFrame(f) }; requestAnimationFrame(f); setTimeout(r, ms + 400) })
  pressing = null; landed(p.next, p.old, num('arrive-delay-ms', 500)) }
let ends = null // the frames either side of the last crossing: the one on screen as it began, the first at rest after it
function landed(next, old, delay) {
  if (next.breath0) next.breath0 = performance.now() + num('breath-delay-ms', 400) // a breath begun under the crossing starts again from still, never mid-swell
  drop(old); show(next); busy = false; at('world'); next.mode = 'world'
  history.pushState({ trail: next.trail, word: next.word || null, from: next.from || null }, '', qs({ w: next.key }))
  track('crossing', { via: next.via || 'door', depth: next.trail.length - 1 })
  HOME.trail = next.trail.slice()
  if (delay != null) arrive(next, delay) }

/* the crossing (Study 39's one question): the stone re-cut from this photograph's masses to the next one's, on its facets (cross.js).
   It starts where the visitor touched: the tapped facet, or the door line. Both ends are 33's masses cut, so it lands on the next
   photograph's own cut exactly, and nothing snaps */
const XMS = { slide: 'slide-ms', hold: 'hold-ms', shatter: 'shatter-ms', grow: 'grow-ms' }
const clockT = C => HOME.clock != null ? clamp01(HOME.clock) : clamp01((performance.now() - C.t0) / C.ms)
function crossPlan(old, next, x, origin) {
  return S39X.plan({ x, A: { sites: old.sites, tags: old.cut.tags, features: old.cut.features, cells: old.cells }, B: { sites: next.sites, tags: next.cut.tags, features: next.cut.features, cells: next.cells },
    RA: REG[old.photo.src] || null, RB: REG[next.photo.src] || null, W, H, wind: num('wind', 8), origin,
    D: { fire: num('cross-fire', .7), gap: num('cut-gap', .03), holdTone: num('hold-tone', 12), holdNear: num('hold-near', .45), growSpread: num('grow-spread', .5),
      border: num('grow-border', 3), tone: num('grow-tone', 2), crack: num('shatter-crack-px', 3), drop: num('shatter-drop', .9), spin: num('shatter-spin', .6), sink: num('shatter-sink', .1), seamReach: num('seam-reach', .35) } }) }
async function cross(d, pt0, fi) {
  if (busy || !cur || cur.mode !== 'world') return
  busy = true; at('entering'); HOME.expect = keyOf(d.to); HOME.word = d.word
  const old = cur, pt = pt0 || (() => { const b = d.el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2] })()
  FX.hover = FX.press = -1
  old.v.classList.add('gone'); old.run = -1
  const next = await makeWorld({ ...d.to, word: d.word || null, from: { phrase: d.phrase || null, title: old.poem.title }, via: fi != null ? 'facet' : 'door' }, 'world', old.trail)
  const x = reduce() ? 'calm' : X, origin = fi != null ? old.cents[fi] : pt
  const C = { x, old, next, origin, ms: x === 'calm' ? num('calm-ms', 1100) : num(XMS[x], 3000), t0: performance.now(), plan: crossPlan(old, next, x, origin), arriving: false }
  C.done = new Promise(r => { C.end = r }); C.lift = Array.from(old.lv || []); C.before = ledger.list // the frame on screen as it begins: the lift under the finger is carried in, never dropped
  HOME.crossing = { x, origin, from: old.key, to: next.key, tangle: C.plan.tangle || null, held: C.plan.movers ? C.plan.movers.filter(m => m.held).length : null, movers: C.plan.movers ? C.plan.movers.length : null }
  crossing = C
  named(d.word, C.ms, old.cents[0])
  await C.done
  if (crossing === C) crossing = null
  ends = { before: C.before, after: null }; landed(next, old) }
function crossFrame(C) { // one frame of the crossing at its own clock; arrival of the poem keyed to the same clock
  const t = clockT(C), P = S39X.pose(C.plan, t), fade = 1 - ss(0, .18, t), { old, next } = C
  if (!C.arriving && (C.x === 'calm' || t >= num('cross-arrive', .8))) { C.arriving = true; arrive(next, 0) }
  ledger = { t, x: C.x, list: [] }
  for (const e of P.entries) {
    let n, layers
    if (e.side === 'M') { const a = old.normals[e.site], b = next.normals[e.to], k = e.mix; n = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
      layers = [{ img: old.img, alpha: 1 - e.mix }, { img: next.img, alpha: e.mix }, ...textLayer(old, e.site, n, e.P, fade), ...textLayer(next, e.site, n, e.P)] }
    else if (e.side === 'A') { const i = +e.id.slice(1); n = old.normals[i]; layers = [{ img: old.img }, ...textLayer(old, i, n, e.P, fade)] }
    else { const j = +e.id.slice(1); n = next.normals[j]; layers = [{ img: next.img }, ...textLayer(next, j, n, e.P)] }
    const o = { alpha: e.alpha, m: e.m, shade: e.shade || 0, glow: e.glow || 0, fire: e.fire || 0, crack: e.crack || 0 }
    const li = e.side === 'M' ? e.site : e.side === 'A' ? +e.id.slice(1) : -1, lv = li >= 0 && C.lift ? (C.lift[li] || 0) * (1 - io(ss(0, .12, t))) : 0
    if (Math.abs(lv) > 1e-4) { o.m = S39X.mul(e.m, about(e.side === 'M' ? e.c : old.cents[li], sc(1 + .018 * lv))); o.glow += .05 * Math.max(0, lv); o.shade += .1 * Math.max(0, -lv) } // fxOf's lift, settling
    if (e.alpha <= .002) { ledger.list.push({ id: e.id, seen: 0, area: 0, c: null, Q: null }); continue }
    note(e.id, facet(e.P, e.c, n, layers, o), o.m, e.seen) }
  if (t >= 1 && !C.ended) { C.ended = true; C.end() } }
// the calm crossing: reduced motion's only move; through crossFrame too, so it is in the ledger
async function calmTo(next, word) {
  busy = true; at('entering'); const old = cur, ms = num('calm-ms', 1100)
  if (word) named(word, ms, old.cents[0])
  const C = { x: 'calm', old, next, origin: [W / 2, H / 2], ms, t0: performance.now(), plan: crossPlan(old, next, 'calm', [W / 2, H / 2]), arriving: false }
  C.done = new Promise(r => { C.end = r }); C.lift = Array.from(old.lv || []); C.before = ledger.list; HOME.crossing = { x: 'calm', from: old.key, to: next.key }
  crossing = C; await C.done; if (crossing === C) crossing = null
  ends = { before: C.before, after: null }; landed(next, old) }
function named(word, ms, at0) { // how much of the idea a visitor sees: ?name=never | crossing (only while crossing) | door (beside each door line)
  if (NAME !== 'crossing' || !word) return
  ideaEl.textContent = word
  const x = Math.max(120, Math.min(W - 120, phone() ? W / 2 : at0[0])), y = Math.max(80, Math.min(H - 160, phone() ? H * .22 : at0[1]))
  Object.assign(ideaEl.style, { left: x + 'px', top: y + 'px' })
  const A = num('idea-alpha', .82)
  ideaEl.animate(reduce() ? [{ opacity: 0 }, { opacity: A, offset: .3 }, { opacity: A, offset: .7 }, { opacity: 0 }]
    : [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.96)' }, { opacity: A, offset: .22 }, { opacity: A, offset: .62 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.03)' }], { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)' }) }

/* ---------- the loop ---------- */
let last = performance.now()
function frame(now) {
  const dt = Math.min(100, now - last); last = now
  if (!reduce() && now - lastMove > 4000 && !HOME.still) { const a = now / 26000; Tx = W * (.5 + .38 * Math.cos(a)); Ty = H * (.42 + .3 * Math.sin(a * 1.3)) } // unattended, the sun walks
  Lx += (Tx - Lx) * .05; Ly += (Ty - Ly) * .05
  const k = 1 - Math.exp(-dt / Math.max(1, num('line-ms', 320) * .66))
  for (const w of [...live(), crossing && crossing.old].filter(Boolean)) { w.A.forEach((a, i) => { const b = a + (w.Tg[i] - a) * k; if (Math.abs(b - a) > .001) { w.A[i] = Math.abs(w.Tg[i] - b) < .004 ? w.Tg[i] : b; w.dirty = true } }); if (w.dirty) composite(w) }
  clear()
  const C = crossing
  if (pressing && pressing.d + pressing.gv > 0) { const p = pressing
    if (p.next) drawWorld(p.next)
    const pose = pressPose(p, io(p.d), p.gv)
    ledger = { t: null, list: [] }; p.old.cells.forEach((P, i) => note('h' + i, facet(P, p.old.cents[i], p.old.normals[i], [{ img: p.old.img }, ...textLayer(p.old, i, p.old.normals[i], P, 1 - p.d)], pose[i]), pose[i].m, pose[i].alpha)) }
  else if (C) crossFrame(C)
  else if (cur) { touchFrame(cur, now, dt); ledger = { t: null, list: [] }; drawWorld(cur); if (ends && !ends.after) ends.after = ledger.list
    if (!busy && cur.lc && keyAt < 0 && (GR.due || now - GR.t > num('ground-ms', 1000))) { GR.t = now; groundRead(cur) } // read off the stone as it is drawn now, before the grounds and the words
    groundEase(dt); words(cur) }
  requestAnimationFrame(frame) }
function touchFrame(w, now, dt) {
  const k = 1 - Math.exp(-dt / 90); for (let i = 0; i < w.lv.length; i++) w.lv[i] += (liftOf(w, i, now) - w.lv[i]) * k
  FX.pulses = FX.pulses.filter(p => now - p.t0 < p.ms) }

/* ---------- input ---------- */
app.addEventListener('pointerdown', e => {
  if (whyOpen) { if (!e.target.closest('#why,#where')) closeWhy(); return } // 34: the stone around the panel closes it
  if (e.button > 0 || e.target.closest('header,a,button') || !cur || cur.mode !== 'home' || busy) return
  pressGo = pressStart([e.clientX, e.clientY], e.timeStamp); try { app.setPointerCapture(e.pointerId) } catch {} })
app.addEventListener('pointerup', e => pressUp(e.timeStamp)); app.addEventListener('pointercancel', () => { homeWin = -1; FX.press = -1; pressUp() })
app.addEventListener('click', e => { // doors are links for keys and for reading; a pointer is routed on its way up, below
  const a = e.target.closest('.verse .door'); if (!a) return
  e.preventDefault(); if (e.detail !== 0 || busy || !cur || cur.mode !== 'world') return // mid-way, a second touch goes nowhere
  const d = cur.doors.find(d => d.el === a); if (d && a.closest('.l.shown')) cross(d) })
let down = null
const own = t => t && t.closest && t.closest('header a, header nav, .verse h2 a')
app.addEventListener('pointerdown', e => {
  if (whyOpen || e.button > 0 || !cur || cur.mode !== 'world' || busy || own(e.target)) return
  down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; FX.press = doorAt(e.clientX, e.clientY) ? -1 : facetAt(e.clientX, e.clientY) })
addEventListener('pointerup', e => { if (cur && cur.mode === 'world') FX.press = -1; const dn = down; down = null
  if (!dn || dn.id !== e.pointerId || Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 12 || performance.now() - dn.t > 900) return
  route(e.clientX, e.clientY) })
addEventListener('pointercancel', () => { FX.press = -1; down = null })
function route(x, y) {
  if (busy || !cur || cur.mode !== 'world') return
  const d = doorAt(x, y); if (d) return cross(d) // a door line wins over the facet beneath it
  const i = facetAt(x, y); if (i >= 0) facetTap(i) }
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !cur || busy) { FX.hover = -1; app.classList.remove('over'); return }
  if (cur.mode !== 'world') { const i = e.target.closest?.('.verse h2 a') ? cur.titleI : facetAt(e.clientX, e.clientY); FX.hover = i >= 0 && i === cur.titleI && !doorAt(e.clientX, e.clientY, cur, true) ? i : -1; app.classList.toggle('over', FX.hover >= 0)
    const k = FX.hover >= 0 ? 'title' : null; if (cur.lit !== k) { cur.lit = k; cur.dirty = true } return } // at home the stone is pressed into; the title's facet is the one taken as it is
  const onTitle = !!e.target.closest?.('.verse h2 a'), d = doorAt(e.clientX, e.clientY), i = d ? -1 : onTitle ? cur.titleI : own(e.target) ? -1 : facetAt(e.clientX, e.clientY) // the title's words are its facet's
  FX.hover = i; app.classList.toggle('over', !!d || i >= 0)
  const k = d ? d.k : i >= 0 && i === cur.titleI ? 'title' : null
  if (cur.lit !== k && (d || !e.target.closest('.door'))) { cur.lit = k; cur.dirty = true } })
addEventListener('keydown', e => {
  if (whyOpen) { if (e.key === 'Escape') { e.preventDefault(); closeWhy() } return }
  if (document.body.dataset.at === 'about' && e.key === 'Escape') return history.back()
  if (!cur || cur.mode !== 'home' || busy || e.target.closest?.('a,button,input')) return
  if (['Enter', ' '].includes(e.key)) { e.preventDefault(); (pressGo = pressStart([W / 2, H / 2])).then(() => pressUp()) } })
addEventListener('popstate', () => { if (document.body.dataset.at === 'about') return yearsBack(); location.reload() })

/* ---------- what tools/test_home.mjs reads ---------- */
const lum = (d, k) => (d[k] * .2126 + d[k + 1] * .7152 + d[k + 2] * .0722) / 255
const k2 = to => to.poem + '~' + to.photo.replace('/photos/', '')
window.HOME = { expect: null, word: null, trail: [], dry: false, still: false, clock: null, crossing: null, years: YEARS,
  get ledger() { return ledger }, get ends() { return ends },
  async step(t) { HOME.clock = t; for (let k = 0; k < 6; k++) { await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); if (ledger.t === Math.min(1, Math.max(0, t)) || !crossing) break } return { t: ledger.t, x: ledger.x, list: ledger.list } },
  get last() { return FX.last }, get seq() { return FX.seq },
  get drawn() { return cur ? drawn(cur) : [] },
  segReady: () => segReady(), get dealt() { return !!SEG },
  plan(i) { const p = cur && planOf(cur)[i]; if (!p) return null
    if (p.kind === 'idea' || p.kind === 'year' || p.kind === 'title') return { kind: p.kind, id: p.id, k: p.k ?? null, basis: p.basis, facet: p.facet, box: p.box || null, at: p.at || null, taken: p.rec ? p.rec.taken : null, href: p.href || null }
    return { kind: p.kind, id: p.id, cls: p.cls, link: p.link, basis: p.basis, facet: p.facet, to: k2(p.to), poem: p.seg.poem || null, src: p.seg.img || null,
      steps: p.steps.map(st => ({ t: st.t, key: S37.stepKey(st), big: st.big || null, small: st.small || null, lines: st.lines || null, href: st.href || null, src: st.src || null, cell: st.cell ?? null, whole: !!st.whole, to: st.to ? k2(st.to) : null, poem: st.to ? st.to.poem : null })) } },
  get plans() { return cur ? planOf(cur).map((p, i) => p && this.plan(i)) : [] },
  get world0() { return cur && { photo: cur.photo.src, poem: cur.poem.slug, trail: cur.trail, doors: cur.doors.map(d => ({ phrase: d.phrase, word: d.word, line: d.line, to: keyOf(d.to) })), W, H } },
  // the readings' own: the stone drawn now (bare: without the poem's words, its grounds kept; tint: the seams in a colour no photograph has)
  draw(o = {}) { if (!cur) return; TINT = !!o.tint; clear(); ledger = { t: null, list: [] }; drawWorld(cur); words(cur, o); TINT = false },
  async ground() { GR.due = true; GR.snap = true; for (let k = 0; k < 3; k++) await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))) }, // read again now, settled at once
  get grounds() { return [...GR.list].map(([k, G]) => ({ k, a: +G.a.toFixed(3), t: +G.t.toFixed(3), shown: +(G.a * (G.fade ? G.fade() : 1)).toFixed(3) })) },
  get text() { return cur && cur.text }, // the poem's words as composited, before they are laid on the stone (the check's: where a letter's ink is)
  get words() { const w = cur; if (!w || !w.lc) return []; const [rx, ry] = w.R, st = w.v.scrollTop
    return wordsAt(w).map(c => ({ t: c.r.t, li: c.li, title: c.title, i: c.i, d: c.d, font: c.r.font, ls: c.r.ls, x: rx + c.r.x, base: ry - st + c.r.y, box: [rx + c.r.x, ry - st + c.r.top, c.r.w, c.r.bot - c.r.top], shown: w.A[c.li] > .5 && ry - st + c.r.top >= ry - 1 && ry - st + c.r.bot <= ry + w.R[3] + 1 })) },
  tapPoint(i, all) { return cur ? touchAt(cur, i, all ? { all: true } : {}) : null }, // all: clear of every door row, as a press at home reads them
  async rest() { // every facet, as drawn now, against this photograph and against the one it leads to: the closer must be this one (pixels, not code)
    const w = cur, P = planOf(w), st = g.getImageData(0, 0, cv.width, cv.height).data, own = w.img.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, other = {}
    const foreign = async p => { const src = p && p.to && photoBy(p.to.photo) ? p.to.photo : (w.doors[0] ? w.doors[0].to.photo.src : data.photos.find(q => q.src !== w.photo.src).src)
      return other[src] ||= (await photo(photoBy(src))).getContext('2d').getImageData(0, 0, cv.width, cv.height).data }
    const skip = [w.R && [w.R[0] - 30, w.R[1] - 20, w.R[2] + 60, w.R[3] + 40], ...['#mat', '#cap', '.vs', '#year', '#tools'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left - 10, r.top - 10, r.width + 20, r.height + 20] })].filter(Boolean)
    const fit = (s, o2) => { const n = s.length; let ms = 0, mo = 0; for (let k = 0; k < n; k++) { ms += s[k]; mo += o2[k] } ms /= n; mo /= n; let so = 0, oo = 0; for (let k = 0; k < n; k++) { so += (s[k] - ms) * (o2[k] - mo); oo += (o2[k] - mo) ** 2 }
      const b = oo ? so / oo : 0; let e = 0; for (let k = 0; k < n; k++) e += Math.abs(s[k] - ms - b * (o2[k] - mo)); return e / n } // what is left after the best light (a scale and a shift): the lamp changes light, never content
    const out = []
    for (const i of drawn(w)) { const Q = inset(w.cells[i], 9); if (Q.length < 3) continue; const [x0, y0, x1, y1] = bbox(Q), S0 = [], O0 = [], F0 = [], fo = await foreign(P[i])
      for (let y = Math.ceil(y0); y < y1; y += 5) for (let x = Math.ceil(x0); x < x1; x += 5) { if (!inPoly([x, y], Q) || skip.some(([l, t, ww, hh]) => x >= l && x <= l + ww && y >= t && y <= t + hh)) continue
        const k = (Math.round(y * DPR) * cv.width + Math.round(x * DPR)) * 4; S0.push(lum(st, k)); O0.push(lum(own, k)); F0.push(lum(fo, k)) }
      if (S0.length < 12) continue
      out.push({ i, n: S0.length, own: +fit(S0, O0).toFixed(4), other: +fit(S0, F0).toFixed(4) }) }
    return out },
  get at() { return document.body.dataset.at }, get busy() { return busy }, get t() { return crossing ? clockT(crossing) : null },
  get world() { return cur && { key: cur.key, slug: cur.poem.slug, title: cur.poem.title, photo: cur.photo.src, mode: cur.mode, imgOk: !!cur.img.ok, arrived: !!cur.arrived } },
  get doors() { return cur ? cur.doors.map(d => ({ k: d.k, phrase: d.phrase, word: d.word, text: d.el.textContent, line: d.el.closest('.l').textContent, to: keyOf(d.to), how: d.to.how, phow: d.to.phow,
    box: (() => { const b = d.el.getClientRects()[0] || d.el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height] })() })) : [] },
  get lines() { return cur ? cur.lines.slice(1).map((l, i) => ({ door: 'door' in l.dataset, shown: cur.Tg[i + 1] === 1, a: cur.A[i + 1], open: (() => { const a = l.querySelector('.door'); return a ? getComputedStyle(a).pointerEvents !== 'none' : null })() })) : [] },
  get facets() { return cur ? cur.cells.filter(P => P.length > 2).length : 0 },
  get cut() { if (!cur) return null; const K = cur.cut, wind = num('wind', 8)
    return { logic: K.logic, ran: K.ran, fallback: K.fallback, summary: K.summary, src: cur.photo.src, key: cur.key, seed: cur.key + (cur.cutT ? '|' + cur.cutT : ''), count: K.sites.length, W, H, wind, stretch: K.stretch, d: K.d,
      sites: K.sites, tags: K.tags, features: K.features, cells: cur.cells } },
  get cap() { return cap.textContent },
  get crop() { const c = cur && cur.img; return c && c.crop && { shown: c.crop[0] / c.crop[1], file: c.crop[2] / c.crop[3], screen: cv.width / cv.height } }, // cover: a crop of the file in the screen's own shape, never a stretch
  read() { const w = 96, h = Math.round(96 * H / W), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(cv, 0, 0, w, h)
    const p = x.getImageData(0, 0, w, h).data; let s = 0, dark = 0, n = w * h; for (let i = 0; i < p.length; i += 4) { const l = (p[i] * .2126 + p[i + 1] * .7152 + p[i + 2] * .0722) / 255; s += l; if (l < .06) dark++ } return { mean: s / n, bare: dark / n } },
  // the six ideas' facets, the facets that could have held them, those barred and why, and the surfaces they keep clear of
  get state() { const w = cur; if (!w) return null; const pl = planOf(w), { ideas, legal } = fixedOf(w), b = barred(w), y = w.yearI
    return { at: document.body.dataset.at, ideas: ideas.map(x => ({ ...x, name: IDEAS[x.k].name })), legal, title: [...b.title], doors: [...b.doors], year: y,
      yearPlan: y >= 0 ? { at: pl[y].at, box: pl[y].box, basis: pl[y].basis } : null, yearBox: rectOf('#year a'), yearOn: yearEl.classList.contains('on'), yearText: yearA.textContent,
      where: whereRect(), whereWords: whereWords(), poem: w.R, mat: rectOf('#mat'), name: rectOf('#mat h1'), titleBox: rectOf(w.v.querySelector('h2')), cap: rectOf('#cap'), vs: rectOf('.vs'),
      cells: w.cells.map(P => P.map(([x, y0]) => [+x.toFixed(2), +y0.toFixed(2)])), cents: w.cents.map(c => c.map(v => +v.toFixed(2))), drawn: drawn(w),
      kinds: pl.map(p => p ? p.kind : null), open: toolsOpen, openAt: toolsAt, W, H,
      title: w.titleI, titlePlan: w.titleI >= 0 && pl[w.titleI] ? { href: pl[w.titleI].href, basis: pl[w.titleI].basis } : null, titleRects: [...w.v.querySelector('h2 a').getClientRects()].map(r => [r.left, r.top, r.width, r.height]),
      titleHref: w.v.querySelector('h2 a').getAttribute('href'), verse: rectOf(w.v), piece: w.drewPiece && w.drewPiece.i === w.titleI ? w.drewPiece : null, titleUnder: !!w.drewTitleUnder } },
  marks() { const w = cur; return w ? drawn(w).map(i => { const k = w.ideaAt.get(i); if (k == null) return null; const m = markOf(w, i, k, {}); return { i, k, thread: m.thread ? m.thread.a : 0, wash: m.wash ? m.wash.a : 0 } }).filter(Boolean) : [] },
  tapIdea(k, clear) { const w = cur, x = w && fixedOf(w).ideas.find(x => x.k === k), t = toolsEl.getBoundingClientRect() // clear: a place on its facet the open panel does not cover
    return x ? { i: x.i, pt: touchAt(w, x.i, clear && toolsOpen >= 0 ? { all: true, avoid: [[t.left - 8, t.top - 8, t.right + 8, t.bottom + 8]] } : { all: true }) } : null }, // clear of every door row, as a press on the stone reads them
  get open() { return toolsOpen }, get openAt() { return toolsAt }, get keyAt() { return keyAt }, ideas: IDEAS,
  // 42: this world's sentences as the panel writes them, and the same for any world by its key (the sweep), and the facts behind them
  async hereFor(key) { const pair = key ? pairOf(key) : cur; if (!pair) return null; const mode = key ? (keyOf(pair) === keyOf(ctx) ? 'home' : 'world') : cur.mode
    return hereFor(pair.photo, pair.poem, mode) },
  async factsFor(key) { const pair = key ? pairOf(key) : cur; await hereReady(); return S42.facts({ photo: pair.photo, poem: pair.poem, mode: key ? 'world' : cur.mode, ctx, model: whyModel, stepOf: window.S34 ? S34.stepOf : null, where: whereWords(), readAt: readAt(), XJ, IDEAS, src: await S42.load() }) },
  get hereReadyNow() { return toolsEl.dataset.ready === 'yes' }, get todayKey() { return keyOf(ctx) },
  async plant(key, trail = []) { // a world made exactly as a visit or a crossing makes it (fresh: no trail; crossed: the trail it came by), off screen; its six read, then let go
    const pair = pairOf(key); if (!pair) return null; const w = await makeWorld(pair, 'world', trail), { legal } = fixedOf(w), b = barred(w)
    const out = { key: w.key, cutT: w.cutT, legal, title: [...b.title], doors: [...b.doors], year: w.yearI, drawn: drawn(w), W, H,
      cells: w.cells, cents: w.cents, // full precision: the check recounts at the same .5 px boundaries the page rounds at
      where: whereRect(), whereWords: whereWords(), name: rectOf('#mat h1'), titleBox: rectOf(w.v.querySelector('h2')), vs: rectOf('.vs'), cap: capFor(w), poemTitle: w.poem.title, titleRects: [...w.v.querySelector('h2 a').getClientRects()].map(r => [r.left, r.top, r.width, r.height]), doorRects: w.doors.flatMap(d => [...d.el.getClientRects()].map(r => [r.left, r.top, r.width, r.height])), touch: Object.fromEntries(drawn(w).map(i => [i, !!touchAt(w, i, { first: true, all: true })])), date: recOf(w.photo.src) ? dateLabel(recOf(w.photo.src)) : null,
      ideas: assign(w, legal, w.yearI), poem: w.R, scroll: w.v.classList.contains('scroll'),
      half: (() => { const R = w.v.getBoundingClientRect(); return [...w.v.querySelectorAll(':scope > h2, :scope > .l')].filter(k => { const r = k.getBoundingClientRect(); return r.top < R.bottom - 1 && r.bottom > R.bottom + 1 }).length })() } // lines the poem's box cuts through
    { const r = toolsBand(w) // the panel at its full height, where an idea opens
      out.covered = (out.ideas || []).filter(x => x && !touchAt(w, x.i, { all: true, avoid: [[r[0] - 8, r[1] - 8, r[0] + r[2] + 8, r[1] + r[3] + 8]] })).map(x => x.k) }
    drop(w); return out },
  async washOf(key) { // how much each idea's hue changes its facet at rest: the world drawn with its washes and without, ΔE76 over each facet's pixels (B13, a report)
    const pair = pairOf(key); if (!pair) return null; const w = await makeWorld(pair, 'world', []), { ideas } = fixedOf(w), was = T['idea-wash']
    const grab = () => { clear(); drawWorld(w, { text: 0 }); return g.getImageData(0, 0, cv.width, cv.height).data }
    const on = grab(); T['idea-wash'] = 0; const off = grab(); T['idea-wash'] = was
    const lab = (d, k) => { const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, [r, gg, b] = [f(d[k]), f(d[k + 1]), f(d[k + 2])]
      const h = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116, X = h((r * .4124 + gg * .3576 + b * .1805) / .95047), Y = h(r * .2126 + gg * .7152 + b * .0722), Z = h((r * .0193 + gg * .1192 + b * .9505) / 1.08883)
      return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)] }
    const out = ideas.map(x => { const Q = inset(w.cells[x.i], 4), [x0, y0, x1, y1] = bbox(Q); let s = 0, n = 0
      for (let y = Math.ceil(y0); y < y1; y += 3) for (let xx = Math.ceil(x0); xx < x1; xx += 3) { if (!inPoly([xx, y], Q)) continue; const k = (Math.round(y * DPR) * cv.width + Math.round(xx * DPR)) * 4, a = lab(on, k), b = lab(off, k); s += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); n++ }
      return { k: x.k, dE: n ? +(s / n).toFixed(2) : 0 } })
    drop(w); if (cur) cur.dirty = true; return out },
  // 35's line and 36 c's join with 34's chain
  get phase() { return FS.line ? FS.line.phase : 'none' }, get whyOpen() { return whyOpen }, get model() { return whyModel }, whyReady: () => whyReady(), how: ctx.how, openWhy, closeWhy, join, JN,
  get first() { return JSON.parse(JSON.stringify({ line: FS.line })) },
  get line() { const L = LN.L; return L ? { out: tokEls().map(x => x.classList.contains('out')), on: L.se.classList.contains('on'), sentence: L.se.textContent,
    ops: tokEls().map(x => +getComputedStyle(x).opacity), sop: +getComputedStyle(L.se).opacity } : null },
  // the year facet's flight
  yearsOut, yearsBack, get about() { return aboutF && { src: aboutF.getAttribute('src'), lift: !!lift, at: document.body.dataset.at, row: lift ? lift.closest('.yr').dataset.y : null } } }
/* 43 c: what tools/test_home.mjs reads of the card */
HOME.cardClock = null
Object.defineProperty(HOME, 'card', { get() { const G = CARD.geo, el = CARD.el
  return { open: CARD.open, kind: CARD.kind, i: CARD.i, phase: CARD.phase, t: CARD.t, opens: CARD.opens, closes: CARD.closes.slice(), mode: cardMode(), motion: G ? G.way : null,
    rect: G ? [G.x, G.y, G.w, G.h] : null, poly: G ? G.shape.poly.map(([x, y]) => [G.x + x, G.y + y]) : null, xf: G ? G.shape.xf.map(([x, y]) => [G.x + x, G.y + y]) : null, shift: CARD.shiftNow || [0, 0],
    more: G ? !!G.more : null, scroll: el ? { top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight, width: el.scrollWidth, cw: el.clientWidth } : null,
    focusIn: cardEl.contains(document.activeElement), el: el ? el.id : null, transform: cardEl.style.transform || 'none', opacity: +(cardEl.style.opacity || 1), on: cardEl.classList.contains('on'),
    appShift: cv.style.transform || '', ground: cardEl.style.background || '', cue: CARD.cue ? { ...CARD.cue } : null, paged: CARD.paged || 0 } } })
HOME.cardResnap = () => { if (CARD.el) { cueStop(); CARD.el.scrollTop = 0; cardSnap(); if (CARD.geo) CARD.geo.drawn = false; cardMore() } } // 44: the card back at its start, as it opened (for the check)
HOME.cardPoint = () => { // a place a finger can land on the open card's facet, beside the card, on screen
  if (!CARD.open || !CARD.geo || CARD.i < 0 || !cur) return null; const G = CARD.geo, [sx, sy] = CARD.shiftNow || [0, 0]
  const pt = touchAt(cur, CARD.i, { all: true, avoid: [[G.x - sx - 10, G.y - sy - 10, G.x + G.w - sx + 10, G.y + G.h - sy + 10]] })
  if (!pt) return null; const X = pt[0] + sx, Y = pt[1] + sy; return X > 2 && Y > 2 && X < W - 2 && Y < H - 2 ? [X, Y] : null }
HOME.lamp = (x, y) => { Lx = Tx = x; Ly = Ty = y; lastMove = performance.now() + 1e9; if (cur) cur.dirty = true } // the light held still, for comparing frames
HOME.finishCard = () => cardFinish()
HOME.cardTexts = () => { // every text in the open card: where it shows (inside the card's scroller), its ink, its size, and whether it is body text
  const el = CARD.el; if (!el) return []; const sr = el.getBoundingClientRect(), out = [], kind = CARD.kind
  const zoomOf = e => { let z = 1; for (let q = e; q && q.nodeType === 1; q = q.parentElement) z *= parseFloat(getComputedStyle(q).zoom) || 1; return z }
  const baseOf = kind === 'chain' ? parseFloat(getComputedStyle(el.querySelector('.why-body') || el).fontSize) : 0
  const isBody = p => kind === 'idea' ? !!p.closest('p.here, .gen p') : !!p.closest('.k-say, .b-big, .b-q, .b-e, .b-name, .b-read, .b-dp, .b-ev, .t-q, .y-st') || parseFloat(getComputedStyle(p).fontSize) === baseOf
  const add = (n, p, clip) => { const cs = getComputedStyle(p), rg = document.createRange(); rg.selectNodeContents(n)
    const rs = [...rg.getClientRects()].filter(r => r.width > .5 && r.height > .5).map(r => { const l = Math.max(r.left, clip.left), t = Math.max(r.top, clip.top), rr = Math.min(r.right, clip.right), b = Math.min(r.bottom, clip.bottom); return rr - l > .5 && b - t > .5 ? [l, t, rr - l, b - t] : null }).filter(Boolean)
    if (rs.length) out.push({ t: n.data.trim().slice(0, 70), rects: rs, color: rgbOf(cs.color), op: opOf(p), px: parseFloat(cs.fontSize), z: zoomOf(p), body: isBody(p), cls: String(p.className || p.tagName) }) }
  const walk = n => { if (n.nodeType === 3) { if (!n.data.trim()) return; const p = n.parentElement; if (p.closest('[hidden]') || getComputedStyle(p).visibility === 'hidden' || getComputedStyle(p).display === 'none') return; add(n, p, sr) } else n.childNodes.forEach(walk) }
  walk(el); add(cardX.firstChild, cardX, cardEl.getBoundingClientRect()); return out }
HOME.outsidePoint = () => { // a place on the stone a finger can tap that is not the card, not the facet that spoke, not the mat, the switch or the caption
  if (!CARD.open || !CARD.geo || !cur) return null; const G = CARD.geo, [sx, sy] = CARD.shiftNow || [0, 0], keep = ['#mat', '.vs', '#cap', '#where'].map(q => rectOf(q))
  let best = null, bd = -1
  for (let y = 24; y < H - 24; y += 10) for (let x = 24; x < W - 24; x += 10) {
    if (x > G.x - 16 && x < G.x + G.w + 16 && y > G.y - 16 && y < G.y + G.h + 16) continue
    if (keep.some(r => x > r[0] - 12 && x < r[0] + r[2] + 12 && y > r[1] - 12 && y < r[1] + r[3] + 12)) continue
    const i = facetAt(x - sx, y - sy); if (i < 0 || i === CARD.i) continue
    const d = Math.hypot(x - (G.x + G.w / 2), y - (G.y + G.h / 2)); if (d > bd) { bd = d; best = [x, y] } }
  return best }
const direct = pairOf(Q.get('w')), hs = history.state || {}
let first = null
if (direct) { const tr0 = (hs.trail || []).filter(k => k !== keyOf(direct)); const w = await makeWorld({ ...direct, word: hs.word || null, from: hs.from || null }, 'world', tr0); show(w); at('world'); HOME.trail = w.trail.slice(); runLine(null); arrive(w, num('arrive-delay-ms', 500)) }
else { const m = await S35M.read(ctx, { photo: ctx.photo.src, poem: ctx.poem.slug }).catch(e => { console.error('moment: ' + (e && e.stack || e)); return null }), L = setLine(m)
  const w = await makeWorld({ poem: ctx.poem, photo: ctx.photo }, 'home', []); show(w); at('stone'); HOME.trail = w.trail.slice(); w.lines.forEach((l, i) => { w.Tg[i] = w.A[i] = 1; l.classList.add('shown') }); w.dirty = true; warm(w); first = L }
requestAnimationFrame(frame)
runLine(first)
let rz = 0, lastWH = innerWidth + 'x' + innerHeight
const rebuild = async () => { if (busy) return; size(); prepared.clear(); const o = cur, w = await makeWorld({ poem: o.poem, photo: o.photo, word: o.word, from: o.from }, o.mode, o.trail.slice(0, -1)); drop(o); show(w)
  w.lines.forEach((l, i) => { w.Tg[i] = w.A[i] = 1; l.classList.add('shown') }); w.arrived = true; w.dirty = true }
addEventListener('resize', () => { const wh = innerWidth + 'x' + innerHeight; if (wh === lastWH) return; lastWH = wh; clearTimeout(rz); rz = setTimeout(rebuild, 250) })
HOME.firstLoad = ['/', ...performance.getEntriesByType('resource').filter(e => e.name.startsWith(location.origin)).map(e => new URL(e.name).pathname)] // what the first screen took, for the check
document.body.dataset.ready = 'yes'
// after the first screen: what the facets deal from, then the chain behind the line
requestAnimationFrame(() => setTimeout(() => segReady().then(() => { if (cur && !busy) { cur.plan = null; planOf(cur) } }), 0))
setTimeout(() => hereReady(), num('why-idle-ms', 4000)) // and what an idea's facet says of this world, which reads that chain's model
