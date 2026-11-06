// node studies/15/check.mjs — Study 15, the doors. No browser: data only.
// For each vocabulary in doors.json:
//   every door phrase is a verbatim substring of its poem (and doors in one poem do not overlap)
//   every poem has >= 2 doors, every photo >= 1 word, every word is in the vocabulary
//   every word reaches >= 3 poems and >= 3 photos (no dead-end door)
//   the poem graph is connected: from any poem, through shared words, every other poem
// Prints a PASS block, or every failure and exits 1.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const data = JSON.parse(readFileSync(join(root, 'v2/data.json'), 'utf8'))
const doors = JSON.parse(readFileSync(join(here, 'doors.json'), 'utf8'))
const text = Object.fromEntries(data.poems.map(p => [p.slug, p.stanzas.join('\n')]))
const srcs = new Set(data.photos.map(p => p.src))
const fails = []
const lines = []

for (const [name, v] of Object.entries(doors.vocabs)) {
  const vocab = new Set(v.words.map(w => w.word))
  const poemsOf = new Map([...vocab].map(w => [w, new Set()]))
  const photosOf = new Map([...vocab].map(w => [w, new Set()]))
  let nDoors = 0

  for (const slug of Object.keys(text)) {
    const ds = v.poems[slug] || []
    if (ds.length < 2) fails.push(`${name}: ${slug} has ${ds.length} door(s), needs 2`)
    const spans = []
    for (const d of ds) {
      nDoors++
      const at = text[slug]?.indexOf(d.phrase) ?? -1
      if (at < 0) { fails.push(`${name}: ${slug}: not verbatim: "${d.phrase}"`); continue }
      if (!vocab.has(d.word)) { fails.push(`${name}: ${slug}: "${d.word}" not in vocabulary`); continue }
      poemsOf.get(d.word).add(slug)
      for (const [a, b] of spans) if (at < b && a < at + d.phrase.length) fails.push(`${name}: ${slug}: doors overlap at "${d.phrase}"`)
      spans.push([at, at + d.phrase.length])
    }
  }
  for (const slug of Object.keys(v.poems)) if (!(slug in text)) fails.push(`${name}: unknown poem ${slug}`)

  for (const src of srcs) {
    const ws = v.photos[src] || []
    if (!ws.length) fails.push(`${name}: photo ${src} belongs to no word`)
    for (const w of ws) vocab.has(w) ? photosOf.get(w).add(src) : fails.push(`${name}: photo ${src}: "${w}" not in vocabulary`)
  }

  for (const w of vocab) {
    const p = poemsOf.get(w).size, f = photosOf.get(w).size
    if (p < 3 || f < 3) fails.push(`${name}: "${w}" reaches ${p} poems, ${f} photos (needs 3 and 3)`)
    // the index in doors.json must agree with the doors themselves
    const idx = v.words.find(x => x.word === w)
    if (idx.poems.length !== p || idx.photos.length !== f) fails.push(`${name}: index for "${w}" is stale`)
  }

  // connectivity: poems joined through shared words
  const slugs = Object.keys(text)
  const seen = new Set([slugs[0]]), queue = [slugs[0]]
  while (queue.length) {
    const s = queue.shift()
    for (const d of v.poems[s] || []) for (const t of poemsOf.get(d.word) || []) if (!seen.has(t)) { seen.add(t); queue.push(t) }
  }
  if (seen.size !== slugs.length) fails.push(`${name}: graph not connected — ${slugs.length - seen.size} poem(s) unreachable: ${slugs.filter(s => !seen.has(s)).join(', ')}`)

  const minP = Math.min(...[...vocab].map(w => poemsOf.get(w).size)), minF = Math.min(...[...vocab].map(w => photosOf.get(w).size))
  lines.push(`  ${name.padEnd(9)} ${vocab.size} words · ${nDoors} doors over ${slugs.length} poems · ${srcs.size} photos · thinnest word ${minP} poems / ${minF} photos · ${seen.size}/${slugs.length} poems reachable`)
}

if (fails.length) {
  console.log('FAIL studies/15/check.mjs')
  for (const f of fails) console.log('  ' + f)
  process.exit(1)
}
console.log('PASS studies/15/check.mjs — every door verbatim, no dead ends, one connected graph')
for (const l of lines) console.log(l)
