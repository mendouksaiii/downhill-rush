// Overseer evolution job — the "poker loop" for the rage director.
// Pulls aggregated run telemetry from /api/overseer, asks Groq's free-tier
// llama-3.3-70b (same loop AgentFloat runs) for small,
// bounded tuning adjustments, validates them against hard clamps, and writes
// overseer-tuning.json (which the game fetches at boot). No live LLM calls
// ever happen during gameplay; this runs on a schedule in CI.
//
// Env: GROQ_API_KEY (required — free tier), GAME_URL (default: production deploy).
// Run:  node scripts/evolve-overseer.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const GAME_URL = process.env.GAME_URL || 'https://downhill-rush-steel.vercel.app';
const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.EVOLVE_MODEL || 'llama-3.3-70b-versatile';
const TUNING_PATH = new URL('../overseer-tuning.json', import.meta.url);
const MIN_RUNS = 25;

// Hard clamps — the LLM proposes, these bounds dispose. The game clamps again
// at load time, so even a bad commit cannot push the Overseer outside these.
const BOUNDS = {
  attackCooldownMul: [0.6, 1.6],
  trapAggressionMul: [0.7, 1.4],
  baitChanceMul: [0.5, 1.3],
  mercyBias: [-0.15, 0.25],
  archetype: [0.1, 0.8],
};
const clamp = (v, [lo, hi]) => Math.min(Math.max(+v || 0, lo), hi);

function aggregate(runs) {
  const n = runs.length;
  const by = (k) => runs.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {});
  const med = (k) => {
    const xs = runs.map((r) => +r[k] || 0).sort((a, b) => a - b);
    return xs.length ? xs[Math.floor(xs.length / 2)] : 0;
  };
  const sum = (k) => runs.reduce((t, r) => t + (+r[k] || 0), 0);
  return {
    runs: n,
    deathCauses: by('deathCause'),
    archetypes: by('archetype'),
    quickDeathRate: +(runs.filter((r) => r.quickDeath).length / n).toFixed(3),
    medianRunT: med('runT'),
    medianDist: med('dist'),
    medianCombo: med('combo'),
    attacksHit: sum('attacksHit'),
    attacksDodged: sum('attacksDodged'),
    attacksCountered: sum('attacksCountered'),
    avgTilt: +(sum('tilt') / n).toFixed(3),
    avgMercy: +(sum('mercy') / n).toFixed(3),
  };
}

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    rationale: { type: 'string', description: 'One short paragraph: what the data shows and why these adjustments follow.' },
    attackCooldownMul: { type: 'number' },
    trapAggressionMul: { type: 'number' },
    baitChanceMul: { type: 'number' },
    mercyBias: { type: 'number' },
    archetypeBias: {
      type: 'object',
      properties: {
        judge: { type: 'number' },
        hunter: { type: 'number' },
        trickster: { type: 'number' },
      },
      required: ['judge', 'hunter', 'trickster'],
      additionalProperties: false,
    },
  },
  required: ['rationale', 'attackCooldownMul', 'trapAggressionMul', 'baitChanceMul', 'mercyBias', 'archetypeBias'],
  additionalProperties: false,
};

async function main() {
  if (!API_KEY) throw new Error('GROQ_API_KEY is not set');

  const current = JSON.parse(readFileSync(TUNING_PATH, 'utf8'));

  const r = await fetch(`${GAME_URL}/api/overseer?limit=400`);
  if (!r.ok) throw new Error(`telemetry fetch failed: ${r.status}`);
  const { count, runs } = await r.json();
  if (!runs || runs.length < MIN_RUNS) {
    console.log(`only ${runs?.length ?? 0} runs (need ${MIN_RUNS}) — skipping evolution`);
    return;
  }
  const stats = aggregate(runs);
  console.log('aggregate:', JSON.stringify(stats));

  const prompt = `You are an external game-balance auditor for Downhill Rush's Overseer AI
(an adaptive rage director that spawns traps and attacks). Do not defend the
current policy — treat it as someone else's design.

Hard rules:
- Do not propose live LLM calls during gameplay.
- Every adjustment must be small: move each multiplier at most 0.1 from its
  current value per cycle. Stability beats cleverness.
- The game must stay rage-inducing but FAIR: deaths should feel earned.
  A quickDeathRate above ~0.25 means the Overseer is killing people before
  they learn — back off aggression. Below ~0.08 with high median distance
  means it is too soft — lean in.
- If one death cause dominates (>50%), reduce pressure on that vector and
  shift archetype bias toward variety.
- mercyBias raises (positive) or lowers (negative) how readily the Overseer
  relents after repeated player deaths.

Current tuning (all multipliers relative to baseline 1.0):
${JSON.stringify(current.params, null, 2)}

Aggregate telemetry from the last ${runs.length} runs (of ${count} stored):
${JSON.stringify(stats, null, 2)}

Propose the next tuning values. Bounds (enforced after you answer):
attackCooldownMul ${BOUNDS.attackCooldownMul}, trapAggressionMul ${BOUNDS.trapAggressionMul},
baitChanceMul ${BOUNDS.baitChanceMul}, mercyBias ${BOUNDS.mercyBias},
each archetypeBias component ${BOUNDS.archetype} (they will be renormalized to sum to 1).

Respond with ONLY a JSON object, no prose, exactly these keys:
{"rationale": string, "attackCooldownMul": number, "trapAggressionMul": number,
 "baitChanceMul": number, "mercyBias": number,
 "archetypeBias": {"judge": number, "hunter": number, "trickster": number}}`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`groq api ${resp.status}: ${await resp.text()}`);
  const message = await resp.json();
  const text = message.choices?.[0]?.message?.content;
  if (!text) throw new Error('no content in response');
  const proposal = JSON.parse(text);
  // json_object mode guarantees JSON, not our shape — OUTPUT_SCHEMA keys are
  // enforced below by the clamp/step validators, unknown keys ignored.

  // Validate: clamp to hard bounds AND to a ±0.1 step from current values.
  const step = (next, cur, bounds) =>
    clamp(Math.min(Math.max(next, cur - 0.1), cur + 0.1), bounds);
  const p = current.params;
  const nextParams = {
    attackCooldownMul: +step(proposal.attackCooldownMul, p.attackCooldownMul, BOUNDS.attackCooldownMul).toFixed(3),
    trapAggressionMul: +step(proposal.trapAggressionMul, p.trapAggressionMul, BOUNDS.trapAggressionMul).toFixed(3),
    baitChanceMul: +step(proposal.baitChanceMul, p.baitChanceMul, BOUNDS.baitChanceMul).toFixed(3),
    mercyBias: +step(proposal.mercyBias, p.mercyBias, BOUNDS.mercyBias).toFixed(3),
    archetypeBias: (() => {
      const a = proposal.archetypeBias || {};
      let j = clamp(a.judge, BOUNDS.archetype), h = clamp(a.hunter, BOUNDS.archetype), t = clamp(a.trickster, BOUNDS.archetype);
      const s = j + h + t;
      return { judge: +(j / s).toFixed(3), hunter: +(h / s).toFixed(3), trickster: +(t / s).toFixed(3) };
    })(),
  };

  const changed = JSON.stringify(nextParams) !== JSON.stringify(p);
  if (!changed) { console.log('no change proposed — leaving tuning as is'); return; }

  const next = {
    version: (current.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    rationale: String(proposal.rationale || '').slice(0, 600),
    stats,
    params: nextParams,
  };
  writeFileSync(TUNING_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log(`wrote overseer-tuning.json v${next.version}`);
  console.log('rationale:', next.rationale);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
