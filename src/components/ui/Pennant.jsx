/**
 * Banderín en chevrón — el trazo institucional de la ESPOL, port de
 * espol-club/src/components/Pennant.js.
 *
 * viewBox "0 0 100 130", path M0 0 H100 V130 L50 101.4 L0 130 Z.
 * ratio fijo: alto = ancho × 1.3. Sin color por club: siempre azul ESPOL.
 */

export default function Pennant({
  text,
  color,
  /**
   * Tinta de la sigla. Por omisión, el par de contraste que el sistema define
   * para `primary` — y que ya se invierte solo entre temas, porque en oscuro el
   * azul se aclara y `on-primary` se oscurece.
   *
   * No se calcula la luminancia aquí: `color` suele ser una variable CSS, y
   * `var(--...)` no se puede leer como hex desde JavaScript.
   */
  ink = 'var(--espol-on-primary)',
  width = 40,
  tone = 'solid',
  className,
}) {
  const fill = color ?? 'var(--espol-primary)'
  const height = width * 1.3
  const label = (text ?? '').slice(0, 2).toUpperCase()

  return (
    <span
      className={className}
      style={{ display: 'inline-block', width, height, lineHeight: 0 }}
      // Decorativo: el nombre del club siempre está escrito al lado.
      aria-hidden="true"
    >
      <svg width={width} height={height} viewBox="0 0 100 130">
        <path
          d="M0 0 H100 V130 L50 101.4 L0 130 Z"
          fill={tone === 'outline' ? 'none' : fill}
          stroke={tone === 'outline' ? fill : 'none'}
          strokeWidth={tone === 'outline' ? 6 : 0}
        />
        {label && (
          <text
            x="50"
            y="72"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Spectral, ui-serif, serif"
            fontWeight="700"
            // En unidades del viewBox, no en píxeles: el SVG las escala al
            // ancho real. Ponerlo en píxeles dejaba la sigla en ~5px.
            fontSize="42"
            letterSpacing="1"
            fill={tone === 'outline' ? fill : ink}
          >
            {label}
          </text>
        )}
      </svg>
    </span>
  )
}
