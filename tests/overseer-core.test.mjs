import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefaultOverseerProfile,
  createOverseerRuntime,
  summarizeRunForOverseer,
  updateOverseerProfile
} from '../overseer-core.mjs';

test('high style and greed bias the Overseer toward Trickster bait', () => {
  const overseer = createOverseerRuntime({ seed: 99 });

  overseer.observe({ type: 'style', points: 900, trick: true });
  overseer.observe({ type: 'pickup', power: 'green' });
  overseer.observe({ type: 'pickup', power: 'green' });
  overseer.tick(6, { speed: 62, combo: 5, cleanT: 2, z: 420 });

  const directive = overseer.chooseDirective({ ci: 8, z0: 480, density: 0.6, speed: 62 });
  const snap = overseer.snapshot();

  assert.equal(snap.archetype, 'trickster');
  assert.ok(snap.pressure > 0.45);
  assert.ok(snap.tilt > snap.respect);
  assert.equal(directive.archetype, 'trickster');
  assert.equal(directive.kind, 'bait');
  assert.ok(directive.params.preferGreenGem);
});

test('clean technical play biases the Overseer toward Judge technical traps', () => {
  const overseer = createOverseerRuntime({ seed: 12 });

  for (let i = 0; i < 4; i++) overseer.observe({ type: 'landing', quality: 'perfect' });
  overseer.observe({ type: 'gate', result: 'clean' });
  overseer.tick(8, { speed: 48, combo: 4, cleanT: 10, z: 360 });

  const directive = overseer.chooseDirective({ ci: 7, z0: 420, density: 0.5, speed: 48 });
  const snap = overseer.snapshot();

  assert.equal(snap.archetype, 'judge');
  assert.ok(snap.respect > snap.tilt);
  assert.equal(directive.archetype, 'judge');
  assert.equal(directive.kind, 'technical');
  assert.ok(directive.params.tightenGap > 0);
});

test('repeated quick deaths raise mercy and suppress malicious moves', () => {
  let profile = createDefaultOverseerProfile();
  profile = updateOverseerProfile(profile, summarizeRunForOverseer({
    score: 30,
    distance: 90,
    runT: 6,
    deathCause: 'pit',
    greenPickups: 0,
    perfects: 0
  }));
  profile = updateOverseerProfile(profile, summarizeRunForOverseer({
    score: 45,
    distance: 110,
    runT: 7,
    deathCause: 'pit',
    greenPickups: 0,
    perfects: 0
  }));

  const overseer = createOverseerRuntime({ seed: 3, profile });
  overseer.tick(2, { speed: 20, combo: 0, cleanT: 0, z: 130 });

  const directive = overseer.chooseDirective({ ci: 3, z0: 180, density: 0.25, speed: 20 });
  const snap = overseer.snapshot();

  assert.ok(snap.mercy >= 0.45);
  assert.equal(directive.kind, 'mercy');
  assert.ok(directive.fairness >= 0.8);
  assert.equal(directive.params.suppressBait, true);
});

test('same seed and profile return stable directive kind', () => {
  const profile = {
    ...createDefaultOverseerProfile(),
    greed: 0.4,
    trickSkill: 0.7,
    wallSkill: 0.2,
    archetypeBias: { judge: 0.2, hunter: 0.3, trickster: 0.5 }
  };

  const a = createOverseerRuntime({ seed: 1234, profile });
  const b = createOverseerRuntime({ seed: 1234, profile });

  for (const o of [a, b]) {
    o.observe({ type: 'style', points: 500, trick: true });
    o.observe({ type: 'pickup', power: 'green' });
    o.tick(4, { speed: 55, combo: 3, cleanT: 3, z: 300 });
  }

  const da = a.chooseDirective({ ci: 6, z0: 360, density: 0.4, speed: 55 });
  const db = b.chooseDirective({ ci: 6, z0: 360, density: 0.4, speed: 55 });

  assert.deepEqual(
    { kind: da.kind, archetype: da.archetype, intensity: da.intensity, params: da.params },
    { kind: db.kind, archetype: db.archetype, intensity: db.intensity, params: db.params }
  );
});
