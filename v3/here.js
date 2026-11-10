/* studies/42/here.js — each idea at work on THIS world: today's photograph and poem, or the world crossed into.
   Every fact is read live from what the page already has or loads from the site itself, never written in here:
     the photograph   v3/crossings.json (its place and the day its file says it was made), v2/data.json (its caption's camera),
                      v2/scores-photos.json (its place's coordinates, through 34's model), v2/days.json (the days it stood on the home)
     the poem         studies/27/poem-years.json (the year its evidence gives), poems/related.js (its themes, its page's neighbours)
     the moment       the where line's own words (weather.js's sentence), the reading behind it, the session cache's time it was read,
                      v2/place.json (when where he is was last written), 34's model of the pick (v3/why.js over v2/pick.js's parts)
     the system       IDEAS in v2/home.js (Home's surfaces), v2/flow.js (this page's publishers are watched lanes),
                      v2/pick.js (the hour a day is frozen into the archive), v3/today.js (the zone the archive's day is kept in)
   S42.load() fetches what the page does not already hold. S42.facts(env) gathers one world's facts; S42.say(F) writes them, each sentence
   with the general slot it is an instance of (the intro, a tool by its part name, or the boundary), for the braided way.
   A fact that did not load is left out with its clause, never said as missing or as something else; a clock time is said in the zone
   of where he is, the way the sky's own reading is ("8:40 pm"); a day in another year than today's carries its year.
   check.mjs gathers the same facts in node from the same files and writes them on its own; the two must agree word for word. */
(function () {
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const COUNT = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  const ORDW = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
  const PLACES = { 1: 'tenth', 2: 'hundredth', 3: 'thousandth' }
  const text = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '')
  const json = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
  function literalAfter(src, mark) { // an object literal in a script, evaluated alone (the poem pages' own table, nothing copied)
    const at = src.indexOf(mark); if (at < 0) return null; const s0 = at + mark.length; let depth = 0, q = null
    for (let i = s0; i < src.length; i++) { const c = src[i]
      if (q) { if (c === '\\') i++; else if (c === q) q = null; continue } if (c === "'" || c === '"') { q = c; continue }
      if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue }
      if (c === '{' || c === '[') depth++; else if ((c === '}' || c === ']') && --depth === 0) return new Function('return ' + src.slice(s0, i + 1))() }
    return null }
  let SRC = null
  async function load() {
    if (SRC) return SRC
    const [years, related, flow, pick, place, today] = await Promise.all([json('/v3/poem-years.json'), text('/poems/related.js'), text('/v2/flow.js'), text('/v2/pick.js'), json('/v2/place.json'), text('/v3/today.js')])
    const pubs = /this page's (\w+) publishers/.exec(flow), freeze = /runs once, at (\d{1,2}:\d\d)/.exec(pick), zone = /timeZone: '([A-Za-z_/]+)'/.exec(today)
    SRC = { years, themes: literalAfter(related, 'const poemData = '), labels: literalAfter(related, 'const themeLabels = '), publishers: pubs ? pubs[1] : null, freeze: freeze ? freeze[1] : null, zone: zone ? zone[1] : null, place }
    return SRC }

  const day = (iso, now) => +iso.slice(8, 10) + ' ' + MON[+iso.slice(5, 7) - 1] + (now && iso.slice(0, 4) !== now.slice(0, 4) ? ' ' + iso.slice(0, 4) : '') // the year, when it is not today's
  const clock = (ms, tz) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(ms)).replace(/\s+/g, ' ').replace(/ ([AP])M$/, (_, x) => ' ' + x.toLowerCase() + 'm')
  function wallMs(iso, hm, tz) { // the instant a wall clock in tz reads hm on iso
    const [h, m] = hm.split(':').map(Number), guess = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), h, m), p = {}
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).forEach(x => p[x.type] = x.value)
    return guess - (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - guess) }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th')
  const two = x => x.toFixed(2)
  const gapOf = g => g < .005 ? 'less than a hundredth' : two(g)
  const and = L => L.length < 2 ? L.join('') : L.slice(0, -1).join(', ') + ' and ' + L[L.length - 1]
  const dates = (L, now) => L.length <= 2 ? and(L.map(d => day(d, now))) : `${L.length} days, last ${day(L[L.length - 1], now)}`
  const best = parts => ['light', 'warmth', 'wet', 'stillness', 'season', 'inside'].reduce((b, a) => parts[a] < parts[b] ? a : b, 'light')
  const decimals = v => { const m = /\.(\d+)$/.exec(String(v)); return m ? m[1].length : 0 }

  /* env: { photo, poem, mode ('home' | 'world'), ctx (today's pick: S14.load), model (34's: S34.explain), stepOf (34's), where (the line's
     words), readAt (ms the sky was read, or null), XJ (crossings.json), IDEAS, src (load()) } */
  function facts(env) {
    const { photo, poem, ctx, model: m, XJ, IDEAS, src } = env, data = ctx.data, days = (ctx.days && ctx.days.days) || {}
    const rec = XJ.photos.find(p => p.src === photo.src) || null, cap = String(photo.caption || '').split(' — ')
    const F = { title: poem.title, slug: poem.slug }
    F.photo = { place: rec ? rec.place : cap[0], camera: cap[1] || null, month: rec ? MON[+rec.taken.slice(5, 7) - 1] : null, year: rec ? +rec.taken.slice(0, 4) : null, row: rec ? rec.row : null,
      sameMonth: rec ? XJ.photos.filter(p => p.taken.slice(0, 7) === rec.taken.slice(0, 7)).length : 0,
      shown: Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d) && days[d].photo === photo.src).sort() }
    const PY = src.years, y = PY && PY.poems ? PY.poems[poem.slug] : null
    F.poem = { year: y ? y.year : null, yearCount: y ? Object.values(PY.poems).filter(e => e.year === y.year).length : 0, undated: PY && PY.undated && PY.undated[poem.slug] ? Object.keys(PY.undated).length : 0,
      shown: Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d) && days[d].poem === poem.slug).sort() }
    const th = src.themes && src.themes[poem.slug]
    F.themes = th ? { labels: th.themes.map(t => (src.labels && src.labels[t]) || t), kin: Object.entries(src.themes).filter(([s, e]) => s !== poem.slug && e.themes.some(t => th.themes.includes(t))).length } : null
    const r = ctx.reading || {}, w = /^We're in (.+) and (.+)\.$/.exec(env.where || '')
    // place: his city (the line's words, or the reading's), null when the page was told it is not known with confidence, undefined when nothing said
    F.sky = { place: w ? w[1] : r.place || (src.place ? src.place.place : undefined), phrase: w ? w[2] : null, read: r.temperature_2m != null && r.weather_code != null,
      temp: r.temperature_2m != null ? Math.round(r.temperature_2m) : null, night: r.is_day === 0, readAt: env.readAt && r.tz ? clock(env.readAt, r.tz) : null,
      written: src.place && src.place.updated ? day(src.place.updated, ctx.iso) : null, decimals: src.place && src.place.lat != null ? Math.max(decimals(src.place.lat), decimals(src.place.lon)) : null }
    F.how = ctx.how; F.mine = env.mode === 'home'; F.iso = ctx.iso
    F.archive = { days: Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).length, since: (() => { const k = Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort()[0]; return k ? day(k, ctx.iso) : null })(),
      last: (() => { const k = Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort().pop(); return k ? day(k, ctx.iso) : null })(), hasToday: !!days[ctx.iso],
      freeze: src.freeze && src.zone && r.tz ? clock(wallMs(ctx.iso, src.freeze, src.zone), r.tz) : null } // the archive's hour on its own clock, said on his
    const pickRec = XJ.photos.find(p => p.src === ctx.photo.src)
    F.pick = { place: pickRec ? pickRec.place : String(ctx.photo.caption || '').split(' — ')[0], title: ctx.poem.title, same: ctx.photo.src === photo.src, samePoem: ctx.poem.slug === poem.slug, poems: data.poems.length, photos: data.photos.length }
    if (m && m.photos && m.poems && m.day) {
      const P = m.photos.find(x => x.key === photo.src), Q = m.poems.find(x => x.key === poem.slug)
      Object.assign(F.pick, { ranked: true, photoRank: P ? P.rank : null, poemRank: Q ? Q.rank : null, bonus: P ? P.bonus : 0, km: P && P.place && P.place.km != null ? Math.round(P.place.km) : null,
        poemGap: m.poems[0].score - m.poems[1].score, photoGap: m.photos[0].score - m.photos[1].score, second: m.poems[1].item.title,
        nearKm: m.rule && m.rule.nearKm, farKm: m.rule && m.rule.farKm, near: m.rule && m.rule.near,
        asks: ['light', 'warmth', 'wet', 'stillness'].map(a => env.stepOf(a, m.day[a])), wetDay: m.day.wet >= .5, outDay: m.day.inside >= .5,
        // what each answers to most: the measure (mood aside: the sky cannot read it) where its own reading lies closest to tonight's, by pick.js's weights
        poemBest: Q ? best(Q.parts) : null, photoBest: P ? best(P.parts) : null })
      F.km = F.pick.km }
    else F.km = null
    const H = IDEAS.find(I => I.name === 'Home'), at = H ? H.parts.indexOf('This page') : -1
    F.home = at >= 0 ? { at, of: H.parts.length } : null
    F.publishers = src.publishers
    return F }

  const NOUN = (a, F) => ({ light: 'light', warmth: 'warmth', wet: F.pick.wetDay ? 'wet' : 'dryness', stillness: 'stillness', season: 'the time of year', inside: F.pick.outDay ? 'being out of doors' : 'shelter' })[a]
  const KM = { 1: 'about ten kilometres', 2: 'about a kilometre', 3: 'about a hundred metres' }
  function say(F) {
    const T = `“${F.title}”`, P = F.photo, S = F.sky, k = F.pick, A = F.archive, now = S.night ? 'tonight' : 'today', Now = S.night ? 'Tonight' : 'Today'
    const out = {}, comma = /,/.test(P.place || '') ? ',' : '', sky = S.place && S.read
    const kept = F.poem.year ? `the earliest copy he kept of ${T} is from ${F.poem.year}` : F.poem.undated ? `no copy of ${T} can yet be dated` : null
    const made = [P.month ? `in ${P.month} ${P.year}` : '', P.camera ? `on a ${P.camera}` : ''].filter(Boolean).join(' ')
    const from = P.place ? `this photograph is from ${P.place}${made ? `, made ${made}` : ''}` : null
    // Context owns where he is and the sky; it gives where and when the photograph was made, and the poem's year
    out['Context'] = [(kept || from) && { s: cap([kept, from].filter(Boolean).join('; ')) + '.', at: 'boundary' },
      { s: sky ? `${Now} he is in ${S.place}${F.km != null ? `, ${F.km.toLocaleString('en-US')} km away` : ''}${S.phrase ? `, where ${S.phrase}${S.temp != null ? ` at ${S.temp} °C` : ''}` : S.temp != null ? `, at ${S.temp} °C` : ''}.`
        : S.place ? `He is in ${S.place}; the sky there could not be read.` : S.place === null ? 'Where he is goes unsaid: it is not known with enough confidence.' : null, at: 'Where I am' }].filter(x => x && x.s)
    // Topically suggesting: what in tonight's sky the poem and the photograph answer to; one rank; the home's own pair only when this is not it
    const tp = [], theirs = F.mine ? '' : `: ${k.place} with “${k.title}”`
    if (F.how === 'live' && k.ranked) {
      const [l, wa, we, st] = k.asks
      tp.push(`${Now}’s sky reads ${l}, ${wa}, ${we} and ${st}; ${T} answers it most in ${NOUN(k.poemBest, F)}, this photograph in ${NOUN(k.photoBest, F)}.`)
      const home = k.same && k.samePoem ? '' : `; the home itself pairs ${k.same ? 'this photograph' : k.place} with ${k.samePoem ? 'this poem' : `“${k.title}”`}`
      tp.push(F.mine ? `Of ${k.poems} poems it came first ${now}.` : `Of ${k.poems} poems it stands ${ord(k.poemRank)} ${now}${home}.`) }
    else if (F.how === 'live') tp.push(`${Now}’s pair follows the sky as it was read${theirs}.`)
    else if (F.how === 'frozen') tp.push(`Today’s pair is the one the archive kept for ${day(F.iso)}, chosen from that day’s whole sky${theirs}.`)
    else tp.push(`No reading of the sky reached this page, so today’s pair falls to the date itself${theirs}.`)
    if (F.themes && F.themes.kin) { const L = F.themes.labels; tp.push(`Its page offers three of the ${F.themes.kin} other poems that also hold ${L.length > 1 ? L.slice(0, -1).join(', ') + ' or ' + L[L.length - 1] : L[0]}.`) }
    out['Topically suggesting'] = tp.map(s => ({ s, at: 'intro' }))
    // Keeping track: where this poem and this photograph sit in the record, and what the archive holds of them
    const ph = P.month ? (P.sameMonth > 1 ? `one of ${P.sameMonth} he made in ${P.month} ${P.year}` : `the only one he made in ${P.month} ${P.year}`) : 'undated'
    const row = P.row && String(P.row) !== String(P.year) ? `, kept in the About under ${P.row}` : ''
    const ps = P.shown, qs = F.poem.shown
    const shown = !ps.length && !qs.length ? 'neither has yet stood on the home' : ps.length && qs.length ? `this photograph stood on the home on ${dates(ps, F.iso)}, ${T} on ${dates(qs, F.iso)}`
      : ps.length ? `this photograph stood on the home on ${dates(ps, F.iso)}` : `${T} stood on the home on ${dates(qs, F.iso)}`
    const poemIs = F.poem.year ? `${T} is one of the ${F.poem.yearCount} poems he kept from ${F.poem.year}` : F.poem.undated ? `${T} is one of the ${F.poem.undated} poems no copy yet dates` : null
    out['Keeping track'] = [{ s: poemIs ? `${poemIs}, this photograph ${ph}${row}.` : `This photograph is ${ph}${row}.`, at: 'intro' },
      A.days && { s: `The archive holds ${A.days} day${A.days === 1 ? '' : 's'} since ${A.since}; ${shown}.`, at: 'intro' }].filter(Boolean)
    // Staying up to date: when this screen's readings were taken; the day frozen, never reshuffled
    const up = [sky ? `The sky was read ${S.readAt ? `at ${S.readAt}` : 'as this page opened'}${S.written ? `, and where he is was last set on ${S.written}` : ''}.`
      : S.written ? `Where he is was last set on ${S.written}${S.place ? '; the sky could not be read' : S.place === null ? ', with no city this page may name' : ''}.` : S.place ? `The sky over ${S.place} could not be read.` : null]
    up.push(F.how === 'live' ? (A.hasToday ? 'Today’s pair follows the sky; the archive already holds this day, and once it has passed it replays exactly as kept.'
      : `Today’s pair follows the sky until ${A.freeze ? `${A.freeze}, when ` : ''}the archive freezes it; after that the day replays exactly as kept.`)
      : F.how === 'frozen' ? 'Today’s pair is already frozen in the archive and replays exactly as kept.' : 'With no reading, today’s pair falls to the date, the same on every visit.')
    out['Staying up to date'] = up.filter(Boolean).map(s => ({ s, at: 'intro' }))
    // Self-healing: what is watched so this page stays right, and when each last checked in
    const two = F.publishers === 'two'
    const seen = two ? (S.written && A.last ? `The first last checked in on ${S.written}, the second on ${A.last}.` : S.written ? `The first last checked in on ${S.written}.` : A.last ? `The second last checked in on ${A.last}.` : null)
      : [S.written && `where he is was last set on ${S.written}`, A.last && `the archive last kept ${A.last}`].filter(Boolean).map((x, i) => i ? x : cap(x)).join('; ')
    out['Self-healing'] = [two && { s: 'Two jobs keep this page right, one noting where he is and one keeping each day’s pair, and both are watched for going quiet.', at: 'Samwise' },
      seen && { s: two ? seen : seen + '.', at: 'Samwise' }].filter(Boolean)
    // Home: this page is one of its surfaces, and what it carries; how near the page is told where he is
    out['Home'] = [F.home && { s: `This page is the ${F.home.at === F.home.of - 1 ? 'last' : ORDW[F.home.at]} of the ${COUNT[F.home.of] || F.home.of} surfaces Home looks after; ${now} it carries ${P.place ? `a photograph from ${P.place}${comma}` : 'this photograph'} and ${T}.`, at: 'This page' },
      S.place && KM[S.decimals] ? { s: `His city shows under his name only when it is known with confidence, and never more closely than ${KM[S.decimals]}.`, at: 'boundary' }
        : S.place === null ? { s: `Where he is goes unsaid ${now}: it is not known with confidence.`, at: 'boundary' } : null].filter(Boolean)
    return out }

  window.S42 = { load, facts, say }
})()
