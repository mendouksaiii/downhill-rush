# Downhill Rush — agent guide

Endless downhill biking game. Two humans + two Claudes work on this repo; this file is the shared contract.

## Hard constraints

- **`index.html` is the whole game.** Single file, no build step, no framework, no bundler. Three.js 0.160 via unpkg importmap. Keep it that way.
- **Mobile is first-class.** `isMobile` gates bloom/shadows/pixel-ratio; adaptive quality (`stepQuality`, 3 tiers) degrades under sustained >21ms frames. Anything added to the hot path must respect this budget — no per-frame allocations, no new draw calls without instancing.
- **Determinism matters.** Terrain/obstacles derive from `runSeed` via mulberry32 + hashSeed. Keep gameplay reproducible per seed.
- **`main` auto-deploys to Vercel (live game).** Never push directly to `main` — branch + PR, get the other side's review.

## Working agreement (who owns what)

- **ronkenx9 (+ his Claude): physics & graphics** — the game feel/visual code in `index.html` (movement, landing, camera, terrain shading, lighting, post).
- **mendouksaiii (+ his Claude): shop & skins** — `market.html`, `skins.html`, `skins-data.js`, and future coin/economy wiring into the game.
- Cross-territory changes: open an issue first, tag the owner. GitHub issues are the task queue — claim an issue before starting.
- `index.html` is one 1500-line file; two agents editing it concurrently will conflict. Keep PRs small and rebase often. Extracting shared modules (like `skins-data.js` was) is encouraged when a section stabilizes.

## Run locally

```
npx http-server . -p 5610
```

Leaderboard (`/api/leaderboard`) needs Vercel; locally it just shows "leaderboard offline" — expected.

## Map of index.html

| Section | What's there |
|---|---|
| CONSTANTS | All tuning knobs: `G`, `START_SPEED`, `SPEED_RAMP`, `MAX_SPEED`, timing windows (`PERFECT_WIN`…), track widths |
| RNG/NOISE, TERRAIN | Seeded simplex noise; `baseH`/`rampH`/`terrainH` height functions |
| THREE SETUP | Renderer, bloom composer (desktop only), lights, sky shader, day/night `MOOD` lerp |
| BIKE | Box-primitive bike + posable rider rig |
| CHUNKS | 60m procedural chunks: terrain mesh w/ vertex colors, instanced obstacles, ramps, gems |
| LANDING LOGIC | `predictLand`, `resolveLanding`, `onLandContact`, `onTap` — the core mechanic |
| UPDATE | Per-frame physics: speed ramp, steering, launch detection, air/ground states |
| CAMERA / FX | Chase cam w/ lookahead, apex float, landing dip, FOV kick; 2D speedline canvas |
| ADAPTIVE QUALITY | Frame-time-driven tier degradation |

## Debug API

`window.DR` exposes `game` (live state), `terrainH`, `step(dt)` (manual tick), `freeze()`, `mood(0..1)`, `degrade()`, `snapCam()`, `start()`. Use it from the console to test physics changes deterministically.

## Verifying a change

1. Play a full run: title → ride → jump (perfect/good/miss) → grab each gem color → crash → restart.
2. Check DevTools console for errors and watch frame time (adaptive quality kicking in on desktop = you regressed perf).
3. Test mobile path: device emulation or real phone — `isMobile` branches differ significantly.
