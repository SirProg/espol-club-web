import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // InfinityFree sirve el sitio desde la raíz de htdocs/.
  base: '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  // En desarrollo el API se pide por el mismo origen (VITE_API_BASE=/api/v1)
  // y este proxy lo reenvía a Django: el navegador no ve CORS en absoluto.
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Un único archivo JS en vez de un fragmento por pantalla.
         *
         * El sitio se sube a mano por el gestor de archivos de InfinityFree, y
         * 58 fragmentos son 58 subidas. Además el plan gratuito es lento por
         * petición, así que una descarga de ~200 kB comprimidos llega antes que
         * una cascada de fragmentos pequeños. Se pierde la carga diferida por
         * ruta, que en un panel de gestión no cambia nada: quien entra va a
         * navegar por varias pantallas de todos modos.
         */
        inlineDynamicImports: true,
      },
    },
  },
})
