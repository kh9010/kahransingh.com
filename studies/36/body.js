/* studies/36/body.js (34's, copied unchanged) — everything the site has analysed about the works it chooses from, each piece labelled by what it did today.
   The pieces are read from their one home (v2/ for the pick's inputs; studies/21 for the reading by hand, the ideas and the doors;
   studies/15 for the earlier vocabularies; studies/26 for each photograph region by region; studies/13 for whole-frame colour and
   composition). Nothing is typed in: every count is counted here, from the files.
   What a piece did is tested, never asserted:
     moved   — take it away (a measure set to the middle, a field deleted, the memory forgotten) and pick.js's own pickBest
               chooses a different photograph or poem;
     weighed — take it away and the scores change, but pickBest still chooses the same two;
     stone   — it decided something on today's stone: a door line on it, the idea a door carries, where a door leads;
     unused  — take it away and no score moves and nothing on the stone changes.
   S34B.build(m, ctx, DJ, doors) -> adds m.B (groups of pieces) and its counts to m.N. check.mjs recounts all of it in Node. */
(function () {
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  const NAMES = { light: 'light', warmth: 'warmth', wet: 'wet', stillness: 'calm', season: 'season', inside: 'out of doors', mood: 'mood' }
  const STATUS = { moved: 'moved the pick', stone: 'shaped the stone and doors', weighed: 'weighed; the pick held without it', unused: 'read; did not count today' }
  const RANK = { moved: 3, stone: 2, weighed: 1, unused: 0 }
  const text = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '')
  const json = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
  const clone = o => o == null ? o : JSON.parse(JSON.stringify(o))
  const nums = v => typeof v === 'number' ? 1 : Array.isArray(v) ? v.reduce((s, x) => s + nums(x), 0) : 0
  const stem = src => src.split('/').pop().replace(/\.[a-z]+$/i, '')

  let SRC = null
  async function sources() {
    if (SRC) return SRC
    const [ideas, readings, d15, kin, feat] = await Promise.all([json('/studies/21/ideas.json'), text('/studies/21/readings.txt'),
      json('/studies/15/doors.json'), json('/studies/26/kin.json'), json('/studies/13/features.json')])
    SRC = { ideas, readings, d15, kin, feat }
    return SRC
  }

  // the hand reading: '@ slug' then 'phrase | concept concept', '  note:' lines
  function parseReadings(t) {
    const poems = {}; let cur = null, notes = 0
    for (const line of (t || '').split('\n')) {
      if (line.startsWith('#')) continue
      const at = /^@ (\S+)/.exec(line); if (at) { cur = poems[at[1]] = []; continue }
      if (/^\s+note:/.test(line)) { notes++; continue }
      const bar = line.indexOf(' | '); if (cur && bar > 0) cur.push({ phrase: line.slice(0, bar).trim(), concepts: line.slice(bar + 3).trim().split(/\s+/).filter(Boolean) })
    }
    return { poems, notes }
  }

  async function build(m, ctx, DJ, doors) {
    if (m.B) return m
    const S = await sources(), T = window.kahranPick && window.kahranPick.__test, live = !!(T && m.day && m.mode === 'live')
    const data = ctx.data, days = ctx.days, PS = T && T.state.photoScores, QS = T && T.state.poemScores
    const photos = data.photos, poems = data.poems
    const pe = src => (PS && PS.photos && PS.photos[src]) || {}, qe = slug => (QS && QS.poems && QS.poems[slug]) || {}
    const R = parseReadings(S.readings), today = m.poem && m.poem.slug

    /* ---------- what each piece did: pick.js run with it taken away ---------- */
    const base = live ? { day: m.day, lat: m.lat, lon: m.lon, ps: PS, qs: QS, days, data } : null
    const shownIn = (dd, kind, win) => { const s = new Set(), cut = new Date(Date.parse(m.iso + 'T00:00:00Z') - win * 864e5).toISOString().slice(0, 10)
      for (const [d, e] of Object.entries((dd && dd.days) || {})) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < m.iso && e && e[kind]) s.add(e[kind]); return s }
    const scores = I => { const sp = shownIn(I.days, 'photo', m.rule.win.photo), sq = shownIn(I.days, 'poem', m.rule.win.poem)
      return [...I.data.photos.map(p => -T.weightedDistance(I.day, T.itemVector(I.ps, p.src)) + T.placeBonus(((I.ps && I.ps.photos && I.ps.photos[p.src]) || {}).place, I.lat, I.lon) + (sp.has(p.src) ? m.rule.pen : 0)),
        ...I.data.poems.map(p => -T.weightedDistance(I.day, T.itemVector(I.qs, p.slug)) + (sq.has(p.slug) ? m.rule.pen : 0))] }
    const pickOf = I => ({ photo: T.pickBest(I.data.photos, 'src', I.day, I.ps, m.iso, 'photo', I.days, I.lat, I.lon), poem: T.pickBest(I.data.poems, 'slug', I.day, I.qs, m.iso, 'poem', I.days, null, null) })
    const P0 = live && pickOf(base), S0 = live && scores(base)
    function test(change) { // change(I) mutates a copy of the inputs; returns the status and what would have been chosen
      if (!live) return { status: null }
      const I = { ...base }; change(I)
      const p = pickOf(I), s = scores(I), moved = p.photo !== P0.photo || p.poem !== P0.poem, weighed = s.some((v, i) => Math.abs(v - S0[i]) > 1e-12)
      return { status: moved ? 'moved' : weighed ? 'weighed' : 'unused', photo: p.photo, poem: p.poem }
    }
    const stripScores = (doc, kind, f) => { const c = clone(doc); if (c && c[kind]) for (const k in c[kind]) delete c[kind][k][f]; return c }
    const middle = a => I => { I.day = { ...I.day, [a]: .5 } }

    /* ---------- what shaped today's stone ---------- */
    const DS = (doors || []).filter(Boolean), his = DJ && DJ.vocabs && DJ.vocabs.his
    const lines = (R.poems[today] || []).map(x => x.phrase)
    const onStone = DS.length > 0 && DS.every(d => lines.includes(d.phrase))
    const hisWords = new Set(((his && his.words) || []).map(w => w.word)), byHis = DS.length > 0 && DS.every(d => hisWords.has(d.word))
    const stoneIf = ok => live ? (ok ? 'stone' : 'unused') : null

    /* ---------- the pieces ---------- */
    const N = {}, groups = []
    const piece = (g, key, label, n, unit, o = {}) => { N['L_' + key] = n; const p = { key, label, n, unit, ...o }
      if (p.parts) { p.parts.forEach(q => { N['P_' + key + '_' + q.key] = q.n }); p.status = p.parts.reduce((s, q) => q.status && (!s || RANK[q.status] > RANK[s]) ? q.status : s, null) }
      g.items.push(p); return p }
    const group = (key, label) => { const g = { key, label, items: [] }; groups.push(g); return g }

    // now: read live, at this visit
    const g1 = group('now', 'read at this visit')
    piece(g1, 'where', 'where he is', 1, 'city, never a point', { ...test(I => { I.lat = null; I.lon = null }), detail: m.place })
    const FIELDS = { light: ['is_day', 'cloud_cover'], warmth: ['temperature_2m'], wet: ['precipitation', 'rain', 'showers', 'snowfall', 'weather_code'], stillness: ['wind_speed_10m'], inside: [] }
    const skyN = m.src.fields.length
    piece(g1, 'sky', 'the sky over him', skyN, 'live readings', { parts: Object.entries(FIELDS).map(([a, f]) => ({ key: a, label: NAMES[a], n: f.filter(x => m.src.fields.includes(x)).length, ...test(middle(a)) })) })
    piece(g1, 'season', 'the season, from the date', 1, 'date', { ...test(middle('season')) })
    piece(g1, 'sun', 'sunrise and sunset', m.src.daily.length, 'times', { ...test(I => { const r = { ...ctx.reading }; delete r.sunrise; delete r.sunset; I.day = T.dayVectorFromCurrent(m.iso, r, m.lat) }),
      sunrise: ctx.reading && ctx.reading.sunrise, sunset: ctx.reading && ctx.reading.sunset })
    const kept = Object.keys((days && days.days) || {}).filter(d => /^\d{4}-\d\d-\d\d$/.test(d))
    piece(g1, 'memory', 'the pairs already shown', kept.length, 'days kept', { ...test(I => { I.days = null }) })
    const whyVals = kept.reduce((s, d) => s + nums(Object.values((days.days[d] || {}).why || {})), 0)
    piece(g1, 'keptWhy', 'each kept day’s measures and weather', whyVals, 'values', { ...test(I => { const c = clone(I.days); for (const d in c.days) delete c.days[d].why; I.days = c }) })

    // the works, read before anyone arrived
    const g2 = group('works', 'read before anyone arrived')
    const axisN = (list, get, a) => list.filter(x => typeof get(x)[a] === 'number').length
    piece(g2, 'photoM', 'the photographs’ seven measures', AX.reduce((s, a) => s + axisN(photos, p => pe(p.src), a), 0), 'measures',
      { parts: AX.map(a => ({ key: a, label: NAMES[a], n: axisN(photos, p => pe(p.src), a), ...test(I => { I.ps = stripScores(I.ps, 'photos', a) }) })) })
    piece(g2, 'poemM', 'the poems’ seven measures', AX.reduce((s, a) => s + axisN(poems, p => qe(p.slug), a), 0), 'measures',
      { parts: AX.map(a => ({ key: a, label: NAMES[a], n: axisN(poems, p => qe(p.slug), a), ...test(I => { I.qs = stripScores(I.qs, 'poems', a) }) })) })
    piece(g2, 'places', 'where each photograph was taken', photos.filter(p => (pe(p.src).place || {}).lat != null).length, 'places pinned', { ...test(I => { I.ps = stripScores(I.ps, 'photos', 'place') }) })
    piece(g2, 'hour', 'the hour each work holds', photos.filter(p => pe(p.src).hour).length + poems.filter(p => qe(p.slug).hour).length, 'hours',
      { ...test(I => { I.ps = stripScores(I.ps, 'photos', 'hour'); I.qs = stripScores(I.qs, 'poems', 'hour') }) })
    piece(g2, 'photoNotes', 'a note on each photograph', photos.filter(p => pe(p.src).notes).length, 'notes', { ...test(I => { I.ps = stripScores(I.ps, 'photos', 'notes') }) })
    piece(g2, 'poemNotes', 'a note on each poem', poems.filter(p => qe(p.slug).notes).length, 'notes', { ...test(I => { I.qs = stripScores(I.qs, 'poems', 'notes') }) })
    N.D_words = poems.reduce((s, p) => s + (typeof p.words === 'number' ? p.words : 0), 0)
    piece(g2, 'words', 'the length of each poem', poems.filter(p => typeof p.words === 'number').length, 'word counts', { ...test(I => { I.data = { ...I.data, poems: I.data.poems.map(({ words, ...p }) => p) } }) })

    // read by hand: lines, ideas, doors
    const g3 = group('hand', 'read by hand')
    const inPool = new Set(poems.map(p => p.slug)), photoStems = new Set(photos.map(p => stem(p.src)))
    const rl = Object.entries(R.poems).filter(([s]) => inPool.has(s)).flatMap(([, v]) => v)
    N.D_lineTags = rl.reduce((s, x) => s + x.concepts.length, 0); N.D_doorsToday = DS.length
    piece(g3, 'lines', 'door lines, each tagged with its ideas', rl.length, 'lines', { status: stoneIf(onStone) })
    const ties = v => Object.entries(v.poems || {}).filter(([s]) => inPool.has(s)).reduce((s, [, x]) => s + x.length, 0) + Object.entries(v.photos || {}).filter(([s]) => photos.some(p => p.src === s)).reduce((s, [, x]) => s + x.length, 0)
    N.D_hisIdeas = his ? his.words.length : 0
    piece(g3, 'his', 'his own words, the ideas the doors carry', his ? ties(his) : 0, 'ties', { status: stoneIf(byHis && DS.some(d => d.how === 'word' || d.how === 'near')) })
    const pi = (S.ideas && S.ideas.photos) || {}
    piece(g3, 'photoIdeas', 'the ideas in each photograph', Object.entries(pi).filter(([k]) => photoStems.has(k)).reduce((s, [, v]) => s + String(v).split(/\s+/).filter(Boolean).length, 0), 'ideas',
      { status: stoneIf(byHis && DS.some(d => d.phow === 'word' || d.phow === 'near')) })
    const concepts = Object.keys((DJ && DJ.concepts) || {}).length
    piece(g3, 'concepts', 'the underlying ideas, each defined', concepts, 'ideas', { status: stoneIf(byHis && DS.some(d => d.how === 'near' || d.phow === 'near')) })
    const others = Object.entries((DJ && DJ.vocabs) || {}).filter(([k]) => k !== 'his')
    N.D_otherIdeas = others.reduce((s, [, v]) => s + v.words.length, 0)
    piece(g3, 'vocabs', 'three other vocabularies', others.reduce((s, [, v]) => s + ties(v), 0), 'ties', { status: stoneIf(DS.some(d => others.some(([, v]) => v.words.some(w => w.word === d.word)) && !hisWords.has(d.word))) })
    const pn = Object.keys((S.ideas && S.ideas.photo_notes) || {}).filter(k => photoStems.has(k)).length
    piece(g3, 'strains', 'notes where an idea strains against a work', R.notes + pn, 'notes', { status: stoneIf(false) })
    const e15 = Object.values((S.d15 && S.d15.vocabs) || {})
    N.D_earlierWords = e15.reduce((s, v) => s + v.words.length, 0)
    piece(g3, 'earlier', 'an earlier reading: senses and feelings', e15.reduce((s, v) => s + ties(v), 0), 'ties', { status: stoneIf(false) })

    // how each photograph looks
    const g4 = group('eye', 'measured in each photograph')
    const K = (S.kin && S.kin.photos) || {}
    piece(g4, 'regions', 'each photograph, region by region', photos.reduce((s, p) => s + nums((K[p.src] || {}).cells), 0), 'measurements', { status: stoneIf(false) })
    piece(g4, 'months', 'the month each was taken, from its own file', photos.filter(p => (K[p.src] || {}).when).length, 'months', { status: stoneIf(false) })
    const FK = ['L', 'contrast', 'a', 'b', 'chroma', 'hue', 'orient', 'density', 'horizon', 'hstrength', 'layout', 'mass']
    const F = ((S.feat && S.feat.photos) || []).filter(x => photos.some(p => p.src === '/photos/' + x.f))
    N.D_featPhotos = F.length
    piece(g4, 'features', 'colour and composition, whole frame', F.reduce((s, x) => s + FK.reduce((t, k) => t + nums(x[k]), 0), 0), 'measurements', { status: stoneIf(false) })

    // the two chosen, and the date, as the page states them
    const doy = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5) + 1
    N.doy = doy(m.iso); N.peak = m.rule.peak
    const top = m.photos && m.photos[0]
    if (top && top.place && top.place.km != null) N.D_chosenKm = Math.round(top.place.km)
    if (m.photo) N.D_chosenRegions = nums((K[m.photo.src] || {}).cells)

    // the totals, by what each piece did (a piece with parts counts each part under its own status)
    const units = groups.flatMap(g => g.items.flatMap(p => p.parts ? p.parts.map(q => [q.status, q.n]) : [[p.status, p.n]]))
    N.S_all = units.reduce((s, [, n]) => s + n, 0)
    for (const k of Object.keys(STATUS)) N['S_' + k] = live ? units.filter(([s]) => s === k).reduce((t, [, n]) => t + n, 0) : 0
    N.S_pieces = groups.reduce((s, g) => s + g.items.length, 0)
    Object.assign(m.N, N)
    m.B = { groups, live, STATUS, today: { photo: m.photo && pe(m.photo.src), poem: today && qe(today), lines: R.poems[today] || [], kin: m.photo && K[m.photo.src], ideas: m.photo && pi[stem(m.photo.src)] } }
    return m
  }

  window.S34B = { build, STATUS, NAMES }
})()
