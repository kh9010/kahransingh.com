/* Study 33: where the facets are. The stone is a Voronoi cut (05 B's, drawn out by the wind, so 28's crossings still morph it cell for cell);
   what changes is where its sites come from. A seam is made to lie on something in the photograph by a mirrored pair of sites, one each side
   of it: their shared edge is the photograph's own line. Every site carries why it is where it is, so every edge of every facet can say
   which region or signal made it. Pure: no DOM. The page loads it as a script (window.S33Cut); check.mjs runs the same file in node.

   S33Cut.cut({ R, W, H, count, logic, wind, seed, moment, dials }) → { logic, ran, fallback, sites, tags, features, summary }
     R        regions.json's entry for the photograph (build.py), or null
     logic    'line' the horizon · 'masses' light and dark · 'eye' where the eye goes · 'edges' its own edges · 'hour' the light now
     moment   { at: ISO time, lat, lon, place } for 'hour'
     fallback null, or { to, why }: a logic that cannot be honest about this photograph says so, and names what it used instead
   S33Cut.facets(cut, cells, W, H, wind, R) → per facet: its edges, each with the basis that made it, and the region it lies over */
(function (root) {
  const LOGICS = ['line', 'masses', 'eye', 'edges', 'hour']
  const LEAST = .3, NEXT = { line: 'masses', masses: 'edges', eye: 'edges', edges: 'masses', hour: 'masses' } // a cut is the photograph's when at least this share of its sites sit on the photograph's own lines
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = Math.imul(s ^ s >>> 15, 2246822507) + 0x9e3779b9 >>> 0, ((s ^ s >>> 13) >>> 0) / 4294967296) }
  function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
  const stretchOf = wind => 1 + Math.min(wind, 40) / 45

  /* ---------- the cover crop: a fraction of the photograph to a point of the screen, and back ---------- */
  function cover(R, W, H) {
    const a = R.a, b = W / H
    if (a > b) { const k = a / b; return { to: (u, v) => [((u - .5) * k + .5) * W, v * H], uv: (x, y) => [(x / W - .5) / k + .5, y / H] } }
    const k = b / a; return { to: (u, v) => [u * W, ((v - .5) * k + .5) * H], uv: (x, y) => [x / W, (y / H - .5) / k + .5] } }
  const gridAt = (rows, u, v) => { if (!rows || !rows.length || u < 0 || u > 1 || v < 0 || v > 1) return null
    const r = Math.min(rows.length - 1, Math.floor(v * rows.length)), row = rows[r], c = Math.min(row.length - 1, Math.floor(u * row.length)); return +row[c] }

  /* ---------- Voronoi, 05 B's: the wind draws the facets out ---------- */
  function clipHalf(P, f) { const o = []
    for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length], fa = f(a), fb = f(b)
      if (fa <= 0) o.push(a)
      if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) } }
    return o }
  const clean = P => P.filter((p, i) => { const q = P[(i + 1) % P.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > .05 })
  function voronoi(S, W, H, wind) {
    const st = stretchOf(wind), w = W / st, Tt = S.map(([x, y]) => [x / st, y])
    return Tt.map((s, i) => { let P = [[0, 0], [w, 0], [w, H], [0, H]]
      for (let j = 0; j < Tt.length && P.length; j++) { if (j === i) continue; const t = Tt[j], nx = t[0] - s[0], ny = t[1] - s[1]; if (!nx && !ny) continue
        const mx = (s[0] + t[0]) / 2, my = (s[1] + t[1]) / 2; P = clipHalf(P, ([x, y]) => (x - mx) * nx + (y - my) * ny) }
      return clean(P.map(([x, y]) => [x * st, y])) }) }

  /* ---------- the sun, for the hour: NOAA's low-precision position ---------- */
  function sun(at, lat, lon) {
    const d = new Date(at), jd = d.getTime() / 864e5 + 2440587.5, n = jd - 2451545, rad = Math.PI / 180
    const L = (280.46 + .9856474 * n) % 360, g = ((357.528 + .9856003 * n) % 360) * rad
    const lam = (L + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * rad, eps = (23.439 - 4e-7 * n) * rad
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), dec = Math.asin(Math.sin(eps) * Math.sin(lam))
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24, ha = ((gmst * 15 + lon) * rad - ra)
    const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha))
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat * rad) - Math.sin(lat * rad) * Math.cos(ha))
    return { alt: +(alt / rad).toFixed(1), az: +(((az / rad) + 360) % 360).toFixed(1) } }

  /* ---------- the cut ---------- */
  function cut(o) {
    const { R, W, H, count } = o, wind = o.wind ?? 8, st = stretchOf(wind), D = o.dials || {}, r = rng(hash((o.seed || '') + '|33|' + W + 'x' + H))
    const logic = LOGICS.includes(o.logic) ? o.logic : 'masses', min = Math.min(W, H), max = Math.max(W, H)
    const pairsMax = Math.max(2, Math.floor(count * (D.share ?? .75) / 2)), d = min * (D.gap ?? .03) // a pair sits this far either side of its line
    const S = [], T = [], features = [], chains = []
    const sx = ([x, y]) => [x / st, y], dS = (p, q) => Math.hypot((p[0] - q[0]) / st, p[1] - q[1])
    const inside = ([x, y]) => x > 2 && y > 2 && x < W - 2 && y < H - 2
    const guard = [] // points of the photograph's lines the cut has taken: [point, radius] no other site may come within
    const free = (p, mine = []) => guard.every(([q, rr], k) => mine.includes(k) || dS(p, q) > rr) && S.every(s => dS(s, p) > d * .6)
    const C = R ? cover(R, W, H) : null
    let fallback = null, ran = logic

    function addPair(p, n, f, k, spacing) { // p, n in screen space; the mirror is taken in the wind's space, where the Voronoi is cut
      const q = sx(p); let tx = -n[1] / st, ty = n[0]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl
      const m = [ty, -tx], a = [(q[0] + m[0] * d) * st, q[1] + m[1] * d], b = [(q[0] - m[0] * d) * st, q[1] - m[1] * d]
      if (!inside(a) || !inside(b) || !inside(p)) return false
      if (S.some(s => dS(s, p) < d * 1.35 || dS(s, a) < d * 1.2 || dS(s, b) < d * 1.2)) return false
      if (guard.some(([g0, rr]) => dS(g0, a) < Math.min(rr, d * 1.35) || dS(g0, b) < Math.min(rr, d * 1.35))) return false
      const i = S.length; S.push(a, b)
      T.push({ kind: 'pair', f, k, mate: i + 1, side: 1 }, { kind: 'pair', f, k, mate: i, side: -1 })
      features[f].anchors.push({ k, p: [+p[0].toFixed(2), +p[1].toFixed(2)], n: [+n[0].toFixed(3), +n[1].toFixed(3)], pair: [i, i + 1] })
      guard.push([p, d * 1.35]); return true }
    function chain(f) { // a straight feature: the stretch between neighbouring anchors stays on the line too, so nothing else may come near it
      const A = features[f].anchors; for (let k = 0; k + 1 < A.length; k++) { const p = A[k].p, q = A[k + 1].p, m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
        guard.push([m, Math.hypot((p[0] - q[0]) / st / 2, (p[1] - q[1]) / 2) * 1.08 + d]); chains.push([f, k]) } }
    function segment(p0, p1) { // the part of a line that lies on the screen
      let t0 = 0, t1 = 1; const dx = p1[0] - p0[0], dy = p1[1] - p0[1]
      for (const [pp, qq] of [[-dx, p0[0]], [dx, W - p0[0]], [-dy, p0[1]], [dy, H - p0[1]]]) { if (!pp) { if (qq < 0) return null; continue } const t = qq / pp; if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t) }
      return t1 > t0 ? [[p0[0] + dx * t0, p0[1] + dy * t0], [p0[0] + dx * t1, p0[1] + dy * t1]] : null }
    function lineFeature(kind, L0, text, extra = {}) { // a straight line of the photograph, laid evenly with pairs
      const a = C.to(...L0.p0), b = C.to(...L0.p1), dir = [b[0] - a[0], b[1] - a[1]], len0 = Math.hypot(...dir) || 1
      const far = [[a[0] - dir[0] / len0 * max * 2, a[1] - dir[1] / len0 * max * 2], [b[0] + dir[0] / len0 * max * 2, b[1] + dir[1] / len0 * max * 2]]
      const seg = segment(...far); if (!seg) return 0
      const len = Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]); if (len < min * .3) return 0
      const n = [-(seg[1][1] - seg[0][1]) / len, (seg[1][0] - seg[0][0]) / len], f = features.length
      features.push({ id: f, kind, text, ...extra, from: seg.map(p => p.map(v => +v.toFixed(2))), anchors: [] })
      const want = Math.min(pairsMax - S.length / 2, Math.max(2, Math.floor(len / (min * (D.spacing ?? .16)))))
      for (let k = 0; k < want; k++) { const t = (k + .5) / want; addPair([seg[0][0] + (seg[1][0] - seg[0][0]) * t, seg[0][1] + (seg[1][1] - seg[0][1]) * t], n, f, k) }
      chain(f); return features[f].anchors.length }
    function anchorsFeature(kind, text, list, gap, extra = {}) { // scattered anchors (the borders of masses, an outline, edges): strongest first, spaced
      const f = features.length; features.push({ id: f, kind, text, ...extra, anchors: [] })
      const kept = []
      for (const [k, A] of list.entries()) { if (S.length / 2 >= pairsMax) break
        const p = C.to(A[0], A[1]); if (!inside(p) || kept.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < gap)) continue
        if (addPair(p, [A[2], A[3]], f, k)) { kept.push(p); const last = features[f].anchors[features[f].anchors.length - 1]; Object.assign(last, extra.anchor ? extra.anchor(A) : {}) } }
      delete features[f].anchor; return features[f].anchors.length }

    /* fill: the rest of the sites, each placed by what the photograph holds under it, and tagged with it */
    function fill(weight, regionOf, by) {
      const want = count - S.length; if (want <= 0) return
      let gap = min * (D.fillGap ?? .13), tries = 0
      while (S.length < count && tries < 12) {
        for (let k = 0; k < 1400 && S.length < count; k++) { const p = [2 + r() * (W - 4), 2 + r() * (H - 4)]
          if (r() > weight(p)) continue
          if (!free(p) || S.some(s => dS(s, p) < gap)) continue
          S.push(p); T.push({ kind: 'fill', region: regionOf(p), by }) }
        gap *= .82; tries++ }
      while (S.length < count) { const p = [2 + r() * (W - 4), 2 + r() * (H - 4)]; if (S.some(s => dS(s, p) < 2)) continue; S.push(p); T.push({ kind: 'geometric', why: 'no room left beside the photograph\'s lines' }) } }
    const at = p => C ? C.uv(p[0], p[1]) : [.5, .5]
    const toneAt = p => { const [u, v] = at(p), m = gridAt(R.masses.grid, u, v); return m == null ? null : R.masses.names[m] }
    const edgeAt = p => { const [u, v] = at(p); return (gridAt(R.edges.grid, u, v) ?? 4) / 9 }
    const salAt = p => { const [u, v] = at(p); return (gridAt(R.salience, u, v) ?? 4) / 9 }
    const sideOf = (F, p) => { if (!F) return null; const [a, b] = F.from, s = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); return s > 0 ? F.below : F.above }

    const run = {
      line() {
        const need = D.lineMin ?? .25, h = R.horizon, l = R.line
        const use = h && h.score >= need ? ['horizon', h] : l && l.score >= need ? ['line', l] : null
        if (!use) return { to: 'masses', why: `no straight line strong enough: horizon ${h ? h.score : 'none'}, any line ${l ? l.score : 'none'}, needs ${need}` }
        const [kind, L0] = use, upper = (L0.p0[1] + L0.p1[1]) / 2 < .5
        const got = lineFeature(kind, L0, kind === 'horizon' ? `the horizon, ${Math.abs(L0.angle) < 1 ? 'level' : Math.abs(L0.angle) + '° off level'}` : `the strongest straight line, ${L0.angle}°`,
          { score: L0.score, step: L0.step, above: kind === 'horizon' ? (L0.toneA > L0.toneB ? 'the lighter side above it' : 'the darker side above it') : 'one side', below: 'the other side' })
        if (got < 2) return { to: 'masses', why: `the ${kind} leaves the screen at this size` }
        const F = features[0]; F.above = kind === 'horizon' ? 'above the horizon' : 'one side of the line'; F.below = kind === 'horizon' ? 'below the horizon' : 'the other side of the line'
        if (kind === 'horizon' && l && l.score >= need) lineFeature('line', l, `the strongest straight line, ${l.angle}°`, { score: l.score, step: l.step })
        fill(p => .25 + .75 * edgeAt(p), p => sideOf(F, p), 'edge energy') },
      masses() {
        const M = R.masses; if (!M.anchors.length) return { to: 'edges', why: 'one tone: the photograph has no border between light and dark' }
        const got = anchorsFeature('mass-border', `the borders of its ${M.names.length} tones`, M.anchors, min * (D.spacing ?? .16) * .75, { tones: M.names, anchor: A => ({ between: [A[4], A[5]], step: A[6] }) })
        if (got < 2) return { to: 'edges', why: 'its light and dark borders fall off the screen at this size' }
        fill(() => 1, toneAt, 'tone mass') },
      eye() {
        const E = R.eye; if (!E || E.share < .004) return { to: 'edges', why: 'nothing in it draws the eye more than the rest' }
        let pk = C.to(...E.peak), what = 'the peak of where the eye goes'
        if (!inside(pk)) { let best = -1; for (let y = min * .06; y < H - min * .06; y += min * .03) for (let x = min * .06; x < W - min * .06; x += min * .03) { const v = salAt([x, y]); if (v > best) { best = v; pk = [x, y] } } // the crop hides the peak: where the eye goes among what is on the screen
          what = 'where the eye goes on the screen (the peak is cropped off)' }
        S.push(pk); T.push({ kind: 'eye', what }); guard.push([pk, d * 1.4])
        const got = anchorsFeature('eye-outline', 'the outline of where the eye goes', E.outline, min * (D.spacing ?? .16) * .5, { share: E.share })
        if (got < 2) return { to: 'edges', why: 'what draws the eye is too small to cut at this size' }
        fill(p => .12 + .88 * salAt(p) ** 1.2, p => salAt(p) > .5 ? 'near where the eye goes' : 'away from it', 'salience') },
      edges() {
        const got = anchorsFeature('edge', 'its sharpest edges', R.edges.anchors, min * (D.spacing ?? .16) * .8, { anchor: A => ({ strength: A[4] }) })
        if (got < 2) return { to: 'masses', why: 'no sharp edge on the screen at this size' }
        fill(p => .2 + .8 * edgeAt(p), p => edgeAt(p) > .4 ? 'busy with edges' : 'quiet', 'edge energy') },
      hour() {
        const m = o.moment; if (!m || m.lat == null) return { to: 'masses', why: 'no moment to read the light from' }
        const s = sun(m.at, m.lat, m.lon), src = C.to(...R.light.peak), P = [Math.max(min * .04, Math.min(W - min * .04, src[0])), Math.max(min * .04, Math.min(H - min * .04, src[1]))]
        const night = s.alt < -6, nr = Math.max(2, Math.min(3, Math.floor(pairsMax / 2)))
        // the fan crosses the stone from the light; the sun's bearing leans it (east of south one way, west the other), its height sets how wide it opens: low sun rakes wide, high sun falls narrow; after dark it opens like a lamp
        const lean = Math.sin((s.az - 180) * Math.PI / 180), mid = Math.atan2(H / 2 - P[1], W / 2 - P[0]) + lean * Math.PI / 5
        const spread = (night ? 62 : 14 + 46 * (1 - Math.max(0, s.alt) / 90)) * Math.PI / 180
        const angles = [...Array(nr)].map((_, k) => mid - spread + 2 * spread * (nr === 1 ? .5 : k / (nr - 1)))
        const per = Math.max(1, Math.floor(pairsMax / nr))
        const reach = a => { const dir = [Math.cos(a), Math.sin(a)], far = segment(P, [P[0] + dir[0] * max * 3, P[1] + dir[1] * max * 3]); return far ? Math.hypot(far[1][0] - far[0][0], far[1][1] - far[0][1]) : 0 }
        for (const ang0 of angles) { let ang = ang0; for (const k of [.75, .5, .25, 0]) { if (reach(ang) >= min * .45) break; ang = mid + (ang0 - mid) * k } // a ray the frame would cut short folds toward the fan's middle, so each one crosses the stone
          const dir = [Math.cos(ang), Math.sin(ang)], len = reach(ang) * (night ? .7 : 1); if (len < min * .12) continue
          const f = features.length; features.push({ id: f, kind: 'ray', text: night ? 'a ray from the light in the photograph, turned by where the sun is below the horizon' : 'a ray from the light in the photograph, at the sun\'s angle now',
            source: P.map(v => +v.toFixed(2)), angle: +(ang * 180 / Math.PI).toFixed(4), sun: s, at: m.at, place: m.place || null, from: [P.map(v => +v.toFixed(2)), [P[0] + dir[0] * len, P[1] + dir[1] * len].map(v => +v.toFixed(2))], anchors: [] })
          const n = [-dir[1], dir[0]], k0 = night ? .3 : .22
          for (let k = 0; k < per; k++) { const t = k0 + (1 - k0) * (k + .5) / per; addPair([P[0] + dir[0] * len * t, P[1] + dir[1] * len * t], n, f, k) }
          chain(f) }
        if (features.reduce((n, F) => n + F.anchors.length, 0) < 2) return { to: 'masses', why: 'the light sits too near the frame for its rays to cross the stone' }
        fill(p => { const dd = Math.hypot(p[0] - P[0], p[1] - P[1]) / max; return .2 + .8 * Math.exp(-dd * 2.2) }, p => toneAt(p), 'nearness to the light') } }

    if (!R) { fallback = { to: 'geometric', why: 'no reading of this photograph' }; ran = 'geometric' }
    else { let step = logic, seen = new Set()
      while (step && step !== 'geometric') { seen.add(step)
        S.length = 0; T.length = 0; features.length = 0; guard.length = 0; chains.length = 0
        let fell = run[step]()
        if (!fell) { const anchors = features.reduce((n, F) => n + F.anchors.length, 0), own = T.filter(t => t.kind === 'pair' || t.kind === 'eye').length
          if (anchors < 2 || own / count < LEAST) fell = { to: NEXT[step], why: `only ${anchors} of its points fit on the screen at this size` } } // too little of the photograph's own lines to call it its cut
        if (!fell) { ran = step; break }
        fallback = fallback ? { ...fallback, then: fell } : { ...fell, from: step }
        step = seen.has(fell.to) ? 'geometric' : fell.to; ran = step } }
    if (ran === 'geometric') { S.length = 0; T.length = 0; features.length = 0
      for (let k = 0; S.length < count; k++) { const p = [2 + r() * (W - 4), 2 + r() * (H - 4)]; if (S.some(s => dS(s, p) < min * .1 * .9 ** Math.floor(k / 300))) continue; S.push(p); T.push({ kind: 'geometric', why: fallback ? fallback.why : 'none' }) }
      fallback = fallback || { to: 'geometric', why: 'none' }; fallback.to = 'geometric' }
    // the hero (index 0, which the crossing keeps as the hero) is the site the logic is most about
    const lead = T.findIndex(t => t.kind === 'eye') >= 0 ? T.findIndex(t => t.kind === 'eye') : 0
    if (lead) { [S[0], S[lead]] = [S[lead], S[0]]; [T[0], T[lead]] = [T[lead], T[0]]; fix(0, lead) }
    function fix(a, b) { for (const t of T) if (t.mate === a) t.mate = b; else if (t.mate === b) t.mate = a; for (const F of features) for (const A of F.anchors) A.pair = A.pair.map(i => i === a ? b : i === b ? a : i) }
    const geo = T.filter(t => t.kind === 'geometric').length
    if (geo && !fallback) fallback = { to: 'part geometric', why: `${geo} sites found no room beside the photograph's lines` }
    const summary = ran === 'geometric' ? 'cut by chance: ' + fallback.why : features.filter(F => F.anchors.length).map(F => F.text).filter((t, i, a) => a.indexOf(t) === i).join(' · ')
    return { logic, ran, fallback, sites: S.map(p => [+p[0].toFixed(3), +p[1].toFixed(3)]), tags: T, features, chains, d, stretch: st, summary } }

  /* ---------- each facet, edge by edge: which site lies across each seam, and so what made it ---------- */
  function edgeBasis(T, i, j) {
    const a = T[i], b = T[j]
    if (a.kind === 'geometric' || b.kind === 'geometric') return { kind: 'geometric' }
    if (a.kind === 'pair' && a.mate === j) return { kind: 'on', f: a.f, k: a.k }
    if (a.kind === 'pair' && b.kind === 'pair') return a.f === b.f ? { kind: 'along', f: a.f } : { kind: 'meet', f: a.f, g: b.f }
    if (a.kind === 'pair' || b.kind === 'pair') { const p = a.kind === 'pair' ? a : b, q = a.kind === 'pair' ? b : a; return { kind: 'beside', f: p.f, region: q.region ?? q.what ?? null } }
    return { kind: 'split', region: a.region === b.region ? a.region ?? a.what ?? null : [a.region ?? a.what ?? null, b.region ?? b.what ?? null], by: a.by || b.by || null } }
  function facets(K, cells, W, H, wind, R) {
    const st = stretchOf(wind), dS = (p, q) => Math.hypot((p[0] - q[0]) / st, p[1] - q[1]), C = R ? cover(R, W, H) : null, onFrame = v => Math.abs(v) < .6
    return cells.map((P, i) => {
      if (P.length < 3) return { i, edges: [], region: null }
      let cx = 0, cy = 0; P.forEach(p => { cx += p[0]; cy += p[1] }); cx /= P.length; cy /= P.length
      const edges = P.map((a, e) => { const b = P[(e + 1) % P.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        if ((onFrame(a[0]) && onFrame(b[0])) || (onFrame(a[0] - W) && onFrame(b[0] - W)) || (onFrame(a[1]) && onFrame(b[1])) || (onFrame(a[1] - H) && onFrame(b[1] - H))) return { to: null, kind: 'frame' }
        let j = -1, bd = Infinity; K.sites.forEach((s, q) => { if (q === i) return; const dd = dS(s, m); if (dd < bd) { bd = dd; j = q } })
        return { to: j, ...edgeBasis(K.tags, i, j) } })
      let region = null
      if (C) { const [u, v] = C.uv(cx, cy), g = rows => gridAt(rows, u, v)
        const m = g(R.masses.grid), h = K.features.find(F => F.kind === 'horizon' || F.kind === 'line')
        region = { uv: [+u.toFixed(3), +v.toFixed(3)], tone: m == null ? null : R.masses.names[m], salience: (g(R.salience) ?? 0) / 9, edges: (g(R.edges.grid) ?? 0) / 9,
          side: h && h.from ? (((h.from[1][0] - h.from[0][0]) * (cy - h.from[0][1]) - (h.from[1][1] - h.from[0][1]) * (cx - h.from[0][0])) > 0 ? h.below : h.above) || null : null,
          page: [cx < W / 3 ? 'left' : cx > W * 2 / 3 ? 'right' : 'centre', cy < H / 3 ? 'top' : cy > H * 2 / 3 ? 'bottom' : 'middle'] } }
      return { i, site: K.tags[i], centroid: [+cx.toFixed(1), +cy.toFixed(1)], edges, region } }) }

  const api = { LOGICS, cut, facets, voronoi, cover, sun, edgeBasis, stretchOf, gridAt }
  if (typeof module === 'object' && module.exports) module.exports = api
  root.S33Cut = api
})(typeof window !== 'undefined' ? window : globalThis)
