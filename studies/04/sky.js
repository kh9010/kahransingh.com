/* studies/04/sky.js — the bits the three gems share, on top of ../03/shared.js (the real v2 content).
   S04.sky(reading) → { top, bottom, hour, label }: the sky's colour from the live reading's hour,
   cloud and weather code. S04.facets(ctx) → the content pool: photos, poem lines, place, tools. */
(function () {
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
  // hour → [top, bottom] in a clear sky; cloud greys it toward slate, rain darkens
  const STOPS = [[0, [12, 16, 38], [30, 34, 62]], [5, [40, 42, 80], [214, 140, 120]], [7, [120, 170, 220], [250, 214, 170]],
    [12, [90, 160, 230], [200, 226, 245]], [17, [70, 110, 190], [250, 190, 130]], [19, [50, 50, 110], [230, 120, 100]], [21, [16, 20, 48], [40, 44, 80]], [24, [12, 16, 38], [30, 34, 62]]]
  function sky(r) {
    const tz = (r && r.tz) || 'America/New_York'
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date())
    const hour = +p.find(x => x.type === 'hour').value + +p.find(x => x.type === 'minute').value / 60
    let i = STOPS.findIndex(s => s[0] > hour) - 1; if (i < 0) i = 0
    const [h0, t0, b0] = STOPS[i], [h1, t1, b1] = STOPS[i + 1], t = (hour - h0) / (h1 - h0)
    let top = mix(t0, t1, t), bottom = mix(b0, b1, t)
    const cloud = r ? (r.cloud_cover || 0) / 100 : .3, wet = r && r.weather_code >= 51
    top = mix(top, [120, 126, 136], cloud * .55); bottom = mix(bottom, [170, 172, 176], cloud * .5)
    if (wet) { top = mix(top, [40, 46, 56], .35); bottom = mix(bottom, [90, 96, 104], .35) }
    return { top: hex(top), bottom: hex(bottom), topRGB: top, bottomRGB: bottom, hour }
  }
  function facets(c) {
    const r = c.reading, place = (c.line || '').replace(/\s+/g, ' ').trim()
    const lines = q => q.stanzas.join('\n').split('\n').map(s => s.trim()).filter(s => s.length > 12 && s.length < 70)
    const photos = [c.photo, ...c.data.photos.filter(p => p !== c.photo)]
    const poems = [c.poem, ...c.data.poems.filter(p => p !== c.poem)]
    return {
      photos: photos.map(p => ({ kind: 'photo', src: p.src, cap: p.caption, href: '/photography.html' })),
      lines: poems.map(q => ({ kind: 'poem', title: q.title, line: lines(q)[0] || q.title, href: '/poems/' + q.slug + '.html' })),
      place: { kind: 'place', line: place || 'New York', temp: r ? Math.round(r.temperature_2m) + '°C' : '', cloud: r ? r.cloud_cover + '% cloud' : '', href: '/context/' },
      tools: c.ideas.map(d => ({ kind: 'tool', name: d.name, line: d.line, note: d.note, href: d.href || '/' }))
    }
  }
  window.S04 = { sky, facets }
})()
