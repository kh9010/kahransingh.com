/* studies/31/ways.js — five ways of showing the decision, each drawn from the one model why.js works out.
   a ledger: every candidate, ranked, with its seven measures, its lift, its set-back and its total
   b chain: where → sky → the moment → weighed → chosen, each station with its evidence (default)
   c corpus: all the works, read and scored before anyone arrived, lit by how near each is to now
   d running: the calculation runs in front of you, one work at a time, on pick.js's own functions
   e field: every work placed by its distance from this moment; the two chosen at the centre
   Every number shown carries data-n (a count, in m.N) or data-f (a measure, in m.F) so check.mjs can recount it.
   S31W.draw(way, model, el, opts) fills el. */
(function () {
  const S = window.S31
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  const put = (el, ...xs) => { xs.forEach(x => el.append(typeof x === 'string' ? document.createTextNode(x) : x)); return el }
  const fmt = v => Number(v).toLocaleString('en-US')
  const N = (m, k) => { const s = h('span', 'n', fmt(m.N[k])); s.dataset.n = k; return s }
  const F = (m, k, d = 3) => { const s = h('span', 'n', (m.F[k] < 0 ? '−' : '') + Math.abs(m.F[k]).toFixed(d)); s.dataset.f = k; s.dataset.d = d; return s }
  const alt = x => x.item.alt || S.where(x.item)
  const thumb = (src, cls = 'k-thumb') => { const i = new Image(); i.src = src; i.alt = ''; i.className = cls; i.loading = 'lazy'; i.decoding = 'async'; return i }
  const AXS = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']

  function head(el, m) {
    const p = h('p', 'k-head'); put(p, m.date, m.place ? ' · ' + m.place : '', m.mode === 'live' ? ' · now' : m.mode === 'frozen' ? ' · kept' : '')
    el.append(p)
  }
  function tot(el, m, items) { // [key, label]
    const g = h('dl', 'k-tot'); items.forEach(([k, label]) => { const d = h('div'); d.append(h('dt', null, label)); const dd = h('dd'); dd.append(N(m, k)); d.append(dd); g.append(d) }); el.append(g)
  }
  function station(el, label, ...body) { const s = h('section', 'k-st'); s.append(h('h3', 'k-lab', label)); const b = h('div', 'k-body'); put(b, ...body); s.append(b); el.append(s); return b }
  const row = (cls, ...xs) => put(h('p', cls), ...xs)

  const NOSKY = 'No live sky reached the page. The pair comes from the date alone: the same day always gives the same two.'
  function fallback(el, m) { // no live sky, no kept day: nothing to weigh, said plainly, and the corpus still stands
    head(el, m)
    if (m.mode === 'hash') el.append(h('p', 'k-say', NOSKY))
    tot(el, m, [['photos', 'photographs'], ['poems', 'poems'], ['judgements', 'measures read'], ['kept', 'days kept']])
    return true
  }
  function keptNote(el, m) {
    const f = m.frozen || {}
    el.append(row('k-say', 'No live sky right now. This is the pair kept for ', m.date, ', chosen at 23:50 from the whole day’s record',
      f.tmax != null ? ': a high of ' + S.deg(f.tmax) : '', f.wind_kmh != null ? ', wind to ' + Math.round(f.wind_kmh) + ' km/h' : '', '.'))
  }

  /* ---------- a: the ledger ---------- */
  function cells(m, x) {
    const c = h('span', 'l-cells'); const max = Math.max(...AXS.map(a => m.W[a]))
    AXS.forEach(a => { const s = h('i'); s.style.setProperty('--v', Math.min(1, Math.sqrt(x.parts[a] / max)).toFixed(3)); s.title = m.NAMES[a]; c.append(s) })
    return c
  }
  function ledgerTable(m, kind) {
    const R = kind === 'photo' ? m.photos : m.poems
    const box = h('section', 'l-box'); box.dataset.kind = kind
    const t = h('h3', 'k-lab'); put(t, N(m, kind === 'photo' ? 'photos' : 'poems'), kind === 'photo' ? ' photographs' : ' poems'); box.append(t)
    const key = h('p', 'l-row l-key'); put(key, h('span', 'l-r', '#'), h('span', 'l-name', ''), (() => { const c = h('span', 'l-cells'); AXS.forEach(a => c.append(h('b', null, m.NAMES[a][0]))); return c })(), h('span', 'l-num', 'dist'), h('span', 'l-num', 'lift'), h('span', 'l-num l-tot', 'total'))
    box.append(key)
    R.forEach((x, i) => {
      const r = h('p', 'l-row' + (i === 0 ? ' l-win' : '') + (x.seen ? ' l-seen' : '')); r.dataset.key = x.key
      const name = h('span', 'l-name'); if (kind === 'photo') name.append(i < 10 ? thumb(x.key, 'l-thumb') : h('i', 'l-thumb')); name.append(h('span', null, kind === 'photo' ? alt(x) : x.item.title))
      const lift = x.bonus ? '+' + x.bonus.toFixed(2) : x.seen ? '−' + Math.abs(x.nov).toFixed(2) : ''
      put(r, h('span', 'l-r', String(i + 1).padStart(2, '0')), name, cells(m, x), h('span', 'l-num', x.dist.toFixed(3)), h('span', 'l-num', lift), h('span', 'l-num l-tot', (x.score < 0 ? '−' : '') + Math.abs(x.score).toFixed(3)))
      box.append(r)
    })
    return box
  }
  function ledger(el, m) {
    head(el, m); if (!m.photos) return fallback(el, m); if (m.mode === 'frozen') keptNote(el, m)
    tot(el, m, [['candidates', 'weighed'], ['comparisons', 'comparisons'], ['distances', 'distances'], ['digests', 'digests'], ['setBack', 'set back']])
    el.append(ledgerTable(m, 'photo'), ledgerTable(m, 'poem'))
  }

  /* ---------- b: the chain ---------- */
  function gauge(m, a) {
    const g = h('p', 'b-g'); g.dataset.axis = a
    const tr = h('span', 'b-tr'), mk = h('i', 'b-day'); mk.style.left = (m.day[a] * 100).toFixed(2) + '%'
    const ph = h('i', 'b-ph'); ph.style.left = (m.photos[0].vec[a] * 100).toFixed(2) + '%'
    const po = h('i', 'b-po'); po.style.left = (m.poems[0].vec[a] * 100).toFixed(2) + '%'
    tr.append(ph, po, mk)
    put(g, h('span', 'b-a', m.NAMES[a]), F(m, 'day_' + a), tr, h('span', 'b-w', m.stepOf(a, m.day[a])))
    return g
  }
  function sourceOf(m, a) {
    const r = m.reading
    if (a === 'mood') return 'held at the middle; weather is not evidence of feeling'
    if (!r) return null
    return { light: (r.isDay ? 'daylight, ' : 'after dark, ') + r.cloud + '% cloud', warmth: S.deg(r.temp) + ' on a −5 to 30 °C scale', wet: (Math.max(r.precip, r.rain, r.showers, r.snow)).toFixed(1) + ' mm falling',
      stillness: r.wind + ' km/h of wind' + (r.away ? '; away from home' : ''), season: 'day ' + doy(m.iso) + ' of the year against day ' + m.rule.peak, inside: 'from wet and cold together' }[a]
  }
  const doy = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5) + 1
  const ord = n => { const t = n % 100, u = n % 10; return t > 10 && t < 14 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th' }
  function chosen(el, m, kind) {
    const x = kind === 'photo' ? m.photos[0] : m.poems[0], s = h('div', 'b-pick')
    if (kind === 'photo') s.append(thumb(x.key, 'b-thumb'))
    const t = h('div', 'b-pt'); s.append(t)
    t.append(h('p', 'b-name', kind === 'photo' ? alt(x) : '“' + x.item.title + '”'))
    const meas = row('b-m', 'distance ', F(m, kind + 'Dist'), ' · margin over second ', F(m, kind + 'Gap'), ' · ', N(m, kind + 'Feel'), ord(m.N[kind + 'Feel']), ' of ', N(m, kind === 'photo' ? 'photos' : 'poems'), ' on the seven measures alone')
    if (kind === 'photo' && x.place && x.place.km != null) put(meas, ' · taken in ', x.place.name, ', ', S.km(x.place.km), ' km away', x.bonus ? ' · lift ' : '', x.bonus ? F(m, 'photoLift', 2) : '')
    t.append(meas)
    el.append(s)
  }
  function chain(el, m, o) {
    head(el, m)
    if (m.signals) tot(el, m, [['candidates', 'works weighed'], ['comparisons', 'comparisons'], ['distances', 'distances'], ['signals', 'signals tested']])
    const S0 = m.src, r = m.reading
    const w = station(el, 'where')
    w.append(row('b-big', m.place || '—'))
    if (r) w.append(row('b-ev', Math.abs(m.lat).toFixed(2) + '° ' + (m.lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(m.lon).toFixed(2) + '° ' + (m.lon >= 0 ? 'E' : 'W') + ' · city level, never a point'))
    if (S0.presence) w.append(row('b-q', S0.presence))
    if (!m.photos) return fallback(el, m)
    if (m.mode === 'frozen') keptNote(el, m)
    if (r) {
      const s = station(el, 'sky')
      s.append(row('b-big', S.deg(r.temp), ' · ', r.cloud + '% cloud', ' · ', r.wind + ' km/h'))
      s.append(row('b-ev', N(m, 'skyFields'), ' live readings at those coordinates, every one of them read' + (r.isDay ? '' : ' · after dark')))
    }
    const mo = station(el, 'the moment')
    const key = h('p', 'b-key'); put(key, h('i', 'b-day'), ' now', h('i', 'b-ph'), ' the photograph', h('i', 'b-po'), ' the poem'); mo.append(key)
    m.AX.forEach(a => { mo.append(gauge(m, a)); const src = sourceOf(m, a); if (src) mo.append(row('b-src', src)) })
    const we = station(el, 'weighed')
    we.append(row('b-ev', N(m, 'photos'), ' photographs and ', N(m, 'poems'), ' poems, each compared on ', N(m, 'measures'), ' weighted measures: ', N(m, 'comparisons'), ' comparisons'))
    we.append(row('b-ev', N(m, 'distances'), ' distances from ', m.place || 'here', ' · ', N(m, 'near'), ' within ', N(m, 'nearKm'), ' km · ', N(m, 'far'), ' within ', N(m, 'farKm'), ' km · farthest ', N(m, 'farthest'), ' km'))
    we.append(row('b-ev', N(m, 'setBack'), ' set back as recently shown, from ', N(m, 'kept'), ' kept days · ', N(m, 'digests'), ' SHA-256 digests settle exact ties'))
    const ch = station(el, 'chosen')
    chosen(ch, m, 'photo'); chosen(ch, m, 'poem')
    if (m.signals) {
      const sg = station(el, 'each signal')
      const name = (kind, key) => kind === 'photo' ? alt(m.photos.find(x => x.key === key)) : '“' + m.poems.find(x => x.key === key).item.title + '”'
      m.signals.forEach(g => {
        const p = h('p', 'b-sig'); p.dataset.sig = g.key; p.dataset.photo = g.photo; p.dataset.poem = g.poem
        const eff = !g.movesPhoto && !g.movesPoem ? 'the same two without it' : [g.movesPhoto && 'without it, ' + name('photo', g.photo), g.movesPoem && (g.movesPhoto ? '; ' : 'without it, ') + name('poem', g.poem)].filter(Boolean).join('')
        put(p, h('span', 'b-a', g.label), h('span', 'b-v', g.value), h('span', 'b-e' + (g.movesPhoto || g.movesPoem ? ' b-moves' : ''), eff))
        sg.append(p)
      })
    }
    const doors = o && o.doors
    if (doors && doors.length) {
      const st = station(el, 'the stone')
      st.append(row('b-ev', doors.length + ' lines of “' + m.poems[0].item.title + '” open onto other worlds'))
      doors.forEach(d => { const p = h('p', 'b-door'); p.dataset.door = d.phrase; put(p, h('span', 'b-dp', d.phrase), h('span', 'b-dw', d.word)); st.append(p) })
    }
  }

  /* ---------- c: the corpus ---------- */
  function spark(vec) { const s = h('span', 'c-sp'); AXS.forEach(a => { const i = h('i'); i.style.setProperty('--v', vec[a].toFixed(3)); s.append(i) }); return s }
  function corpusWay(el, m) {
    head(el, m)
    if (m.mode === 'hash') el.append(h('p', 'k-say', NOSKY))
    tot(el, m, [['scored', 'works read and scored'], ['judgements', 'measures set'], ['located', 'places pinned'], ['kept', 'days remembered']])
    if (!m.photos) return
    if (m.mode === 'frozen') keptNote(el, m)
    const near = x => Math.max(0, 1 - x.dist / Math.sqrt(AXS.reduce((s, a) => s + m.W[a], 0)))
    const grid = (R, kind) => {
      const g = h('div', 'c-grid c-' + kind)
      R.slice().sort((a, b) => a.i - b.i).forEach(x => {
        const c = h('span', 'c-t' + (x === R[0] ? ' c-win' : '') + (x.seen ? ' c-seen' : '')); c.dataset.key = x.key; c.style.setProperty('--near', near(x).toFixed(3))
        c.append(x === R[0] && kind === 'photo' ? thumb(x.key, 'c-img') : spark(x.vec))
        g.append(c)
      })
      return g
    }
    const p = h('h3', 'k-lab'); put(p, N(m, 'scoredPhotos'), ' photographs · ', N(m, 'located'), ' located'); el.append(p, grid(m.photos, 'photo'))
    const q = h('h3', 'k-lab'); put(q, N(m, 'scoredPoems'), ' poems'); el.append(q, grid(m.poems, 'poem'))
    el.append(row('k-say c-out', alt(m.photos[0]), ' · “', m.poems[0].item.title, '”'))
  }

  /* ---------- d: running ---------- */
  function running(el, m, o) {
    head(el, m); if (!m.photos) return fallback(el, m); if (m.mode === 'frozen') keptNote(el, m)
    const T = window.kahranPick.__test, st = T.state
    const ctr = h('dl', 'k-tot d-ctr'), cnt = {}
    ;[['candidates', 'weighed'], ['comparisons', 'comparisons'], ['distances', 'distances'], ['digests', 'digests'], ['setBack', 'set back']].forEach(([k, label]) => {
      const d = h('div'); d.append(h('dt', null, label)); const dd = h('dd'); const s = h('span', 'n', '0'); s.dataset.run = k; cnt[k] = s; dd.append(s); d.append(dd); ctr.append(d) })
    el.append(ctr)
    const best = h('div', 'd-best'), log = h('ol', 'd-log'), end = h('div', 'd-end')
    el.append(best, log, end)
    const seq = [...m.photos.slice().sort((a, b) => a.i - b.i).map(x => ['photo', x]), ...m.poems.slice().sort((a, b) => a.i - b.i).map(x => ['poem', x])]
    const tally = { candidates: 0, comparisons: 0, distances: 0, digests: 0, setBack: 0 }, top = { photo: null, poem: null }
    const step = ([kind, x]) => { // recomputed here, live, with pick.js's functions
      const vec = T.itemVector(kind === 'photo' ? st.photoScores : st.poemScores, x.key), dist = T.weightedDistance(m.day, vec)
      const tie = T.tiebreak(m.iso, x.key), score = -dist + x.bonus + x.nov + tie
      tally.candidates++; tally.comparisons += m.AX.length; tally.digests++; if (x.place && x.place.km != null) tally.distances++; if (x.seen) tally.setBack++
      const isTop = !top[kind] || score > top[kind].score; if (isTop) top[kind] = { x, score }
      const li = h('li', isTop ? 'd-top' : '')
      put(li, h('span', 'd-n', kind === 'photo' ? alt(x) : x.item.title), h('span', null, dist.toFixed(4)), h('span', null, x.bonus ? '+' + x.bonus.toFixed(2) : x.seen ? '−' + Math.abs(x.nov).toFixed(2) : ''), h('span', null, (score < 0 ? '−' : '') + Math.abs(score).toFixed(4)))
      log.prepend(li); while (log.children.length > 9) log.lastChild.remove()
      for (const k in cnt) cnt[k].textContent = fmt(tally[k])
      best.replaceChildren(row('d-b', h('span', 'k-lab', 'photograph'), top.photo ? alt(top.photo.x) : '—'), row('d-b', h('span', 'k-lab', 'poem'), top.poem ? top.poem.x.item.title : '—'))
    }
    const finish = () => {
      for (const k in cnt) { cnt[k].dataset.n = k; cnt[k].textContent = fmt(m.N[k]) }
      el.dataset.done = 'yes'
      end.replaceChildren(row('d-fin', 'computed in ', h('span', 'n', m.ms.toFixed(1)), ' ms on this device · margins ', F(m, 'photoGap'), ' and ', F(m, 'poemGap')))
    }
    const total = Math.max(0, o.runMs ?? 2600), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || total === 0) { seq.forEach(step); return finish() }
    let i = 0; const t0 = performance.now()
    const tick = () => { if (!el.isConnected) return; const want = Math.min(seq.length, Math.ceil((performance.now() - t0) / total * seq.length)); while (i < want) step(seq[i++]); if (i < seq.length) requestAnimationFrame(tick); else finish() }
    requestAnimationFrame(tick)
  }

  /* ---------- e: the field ---------- */
  function field(el, m) {
    head(el, m); if (!m.photos) return fallback(el, m); if (m.mode === 'frozen') keptNote(el, m)
    tot(el, m, [['candidates', 'weighed'], ['comparisons', 'comparisons'], ['distances', 'distances'], ['setBack', 'set back']])
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), S2 = 200
    svg.setAttribute('viewBox', `${-S2} ${-S2} ${2 * S2} ${2 * S2}`); svg.setAttribute('class', 'e-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'every work by its distance from this moment')
    const el2 = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e }
    const all = [...m.photos, ...m.poems], R = S2 - 12, top = Math.max(1e-9, ...all.map(y => -y.score))
    const rad = x => Math.min(1, Math.max(0, -x.score) / top) ** .75 * R
    ;[.25, .5, .75, 1].forEach(f => el2('circle', { r: (f * R).toFixed(1), class: 'e-ring' }))
    el2('line', { x1: 0, y1: -R, x2: 0, y2: R, class: 'e-ring' })
    const place = (R0, side) => R0.forEach(x => { const a = (side < 0 ? Math.PI : 0) + (x.tie * 1e6 - .5) * Math.PI * .92, r = rad(x)
      const c = el2('circle', { cx: (Math.cos(a) * r).toFixed(1), cy: (Math.sin(a) * r).toFixed(1), r: x === R0[0] ? 5 : 2.2, class: 'e-dot e-' + (side < 0 ? 'photo' : 'poem') + (x === R0[0] ? ' e-win' : '') + (x.seen ? ' e-seen' : '') })
      c.dataset.key = x.key; c.dataset.r = r.toFixed(2) })
    place(m.photos, -1); place(m.poems, 1)
    el2('circle', { r: 3, class: 'e-now' })
    const lab = h('div', 'e-lab'); put(lab, h('span', null, 'photographs'), h('span', null, 'poems'))
    const wrap = h('div', 'e-wrap'); wrap.append(svg, lab); el.append(wrap)
    el.append(row('k-say', alt(m.photos[0]), ' ', F(m, 'photoDist'), ' · “', m.poems[0].item.title, '” ', F(m, 'poemDist')))
  }

  const WAYS = { a: ledger, b: chain, c: corpusWay, d: running, e: field }
  window.S31W = { draw(way, m, el, o = {}) { el.replaceChildren(); el.dataset.way = way; delete el.dataset.done; (WAYS[way] || chain)(el, m, o) } }
})()
