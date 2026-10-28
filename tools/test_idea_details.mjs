import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const home = readFileSync(new URL('../v2/home.js', import.meta.url), 'utf8');
const flow = readFileSync(new URL('../v2/flow.js', import.meta.url), 'utf8');
const extract = (text, name) => vm.runInNewContext(text.match(new RegExp('var ' + name + ' = ([\\s\\S]*?\\n  \\]);'))[1]);
const ideas = JSON.parse(JSON.stringify(extract(home, 'IDEAS')));
// The six-idea cut (Kahran, 2026-10-27; groomer out, meal plan in, 2026-10-28). Evidence: docs/2026-09-22-flow-edges.md, last section.
const expected = {
  'Context': ['Raw store', 'The WhatsApp assistant', 'Where I am', 'Right now'],
  'Keeping track': ['The miners', 'The judge', 'The Curator', 'Meeting follow-ups', 'The sparks garden'],
  'Staying up to date': ['Mail triage', 'The newsletter reader', 'Lost touch', 'The weekly record'],
  'Topically suggesting': ['The day planner', 'The midday door', 'The workout planner', 'The meal plan', 'Noticings', 'Travel days'],
  'Self-healing': ['Samwise', 'The repairer', 'The health page'],
  'Home': ['The lights', 'The bedroom frame', 'The family archive', 'This page']
};
const nTools = Object.values(expected).flat().length;
assert.deepEqual(Object.fromEntries(ideas.map(i => [i.name, i.parts])), expected);
for (const idea of ideas) {
  assert.ok(idea.detail, `${idea.name}: substantive details missing`);
  assert.equal(idea.detail.tools.length, idea.parts.length);
  assert.ok(idea.detail.intro.length > 70, `${idea.name}: explanation missing`);
  idea.detail.tools.forEach((text, n) => assert.ok(text.length > 65, `${idea.parts[n]}: explanation missing`));
  assert.ok(idea.detail.boundary.length > 40, `${idea.name}: distinction missing`);
}
console.log(`PASS idea coverage: ${ideas.length} ideas, ${nTools} explained tools`);
assert.deepEqual(JSON.parse(JSON.stringify(extract(flow, 'EDGES'))), [
  ['Context', 'Keeping track'], ['Context', 'Staying up to date'],
  ['Context', 'Topically suggesting'], ['Keeping track', 'Topically suggesting'],
  ['Context', 'Home']
]);
assert.equal(extract(flow, 'FEEDS').length, 20);
console.log('PASS audited graph: 5 data arrows, 20 surface feeds');
const coverage = JSON.parse(readFileSync(new URL('../docs/idea-details-coverage.json', import.meta.url)));
assert.deepEqual(coverage.map(i => [i.idea, i.tools.map(t => t.name)]), Object.entries(expected));
for (const idea of coverage) for (const tool of idea.tools) {
  assert.ok(tool.sources.length);
  for (const source of tool.sources) assert.ok(readFileSync(new URL('../' + source.split('#')[0], import.meta.url), 'utf8').length);
}
console.log(`PASS public provenance: ${nTools} tools with repository sources`);
