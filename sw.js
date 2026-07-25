// REDLINE RIDER service worker — offline-capable PWA.
//
// Caching policy, by mutability:
//   IMMUTABLE (cache-first)  — vendored engine, media, fonts. Version-pinned,
//                              huge, and the whole point of the offline story.
//   OURS      (network-first) — every file we actually ship changes to: the
//                              HTML documents AND our ES modules (economy.js,
//                              skins-data.js, overseer-core.mjs) and tuning
//                              JSON. These are module imports, not navigations,
//                              so they do NOT hit the document branch — caching
//                              them first-wins would freeze player economy /
//                              skin-catalog fixes forever, and would pair fresh
//                              HTML with stale modules (a version mismatch that
//                              is worse than either alone).
//   LIVE      (network only)  — /api/*.
//
// Bump CACHE on any change to this policy or the precache list.
const CACHE = 'redline-v7';   // bumped: achievements-data.js added to PRECACHE
const PRECACHE = [
  './',
  './play.html',
  './market.html',
  './skins.html',
  './economy.js',
  './skins-data.js',
  './ui-sfx.js',
  './achievements-data.js',
  './manifest.webmanifest',
  './overseer-tuning.json',
  './overseer-core.mjs',
  './maps/ascent-01-verdant.json',
  './media/redline-rider-rr.png',
  './media/redline-rider-logo-1x1.png',
  './media/redline-rider-banner-1500x500.png',
  './vendor/three/three.module.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
  './vendor/three/addons/environments/RoomEnvironment.js',
  './vendor/three/addons/postprocessing/EffectComposer.js',
  './vendor/three/addons/postprocessing/RenderPass.js',
  './vendor/three/addons/postprocessing/UnrealBloomPass.js',
  './vendor/three/addons/postprocessing/OutputPass.js',
  './vendor/three/addons/postprocessing/ShaderPass.js',
  './vendor/three/addons/postprocessing/MaskPass.js',
  './vendor/three/addons/postprocessing/Pass.js',
  './vendor/three/addons/shaders/CopyShader.js',
  './vendor/three/addons/shaders/LuminosityHighPassShader.js',
  './vendor/three/addons/shaders/OutputShader.js',
  './vendor/rapier3d/rapier.es.js',
];

// Music streams: the <audio> element issues Range requests, and Cache.put()
// REJECTS a 206 partial response. Caching these would throw on every seek and
// bloat storage by ~16MB, so they always go straight to the network.
const isMusic = (url) => url.pathname.startsWith('/media/music/');

// Immutable by construction — safe to serve from cache indefinitely.
const isImmutable = (url) =>
  !isMusic(url) && (
    url.pathname.startsWith('/vendor/') ||
    url.pathname.startsWith('/media/') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('fonts.googleapis'));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;      // HEAD passes through — the build-tag check needs it live
  const url = new URL(req.url);

  // Never cache the APIs — leaderboard + accounts + telemetry must be live.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'content-type': 'application/json' } })));
    return;
  }

  // Music: pass through untouched so Range/206 works and nothing is stored.
  if (isMusic(url)) return;

  // Cache-first ONLY for immutable assets.
  if (isImmutable(url)) {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
      if (r.ok) { const clone = r.clone(); caches.open(CACHE).then((c) => c.put(req, clone)); }
      return r;
    })));
    return;
  }

  // Everything else of ours (documents AND module imports AND tuning json):
  // network-first so a deploy always wins, cache only as the offline fallback.
  e.respondWith(
    fetch(req).then((r) => {
      // status 206 is "ok" but Cache.put() rejects it — never store partials
      if (r.ok && r.status !== 206 && url.origin === location.origin) {
        const clone = r.clone(); caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
      }
      return r;
    }).catch(() => caches.match(req).then((m) =>
      m || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
