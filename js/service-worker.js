// ============================================
// FINANZAS SAAS - Service Worker
// ============================================

const CACHE_VERSION = 'finanzas-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/supabase-client.js',
  '/js/saas.js',
  '/manifest.json'
];

// ============= INSTALACIÓN =============

self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('Service Worker: Caché creado');
        return cache.addAll(CACHE_URLS).catch(err => {
          console.warn('Algunos recursos no pudieron ser cacheados:', err);
          // No fallar completamente si algunos recursos no están disponibles
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// ============= ACTIVACIÓN =============

self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('Service Worker: Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============= FETCH STRATEGY: Cache First, Network Fallback =============

self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // No cachear llamadas a API (Supabase)
  if (event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Cache first strategy para assets estáticos
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Actualizar caché en background
          fetch(event.request).then(newResponse => {
            if (newResponse && newResponse.status === 200) {
              caches.open(CACHE_VERSION).then(cache => {
                cache.put(event.request, newResponse);
              });
            }
          }).catch(() => {});
          
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // Cachear respuestas exitosas
            if (response && response.status === 200) {
              const cacheResponse = response.clone();
              caches.open(CACHE_VERSION).then(cache => {
                cache.put(event.request, cacheResponse);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback offline
            return caches.match('/index.html');
          });
      })
  );
});

// ============= SINCRONIZACIÓN EN BACKGROUND =============

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Obtener datos pendientes del IndexedDB
    const db = await openDB();
    const pendingData = await db.getAll('pending');
    
    for (const item of pendingData) {
      try {
        // Enviar al servidor
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(item)
        });
        
        // Eliminar de pendientes
        await db.delete('pending', item.id);
      } catch (error) {
        console.error('Error sincronizando:', error);
      }
    }
    
    // Notificar al cliente
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE'
      });
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    throw error;
  }
}

// ============= NOTIFICACIONES PUSH =============

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {
    title: 'FinanzasPro',
    body: 'Nueva actualización'
  };

  const options = {
    body: data.body || 'Nueva notificación',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231f3c88" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dominant-baseline="central">💰</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%231f3c88" width="96" height="96"/><text x="48" y="48" font-size="60" fill="white" text-anchor="middle" dominant-baseline="central">💰</text></svg>',
    vibrate: [100, 50, 100],
    tag: data.tag || 'notification',
    requireInteraction: false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FinanzasPro', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // Si hay una ventana abierta, enfócar
        for (let i = 0; i < clients.length; i++) {
          if (clients[i].url === '/' && 'focus' in clients[i]) {
            return clients[i].focus();
          }
        }
        // Si no, abrir nueva ventana
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// ============= PERIODIC BACKGROUND SYNC =============

self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  } else if (event.tag === 'check-updates') {
    event.waitUntil(checkUpdates());
  }
});

async function syncInvoices() {
  try {
    // Sincronizar facturas pendientes
    const response = await fetch('/api/invoices/pending');
    const invoices = await response.json();
    
    if (invoices.length > 0) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'INVOICES_SYNC',
          data: invoices
        });
      });
    }
  } catch (error) {
    console.error('Error sincronizando facturas:', error);
  }
}

async function checkUpdates() {
  try {
    const response = await fetch('/api/app-version');
    const data = await response.json();
    
    if (data.version > CACHE_VERSION) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'APP_UPDATE_AVAILABLE'
        });
      });
    }
  } catch (error) {
    console.error('Error verificando actualizaciones:', error);
  }
}

// ============= INDEXEDDB PARA DATOS OFFLINE =============

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinanzasProDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'url' });
      }
    };
  });
}

// ============= MENSAJES DESDE CLIENTE =============

self.addEventListener('message', event => {
  if (event.data.type === 'SAVE_OFFLINE_DATA') {
    saveOfflineData(event.data.data);
  } else if (event.data.type === 'CLEAR_CACHE') {
    clearCache();
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function saveOfflineData(data) {
  try {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    await store.add(data);
    tx.oncomplete = () => {
      console.log('Datos guardados para sincronización offline');
    };
  } catch (error) {
    console.error('Error guardando datos offline:', error);
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    console.log('Caché eliminado');
  } catch (error) {
    console.error('Error limpiando caché:', error);
  }
}

console.log('Service Worker registrado');
