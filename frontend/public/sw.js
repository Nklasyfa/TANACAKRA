const CACHE_NAME = 'tanacakra-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest'
]

// Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Precache partial fail:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event: Network-first for API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin non-GET requests or chrome-extension schemes
  if (event.request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // Bypass API, Supabase, and dynamic external services so client fetch/axios interceptors handle errors natively
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co') || url.hostname.includes('openstreetmap.org')) {
    return
  }

  // For HTML navigations: Network-first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html').then((cached) => cached || new Response('Offline', { status: 503 }))
      })
    )
    return
  }

  // For static assets (JS, CSS, images, fonts): Cache-first with network background fetch
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background revalidate
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
          }
        }).catch(() => {})
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }
        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return networkResponse
      }).catch(() => {
        // Safe offline response instead of null to prevent ServiceWorker DOMException
        return new Response('', { status: 408, statusText: 'Asset not available offline' })
      })
    })
  )
})
