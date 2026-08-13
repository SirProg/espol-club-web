import { QRCodeSVG } from 'qrcode.react'

/**
 * Código QR de una credencial.
 *
 * Va siempre sobre blanco con tinta casi negra, **también en tema oscuro**:
 * `theme.js` define `qrSurface` y `qrInk` como los dos únicos colores que no
 * cambian con el tema, porque un lector necesita contraste real y un QR claro
 * sobre fondo oscuro falla en la mitad de las cámaras.
 *
 * En SVG y no en canvas: escala sin pixelarse cuando alguien acerca el teléfono
 * al lector, y se imprime bien.
 */
export default function QrCode({ value, size = 200, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-[10px] p-3 ${className}`}
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        // Nivel M: aguanta un poco de suciedad o reflejo en la pantalla sin
        // inflar el tamaño del módulo como haría el nivel H.
        level="M"
        bgColor="#FFFFFF"
        fgColor="#0B1119"
        marginSize={0}
      />
    </div>
  )
}
