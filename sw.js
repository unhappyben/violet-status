/* Service worker: network-first caching for the app shell, plus web push
   handling. Only active over HTTPS (Vercel). */
var CACHE = 'violet-status-v2';
var ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'config.js',
  'sha256.js',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});

// ---------- web push ----------

self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Violet update', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      tag: 'violet-status',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
