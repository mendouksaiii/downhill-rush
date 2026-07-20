# Bot Playtest

Scripted playtest bot for REDLINE RIDER. It drives the **real input path**
(`keys.Arrow*`, `doJump()`, `airTap()`) deterministically across seeds and
reports difficulty/fairness metrics — the fastest way to catch softlocks,
unfair instant-deaths, or a difficulty regression without live play.

The game runs WebGL + a Rapier WASM physics world, so it cannot execute in
plain Node. Run the bot in the live game (local preview or the deployed build)
where `window.DR` is exposed (localhost, or any host with `?debug=1`).

## Run it

Start the game locally:

```
npx http-server . -p 5610
```

Open `http://localhost:5610`, then in the DevTools console:

```js
DR.botPlaytest({ runs: 20, maxFrames: 3600, seed: 2000 }).agg
```

Options: `runs` (default 10), `maxFrames` per run (default 3600 = 60s at 60fps),
`seed` (base seed; run N uses `seed + N` for reproducibility).

## Output

```jsonc
{
  "runs": 20,
  "medianDist": 374,        // metres — difficulty curve check
  "medianFrames": 981,      // ~survival time at 60fps
  "deaths": { "offtrack": 6, "wall": 2, "pit": 1, "timeout": 1 },
  "totalSoftlocks": 0,      // MUST be 0 — a run stuck <3m over 2s
  "quickDeaths": 0          // runs dead in <2s — MUST stay near 0 (fairness)
}
```

The full per-run array is on the return value's `.runs`.

## Release gate

- `totalSoftlocks` must be **0**. Any softlock is a release blocker.
- `quickDeaths` should be near **0** — a spike means the Overseer/traps kill
  before the player can react (unfair). Re-check `overseer-tuning.json` and the
  reaction-window spawn distance.
- `medianDist` is the difficulty baseline; watch it across changes so a tuning
  commit doesn't silently make the game trivial or brutal.

The bot is a competent-survival policy, not an expert — its own `offtrack`
deaths come from a simple lane heuristic and are expected. The signal is in
softlocks / quick-deaths / distance distribution, not the bot's skill.
