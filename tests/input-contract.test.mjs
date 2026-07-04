import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

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

test('ring timing uses mobile touch taps but not desktop mouse clicks', () => {
  const pointerdown = listenerBody('pointerdown');

  assert.match(pointerdown, /e\.pointerType==='touch'[\s\S]*game\.airborne[\s\S]*airTap\(\)/);
  assert.doesNotMatch(pointerdown, /if\(!pressConsumed && game\.airborne\) airTap\(\)/);
});

test('landing ring is faster and placed per jump', () => {
  const launch = functionBody('doLaunch');

  assert.match(html, /const RING_TIMING_SPAN = 0\.[0-9]+/);
  assert.match(html, /function placeRingRandom\(\)/);
  assert.match(html, /ringWrap\.style\.left=/);
  assert.match(html, /ringWrap\.style\.top=/);
  assert.match(launch, /placeRingRandom\(\)/);
});

test('terrain dropout does not create a generic auto-launch', () => {
  assert.doesNotMatch(html, /doLaunch\(Math\.max\(g\.prevGvy,0\)\)/);
  assert.match(html, /else if\(pitDepthAt\(g\.x,g\.z\)>4\)/);
});
