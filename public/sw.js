/**
 * Service worker de ESPOLCLUB.
 *
 * Estrategia por tipo de petición, no una sola para todo:
 *
 *  · Navegación → red primero, y si no hay conexión se sirve el index cacheado
 *    (la SPA se encarga del resto) o, en última instancia, offline.html.
 *  · Estáticos del propio sitio → caché primero. Vite les pone un hash en el
 *    nombre, así que un archivo cacheado nunca queda obsoleto: si cambia, cambia
 *    su nombre.
 *  · Todo lo demás (el API) → ni se toca. Ver la nota de abajo.
 *
 * NUNCA se cachea el API. Sus respuestas van firmadas con el token de quien
 * pregunta: guardar una nómina o una credencial en la caché del navegador
 * significaría servírsela a la siguiente persona que use ese equipo. El API vive
 * en otro origen (AlwaysData), así que basta con dejar pasar todo lo que no sea
 * de este mismo origen, y por si acaso se descarta también cualquier ruta /api.
 */

const VERSION = 'espolclub-v3'

/** El armazón: lo mínimo para que la aplicación arranque sin red. */
const SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/Kokoa.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      // addAll falla entero si un archivo falla; con allSettled un icono que
      // falte no impide instalar el service worker.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Otro origen (el API) o una ruta de API en este mismo origen: pasa de largo.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Navegación: red primero para que un despliegue nuevo se vea enseguida.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(VERSION).then((cache) => cache.put('/index.html', copia))
          return respuesta
        })
        .catch(async () => (await caches.match('/index.html')) ?? caches.match('/offline.html')),
    )
    return
  }

  // Estáticos: caché primero, y lo que llegue de red se guarda para la próxima.
  event.respondWith(
    caches.match(request).then((enCache) => {
      if (enCache) return enCache
      return fetch(request).then((respuesta) => {
        if (respuesta.ok && respuesta.type === 'basic') {
          const copia = respuesta.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copia))
        }
        return respuesta
      })
    }),
  )
})
