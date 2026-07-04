# HANDOFF — Downhill Rush working state

> Live working doc. Update after every completed step. If you're a fresh agent:
> read CLAUDE.md first (constraints + territory split), then this.

## Context
- Repo: mendouksaiii/downhill-rush. We are **ronkenx9** (physics/graphics territory, `index.html`).
- Active branch: `feat/gameplay-v2` → [PR #4](https://github.com/mendouksaiii/downhill-rush/pull/4). Contains: Rapier solid physics, jump/tricks, rage traps, research-brief tuning, Overseer AI (built by a parallel session — don't break it), rider attack-stance rebuild.
- Friend (mendouksaiii) owns shop/skins. PR #7 (skins restyle) approved. Issue #6 (kill-rings) answered — closes with #4.
- Test loop: `npx http-server . -p 5610` (or preview server), then drive deterministically from console: `DR.step(1/60)` in loops; `DR.start()`, `DR.doJump()`, `DR.freeze()`, `DR.game`, `DR.pitsByChunk/wallsByChunk`. Tab-hidden pauses rAF — DR.step bypasses. Syntax check: extract `<script type="module">` → esbuild.
- Gotchas: `mergeGeometries` needs uniform indexed/non-indexed → use `mergeAll`; TDZ (const used before def) kills the module silently; preview panel reloads on file edit.

## Current task list (user request 2026-07-04) — ALL DONE, pushed to PR #4
1. ✅ **Controls**: ←→ in air = steering ONLY (no spin accumulation). Tricks = dedicated inputs (↑↓ flips) air-only. Awkward landing tiers: moderate off-rotation = stumble; landing inverted (off > ~1.9 rad) = crash/game over.
2. ✅ **Ring timing too frequent**: raise MIN_AIR_FOR_TAP 0.45 → 0.8s so small rollers don't trigger the tap ring.
3. ✅ **Rider quality/physics parity with bike**: knee/elbow pads, neck, backpack, bigger visor; head counter-pitch to look ahead, speed-based body lean; keep pose contract (torso/armL/R/legL/R/riderG names + crouch/extend code).
4. ✅ **Graphics pass (road + arena)**: night tint on terrainMat.color via moodN (terrain currently stays sunset-warm at night); track edge wear lines + tire stripes in vertex colors; instanced neon crystals + boulders on valley edges.

## Done this session (chronological)
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
