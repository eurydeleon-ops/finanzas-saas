// ============================================================================
// SERVICE WORKER - Finanzas SaaS PWA
// ============================================================================

const CACHE_NAME = 'finanzas-saas-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/app.js',
  '/manifest.json'
];

const DYNAMIC_CACHE = 'finanzas-saas-dynamic-v1';
const API_CACHE = 'finanzas-saas-api-v1';
const IMAGE_CACHE = 'finanzas-saas-images-v1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache estático inicializado');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Error al cachear assets:', error);
      })
  );
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son GET
  if (request.method !== 'GET') {
    return;
  }

  // Requests a API de Supabase
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Imágenes
  if (request.destination === 'image') {
    event.respondWith(cacheImages(request));
    return;
  }

  // Assets estáticos
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Por defecto: network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================================================
// ESTRATEGIAS DE CACHE
// ============================================================================

/**
 * Cache First: usar cache si existe, si no hacer request
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Error en cacheFirst:', error);
    return new Response('Offline - Sin conexión', { status: 503 });
  }
}

/**
 * Network First: hacer request, si no funciona usar cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Error de red, usando cache:', error);
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response('Offline - Sin conexión', { status: 503 });
  }
}

/**
 * Cache Images: estrategia especial para imágenes
 */
async function cacheImages(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('Error cacheando imagen:', error);
    // Retornar imagen placeholder en base64
    return new Response(
      'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}

// ============================================================================
// SYNC DE DATOS
// ============================================================================

// Sync cuando hay conexión de nuevo
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Aquí iría la lógica de sync de datos
    console.log('Sincronizando datos...');
  } catch (error) {
    console.error('Error sincronizando:', error);
  }
}

// ============================================================================
// NOTIFICACIONES PUSH
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const options = {
    body: event.data.text(),
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231e40af" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">$</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%231e40af" width="96" height="96"/><text x="50%" y="50%" font-size="60" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">$</text></svg>',
    tag: 'finanzas-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Finanzas SaaS', options)
  );
});

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si hay una ventana abierta, focalizar
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
});

// Mensaje desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
