#!/usr/bin/env node
// Study 42 check: what an idea's facet opens. Placement is 41 b's (each idea behind the facet its meaning puts it on, nothing named at
// rest); what opens is this world first and largest, the general beneath, and the one quiet basis line. Its own readers, kept apart from
// the page: every fact in every this-world sentence is gathered here in node from the committed files (and, for the moment, the pinned
// clock and sky and the time the page's own cache says the sky was read), written here by this file's own words, and compared word for word.
//   static: six ideas; the page copies none of IDEAS' words; no instruction text; every dial in defaults.json is read; way b of 41 has a
//           reason for every idea; the always-on names are gone
//   texts:  every world (all 77 photographs x two poems, 154, plus today's pair): the six ideas' sentences, as the page writes them, equal
//           the recount here; none names a private channel or the system, none holds a capitalised word the data does not account for
//   sweep (SWEEP=0 skips it): every world at 390x844, 375x667, 430x932, 844x390, 1440x900, fresh and crossed: six ideas behind six distinct
//           legal facets, as 41 b's rule says, recounted, each basis line word for word and with no pixel count
//   live, at those five screens, every way, on today's pair, Rainier ("An Ode to Aspens") and Provincetown ("Large objects exert a
//           gravitational pull"): no idea's name on screen at rest; six washes; each facet opens its own idea with THIS world's sentences
//           first and largest (a, c) or braided after the general sentence each answers (b); the general read live from IDEAS (the served
//           home.js carries an invisible mark in every intro and boundary, which a copy would lack); c lays the general only on the second
//           tap; whole lines at the panel's edge; on screen; clear of the poem, the name and the switch; WCAG AA against the real pixels.
// Run: node studies/42/check.mjs   (ONLY_VP=390x844,... · WAYS=a,b · SWEEP=0 · MUTATE=swap|copy|names to watch it go red)
// Screenshots: studies/42/shots/ (gitignored).
import { spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, createReadStream, rmSync, mkdtempSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const SCREENS = [[390, 844, true], [375, 667, true], [430, 932, true], [844, 390, true], [1440, 900, false]]
const VPS = SCREENS.filter(([w, h]) => !process.env.ONLY_VP || process.env.ONLY_VP.split(',').includes(w + 'x' + h))
let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
const read = f => readFileSync(path.join(ROOT, f), 'utf8')

/* ---------- IDEAS, read here on its own; the served copy carries a mark (U+200B) at the start of every intro and boundary ---------- */
const MARK = '​'
function literal(src, name) { const at = src.indexOf('var ' + name + ' = '); const s0 = at + ('var ' + name + ' = ').length; let depth = 0, q = null
  for (let i = s0; i < src.length; i++) { const c = src[i]
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue } if (c === "'" || c === '"') { q = c; continue }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue }
    if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return vm.runInNewContext('(' + src.slice(s0, i + 1) + ')') } }
const HOMEJS = read('v2/home.js'), HOMEJS_SERVED = HOMEJS.replace(/("intro": ")|("boundary": ")/g, m => m + MARK)
const IDEAS0 = literal(HOMEJS, 'IDEAS'), IDEAS = literal(HOMEJS_SERVED, 'IDEAS')
const NAMES = IDEAS.map(I => I.name)
const WORDS = new Set(IDEAS0.flatMap(I => [I.name, ...I.parts, I.detail.intro, ...I.detail.tools, I.detail.boundary]))
const BANNED = /day[\s-]?flow/i // the system's working name (tools/test_wall.mjs, Kahran 2026-10-27)
// 27's PRIVATE guard, widened for this copy: no private channel, no internal name, no private place
const PRIVATE = /raw\W?(db|store)|day[\s-]?flow|e-?mail|voice note|whatsapp|message|granola|hermes|kmini|\bthe mini\b|sync\/|pending-work|\.txt\b|~\//i
const WAYS = (process.env.WAYS || 'a,b,c').split(',')

/* ---------- static ---------- */
const page = read('studies/42/index.html'), stone = read('studies/42/stone.js'), hereJs = read('studies/42/here.js'), defaults = JSON.parse(read('studies/42/defaults.json'))
check(IDEAS.length === 6 && IDEAS.every(I => I.parts.length === I.detail.tools.length), 'six ideas, every tool with its sentence', IDEAS.map(I => I.name + ' ' + I.parts.length).join(', '))
{ const copied = [...WORDS].filter(t => t.length > 24 && [page, stone, hereJs, JSON.stringify(defaults)].some(f => f.includes(t)))
  check(!copied.length, 'the page reads IDEAS live and copies none of its words', copied.slice(0, 2).join(' | ')) }
{ const body = /<body>([\s\S]*?)<noscript>/.exec(page)[1].replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  check(body === 'kahran singh about photos poems × v3 v2 v1', 'no instruction text: the page\'s own words are the name, the way out, the close and the switch', body) }
{ const src = page + '\n' + stone + '\n' + hereJs, unread = Object.keys(defaults).filter(k => !new RegExp(`['"\`]${k}['"\`]`).test(src) && !src.includes(`var(--${k}`))
  const css = [...src.matchAll(/var\(--([a-z0-9-]+),\s*([^)]+)\)/g)].filter(m => m[1] in defaults && Number(m[2]) !== Number(defaults[m[1]]) && m[2] !== String(defaults[m[1]]))
  check(!unread.length && !css.length && ['a', 'b', 'c'].includes(defaults['ideas-way']), `every dial is read (${Object.keys(defaults).length}), CSS fallbacks equal defaults.json, the default way is one of the three (${defaults['ideas-way']})`, unread.concat(css.map(m => m[1])).join(', ')) }
{ const table = /const MEANING = \[([\s\S]*?)\]\]\n/.exec(stone)?.[1] || '', named = [...table.matchAll(/^\s*\['([^']+)'/gm)].map(m => m[1])
  check(NAMES.every(n => named.includes(n)) && named.every(n => NAMES.includes(n)) && named.length === 6, '41 b states a reason for every idea in IDEAS, and for nothing else', `table: ${named.join(', ')}`) }
check(!/id="names"/.test(page) && !/namesEl|#names/.test(stone), 'the always-on names are gone: no #names, nothing draws them')
check(!/\$\{px\(|' px'|" px"/.test(stone), 'no basis line carries a pixel count')

/* ---------- the moment, pinned: 8:40 pm New York, 9 Nov 2026, and the sky (as 37, 40 and 41 pin them) ---------- */
const PIN = Date.UTC(2026, 10, 10, 1, 40), ISO = '2026-11-09'
const SKY = { timezone: 'America/New_York', current: { cloud_cover: 40, wind_speed_10m: 14, precipitation: 0, rain: 0, showers: 0, snowfall: 0, temperature_2m: 11, is_day: 0, weather_code: 2 }, daily: { sunrise: ['2026-11-09T06:36'], sunset: ['2026-11-09T16:43'] } }

/* ---------- this world's facts, gathered here from the committed files ---------- */
const DATA = JSON.parse(read('v2/data.json')), XJ = JSON.parse(read('v3/crossings.json')), DAYS = JSON.parse(read('v2/days.json')).days
const PY = JSON.parse(read('studies/27/poem-years.json')), PLACE = JSON.parse(read('v2/place.json'))
const PS = JSON.parse(read('v2/scores-photos.json')), QS = JSON.parse(read('v2/scores-poems.json'))
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const REL = (() => { const ctx = { window: { location: { pathname: '/' } }, document: { createElement: () => ({}), head: { appendChild() {} }, querySelector: () => null } }
  const R = read('poems/related.js'); vm.runInNewContext(R.slice(0, R.indexOf('\n(function', R.indexOf('const themeLabels'))) + '\n;globalThis.__P = poemData; globalThis.__L = themeLabels', ctx); return { P: ctx.__P, L: ctx.__L } })() // its two tables, without the page's own work
const PHRASE = (() => { const c = {}; vm.runInNewContext(/function phraseFor[\s\S]*?\n {2}\}/.exec(read('v2/weather.js'))[0] + ';globalThis.f = phraseFor', c); return c.f })()
const STEP = (() => { const w = {}; vm.runInNewContext(read('v3/why.js'), { window: w, fetch: () => {}, document: {} }); return w.S34.stepOf })()
const PK = (() => { const w = {}; vm.runInNewContext(read('v2/pick.js'), { window: w, Math, Date, console }); return w.kahranPick })()
const WALL = JSON.parse(read('tools/wall-map.json')), FREEZE = /Each night at (\d{1,2}:\d\d)/.exec(read('tools/daily_pick.py'))[1]
const READING = { place: PLACE.place, lat: PLACE.lat, lon: PLACE.lon, tz: SKY.timezone, away: !!PLACE.away, ...SKY.current, sunrise: SKY.daily.sunrise[0], sunset: SKY.daily.sunset[0] }
const T0 = PK.__test; T0.setScores(QS, PS); PK.setData(DATA); PK.setDays({ days: DAYS })
const PICKSRC = read('v2/pick.js'), NOV = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(PICKSRC), PEN = +/NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(PICKSRC)[1]
const NEAR = +/PLACE_BONUS_NEAR\s*=\s*([\d.]+)/.exec(PICKSRC)[1], NEARKM = +/PLACE_BONUS_NEAR_KM\s*=\s*(\d+)/.exec(PICKSRC)[1], FARKM = +/PLACE_BONUS_FAR_KM\s*=\s*(\d+)/.exec(PICKSRC)[1]
const shiftISO = (iso, d) => new Date(Date.parse(iso + 'T00:00:00Z') + d * 864e5).toISOString().slice(0, 10)
const realDays = Object.keys(DAYS).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort()
function rankAll() { // pick.js's own formula, run here: closeness by its weights, the place lift, the novelty penalty, the date's tiebreak
  const day = T0.dayVectorFromCurrent(ISO, READING, READING.lat)
  const rk = (kind, items, kf, scores, win) => { const cut = shiftISO(ISO, -win), recent = new Set(realDays.filter(d => d >= cut && d < ISO).map(d => DAYS[d][kind]))
    return items.map((it, i) => { const key = it[kf], v = T0.itemVector(scores, key), dist = T0.weightedDistance(day, v), e = kind === 'photo' ? (scores.photos[key] || {}) : null
      const bonus = e ? T0.placeBonus(e.place, READING.lat, READING.lon) : 0, km = e && e.place && e.place.lat != null ? T0.haversineKm(READING.lat, READING.lon, e.place.lat, e.place.lon) : null
      return { i, key, it, bonus, km, score: -dist + bonus + (recent.has(key) ? PEN : 0) + T0.tiebreak(ISO, key) } }).sort((a, b) => b.score - a.score || a.i - b.i).map((x, r) => ({ ...x, rank: r + 1 })) }
  return { day, photos: rk('photo', DATA.photos, 'src', PS, +NOV[2]), poems: rk('poem', DATA.poems, 'slug', QS, +NOV[1]) } }
const RANK = rankAll()
const dayW = iso => +iso.slice(8, 10) + ' ' + MON[+iso.slice(5, 7) - 1]
const ordN = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th')
const andL = L => L.length < 2 ? L.join('') : L.slice(0, -1).join(', ') + ' and ' + L[L.length - 1]
const datesL = L => L.length <= 2 ? andL(L.map(dayW)) : `${L.length} days, last ${dayW(L[L.length - 1])}`
const clockOf = at => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: READING.tz }).format(new Date(at)).replace(/\s+/g, ' ').replace(/ ([AP])M$/, (_, x) => ' ' + x.toLowerCase() + 'm')
const pickedNode = () => { const root = { kahranWeather: { current: READING } }; const w = {}; vm.runInNewContext(read('v2/pick.js'), { window: w, Math, Date, console })
  w.kahranPick.__test.setScores(QS, PS); w.kahranPick.setData(DATA); w.kahranPick.setDays({ days: DAYS }); w.kahranWeather = root.kahranWeather; return w.kahranPick.pickFor(ISO, true) }
const PICKED = pickedNode()
check(PICKED && PICKED.photo === RANK.photos[0].key && PICKED.poem === RANK.poems[0].key, `pick.js's own pickFor and the recount here agree on today's pair (${PICKED && PICKED.poem}, ${PICKED && PICKED.photo})`)

/* every sentence of every idea for one world, written here (the page's here.js writes its own; they must agree word for word) */
function expected(src, slug, mode, readAt) {
  const photo = DATA.photos.find(p => p.src === src), poem = DATA.poems.find(p => p.slug === slug), rec = XJ.photos.find(p => p.src === src)
  const place = rec.place, [, camera] = photo.caption.split(' — '), month = MON[+rec.taken.slice(5, 7) - 1], year = +rec.taken.slice(0, 4)
  const T = `“${poem.title}”`, py = PY.poems[slug], night = READING.is_day === 0, Now = night ? 'Tonight' : 'Today', now = night ? 'tonight' : 'today'
  const phrase = PHRASE(READING.weather_code, READING.is_day !== 0), temp = Math.round(READING.temperature_2m), P = RANK.photos.find(x => x.key === src), Q = RANK.poems.find(x => x.key === slug)
  const km = P.km != null ? Math.round(P.km) : null, comma = /,/.test(place) ? ',' : ''
  const out = {}
  out['Context'] = [[`This photograph was made at ${place}${comma} in ${month} ${year}, on a ${camera}; ${T} ${py ? `was written by ${py.year}` : 'carries no year the record can prove'}.`, 'boundary'],
    [`${Now} he is in ${READING.place}${km != null ? `, ${km.toLocaleString('en-US')} km from where it was taken,` : ''} and ${phrase} at ${temp} °C.`, 'Where I am']]
  const [l, wa, we, st, se] = ['light', 'warmth', 'wet', 'stillness', 'season'].map(a => STEP(a, RANK.day[a])), season = /half$/.test(se) ? se + ' of the year' : se === 'between' ? 'between seasons' : se
  const lift = P.bonus ? `, lifted ${P.bonus.toFixed(2)} for lying within ${P.bonus === NEAR ? NEARKM : FARKM} km of him` : ''
  const gap = g => g < .005 ? 'less than a hundredth' : g.toFixed(2), pickRec = XJ.photos.find(p => p.src === RANK.photos[0].key)
  const th = REL.P[slug], labels = th.themes.map(t => REL.L[t] || t), kin = Object.entries(REL.P).filter(([s, e]) => s !== slug && e.themes.some(t => th.themes.includes(t))).length
  out['Topically suggesting'] = [`${Now}’s sky over ${READING.place}, ${phrase.replace(/^(it's|there's) /, '')} at ${temp} °C, read as ${l}, ${wa}, ${we} and ${st}, ${season}.`,
    mode === 'home' ? `Of ${DATA.poems.length} poems ${T} came first, ${gap(RANK.poems[0].score - RANK.poems[1].score)} ahead of “${RANK.poems[1].it.title}”; of ${DATA.photos.length} photographs this one came first by ${gap(RANK.photos[0].score - RANK.photos[1].score)}${lift}.`
      : `Weighed against it, ${T} stands ${ordN(Q.rank)} of ${DATA.poems.length} poems and this photograph ${ordN(P.rank)} of ${DATA.photos.length}${lift}; the home’s own pair ${now} is ${RANK.photos[0].key === src ? 'this photograph' : pickRec.place} with ${RANK.poems[0].key === slug ? 'this poem' : `“${RANK.poems[0].it.title}”`}.`,
    `On its own page, three neighbours are drawn at random from the ${kin} other poems that share ${labels.length > 1 ? `one of its themes, ${andL(labels)}` : `its theme, ${labels[0]}`}.`].map(s => [s, 'intro'])
  const sameMonth = XJ.photos.filter(p => p.taken.slice(0, 7) === rec.taken.slice(0, 7)).length
  const ps = realDays.filter(d => DAYS[d].photo === src), qs = realDays.filter(d => DAYS[d].poem === slug)
  const shown = !ps.length && !qs.length ? 'neither has yet stood on the home' : ps.length && qs.length ? `this photograph stood on the home on ${datesL(ps)}, ${T} on ${datesL(qs)}` : ps.length ? `this photograph stood on the home on ${datesL(ps)}` : `${T} stood on the home on ${datesL(qs)}`
  const hasToday = !!DAYS[ISO]
  out['Keeping track'] = [`${T} is one of the ${py ? Object.values(PY.poems).filter(e => e.year === py.year).length + ' poems the record dates to ' + py.year : Object.keys(PY.undated).length + ' poems the record cannot yet date'}; this photograph, from ${month} ${year}, ${sameMonth > 1 ? `is one of ${sameMonth} made that month` : 'is the only one made that month'}, and it stands in the About under ${rec.row}.`,
    `The archive has kept ${realDays.length} days since ${dayW(realDays[0])}; ${shown}, and ${hasToday ? 'today’s pair is already in it' : `${now}’s pair joins it at day’s end`}.`].map(s => [s, 'intro'])
  out['Staying up to date'] = [`The sky over ${READING.place} was read at ${clockOf(readAt)}, against where he is as last written, on ${dayW(PLACE.updated)}.`,
    hasToday ? 'Today’s pair follows that reading; the archive already holds this day, and once it has passed it replays exactly as kept, never reshuffled.' : `Today’s pair follows that reading until ${FREEZE}, when it is frozen into the archive; from then on the day replays exactly as kept, never reshuffled.`].map(s => [s, 'intro'])
  const pubs = WALL.parts['This page'].filter(r => /publish/.test(r)).length // the two publishers, from the map of what runs behind each part
  if (pubs !== 2) throw new Error('This page no longer has two publishers in tools/wall-map.json: the Self-healing sentence must change')
  out['Self-healing'] = [['Two publishers stand behind this page, one writing where he is and one keeping each day’s pair, and both are among the lanes the self-healing checks watch.', 'Samwise'],
    [`Where he is was last written on ${dayW(PLACE.updated)}, and the last day the archive kept is ${dayW(realDays[realDays.length - 1])}.`, 'Samwise']]
  const Hm = IDEAS.find(I => I.name === 'Home'), at = Hm.parts.indexOf('This page'), dec = Math.max(...[PLACE.lat, PLACE.lon].map(v => (String(v).split('.')[1] || '').length))
  out['Home'] = [[`This page is the ${at === Hm.parts.length - 1 ? 'last' : ['first', 'second', 'third'][at]} of the ${['', 'one', 'two', 'three', 'four', 'five', 'six'][Hm.parts.length]} surfaces Home looks after, and ${now} it carries a photograph from ${place}${comma} and ${T} under ${READING.place}’s sky.`, 'This page'],
    [`The city under his name reaches it rounded to a ${{ 1: 'tenth', 2: 'hundredth', 3: 'thousandth' }[dec]} of a degree, and only when where he is is known with confidence; a weaker reading leaves the line unsaid.`, 'boundary']]
  for (const k of Object.keys(out)) out[k] = out[k].map(([s, at]) => ({ s, at }))
  return out }
// the words a sentence may hold in capitals: the data's own names (places, titles, cameras, months, the ideas and their tools) and a sentence's first word
const KNOWN = [...XJ.photos.map(p => p.place), ...DATA.poems.map(p => p.title), ...DATA.photos.map(p => p.caption.split(' — ')[1]).filter(Boolean), ...MON, ...NAMES, ...IDEAS.flatMap(I => I.parts), PLACE.place, 'About'].sort((a, b) => b.length - a.length)
const unaccounted = s => { let t = s; for (const k of KNOWN) t = t.split(k).join(' '); return [...t.matchAll(/(?<![.;:]\s|^)\b([A-Z][a-z’']+)/g)].map(m => m[1]) }

/* ---------- geometry, recounted here (41 b, the basis lines without pixel counts) ---------- */
const inPoly = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
const gapR = (a, b) => Math.hypot(Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2])), Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3])))
function reach(P, r) { if (inPoly([r[0] + r[2] / 2, r[1] + r[3] / 2], P)) return 0; let d = Infinity
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
    for (let s = 0; s <= n; s++) d = Math.min(d, gapR([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n, 0, 0], r)) } return d }
const seam = (P, Q) => P.filter(p => Q.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5)).length >= 2
const crossed = (r, cells, drawn) => { const out = new Set(); for (const b of r) { const p = [b[0] + b[2] / 2, b[1] + b[3] / 2]; for (const i of drawn) if (inPoly(p, cells[i])) out.add(i) } return out }
function recount(r) {
  const L = r.legal, C = r.cells, ct = r.cents, free = new Set(L), out = [], take = (name, i, basis) => { free.delete(i); out[NAMES.indexOf(name)] = { k: NAMES.indexOf(name), i, basis } }
  const nearest = rect => [...free].map(i => ({ i, d: reach(C[i], rect) })).sort((a, b) => a.d - b.d || a.i - b.i)[0]
  let x = nearest(r.where); take('Context', x.i, `nearest ‘${r.whereWords}’ · the place and the sky it states are what this idea gathers`)
  x = nearest(r.titleBox); take('Topically suggesting', x.i, `nearest the title, ‘${r.poemTitle}’ · today’s poem is the suggestion this moment made`)
  x = nearest(r.name); take('Home', x.i, 'nearest his name · this page is one of the things the home runs')
  { const Y = r.year >= 0 ? C[r.year] : null, yc = Y ? [ct[r.year][0], ct[r.year][1], 0, 0] : r.cap, y = [...free].map(i => ({ i, nb: !!Y && seam(C[i], Y), d: reach(C[i], yc) })).sort((a, b) => b.nb - a.nb || a.d - b.d || a.i - b.i)[0]
    take('Keeping track', y.i, !Y ? 'nearest the caption, the photograph’s place · the record is kept by where and when' : y.nb ? `beside the date, ${r.date} · a seam shared with it · the record is kept by when` : `nearest the date, ${r.date} · the record is kept by when`) }
  x = nearest(r.vs); take('Staying up to date', x.i, 'nearest v3 · v2 · v1 · the site kept current, its earlier versions still open')
  { const five = out.filter(Boolean).map(o => o.i), mid = five.reduce((s, i) => [s[0] + ct[i][0] / 5, s[1] + ct[i][1] / 5], [0, 0])
    const y = [...free].map(i => ({ i, n: five.filter(j => seam(C[i], C[j])).length, d: Math.hypot(ct[i][0] - mid[0], ct[i][1] - mid[1]) })).sort((a, b) => b.n - a.n || a.d - b.d || a.i - b.i)[0]
    take('Self-healing', y.i, y.n ? `sharing a seam with ${y.n} of the five it watches · they are kept running from here` : 'nearest the middle of the five it watches · they are kept running from here') }
  return out }

/* ---------- in Chrome ---------- */
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
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
const HTTP = await freePort(), CDPP = await freePort(), PROFILE = mkdtempSync(path.join(os.tmpdir(), 's42-'))
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' }
/* MUTATE (to watch this check go red, never committed; each changes only the served bytes):
   swap  = the Context sentence takes another world's photograph record (its place and month)
   copy  = the general part of Context is a copy of IDEAS' intro, not read from /v2/home.js
   names = the six names back on screen at rest */
const MUT = process.env.MUTATE || ''
const mutate = (u, s) => {
  const was = s
  if (MUT === 'swap' && u === '/studies/42/here.js') s = s.replace("const rec = XJ.photos.find(p => p.src === photo.src) || null", "const rec = XJ.photos[(XJ.photos.findIndex(p => p.src === photo.src) + 1) % XJ.photos.length]")
  if (MUT === 'copy' && u === '/studies/42/stone.js') s = s.replace("gen.append(mk('p', 'intro', d.intro || '')); const ul", `gen.append(mk('p', 'intro', I.name === 'Context' ? ${JSON.stringify(IDEAS0[0].detail.intro)} : d.intro || '')); const ul`)
  if (MUT === 'names' && u === '/studies/42/stone.js') s = s.replace("document.body.dataset.ready = 'yes'", "{ const n = document.createElement('div'); n.id = 'names-back'; n.style.cssText = 'position:fixed;left:20px;top:120px;z-index:6;font:400 11px/2 sans-serif;color:#fff'; n.textContent = IDEAS.map(I => I.name).join(' '); document.body.append(n) }\ndocument.body.dataset.ready = 'yes'")
  if (s !== was) mutate.hit = true
  return s }
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u)
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
  if (u === '/v2/home.js') return res.end(HOMEJS_SERVED) // the mark in every intro and boundary: what the panel shows must carry it
  if (/^\/studies\/42\/(here|stone)\.js$/.test(u) && MUT) return res.end(mutate(u, readFileSync(f, 'utf8')))
  createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDPP}`, 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`, errors = []
let loads = 0, taps = 0, sweepLine = '', textLine = ''
const SAID = {} // the panel's words per world, for the report

try {
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' ')) }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date, real0 = R.now(), pin = ${PIN}; const now = () => pin + (R.now() - real0)
    class D extends R { constructor(...a) { if (a.length) super(...a); else super(now()) } static now() { return now() } }; globalThis.Date = D; try { sessionStorage.clear() } catch {} })()` })
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*api.open-meteo.com*' }] })
  const handle = cdp.on; cdp.on = msg => { if (msg.method === 'Fetch.requestPaused') cdp.send('Fetch.fulfillRequest', { requestId: msg.params.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(JSON.stringify(SKY)).toString('base64') }).catch(() => {}); else handle(msg) }

  let VP
  const view = async ([w, h, mobile]) => { VP = { w, h, mobile }; await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 }) }
  const open = async q => { loads++; await cdp.send('Page.navigate', { url: `${BASE}/studies/42/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!window.HOME && !!HOME.world && ['stone', 'world'].includes(HOME.at) && (HOME.at === 'stone' || HOME.world.arrived) && HOME.dealt`), 'page ' + q, 300); await sleep(900) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')); return path.join(SHOTS, name) }
  const tap = async ([x, y]) => { taps++
    if (VP.mobile) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(30); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
    else { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await sleep(30); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }) }
    await sleep(160) }
  const readAtOf = () => cdp.eval(`(() => { try { return JSON.parse(sessionStorage.getItem('kahranWeatherCache')).at } catch { return null } })()`)
  const restText = () => cdp.eval(`(() => { const out = []; const walk = n => { if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(), p = n.parentElement
      if (t && p.getClientRects().length && !p.closest('[hidden], noscript, #why') && getComputedStyle(p).visibility !== 'hidden' && +getComputedStyle(p).opacity > .02 && (() => { for (let e = p; e; e = e.parentElement) if (+getComputedStyle(e).opacity < .02) return false; return true })()) out.push(t) } else n.childNodes.forEach(walk) }
    walk(document.body); document.querySelectorAll('[title], [aria-label]').forEach(e => out.push(e.getAttribute('title') || '', e.getAttribute('aria-label') || '')); return out.join(' | ') })()`)
  const sameSaid = (got, want) => { const bad = []
    for (const n of NAMES) { const g = (got[n] || []).map(x => x.s + ' @' + x.at), w = (want[n] || []).map(x => x.s + ' @' + x.at)
      if (g.join('\n') !== w.join('\n')) bad.push(`${n}: page “${g.find((x, i) => x !== w[i]) || '(none)'}” vs recount “${w.find((x, i) => x !== g[i]) || '(none)'}”`) }
    return bad }

  /* ---------- the texts: every world, word for word, and nothing private ---------- */
  const live = new Set(readdirSync(path.join(ROOT, 'poems')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)))
  const poems = DATA.poems.filter(p => live.has(p.slug)), photos = DATA.photos.filter(p => existsSync(path.join(ROOT, 'v3/regions', p.src.split('/').pop().replace(/\.[a-z]+$/i, '') + '.json')))
  const keys = photos.flatMap((p, k) => [0, 46].map(o => poems[(k * 7 + o) % poems.length].slug + '~' + p.src.replace('/photos/', '')))
  {
    await view(SCREENS[0]); await open('t=a')
    const today = await cdp.eval('HOME.todayKey'), at = await readAtOf(), bad = [], priv = [], caps = []
    check(today === PICKED.poem + '~' + PICKED.photo.replace('/photos/', ''), `the page's pair today is the one pick.js picks here (${today})`)
    for (const key of [today, ...keys]) { const [slug, f] = key.split('~'), got = await cdp.eval(`HOME.hereFor(${JSON.stringify(key)})`), want = expected('/photos/' + f, slug, key === today ? 'home' : 'world', at)
      bad.push(...sameSaid(got, want).map(b => key + ' ' + b))
      for (const n of NAMES) for (const x of got[n] || []) { if (PRIVATE.test(x.s)) priv.push(`${key} ${n}: “${PRIVATE.exec(x.s)[0]}”`); const u = unaccounted(x.s); if (u.length) caps.push(`${key} ${n}: ${u.join(', ')}`) }
      if (key === today || ['an-ode-to-aspens~alpine-lake.jpg', 'large-objects~provincetown-massachusetts-f214fa8d.jpg'].includes(key)) SAID[key] = got }
    textLine = `${keys.length + 1} worlds (today's pair and ${keys.length}) x six ideas`
    check(!bad.length, `every this-world sentence, in every world, equals the recount here word for word: ${textLine}`, `${bad.length} differ: ` + bad.slice(0, 3).join(' | '))
    check(!priv.length, 'no this-world sentence names a private channel, the system or a private place', priv.slice(0, 3).join(' | '))
    check(!caps.length, 'no this-world sentence holds a capitalised word the data does not account for (no person is named)', caps.slice(0, 3).join(' | '))
  }

  /* ---------- the sweep: 41 b's placement, every world, five screens, fresh and crossed ---------- */
  if (process.env.SWEEP !== '0') {
    const bad = [], seen = { n: 0, slow: 0, recut: 0 }
    for (const sc of SCREENS) { await view(sc); await open('t=a')
      for (const key of keys) for (const cr of [false, true]) {
        const trail = cr ? [keys[(keys.indexOf(key) + 1) % keys.length]] : [], t1 = Date.now(), r = await cdp.eval(`HOME.plant(${JSON.stringify(key)}, ${JSON.stringify(trail)})`); seen.n++; seen.slow = Math.max(seen.slow, Date.now() - t1)
        const tag = `${sc[0]}x${sc[1]} ${cr ? 'crossed into' : 'fresh'} ${key}`
        if (!r) { bad.push(`${tag}: no world`); continue } if (r.cutT) seen.recut++
        const title = crossed(r.titleRects, r.cells, r.drawn), doors = crossed(r.doorRects, r.cells, r.drawn), got = r.ideas
        if (!got || got.length !== 6 || got.some(x => !x)) { bad.push(`${tag}: not six ideas`); continue }
        if (new Set(got.map(x => x.i)).size !== 6) bad.push(`${tag}: two ideas share a facet`)
        for (const x of got) { const why = [!r.drawn.includes(x.i) && 'not drawn', title.has(x.i) && 'the title\'s', doors.has(x.i) && 'a door\'s', x.i === r.year && 'the date\'s', !r.touch[x.i] && 'no place for a finger'].filter(Boolean)
          if (why.length) bad.push(`${tag}: ${NAMES[x.k]} behind facet ${x.i}, ${why.join(', ')}`) }
        const want = recount(r)
        for (const [k, x] of got.entries()) { if (!want[k] || want[k].i !== x.i) bad.push(`${tag}: ${NAMES[k]} behind ${x.i}, the rule says ${want[k] && want[k].i}`)
          else if (want[k].basis !== x.basis) bad.push(`${tag}: ${NAMES[k]}'s basis says “${x.basis}”, the recount “${want[k].basis}”`) } } }
    sweepLine = `${keys.length} worlds x ${SCREENS.length} screens x fresh and crossed = ${seen.n} placements`
    check(!bad.length, `41 b's placement holds: six ideas behind six distinct legal facets, as the rule says, recounted, each basis line word for word with no pixel count: ${sweepLine}; ${seen.recut} on a re-seeded cut; slowest world ${seen.slow} ms`, `${bad.length} wrong: ` + bad.slice(0, 4).join(' | ')) }

  /* ---------- live: rest, what opens, depth, readability ---------- */
  const RAINIER = 'an-ode-to-aspens~alpine-lake.jpg', PTOWN = 'large-objects~provincetown-massachusetts-f214fa8d.jpg'
  const SHOT = [], DEF = defaults['ideas-way']
  for (const sc of VPS) { await view(sc); const vtag = `${sc[0]}x${sc[1]}`
    for (const way of WAYS) for (const wk of [null, RAINIER, PTOWN]) {
      const label = `${vtag} ${way} ${wk ? wk.split('~')[0] : 'home'}`, wname = wk === RAINIER ? 'rainier' : wk === PTOWN ? 'provincetown' : 'home'
      await open('t=' + way + (wk ? '&w=' + encodeURIComponent(wk) : ''))
      const s = await cdp.eval('HOME.state'), key = await cdp.eval('HOME.world.key'), today = await cdp.eval('HOME.todayKey')
      const want = expected('/photos/' + key.split('~')[1], key.split('~')[0], key === today && !wk ? 'home' : 'world', await readAtOf())
      if (process.env.SAY) SAID[key] = await cdp.eval('HOME.hereFor()')
      check(s.ideas.length === 6 && new Set(s.ideas.map(x => x.i)).size === 6 && s.kinds.filter(k => k === 'idea').length === 6, `${label}: six facets hold the six ideas`, JSON.stringify(s.ideas.map(x => x.i)))
      const rest = await restText(), shown = NAMES.filter(n => new RegExp('(^|[^a-z])' + n.replace(/ /g, '\\s+') + '([^a-z]|$)', 'i').test(rest))
      check(!shown.length, `${label}: at rest no idea's name is on screen, in a title or in a label`, shown.join(', '))
      const marks = await cdp.eval('HOME.marks()')
      check(marks.length === 6 && marks.every(m => m.wash > .05 && !m.thread), `${label}: at rest six facets carry a breath of their idea's hue, nothing more`, JSON.stringify(marks))
      const wrong = [], clash = [], aa = [], covered = []
      for (const [k, I] of IDEAS.entries()) {
        const at = await cdp.eval(`HOME.tapIdea(${k})`); if (!at || !at.pt) { wrong.push(`${I.name}: no place to tap`); continue }
        await tap(at.pt)
        const ok = await waitFor(() => cdp.eval(`HOME.open === ${k} && HOME.openAt === ${at.i} && HOME.hereReadyNow`), 'idea ' + I.name, 250, 60).catch(() => null)
        if (!ok) { wrong.push(`${I.name}: its facet ${at.i} did not open it with this world's words`); await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); continue }
        await sleep(380)
        const st = await cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(), vis = e => !!e && e.getClientRects().length > 0 && !e.closest('[hidden]')
          const kids = [...t.children].filter(vis).map(e => e.tagName + (e.className ? '.' + e.className.replace(/ /g, '.') : '')), gen = t.querySelector('.gen'), fs = e => parseFloat(getComputedStyle(e).fontSize)
          const lines = []; const walk = n => { if (n.nodeType === 3 && n.textContent.trim() && vis(n.parentElement)) { const q = document.createRange(); q.selectNodeContents(n); for (const b of q.getClientRects()) if (b.height) lines.push([b.top, b.bottom]) } else n.childNodes.forEach(walk) }; walk(t)
          return { box: [r.left, r.top, r.width, r.height], kids, h2: t.querySelector('h2').textContent, href: t.querySelector('h2 a')?.getAttribute('href') ?? null,
            here: [...t.querySelectorAll('p.here')].filter(vis).map(p => p.textContent), hereBig: Math.min(...[...t.querySelectorAll('p.here:not(.inst)')].filter(vis).map(fs), 99), genMax: Math.max(...[...t.querySelectorAll('.gen p:not(.here), .gen li button')].filter(vis).map(fs), 0),
            genHidden: !gen || !vis(gen), intro: gen?.querySelector('p.intro')?.textContent ?? null, boundary: gen?.querySelector('p.boundary')?.textContent ?? null,
            parts: [...t.querySelectorAll('li > button')].map(b => b.textContent), sents: [...t.querySelectorAll('li > p:not(.here)')].map(p => p.textContent), openParts: [...t.querySelectorAll('li > button[aria-expanded="true"]')].map(b => b.textContent),
            braid: [...(gen ? gen.querySelectorAll('p.here.inst') : [])].map(p => ({ s: p.textContent, after: (() => { const li = p.closest('li'); if (li) return li.querySelector('button').textContent; let e = p.previousElementSibling; while (e && e.matches('p.here')) e = e.previousElementSibling; return e ? (e.matches('p.intro') ? 'intro' : e.matches('p.boundary') ? 'boundary' : e.tagName) : null })() })),
            basis: t.querySelector('.basis')?.textContent ?? null, cut: lines.filter(([a, b]) => a < r.bottom - 1 && b > r.bottom + 1).length, scroll: t.scrollHeight > t.clientHeight + 1 } })()`)
        const W0 = want[I.name], plan = s.ideas.find(x => x.k === k)
        if (st.h2 !== I.name || st.href !== (I.href || null)) wrong.push(`${I.name}: not its name`)
        if (st.parts.join('|') !== I.parts.join('|') || st.sents.join('|') !== I.detail.tools.join('|') || st.intro !== I.detail.intro || st.boundary !== I.detail.boundary) wrong.push(`${I.name}: the general is not IDEAS' own words, read live (intro “${(st.intro || '').slice(0, 40)}”, ${st.intro && st.intro[0] === MARK ? 'marked' : 'no mark: a copy'})`)
        if (st.basis !== plan.basis || / px\b/.test(st.basis || '')) wrong.push(`${I.name}: basis “${st.basis}” vs plan “${plan.basis}”`)
        if (way === 'b') { const slot = a => a === 'intro' ? -1 : a === 'boundary' ? 99 : I.parts.indexOf(a), got = st.braid.map(x => x.s + ' @' + x.after).join('\n'), exp = W0.map((x, n) => [x, n]).sort((p, q) => slot(p[0].at) - slot(q[0].at) || p[1] - q[1]).map(([x]) => x.s + ' @' + x.at).join('\n')
          if (got !== exp) wrong.push(`${I.name}: braided “${st.braid.map(x => x.s.slice(0, 30) + '@' + x.after).join(' / ')}” vs “${W0.map(x => x.s.slice(0, 30) + '@' + x.at).join(' / ')}”`)
          if (st.openParts.join('|') !== I.parts.filter(p => W0.some(x => x.at === p)).join('|')) wrong.push(`${I.name}: open tools ${st.openParts} are not those with an instance here`) }
        else { if (st.here.length !== 1 || st.here[0] !== W0.map(x => x.s).join(' ')) wrong.push(`${I.name}: this world says “${(st.here[0] || '').slice(0, 90)}”, the recount “${W0.map(x => x.s).join(' ').slice(0, 90)}”`)
          if (st.kids[1] !== 'P.here') wrong.push(`${I.name}: this world is not first under the name (${st.kids.slice(0, 3)})`)
          if (!(st.hereBig > st.genMax)) wrong.push(`${I.name}: this world (${st.hereBig}px) is not larger than the general (${st.genMax}px)`)
          if (way === 'c' && !st.genHidden) wrong.push(`${I.name}: c lays the general on the first tap`)
          if (way === 'a' && st.genHidden) wrong.push(`${I.name}: a hides the general`) }
        if (st.cut) wrong.push(`${I.name}: ${st.cut} line(s) cut at the panel's edge`)
        const tb = st.box; for (const [n, r] of [['poem', s.poem], ['name', s.mat], ['switch', s.vs]]) if (r[2] > 0 && tb[0] < r[0] + r[2] && tb[0] + tb[2] > r[0] && tb[1] < r[1] + r[3] && tb[1] + tb[3] > r[1]) clash.push(`${I.name} over the ${n}`)
        if (tb[0] < 0 || tb[1] < 0 || tb[0] + tb[2] > s.W + .5 || tb[1] + tb[3] > s.H + .5) clash.push(`${I.name} off the screen`)
        const c = await cdp.eval(`(() => { const t = document.querySelector('#tools'), r = t.getBoundingClientRect(), cv = document.getElementById('stone'), d = devicePixelRatio, x = cv.getContext('2d')
          const img = x.getImageData(Math.max(0, Math.floor(r.left * d)), Math.max(0, Math.floor(r.top * d)), Math.max(1, Math.floor(r.width * d)), Math.max(1, Math.floor(r.height * d))).data
          const bg = getComputedStyle(t).backgroundColor.match(/[\\d.]+/g).map(Number), A = bg[3] ?? 1
          const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }, Lof = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
          const grounds = []; for (let k = 0; k < img.length; k += 4 * 7) grounds.push([0, 1, 2].map(j => bg[j] * A + img[k + j] * (1 - A)))
          const texts = [...t.querySelectorAll('h2, p, li > button, .basis')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).map(e => { const cs = getComputedStyle(e), m = cs.color.match(/[\\d.]+/g).map(Number); let op = 1; for (let n = e; n && n !== t.parentElement; n = n.parentElement) op *= +getComputedStyle(n).opacity; return { sel: e.tagName + (e.className ? '.' + e.className : ''), c: m, a: (m[3] ?? 1) * op } })
          let worst = { r: 99 }
          for (const T of texts) for (const G of grounds) { const fg = [0, 1, 2].map(j => T.c[j] * T.a + G[j] * (1 - T.a)), L1 = Lof(fg), L2 = Lof(G), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); if (ratio < worst.r) worst = { r: ratio, sel: T.sel } }
          return { r: +worst.r.toFixed(2), sel: worst.sel } })()`)
        aa.push(c.r); if (c.r < 4.5) wrong.push(`${I.name}: ${c.sel} reads ${c.r}:1 against the stone under it`)
        if (sc[0] === 390 && sc[1] === 844 && wk && (way === DEF || k === 0)) SHOT.push(await shot(`42-${way}-${wname}-${I.name.toLowerCase().replace(/ /g, '-')}.png`))
        // the same facet again: c lays the general; a and b open the next closed tool
        const at2 = await cdp.eval(`HOME.tapIdea(${k}, true)`)
        if (at2 && at2.pt) { await tap(at2.pt); await sleep(200)
          const two = await cdp.eval(`(() => { const t = document.querySelector('#tools'), gen = t.querySelector('.gen'); return { open: HOME.open, gen: !!gen && !gen.hidden, opened: [...t.querySelectorAll('li > button[aria-expanded="true"]')].map(b => b.textContent) } })()`)
          const firstClosed = way === 'b' ? I.parts.filter(p => !W0.some(x => x.at === p))[0] : I.parts[0], before = way === 'b' ? I.parts.filter(p => W0.some(x => x.at === p)) : []
          if (way === 'c' ? !(two.open === k && two.gen && !two.opened.length) : !(two.open === k && two.gen && two.opened.join('|') === [...before, firstClosed].filter(Boolean).filter((p, i, A) => A.indexOf(p) === i).sort((a, b) => I.parts.indexOf(a) - I.parts.indexOf(b)).join('|')))
            wrong.push(`${I.name}: a second tap on its facet did not ${way === 'c' ? 'lay the general beneath' : 'open its next tool'} (${JSON.stringify(two).slice(0, 120)})`)
          if (way === 'c' && sc[0] === 390 && sc[1] === 844 && wk === RAINIER && k === 0) SHOT.push(await shot(`42-c-rainier-context-second-tap.png`)) }
        else covered.push(I.name)
        const at0 = await cdp.eval('HOME.at + "|" + HOME.world.key')
        const free = await cdp.eval(`(() => { const r = document.querySelector('#tools').getBoundingClientRect(), mine = ${at.i}, cs = HOME.state.cells, inP = ([x, y], P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
          for (const [x, y] of [[innerWidth / 2, 6], [innerWidth - 8, innerHeight / 2], [8, innerHeight / 2], [innerWidth / 2, innerHeight - 6], [innerWidth - 8, 8], [8, 8]]) if ((x < r.left || x > r.right || y < r.top || y > r.bottom) && !document.elementFromPoint(x, y).closest('a, button, .verse') && !inP([x, y], cs[mine])) return [x, y]; return null })()`)
        if (free) { await tap(free); await sleep(250)
          const after = await cdp.eval('({ open: HOME.open, at: HOME.at + "|" + HOME.world.key, busy: HOME.busy })')
          if (after.open !== -1 || after.at !== at0 || after.busy) wrong.push(`${I.name}: a touch elsewhere ${after.open !== -1 ? 'left it open' : 'moved the stone to ' + after.at}`) }
        else { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150) } }
      check(!wrong.length, `${label}: each facet opens its own idea: ${way === 'b' ? 'the general braided with this world, each instance after the sentence it answers' : 'this world first and largest, the general beneath' + (way === 'c' ? ' on the second tap' : '')}, word for word, the general read live, the basis line, whole lines; the next tap goes deeper; a touch elsewhere only closes it; AA against the pixels under it (worst ${Math.min(...aa).toFixed(1)}:1)`, wrong.slice(0, 3).join(' | '))
      if (covered.length) console.log(`note ${label}: the open panel covers the whole of ${covered.join(', ')}'s facet; deeper is in the panel`)
      check(!clash.length, `${label}: an open idea keeps clear of the poem, the name and the switch, on the screen`, clash.slice(0, 3).join(', '))
      const txt = await cdp.eval('document.body.innerText')
      check(!BANNED.test(txt), `${label}: the system's working name never shows`) } }
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '))
  if (MUT) check(mutate.hit, `the mutation ${MUT} found its line`)
  if (process.env.SAY) for (const [k, S] of Object.entries(SAID)) { console.log('\n== ' + k); for (const n of NAMES) console.log(`  ${n}: ${S[n].map(x => x.s).join(' ')}`) }
  if (SHOT.length) console.log('shots: ' + SHOT.join(' '))
} catch (e) { failures++; console.log('FAIL the run: ' + (e.stack || e) + (errors.length ? '\n  page errors: ' + errors.slice(0, 3).join(' | ') : '')) }

console.log(failures ? `FAIL study 42: ${failures} of ${oks + failures} checks failed` : `PASS study 42: ${oks} checks; ${textLine}, every sentence recounted word for word; ${sweepLine || 'placement sweep skipped'}; in ${loads} loads at ${VPS.map(([w, h]) => w + 'x' + h).join(', ')}, ${taps} taps, ways ${WAYS.join(', ')}: this world first, the general read live, no name on screen at rest`)
cleanup(); process.exit(failures ? 1 : 0)
