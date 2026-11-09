#!/usr/bin/env node
// Study 30: what the site already knows about each photograph, worked out once so a facet can say it.
// Reads only the site's own data and the studies' readings:
//   v2/data.json            the 77 photographs and 93 poems on the site
//   v2/scores-photos.json   the seven scores, hour, place for every photograph (pick.js matches days against them)
//   v2/scores-poems.json    the same seven scores for every poem
//   v2/pick.js              the weights and rules, run as written (loaded, not copied)
//   studies/28/kin.json     each photograph measured region by region (6x4), its month from EXIF, 21's ideas
//   studies/21/ideas.json   the ideas each photograph was read for by hand, and the few hand notes
//   studies/21/readings.txt every poem read by hand: its strongest lines and the ideas they hold
// Writes yields.json beside this file. Nothing here is phrased for a visitor; deck.js phrases it.
// Run: node studies/30/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const J = f => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'))
const data = J('v2/data.json'), PS = J('v2/scores-photos.json'), QS = J('v2/scores-poems.json'), KIN = J('studies/28/kin.json'), IDEAS = J('studies/21/ideas.json')
const win = {}; new Function('window', readFileSync(path.join(ROOT, 'v2/pick.js'), 'utf8'))(win)
const K = win.kahranPick.__test
const live = s => existsSync(path.join(ROOT, 'poems', s + '.html'))
const AX = PS.axes, r2 = x => Math.round(x * 100) / 100, r1 = x => Math.round(x * 10) / 10

const photos = data.photos.map(p => p.src), poems = data.poems.map(p => p.slug).filter(live)
const pv = Object.fromEntries(photos.map(s => [s, K.itemVector(PS, s)])), qv = Object.fromEntries(poems.map(s => [s, K.itemVector(QS, s)]))
const dist = (a, b) => K.weightedDistance(a, b)

// 21's readings: each poem's strongest lines, the ideas they hold
const readings = {}; let cur = null
for (const raw of readFileSync(path.join(ROOT, 'studies/21/readings.txt'), 'utf8').split('\n')) {
  if (raw.startsWith('@ ')) { cur = raw.slice(2).trim(); readings[cur] = []; continue }
  if (!cur || !raw.trim() || raw.startsWith('#') || /^\s+note:/.test(raw)) continue
  const [phrase, tags] = raw.split(' | '); if (tags) readings[cur].push({ phrase: phrase.trim().replace(/\\n/g, '\n'), concepts: tags.trim().split(/\s+/) })
}
const poemConcepts = s => [...new Set((readings[s] || []).flatMap(l => l.concepts))]

// regions: kin.py's cells and 28's kin distance (weights at 28's defaults, 1 each)
const kinD = (f, c, mf, mc) => { const [L, a, b, con, ho, ve, de] = c, [L0, a0, b0, con0, ho0, ve0, de0] = f
  const tone = Math.hypot((L0 - L) / 12, (con0 - con) / 8), col = mf && mc ? 0 : mf || mc ? .8 : Math.hypot(a0 - a, b0 - b) / 10
  return tone + col + 2 * (Math.abs(ho0 - ho) + Math.abs(ve0 - ve)) + Math.abs(de0 - de) / Math.max(1, (de0 + de) / 2) }
const COLS = KIN.grid[0]
const pos = i => { const r = Math.floor(i / COLS), c = i % COLS, v = r === 0 ? 'top' : r === KIN.grid[1] - 1 ? 'bottom' : 'middle', h = c < 2 ? 'left' : c < 4 ? 'centre' : 'right'
  return v === 'middle' && h === 'centre' ? 'centre' : v + ' ' + h }

// the season score read back into the days of the year it fits (pick.js: a cosine peaking on day 172, 21 June)
const MONTHS = 'January February March April May June July August September October November December'.split(' ')
const doyDate = d => { const t = new Date(Date.UTC(2026, 0, 1) + (Math.round(d) - 1) * 864e5); return t.getUTCDate() + ' ' + MONTHS[t.getUTCMonth()] }
const seasonDays = s => { if (s >= .985) return ['21 June']; if (s <= .015) return ['21 December']
  const off = Math.acos(2 * s - 1) * 365.25 / (2 * Math.PI); return [doyDate(((172 - off) + 365) % 365 || 365), doyDate((172 + off) % 365 || 365)].sort((a, b) => MONTHS.indexOf(a.split(' ')[1]) - MONTHS.indexOf(b.split(' ')[1])) }
// the other axes read back into weather by pick.js's own live rules (dayVectorFromCurrent), run backwards
const waits = v => ({ night: v.light <= .15, cloud: Math.round(v.light <= .15 ? (1 - v.light / .15) * 100 : (1 - v.light) * 100), c: Math.round(35 * v.warmth - 5), mm: r1(v.wet * 10), wind: Math.round(40 * (1 - v.stillness)), days: seasonDays(v.season) })

const placeOf = s => PS.photos[s].place.name, monthOf = s => KIN.photos[s].when
const count = (list, f) => list.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {})
const placeN = count(photos, placeOf), monthN = count(photos, monthOf)
const rankIn = (m, k) => 1 + Object.values(m).filter(n => n > m[k]).length

const out = {}
for (const s of photos) {
  const v = pv[s], others = photos.filter(o => o !== s), byD = others.map(o => [o, dist(v, pv[o])]).sort((a, b) => a[1] - b[1])
  const ext = ['light', 'warmth', 'wet', 'stillness', 'season'].map(ax => { const sorted = photos.slice().sort((a, b) => pv[b][ax] - pv[a][ax]), hi = photos.filter(o => pv[o][ax] > v[ax]).length, lo = photos.filter(o => pv[o][ax] < v[ax]).length
    const end = hi <= lo ? 'high' : 'low', rank = end === 'high' ? hi + 1 : lo + 1, i = sorted.indexOf(s)
    return { axis: ax, v: r2(v[ax]), end, rank, ties: photos.filter(o => o !== s && pv[o][ax] === v[ax]).length, nb: [sorted[i - 1], sorted[i + 1]].filter(Boolean).filter(o => pv[o][ax] !== v[ax]) } }).sort((a, b) => a.rank - b.rank || a.ties - b.ties)
  const gap = AX.filter(a => a !== 'mood').map(a => [a, Math.abs(v[a] - pv[byD.at(-1)[0]][a])]).sort((a, b) => b[1] - a[1])[0]
  // regions: every one of its 24 against every region of the other 76
  const mine = KIN.photos[s], mono = mine.mono
  let best = null; const kin = []
  for (const o of others) { const th = KIN.photos[o]; let pb = Infinity, sum = 0
    for (let i = 0; i < mine.cells.length; i++) { let ci = Infinity, cj = -1
      for (let j = 0; j < th.cells.length; j++) { const d = kinD(mine.cells[i], th.cells[j], mono, th.mono); if (d < ci) { ci = d; cj = j } }
      sum += ci; if (ci < pb) pb = ci; if (!best || ci < best.d) best = { src: o, mine: i, theirs: cj, d: ci } }
    kin.push({ src: o, d: r2(sum / mine.cells.length) }) }
  kin.sort((a, b) => a.d - b.d)
  const qd = poems.map(q => ({ slug: q, d: r2(dist(v, qv[q])) })).sort((a, b) => a.d - b.d)
  const slug = s.split('/').pop().replace(/\.[a-z]+$/i, ''), concepts = mine.concepts
  const share = poems.map(q => ({ slug: q, n: poemConcepts(q).filter(c => concepts.includes(c)).length })).filter(x => x.n).sort((a, b) => b.n - a.n || (a.slug < b.slug ? -1 : 1))
  const mc = mine.cells[best.mine], tc = KIN.photos[best.src].cells[best.theirs]
  out[s] = {
    vec: Object.fromEntries(AX.map(a => [a, r2(v[a])])), hour: PS.photos[s].hour,
    place: placeOf(s), placeN: placeN[placeOf(s)], placeRank: rankIn(placeN, placeOf(s)), samePlace: others.filter(o => placeOf(o) === placeOf(s)),
    month: monthOf(s), monthN: monthN[monthOf(s)], monthRank: rankIn(monthN, monthOf(s)), sameMonth: others.filter(o => monthOf(o) === monthOf(s)),
    twin: { src: byD[0][0], d: r2(byD[0][1]) }, second: { src: byD[1][0], d: r2(byD[1][1]) }, opposite: { src: byD.at(-1)[0], d: r2(byD.at(-1)[1]), axis: gap[0], gap: r2(gap[1]) },
    within: byD.filter(x => x[1] <= .25).length, ext: ext.slice(0, 3), waits: waits(v),
    concepts, note: IDEAS.photo_notes[slug] || null, poemsShare: share.slice(0, 8).map(x => ({ slug: x.slug, n: x.n })), shareAll: share.filter(x => x.n === concepts.length).length,
    region: { src: best.src, mine: pos(best.mine), theirs: pos(best.theirs), d: r2(best.d), tone: [Math.round(mc[0]), Math.round(tc[0])], contrast: [Math.round(mc[3]), Math.round(tc[3])] },
    kin: kin.slice(0, 10), poemsNear: qd.slice(0, 10), within30: qd.filter(x => x.d <= .3).length
  }
}
const poemOut = {}
for (const q of poems) {
  const pd = photos.map(s => ({ src: s, d: r2(dist(qv[q], pv[s])) })).sort((a, b) => a.d - b.d)
  poemOut[q] = { concepts: poemConcepts(q), lines: (readings[q] || []).slice(0, 4), photosNear: pd.slice(0, 8) }
}
writeFileSync(path.join(HERE, 'yields.json'), JSON.stringify({ made_by: 'studies/30/build.mjs',
  from: ['v2/data.json', 'v2/scores-photos.json', 'v2/scores-poems.json', 'v2/pick.js', 'studies/28/kin.json', 'studies/21/ideas.json', 'studies/21/readings.txt'],
  scored_at: PS.scored_at, counts: { photos: photos.length, poems: poems.length, places: Object.keys(placeN).length, months: Object.keys(monthN).length, regions: KIN.photos[photos[0]].cells.length },
  photos: out, poems: poemOut }))
console.log(`${photos.length} photographs, ${poems.length} poems, ${Object.keys(placeN).length} places; regions compared: ${photos.length} x ${photos.length - 1} x ${24 * 24}`)
