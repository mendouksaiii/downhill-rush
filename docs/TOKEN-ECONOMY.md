# REDLINE RIDER — Token Economy ($REDLINE)

> Design doc. Token exists; this defines what it *does*. Placeholder ticker $REDLINE — swap for the real one.
> Owner: both seats (economy spans game logic + shop). See issue #27 for the coin-bank interface split.

## Design principles

1. **Skill in, never pay-to-win out.** The token buys *stakes, access, and identity* — never speed, extra jumps, or shields. The moment a token buys performance, the leaderboard is dead and so is the game.
2. **The free game is the top of the funnel.** Core loop stays 100% free. Token features are the *metagame* on top.
3. **One faucet rule: tokens enter circulation only against demonstrated skill or real spend.** No login rewards, no drip-for-existing. Emissions that aren't skill-gated become sell pressure from bots.
4. **Every sink burns or recycles.** Each token flow ends in: burn, prize pool, or treasury. Nothing evaporates into "the company wallet" invisibly.

## The unfair advantage: deterministic seeds

The game already has the two hard technical primitives token games usually lack:

- **Daily Descent** — everyone rides the *same* seeded mountain (`hashSeed(utcDay)`). Fair comparison is built-in.
- **Deterministic sim** — `DR.step(1/60)` replays a run headlessly from an input log. That means **server-side replay verification**: a client submits `{seed, inputLog}`, a headless verifier re-runs it and checks the claimed score. No trust in the client, no anti-cheat arms race. (The bot-playtest harness is 80% of this verifier already.)

Every competitive token feature below leans on those two.

---

## The flywheel

```
        ┌──────────────────────────────────────────────┐
        │                                              ▼
   FREE PLAYERS ──skill──▶ EARN (bounties, dailies) ──▶ HOLDERS
        ▲                                              │
        │                                              ▼
   spectators/ghosts ◀── PRIZE POOLS ◀── STAKE (duels, tournaments)
        ▲                     │
        │                 5% rake ──▶ 50% BURN / 50% TREASURY
        │                                              │
        └── treasury funds seasons, creators, prizes ◀─┘
```

Play → earn a little → stake it in skill challenges → pots attract better players and spectators → spectators become players → treasury/burn tighten supply → repeat.

---

## Faucets (how tokens are earned) — all skill-gated, all capped

| Faucet | Trigger | Cap |
|---|---|---|
| **Daily Descent podium** | Top N% on the shared daily seed (replay-verified) | Fixed daily pool, split by rank curve |
| **Overseer bounties** | Survive X live strikes in one run / dodge streaks / clear a full contract set | Per-day per-wallet cap |
| **Season leaderboard** | End-of-season distance + style ranks | Fixed season pool |
| **Contract streaks** | 7-day contract-clear streak | Weekly cap |

- All payouts come from a **fixed emissions schedule** (e.g. a season pool decided up front) — not minted per-event. If more players qualify, shares shrink; supply never inflates with player count.
- **Skill floor:** no payout below a minimum verified distance/style bar, so bot farms grinding 50m runs earn zero.
- **In-game soft currency stays separate.** Coins for casual shop stuff (friend's lane, issue #27) are off-chain and unlimited. $REDLINE is the scarce competitive layer above it. Never make the soft currency convertible *to* the token — that turns every coin exploit into an emissions exploit.

## Sinks (where tokens go)

| Sink | Flow |
|---|---|
| **Duel stakes** (flagship, below) | pot → winner, 5% rake → 50% burn / 50% treasury |
| **Tournament entries** | entry → prize pool, same rake split |
| **Overseer-touched skins** | limited drops, red/slit-motif variants (friend's `skins-data.js` lane) — 100% burn or burn/treasury split |
| **Ghost slots** | pay to pin your best-run ghost on the daily track for others to race | burn |
| **Name plates / death quips** | custom on-death line the Overseer says about you | burn |
| **Track sponsorship** | holders pay to name a season's daily seed ("The ___ Descent"), logo pylon skin | treasury |

Cosmetics are the honest long-term sink: identity spend scales with community size and touches gameplay zero.

## Flagship: Redline Duels (skill challenges)

1. Two riders stake equal $REDLINE.
2. Both ride the **same seed** (fresh, revealed at start).
3. Both submit `{seed, inputLog, claimedScore}`; the verifier replays both server-side.
4. Higher verified score takes the pot minus 5% rake.

Variants: best-of-3 seeds, distance-only, style-only, "Overseer max" (forced high aggression), open challenges ("500 $REDLINE says nobody beats 1,400m on today's seed"), and async duels (stake against a pinned ghost within 24h).

Tournaments = the same machinery bracketed, weekly, seeded from Daily Descent ranks.

> ⚠️ **Regulatory note (not legal advice):** real-value stakes on outcomes — even skill-based — brush gambling law in many jurisdictions. Mitigations: pure-skill format (deterministic seed, zero RNG divergence between the two riders helps a lot), geo-fence, or run duels in a non-withdrawable points ledger first and bridge later. Get an actual opinion before real-value duels go live.

## Overseer × token (the on-brand hook)

The Overseer already evolves from telemetry. Let the token touch it *within the existing hard clamps*:

- **Feed the Eye:** community burns into a weekly pool; hitting thresholds raises next week's Overseer aggression tier (higher tier = bigger bounty multipliers). Literalizes the tagline — burning tokens *feeds the eye*.
- **Governance-lite:** holders vote on evolution *constraints* (bounds in `overseer-tuning.json`, archetype bias ranges) — never on live gameplay, and never outside the clamps that already protect fairness.
- **The Eye Remembers:** a wallet-linked lifetime record (strikes survived, duels won) → soulbound rank badges → unlock the Overseer-touched skin tiers.

## Anti-abuse checklist

- Replay verification on **every** token-paying run (headless `DR.step` verifier; input log + seed hash).
- `window.DR` stays production-gated (already done) — debug API is a score-forgery vector.
- Per-wallet daily earn caps + skill floor + payout curve flat at the top (rank 1 ≈ 3× rank 50, not 100×) to blunt sybil splitting.
- Duels matched by verified rating; new wallets start in low-stake tiers.
- Seed for daily/duels revealed at start, committed on-chain hash beforehand — no pre-grinding.

## Rollout phases

1. **Phase 0 (now):** off-chain coins + shop (issue #27). Token untouched by the game. Instrument everything.
2. **Phase 1:** wallet link + The Eye Remembers record + skill bounties paid in *non-withdrawable* points mirroring the token. Prove the verifier + caps against real abuse.
3. **Phase 2:** bridge points → $REDLINE at season end (fixed pool). First skin drop (burn sink live before the faucet — sinks first, always).
4. **Phase 3:** Duels + tournaments (post legal check). Feed the Eye burns.
5. **Phase 4:** governance-lite, track sponsorship, creator ghosts.

## What we deliberately do NOT do

- No token-gated gameplay, energy systems, or paid continues.
- No performance items. Ever.
- No unlimited faucets, no play-to-earn "salary" framing (attracts extractors, not players).
- No soft-currency → token conversion.
- No promises of token price anything, anywhere in game copy.
