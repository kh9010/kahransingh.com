// chain.js — order the walk so each picture answers the one before it.
//
// Kahran, 2026-10-28: "flow logically somehow from one to another, like have some sort of
// visual ref that makes sense why that one is following the previous one."
//
// A distance between two pictures is a weighted mean of seven per-feature distances
// (features.json, measured by features.py), each divided by its median over all pairs, so
// 1 means "as alike as two pictures usually are" and 0 means "the same":
//   colour   Lab a/b and the chroma-weighted hue histogram   (two monochromes: 0.8)
//   tone     lightness and contrast
//   lines    edge direction mix and edge density
//   horizon  height of the strongest horizontal band, when both have one (else 1)
//   layout   8x8 lightness grid: where the mass sits
//   subject  0 if the alt-text word groups share one, else 1 (no words: 1)
//   place    0 if both have the same caption place, else 1
// The order is the open path through all pictures that keeps that distance small from one
// to the next: nearest-neighbour from every start, the best kept, then 2-opt.
// Each step is named by the feature that carries it most (weight x closeness), if any
// feature is closer than `linkMin`; otherwise the step is left unnamed.
(function (root) {
  const KEYS = ['colour', 'tone', 'lines', 'horizon', 'layout', 'subject', 'place'];
  const HUE = ['red', 'orange', 'amber', 'yellow', 'olive', 'green', 'green', 'teal', 'blue', 'blue', 'violet', 'pink'];
  const H_STRONG = 2.2;

  const l1 = (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0);
  const l2 = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
  const satHue = (p) => p.hue.map((h) => h * Math.min(1, p.chroma / 15));

  const RAW = {
    colour: (p, q) => (p.mono && q.mono) ? 'mono' : Math.hypot(p.a - q.a, p.b - q.b) / 10 + l1(satHue(p), satHue(q)),
    tone: (p, q) => Math.hypot((p.L - q.L) / 15, (p.contrast - q.contrast) / 8),
    lines: (p, q) => 2 * l1(p.orient, q.orient) + Math.abs(p.density - q.density) / Math.max(1, (p.density + q.density) / 2),
    horizon: (p, q) => (p.hstrength >= H_STRONG && q.hstrength >= H_STRONG) ? Math.abs(p.horizon - q.horizon) * 4 : null,
    layout: (p, q) => l2(p.layout, q.layout),
    subject: (p, q) => (!p.subject.length || !q.subject.length) ? null : (p.subject.some((s) => q.subject.includes(s)) ? 0 : 1),
    place: (p, q) => (p.place && q.place && p.place === q.place) ? 0 : null,
  };
  const BINARY = { subject: true, place: true };

  function median(xs) { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 1; }

  // d[key][i][j], every value normalised; null raw becomes 1 (neither helps nor hurts).
  function model(photos) {
    const n = photos.length, d = {};
    for (const k of KEYS) {
      const raw = Array.from({ length: n }, () => new Array(n).fill(null));
      const vals = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const v = RAW[k](photos[i], photos[j]);
        raw[i][j] = raw[j][i] = v;
        if (typeof v === 'number') vals.push(v);
      }
      const m = BINARY[k] ? 1 : (median(vals) || 1);
      d[k] = raw.map((row, i) => row.map((v, j) => i === j ? 0 : v === 'mono' ? 0.8 : v === null ? 1 : v / m));
    }
    const meanOrient = [0, 1, 2, 3].map((b) => photos.reduce((s, p) => s + p.orient[b], 0) / n);
    return { photos, n, d, meanOrient };
  }

  // How mid a lightness is: 1 inside [lo, hi], falling to 0 over 10 L outside it.
  const midness = (L, lo, hi) => Math.max(0, Math.min(1, 1 - Math.max(lo - L, L - hi, 0) / 10));

  // The colour order's own terms (Kahran, 2026-10-28: "I love the mid tone transitions").
  // On top of the weighted mean, a step pays lstep x (dL/15)^2 and cstep x (dC/10)^2: squared,
  // so a gradual shift is nearly free and a dark-to-pale jump is dear. A step between two
  // mid-tone pictures is then discounted by up to `mid`, more the gentler its lightness step.
  function dist(M, w, i, j) {
    let s = 0, t = 0;
    for (const k of KEYS) { const wk = +w[k] || 0; s += wk * M.d[k][i][j]; t += wk; }
    let d = t ? s / t : 0;
    if (w.lstep || w.cstep || w.mid) {
      const p = M.photos[i], q = M.photos[j];
      const dL = Math.abs(p.L - q.L) / 15, dC = Math.abs(p.chroma - q.chroma) / 10;
      d += (+w.lstep || 0) * dL * dL + (+w.cstep || 0) * dC * dC;
      const m = midness(p.L, w.midLo, w.midHi) * midness(q.L, w.midLo, w.midHi) * Math.exp(-dL);
      d *= 1 - Math.min(0.9, +w.mid || 0) * m;
    }
    return d;
  }

  // The four orders' weights from the dials (defaults.json keys), one place for the page and verify.
  function sets(dial) {
    const W = {};
    for (const k of KEYS) W[k] = +dial('w-' + k);
    const lead = +dial('lead');
    return {
      colour: { ...W, colour: W.colour * lead, tone: W.tone * lead,
        mid: +dial('mid-weight'), lstep: +dial('l-step'), cstep: +dial('c-step'), midLo: +dial('mid-lo'), midHi: +dial('mid-hi') },
      line: { ...W, lines: W.lines * lead, horizon: W.horizon * lead, layout: W.layout * lead },
      blend: W,
    };
  }

  // What a colour reading of an order looks like, in plain counts.
  //   yard: mean neighbour distance on colour + tone alone (one yardstick for every order)
  //   dL, dC: mean lightness and chroma step; jumps: steps of more than 30 L
  //   midSteps: steps between two mid-tone pictures (both L in [lo, hi]) with dL <= 8 and dC <= 6
  //   paleRuns: how many separate runs the pale pictures (L >= hi) fall into; fewer = together
  function colourStats(M, order, lo, hi) {
    const P = M.photos, yard = { colour: 1, tone: 1 };
    let y = 0, dL = 0, dC = 0, jumps = 0, mid = 0, runs = 0;
    for (let k = 1; k < order.length; k++) {
      const p = P[order[k - 1]], q = P[order[k]], l = Math.abs(p.L - q.L), c = Math.abs(p.chroma - q.chroma);
      y += dist(M, yard, order[k - 1], order[k]); dL += l; dC += c;
      if (l > 30) jumps++;
      if (p.L >= lo && p.L <= hi && q.L >= lo && q.L <= hi && l <= 8 && c <= 6) mid++;
    }
    for (let k = 0; k < order.length; k++) if (P[order[k]].L >= hi && (k === 0 || P[order[k - 1]].L < hi)) runs++;
    const n = order.length - 1;
    return { yard: y / n, dL: dL / n, dC: dC / n, jumps, midSteps: mid, paleRuns: runs, pale: P.filter((p) => p.L >= hi).length };
  }

  function cost(M, w, order) { let c = 0; for (let i = 1; i < order.length; i++) c += dist(M, w, order[i - 1], order[i]); return c; }

  function path(M, w) {
    const n = M.n;
    const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => dist(M, w, i, j)));
    let best = null, bestC = Infinity;
    for (let s = 0; s < n; s++) {
      const used = new Uint8Array(n), ord = [s]; used[s] = 1; let c = 0;
      while (ord.length < n) {
        const a = ord[ord.length - 1]; let bj = -1, bd = Infinity;
        for (let j = 0; j < n; j++) if (!used[j] && D[a][j] < bd) { bd = D[a][j]; bj = j; }
        used[bj] = 1; ord.push(bj); c += bd;
      }
      if (c < bestC) { bestC = c; best = ord; }
    }
    // 2-opt on an open path: reverse best[i..j] when it shortens the two joins.
    let improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (let i = 1; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
        const a = best[i - 1], b = best[i], c = best[j], e = j + 1 < n ? best[j + 1] : -1;
        const before = D[a][b] + (e >= 0 ? D[c][e] : 0);
        const after = D[a][c] + (e >= 0 ? D[b][e] : 0);
        if (after < before - 1e-9) { best = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1)); improved = true; }
      }
    }
    return best;
  }

  function word(M, k, i, j) {
    const p = M.photos[i], q = M.photos[j];
    if (k === 'colour') {
      const h = p.hue.map((x, b) => x * p.chroma + q.hue[b] * q.chroma);
      return 'same ' + HUE[h.indexOf(Math.max(...h))];
    }
    if (k === 'tone') {
      const L = (p.L + q.L) / 2, c = (p.contrast + q.contrast) / 2;
      return L < 22 ? 'both dark' : L > 58 ? 'both bright' : c < 16 ? 'soft light' : c > 26 ? 'hard light' : 'same mid-tone';
    }
    if (k === 'lines') {
      const o = [0, 1, 2, 3].map((b) => p.orient[b] + q.orient[b] - 2 * M.meanOrient[b]);
      const b = o.indexOf(Math.max(...o));
      return b === 0 ? 'horizontals' : b === 1 ? 'verticals' : 'diagonals';
    }
    if (k === 'horizon') { const y = (p.horizon + q.horizon) / 2; return y < 0.38 ? 'horizon high' : y > 0.62 ? 'horizon low' : 'horizon middle'; }
    if (k === 'layout') {
      const dx = (p.mass[0] + q.mass[0]) / 2 - 0.5, dy = (p.mass[1] + q.mass[1]) / 2 - 0.5;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.04) return 'weight centred';
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'weight left' : 'weight right') : (dy < 0 ? 'weight high' : 'weight low');
    }
    if (k === 'subject') return p.subject.find((s) => q.subject.includes(s));
    if (k === 'place') return p.place;
    return '';
  }

  // The named reason for the step i -> j, or '' when no feature is close enough to show.
  function link(M, w, i, j, linkMin) {
    let bk = null, bs = 0;
    for (const k of KEYS) {
      const dk = M.d[k][i][j], wk = +w[k] || 0;
      if (k === 'colour' && M.photos[i].mono && M.photos[j].mono) continue;
      if (dk >= linkMin || wk <= 0) continue;
      const s = wk * (1 - dk);
      if (s > bs) { bs = s; bk = k; }
    }
    return bk ? { key: bk, word: word(M, bk, i, j) } : { key: null, word: '' };
  }

  const api = { KEYS, model, dist, cost, path, link, sets, colourStats, midness };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Chain = api;
})(typeof window !== 'undefined' ? window : globalThis);
