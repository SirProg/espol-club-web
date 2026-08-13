/**
 * Tintas de los tonos de estado: la franja y el badge comparten el mapa.
 * success / warning / danger / neutral.
 */

/**
 * Tinta de los badges: fondo tenue + texto saturado, los pares que define
 * theme.js (`successSoft`/`success`, y `primarySoft`/`primaryStrong` para el
 * neutro). Es lo que usa la app móvil.
 *
 * El relleno sólido con texto blanco no sirve aquí: en el tema oscuro los
 * colores de estado suben de luminosidad —`success` pasa a #4FC98A y `danger`
 * a #F2776F— y el blanco encima deja de leerse.
 */
export const TONE_CLASSES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  star: 'bg-star-soft text-star',
  neutral: 'bg-primary-soft text-primary-strong',
}

export const TONE_STRIPES = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-hairline',
}

/** Traduce un tono a clases de texto/soft para avisos. */
export const TONE_TEXT = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink-muted',
}

