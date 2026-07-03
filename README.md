# DOWNHILL RUSH

Endless downhill mountain-biking in the browser. One tap. Infinite mountain.

**Play: [downhill-rush-steel.vercel.app](https://downhill-rush-steel.vercel.app)**

Tap to land clean. Don't die.

## How it works

- Steer with ←/→ (or drag on mobile), tap/space to time your landings
- PERFECT landings (±80ms) boost speed and build your combo multiplier
- Graze obstacles for near-miss bonuses — the dangerous line is the fast line
- Grab gems: green = ×2 speed, red = slow, blue = extend the active effect
- Ride from sunset into night — the world keeps going, the speed keeps climbing
- Longest runs go on the global top-10 leaderboard

## Tech

Single-file [Three.js](https://threejs.org) game — no build step, no framework.
`index.html` is the whole game: procedural terrain, physics, ragdoll crashes,
WebAudio synth soundtrack, bloom/shadows on desktop, adaptive quality on mobile.
Leaderboard is a zero-dependency Vercel serverless function on Vercel Blob.

## Develop

```
npx http-server . -p 5610
```

Deploys automatically on push to `main` via Vercel.
