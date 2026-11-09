/* studies/42/here.js — each idea at work on THIS world: today's photograph and poem, or the world crossed into.
   Every fact is read live from what the page already has or loads from the site itself, never written in here:
     the photograph   v3/crossings.json (its place and the day its file says it was made), v2/data.json (its caption's camera),
                      v2/scores-photos.json (its place's coordinates, through 34's model), v2/days.json (the days it stood on the home)
     the poem         studies/27/poem-years.json (the year its evidence gives), poems/related.js (its themes, its page's neighbours)
     the moment       the where line's own words (weather.js's sentence), the reading behind it, the session cache's time it was read,
                      v2/place.json (when where he is was last written), 34's model of the pick (v3/why.js over v2/pick.js's parts)
     the system       IDEAS in v2/home.js (Home's surfaces), v2/flow.js (this page's publishers are watched lanes),
                      v2/pick.js (the hour a day is frozen into the archive)
   S42.load() fetches what the page does not already hold. S42.facts(env) gathers one world's facts; S42.say(F) writes them, each sentence
   with the general slot it is an instance of (the intro, a tool by its part name, or the boundary), for the braided way.
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
    const [years, related, flow, pick, place] = await Promise.all([json('/studies/27/poem-years.json'), text('/poems/related.js'), text('/v2/flow.js'), text('/v2/pick.js'), json('/v2/place.json')])
    const pubs = /this page's (\w+) publishers/.exec(flow), freeze = /runs once, at (\d{1,2}:\d\d)/.exec(pick)
    SRC = { years, themes: literalAfter(related, 'const poemData = '), labels: literalAfter(related, 'const themeLabels = '), publishers: pubs ? pubs[1] : null, freeze: freeze ? freeze[1] : null, place }
    return SRC }

  const day = iso => +iso.slice(8, 10) + ' ' + MON[+iso.slice(5, 7) - 1]
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th')
  const two = x => x.toFixed(2)
  const gapOf = g => g < .005 ? 'less than a hundredth' : two(g)
  const and = L => L.length < 2 ? L.join('') : L.slice(0, -1).join(', ') + ' and ' + L[L.length - 1]
  const dates = L => L.length <= 2 ? and(L.map(day)) : `${L.length} days, last ${day(L[L.length - 1])}`
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
    const PY = src.years || { poems: {}, undated: {} }, y = PY.poems[poem.slug]
    F.poem = { year: y ? y.year : null, yearCount: y ? Object.values(PY.poems).filter(e => e.year === y.year).length : 0, undated: Object.keys(PY.undated || {}).length,
      shown: Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d) && days[d].poem === poem.slug).sort() }
    const th = src.themes && src.themes[poem.slug]
    F.themes = th ? { labels: th.themes.map(t => (src.labels && src.labels[t]) || t), kin: Object.entries(src.themes).filter(([s, e]) => s !== poem.slug && e.themes.some(t => th.themes.includes(t))).length } : null
    const r = ctx.reading || {}, w = /^We're in (.+) and (.+)\.$/.exec(env.where || '')
    F.sky = { place: w ? w[1] : (src.place && src.place.place) || null, phrase: w ? w[2] : null, temp: r.temperature_2m != null ? Math.round(r.temperature_2m) : null, night: r.is_day === 0,
      readAt: env.readAt && r.tz ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: r.tz }).format(new Date(env.readAt)).replace(/\s+/g, ' ').replace(/ ([AP])M$/, (_, x) => ' ' + x.toLowerCase() + 'm') : null,
      written: src.place && src.place.updated ? day(src.place.updated) : null, decimals: src.place && src.place.lat != null ? Math.max(decimals(src.place.lat), decimals(src.place.lon)) : null }
    F.how = ctx.how; F.mine = env.mode === 'home'; F.iso = ctx.iso
    F.archive = { days: Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).length, since: (() => { const k = Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort()[0]; return k ? day(k) : null })(),
      last: (() => { const k = Object.keys(days).filter(d => /^\d{4}-\d\d-\d\d$/.test(d)).sort().pop(); return k ? day(k) : null })(), hasToday: !!days[ctx.iso], freeze: src.freeze }
    const pickRec = XJ.photos.find(p => p.src === ctx.photo.src)
    F.pick = { place: pickRec ? pickRec.place : String(ctx.photo.caption || '').split(' — ')[0], title: ctx.poem.title, same: ctx.photo.src === photo.src, samePoem: ctx.poem.slug === poem.slug, poems: data.poems.length, photos: data.photos.length }
    if (m && m.photos && m.poems && m.day) {
      const P = m.photos.find(x => x.key === photo.src), Q = m.poems.find(x => x.key === poem.slug)
      Object.assign(F.pick, { ranked: true, photoRank: P ? P.rank : null, poemRank: Q ? Q.rank : null, bonus: P ? P.bonus : 0, km: P && P.place && P.place.km != null ? Math.round(P.place.km) : null,
        poemGap: m.poems[0].score - m.poems[1].score, photoGap: m.photos[0].score - m.photos[1].score, second: m.poems[1].item.title,
        nearKm: m.rule && m.rule.nearKm, farKm: m.rule && m.rule.farKm, near: m.rule && m.rule.near,
        asks: ['light', 'warmth', 'wet', 'stillness', 'season'].map(a => env.stepOf(a, m.day[a])) })
      F.km = F.pick.km }
    else F.km = null
    const H = IDEAS.find(I => I.name === 'Home'), at = H ? H.parts.indexOf('This page') : -1
    F.home = at >= 0 ? { at, of: H.parts.length } : null
    F.publishers = src.publishers
    return F }

  function say(F) {
    const T = `“${F.title}”`, P = F.photo, S = F.sky, now = S.night ? 'tonight' : 'today', Now = S.night ? 'Tonight' : 'Today'
    const out = {}
    // Context: where and when the photograph was made, the poem's year; where he is now and the sky the line reads
    const made = `This photograph was made at ${P.place}${/,/.test(P.place) && (P.month || P.camera) ? ',' : ''}${P.month ? ` in ${P.month} ${P.year}` : ''}${P.camera ? `, on a ${P.camera}` : ''}`
    out['Context'] = [{ s: F.poem.year ? `${made}; ${T} was written by ${F.poem.year}.` : `${made}; ${T} carries no year the record can prove.`, at: 'boundary' },
      { s: S.place && S.phrase ? `${Now} he is in ${S.place}${F.km != null ? `, ${F.km.toLocaleString('en-US')} km from where it was taken,` : ''} and ${S.phrase}${S.temp != null ? ` at ${S.temp} °C` : ''}.`
        : S.place ? `He is in ${S.place}; the sky there could not be read.` : 'Where he is goes unsaid: it is not known with enough confidence.', at: 'Where I am' }]
    // Topically suggesting: the reading, what it asked for, where this poem and this photograph stood against it; what the poem is near
    const tp = [], k = F.pick, bare = S.phrase ? S.phrase.replace(/^(it's|there's) /, '') : null
    const lift = k.bonus ? `, lifted ${two(k.bonus)} for lying within ${k.bonus === k.near ? k.nearKm : k.farKm} km of him` : ''
    if (F.how === 'live' && k.ranked) {
      const [l, wa, we, st, se] = k.asks, season = /half$/.test(se) ? se + ' of the year' : se === 'between' ? 'between seasons' : se
      tp.push(`${Now}’s sky over ${S.place}, ${bare}${S.temp != null ? ` at ${S.temp} °C` : ''}, read as ${l}, ${wa}, ${we} and ${st}, ${season}.`)
      if (F.mine) tp.push(`Of ${k.poems} poems ${T} came first, ${gapOf(k.poemGap)} ahead of “${k.second}”; of ${k.photos} photographs this one came first by ${gapOf(k.photoGap)}${lift}.`)
      else tp.push(`Weighed against it, ${T} stands ${ord(k.poemRank)} of ${k.poems} poems and this photograph ${ord(k.photoRank)} of ${k.photos}${lift}; the home’s own pair ${now} is ${k.same ? 'this photograph' : k.place} with ${k.samePoem ? 'this poem' : `“${k.title}”`}.`) }
    else if (F.how === 'frozen') tp.push(`Today’s pair is the one the archive kept for ${day(F.iso)}, chosen from that day’s whole sky${F.mine ? '' : `: ${k.place} with “${k.title}”`}.`)
    else tp.push(`No reading of the sky reached this page, so today’s pair falls to the date itself, the same on every visit${F.mine ? '' : `: ${k.place} with “${k.title}”`}.`)
    if (F.themes) { const L = F.themes.labels, n = F.themes.kin
      tp.push(`On its own page, three neighbours are drawn at random from the ${n} other poems that share ${L.length > 1 ? `one of its themes, ${and(L)}` : `its theme, ${L[0]}`}.`) }
    out['Topically suggesting'] = tp.map(s => ({ s, at: 'intro' }))
    // Keeping track: where this poem and this photograph sit in the record, and the archive the day joins
    const month = P.month ? (P.sameMonth > 1 ? `, from ${P.month} ${P.year}, is one of ${P.sameMonth} made that month` : `, from ${P.month} ${P.year}, is the only one made that month`) : ''
    const k1 = (F.poem.year ? `${T} is one of the ${F.poem.yearCount} poems the record dates to ${F.poem.year}` : `${T} is one of the ${F.poem.undated} poems the record cannot yet date`)
      + `; this photograph${month}${P.row ? `, and it stands in the About under ${P.row}` : ''}.`
    const A = F.archive, ps = P.shown, qs = F.poem.shown
    const shown = !ps.length && !qs.length ? 'neither has yet stood on the home' : ps.length && qs.length ? `this photograph stood on the home on ${dates(ps)}, ${T} on ${dates(qs)}`
      : ps.length ? `this photograph stood on the home on ${dates(ps)}` : `${T} stood on the home on ${dates(qs)}`
    out['Keeping track'] = [{ s: k1, at: 'intro' }, { s: `The archive has kept ${A.days} days since ${A.since}; ${shown}, and ${A.hasToday ? 'today’s pair is already in it' : `${now}’s pair joins it at day’s end`}.`, at: 'intro' }]
    // Staying up to date: what on this screen was read, and when; the day frozen, never reshuffled
    const up = [S.place && S.phrase ? `The sky over ${S.place} was read ${S.readAt ? `at ${S.readAt}` : 'as this page opened'}, against where he is as last written, on ${S.written}.`
      : `Where he is was last written on ${S.written}${S.place ? `; the sky over ${S.place} could not be read` : ', with no city this page may name'}.`]
    up.push(F.how === 'live' ? (A.hasToday ? 'Today’s pair follows that reading; the archive already holds this day, and once it has passed it replays exactly as kept, never reshuffled.' : `Today’s pair follows that reading until ${A.freeze}, when it is frozen into the archive; from then on the day replays exactly as kept, never reshuffled.`)
      : F.how === 'frozen' ? 'Today’s pair is already frozen in the archive and replays exactly as kept, never reshuffled.' : 'With no reading, today’s pair falls to the date, the same on every visit, never reshuffled.')
    out['Staying up to date'] = up.map(s => ({ s, at: 'intro' }))
    // Self-healing: the two publishers behind this page are watched lanes; when each last ran
    const heal = []
    if (F.publishers === 'two') heal.push({ s: 'Two publishers stand behind this page, one writing where he is and one keeping each day’s pair, and both are among the lanes the self-healing checks watch.', at: 'Samwise' })
    heal.push({ s: `Where he is was last written on ${S.written}, and the last day the archive kept is ${A.last}.`, at: 'Samwise' })
    out['Self-healing'] = heal
    // Home: this page is one of its surfaces, and what it carries; the city at the precision it reaches the page
    const hm = F.home ? `This page is the ${F.home.at === F.home.of - 1 ? 'last' : ORDW[F.home.at]} of the ${COUNT[F.home.of] || F.home.of} surfaces Home looks after, and ${now} it carries a photograph from ${P.place}${/,/.test(P.place) ? ',' : ''} and ${T}${S.place ? ` under ${S.place}’s sky` : ''}.` : null
    out['Home'] = [hm && { s: hm, at: 'This page' }, { s: S.place && S.decimals != null && PLACES[S.decimals] ? `The city under his name reaches it rounded to a ${PLACES[S.decimals]} of a degree, and only when where he is is known with confidence; a weaker reading leaves the line unsaid.`
      : `Where he is goes unsaid ${now}, as it does whenever it is not known with confidence.`, at: 'boundary' }].filter(Boolean)
    return out }

  window.S42 = { load, facts, say }
})()
