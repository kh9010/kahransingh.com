/* studies/29/ways.js — the four ways of saying why, each drawn from the one model why.js works out.
   a words: a short paragraph that writes itself from the numbers
   b gauges: the seven axes, today against the photograph and the poem, the next few faint
   c the line: the line itself unfolds, each piece opening what it did to the pick
   d the race: the closest few, and what the winner had that the others did not
   S29W.draw(way, model, el, opts) fills el; opts.runners = how many behind the winner. */
(function () {
  const W = window.S29
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  const para = (el, lines, cls) => lines.forEach(t => el.append(h('p', cls || 'w-p', t)))
  const alt = x => x.item.alt || W.where(x.item)

  function head(el, m) { el.append(h('p', 'w-head', m.mode === 'live' ? `${m.date}, ${m.place}` : m.date)) }

  /* ---------- a: words ---------- */
  function words(el, m) { head(el, m); para(el, W.paragraph(m)) }

  /* ---------- b: gauges ---------- */
  function gauge(m, a, o = {}) {
    const row = h('div', 'g-row'), name = h('div', 'g-name'), track = h('div', 'g-track')
    name.append(h('span', 'g-axis', m.NAMES[a]), h('span', 'g-src', W.source(m, a)))
    track.style.setProperty('--g-weight', Math.sqrt(m.W[a]).toFixed(2))
    track.append(h('span', 'g-end g-lo', m.ENDS[a][0]), h('span', 'g-end g-hi', m.ENDS[a][1]), h('span', 'g-line'))
    const mark = (cls, v, kid) => { const s = h('span', 'g-mark ' + cls); s.style.left = (v * 100).toFixed(2) + '%'; if (kid) s.append(kid); track.append(s); return s }
    const n = o.runners ?? 4
    m.photos.slice(1, 1 + n).forEach(x => mark('g-faint g-faint-photo', x.vec[a]))
    m.poems.slice(1, 1 + n).forEach(x => mark('g-faint g-faint-poem', x.vec[a]))
    const img = new Image(); img.src = m.photos[0].key; img.alt = ''
    mark('g-photo', m.photos[0].vec[a], img)
    mark('g-poem', m.poems[0].vec[a])
    mark('g-day', m.day[a]).dataset.v = m.day[a].toFixed(3)
    row.append(name, track); row.dataset.axis = a
    return row
  }
  function key(m) {
    const k = h('p', 'g-key'), img = new Image(); img.src = m.photos[0].key; img.alt = ''
    const dot = cls => h('span', 'g-mark g-k ' + cls)
    const ph = dot('g-photo'); ph.append(img)
    k.append(dot('g-day'), h('span', null, m.mode === 'live' ? `${m.place}, now` : 'the day, kept'), ph, h('span', null, 'the photograph'), dot('g-poem'), h('span', null, 'the poem'))
    return k
  }
  function gauges(el, m, o) {
    head(el, m)
    if (!m.photos) return para(el, W.paragraph(m))
    if (m.mode !== 'live') para(el, W.fallbackWords(m))
    el.append(key(m))
    const box = h('div', 'g-rows'); m.AX.forEach(a => box.append(gauge(m, a, o))); el.append(box)
    if (m.mode === 'live') para(el, [`${alt(m.photos[0])}. ${W.deciderWords(m.photoWhy, 'photo', m.photos[0])}`, `${W.title(m.poems[0].item)}. ${W.deciderWords(m.poemWhy, 'poem', m.poems[0])}`], 'w-p w-small')
    else para(el, [`${alt(m.photos[0])}; ${W.title(m.poems[0].item)}.`], 'w-p w-small')
  }

  /* ---------- c: the line unfolds ---------- */
  const bucket = (v, ws) => ws[Math.min(ws.length - 1, Math.floor(v * ws.length))]
  function daysTo(iso, mmdd) { const y = +iso.slice(0, 4), a = Date.UTC(y, +iso.slice(5, 7) - 1, +iso.slice(8, 10)); let b = Date.UTC(y, +mmdd.slice(0, 2) - 1, +mmdd.slice(3)); if (b < a) b = Date.UTC(y + 1, +mmdd.slice(0, 2) - 1, +mmdd.slice(3)); return Math.round((b - a) / 864e5) }
  const weeks = d => d < 10 ? `${d} days` : `${Math.round(d / 7)} weeks`
  function pieces(m) {
    const r = m.reading, line = m.line.replace(/\.$/, ''), at = line.indexOf(' and ')
    const P = []
    const say = (label, axes, text, extra) => P.push({ label, axes, text, extra })
    const winner = m.photos[0]
    say(at > 0 ? line.slice(0, at) : line, [], `The page knows the city, never the street. A photograph taken within ${m.rule.nearKm} km of here gets a lift, and one within ${m.rule.farKm} km a smaller one. ${W.placeWords(m, winner)}`)
    const isFog = [45, 48].includes(r.code)
    const lightWhy = r.isDay ? `${100 - (r.cloud ?? 50)}% of the sky is open, so the light reads ${bucket(m.day.light, ['dark', 'dim', 'soft', 'bright', 'bright'])}.` : 'After dark the light reads low, whatever the cloud.'
    const wetWhy = r.rain || r.snow ? `${r.rain || r.snow} mm falling, so wet.` : isFog ? 'Fog counts as damp even with nothing falling.' : m.day.wet > 0 ? 'The sky alone counts as damp.' : 'Nothing falling, so dry.'
    say(at > 0 ? line.slice(at + 1) : 'the sky', ['light', 'wet'], `${lightWhy} ${wetWhy}`)
    say(W.deg(r.temp), ['warmth', 'inside'], `On a scale from bitter to hot, ${W.deg(r.temp)} is ${bucket(m.day.warmth, ['bitter', 'cold', 'about halfway', 'warm', 'hot'])}. Cold and rain keep you in; today leans ${m.day.inside >= .5 ? 'out of doors' : 'indoors'}.`, true)
    say(Math.round(r.wind) + ' km/h', ['stillness'], `${Math.round(r.wind)} km/h is ${bucket(m.day.stillness, ['a gale', 'a strong wind', 'a breeze', 'a light wind', 'almost nothing'])}, so the day reads ${m.day.stillness >= .5 ? 'still' : 'windy'}.` + (r.away ? ' He is away, which counts as stiller too.' : ''), true)
    const tw = daysTo(m.iso, '12-21'), ts = daysTo(m.iso, '06-21'), near = Math.min(tw, ts)
    say(m.date, ['season'], `${m.date} is ${weeks(near)} from the ${tw < ts ? 'shortest' : 'longest'} day, so the season reads ${bucket(m.day.season, ['deep winter', 'wintry', 'between', 'summery', 'high summer'])}.`, true)
    say('so these two', [], null, true)
    return P
  }
  function line(el, m, o) {
    if (m.mode !== 'live' || !m.photos || !m.reading) { head(el, m); return para(el, W.paragraph(m)) }
    const L = h('p', 'c-line'), note = h('div', 'c-note'), P = pieces(m)
    P.forEach((p, i) => {
      const b = h('button', 'c-piece' + (p.extra ? ' c-extra' : ''), p.label); b.type = 'button'; b.style.setProperty('--c-i', i)
      b.onclick = () => open(i)
      if (i) L.append(document.createTextNode(p.extra ? ' · ' : ' '))
      L.append(b)
    })
    el.append(L, note)
    function open(i) {
      L.querySelectorAll('.c-piece').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)))
      note.replaceChildren(); const p = P[i]; el.dataset.piece = i
      if (p.text) note.append(h('p', 'w-p', p.text))
      p.axes.forEach(a => note.append(gauge(m, a, o)))
      if (!p.text) {
        const img = new Image(); img.src = m.photos[0].key; img.alt = alt(m.photos[0]); img.className = 'c-thumb'
        note.append(img)
        para(note, W.paragraph(m).slice(1))
      }
    }
    open(o.piece != null ? o.piece : 1)
  }

  /* ---------- d: the race ---------- */
  function lane(m, kind, n) {
    const R = kind === 'photo' ? m.photos : m.poems, why = kind === 'photo' ? m.photoWhy : m.poemWhy
    const box = h('div', 'r-lane'); box.append(h('p', 'r-title', kind === 'photo' ? `${m.counts.photos} photographs` : `${m.counts.poems} poems`))
    const rows = R.slice(0, 1 + n)
    if (why.why === 'seen' && !rows.includes(why.other)) rows.push(why.other)
    const maxD = Math.sqrt(m.AX.reduce((s, a) => s + m.W[a], 0))
    rows.forEach((x, i) => {
      const row = h('div', 'r-row' + (i === 0 ? ' r-win' : '') + (x.seen ? ' r-seen' : ''))
      row.style.setProperty('--r-i', i)
      const name = h('span', 'r-name', kind === 'photo' ? alt(x) : x.item.title)
      const bar = h('span', 'r-bar'), near = h('span', 'r-near'), lift = h('span', 'r-lift')
      near.style.setProperty('--r-w', (Math.max(0, x.near) * 100).toFixed(2) + '%')
      lift.style.setProperty('--r-w', (x.bonus / maxD * 100).toFixed(2) + '%')
      bar.append(near, lift)
      const notes = []
      if (x.bonus >= .3) notes.push('taken close to here'); else if (x.bonus > 0) notes.push('taken not far')
      if (x.seen) notes.push(`here on ${W.nice(x.seen)}`)
      row.append(name, bar, h('span', 'r-note', notes.join(', ')))
      row.dataset.key = x.key; row.dataset.score = x.score
      box.append(row)
    })
    box.append(h('p', 'w-p w-small', W.deciderWords(why, kind, R[0])))
    return box
  }
  function race(el, m, o) {
    head(el, m)
    if (!m.photos || m.mode !== 'live') return para(el, W.paragraph(m)) // a kept day was not raced here
    if (m.mode !== 'live') para(el, W.fallbackWords(m))
    else el.append(h('p', 'w-p w-small', `${W.deg(m.reading.temp)}, ${W.sky(m)}, ${Math.round(m.reading.wind)} km/h, ${m.date}. Nearest to that, out in front:`))
    el.append(lane(m, 'photo', o.runners ?? 4), lane(m, 'poem', o.runners ?? 4))
  }

  const WAYS = { a: words, b: gauges, c: line, d: race }
  window.S29W = { draw(way, m, el, o = {}) { el.replaceChildren(); el.dataset.way = way; (WAYS[way] || words)(el, m, o) } }
})()
