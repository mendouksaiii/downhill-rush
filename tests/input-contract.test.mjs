import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const leaderboardApi = readFileSync(new URL('../api/leaderboard.js', import.meta.url), 'utf8');

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
  throw new Error(`unterminated function ${name}`);
}

function listenerBody(eventName) {
  const marker = `addEventListener('${eventName}',`;
  const inputSection = html.indexOf('/* ============================== INPUT');
  assert.notEqual(inputSection, -1, 'missing input section');
  const start = html.indexOf(marker, inputSection);
  assert.notEqual(start, -1, `missing ${eventName} listener`);
  const arrow = html.indexOf('=>{', start);
  const brace = html.indexOf('{', arrow);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${eventName} listener`);
}

test('desktop A is reserved for airborne ring timing, not steering', () => {
  const keydown = listenerBody('keydown');
  const steer = functionBody('readSteer');

  assert.match(keydown, /e\.code==='KeyA'[\s\S]*airTap\(\)/);
  assert.doesNotMatch(steer, /keys\.KeyA|keys\.KeyD/);
});

test('ground jumps only come from keyboard Space, not pointer taps', () => {
  const keydown = listenerBody('keydown');
  const pointerup = listenerBody('pointerup');

  assert.match(keydown, /e\.code==='Space'[\s\S]*!game\.airborne[\s\S]*doJump\(\)/);
  assert.doesNotMatch(pointerup, /doJump\(\)/);
});

test('ArrowUp accelerates without feeding air trick input', () => {
  const pedal = functionBody('pedalHeld');
  const flip = functionBody('readFlip');

  assert.match(pedal, /keys\.ArrowUp/);
  assert.doesNotMatch(flip, /keys\.ArrowUp/);
});

test('held acceleration and speed-based jump height are capped', () => {
  const jump = functionBody('jumpImpulseForSpeed');
  const doJump = functionBody('doJump');

  assert.match(html, /const PEDAL_CAP = 0\.6[0-9]/);
  assert.match(html, /const JUMP_SPEED_GATE = MAX_SPEED\*0\.78/);
  assert.match(html, /const JUMP_INSANE_SPEED = MAX_SPEED\*0\.96/);
  assert.match(html, /const JUMP_VY_MAX = 9\.4/);
  assert.match(jump, /THREE\.MathUtils\.clamp/);
  assert.match(jump, /t\*t\*\(3-2\*t\)/);
  assert.match(doJump, /jumpImpulseForSpeed\(g\.speed\)/);
  assert.doesNotMatch(doJump, /g\.speed\*0\.045/);
});

test('gas meter gates player acceleration progression', () => {
  const reset = functionBody('resetRun');
  const updateGas = functionBody('updateGas');
  const burn = functionBody('burnGasForBoost');
  const refresh = functionBody('refreshHUD');
  const stumble = functionBody('stumble');
  const absorbShield = functionBody('absorbShield');

  assert.match(html, /id="gasbar"/);
  assert.match(html, /id="gasfill"/);
  assert.match(html, /const GAS_FILL_RATE = /);
  assert.match(html, /const GAS_BURN_RATE = /);
  assert.match(reset, /gas:0/);
  assert.match(updateGas, /cleanT/);
  assert.match(updateGas, /pedalHeld\(\)/);
  assert.match(updateGas, /burnGasForBoost\(dt\)/);
  assert.match(burn, /GAS_BURN_RATE\*dt/);
  assert.match(burn, /boostAccelForGas\(gas0\)/);
  assert.match(refresh, /gasFill\.style\.height/);
  assert.match(stumble, /g\.gas=0/);
  assert.match(absorbShield, /game\.gas=0/);
  assert.doesNotMatch(html, /PEDAL_ACC/);
});

test('gas acceleration tuning is responsive without being free', () => {
  const boost = functionBody('boostAccelForGas');
  const updateGas = functionBody('updateGas');

  assert.match(html, /const GAS_FILL_RATE = 0\.1[0-9]/);
  assert.match(html, /const GAS_BURN_RATE = 0\.3[0-9]/);
  assert.match(html, /const GAS_ACC_MIN = 5\.5, GAS_ACC_MAX = 18/);
  assert.match(html, /const GAS_FULL_CLEAN_T = 6/);
  assert.match(boost, /GAS_ACC_MAX/);
  assert.match(updateGas, /g\.cleanT\/GAS_FULL_CLEAN_T/);
});

test('hang time is tracked as a personal and leaderboard stat', () => {
  const reset = functionBody('resetRun');
  const showDeath = functionBody('showDeath');
  const submitRun = functionBody('submitRun');
  const renderLB = functionBody('renderLB');

  assert.match(html, /id="dHang"/);
  assert.match(reset, /hangT:0/);
  assert.match(showDeath, /\$\('dHang'\)\.textContent=fmtT\(game\.hangT\)/);
  assert.match(showDeath, /submitRun\(game\.runT, game\.score, game\.z-game\.dist0, game\.hangT\)/);
  assert.match(submitRun, /hang:\+hang\.toFixed\(1\)/);
  assert.match(renderLB, /e\.hang/);
  assert.match(leaderboardApi, /const hang = /);
  assert.match(leaderboardApi, /rankValue/);
  assert.match(leaderboardApi, /hang/);
});

test('powerups are tiered with rare gold as the strongest tier', () => {
  const applyPower = functionBody('applyPower');
  const choosePowerTier = functionBody('choosePowerTier');

  assert.match(html, /const POWER_TIERS = /);
  assert.match(html, /white:\{[^}]*speedFactor:1\.18/);
  assert.match(html, /gold:\{[^}]*speedFactor:1\.55/);
  assert.match(html, /gold:\{[^}]*weight:0\.08/);
  assert.match(choosePowerTier, /POWER_TIERS\.gold\.weight/);
  assert.match(html, /tier:choosePowerTier\(rng\)/);
  assert.match(html, /puMats\[p\.tier\]/);
  assert.match(html, /applyPower\(p\.type,p\.tier\)/);
  assert.match(applyPower, /POWER_TIERS\[tierId\]/);
  assert.doesNotMatch(applyPower, /Math\.min\(2, MAX_SPEED/);
});

test('ring timing uses mobile touch taps but not desktop mouse clicks', () => {
  const pointerdown = listenerBody('pointerdown');

  assert.match(pointerdown, /e\.pointerType==='touch'[\s\S]*game\.airborne[\s\S]*airTap\(\)/);
  assert.doesNotMatch(pointerdown, /if\(!pressConsumed && game\.airborne\) airTap\(\)/);
});

test('landing ring is faster and placed per jump', () => {
  const launch = functionBody('doLaunch');
  const draw = functionBody('drawRing');

  assert.match(html, /const RING_TIMING_SPAN = 0\.[0-9]+/);
  assert.match(html, /function placeRingRandom\(\)/);
  assert.match(html, /ringWrap\.style\.left=/);
  assert.match(html, /ringWrap\.style\.top=/);
  assert.match(launch, /placeRingRandom\(\)/);
  assert.match(draw, /gameT\*8/);
  assert.match(draw, /ringCtx\.setLineDash/);
  assert.match(draw, /ringCtx\.arc\(c,c,r,spin,spin\+Math\.PI\*1\.55\)/);
  assert.match(draw, /pulse/);
});

test('terrain dropout does not create a generic auto-launch', () => {
  assert.doesNotMatch(html, /doLaunch\(Math\.max\(g\.prevGvy,0\)\)/);
  assert.match(html, /else if\(pitDepthAt\(g\.x,g\.z\)>4\)/);
});
