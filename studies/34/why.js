/* studies/34/why.js (31's, copied unchanged but for its global name) — the whole decision behind today's photograph and poem, worked out live from /v2/pick.js's own parts.
   Nothing here scores by its own rules. The day's seven measures come from pick.js's dayVectorFromCurrent (live) or
   dayVectorFromWhy (a kept day); every work's measures from its itemVector; closeness from weightedDistance; the place
   lift from placeBonus and haversineKm; exact ties from tiebreak (a SHA-256 digest of the date and the work). The weights
   are read back out of weightedDistance one measure at a time; the windows, lifts and code tables out of pick.js's source;
   the live fields out of weather.js's source; how presence is read, in the site's own words, out of home.js. The counts
   are counted here, from the same files the home reads. check.mjs recounts all of it in Node and pins every number shown.
   S34.explain(ctx) -> the model the five ways draw from (ways.js). */
(function () {
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  // the ends of each measure; pick.js decides which end is 1 (stillness 1 = calm, inside 1 = out of doors)
  const ENDS = { light: ['dark', 'bright'], warmth: ['cold', 'warm'], wet: ['dry', 'wet'], stillness: ['wind', 'calm'],
    season: ['midwinter', 'midsummer'], inside: ['indoors', 'out of doors'], mood: ['grief', 'joy'] }
  const NAMES = { light: 'light', warmth: 'warmth', wet: 'wet', stillness: 'calm', season: 'season', inside: 'out of doors', mood: 'mood' }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const text = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '')
  const json = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)

  let SRC = null
  async function sources() { // the rules, each from its one home
    if (SRC) return SRC
    const [pick, weather, home, place] = await Promise.all([text('/v2/pick.js'), text('/v2/weather.js'), text('/v2/home.js'), json('/v2/place.json')])
    const num = re => { const m = re.exec(pick); return m ? +m[1] : null }
    const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(pick)
    const block = name => { const m = new RegExp(name + '\\s*=\\s*\\{([\\s\\S]*?)\\}').exec(pick); return m ? (m[1].match(/\d+\s*:/g) || []).length : null }
    const rule = { win: nov ? { poem: +nov[1], photo: +nov[2] } : null, pen: num(/NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/),
      nearKm: num(/PLACE_BONUS_NEAR_KM\s*=\s*(\d+)/), farKm: num(/PLACE_BONUS_FAR_KM\s*=\s*(\d+)/),
      near: num(/PLACE_BONUS_NEAR\s*=\s*([\d.]+)/), far: num(/PLACE_BONUS_FAR\s*=\s*([\d.]+)/),
      peak: num(/SEASON_PEAK_DOY\s*=\s*(\d+)/), wetCodes: block('WET_CODE_FLOORS'), fogCodes: block('FOG_OR_OVERCAST_CODES') }
    rule.fromSource = Object.values(rule).every(v => v != null)
    // the live fields the sky is read on: weather.js's own request
    const fm = /var fields\s*=\s*([\s\S]*?);/.exec(weather), dm = /&daily=([a-z_,]+)/.exec(weather)
    const fields = fm ? [...fm[1].matchAll(/"([^"]*)"/g)].map(m => m[1]).join('').split(',').filter(Boolean) : []
    const daily = dm ? dm[1].split(',').filter(Boolean) : []
    // how presence is read, in the site's own words (home.js IDEAS)
    let presence = null, shown = null
    try {
      const IDEAS = new Function(home.slice(home.indexOf('var IDEAS = '), home.indexOf('var WALL_ROWS')) + '; return IDEAS')()
      const ctxI = IDEAS.find(i => i.parts.includes('Where I am')), homeI = IDEAS.find(i => i.parts.includes('This page'))
      presence = ctxI.detail.tools[ctxI.parts.indexOf('Where I am')]
      shown = homeI.detail.boundary.split(/(?<=\.)\s+/).find(s => /city/.test(s)) || null
    } catch {}
    SRC = { rule, fields, daily, presence, shown, place }
    return SRC
  }

  const weightsOf = T => { const z = {}; AX.forEach(a => z[a] = 0); return Object.fromEntries(AX.map(a => [a, T.weightedDistance({ ...z, [a]: 1 }, z) ** 2])) }
  const shift = (iso, d) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + d * 864e5).toISOString().slice(0, 10)
  const nice = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[m - 1] + ' ' + y }
  function seenOn(days, kind, key, iso, win) { // the last day inside the window this was on the home (pick.js's recentlyShown, kept per key)
    let last = null; const cut = shift(iso, -win)
    for (const [d, e] of Object.entries((days && days.days) || {})) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e && e[kind] === key && (!last || d > last)) last = d
    return last
  }

  function rank(kind, items, keyField, day, scores, iso, lat, lon, days, W, T, rule) {
    const out = items.map((item, i) => {
      const key = item[keyField], vec = T.itemVector(scores, key), dist = T.weightedDistance(day, vec)
      const parts = Object.fromEntries(AX.map(a => [a, W[a] * (day[a] - vec[a]) ** 2]))
      let place = null, bonus = 0
      if (kind === 'photo') { const e = (scores && scores.photos && scores.photos[key]) || {}
        bonus = T.placeBonus(e.place, lat, lon)
        place = e.place && e.place.lat != null ? { name: e.place.name, km: lat != null && lon != null ? T.haversineKm(lat, lon, e.place.lat, e.place.lon) : null } : null }
      const seen = seenOn(days, kind, key, iso, rule.win[kind]), nov = seen ? rule.pen : 0, tie = T.tiebreak(iso, key)
      return { i, key, item, vec, dist, parts, place, bonus, seen, nov, tie, score: -dist + bonus + nov + tie }
    })
    out.sort((a, b) => b.score - a.score || a.i - b.i) // pickBest keeps the first of equals; a stable sort keeps that order
    const feel = out.slice().sort((a, b) => a.dist - b.dist || a.i - b.i)
    out.forEach((x, r) => { x.rank = r + 1; x.feelRank = feel.indexOf(x) + 1 })
    return out
  }

  // what the moment asks for, in words, from the measure's own value (fifths of the scale between its two ends)
  const STEPS = { light: ['dark', 'dim', 'half-lit', 'bright', 'full sun'], warmth: ['bitter', 'cold', 'mild', 'warm', 'hot'], wet: ['dry', 'damp', 'wet', 'wet', 'soaked'],
    stillness: ['a gale', 'windy', 'a breeze', 'calm', 'still'], season: ['near midwinter', 'the cold half', 'between', 'the warm half', 'near midsummer'],
    inside: ['indoors', 'mostly in', 'either', 'mostly out', 'out of doors'] }
  const stepOf = (a, v) => a === 'mood' ? 'not inferred' : STEPS[a][Math.min(4, Math.floor(v * 5))]

  function corpus(data, ps, qs, days) { // the work done before anyone arrived, counted
    const photos = data.photos.filter(p => ps && ps.photos && ps.photos[p.src]), poems = data.poems.filter(p => qs && qs.poems && qs.poems[p.slug])
    const entries = [...photos.map(p => ps.photos[p.src]), ...poems.map(p => qs.poems[p.slug])]
    const places = new Set(photos.map(p => ps.photos[p.src].place && ps.photos[p.src].place.name).filter(Boolean))
    const kept = Object.keys((days && days.days) || {}).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort()
    return { scoredPhotos: photos.length, scoredPoems: poems.length, scored: entries.length, judgements: entries.reduce((s, e) => s + AX.filter(a => typeof e[a] === 'number').length, 0),
      located: photos.filter(p => (ps.photos[p.src].place || {}).lat != null).length, places: places.size, kept: kept.length, since: kept[0] || null }
  }

  async function explain(ctx) {
    const S = await sources()
    const K = window.kahranPick, T = K && K.__test, reading = ctx.reading || {}, iso = ctx.iso, data = ctx.data
    const C = corpus(data, T && T.state.photoScores, T && T.state.poemScores, ctx.days)
    const base = { mode: ctx.how, iso, date: nice(iso), place: reading.place || (S.place && S.place.place) || null, line: (document.getElementById('where') || {}).textContent || '',
      photo: ctx.photo, poem: ctx.poem, AX, ENDS, NAMES, rule: S.rule, src: S, C, stepOf }
    base.N = { photos: data.photos.length, poems: data.poems.length, candidates: data.photos.length + data.poems.length, measures: AX.length, ...C,
      skyFields: S.fields.length, skyDaily: S.daily.length, wetCodes: S.rule.wetCodes, fogCodes: S.rule.fogCodes,
      winPhoto: S.rule.win && S.rule.win.photo, winPoem: S.rule.win && S.rule.win.poem, nearKm: S.rule.nearKm, farKm: S.rule.farKm }
    if (!T || ctx.how === 'hash') return base
    const W = weightsOf(T), st = T.state
    let day, lat = null, lon = null, frozen = null
    if (ctx.how === 'live') { lat = reading.lat ?? null; lon = reading.lon ?? null; day = T.dayVectorFromCurrent(iso, reading, lat) }
    else { frozen = ctx.days && ctx.days.days && ctx.days.days[iso]; if (!frozen || !frozen.why) return { ...base, mode: 'hash' }; day = T.dayVectorFromWhy(frozen.why) }
    const t0 = performance.now()
    const photos = rank('photo', data.photos, 'src', day, st.photoScores, iso, lat, lon, ctx.days, W, T, S.rule)
    const poems = rank('poem', data.poems, 'slug', day, st.poemScores, iso, null, null, ctx.days, W, T, S.rule)
    const ms = performance.now() - t0
    const m = { ...base, day, W, lat, lon, ms, frozen: frozen && frozen.why, photos, poems,
      reading: ctx.how === 'live' ? { temp: reading.temperature_2m, cloud: reading.cloud_cover, wind: reading.wind_speed_10m, isDay: reading.is_day !== 0,
        precip: reading.precipitation || 0, rain: reading.rain || 0, showers: reading.showers || 0, snow: reading.snowfall || 0, code: reading.weather_code,
        sunset: reading.sunset, sunrise: reading.sunrise, tz: reading.tz, away: !!reading.away } : null }
    if (frozen) { // the kept pair was chosen at day's end from the whole day's record; it leads, never a winner this page guessed
      const lead = (R, key) => { const k = R.find(x => x.key === key); return k ? [k, ...R.filter(x => x !== k)] : R }
      m.photos = lead(photos, ctx.photo.src); m.poems = lead(poems, ctx.poem.slug) }
    const located = photos.filter(x => x.place && x.place.km != null)
    Object.assign(m.N, {
      comparisons: (photos.length + poems.length) * AX.length, distances: located.length, near: photos.filter(x => x.bonus === S.rule.near && x.bonus > 0).length,
      far: photos.filter(x => x.bonus === S.rule.far && x.bonus > 0).length, setPhotos: photos.filter(x => x.seen).length, setPoems: poems.filter(x => x.seen).length,
      digests: photos.length + poems.length, farthest: located.length ? Math.round(Math.max(...located.map(x => x.place.km))) : 0,
      nearestKm: located.length ? Math.round(Math.min(...located.map(x => x.place.km))) : 0,
      photoFeel: m.photos[0].feelRank, poemFeel: m.poems[0].feelRank })
    m.N.setBack = m.N.setPhotos + m.N.setPoems
    if (ctx.how === 'live') m.signals = signals(m, data, st, ctx.days, W, T, S.rule, reading)
    m.N.signals = m.signals ? m.signals.length : 0
    m.F = { photoLift: m.photos[0].bonus, photoGap: m.photos[0].score - m.photos[1].score, poemGap: m.poems[0].score - m.poems[1].score, photoDist: m.photos[0].dist, poemDist: m.poems[0].dist }
    AX.forEach(a => { m.F['day_' + a] = day[a]; m.F['w_' + a] = W[a] })
    m.agrees = m.photos[0].key === ctx.photo.src && m.poems[0].key === ctx.poem.slug
    return m
  }

  /* What each signal did: the pick run again with that one signal taken away, everything else as it was. Taking a measure
     away sets it to the middle, the value pick.js itself gives a measure it cannot read; taking the place away drops the
     coordinates; taking the memory away forgets the kept days. Only signals the computation reads are listed. */
  function signals(m, data, st, days, W, T, rule, reading) {
    const r = m.reading, out = []
    const win = (day, lat, lon, dd) => ({ photo: rank('photo', data.photos, 'src', day, st.photoScores, m.iso, lat, lon, dd, W, T, rule)[0].key,
      poem: rank('poem', data.poems, 'slug', day, st.poemScores, m.iso, null, null, dd, W, T, rule)[0].key })
    const add = (key, label, value, w) => out.push({ key, label, value, photo: w.photo, poem: w.poem, movesPhoto: w.photo !== m.photos[0].key, movesPoem: w.poem !== m.poems[0].key })
    const without = a => ({ ...m.day, [a]: .5 })
    add('place', 'where', m.place, win(m.day, null, null, days))
    add('light', 'light', (r.isDay ? 'daylight' : 'after dark') + ', ' + r.cloud + '% cloud', win(without('light'), m.lat, m.lon, days))
    add('warmth', 'warmth', deg(r.temp), win(without('warmth'), m.lat, m.lon, days))
    add('wet', 'wet', Math.max(r.precip, r.rain, r.showers, r.snow).toFixed(1) + ' mm', win(without('wet'), m.lat, m.lon, days))
    add('stillness', 'calm', r.wind + ' km/h' + (r.away ? ', away' : ''), win(without('stillness'), m.lat, m.lon, days))
    add('season', 'season', nice(m.iso), win(without('season'), m.lat, m.lon, days))
    add('inside', 'out of doors', 'wet and cold together', win(without('inside'), m.lat, m.lon, days))
    add('memory', 'memory', Object.keys((days && days.days) || {}).length + ' kept days', win(m.day, m.lat, m.lon, null))
    return out
  }

  const km = k => Math.round(k).toLocaleString('en-US')
  const clock = s => s ? s.slice(11, 16) : null
  const deg = t => (Math.round(t * 10) / 10).toFixed(1) + ' °C'
  const where = p => String(p.caption || '').split(' — ')[0] || null
  window.S34 = { explain, km, clock, deg, where, nice, stepOf }
})()
