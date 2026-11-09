// Study 27: 25 d's lift, the same in every way of holding the years (?v=a…d).
// A fact lifts where it sits, its kin gathered inside by reason, the trail folded above; the block does not dim or move.
// New here: the lifted fact's lane (19 b's long things) goes dark; in d the spine marks the year in view.
(() => {
  const U = JSON.parse(document.getElementById('units').textContent);
  const v = document.documentElement.dataset.v;
  const root = document.querySelector(`.v-${v}`);
  if (!root) return;
  const tex = root.querySelector('.tex');
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
  // a step: a button, or in the gathered texture an inline span that acts as one (a <button> cannot wrap like text)
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
  // its kin, grouped by the reason they are kin, capped, gathered in the block's own texture
  const gather = (id) => {
    const g = new Map(); let n = 0; const max = num('jump-max', 24);
    for (const [x, why] of U[id].s) { if (n >= max) break; if (!U[x] || !nodeOf(x)) continue; if (!g.has(why)) g.set(why, []); g.get(why).push(x); n++; }
    const s = el('span', 'gk');
    for (const [why, ids] of g) {
      const gg = el('span', 'gg'); gg.append(el('span', 'jk', why));
      for (const x of ids) gg.append(btn('gb', short(U[x].t, 90), x, 'inside', true));
      s.append(gg);
    }
    return s;
  };

  let trail = [], box = null, anchor = null;
  const clear = () => {
    box?.remove(); box = null;
    tex.querySelectorAll('.on').forEach((n) => n.classList.remove('on'));
    tex.querySelectorAll('.lane.hot').forEach((n) => n.classList.remove('hot'));
  };
  const scrollTo = (dy) => { if (Math.abs(dy) > 2) scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' }); };
  // the lift on screen: on a phone its top comes to lift-top; on a desk only if it is off screen or low
  const bring = (b) => {
    const r = b.getBoundingClientRect(), top = num('lift-top', 64), fl = floor();
    if (phone() ? Math.abs(r.top - top) > 40 : r.top < 8 || r.top > fl - 200) scrollTo(r.top - top);
  };

  const render = (how) => {
    clear();
    root.dataset.trail = trail.join(' ');
    if (!trail.length) { anchor = null; return; }
    const id = trail.at(-1), node = nodeOf(id);
    if (how !== 'inside' || !anchor) anchor = node;
    const at = anchor.classList.contains('f') ? anchor : anchor.closest('.lift') || anchor;
    const tb = tex.getBoundingClientRect(), ab = at.getBoundingClientRect();
    box = el('span', 'fl' + ((ab.left + ab.right) / 2 - tb.left > tb.width / 2 ? ' r' : ''));
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', U[id].t);
    for (const t of trail.slice(0, -1)) box.append(btn('tl', short(U[t].t, 56), t, 'inside'));
    fill(box, id);
    box.append(gather(id));
    at.before(box);
    node.classList.add('on');
    tex.querySelectorAll(`.lane[data-g="${CSS.escape(id)}"]`).forEach((n) => n.classList.add('hot'));
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
    if (e.target.closest('.fl')) { const b = e.target.closest('[data-to]'); if (b) { e.preventDefault(); step(b.dataset.to, b.dataset.how); } return; }
    const a = e.target.closest('a.u'); if (!a || !tex.contains(a)) return;
    const u = a.closest('[data-id]'); if (!u || !U[u.dataset.id]) return;
    const id = u.dataset.id;
    // a making, or a thing inside one, is already lifted: it opens its page, as in 23 and 25, unless it is on the trail
    if (!u.classList.contains('f') && !trail.includes(id)) return;
    e.preventDefault();
    if (trail.at(-1) === id) return drop();
    step(id);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return drop();
    const b = (e.key === 'Enter' || e.key === ' ') && e.target.closest?.('span[data-to]');
    if (b && root.contains(b)) { e.preventDefault(); step(b.dataset.to, b.dataset.how); }
  });

  // d: the spine marks the year in view
  const spine = root.querySelector('.spine');
  if (spine) {
    const marks = [...spine.querySelectorAll('a.sy')].map((a) => [a, document.getElementById(a.getAttribute('href').slice(1))]);
    let raf = 0;
    const mark = () => {
      raf = 0;
      const line = innerHeight * 0.3;
      let cur = marks[0];
      for (const m of marks) if (m[1].getBoundingClientRect().top <= line) cur = m;
      for (const [a] of marks) a.classList.toggle('on', a === cur[0]);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(mark); }, { passive: true });
    addEventListener('resize', mark); mark();
  }
})();
