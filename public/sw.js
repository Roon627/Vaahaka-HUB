/* Ihusaas service worker.
 *
 * Deliberately small and privacy-first:
 *  - It ONLY handles same-origin GET requests. Supabase (and any other origin) is never
 *    intercepted, so stories, reactions and comments are never cached or replayed offline.
 *  - Navigations: network first; offline, a cached copy if we have one (e.g. /help), else the standalone /offline.html.
 *  - Hashed build assets, brand images and map/island data: cache first, refreshed in the background.
 * Bump VERSION to invalidate caches after a change to this file's strategy.
 */
const VERSION = "v2";
const SHELL = `rf-shell-${VERSION}`;
const RUNTIME = `rf-rt-${VERSION}`;
const PRECACHE = ["/offline.html", "/brand/stickers/sad.svg", "/help", "/brand/mark.svg", "/brand/png/icon-192.png", "/manifest.webmanifest", "/data/maldives-atolls.geojson", "/data/maldives-islands.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rf-") && k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const STATIC = /^\/(_next\/static\/|brand\/|data\/)|\.(?:png|svg|jpg|jpeg|webp|woff2?|ico)$/;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase / other origins

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html"))));
    return;
  }

  if (STATIC.test(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || refresh;
      })
    );
  }
  // everything else (RSC payloads, API routes) goes straight to the network
});
