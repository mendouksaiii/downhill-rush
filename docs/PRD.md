# REDLINE RIDER — PRD v3 ("The Eye Waits At The Top")

> Covers: lore canonization, frontend/editorial redesign, ASCENT (uphill) mode, token system phase 1, logo swap.
> Companion: [PLAN.md](PLAN.md) (execution order), [TOKEN-ECONOMY.md](TOKEN-ECONOMY.md) (full economy design).

---

## 1. Analysis — what we have vs what the lore doc asks for

### The lore doc is strong. Adopt it as canon, with one correction.

The myth ("you are racing a god that is learning how to kill you", ADAPT. OBSERVE. CORRECT., every run is canon, leaderboard-as-grave-marker) is *exactly* what the game already mechanically does — the Overseer literally learns from telemetry via the evolution loop. The lore isn't decoration; it's a true description of the system. That's rare and we should lean on it everywhere.

**The correction: two visual registers, one world.**
The concept art (painterly valleys, parchment ink maps) and the shipped game (obsidian `#090712`, neon red/cyan) look like two different products. Don't pick one — assign them roles:

| Register | Style | Used for |
|---|---|---|
| **The Mountain remembers** (myth register) | Ink/parchment, painterly zones, handwritten annotations | Marketing site, lore images, loading/interstitial cards, zone-reveal splashes, socials |
| **The descent** (live register) | Obsidian neon, red `#FF304C` / cyan `#00E5FF` — current in-game look | Gameplay, HUD, UI chrome |

In-fiction justification (free, and good): the parchment art is *how the world records itself* — the maps and warnings left by dead Redliners. The neon is *what the Eye's gaze makes the world look like while you ride*. Crossing between them (a parchment zone card burning into neon as a run starts) becomes a signature transition.

### Canon adopted from the lore doc
- World myth: broken mountain, one rider survived the impossible descent, sky split, sun became the Eye. Overseer = guardian-spirit-turned-adaptive-system asking "can any human still outride fate?"
- Rider: **not** a chosen one. Patched red jacket, taped gloves, talisman stickers. "If there is a line, I can ride it."
- Overseer mantra: **ADAPT. OBSERVE. CORRECT.** (joins existing microcopy: LINE LOCKED / SEEN / BUILD CLEAN / THE EYE REMEMBERS).
- **Seven zones**, in order: Verdant Fields → Fragment Plains → Echo Sanctuary → Sun Gate → Observer Ridge → Depthfall → The Sun Eye.
- Gems renamed with lore: green = **Rush** (x2 speed), red = **Anchor** (slow), blue = **Echo** (extend). Mechanics unchanged.
- Leaderboard reframed: "the riders the mountain noticed." Death screen already speaks in this voice.

### Zone system implications (biggest hidden scope in the lore)
Today the terrain is one continuous mood. Zones mean **distance-banded biomes**: palette, prop set, trap mix, and Overseer posture shift as you descend. This is very doable with the existing chunk system (band by `game.z`), and it converts "endless same-ness" — the actual reason the frontend feels boring — into progression. **Zones are the single highest-value change in this whole PRD.**

---

## 2. Feature: Frontend redesign (editorial system)

**Problem:** the landing/title shell is functional but flat. The game deserves the myth.

**Approach:** apply the Editorial Landing Page System (`~/brain/skills/editorial-landing-page.md`) *principles*, not its stack. Hard constraint stands: `index.html` is the whole game, no build step — so no Next.js. The system's rules port cleanly to vanilla:

- Eyebrow pattern: mono uppercase `tracking 0.2em` labels above every section (already half-there in mechanic strip).
- One accent precious: red `#FF304C` used 2–3x max on the title shell; cyan is the rarer emotional accent. Currently red is everywhere → demote most chrome to ghost `#9A92C9` / surface tones.
- Buttons **shrink** on hover (`scale(0.95)`), flip to accent. Never grow.
- One idea per section: title shell becomes: (1) logo + tagline, (2) single CTA, (3) LONGEST RUNS as grave-marker table with epitaph copy, (4) mechanic strip, (5) lore footer ("Nobody reaches the bottom. Nobody turns back. The mountain only lets you go faster.").
- Stroke text for the big REDLINE wordmark (inline `-webkit-text-stroke`).
- No pure black/white; obsidian bg + `#F4F6FF` text stays.
- **New:** parchment lore card as the tutorial/first-load interstitial (myth register's one in-game appearance), burning into neon on RUN.

**Out of scope:** separate marketing site. If we want one later it's a new `landing/` dir or repo using the full Next.js playbook — not this milestone.

## 3. Feature: ASCENT mode (uphill)

**The pitch:** the descent is infinite; the climb is not. ASCENT is the first *finishable* thing in REDLINE RIDER — ride **up** the mountain through all seven zones to touch the Sun Eye. Lore-perfect: "The Eye waits at the top."

**Core loop (design decisions, tunable):**
- **Momentum is the resource.** Gravity works against you; speed constantly decays. Hold-to-pedal (existing input) becomes stamina-limited; downhill-earned habits invert.
- **Flow feeds climb:** clean riding (existing clean-streak accel), perfect landings, and tricks off bumps **charge the gas tank**; gas burns for climb bursts. The style system finally has a survival purpose.
- **Stall = death.** Drop below a floor speed on a grade and the run ends ("THE MOUNTAIN SHRUGGED"). Replaces off-track as primary fail mode.
- **Zone gates as checkpoints:** each of the 7 zones is a fixed altitude band (finite! e.g. 350 m of climb each, ~2.5 km summit). Reaching a gate = checkpoint + zone splash (parchment card). Runs restart at highest gate reached that day.
- **Overseer inverts:** in descent it edits terrain ahead; in ASCENT it *pushes down* — gravity-shift zones, path punches, rockfalls from above (concept art's "adaptations" list maps 1:1). Aggression scales with altitude; The Sun Eye zone is a near-constant strike phase.
- **Summit:** touching the Eye ends the run with a canonical cutscene beat (eye fills the sky, SEEN, whiteout, name etched into a permanent SUMMITED list). Summit list is the prestige leaderboard; time-to-summit is the competitive stat.

**Reuses:** chunk/terrain gen (negative slope + zone banding), Rapier movement, jump/trick/landing systems, gas system, Overseer live attacks, contracts (ASCENT-specific contract set), deterministic seeds (daily ASCENT; duel-able later — a *time-to-gate race* is a cleaner wager format than distance).

**New build:** uphill speed model (decay + stamina + stall), zone banding (shared with §1 zones work — do zones once, both modes benefit), checkpoint persistence, summit sequence, mode select on title.

**Risk:** uphill endless-runner feel is unproven — grinding upward can feel slow/frustrating. Mitigation: prototype the speed model behind `?ascent=1` before any content work; bot-playtest gate (median time-to-gate-1 between 60–120s, stall-death rate < 40% for the bot's competence level).

## 4. Feature: Token system — implementation slice (Phase 0–1)

Full design in [TOKEN-ECONOMY.md](TOKEN-ECONOMY.md). This PRD commits only the phases that need no legal signoff:

- **Phase 0 (now):** off-chain coin bank (`dr_coins`, localStorage + server mirror), coin drip from contracts/milestones, shop spend hookup. **Friend's lane** — interface already proposed in issue #27; game-side earn hooks are our lane.
- **Phase 1:** wallet link (read-only address association), **The Eye Remembers** lifetime record (strikes survived, dailies placed, duels later), soulbound-style rank badges (off-chain first), skill bounties paid in **non-withdrawable points** mirroring $REDLINE. Server: extend `api/` with a points ledger + the replay verifier (headless `DR.step` re-run of `{seed, inputLog}` — bot harness is 80% of it).
- **Phase 2+ (bridge, duels, Feed the Eye):** designed, parked pending legal note in TOKEN-ECONOMY.md.

**Hard lines restated:** token/points never buy performance; soft coins never convert to token; sinks ship before faucets; `window.DR` stays production-gated.

## 5. Feature: Logo swap (RR horned monogram)

New mark: red **RR** horned monogram on off-white — sharper, merch-ready, reads at 16 px. Replaces the current logo everywhere:

- `media/`: add `rr-monogram.png` (1024², transparent + obsidian variants), regenerate `logo-1x1` (512, obsidian bg for dark contexts), banner 1500×500, maskable icon.
- Swap points: favicon, apple-touch-icon, OG image, boot/loading screen, title shell, `manifest.webmanifest` icons, README, GitHub social preview.
- **Needs from you:** the source file (currently only pasted in chat) — drop the original PNG/SVG into `media/`. SVG strongly preferred; if PNG-only, we trace or upscale for the boot screen.
- Note: monogram is on off-white/parchment — fits the myth register natively; for the live register use it knocked out in red on obsidian.

---

## 6. Recommendations (priority order)

1. **Zones first.** One system, three payoffs: fixes "boring" more than any landing-page polish (progression + visual variety in the actual game), is the spine of ASCENT, and gives marketing seven ready-made image drops. Do it before the editorial pass so the title shell can preview zone art.
2. **Editorial pass second** — cheap, high-visibility, no design unknowns (system is written).
3. **ASCENT prototype third, content later.** Speed-model spike behind a flag; kill or commit within one session based on feel + bot metrics. Don't build 7 zones of ASCENT content before the climb *feels* good.
4. **Token Phase 0/1 in parallel** — it's mostly server + friend's lane; doesn't contend for `index.html`.
5. **Logo immediately** — one session, pure wins, blocked only on the source file.
6. **Lore images pipeline:** adopt the doc's 12-standalone-images plan over one board; generate "THE EYE WAITS AT THE TOP" first (their pick is right — it sells the whole myth alone); zone images as each zone ships in-game so art and game stay in lockstep.
7. **Coordination:** zones + ASCENT are our lane; coin bank/shop is friend's (issue #27); lore canon + logo affect his surfaces (market/skins/README) → open a "Lore canon v1 + logo swap" issue tagging him before touching shared surfaces.

## 7. Success metrics

- Retention: D1 return rate up after zones (contract system gives baseline); median session length up.
- ASCENT: ≥25% of players try it in week 1; summit rate <2% (prestige) but gate-1 rate >60% (fairness); bot gate green.
- Frontend: bounce-to-RUN conversion up (title → first run started).
- Token P1: ≥100 linked wallets before any bridge talk; zero verified-replay disputes.

## 8. Out of scope (this cycle)

Multiplayer ghosts-live, real-value duels (legal), separate Next.js marketing site, mobile app store packaging, the 12-image art suite as a blocking deliverable.
