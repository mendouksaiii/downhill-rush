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

  assert.match(html, /const GAS_BOOST_CAP = 1(?:\.0)?/);
  assert.match(html, /const JUMP_SPEED_GATE = MAX_SPEED\*0\.78/);
  assert.match(html, /const JUMP_INSANE_SPEED = MAX_SPEED\*0\.96/);
  assert.match(html, /const JUMP_VY_MAX = 9\.4/);
  assert.match(jump, /THREE\.MathUtils\.clamp/);
  assert.match(jump, /t\*t\*\(3-2\*t\)/);
  assert.match(doJump, /jumpImpulseForSpeed\(g\.speed\)/);
  assert.doesNotMatch(doJump, /g\.speed\*0\.045/);
});

test('Space jumps use five rechargeable charges while ramp launches stay free', () => {
  const reset = functionBody('resetRun');
  const doJump = functionBody('doJump');
  const doLaunch = functionBody('doLaunch');
  const updateJumpCharges = functionBody('updateJumpCharges');
  const update = functionBody('update');
  const refresh = functionBody('refreshHUD');

  assert.match(html, /id="jumpbar"/);
  assert.match(html, /id="jumpCharges"/);
  assert.match(html, /const JUMP_CHARGE_MAX = 5/);
  assert.match(html, /const JUMP_RECHARGE_T = /);
  assert.match(reset, /jumpCharges:JUMP_CHARGE_MAX/);
  assert.match(reset, /jumpChargeT:0/);
  assert.match(doJump, /g\.jumpCharges<=0/);
  assert.match(doJump, /g\.jumpCharges--/);
  assert.match(doJump, /jumpImpulseForSpeed\(g\.speed\)/);
  assert.doesNotMatch(doLaunch, /jumpCharges--|jumpChargeT/);
  assert.match(updateJumpCharges, /g\.jumpCharges<JUMP_CHARGE_MAX/);
  assert.match(updateJumpCharges, /g\.jumpChargeT\+=dt/);
  assert.match(updateJumpCharges, /JUMP_RECHARGE_T/);
  assert.match(updateJumpCharges, /Math\.min\(JUMP_CHARGE_MAX/);
  assert.match(update, /updateJumpCharges\(dt,god\)/);
  assert.match(refresh, /jumpFill\.style\.height/);
  assert.match(refresh, /jumpCharges\.textContent/);
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
  const update = functionBody('update');

  assert.match(html, /const GAS_FILL_RATE = 0\.1[0-9]/);
  assert.match(html, /const GAS_BURN_RATE = 0\.3[0-9]/);
  assert.match(html, /const GAS_ACC_MIN = 5\.5, GAS_ACC_MAX = 18/);
  assert.match(html, /const GAS_FULL_CLEAN_T = 6/);
  assert.match(html, /const GAS_BOOST_CAP = 1(?:\.0)?/);
  assert.match(boost, /GAS_ACC_MAX/);
  assert.match(updateGas, /g\.cleanT\/GAS_FULL_CLEAN_T/);
  assert.match(updateGas, /g\.speed<MAX_SPEED\*GAS_BOOST_CAP/);
  assert.match(update, /Math\.min\(g\.speed\+gasBoost\*dt, MAX_SPEED\*GAS_BOOST_CAP\)/);
  assert.doesNotMatch(html, /PEDAL_CAP/);
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

test('death screen can return to the home title instead of only restarting', () => {
  const goHome = functionBody('goHome');

  assert.match(html, /id="homeBtn"/);
  assert.match(html, /id="againBtn"/);
  assert.match(goHome, /resetRun\('title'\)/);
  assert.match(html, /\$\('homeBtn'\)\.addEventListener\('click'[\s\S]*goHome\(\)/);
  assert.match(html, /\$\('againBtn'\)\.addEventListener\('click'[\s\S]*beginRide\(\)/);
});

test('new players get an image-backed tutorial carousel', () => {
  const openTutorial = functionBody('openTutorial');
  const renderTutorial = functionBody('renderTutorial');
  const startRun = functionBody('startRun');
  const keydown = listenerBody('keydown');

  assert.match(html, /id="tutorial"/);
  assert.match(html, /id="tutorialBtn"/);
  assert.match(html, /const TUTORIAL_KEY='dr_tutorial_seen_v1'/);
  assert.match(html, /assets\/tutorial\/slide-steer\.png/);
  assert.match(html, /assets\/tutorial\/slide-jump-ring\.png/);
  assert.match(html, /assets\/tutorial\/slide-overseer\.png/);
  assert.match(html, /#tutorial \{[^}]*overflow-y:auto/);
  assert.match(html, /#tutorial \{[^}]*touch-action:pan-y/);
  assert.match(html, /#tutorialCard \{[^}]*touch-action:pan-y/);
  assert.match(html, /#tutorialCard \{[^}]*max-height:none/);
  assert.match(html, /#tutorialCopy \{[^}]*overflow-y:auto/);
  assert.match(html, /#tutorialCopy \{[^}]*touch-action:pan-y/);
  assert.match(html, /#tutorialCopy \{[^}]*max-height:58vh/);
  assert.match(openTutorial, /tutorialStartAfter=startAfter/);
  assert.match(renderTutorial, /tutorialImg\.src=s\.img/);
  assert.match(startRun, /!tutorialSeen\(\)[\s\S]*openTutorial\(true\)/);
  assert.match(keydown, /tutorialKey\(e\)/);
  assert.match(html, /setTimeout\(\(\)=>\{ if\(state==='title'&&!tutorialOpen\) openTutorial\(false\); \}, 350\)/);
});

test('Kaisei rider render sticks to the source sheet while staying procedural', () => {
  const hair = functionBody('makeKaiseiHair');
  const katana = functionBody('makeKaiseiKatana');
  const bag = functionBody('makeKaiseiBag');
  const emblem = functionBody('makeKaiseiEmblem');

  assert.match(html, /const KAISEI_CORAL=0xff4f6f/);
  assert.match(html, /const KAISEI_SLEEVE=0x8fa4a0/);
  assert.match(html, /const KAISEI_HAIR=0x090a0d/);
  assert.match(html, /const KAISEI_EYE=0xff243c/);
  assert.match(html, /const kaiseiTorsoGeo=/);
  assert.match(html, /const kaiseiFace=/);
  assert.match(html, /const kaiseiJacketBackMark=/);
  assert.match(html, /makeKaiseiKatana\(\)/);
  assert.match(html, /makeKaiseiBag\(\)/);
  assert.match(html, /makeKaiseiEmblem/);
  assert.match(hair, /ConeGeometry/);
  assert.match(hair, /KAISEI_HAIR/);
  assert.match(katana, /katana/);
  assert.match(katana, /diagonal/);
  assert.match(bag, /crossbody/);
  assert.match(emblem, /eight-point/);
});

test('the sky sun becomes the Overseer eye instead of a separate construct', () => {
  const updateEye = functionBody('updateOverseerManifestation');
  const updateLiveAttack = functionBody('updateLiveAttack');

  assert.match(html, /const sunEyeSlitMat=/);
  assert.match(html, /const sunEyeSlit=/);
  assert.match(updateEye, /sunEyeSlitMat\.opacity/);
  assert.match(updateEye, /sunMesh\.material\.color\.lerp/);
  assert.match(updateEye, /sunGlowMat\.color\.lerp/);
  assert.match(updateEye, /overseerEyeWorldPosition\(\)/);
  assert.match(updateLiveAttack, /overseerEyeWorldPosition\(\)/);
  assert.doesNotMatch(html, /const overseerEyeG=new THREE\.Group/);
  assert.doesNotMatch(updateEye, /overseerEyeG|eyeU\./);
});

test('Overseer attacks do not slow rider speed or pull airborne velocity', () => {
  const planAttack = functionBody('planOverseerAttack');
  const addVisual = functionBody('addOverseerAttackVisual');
  const resolveHit = functionBody('resolveOverseerHit');
  const updateAttacks = functionBody('updateOverseerAttacks');
  const drawFX = functionBody('drawFX');
  const reset = functionBody('resetRun');

  assert.doesNotMatch(html, /gravitySnare/);
  assert.doesNotMatch(planAttack, /gravitySnare/);
  assert.doesNotMatch(addVisual, /gravitySnare/);
  assert.doesNotMatch(updateAttacks, /game\.vy\s*[-+*/]?=/);
  assert.doesNotMatch(resolveHit, /stumble\(/);
  assert.match(resolveHit, /crash\('overseer'\)/);
  assert.match(html, /let overseerDarkT=0/);
  assert.match(reset, /overseerDarkT=0/);
  assert.match(updateAttacks, /overseerDarkT=Math\.max\(overseerDarkT,0\.7\)/);
  assert.match(updateAttacks, /shake=Math\.max\(shake,0\.12\)/);
  assert.match(drawFX, /overseerDarkT/);
  assert.match(drawFX, /rgba\(3,0,8/);
});

test('bike speed has no passive timer, pickup, shield, edge, or soft-collider slowdowns', () => {
  const endPower = functionBody('endPower');
  const applyPower = functionBody('applyPower');
  const absorbShield = functionBody('absorbShield');
  const update = functionBody('update');
  const updateHud = functionBody('updatePowerHUD');

  assert.doesNotMatch(html, /slowFactor/);
  assert.doesNotMatch(endPower, /speed\s*=/);
  assert.doesNotMatch(applyPower, /SLOW|speed\*=tier|tier\.slowFactor/);
  assert.doesNotMatch(absorbShield, /speed\s*=/);
  assert.doesNotMatch(update, /g\.speed=Math\.max\(g\.speed-g\.speed\*1\.3\*dt,\s*9\)/);
  assert.doesNotMatch(update, /g\.speed=Math\.max\(9,g\.speed\*Math\.pow\(0\.04,dt\)\)/);
  assert.doesNotMatch(updateHud, /SLOW/);
  assert.match(applyPower, /RED FLARE/);
});

test('account gate requires new players to claim email plus available username', () => {
  const start = functionBody('startRun');
  const refresh = functionBody('refreshAccountGate');
  const check = functionBody('checkUsernameAvailability');

  assert.match(html, /const EMAIL_KEY='dr_email'/);
  assert.match(html, /id="emailInput"/);
  assert.match(html, /id="profileBtn"/);
  assert.match(html, /id="accountHint"/);
  assert.match(html, /function validEmail\(v\)/);
  assert.match(refresh, /const isReturning=!!playerName/);
  assert.match(refresh, /startBtn\.disabled=!canStart/);
  assert.match(refresh, /nameStatus\.textContent='taken'/);
  assert.match(check, /fetch\(LB_API\+'\?me='/);
  assert.match(start, /if\(!canStartRun\) return/);
  assert.match(start, /localStorage\.setItem\(EMAIL_KEY,playerEmail\)/);
});

test('returning local players can ride without adding email', () => {
  const refresh = functionBody('refreshAccountGate');

  assert.match(refresh, /const isReturning=!!playerName/);
  assert.match(refresh, /isReturning \|\| validEmail\(emailInput\.value\)/);
  assert.match(refresh, /emailHint\.textContent=isReturning/);
  assert.match(html, /profileBtn\.hidden=!playerName/);
  assert.match(refresh, /profileBtn\.classList\.toggle\('hidden',!playerName\)/);
});

test('leaderboard metadata stores optional email without exposing it on the public board', () => {
  const submit = functionBody('submitRun');
  const entry = leaderboardApi.slice(
    leaderboardApi.indexOf('function entryFromMeta'),
    leaderboardApi.indexOf('// Upstash returns')
  );

  assert.match(submit, /email:playerEmail/);
  assert.match(leaderboardApi, /const email = /);
  assert.match(leaderboardApi, /email,/);
  assert.doesNotMatch(entry, /email/);
});
