/* Sound-effect coverage contract.
 *
 * Every sound is synthesised through the existing Web Audio bus, so a typo in
 * a call site (sfx.jumpEmty()) is a silent TypeError inside an event handler --
 * it never surfaces in normal play. These assertions pin the call sites to real
 * definitions and keep the noisy moments of the game from going quiet again.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
const market = readFileSync(new URL('../market.html', import.meta.url), 'utf8');
const uiSfx = readFileSync(new URL('../ui-sfx.js', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

// method names defined at two-space indent inside the sfx object / Object.assign
const defined = new Set([...html.matchAll(/^ {2}(\w+)\(/gm)].map((m) => m[1]));
const called = [...new Set([...html.matchAll(/sfx\.(\w+)\s*\(/g)].map((m) => m[1]))];

test('every sfx call resolves to a real definition', () => {
  const missing = called.filter((c) => !defined.has(c));
  assert.deepEqual(missing, [], `sfx methods called but never defined: ${missing}`);
  assert.ok(called.length >= 20, `expected broad coverage, found ${called.length} distinct sounds`);
});

test('the moments that were silent now make noise', () => {
  // each of these was verified by hand; the assertion stops them regressing
  for (const fx of ['tick', 'select', 'back', 'toggle', 'deny', 'open', 'close',
                    'launch', 'jump', 'land', 'comboUp', 'comboLost', 'nearMiss',
                    'gas', 'checkpoint', 'summit', 'rank', 'pause']) {
    assert.ok(defined.has(fx), `sfx.${fx} is not defined`);
    assert.ok(called.includes(fx), `sfx.${fx} is defined but never called`);
  }
});

test('audio unlocks outside the gameplay input path', () => {
  // initAudio() used to be reachable only from routeUI(), so the whole home
  // screen was silent until the player started a run.
  assert.match(html, /function audioUnlock\(\)/, 'missing audioUnlock');
  assert.match(
    html,
    /addEventListener\(ev, audioUnlock/,
    'audioUnlock must be bound to first-gesture events'
  );
});

test('disabled PLAY gives feedback instead of nothing', () => {
  const start = html.indexOf("$('startBtn').addEventListener('click'");
  assert.notEqual(start, -1, 'startBtn handler not found');
  const body = html.slice(start, start + 260);
  assert.match(body, /sfx\.deny\(\)/, 'a disabled PLAY button must say so audibly');
  assert.match(body, /sfx\.launch\(\)/, 'PLAY must fire the launch cue');
});

test('market has sound and uses the shared module', () => {
  assert.match(market, /import \{ UISfx \} from '\.\/ui-sfx\.js'/, 'market must import UISfx');
  for (const fx of ['buy', 'equip', 'deny', 'select', 'tick', 'back']) {
    assert.match(market, new RegExp(`UISfx\\.${fx}\\(`), `market never calls UISfx.${fx}`);
    assert.match(uiSfx, new RegExp(`\\b${fx}\\s*[(:]`), `ui-sfx.js does not export ${fx}`);
  }
});

test('ui-sfx.js is precached', () => {
  const from = sw.indexOf('const PRECACHE = [');
  const precache = sw.slice(from, sw.indexOf('];', from));
  assert.match(precache, /ui-sfx\.js/, 'ui-sfx.js must be precached for offline use');
});
