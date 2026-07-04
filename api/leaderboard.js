// Global leaderboard on Upstash Redis — a sorted set keyed by longest run time.
// ZADD GT is atomic and strongly consistent: concurrent submits can't clobber
// each other, and a worse rerun can't downgrade a player's best.
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'dr:lb';
const CAP = 100;   // keep the top this many
const SHOW = 25;   // return this many for display

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

// Upstash returns WITHSCORES as a flat [member, score, member, score, ...].
function parseZ(flat) {
  const out = [];
  if (!Array.isArray(flat)) return out;
  for (let i = 0; i < flat.length; i += 2) out.push({ name: flat[i], time: +(+flat[i + 1]).toFixed(1) });
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('cache-control', 'no-store, max-age=0');
  if (!URL || !TOKEN) { res.status(500).json({ error: 'storage not configured' }); return; }

  try {
    if (req.method === 'GET') {
      const me = String((req.query && req.query.me) || '').trim().slice(0, 14);
      const cmds = [
        ['ZCARD', KEY],
        ['ZRANGE', KEY, '0', String(SHOW - 1), 'REV', 'WITHSCORES'],
      ];
      if (me) { cmds.push(['ZREVRANK', KEY, me], ['ZSCORE', KEY, me]); }
      const r = await redis(cmds);
      const mine = (me && r[2] != null)
        ? { rank: r[2] + 1, name: me, time: +(+r[3]).toFixed(1) } : null;
      res.status(200).json({ top: parseZ(r[1]), count: r[0] || 0, me: mine });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      const name = String(body.name || '').trim().slice(0, 14).replace(/[^\w\- ]/g, '');
      const time = Math.min(Math.max(+body.time || 0, 0), 7200);
      if (name.length < 2 || time < 2) { res.status(400).json({ error: 'invalid entry' }); return; }
      const t = +time.toFixed(1);

      const r = await redis([
        ['ZADD', KEY, 'GT', String(t), name],              // atomic add-or-improve
        ['ZREMRANGEBYRANK', KEY, '0', String(-(CAP + 1))], // trim to top CAP
        ['ZREVRANK', KEY, name],
        ['ZCARD', KEY],
        ['ZRANGE', KEY, '0', String(SHOW - 1), 'REV', 'WITHSCORES'],
      ]);
      const rank = r[2] != null ? r[2] + 1 : null;         // null = trimmed out (below top CAP)
      res.status(200).json({ top: parseZ(r[4]), rank, count: r[3] || 0 });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
