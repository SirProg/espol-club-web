import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './styles/index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ToastProvider from './components/ui/Toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)

/**
 * Service worker: solo en producción.
 *
 * En desarrollo interceptaría las peticiones de Vite y rompería el recambio en
 * caliente, además de servir versiones cacheadas de módulos recién editados.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la aplicación funciona igual: solo pierde el modo
      // sin conexión y la instalación. No es motivo para molestar a nadie.
    })
  })
}
