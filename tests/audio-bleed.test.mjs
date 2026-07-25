/* Audio-bleed contract.
 *
 * The mp3 soundtrack is the game's music now. Two legacy in-world audio layers
 * used to leak UNDER it on the home screen, which reads as "gameplay audio
 * playing on the homepage":
 *   1. the procedural synth score (schedule()) kept thumping a kick on the
 *      title state;
 *   2. the wind gain is set in refreshHUD() -- which runs every frame incl. the
 *      menu -- off game.speed, so it hummed at START_SPEED on the title.
 * These assertions pin the fixes so the layering can't come back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');

function functionBody(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

test('the procedural synth score yields to the mp3 soundtrack', () => {
  const sched = functionBody('schedule');
  // when the mp3 player is armed, schedule() must bail before emitting notes
  const guard = sched.slice(0, sched.indexOf('while'));
  assert.match(guard, /if\s*\(\s*musicOn\s*\)/, 'schedule() must early-return while musicOn');
  assert.match(guard, /return;/, 'the musicOn guard must return before scheduling notes');
});

test('wind only voices while riding, not on the menu', () => {
  const hud = functionBody('refreshHUD');
  const line = hud.match(/windGain\.gain\.value\s*=([^;]*);/);
  assert.ok(line, 'wind gain assignment not found in refreshHUD');
  assert.match(
    line[1],
    /state===['"]riding['"]/,
    'wind gain must be gated on the riding state -- refreshHUD runs on the menu too'
  );
});

test('the menu frame zeros the drone that update() would otherwise leave hanging', () => {
  // updateOverseerAudio() is skipped when the menu is up, so the drone has to
  // be silenced directly or its last swell rings out under the home music
  const start = html.indexOf('const menuUp =');
  assert.notEqual(start, -1, 'menuUp branch not found');
  const block = html.slice(start, start + 900);
  assert.match(block, /else if\s*\(\s*AC\s*\)/, 'menuUp needs an else branch to silence in-world audio');
  assert.match(block, /droneGain\.gain\.value\s*=\s*0/, 'the menu branch must zero the drone');
});
