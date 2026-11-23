/* studies/35/moment.js — what the moment is, read through /v2/pick.js's own parts, for the first seconds of the stone.
   Nothing here scores by rules of its own: the day's measures are pick.js's dayVectorFromCurrent; each work's are its
   itemVector; closeness is weightedDistance; the place lift placeBonus; ties tiebreak; the novelty window and penalty are
   read out of pick.js's source. What it adds is one question asked of every signal the pick reads: take this signal away
   (a measure to the middle, the value pick.js gives a measure it cannot read; the place's coordinates dropped; the kept
   days forgotten) and how much does the pair in front of the visitor lose against the best of the rest? The signal whose
   absence costs most is the one that decided. No live sky, no reading: read() returns null and nothing is shown.
   S35M.read(ctx, held) -> { day, reading, signals, decisive, counts } | null */
(function (root) {
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside']   // mood is never inferred (pick.js holds it at 0.5)
  const SIGNALS = [...AX, 'place', 'memory']

  function rules(src) {
    const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(src), pen = /NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(src)
    return nov && pen ? { win: { poem: +nov[1], photo: +nov[2] }, pen: +pen[1] } : null
  }
  const shift = (iso, d) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + d * 864e5).toISOString().slice(0, 10)
  function recent(days, kind, iso, win) { // pick.js's recentlyShown
    const s = new Set(); if (!days || !days.days) return s
    const cut = shift(iso, -win)
    for (const [d, e] of Object.entries(days.days)) if (/^\d{4}-\d\d-\d\d$/.test(d) && d >= cut && d < iso && e && e[kind]) s.add(e[kind])
    return s
  }
  // every work's score exactly as pickBest adds it up
  function scores(T, R, kind, items, key, day, sc, iso, days, lat, lon) {
    const seen = recent(days, kind, iso, R.win[kind])
    return items.map(it => { const k = it[key]; let s = -T.weightedDistance(day, T.itemVector(sc, k))
      if (kind === 'photo') s += T.placeBonus(((sc && sc.photos && sc.photos[k]) || {}).place, lat, lon)
      if (seen.has(k)) s += R.pen
      return { k, s: s + T.tiebreak(iso, k) } })
  }
  const margin = (list, k) => { const own = list.find(x => x.k === k); let best = -Infinity; for (const x of list) if (x.k !== k && x.s > best) best = x.s; return own ? own.s - best : 0 }
  const rankOf = (list, k) => 1 + list.filter(x => x.k !== k && x.s > (list.find(y => y.k === k) || { s: Infinity }).s).length

  function core({ T, src, data, ps, qs, days, iso, reading, photo, poem }) {
    const R = rules(src); if (!R || !reading || reading.weather_code == null || reading.temperature_2m == null) return null
    const lat = reading.lat ?? null, lon = reading.lon ?? null, day = T.dayVectorFromCurrent(iso, reading, lat)
    const run = (d, la, lo, dd) => ({ ph: scores(T, R, 'photo', data.photos, 'src', d, ps, iso, dd, la, lo), po: scores(T, R, 'poem', data.poems, 'slug', d, qs, iso, dd, null, null) })
    const base = run(day, lat, lon, days), m0 = { photo: margin(base.ph, photo), poem: margin(base.po, poem) }
    const signals = SIGNALS.map(sig => {
      const r = AX.includes(sig) ? run({ ...day, [sig]: .5 }, lat, lon, days) : sig === 'place' ? run(day, null, null, days) : run(day, lat, lon, null)
      const m = { photo: margin(r.ph, photo), poem: margin(r.po, poem) }
      return { key: sig, cost: (m0.photo - m.photo) + (m0.poem - m.poem), photoCost: m0.photo - m.photo, poemCost: m0.poem - m.poem,
        photoRank: rankOf(r.ph, photo), poemRank: rankOf(r.po, poem) }
    })
    const decisive = signals.reduce((a, b) => b.cost > a.cost ? b : a)
    return { iso, day, reading, signals, decisive, rank: { photo: rankOf(base.ph, photo), poem: rankOf(base.po, poem) }, counts: { photos: data.photos.length, poems: data.poems.length } }
  }

  async function read(ctx, held) {
    if (ctx.how !== 'live') return null // a kept day or the date's hash: no live sky was read, so nothing is shown as read
    const K = root.kahranPick, T = K && K.__test; if (!T || !T.state.photoScores || !T.state.poemScores) return null
    const src = await fetch('/v2/pick.js', { cache: 'no-cache' }).then(r => r.text()).catch(() => '')
    return core({ T, src, data: ctx.data, ps: T.state.photoScores, qs: T.state.poemScores, days: T.state.days, iso: ctx.iso, reading: ctx.reading, photo: held.photo, poem: held.poem })
  }
  root.S35M = { read, core, AX, SIGNALS }
})(typeof window !== 'undefined' ? window : globalThis)
