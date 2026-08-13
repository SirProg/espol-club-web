import { forwardRef } from 'react'

const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-strong disabled:bg-hairline disabled:text-ink-faint',
  secondary:
    'bg-surface text-ink ring-1 ring-hairline hover:ring-primary hover:text-primary disabled:text-ink-faint disabled:ring-border',
  danger:
    'bg-danger text-on-danger hover:opacity-90 disabled:bg-hairline disabled:text-ink-faint',
  ghost:
    'bg-transparent text-primary hover:bg-primary-soft disabled:text-ink-faint',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
}

/**
 * Botón del panel. Plano, sin sombras decorativas; el color de estado solo en
 * la variante danger. Objetivo táctil ≥ 44px en el breakpoint móvil.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed md:min-h-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
})

export default Button
