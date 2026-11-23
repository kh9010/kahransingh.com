/* studies/44/v4.js — four homes for the same day (?v= a the letter · b the front page · c the spread · d the working, shown).
   Nothing here is made up or copied: today's pair comes from today.js (the home's own pick: /v2/weather.js, /v2/pick.js,
   /v2/data.json, /v2/days.json), every distance from pick.js's own functions, the six ideas from IDEAS in /v2/home.js,
   the door lines from /v3/doors.json (the stone's vocabulary), and every passage in his voice is read off the page it
   lives on (/about.html, /v2/about.html, /v1/index.html, /v2/index.html). The few joining sentences written for this
   study are in SAID below, in one place, so they can be read and replaced. */
(async () => {
  const way = document.documentElement.dataset.v
  if (!way) return
  document.querySelectorAll('.ways a').forEach(a => { if (a.dataset.w === way) a.setAttribute('aria-current', 'page') })
  await window.S37T

  /* the sentences this study wrote; everything else on the page is his or counted */
  const SAID = {
    chose: 'For a day like this one, it chose these two.',
    daily: 'A different photograph and a different poem every day, chosen for where I am and what the sky is doing.', // the home's own description, in the first person
    open: 'This is today’s, worked out in the open.',
    six: 'The tools are six ideas.',
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const text = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '')
  const json = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
  const doc = async u => new DOMParser().parseFromString(await text(u), 'text/html')
  function literal(src, name) { // stone.js's: a literal read out of the source it lives in
    const at = src.indexOf('var ' + name + ' = '); if (at < 0) return null
    const s0 = at + name.length + 7
    let depth = 0, q = null
    for (let i = s0; i < src.length; i++) { const c = src[i]
      if (q) { if (c === '\\') i++; else if (c === q) q = null; continue }
      if (c === "'" || c === '"') { q = c; continue }
      if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue }
      if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return new Function('return ' + src.slice(s0, i + 1))() }
    return null
  }

  const line = document.createElement('span')
  const [ctx, homeJs, pickJs, doors, place, about, letter, first, wall] = await Promise.all([
    window.S14.load(line), text('/v2/home.js'), text('/v2/pick.js'), json('/v3/doors.json'), json('/v2/place.json'),
    doc('/about.html'), doc('/v2/about.html'), doc('/v1/index.html'), doc('/v2/index.html')])
  const IDEAS = literal(homeJs, 'IDEAS') || []
  const K = window.kahranPick, P = K && K.__test

  /* ---------- the day ---------- */
  const iso = ctx.iso, entry = ctx.days && ctx.days.days && ctx.days.days[iso]
  const live = ctx.how === 'live', R = ctx.reading || {}, why = (entry && entry.why) || {}
  const at = new Date(iso + 'T12:00:00Z')
  const fmt = o => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(at)
  const dateLong = fmt({ weekday: 'long' }) + ' ' + fmt({ day: 'numeric', month: 'long', year: 'numeric' })
  const LAUNCH = (/var LAUNCH\s*=\s*'([\d-]+)'/.exec(homeJs) || [])[1]
  const dayNo = LAUNCH ? Math.round((at - new Date(LAUNCH + 'T12:00:00Z')) / 864e5) + 1 : null
  const city = R.place || (place && place.place) || (entry && entry.place && entry.place.split(',')[0]) || ''
  const where = line.textContent || (city ? 'We’re in ' + city + '.' : '')
  const sky = (/ and (.+)\.$/.exec(line.textContent) || [])[1] || '' // "it's overcast", weather.js's own phrase
  const num = (a, b) => a != null ? a : b != null ? b : null
  const temp = num(R.temperature_2m, why.tmax), cloud = num(R.cloud_cover, why.cloud_pct), wind = num(R.wind_speed_10m, why.wind_kmh)
  const deg = t => Math.round(t) + '°'

  /* ---------- the measures and the nearest, by pick.js's own functions ---------- */
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  const ENDS = { light: ['dark', 'bright'], warmth: ['cold', 'warm'], wet: ['dry', 'wet'], stillness: ['wind', 'calm'], season: ['midwinter', 'midsummer'], inside: ['indoors', 'out of doors'], mood: ['grief', 'joy'] } // why.js's
  const NAMES = { light: 'light', warmth: 'warmth', wet: 'wet', stillness: 'calm', season: 'season', inside: 'out of doors', mood: 'mood' }
  const nov = /NOVELTY_DAYS\s*=\s*\{\s*poem:\s*(\d+),\s*photo:\s*(\d+)\s*\}/.exec(pickJs), pen = /NOVELTY_PENALTY\s*=\s*(-?[\d.]+)/.exec(pickJs)
  let day = null
  try { day = !P ? null : live ? P.dayVectorFromCurrent(iso, R, R.lat != null ? R.lat : null) : entry && entry.why ? P.dayVectorFromWhy(entry.why) : null } catch {}
  const shift = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)
  function nearest(kind) {
    if (!day || !nov || !pen) return null
    const photo = kind === 'photo', key = photo ? 'src' : 'slug', items = photo ? ctx.data.photos : ctx.data.poems
    const scores = photo ? { photos: ctx.ps } : { poems: ctx.qs }
    const cutoff = shift(iso, -(photo ? +nov[2] : +nov[1]))
    const shown = new Set(Object.entries(ctx.days.days).filter(([d]) => d >= cutoff && d < iso).map(([, e]) => e[kind]))
    const rows = items.map(it => { const k = it[key], vec = P.itemVector(scores, k), dist = P.weightedDistance(day, vec)
      const lift = photo && live ? P.placeBonus((ctx.ps[k] || {}).place, R.lat != null ? R.lat : null, R.lon != null ? R.lon : null) : 0
      return { it, k, vec, dist, lift, held: shown.has(k), score: -dist + lift + (shown.has(k) ? +pen[1] : 0) + P.tiebreak(iso, k) } })
    rows.sort((x, y) => y.score - x.score)
    const chosen = photo ? ctx.photo.src : ctx.poem.slug
    return { rows, n: rows.length, held: rows.filter(r => r.held).length, agrees: rows[0].k === chosen, pick: rows.find(r => r.k === chosen) }
  }
  let nearPh = null, nearPo = null
  try { nearPh = nearest('photo'); nearPo = nearest('poem') } catch {}
  const shown = nearPh && nearPo && nearPh.agrees && nearPo.agrees // the list is shown only when it is the list the pick came from

  /* ---------- the pieces ---------- */
  const capPlace = c => String(c || '').split(' — ')[0]
  const voc = doors && doors.vocabs && doors.vocabs.his
  const slugs = new Set(ctx.data.poems.map(p => p.slug))
  const doorOf = voc && voc.poems[ctx.poem.slug] ? voc.poems[ctx.poem.slug].map(d => {
    const w = voc.words.find(x => x.word === d.word), kin = w ? w.poems.filter(s => slugs.has(s)) : []
    const i = kin.indexOf(ctx.poem.slug), to = kin.length > 1 ? kin[(i + 1) % kin.length] : null
    return to && to !== ctx.poem.slug ? { phrase: d.phrase, word: d.word, to } : null }).filter(Boolean) : []
  const poemHTML = () => '<article class="poem"><h2><a href="/poems/' + ctx.poem.slug + '.html">' + esc(ctx.poem.title) + '</a></h2>' +
    ctx.stanzas.map(st => '<p>' + st.map(l => {
      for (const d of doorOf) { const i = l.indexOf(d.phrase); if (i >= 0) return '<span class="l">' + esc(l.slice(0, i)) + '<a class="door" href="/poems/' + d.to + '.html" title="' + esc(d.word) + '">' + esc(d.phrase) + '</a>' + esc(l.slice(i + d.phrase.length)) + '</span>' }
      return '<span class="l">' + esc(l) + '</span>' }).join('') + '</p>').join('') + '</article>'
  const photoHTML = cls => '<figure class="' + cls + '"><img src="' + ctx.photo.src + '" alt="' + esc(ctx.photo.alt) + '"><figcaption>' + esc(ctx.photo.caption) + '</figcaption></figure>'
  const skyBits = [sky.replace(/^it’s |^it's /, ''), temp != null && deg(temp), cloud != null && 'cloud ' + Math.round(cloud) + '%', wind != null && 'wind ' + Math.round(wind) + ' km/h'].filter(Boolean)
  const whyHTML = (open) => '<details class="why"' + (open ? ' open' : '') + '><summary><span>Why these two</span></summary><dl>' +
    '<dt>Where</dt><dd>' + esc(city || 'not known today') + '</dd>' +
    '<dt>The sky</dt><dd>' + esc(skyBits.join(', ') || 'not read') + (live ? '' : entry ? ', as kept for the day' : '') + '</dd>' +
    '<dt>Weighed</dt><dd>' + ctx.data.photos.length + ' photographs and ' + ctx.data.poems.length + ' poems, each on seven measures: ' + AX.map(a => NAMES[a]).join(', ') + '</dd>' +
    (shown ? '<dt>Nearest</dt><dd>' + esc(capPlace(ctx.photo.caption)) + ', ' + nearPh.pick.dist.toFixed(2) + ' away; ' + esc(ctx.poem.title) + ', ' + nearPo.pick.dist.toFixed(2) + ' away</dd>' +
      '<dt>Held back</dt><dd>' + nearPh.held + ' photographs seen in the last ' + nov[2] + ' days, ' + nearPo.held + ' poems in the last ' + nov[1] + '</dd>' : '') +
    '<dd class="more"><a href="?v=d">The whole working</a></dd></dl></details>'
  const ideasHTML = () => '<div class="ideas">' + IDEAS.map(I => '<details><summary><b>' + esc(I.name) + '</b><span>' + esc(I.line) + '</span><i></i></summary><p>' + esc(I.detail.intro) +
    (I.href ? ' <a class="u" href="' + I.href + '">its page</a>' : '') + '</p></details>').join('') + '</div>'
  const q = (d, sel) => [...d.querySelectorAll(sel)]
  const clean = el => { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('[style]').forEach(x => x.removeAttribute('style')); return c.innerHTML.trim() }
  const lede = (q(about, 'p.lede')[0] || {}).textContent || ''                    // "I make poems, photographs, tools and companies, and I am learning Kathak."
  const L = q(letter, '.letter p')                                                // the letter picked at the About desk
  const machine = clean(L[1]).replace('on the home page', 'on this page'), write = clean(L[L.length - 1])
  const currents = clean(q(first, '.home-currents p')[0])                         // the first home's paragraph, links and all
  const doing = q(wall, '.doing-bullet').map(b => b.textContent.trim())
  const notes = q(wall, '.doing-item').map(li => { const n = li.querySelector('.doing-note'); if (!n) return ''; const c = n.cloneNode(true); c.querySelectorAll('a, span').forEach(x => x.remove()); return c.textContent.trim() })
  const doingLine = (q(wall, '.doing-line')[0] || {}).textContent || ''           // "Right now I'm:"
  const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.'
  const links = [['/poetry.html', 'all ' + ctx.data.poems.length + ' poems'], ['/photography.html', 'the photographs'], ['/poem-films.html', 'the poem films'], ['/about.html', 'the years'], ['/lately/', 'the weekly record'], ['/working-with-me.html', 'work with me']]
  const footHTML = () => '<p class="foot">' + links.map(([h, t]) => '<a href="' + h + '">' + t + '</a>').join('') + '</p>'
  const before = Object.entries(ctx.days.days).filter(([d]) => d < iso).sort().slice(-6).reverse().map(([d, e]) => {
    const po = ctx.data.poems.find(p => p.slug === e.poem), ph = ctx.data.photos.find(p => p.src === e.photo); if (!po) return ''
    const t = new Date(d + 'T12:00:00Z'), lab = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' }).format(t)
    return '<li><time datetime="' + d + '">' + lab + '</time><span><a href="/poems/' + po.slug + '.html">' + esc(po.title) + '</a><small>' + esc(ph ? capPlace(ph.caption) : '') + '</small></span></li>' }).join('')

  /* ---------- a · the letter ---------- */
  const A = () => '<div class="a">' +
    '<header class="top"><a class="name" href="?v=a">kahran singh</a><nav><a href="/poetry.html">poems</a><a href="/photography.html">photographs</a><a href="/about.html">about</a></nav></header>' +
    '<p class="lab date">' + dateLong + (city ? ' · ' + esc(city) : '') + '</p>' +
    '<div class="letter"><p class="hello">' + hello + ' I’m Kahran.</p><p>' + machine + '</p><p>' + esc(where) + ' ' + SAID.chose + '</p></div>' +
    photoHTML('print') + poemHTML() + whyHTML(false) +
    '<div class="letter"><p>' + SAID.six + '</p></div>' + ideasHTML() +
    '<div class="letter"><p>' + esc(doingLine.replace(/:$/, '')) + ' ' + esc(doing.slice(0, -1).join(', ') + (doing.length > 1 ? ', and ' : '') + doing[doing.length - 1]) + '.</p><p>' + currents + '</p><p>' + write + '</p></div>' +
    footHTML() + '</div>'

  /* ---------- b · the front page ---------- */
  const B = () => '<div class="b">' +
    '<header class="mast"><h1>Kahran Singh</h1><p>' + esc(lede) + '</p></header>' +
    '<p class="dateline"><span class="lab">' + dateLong + '</span><span class="lab">' + (dayNo ? 'No. ' + dayNo : '') + '</span><span class="lab">' + esc([city, sky.replace(/^it’s |^it's /, ''), temp != null && deg(temp)].filter(Boolean).join(' · ')) + '</span></p>' +
    '<nav class="sections"><a href="/poetry.html">Poems</a><a href="/photography.html">Photographs</a><a href="/poem-films.html">Films</a><a href="/context/">Tools</a><a href="/about.html">Years</a><a href="/working-with-me.html">Work with me</a></nav>' +
    '<section class="lead"><div><p class="lab">This moment’s photograph</p>' + photoHTML('') + '<p class="said">' + SAID.daily + '</p>' + whyHTML(true) + '</div>' +
    '<div class="col"><p class="lab">This moment’s poem</p>' + poemHTML() + '</div></section>' +
    '<div class="bands"><section class="slim now"><h3 class="lab">' + esc(doingLine) + '</h3><ul>' + doing.map((t, i) => '<li>' + esc(t) + (notes[i] ? '<small>' + esc(notes[i]) + '</small>' : '') + '</li>').join('') + '</ul></section>' +
    '<section class="wide"><h3 class="lab">' + esc(doing[0] || 'Tools') + '</h3>' + ideasHTML() + '</section>' +
    '<section class="before"><h3 class="lab">The days before</h3><ul>' + before + '</ul></section></div>' +
    '<div class="who"><div class="letter"><p>' + currents + '</p></div>' + footHTML() + '</div>' +
    '</div>'

  /* ---------- c · the spread ---------- */
  const C = () => '<div class="c">' +
    '<figure class="plate"><a class="name" href="?v=c">kahran singh</a><div class="hold"><img src="' + ctx.photo.src + '" alt="' + esc(ctx.photo.alt) + '"></div><figcaption>' + esc(ctx.photo.caption) + '</figcaption></figure>' +
    '<div class="page"><p class="said">' + esc(lede) + '<em>' + SAID.daily.replace(', chosen for where I am and what the sky is doing', '') + ' ' + esc(where) + '</em></p>' +
    poemHTML() +
    '<div class="end">' + whyHTML(false) + '<p class="foot"><a href="/poetry.html">poems <b>' + ctx.data.poems.length + '</b></a><a href="/photography.html">photographs</a><a href="/context/">tools <b>' + IDEAS.length + '</b></a><a href="/about.html">years</a><a href="/poem-films.html">films</a></p></div></div>' +
    '</div>'

  /* ---------- d · the working, shown ---------- */
  const tick = (cls, v) => v == null ? '' : '<i class="' + cls + '" style="left:' + (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%"></i>'
  const axes = () => !day ? '' : '<div class="axes">' + AX.map(a => '<div class="axis"><b>' + NAMES[a] + '</b><span>' + ENDS[a][0] + '</span><div class="track">' +
    tick('day', day[a]) + (shown ? tick('ph', nearPh.pick.vec[a]) + tick('po', nearPo.pick.vec[a]) : '') + '</div><span>' + ENDS[a][1] + '</span></div>').join('') + '</div>' +
    '<p class="key"><span><i class="day"></i>today</span>' + (shown ? '<span><i class="ph"></i>the photograph it chose</span><span><i class="po"></i>the poem it chose</span>' : '') + '</p>'
  const list = (N, name) => { if (!shown) return ''; const open = N.rows.filter(r => !r.held).slice(0, 5), far = open[open.length - 1].dist || 1
    return '<ol class="near">' + open.map((r, i) => '<li class="' + (i ? '' : 'is') + '"><span>' + (i + 1) + '</span><span>' + name(r.it) + (r.lift ? '<small>lifted, near ' + esc(city) + '</small>' : '') + '</span><span class="bar"><i style="width:' + Math.round(100 * (1 - r.dist / (far * 1.6))) + '%"></i></span><em>' + r.dist.toFixed(2) + '</em></li>').join('') + '</ol>' }
  const step = (n, label, body) => '<section class="step"><header><b>' + n + '</b><span class="lab">' + label + '</span></header><div>' + body + '</div></section>'
  const ctxTool = IDEAS[0] && IDEAS[0].detail.tools[2] ? IDEAS[0].detail.tools[2].split('. ')[0] + '.' : ''
  const D = () => '<div class="d">' +
    '<header class="top"><a class="name" href="?v=d">kahran singh</a><nav><a href="/poetry.html">poems</a><a href="/photography.html">photographs</a><a href="/about.html">about</a></nav></header>' +
    '<p class="said">' + SAID.daily + '</p><p>' + SAID.open + ' ' + esc(lede) + '</p>' +
    step(1, 'Where', '<p class="big">' + esc(city || 'Not known today') + '</p><p class="note"><b>' + esc(IDEAS[0] ? IDEAS[0].parts[2] : '') + '</b> ' + esc(ctxTool) + '</p>') +
    step(2, 'The sky', '<div class="sky">' + [[sky.replace(/^it’s |^it's /, ''), 'the sky'], [temp != null && deg(temp), 'temperature'], [cloud != null && Math.round(cloud) + '%', 'cloud'], [wind != null && Math.round(wind) + ' km/h', 'wind']].filter(x => x[0]).map(([v, k]) => '<div>' + esc(v) + '<small>' + k + '</small></div>').join('') + '</div>' +
      '<p class="note">' + (live ? 'Read a moment ago, for ' + esc(city) + '.' : entry ? 'The reading kept for the day; the sky could not be read just now.' : 'The sky could not be read just now.') + '</p>') +
    step(3, 'What the day asks for', axes() + '<p class="note" style="margin-top:1rem">Seven measures, each from the reading above and the date. Every photograph and every poem has been placed on the same seven.</p>') +
    step(4, 'The photograph', (shown ? '<p class="note">' + nearPh.n + ' weighed. ' + nearPh.held + ' were seen in the last ' + nov[2] + ' days and are held back. The nearest of the rest:</p>' + list(nearPh, it => esc(it.alt) + '<small>' + esc(capPlace(it.caption)) + '</small>') : '') + photoHTML('')) +
    step(5, 'The poem', (shown ? '<p class="note">' + nearPo.n + ' weighed. ' + nearPo.held + ' were seen in the last ' + nov[1] + ' days and are held back. The nearest of the rest:</p>' + list(nearPo, it => esc(it.title)) : '') + poemHTML()) +
    step(6, 'What runs behind it', '<div class="letter"><p>' + machine + '</p></div>' + ideasHTML()) +
    footHTML() + '</div>'

  document.getElementById('page').innerHTML = ({ a: A, b: B, c: C, d: D })[way]()
  document.title = 'Kahran Singh'
})()
