/* Study 30: the deck. For one world (a photograph and a poem) and the visitor's context, every yield a facet can give,
   each with the signals it was chosen on, its layers (what a first, second, third tap says) and the world it moves to last.
   One file for the page and for check.mjs (node): nothing is phrased twice.
   S30Deck.make(world, D, ctx) -> { items, judged }      S30Deck.facet(frag, region, world, D, taken) -> one region item
   D:   { data, PS, QS, days, Y, VOC, stanzasOf, K (pick.js __test), here (v2/place.json) }
   ctx: { day (pick.js day vector, from the live sky or the frozen morning) | null, reading | null, today | null,
          local { part, zone, offset } | null, avoid { photos, poems } }                                               */
(function (root) {
  const FILLER = [/\bgr[ae]y sk(y|ies)\b/i, /\b(blue|clear|cloudy|overcast|sunny) sk(y|ies)\b/i, /\b(beautiful|lovely|stunning|nice|pretty|gorgeous)\b/i,
    /\bthis is a (photo|photograph|picture)\b/i, /\bin this (photo|picture)\b/i, /\bleica\b/i, /\bmonochrome\b/i, /^\s*(day|night|dawn|dusk|sky|light|water|trees?)\s*$/i, /\bundefined\b|\bNaN\b|\bnull\b/]
  const BAR = 44 // the least a first tap may say, big and small together, in characters; and it must carry a number
  function judge(item, world, D) { // a yield worth having: specific, grounded, nothing a visitor can see for themselves
    if (item.kind !== 'insight') return null
    const L = item.layers[0], text = (L.big || '') + ' ' + (L.small || ''), all = item.layers.map(l => (l.big || '') + ' ' + (l.small || '')).join(' ')
    if (item.layers.length < 2) return 'one layer'
    if (text.length < BAR) return 'thin'
    if (!/\d/.test(text)) return 'no number'
    const prose = D.data.poems.reduce((t, q) => t.split(q.title).join(' '), all).replace(/\u201c[^\u201d]*\u201d/g, ' ') // his words are his: a title or a quoted line is not the system talking
    const f = FILLER.find(re => re.test(prose)); if (f) return 'filler ' + f
    const ph = D.data.photos.find(p => p.src === world.photo), sc = D.PS.photos[world.photo] || {}
    const seen = [ph && ph.alt, sc.notes && sc.notes.split(',')[0]].filter(Boolean).map(s => s.toLowerCase())
    if (seen.some(s => all.toLowerCase().includes(s))) return 'what the photograph already shows'
    return null }

  const f2 = v => (Math.round(v * 100) / 100).toFixed(2), ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th')
  const MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
  const dmy = iso => { const [, m, d] = iso.split('-'); return +d + ' ' + MON[+m - 1] }
  const AXP = { light: ['the brightest', 'the darkest'], warmth: ['the warmest', 'the coldest'], wet: ['the wettest', 'the driest'], stillness: ['the calmest-aired', 'the windiest'], season: ['the nearest midsummer', 'the nearest midwinter'] }
  const deg = c => (c < 0 ? '\u2212' + -c : c) + '°'
  const skyOf = w => (w.night ? 'night' : 'day') + (w.cloud > 0 ? `, ${w.cloud}% cloud` : ', no cloud')
  const rainOf = mm => mm < .5 ? 'dry' : `${mm} mm of rain`

  function make(world, D, ctx = {}) {
    const P = world.photo, Q = world.poem, y = D.Y.photos[P], v = y.vec, n = D.Y.counts, items = []
    const photo = s => D.data.photos.find(p => p.src === s), poem = s => D.data.poems.find(p => p.slug === s)
    const place = s => D.Y.photos[s] ? D.Y.photos[s].place : ((photo(s) || {}).caption || '').split(' — ')[0]
    const title = s => (poem(s) || {}).title || null
    const avoidP = new Set([P, ...((ctx.avoid && ctx.avoid.photos) || [])]), avoidQ = new Set([Q, ...((ctx.avoid && ctx.avoid.poems) || [])])
    const takenP = new Set(avoidP), takenQ = new Set(avoidQ)
    // the world each yield ends in: a photograph not yet walked or promised, and a poem for it
    const poemFor = src => { const yy = D.Y.photos[src]; const c = [...yy.poemsShare.map(x => x.slug), ...yy.poemsNear.map(x => x.slug), ...D.data.poems.map(p => p.slug)].find(s => D.Y.poems[s] && !takenQ.has(s)); return c }
    const photoFor = slug => [...(D.Y.poems[slug] ? D.Y.poems[slug].photosNear.map(x => x.src) : []), ...y.kin.map(x => x.src), ...D.data.photos.map(p => p.src)].find(s => D.Y.photos[s] && !takenP.has(s))
    const toPhoto = cands => { const src = [...cands, ...y.kin.map(x => x.src), ...D.data.photos.map(p => p.src)].find(s => s && D.Y.photos[s] && !takenP.has(s)); takenP.add(src); const q = poemFor(src); takenQ.add(q); return { photo: src, poem: q } }
    const toPoem = cands => { const q = [...cands, ...y.poemsNear.map(x => x.slug), ...D.data.poems.map(p => p.slug)].find(s => s && D.Y.poems[s] && !takenQ.has(s)); takenQ.add(q); const src = photoFor(q); takenP.add(src); return { photo: src, poem: q } }
    const add = (o, to) => { items.push({ kind: 'insight', score: .5, ...o, to }) }
    const from = ['v2/scores-photos.json', 'v2/pick.js']

    /* ---- scores: what pick.js holds against every morning ---- */
    { const w = y.waits
      add({ key: 'waits', family: 'scores', signals: ['its seven scores', 'pick.js rules'], score: .8, from,
        layers: [{ big: `It waits for ${deg(w.c)}, ${skyOf(w)}, ${rainOf(w.mm)}, wind ${w.wind} km/h`, small: 'its seven scores, run back through the rules that read the sky each morning' },
          { big: `light ${f2(v.light)} · warmth ${f2(v.warmth)} · wet ${f2(v.wet)} · stillness ${f2(v.stillness)}`, small: y.within ? `${y.within} of ${n.photos - 1} others wait for a morning within 0.25 of it` : `none of the other ${n.photos - 1} waits within 0.25 of it; the nearest, ${place(y.twin.src)}, is ${f2(y.twin.d)} off` }] }, toPhoto([y.second.src])) }
    { const t = D.Y.photos[y.twin.src].vec
      add({ key: 'twin', family: 'scores', signals: ['its seven scores', 'all 77 scored'], score: .72, from,
        layers: [{ big: `Its twin in the seven scores: ${place(y.twin.src)}`, small: `${f2(y.twin.d)} apart, the nearest of ${n.photos - 1}: the two contend for the same mornings` },
          { big: `light ${f2(v.light)} / ${f2(t.light)} · warmth ${f2(v.warmth)} / ${f2(t.warmth)} · wet ${f2(v.wet)} / ${f2(t.wet)}`, small: 'this photograph / its twin, as pick.js weighs them' }] }, toPhoto([y.twin.src])) }
    { const o = y.opposite, ov = D.Y.photos[o.src].vec
      add({ key: 'opposite', family: 'scores', signals: ['its seven scores', 'all 77 scored'], score: .6, from,
        layers: [{ big: `Its opposite in the seven scores: ${place(o.src)}`, small: `${f2(o.d)} apart, the farthest of ${n.photos - 1}: no morning suits both` },
          { big: `They part most on ${o.axis}: ${f2(v[o.axis])} against ${f2(ov[o.axis])}`, small: `a gap of ${f2(o.gap)} on one axis of seven` }] }, toPhoto([o.src])) }
    for (const e of y.ext.filter(e => e.rank <= 12).slice(0, 2)) {
      const sup = AXP[e.axis][e.end === 'high' ? 0 : 1], nb = e.nb.map(s => [s, D.Y.photos[s].vec[e.axis]])
      add({ key: 'ext-' + e.axis, family: 'scores', signals: ['its seven scores', 'rank among 77'], score: .5 + .3 * (1 - e.rank / 12), from,
        layers: [{ big: e.rank === 1 ? `The ${sup.replace(/^the /, '')} of ${n.photos} photographs` : `${ord(e.rank)} ${sup.replace(/^the /, '')} of ${n.photos}`, small: `${e.axis} ${f2(e.v)}${e.ties ? `, level with ${e.ties} other${e.ties > 1 ? 's' : ''}` : ''}: held against each morning's ${e.axis}` },
          { big: nb.length ? `Beside it: ${nb.map(([s]) => place(s)).join(' and ')}` : `Nothing else scores ${f2(e.v)} on ${e.axis}`, small: nb.map(([, x]) => `${e.axis} ${f2(x)}`).join(' and ') || `${n.photos - 1} others below it` }] }, toPhoto(e.nb)) }
    { const off = Math.abs(v.mood - .5), further = D.data.photos.filter(p => Math.abs(D.Y.photos[p.src].vec.mood - .5) > off).length, qm = (D.QS.poems[Q] || {}).mood
      add({ key: 'mood', family: 'scores', signals: ['its mood score', 'pick.js holds mood at 0.5'], score: .4 + off, from: [...from, 'v2/scores-poems.json'],
        layers: [{ big: `Mood ${f2(v.mood)}: the one score no sky can set`, small: `every morning is held at 0.50, so it starts each one ${f2(off)} away` },
          { big: `${further} of ${n.photos} sit further from the middle`, small: qm != null ? `this poem's mood: ${f2(qm)}` : 'the poems carry the same score' }] }, toPhoto(y.kin.map(x => x.src).slice(3))) }
    { const near = y.poemsNear, me = near.findIndex(x => x.slug === Q), all = D.data.poems.map(p => p.slug).filter(s => D.Y.poems[s]),
        qd = D.K.weightedDistance(D.K.itemVector(D.QS, Q), D.K.itemVector(D.PS, P)), rank = 1 + all.filter(s => D.K.weightedDistance(D.K.itemVector(D.QS, s), D.K.itemVector(D.PS, P)) < qd).length
      const top = near.find(x => x.slug !== Q), qv = D.K.itemVector(D.QS, Q), axes = ['light', 'warmth', 'wet', 'stillness', 'season'].map(a => [a, Math.abs(qv[a] - v[a])]).sort((a, b) => a[1] - b[1])
      add({ key: 'pair', family: 'scores', signals: ['this poem’s scores', 'this photograph’s scores'], score: .55, from: [...from, 'v2/scores-poems.json'],
        layers: [{ big: `This poem sits ${f2(qd)} from this photograph in the seven scores`, small: `${ord(rank)} nearest of ${all.length}; nearest of all, ${title(top.slug)}, at ${f2(top.d)}` },
          { big: `Closest on ${axes[0][0]}, ${f2(qv[axes[0][0]])} to ${f2(v[axes[0][0]])}; furthest on ${axes[4][0]}, ${f2(qv[axes[4][0]])} to ${f2(v[axes[4][0]])}`, small: 'poem to photograph' }] }, toPoem([top.slug])) }
    { const near = y.poemsNear.filter(x => x.slug !== Q)
      add({ key: 'poems-near', family: 'scores', signals: ['its seven scores', 'all 93 poems scored'], score: .45, from: [...from, 'v2/scores-poems.json'],
        layers: [{ big: `${y.within30} of ${n.poems} poems sit within 0.30 of it`, small: `any could share its morning; ${title(near[1].slug)} at ${f2(near[1].d)}` },
          { big: near.slice(2, 4).map(x => title(x.slug)).join(' · '), small: near.slice(2, 4).map(x => f2(x.d)).join(' and ') + ' away' }] }, toPoem([near[1].slug, near[2].slug])) }

    /* ---- regions: the photograph measured, region by region, against every other ---- */
    { const r = y.region
      add({ key: 'region', family: 'region', signals: ['its 24 regions', `${n.photos - 1}×${n.regions} others`], score: .7, from: ['studies/28/kin.json'],
        layers: [{ big: `Its ${r.mine} and the ${r.theirs} of ${place(r.src)}`, small: `the nearest pair in ${n.regions}×${(n.photos - 1) * n.regions} regions: tone ${r.tone[0]}/${r.tone[1]}, contrast ${r.contrast[0]}/${r.contrast[1]}` },
          { big: `${f2(r.d)} apart on tone, colour and line`, small: `${place(r.src)}, ${D.Y.photos[r.src].month}` }] }, toPhoto([r.src])) }

    /* ---- place: where it was made, and where the site stands today ---- */
    { const same = y.samePlace
      add({ key: 'place', family: 'place', signals: ['its place', 'all 77 placed'], score: .45 + (y.placeN === 1 ? .15 : 0), from: ['v2/scores-photos.json'],
        layers: [{ big: y.placeN === 1 ? `The only photograph from ${y.place}` : `One of ${y.placeN} photographs from ${y.place}`, small: `${n.places} places in all; ${ord(y.placeRank)} by count` },
          { big: same.length ? `The others: ${[...new Set(same.map(s => D.Y.photos[s].month))].slice(0, 3).join(', ')}` : `Its nearest in the scores is from ${place(y.twin.src)}`, small: same.length ? `${same.length} more from ${y.place}` : `${f2(y.twin.d)} apart` }] }, toPhoto(same)) }
    const H = D.here, pl = (D.PS.photos[P] || {}).place
    if (H && H.lat != null && pl && pl.lat != null) {
      const km = D.K.haversineKm(H.lat, H.lon, pl.lat, pl.lon), bonus = D.K.placeBonus(pl, H.lat, H.lon)
      const near = D.data.photos.map(p => p.src).filter(s => s !== P).map(s => [s, D.K.haversineKm(H.lat, H.lon, D.PS.photos[s].place.lat, D.PS.photos[s].place.lon)]).sort((a, b) => a[1] - b[1])[0]
      const fmt = k => k < 10 ? 'under 10 km' : (Math.round(k > 100 ? k / 10 : k) * (k > 100 ? 10 : 1)).toLocaleString('en-US') + ' km'
      add({ key: 'far', family: 'place', signals: [`the site’s place, ${H.place}`, 'its place'], score: .55, from: ['v2/place.json', 'v2/pick.js'],
        layers: [{ big: `${fmt(km)} from ${H.place}`, small: bonus ? `place bonus ${f2(bonus)}, added to its score on every morning read from here` : `place bonus 0.00: too far for pick.js to favour it from here` },
          { big: `Nearest to ${H.place}: ${place(near[0])}`, small: `${fmt(near[1])} away` }] }, toPhoto([near[0]]))
      if (ctx.local) { const lo = ctx.local, hx = H.tz ? tzOffset(H.tz) : null, diff = hx == null ? null : Math.round((lo.offset - hx) / 60)
        if (diff != null) add({ key: 'clock', family: 'place', signals: ['your clock', `the site’s place, ${H.place}`], score: .5, from: ['v2/place.json'],
          layers: [{ big: diff === 0 ? `On the same clock as ${H.place}` : `${Math.abs(diff)} hour${Math.abs(diff) > 1 ? 's' : ''} ${diff > 0 ? 'ahead of' : 'behind'} ${H.place}`, small: `your clock reads ${lo.zone}; the sky this site reads is ${H.place}’s` },
            { big: `This photograph: ${y.place}, scored ${y.hour}`, small: `${D.data.photos.filter(p => D.Y.photos[p.src].hour === y.hour).length} of ${n.photos} carry that hour` }] }, toPhoto(D.data.photos.map(p => p.src).filter(s => D.Y.photos[s].hour === lo.part))) } }

    /* ---- time: when it was made, when it was shown, when in the year it fits ---- */
    { const same = y.sameMonth
      add({ key: 'month', family: 'time', signals: ['its EXIF month', 'all 77 dated'], score: .4, from: ['studies/28/kin.json'],
        layers: [{ big: y.monthN === 1 ? `The only photograph from ${y.month}` : `One of ${y.monthN} photographs from ${y.month}`, small: `read from the file’s own EXIF; ${ord(y.monthRank)} of ${n.months} months by count` },
          { big: same.length ? `That month also: ${[...new Set(same.map(place))].filter(p => p !== y.place).slice(0, 2).join(', ') || y.place}` : `Its season score, ${f2(v.season)}, is the only clue to the month`, small: same.length ? `${same.length} others` : `${n.months} months on the site` }] }, toPhoto(same)) }
    { const days = Object.entries((D.days && D.days.days) || {}).filter(([d, e]) => e && e.why).sort(), shown = days.filter(([, e]) => e.photo === P)
      if (shown.length) { const [d, e] = shown.at(-1), w = e.why
        add({ key: 'history', family: 'time', signals: ['days.json', 'its seven scores'], score: .85, from: ['v2/days.json'],
          layers: [{ big: `On the home on ${dmy(d)}${shown.length > 1 ? `, and ${shown.length - 1} morning${shown.length > 2 ? 's' : ''} before` : ''}`, small: `${w.tmax != null ? Math.round(w.tmax) + '°, ' : ''}cloud ${w.cloud_pct ?? '?'}%, wind ${w.wind_kmh != null ? Math.round(w.wind_kmh) : '?'} km/h in ${e.place || 'his place'} that day` },
            { big: D.Y.poems[e.poem] ? `That morning’s poem: ${title(e.poem)}` : `That morning read light ${f2(w.light)}, warmth ${f2(w.warmth)}`, small: `wet ${f2(w.wet)} against its ${f2(v.wet)}; light ${f2(w.light)} against ${f2(v.light)}` }] }, toPoem([e.poem].filter(s => D.Y.poems[s]))) }
      else if (days.length) { let best = null
        for (const [d, e] of days) { const dv = D.K.dayVectorFromWhy(e.why), mine = D.K.weightedDistance(dv, D.K.itemVector(D.PS, P)), rank = 1 + D.data.photos.filter(p => D.K.weightedDistance(dv, D.K.itemVector(D.PS, p.src)) < mine).length
          if (!best || rank < best.rank) best = { d, e, rank } }
        add({ key: 'history', family: 'time', signals: ['days.json', 'its seven scores'], score: .8, from: ['v2/days.json', 'v2/pick.js'],
          layers: [{ big: `Not chosen on any of ${days.length} recorded mornings`, small: `closest: ${ord(best.rank)} of ${n.photos} on ${dmy(best.d)}, on the seven scores alone` },
            { big: `${dmy(best.d)} went to ${place(best.e.photo)}`, small: D.Y.poems[best.e.poem] ? `with ${title(best.e.poem)}` : `${ord(best.rank)} was its best of ${days.length}` }] }, toPhoto([best.e.photo])) } }
    { const today = ctx.day ? ctx.day.season : null, w = y.waits
      add({ key: 'season', family: 'time', signals: ['its season score', today != null ? 'today’s date' : 'the year’s cosine'], score: .6, from,
        layers: [{ big: `Its season score, ${f2(v.season)}, falls on ${w.days.join(' and ')}`, small: `a cosine over the year, peaking 21 June${today != null ? `; today reads ${f2(today)}` : ''}` },
          { big: today != null ? `${Math.abs(today - v.season) < .1 ? 'Within 0.10 of today' : `${f2(Math.abs(today - v.season))} from today’s season`}` : `${D.data.photos.filter(p => Math.abs(D.Y.photos[p.src].vec.season - v.season) < .05).length - 1} others within 0.05 of it`, small: 'season weighs 0.8 of a full axis in the match' }] },
        toPhoto(D.data.photos.map(p => p.src).filter(s => s !== P).sort((a, b) => Math.abs(D.Y.photos[a].vec.season - (today ?? v.season)) - Math.abs(D.Y.photos[b].vec.season - (today ?? v.season))).slice(0, 6))) }
    if (ctx.local) { const part = ctx.local.part, sameH = D.data.photos.filter(p => D.Y.photos[p.src].hour === part)
      add({ key: 'local', family: 'time', signals: ['your clock', 'its hour'], score: .6, from: ['v2/scores-photos.json'],
        layers: [{ big: `${part === 'night' ? 'Night' : part[0].toUpperCase() + part.slice(1)} where you are; this one was scored ${y.hour}`, small: `${sameH.length} of ${n.photos} photographs are scored ${part}` },
          { big: y.hour === part ? 'Your hour and its hour agree' : `${D.data.photos.filter(p => D.Y.photos[p.src].hour === y.hour).length} of ${n.photos} share its hour`, small: `your clock, ${ctx.local.zone}` }] }, toPhoto(sameH.map(p => p.src))) }

    /* ---- the sky right now, read the way the home reads it ---- */
    if (ctx.day && H) { const d = ctx.day, r = ctx.reading || {}, where = H.place, nearOn = ax => D.data.photos.filter(p => p.src !== P).map(p => p.src).sort((a, b) => Math.abs(D.Y.photos[a].vec[ax] - d[ax]) - Math.abs(D.Y.photos[b].vec[ax] - d[ax]))
      const closer = ax => D.data.photos.filter(p => Math.abs(D.Y.photos[p.src].vec[ax] - d[ax]) < Math.abs(v[ax] - d[ax])).length
      const sig = (s) => [`the sky in ${where} now`, s], src = ['v2/weather.js', 'v2/pick.js']
      add({ key: 'sky-light', family: 'sky', signals: sig('light'), score: .75, from: src,
        layers: [{ big: `Light in ${where} reads ${f2(d.light)} now; this photograph, ${f2(v.light)}`, small: r.cloud_cover != null ? `${r.cloud_cover}% cloud, ${r.is_day === 0 ? 'after dark' : 'by day'}` : `the light of the morning on record` },
          { big: `${closer('light')} of ${n.photos} sit nearer today’s light`, small: `nearest: ${place(nearOn('light')[0])}` }] }, toPhoto(nearOn('light')))
      add({ key: 'sky-warmth', family: 'sky', signals: sig('warmth'), score: .7, from: src,
        layers: [{ big: `${r.temperature_2m != null ? Math.round(r.temperature_2m) + '° in ' + where + ' is' : where + '’s air reads'} warmth ${f2(d.warmth)}; this one waits for ${deg(y.waits.c)}`, small: `${closer('warmth')} of ${n.photos} are nearer today’s warmth` },
          { big: `Nearest today: ${place(nearOn('warmth')[0])}`, small: `warmth ${f2(D.Y.photos[nearOn('warmth')[0]].vec.warmth)}` }] }, toPhoto(nearOn('warmth')))
      add({ key: 'sky-wet', family: 'sky', signals: sig('wet'), score: .65, from: src,
        layers: [{ big: `Wet ${f2(d.wet)} in ${where} now; this photograph waits for ${f2(v.wet)}`, small: `${rainOf(y.waits.mm)} by its score; ${closer('wet')} of ${n.photos} sit nearer today` },
          { big: `Nearest today on wet: ${place(nearOn('wet')[0])}`, small: `wet ${f2(D.Y.photos[nearOn('wet')[0]].vec.wet)}` }] }, toPhoto(nearOn('wet')))
      add({ key: 'sky-wind', family: 'sky', signals: sig('stillness'), score: .6, from: src,
        layers: [{ big: `${r.wind_speed_10m != null ? 'Wind ' + Math.round(r.wind_speed_10m) + ' km/h' : 'The air'} in ${where}: stillness ${f2(d.stillness)}; this one, ${f2(v.stillness)}`, small: `matched to wind near ${y.waits.wind} km/h; ${closer('stillness')} of ${n.photos} sit nearer now` },
          { big: `Nearest today on stillness: ${place(nearOn('stillness')[0])}`, small: `stillness ${f2(D.Y.photos[nearOn('stillness')[0]].vec.stillness)}` }] }, toPhoto(nearOn('stillness')))
      if (ctx.today) { const t = ctx.today
        add({ key: 'sky-rank', family: 'sky', signals: sig('all seven scores'), score: .9, from: src,
          layers: [{ big: t.rank === 1 ? `Today’s sky in ${where} chose it from ${n.photos}` : `Today’s sky in ${where} puts it ${ord(t.rank)} of ${n.photos}`, small: `${f2(t.d)} from the morning; nearest on ${t.near}, furthest on ${t.far}` },
            { big: t.rank === 1 ? `Next nearest: ${place(t.next)}` : `Today’s pick: ${place(t.pick)}`, small: t.rank === 1 ? 'the runner-up for the same sky' : 'the photograph on the home this morning' }] }, toPhoto([t.rank === 1 ? t.next : t.pick])) } }

    /* ---- the poem's lines: the ideas 21 read in them, and who else holds them ---- */
    const V = D.VOC, conc = D.Y.poems[Q] ? D.Y.poems[Q].concepts : []
    ;(V.poems[Q] || []).forEach((dd, k) => { const W = V.words.find(x => x.word === dd.word); if (!W) return
      const holds = W.photos.includes(P), others = W.poems.filter(s => s !== Q && D.Y.poems[s])
      add({ key: 'line-' + k, family: 'line', line: dd.phrase, signals: [`the line “${dd.phrase.slice(0, 24)}${dd.phrase.length > 24 ? '…' : ''}”`, 'its reading by hand'], score: .65, from: ['studies/21/readings.txt', 'studies/21/ideas.json'],
        layers: [{ big: `“${dd.phrase}”`, small: `read for ${W.concepts.join(' · ')}; ${W.photos.length} of ${n.photos} photographs hold it, ${holds ? 'this one among them' : 'not this one'}` },
          { big: `${others.length} other poem${others.length === 1 ? '' : 's'} hold it${others.length ? ': ' + title(others[0]) : ''}`, small: `this photograph was read for ${y.concepts.join(' · ')}` }] }, toPhoto(W.photos)) })
    if (world.from && world.from.phrase) { const W = world.word && V.words.find(x => x.word === world.word)
      add({ key: 'came', family: 'line', signals: ['the door you came by', 'its reading by hand'], score: .7, from: ['studies/21/ideas.json'],
        layers: [{ big: `Came here by “${world.from.phrase}”`, small: `from ${world.from.title}${W ? `; read as ${W.concepts.join(' · ')}, held by ${W.poems.length} poems and ${W.photos.length} photographs` : ''}` },
          { big: `${(world.trail || []).length} world${(world.trail || []).length === 1 ? '' : 's'} on this walk`, small: W ? `${W.photos.includes(P) ? 'this photograph holds it too' : 'this photograph was read for ' + y.concepts.join(' · ')}` : `this photograph was read for ${y.concepts.join(' · ')}` }] }, toPhoto(W ? W.photos : [])) }
    if (y.note) add({ key: 'note', family: 'line', signals: ['its reading by hand'], score: .7, from: ['studies/21/ideas.json'],
      layers: [{ big: y.note.split(':')[1] ? y.note.split(':').slice(1).join(':').trim() : y.note, small: `read by hand for ${y.concepts.join(' · ')}; ${y.shareAll} of ${n.poems} poems were read for the same` }, { big: `${y.poemsShare.length ? title(y.poemsShare[0].slug) : ''}`, small: 'the poem read most like it' }] }, toPoem(y.poemsShare.map(x => x.slug)))

    /* ---- other photographs and other poems: outward ---- */
    y.kin.filter(x => !avoidP.has(x.src)).slice(0, 8).forEach((x, j) => { if (takenP.has(x.src)) return; const ky = D.Y.photos[x.src], w = ky.waits
      const to = toPhoto([x.src])
      items.push({ key: 'photo:' + x.src, kind: 'photo', family: 'photo', src: x.src, signals: ['its 24 regions', `${place(x.src)}’s 24`], score: .5 - j * .02, from: ['studies/28/kin.json'],
        layers: [{ big: `${place(x.src)}, ${ord(j + 1)} nearest`, small: `${ky.month} · of ${n.photos - 1}, region by region, ${f2(x.d)} apart` },
          { big: `It waits for ${deg(w.c)}, ${skyOf(w)}`, small: `this one waits for ${deg(y.waits.c)}, ${skyOf(y.waits)}` }], to }) })
    const pc = [...y.poemsShare.map(x => [x.slug, 'idea']), ...y.poemsNear.map(x => [x.slug, 'scores'])]
    for (const [s, why] of pc) { if (takenQ.has(s) || items.some(it => it.slug === s) || !poem(s)) continue
      const lines = D.stanzasOf(poem(s)).flat(), Lr = (D.Y.poems[s].lines.find(l => l.concepts.some(c => y.concepts.includes(c))) || D.Y.poems[s].lines[0] || {}), first = Lr.phrase ? lines.findIndex(l => l.includes(Lr.phrase.split('\n')[0])) : 0, at = Math.max(0, first)
      if (lines.length < 3) continue // a poem yield unfolds over two taps: it needs lines for both
      const shared = (Lr.concepts || []).filter(c => y.concepts.includes(c)), qd = (y.poemsNear.find(x => x.slug === s) || {}).d
      const to = toPoem([s])
      items.push({ key: 'poem:' + s, kind: 'poem', family: 'poem', slug: s, signals: why === 'idea' ? ['its reading by hand', 'the poem’s reading'] : ['its seven scores', 'the poem’s seven scores'], score: .55, from: ['studies/21/readings.txt', 'v2/scores-poems.json'],
        layers: [{ lines: lines.slice(at, at + 2), small: `${title(s)} · ${shared.length ? 'read for ' + shared.join(' · ') + ', as this photograph was' : qd != null ? f2(qd) + ' from this photograph in the seven scores' : 'read beside it'}` },
          { lines: lines.slice(at + 2, at + 5).length ? lines.slice(at + 2, at + 5) : lines.filter((_, k) => k < at || k >= at + 2).slice(0, 3), small: `${title(s)} · ${lines.length} lines` }], to })
      if (items.filter(i => i.kind === 'poem').length >= 8) break }

    const judged = items.map(it => [it.key, judge(it, world, D)]).filter(([, r]) => r)
    const keep = items.filter(it => !judge(it, world, D))
    return { items: keep, judged } }

  function tzOffset(tz) { try { const d = new Date(), s = d.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }), m = /GMT([+-]\d+)(?::(\d+))?/.exec(s); return m ? +m[1] * 60 + Math.sign(+m[1] || 1) * +(m[2] || 0) : 0 } catch { return null } }
  function local(now = new Date()) { const h = now.getHours(), off = -now.getTimezoneOffset(), zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') + ` (UTC${off >= 0 ? '+' : '−'}${Math.abs(off / 60)})`
    return { part: h < 5 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : h < 21 ? 'dusk' : 'night', zone, offset: off } }

  /* one facet's own piece of the photograph, measured as kin.py measures, against every region of every other photograph */
  function facet(frag, at, world, D, taken) {
    const P = world.photo, KIN = D.KIN, n = D.Y.counts, mono = !!(KIN[P] || {}).mono
    const kinD = (f, c, mc) => { const [L, a, b, con, ho, ve, de] = c, tone = Math.hypot((f.L - L) / 12, (f.con - con) / 8), col = mono && mc ? 0 : mono || mc ? .8 : Math.hypot(f.a - a, f.b - b) / 10
      return tone + col + 2 * (Math.abs(f.ho - ho) + Math.abs(f.ve - ve)) + Math.abs(f.de - de) / Math.max(1, (f.de + de) / 2) }
    const res = []
    for (const [src, k] of Object.entries(KIN)) { if (src === P) continue; let b = Infinity, bj = 0; k.cells.forEach((c, j) => { const d = kinD(frag, c, k.mono); if (d < b) { b = d; bj = j } }); res.push([src, b, bj]) }
    res.sort((a, b) => a[1] - b[1]); const pick = res.find(r => !taken.has(r[0])) || res[0], second = res.find(r => r !== pick && !taken.has(r[0])) || res[1]
    const C = KIN[P] ? KIN[P].grid : null, cols = 6, rows = 4, pos = j => { const r = Math.floor(j / cols), c = j % cols, vv = r === 0 ? 'top' : r === rows - 1 ? 'bottom' : 'middle', h = c < 2 ? 'left' : c < 4 ? 'centre' : 'right'; return vv === 'middle' && h === 'centre' ? 'centre' : vv + ' ' + h }
    const place = s => D.Y.photos[s].place, dir = frag.ho > frag.ve * 1.3 ? 'level' : frag.ve > frag.ho * 1.3 ? 'upright' : 'mixed'
    return { key: 'facet:' + pick[0], kind: 'insight', family: 'region', src: pick[0], signals: ['this piece, measured', `${(Object.keys(KIN).length - 1) * n.regions} regions`], score: .7, from: ['studies/28/kin.json'],
      layers: [{ big: `This piece: tone ${Math.round(frag.L)}, contrast ${Math.round(frag.con)}, ${dir} lines`, small: `nearest of ${(Object.keys(KIN).length - 1) * n.regions} regions: the ${pos(pick[2])} of ${place(pick[0])}` },
        { big: `${(Math.round(pick[1] * 100) / 100).toFixed(2)} apart; next, ${place(second[0])}`, small: `${(Math.round(second[1] * 100) / 100).toFixed(2)}, the ${pos(second[2])}` }], target: pick[0] } }

  /* how a yield unfolds, tap by tap (?y=): every tap says something new or moves; none says the same thing twice */
  function steps(it, y, D) {
    const say = l => ({ t: 'say', big: l.big, small: l.small }), gl = (src, l) => ({ t: 'glimpse', src, big: l.big, small: l.small }), li = l => ({ t: 'lines', lines: l.lines, small: l.small })
    const as = l => it.kind === 'photo' ? gl(it.src, l) : it.kind === 'poem' ? li(l) : say(l), mv = { t: 'move', to: it.to }
    if (y === 'c') return [as(it.layers[0]), mv] // ranked: say it once, then go
    if (y === 'd') { const to = it.to, q = D.data.poems.find(p => p.slug === to.poem), tp = D.Y.photos[to.photo] // threads: on toward the world it ends in
      const glTo = { t: 'glimpse', src: to.photo, big: `${tp.place} · ${tp.month}`, small: 'the photograph it leads to' }, liTo = { t: 'lines', lines: D.stanzasOf(q).flat().slice(0, 2), small: `${q.title} · the poem it leads to` }
      if (it.kind === 'photo') return [as(it.layers[0]), liTo, say(it.layers[1]), mv]
      if (it.kind === 'poem') return [as(it.layers[0]), glTo, as(it.layers[1]), mv]
      return [as(it.layers[0]), glTo, liTo, mv] }
    return [...it.layers.map(as), mv] } // where, lines: deeper, then the move
  const stepKey = s => s.t + ':' + (s.t === 'move' ? s.to.photo + '~' + s.to.poem : s.t === 'lines' ? s.lines.join('/') + '|' + s.small : (s.src || '') + s.big + '|' + s.small)

  const api = { make, facet, judge, local, steps, stepKey, FILLER, BAR }
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.S30Deck = api
})(typeof window !== 'undefined' ? window : globalThis)
