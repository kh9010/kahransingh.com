// Renders facts.json four ways (?v=a…d). Every fact once, verbatim; nothing else is written.
(async () => {
  const v = new URLSearchParams(location.search).get('v');
  if (!/^[abcd]$/.test(v || '')) return;
  const data = await (await fetch('facts.json', { cache: 'no-store' })).json();
  const F = data.facts.map((f, i) => ({ ...f, i }));
  const main = document.querySelector('main'), box = document.getElementById('volume');
  main.classList.add('v-' + v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const fact = (f, showWhen) => {
    const s = el('span', 'f');
    Object.assign(s.dataset, { i: f.i, k: f.kind, y: f.y, g: f.g || 'f' + f.i });
    if (showWhen) { s.append(el('span', 'w', f.when), ' '); }
    const t = el('span', 't');
    if (f.a && f.text.includes(f.a[0])) {
      const [pre, post] = [f.text.slice(0, f.text.indexOf(f.a[0])), f.text.slice(f.text.indexOf(f.a[0]) + f.a[0].length)];
      const a = el('a', null, f.a[0]); a.href = f.a[1];
      t.append(pre, a, post);
    } else t.textContent = f.text;
    s.append(t);
    if (f.sub) s.append(el('span', 's', ', ' + f.sub));
    return s;
  };
  const rowKey = (y) => String(y);
  const ROWS = ['now', ...Array.from({ length: 2025 - 2006 + 1 }, (_, k) => String(2025 - k)), 'later'];
  const yearOf = (r) => (r === 'now' ? 2026 : r === 'later' ? -1 : +r);

  const lede = el('p', 'lede', data.lede.text);
  const list = el('div', 'lit-list');
  box.replaceChildren(lede, list);

  if (v === 'a') {
    list.classList.add('wall');
    let prev = null;
    for (const f of F) { list.append(fact(f, f.when !== prev)); prev = f.when; }
  }

  if (v === 'c') {
    list.classList.add('run');
    const p = el('p'); list.append(p);
    let prev = null;
    F.forEach((f, n) => { if (n) p.append(el('span', 'sep', ' · ')); p.append(fact(f, f.when !== prev)); prev = f.when; });
  }

  if (v === 'b') {
    list.classList.add('years');
    // the long things: one lane each, packed so lanes reuse when spans do not overlap
    const spans = new Map();
    for (const f of F) if (f.to != null && f.g && !spans.has(f.g)) spans.set(f.g, { g: f.g, from: f.y, to: f.to === 'now' ? 2026 : f.to });
    const lanes = [];
    for (const s of [...spans.values()].sort((a, b) => a.from - b.from)) {
      let L = lanes.findIndex((end) => end < s.from);
      if (L < 0) { L = lanes.length; lanes.push(0); }
      lanes[L] = s.to; s.lane = L;
    }
    for (const r of ROWS) {
      const here = F.filter((f) => rowKey(f.y) === r);
      const row = el('div', 'row' + (here.length ? '' : ' empty'));
      row.append(el('span', 'yr', r === 'later' ? '' : r));
      const ln = el('span', 'lanes');
      for (let L = 0; L < lanes.length; L++) {
        const lane = el('span', 'lane');
        const s = [...spans.values()].find((s) => s.lane === L && s.from <= yearOf(r) && yearOf(r) <= s.to);
        if (s) { lane.classList.add('on'); lane.dataset.g = s.g; if (s.from === yearOf(r)) lane.classList.add('start'); }
        ln.append(lane);
      }
      row.append(ln);
      const txt = el('span', 'txt');
      let prev = r;
      here.forEach((f, n) => { if (n) txt.append(el('span', 'sep', ' · ')); txt.append(fact(f, f.when !== prev && f.when !== r)); prev = f.when; });
      row.append(txt);
      list.append(row);
    }
  }

  if (v === 'd') {
    list.classList.add('kinds');
    const kinds = Object.keys(data.kinds);
    list.append(el('span', 'hd', ''), ...kinds.map((k) => el('span', 'hd', data.kinds[k])));
    for (const r of ROWS) {
      const here = F.filter((f) => rowKey(f.y) === r);
      if (!here.length) continue;
      const yr = el('span', 'yr', r === 'later' ? '' : r); yr.dataset.row = r; list.append(yr);
      for (const k of kinds) {
        const cell = el('div', 'cell'); cell.dataset.row = r;
        const mine = here.filter((f) => f.kind === k);
        if (mine.length) cell.dataset.kl = data.kinds[k];
        let prev = r;
        for (const f of mine) { cell.append(fact(f, f.when !== prev && f.when !== r)); prev = f.when; }
        list.append(cell);
      }
    }
  }

  // the one alive thing: point at a fact and its kin stay, the rest recede. Same year (a), same thing (b), same kind (c), same row (d).
  const kin = { a: 'y', b: 'g', c: 'k', d: 'y' }[v];
  let held = null;
  const light = (f) => {
    list.classList.toggle('is-lit', !!f);
    for (const x of list.querySelectorAll('.f')) x.classList.toggle('lit', !!f && x.dataset[kin] === f.dataset[kin]);
    if (v === 'b') for (const x of list.querySelectorAll('.lane')) x.classList.toggle('hot', !!f && x.dataset.g === f.dataset.g);
    if (v === 'd') for (const x of list.querySelectorAll('[data-row]')) x.classList.toggle('row-lit', !!f && x.dataset.row === String(f.dataset.y));
  };
  list.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') light(e.target.closest('.f')); });
  list.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') light(held); });
  list.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const f = e.target.closest('.f');
    held = f && held !== f ? f : null; light(held);
  });
  document.documentElement.dataset.rendered = v;
})();
