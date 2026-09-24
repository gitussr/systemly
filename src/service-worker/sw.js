/* Systemly service worker.
 *
 * The build (src/integrations/service-worker.ts) prepends:
 *   const VERSION = '<hash of the precached files>';
 *   const PRECACHE = ['/', '/roadmap', …];
 *
 * Strategy
 * - Install: save the app shell, search index, fonts and every approved chapter.
 * - Pages: network first (short timeout), so online readers always get the latest text;
 *   offline, the saved copy is served, or /offline if the page was never saved.
 * - /_astro/* (content-hashed, immutable): cache first, saved on first use
 *   (this is how Mermaid chunks become available offline after a diagram is viewed).
 * - Other files: stale-while-revalidate.
 * A new version activates immediately; old caches are removed.
 */
/* global VERSION, PRECACHE */

const PRECACHE_NAME = `systemly-precache-${VERSION}`;
const RUNTIME_NAME = 'systemly-runtime';
const OFFLINE_URL = '/offline';
const NETWORK_TIMEOUT_MS = 4000;
const RUNTIME_MAX_ENTRIES = 200;
// Our caches only hold same-origin GET responses keyed by URL. Servers may add `Vary: Origin`,
// which would stop module scripts (sent with an Origin header) from matching when offline.
const MATCH = { ignoreVary: true };
const MATCH_ANY_QUERY = { ignoreVary: true, ignoreSearch: true };

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          const response = await fetch(url, { cache: 'reload' });
          if (!response.ok) throw new Error(`Precache failed for ${url}: ${response.status}`);
          await cache.put(url, await cleanResponse(response));
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('systemly-') && name !== PRECACHE_NAME && name !== RUNTIME_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request, url));
  } else if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

async function networkFirstPage(request, url) {
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (response.ok) {
      const runtime = await caches.open(RUNTIME_NAME);
      await runtime.put(pageKey(url), await cleanResponse(response.clone()));
      void trim(runtime);
    }
    return response;
  } catch {
    const cached =
      (await caches.match(pageKey(url), MATCH_ANY_QUERY)) ??
      (await caches.match(url.pathname, MATCH_ANY_QUERY));
    return cached ?? (await caches.match(OFFLINE_URL, MATCH)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const runtime = await caches.open(RUNTIME_NAME);
    await runtime.put(request, response.clone());
    void trim(runtime);
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request, MATCH_ANY_QUERY);
  const update = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cached ? await cacheNameOf(request) : RUNTIME_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  return (await update) ?? Response.error();
}

/** Pages are stored without a trailing slash, matching the site's links. */
function pageKey(url) {
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
  return new URL(path, url.origin).href;
}

/** Redirected responses cannot be served for navigations; store a plain copy. */
async function cleanResponse(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function cacheNameOf(request) {
  const precache = await caches.open(PRECACHE_NAME);
  return (await precache.match(request, MATCH_ANY_QUERY)) ? PRECACHE_NAME : RUNTIME_NAME;
}

/** Keeps the runtime cache bounded: oldest entries go first. */
async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - RUNTIME_MAX_ENTRIES))) {
    await cache.delete(key);
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
