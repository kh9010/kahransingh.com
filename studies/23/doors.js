// Study 23: what a door in the block does, per ?v. a: links show near the pointer · b: a card · c: the fact is lifted out · d: shared names light, a trail.
(() => {
  const U = JSON.parse(document.getElementById('units').textContent);
  const v = document.documentElement.dataset.v;
  const root = document.querySelector(`.v-${v}`);
  if (!root) return;
  const num = (k, d) => { const x = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--' + k)); return Number.isFinite(x) ? x : d; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const unitOf = (t) => t.closest('[data-id]');
  const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

  // a: the doors near the pointer take ink and an underline; the farther, the fainter
  if (v === 'a') {
    const links = [...root.querySelectorAll('a.u')];
    let px = -1e4, py = -1e4, raf = 0;
    const paint = () => {
      raf = 0;
      const r = num('near-r', 110), ease = num('near-ease', 1.6);
      for (const a of links) {
        const b = a.getBoundingClientRect();
        if (b.bottom < -r || b.top > innerHeight + r) { if (a.style.getPropertyValue('--n')) a.style.removeProperty('--n'); continue; }
        const dx = Math.max(b.left - px, 0, px - b.right), dy = Math.max(b.top - py, 0, py - b.bottom);
        const n = Math.max(0, 1 - Math.hypot(dx, dy) / r) ** ease;
        if (n > 0.01) a.style.setProperty('--n', n.toFixed(3)); else if (a.style.getPropertyValue('--n')) a.style.removeProperty('--n');
      }
    };
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; raf ||= requestAnimationFrame(paint); }, { passive: true });
    addEventListener('scroll', () => { raf ||= requestAnimationFrame(paint); }, { passive: true });
    document.addEventListener('pointerleave', () => { px = py = -1e4; raf ||= requestAnimationFrame(paint); });
    return;
  }

  // the inside of a card or a lifted fact: what it is, a picture or a line, the way out
  const fill = (box, id) => {
    const u = U[id];
    box.append(el('span', 'ck', [u.k, u.y].filter(Boolean).join(' · ')));
    box.append(el('span', 'ct', u.t));
    if (u.i) { const im = el('img'); im.src = u.i; im.alt = u.a || ''; im.loading = 'lazy'; box.append(im); }
    if (u.l) box.append(el('span', 'cl', u.l.join(' / ')));
    if (u.h) { const a = el('a', 'co', u.to + ' →'); a.href = u.h; if (/^https?:/.test(u.h)) a.rel = 'noopener'; box.append(a); }
  };

  // b and d: a card
  let card = null, cur = null;
  const shut = () => { card?.remove(); card = null; cur?.classList.remove('on'); cur = null; root.querySelector('.tex').classList.remove('lit'); root.querySelectorAll('.rel').forEach((x) => x.classList.remove('rel')); };
  const near = (box, u) => {
    const host = root.querySelector('.tex'), hb = host.getBoundingClientRect(), b = u.getBoundingClientRect();
    host.append(box);
    const w = box.offsetWidth, left = Math.min(Math.max(b.left - hb.left, 0), hb.width - w);
    box.style.left = Math.max(left, Math.min(0, hb.width - w)) + 'px';
    box.style.top = (b.bottom - hb.top + 6) + 'px';
  };
  const trail = [];
  const open = (u, how) => {
    const id = u.dataset.id; if (!U[id]) return;
    shut();
    cur = u; u.classList.add('on');
    card = el('span', 'card'); card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', U[id].t);
    if (v === 'd') {
      if (how !== 'trail') { const at = trail.indexOf(id); if (at >= 0) trail.splice(at + 1); else trail.push(id); if (trail.length > 6) trail.shift(); }
      if (trail.length > 1) {
        const tr = el('span', 'tr');
        for (const t of trail) { const bt = el('button', '', U[t].t.length > 28 ? U[t].t.slice(0, 26) + '…' : U[t].t); bt.type = 'button'; bt.onclick = (e) => { e.stopPropagation(); go(t, 'trail'); }; tr.append(bt); }
        card.append(tr);
      }
    }
    fill(card, id);
    if (v === 'd') {
      const s = U[id].s.filter((x) => root.querySelector(`[data-id="${CSS.escape(x)}"]`));
      if (s.length) {
        const cs = el('span', 'cs');
        for (const x of s.slice(0, 12)) { const bt = el('button', '', U[x].t.length > 40 ? U[x].t.slice(0, 38) + '…' : U[x].t); bt.type = 'button'; bt.onclick = (e) => { e.stopPropagation(); go(x); }; cs.append(bt); }
        card.append(cs);
        root.querySelector('.tex').classList.add('lit');
        for (const x of s) root.querySelectorAll(`[data-id="${CSS.escape(x)}"]`).forEach((n) => n.classList.add('rel'));
      }
      root.append(card);
      const nb = document.querySelector('nav')?.getBoundingClientRect();
      if (nb && nb.bottom >= innerHeight - 1 && nb.top > innerHeight / 2) card.style.bottom = (innerHeight - nb.top + 8) + 'px';
    } else {
      near(card, u);
      const nb = document.querySelector('nav')?.getBoundingClientRect(), floor = nb && nb.top > innerHeight / 2 ? nb.top : innerHeight;
      const over = card.getBoundingClientRect().bottom - floor + 8;
      if (over > 0) scrollBy({ top: over, behavior: 'smooth' });
    }
  };
  const go = (id, how) => {
    const n = root.querySelector(`.tex [data-id="${CSS.escape(id)}"]`); if (!n) return;
    n.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    open(n, how);
  };

  // c: the fact is lifted out of the block, to the side its line is on
  let up = null;
  const drop = () => { up?.box.remove(); up?.u.classList.remove('gone'); up = null; };
  const lift = (u) => {
    if (up?.u === u) return drop();
    drop();
    const tex = root.querySelector('.tex'), tb = tex.getBoundingClientRect(), b = u.getBoundingClientRect();
    const box = el('span', 'fl' + ((b.left + b.right) / 2 - tb.left > tb.width / 2 ? ' r' : ''));
    fill(box, u.dataset.id);
    u.before(box); u.classList.add('gone');
    up = { u, box };
  };

  root.addEventListener('click', (e) => {
    if (!plainClick(e)) return;
    if (e.target.closest('.card, .fl')) return;
    const a = e.target.closest('a.u'); if (!a || !root.querySelector('.tex').contains(a)) { if (v !== 'c') shut(); return; }
    const u = unitOf(a); if (!u || !U[u.dataset.id]) return;
    e.preventDefault();
    if (v === 'c') { if (!u.classList.contains('f')) { location.href = a.href; return; } return lift(u); }
    if (cur === u) return shut();
    open(u);
  });
  document.addEventListener('click', (e) => { if (!root.contains(e.target)) { shut(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { shut(); drop(); } });
})();
