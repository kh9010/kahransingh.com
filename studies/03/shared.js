/* studies/03/shared.js — the real home-page content for the four directions.
   Reuses the live v2 parts rather than copying them: /v2/weather.js (place + live sky),
   /v2/pick.js (today's photo + poem from that sky), /v2/data.json, the score files, and the
   IDEAS table read out of /v2/home.js (its one home). Falls back to a date hash if the sky
   or the scores never answer, so a mock always has something on it.
   S03.load().then(ctx => …): ctx = { photo, poem, reading, line, ideas, data, ps, qs, iso } */
(function () {
  function js(src) { return new Promise(r => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s) }) }
  const get = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null)
  function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
  function iso() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()) }
  async function ideas() {
    try {
      const t = await (await fetch('/v2/home.js')).text()
      return new Function('return ' + t.match(/var IDEAS = (\[[\s\S]*?\n  \]);/)[1])()
    } catch { return [] }
  }
  async function load() {
    await js('/v2/weather.js'); await js('/v2/pick.js')
    const line = document.createElement('span')
    const [data, ps, qs, idea] = await Promise.all([get('/v2/data.json'), get('/v2/scores-photos.json'), get('/v2/scores-poems.json'), ideas()])
    window.kahranPick && window.kahranPick.setData(data)
    const sky = new Promise(r => { document.addEventListener('kahran:weather', r, { once: true }); setTimeout(r, 3000) })
    window.kahranWeather && window.kahranWeather.load(line)
    await sky; await new Promise(r => setTimeout(r, 300))
    const day = iso()
    let pick = window.kahranPick && window.kahranPick.pickFor(day, true)
    const photo = pick ? data.photos.find(p => p.src === pick.photo) : data.photos[hash(day + 'p') % data.photos.length]
    const poem = pick ? data.poems.find(p => p.slug === pick.poem) : data.poems[hash(day + 'q') % data.poems.length]
    const reading = window.kahranWeather && window.kahranWeather.current
    return { photo, poem, reading, line: line.textContent, ideas: idea, data, ps: ps && ps.photos || {}, qs: qs && qs.poems || {}, iso: day, picked: !!pick }
  }
  const AX = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  function near(v, pool, n) { // closest items by the seven score axes
    return Object.entries(pool).map(([k, w]) => [k, AX.reduce((a, x) => a + (v[x] - w[x]) ** 2, 0)]).sort((a, b) => a[1] - b[1]).slice(0, n).map(e => e[0])
  }
  const placeOf = p => (p.caption || '').split(' — ')[0]
  window.S03 = { load, near, placeOf, AX, hash }
})()
