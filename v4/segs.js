/* Study 37: what a facet gives is his work. One file for build.mjs, the page and check.mjs (node), so nothing is read or dealt twice.
   A segment is a piece of something he made that is on the site, word for word: a poem's line, a photograph (or the region of one),
   one of a poem film's two worlds, a sentence of the About, a sentence of an idea on the home's wall. segments.json holds them (build.mjs).
   A facet takes the segment it is most truly linked to, and the link is recorded: the door line that crosses it, a word its region names,
   a word of the poem line beside it, the place or year of the photograph, the poem the photograph was paired with, the idea both were read for,
   or the region of another photograph that answers its own. Nothing here writes a sentence; the basis line is built from a closed set of tokens.

   S37.regionOf(facet)                        -> 'door' | 'eye' | 'sky' | 'dark' | 'light' | 'ground' | 'edge' | 'mid'
   S37.deal(world, facets, D, y)              -> per facet { seg, link, basis, to, steps }     (y: lines | mixed | shape | whole)
     world  { photo, poem, trail, doors: [{ phrase, word, line }] }
     facets [{ i, uv, tone, side, sal, edges, at, door (index into doors) | null, line (index of the poem line beside it), area }]
     D      { SEG (segments.json), data, VOC (21's his), KIN (28's kin photos), stanzasOf }                                        */
(function (root) {
  /* ---------- the site's own text, read plainly ---------- */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', rarr: '→', larr: '←', hellip: '…', eacute: 'é' }
  const squash = s => String(s).replace(/\s+/g, ' ').trim()
  const decode = s => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/gi, (m, e) => ENT[e] ?? m)
  function plain(text, file = '') { // a page as a reader meets it: tags gone, entities read, whitespace one space; a .js or .json file is read as written
    if (/\.(js|json|mjs)$/.test(file)) return squash(text)
    return squash(decode(String(text).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))) }
  const sentences = p => (squash(p).match(/[^.!?]+(?:[.!?]+[’”)]?|$)/g) || []).map(s => s.trim()).filter(Boolean)
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const STOP = new Set(('a an the and or but if then than so as at by for from in into of off on onto out over to up with without within upon about above after again against all am are '
    + 'be been being before below between both can could did do does doing down during each few further had has have having he her here hers herself him himself his how i im '
    + 'is it its itself just me more most my myself no nor not now once only other our ours ourselves own same she should some such that their theirs them themselves '
    + 'there these they this those through too under until very was we were what when where which while who whom why will would you your yours yourself yourselves '
    + 'shall may might must let lets get got go goes gone come came one two oh yes like say said says also ever even still yet thing things way much many every '
    + 'thats theres youre youve ill ive id dont didnt cant wont isnt wasnt arent hes shes theyre weve whats lets us').split(/\s+/))
  function words(text, all = false) { // the words of a piece, lower case, apostrophes kept inside; with all, every word, else only those that can carry a link
    const out = []; for (const m of String(text).toLowerCase().matchAll(/[a-zà-ÿ]+(?:[’'][a-z]+)*/g)) { const w = m[0].replace(/[’']s$/, ''), k = w.replace(/[’']/g, '')
      if (all) { out.push(w); continue } if (k.length < 3 || STOP.has(k)) continue; out.push(w) }
    return all ? out : [...new Set(out)] }
  const COMMON = .15 // a word in more than this share of the poems links nothing
  const RARE = 8 // a word that links a facet's poem line to another piece is in at most this many poems
  const WEAK = new Set(('because around enough thought though keep kept fast always never something nothing anything everything someone anyone really maybe little big long '
    + 'time times days back away another sure know knew known think feel felt want wanted need needed make makes take took give gave tell told seem seemed getting going went '
    + 'put become becomes people ways less first last next new good bad right left whole part lot lots kind sort mean means done does doing doesn many much more most onto '
    + 'into upon till until while ago yeah okay ok gonna wanna').split(/\s+/))

  /* ---------- where a facet sits on the photograph: its region (33's regions, read at the facet's centre) ---------- */
  const REGIONS = ['door', 'eye', 'sky', 'dark', 'light', 'ground', 'edge', 'mid']
  const LABEL = { door: 'a door line', eye: 'where the eye goes', sky: 'high and bright', dark: 'the dark', light: 'the light', ground: 'below the horizon', edge: 'its edges', mid: 'even tone' }
  // the words a region names: the facet gives a piece that says what it lies on
  const NAMES = {
    eye: ['see', 'seen', 'saw', 'seeing', 'eyes', 'eye', 'look', 'looked', 'looking', 'watch', 'watched', 'watching', 'gaze', 'face', 'mirror'],
    sky: ['sky', 'skies', 'cloud', 'clouds', 'heaven', 'heavens', 'moon', 'stars', 'star', 'birds', 'bird', 'wind', 'air', 'blue', 'fly', 'flying', 'rain'],
    dark: ['night', 'nights', 'dark', 'darkness', 'shadow', 'shadows', 'black', 'midnight', 'evening', 'dusk', 'shade'],
    light: ['light', 'lights', 'sun', 'sunlight', 'sunset', 'sunrise', 'bright', 'shine', 'shining', 'glow', 'morning', 'dawn', 'gold', 'golden', 'luminous', 'white', 'fire'],
    ground: ['earth', 'ground', 'sea', 'ocean', 'water', 'river', 'lake', 'shore', 'sand', 'stone', 'stones', 'rock', 'field', 'grass', 'land', 'waves', 'beach', 'feet'],
    edge: ['tree', 'trees', 'wall', 'walls', 'house', 'door', 'doors', 'window', 'windows', 'city', 'street', 'streets', 'road', 'branches', 'room', 'building'],
    mid: [], door: [] }
  function regionOf(f) {
    if (f.door != null) return 'door'
    if (f.sal >= .6) return 'eye'
    if (f.side === 'above' || (f.tone === 'light' && f.uv[1] < .4)) return 'sky'
    if (f.tone === 'dark') return 'dark'
    if (f.tone === 'light') return 'light'
    if (f.side === 'below') return 'ground'
    if (f.edges >= .5) return 'edge'
    return 'mid' }
  // a facet as 33's cut describes it (cut.js facets(): its centre on the photograph, the tone mass, salience and edges there), with the horizon's side when the photograph has one
  const HORIZON = .25 // 33's cut-line-min: a horizon weaker than this is not the photograph's
  function describe(fc, R, extra = {}) {
    const g = fc.region || { uv: [.5, .5], tone: null, salience: 0, edges: 0, page: ['centre', 'middle'] }, [u, v] = g.uv, h = R && R.horizon && R.horizon.score >= HORIZON ? R.horizon : null
    let side = null; if (h) { const yAt = h.p0[1] + (h.p1[1] - h.p0[1]) * ((u - h.p0[0]) / ((h.p1[0] - h.p0[0]) || 1e-6)); side = v < yAt ? 'above' : 'below' }
    return { i: fc.i, uv: [Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))], tone: g.tone, side, sal: +(g.salience || 0).toFixed(3), edges: +(g.edges || 0).toFixed(3), at: g.page ? g.page.join(' ') : 'centre', door: null, line: null, ...extra } }
  // a facet's piece of the photograph as 28 measured it (6 x 4 regions), and the region of another photograph nearest it
  const COLS = 6, ROWS = 4
  const cellAt = uv => Math.min(ROWS - 1, Math.max(0, Math.floor(uv[1] * ROWS))) * COLS + Math.min(COLS - 1, Math.max(0, Math.floor(uv[0] * COLS)))
  const posOf = j => { const r = Math.floor(j / COLS), c = j % COLS, v = r === 0 ? 'top' : r === ROWS - 1 ? 'foot' : 'middle', h = c < 2 ? 'left' : c < 4 ? 'centre' : 'right'; return v === 'middle' && h === 'centre' ? 'centre' : v + ' ' + h }
  function kinD(f, c, mf, mc) { const [L, a, b, con, ho, ve, de] = c, [L0, a0, b0, con0, ho0, ve0, de0] = f
    const tone = Math.hypot((L0 - L) / 12, (con0 - con) / 8), col = mf && mc ? 0 : mf || mc ? .8 : Math.hypot(a0 - a, b0 - b) / 10
    return tone + col + 2 * (Math.abs(ho0 - ho) + Math.abs(ve0 - ve)) + Math.abs(de0 - de) / Math.max(1, (de0 + de) / 2) }
  function kinOf(KIN, mine, cell, src) { const A = KIN[mine], B = KIN[src]; if (!A || !B) return null
    let best = Infinity, bj = 0; B.cells.forEach((c, j) => { const d = kinD(A.cells[cell], c, A.mono, B.mono); if (d < best) { best = d; bj = j } })
    return { mine: cell, theirs: bj, d: Math.round(best * 100) / 100 } }

  /* ---------- the links a segment can have to a facet of this world ---------- */
  const textOf = s => s.lines ? s.lines.join(' ') : s.text
  const has = (seg, w) => (seg._ws || (seg._ws = new Set(words(textOf(seg))))).has(w)
  function context(world, D) { // what this world holds that a segment can be linked to, worked out once
    if (D._ctx && D._ctx.key === world.photo + '~' + world.poem) return D._ctx
    const SEG = D.SEG, ph = SEG.segs.find(s => s.id === 'photo:' + world.photo) || {}, lines = D.stanzasOf(D.data.poems.find(p => p.slug === world.poem)).flat()
    const common = new Set(SEG.common), lw = lines.map(l => words(l).filter(w => !common.has(w.replace(/[’']/g, '')) && !common.has(w)))
    const placeWords = ph.place ? ph.place.split(/,\s*/).map(s => s.trim()).filter(s => s.length > 2) : []
    const own = SEG.segs.filter(s => s.kind === 'line' && s.poem === world.poem), pc = new Set(own.flatMap(s => s.concepts)), pcl = {} // the ideas 21 read in this poem, and the lines it read them in
    const st = D.stanzasOf(D.data.poems.find(p => p.slug === world.poem)); for (const s of own) { const gi = st.slice(0, s.stanza).reduce((n, x) => n + x.length, 0) + s.at + 1; for (const c of s.concepts) { const n = gi + ((s.readAt || {})[c] || 0); (pcl[c] = pcl[c] || []).includes(n) || pcl[c].push(n) } }
    return D._ctx = { key: world.photo + '~' + world.poem, ph, lines, lw, common, placeWords, pc, pcl, lwAll: lines.map(l => words(l)), film: SEG.segs.filter(s => s.kind === 'film' && s.poem === world.poem).map(s => s.id) } }
  function links(seg, f, cls, world, D, X) {
    const out = [], ph = X.ph
    if (cls === 'door' && seg.kind === 'line' && seg.poem !== world.poem) { // the door's idea, read by hand in this other poem too
      const d = world.doors[f.door], W = D.VOC.words.find(x => x.word === d.word), held = W && W.poems.includes(seg.poem) && (D.VOC.poems[seg.poem] || []).find(x => x.word === d.word && seg.lines.some(l => l.includes(x.phrase)))
      if (held) out.push({ k: 'door', phrase: d.phrase, word: d.word, held: held.phrase, s: 7 }) }
    if (seg.kind !== 'photo') for (const w of NAMES[cls] || []) if (has(seg, w)) { out.push({ k: 'region', cls, word: w, s: 5 }); break }
    if (seg.kind === 'photo' && seg.img !== world.photo) { const kn = kinOf(D.KIN, world.photo, cellAt(f.uv), seg.img); if (kn) out.push({ k: 'kin', ...kn, s: 4.2 - kn.d }) }
    if (f.line != null && X.lw[f.line] && seg.kind !== 'photo') { const w = X.lw[f.line].filter(w => has(seg, w) && !WEAK.has(w) && (D.SEG.df[w] || 0) <= RARE).sort((a, b) => (D.SEG.df[a] || 0) - (D.SEG.df[b] || 0))[0]
      if (w) out.push({ k: 'word', word: w, line: f.line + 1, s: 3 + 2 / Math.max(1, D.SEG.df[w] || 1) }) }
    if (seg.kind === 'photo' && ph.place && seg.place === ph.place && seg.img !== world.photo) out.push({ k: 'place', place: seg.place, s: 4 })
    if ((seg.kind === 'about') && X.placeWords.some(p => seg.text.includes(p))) out.push({ k: 'place', place: X.placeWords.find(p => seg.text.includes(p)), s: 5 })
    if ((seg.kind === 'about' || seg.kind === 'film') && seg.year && ph.year === seg.year) out.push({ k: 'year', year: seg.year, s: seg.kind === 'about' ? 4.5 : 3 })
    if (seg.kind === 'line' && ph.paired && ph.paired.poem === seg.poem && seg.poem !== world.poem) out.push({ k: 'paired', why: ph.paired.why, mine: true, s: 4.5 })
    if (seg.kind === 'photo' && seg.paired && seg.paired.poem === world.poem && seg.img !== world.photo) out.push({ k: 'paired', why: seg.paired.why, s: 4.5 })
    if (seg.kind === 'film' && X.film.includes(seg.id)) out.push({ k: 'film', s: 6 })
    if (seg.concepts && seg.concepts.length) { const c = seg.concepts.find(c => (ph.concepts || []).includes(c)) || (seg.kind === 'line' ? seg.concepts.find(c => X.pc.has(c)) : null)
      if (c) out.push({ k: 'idea', concept: c, as: (ph.concepts || []).includes(c) ? 'photograph' : 'poem', s: (ph.concepts || []).includes(c) ? 2.4 : 2 }) }
    return out }

  /* ---------- the basis line: the facet's region, then the link, in tokens from a closed set (check.mjs holds the grammar) ---------- */
  function basisLine(cls, L) {
    const t = [LABEL[cls]]
    if (L.k === 'door') t.push(`door ‘${L.phrase}’`, `‘${L.word}’ in both`)
    if (L.k === 'region') t.push(`‘${L.word}’`)
    if (L.k === 'kin') t.push(`its ${posOf(L.mine)}`, `their ${posOf(L.theirs)}`, `${L.d.toFixed(2)} apart`)
    if (L.k === 'word') t.push(`‘${L.word}’`, `line ${L.line}`)
    if (L.k === 'place') t.push(`${L.place}, both`)
    if (L.k === 'year') t.push(`${L.year}, both`)
    if (L.k === 'paired') t.push(/^the home, /.test(L.why) ? `on the home together, ${L.why.slice(10)}` : L.mine ? 'its page carries this photograph' : 'this poem’s page carries it')
    if (L.k === 'film') t.push('this poem’s film')
    if (L.k === 'idea') t.push(`read for ${L.concept}`, L.line ? `as line ${L.line} was` : `as this ${L.as} was`)
    if (L.fallback) t.push('of those left')
    return t.join(' · ') }

  /* ---------- dealing: every facet its own segment, the strongest real link first; nothing given twice ---------- */
  const KINDS = { lines: ['line'], mixed: ['line', 'photo', 'film', 'about', 'idea'], shape: ['line', 'photo', 'film', 'about', 'idea'], whole: ['line', 'photo', 'film', 'about', 'idea'] }
  const linkKey = L => L.k === 'kin' || L.k === 'film' || L.k === 'paired' ? null : L.k + ':' + (L.word || L.concept || L.place || L.year || L.phrase || '') + (L.as ? ':' + L.as : '') + (L.line && L.k === 'idea' ? ':' + L.line : '') // a photograph's region, its film, its pairing belong to that segment alone
  const groupOf = s => s.kind === 'line' || s.kind === 'film' ? 'poem:' + s.poem : s.kind === 'idea' ? 'idea:' + s.title : s.kind === 'about' ? 'about:' + s.id.split('.')[0] : s.kind === 'photo' ? 'place:' + s.place : s.id
  // what each way trusts most: the region (shape), the poem's own lines (lines), the life around the photograph (mixed, whole)
  const TRUST = {
    shape: { door: 2, region: 2, kin: 2, word: .5, place: .5, year: .5, paired: .5, film: .5, idea: .5 },
    lines: { door: 1, word: 1.6, paired: 1.1, idea: 1.4, region: .2 },
    mixed: { place: 1.5, year: 1.4, film: 1.2, paired: 1.2, kin: 1.1, door: .8, word: .9, idea: 1, region: .4 },
    whole: { place: 1.5, year: 1.4, film: 1.2, paired: 1.2, kin: 1.1, door: .8, word: .9, idea: 1, region: .4 } }
  const weigh = (L, y) => L.s * ((TRUST[y] || TRUST.shape)[L.k] ?? 1)
  function deal(world, facets, D, y = 'shape') {
    const X = context(world, D), kinds = KINDS[y] || KINDS.shape, seen = new Set([world.poem, ...((world.trail || []).map(k => k.split('~')[0]))]), seenP = new Set([world.photo, ...((world.trail || []).map(k => '/photos/' + k.split('~')[1]))])
    const pool = D.SEG.segs.filter(s => kinds.includes(s.kind) && !(s.poem && seen.has(s.poem) && s.kind === 'line') && !(s.kind === 'photo' && seenP.has(s.img)))
    const cls = facets.map(regionOf), cand = []
    facets.forEach((f, fi) => { for (const s of pool) for (const L of links(s, f, cls[fi], world, D, X)) cand.push([weigh(L, y) + (s.kind === 'line' ? 0 : -.05), fi, s, L]) })
    cand.sort((a, b) => b[0] - a[0] || (a[2].id < b[2].id ? -1 : 1))
    const plan = facets.map(() => null), used = new Set(), groups = new Set(), perKind = {}, cap = Math.ceil(facets.length * (y === 'mixed' || y === 'whole' ? .4 : .55))
    const said = new Set() // a link word, idea, place or year gives one facet its piece, never two: nothing repeats, the basis included
    const bases = new Set() // and no two facets give the same reason
    for (const [, fi, s, L] of cand) { if (plan[fi] || used.has(s.id) || groups.has(groupOf(s)) || (linkKey(L) && said.has(linkKey(L))) || bases.has(basisLine(cls[fi], L))) continue
      if (s.kind !== 'line' && (perKind[s.kind] || 0) >= cap) continue
      plan[fi] = { seg: s, link: L }; used.add(s.id); groups.add(groupOf(s)); said.add(linkKey(L)); bases.add(basisLine(cls[fi], L)); perKind[s.kind] = (perKind[s.kind] || 0) + 1 }
    // a facet nothing reached: the nearest piece left, said so: a line sharing a rare word with any line of the poem, or read for an idea this world holds; else the region of a photograph
    const lax = (s, f) => { const out = []
      if (s.kind === 'line') { X.lw.forEach((ws, li) => { const w = ws.find(w => has(s, w) && !WEAK.has(w) && (D.SEG.df[w] || 0) <= RARE); if (w) out.push({ k: 'word', word: w, line: li + 1, s: 0, fallback: true }) })
        const c = (s.concepts || []).find(c => X.pc.has(c) || (X.ph.concepts || []).includes(c)); if (c) out.push({ k: 'idea', concept: c, as: (X.ph.concepts || []).includes(c) ? 'photograph' : 'poem', s: 0, fallback: true })
        for (const c of (s.concepts || []).filter(c => X.pcl[c])) for (const n of X.pcl[c]) out.push({ k: 'idea', concept: c, as: 'poem', line: n, s: 0, fallback: true }) // the line of this poem 21 read it in
        for (const w of NAMES[regionOf(f)] || []) if (has(s, w)) { out.push({ k: 'region', cls: regionOf(f), word: w, s: 0, fallback: true }); break }
        X.lwAll.forEach((ws, li) => { const w = ws.find(w => has(s, w) && !WEAK.has(w)); if (w) out.push({ k: 'word', word: w, line: li + 1, s: 0, fallback: true }) }) } // the last: any word of any line it shares, the commonest included
      if (s.kind === 'photo' && kinds.includes('photo')) { const kn = kinOf(D.KIN, world.photo, cellAt(f.uv), s.img); if (kn) out.push({ k: 'kin', ...kn, s: 0, fallback: true }) }
      return out }
    for (const strict of [true, false]) facets.forEach((f, fi) => { if (plan[fi]) return
      for (const s of pool) { if (used.has(s.id) || groups.has(groupOf(s))) continue
        const L = lax(s, f).find(L => (!strict || !linkKey(L) || !said.has(linkKey(L))) && !bases.has(basisLine(cls[fi], L))); if (!L) continue
        bases.add(basisLine(cls[fi], L))
        plan[fi] = { seg: s, link: L }; used.add(s.id); groups.add(groupOf(s)); if (linkKey(L)) said.add(linkKey(L)); break } })
    // where each leads: a world not walked, not promised by another facet, holding what the segment holds
    const takenP = new Set([...seenP, ...(world.taken || [])]), takenQ = new Set([...seen, ...(world.takenPoems || [])])
    for (const p of plan) if (p) { if (p.seg.kind === 'photo') takenP.add(p.seg.img); if (p.seg.poem) takenQ.add(p.seg.poem) } // a segment's own photograph or poem is where it goes; no other facet may promise it
    plan.forEach((p, fi) => { if (!p) return; p.cls = cls[fi]; p.basis = basisLine(cls[fi], p.link); p.to = toOf(p.seg, p.link, world, D, takenP, takenQ); p.steps = steps(p, y, D) })
    return plan }

  const goodCache = new Map()
  function good(slug, D) { // a poem with a way on: two or more of its lines are doors (21's his)
    if (goodCache.has(slug)) return goodCache.get(slug)
    const p = D.data.poems.find(q => q.slug === slug); let n = 0
    if (p) { const list = D.VOC.poems[slug] || [], used = new Set(); D.stanzasOf(p).flat().forEach(line => { const k = list.findIndex((d, k) => !used.has(k) && line.includes(d.phrase)); if (k >= 0) { used.add(k); n++ } }) }
    goodCache.set(slug, n >= 2); return n >= 2 }
  function toOf(seg, L, world, D, takenP, takenQ) {
    const SEG = D.SEG, photos = SEG.segs.filter(s => s.kind === 'photo'), freeP = s => s && !takenP.has(s), freeQ = s => s && !takenQ.has(s) && good(s, D)
    const kinNear = () => photos.map(p => p.img).filter(freeP).map(src => [src, (kinOf(D.KIN, world.photo, 9, src) || { d: 9 }).d]).sort((a, b) => a[1] - b[1]).map(x => x[0])
    const conc = seg.concepts || [], byPoem = q => photos.filter(p => p.paired && p.paired.poem === q).map(p => p.img)
    let photo, poem
    if (seg.kind === 'photo') { photo = seg.img; poem = [seg.paired && seg.paired.poem, ...SEG.segs.filter(s => s.kind === 'line' && s.concepts.some(c => (seg.concepts || []).includes(c))).map(s => s.poem)].find(freeQ) }
    else if (seg.poem) { poem = seg.poem; photo = [...byPoem(seg.poem), ...photos.filter(p => conc.some(c => p.concepts.includes(c))).map(p => p.img)].find(freeP) }
    else { photo = [...photos.filter(p => (L.k === 'place' && p.place.includes(L.place)) || (L.k === 'year' && p.year === L.year)).map(p => p.img)].find(freeP) }
    photo = photo || kinNear()[0]
    if (!poem) { const ph = photos.find(p => p.img === photo) || {}; poem = [ph.paired && ph.paired.poem, ...SEG.segs.filter(s => s.kind === 'line' && (ph.concepts || []).some(c => s.concepts.includes(c))).map(s => s.poem), ...D.data.poems.map(p => p.slug)].find(freeQ) }
    takenP.add(photo); takenQ.add(poem); return { photo, poem } }

  /* ---------- how a segment unfolds, tap by tap (?y=): the piece, then more of the work it is from, then the move ---------- */
  const titleOf = (D, s) => (D.data.poems.find(p => p.slug === s) || {}).title
  function steps(p, y, D) {
    const s = p.seg, mv = { t: 'move', to: p.to }, label = s.kind === 'photo' ? [s.place, s.year].filter(Boolean).join(', ') : s.kind === 'film' ? `Poem films · ${s.title}` : s.kind === 'about' ? (s.row ? `About · ${s.row}` : 'About') : s.kind === 'idea' ? `${s.title} · on the home` : s.title
    const href = s.kind === 'line' || s.kind === 'film' ? `/poems/${s.poem}.html` : s.kind === 'about' || s.kind === 'idea' ? s.href : null // a segment's link is in its data: where its words are
    const first = s.kind === 'line' ? { t: 'lines', lines: s.lines, small: label } : s.kind === 'photo' ? { t: 'glimpse', src: s.img, big: s.place, small: label, cell: p.link.k === 'kin' ? p.link.theirs : null }
      : s.kind === 'film' ? { t: 'glimpse', src: s.img, big: s.text, small: label } : { t: 'say', big: s.text, small: label }
    const flatOf = () => { const st = D.stanzasOf(D.data.poems.find(q => q.slug === s.poem)), gi = st.slice(0, s.stanza).reduce((n, x) => n + x.length, 0) + s.at, all = st.flat(), n = s.lines.length
      const other = l => !s.lines.includes(l), next = all.slice(gi + n).filter(other).slice(0, 2); return next.length ? next : all.slice(0, gi).filter(other).slice(-2) } // the lines on from it, over the stanza's end (a refrain skipped); at the poem's end, the lines before
    const dest = { t: 'lines', lines: D.stanzasOf(D.data.poems.find(q => q.slug === p.to.poem)).flat().slice(0, 2), small: titleOf(D, p.to.poem) }
    let more
    if (y === 'whole') { // into the whole work: the stanza, both of the film's worlds, the paragraph, the idea's own opening
      more = s.kind === 'line' ? { t: 'lines', lines: D.stanzasOf(D.data.poems.find(q => q.slug === s.poem))[s.stanza].slice(0, 8), small: label, href } : s.kind === 'film' ? { t: 'say', big: `${s.text} · ${s.other}`, small: label, href: '/poem-films.html' }
        : s.kind === 'photo' ? { t: 'glimpse', src: s.img, big: s.place, small: label, cell: null, whole: true } : { t: 'say', big: (s.whole && s.whole.length ? s.whole : [s.text]).join(' '), small: label, href }
      if (more.t === 'lines' && more.lines.join('/') === s.lines.join('/')) more = { ...dest, href: `/poems/${p.to.poem}.html` }
      if (more.t === 'say' && more.big === s.text) more = { ...dest } }
    else more = s.kind === 'line' ? (s.after.length ? { t: 'lines', lines: s.after, small: label } : dest) : s.kind === 'film' ? { t: 'glimpse', src: s.img.replace(/-(\d)\.jpg$/, (m, k) => `-${3 - k}.jpg`), big: s.other, small: label }
      : s.kind === 'photo' ? dest : s.after ? { t: 'say', big: s.after, small: label } : dest
    if (s.kind === 'line' && y !== 'whole' && !s.after.length) more = { t: 'lines', lines: flatOf(), small: label }
    if (more.t === 'lines' && !more.lines.length) more = dest
    if (stepKey(more) === stepKey(first)) more = s.kind === 'line' && flatOf().length ? { t: 'lines', lines: flatOf(), small: label } : dest
    if (stepKey(more) === stepKey(first)) { const ph = D.SEG.segs.find(x => x.id === 'photo:' + p.to.photo); more = { t: 'glimpse', src: p.to.photo, big: ph.place, small: [ph.place, ph.year].filter(Boolean).join(', '), cell: null } } // a one-line poem: the photograph it goes to
    return [first, more, mv] }
  const stepKey = s => s.t + ':' + (s.t === 'move' ? s.to.photo + '~' + s.to.poem : s.t === 'lines' ? s.lines.join('/') + '|' + s.small : (s.src || '') + (s.whole ? '#whole' : '') + s.big + '|' + s.small)

  const api = { plain, squash, sentences, slug, words, STOP, COMMON, REGIONS, LABEL, NAMES, HORIZON, describe, regionOf, cellAt, posOf, kinD, kinOf, links, basisLine, deal, steps, stepKey, good, context }
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.S37 = api
})(typeof window !== 'undefined' ? window : globalThis)
