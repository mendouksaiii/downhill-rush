# Overseer Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first shippable Overseer AI slice: lightweight adaptive policy, session memory, trap directive integration, and debug/test hooks.

**Architecture:** Put deterministic decision logic in a small pure module (`overseer-core.mjs`) that can be tested with Node and imported by `index.html`. The game owns visuals, physics, terrain, and event emission; the Overseer module owns pressure/tilt/respect/mercy, archetype selection, and scored trap directives.

**Tech Stack:** Browser ES modules, existing Three.js game loop, Node built-in test runner/assertions, `localStorage` for session memory.

---

### Task 1: Pure Overseer Policy Module

**Files:**
- Create: `overseer-core.mjs`
- Create: `tests/overseer-core.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `tests/overseer-core.test.mjs` with tests for:
- high style plus greed biases Trickster and bait directives
- clean technical play biases Judge and technical directives
- repeated deaths raise mercy and suppress attack/bait moves
- same seed/profile returns stable directive kind

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/overseer-core.test.mjs`

Expected: FAIL because `overseer-core.mjs` does not exist yet.

- [ ] **Step 3: Implement minimal pure module**

Create `overseer-core.mjs` exporting:
- `createOverseerRuntime(options)`
- `createDefaultOverseerProfile()`
- `summarizeRunForOverseer(run)`
- `updateOverseerProfile(profile, summary)`

Runtime API:
- `observe(event)`
- `tick(dt, game)`
- `chooseDirective(context)`
- `finishRun(run)`
- `snapshot()`

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/overseer-core.test.mjs`

Expected: all tests pass.

### Task 2: Game Integration

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Import the module**

Add `import { createOverseerRuntime, createDefaultOverseerProfile, updateOverseerProfile } from './overseer-core.mjs';`

- [ ] **Step 2: Initialize runtime/profile**

Load profile from `localStorage` at reset. Create an Overseer runtime and expose it on `window.DR`.

- [ ] **Step 3: Emit gameplay events**

Emit events for:
- score/style gain from tricks and air time
- perfect/good/miss landings
- green/red/blue powerup pickups
- stumble/crash/death cause

- [ ] **Step 4: Use directives in `genChunk`**

Call `overseer.chooseDirective({ ci, z0, density, speed })` and use it to bias:
- trap chance
- pit vs wall selection
- bait gem chance
- wall gap width

- [ ] **Step 5: Persist run summaries**

At death, update profile and save it to `localStorage`.

### Task 3: Verification

**Files:**
- Modify only if needed: `index.html`, `overseer-core.mjs`, `tests/overseer-core.test.mjs`

- [ ] **Step 1: Static checks**

Run:
- `node --test tests/overseer-core.test.mjs`
- extract `index.html` module script and run `node --check`
- `git diff --check`

- [ ] **Step 2: Browser runtime checks**

Start static server and use Chrome automation to verify:
- page loads with no page errors
- `DR.overseer.snapshot()` exists
- forcing high style raises pressure/manifestation
- repeated death summaries increase mercy/frustration
- chunks still generate pits/walls

- [ ] **Step 3: Commit**

Commit code with message: `Add adaptive Overseer foundation`
