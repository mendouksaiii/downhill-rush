/* Serverless-function module-type contract.
 *
 * The root package.json declares "type": "module" so the ESM test tooling works.
 * That declaration applies to EVERY .js file under the repo root — including the
 * Vercel functions in api/, which are CommonJS. When that happened, `module.exports`
 * did not exist at runtime and all three endpoints died with
 * FUNCTION_INVOCATION_FAILED: the leaderboard, account saves and Overseer telemetry
 * were down in production, with nothing failing locally to reveal it.
 *
 * api/package.json pins that directory back to CommonJS. These tests make the
 * coupling explicit so it cannot silently break again — in either direction.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const url = (p) => new URL(`../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), 'utf8');
const json = (p) => JSON.parse(read(p));

const apiFiles = readdirSync(url('api')).filter((f) => f.endsWith('.js'));

test('the api directory pins itself to CommonJS', () => {
  assert.ok(existsSync(url('api/package.json')),
    'api/package.json is REQUIRED: without it the root "type":"module" makes every ' +
    'function ESM and module.exports is undefined at runtime');
  assert.equal(json('api/package.json').type, 'commonjs',
    'api/package.json must declare type "commonjs"');
});

test('every function still uses the CommonJS export it is pinned for', () => {
  assert.ok(apiFiles.length >= 3, `expected the api handlers, found ${apiFiles}`);
  for (const f of apiFiles) {
    const src = read(`api/${f}`);
    assert.match(src, /module\.exports\s*=/, `api/${f} must export via module.exports`);
    // a stray ESM export would fail under type:commonjs — the mirror image of the outage
    assert.doesNotMatch(src, /^\s*export\s+(default|const|function)/m,
      `api/${f} mixes ESM exports into a CommonJS module`);
  }
});

test('the root stays ESM so the shared browser modules load in node', () => {
  assert.equal(json('package.json').type, 'module',
    'the root must stay ESM: tests import achievements-data.js / economy.js directly');
});

test('the Overseer job does not hardcode a stale game URL', () => {
  // the workflow used to pin the pre-rename downhill-rush-steel domain, which
  // overrode the script default and pointed telemetry at the wrong deploy
  const wf = read('.github/workflows/overseer-evolve.yml');
  assert.doesNotMatch(wf, /downhill-rush-steel/,
    'the workflow must not hardcode the old domain');
  const script = read('scripts/evolve-overseer.mjs');
  assert.match(script, /redline-rider\.vercel\.app/,
    'the production URL should live in the script as the single default');
});
