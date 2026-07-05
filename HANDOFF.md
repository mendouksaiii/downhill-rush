# HANDOFF — Downhill Rush working state

> Live working doc. Update after every completed step. If you're a fresh agent:
> read CLAUDE.md first (constraints + territory split), then this.

## Context
- Repo: mendouksaiii/downhill-rush. We are **ronkenx9** (physics/graphics territory, `index.html`).
- Active branch: `feat/gameplay-v2` → [PR #4](https://github.com/mendouksaiii/downhill-rush/pull/4). Contains: Rapier solid physics, jump/tricks, rage traps, research-brief tuning, Overseer AI (built by a parallel session — don't break it), rider attack-stance rebuild.
- Friend (mendouksaiii) owns shop/skins. PR #7 (skins restyle) approved. Issue #6 (kill-rings) answered — closes with #4.
- Test loop: `npx http-server . -p 5610` (or preview server), then drive deterministically from console: `DR.step(1/60)` in loops; `DR.start()`, `DR.doJump()`, `DR.freeze()`, `DR.game`, `DR.pitsByChunk/wallsByChunk`. Tab-hidden pauses rAF — DR.step bypasses. Syntax check: extract `<script type="module">` → esbuild.
- Gotchas: `mergeGeometries` needs uniform indexed/non-indexed → use `mergeAll`; TDZ (const used before def) kills the module silently; preview panel reloads on file edit.

## Current task list (user request 2026-07-04, round 2)
0. 🔒 CLAIMED: other seat (WIP in tree — input-contract tests, KeyA remap) **No self-jumping** (from earlier, interrupted): snapToGround(0.6); auto-launch ONLY off ramps (rampH>0 at takeoff); crest hops glued; cliffs/pits = silent fall (no ring, no combo punish unless player flipped); `g.jumped` flag gates ring/trick scoring. **A = ring tap** on desktop (steering → arrows only), tap stays on mobile; SPACE = jump.
1. ✅ THIS SEAT **Overseer live attacks**: spawn in player's line of sight at reaction-window minimum (z = player + max(2.0s*v, 35m)); sequence = eye opens → red beam to target point → red flash → pit carved (register in pitsByChunk + rebuild that chunk's terrain mesh + swap trimesh collider) or wall/obstacle spawned (mesh + cuboid collider). Cooldown ≥6s, never during grace. Uses existing directive machinery (planOverseerAttack path stays for far spawns).
2. ✅ THIS SEAT **Eye shader iris**: replace billboard rings with ShaderMaterial plane — fibrous animated iris, veins, noise flicker, pupil dilation w/ aggression uniform, pupil tracks player. Keep halos/drip.
3. ✅ THIS SEAT — infra DONE (needs game-side wiring below) **LLM evolution loop (poker-style, automated)**: client sendBeacon run summary → new `api/overseer.js` (Upstash Redis, same env as leaderboard — NOTE: api/ is friend-adjacent territory, flag in PR); `.github/workflows/overseer-evolve.yml` cron → `scripts/evolve-overseer.mjs` fetches dump, calls LLM (key from repo secret), validates bounds, commits `overseer-profile.json`; game fetches profile at boot and applies clamped tuning. READ the claude-api skill before writing the API call.

## Evolution loop — game-side wiring ✅ DONE (this seat)
Whoever holds index.html next, add these (infra is live once merged; snippets are the last mile):
1. **Run-summary beacon** — where the run summary is built for the local overseer profile (near showDeath/recordOverseerRun), add fire-and-forget:
   `try{ navigator.sendBeacon('/api/overseer', JSON.stringify({runT:g.runT, score:g.score, dist:g.z-g.dist0, hang:g.hangT, combo:game.topCombo, perfects:…, stumbles:…, deathCause:cause, quickDeath:runT<10&&dist<180, archetype:overseer?.state.archetype, pressure/tilt/mercy from state, attacksHit/Dodged/Countered from event counts})); }catch(e){}`
   Field whitelist lives in api/overseer.js `sanitize()` — anything else is dropped server-side.
2. **Tuning fetch at boot** — `fetch('/overseer-tuning.json').then(r=>r.json()).then(t=>applyOverseerTuning(t.params)).catch(()=>{})`; applyOverseerTuning must CLAMP (bounds identical to scripts/evolve-overseer.mjs BOUNDS) and map: attackCooldownMul→attack cooldown, trapAggressionMul→trap chance/budget, baitChanceMul→baitChance at line ~1207, mercyBias→added to state.mercy, archetypeBias→weightedPick weights.
3. **Repo setup (user action)**: add `ANTHROPIC_API_KEY` secret + optional `GAME_URL` var in GitHub repo settings; workflow runs daily 06:17 UTC or manually via Actions tab.

## Decisions (user, via game-design-director interview)
- Spawn range: reaction-window minimum (~2s travel, speed-scaled)
- Creation VFX: eye opens + red beam, terrain tears at impact
- Evolution: server telemetry + cron LLM → committed profile JSON
- Eye: shader iris (animated fibers/veins, aggression-driven pupil)

## Previous round — ALL DONE, pushed to PR #4
1. ✅ **Controls**: ←→ in air = steering ONLY (no spin accumulation). Tricks = dedicated inputs (↑↓ flips) air-only. Awkward landing tiers: moderate off-rotation = stumble; landing inverted (off > ~1.9 rad) = crash/game over.
2. ✅ **Ring timing too frequent**: raise MIN_AIR_FOR_TAP 0.45 → 0.8s so small rollers don't trigger the tap ring.
3. ✅ **Rider quality/physics parity with bike**: knee/elbow pads, neck, backpack, bigger visor; head counter-pitch to look ahead, speed-based body lean; keep pose contract (torso/armL/R/legL/R/riderG names + crouch/extend code).
4. ✅ **Graphics pass (road + arena)**: night tint on terrainMat.color via moodN (terrain currently stays sunset-warm at night); track edge wear lines + tire stripes in vertex colors; instanced neon crystals + boulders on valley edges.

## Done this session (chronological)
- Live attacks: liveAttack state machine (aim 0.55s → beam 0.4s → settle 1.3s), spawns at max(2s*v,35m) ahead; pit = pitsByChunk push + rebuildChunkTerrain(ci) (tMesh/tCol tracked on chunk rec, trimesh swapped); wall = spawnLiveWall slabs+colliders into target chunk; mercy+OT.mercyBias lower rate, OT.attackCooldownMul scales 8-12s cooldown; grace-aware; DR.liveAttackDebug(type) for tests. VERIFIED: carve -11m live, wall crash at exact slab z, pit death.
- Eye shader iris (one ShaderMaterial plane, no textures): fibers/veins/pupil dilation by aggression, pupil locks to live-attack target, uFlash charge; DR.eyeDebug(m) forces manifestation. Live attack forces eye open (m>=0.62).
- Evolution wiring: death beacon → /api/overseer; overseer-tuning.json fetched+clamped at boot (OT), trapAggressionMul/baitChanceMul applied at gen, archetypeBias blended 50/50 with local profile.
- NOTE for other seat: your signin WIP is in `git stash` ("other-seat WIP from feat/signin-mockup") — pop it when you resume; also 7a1d362 was reverted off feat/signin-mockup (evolution loop belongs to gameplay-v2, cherry-picked as 9d3e588).
- Map-edge demarcation: instanced tall white pylons (edgePostGeo/Mat, 7m, every 12m) along both sides at |x|=TRACK_HARD(13)
- Graphics: terrainMat.color night tint (NIGHT_TINT lerp in updateMood — verified cold blue at mood 1); track edge wear lines (|x|≈9) + tire ruts (x≈±0.6) in vertex colors; instanced boulders (5/chunk, |x|>14) + neon crystals (crystalMat, ~1.5/chunk) on valley edges
- Rider detail+physics: knee/elbow pads, neck+collar, hydration pack (z<-.09 torso color rule), helmet aero fin, wider visor; head counter-pitch (-tiltSm*0.55), speed-based tuck on riderG.rotation.x
- Controls: air ←→ = steering only (spin accumulation removed); flips ↑↓ only, touch flip deadzone 0.4; inverted landing (offF>1.9 rad) = crash; MIN_AIR_FOR_TAP 0.45→0.8 (ring ~7 engagements/20s, real jumps only)
- stumble floor 16 m/s + 2.5s grace window (slam during grace = stumble); shape-aware fallback collision (#6) — commit `on feat/gameplay-v2`
- Rider rebuild: attack stance fitted to bike (hands on grips ±.33,1.15,.66; feet on pedals; banana torso; brighter suit) — commit `e2db8c9`

## Key code map (index.html)
- CONSTANTS ~line 190-220 (all tuning knobs incl. JUMP_VY, TRICK_OFF, SHIELD_TIME)
- TERRAIN ~280: baseH/trapH/pitDepthAt; traps carve into baseH (pits) or are box slabs (walls)
- PHYSICS ~310: Rapier init, charCtl (capsule, autostep .55), trimeshCollider
- BIKE ~560-695: gradient helpers (colorGeo/grad/tube/mergeAll), frame, wheels(+rimMat), rider rig
- CHUNKS ~700+: genChunk (traps→obstacles→gems→deco→meshes→colliders), buildTerrainMesh vertex colors
- LANDING ~1440: resolveLanding, stumble, onLandContact (trick resolution bands: <.35 full, .35-.9 half, >.9 cased)
- INPUT ~1550: routeUI/airTap/doLaunch/doJump, readSteer/readFlip, hold=pedal tap=jump
- UPDATE ~1840: speed ramp (clean-streak, decays w/ speed), Rapier movement + blockage tiers (<.25 head-on crash w/ shield/grace, <.45 clip stumble, <.65 scrape), trick accumulation, pose code ~2000
- Overseer (other session's): observe events via overseerEvent(); tests in tests/overseer-core.test.mjs (7/7 must stay green — run `node --test tests/overseer-core.test.mjs`)

## Environment
- Local preview: launch config "downhill-rush" in ~/.claude/launch.json (http-server :5610)
- Vercel branch preview exists but is SSO-locked (friend's account) — test locally
- git identity on this Mac is auto-set (gadgetplug@Ronin-MacBook-Air.local); user's GH is ronkenx9
