var CACHE = 'pesoscan-v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/html5-qrcode.min.js',
  './vendor/tesseract.min.js',
  './vendor/worker.min.js',
  './vendor/tesseract-core-simd-lstm.js',
  './vendor/tesseract-core-simd-lstm.wasm',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  // Deliberately does NOT call skipWaiting() here: an updated worker should
  // sit in "waiting" until the page asks it to take over, so the app can
  // show an update notice instead of silently swapping code under an open,
  // in-use session.
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
  );
});

self.addEventListener('message', function(e){
  if(e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')){
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(resp){
        if(resp && resp.status === 200){
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
