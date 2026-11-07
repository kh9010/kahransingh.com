// node studies/21/check.mjs — Study 21, the big ideas. No browser: data only.
// For each of the four vocabularies in doors.json:
//   every poem has 2 or 3 doors, each to a different idea, none overlapping
//   every door phrase occurs verbatim in its poem, inside one stanza
//   every idea reaches >= 3 poems; the idea index agrees with the doors
//   an idea named in his own words occurs verbatim in the poem it is lifted from
// And: doors.json is exactly what build.py writes from readings.txt + ideas.json (the judgements are the source).
// Prints a PASS block, or every failure and exits 1.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const data = JSON.parse(readFileSync(join(root, 'v2/data.json'), 'utf8'))
const raw = readFileSync(join(here, 'doors.json'), 'utf8')
const doors = JSON.parse(raw)
const stanzas = Object.fromEntries(data.poems.map(p => [p.slug, p.stanzas]))
const srcs = new Set(data.photos.map(p => p.src))
const fails = [], lines = []

const want = ['pairs', 'questions', 'nouns', 'his']
if (Object.keys(doors.vocabs).join() !== want.join()) fails.push(`vocabularies are ${Object.keys(doors.vocabs).join(', ')}, want ${want.join(', ')}`)

for (const [name, v] of Object.entries(doors.vocabs)) {
  const ideas = new Set(v.words.map(w => w.word))
  const poemsOf = new Map([...ideas].map(w => [w, new Set()]))
  let n = 0
  for (const slug of Object.keys(stanzas)) {
    const ds = v.poems[slug] || []
    if (ds.length < 2 || ds.length > 3) fails.push(`${name}: ${slug} has ${ds.length} door(s), needs 2–3`)
    if (new Set(ds.map(d => d.word)).size !== ds.length) fails.push(`${name}: ${slug} has two doors to one idea`)
    const spans = []
    for (const d of ds) {
      n++
      const si = stanzas[slug].findIndex(s => s.includes(d.phrase))
      if (si < 0) { fails.push(`${name}: ${slug}: not verbatim in one stanza: "${d.phrase}"`); continue }
      if (!ideas.has(d.word)) { fails.push(`${name}: ${slug}: "${d.word}" is not an idea`); continue }
      poemsOf.get(d.word).add(slug)
      const at = stanzas[slug][si].indexOf(d.phrase)
      for (const [s, a, b] of spans) if (s === si && at < b && a < at + d.phrase.length) fails.push(`${name}: ${slug}: doors overlap at "${d.phrase}"`)
      spans.push([si, at, at + d.phrase.length])
    }
  }
  for (const slug of Object.keys(v.poems)) if (!(slug in stanzas)) fails.push(`${name}: unknown poem ${slug}`)
  for (const [src, ws] of Object.entries(v.photos)) {
    if (!srcs.has(src)) fails.push(`${name}: unknown photo ${src}`)
    for (const w of ws) if (!ideas.has(w)) fails.push(`${name}: photo ${src}: "${w}" is not an idea`)
  }
  for (const w of v.words) {
    const p = poemsOf.get(w.word).size
    if (p < 3) fails.push(`${name}: "${w.word}" reaches ${p} poem(s), needs 3`)
    if (w.poems.length !== p) fails.push(`${name}: index for "${w.word}" is stale`)
    const f = Object.entries(v.photos).filter(([, ws]) => ws.includes(w.word)).length
    if (w.photos.length !== f) fails.push(`${name}: photo index for "${w.word}" is stale`)
    if (w.from && !(stanzas[w.from] || []).some(s => s.includes(w.word))) fails.push(`${name}: "${w.word}" is not in ${w.from}`)
  }
  const thin = Math.min(...v.words.map(w => poemsOf.get(w.word).size))
  lines.push(`  ${v.label.padEnd(10)} ${String(ideas.size).padStart(2)} ideas · ${n} doors over ${Object.keys(stanzas).length} poems · thinnest idea ${thin} poems · ${Object.keys(v.photos).length}/${srcs.size} photos`)
}

// the data is generated: rebuilding from the judgements must not change it
const r = spawnSync('python3', [join(here, 'build.py')], { encoding: 'utf8' })
if (r.status !== 0) fails.push('build.py fails: ' + (r.stdout + r.stderr).trim().split('\n').slice(0, 5).join(' | '))
else if (readFileSync(join(here, 'doors.json'), 'utf8') !== raw) fails.push('doors.json was stale: build.py rewrote it (run the check again)')

if (fails.length) {
  console.log('FAIL studies/21/check.mjs')
  for (const f of fails) console.log('  ' + f)
  process.exit(1)
}
console.log('PASS studies/21/check.mjs — every poem 2–3 doors, every door verbatim, every idea in ≥3 poems')
for (const l of lines) console.log(l)
