// Study 25: 23 c (the fact lifts out) and 23 d (shared names light, a trail) as one behaviour, per ?v.
// a: the lift carries its jumps, kin lit in the block, the trail rides on top of the lift
// b: the lift; its kin, lit in the block, are the jumps; the trail stays marked in the block, numbered
// c: a column of lifted facts beside the block (a sheet on a phone), newest open, the way back down it
// d: the kin gather inside the lift, by reason; the block stays still
(() => {
  const U = JSON.parse(document.getElementById('units').textContent);
  const v = document.documentElement.dataset.v;
  const root = document.querySelector(`.v-${v}`);
  if (!root) return;
  const tex = root.querySelector('.tex'), col = root.querySelector('.col');
  const num = (k, d) => { const x = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--' + k)); return Number.isFinite(x) ? x : d; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => matchMedia('(max-width: 700px)').matches;
  const nodeOf = (id) => tex.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const short = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
  const floor = () => { const nb = document.querySelector('nav')?.getBoundingClientRect(); return nb && nb.top > innerHeight / 2 ? nb.top : innerHeight; };
  const setNav = () => document.documentElement.style.setProperty('--nav-h', Math.max(0, innerHeight - floor()) + 'px');
  setNav(); addEventListener('resize', setNav);
  const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  // a step: a button, or in d's gathered texture an inline span that acts as one (a <button> cannot wrap like text)
  const btn = (cls, text, to, how, inline) => {
    const b = el(inline ? 'span' : 'button', cls, text); b.dataset.to = to; if (how) b.dataset.how = how;
    if (inline) { b.setAttribute('role', 'button'); b.tabIndex = 0; } else b.type = 'button';
    return b;
  };

  // what a fact is: making and year, its words, a picture or its first lines, the way out
  const fill = (box, id) => {
    const u = U[id];
    box.append(el('span', 'ck', [u.k, u.y].filter(Boolean).join(' · ')));
    box.append(el('span', 'ct', u.t));
    if (u.i) { const im = el('img'); im.src = u.i; im.alt = u.a || ''; box.append(im); }
    if (u.l) box.append(el('span', 'cl', u.l.join(' / ')));
    if (u.h) { const a = el('a', 'co', u.to + ' →'); a.href = u.h; if (/^https?:/.test(u.h)) a.rel = 'noopener'; box.append(a); }
  };
  // its kin, grouped by the reason they are kin, capped
  const groups = (id) => {
    const g = new Map(); let n = 0; const max = num('jump-max', 24);
    for (const [x, why] of U[id].s) { if (n >= max) break; if (!U[x] || !nodeOf(x)) continue; if (!g.has(why)) g.set(why, []); g.get(why).push(x); n++; }
    return [...g];
  };
  const jumpList = (id, how) => {
    const s = el('span', 'js');
    for (const [why, ids] of groups(id)) {
      const g = el('span', 'jg'); g.append(el('span', 'jk', why));
      for (const x of ids) g.append(btn('jb', short(U[x].t, 52), x, how));
      s.append(g);
    }
    return s;
  };
  const kinCounts = (id) => {
    const s = el('span', 'js'), g = el('span', 'jg');
    for (const [why, ids] of groups(id)) { const k = el('span', 'jk', why + ' '); k.append(el('span', 'jn', String(ids.length))); g.append(k); }
    if (g.childNodes.length) s.append(g);
    return s;
  };
  const gather = (id) => {
    const s = el('span', 'gk');
    for (const [why, ids] of groups(id)) {
      const g = el('span', 'gg'); g.append(el('span', 'jk', why));
      for (const x of ids) g.append(btn('gb', short(U[x].t, 90), x, 'inside', true));
      s.append(g);
    }
    return s;
  };

  let trail = [], box = null, anchor = null;
  const clear = () => {
    box?.remove(); box = null;
    tex.classList.remove('lit');
    tex.querySelectorAll('.on, .rel, .gone, .been').forEach((n) => { n.classList.remove('on', 'rel', 'gone', 'been'); delete n.dataset.n; });
  };
  const light = (id) => {
    const s = U[id].s.map(([x]) => nodeOf(x)).filter(Boolean);
    if (!s.length) return;
    tex.classList.add('lit');
    for (const n of s) n.classList.add('rel');
  };
  const scrollTo = (dy) => { if (Math.abs(dy) > 2) scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' }); };
  // the lift on screen: on a phone its top comes to lift-top; on a desk only if it is off screen or low
  const bring = (b) => {
    const r = b.getBoundingClientRect(), top = num('lift-top', 64), fl = floor();
    if (phone() ? Math.abs(r.top - top) > 40 : r.top < 8 || r.top > fl - 200) scrollTo(r.top - top);
  };
  const back = (t) => btn('tl', '', t, 'inside');

  const render = (how) => {
    clear();
    root.dataset.trail = trail.join(' ');
    if (!trail.length) { anchor = null; col?.replaceChildren(); return; }
    const id = trail.at(-1), node = nodeOf(id);
    if (v !== 'd') light(id);
    if (v === 'b') trail.slice(0, -1).forEach((t, i) => { const n = nodeOf(t); if (n?.classList.contains('f')) { n.classList.add('been'); n.dataset.n = i + 1; } });

    if (v === 'c') {
      node.classList.add('on');
      col.replaceChildren();
      const now = el('div', 'now'); fill(now, id); now.append(jumpList(id)); col.append(now);
      for (const t of trail.slice(0, -1).reverse()) { const b = back(t); b.append(el('span', 'ck', U[t].k), document.createTextNode(short(U[t].t, 64))); col.append(b); }
      col.scrollTop = 0; setNav();
      const r = node.getBoundingClientRect(), bottom = phone() ? col.getBoundingClientRect().top : floor();
      if (r.top < 8 || r.bottom > bottom - 8) scrollTo(r.top - Math.max(num('lift-top', 64), (bottom - r.height) / 3));
      return;
    }

    if (v !== 'd' || how !== 'inside' || !anchor) anchor = node;
    const at = anchor.classList.contains('f') ? anchor : anchor.closest('.lift') || anchor;
    const tb = tex.getBoundingClientRect(), ab = at.getBoundingClientRect();
    box = el('span', 'fl' + ((ab.left + ab.right) / 2 - tb.left > tb.width / 2 ? ' r' : ''));
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', U[id].t);
    if (v === 'a' && trail.length > 1) { const tr = el('span', 'tr'); for (const t of trail) tr.append(btn('', short(U[t].t, 26), t)); box.append(tr); }
    if (v === 'd') for (const t of trail.slice(0, -1)) { const b = back(t); b.textContent = short(U[t].t, 56); box.append(b); }
    fill(box, id);
    if (v === 'a') box.append(jumpList(id));
    if (v === 'b') box.append(kinCounts(id));
    if (v === 'd') box.append(gather(id));
    at.before(box);
    node.classList.add(v === 'd' || !node.classList.contains('f') ? 'on' : 'gone');
    bring(box);
  };
  const step = (id, how) => {
    const at = trail.indexOf(id);
    if (at >= 0) trail.splice(at + 1);
    else { trail.push(id); const m = num('trail-max', 8); while (trail.length > m) trail.shift(); }
    render(how);
  };
  const drop = () => { trail = []; render(); };

  root.addEventListener('click', (e) => {
    if (!plainClick(e)) return;
    if (e.target.closest('.fl, .col')) { const b = e.target.closest('[data-to]'); if (b) { e.preventDefault(); step(b.dataset.to, b.dataset.how); } return; }
    const a = e.target.closest('a.u'); if (!a || !tex.contains(a)) return;
    const u = a.closest('[data-id]'); if (!u || !U[u.dataset.id]) return;
    const id = u.dataset.id;
    // a making, or a thing inside one, is already lifted: it opens its page, as in 23, unless it is lit or on the trail
    if (!u.classList.contains('f') && !u.classList.contains('rel') && !trail.includes(id)) return;
    e.preventDefault();
    if (trail.at(-1) === id) return drop();
    step(id);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return drop();
    const b = (e.key === 'Enter' || e.key === ' ') && e.target.closest?.('span[data-to]');
    if (b && root.contains(b)) { e.preventDefault(); step(b.dataset.to, b.dataset.how); }
  });
})();
