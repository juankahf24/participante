/* MILITOPO participante · recarga offline segura v53 */
const MILITOPO_PARTICIPANT_CACHE = "militopo-participante-offline-v53";
const PARTICIPANT_CORE = ["./", "./Militopo_participante_offline.html", "./sw.js"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(MILITOPO_PARTICIPANT_CACHE);
    await Promise.allSettled(PARTICIPANT_CORE.map(url => cache.add(new Request(url, { cache: "reload" }))));
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

async function cached(request) {
  return (await caches.match(request, { ignoreSearch: false })) ||
         (await caches.match(request, { ignoreSearch: true }));
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(MILITOPO_PARTICIPANT_CACHE);
    try {
      const preload = await event.preloadResponse;
      const response = preload || await fetch(request);
      if (response && response.status !== 206) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (e) {
      const hit = await cached(request);
      if (hit) return hit;
      if (request.mode === "navigate") {
        const fallback = await cached(new Request("./Militopo_participante_offline.html")) || await cached(new Request("./"));
        if (fallback) return fallback;
        return new Response("<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>MILITOPO offline</title><body style='font-family:monospace;background:#10190b;color:#f5e6c8;padding:24px'><h1>MILITOPO participante sin cobertura</h1><p>Esta app todavía no estaba guardada en este móvil. Ábrela una vez con cobertura antes de empezar.</p></body>", { headers: { "Content-Type": "text/html;charset=utf-8" } });
      }
      return new Response("", { status: 503, statusText: "Offline" });
    }
  })());
});