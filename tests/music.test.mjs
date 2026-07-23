/* Soundtrack contract.
 *
 * The music player resolves track names to './media/music/<name>.mp3' at
 * runtime. A rename or typo fails silently -- the <audio> element just fires
 * 'error' and the playlist skips on -- so the mapping is asserted here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

function trackNames() {
  const block = html.slice(html.indexOf('const MUSIC_SETS={'));
  const end = block.indexOf('};');
  return [...block.slice(0, end).matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
}

test('every referenced track exists on disk', () => {
  const names = trackNames();
  assert.equal(names.length, 6, `expected 6 tracks, found ${names.length}: ${names}`);
  for (const n of names) {
    const url = new URL(`../media/music/${n}.mp3`, import.meta.url);
    assert.ok(existsSync(url), `missing media/music/${n}.mp3`);
    assert.ok(statSync(url).size > 100_000, `media/music/${n}.mp3 looks truncated`);
  }
});

test('menu and run playlists are separate and non-empty', () => {
  const names = trackNames();
  const menu = names.filter((n) => n.startsWith('menu-'));
  const run = names.filter((n) => n.startsWith('run-'));
  assert.equal(menu.length, 2, 'expected 2 menu tracks');
  assert.equal(run.length, 4, 'expected 4 gameplay tracks');
  assert.equal(new Set(names).size, names.length, 'duplicate track in the playlists');
});

test('a src swap must not disarm the player', () => {
  // Changing .src rejects the in-flight play() with AbortError. Treating any
  // rejection as "autoplay refused" silently kills music after the first
  // playlist change -- which is exactly what happened the first time.
  const start = html.indexOf('function musicPlayCurrent(');
  const body = html.slice(start, html.indexOf('\n}', start));
  assert.match(
    body,
    /NotAllowedError/,
    'only NotAllowedError may clear musicOn; AbortError is normal on track change'
  );
});

test('service worker never caches music', () => {
  // <audio> uses Range requests and Cache.put() REJECTS a 206 response.
  assert.match(sw, /const isMusic\s*=/, 'sw must special-case music');
  assert.match(sw, /if \(isMusic\(url\)\) return;/, 'music must bypass the SW entirely');
  assert.match(sw, /r\.status !== 206/, 'partial responses must never be cached');
  // scope to the array literal itself -- a whole-file regex would match the
  // isMusic() definition further down and pass/fail for the wrong reason
  const from = sw.indexOf('const PRECACHE = [');
  assert.notEqual(from, -1, 'PRECACHE list not found');
  const precache = sw.slice(from, sw.indexOf('];', from));
  assert.doesNotMatch(precache, /media\/music/, 'music must not be precached (~16MB)');
});
