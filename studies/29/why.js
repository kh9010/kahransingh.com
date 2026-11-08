/* studies/29/why.js — why THIS photograph and THIS poem today, worked out from /v2/pick.js's own parts.
   Nothing here re-scores by its own rules: the day's seven axes come from pick.js's dayVectorFromCurrent (live) or
   dayVectorFromWhy (the kept day), every candidate's axes from its itemVector, the closeness from its weightedDistance,
   the place lift from its placeBonus and haversineKm, the level-pegging from its tiebreak. The weights are read back
   out of weightedDistance itself (one axis at a time), and the not-seen-lately window and set-back out of pick.js's
   source, so a change there changes the explanation. check.mjs pins the ranking against pick.js's pickFor.
   S29.explain(ctx) -> the model the four ways draw from (see index.html). */
(function () {
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  // the ends of each axis in plain words; the day builder in pick.js decides which end is 1 (stillness 1 = calm, inside 1 = out of doors)
  const ENDS = { light: ['dark', 'bright'], warmth: ['cold', 'warm'], wet: ['dry', 'wet'], stillness: ['windy', 'still'],
    season: ['midwinter', 'midsummer'], inside: ['indoors', 'out of doors'], mood: ['grief', 'joy'] }
  const NAMES = { light: 'light', warmth: 'warmth', wet: 'wet', stillness: 'wind', season: 'season', inside: 'in or out', mood: 'mood' }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  let C = null
  async function constants() { // pick.js's novelty rule, from its one home
    if (C) return C
    C = { win: { poem: 60, photo: 30 }, pen: -1, nearKm: 50, farKm: 500, fromSource: false }
    try {
      const t = await (await fetch('/v2/pick.js')).text()
      const w = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(t), p = /NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(t)
      const nk = /PLACE_BONUS_NEAR_KM\s*=\s*(\d+)/.exec(t), fk = /PLACE_BONUS_FAR_KM\s*=\s*(\d+)/.exec(t)
      if (w && p && nk && fk) C = { win: { poem: +w[1], photo: +w[2] }, pen: +p[1], nearKm: +nk[1], farKm: +fk[1], fromSource: true }
    } catch {}
    return C
  }
  function weightsOf(T) { const z = {}; AX.forEach(a => z[a] = 0); return Object.fromEntries(AX.map(a => [a, T.weightedDistance({ ...z, [a]: 1 }, z) ** 2])) }
  const shift = (iso, d) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + d * 864e5).toISOString().slice(0, 10)
  const nice = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[m - 1] }

  function seenOn(days, kind, key, iso, win) { // the last day inside the window this was on the home (pick.js's recentlyShown, kept per key)
    let last = null; const cut = shift(iso, -win)
    for (const [d, e] of Object.entries((days && days.days) || {})) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e && e[kind] === key && (!last || d > last)) last = d
    return last
  }

  function rank(kind, items, keyField, day, scores, iso, lat, lon, days, W, T) {
    const maxD = Math.sqrt(AX.reduce((s, a) => s + W[a], 0))
    const out = items.map((item, i) => {
      const key = item[keyField], vec = T.itemVector(scores, key), dist = T.weightedDistance(day, vec)
      const parts = Object.fromEntries(AX.map(a => [a, W[a] * (day[a] - vec[a]) ** 2]))
      let place = null, bonus = 0
      if (kind === 'photo') { const e = (scores && scores.photos && scores.photos[key]) || {}
        bonus = T.placeBonus(e.place, lat, lon)
        place = e.place && e.place.lat != null ? { name: e.place.name, km: lat != null && lon != null ? T.haversineKm(lat, lon, e.place.lat, e.place.lon) : null } : null }
      const seen = seenOn(days, kind, key, iso, C.win[kind]), nov = seen ? C.pen : 0, tie = T.tiebreak(iso, key)
      return { i, key, item, vec, dist, near: 1 - dist / maxD, parts, place, bonus, seen, nov, tie, score: -dist + bonus + nov + tie }
    })
    // pickBest keeps the first of equals; a stable sort on score, high first, keeps that order
    return out.sort((a, b) => b.score - a.score || a.i - b.i)
  }

  // what decided it, in order of how much it mattered
  function decider(R) {
    const [w, r] = R, gap = w.score - r.score
    const byFeel = R.slice().sort((a, b) => a.dist - b.dist || a.i - b.i)[0] // closest on the seven alone
    const unseen = R.filter(x => !x.seen).sort((a, b) => (a.dist - a.bonus) - (b.dist - b.bonus) || a.i - b.i)[0]
    if (byFeel.key !== w.key && byFeel.seen && (byFeel.dist - byFeel.bonus) <= (w.dist - w.bonus)) return { why: 'seen', other: byFeel, gap }
    if (byFeel.key !== w.key && w.bonus > byFeel.bonus) return { why: 'place', other: byFeel, gap }
    if (gap < 2e-6) return { why: 'level', other: r, gap }
    if (gap < .02) return { why: 'close', other: r, gap }
    return { why: 'clear', other: r, gap, unseen }
  }

  function lean(day) { // the ends the day leans to, strongest first
    return AX.filter(a => a !== 'mood' && a !== 'inside').map(a => ({ a, d: day[a] - .5 })).filter(x => Math.abs(x.d) >= .18)
      .sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).map(x => ({ axis: x.a, word: ENDS[x.a][x.d > 0 ? 1 : 0], v: day[x.a] }))
  }
  function sharedMost(day, w) { // the axis the winner matches best, among the ones the day is clear about
    const cands = lean(day).map(l => l.axis); if (!cands.length) return null
    return cands.sort((a, b) => Math.abs(day[a] - w.vec[a]) - Math.abs(day[b] - w.vec[b]))[0]
  }

  async function explain(ctx) {
    await constants()
    const K = window.kahranPick, T = K && K.__test, reading = ctx.reading || {}, iso = ctx.iso, data = ctx.data
    const base = { mode: ctx.how, iso, date: nice(iso), place: reading.place || null, line: (document.getElementById('where') || {}).textContent || '',
      photo: ctx.photo, poem: ctx.poem, counts: { photos: data.photos.length, poems: data.poems.length }, ENDS, NAMES, AX, rule: C }
    if (!T || ctx.how === 'hash') return base
    const W = weightsOf(T), st = T.state
    let day, lat = null, lon = null, frozen = null
    if (ctx.how === 'live') { lat = reading.lat ?? null; lon = reading.lon ?? null; day = T.dayVectorFromCurrent(iso, reading, lat) }
    else { frozen = ctx.days && ctx.days.days && ctx.days.days[iso]; if (!frozen || !frozen.why) return { ...base, mode: 'hash' }; day = T.dayVectorFromWhy(frozen.why) }
    const photos = rank('photo', data.photos, 'src', day, st.photoScores, iso, lat, lon, ctx.days, W, T)
    const poems = rank('poem', data.poems, 'slug', day, st.poemScores, iso, null, null, ctx.days, W, T)
    const m = { ...base, day, W, lat, lon, frozen: frozen && frozen.why, photos, poems, lean: lean(day),
      reading: ctx.how === 'live' ? { temp: reading.temperature_2m, cloud: reading.cloud_cover, wind: reading.wind_speed_10m, isDay: reading.is_day !== 0,
        rain: Math.max(reading.precipitation || 0, reading.rain || 0, reading.showers || 0), snow: reading.snowfall || 0, code: reading.weather_code,
        sunset: reading.sunset, sunrise: reading.sunrise, tz: reading.tz, away: !!reading.away } : null }
    if (frozen) { // the kept pair was chosen at day's end by the nightly job; lead with it, never with a winner this page would have guessed
      const lead = (R, key) => { const k = R.find(x => x.key === key); return k ? [k, ...R.filter(x => x !== k)] : R }
      m.photos = lead(photos, ctx.photo.src); m.poems = lead(poems, ctx.poem.slug) }
    m.photoWhy = decider(m.photos); m.poemWhy = decider(m.poems)
    m.photoMatch = sharedMost(day, m.photos[0]); m.poemMatch = sharedMost(day, m.poems[0])
    m.agrees = m.photos[0].key === ctx.photo.src && m.poems[0].key === ctx.poem.slug
    return m
  }

  /* ---------- the words: his register, short, nothing technical ---------- */
  const deg = t => Math.round(t) + '°C'
  const clock = s => { if (!s) return null; const [h, mi] = s.slice(11, 16).split(':').map(Number); return (h % 12 || 12) + ':' + String(mi).padStart(2, '0') }
  const km = k => k == null ? null : k < 1 ? 'less than a kilometre' : k < 10 ? Math.round(k) + ' km' : (Math.round(k / (k < 100 ? 5 : k < 1000 ? 10 : 100)) * (k < 100 ? 5 : k < 1000 ? 10 : 100)).toLocaleString('en-US') + ' km'
  const where = p => String(p.caption || '').split(' — ')[0] || null
  const lc = s => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s
  const title = p => '“' + p.title + '”'
  const and = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]
  function sky(m) { // the line's sky, said once more in a sentence
    const r = m.reading; if (!r) return ''
    const s = (m.line.match(/ and (.*)\.$/) || [, ''])[1].replace(/^it's /, '').replace(/^there's /, 'there is ')
    return s
  }
  function dayWords(m) { return and(m.lean.slice(0, 3).map(l => l.axis === 'season' ? (l.word === 'midwinter' ? 'wintry' : 'summery') : l.word)) }
  function sunWords(m) { const r = m.reading; if (!r) return ''
    if (!r.isDay) { // went down, or not up yet: read against the clock where he is
      let now = null; try { now = new Intl.DateTimeFormat('en-GB', { timeZone: r.tz || 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()) } catch {}
      if (now && r.sunset && now >= r.sunset.slice(11, 16)) return `the sun went down at ${clock(r.sunset)}`
      if (now && r.sunrise && now < r.sunrise.slice(11, 16)) return `the sun is not up until ${clock(r.sunrise)}`
      return 'the sun is down' }
    return r.cloud != null ? (r.cloud < 15 ? 'there is barely a cloud' : r.cloud > 85 ? 'the cloud is thick' : `the sky is ${r.cloud}% cloud`) : '' }
  function placeWords(m, w) {
    if (!w.place || w.place.km == null) return `It was taken in ${where(w.item) || 'a place it does not say'}.`
    if (w.bonus >= .3) return `It was taken ${km(w.place.km)} from here, and the pick favours what is close.`
    if (w.bonus > 0) return `It was taken ${km(w.place.km)} away, near enough to count for a little.`
    return `It was taken in ${where(w.item)}, ${km(w.place.km)} away, so it won on feel alone.`
  }
  function deciderWords(d, kind, w) {
    const name = x => kind === 'photo' ? (x.item.alt || where(x.item)) : title(x.item)
    if (d.why === 'seen') return `${name(d.other)} was even nearer, but it was here on ${nice(d.other.seen)}, and nothing comes back that soon.`
    if (d.why === 'place') return `On feel alone, ${name(d.other)} was a shade nearer. Being close to here is what won it.`
    if (d.why === 'level') return `It was level with ${name(d.other)}, so the date settled it.`
    if (d.why === 'close') return `It was close: ${name(d.other)} came a hair behind.`
    return `Nothing else came close; next was ${name(d.other)}.`
  }
  function fallbackWords(m) {
    if (m.mode === 'frozen' && m.frozen) { const f = m.frozen
      return [`There is no live sky right now, so this is the pair kept for ${m.date}, chosen from the whole day's weather` +
        (f.tmax != null ? `: a high of ${deg(f.tmax)}` : '') + (f.wind_kmh != null ? `, wind to ${Math.round(f.wind_kmh)} km/h` : '') + '.'] }
    return ['No weather reached the page, so the pair comes from the date alone. The same day always gives the same two.',
      'When the sky comes back, the pick follows it again.']
  }
  // the paragraph (way a, and the closing line of b and d)
  function paragraph(m) {
    if (m.mode !== 'live' || !m.photos) return m.mode === 'frozen' && m.photos ? [...fallbackWords(m), `That day leans toward ${dayWords(m)} things. The photograph kept for it is ${lc(m.photo.alt)}; the poem, ${title(m.poem)}.`] : fallbackWords(m)
    const r = m.reading, p = m.photos[0], q = m.poems[0], sun = sunWords(m)
    return [
      `It is ${deg(r.temp)} and ${sky(m)} in ${m.place}${sun ? ', and ' + sun : ''}. So today leaned toward ${dayWords(m)} things.`,
      `Of ${m.counts.photos} photographs, the nearest to that is ${lc(p.item.alt)}. ${placeWords(m, p)} ${deciderWords(m.photoWhy, 'photo', p)}`,
      `Of ${m.counts.poems} poems, the nearest is ${title(q.item)}. ${deciderWords(m.poemWhy, 'poem', q)}`
    ]
  }
  // the reading behind each axis, for the gauges and the line
  function source(m, a) {
    const r = m.reading
    if (a === 'mood') return 'always the middle; rain is not sadness'
    if (!r) { const f = m.frozen || {}
      return { light: f.cloud_pct != null ? `${f.cloud_pct}% cloud over the day` : 'the day’s sun', warmth: f.tmax != null ? `a high of ${deg(f.tmax)}` : 'the day’s high',
        wet: 'the day’s rain', stillness: f.wind_kmh != null ? `wind to ${Math.round(f.wind_kmh)} km/h` : 'the day’s wind', season: m.date, inside: 'rain and cold keep you in' }[a] }
    return { light: (r.isDay ? '' : 'after dark, ') + (r.cloud != null ? r.cloud + '% cloud' : ''), warmth: deg(r.temp), wet: r.rain || r.snow ? `${r.rain || r.snow} mm` : 'no rain',
      stillness: Math.round(r.wind) + ' km/h of wind' + (r.away ? ', and he is away' : ''), season: m.date, inside: 'rain and cold keep you in' }[a]
  }
  window.S29 = { explain, paragraph, source, deciderWords, placeWords, fallbackWords, sunWords, sky, km, deg, clock, where, title, nice }
})()
