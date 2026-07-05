// Coin economy + skin ownership for Downhill Rush.
// localStorage-backed, shared by the game (earning) and the market (spending).
// Import: import { Economy } from './economy.js'
//
// Game side, once per run on the death screen:
//   const earned = Economy.awardRun({ dist, combo });   // adds coins, returns amount
// Market side:
//   Economy.coins                       // current balance
//   Economy.owns('riders','mendo')      // bool
//   Economy.buy('riders','mendo',25000) // spends + auto-equips, returns bool
//   Economy.equip('bikes','aurora')     // returns bool

// ---- tuning (all in one place) ----
const COIN_PER_M   = 1;    // coins per metre travelled — the main driver
const COMBO_BONUS  = 3;    // extra coins per point of top combo (skill sweetener)
const START_COINS  = 0;    // balance a brand-new player begins with

// default free loadout every player owns from the start
const DEFAULT_OWNED = { riders: ['rookie'], bikes: ['sunset'] };
const DEFAULT_EQUIP = { riders: 'rookie',   bikes: 'sunset' };

const LS = { coins:'dr_coins', owned:'dr_owned', equip:'dr_equip' };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const Economy = {
  COIN_PER_M, COMBO_BONUS,

  get coins() { const v = load(LS.coins, null); return v==null ? START_COINS : Math.max(0, Math.floor(+v||0)); },
  set coins(v) { save(LS.coins, Math.max(0, Math.floor(+v||0))); },

  owned() {
    const o = load(LS.owned, null);
    if (!o || !o.riders || !o.bikes) return { riders:[...DEFAULT_OWNED.riders], bikes:[...DEFAULT_OWNED.bikes] };
    // guarantee the free defaults are always present
    for (const cat of ['riders','bikes']) for (const id of DEFAULT_OWNED[cat]) if (!o[cat].includes(id)) o[cat].push(id);
    return o;
  },
  equipped() { const e = load(LS.equip, null); return (e && e.riders && e.bikes) ? e : { ...DEFAULT_EQUIP }; },
  owns(cat, id) { return DEFAULT_OWNED[cat].includes(id) || this.owned()[cat].includes(id); },

  // reward a finished run — distance-driven, with a small bonus for a big combo. returns coins earned.
  awardRun({ dist = 0, combo = 0 } = {}) {
    const earned = Math.max(0, Math.round((+dist||0) * COIN_PER_M) + Math.floor(+combo||0) * COMBO_BONUS);
    this.coins = this.coins + earned;
    return earned;
  },

  // buy a skin: checks funds, deducts, records ownership, auto-equips. returns true on success.
  buy(cat, id, price) {
    if (this.owns(cat, id)) { this.equip(cat, id); return true; }
    price = Math.max(0, Math.floor(+price||0));
    if (this.coins < price) return false;
    this.coins = this.coins - price;
    const o = this.owned(); if (!o[cat].includes(id)) o[cat].push(id); save(LS.owned, o);
    this.equip(cat, id);
    return true;
  },
  equip(cat, id) { if (!this.owns(cat, id)) return false; const e = this.equipped(); e[cat] = id; save(LS.equip, e); return true; },

  // helpers for testing / a future "restore purchases"
  reset() { [LS.coins, LS.owned, LS.equip].forEach(k => { try { localStorage.removeItem(k); } catch {} }); },
  grant(n) { this.coins = this.coins + Math.max(0, Math.floor(+n||0)); return this.coins; },
};
