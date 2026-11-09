#!/usr/bin/env node
// Study 34 check: 31 b with everything the site has analysed, each piece labelled by what it did today.
// The sky is stubbed with 31's real Open-Meteo response (fixtures/open-meteo-2026-11-08.json, kept verbatim). In Node, from the files:
//   every count shown (data-n) is recounted, independently of body.js and why.js; every measure (data-f) is pick.js's; every live
//   reading (data-r) is the fixture's; every stored value (data-v) is the file's; and no other number appears anywhere in the panel;
//   every piece's label is re-derived: taken away and re-run on pick.js's pickBest ("moved the pick" = a different photograph or poem;
//   "weighed" = scores move, the pair holds; "did not count" = no score moves), or read off the stone itself (S24.doors) for the
//   door lines, the ideas the doors carry, and where they lead; with no live pick, nothing claims to have moved it;
//   31's chain checks (each signal taken away, the stone's doors); every value one mark in c;
//   no casual filler, no system names; on screen, clear of the line, nothing wider than the panel, at 1440x900, 390x844, 844x390.
// Screenshots: studies/34/shots/.  Run: node studies/34/check.mjs   (WAYS=a,b  VPS=390x844 to narrow; non-zero exit on any failure)
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, writeFileSync, mkdirSync, readFileSync, statSync, createReadStream } from 'node:fs'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const SHOTS = path.join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true })
const WAYS = (process.env.WAYS || 'a,b,c,d').split(',')
const VIEWPORTS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }, { w: 844, h: 390, mobile: true }].filter(v => !process.env.VPS || process.env.VPS.split(',').includes(v.w + 'x' + v.h))
const FIXTURE = readFileSync(path.join(HERE, 'fixtures/open-meteo-2026-11-08.json'), 'utf8')
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function waitFor(fn, label, tries = 200) { for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v } catch {} await sleep(100) } throw new Error('timed out waiting for ' + label) }
function findShell() {
  if (process.env.CHROME) return process.env.CHROME
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'); if (!existsSync(base)) return null
  for (const v of readdirSync(base).sort().reverse()) { const p = path.join(base, v, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (existsSync(p)) return p }
  return null
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.on = () => {}
    ws.onmessage = m => { const msg = JSON.parse(m.data)
      if (msg.id) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result) } else this.on(msg) } }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('page threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value }
}

let failures = 0, oks = 0
const check = (ok, label, detail) => { if (ok) { oks++; if (!process.env.QUIET) console.log('ok   ' + label) } else { failures++; console.log('FAIL ' + label + (detail ? ' — ' + detail : '')) } }
{ // tune writes every dial as --<name> on :root, so a dial named like one of the page's own variables would overwrite it
  const page = readFileSync(path.join(HERE, 'index.html'), 'utf8'), dials = Object.keys(JSON.parse(readFileSync(path.join(HERE, 'defaults.json'), 'utf8')))
  const own = [...page.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1].slice(2)).filter(k => !['mat-h', 'v', 'l', 'mono'].includes(k))
  const clash = dials.filter(k => own.includes(k)); check(clash.length === 0, 'no dial shadows a page variable', clash.join(', '))
}

/* ---------- the truth, in Node ---------- */
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const DATA = J('v2/data.json'), DAYS = J('v2/days.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), PLACE = J('v2/place.json')
const PICK_SRC = readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8')
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
const S21 = J('studies/21/doors.json'), IDEAS = J('studies/21/ideas.json'), D15 = J('studies/15/doors.json'), KIN = J('studies/26/kin.json'), FEAT = J('studies/13/features.json')
const READ_TXT = readFileSync(path.join(ROOT, 'studies/21/readings.txt'), 'utf8')
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
  L('photoIdeas', SRCS.reduce((s, x) => s + (IDEAS.photos[base(x)] ? IDEAS.photos[base(x)].trim().split(/\s+/).length : 0), 0), st(allHis && SD.some(d => ['word', 'near'].includes(d.phow))))
  L('concepts', Object.keys(S21.concepts).length, st(allHis && SD.some(d => d.how === 'near' || d.phow === 'near')))
  L('vocabs', others.reduce((s, [, v]) => s + tiesOf(v), 0), st(SD.some(d => !hisW.has(d.word) && others.some(([, v]) => v.words.some(w => w.word === d.word)))))
  N.D_otherIdeas = others.reduce((s, [, v]) => s + v.words.length, 0)
  L('strains', HAND.notes + Object.keys(IDEAS.photo_notes).filter(k => SRCS.some(s => base(s) === k)).length, st(false))
  L('earlier', Object.values(D15.vocabs).reduce((s, v) => s + tiesOf(v), 0), st(false)); N.D_earlierWords = Object.values(D15.vocabs).reduce((s, v) => s + v.words.length, 0)
  // measured in each photograph
  L('regions', SRCS.reduce((s, x) => s + countNums((KIN.photos[x] || {}).cells || []), 0), st(false))
  L('months', SRCS.filter(x => (KIN.photos[x] || {}).when).length, st(false))
  const FK = ['L', 'contrast', 'a', 'b', 'chroma', 'hue', 'orient', 'density', 'horizon', 'hstrength', 'layout', 'mass'], feat = FEAT.photos.filter(x => SRCS.includes('/photos/' + x.f))
  L('features', feat.reduce((s, x) => s + FK.reduce((t, k) => t + countNums(x[k] ?? []), 0), 0), st(false)); N.D_featPhotos = feat.length
  // totals by what each piece did
  const units = Object.keys(ST).filter(k => !(k in { sky: 1, photoM: 1, poemM: 1 })).map(k => [ST[k], k.includes('.') ? N['P_' + k.replace('.', '_')] : N['L_' + k]])
  N.S_all = units.reduce((s, [, n]) => s + n, 0); N.S_pieces = new Set(Object.keys(ST).map(k => k.split('.')[0])).size
  for (const s of ['moved', 'stone', 'weighed', 'unused']) N['S_' + s] = live ? units.filter(([x]) => x === s).reduce((t, [, n]) => t + n, 0) : 0
  const b = iso.split('-').map(Number); N.doy = Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(b[0], 0, 1)) / 864e5) + 1; N.peak = constOf('SEASON_PEAK_DOY')
  const top = PS.photos[DAY_PHOTO]; if (top && top.place) N.D_chosenKm = Math.round(T.haversineKm(reading.lat, reading.lon, top.place.lat, top.place.lon))
  N.D_chosenRegions = countNums((KIN.photos[DAY_PHOTO] || {}).cells || [])
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
const shell = findShell(); if (!shell) { console.error('no chrome-headless-shell under ~/.cache/puppeteer'); process.exit(2) }
const HTTP = await freePort(), CDPP = await freePort()
// a small static server in this process (python's http.server resets connections when the page asks for many photographs at once)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.webp': 'image/webp' }
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(ROOT, path.normalize(p)); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' }); createReadStream(f).pipe(res) }).listen(HTTP, '127.0.0.1')
const chrome = spawn(shell, ['--headless', '--use-mock-keychain', '--password-store=basic', '--no-first-run', `--remote-debugging-port=${CDPP}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const cleanup = () => { try { chrome.kill() } catch {} try { server.close() } catch {} }
process.on('exit', cleanup)
const BASE = `http://127.0.0.1:${HTTP}`
const errors = []
let SKY = 'real', KEEP_TODAY = false, TODAY = null, ASKED = null

try {
  await waitFor(() => fetch(`${BASE}/studies/34/index.html`).then(r => r.ok), 'static server')
  const targets = await waitFor(() => fetch(`http://127.0.0.1:${CDPP}/json`).then(r => r.json()), 'devtools')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  const cdp = new CDP(ws)
  const b64 = s => Buffer.from(s).toString('base64')
  cdp.on = msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '))
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && (msg.params.entry.url || '').startsWith(BASE)) errors.push(msg.params.entry.text + ' ' + msg.params.entry.url)
    if (msg.method === 'Fetch.requestPaused') { const { requestId, request } = msg.params, cors = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json' }]
      if (/open-meteo\.com/.test(request.url)) {
        ASKED = new URL(request.url).searchParams.get('current')
        if (SKY === 'none') cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 503, responseHeaders: cors, body: b64('{}') })
        else cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(FIXTURE) })
      } else if (/\/v2\/days\.json/.test(request.url) && KEEP_TODAY && TODAY) {
        const d = structuredClone(DAYS), last = Object.keys(d.days).sort().pop(); d.days[TODAY] = { ...d.days[last] }
        cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: cors, body: b64(JSON.stringify(d)) })
      } else cdp.send('Fetch.continueRequest', { requestId }) }
  }
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*open-meteo.com*' }, { urlPattern: '*/v2/days.json*' }] })
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { sessionStorage.clear() } catch {}' })

  let VP = VIEWPORTS[0]
  const view = async vp => { VP = vp
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }) }
  const open = async q => {
    await cdp.send('Page.navigate', { url: `${BASE}/studies/34/index.html?${q}` })
    await waitFor(() => cdp.eval(`document.body.dataset.ready === 'yes' && document.fonts.status === 'loaded' && !!S24.world && !!window.S34P`), 'page ' + q, 300)
    await cdp.eval('S34P.ready'); await sleep(400) }
  const shot = async name => { const r = await cdp.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(r.data, 'base64')) }
  const press = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  const release = (x, y) => VP.mobile ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  const tap = async (x, y) => { await press(x, y); await sleep(40); await release(x, y) }
  const boxOf = sel => cdp.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [b.left, b.top, b.width, b.height] })()`)
  const tapEl = async sel => { const b = await boxOf(sel); await tap(b[0] + Math.min(b[2] / 2, 60), b[1] + b[3] / 2) }
  const openWhy = async () => { await tapEl('#where'); await waitFor(() => cdp.eval(`document.body.classList.contains('why') && +getComputedStyle(document.getElementById('why')).opacity > .98 && document.querySelector('.why-body').dataset.drawn === 'yes'`), 'the panel opens', 80) }
  const panel = () => cdp.eval(`(() => { const p = document.getElementById('why'), b = p.getBoundingClientRect(), w = document.getElementById('where').getBoundingClientRect(), body = p.querySelector('.why-body')
    const wide = [...p.querySelectorAll('.why-body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1) }).map(e => e.className || e.tagName).slice(0, 4)
    const bare = body.cloneNode(true); bare.querySelectorAll('[data-n],[data-f],[data-r],[data-v],[data-date],canvas,img').forEach(e => e.remove())
    const m = S34P.model
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
      doors: [...p.querySelectorAll('.b-door')].map(d => d.dataset.door), stoneDoors: S24.doors.map(d => ({ phrase: d.phrase, word: d.word, how: d.how, phow: d.phow })),
      notes: m && m.B ? [m.B.today.photo && m.B.today.photo.notes, m.B.today.poem && m.B.today.poem.notes, m.B.today.photo && m.B.today.photo.hour, m.B.today.poem && m.B.today.poem.hour, m.B.today.ideas, m.place].filter(Boolean) : [],
      model: m && { mode: m.mode, iso: m.iso, agrees: m.agrees, fields: m.src.fields, live: m.B && m.B.live }, stone: S24.world, home: S24.at === 'stone' && !!S24.world && S24.world.mode === 'home' } })()`)
  const num = t => +t.replace(/,/g, '').replace('−', '-')
  const fx = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d)
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const nice = iso => { const [y, mo, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[mo - 1] + ' ' + y }
  const RFIX = (() => { const om = JSON.parse(FIXTURE), c = om.current; return { temp: c.temperature_2m, cloud: c.cloud_cover, wind: c.wind_speed_10m, lat: PLACE.lat, lon: PLACE.lon,
    wetmax: Math.max(c.precipitation, c.rain, c.showers, c.snowfall), sunrise: om.daily.sunrise[0].slice(11, 16), sunset: om.daily.sunset[0].slice(11, 16) } })()
  const vOf = k => { const [kind, key, f] = k.split('|'); return kind === 'photo' ? PS.photos[key][f] : kind === 'poem' ? (f === 'words' ? DATA.poems.find(p => p.slug === key).words : QS.poems[key][f]) : kind === 'kin' ? KIN.photos[key][f] : undefined }
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

  for (const vp of VIEWPORTS) {
    await view(vp)
    const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      errors.length = 0; SKY = 'real'; KEEP_TODAY = false
      const L = `w=${way} ${tag}`
      await open('w=' + way)
      check(await cdp.eval(`S34P.how`) === 'live', `${L}: today is a live pick`)
      await openWhy()
      if (way === 'c') await waitFor(() => cdp.eval(`!!document.querySelector('.why-body').dataset.dots && [...document.querySelectorAll('.v-cv')].every(c => c.dataset.dots)`), 'the marks to draw', 40)
      const s = await panel(); TODAY = s.model.iso
      const truth = truthFor(s.model.iso, READING, DAYS); truth.N.skyFields = (ASKED || '').split(',').filter(Boolean).length
      DAY_PHOTO = truth.photos[0]; DAY_POEM = truth.poems[0]
      const body = bodyTruth(s.model.iso, READING, DAYS, s.stoneDoors, true)
      check(s.stone.photo === truth.photos[0] && s.stone.slug === truth.poems[0] && s.model.agrees && s.home, `${L}: the stone shows pick.js's two`, JSON.stringify(s.stone))
      honest(L, s, truth, body, true)
      const used = Object.entries(body.ST).filter(([, v]) => v === 'moved').map(([k]) => k)
      check(used.length > 0 && Object.values(body.ST).includes('unused'), `${L}: today some pieces moved the pick (${used.length}) and some did not count`)
      const shown = new Set(s.layers.map(l => l.k)), want = way === 'd' ? ['photoM', 'poemM', 'places', 'hour', 'photoNotes', 'poemNotes', 'words', 'regions'] : ALL_LAYERS
      const missing = want.filter(k => !shown.has(k)); check(!missing.length, `${L}: it shows ${want.length} kinds of reading`, missing.join(', '))
      const need = { a: ['S_all', 'S_moved', 'S_stone', 'S_weighed', 'S_unused'], b: ['S_all', 'S_moved', 'signals', 'skyFields', 'comparisons', 'distances', 'setBack', 'kept', 'photoFeel', 'poemFeel', 'D_words'],
        c: ['S_all', 'S_moved', 'S_unused'], d: ['S_all', 'S_moved', 'D_chosenRegions'] }[way]
      const lack = need.filter(k => !s.ns.some(x => x.k === k)); check(!lack.length, `${L}: it states the scale`, lack.join(', '))
      if (way === 'b') {
        check(s.gauges.join() === AX.join(), `${L}: the moment has all seven measures`)
        const asked = (ASKED || '').split(','), unread = asked.filter(f => !truth.reads(f))
        check(asked.length > 0 && unread.length === 0, `${L}: every live field counted moves the moment`, unread.join(', '))
        check(s.sigs.length >= 7, `${L}: ${s.sigs.length} signals, each taken away in turn`)
        for (const g of s.sigs) { const t = truth.sig[g.k]
          check(t && t.moved && t.photo === g.photo && t.poem === g.poem, `${L}: signal "${g.k}" moved the computation, and without it the two are pickBest's`, t && `${g.photo} ${g.poem} vs ${t.photo} ${t.poem}`) }
        check(s.doors.length > 0 && s.doors.join('|') === s.stoneDoors.map(d => d.phrase).join('|'), `${L}: the stone's door lines listed are the doors on the stone`)
      }
      if (way === 'c') check(+s.dots === body.N.S_all, `${L}: one mark for each value held (${s.dots})`, `${s.dots} vs ${body.N.S_all}`)
      const [x0, y0, x1, y1] = s.box
      check(x0 >= 0 && y0 >= 0 && x1 <= vp.w + .5 && y1 <= vp.h + .5, `${L}: the panel is on screen`, JSON.stringify(s.box))
      check(y1 <= s.where[1] + 1 || x0 >= s.where[2] || x1 <= s.where[0], `${L}: it leaves the line clear`, JSON.stringify({ box: s.box, where: s.where }))
      check(s.clientH + 1 >= Math.min(s.scrollH, vp.h * .6) && s.clientW >= 300, `${L}: the panel has room to read`, `${s.clientW}x${s.clientH} of ${s.scrollH}`)
      check(s.wide.length === 0, `${L}: nothing is wider than the panel`, s.wide.join(', '))
      await shot(`34-${way}-${tag}.png`)
      for (const f of [.33, .66, 1]) { await cdp.eval(`(p => p.scrollTop = (p.scrollHeight - p.clientHeight) * ${f})(document.getElementById('why'))`); await sleep(150); await shot(`34-${way}-${tag}-${Math.round(f * 100)}.png`) }
      await cdp.eval(`document.getElementById('why').scrollTop = 0`)
      const before = s.stone.key
      const pt = await cdp.eval(`(() => { for (const [x, y] of [[${vp.w} - 20, ${vp.h} * .4], [20, 20], [${vp.w} * .5, 40], [${vp.w} - 20, ${vp.h} - 20], [${vp.w} * .5, ${vp.h} * .5]]) { const e = document.elementFromPoint(x, y); if (e && e.id === 'why-scrim') return [x, y] } return null })()`)
      check(!!pt, `${L}: some of the stone stays in view around the panel`)
      if (pt) await tap(...pt); await sleep(700)
      const after = await cdp.eval(`({ open: S34P.open, cls: document.body.classList.contains('why'), at: S24.at, key: S24.world.key, busy: S24.busy })`)
      check(!after.open && !after.cls && after.at === 'stone' && after.key === before && !after.busy, `${L}: closing returns to the same stone`, JSON.stringify({ after, pt }))
      await openWhy(); await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(500)
      check(!(await cdp.eval('S34P.open')) && (await cdp.eval('S24.at')) === 'stone', `${L}: Escape closes it too`)
      check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
    }
  }

  // fallbacks: no sky, then a kept day; the body still stands, and nothing claims to have moved a pick that was not run
  for (const vp of VIEWPORTS.filter(v => v.w !== 844)) { await view(vp); const tag = `${vp.w}x${vp.h}`
    for (const way of WAYS) {
      for (const keep of [false, true]) {
        errors.length = 0; SKY = 'none'; KEEP_TODAY = keep
        const L = `${keep ? 'kept day' : 'no sky'} w=${way} ${tag}`
        await open('w=' + way)
        const how = await cdp.eval('S34P.how'); check(how === (keep ? 'frozen' : 'hash'), `${L}: the page knows`, how)
        await openWhy(); const s = await panel()
        check(keep ? /no live sky right now/i.test(s.text) && /kept for/i.test(s.text) : /no live sky reached the page/i.test(s.text) && /from the date alone/i.test(s.text), `${L}: it says where the pair came from`, s.text.slice(0, 140))
        check(!/°C/.test(s.text) && !s.sigs.length, `${L}: it invents no reading and no signal`)
        const t0 = truthFor(TODAY, READING, DAYS); t0.N.skyFields = (ASKED || '').split(',').filter(Boolean).length
        DAY_PHOTO = s.stone.photo; DAY_POEM = s.stone.slug
        const dd = keep ? (d => { const last = Object.keys(d.days).sort().pop(); d.days[TODAY] = { ...d.days[last] }; return d })(structuredClone(DAYS)) : DAYS
        honest(L, s, t0, bodyTruth(TODAY, READING, dd, s.stoneDoors, false), false)
        if (way === 'b') await shot(`34-${keep ? 'kept' : 'nosky'}-${tag}.png`)
        check(errors.length === 0, `${L}: no console errors`, errors.join(' | '))
      }
    } }
  console.log('shots: studies/34/shots/')
} catch (e) { failures++; console.log('FAIL ' + e.message + (errors.length ? ' (page errors: ' + errors.join(' | ') + ')' : '')) }

cleanup()
console.log(failures ? `\n${failures} failing` : `\nPASS study 34 the whole body: ${oks} checks, 4 ways at 1440x900, 390x844 and 844x390; every number recounted, every label re-run on pick.js`)
process.exit(failures ? 1 : 0)
