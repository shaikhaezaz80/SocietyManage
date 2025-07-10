const CACHE_NAME = 'gatesphere-v1.0.0';
const STATIC_CACHE = 'gatesphere-static-v1.0.0';
const DYNAMIC_CACHE = 'gatesphere-dynamic-v1.0.0';

const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://cdn.tailwindcss.com/3.4.0',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

const API_CACHE_STRATEGY = {
  '/api/dashboard/stats': 'cache-first',
  '/api/visitors': 'network-first',
  '/api/announcements': 'network-first',
  '/api/complaints': 'network-first'
};

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch(err => {
        console.error('Failed to cache static files:', err);
      })
  );
  
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static file requests
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Default: try network first, then cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests with different strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const strategy = getApiCacheStrategy(url.pathname);
  
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request);
      default:
        return await networkOnly(request);
    }
  } catch (error) {
    console.error('API request failed:', error);
    
    // Return cached data if available, otherwise return offline response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your internet connection.' 
      }),
      { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  try {
    // Try cache first for static files
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Static request failed:', error);
    
    // For HTML requests, return app shell
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    throw error;
  }
}

// Cache strategies
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.status === 200) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
  }
  
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkOnly(request) {
  return await fetch(request);
}

// Get cache strategy for API endpoint
function getApiCacheStrategy(pathname) {
  return API_CACHE_STRATEGY[pathname] || 'network-first';
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'visitor-sync') {
    event.waitUntil(syncVisitors());
  } else if (event.tag === 'complaint-sync') {
    event.waitUntil(syncComplaints());
  } else if (event.tag === 'message-sync') {
    event.waitUntil(syncMessages());
  }
});

// Sync offline visitors
async function syncVisitors() {
  try {
    const db = await openDB();
    const tx = db.transaction(['offline-visitors'], 'readonly');
    const store = tx.objectStore('offline-visitors');
    const visitors = await store.getAll();
    
    for (const visitor of visitors) {
      try {
        const response = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitor.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          const deleteTx = db.transaction(['offline-visitors'], 'readwrite');
          const deleteStore = deleteTx.objectStore('offline-visitors');
          await deleteStore.delete(visitor.id);
        }
      } catch (error) {
        console.error('Failed to sync visitor:', error);
      }
    }
  } catch (error) {
    console.error('Visitor sync failed:', error);
  }
}

// Sync offline complaints
async function syncComplaints() {
  try {
    const db = await openDB();
    const tx = db.transaction(['offline-complaints'], 'readonly');
    const store = tx.objectStore('offline-complaints');
    const complaints = await store.getAll();
    
    for (const complaint of complaints) {
      try {
        const response = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complaint.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          const deleteTx = db.transaction(['offline-complaints'], 'readwrite');
          const deleteStore = deleteTx.objectStore('offline-complaints');
          await deleteStore.delete(complaint.id);
        }
      } catch (error) {
        console.error('Failed to sync complaint:', error);
      }
    }
  } catch (error) {
    console.error('Complaint sync failed:', error);
  }
}

// Sync offline messages
async function syncMessages() {
  try {
    const db = await openDB();
    const tx = db.transaction(['offline-messages'], 'readonly');
    const store = tx.objectStore('offline-messages');
    const messages = await store.getAll();
    
    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          const deleteTx = db.transaction(['offline-messages'], 'readwrite');
          const deleteStore = deleteTx.objectStore('offline-messages');
          await deleteStore.delete(message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Message sync failed:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GateSphereDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-visitors')) {
        db.createObjectStore('offline-visitors', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offline-complaints')) {
        db.createObjectStore('offline-complaints', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offline-messages')) {
        db.createObjectStore('offline-messages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'You have a new notification',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/dismiss-icon.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data.url = data.url || options.data.url;
  }
  
  event.waitUntil(
    self.registration.showNotification('GateSphere', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default click action
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
