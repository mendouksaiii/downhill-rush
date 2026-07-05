# Overseer Evolution Loop

The live game must stay lightweight and deterministic. The Overseer does not call
an LLM during gameplay. LLM review happens offline against compact run summaries
exported from the browser.

## Data Source

Open DevTools on a local or production build and run:

```js
DR.overseerEvolutionDataset()
```

The dataset contains:

- current local Overseer profile
- latest 40 run summaries
- death causes, run time, distance, score, hang time, combo
- Overseer archetype, pressure, tilt, respect, mercy, manifestation
- last directive and attack event counts

## Review Prompt

Use this prompt with the exported JSON:

```text
You are an external game-balance auditor for Downhill Rush's Overseer AI.
Do not defend the current policy. Treat it as someone else's design.

Goal: propose small, testable policy changes that make the Overseer more readable,
fair, elite, and non-grindy.

Hard rules:
- Do not propose live LLM calls during gameplay.
- Do not propose random unfair trap spam.
- Do not make the game childish, generic, or grindy.
- Every new danger needs a readable telegraph and counterplay.
- Prefer tuning changes over new mechanics.

Analyze:
- quick death rate
- repeated same-cause deaths
- attack hit/dodge/counter ratio
- whether telegraphs are likely too early, late, or subtle
- whether Trickster bait is too punishing
- whether mercy is suppressing enough after weak runs

Output:
1. Findings ordered by severity.
2. Proposed policy changes with numeric before/after values.
3. Why each change supports the fantasy.
4. Tests or playtest checks needed before shipping.
```

## Approval Gate

LLM output is advisory. A human or coding agent must convert approved changes into
tests and code. No policy proposal ships unless:

- existing tests pass
- new behavior has a regression test
- browser smoke confirms the game still initializes
- the change preserves readable telegraphs and counterplay

