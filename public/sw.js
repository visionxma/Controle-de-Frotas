const CACHE_NAME = 'frox-cache-v1'

// Assets essenciais para cache inicial
const PRECACHE_ASSETS = ['/manifest.json', '/frox.svg']

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch(() => {})
  )
})

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove caches antigas
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      ),
      // Assume controle imediato de todos os clientes
      self.clients.claim(),
    ])
  )
})

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Só intercepta GET
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Não intercepta: Firebase, Google APIs, rotas de API Next.js
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseapp') ||
    url.hostname.includes('firebasestorage') ||
    url.pathname.startsWith('/api/')
  ) {
    return
  }

  // Estratégia: Network-first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva páginas de navegação no cache para uso offline
        if (response.ok && event.request.mode === 'navigate') {
          const clone = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {})
        }
        return response
      })
      .catch(() => {
        // Offline: tenta retornar do cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // Para navegação offline, retorna a raiz cached
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})
