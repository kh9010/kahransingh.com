// node studies/03/board.mjs <repo root>  → rewrites studies/03/index.html from both picks files + the HANDOFF read lines. verify fails if the board drifts from the picks.
import fs from 'node:fs'
const R = process.argv[2], S = p => R + '/studies/' + p
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const host = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
const kept = [], away = []
for (const n of ['01','02']) {
  const picks = JSON.parse(fs.readFileSync(S(n+'/picks.json'))), items = Object.fromEntries(JSON.parse(fs.readFileSync(S(n+'/pile.json'))).items.map(i => [i.id, i]))
  for (const [id, p] of Object.entries(picks)) {
    const it = items[id] || {}, name = (it.name || p.name || id).replace(/^Home \| /, ''), url = p.url || it.url
    if (p.v === 'keep') kept.push({ id, n, name, url, note: p.note, img: fs.existsSync(S('01/media/'+id+'.jpg')) ? `../01/media/${id}.jpg` : null })
    else if (p.note && !/tapped by mistake/.test(p.note)) away.push({ id, n, name, url, note: p.note })
  }
}
const hand = fs.readFileSync(R + '/HANDOFF.md', 'utf8')
const reads = [/^Read: (.*)$/m, /^Read across both passes: (.*)$/m].map(r => hand.match(r)[1])
const tile = k => `<a class="k" data-id="${k.id}" href="${esc(k.url)}" target="_blank" rel="noopener">${k.img ? `<img src="${k.img}" alt="" loading="lazy">` : `<i>${esc(k.name)}</i>`}<b>${esc(k.name)}</b><small>${esc(host(k.url))} · ${k.n}</small><q class="${/^\(/.test(k.note) ? 'gap' : ''}">${esc(k.note || '(no note)')}</q></a>`
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Study 03</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&family=Fraunces:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<style>
:root { --paper: #fafaf8; --card: #fff; --ink: #1a1a1a; --ink2: #6e6e6e; --ink3: #9a958c; --line: #e0ddd8; --sans: 'Space Grotesk', -apple-system, sans-serif; --serif: 'Fraunces', Georgia, serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #141210; --card: #1c1a15; --ink: #ede7d9; --ink2: #9a9385; --ink3: #6f685c; --line: #332e26; color-scheme: dark; } }
:root[data-theme="dark"] { --paper: #141210; --card: #1c1a15; --ink: #ede7d9; --ink2: #9a9385; --ink3: #6f685c; --line: #332e26; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; padding: 16px; background: var(--paper); color: var(--ink); font: 400 .78rem/1.4 var(--sans); }
h2 { font: 500 .72rem var(--sans); letter-spacing: .12em; text-transform: uppercase; color: var(--ink2); margin: 0 0 8px; }
nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 16px; }
nav a { text-decoration: none; color: inherit; border: 1px solid var(--line); border-left: 3px solid var(--ink); border-radius: 6px; padding: 8px 10px; background: var(--card); }
nav b { font-weight: 500; display: block; } nav small { color: var(--ink2); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-bottom: 16px; }
.k { display: flex; flex-direction: column; gap: 2px; text-decoration: none; color: inherit; background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 6px; }
.k:hover { border-color: var(--ink2); }
.k img, .k i { width: 100%; aspect-ratio: 16/10; object-fit: cover; object-position: top; border-radius: 3px; background: var(--line); }
.k i { display: grid; place-items: center; font: italic 400 1rem var(--serif); color: var(--ink2); padding: 8px; text-align: center; }
.k b { font-weight: 500; margin-top: 4px; } .k small { color: var(--ink3); }
q { font: 400 .9rem/1.35 var(--serif); quotes: '“' '”'; } q.gap { color: var(--ink3); font-style: italic; quotes: none; font-size: .78rem; }
ul { list-style: none; padding: 0; margin: 0 0 16px; columns: 2 320px; column-gap: 16px; }
li { break-inside: avoid; padding: 4px 0; border-top: 1px solid var(--line); }
li a { color: var(--ink2); text-decoration: none; font-weight: 500; margin-right: 6px; }
.reads q { display: block; font-size: 1.05rem; padding: 6px 0; border-top: 1px solid var(--line); quotes: none; }
</style>
</head>
<body>
<nav>
  <a href="a.html"><b>A · garden of connections</b><small>Maggie Appleton · tej.as · Mental Nodes</small></a>
  <a href="b.html"><b>B · desk</b><small>Divya's sketch · windy · muda · Cat Bounce</small></a>
  <a href="c.html"><b>C · applied mischief</b><small>MSCHF · Cheeseboard · Pug in a Rug</small></a>
  <a href="d.html"><b>D · infinite zoom</b><small>Zoomquilt · teenage engineering</small></a>
</nav>
<h2>kept · ${kept.length}</h2>
<section class="grid">
${kept.map(tile).join('\n')}
</section>
<h2>pushed away · ${away.length}</h2>
<ul>
${away.map(a => `<li><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a><q>${esc(a.note)}</q></li>`).join('\n')}
</ul>
<h2>read across</h2>
<section class="reads">
${reads.map(r => `<q>${esc(r)}</q>`).join('\n')}
</section>
</body>
</html>
`
fs.writeFileSync(S('03/index.html'), html)
console.log(kept.length, 'kept', away.length, 'away')
