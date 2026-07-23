/* Shared UI sound for the pages OUTSIDE the game (market, skins).
 *
 * play.html deliberately does NOT use this — it already owns an AudioContext
 * with a master bus, wind, music layers and the Overseer drone, and a second
 * context on the same page would fight it for the output device. This is the
 * standalone equivalent for pages that have no audio of their own.
 *
 * Everything is synthesised, so it adds no download. The context is created
 * lazily on the first gesture because browsers start it suspended otherwise.
 */
let AC = null;
let muted = false;
let lastTick = 0;

const MUTE_KEY = 'dr_muted';
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* private mode */ }

function ctx() {
  if (AC) {
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
  catch (e) { return null; }
  return AC;
}

// unlock on the first interaction, matching how play.html does it
for (const ev of ['pointerdown', 'keydown', 'touchstart'])
  addEventListener(ev, () => ctx(), { passive: true, once: true });

function blip(type, f0, f1, at, dur, vol) {
  const ac = ctx(); if (!ac || muted) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(at, dur, vol, fType, fq) {
  const ac = ctx(); if (!ac || muted) return;
  const t = ac.currentTime + at;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(); s.buffer = b;
  const f = ac.createBiquadFilter(); f.type = fType; f.frequency.value = fq;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(ac.destination); s.start(t);
}

export const UISfx = {
  get muted() { return muted; },
  setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
  },
  tick() {                                  // hover / focus move
    const now = performance.now();
    if (now - lastTick < 45) return;        // rate-limit: a rail of cards would machine-gun
    lastTick = now;
    blip('sine', 1250, 1250, 0, 0.028, 0.05);
  },
  select() { blip('triangle', 660, 990, 0, 0.06, 0.16); noise(0, 0.04, 0.10, 'highpass', 4200); },
  back()   { blip('triangle', 560, 340, 0, 0.08, 0.13); },
  deny()   { blip('square', 200, 150, 0, 0.07, 0.16); blip('square', 180, 130, 0.09, 0.09, 0.14); },
  equip()  { blip('triangle', 620, 930, 0, 0.08, 0.17); blip('sine', 930, 1240, 0.07, 0.12, 0.12); },
  buy() {                                   // coins out, item in
    blip('triangle', 920, 1380, 0, 0.07, 0.18);
    blip('triangle', 1380, 1840, 0.06, 0.09, 0.13);
    [523.2, 659.2, 784].forEach((f, i) => blip('triangle', f, f, 0.16 + i * 0.09, 0.22, 0.16));
  },
};

export default UISfx;
