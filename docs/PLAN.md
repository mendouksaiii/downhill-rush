# PLAN — REDLINE RIDER v3 execution

> Companion to [PRD.md](PRD.md). Ordered by dependency + payoff. Each milestone is one PR-able unit.
> Territory: M1/M2/M3/M5 = ronkenx9 lane (`index.html`). M4 = split (server ours, shop friend's). M0 = shared surfaces → issue first.

## M0 — Logo + lore canon (1 session) 🔒 needs: logo source file from user

1. User drops the RR monogram source (SVG/PNG) into `media/`.
2. Derive: `rr-monogram-1024.png` (transparent + obsidian), `logo-1x1` 512 regen, banner 1500×500, maskable icon.
3. Swap: favicon, apple-touch-icon, OG meta, boot screen, title shell, `manifest.webmanifest`, sw.js precache bump (`redline-v2`).
4. `docs/LORE.md`: canonize the myth doc (world myth, Rider, Overseer, 7 zones, gem names Rush/Anchor/Echo, microcopy bank incl. ADAPT. OBSERVE. CORRECT.). Single source of truth for all future copy.
5. Open issue tagging mendouksaiii: logo swap on his surfaces (market/skins/README) + lore canon heads-up.
6. Verify: PWA reinstall shows new icon; OG preview; boot screen.

## M1 — Zones (the big one; 2–3 sessions)

Distance-banded biomes over the existing chunk system. Both DESCENT (by `game.z`) and later ASCENT (by altitude) read the same table.

1. `ZONES[]` table: name, z-band, terrain palette (vertex-color ramps), fog/sky mood bias, prop mix weights (existing: boulders/crystals/trees + per-zone new prop budget ≤1 instanced mesh each), trap-mix multipliers, Overseer posture (aggression/archetype bias within OT clamps).
2. Zone resolver in chunk gen (`zoneAt(z)`) → palette + prop + trap params; smooth 1-chunk blend at boundaries.
3. Zone entry moment: parchment zone card (name + one lore line from LORE.md) with the burn-to-neon transition; sfx sting; contract hook (`mZone` stat).
4. Order + identity (from lore): Verdant Fields (bright, watched — subtle red marks), Fragment Plains (floating slabs, gravity lies — wider pits), Echo Sanctuary (blue, ghost pylons, quiet — low Overseer), Sun Gate (gold beam, commitment tests — speed-gated gaps), Observer Ridge (towers, sentry orbs, red — max bait), Depthfall (dark ice, vertical — speed ceiling raised), The Sun Eye (endgame band — strike-phase pressure).
5. Bot playtest per zone band (softlocks 0, quick-deaths ~0, medianDist tracked before/after).
6. Perf gate: no new draw calls without instancing; mobile tier check (adaptive quality must not tier-down on zone swaps).

## M2 — Editorial frontend pass (1 session, after M1 so shell can tease zones)

1. Title shell restructure per PRD §2: eyebrow labels, one-idea sections, red demoted to 2–3 uses, stroke-text wordmark, shrink-on-hover buttons, lore footer legend.
2. Leaderboard → grave-marker framing ("THE MOUNTAIN NOTICED THESE NAMES").
3. Parchment tutorial/lore interstitial (first-load), burn transition into RUN.
4. Death screen: keep mechanics, add zone-of-death to epitaph ("SEEN — Observer Ridge, 1,204 m").
5. Verify: mobile + desktop screenshots, conversion path title→run unchanged in click count.

## M3 — ASCENT campaign (REVISED 2026-07-20 — see ~/brain/projects/redline-overhaul-plan.md Workstream D: finite handcrafted maps, defense-skill gauntlets, assisted climb; spike tests gauntlet feel not stamina)

**Implemented slice (2026-07-20):** mode select, finite uphill engine, assisted climb, deterministic map-driven gauntlets, checkpoint resume, summit persistence, schema, and Verdant Fields map are now in `play.html` / `maps/ascent-01-verdant.json`. The old stamina/stall spike below is superseded by the defense-skill design and should not be implemented.

**Next tuning gate:** human-play the Verdant gauntlet, distribute death causes, and tune telegraphs around a >60% first-checkpoint clear rate before authoring maps 02–07.

If committed (2–3 sessions):
1. Mode select on title (DESCENT / ASCENT), separate leaderboards + contracts set.
2. Zone altitude bands reuse M1 table; gates = checkpoints (daily persistence, `dr_ascent_gate`).
3. Overseer inversion: downhill-push attack variants (rockfall = live attack retargeted, gravity-shift bands, path punches).
4. Summit sequence: Eye fills sky → SEEN → whiteout → SUMMITED list (permanent, server).
5. Daily ASCENT (shared seed) alongside Daily Descent.
6. Bot playtest gate + full QA (release checklist skill).

## M4 — Token Phase 0–1 (parallel lane; server + coordination)

0. **Blocked on:** friend's answer to issue #27 (coin bank shape). Nudge if quiet.
1. Phase 0 game-side: coin drip hooks (contracts, milestones, near-misses) → agreed bank key; no UI beyond a counter.
2. Replay verifier service: `api/verify.js` — headless re-sim of `{seed, inputLog, claimedScore}` (extract from bot harness; deterministic-step contract test).
3. Points ledger: `api/points.js` (Upstash, same env), earn = verified daily placement + bounties per TOKEN-ECONOMY.md caps.
4. Wallet link (read-only): signature-based address association; The Eye Remembers record keyed on it.
5. NOT this cycle: bridge, duels, burns (legal gate — TOKEN-ECONOMY.md Phase 2+).

## M5 — Lore image pipeline (background, non-blocking)

1. Generate "THE EYE WAITS AT THE TOP" (prompt in the lore doc — use as-is).
2. Then one zone image per M1 zone as it ships; post cadence, not batch.
3. Each image: myth register (ink/parchment), annotated, standalone-postable; in-game zone cards derive from these.

## Dependency graph

```
M0 (logo+canon) ──▶ M2 (editorial uses canon copy)
M1 (zones) ───────▶ M2 (shell teases zones)
M1 ───────────────▶ M3 (ascent reuses zone table)
M3 spike ──feel gate──▶ M3 full
issue #27 ────────▶ M4 phase 0
M4 verifier ──────▶ (future) duels
M0 LORE.md ───────▶ M5 prompts
```

## Standing gates (every milestone)

- `totalSoftlocks=0`, quick-deaths ~0 (bot harness), 28/28 tests, console clean, mobile tier check.
- Syntax: extract module → esbuild before any browser test.
- Commit per milestone slice; PR #4 flow; no pushes to main.
- HANDOFF.md updated at each stop point.
