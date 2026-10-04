import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const home = readFileSync(new URL('../v2/home.js', import.meta.url), 'utf8');
const flow = readFileSync(new URL('../v2/flow.js', import.meta.url), 'utf8');
const extract = (text, name) => vm.runInNewContext(text.match(new RegExp('var ' + name + ' = ([\\s\\S]*?\\n  \\]);'))[1]);
const ideas = JSON.parse(JSON.stringify(extract(home, 'IDEAS')));
const expected = {
  'Context': ['Raw store', 'Voice & WhatsApp capture', 'Movement'],
  'Keeping track': ['The miners', 'The judge', 'The Curator', 'The sparks garden'],
  'Staying up to date': ['Mail triage', 'The weekly record'],
  'Topically suggesting': ['The now brain', 'The workout planner', 'Noticings', 'Travel days'],
  'Self-healing': ['Samwise', 'The repairer', 'The health page']
};
assert.deepEqual(Object.fromEntries(ideas.map(i => [i.name, i.parts])), expected);
for (const idea of ideas) {
  assert.ok(idea.detail, `${idea.name}: substantive details missing`);
  assert.equal(idea.detail.tools.length, idea.parts.length);
  assert.ok(idea.detail.intro.length > 70, `${idea.name}: explanation missing`);
  idea.detail.tools.forEach((text, n) => assert.ok(text.length > 65, `${idea.parts[n]}: explanation missing`));
  assert.ok(idea.detail.boundary.length > 40, `${idea.name}: distinction missing`);
}
console.log('PASS idea coverage: 5 ideas, 16 explained tools');
assert.deepEqual(JSON.parse(JSON.stringify(extract(flow, 'EDGES'))), [
  ['Context', 'Keeping track'], ['Context', 'Staying up to date'],
  ['Context', 'Topically suggesting'], ['Keeping track', 'Topically suggesting']
]);
assert.equal(extract(flow, 'FEEDS').length, 12);
console.log('PASS audited graph: 4 data arrows, 12 surface feeds');
const coverage = JSON.parse(readFileSync(new URL('../docs/idea-details-coverage.json', import.meta.url)));
assert.deepEqual(coverage.map(i => [i.idea, i.tools.map(t => t.name)]), Object.entries(expected));
for (const idea of coverage) for (const tool of idea.tools) {
  assert.ok(tool.sources.length);
  for (const source of tool.sources) assert.ok(readFileSync(new URL('../' + source.split('#')[0], import.meta.url), 'utf8').length);
}
console.log('PASS public provenance: 16 tools with repository sources');
