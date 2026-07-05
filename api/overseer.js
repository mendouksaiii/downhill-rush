// Overseer telemetry on Upstash Redis (same env as the leaderboard).
// POST: store one anonymous run summary (capped list). GET: return recent
// summaries for the offline evolution job. No PII — summaries carry gameplay
// stats only; names/emails are rejected.
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'dr:overseer:runs';
const CAP = 1000;   // keep this many most-recent runs
const SHOW = 400;   // max returned per GET

async function redis(commands) {
  const r = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const out = await r.json();
  const bad = out.find((x) => x && x.error);
  if (bad) throw new Error(bad.error);
  return out.map((x) => x.result);
}

const num = (v, lo, hi) => Math.min(Math.max(+v || 0, lo), hi);
const CAUSES = ['wall', 'pit', 'obstacle', 'inverted', 'impact', 'unknown'];
const ARCHETYPES = ['judge', 'hunter', 'trickster', 'unknown'];

function sanitize(body) {
  return {
    v: 1,
    at: Date.now(),
    score: Math.floor(num(body.score, 0, 99999999)),
    dist: Math.floor(num(body.dist, 0, 999999)),
    runT: num(body.runT, 0, 7200),
    hang: num(body.hang, 0, 7200),
    combo: Math.floor(num(body.combo, 0, 9999)),
    perfects: Math.floor(num(body.perfects, 0, 9999)),
    stumbles: Math.floor(num(body.stumbles, 0, 9999)),
    deathCause: CAUSES.includes(body.deathCause) ? body.deathCause : 'unknown',
    quickDeath: !!body.quickDeath,
    archetype: ARCHETYPES.includes(body.archetype) ? body.archetype : 'unknown',
    pressure: num(body.pressure, 0, 1),
    tilt: num(body.tilt, 0, 1),
    mercy: num(body.mercy, 0, 1),
    attacksHit: Math.floor(num(body.attacksHit, 0, 999)),
    attacksDodged: Math.floor(num(body.attacksDodged, 0, 999)),
    attacksCountered: Math.floor(num(body.attacksCountered, 0, 999)),
  };
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      if (!body || typeof body !== 'object') { res.status(400).json({ error: 'bad body' }); return; }
      const entry = sanitize(body);
      if (entry.runT < 5) { res.status(202).json({ stored: false }); return; }  // ignore instant deaths/noise
      await redis([
        ['LPUSH', KEY, JSON.stringify(entry)],
        ['LTRIM', KEY, 0, CAP - 1],
      ]);
      res.status(200).json({ stored: true });
      return;
    }

    if (req.method === 'GET') {
      const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || SHOW, 1), SHOW);
      const [len, raw] = await redis([
        ['LLEN', KEY],
        ['LRANGE', KEY, 0, limit - 1],
      ]);
      const runs = (raw || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      res.status(200).json({ count: len || 0, runs });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: 'overseer telemetry unavailable' });
  }
};
