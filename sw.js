// REDLINE RIDER service worker — offline-capable PWA.
// Cache-first for the vendored engine + assets (immutable, big), network-first
// for the game HTML and the leaderboard/overseer APIs (always want fresh).
const CACHE = 'redline-v2';
const PRECACHE = [
  './',
  './index.html',
  './play.html',
  './economy.js',
  './manifest.webmanifest',
  './overseer-tuning.json',
  './overseer-core.mjs',
  './media/redline-rider-logo-1x1.png',
  './media/redline-rider-banner-1500x500.png',
  './vendor/three/three.module.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache the APIs — leaderboard + overseer telemetry must be live.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'content-type': 'application/json' } })));
    return;
  }

  // Network-first for the document (pick up new deploys); fall back to cache offline.
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(fetch(req).then((r) => {
      const clone = r.clone(); caches.open(CACHE).then((c) => c.put(req, clone));
      return r;
    }).catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))));
    return;
  }

  // Cache-first for everything else (vendored engine, media, fonts).
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
    if (r.ok && (url.origin === location.origin || url.hostname.includes('gstatic'))) {
      const clone = r.clone(); caches.open(CACHE).then((c) => c.put(req, clone));
    }
    return r;
  })));
});
