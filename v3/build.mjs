#!/usr/bin/env node
// v3/build.mjs: the home's own copies of the studies it was assembled from (versions share no files).
// Scripts are copied byte for byte; data are copied, except regions.json, which is split into one small file per photograph
// so a visit loads only the photographs it shows. body.js reads its sources from /v3/body/ instead of four study folders
// (its one changed line, SOURCES below); here.js (42's, what an idea's facet says of this world) reads the poems' years from /v3/poem-years.json
// instead of 27's folder. `node v3/build.mjs --check` exits 1 if any copy differs from what this would write;
// tools/test_home.mjs runs it, so a study rebuilt without the home rebuilt goes red.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..')
const CHECK = process.argv.includes('--check')
const read = f => readFileSync(path.join(ROOT, f), 'utf8')
const SOURCES = [['/studies/21/ideas.json', '/v3/body/ideas.json'], ['/studies/21/readings.txt', '/v3/body/readings.txt'],
  ['/studies/15/doors.json', '/v3/body/doors15.json'], ['/studies/26/kin.json', '/v3/kin.json'], ['/studies/13/features.json', '/v3/body/features.json']]
const out = new Map()
const copy = (from, to) => out.set(to, read(from))
// the stone and its crossing
copy('studies/33/cut.js', 'v3/cut.js')
copy('studies/39/cross.js', 'v3/cross.js')
copy('studies/37/segs.js', 'v3/segs.js')
copy('studies/36/today.js', 'v3/today.js')
// 35's line and 34's chain
copy('studies/36/moment.js', 'v3/moment.js')
copy('studies/36/why.js', 'v3/why.js')
copy('studies/36/ways.js', 'v3/ways.js')
{ let h = read('studies/42/here.js'); const [from, to] = ['/studies/27/poem-years.json', '/v3/poem-years.json']; if (!h.includes(`'${from}'`)) throw new Error('here.js no longer reads ' + from); out.set('v3/here.js', h.replace(`'${from}'`, `'${to}'`)) }
{ let b = read('studies/36/body.js'); for (const [from, to] of SOURCES) { if (!b.includes(`'${from}'`)) throw new Error('body.js no longer reads ' + from); b = b.replace(`'${from}'`, `'${to}'`) } out.set('v3/body.js', b) }
// data
copy('studies/21/doors.json', 'v3/doors.json')
copy('studies/26/kin.json', 'v3/kin.json')
copy('studies/37/segments.json', 'v3/segments.json')
copy('studies/38/crossings.json', 'v3/crossings.json')
copy('studies/27/poem-years.json', 'v3/poem-years.json')
copy('studies/21/ideas.json', 'v3/body/ideas.json')
copy('studies/21/readings.txt', 'v3/body/readings.txt')
copy('studies/15/doors.json', 'v3/body/doors15.json')
copy('studies/13/features.json', 'v3/body/features.json')
const REG = JSON.parse(read('studies/33/regions.json')), stem = src => src.split('/').pop().replace(/\.[a-z]+$/i, '')
const head = { made_by: REG.made_by, analysis_width: REG.analysis_width, grid_columns: REG.grid_columns }
for (const [src, R] of Object.entries(REG.photos)) out.set(`v3/regions/${stem(src)}.json`, JSON.stringify({ ...head, src, photo: R }) + '\n')

let wrong = []
const stale = existsSync(path.join(HERE, 'regions')) ? readdirSync(path.join(HERE, 'regions')).map(f => 'v3/regions/' + f).filter(f => !out.has(f)) : []
for (const [f, body] of out) { const p = path.join(ROOT, f)
  if (CHECK) { if (!existsSync(p) || readFileSync(p, 'utf8') !== body) wrong.push(f); continue }
  mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, body) }
if (CHECK) { wrong.push(...stale); if (wrong.length) { console.log('v3 copies differ from their studies: ' + wrong.slice(0, 6).join(', ')); process.exit(1) }
  console.log(`v3 copies agree with their studies: ${out.size} files, ${Object.keys(REG.photos).length} photographs' regions`) }
else { for (const f of stale) rmSync(path.join(ROOT, f)); console.log(`v3: wrote ${out.size} files`) }
