import { forwardRef } from 'react'

const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-strong disabled:bg-hairline disabled:text-ink-faint',
  secondary:
    'bg-transparent text-ink ring-[1.5px] ring-inset ring-primary hover:bg-primary/7 disabled:text-ink-faint disabled:ring-border',
  danger:
    'bg-danger text-on-danger hover:opacity-90 disabled:bg-hairline disabled:text-ink-faint',
  ghost:
    'bg-transparent text-primary hover:bg-primary-soft disabled:text-ink-faint',
}

const SIZES = {
  sm: 'min-h-11 px-4 text-[15px] md:min-h-[38px]',
  md: 'min-h-11 px-5 text-base',
}

/**
 * Botón en píldora de Club-search. El color de estado solo en la variante
 * danger. Objetivo táctil ≥ 44px en el breakpoint móvil.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,color,transform] duration-200 ease-gallery active:translate-y-px disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
})

export default Button
