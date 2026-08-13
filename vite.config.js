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
})
