/**
 * Filtro de selección única en chips.
 *
 * Separado de `ChipList`, que solo pinta etiquetas: mezclar presentación y
 * control en el mismo componente obligaría a que todos sus usos actuales
 * pasaran objetos en vez de cadenas.
 */
export default function FilterChips({ items = [], selected, onSelect, ariaLabel }) {
  return (
    <div className="scroll-x -mx-1 px-1" role="group" aria-label={ariaLabel}>
      <ul className="flex gap-2">
        {items.map((item) => {
          const activo = item.value === selected
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-pressed={activo}
                onClick={() => onSelect(item.value)}
                className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors ${
                  activo
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-ink ring-[1.5px] ring-inset ring-primary hover:bg-primary/7'
                }`}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
