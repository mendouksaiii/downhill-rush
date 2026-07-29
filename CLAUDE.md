# Redline Rider — agent guide (formerly Downhill Rush)

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

## Tests

Both suites run on every PR via `.github/workflows/test.yml`. Run them locally the same way:

```
npm install            # once — test tooling only, the game still has no build step
npx playwright install chromium
npm test               # unit + e2e
npm run test:unit      # fast: source contracts, no browser
npm run test:e2e       # boots the game and plays it
```

- **`tests/*.test.mjs`** — source contracts. They grep `play.html` for patterns that
  previously regressed (CSS specificity, sfx wiring, stat keys). Fast, but they only
  prove a line exists, not that the game works.
- **`tests/e2e/smoke.spec.mjs`** — Playwright. Boots the real game and drives the real
  UI on desktop + mobile viewports. This is the gate that catches "the button does
  nothing" and "it's invisible" — the class of bug the unit tests structurally cannot.

Every e2e case guards a bug that actually shipped (tagged `@regression-45`, `-48`,
`-56`). **Each one has been mutation-checked**: reintroduce the original bug and the
test fails. If you add a case, verify it fails against the broken code first —
a green test that cannot go red is worse than no test.

The e2e suite deliberately starts with **empty localStorage** unless a case is
specifically about a returning player. Seeded profiles bypass the account gate, which
is exactly how the new-player lockout (#48) hid for days.

## Verifying a change

1. `npm test` — if it passes, the critical path still works.
2. Play a full run by hand: title → ride → jump (perfect/good/miss) → grab each gem
   color → crash → restart.
3. Check DevTools console for errors and watch frame time (adaptive quality kicking in
   on desktop = you regressed perf).
4. Test mobile path: device emulation or real phone — `isMobile` branches differ
   significantly.
