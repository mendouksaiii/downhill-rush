// Global leaderboard on Upstash Redis. The sorted set stores the rank score,
// while a side hash stores display stats so hang time can affect ranking without
// breaking older entries that only stored run time.
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'dr:lb';
const META_KEY = `${KEY}:meta`;
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

function rankValue(e) {
  return (+e.time || 0) + (+e.hang || 0) * 0.25;
}

function safeMeta(raw) {
  try { return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function entryFromMeta(name, rankScore, rawMeta) {
  const meta = safeMeta(rawMeta);
  const fallbackTime = +(+rankScore || 0).toFixed(1);
  return {
    name,
    time: +(+((meta && meta.time) || fallbackTime)).toFixed(1),
    score: Math.floor(+((meta && meta.score) || 0)),
    dist: Math.floor(+((meta && meta.dist) || 0)),
    hang: +(+((meta && meta.hang) || 0)).toFixed(1),
  };
}

// Upstash returns WITHSCORES as a flat [member, score, member, score, ...].
function parseZ(flat, metas = []) {
  const out = [];
  if (!Array.isArray(flat)) return out;
  for (let i = 0; i < flat.length; i += 2) {
    out.push(entryFromMeta(flat[i], flat[i + 1], metas[i / 2]));
  }
  return out;
}

async function hydrateTop(flat) {
  const names = [];
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) names.push(flat[i]);
  const metas = names.length ? await redis(names.map((name) => ['HGET', META_KEY, name])) : [];
  return parseZ(flat, metas);
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
      const top = await hydrateTop(r[1]);
      const mineMeta = (me && r[2] != null) ? (await redis([['HGET', META_KEY, me]]))[0] : null;
      const mine = (me && r[2] != null)
        ? { rank: r[2] + 1, ...entryFromMeta(me, r[3], mineMeta) } : null;
      res.status(200).json({ top, count: r[0] || 0, me: mine });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      const name = String(body.name || '').trim().slice(0, 14).replace(/[^\w\- ]/g, '');
      const time = Math.min(Math.max(+body.time || 0, 0), 7200);
      const score = Math.min(Math.max(Math.floor(+body.score || 0), 0), 99999999);
      const dist = Math.min(Math.max(Math.floor(+body.dist || 0), 0), 999999);
      const hang = Math.min(Math.max(+body.hang || 0, 0), 7200);
      if (name.length < 2 || time < 2) { res.status(400).json({ error: 'invalid entry' }); return; }
      const entry = {
        name,
        time: +time.toFixed(1),
        score,
        dist,
        hang: +hang.toFixed(1),
        at: Date.now(),
      };
      const rankScore = +rankValue(entry).toFixed(3);

      const changed = (await redis([['ZADD', KEY, 'GT', String(rankScore), name]]))[0];
      if (changed) await redis([['HSET', META_KEY, name, JSON.stringify(entry)]]);
      const r = await redis([
        ['ZREMRANGEBYRANK', KEY, '0', String(-(CAP + 1))],
        ['ZREVRANK', KEY, name],
        ['ZCARD', KEY],
        ['ZRANGE', KEY, '0', String(SHOW - 1), 'REV', 'WITHSCORES'],
      ]);
      const rank = r[0] != null ? r[0] + 1 : null;         // null = trimmed out (below top CAP)
      res.status(200).json({ top: await hydrateTop(r[3]), rank, count: r[1] || 0 });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
