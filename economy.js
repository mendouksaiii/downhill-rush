// Coin economy + skin ownership for Redline Rider.
// The account (coins, owned skins, equipped skins, email) is DURABLE on the
// server keyed by username (/api/account) so it survives sign-out, cache
// clears, and device changes. localStorage is only a fast cache of the
// signed-in player. The read API stays synchronous for the UI; signIn is async.
//
//   await Economy.signIn(username, email?)   // load the account from the server
//   Economy.awardRun({ dist, combo })        // game: add coins on the death screen
//   Economy.buy('riders','mendo',25000)      // market: spend + auto-equip
//   Economy.equip('bikes','aurora')          // market: equip an owned skin
//   Economy.signOut()                        // clear the local session (server keeps it)

// ---- tuning (all in one place) ----
const COIN_PER_M  = 1;    // coins per metre travelled — the main driver
const COMBO_BONUS = 3;    // extra coins per point of top combo
const START_COINS = 0;    // a brand-new player begins here

const DEFAULT_OWNED = { riders: ['rookie'], bikes: ['sunset'] };  // free starting loadout
const DEFAULT_EQUIP = { riders: 'rookie',   bikes: 'sunset' };

let ACCT_API = '/api/account';
const LS = 'dr_acct';
const loadLS = () => { try { const v = localStorage.getItem(LS); return v ? JSON.parse(v) : null; } catch { return null; } };
const saveLS = (v) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch {} };

function blank() {
  return { name: '', email: '', coins: START_COINS,
    owned: { riders: [...DEFAULT_OWNED.riders], bikes: [...DEFAULT_OWNED.bikes] },
    equipped: { ...DEFAULT_EQUIP } };
}
// guarantee shape + free defaults on any account object
function normalize(a) {
  const s = blank();
  if (!a || typeof a !== 'object') return s;
  s.name = a.name || '';
  s.email = a.email || '';
  s.coins = Math.max(0, Math.floor(+a.coins || 0));
  for (const cat of ['riders', 'bikes']) {
    const list = Array.isArray(a.owned && a.owned[cat]) ? a.owned[cat].slice() : [];
    for (const id of DEFAULT_OWNED[cat]) if (!list.includes(id)) list.push(id);
    s.owned[cat] = list;
  }
  s.equipped.riders = (a.equipped && a.equipped.riders) || DEFAULT_EQUIP.riders;
  s.equipped.bikes  = (a.equipped && a.equipped.bikes)  || DEFAULT_EQUIP.bikes;
  return s;
}

let S = normalize(loadLS());   // in-memory state, backed by the cache

let saveT = null;
function syncUp() {                    // debounced push of the full account to the server
  saveLS(S);
  if (!S.name) return;
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    fetch(ACCT_API, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(S), keepalive: true }).catch(() => {});
  }, 350);
}

export const Economy = {
  COIN_PER_M, COMBO_BONUS,
  get name()  { return S.name; },
  get email() { return S.email; },
  get coins() { return S.coins; },
  owned()    { return { riders: [...S.owned.riders], bikes: [...S.owned.bikes] }; },
  equipped() { return { ...S.equipped }; },
  owns(cat, id) { return DEFAULT_OWNED[cat].includes(id) || S.owned[cat].includes(id); },

  // Load a player's durable account from the server. Falls back to the cache
  // (offline) or a fresh account (new player). Always resolves.
  async signIn(name, email) {
    name = String(name || '').trim().slice(0, 14);
    if (name.length < 2) return S;
    let server = null;
    try {
      const r = await fetch(`${ACCT_API}?name=${encodeURIComponent(name)}&t=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) server = (await r.json()).account;
    } catch {}
    if (server) {
      S = normalize(server);                                   // durable state wins
    } else if (loadLS() && (loadLS().name || '').toLowerCase() === name.toLowerCase()) {
      S = normalize(loadLS());                                 // offline: same-name cache
    } else {
      S = blank();                                             // new player (or couldn't reach server)
    }
    S.name = name;
    if (email) S.email = email;
    saveLS(S);
    // push so a first-time or cache-only account gets written server-side
    if (!server) syncUp(); else saveLS(S);
    return S;
  },

  signOut() { S = blank(); saveLS(S); },                       // clear session; server keeps the account

  // reward a finished run — distance-driven, small combo bonus. returns coins earned.
  awardRun({ dist = 0, combo = 0 } = {}) {
    const earned = Math.max(0, Math.round((+dist || 0) * COIN_PER_M) + Math.floor(+combo || 0) * COMBO_BONUS);
    S.coins += earned; syncUp();
    return earned;
  },

  // buy a skin: check funds, deduct, record, auto-equip. returns true on success.
  buy(cat, id, price) {
    if (this.owns(cat, id)) { this.equip(cat, id); return true; }
    price = Math.max(0, Math.floor(+price || 0));
    if (S.coins < price) return false;
    S.coins -= price;
    if (!S.owned[cat].includes(id)) S.owned[cat].push(id);
    S.equipped[cat] = id;
    syncUp();
    return true;
  },
  equip(cat, id) { if (!this.owns(cat, id)) return false; S.equipped[cat] = id; syncUp(); return true; },

  // force the pending save to the server right now (awaitable). Call before
  // leaving the game for the market, etc.
  async flush() {
    clearTimeout(saveT); saveLS(S);
    if (!S.name) return;
    try { await fetch(ACCT_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(S) }); } catch {}
  },

  // re-read the localStorage cache into memory (another tab — e.g. the market —
  // may have written a purchase/equip there). Keeps whichever is richer safe:
  // only replaces in-memory state, never posts.
  reloadCache() { const c = loadLS(); if (c) S = normalize(c); return { ...S.equipped }; },

  // testing / plumbing
  _setApi(u) { ACCT_API = u; },
  _state() { return JSON.parse(JSON.stringify(S)); },
  reset() { S = blank(); try { localStorage.removeItem(LS); } catch {} },
  grant(n) { S.coins += Math.max(0, Math.floor(+n || 0)); syncUp(); return S.coins; },
};

// never lose the last earnings if the tab closes before the debounced save fires
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    try { if (S.name && navigator.sendBeacon) navigator.sendBeacon(ACCT_API, JSON.stringify(S)); } catch {}
  });
}
