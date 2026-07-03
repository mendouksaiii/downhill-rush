// Global leaderboard backed by Vercel Blob. Ranked by longest run time.
const BASE = 'https://blob.vercel-storage.com';
const PATH = 'dr-leaderboard.json';
const API_VER = '7';

async function readBoard(token) {
  const list = await fetch(`${BASE}?prefix=${PATH}`, {
    headers: { authorization: `Bearer ${token}`, 'x-api-version': API_VER },
  });
  if (!list.ok) return [];
  const j = await list.json();
  const blob = (j.blobs || []).find((b) => b.pathname === PATH);
  if (!blob) return [];
  const r = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) return [];
  try {
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function writeBoard(token, board) {
  const r = await fetch(`${BASE}/${PATH}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': API_VER,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-cache-control-max-age': '0',
      'content-type': 'application/json',
    },
    body: JSON.stringify(board),
  });
  if (!r.ok) throw new Error(`blob write ${r.status}`);
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { res.status(500).json({ error: 'storage not configured' }); return; }
  try {
    if (req.method === 'GET') {
      const board = await readBoard(token);
      res.setHeader('cache-control', 's-maxage=10, stale-while-revalidate=30');
      res.status(200).json({ top: board.slice(0, 10) });
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
      if (name.length < 2 || time < 2) { res.status(400).json({ error: 'invalid entry' }); return; }

      let board = await readBoard(token);
      const entry = { name, time: +time.toFixed(1), score, dist, at: Date.now() };
      const i = board.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
      if (i >= 0) { if (entry.time > board[i].time) board[i] = entry; }
      else board.push(entry);
      board.sort((a, b) => b.time - a.time);
      board = board.slice(0, 50);
      await writeBoard(token, board);

      const rank = board.findIndex((e) => e.name.toLowerCase() === name.toLowerCase()) + 1;
      res.status(200).json({ top: board.slice(0, 10), rank: rank || null });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
