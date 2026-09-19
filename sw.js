// ⚠️ בכל פעם שאתה מעדכן קובץ כלשהו באפליקציה (index.html וכו'),
// תעלה את המספר הזה (v4 → v5 → v6...). זה היוצר את הגרסה החדשה.
const CACHE_VERSION = 'v4';
const CACHE_NAME = 'lev-schedule-' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // אל תחכה שכל הטאבים הישנים ייסגרו - תפוס שליטה מיד
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('lev-schedule-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // תפוס שליטה על כל הטאבים הפתוחים מיד, בלי לחכות לרענון ידני
  );
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', event => {
  const isHTML = event.request.mode === 'navigate' || event.request.url.endsWith('index.html');

  if (isHTML) {
    // network-first, ותמיד עוקף מטמון HTTP (no-store) כדי לא לקבל גרסה תקועה גם ברמת הדפדפן/שרת
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
