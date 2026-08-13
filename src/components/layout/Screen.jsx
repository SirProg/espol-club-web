/**
 * Envoltorio de página: ancho máximo y padding consistente.
 */
export default function Screen({ children, className = '', narrow }) {
  return (
    <main className={`mx-auto w-full px-4 py-6 md:px-8 md:py-8 ${narrow ? 'max-w-3xl' : 'max-w-6xl'} ${className}`}>
      {children}
    </main>
  )
}
