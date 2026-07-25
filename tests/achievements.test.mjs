/* Achievement catalogue + engine contract.
 *
 * "Attainable" is the whole requirement, so it is enforced mechanically: every
 * achievement must reference a stat the tracker actually writes, and the
 * tracker must actually write every stat the catalogue references. A typo in
 * either direction produces an achievement that can never unlock -- and, being
 * data, it would fail silently in the UI rather than throwing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACHIEVEMENTS, STAT_KEYS, TOTAL_COINS, isEarned } from '../achievements-data.js';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('the catalogue is exactly 150 achievements with unique ids', () => {
  assert.equal(ACHIEVEMENTS.length, 150, `expected 150, got ${ACHIEVEMENTS.length}`);
  const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
  assert.equal(ids.size, 150, 'duplicate achievement id');
  const names = new Set(ACHIEVEMENTS.map((a) => a.name));
  assert.equal(names.size, 150, 'duplicate achievement name');
});

test('every achievement is well formed and pays coins', () => {
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.name && a.name.length > 2, `${a.id}: missing name`);
    assert.ok(a.desc && a.desc.length > 5, `${a.id}: missing description`);
    assert.ok(Number.isFinite(a.goal) && a.goal > 0, `${a.id}: goal must be a positive number`);
    assert.ok(Number.isInteger(a.coins) && a.coins > 0, `${a.id}: must pay coins`);
    assert.ok(['descent', 'ascent', 'any'].includes(a.mode), `${a.id}: bad mode ${a.mode}`);
    assert.ok(a.cat, `${a.id}: missing category`);
  }
});

test('every achievement targets a stat the tracker records', () => {
  // catalogue -> tracker
  for (const a of ACHIEVEMENTS) {
    assert.ok(STAT_KEYS.includes(a.stat), `${a.id} targets unknown stat "${a.stat}"`);
  }
  // tracker -> play.html: BLANK_STATS is the runtime schema
  const from = html.indexOf('const BLANK_STATS={');
  assert.notEqual(from, -1, 'BLANK_STATS not found in play.html');
  const schema = html.slice(from, html.indexOf('};', from));
  for (const k of STAT_KEYS) {
    assert.match(schema, new RegExp(`\\b${k}\\s*:`), `tracker never initialises "${k}"`);
  }
});

test('both modes are meaningfully covered', () => {
  const n = (m) => ACHIEVEMENTS.filter((a) => a.mode === m).length;
  assert.ok(n('descent') >= 40, `descent only has ${n('descent')}`);
  assert.ok(n('ascent') >= 25, `ascent only has ${n('ascent')}`);
  assert.ok(n('any') >= 25, `shared only has ${n('any')}`);
});

test('tiered ladders are strictly ascending, so progress never goes backwards', () => {
  const byBase = {};
  for (const a of ACHIEVEMENTS) {
    const base = a.id.replace(/_\d+$/, '');
    (byBase[base] ||= []).push(a);
  }
  for (const [base, list] of Object.entries(byBase)) {
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1], cur = list[i];
      if (cur.cmp === 'lte') {
        assert.ok(cur.goal < prev.goal, `${base}: "lower is better" tier ${cur.id} is not harder`);
      } else {
        assert.ok(cur.goal > prev.goal, `${base}: tier ${cur.id} is not harder than ${prev.id}`);
      }
      assert.ok(cur.coins >= prev.coins, `${base}: ${cur.id} pays less than an easier tier`);
    }
  }
});

test('isEarned handles totals and "under X" times correctly', () => {
  assert.equal(isEarned({ stat: 'runs', goal: 10 }, { runs: 10 }), true);
  assert.equal(isEarned({ stat: 'runs', goal: 10 }, { runs: 9 }), false);
  assert.equal(isEarned({ stat: 'runs', goal: 10 }, {}), false);
  // a time of 0 means "never summited" and must NOT satisfy an under-X goal
  const fast = { stat: 'summitFastT', goal: 180, cmp: 'lte' };
  assert.equal(isEarned(fast, { summitFastT: 0 }), false);
  assert.equal(isEarned(fast, { summitFastT: 179 }), true);
  assert.equal(isEarned(fast, { summitFastT: 181 }), false);
});

test('unlocks pay out exactly once', () => {
  // the engine must consult the earned set before granting
  const from = html.indexOf('function checkAchievements(');
  assert.notEqual(from, -1, 'checkAchievements not found');
  const body = html.slice(from, html.indexOf('\n}', from));
  assert.match(body, /achEarned\.has\(a\.id\)/, 'must skip already-earned achievements');
  assert.match(body, /achEarned\.add\(a\.id\)/, 'must record the unlock');
  assert.match(body, /Economy\.grant\(/, 'must pay coins through Economy.grant');
  assert.match(body, /saveAch\(\)/, 'must persist the earned set');
});

test('cascading unlocks settle in a single call', () => {
  // paying an unlock raises coinsEarned, which can satisfy a coin achievement.
  // Without a fixed-point loop the player only gets it one run later.
  const from = html.indexOf('function checkAchievements(');
  const body = html.slice(from, html.indexOf('\n}', from));
  assert.match(body, /for\s*\(\s*let pass\s*=\s*0/, 'must iterate until no new unlocks');
  assert.match(body, /break;/, 'the loop must be bounded and exit when stable');
});

test('peak speed is tracked independently of audio', () => {
  // it was sampled inside refreshHUD's `if(AC)` block, so speedBest stayed 0
  // whenever no AudioContext existed -- every speed achievement unreachable
  const from = html.indexOf('function refreshHUD(');
  const body = html.slice(from, html.indexOf('\n}', from));
  const speedLine = body.indexOf('game.speedPeak=game.speed');
  const audioBlock = body.indexOf('if(AC){');
  assert.notEqual(speedLine, -1, 'peak speed is never sampled');
  assert.ok(speedLine < audioBlock, 'peak speed must be sampled before/outside the audio block');
});

test('both run endings fold into the stats', () => {
  // crash AND summit -- missing the summit hook would make every ascent
  // achievement unreachable, which is the exact failure mode being guarded
  assert.match(html, /recordRun\(\{summited:false\}\)/, 'showDeath must record the run');
  assert.match(html, /recordRun\(\{summited:true\}\)/, 'completeAscent must record the summit');
});

test('summiting pays coins', () => {
  // it previously paid nothing: you could climb the whole mountain and earn 0
  const from = html.indexOf('function completeAscent(');
  const body = html.slice(from, html.indexOf('\n}', from));
  assert.match(body, /Economy\.awardRun\(/, 'reaching the summit must award coins');
});

test('the catalogue module is precached and the cache version bumped', () => {
  const from = sw.indexOf('const PRECACHE = [');
  const precache = sw.slice(from, sw.indexOf('];', from));
  assert.match(precache, /achievements-data\.js/, 'achievements-data.js must be precached');
  assert.doesNotMatch(sw, /redline-v6'/, 'CACHE must be bumped when PRECACHE changes');
});

test('total payout is balanced against the market', () => {
  // completing all 150 should be worth real money but not trivialise the shop
  assert.ok(TOTAL_COINS > 50_000, `total ${TOTAL_COINS} is too low to motivate`);
  assert.ok(TOTAL_COINS < 300_000, `total ${TOTAL_COINS} would break the economy`);
});
