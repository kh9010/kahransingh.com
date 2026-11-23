/* studies/46/work.js — 44 d (the working, shown) and the stone, as one page. ?v=
     a  the working ends in the stone: the stone, live, is the sixth step
     b  the stone first, the working beneath
     c  the working behind the where line: the line opens it over the stone
   The working is 44's, carried over whole (v4.js up to its four ways): today's pair from today.js (the home's own pick),
   every distance from pick.js's own functions, the six ideas from IDEAS, his words read off the pages they live on.
   The stone is the live one: /v3/stone.js as the home runs it, held in a frame through studies/45 (?v=r&bare=1: its
   reading dials, nothing laid over it). A frame is how a study can hold it without changing it; a version that went
   live would give the stone a section of the page instead. The sentences written here are in SAID. */
(async () => {
  const way = document.documentElement.dataset.v
  if (!way) return
  document.querySelectorAll('.ways a').forEach(a => { if (a.dataset.w === way) a.setAttribute('aria-current', 'page') })
  await window.S37T

  /* the sentences this study wrote; everything else on the page is his or counted */
  const SAID = {
    daily: 'A different photograph and a different poem every day, chosen for where I am and what the sky is doing.', // the home's own description, in the first person
    open: 'This is today’s, worked out in the open.',
    cut: 'Then the two are cut into one stone: the photograph broken across it, the poem broken across it. Every piece of it opens onto more of my work.',
    live: 'This is the stone itself.',
    under: 'How these two were chosen today',
    steps: 'six steps, beneath',
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

  /* ---------- the working's parts (44 d's) ---------- */
  const tick = (cls, v) => v == null ? '' : '<i class="' + cls + '" style="left:' + (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%"></i>'
  const axes = () => !day ? '' : '<div class="axes">' + AX.map(a => '<div class="axis"><b>' + NAMES[a] + '</b><span>' + ENDS[a][0] + '</span><div class="track">' +
    tick('day', day[a]) + (shown ? tick('ph', nearPh.pick.vec[a]) + tick('po', nearPo.pick.vec[a]) : '') + '</div><span>' + ENDS[a][1] + '</span></div>').join('') + '</div>' +
    '<p class="key"><span><i class="day"></i>today</span>' + (shown ? '<span><i class="ph"></i>the photograph it chose</span><span><i class="po"></i>the poem it chose</span>' : '') + '</p>'
  const list = (N, name) => { if (!shown) return ''; const open = N.rows.filter(r => !r.held).slice(0, 5), far = open[open.length - 1].dist || 1
    return '<ol class="near">' + open.map((r, i) => '<li class="' + (i ? '' : 'is') + '"><span>' + (i + 1) + '</span><span>' + name(r.it) + (r.lift ? '<small>lifted, near ' + esc(city) + '</small>' : '') + '</span><span class="bar"><i style="width:' + Math.round(100 * (1 - r.dist / (far * 1.6))) + '%"></i></span><em>' + r.dist.toFixed(2) + '</em></li>').join('') + '</ol>' }
  const step = (n, label, body, cls) => '<section class="step' + (cls ? ' ' + cls : '') + '"><header><b>' + n + '</b><span class="lab">' + label + '</span></header><div>' + body + '</div></section>'
  const ctxTool = IDEAS[0] && IDEAS[0].detail.tools[2] ? IDEAS[0].detail.tools[2].split('. ')[0] + '.' : ''
  const top = () => '<header class="top"><a class="name" href="?v=' + way + '">kahran singh</a><nav><a href="/poetry.html">poems</a><a href="/photography.html">photographs</a><a href="/about.html">about</a></nav></header>'
  const intro = () => '<p class="said">' + SAID.daily + '</p><p>' + SAID.open + ' ' + esc(lede) + '</p>'
  const five = () =>
    step(1, 'Where', '<p class="big">' + esc(city || 'Not known today') + '</p><p class="note"><b>' + esc(IDEAS[0] ? IDEAS[0].parts[2] : '') + '</b> ' + esc(ctxTool) + '</p>') +
    step(2, 'The sky', '<div class="sky">' + [[sky.replace(/^it’s |^it's /, ''), 'the sky'], [temp != null && deg(temp), 'temperature'], [cloud != null && Math.round(cloud) + '%', 'cloud'], [wind != null && Math.round(wind) + ' km/h', 'wind']].filter(x => x[0]).map(([v, k]) => '<div>' + esc(v) + '<small>' + k + '</small></div>').join('') + '</div>' +
      '<p class="note">' + (live ? 'Read a moment ago, for ' + esc(city) + '.' : entry ? 'The reading kept for the day; the sky could not be read just now.' : 'The sky could not be read just now.') + '</p>') +
    step(3, 'What the day asks for', axes() + '<p class="note" style="margin-top:1rem">Seven measures, each from the reading above and the date. Every photograph and every poem has been placed on the same seven.</p>') +
    step(4, 'The photograph', (shown ? '<p class="note">' + nearPh.n + ' weighed. ' + nearPh.held + ' were seen in the last ' + nov[2] + ' days and are held back. The nearest of the rest:</p>' + list(nearPh, it => esc(it.alt) + '<small>' + esc(capPlace(it.caption)) + '</small>') : '') + photoHTML('')) +
    step(5, 'The poem', (shown ? '<p class="note">' + nearPo.n + ' weighed. ' + nearPo.held + ' were seen in the last ' + nov[1] + ' days and are held back. The nearest of the rest:</p>' + list(nearPo, it => esc(it.title)) : '') + poemHTML())
  const behind = n => step(n, 'What runs behind it', '<div class="letter"><p>' + machine + '</p></div>' + ideasHTML())
  const stone = () => '<iframe class="stone" src="../45/?v=r&amp;bare=1" title="Today’s photograph and poem, cut into a stone"></iframe>'

  /* ---------- a · the working ends in the stone ---------- */
  const A = () => '<div class="d">' + top() + intro() + five() +
    step(6, 'Cut into a stone', '<p class="note fr" style="font:400 1.1875rem/1.5 \'Fraunces\',Georgia,serif;color:var(--ink)">' + SAID.cut + '</p>', 'cut') +
    '<div class="held wide">' + stone() + '</div><p class="note" style="font:400 .9375rem/1.5 \'Space Grotesk\',sans-serif;color:var(--quiet);padding-bottom:2.2rem">' + SAID.live + '</p>' +
    behind(7) + footHTML() + '</div>'

  /* ---------- b · the stone first, the working beneath ---------- */
  const B = () => '<div class="first">' + stone() + '<a class="under" href="#working"><b>' + SAID.under + '</b><span>' + SAID.steps + ' ↓</span></a>' +
    '<div class="d" id="working">' + intro() + five() + behind(6) + footHTML() + '</div></div>'

  /* ---------- c · the working behind the where line ---------- */
  const C = () => '<div class="behind">' + stone() + '</div><div class="sheet" id="sheet" role="dialog" aria-label="' + SAID.under + '"><button class="x" type="button" aria-label="close">×</button><div class="d">' + intro() + five() + behind(6) + footHTML() + '</div></div>'

  document.getElementById('page').innerHTML = ({ a: A, b: B, c: C })[way]()
  document.title = 'Kahran Singh'
  if (way === 'b') document.querySelector('.under').addEventListener('click', e => { e.preventDefault(); document.getElementById('working').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) })
  if (way === 'c') { // the stone's own line, where he is and the sky, opens the working instead of the stone's panel
    const sheet = document.getElementById('sheet'), f = document.querySelector('.stone'), x = sheet.querySelector('.x')
    const open = () => { sheet.classList.add('on'); sheet.scrollTop = 0; x.focus({ preventScroll: true }) }
    const shut = () => { sheet.classList.remove('on'); try { f.contentDocument.getElementById('where').focus({ preventScroll: true }) } catch {} }
    const hook = () => { const d = f.contentDocument; if (!d || d.__held) return; d.__held = true
      d.addEventListener('click', e => { if (e.target.closest && e.target.closest('#where')) { e.preventDefault(); e.stopPropagation(); open() } }, true)
      d.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key) && e.target.closest && e.target.closest('#where')) { e.preventDefault(); e.stopPropagation(); open() } }, true) }
    f.addEventListener('load', hook); hook()
    x.addEventListener('click', shut); addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) shut() })
  }
})()
