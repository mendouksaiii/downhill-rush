import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
const map = JSON.parse(readFileSync(new URL('../maps/ascent-01-verdant.json', import.meta.url), 'utf8'));

test('Verdant ASCENT map is finite, ordered, and checkpointed', () => {
  assert.equal(map.version, 1);
  assert.match(map.id, /^ascent-[0-9]{2}-[a-z0-9-]+$/);
  assert.ok(map.summitAlt > 0);
  assert.ok(map.altitudePerMeter > 0);
  assert.ok(map.assistedSpeed > 0);
  assert.ok(map.checkpointAlts.length >= 2);
  assert.deepEqual([...map.checkpointAlts].sort((a, b) => a - b), map.checkpointAlts);
  assert.ok(map.checkpointAlts.every(at => at > 0 && at < map.summitAlt));
  assert.equal(map.altitudeBands[0].from, 0);
  assert.equal(map.altitudeBands.at(-1).to, map.summitAlt);
  for (let i = 1; i < map.altitudeBands.length; i++)
    assert.equal(map.altitudeBands[i - 1].to, map.altitudeBands[i].from);
});

test('gauntlet events use supported, telegraphed patterns in altitude order', () => {
  const types = new Set(['sentrySweep', 'beamStrike', 'pathPunch', 'rockfall']);
  const patterns = new Set(['left', 'center', 'right', 'gap-left', 'gap-center', 'gap-right']);
  let previous = 0;
  for (const event of map.gauntlet) {
    assert.ok(event.at > previous && event.at < map.summitAlt);
    assert.ok(types.has(event.type));
    assert.ok(patterns.has(event.pattern));
    assert.ok(event.telegraphT >= 2.2 && event.telegraphT <= 4.5);
    previous = event.at;
  }
});

test('Verdant course has authored, reachable terrain decisions', () => {
  assert.ok(map.course);
  assert.ok(map.course.ramps.length >= 3);
  assert.ok(map.course.pits.length >= 2);
  assert.ok(map.course.obstacles.length >= 4);
  for (const [kind, pieces] of Object.entries(map.course)) {
    for (const piece of pieces) {
      assert.ok(piece.at > 0 && piece.at < map.summitAlt, `${kind} altitude is in bounds`);
      assert.ok(Math.abs(piece.x || 0) <= 8, `${kind} remains within the playable lane`);
    }
  }
  assert.ok(map.course.ramps.every(r => r.len > 0 && r.w > 0 && r.h > 0));
  assert.ok(map.course.pits.every(p => p.len > 0 && p.w > 0 && p.depth > 0));
  assert.ok(map.course.obstacles.every(o => ['rock', 'log', 'tree'].includes(o.type) && o.s > 0));
});

test('play shell exposes ASCENT mode, HUD, checkpoints, summit, and bot entry', () => {
  for (const id of ['modeAscent', 'ascentHud', 'ascentAlt', 'summit', 'summitAgainBtn'])
    assert.match(html, new RegExp(`id="${id}"`));
  for (const fn of ['updateAscentCampaign', 'startAscentGauntletEvent', 'completeAscent', 'ascentBotPlaytest'])
    assert.match(html, new RegExp(`function ${fn}\\(`));
});
