const clamp01 = v => Math.max(0, Math.min(1, v));
const round2 = v => Math.round(v * 100) / 100;

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(items, rng){
  const total = items.reduce((n, item) => n + Math.max(0, item.weight), 0);
  if(total <= 0) return items[0];
  let roll = rng() * total;
  for(const item of items){
    roll -= Math.max(0, item.weight);
    if(roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function createDefaultOverseerProfile(){
  return {
    version: 1,
    runs: 0,
    dominantStyle: 'unknown',
    greed: 0,
    pitFear: 0,
    wallSkill: 0,
    trickSkill: 0,
    baitSusceptibility: 0,
    frustration: 0,
    tiltBond: 0,
    archetypeBias: { judge: 0.34, hunter: 0.33, trickster: 0.33 },
    recentDeaths: []
  };
}

export function summarizeRunForOverseer(run){
  const distance = Math.max(0, Number(run.distance || 0));
  const runT = Math.max(0, Number(run.runT || 0));
  const score = Math.max(0, Number(run.score || 0));
  const perfects = Math.max(0, Number(run.perfects || 0));
  const greenPickups = Math.max(0, Number(run.greenPickups || 0));
  return {
    score,
    distance,
    runT,
    deathCause: run.deathCause || 'unknown',
    greenPickups,
    perfects,
    quickDeath: runT > 0 && runT < 10 && distance < 180,
    styleRate: runT > 0 ? score / runT : 0
  };
}

export function updateOverseerProfile(profile, summary){
  const base = { ...createDefaultOverseerProfile(), ...(profile || {}) };
  const recentDeaths = [summary.deathCause, ...(base.recentDeaths || [])].slice(0, 6);
  const sameRecent = recentDeaths.filter(d => d === summary.deathCause).length;
  const quickPenalty = summary.quickDeath ? 0.24 : -0.08;
  const greedGain = Math.min(0.18, summary.greenPickups * 0.045);
  const trickGain = Math.min(0.18, summary.perfects * 0.025 + summary.styleRate / 9000);
  const pitFearGain = summary.deathCause === 'pit' ? 0.18 : -0.04;
  const wallSkillGain = summary.deathCause === 'wall' ? -0.08 : (summary.distance > 350 ? 0.04 : 0);
  const frustration = clamp01(base.frustration + quickPenalty + (sameRecent >= 2 ? 0.14 : 0));
  const greed = clamp01(base.greed * 0.88 + greedGain);
  const trickSkill = clamp01(base.trickSkill * 0.9 + trickGain);
  const pitFear = clamp01(base.pitFear * 0.88 + pitFearGain);
  const wallSkill = clamp01(base.wallSkill * 0.92 + wallSkillGain);
  const tiltBond = clamp01(base.tiltBond * 0.94 + Math.min(0.16, summary.score / 9000) + greedGain * 0.3);
  const trickster = clamp01(0.28 + greed * 0.45 + tiltBond * 0.25);
  const judge = clamp01(0.28 + trickSkill * 0.45 + wallSkill * 0.15 - frustration * 0.25);
  const hunter = clamp01(1 - Math.min(0.8, trickster * 0.45 + judge * 0.35));
  const total = Math.max(0.001, judge + hunter + trickster);

  return {
    ...base,
    runs: base.runs + 1,
    dominantStyle: trickSkill > 0.45 ? 'flip-heavy' : base.dominantStyle,
    greed,
    pitFear,
    wallSkill,
    trickSkill,
    baitSusceptibility: clamp01(base.baitSusceptibility * 0.9 + greedGain * 0.7),
    frustration,
    tiltBond,
    archetypeBias: {
      judge: round2(judge / total),
      hunter: round2(hunter / total),
      trickster: round2(trickster / total)
    },
    recentDeaths
  };
}

export function createOverseerRuntime(options = {}){
  const profile = { ...createDefaultOverseerProfile(), ...(options.profile || {}) };
  const rng = mulberry32(options.seed ?? 1);
  const state = {
    pressure: clamp01((profile.tiltBond || 0) * 0.18),
    tilt: clamp01((profile.greed || 0) * 0.35),
    respect: clamp01((profile.trickSkill || 0) * 0.25 + (profile.wallSkill || 0) * 0.2),
    mercy: clamp01((profile.frustration || 0) * 0.8),
    manifestation: clamp01((profile.tiltBond || 0) * 0.25),
    archetype: 'judge',
    trapBudget: 0,
    attackBudget: 0,
    attackCooldown: 0,
    attackShield: 0,
    perfectChain: 0,
    attackCount: 0,
    recentMoves: [],
    events: {
      style: 0,
      greenPickups: 0,
      perfects: 0,
      misses: 0,
      cleanGates: 0,
      attacksDodged: 0,
      attacksHit: 0,
      attacksCountered: 0
    },
    lastDirective: null
  };

  function updateArchetype(){
    const bias = profile.archetypeBias || {};
    const judge = state.respect * 1.4 + (bias.judge || 0) - state.tilt * 0.45 + state.mercy * 0.15;
    const hunter = state.pressure * 1.1 + (bias.hunter || 0) + Math.max(0, state.pressure - state.respect) * 0.45;
    const trickster = state.tilt * 1.45 + (bias.trickster || 0) + (profile.greed || 0) * 0.45
      + state.events.greenPickups * 0.22 - state.mercy * 0.55;
    const best = Object.entries({ judge, hunter, trickster }).sort((a,b) => b[1] - a[1])[0][0];
    state.archetype = best;
  }

  function observe(event){
    if(!event || !event.type) return;
    if(event.type === 'style'){
      const points = Math.max(0, Number(event.points || 0));
      state.events.style += points;
      state.pressure = clamp01(state.pressure + points / 2200);
      state.manifestation = clamp01(state.manifestation + points / 5200);
      if(event.trick) state.tilt = clamp01(state.tilt + points / 3600);
    } else if(event.type === 'landing'){
      if(event.quality === 'perfect'){
        state.events.perfects++;
        state.perfectChain++;
        if(state.perfectChain >= 3){
          state.attackShield = Math.max(state.attackShield, 2);
          state.attackCooldown = Math.max(state.attackCooldown, 2);
        }
        state.respect = clamp01(state.respect + 0.16);
        state.pressure = clamp01(state.pressure + 0.05);
        state.tilt = clamp01(state.tilt - 0.04);
      } else if(event.quality === 'miss'){
        state.events.misses++;
        state.perfectChain = 0;
        state.tilt = clamp01(state.tilt + 0.08);
        state.respect = clamp01(state.respect - 0.04);
      } else if(event.quality === 'good'){
        state.perfectChain = 0;
      }
    } else if(event.type === 'pickup'){
      if(event.power === 'green'){
        state.events.greenPickups++;
        state.tilt = clamp01(state.tilt + 0.12);
        state.pressure = clamp01(state.pressure + 0.04);
      } else if(event.power === 'red'){
        state.mercy = clamp01(state.mercy + 0.04);
      }
    } else if(event.type === 'gate'){
      if(event.result === 'clean'){
        state.events.cleanGates++;
        state.respect = clamp01(state.respect + 0.1);
        state.pressure = clamp01(state.pressure + 0.04);
      }
    } else if(event.type === 'stumble'){
      state.perfectChain = 0;
      state.mercy = clamp01(state.mercy + 0.08);
      state.tilt = clamp01(state.tilt - 0.04);
    } else if(event.type === 'attack'){
      if(event.result === 'dodged'){
        state.events.attacksDodged++;
        state.respect = clamp01(state.respect + 0.16);
        state.pressure = clamp01(state.pressure + 0.05);
        state.tilt = clamp01(state.tilt + 0.16);
        state.attackCooldown = Math.max(state.attackCooldown, 1.5);
      } else if(event.result === 'countered'){
        state.events.attacksCountered++;
        state.respect = clamp01(state.respect + 0.22);
        state.tilt = clamp01(state.tilt - 0.04);
        state.attackShield = Math.max(state.attackShield, 1);
        state.attackCooldown = Math.max(state.attackCooldown, 2.5);
      } else if(event.result === 'hit'){
        state.events.attacksHit++;
        state.perfectChain = 0;
        state.mercy = clamp01(state.mercy + 0.14);
        state.tilt = clamp01(state.tilt - 0.1);
        state.attackCooldown = Math.max(state.attackCooldown, 2);
      }
    }
    updateArchetype();
  }

  function tick(dt, game = {}){
    const speed = Math.max(0, Number(game.speed || 0));
    const combo = Math.max(0, Number(game.combo || 0));
    const cleanT = Math.max(0, Number(game.cleanT || 0));
    const z = Math.max(0, Number(game.z || 0));
    const progressGate = clamp01((z - 520) / 520);
    state.pressure = clamp01(state.pressure + (dt * 0.004 + combo * 0.007 + Math.max(0, speed - 38) / 1250) * (0.35 + progressGate * 0.65));
    state.respect = clamp01(state.respect + Math.min(0.04, cleanT / 800));
    state.trapBudget = clamp01(state.pressure * 0.75 + state.tilt * 0.35 - state.mercy * 0.55);
    state.attackBudget = clamp01(state.manifestation * 0.48 + Math.max(0, z - 820) / 2100 - state.mercy * 0.5);
    state.attackCooldown = Math.max(0, state.attackCooldown - dt);
    state.manifestation = clamp01(state.manifestation + Math.max(0, state.pressure - 0.62) * dt * 0.012 + state.tilt * dt * 0.007 * (0.4 + progressGate * 0.6));
    updateArchetype();
  }

  function chooseDirective(context = {}){
    const density = clamp01(Number(context.density || 0));
    const speed = Math.max(0, Number(context.speed || 0));
    updateArchetype();

    if(state.mercy >= 0.45){
      const directive = {
        kind: 'mercy',
        archetype: state.archetype,
        intensity: round2(Math.max(0.15, 0.5 - state.mercy * 0.35)),
        fairness: 0.9,
        telegraph: 0.9,
        budgetCost: 0,
        params: { suppressBait: true, trapChanceScale: 0.35, gapBonus: 1.4 }
      };
      state.lastDirective = directive;
      state.recentMoves = [directive.kind, ...state.recentMoves].slice(0, 5);
      return directive;
    }

    const canAttack = state.attackBudget > 0.32 && state.manifestation > 0.44
      && state.attackCooldown <= 0 && state.attackShield <= 0 && Number(context.z0 || 0) >= 900;
    if(canAttack){
      const attackTypes = {
        judge: ['mirrorGate', 'collapsePulse', 'redEyeSweep'],
        hunter: ['redEyeSweep', 'mirrorGate', 'collapsePulse'],
        trickster: ['falseGift', 'mirrorGate', 'redEyeSweep']
      }[state.archetype] || ['redEyeSweep'];
      const attackType = attackTypes[Math.floor(rng() * attackTypes.length)];
      const intensity = round2(clamp01(0.35 + state.attackBudget * 0.42 + state.pressure * 0.18));
      const directive = {
        kind: 'attack',
        archetype: state.archetype,
        intensity,
        fairness: round2(clamp01(0.68 + state.respect * 0.2 - state.tilt * 0.18)),
        telegraph: round2(clamp01(0.62 + state.respect * 0.15 - Math.max(0, speed - 60) / 180)),
        budgetCost: 3,
        params: {
          attackType,
          cooldown: round2(4.5 + intensity * 3),
          trapChanceScale: attackType === 'falseGift' ? 1.45 : 1.15,
          preferGreenGem: attackType === 'falseGift',
          pitBias: attackType === 'collapsePulse' ? 0.82 : 0.55,
          tightenGap: attackType === 'mirrorGate' ? round2(0.8 + intensity * 0.8) : 0
        }
      };
      state.attackCooldown = directive.params.cooldown;
      state.attackCount++;
      state.lastDirective = directive;
      state.recentMoves = [directive.kind, ...state.recentMoves].slice(0, 5);
      return directive;
    }

    if(state.attackShield > 0 && state.attackBudget > 0.25){
      state.attackShield = Math.max(0, state.attackShield - 1);
      state.attackCooldown = Math.max(state.attackCooldown, 3);
    }

    const repeatPenalty = kind => state.recentMoves.filter(m => m === kind).length * 0.16;
    const candidates = [
      {
        kind: 'technical',
        weight: (state.archetype === 'judge' ? 1.2 : 0.25) + state.respect * 0.9 + density * 0.3 - repeatPenalty('technical')
      },
      {
        kind: 'bait',
        weight: (state.archetype === 'trickster' ? 1.35 : 0.2) + state.tilt * 1.1 + (profile.greed || 0) * 0.4 - repeatPenalty('bait')
      },
      {
        kind: 'collapse',
        weight: (state.archetype === 'hunter' ? 0.85 : 0.25) + state.pressure * 0.75 + Math.max(0, speed - 45) / 80 - repeatPenalty('collapse')
      },
      {
        kind: 'calm',
        weight: 0.25 + state.mercy * 0.8 + Math.max(0, 0.25 - state.pressure)
      }
    ];
    const picked = weightedPick(candidates, rng);
    const kind = picked.kind;
    const intensity = round2(clamp01(0.22 + state.pressure * 0.42 + state.tilt * 0.24 + density * 0.16 - state.mercy * 0.36));
    const directive = {
      kind,
      archetype: state.archetype,
      intensity,
      fairness: round2(clamp01(0.74 + state.respect * 0.18 - state.tilt * 0.32 + state.mercy * 0.18)),
      telegraph: round2(clamp01(0.55 + state.respect * 0.18 - Math.max(0, speed - 60) / 160)),
      budgetCost: kind === 'calm' ? 0 : 1 + Math.round(intensity * 2),
      params: {}
    };
    if(kind === 'bait'){
      directive.params.preferGreenGem = true;
      directive.params.pitBias = round2(clamp01(0.45 + state.tilt * 0.45));
      directive.params.trapChanceScale = round2(1.1 + intensity * 0.45);
    } else if(kind === 'technical'){
      directive.params.tightenGap = round2(0.35 + intensity * 0.9);
      directive.params.trapChanceScale = round2(1 + intensity * 0.28);
    } else if(kind === 'collapse'){
      directive.params.pitBias = round2(clamp01(0.35 + state.pressure * 0.35));
      directive.params.trapChanceScale = round2(1.05 + intensity * 0.4);
    } else {
      directive.params.trapChanceScale = 0.7;
      directive.params.gapBonus = 0.7;
    }
    state.lastDirective = directive;
    state.recentMoves = [directive.kind, ...state.recentMoves].slice(0, 5);
    return directive;
  }

  function finishRun(run){
    return summarizeRunForOverseer({
      ...run,
      greenPickups: run?.greenPickups ?? state.events.greenPickups,
      perfects: run?.perfects ?? state.events.perfects
    });
  }

  function snapshot(){
    updateArchetype();
    return {
      pressure: round2(state.pressure),
      tilt: round2(state.tilt),
      respect: round2(state.respect),
      mercy: round2(state.mercy),
      manifestation: round2(state.manifestation),
      archetype: state.archetype,
      trapBudget: round2(state.trapBudget),
      attackBudget: round2(state.attackBudget),
      attackCooldown: round2(state.attackCooldown),
      attackShield: round2(state.attackShield),
      perfectChain: state.perfectChain,
      attackCount: state.attackCount,
      recentMoves: [...state.recentMoves],
      events: { ...state.events },
      lastDirective: state.lastDirective ? { ...state.lastDirective, params: { ...state.lastDirective.params } } : null
    };
  }

  updateArchetype();
  return { observe, tick, chooseDirective, finishRun, snapshot };
}
