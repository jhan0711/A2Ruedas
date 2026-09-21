/**
 * A2Ruedas Service Worker
 * Proporciona soporte offline, pre-cacheo del app shell y actualización en segundo plano.
 */

const CACHE_NAME = 'a2ruedas-pwa-v1';

// Recursos críticos para el funcionamiento base sin conexión
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/offline.html',
  '/bike-icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/icon-maskable-512x512.svg',
];

// 1. Ciclo de Instalación: Pre-caché de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Forzar activación inmediata sin esperar a que se cierren pestañas
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] Error en pre-caché:', err);
      })
  );
});

// 2. Ciclo de Activación: Limpieza y purga de versiones antiguas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control de todos los clientes activos inmediatamente
        return self.clients.claim();
      })
  );
});

// 3. Intercepción de Peticiones de Red (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Omitir peticiones que no sean GET o esquemas no soportados (ej. chrome-extension:)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A) Navegación de páginas HTML (SPA) -> Network First con Fallback a Caché y a offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si no hay red, buscar en caché la ruta solicitada o la raíz
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;

          // Si no está disponible, mostrar pantalla de contingencia offline
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // B) Recursos estáticos locales (scripts, estilos, fuentes, imágenes locales) -> Cache First con Network Update
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.png'));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Opcionalmente actualizar en segundo plano (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {
              // Silencioso si falla la actualización de fondo
            });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // C) Peticiones externas o API (Supabase, Unsplash) -> Network First con fallback seguro
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión a internet' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
});

// 4. Mensajería entre la aplicación y el Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
