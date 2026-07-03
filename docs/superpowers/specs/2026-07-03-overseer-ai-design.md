# Overseer AI Design

## Summary

Add a lightweight adaptive enemy director called the Overseer. It starts invisible, watches player behavior, increases difficulty through traps and attacks as the player earns style, and gradually manifests as glitches, voice fragments, a red eye in the sky, then a rare looming body. The implementation should feel autonomous like the poker bot: small local memory, scored decisions, clear feedback loops, no LLM or network dependency in active gameplay.

The design uses a poker-bot style scored policy. Every chunk, the Overseer scores possible moves against current player behavior, archetype, trap budget, mercy state, and recent outcomes. It adapts within a run, across a session through `localStorage`, and later through an optional durable Worldline/Walrus memory adapter.

## Goals

- Make the mountain feel like it learns the player.
- Scale difficulty from fair to malicious depending on player behavior.
- Reward skill and choices with meaningful pushback against the Overseer.
- Keep the runtime lightweight and deterministic enough to test.
- Preserve endless downhill runner flow: traps and terrain remain the main threat.
- Leave room for future Worldline/Walrus canon memory without blocking gameplay.

## Non-Goals

- No browser-side LLM calls during gameplay.
- No network dependency for trap decisions.
- No weapon/combat loop that distracts from riding.
- No fully random unfair trap spam.
- No long raw frame logs in persistent memory.

## Core Architecture

### `OverseerRuntime`

Lives in memory and resets each run.

Responsibilities:
- Track current pressure, mood, archetype, manifestation, attack cooldowns, and mercy windows.
- Observe live player signals every frame or chunk.
- Score candidate trap/attack moves at chunk generation time.
- Produce a compact `OverseerDirective` that terrain generation can consume.

Suggested state:

```js
{
  pressure: 0,
  tilt: 0,
  respect: 0,
  manifestation: 0,
  archetype: "judge",
  trapBudget: 0,
  attackBudget: 0,
  mercy: 0,
  lastMove: null,
  recentMoves: []
}
```

### `OverseerSessionMemory`

Lives in `localStorage` and updates after each run.

Responsibilities:
- Store last 5-20 run summaries.
- Track player tendencies and recent frustration.
- Seed the next run's Overseer bias.

Suggested profile:

```js
{
  version: 1,
  runs: 12,
  dominantStyle: "flip-heavy",
  greed: 0.72,
  pitFear: 0.44,
  wallSkill: 0.68,
  trickSkill: 0.79,
  baitSusceptibility: 0.61,
  frustration: 0.28,
  tiltBond: 0.81,
  archetypeBias: {
    judge: 0.25,
    hunter: 0.35,
    trickster: 0.40
  }
}
```

### `OverseerProfileMemory`

Optional future adapter. It should never be needed for active gameplay.

Responsibilities:
- Export compact rivalry summaries.
- Store mythic progression and player identity.
- Later sync to Worldline or Walrus after runs.

Recommendation:
- Use Worldline for canon/lore progression: "the mountain remembers you."
- Use Walrus/BOUND-style memory only if we want verifiable run history or portable proof.
- Keep all remote writes asynchronous and failure-tolerant.

## Observed Player Signals

The Overseer should not read raw controls directly. It should observe gameplay outcomes.

Signals:
- Style score gained per window.
- Combo level and combo growth rate.
- Clean riding time.
- Speed and speed streaks.
- Perfect/good/miss landing counts.
- Full trick count and partial trick count.
- Green gem pickups and ignored bait lines.
- Pit deaths, wall deaths, off-track crashes, cased landings.
- Near misses and recoveries.
- Attack dodges and attack hits.

Derived traits:
- `greed`: rises when the player chases gems, speed boosts, or risky bait.
- `technicalSkill`: rises from perfects, narrow gates, clean trick landings.
- `survivalSkill`: rises from long high-speed runs and recoveries.
- `frustration`: rises from repeated fast deaths or repeated same-cause deaths.
- `overconfidence`: rises from high style with low danger exposure.

## Archetypes

The Overseer has three semi-readable archetypes. One is dominant, but scores can blend.

### Judge

Triggered by clean skilled play.

Behavior:
- Fair but severe.
- Uses technical lines, tighter gates, sharper trap timing.
- Avoids cheap bait unless player starts exploiting safe patterns.

Visual/audio tells:
- Narrow geometric red eye.
- Sharp glitch clicks.
- Symmetrical trap layouts.

Pushback:
- Perfect chains reduce Judge pressure.
- Clean technical lines earn respect and create brief mercy windows.

### Hunter

Triggered by long survival, high speed, near misses, and strong recovery.

Behavior:
- Pursuit pressure.
- Uses red-eye sweeps, collapse pulses, and attacks after airtime.
- Increases tempo rather than deception.

Visual/audio tells:
- Eye tracks rider.
- Low chase tone or heartbeat.
- Longer red sky presence.

Pushback:
- Calm recovery after a scare lowers Hunter pressure.
- Perfect landing during an attack cancels or delays the next attack.

### Trickster

Triggered by greed, style farming, repeated bait pickups, and overconfidence.

Behavior:
- Malicious ragebait.
- Uses false gifts, fake ramps, shifting gates, delayed pits, suspicious gem chains.
- Cheats the least when the player refuses bait.

Visual/audio tells:
- Irregular eye blink.
- Playful corrupted glitches.
- Gems or markers form suspicious patterns.

Pushback:
- Ignoring obvious bait weakens Trickster influence.
- Choosing a harder honest lane over an easy reward lane lowers tilt.

## Manifestation

Manifestation is separate from raw difficulty but driven by pressure, style, survival, and long-term rivalry.

Levels:

1. **Invisible**
   - No explicit presence.
   - Only adaptive trap decisions happen.

2. **Anomaly**
   - Small UI flickers, sound glitches, red scanline flashes.
   - Triggers after high style gains, repeated bait, or long clean survival.

3. **Voice**
   - Short fragments only, no dialogue engine.
   - Examples: "again", "reach", "run", "prove it", "I see your line".

4. **Red Eye**
   - Eye appears in the sky or horizon.
   - Shape and movement reflect archetype.
   - Unlocks rare direct attacks.

5. **Body**
   - Rare late-run silhouette behind clouds/mountains.
   - Mostly atmospheric, but marks max tilt or major rivalry moments.

Manifestation should decay after crashes or mercy periods, but long-term `tiltBond` can make it appear earlier in later runs.

## Move System

Every new chunk, the Overseer receives a list of candidate moves. It scores them and emits one directive or chooses calm.

Candidate move categories:
- `calm`: recovery terrain, fewer hazards, honest ramps.
- `technical`: tighter walls, jump lines, narrow gates.
- `bait`: gem line over danger, suspicious green boost, false gift.
- `collapse`: delayed pit, sudden high-rise, terrain betrayal.
- `attack`: red-eye sweep, collapse pulse, gravity snare, mirror gate.
- `mercy`: clear lane after frustration or repeated same-cause deaths.

Directive shape:

```js
{
  kind: "bait",
  archetype: "trickster",
  intensity: 0.62,
  fairness: 0.38,
  telegraph: 0.55,
  budgetCost: 2,
  params: {
    preferGreenGem: true,
    pitBias: 0.8
  }
}
```

Scoring inputs:
- Current archetype.
- Current pressure and tilt.
- Available trap/attack budget.
- Recent move repetition penalty.
- Player strengths and weaknesses.
- Frustration and mercy.
- Distance since last direct attack.
- Whether the move has enough telegraph time at current speed.

The scorer should use weighted randomness, not always the max score. That keeps it alive without becoming unreadable.

## Difficulty Model

Pressure rises from:
- Style gain.
- High combo.
- Long clean survival.
- High speed streaks.
- Repeated successful pushback.

Tilt rises from:
- Greed.
- Style farming safe patterns.
- Ignoring danger repeatedly.
- Beating direct attacks.

Respect rises from:
- Perfect chains.
- Clean technical play.
- Refusing bait.
- Recovering from danger without panic.

Mercy rises from:
- Repeated quick deaths.
- Repeated same-cause deaths.
- Low score before death.
- Consecutive failed runs.

Pressure increases difficulty. Tilt makes the Overseer more malicious. Respect makes it more fair. Mercy suppresses stacked traps.

## Direct Attacks

Direct attacks are rare and budgeted. They should feel like terrain language, not a boss fight.

Initial attack set:

- **Red Eye Sweep**
  - A lane is painted red, then a beam sweeps it.
  - Dodge by changing lane or threading the safe gap.

- **Collapse Pulse**
  - Ground ahead flashes, then a pit opens or wall rises.
  - Dodge by jumping, steering, or taking the honest lane.

- **Gravity Snare**
  - During big airtime, the eye tugs the rider down.
  - Counter with clean rotation/landing timing.

- **False Gift**
  - Gem line appears attractive, but the final reward is unsafe.
  - Counter by refusing the line or using shield.

- **Mirror Gate**
  - A gate marker shifts left/right at the last beat.
  - Counter by reading the final tell, not the first tell.

Each attack needs:
- Minimum telegraph time based on current speed.
- Cooldown.
- Max count per distance band.
- Escape/counter path.

## Pushback

Pushback is ridecraft: execution plus decisions.

Always active:
- Perfect landings reduce tilt.
- Perfect chains delay direct attacks.
- Clean trick landings under pressure convert danger into speed.
- Refusing bait weakens Trickster.
- Calm recovery lowers Hunter pressure.
- Clean technical lines earn Judge respect.

Explicit late-run pushback:
- **Perfect Chain Break**: 3 perfect landings cancels next direct attack.
- **Refuse the Gift**: ignoring a suspicious gem chain reduces Trickster and grants score/respect.
- **Eye Break Window**: pass through a narrow safe gate during a red-eye attack to silence attacks briefly.
- **Style Counter**: land a full trick during an attack warning to gain speed and reduce tilt.

No weapons. The player fights back by riding better.

## Data Flow

```txt
Gameplay events
  -> OverseerObserver
  -> Runtime metrics
  -> Archetype + pressure + tilt + respect + mercy
  -> Move scorer at chunk generation
  -> OverseerDirective
  -> terrain/trap/attack generation
  -> event feedback
  -> run summary
  -> localStorage session memory
  -> optional Worldline/Walrus export after run
```

## Integration Points

Current `index.html` already has:
- Chunk generation through `genChunk(ci)`.
- Existing rage traps: pits and high-rise walls.
- Powerups and bait gem lines.
- Trick scoring and combo.
- `DR` debug hooks for deterministic tests.

Implementation should add an Overseer module section inside `index.html` first, then consider extraction only if the file becomes too hard to work in.

Likely integration points:
- At `resetRun`: initialize runtime from session memory.
- During update loop: observe live metrics.
- During `genChunk`: request `OverseerDirective` before generating traps.
- During landing/trick/powerup/death events: emit meaningful gameplay events.
- During `showDeath`: write run summary to session memory.
- In rendering: draw manifestation effects and red eye.

## Testing Strategy

Use deterministic debug hooks through `window.DR`.

Static checks:
- Extract module script and run `node --check`.
- Run `git diff --check`.

Runtime checks:
- Start local static server.
- Use headless Chrome with system Chrome executable.
- Verify game loads with no page errors.
- Force high style and confirm pressure/manifestation rise.
- Force repeated pit deaths and confirm mercy increases.
- Force green-gem greed and confirm Trickster bias rises.
- Force perfect chains and confirm attack cooldown or cancellation.
- Force direct attack directives and confirm they have cooldowns and telegraphs.

Unit-style debug checks:
- Same input profile and seed produces same directive distribution.
- Move scorer avoids repeating same move too often.
- Mercy suppresses stacked traps after repeated quick deaths.
- No remote memory failure can block gameplay.

## Rollout Plan

Build in phases:

1. Runtime observer and scored move policy.
2. Session memory and run summaries.
3. Trap directive integration for pits/walls/bait.
4. Manifestation visuals/audio: anomaly, voice, red eye.
5. Direct attacks and pushback.
6. Optional Worldline/Walrus adapter stub.

The first implementation should ship with local/session memory only. Durable memory can be an interface and stub until the game loop feels right.

## Open Implementation Decisions

- Exact numbers for pressure, tilt, respect, and mercy weights should be tuned from browser simulations.
- Red eye/body art can start as procedural Three.js meshes and later be replaced with authored assets.
- Worldline/Walrus adapter should not be implemented until local run summaries are stable.
