import { useId } from 'react'

/**
 * Esquina de papel despegada, la de las tarjetas de Club-search. Aquí es solo
 * una señal: toda la tarjeta es el enlace, y un botón dentro sería HTML inválido.
 */
export default function ClubFold() {
  const id = useId()
  const paperId = `${id}-paper`
  const creaseId = `${id}-crease`
  const shadowId = `${id}-shadow`

  // La curva sobresale de la diagonal: es el borde levantado, no un triángulo plano.
  const liftedEdge = 'M0 0C4 2 8 7 12 19C17 41 50 33 52 52'

  return (
    <span className="club-fold" aria-hidden="true">
      <svg className="club-fold__corner" viewBox="0 0 52 52">
        <defs>
          <linearGradient id={paperId} gradientUnits="userSpaceOnUse" x1="12" y1="48" x2="42" y2="8">
            <stop stopColor="var(--corner-shade)" />
            <stop offset="0.45" stopColor="var(--corner-paper)" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id={creaseId} gradientUnits="userSpaceOnUse" x1="14" y1="36" x2="29" y2="19">
            <stop stopColor="var(--corner-shade)" />
            <stop offset="0.35" stopColor="var(--corner-shade)" />
            <stop offset="0.7" stopColor="#ffffff" />
            <stop offset="0.88" stopColor="var(--corner-paper)" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <path className="club-fold__shadow" d={liftedEdge} transform="translate(-1 3)" filter={`url(#${shadowId})`} />
        <path d="M0 0H52V52C50 33 17 41 12 19C8 7 4 2 0 0Z" fill={`url(#${paperId})`} />
        <path d="M0 0C15 7 28 34 52 52C50 33 17 41 12 19C8 7 4 2 0 0Z" fill={`url(#${creaseId})`} />
        <path className="club-fold__edge" d={liftedEdge} />
      </svg>
      <svg className="club-fold__icon" viewBox="0 0 24 24">
        <path d="M14 4h6v6M20 4l-6.5 6.5" />
        <path d="M10 20H4v-6M4 20l6.5-6.5" />
      </svg>
    </span>
  )
}
