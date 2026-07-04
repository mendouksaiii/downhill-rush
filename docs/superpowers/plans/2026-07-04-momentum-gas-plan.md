# Momentum Gas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make gas acceleration additive to clean auto-acceleration while preserving boosted momentum after gas runs out.

**Architecture:** The single-file game loop in `index.html` already separates passive speed ramping from `updateGas()`. This change removes the low pedal speed clamp and replaces it with a normal top-speed gas cap.

**Tech Stack:** Static HTML game, Three.js, Node test runner contract tests.

---

### Task 1: Contract Test

**Files:**
- Modify: `/Users/gadgetplug/downhill-rush/tests/input-contract.test.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions that gas uses `GAS_BOOST_CAP`, not `PEDAL_CAP`, and that gas boost applies to current speed.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/input-contract.test.mjs`
Expected: FAIL because current code still declares and uses `PEDAL_CAP`.

### Task 2: Gameplay Tuning

**Files:**
- Modify: `/Users/gadgetplug/downhill-rush/index.html`

- [ ] **Step 1: Replace the low pedal clamp**

Replace `PEDAL_CAP` with `GAS_BOOST_CAP = 1.0` and use it in both gas eligibility and speed application.

- [ ] **Step 2: Run verification**

Run: `node --check api/leaderboard.js && node --test tests/*.test.mjs`
Expected: PASS.
