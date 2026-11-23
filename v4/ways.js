/* studies/36/ways.js (34's, copied unchanged) — four ways of showing the whole body of analysis beside the decision, each drawn from why.js's model and
   body.js's pieces. Every piece carries data-layer and data-status (and each part data-part), so check.mjs can test what it claims.
   a ledger: every piece, grouped by what it did today, totals first
   b chain: 31 b's chain, every piece placed at the station where it is read (default)
   c every value: one mark per value held, banded by what it did
   d the two: everything held about today's photograph and today's poem
   Every number shown sits in an element with data-n (a count in m.N), data-f (a measure in m.F), data-r (a field of the live
   reading), data-v (a value stored for one work) or data-date, so check.mjs can recount it and find any number that is not.
   S34W.draw(way, model, el, opts) fills el. */
(function () {
  const S = window.S34, B = window.S34B
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  const put = (el, ...xs) => { xs.forEach(x => x != null && el.append(typeof x === 'string' ? document.createTextNode(x) : x)); return el }
  const fmt = v => Number(v).toLocaleString('en-US')
  const N = (m, k) => { const s = h('span', 'n', fmt(m.N[k])); s.dataset.n = k; return s }
  const F = (m, k, d = 3) => { const s = h('span', 'n', (m.F[k] < 0 ? '−' : '') + Math.abs(m.F[k]).toFixed(d)); s.dataset.f = k; s.dataset.d = d; return s }
  const Rd = (m, f, d) => { const v = f === 'wetmax' ? Math.max(m.reading.precip, m.reading.rain, m.reading.showers, m.reading.snow) : f === 'lat' || f === 'lon' ? m[f] : m.reading[f]
    const s = h('span', 'n', d == null ? String(v) : Math.abs(v).toFixed(d)); s.dataset.r = f; if (d != null) s.dataset.d = d; return s }
  const Clock = (f, v) => { const s = h('span', 'n', S.clock(v)); s.dataset.r = f; s.dataset.clock = '1'; return s }
  const V = (kind, key, field, v, d) => { const s = h('span', 'n', d == null ? String(v) : Number(v).toFixed(d)); s.dataset.v = kind + '|' + key + '|' + field; if (d != null) s.dataset.d = d; return s }
  const Dt = m => { const s = h('span', null, m.date); s.dataset.date = m.iso; return s }
  const alt = x => x.item.alt || S.where(x.item)
  const thumb = (src, cls) => { const i = new Image(); i.src = src; i.alt = ''; i.className = cls; i.decoding = 'async'; return i }
  const row = (cls, ...xs) => put(h('p', cls), ...xs)
  const AXS = ['light', 'warmth', 'wet', 'stillness', 'season', 'inside', 'mood']
  const ORDER = ['moved', 'stone', 'weighed', 'unused']
  const SHORT = { moved: 'moved the pick', stone: 'shaped the stone', weighed: 'weighed', unused: 'did not count today' }
  const said = s => s ? B.STATUS[s] : 'read'

  function head(el, m) { const p = h('p', 'k-head'); put(p, Dt(m), m.place ? ' · ' + m.place : '', m.mode === 'live' ? ' · now' : m.mode === 'frozen' ? ' · kept' : ''); el.append(p) }
  function tot(el, m, items) { const g = h('dl', 'k-tot'); items.forEach(([k, label]) => { const d = h('div'); d.append(h('dt', null, label)); const dd = h('dd'); dd.append(N(m, k)); d.append(dd); g.append(d) }); el.append(g) }
  function station(el, label, ...body) { const s = h('section', 'k-st'); s.append(h('h3', 'k-lab', label)); const b = h('div', 'k-body'); put(b, ...body); s.append(b); el.append(s); return b }
  const totals = m => m.B.live ? [['S_all', 'values held'], ...ORDER.map(s => ['S_' + s, SHORT[s]])] : [['S_all', 'values held'], ['S_pieces', 'kinds of reading']]

  const NOSKY = 'No live sky reached the page. The pair comes from the date alone: the same day always gives the same two.'
  const notes = (el, m) => { if (m.mode === 'hash') el.append(h('p', 'k-say', NOSKY))
    if (m.mode === 'frozen') el.append(row('k-say', 'No live sky right now. This is the pair kept for ', Dt(m), ', chosen at the end of that day from its whole record.')) }

  /* ---------- one piece of the body ---------- */
  const piece = (m, key) => m.B.groups.flatMap(g => g.items).find(p => p.key === key)
  function detail(m, p) {
    const d = { where: () => [p.detail || ''],
      sun: () => m.reading && p.sunrise ? ['sunrise ', Clock('sunrise', p.sunrise), ' · sunset ', Clock('sunset', p.sunset), ' · daylight read from the sky instead'] : null,
      words: () => [N(m, 'D_words'), ' words in all'],
      lines: () => [N(m, 'D_lineTags'), ' idea tags · ', N(m, 'D_doorsToday'), ' on today’s stone'],
      his: () => [N(m, 'D_hisIdeas'), ' ideas, each joined to lines and photographs'],
      vocabs: () => [N(m, 'D_otherIdeas'), ' ideas: tensions, questions, nouns'],
      earlier: () => [N(m, 'D_earlierWords'), ' words'],
      features: () => [N(m, 'D_featPhotos'), ' photographs'],
      memory: () => ['photographs shown in the last ', N(m, 'winPhoto'), ' days and poems in the last ', N(m, 'winPoem'), ' are set back'] }[p.key]
    return d ? d() : null
  }
  function layer(m, key, o = {}) {
    const p = piece(m, key), r = h('div', 'y'); r.dataset.layer = key; r.dataset.status = p.status || 'read'
    const top = row('y-top', h('span', 'y-lab', p.label), put(h('span', 'y-n'), N(m, 'L_' + key), ' ' + p.unit))
    if (!p.parts) { const s = h('span', 'y-st', said(p.status)); s.dataset.status = p.status || 'read'; top.append(s) }
    r.append(top)
    if (p.parts) { const q = h('p', 'y-parts')
      ORDER.concat([null]).forEach(st => { const ps = p.parts.filter(x => x.status === st); if (!ps.length) return
        const g = h('span', 'y-pg'); g.dataset.status = st || 'read'; g.append(h('span', 'y-st', said(st) + ': '))
        ps.forEach((x, i) => { const a = h('span', 'y-part', x.label); a.dataset.part = x.key; a.dataset.status = st || 'read'; if (i) g.append(', '); g.append(a) })
        q.append(g) })
      r.append(q) }
    const d = o.detail !== false && detail(m, p); if (d) r.append(put(h('p', 'y-d'), ...d))
    return r
  }
  const layers = (m, keys) => keys.map(k => layer(m, k))

  /* ---------- a: the ledger ---------- */
  function ledger(el, m) {
    head(el, m); notes(el, m); tot(el, m, totals(m))
    const all = m.B.groups.flatMap(g => g.items)
    const by = st => all.filter(p => p.status === st || (p.parts && p.parts.some(x => x.status === st)))
    const sts = m.B.live ? ORDER : [null]
    sts.forEach(st => { const ps = m.B.live ? by(st) : all; if (!ps.length) return
      const sec = h('section', 'a-sec'); sec.dataset.status = st || 'read'
      const t = h('h3', 'k-lab a-h'); put(t, st ? B.STATUS[st] : 'read', st ? put(h('span', 'a-hn'), N(m, 'S_' + st)) : null); sec.append(t)
      ps.forEach(p => { if (p.parts && st) { // only the parts with this status, counted
          const r = h('div', 'y'); r.dataset.layer = p.key; r.dataset.status = st
          const parts = p.parts.filter(x => x.status === st), lab = h('span', 'y-lab', p.label), ps = h('p', 'y-parts y-pl')
          parts.forEach((x, i) => { const a = h('span', 'y-part'); a.dataset.part = x.key; a.dataset.status = st; put(a, x.label + ' ', N(m, 'P_' + p.key + '_' + x.key)); if (i) ps.append(' · '); ps.append(a) })
          r.append(row('y-top', lab), ps); sec.append(r)
        } else sec.append(layer(m, p.key)) })
      el.append(sec) })
    if (m.photos) { const c = h('div', 'a-pick'); c.append(thumb(m.photos[0].key, 'b-thumb'), row('b-name', alt(m.photos[0]), ' · “', m.poems[0].item.title, '”')); el.append(c) }
  }

  /* ---------- b: the chain, every piece at its station ---------- */
  function gauge(m, a) {
    const g = h('p', 'b-g'); g.dataset.axis = a
    const tr = h('span', 'b-tr'), mk = h('i', 'b-day'); mk.style.left = (m.day[a] * 100).toFixed(2) + '%'
    const ph = h('i', 'b-ph'); ph.style.left = (m.photos[0].vec[a] * 100).toFixed(2) + '%'
    const po = h('i', 'b-po'); po.style.left = (m.poems[0].vec[a] * 100).toFixed(2) + '%'
    tr.append(ph, po, mk); put(g, h('span', 'b-a', m.NAMES[a]), F(m, 'day_' + a), tr, h('span', 'b-w', m.stepOf(a, m.day[a]))); return g
  }
  function sourceOf(m, a) {
    const r = m.reading
    if (a === 'mood') return ['held at the middle; weather is not evidence of feeling']
    if (!r) return null
    return { light: [r.isDay ? 'daylight, ' : 'after dark, ', Rd(m, 'cloud'), '% cloud'], warmth: [Rd(m, 'temp', 1), ' °C, between cold and warm'], wet: [Rd(m, 'wetmax', 1), ' mm falling'],
      stillness: [Rd(m, 'wind'), ' km/h of wind', r.away ? '; away from home' : ''], season: ['day ', N(m, 'doy'), ' of the year against day ', N(m, 'peak')], inside: ['from wet and cold together'] }[a]
  }
  const ord = n => { const t = n % 100, u = n % 10; return t > 10 && t < 14 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th' }
  function chosen(el, m, kind) {
    const x = kind === 'photo' ? m.photos[0] : m.poems[0], s = h('div', 'b-pick')
    if (kind === 'photo') s.append(thumb(x.key, 'b-thumb'))
    const t = h('div', 'b-pt'); s.append(t)
    t.append(h('p', 'b-name', kind === 'photo' ? alt(x) : '“' + x.item.title + '”'))
    const meas = row('b-m', 'distance ', F(m, kind + 'Dist'), ' · margin over second ', F(m, kind + 'Gap'), ' · ', N(m, kind + 'Feel'), ord(m.N[kind + 'Feel']), ' of ', N(m, kind === 'photo' ? 'photos' : 'poems'), ' on the seven measures alone')
    if (kind === 'photo' && x.place && x.place.km != null) put(meas, ' · taken in ', x.place.name, ', ', N(m, 'D_chosenKm'), ' km away', x.bonus ? ' · lift ' : '', x.bonus ? F(m, 'photoLift', 2) : '')
    t.append(meas); el.append(s)
  }
  const sigValue = (m, k) => { const r = m.reading
    return { place: [m.place], light: [r.isDay ? 'daylight, ' : 'after dark, ', Rd(m, 'cloud'), '% cloud'], warmth: [Rd(m, 'temp', 1), ' °C'], wet: [Rd(m, 'wetmax', 1), ' mm'],
      stillness: [Rd(m, 'wind'), ' km/h', r.away ? ', away' : ''], season: [Dt(m)], inside: ['wet and cold together'], memory: [N(m, 'kept'), ' kept days'] }[k] }
  function chain(el, m, o) {
    head(el, m)
    tot(el, m, m.signals ? [['S_all', 'values held'], ['candidates', 'works weighed'], ['comparisons', 'comparisons'], ['signals', 'signals tested'], ['S_moved', 'moved the pick']] : totals(m))
    const S0 = m.src, r = m.reading
    const w = station(el, 'where')
    w.append(row('b-big', m.place || '—'))
    if (r) w.append(row('b-ev', Rd(m, 'lat', 2), '° ' + (m.lat >= 0 ? 'N' : 'S') + ', ', Rd(m, 'lon', 2), '° ' + (m.lon >= 0 ? 'E' : 'W') + ' · city level, never a point'))
    if (S0.presence) w.append(row('b-q', S0.presence))
    w.append(layer(m, 'where', { detail: false }))
    notes(el, m)
    if (r) {
      const s = station(el, 'sky')
      s.append(row('b-big', Rd(m, 'temp', 1), ' °C · ', Rd(m, 'cloud'), '% cloud · ', Rd(m, 'wind'), ' km/h'))
      s.append(row('b-ev', N(m, 'skyFields'), ' live readings at those coordinates' + (r.isDay ? '' : ' · after dark')))
      put(s, ...layers(m, ['sky', 'season', 'sun']))
    }
    const live = m.mode === 'live' && !!m.photos
    if (live) {
      const mo = station(el, 'the moment')
      const key = h('p', 'b-key'); put(key, h('i', 'b-day'), ' now', h('i', 'b-ph'), ' the photograph', h('i', 'b-po'), ' the poem'); mo.append(key)
      m.AX.forEach(a => { mo.append(gauge(m, a)); const src = sourceOf(m, a); if (src) mo.append(put(h('p', 'b-src'), ...src)) })
    }
    put(station(el, 'the works'), ...layers(m, ['photoM', 'poemM', 'places', 'hour', 'photoNotes', 'poemNotes', 'words']))
    put(station(el, 'by hand'), ...layers(m, ['lines', 'his', 'photoIdeas', 'concepts', 'vocabs', 'strains', 'earlier']))
    put(station(el, 'measured'), ...layers(m, ['regions', 'months', 'features']))
    const we = station(el, 'weighed')
    if (live) {
      we.append(row('b-ev', N(m, 'photos'), ' photographs and ', N(m, 'poems'), ' poems, each compared on ', N(m, 'measures'), ' weighted measures: ', N(m, 'comparisons'), ' comparisons'))
      we.append(row('b-ev', N(m, 'distances'), ' distances from ', m.place || 'here', ' · ', N(m, 'near'), ' within ', N(m, 'nearKm'), ' km · ', N(m, 'far'), ' within ', N(m, 'farKm'), ' km · farthest ', N(m, 'farthest'), ' km'))
      we.append(row('b-ev', N(m, 'setBack'), ' set back as recently shown · ', N(m, 'digests'), ' SHA-256 digests settle exact ties'))
    }
    put(we, ...layers(m, ['memory', 'keptWhy']))
    if (!live) return
    const ch = station(el, 'chosen'); chosen(ch, m, 'photo'); chosen(ch, m, 'poem')
    if (m.signals) {
      const sg = station(el, 'each signal')
      const name = (kind, key) => kind === 'photo' ? alt(m.photos.find(x => x.key === key)) : '“' + m.poems.find(x => x.key === key).item.title + '”'
      m.signals.forEach(g => {
        const p = h('p', 'b-sig'); p.dataset.sig = g.key; p.dataset.photo = g.photo; p.dataset.poem = g.poem
        const eff = !g.movesPhoto && !g.movesPoem ? 'the same two without it' : [g.movesPhoto && 'without it, ' + name('photo', g.photo), g.movesPoem && (g.movesPhoto ? '; ' : 'without it, ') + name('poem', g.poem)].filter(Boolean).join('')
        put(p, h('span', 'b-a', g.label), put(h('span', 'b-v'), ...sigValue(m, g.key)), h('span', 'b-e' + (g.movesPhoto || g.movesPoem ? ' b-moves' : ''), eff)); sg.append(p)
      })
    }
    const doors = o && o.doors
    if (doors && doors.length) {
      const st = station(el, 'the stone')
      st.append(row('b-ev', N(m, 'D_doorsToday'), ' lines of “' + m.poems[0].item.title + '” open onto other worlds'))
      doors.forEach(d => { const p = h('p', 'b-door'); p.dataset.door = d.phrase; put(p, h('span', 'b-dp', d.phrase), h('span', 'b-dw', d.word)); st.append(p) })
    }
  }

  /* ---------- c: every value, one mark each ---------- */
  function everyValue(el, m, o) {
    head(el, m); notes(el, m); tot(el, m, totals(m))
    if (m.photos) { const c = h('div', 'a-pick'); c.append(thumb(m.photos[0].key, 'b-thumb'), row('b-name', alt(m.photos[0]), ' · “', m.poems[0].item.title, '”')); el.append(c) }
    const units = m.B.groups.flatMap(g => g.items.flatMap(p => p.parts ? p.parts.map(q => ({ p, q, st: q.status, n: q.n })) : [{ p, st: p.status, n: p.n }]))
    const pitch = Math.max(2, +o.dotPx || 3), sts = m.B.live ? ORDER : [null]
    let drawn = 0
    sts.forEach(st => { const us = units.filter(u => u.st === st && u.n > 0); if (!us.length) return
      const sec = h('section', 'v-sec'); sec.dataset.status = st || 'read'
      const t = h('h3', 'k-lab a-h'); put(t, st ? B.STATUS[st] : 'read', put(h('span', 'a-hn'), N(m, st ? 'S_' + st : 'S_all'))); sec.append(t)
      const cv = h('canvas', 'v-cv'); sec.append(cv)
      const leg = h('p', 'v-leg')
      const seen = new Set()
      us.forEach(u => { const k = u.p.key + (u.q ? '_' + u.q.key : ''); if (seen.has(k)) return; seen.add(k)
        const s = h('span', 'v-li'); s.dataset.layer = u.p.key; s.dataset.status = st || 'read'; if (u.q) { s.dataset.part = u.q.key }
        put(s, u.q ? u.p.label + ', ' + u.q.label + ' ' : u.p.label + ' ', N(m, u.q ? 'P_' + u.p.key + '_' + u.q.key : 'L_' + u.p.key)); leg.append(s) })
      sec.append(leg); el.append(sec)
      requestAnimationFrame(() => { // drawn once the panel has its width
        const W = Math.max(120, Math.floor(sec.clientWidth || 300)), cols = Math.floor(W / pitch), total = us.reduce((s, u) => s + u.n, 0), rows = Math.ceil(total / cols)
        const dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = rows * pitch * dpr; cv.style.width = W + 'px'; cv.style.height = rows * pitch + 'px'
        const g = cv.getContext('2d'); g.scale(dpr, dpr)
        const ink = { moved: [224, 181, 106], stone: [243, 239, 230], weighed: [243, 239, 230], unused: [243, 239, 230], read: [243, 239, 230] }[st || 'read']
        const al = { moved: [1, .72], stone: [.85, .6], weighed: [.5, .34], unused: [.26, .16], read: [.5, .34] }[st || 'read']
        let i = 0
        us.forEach((u, ui) => { g.fillStyle = `rgba(${ink},${al[ui % 2]})`; for (let k = 0; k < u.n; k++, i++) { const x = (i % cols) * pitch, y = Math.floor(i / cols) * pitch; g.fillRect(x, y, pitch - 1, pitch - 1) } })
        cv.dataset.dots = i; drawn += i; el.dataset.dots = drawn
      })
    })
  }

  /* ---------- d: the two, everything held about each ---------- */
  function partOf(m, key, a) { const p = piece(m, key); return p.parts.find(x => x.key === a).status }
  function tag(st) { const s = h('span', 'y-st', said(st)); s.dataset.status = st || 'read'; return s }
  function fact(m, label, key, ...val) { const r = h('div', 'y'); r.dataset.layer = key; const p = piece(m, key); r.dataset.status = p.status || 'read'; r.append(row('y-top', h('span', 'y-lab', label), put(h('span', 'y-v'), ...val), tag(p.status))); return r }
  function measures(m, kind, key, entry, layerKey) {
    const box = h('div', 'y t-ms'); box.dataset.layer = layerKey; box.dataset.status = piece(m, layerKey).status || 'read'
    box.append(row('y-top', h('span', 'y-lab', 'seven measures')))
    AXS.forEach(a => { if (typeof entry[a] !== 'number') return
      const st = partOf(m, layerKey, a), g = h('p', 't-m'); g.dataset.part = a; g.dataset.status = st || 'read'
      const tr = h('span', 'b-tr'), mk = h('i', 'b-ph'); mk.style.left = (entry[a] * 100).toFixed(1) + '%'; tr.append(mk)
      if (m.day) { const d = h('i', 'b-day'); d.style.left = (m.day[a] * 100).toFixed(1) + '%'; tr.append(d) }
      put(g, h('span', 'b-a', m.NAMES[a]), V(kind, key, a, entry[a], 2), tr, tag(st)); box.append(g) })
    return box
  }
  function two(el, m) {
    head(el, m); notes(el, m)
    const T = m.B.today, ph = m.photo, po = m.poem, pe = T.photo || {}, qe = T.poem || {}, km = m.mode === 'live' && m.photos && m.photos[0].place && m.photos[0].place.km != null
    const P = h('section', 't-w'); P.append(h('h3', 'k-lab', 'the photograph'))
    P.append(put(h('div', 'b-pick'), thumb(ph.src, 'b-thumb t-thumb'), put(h('div', 'b-pt'), h('p', 'b-name', ph.alt || S.where(ph)))))
    P.append(measures(m, 'photo', ph.src, pe, 'photoM'))
    if (pe.place) P.append(fact(m, 'taken in', 'places', pe.place.name, km ? put(h('span'), ', ', N(m, 'D_chosenKm'), ' km away') : null))
    if (pe.hour) P.append(fact(m, 'its hour', 'hour', pe.hour))
    if (pe.notes) P.append(fact(m, 'the note on it', 'photoNotes', h('q', 't-q', pe.notes)))
    if (T.ideas) P.append(fact(m, 'the ideas in it', 'photoIdeas', T.ideas.split(/\s+/).join(' · ')))
    if (T.kin) { const r = fact(m, 'region by region', 'regions', put(h('span'), N(m, 'D_chosenRegions'), ' measurements'))
      const grid = h('span', 't-kin'); T.kin.cells.forEach(c => { const i = h('i'); i.style.setProperty('--l', (c[0] / 100).toFixed(3)); grid.append(i) }); r.append(grid); P.append(r)
      if (T.kin.when) P.append(fact(m, 'taken', 'months', V('kin', ph.src, 'when', T.kin.when))) }
    const Q = h('section', 't-w'); Q.append(h('h3', 'k-lab', 'the poem'))
    Q.append(row('b-name', '“' + po.title + '”'))
    Q.append(measures(m, 'poem', po.slug, qe, 'poemM'))
    if (qe.hour) Q.append(fact(m, 'its hour', 'hour', qe.hour))
    if (qe.notes) Q.append(fact(m, 'the note on it', 'poemNotes', h('q', 't-q', qe.notes)))
    if (typeof po.words === 'number') Q.append(fact(m, 'its length', 'words', V('poem', po.slug, 'words', po.words), ' words'))
    if (T.lines.length) { const r = h('div', 'y'); r.dataset.layer = 'lines'; r.dataset.status = piece(m, 'lines').status || 'read'
      r.append(row('y-top', h('span', 'y-lab', 'door lines, read by hand'), h('span', 'y-v'), tag(piece(m, 'lines').status)))
      const on = new Set(((m.B.doors) || []).map(d => d.phrase))
      T.lines.forEach(l => { const p = h('p', 't-line' + (on.has(l.phrase) ? ' t-on' : '')); p.dataset.line = l.phrase; put(p, h('span', 'b-dp', l.phrase), h('span', 'b-dw', l.concepts.join(' · '))); r.append(p) })
      Q.append(r) }
    const wrap = h('div', 't-two'); wrap.append(P, Q); el.append(wrap)
    tot(el, m, totals(m))
    const rest = h('section', 't-rest'); rest.append(put(h('h3', 'k-lab a-h'), 'and across all ', N(m, 'photos'), ' photographs and ', N(m, 'poems'), ' poems'))
    put(rest, ...layers(m, m.B.groups.flatMap(g => g.items.map(p => p.key)))); el.append(rest)
  }

  const WAYS = { a: ledger, b: chain, c: everyValue, d: two }
  window.S34W = { WAYS: Object.keys(WAYS), draw(way, m, el, o = {}) { el.replaceChildren(); el.dataset.way = way; delete el.dataset.dots; m.B.doors = o.doors || null; (WAYS[way] || chain)(el, m, o) } }
})()
