/* v3/stone.js, the home (live since Kahran's call of 8 Nov: "lets plan on 2"). Assembled from the studies he picked, their code carried over:
     the stone over the day's photograph, cut by its masses (33; cut.js) · the poem broken across it, door lines arriving in line order (28)
     the walk between worlds through door lines and facet doors (24, 28) · the grow crossing, re-cut to the next photograph's masses (39; cross.js),
     a crossfade under reduced motion · every facet gives a piece of his work by its shape (37 ?y=shape; segs.js, segments.json)
     the six ideas and their tools in the facet nearest the where line (40; IDEAS read live from /v2/home.js)
     the where line arriving as 35 ?a=line, and opening 34 b's chain, joined as 36 c (moment.js, why.js, body.js, ways.js)
     the photograph's own facet holding its EXIF month and year, the way into the About's years (38 ?d=c; 27 a)
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
const app = $('#app'), cv = $('#stone'), g = cv.getContext('2d'), readEl = $('#read'), mat = $('#mat'), cap = $('#cap'), ideaEl = $('#idea'), backEl = $('#back')
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
async function openWhy() { if (whyOpen) return true; whyOpen = true; matH(); closeTools()
  const m = await whyReady(); if (!m || !whyOpen) return false
  const doors = cur && cur.mode === 'home' && cur.poem.slug === m.poem.slug ? HOME.doors : null
  if (!whyDrawn) { await S34B.build(m, ctx, DJ, doors); if (!whyOpen) return false; S34W.draw('b', m, whyBody, { dotPx: num('why-dot-px', 3), doors }); whyDrawn = true; whyBody.dataset.drawn = 'yes' }
  whyEl.setAttribute('aria-hidden', 'false'); whereEl.setAttribute('aria-expanded', 'true')
  await new Promise(r => requestAnimationFrame(() => { document.body.classList.add('why'); r() })); return whyOpen }
function closeWhy() { if (!whyOpen) return; whyOpen = false
  document.body.classList.remove('why'); whyEl.setAttribute('aria-hidden', 'true'); whereEl.setAttribute('aria-expanded', 'false'); whereEl.focus({ preventScroll: true })
  JN.closes++; if (LN.L && FS.line.phase !== 'resolved') resolveLine() } // c: closing, the readings fade into the sentence again
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
const inView = t => { const a = t.getBoundingClientRect(), b = whyEl.getBoundingClientRect(); return a.height > 0 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1 }
function unresolve() { // the sentence turns back into the readings it was made of, in the line's own order and pace
  hush(); const { se } = LN.L, st = num('line-stagger-ms', 110); FS.line.phase = 'returning'; document.body.dataset.line = 'read'
  se.classList.remove('on'); tokEls().forEach((x, k) => later(() => x.classList.remove('out'), k * st))
  later(() => { FS.line.phase = 'read' }, st * tokEls().length + num('line-out-ms', 900)) }
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
  later(() => { FS.line.phase = 'resolved'; document.body.dataset.line = 'done'; groundT = 0 }, st * left.length + num('line-out-ms', 900)) }

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
  w.cut = K; w.cutT = t || 0; w.sites = K.sites; const r2 = rng(hash(w.key + '|n' + (t || ''))); w.normals = w.sites.map(() => [(r2() - .5) * .9, (r2() - .5) * .9])
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
function poemRect(at = {}) { // 20's, yielding to the names: on a phone it stands on them (at.foot) or, where they sit above it, hangs under them (at.head); on its side it starts right of them (at.left)
  if (phone()) { const bottom = at.foot ?? (at.head != null ? H - mat.offsetHeight - 34 : H - mat.offsetHeight - 34 - namesRoom()), top = at.head ?? Math.min(Math.round(H * .34), bottom - 160); return [16, top, W - 32, bottom - top] }
  if (low()) { const right = Math.max(16, W * .03), w = Math.min(440, W * .48, at.left != null ? W - right - at.left : 1e9), top = Math.round(H * .16); return [W - w - right, top, w, H - top - 14] } // on its side: the poem takes the right half, the mat keeps the left
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
  a.addEventListener('click', () => track('poem_open', { poem: w.poem.slug, via: 'title' }))
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
    /* the line's own ground, on its own canvas, feathered so the lines' grounds run together as one quiet shade. How strong it lies (L.ga) is
       read off the stone as drawn, the lamp included (groundLines); until then, off the photograph */
    const ux0 = Math.min(...L.runs.map(r => r.x)), ux1 = Math.max(...L.runs.map(r => r.x + r.w)), uy0 = Math.min(...L.runs.map(r => r.top)), uy1 = Math.max(...L.runs.map(r => r.bot))
    L.u = [ux0, uy0, ux1 - ux0, uy1 - uy0]
    L.ga = L.gt = w.img ? groundFor([vr.left + ux0, vr.top + uy0 - v.scrollTop, ux1 - ux0, uy1 - uy0], w.img.getContext('2d', { willReadFrequently: true }), [[INK, 1]]) : 0
    { const gc = document.createElement('canvas'); gc.width = c.width; gc.height = c.height; const gx = gc.getContext('2d'), f = num('line-feather-px', 8)
      gx.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR); gx.filter = `blur(${f / 2 * DPR}px)`; gx.fillStyle = `rgb(${GROUND})`
      gx.beginPath(); gx.roundRect(ux0 - f, uy0 - f, ux1 - ux0 + f * 2, uy1 - uy0 + f * 2, f); gx.fill(); L.g = gc }
    x.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR)
    for (const [blur, al] of [[16, .7], [2, .35]]) { x.shadowColor = `rgba(0,0,0,${al})`; x.shadowBlur = blur * DPR; x.shadowOffsetY = DPR
      for (const r of L.runs) { x.font = r.font; x.letterSpacing = r.ls === 'normal' ? '0px' : r.ls; x.globalAlpha = r.tag ? .6 : 1; x.fillStyle = r.tag ? '#c9c3b6' : '#f3efe6'; x.fillText(r.t, r.x, r.y) } }
    Object.assign(L, { c, x0, y0, w: x1 - x0, h: y1 - y0 })
    const rows = new Map(); for (const r of L.runs) if (r.k != null) { const key = r.k + '|' + Math.round(r.y); const o = rows.get(key); if (o) { o[0] = Math.min(o[0], r.x); o[1] = Math.max(o[1], r.x + r.w) } else rows.set(key, [r.x, r.x + r.w, r.y, r.k, parseFloat(r.font.split(' ')[2])]) }
    L.unders = [...rows.values()] }
  return out }
function placePoem(w, at) { // where the poem sits; on a phone, if it cannot fit at its smallest size it rises to just under the caption first
  const R = poemRect(at), ceil = phone() ? ceilOf(w) : 0; if (R[1] < ceil) { R[3] -= ceil - R[1]; R[1] = ceil } // never up onto the caption
  Object.assign(w.v.style, { left: R[0] + 'px', top: R[1] + 'px' }); fit(w.v, R[2], R[3])
  if (phone() && w.v.classList.contains('scroll') && !(at && at.head != null)) { const top = ceil; if (top < R[1]) { /* never past names above it */ R[3] += R[1] - top; R[1] = top; w.v.style.top = R[1] + 'px'; fit(w.v, R[2], R[3]) } }
  if (phone()) { R[1] = R[1] + R[3] - w.v.offsetHeight; w.v.style.top = R[1] + 'px' } // on the phone the poem sits down on the names, in the shade
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
  w.lc.forEach((L, i) => { const a = w.A[i]; if (a < .003 || !L.c || w.bare === 'raw') return; if (L.g && L.ga > .003) { x.globalAlpha = a * L.ga; x.drawImage(L.g, L.x0, L.y0, L.w, L.h) }
    if (w.bare) return; x.globalAlpha = a; x.drawImage(L.c, L.x0, L.y0, L.w, L.h)
    for (const [u0, u1, y, k, px] of L.unders) { if (w.mode !== 'world' && k !== 'title') continue // the title is a way in at home too: to the whole poem
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
  { // no dead facet, and the six names whole in a facet by the where line: a cut that fails either is cut again (the filling sites re-seeded, the same way each time,
    // never the photograph's lines), keeping the cut that holds the names nearest (by the line, then anywhere), and of those the one with the fewest dead facets.
    // On a phone, upright or on its side, the names' spot is found first and the poem yields to it (stands on it, or starts right of it), keeping at least
    // poem-least (else poem-least-tight) for itself: room is made by the poem, never by shrinking the names
    const near = num('tools-near-px', 110), ids = () => drawn(w).map(i => ({ i }))
    // dead facets count twice and a split title once, so the title only breaks a tie (its own facet is never dead: it opens the poem)
    const deadOf = () => { const T = titleAt(w); return drawn(w).filter(i => !(T && T.i === i) && !touchAt(w, i, { first: true, all: true })).length * 2 + (T && T.whole ? 0 : 1) }
    const gap = num('tools-poem-gap-px', 16), lowRight = Math.max(16, W * .03)
    const room = least => phone() ? { minTop: ceilOf(w) + least + gap } : { maxRight: W - lowRight - least - gap } // how far the names may push the poem: it keeps at least this much
    const yields = s => !s ? undefined : phone() ? { foot: s.box[1] - gap } : { left: Math.max(s.box[0] + s.box[2] + gap, W - lowRight - Math.min(440, W * .48)) }
    const plan = () => { if (!phone() && !low()) return { s: toolsFacet(w, ids()), roomy: true }
      const stops = [rectOf('#mat'), capFor(w), rectOf('.vs')], [a0, a1] = phone() ? [num('poem-least-px', 180), num('poem-least-tight-px', 90)] : [num('poem-least-w-px', 320), num('poem-least-w-tight-px', 240)]
      let s = toolsFacet(w, ids(), { stops, ...room(a0) }), roomy = !!s; if (!s) s = toolsFacet(w, ids(), { stops, ...room(a1) })
      if (!s && phone()) { const h = toolsFacet(w, ids(), { stops, minTop: ceilOf(w), maxBottom: H - mat.offsetHeight - 34 - a1 - gap }) // no room by the line: the names take the nearest facet that holds them above the poem, and the poem sits between them and the mat
        if (h) return { s: h, roomy: false, at: { head: h.box[1] + h.box[3] + gap }, place: true, over: true } }
      return { s, roomy, at: yields(s), place: true } }
    const rankOf = p => !p.s ? 0 : p.over ? 1 : (p.s.basis.d <= near ? 3 : 1) + (p.roomy ? 2 : 1) // near and roomy, near and tight, far and roomy, then far: tight, or the names over the poem
    let best = null, at = -1
    const cut = t => { if (at !== t) { cutFor(w, t); at = t } }
    const settle = p => { if (!p.place) return p; placePoem(w, p.at); return p.s ? p : { s: toolsFacet(w, ids()), roomy: true } } // the poem where this cut's names want it; no spot: the poem where it was, any facet that holds them
    for (let t = 0; t <= num('recut-tries', 64); t++) { cut(t); let p = plan(); if (best && rankOf(p) < best.rank) continue
      p = settle(p); const rank = rankOf(p)
      if (best && rank < best.rank) continue
      const dead = deadOf(); if (!best || rank > best.rank || dead < best.dead) best = { t, rank, dead }
      if (best.rank === 5 && (!best.dead || best.dead === 1 && t >= num('title-tries', 48))) break }
    cut(best.t); settle(plan()); w.lc = lineCanvases(w); w.dirty = true }
  if (!(titleAt(w) || {}).whole) settleTitle(w)
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
  for (const L of layers) { const a = (L.alpha ?? 1) * A; if (a <= .002 || !L.img) continue; g.globalAlpha = a
    g.save(); if (L.m) g.transform(...L.m); g.drawImage(L.img, 0, 0, W, H); g.restore() }
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
    g.strokeStyle = f > 0 ? `rgba(255,244,222,${bev * (.15 + .85 * k) * f})` : `rgba(0,0,0,${bev * .8 * -f})`
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke() }
  if (o.under > .01) { const Ui = inset(Qp, 5); let bi = -1, by = -1e9 // a photo door's mark: the quiet underline of a door line, along the facet's lowest side
    for (let i = 0; i < Ui.length; i++) { const a = Ui[i], b = Ui[(i + 1) % Ui.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dy = Math.abs(b[1] - a[1]) / (l || 1); if (l < 18 || dy > .5 || Math.max(a[1], b[1]) > H - 8) continue; const y = (a[1] + b[1]) / 2; if (y > by) { by = y; bi = i } }
    if (bi >= 0) { const a = Ui[bi], b = Ui[(bi + 1) % Ui.length], t0 = .18, t1 = .82; g.lineWidth = lk; g.strokeStyle = `rgba(243,239,230,${o.under})`; g.beginPath(); g.moveTo(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0); g.lineTo(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1); g.stroke() } }
  if (o.edge > .01) { g.lineWidth = (o.edgePx || 1.2) * lk; g.strokeStyle = `rgba(255,246,228,${o.edge})`; g.beginPath(); Qp.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke() }
  if (o.fire > .01) { g.globalCompositeOperation = 'screen' // light split at the facet's edge: spectral fringes, the only colour, and only while the light passes through; set inside the edge (22 c set them outside, past its own clip: that was the faintness)
    ;[[255, 64, 40], [60, 255, 120], [70, 110, 255]].forEach(([rr, gg, bb], j) => { g.lineWidth = 1.6 - j * .3; g.strokeStyle = `rgba(${rr},${gg},${bb},${Math.min(1, o.fire) * .65})`
      for (let i = 0; i < Qp.length; i++) { const a = Qp[i], b = Qp[(i + 1) % Qp.length]; let ex = -(b[1] - a[1]), ey = b[0] - a[0]; const el = Math.hypot(ex, ey); if (el < 1) continue
        const s = (2 + j * 2.2) * sg; ex = ex / el * s; ey = ey / el * s; g.beginPath(); g.moveTo(a[0] + ex, a[1] + ey); g.lineTo(b[0] + ex, b[1] + ey); g.stroke() } })
    g.globalCompositeOperation = 'source-over' }
  g.restore(); return Qp }
const refr = () => num('refract-px', 5)
const textLayer = (w, i, n, cell, alpha = 1) => meets(bbox(cell), w.R, 24) ? [{ img: w.text, alpha, m: tr(n[0] * refr(), n[1] * refr()) }] : [] // each facet holds the poem a little off, so it breaks at the seams
function drawWorld(w, o = {}) { const touched = w === cur && !crossing && !pressing && !o.plain
  w.cells.forEach((P, i) => { const base = [{ img: w.img }, ...textLayer(w, i, w.normals[i], P, o.text ?? 1)]
    const o2 = w.toolsI === i && !o.plain ? { ...o, edge: Math.max(o.edge || 0, num('tools-edge', .22)), glow: Math.max(o.glow || 0, num('tools-glow', 0)) } : o // the tools' facet: its rim drawn, a breath of light in it, so the names read as its own
    if (!touched) { const o3 = titlePiece(w, i, o2, base); return note('r' + i, facet(P, w.cents[i], w.normals[i], base, o3), o3.m, o.alpha ?? 1) }
    const G = FX.glimpse && FX.glimpse.w === w && FX.glimpse.i === i && FX.win ? FX.glimpse : null
    if (G) { const u = performance.now() - G.t0, ms = num('win-hold-ms', 3600); base.splice(1, 0, { img: G.img, alpha: reduce() ? 1 : Math.min(ss(0, 420, u), 1 - ss(ms - 600, ms, u)) * num('glimpse-alpha', 1), m: G.m }) }
    const f0 = { ...o2, ...fxOf(w, i) }; f0.glow = Math.max(f0.glow || 0, o2.glow || 0); const fx = titlePiece(w, i, f0, base); note('r' + i, facet(P, w.cents[i], w.normals[i], base, fx), fx.m, 1) }) } // at rest and touched alike, every facet holds this photograph: nothing is swapped in
/* the ledger (39's): every facet drawn this frame, as drawn (its polygon after the seam and any transform), and how much of it is seen.
   The check reads it frame by frame: nothing may leave it, or join it, while it is seen */
let ledger = { t: null, list: [] }
function note(id, Qp, m, seen) { const e = { id, seen: +(+seen).toFixed(4), area: 0, c: null, Q: null }
  if (Qp) { const M = m || [1, 0, 0, 1, 0, 0], Q = Qp.map(([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]), A = Math.abs(area2(Q)) / 2
    Object.assign(e, { area: +A.toFixed(1), c: centroid(Q).map(v => +v.toFixed(2)), Q: Q.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]) }) }
  ledger.list.push(e) }
function clear() { g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalAlpha = 1; g.fillStyle = '#0d0c0b'; g.fillRect(0, 0, W, H) }

/* ---------- the facets, touched ---------- */
const FX = { hover: -1, press: -1, pulses: [], win: null, glimpse: null, seq: 0, last: null }
const drawn = w => w.cells.map((P, i) => P.length > 2 && inset(P, num('seam-px', 2.2) / 2).length > 2 ? i : -1).filter(i => i >= 0)
function touchAt(w, i, o = {}) { // a place a finger can land on facet i that is the facet's: not a door line's row (all of them, o.all), not on or a finger's width from a link
  const P = inset(w.cells[i], 5); if (P.length < 3) return null
  const m = navigator.maxTouchPoints > 0 ? 26 : 4, step = o.first ? 8 : 4, rect = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom] }
  const links = [...document.querySelectorAll('#mat a, .vs a'), ...w.v.querySelectorAll('h2 a, .door')].map(rect), sw = [] // the switch and the door words too: the browser gives a finger near a link to the link
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

/* ---------- Study 37's one question: every facet gives a segment of his work, linked by something real to where it sits ---------- */
const PLAN = 'home-plan' // a facet's segment is dealt once and kept for the visit: the same facet, the same piece, the same depth
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
/* ---------- the title's facet: the poem's own piece of the stone, and the way to the whole poem ---------- */
const REACH = .45 // how far a facet's normal can lean (cutFor's (r - .5) * .9): each facet draws the poem at most REACH * refract-px off
function titleAt(w, skip = -1) { // the drawn facet the title lies in (with the refraction's reach and a pixel to spare all round), and whether it lies there whole; never facet skip (the names')
  const a = w.v && w.v.querySelector('h2 a'); if (!a) return null
  const pad = refr() * REACH + 1, pts = []
  for (const r of a.getClientRects()) for (let u = 0; u <= 6; u++) for (let v = 0; v <= 2; v++) pts.push([r.left - pad + (r.width + pad * 2) * u / 6, r.top - pad + (r.height + pad * 2) * v / 2])
  let best = null
  for (const i of drawn(w)) { if (i === skip) continue; const P = inset(w.cells[i], num('seam-px', 2.2) / 2); const n = pts.filter(p => inPoly(p, P)).length; if (n && (!best || n > best.n)) best = { i, n } }
  return best && { i: best.i, whole: best.n === pts.length, share: best.n / pts.length } }
function settleTitle(w) { // no cut holds the title whole: it moves along its own row, as little as it can, into the one facet that then holds it whole (as the tools' names are placed)
  const h = w.v.querySelector('h2'), a = h && h.querySelector('a'); if (!a) return
  const room = Math.floor(h.clientWidth - a.getBoundingClientRect().width) - 1; let at = null
  for (let dx = 4; dx <= room && at == null; dx += 4) { h.style.paddingLeft = dx + 'px'; if ((titleAt(w) || {}).whole) at = dx }
  h.style.paddingLeft = at == null ? '' : at + 'px'; if (at != null) { w.lc = lineCanvases(w); w.dirty = true } }
function titleFacet(w, skip) { const T = titleAt(w, skip); if (!T) return null
  return { ...T, href: '/poems/' + w.poem.slug + '.html', basis: { rule: 'the facet the title lies in', whole: T.whole, share: +T.share.toFixed(2), title: w.poem.title } } }
/* a facet that is one thing to take: its ground toned down under the words on it, its rim drawn clear all round, brighter under a pointer.
   The title's today; written so any facet that is one piece can be drawn so */
const DARK = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = 'rgb(13,12,11)'; x.fillRect(0, 0, 1, 1); return c })()
function piece(o, layers, lit, tone, edge) { layers.splice(1, 0, { img: DARK, alpha: tone }); return { ...o, edge: Math.max(o.edge || 0, lit ? Math.min(1, edge * num('piece-lit', 1.6)) : edge), edgePx: num('piece-edge-px', 1.4) } }
function titlePiece(w, i, o, layers) { if (w.titleI !== i || o.plain) return o
  const tone = num('title-tone', .3), o2 = piece(o, layers, FX.hover === i || FX.press === i, tone, num('title-edge', .55)); w.drewPiece = { i, tone, edge: o2.edge }; return o2 }
/* ---------- the tools: which facet holds them, the six names on it, the idea a name opens ---------- */
const namesEl = $('#names'), toolsEl = $('#tools')
const rectOf = q => { const e = typeof q === 'string' ? document.querySelector(q) : q, r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }
const meet = (a, b, pad = 0) => a[0] < b[0] + b[2] + pad && a[0] + a[2] + pad > b[0] && a[1] < b[1] + b[3] + pad && a[1] + a[3] + pad > b[1]
const gapOf = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3]))) // edge to edge, 0 when they touch
function whereRect() { const r = rectOf('#where'); return r[3] > 0 ? r : rectOf('#mat h1') } // the line that says where he is and the sky; before it is written, the name it sits under
const boxes = new Map()
const namesRoom = () => { const b = namesBoxes().find(b => b[0] <= W - 32) || namesBoxes().at(-1); return b[1] + num('tools-room-px', 34) } // on a phone the poem sits on the where line; it stands up by the names' height, so they can sit beside the line there too
const FORMS = [[2.6], [1.6], [1], [.8], [.64], [0, 'col'], [0, 'col tight']] // one long row, then two, then wrapped narrower; then one name a line, then the same tracked tighter, for a slim facet
function namesBoxes() { // the six names in every shape they can take, each measured to its last letter (a name never wraps, so it can be wider than the measure); sized once per screen
  if (!namesEl.children.length) IDEAS.forEach((I, k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = I.name; b.title = I.line; b.setAttribute('aria-label', I.name); b.dataset.k = k; b.style.setProperty('--hue', HUE[I.hue] || ''); namesEl.append(b) })
  const key = W + 'x' + H; if (boxes.has(key)) return boxes.get(key)
  const m0 = phone() ? num('tools-measure-phone-px', 190) : num('tools-measure-px', 250), keep = [namesEl.style.maxWidth, namesEl.classList.contains('col'), namesEl.classList.contains('tight')], out = []
  for (const [k, form = ''] of FORMS) { formNames(k ? Math.round(m0 * k) : 0, form); const r = namesEl.getBoundingClientRect(); let x1 = r.right, y1 = r.bottom
    for (const b of namesEl.children) { const q = b.getBoundingClientRect(); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom) }
    out.push([Math.ceil(x1 - r.left), Math.ceil(y1 - r.top), k ? Math.round(m0 * k) : 0, form]) }
  namesEl.style.maxWidth = keep[0]; namesEl.classList.toggle('col', keep[1]); namesEl.classList.toggle('tight', keep[2]); boxes.set(key, out); return out }
function formNames(mw, form) { namesEl.style.maxWidth = mw ? mw + 'px' : ''; for (const c of ['col', 'tight']) namesEl.classList.toggle(c, (form || '').split(' ').includes(c)) }
const edgeD = ([x, y], P) => { let d = Infinity; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, ay] = P[j], [bx, by] = P[i], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2)); d = Math.min(d, Math.hypot(x - ax - t * vx, y - ay - t * vy)) } return d }
const ringOf = (x, y, bw, bh) => { const pts = [], nx = Math.max(2, Math.ceil(bw / 8)), ny = Math.max(2, Math.ceil(bh / 8)); for (let a = 0; a <= nx; a++) pts.push([x + bw * a / nx, y], [x + bw * a / nx, y + bh]); for (let a = 1; a < ny; a++) pts.push([x, y + bh * a / ny], [x + bw, y + bh * a / ny]); return pts }
function fitIn(w, i, stops, to, minTop = 0, maxRight = 1e9, maxBottom = 1e9) { // where the names can sit WHOLLY on facet i (Kahran, 9 Nov: never over a seam): every corner and every point of their edge inside its cut, a seam's width and a breath in,
  // clear of the poem, the name, the caption and the switch; in whichever shape lets them sit nearest the where line, then flush with it, then nearest the facet's centre
  const cell = w.cells[i], inn = num('seam-px', 2.2) + num('tools-pad-px', 8), P = inset(cell, inn); if (P.length < 3) return null
  const [x0, y0, x1, y1] = bbox(P), c = w.cents[i]; let best = null, bd = Infinity
  for (const [bw, bh, mw, form] of namesBoxes()) if (bw <= x1 - x0 && bh <= y1 - y0)
    for (let y = Math.max(y0, minTop); y + bh <= Math.min(y1, maxBottom); y += 4) for (let x = x0; x + bw <= Math.min(x1, maxRight); x += 4) {
      if (x < 8 || y < 8 || x + bw > W - 8 || y + bh > H - 8) continue
      const g0 = gapOf([x, y, bw, bh], to), d = g0 * 1e4 + bh * 20 + Math.abs(x - to[0]) * 10 + Math.hypot(x + bw / 2 - c[0], y + bh / 2 - c[1]); if (d >= bd) continue
      if (![[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]].every(p => inPoly(p, P)) || stops.some(o => meet([x, y, bw, bh], o, 10))) continue
      if (!ringOf(x, y, bw, bh).every(p => inPoly(p, cell) && edgeD(p, cell) >= inn - .5)) continue // against the cut itself, not only its inset (a sharp corner's inset is pulled in short)
      bd = d; best = [Math.round(x), Math.round(y), bw, bh, mw, form] }
  return best }
function capFor(w) { const was = cap.textContent; cap.textContent = w.photo.caption || ''; const r = rectOf('#cap'); cap.textContent = was; return r } // this world's caption, where it will sit (a world is planned before it is shown)
const stopsOf = w => [w.R, rectOf('#mat'), capFor(w), rectOf('.vs')]
function toolsFacet(w, fs, o = {}) { // the facet nearest the where line that can hold the names whole (a door line over it still opens its door: the names are their own buttons)
  const where = whereRect(), stops = o.stops || stopsOf(w)
  const cand = fs.map(f => { const box = fitIn(w, f.i, stops, where, o.minTop || 0, o.maxRight ?? 1e9, o.maxBottom ?? 1e9); return box && { i: f.i, box, d: +gapOf(box, where).toFixed(1) } }).filter(Boolean).sort((a, b) => a.d - b.d)
  if (!cand.length) return null
  const [c0, c1] = cand
  return { i: c0.i, box: c0.box, basis: { rule: 'nearest the where line, wholly inside', where, d: c0.d, next: c1 ? { i: c1.i, d: c1.d } : null, holds: cand.length, of: fs.length } } }
let toolsOpen = -1
function showNames(w) { const p = planOf(w).find(p => p && p.kind === 'tools')
  namesBoxes(); namesEl.classList.toggle('on', !!p && toolsOpen < 0)
  if (p) { formNames(p.box[4], p.box[5]); Object.assign(namesEl.style, { left: p.box[0] + 'px', top: p.box[1] + 'px' }) } }
function toolsBand(w) { // the clear band for an idea: away from the poem and the name; the caption steps aside while it is open
  const R = w.R, m = rectOf('#mat'), v = rectOf('.vs'), pad = 16, cands = []
  if (phone()) cands.push([pad, v[1] + v[3] + 6, W - pad * 2, R[1] - 12 - (v[1] + v[3] + 6)])
  else { const left = Math.max(16, Math.min(56, W * .034)), top = low() ? 12 : Math.max(48, H * .07)
    cands.push([left, top, Math.min(low() ? 9999 : num('tools-band-px', 440), R[0] - 24 - left), m[1] - 14 - top]) }
  const b = cands[0]; return [b[0], b[1], Math.max(0, b[2]), Math.max(0, b[3])] }
function openTools(k) { const w = cur, I = IDEAS[k]; if (!w || !I) return
  toolsOpen = k; toolsEl.textContent = ''; document.body.classList.add('tools-open')
  const nav = document.createElement('nav'); IDEAS.forEach((J, j) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = J.name; b.dataset.k = j; b.style.setProperty('--hue', HUE[J.hue] || ''); if (j === k) b.setAttribute('aria-current', 'true'); nav.append(b) })
  const h = document.createElement('h2'); if (I.href) h.append(Object.assign(document.createElement('a'), { href: I.href, textContent: I.name })); else h.textContent = I.name
  const d = I.detail || {}, ul = document.createElement('ul')
  I.parts.forEach((part, j) => { const li = document.createElement('li'), b = document.createElement('button'), q = document.createElement('p')
    b.type = 'button'; b.textContent = part; b.dataset.part = j; b.setAttribute('aria-expanded', 'false'); q.textContent = (d.tools || [])[j] || ''; q.hidden = true; li.append(b, q); ul.append(li) })
  toolsEl.append(nav, h); if (d.intro) toolsEl.append(Object.assign(document.createElement('p'), { textContent: d.intro })); toolsEl.append(ul)
  if (d.boundary) toolsEl.append(Object.assign(document.createElement('p'), { className: 'boundary', textContent: d.boundary }))
  const [l, t, bw, bh] = toolsBand(w); Object.assign(toolsEl.style, { left: l + 'px', top: t + 'px', width: bw + 'px', maxHeight: bh + 'px' }); toolsEl.scrollTop = 0
  if (!phone()) Object.assign(toolsEl.style, { top: '', bottom: H - t - bh + 'px' }) // it rises from the name and the where line, where the names were, and grows upward as tools open
  else toolsEl.style.bottom = ''
  toolsEl.classList.add('on'); namesEl.classList.remove('on'); said(-1, 'tools', { idea: I.name }) }
function closeTools() { if (toolsOpen < 0) return; toolsOpen = -1; toolsEl.classList.remove('on'); document.body.classList.remove('tools-open'); if (cur) showNames(cur) }
namesEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !busy) { track('tools_open', { idea: IDEAS[+b.dataset.k].name, via: 'name' }); openTools(+b.dataset.k) } })
toolsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return
  if (b.dataset.k != null) { if (+b.dataset.k === toolsOpen) return closeTools(); track('tools_open', { idea: IDEAS[+b.dataset.k].name, via: 'idea' }); return openTools(+b.dataset.k) }
  const q = b.nextElementSibling, open = q.hidden; q.hidden = !open; b.setAttribute('aria-expanded', String(open)) })
addEventListener('pointerdown', e => { if (toolsOpen < 0 || e.target.closest('#tools, #names')) return; e.stopImmediatePropagation(); closeTools() }, true) // with an idea open, a touch elsewhere only closes it
addEventListener('keydown', e => { if (e.key === 'Escape') closeTools() })
/* the two facets placed by a reason of their own, before anything is dealt: the tools (40: nearest the where line) and the photograph's
   date (38 c: the facet where its month and year read clearest on the photograph itself). The tools keep theirs if both want the same one */
function fixedOf(w) { // the names first (their facet is what the cut was kept for), then the title's: the facet holding most of the title that is not the names'; the date among the rest
  if (w.fixed) return w.fixed
  const fs = facetsOf(w), tools = toolsFacet(w, fs), title = titleFacet(w, tools ? tools.i : -1), rest = fs.filter(f => !title || f.i !== title.i), year = yearFacet(w, rest, tools)
  w.titleI = title ? title.i : -1; w.toolsI = tools ? tools.i : -1; w.yearI = year ? year.i : -1
  return w.fixed = { fs, tools, year, title } }
function planOf(w) {
  if (w.plan) return w.plan
  const { fs, tools, year, title } = fixedOf(w), plan = w.cells.map(() => null)
  if (title) plan[title.i] = { kind: 'title', id: 'title', facet: fs.find(f => f.i === title.i), href: title.href, basis: title.basis, steps: [{ t: 'title' }] }
  if (tools) plan[tools.i] = { kind: 'tools', id: 'tools', facet: fs.find(f => f.i === tools.i), box: tools.box, basis: tools.basis, steps: [{ t: 'tools' }] }
  if (year) plan[year.i] = { kind: 'year', id: 'year', facet: fs.find(f => f.i === year.i), box: year.box, at: year.at, basis: year.basis, rec: year.rec, steps: [{ t: 'year' }] }
  if (!SEG) return plan // the rest is dealt when segments.json is here (segReady); until then only these two are known
  const st = planStore(), key = planKey(w), fixed = p => p && (p.kind === 'tools' || p.kind === 'year' || p.kind === 'title')
  if (st[key] && st[key].length === w.cells.length && st[key].every((p, i) => fixed(plan[i]) ? true : !p || segBy(p.id))) { w.plan = st[key].map((p, i) => fixed(plan[i]) ? plan[i] : p && { ...p, seg: segBy(p.id) }); return w.plan } // the visit's plan, verbatim
  const world = { photo: w.photo.src, poem: w.poem.slug, trail: w.trail, doors: w.doors.map(d => ({ phrase: d.phrase, word: d.word, line: d.line })),
    taken: w.doors.map(d => d.to.photo.src), takenPoems: w.doors.map(d => d.to.poem.slug) } // the door lines' worlds are theirs: no facet promises one
  const rest = fs.filter(f => f.i !== w.toolsI && f.i !== w.yearI && f.i !== w.titleI) // the title, the tools and the date take their facets first; the rest give his work
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
  yearsBusy = true; busy = true; track('year_open', { year: rec.row, via }); closeTools(); hideWin()
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
    phEl.hidden = true; cleanAbout(aboutF.contentDocument); lift = null; if (cur) { showNames(cur); showYear(cur) } } finally { yearsBusy = false } }
yearA.addEventListener('click', e => { e.preventDefault(); if (!busy && cur) yearsOut('date') })
yearA.addEventListener('pointerenter', () => aboutFrame()) // a pointer on its way to the date: the About starts loading
const DEPTH = 's40-depth', depthStore = () => { try { return JSON.parse(sessionStorage.getItem(DEPTH)) || {} } catch { return {} } }
const depthOf = (w, i) => depthStore()[planKey(w) + '#' + i] || 0
const deepen = (w, i) => { const s = depthStore(); s[planKey(w) + '#' + i] = depthOf(w, i) + 1; try { sessionStorage.setItem(DEPTH, JSON.stringify(s)) } catch {} }
const nextStep = (w, i) => { const p = planOf(w)[i]; if (!p) return null; return p.steps[Math.min(depthOf(w, i), p.steps.length - 1)] }
function showWin(i, s) { const w = cur, p = planOf(w)[i] // the piece as written, where it is from, and why it is here: nothing else
  backEl.textContent = ''; backEl.classList.toggle('on', !!s.href)
  if (s.t === 'lines') { const q = document.createElement('span'); q.className = 'lines'; s.lines.forEach(l => q.append(Object.assign(document.createElement('span'), { textContent: l }))); backEl.append(q) }
  else backEl.append(Object.assign(document.createElement('span'), { className: s.t === 'say' ? 'say' : 'named', textContent: s.big }))
  const src = document.createElement('small'); src.className = 'src'
  if (s.href) src.append(Object.assign(document.createElement('a'), { href: s.href, textContent: s.small })); else src.textContent = s.small
  backEl.append(src)
  if (p && typeof p.basis === 'string') backEl.append(Object.assign(document.createElement('small'), { className: 'basis', textContent: p.basis }))
  placeWin(w, i); toneWin(false)
  FX.win = { w, i, t0: performance.now(), fact: { kind: s.t } } }
/* the ground under a yield, read off the stone where it sits: the brightest of the pixels behind its words (all but the last few in a
   thousand) is what each of its texts, in its own colour and strength, must read against at AA; the ground darkens only as far as that
   needs, so over a dark facet there is none. Where the words sit is placeWin's; this only sets their ground, and steps the date or the
   six names back while the words lie over them */
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, lumOfRGB = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
const ratio = (a, b) => { const x = lumOfRGB(a), y = lumOfRGB(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) }
const blend = (top, a, bot) => [0, 1, 2].map(j => top[j] * a + bot[j] * (1 - a))
const rgbOf = s => { const v = (/rgba?\(([^)]+)\)/.exec(s) || [, '0 0 0'])[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] }
const GROUND = [13, 12, 11], INK = [243, 239, 230] // --ink-seam, the stone's own dark; --ink-on, the poem's
function groundFor(r, x, inks, quant = num('yield-quantile', .998), mask = null) { // how dark a ground under rect r (screen px) must be for every ink [colour, strength] to read at AA over what canvas x (the screen's size, at DPR) holds there:
  // against all but the brightest few in a thousand of its pixels (a yield's box), or against the brightest (quant 1: a label, a poem line, whose words can sit on it); mask: pixels to leave out (the seams)
  const k = x.canvas.width / W, x0 = Math.max(0, Math.floor(r[0] * k)), y0 = Math.max(0, Math.floor(r[1] * k)), x1 = Math.min(x.canvas.width, Math.ceil((r[0] + r[2]) * k)), y1 = Math.min(x.canvas.height, Math.ceil((r[1] + r[3]) * k))
  if (x1 <= x0 || y1 <= y0 || !inks.length) return 0
  const px = x.getImageData(x0, y0, x1 - x0, y1 - y0).data, mk = mask && mask.getImageData(x0, y0, x1 - x0, y1 - y0).data, L = []
  for (let j = 0; j < px.length; j += 4) if (!mk || mk[j] > 127) L.push([lumOfRGB([px[j], px[j + 1], px[j + 2]]), j])
  if (!L.length) return 0
  L.sort((p, q) => p[0] - q[0]); const at = L[Math.min(L.length - 1, Math.floor(L.length * quant))][1], bg = [px[at], px[at + 1], px[at + 2]]
  const reads = a0 => { const b = blend(GROUND, a0, bg); return inks.every(([c, op]) => ratio(blend(c, op, b), b) >= num('yield-aa', 4.8)) }
  let a = 0; const max = num('yield-scrim-max', .9); while (a < max && !reads(a)) a = Math.min(max, a + .02); return a }
function inksOf(el, upTo) { // each text under el that shows, in its own colour and the strength its ancestors leave it (up to upTo)
  return [...el.querySelectorAll('*'), el].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && e.getClientRects().length).map(e => { const c = rgbOf(getComputedStyle(e).color); let op = c[3]; for (let q = e; q && q !== upTo; q = q.parentElement) op *= +getComputedStyle(q).opacity; return [c, op] }).filter(([, op]) => op > .05) }
const rectArr = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height] }
const unionRect = e => { let [l, t, w0, h0] = rectArr(e), r = l + w0, b = t + h0; for (const c of e.querySelectorAll('*')) { const q = c.getBoundingClientRect(); if (!q.width) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom) } return [l, t, r - l, b - t] } // a label and everything in it, even what runs past its box
/* the labels that lie on the stone (the caption, the date, the six names, the name with the where line and the way out, the version tab):
   each gets the same ground as a yield, read off the stone where it sits; again as the lamp walks */
const LABELS = ['#cap', '#year', '#names', 'header', '.vs']
function groundLabels() { if (!cur) return
  for (const q of LABELS) { const e = $(q); if (!e) continue; const shown = !/^#(names|year)$/.test(q) || e.classList.contains('on'), inks = shown ? inksOf(e, e) : [], r = unionRect(e)
    e.style.setProperty('--scrim', (r[2] > 0 && inks.length ? groundFor(r, g, inks, 1) : 0).toFixed(2)) } }
let groundT = 0
function groundLines(w, snap) { // the stone drawn bare (no words, no grounds) and each line's need read off it: what the lamp does to a facet is counted
  if (!w || !w.lc || !w.v) return; const st = w.v.scrollTop, [rx, ry] = w.R
  w.bare = 'raw'; composite(w); ledger = { t: null, list: [] }; clear(); drawWorld(w)
  const faces = seamMask() // a seam's stroke is drawn over the words, so no word reads there: the line's need is read off the facets' faces
  const max = num('yield-scrim-max', .9), at = L => [rx + L.u[0], ry + L.u[1] - st, L.u[2], L.u[3]]
  for (const L of w.lc) if (L.u) L.gt = Math.min(max, groundFor(at(L), g, [[INK, 1]], 1, faces) / edge())
  /* the lamp lies over the grounds too and lifts them, so each is read again with the grounds laid (words still off): a line still short
     gets the more it needs, a few rounds at most */
  const was = w.lc.map(L => L.ga)
  for (let k = 0; k < num('line-rounds', 3); k++) { w.lc.forEach(L => { L.ga = L.gt }); w.bare = true; composite(w); ledger = { t: null, list: [] }; clear(); drawWorld(w); const f2 = seamMask(); let short = 0
    for (const L of w.lc) if (L.u && L.gt < max) { const more = groundFor(at(L), g, [[INK, 1]], 1, f2) / edge(); if (more > .005) { short++; L.gt = Math.min(max, 1 - (1 - L.gt) * (1 - more)) } }
    if (!short) break }
  w.lc.forEach((L, i) => { L.ga = snap ? L.gt : was[i] })
  w.bare = false; composite(w); ledger = { t: null, list: [] }; clear() }
let maskC = null
function seamMask() { // white where a facet's face is drawn this frame, black within seam-band-px of its edge (from the ledger)
  const c = maskC ||= document.createElement('canvas'); if (c.width !== cv.width || c.height !== cv.height) { c.width = cv.width; c.height = cv.height }
  const x = c.getContext('2d', { willReadFrequently: true }); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); x.setTransform(DPR, 0, 0, DPR, 0, 0)
  const path = Q => { x.beginPath(); Q.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath() }
  x.fillStyle = '#fff'; for (const e of ledger.list) if (e.Q && e.seen > .5) { path(e.Q); x.fill() }
  x.strokeStyle = '#000'; x.lineWidth = num('seam-band-px', 3.5) * 2; x.lineJoin = 'round'; for (const e of ledger.list) if (e.Q && e.seen > .5) { path(e.Q); x.stroke() }
  return x }
/* how strong a line's ground still is at its words' edge: it reaches the feather past them and is blurred over half the feather, and a facet can draw it
   (with the words) up to REACH * refract-px off, so at worst the edge lies (feather - that) / (feather / 2) sigma inside the ground's own edge */
const phi = z => { const t = 1 / (1 + .3275911 * Math.abs(z) / Math.SQRT2), e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-z * z / 2); return .5 * (1 + Math.sign(z) * e) }
const edge = () => { const f = num('line-feather-px', 8); return phi((f - refr() * REACH) / (f / 2)) }
function toneWin(raise) {
  const r = backEl.getBoundingClientRect()
  let a = groundFor([r.left, r.top, r.width, r.height], g, inksOf(backEl, backEl))
  if (raise) a = Math.max(a, +backEl.style.getPropertyValue('--scrim') || 0)
  backEl.style.setProperty('--scrim', a.toFixed(2))
  const over = (box, q) => { if (!box.classList.contains('on')) return false; const b = q.getBoundingClientRect(); return b.width > 0 && r.left < b.right + 6 && r.right > b.left - 6 && r.top < b.bottom + 6 && r.bottom > b.top - 6 }
  document.body.classList.toggle('yield-over-year', over(yearEl, yearA)); document.body.classList.toggle('yield-over-names', over(namesEl, namesEl)) }
function placeWin(w, i) { // its words go where they are clear of the poem, the name and the caption, whatever their length: near the facet first,
  // then wider, then smaller, and at the last the largest clear band holds them, scrolling inside it; never over the poem
  const [x0, , x1] = bbox(w.cells[i]), c = w.cents[i], wide = low() ? Math.min(W * .46, 400) : phone() ? W - 32 : Math.min(420, W * .4)
  const stops = [w.R, ...['#cap', '#mat', '.vs'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })]
  const hits = (l, t, ww, hh) => stops.some(o => l < o[0] + o[2] && l + ww > o[0] && t < o[1] + o[3] && t + hh > o[1])
  const xsFor = mw => [c[0], W * .5, W * .3, W * .25, W * .7].map(x => Math.max(mw / 2 + 12, Math.min(W - mw / 2 - 12, x)))
  backEl.classList.remove('tight'); Object.assign(backEl.style, { maxHeight: '', fontSize: '' })
  const mw0 = low() ? wide : Math.max(160, Math.min(phone() ? W - 48 : 320, Math.max(220, (x1 - x0) * 1.1)))
  for (const [mw, k] of [[mw0, 1], [wide, 1], [wide, .88], [wide, .76], [wide, .66]]) {
    backEl.style.fontSize = k === 1 ? '' : k * 1.0625 + 'rem'
    for (const x of xsFor(mw)) { Object.assign(backEl.style, { maxWidth: mw + 'px', width: 'max-content', left: x + 'px', top: c[1] + 'px' })
      const bw = backEl.offsetWidth, bh = backEl.offsetHeight, tries = [c[1]]; for (let d = 12; d < H; d += 12) tries.push(c[1] - d, c[1] + d)
      const y = tries.find(y => y - bh / 2 > 8 && y + bh / 2 < H - 8 && !hits(x - bw / 2 - 6, y - bh / 2 - 6, bw + 12, bh + 12)); if (y != null) { backEl.style.top = y + 'px'; return } } }
  // the last resort: the tallest clear band at full width, the words scrolling inside it
  let best = null
  for (const x of xsFor(wide)) { const l = x - wide / 2 - 6, ww = wide + 12, cuts = [8, H - 8, ...stops.filter(o => l < o[0] + o[2] && l + ww > o[0]).flatMap(o => [o[1], o[1] + o[3]])].sort((a, b) => a - b)
    for (let k = 0; k < cuts.length - 1; k++) { const t = cuts[k] + 6, bt = cuts[k + 1] - 6; if (bt - t > 24 && !hits(l, t, ww, bt - t) && (!best || bt - t > best[2])) best = [x, t, bt - t] } }
  if (!best) best = [W / 2, 8, Math.max(24, H * .2)]
  backEl.classList.add('tight'); Object.assign(backEl.style, { maxWidth: wide + 'px', left: best[0] + 'px', maxHeight: best[2] + 'px', top: best[1] + best[2] / 2 + 'px' })
}
function hideWin() { FX.win = null; FX.glimpse = null; backEl.style.opacity = 0; document.body.classList.remove('yield-over-year', 'yield-over-names') }
async function glimpse(w, i, st) { // another photograph or a film's still, seen through this one facet only; a photograph's answering region lies in it, the rest stays this photograph
  const p = photoBy(st.src) || { src: st.src, caption: '' }, [img] = await Promise.all([photo(p), st.src.startsWith('/photos/') ? regOf(st.src) : null]); if (cur !== w || !FX.win || FX.win.i !== i) return
  const R = REG[st.src], s = num('align-zoom', 1.5), [cx, cy] = w.cents[i]
  const r = st.cell != null && R && !st.whole ? S33Cut.cover(R, W, H).to((st.cell % 6 + .5) / 6, (Math.floor(st.cell / 6) + .5) / 4) : null
  const m = r ? [s, 0, 0, s, cx - s * Math.max(cx / s, Math.min(W - (W - cx) / s, r[0])), cy - s * Math.max(cy / s, Math.min(H - (H - cy) / s, r[1]))] : [1, 0, 0, 1, 0, 0]
  FX.glimpse = { w, i, img, m, src: st.src, t0: FX.win.t0 } }

const pairTo = to => ({ poem: poemBy(to.poem), photo: photoBy(to.photo) })
async function facetTap(i) {
  const w0 = cur; if (!w0) return
  if (!planOf(w0)[i] && !SEG) { await segReady(); if (cur !== w0) return }
  const w = cur, p = planOf(w)[i]; if (!p) return
  if (p.kind === 'tools') { pulse(i, .8, 500); track('tools_open', { idea: IDEAS[0].name, via: 'facet' }); return openTools(0) } // the facet itself opens the first idea; its names open their own
  if (p.kind === 'title') { pulse(i, .8, 500); said(i, 'title', { href: p.href }); track('poem_open', { poem: w.poem.slug, via: 'facet' }); if (!HOME.dry) location.href = p.href; return } // the title's facet: the whole poem
  if (p.kind === 'year') { pulse(i, .8, 500); said(i, 'year', { taken: p.rec.taken }); return yearsOut('facet') } // the photograph's date: into its year in the About
  const s = nextStep(w, i), depth = depthOf(w, i); deepen(w, i)
  if (s.t !== 'move') { showWin(i, s); if (s.t === 'glimpse') glimpse(w, i, s); pulse(i, .8, 500); return said(i, s.t, { depth, key: S37.stepKey(s), text: s.big || s.lines.join(' / ') }) }
  said(i, 'move', { depth, to: s.to.poem + '~' + s.to.photo.replace('/photos/', ''), key: S37.stepKey(s) }); pulse(i, 1, 500); if (HOME.dry) return
  return cross({ to: pairTo(s.to), word: null, phrase: null }, w.cents[i], i) }

/* the response to a hand stays small and keeps the photograph: a lift under the pointer, a sink under a press, a breath after each arrival */
function liftOf(w, i, now) { let t = 0
  if (i === FX.hover) t = num('hover-lift', 1)
  if (i === FX.press) t = -1
  if (w.breath0 && !reduce() && !HOME.still) { const st = Math.hypot(w.cents[i][0] - w.cents[0][0], w.cents[i][1] - w.cents[0][1]) / Math.max(W, H), u = (now - w.breath0 - st * num('breath-ms', 1400)) / 520
    if (u > 0 && u < 1) t = Math.max(t, Math.sin(u * Math.PI) * num('breath', .8)); if (now - w.breath0 > num('breath-ms', 1400) * 1.5 + 600) w.breath0 = 0 }
  for (const p of FX.pulses) if (p.i === i) { const u = (now - p.t0) / p.ms; if (u > 0 && u < 1) t = Math.max(t, Math.sin(u * Math.PI) * p.amp) }
  if (FX.win && FX.win.w === w && FX.win.i === i) t = Math.max(t, .5)
  return t }
function fxOf(w, i) { const lv = w.lv ? w.lv[i] : 0, c = w.cents[i], o = { glow: .05 * Math.max(0, lv), shade: .1 * Math.max(0, -lv) }, s = 1 + .018 * lv
  if (s !== 1) o.m = about(c, sc(s))
  return o }
function winFrame(now) { const v = FX.win; if (!v) return
  if (v.w !== cur) return hideWin()
  const u = now - v.t0, ms = num('win-hold-ms', 3600), e = reduce() ? (u < ms ? 1 : 0) : Math.min(ss(0, 260, u), 1 - ss(ms - 500, ms, u))
  backEl.style.opacity = e; if (u > ms) return hideWin()
  if (!v.toned && u > num('yield-retone-ms', 450)) { v.toned = true; toneWin(true) } } // the facet under it has lifted, and any other photograph has come into it: its ground read again

/* ---------- state ---------- */
let cur = null, busy = false, pressing = null, crossing = null, homeWin = -1
const at = s => { document.body.dataset.at = s }
function show(w) { cur = w; cap.textContent = w.photo.caption || ''; document.body.dataset.poem = w.poem.slug; document.body.dataset.photo = w.photo.src; closeTools(); showNames(w); showYear(w)
  groundT = 0 } // the labels' grounds are read again on the first frames this stone is drawn
const live = () => [cur, pressing && pressing.next, crossing && crossing.next].filter(Boolean)

/* pressing in (20 d): the stone gives under the finger, its seams open onto the world beneath; let go early and it comes back */
function pressPose(p, d, gv) { const W0 = W, H0 = H, m = Math.min(W0, H0), sink = num('press-sink', .16), push = num('press-push-px', 28)
  return p.old.cells.map((P, i) => { const c = p.old.cents[i], dx = c[0] - p.pt[0], dy = c[1] - p.pt[1], dist = Math.hypot(dx, dy) || 1, fall = Math.exp(-dist / (m * .55)), off = push * d * (.35 + fall)
    return { m: mul(tr(dx / dist * off, dy / dist * off), about(c, sc((1 - sink * d * (.4 + fall)) * (1 - .45 * gv)))), shade: .42 * d * fall, alpha: 1 - Math.min(1, gv * (1.4 - fall * .6)) } }) }
let pressGo = null
async function pressStart(pt) {
  if (busy || !cur || cur.mode !== 'home') return
  const hd = doorAt(pt[0], pt[1], cur, true), ci = facetAt(pt[0], pt[1])
  if (!hd && ci >= 0 && !SEG && !planOf(cur)[ci]) await segReady() // the first second: the facets' pieces are still on their way
  if (busy || !cur || cur.mode !== 'home') return
  const pl = ci >= 0 ? planOf(cur)[ci] : null
  let to, word = null
  if (hd) { to = hd.to; word = hd.word } // a door line: its door
  else if (pl && nextStep(cur, ci).t !== 'move') { homeWin = ci; FX.press = ci; return } // a yield: it says its piece on the way up
  else if (pl) { const st = nextStep(cur, ci), depth = depthOf(cur, ci); deepen(cur, ci); to = pairTo(st.to); said(ci, 'move', { depth, to: keyOf(to), key: S37.stepKey(st) }) } // its move: where that facet goes
  else { let best = cur.doors[0], bd = Infinity // elsewhere: the world behind the door line nearest the finger
    for (const d of cur.doors) { const b = d.el.getBoundingClientRect(), dd = Math.hypot(b.left + b.width / 2 - pt[0], b.top + b.height / 2 - pt[1]); if (dd < bd) { bd = dd; best = d } }
    to = best ? best.to : cur.fallback; word = best ? best.word : null }
  busy = true; at('entering'); HOME.expect = keyOf(to); HOME.word = word
  const p = pressing = { old: cur, pt, d: 0, gv: 0, t0: performance.now(), held: true, next: null }
  p.ready = makeWorld({ ...to, word, from: { phrase: hd ? hd.phrase : null, title: cur.poem.title }, via: 'press' }, 'world', cur.trail).then(w => { p.next = w; return w })
  if (reduce()) { const w = await p.ready; pressing = null; return calmTo(w) }
  const ms = num('press-ms', 1100)
  const step = () => { if (pressing !== p || !p.held) return; p.d = Math.min(1, (performance.now() - p.t0) / ms); if (p.d >= 1) giveWay(p); else requestAnimationFrame(step) }
  requestAnimationFrame(step) }
async function pressUp() {
  if (pressGo) await pressGo
  if (homeWin >= 0) { const i = homeWin; homeWin = -1; FX.press = -1; return facetTap(i) }
  const p = pressing; if (!p || !p.held) return; p.held = false
  if (performance.now() - p.t0 < num('press-tap-ms', 260)) { const from = p.d, ms = num('press-ms', 1100) * (1 - from), t0 = performance.now()
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
  hideWin(); FX.hover = FX.press = -1
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
  for (const w of [...live(), crossing && crossing.old].filter(Boolean)) { w.A.forEach((a, i) => { const b = a + (w.Tg[i] - a) * k; if (Math.abs(b - a) > .001) { w.A[i] = Math.abs(w.Tg[i] - b) < .004 ? w.Tg[i] : b; w.dirty = true } })
    if (w.lc) for (const L of w.lc) if (L.gt != null && Math.abs(L.gt - L.ga) > .002) { L.ga += (L.gt - L.ga) * k; w.dirty = true } // a line's ground follows the lamp, never jumps
    if (w.dirty) composite(w) }
  clear()
  const C = crossing
  if (pressing && pressing.d + pressing.gv > 0) { const p = pressing
    if (p.next) drawWorld(p.next)
    const pose = pressPose(p, io(p.d), p.gv)
    ledger = { t: null, list: [] }; p.old.cells.forEach((P, i) => note('h' + i, facet(P, p.old.cents[i], p.old.normals[i], [{ img: p.old.img }, ...textLayer(p.old, i, p.old.normals[i], P, 1 - p.d)], pose[i]), pose[i].m, pose[i].alpha)) }
  else if (C) crossFrame(C)
  else if (cur) { touchFrame(cur, now, dt); ledger = { t: null, list: [] }; drawWorld(cur); if (ends && !ends.after) ends.after = ledger.list
    if (!busy && (groundT++ === 2 || groundT % Math.max(30, Math.round(num('label-ms', 2000) / 16.7)) === 0)) { groundLines(cur); drawWorld(cur); groundLabels() } } // as the lamp walks, each ground follows what is under it
  winFrame(now)
  requestAnimationFrame(frame) }
function touchFrame(w, now, dt) {
  const k = 1 - Math.exp(-dt / 90); for (let i = 0; i < w.lv.length; i++) w.lv[i] += (liftOf(w, i, now) - w.lv[i]) * k
  FX.pulses = FX.pulses.filter(p => now - p.t0 < p.ms) }

/* ---------- input ---------- */
app.addEventListener('pointerdown', e => {
  if (whyOpen) { if (!e.target.closest('#why,#where')) closeWhy(); return } // 34: the stone around the panel closes it
  if (e.button > 0 || e.target.closest('header,a,button') || !cur || cur.mode !== 'home' || busy) return
  pressGo = pressStart([e.clientX, e.clientY]); try { app.setPointerCapture(e.pointerId) } catch {} })
app.addEventListener('pointerup', () => pressUp()); app.addEventListener('pointercancel', () => { homeWin = -1; FX.press = -1; pressUp() })
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
    const k = FX.hover >= 0 ? 'title' : null; if (cur.lit !== k) { cur.lit = k; cur.dirty = true } return } // at home the stone is pressed into; only the title's facet is taken
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
  get win() { return FX.win && { i: FX.win.i, text: backEl.textContent, kind: FX.win.fact.kind, opacity: +backEl.style.opacity } },
  get drawn() { return cur ? drawn(cur) : [] },
  segReady: () => segReady(), get dealt() { return !!SEG },
  plan(i) { const p = cur && planOf(cur)[i]; if (!p) return null
    if (p.kind === 'tools' || p.kind === 'year' || p.kind === 'title') return { kind: p.kind, id: p.id, basis: p.basis, facet: p.facet, box: p.box || null, at: p.at || null, taken: p.rec ? p.rec.taken : null, href: p.href || null }
    return { kind: p.kind, id: p.id, cls: p.cls, link: p.link, basis: p.basis, facet: p.facet, to: k2(p.to), poem: p.seg.poem || null, src: p.seg.img || null,
      steps: p.steps.map(st => ({ t: st.t, key: S37.stepKey(st), big: st.big || null, small: st.small || null, lines: st.lines || null, href: st.href || null, src: st.src || null, cell: st.cell ?? null, whole: !!st.whole, to: st.to ? k2(st.to) : null, poem: st.to ? st.to.poem : null })) } },
  get plans() { return cur ? planOf(cur).map((p, i) => p && this.plan(i)) : [] },
  get world0() { return cur && { photo: cur.photo.src, poem: cur.poem.slug, trail: cur.trail, doors: cur.doors.map(d => ({ phrase: d.phrase, word: d.word, line: d.line, to: keyOf(d.to) })), W, H } },
  get glimpse() { return FX.glimpse && { i: FX.glimpse.i, src: FX.glimpse.src } },
  probe(i, n, lines) { const w = cur; if (!w) return null; const txt = 'measured '.repeat(Math.ceil(n / 9)).slice(0, n) // the worst case, not today's words
    const st = lines ? { t: 'lines', lines: Array.from({ length: lines }, (_, k) => txt.slice(0, Math.max(12, n / lines | 0)) + k), small: txt.slice(0, 60) } : { t: 'say', big: txt, small: txt.slice(0, Math.min(140, n)) }
    showWin(i, st); const out = this.clash; hideWin(); return out },
  get clash() { if (!FX.win || !cur) return null; const b = backEl.getBoundingClientRect(), o = [cur.R, ...['#mat', '#cap'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })]; return b.top < 0 || b.left < 0 || b.bottom > H || b.right > W || o.some(([l, t, ww, hh]) => b.left < l + ww && b.right > l && b.top < t + hh && b.bottom > t) },
  depth(i) { return cur ? depthOf(cur, i) : 0 },
  // a yield as a tap leaves it, at full strength and with any glimpse arrived: what the check reads the words against
  async yieldAt(i, k) { const w = cur, p = w && planOf(w)[i], s = p && p.steps && p.steps[k]; if (!s || s.t === 'move') return null
    hideWin(); showWin(i, s); if (s.t === 'glimpse') await glimpse(w, i, s); if (!FX.win || cur !== w) return null
    FX.win.t0 = performance.now() - num('win-hold-ms', 3600) / 2; if (FX.glimpse) FX.glimpse.t0 = FX.win.t0; backEl.style.opacity = 1; this.draw()
    FX.win.toned = true; toneWin(true)
    return { i, k, t: s.t, text: backEl.textContent } },
  draw(o = {}) { if (!cur) return; if (!!o.bare !== !!cur.bare) { cur.bare = !!o.bare; composite(cur) } clear(); ledger = { t: null, list: [] }; drawWorld(cur) }, // bare: the poem's words left off, their grounds kept (what the check reads them against)
  groundLabels() { if (cur) { groundLines(cur, true); this.draw() } groundLabels() }, // read now and settled at once (the check's; the page eases them)
  hideWin() { hideWin() },
  tapPoint(i) { return cur ? touchAt(cur, i) : null },
  async rest() { // every facet, as drawn now, against this photograph and against the one it leads to: the closer must be this one (pixels, not code)
    const w = cur, P = planOf(w), st = g.getImageData(0, 0, cv.width, cv.height).data, own = w.img.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, other = {}
    const foreign = async p => { const src = p && p.to && photoBy(p.to.photo) ? p.to.photo : (w.doors[0] ? w.doors[0].to.photo.src : data.photos.find(q => q.src !== w.photo.src).src)
      return other[src] ||= (await photo(photoBy(src))).getContext('2d').getImageData(0, 0, cv.width, cv.height).data }
    const skip = [w.R && [w.R[0] - 30, w.R[1] - 20, w.R[2] + 60, w.R[3] + 40], ...['#mat', '#cap', '.vs', '#back', '#year', '#names'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left - 10, r.top - 10, r.width + 20, r.height + 20] })].filter(Boolean)
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
  // the tools facet, the facets that could have held it, and the surfaces it must keep clear of (40's)
  get state() { const w = cur; if (!w) return null; const pl = planOf(w), k = pl.findIndex(p => p && p.kind === 'tools'), y = pl.findIndex(p => p && p.kind === 'year'), stops = stopsOf(w), where = whereRect()
    const fs = facetsOf(w)
    return { at: document.body.dataset.at, tools: k, plan: k >= 0 ? { box: pl[k].box, basis: pl[k].basis } : null, where, poem: w.R, mat: rectOf('#mat'), cap: rectOf('#cap'), vs: rectOf('.vs'),
      names: rectOf('#names'), namesAll: (() => { const r = namesEl.getBoundingClientRect(); let x1 = r.right, y1 = r.bottom; for (const b of namesEl.children) { const q = b.getBoundingClientRect(); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom) } return [r.left, r.top, x1 - r.left, y1 - r.top] })(), namesOn: namesEl.classList.contains('on'), cells: w.cells.map(P => P.map(([x, y0]) => [+x.toFixed(2), +y0.toFixed(2)])), drawn: drawn(w),
      fits: fs.map(f => ({ i: f.i, box: k >= 0 ? fitIn(w, f.i, stops, where) : null })),
      title: w.titleI, titleAt: titleAt(w, w.toolsI), titleRects: [...w.v.querySelectorAll('h2 a')].flatMap(a => [...a.getClientRects()].map(r => [r.left, r.top, r.width, r.height])), titlePlan: w.titleI >= 0 ? pl[w.titleI] && { href: pl[w.titleI].href, basis: pl[w.titleI].basis } : null, titleHref: (w.v.querySelector('h2 a') || {}).href || null, titleRow: (h => h ? [h.getBoundingClientRect().left, h.getBoundingClientRect().right] : null)(w.v.querySelector('h2')), piece: w.drewPiece || null, titleUnder: !!w.drewTitleUnder,
      year: y, yearPlan: y >= 0 ? { at: pl[y].at, box: pl[y].box, basis: pl[y].basis } : null, yearBox: rectOf('#year a'), yearOn: yearEl.classList.contains('on'), yearText: yearA.textContent,
      kinds: pl.map(p => p ? p.kind : null), W, H } },
  get open() { return toolsOpen }, ideas: IDEAS,
  async plant(key, trail = []) { // a world made exactly as a visit or a crossing makes it (fresh: no trail; crossed: the trail it came by), off screen, its tools facet read, then let go
    const pair = pairOf(key); if (!pair) return null; const w = await makeWorld(pair, 'world', trail), { tools } = fixedOf(w)
    const out = { key: w.key, tools: w.toolsI, cutT: w.cutT, box: tools ? tools.box : null, basis: tools ? tools.basis : null, cells: w.cells.map(P => P.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)])), drawn: drawn(w),
      poem: w.R, mat: rectOf('#mat'), cap: capFor(w), vs: rectOf('.vs'), where: whereRect(), W, H, scroll: w.v.classList.contains('scroll'),
      half: (() => { const R = w.v.getBoundingClientRect(); return [...w.v.querySelectorAll(':scope > h2, :scope > .l')].filter(k => { const r = k.getBoundingClientRect(); return r.top < R.bottom - 1 && r.bottom > R.bottom + 1 }).length })() } // lines the poem's box cuts through
    drop(w); return out },
  // 35's line and 36 c's join with 34's chain
  get phase() { return FS.line ? FS.line.phase : 'none' }, get whyOpen() { return whyOpen }, get model() { return whyModel }, whyReady: () => whyReady(), how: ctx.how, openWhy, closeWhy, join, JN,
  get first() { return JSON.parse(JSON.stringify({ line: FS.line })) },
  get line() { const L = LN.L; return L ? { out: tokEls().map(x => x.classList.contains('out')), on: L.se.classList.contains('on'), sentence: L.se.textContent,
    ops: tokEls().map(x => +getComputedStyle(x).opacity), sop: +getComputedStyle(L.se).opacity } : null },
  // the year facet's flight
  yearsOut, yearsBack, get about() { return aboutF && { src: aboutF.getAttribute('src'), lift: !!lift, at: document.body.dataset.at, row: lift ? lift.closest('.yr').dataset.y : null } } }
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
setTimeout(() => whyReady(), num('why-idle-ms', 4000))
