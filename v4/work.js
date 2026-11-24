/* v4/work.js — the working beneath the stone (Study 47; 44 d's six steps): how today's photograph and poem were chosen.
   It takes the day from the stone itself (HOME.ctx: the pick, the reading, the archive, the scores), so what it works out is the pair the
   stone is showing; every distance is pick.js's own function; the six ideas are IDEAS, read where they live.
   It waits until the stone is up, so none of it is first-screen weight. It also fills
   the strip at the stone's foot and makes the strip the way down, and says so once to track.js (working_open, via strip | scroll). It ends with the rest of the site,
   the site's one list of sections, the same the stone's nav holds.
   The sentences written here are in SAID. */
(async () => {
  const until = async f => { for (let k = 0; k < 400; k++) { let v = null; try { v = f() } catch {} if (v) return v; await new Promise(r => setTimeout(r, 80)) } return null }
  const ctx = await until(() => document.body.dataset.ready === 'yes' && window.HOME && window.HOME.world0 && window.HOME.ctx) // once the stone is up: its own day, the same pick, the same reading
  if (!ctx) return

  /* the sentences this study wrote; everything else on the page is his or counted */
  const SAID = {
    daily: 'A different photograph and a different poem every day, chosen for where I am and what the sky is doing.', // the home's own description, in the first person
    open: 'This is today’s, worked out in the open.',
    weighed: (ph, po) => ph + ' photographs and ' + po + ' poems weighed',
    rest: 'The rest of the site', // the stone's own label for its nav
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const text = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '')
  const json = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
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

  const said = (document.querySelector('#where .sent') || document.getElementById('where')).textContent.trim() // the stone's own line, as weather.js wrote it
  const line = { textContent: /^We.re in /.test(said) ? said : '' }
  const [homeJs, pickJs, doors, place] = await Promise.all([text('/v2/home.js'), text('/v2/pick.js'), json('/v4/doors.json'), json('/v2/place.json')])
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
  const poemHTML = () => '<article class="poem"><h4><a href="/poems/' + ctx.poem.slug + '.html">' + esc(ctx.poem.title) + '</a></h4>' +
    ctx.stanzas.map(st => '<p>' + st.map(l => {
      for (const d of doorOf) { const i = l.indexOf(d.phrase); if (i >= 0) return '<span class="l">' + esc(l.slice(0, i)) + '<a class="door" href="/poems/' + d.to + '.html" title="' + esc(d.word) + '">' + esc(d.phrase) + '</a>' + esc(l.slice(i + d.phrase.length)) + '</span>' }
      return '<span class="l">' + esc(l) + '</span>' }).join('') + '</p>').join('') + '</article>'
  const photoHTML = cls => '<figure class="' + cls + '"><img src="' + ctx.photo.src + '" alt="' + esc(ctx.photo.alt) + '" loading="lazy" decoding="async"><figcaption>' + esc(ctx.photo.caption) + '</figcaption></figure>'
  const skyBits = [sky.replace(/^it’s |^it's /, ''), temp != null && deg(temp), cloud != null && 'cloud ' + Math.round(cloud) + '%', wind != null && 'wind ' + Math.round(wind) + ' km/h'].filter(Boolean)
  const ideasHTML = () => '<div class="ideas">' + IDEAS.map(I => '<details><summary><b>' + esc(I.name) + '</b><span>' + esc(I.line) + '</span><i></i></summary><p>' + esc(I.detail.intro) +
    (I.href ? ' <a class="u" href="' + I.href + '">its page</a>' : '') + '</p></details>').join('') + '</div>'
  // the rest of the site: the site's one list of sections, in the words and the order every page's nav has them (tools/test_home.mjs holds them equal)
  const REST = [['/poetry.html', 'poetry', ctx.data.poems.length + ' poems'], ['/photography.html', 'photography'], ['/poem-films.html', 'films'], ['/projects.html', 'projects'], ['/lately/', 'lately', 'the weekly record'],
    ['/working-with-me.html', 'work with me'], ['/speaking.html', 'speaking'], ['/archive.html', 'archive'], ['/about.html', 'about', 'the years']]
  const restHTML = () => '<nav class="rest" id="rest" aria-label="Every section of the site"><h2 class="lab">' + SAID.rest + '</h2><ul>' + REST.map(([h, t, n]) => '<li><a href="' + h + '">' + t + (n ? '<small>' + n + '</small>' : '') + '</a></li>').join('') + '</ul></nav>'
  /* ---------- the working's parts (44 d's) ---------- */
  const tick = (cls, v) => v == null ? '' : '<i class="' + cls + '" style="left:' + (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%"></i>'
  const axes = () => !day ? '' : '<div class="axes">' + AX.map(a => '<div class="axis"><b>' + NAMES[a] + '</b><span>' + ENDS[a][0] + '</span><div class="track">' +
    tick('day', day[a]) + (shown ? tick('ph', nearPh.pick.vec[a]) + tick('po', nearPo.pick.vec[a]) : '') + '</div><span>' + ENDS[a][1] + '</span></div>').join('') + '</div>' +
    '<p class="key"><span><i class="day"></i>today</span>' + (shown ? '<span><i class="ph"></i>the photograph it chose</span><span><i class="po"></i>the poem it chose</span>' : '') + '</p>'
  const list = (N, name) => { if (!shown) return ''; const open = N.rows.filter(r => !r.held).slice(0, 5), far = open[open.length - 1].dist || 1
    return '<ol class="near">' + open.map((r, i) => '<li class="' + (i ? '' : 'is') + '"><span>' + (i + 1) + '</span><span>' + name(r.it) + (r.lift ? '<small>lifted, near ' + esc(city) + '</small>' : '') + '</span><span class="bar"><i style="width:' + Math.round(100 * (1 - r.dist / (far * 1.6))) + '%"></i></span><em>' + r.dist.toFixed(2) + '</em></li>').join('') + '</ol>' }
  const step = (n, label, body, cls) => '<section class="step' + (cls ? ' ' + cls : '') + '"><div class="hd"><b aria-hidden="true">' + n + '</b><h3 class="lab">' + label + '</h3></div><div>' + body + '</div></section>'
  const ctxTool = IDEAS[0] && IDEAS[0].detail.tools[2] ? IDEAS[0].detail.tools[2].split('. ')[0] + '.' : ''
  const intro = () => '<h2 class="said">' + SAID.daily + '</h2><p>' + SAID.open + '</p>'
  const five = () =>
    step(1, 'Where', '<p class="big">' + esc(city || 'Not known today') + '</p><p class="note"><b>' + esc(IDEAS[0] ? IDEAS[0].parts[2] : '') + '</b> ' + esc(ctxTool) + '</p>') +
    step(2, 'The sky', '<div class="sky">' + [[sky.replace(/^it’s |^it's /, ''), 'the sky'], [temp != null && deg(temp), 'temperature'], [cloud != null && Math.round(cloud) + '%', 'cloud'], [wind != null && Math.round(wind) + ' km/h', 'wind']].filter(x => x[0]).map(([v, k]) => '<div>' + esc(v) + '<small>' + k + '</small></div>').join('') + '</div>' +
      '<p class="note">' + (live ? 'Read a moment ago, for ' + esc(city) + '.' : entry ? 'The reading kept for the day; the sky could not be read just now.' : 'The sky could not be read just now.') + '</p>') +
    step(3, 'What the day asks for', axes() + '<p class="note" style="margin-top:1rem">Seven measures, each from the reading above and the date. Every photograph and every poem has been placed on the same seven.</p>') +
    step(4, 'The photograph', (shown ? '<p class="note">' + nearPh.n + ' weighed. ' + nearPh.held + ' were seen in the last ' + nov[2] + ' days and are held back. The nearest of the rest:</p>' + list(nearPh, it => esc(it.alt) + '<small>' + esc(capPlace(it.caption)) + '</small>') : '') + photoHTML('')) +
    step(5, 'The poem', (shown ? '<p class="note">' + nearPo.n + ' weighed. ' + nearPo.held + ' were seen in the last ' + nov[1] + ' days and are held back. The nearest of the rest:</p>' + list(nearPo, it => esc(it.title)) : '') + poemHTML())
  const behind = n => step(n, 'What runs behind it', ideasHTML()) // the six ideas and nothing before them (Kahran, 24 Nov, of the paragraph that stood here: "super weird … just need to go")

  /* ---------- the page beneath the stone ---------- */
  document.getElementById('working').innerHTML = '<div class="d">' + intro() + five() + behind(6) + restHTML() + '</div>'
  document.getElementById('under-day').innerHTML = esc([city, sky.replace(/^it’s |^it's /, ''), temp != null && deg(temp), SAID.weighed(ctx.data.photos.length, ctx.data.poems.length)].filter(Boolean).join(' · ')) + '<i>↓</i>'
})()
// the strip is the way down, and the room above it is exactly the stone's (the window less the strip), whatever the browser's bars do
;(() => { const room = document.querySelector('.room'), under = document.querySelector('.under'), still = matchMedia('(prefers-reduced-motion: reduce)')
  const fit = () => { room.style.height = (innerHeight - under.offsetHeight) + 'px' }
  fit(); addEventListener('resize', fit)
  const track = via => { if (track.done) return; track.done = true; document.dispatchEvent(new CustomEvent('home:track', { detail: { name: 'working_open', params: { via } } })) } // once a visit: track.js counts it
  under.addEventListener('click', e => { e.preventDefault(); track('strip'); scrollTo({ top: room.offsetHeight + under.offsetHeight, behavior: still.matches ? 'auto' : 'smooth' }) })
  addEventListener('scroll', () => { if (scrollY > room.offsetHeight / 2) track('scroll') }, { passive: true })
})()
