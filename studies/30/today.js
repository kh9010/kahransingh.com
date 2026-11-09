/* studies/24/today.js (copied from 14) — today's pair, chosen exactly as `/` chooses it.
   Same parts, not copies: /v2/weather.js (his place + the live sky), /v2/pick.js, /v2/data.json,
   /v2/days.json (pick.js's novelty memory; home.js hands it over, so this does too), and the
   home's own norm/stanzasOf/cyrb53/photoFor/poemFor, read out of /v2/home.js where they live.
   Order is home.js's resolvePick: live pick → frozen days.json entry → date hash.
   Neighbours (S03.near, S03.placeOf) come from ../03/shared.js, loaded by the page.
   S14.load(lineEl) → { photo, poem, stanzas, reading, iso, data, ps, qs, how } */
(function () {
  const js = src => new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s) })
  const get = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
  const event = (name, ms) => new Promise(r => { document.addEventListener(name, r, { once: true }); setTimeout(r, ms) })

  async function homeParts() { // the home's own functions, from its one home
    const t = await (await fetch('/v2/home.js')).text()
    const grab = (from, to) => { const a = t.indexOf(from), b = t.indexOf(to, a); if (a < 0 || b < 0) throw new Error('home.js moved: ' + from); return t.slice(a, b) }
    const src = grab('function cyrb53', '/* ----------------------------------------------------------- the poem')
      + grab('function norm', '/* ---------------------------------------------------------- the render')
    return new Function(src + '; return { photoFor, poemFor, stanzasOf }')()
  }
  function todayISO() {
    const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach(x => p[x.type] = x.value)
    return p.year + '-' + p.month + '-' + p.day
  }

  async function load(lineEl) {
    const ready = event('kahran:pick-ready', 4000)       // pick.js starts its scores fetch the moment it runs
    await js('/v2/weather.js'); await js('/v2/pick.js')
    const [data, days, ps, qs, home] = await Promise.all([get('/v2/data.json'), get('/v2/days.json'), get('/v2/scores-photos.json'), get('/v2/scores-poems.json'), homeParts()])
    const K = window.kahranPick
    K.setDays(days); K.setData(data)
    const sky = event('kahran:weather', 4000)
    window.kahranWeather.load(lineEl)
    await Promise.all([ready, sky])
    const iso = todayISO()
    const resolve = () => {
      let live = null; try { live = K.pickFor(iso, true) } catch {}
      if (live) { const photo = data.photos.find(p => p.src === live.photo), poem = data.poems.find(p => p.slug === live.poem); if (photo && poem) return { photo, poem, how: 'live' } }
      const e = days && days.days && days.days[iso]
      if (e) { const photo = data.photos.find(p => p.src === e.photo), poem = data.poems.find(p => p.slug === e.poem); if (photo && poem) return { photo, poem, how: 'frozen' } }
      return { photo: data.photos[home.photoFor(iso, data.photos.length)], poem: data.poems[home.poemFor(iso, data.poems.length)], how: 'hash' }
    }
    const pick = resolve()
    return { ...pick, stanzas: home.stanzasOf(pick.poem), reading: window.kahranWeather.current || {}, iso, data, ps: ps && ps.photos || {}, qs: qs && qs.poems || {}, resolve, stanzasOf: home.stanzasOf }
  }
  window.S14 = { load }
})()
