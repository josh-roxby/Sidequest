/* Side Quest service worker.
 *
 * Deliberately minimal. Android requires a fetch handler before it will offer
 * to install, and that is most of what this is for right now. The offline
 * story that matters, caching an active walk's route and tales so it survives
 * losing signal, comes with the walk flow. See docs/ux-loops.md section E-1.
 *
 * Network first with a cache fallback, so a stale shell can never mask a
 * deploy. Only same-origin GETs are touched. */

const CACHE = "sidequest-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache Next's build output by URL; it is already immutable and
  // content-hashed, and caching it here only risks serving a mixed build.
  if (url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
