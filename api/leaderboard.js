// Global leaderboard on Upstash Redis. The sorted set stores the rank score,
// while a side hash stores display stats so hang time can affect ranking without
// breaking older entries that only stored run time.
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'dr:lb';
const META_KEY = `${KEY}:meta`;
const AIR_KEY = 'dr:lb:air';
const AIR_META_KEY = `${AIR_KEY}:meta`;
const CAP = 100;   // keep the top this many
const SHOW = 25;   // default page size (home mini-board, post-run refresh)

// The leaderboard screen asks for a deeper slice (75). Clamped to CAP because
// that is all the sorted set retains, and floored at 1 so a junk ?limit= can
// never turn into a negative ZRANGE stop index (which would select the wrong rows).
function showCount(req) {
  const raw = parseInt((req.query && req.query.limit) || '', 10);
  if (!Number.isFinite(raw)) return SHOW;
  return Math.max(1, Math.min(CAP, raw));
}

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

// POINTS ranking: distance is the backbone, airtime (hang) and skill (in-game
// style score) feed it.  pts = dist + hang*15 + score/5
// Legacy pre-stats entries (only a time on record) rank at time*20 — the old
// era's average pace — so they stay comparable without fabricating stats.
function rankValue(e) {
  const dist = +e.dist || 0, hang = +e.hang || 0, score = +e.score || 0;
  if (!dist && !score && !hang) return Math.round((+e.time || 0) * 20);
  return Math.round(dist + hang * 15 + score / 5);
}

function safeMeta(raw) {
  try { return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function entryFromMeta(name, rankScore, rawMeta) {
  const meta = safeMeta(rawMeta);
  const fallbackTime = +(+rankScore || 0).toFixed(1);
  return {
    // members are stored lowercased (one identity per player regardless of how
    // they typed it); the meta keeps the display casing
    name: (meta && meta.name) || name,
    pts: Math.round(+rankScore || 0),   // main-board zset score IS the points total
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

async function hydrateTop(flat, metaKey = META_KEY) {
  const names = [];
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) names.push(flat[i]);
  const metas = names.length ? await redis(names.map((name) => ['HGET', metaKey, name])) : [];
  return parseZ(flat, metas);
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('cache-control', 'no-store, max-age=0');
  if (!URL || !TOKEN) { res.status(500).json({ error: 'storage not configured' }); return; }

  try {
    if (req.method === 'GET') {
      const board = String((req.query && req.query.board) || '').trim();
      const isAir = board === 'air';
      const k = isAir ? AIR_KEY : KEY;
      const mk = isAir ? AIR_META_KEY : META_KEY;
      const me = String((req.query && req.query.me) || '').trim().slice(0, 14).toLowerCase();
      const show = showCount(req);
      const cmds = [
        ['ZCARD', k],
        ['ZRANGE', k, '0', String(show - 1), 'REV', 'WITHSCORES'],
      ];
      if (me) { cmds.push(['ZREVRANK', k, me], ['ZSCORE', k, me]); }
      const r = await redis(cmds);
      const top = await hydrateTop(r[1], mk);
      const mineMeta = (me && r[2] != null) ? (await redis([['HGET', mk, me]]))[0] : null;
      const mine = (me && r[2] != null)
        ? { rank: r[2] + 1, ...entryFromMeta(me, r[3], mineMeta) } : null;
      res.status(200).json({ board: isAir ? 'air' : 'time', top, count: r[0] || 0, me: mine });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      const name = String(body.name || '').trim().slice(0, 14).replace(/[^\w\- ]/g, '');
      const emailRaw = String(body.email || '').trim().slice(0, 120);
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : '';
      const time = Math.min(Math.max(+body.time || 0, 0), 7200);
      const score = Math.min(Math.max(Math.floor(+body.score || 0), 0), 99999999);
      const dist = Math.min(Math.max(Math.floor(+body.dist || 0), 0), 999999);
      const hang = Math.min(Math.max(+body.hang || 0, 0), 7200);
      if (name.length < 2 || time < 2) { res.status(400).json({ error: 'invalid entry' }); return; }
      // plausibility gate: the game can't produce these, so a client that sends
      // them is either a spoofed POST or a pre-fix soft-locked run.
      //  - hang time can't exceed run time
      //  - distance can't exceed terminal velocity (MAX_SPEED=88) for the whole run
      //  - a long run must cover proportional ground (speed floor is 16 m/s;
      //    a wedged/faked 9-minute "run" with no distance fails this)
      if (hang > time + 1 || dist > time * 90 || (time > 90 && dist < time * 8)) {
        res.status(400).json({ error: 'implausible entry' }); return;
      }
      // skill points feed the ranking now, so cap them against distance too
      // (observed legit ratio is ~1-2 pts/m; 10x + slack is generous)
      if (score > dist * 10 + 2000) {
        res.status(400).json({ error: 'implausible entry' }); return;
      }
      const entry = {
        name,
        time: +time.toFixed(1),
        score,
        dist,
        hang: +hang.toFixed(1),
        email,
        at: Date.now(),
      };
      const rankScore = +rankValue(entry).toFixed(3);

      // one identity per player: the zset member is the lowercased name, so
      // "Mendo" and "mendo" rank as the same rider; display casing lives in meta
      const member = name.toLowerCase();
      // CH matters: without it ZADD returns only *newly added* members, so an
      // existing player improving their score returned 0 and their display meta
      // froze at their first-ever run (the "wisely 17.8s at #1 forever" bug).
      const changed = (await redis([['ZADD', KEY, 'GT', 'CH', String(rankScore), member]]))[0];
      if (changed) await redis([['HSET', META_KEY, member, JSON.stringify(entry)]]);
      else if (email) {
        const existing = safeMeta((await redis([['HGET', META_KEY, member]]))[0]) || {};
        await redis([['HSET', META_KEY, member, JSON.stringify({ ...existing, email })]]);
      }
      // Airtime board — same entry, ranked by hang time alone
      if (hang >= 1) {
        const airChanged = (await redis([['ZADD', AIR_KEY, 'GT', 'CH', String(hang), member]]))[0];
        if (airChanged) await redis([['HSET', AIR_META_KEY, member, JSON.stringify(entry)]]);
      }
      const r = await redis([
        ['ZREMRANGEBYRANK', KEY, '0', String(-(CAP + 1))],   // r[0] = # trimmed
        ['ZREVRANK', KEY, member],                           // r[1] = rank (0-based)
        ['ZCARD', KEY],                                      // r[2] = total count
        ['ZRANGE', KEY, '0', String(SHOW - 1), 'REV', 'WITHSCORES'], // r[3] = top
      ]);
      const rank = r[1] != null ? r[1] + 1 : null;         // null = trimmed out (below top CAP)
      res.status(200).json({ top: await hydrateTop(r[3]), rank, count: r[2] || 0 });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
