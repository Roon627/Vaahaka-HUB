/* Ihusaas service worker.
 *
 * Deliberately small and privacy-first:
 *  - It ONLY handles same-origin GET requests. Supabase (and any other origin) is never
 *    intercepted, so stories, reactions and comments are never cached or replayed offline.
 *  - Navigations: network first; offline, a cached copy if we have one (e.g. /help), else the standalone /offline.html.
 *  - Hashed build assets, brand images and map/island data: cache first, refreshed in the background.
 * Bump VERSION to invalidate caches after a change to this file's strategy.
 */
const VERSION = "v8";
const SHELL = `rf-shell-${VERSION}`;
const RUNTIME = `rf-rt-${VERSION}`;
const PRECACHE = ["/offline.html", "/brand/stickers/sad.svg", "/help", "/brand/mark.svg", "/brand/png/icon-192.png", "/data/maldives-atolls.geojson", "/data/maldives-islands.json"];

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

const STATIC = /^\/(_next\/static\/|brand\/|data\/)|\.(?:png|svg|jpg|jpeg|webp|woff2?|ttf|ico)$/;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase / other origins
  if (url.pathname.startsWith("/api/") || req.headers.has("authorization")) return;
  // install metadata goes straight to the network: the worker must never sit between iOS and its home-screen icon / manifest
  if (/^\/(apple-icon|apple-touch-icon|brand\/png\/icon|manifest\.webmanifest|favicon)/.test(url.pathname)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        // Safari refuses a navigation answered with a redirected response (a 308 on a trailing slash, say):
        // hand it a clean copy so the installed app never ends up on a blank screen.
        .then(async (res) => (res.redirected ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: (() => { const headers = new Headers(res.headers); headers.delete("content-encoding"); headers.delete("content-length"); return headers; })() }) : res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html")))
    );
    return;
  }

  if (STATIC.test(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req).then(async (res) => { if (res.ok && !/no-store|private/i.test(res.headers.get("cache-control") || "")) await cache.put(req, res.clone()); return res; }).catch(() => hit || Response.error());
        event.waitUntil(refresh.then(() => undefined));
        return hit || refresh;
      })
    );
  }
  // everything else (RSC payloads, API routes) goes straight to the network
});
