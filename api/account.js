// Player account store on Upstash Redis (same env as the leaderboard).
// Durable per-username so coins + owned/equipped skins survive sign-out,
// cache clears, and device changes. No password — claim-by-name, same trust
// model as the leaderboard (hardened later with real auth).
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'dr:acct';   // hash: field = lowercased username, value = JSON account

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

const cleanName = (v) => String(v || '').trim().slice(0, 14).replace(/[^\w\- ]/g, '');
const cleanId = (v) => (typeof v === 'string' && /^[\w-]{1,24}$/.test(v)) ? v : null;
const cleanIds = (a) => Array.isArray(a) ? [...new Set(a.map(cleanId).filter(Boolean))].slice(0, 300) : [];

function sanitize(name, body) {
  const o = body.owned || {}, e = body.equipped || {};
  return {
    name,
    email: (typeof body.email === 'string' ? body.email : '').trim().slice(0, 80),
    coins: Math.min(Math.max(Math.floor(+body.coins || 0), 0), 1e9),
    owned: { riders: cleanIds(o.riders), bikes: cleanIds(o.bikes) },
    equipped: { riders: cleanId(e.riders) || 'rookie', bikes: cleanId(e.bikes) || 'sunset' },
    at: Date.now(),
  };
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('cache-control', 'no-store, max-age=0');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (!URL || !TOKEN) { res.status(500).json({ error: 'storage not configured' }); return; }

  try {
    if (req.method === 'GET') {
      const name = cleanName((req.query && req.query.name) || '');
      if (name.length < 2) { res.status(400).json({ error: 'name required' }); return; }
      const r = await redis([['HGET', KEY, name.toLowerCase()]]);
      let account = null;
      if (r[0]) { try { account = JSON.parse(r[0]); } catch { account = null; } }
      res.status(200).json({ account });
      return;
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      const name = cleanName(body.name);
      if (name.length < 2) { res.status(400).json({ error: 'name required' }); return; }
      const field = name.toLowerCase();
      const account = sanitize(name, body);
      // Progress guard: a legit client always posts the FULL account, so owned
      // skins only ever grow. A POST missing skins the server already has is a
      // stale or blank client (old tab's unload beacon, failed sign-in fetch) —
      // merge instead of letting it downgrade the durable account.
      let existing = null;
      try { const raw = (await redis([['HGET', KEY, field]]))[0]; existing = raw ? JSON.parse(raw) : null; } catch {}
      if (existing) {
        const exOwned = { riders: cleanIds(existing.owned && existing.owned.riders),
                          bikes: cleanIds(existing.owned && existing.owned.bikes) };
        const stale = ['riders', 'bikes'].some(
          (cat) => exOwned[cat].some((id) => !account.owned[cat].includes(id)));
        for (const cat of ['riders', 'bikes']) {
          account.owned[cat] = [...new Set([...exOwned[cat], ...account.owned[cat]])].slice(0, 300);
        }
        if (!account.email && existing.email) account.email = existing.email;
        if (stale) {
          account.coins = Math.max(account.coins, Math.floor(+existing.coins || 0));
          const postsDefaults = account.equipped.riders === 'rookie' && account.equipped.bikes === 'sunset';
          if (postsDefaults && existing.equipped) {
            account.equipped = { riders: cleanId(existing.equipped.riders) || 'rookie',
                                 bikes: cleanId(existing.equipped.bikes) || 'sunset' };
          }
        }
      }
      await redis([['HSET', KEY, field, JSON.stringify(account)]]);
      res.status(200).json({ account });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
