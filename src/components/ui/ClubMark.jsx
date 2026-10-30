import { lacquerStyle } from '../../lib/branches'

/**
 * Sigla del club en su laca, o sobre placa dentro de un gráfico ya lacado.
 * Decorativo: el nombre del club siempre está escrito al lado.
 */
export default function ClubMark({ acronym, size = 44, plaque, className = '' }) {
  return (
    <span
      aria-hidden="true"
      data-long={(acronym ?? '').length > 5 || undefined}
      className={`club-mark ${plaque ? 'club-mark--plaque' : 'lacquered'} ${className}`}
      style={{ '--mark': `${size}px`, ...(plaque ? null : lacquerStyle(acronym)) }}
    >
      {acronym}
    </span>
  )
}
