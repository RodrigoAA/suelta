/* Suelta — service worker: precache del cascarón, red primero para el HTML. */
var CACHE = 'suelta-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts/newsreader-normal.woff2',
  './fonts/newsreader-italic.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    // HTML: red primero (para recibir actualizaciones), caché si no hay red.
    e.respondWith(
      fetch(req).then(function (res) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copia); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Resto: caché primero, red como respaldo (y se guarda para la próxima).
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return res;
      });
    })
  );
});
