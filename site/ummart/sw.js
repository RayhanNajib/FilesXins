/* FilesXins demo: lets the demo run straight from disk (file://).
   Every request for an api/*.php path is answered with the matching snapshot. */
const CACHE = 'fx-demo-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.indexOf('/api/') === -1) return;
  const json = url.pathname.replace(/\.php$/, '.json');
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(json).then((r) => r.ok ? r : new Response(
        JSON.stringify({ success: false, demo: true, message: 'Snapshot not found.' }),
        { headers: { 'Content-Type': 'application/json' } }))
    ).catch(() => new Response(
      JSON.stringify({ success: false, demo: true, message: 'Offline.' }),
      { headers: { 'Content-Type': 'application/json' } }))
  );
});
