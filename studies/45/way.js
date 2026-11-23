/* studies/45/way.js — ways into the stone, laid over the live home without changing it.
   The stone is /v3/stone.js itself, loaded here as / loads it; this file only reads what the stone already tells its
   checks (window.HOME: each facet's plan, where a finger can land on it, the last thing a tap gave, the poem's words)
   and lays its own elements above the canvas. ?v= any of:
     a  it says what it is, on the photograph whole, then the photograph is cut into the stone
     b  it shows what it holds: asked (the word by the nav), every facet says what is behind it
     c  it opens one for you: once, a facet opens by itself, then an idea, and both close
     d  a voice walks with you: one line by the name says what just happened and how much is left
   The sentences written for this study are in SAID, in one place; they have not been through his voice editors.
   Everything else is read where it lives: his first line from /about.html, the greeting's form from /v1/, the six
   ideas from IDEAS in /v2/home.js, poem titles from /v2/data.json. */
(async () => {
  const V = document.documentElement.dataset.v || ''
  if (!V) return
  const has = c => V.includes(c)
  document.querySelectorAll('.ways a').forEach(a => { if (a.dataset.w === V) a.setAttribute('aria-current', 'page') })
  const T = await window.S37T
  const num = (k, f) => { const x = parseFloat(T[k]); return Number.isFinite(x) ? x : f }
  const HOLD = num('way-hold-ms', 2600), CUT = num('way-cut-ms', 1500), KEY = num('way-key-ms', 7000), SHOW = num('way-show-ms', 4200), REST = num('way-rest-ms', 6500)

  const small = () => innerWidth < 640
  const SAID = {
    daily: 'A different photograph and a different poem every day, chosen for where I am and what the sky is doing.', // the home's own description, in the first person
    cut: 'Here they are, cut into a stone. Every piece of it opens.',
    key: 'what’s here',
    rest: () => small() ? 'Cut into a stone. Every piece of it opens.' : 'Today’s photograph and poem, cut into a stone. Every piece of it opens.',
    line: (title, n, N) => 'A line from ' + title + '. ' + n + ' of ' + N + ' opened.',
    photo: (place, n, N) => (small() ? 'Another photograph, ' + place + '. ' : 'Another photograph, ' + place + ', seen through this one. ') + n + ' of ' + N + ' opened.',
    other: (n, N) => n + ' of ' + N + ' opened.',
    idea: name => name + (small() ? ': one of six ideas behind this page.' : ': one of the six ideas that run behind this page.'),
    chain: 'How today’s two were chosen, every step.',
    crossed: (title, k) => 'You followed a line into ' + title + '.' + (small() ? '' : ' ' + (k === 1 ? 'One poem in' : k + ' poems in') + '; my name goes home.'),
    words: { line: 'poem', photo: 'photograph', film: 'film', idea: 'tool', year: 'the years', title: 'the whole poem' },
    count: (N, parts) => N + ' pieces: ' + parts.join(', '),
  }

  const el = (tag, id, html) => { const e = document.createElement(tag); if (id) e.id = id; if (html != null) e.innerHTML = html; return e }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const until = async (f, ms = 30000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { let v = null; try { v = f() } catch {} if (v) return v; await sleep(80) } return null }
  const text = u => fetch(u).then(r => r.ok ? r.text() : '').catch(() => '')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  /* a hand on the page ends anything this layer is doing by itself */
  let touched = false
  for (const ev of ['pointerdown', 'keydown', 'wheel']) addEventListener(ev, e => { if (e.isTrusted) touched = true }, { capture: true, passive: true })

  /* d's line is in the name's block before the stone measures it, so the stone lays the poem out around it */
  const mat = document.getElementById('mat')
  let say = null
  if (has('d')) { say = el('p', 'way-say', '<span></span>'); say.setAttribute('aria-live', 'polite'); mat.prepend(say) }
  if (has('b')) { const k = el('button', 'way-key', SAID.key); k.type = 'button'; k.setAttribute('aria-pressed', 'false'); mat.querySelector('nav').append(k) }

  /* a · the first words are up before anything else has loaded */
  let inEl = null
  const hour = new Date().getHours(), hello = (hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.') + ' I’m Kahran.'
  if (has('a')) {
    inEl = el('div', 'way-in', '<div class="ph"></div><div class="words"><p>' + hello + '</p><p class="sub lede"></p><p class="sub">' + SAID.daily + '</p></div>')
    document.body.append(inEl); document.body.append(el('div', 'way-cut', '<span>' + SAID.cut + '</span>'))
    requestAnimationFrame(() => inEl.querySelector('p').classList.add('on'))
    text('/about.html').then(t => { const m = /<p class="lede">([^<]+)<\/p>/.exec(t); if (m) { const p = inEl.querySelector('.lede'); p.textContent = new DOMParser().parseFromString(m[1], 'text/html').body.textContent; p.classList.add('on') } })
    setTimeout(() => inEl.querySelectorAll('p')[2].classList.add('on'), 900)
  }

  /* the stone, as the home loads it */
  const js = (src, mod) => new Promise(r => { const s = document.createElement('script'); if (mod) s.type = 'module'; else s.async = false; s.src = src; s.onload = s.onerror = r; document.body.append(s) })
  for (const s of ['/v3/today.js', '/v3/cut.js', '/v3/cross.js', '/v3/segs.js', '/v3/moment.js', '/track.js']) await js(s)
  js('/v3/stone.js', true)
  const [homeJs, dataDoc] = await Promise.all([text('/v2/home.js'), fetch('/v2/data.json').then(r => r.json()).catch(() => null)])
  const names = [...homeJs.matchAll(/^\s{6}name:\s+'([^']+)'/gm)].map(m => m[1]) // IDEAS' names, in the table's order
  const titleOf = slug => { const p = dataDoc && dataDoc.poems.find(x => x.slug === slug); return p ? p.title : slug }
  const photoOf = src => dataDoc && dataDoc.photos.find(x => x.src === src)

  const H = await until(() => window.HOME && window.HOME.world0 && window.HOME)
  if (!H) { if (inEl) inEl.classList.add('cut'); return }
  const t0 = performance.now()
  H.segReady()

  /* ---------- a · the photograph whole, then the cut ---------- */
  async function threshold() {
    const p = photoOf(H.world0.photo), ph = inEl.querySelector('.ph')
    ph.style.backgroundImage = 'url("' + H.world0.photo + '")'; if (p && /Monochrome/.test(p.caption || '')) ph.classList.add('mono')
    const im = new Image(); im.src = H.world0.photo; await Promise.race([im.decode().catch(() => {}), sleep(2500)])
    ph.classList.add('on')
    const tEnd = performance.now() + HOLD + 900; while (performance.now() < tEnd && !touched) await sleep(60)
    const cut = document.getElementById('way-cut')
    inEl.querySelectorAll('p').forEach(q => { q.style.transitionDuration = '.25s'; q.classList.remove('on') }); await sleep(260)
    inEl.classList.add('cut'); cut.classList.add('on')            // the whole photograph gives way to the stone it was cut into
    await sleep(touched ? 300 : CUT + 2200); cut.classList.remove('on')
    setTimeout(() => { inEl.remove(); cut.remove() }, 1200)
  }

  /* ---------- b · the key ---------- */
  const poemBox = () => { const ws = H.words.filter(w => w.shown); if (!ws.length) return null
    return ws.reduce((a, c) => [Math.min(a[0], c.box[0]), Math.min(a[1], c.box[1]), Math.max(a[2], c.box[0] + c.box[2]), Math.max(a[3], c.box[1] + c.box[3])], [1e9, 1e9, 0, 0]) }
  const inBox = ([x, y], b, pad = 0) => b && x > b[0] - pad && x < b[2] + pad && y > b[1] - pad && y < b[3] + pad
  let keyEl = null, countEl = null, keyTimer = 0
  function labels() {
    keyEl.textContent = ''
    const box = poemBox(), plans = H.plans, mr = mat.getBoundingClientRect(), placed = [[mr.left - 8, mr.top - 8, mr.right + 8, mr.bottom + 8]], tally = {}
    const hit = r => placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])
    plans.forEach((p, i) => { if (!p) return; const pt = H.tapPoint(i); if (!pt) return
      tally[p.kind] = (tally[p.kind] || 0) + 1
      const word = SAID.words[p.kind] || p.kind, more = p.kind === 'idea' ? names[p.k] : p.kind === 'line' || p.kind === 'photo' || p.kind === 'film' ? (p.steps && p.steps[0] && p.steps[0].small || '').replace(/, \d{4}$/, '') : ''
      const w = Math.max(word.length * 8.6, small() ? 0 : Math.min(176, more.length * 7.2)) + 18, h = more && !small() ? 44 : 26
      const x = Math.max(w / 2 + 6, Math.min(innerWidth - w / 2 - 6, pt[0])), r = [x - w / 2, pt[1] - h / 2, x + w / 2, pt[1] + h / 2]
      if (inBox(pt, box, 8) || inBox(pt, placed[0])) return // under the poem or the name: counted above, not marked
      if (hit(r) || r[1] < 40) { const d = el('span'); d.className = 'dot'; d.style.cssText = 'left:' + pt[0] + 'px;top:' + pt[1] + 'px'; keyEl.append(d); return }
      placed.push(r)
      const lb = el('span', null, '<b>' + esc(word) + '</b>' + (more ? '<i>' + esc(more) + '</i>' : '')); lb.className = 'lb'; lb.style.cssText = 'left:' + x + 'px;top:' + pt[1] + 'px'; keyEl.append(lb) })
    const ws = H.words
    const norm = t => t.replace(/\s+/g, ' ').trim(), lines = new Map()
    for (const w of ws) if (!w.title) { if (!lines.has(w.li)) lines.set(w.li, []); lines.get(w.li).push(w) }
    H.world0.doors.forEach(d => { const hitLine = [...lines.values()].find(L => norm(L.map(w => w.t).join(' ')) === norm(d.line)); if (!hitLine || hitLine.some(w => !w.shown)) return
      const rows = new Map(); for (const w of hitLine) { const k = Math.round(w.base); if (!rows.has(k)) rows.set(k, []); rows.get(k).push(w) } // a line that wraps is underlined on each of its rows
      const keys = [...rows.keys()].sort((x, y) => x - y)
      keys.forEach((k, j) => { const R = rows.get(k), x0 = Math.min(...R.map(w => w.box[0])), x1 = Math.max(...R.map(w => w.box[0] + w.box[2])), last = j === keys.length - 1
        const dr = el('span', null, last ? '<span>→ ' + esc(titleOf(d.to.split('~')[0])) + '</span>' : ''); dr.className = 'dr'; dr.style.cssText = 'left:' + x0 + 'px;top:' + (k + 3) + 'px;width:' + (x1 - x0) + 'px'
        if (last && x1 + 190 > innerWidth) dr.classList.add('under'); keyEl.append(dr) }) })
    const N = plans.filter(Boolean).length, parts = [['line', 'poems'], ['photo', 'photographs'], ['film', 'films'], ['idea', 'tools']].filter(([k]) => tally[k]).map(([k, w]) => tally[k] + ' ' + w)
    if (tally.year) parts.push('the years'); if (H.world0.doors.length) parts.push(H.world0.doors.length + ' lines that lead on')
    countEl.textContent = SAID.count(N, parts)
  }
  function keyShow(on, ms) { clearTimeout(keyTimer); const b = document.getElementById('way-key')
    if (on) { labels(); keyTimer = setTimeout(() => keyShow(false), ms || KEY) }
    keyEl.classList.toggle('on', on); countEl.classList.toggle('on', on); if (b) b.setAttribute('aria-pressed', String(on)) }
  if (has('b')) {
    keyEl = el('div', 'way-labels'); countEl = el('div', 'way-count'); document.body.append(keyEl, countEl)
    const b = document.getElementById('way-key')
    for (const ev of ['pointerdown', 'pointerup']) b.addEventListener(ev, e => e.stopPropagation())
    b.addEventListener('click', e => { e.stopPropagation(); keyShow(!keyEl.classList.contains('on')) })
    addEventListener('pointerdown', e => { if (e.isTrusted && keyEl.classList.contains('on') && !e.target.closest('#way-key')) keyShow(false) }, true) // a touch on the stone puts the key away and goes on to the stone
    addEventListener('resize', () => keyShow(false))
  }

  /* ---------- c · it opens one for you ---------- */
  const ring = has('c') ? document.body.appendChild(el('div', 'way-ring')) : null
  async function tapAt([x, y]) {
    ring.style.left = x + 'px'; ring.style.top = y + 'px'; ring.classList.remove('on'); void ring.offsetWidth; ring.classList.add('on')
    await sleep(reduce ? 300 : 520); if (touched) return false
    const at = document.elementFromPoint(x, y); if (!at) return false
    const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }
    at.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 })); at.dispatchEvent(new PointerEvent('pointerup', o)); at.dispatchEvent(new MouseEvent('click', o))
    return true
  }
  const shut = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  async function showOne() {
    await until(() => H.dealt, 8000); if (touched || !H.dealt) return
    const box = poemBox(), mid = [innerWidth * (small() ? .5 : .38), innerHeight * (small() ? .3 : .5)]
    const far = i => { const p = H.tapPoint(i); return p && !inBox(p, box, 24) && p[1] > 60 ? Math.hypot(p[0] - mid[0], p[1] - mid[1]) : Infinity }
    const pick = kind => H.plans.map((p, i) => ({ p, i })).filter(x => x.p && (kind === 'idea' ? x.p.kind === 'idea' : x.p.kind === 'line' && x.p.steps[0].t === 'lines') && far(x.i) < Infinity).sort((a, b) => far(a.i) - far(b.i))[0]
    const one = pick('line')
    if (one && await tapAt(H.tapPoint(one.i))) { const end = performance.now() + SHOW; while (performance.now() < end && !touched) await sleep(80); if (touched) return; if (H.win && H.win.card) shut(); else H.hideWin(); await sleep(900) }
    const two = !touched && pick('idea')
    if (two && await tapAt(H.tapPoint(two.i))) { const end = performance.now() + SHOW + 1200; while (performance.now() < end && !touched) await sleep(80); if (!touched) shut() }
  }

  /* ---------- d · the voice ---------- */
  function speak(s) { const sp = say.firstChild; if (sp.textContent === s) return; sp.classList.add('out'); setTimeout(() => { sp.textContent = s; sp.classList.remove('out') }, sp.textContent ? 350 : 0) }
  function voice() {
    const opened = new Set(); let seq = H.seq, world = H.world0.poem + '~' + H.world0.photo, depth = 0, chainWas = false
    speak(SAID.rest())
    setInterval(() => { const w0 = H.world0; if (!w0) return
      const wk = w0.poem + '~' + w0.photo, N = H.plans.filter(Boolean).length
      if (wk !== world) { world = wk; depth = w0.trail ? w0.trail.length : depth + 1; seq = H.seq; return speak(depth ? SAID.crossed(titleOf(w0.poem), depth) : SAID.rest()) }
      const chain = document.getElementById('where').getAttribute('aria-expanded') === 'true'
      if (chain !== chainWas) { chainWas = chain; if (chain) return speak(SAID.chain) }
      const idea = [...document.querySelectorAll('#keys button')].find(b => b.getAttribute('aria-expanded') === 'true')
      if (H.seq === seq) return; seq = H.seq
      const L = H.last, p = L && H.plan(L.i); if (!p || L.kind === 'move' || L.kind === 'title' || L.kind === 'year') return
      if (p.kind === 'idea') { opened.add(world + '#' + L.i); return speak(SAID.idea(names[p.k] || 'This')) }
      opened.add(world + '#' + L.i); const n = [...opened].filter(k => k.startsWith(world + '#')).length, st = p.steps && p.steps[Math.min(L.depth || 0, p.steps.length - 1)], from = st && st.small ? st.small.replace(/, \d{4}$/, '') : ''
      speak(p.kind === 'line' && from ? SAID.line(from, n, N) : p.kind === 'photo' && from ? SAID.photo(from, n, N) : SAID.other(n, N))
    }, 200)
  }

  /* ---------- the order of things ---------- */
  if (has('d')) voice()
  if (has('a')) await threshold()
  const rested = async () => { const end = t0 + REST; while (performance.now() < end && !touched) await sleep(100); return !touched }
  if (has('c')) { if (await rested()) await showOne() }
  else if (has('b') && !has('a')) { if (await rested()) keyShow(true) } // alone, the key shows itself once after the poem has arrived
})()
