/* Carts service worker — offline-cache voor het app-shell zodat de app
   als PWA op een gsm geïnstalleerd kan worden. Netwerk-eerst voor navigatie
   (nieuwe deploys winnen), cache-eerst voor gehashte assets. */
const CACHE = 'carts-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith('/carts/')
  ) {
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((match) => match ?? caches.match('/carts/'))
            .then((match) => match ?? Response.error()),
        ),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (match) =>
        match ??
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});
