// Run with the static server up; BASE_URL defaults to the local review server.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));
const checks = spawnSync(process.execPath, ['tools/test_idea_details.mjs'], {cwd: root, encoding: 'utf8'});
process.stdout.write(checks.stdout);
assert.equal(checks.status, 0, checks.stderr);

const base = process.env.BASE_URL || 'http://127.0.0.1:8798';
const paths = ['/', '/v1/', '/context/', '/v2/home.js', '/v2/home.css', '/v2/flow.js'];
for (const path of paths) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  const body = await response.text();
  assert.ok(body.length > 0, `${path}: empty response`);
  if (path.startsWith('/v2/')) {
    assert.equal(body, readFileSync(new URL('.' + path, import.meta.url), 'utf8'), `${path}: stale preview`);
  }
}
console.log('PASS HTTP: home, v1, Context and 3 exact-source assets');
