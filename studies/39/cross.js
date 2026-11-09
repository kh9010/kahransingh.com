/* Study 39: the crossing, re-cut. Both ends are Study 33's masses cut (cut.js, unchanged): this photograph's and the next one's.
   The crossing is built on the facets: a mirrored pair of sites is a seam lying on a border between the photograph's masses, so a pair is
   moved as a pair (its midpoint and its half-span, in the wind's space): the seam stays a seam the whole way, sliding from this photograph's
   border to the next one's. Pure: no DOM. The page loads it as a script (window.S39X); check.mjs runs the same file in node.

   S39X.plan({ x, A, B, RA, RB, W, H, wind, origin, D }) → a plan
     x       'slide' · 'hold' · 'shatter' · 'grow' · 'calm' (reduced motion)
     A, B    { sites, tags, cells } of this world and the next (same count: the count is the screen's)
     RA, RB  regions.json's readings of the two photographs
     origin  [x, y] where the crossing starts: the tapped facet, or the door line
   S39X.pose(plan, t) → { cells?, entries: [{ id, P, c, m, mix, alpha, seen, shade, glow, fire, crack, side }] }
     id      'm<i>' a facet that morphs (i = its site in this world) · 'o<i>' this world's facet · 'n<j>' the next world's
     mix     0 this photograph … 1 the next, inside the facet
     seen    how much of the facet a visitor sees (the ledger the check reads: nothing may leave it, or join it, unseen)
   At t = 0 the pose is this world's cut exactly; at t = 1 it is the next world's, exactly (so the landing never snaps). */
(function (root) {
  const XS = ['slide', 'hold', 'shatter', 'grow']
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v
  const ss = (a, b, t) => clamp01((t - a) / (b - a))
  const io = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  const eo = t => 1 - (1 - t) ** 3
  const K = () => root.S33Cut || (typeof require === 'function' ? require('./cut.js') : null)
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]
  const tr = (x, y) => [1, 0, 0, 1, x, y], sc = (x, y = x) => [x, 0, 0, y, 0, 0], rot = a => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]
  const about = ([cx, cy], ...ms) => [tr(cx, cy), ...ms, tr(-cx, -cy)].reduce(mul)
  const ID = [1, 0, 0, 1, 0, 0]
  function centroid(p) { let a = 0, x = 0, y = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length], c = x0 * y1 - x1 * y0; a += c; x += (x0 + x1) * c; y += (y0 + y1) * c } a *= .5; return a ? [x / (6 * a), y / (6 * a)] : p[0] ? p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]) : [0, 0] }
  function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
  const inPoly = ([x, y], p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }

  /* the tone a photograph holds under a point of the screen: its mass's lightness (regions.json) */
  function toneAt(R, W, H, p) { if (!R) return null; const [u, v] = K().cover(R, W, H).uv(p[0], p[1]), g = K().gridAt(R.masses.grid, u, v); return g == null ? null : R.masses.tones[g] }

  /* units: a mirrored pair (a seam on a border) moves as one; every other site moves alone */
  function units(C) { const out = [], done = new Set()
    C.tags.forEach((t, i) => { if (done.has(i)) return
      if (t.kind === 'pair' && t.mate != null && C.tags[t.mate] && C.tags[t.mate].mate === i) { const [a, b] = t.side === 1 ? [i, t.mate] : [t.mate, i]; done.add(a); done.add(b); out.push({ pair: true, a, b }) }
      else { done.add(i); out.push({ pair: false, a: i }) } })
    return out }

  /* the least total of squared moves (Hungarian, square matrix): with that cost the straight paths of the sites never cross */
  function assign(C) { const n = C.length, u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0)
    for (let i = 1; i <= n; i++) { p[0] = i; let j0 = 0; const minv = new Array(n + 1).fill(Infinity), used = new Array(n + 1).fill(false)
      do { used[j0] = true; const i0 = p[j0]; let delta = Infinity, j1 = 0
        for (let j = 1; j <= n; j++) if (!used[j]) { const cur = C[i0 - 1][j - 1] - u[i0] - v[j]; if (cur < minv[j]) { minv[j] = cur; way[j] = j0 } if (minv[j] < delta) { delta = minv[j]; j1 = j } }
        for (let j = 0; j <= n; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta } else minv[j] -= delta
        j0 = j1 } while (p[j0] !== 0)
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1 } while (j0) }
    const out = new Array(n); for (let j = 1; j <= n; j++) out[p[j] - 1] = j - 1; return out }

  /* the match: seams to seams first (near, and turned least; a seam with no near partner opens into two loose sites instead), then every
     site left to a site left. Every site of this cut has exactly one partner in the next, so the stone keeps its count and morphs facet for facet */
  function match(A, B, W, H, st, prefer, D = {}) {
    const m = Math.min(W, H), UA = units(A), UB = units(B), mid = (S, u) => [(S[u.a][0] + S[u.b][0]) / 2, (S[u.a][1] + S[u.b][1]) / 2]
    const half = (S, u) => [(S[u.a][0] - S[u.b][0]) / 2 / st, (S[u.a][1] - S[u.b][1]) / 2] // in the wind's space
    const PA = UA.filter(u => u.pair), PB = UB.filter(u => u.pair), N = PA.length + PB.length, lone = (D.seamReach ?? .35) ** 2
    const usedA = new Set(), usedB = new Set(), movers = []
    if (PA.length && PB.length) { const C = [...Array(N)].map(() => new Array(N).fill(0)), cosOf = {}
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { if (i >= PA.length || j >= PB.length) { C[i][j] = i >= PA.length && j >= PB.length ? 0 : lone; continue }
        const ua = PA[i], ub = PB[j], p = mid(A.sites, ua), q = mid(B.sites, ub), va = half(A.sites, ua), vb = half(B.sites, ub)
        const cos = (va[0] * vb[0] + va[1] * vb[1]) / ((Math.hypot(...va) * Math.hypot(...vb)) || 1); cosOf[i + ',' + j] = cos
        C[i][j] = (Math.hypot(p[0] - q[0], p[1] - q[1]) / m) ** 2 + .08 * (1 - Math.abs(cos)) + (prefer ? prefer(ua, ub) : 0) }
      assign(C).forEach((j, i) => { if (i >= PA.length || j >= PB.length || C[i][j] >= lone) return; const ua = PA[i], ub = PB[j], cos = cosOf[i + ',' + j]
        usedA.add(ua); usedB.add(ub); movers.push({ pair: true, from: [ua.a, ua.b], to: cos >= 0 ? [ub.a, ub.b] : [ub.b, ub.a] }) }) } // the side that faces the same way keeps facing it
    const la = UA.filter(u => !usedA.has(u)).flatMap(u => u.pair ? [u.a, u.b] : [u.a]), lb = UB.filter(u => !usedB.has(u)).flatMap(u => u.pair ? [u.a, u.b] : [u.a])
    if (la.length !== lb.length) throw new Error('left sites differ: ' + la.length + ' vs ' + lb.length)
    const C2 = la.map(i => lb.map(j => ((A.sites[i][0] - B.sites[j][0]) / st) ** 2 + (A.sites[i][1] - B.sites[j][1]) ** 2))
    assign(C2).forEach((k, q) => movers.push({ pair: false, from: [la[q]], to: [lb[k]] }))
    const to = []; for (const mv of movers) mv.from.forEach((i, k) => { to[i] = mv.to[k] })
    return { movers, to } }

  /* a mover at progress s: a seam keeps its midpoint and half-span, turned and slid in the wind's space, so it stays a crease on the way */
  function place(mv, s, A, B, st, out) {
    if (s >= 1) { mv.from.forEach((i, k) => { out[i] = B.sites[mv.to[k]].slice() }); return }
    if (s <= 0) { mv.from.forEach(i => { out[i] = A.sites[i].slice() }); return }
    const bow = (a, b) => { if (!mv.bend) return [0, 0]; const dx = (b[0] - a[0]) / st, dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, k = mv.bend * Math.sin(Math.PI * s); return [-dy / l * k * st, dx / l * k] } // a detour round another site
    if (!mv.pair) { const a = A.sites[mv.from[0]], b = B.sites[mv.to[0]], o = bow(a, b); out[mv.from[0]] = [a[0] + (b[0] - a[0]) * s + o[0], a[1] + (b[1] - a[1]) * s + o[1]]; return }
    const w = (S, [a, b]) => { const p = [(S[a][0] + S[b][0]) / 2 / st, (S[a][1] + S[b][1]) / 2], v = [(S[a][0] - S[b][0]) / 2 / st, (S[a][1] - S[b][1]) / 2]; return { p, len: Math.hypot(...v), ang: Math.atan2(v[1], v[0]) } }
    const P = w(A.sites, mv.from), Q = w(B.sites, mv.to); let da = Q.ang - P.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI
    const p = [P.p[0] + (Q.p[0] - P.p[0]) * s, P.p[1] + (Q.p[1] - P.p[1]) * s], len = P.len + (Q.len - P.len) * s, ang = P.ang + da * s, v = [Math.cos(ang) * len, Math.sin(ang) * len]
    const o = bow([P.p[0] * st, P.p[1]], [Q.p[0] * st, Q.p[1]]); out[mv.from[0]] = [(p[0] + v[0]) * st + o[0], p[1] + v[1] + o[1]]; out[mv.from[1]] = [(p[0] - v[0]) * st + o[0], p[1] - v[1] + o[1]] }

  /* the front, for grow: from the facet where the crossing starts, across this photograph's masses. Inside one mass it runs quickly;
     a seam that lies on a border, or a step to another tone, holds it back, so it fills the shape it starts in before it crosses */
  function front(A, RA, W, H, wind, origin, D) {
    const n = A.sites.length, F = K().facets(A, A.cells, W, H, wind, RA), o = A.cells.findIndex(P => P.length > 2 && inPoly(origin, P))
    const start = o >= 0 ? o : A.sites.map((s, i) => [Math.hypot(s[0] - origin[0], s[1] - origin[1]), i]).sort((x, y) => x[0] - y[0])[0][1]
    const tone = i => F[i] && F[i].region ? F[i].region.tone : null, dist = new Array(n).fill(Infinity), done = new Array(n).fill(false); dist[start] = 0
    for (let k = 0; k < n; k++) { let i = -1; for (let j = 0; j < n; j++) if (!done[j] && (i < 0 || dist[j] < dist[i])) i = j
      if (i < 0 || dist[i] === Infinity) break; done[i] = true
      for (const e of (F[i] && F[i].edges) || []) { if (e.to == null || e.to < 0) continue
        const c = e.kind === 'on' ? (D.border ?? 3) : tone(i) !== tone(e.to) ? (D.tone ?? 2) : 1; if (dist[i] + c < dist[e.to]) dist[e.to] = dist[i] + c } }
    const fin = dist.filter(Number.isFinite), max = Math.max(1, ...fin); return { start, dist: dist.map(d => Number.isFinite(d) ? d / max : 1) } }

  function plan(o) {
    const { A, B, W, H, RA, RB } = o, wind = o.wind ?? 8, st = K().stretchOf(wind), D = o.D || {}, x = o.x === 'calm' ? 'calm' : XS.includes(o.x) ? o.x : 'grow'
    if (A.sites.length !== B.sites.length) throw new Error(`the two cuts differ in count: ${A.sites.length} vs ${B.sites.length}`)
    const origin = o.origin || [W / 2, H / 2], m = Math.min(W, H), P = { x, A, B, W, H, wind, st, origin, D, n: A.sites.length }
    if (x === 'calm' || x === 'shatter') { // whole facets, never re-cut mid-way: this world's pieces go, the next world's come
      P.cA = A.cells.map(centroid); P.cB = B.cells.map(centroid)
      if (x === 'shatter') { const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(q => Math.hypot(q[0] - origin[0], q[1] - origin[1])))
        const r = i => (hash(i + '|' + A.sites.length + '|' + origin.join()) % 1000) / 1000
        P.fall = P.cA.map((c, i) => ({ at: .08 + .4 * Math.hypot(c[0] - origin[0], c[1] - origin[1]) / far, spin: (r(i) - .5) * 2, out: [(c[0] - origin[0]) / far, (c[1] - origin[1]) / far] }))
        // the next cut assembles mass by mass: the mass under the start first, then the others by how near they lie
        const tB = P.cB.map(c => toneAt(RB, W, H, c)), first = tB[B.cells.findIndex(Pp => Pp.length > 2 && inPoly(origin, Pp))] ?? tB[0]
        const groups = [...new Set(tB)].map(tn => { const ix = tB.map((v, j) => v === tn ? j : -1).filter(j => j >= 0), d = Math.min(...ix.map(j => Math.hypot(P.cB[j][0] - origin[0], P.cB[j][1] - origin[1]))); return { tn, ix, d: tn === first ? -1 : d } }).sort((a, b) => a.d - b.d)
        P.rise = new Array(B.cells.length); let k = 0
        groups.forEach((gp, gi) => gp.ix.sort((a, b) => Math.hypot(P.cB[a][0] - origin[0], P.cB[a][1] - origin[1]) - Math.hypot(P.cB[b][0] - origin[0], P.cB[b][1] - origin[1]))
          .forEach((j, q) => { P.rise[j] = { at: .3 + .38 * (gi + q / Math.max(1, gp.ix.length)) / groups.length, group: gi }; k++ })) }
      return P }
    // the morphing crossings: every facet is re-cut, seam by seam
    let prefer = null
    if (x === 'hold') { const same = (i, j) => { const a = toneAt(RA, W, H, A.sites[i]), b = toneAt(RB, W, H, B.sites[j]); return a != null && b != null && Math.abs(a - b) < (D.holdTone ?? 12) }
      prefer = (ua, ub) => same(ua.a, ub.a) && same(ua.b, ub.b) ? 0 : .02 }
    const M = match(A, B, W, H, st, prefer, D); P.movers = M.movers; P.to = M.to
    if (x === 'hold') { // a facet whose mass is the same tone where it lies in both photographs carries across: it holds its place and changes photograph first
      const keep = i => { const a = toneAt(RA, W, H, A.sites[i]), b = toneAt(RB, W, H, A.sites[i]), t = D.holdTone ?? 12
        return a != null && b != null && Math.abs(a - b) < t && Math.hypot(A.sites[i][0] - B.sites[M.to[i]][0], A.sites[i][1] - B.sites[M.to[i]][1]) < m * (D.holdNear ?? .45) }
      P.movers.forEach(mv => { mv.held = mv.from.every(keep) }) }
    if (x === 'grow') { const Fr = front(A, RA, W, H, wind, origin, D); P.start = Fr.start; P.movers.forEach(mv => { mv.at = Math.min(...mv.from.map(i => Fr.dist[i])) * (D.growSpread ?? .56) }) }
    P.gap = m * (D.gap ?? .03); windows(P); return untangle(P) }

  /* progress of a mover and of the photograph inside its facets: each mover has its own window [w0, w1]; the photograph changes inside it */
  const prog = (mv, t) => { const [a, b] = mv.w, l = b - a; return [io(ss(a, b, t)), io(ss(a + l * (mv.k0 ?? .14), a + l * (mv.k1 ?? .86), t))] }
  function windows(P) { const D = P.D
    for (const mv of P.movers) {
      if (P.x === 'slide') { mv.w = [.06, .94]; mv.k0 = .14; mv.k1 = .86 }
      if (P.x === 'hold') { if (mv.held) { mv.w = [.62, 1]; mv.k0 = -1.6; mv.k1 = -.7 } else { mv.w = [.24, .9]; mv.k0 = .1; mv.k1 = 1 } } // held: the photograph changes long before the facet moves
      if (P.x === 'grow') { const len = 1 - (D.growSpread ?? .56); mv.w = [mv.at, mv.at + len]; mv.k0 = .1; mv.k1 = .9 } } }

  /* untangle: two sites that pass closer than the pair gap swing the seam between them round in a frame. Swap their targets, or move one
     window, whichever leaves the least closeness; repeat until no two sites come that close (sites of one seam keep their own gap) */
  function untangle(P, steps = 60) {
    const { A, B, st } = P, n = P.n, lim = P.gap, of = []; P.movers.forEach(mv => mv.from.forEach(i => { of[i] = mv }))
    const mate = i => { const mv = of[i]; return mv.pair ? mv.from[0] === i ? mv.from[1] : mv.from[0] : -1 }
    const paths = () => { const T = []; for (let s = 0; s <= steps; s++) { const S = new Array(n); for (const mv of P.movers) place(mv, prog(mv, s / steps)[0], A, B, st, S); T.push(S) } return T }
    const worst = T => { let bad = 0, w = null // closest approach of every two sites, between samples too (each step taken as straight)
      for (let k = 0; k + 1 < T.length; k++) { const S0 = T[k], S1 = T[k + 1]
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (mate(i) === j) continue
          const r0x = (S0[i][0] - S0[j][0]) / st, r0y = S0[i][1] - S0[j][1], r1x = (S1[i][0] - S1[j][0]) / st, r1y = S1[i][1] - S1[j][1], dx = r1x - r0x, dy = r1y - r0y, ll = dx * dx + dy * dy
          const u = ll ? clamp01(-(r0x * dx + r0y * dy) / ll) : 0, d = Math.hypot(r0x + dx * u, r0y + dy * u)
          if (d < lim) { bad += lim - d; if (!w || d < w[0]) w = [d, i, j] } } }
      return { bad, w } }
    let T = paths(), cur = worst(T), it = 0
    while (cur.bad > 0 && it++ < (P.D.untangle ?? 60)) { const [, i, j] = cur.w, tries = []
      const mi = of[i], mj = of[j]
      if (!mi.pair && !mj.pair) tries.push(() => { const a = mi.to[0]; mi.to[0] = mj.to[0]; mj.to[0] = a; return () => { const b = mi.to[0]; mi.to[0] = mj.to[0]; mj.to[0] = b } })
      for (const mv of [mi, mj]) for (const d of [.08, -.08, .18, -.18, .3, -.3]) for (const k of [0, 1, 2]) tries.push(() => { const old = mv.w.slice(), w = mv.w.slice() // one end, or the whole window
        if (k === 2) { const l = w[1] - w[0], a0 = Math.max(0, Math.min(1 - l, w[0] + d)); w[0] = a0; w[1] = a0 + l } else w[k] = Math.max(0, Math.min(1, w[k] + d))
        if (w[1] - w[0] < .3 || (w[0] === old[0] && w[1] === old[1])) return null; mv.w = w; return () => { mv.w = old } })
      for (const mv of [mi, mj]) for (const b of [1.5, -1.5, 3, -3, 5, -5]) tries.push(() => { const old = mv.bend || 0; if (Math.abs(old + b * lim) > lim * 8) return null; mv.bend = old + b * lim; return () => { mv.bend = old } })
      let best = null
      for (const f of tries) { const undo = f(); if (!undo) continue; const r = worst(paths()); if (r.bad < cur.bad - 1e-6 && (!best || r.bad < best.r.bad)) best = { r, f }; undo() }
      if (!best) break
      best.f(); cur = best.r }
    P.to = []; for (const mv of P.movers) mv.from.forEach((i, k) => { P.to[i] = mv.to[k] })
    P.tangle = cur.bad > 0 ? { close: +cur.w[0].toFixed(2), of: lim } : null; return P }

  function pose(P, t) {
    t = clamp01(t); const { A, B, W, H } = P, fire = P.D.fire ?? .7, entries = []
    if (P.x === 'calm') { const k = io(t) // reduced motion: nothing moves; the next stone comes up over this one
      A.cells.forEach((Pp, i) => entries.push({ id: 'o' + i, side: 'A', P: Pp, c: P.cA[i], m: ID, mix: 0, alpha: 1, seen: 1 - k }))
      B.cells.forEach((Pp, j) => entries.push({ id: 'n' + j, side: 'B', P: Pp, c: P.cB[j], m: ID, mix: 1, alpha: k, seen: k }))
      return { entries } }
    if (P.x === 'shatter') { const m = Math.min(W, H)
      B.cells.forEach((Pp, j) => { const R = P.rise[j], u = eo(ss(R.at, R.at + .3, t)), a = ss(0, .14, t) // beneath: the next cut, sunk, rising piece by piece into place
        entries.push({ id: 'n' + j, side: 'B', P: Pp, c: P.cB[j], m: u >= 1 ? ID : about(P.cB[j], sc(1 - (P.D.sink ?? .1) * (1 - u))), mix: 1, alpha: a, seen: a * (.35 + .65 * u), shade: .55 * (1 - u), glow: u * (1 - u) * .5 }) })
      A.cells.forEach((Pp, i) => { const f = P.fall[i], crack = ss(0, .1, t) * (P.D.crack ?? 3), u = ss(f.at, f.at + .42, t), uu = u * u // on top: this cut breaks along its own seams and falls
        const dx = f.out[0] * m * .3 * u, dy = uu * H * (P.D.drop ?? .9) + f.out[1] * m * .12 * u, r = f.spin * (P.D.spin ?? .6) * u
        const al = 1 - ss(.55, 1, u), mm = u <= 0 ? ID : mul(tr(dx, dy), about(P.cA[i], rot(r), sc(1 - .12 * u)))
        entries.push({ id: 'o' + i, side: 'A', P: Pp, c: P.cA[i], m: mm, mix: 0, alpha: al, seen: al, shade: .45 * u, crack: crack * (1 - u * .5), fire: fire * Math.sin(Math.PI * ss(0, .2, t)) * (1 - u) }) })
      return { entries } }
    const S = new Array(P.n), mixOf = new Array(P.n), sOf = new Array(P.n)
    for (const mv of P.movers) { const [s, k] = prog(mv, t); place(mv, s, A, B, P.st, S); mv.from.forEach(i => { mixOf[i] = k; sOf[i] = s }) }
    const cells = K().voronoi(S, W, H, P.wind)
    cells.forEach((Pp, i) => { const s = sOf[i], k = mixOf[i]
      entries.push({ id: 'm' + i, side: 'M', P: Pp, c: centroid(Pp), m: ID, mix: k, alpha: 1, seen: 1, fire: fire * Math.sin(Math.PI * s), glow: s * (1 - s) * 4 * .1, site: i, to: P.to[i] }) })
    return { sites: S, cells, entries } }

  /* what a visitor sees of one entry: its polygon as drawn (the transform applied), its area and its centre */
  function seenOf(e) { const m = e.m || ID, Q = e.P.map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]])
    let a = 0; for (let i = 0; i < Q.length; i++) { const [x0, y0] = Q[i], [x1, y1] = Q[(i + 1) % Q.length]; a += x0 * y1 - x1 * y0 }
    return { Q, area: Q.length > 2 ? Math.abs(a) / 2 : 0, c: Q.length > 2 ? centroid(Q) : null } }

  const api = { XS, plan, pose, match, assign, untangle, units, place, front, toneAt, seenOf, centroid, mul, about, tr, sc, rot }
  if (typeof module === 'object' && module.exports) module.exports = api
  root.S39X = api
})(typeof window !== 'undefined' ? window : globalThis)
