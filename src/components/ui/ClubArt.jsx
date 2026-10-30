import { useState } from 'react'

import { lacquerStyle } from '../../lib/branches'

/**
 * Logo del club sobre su laca. Si no tiene o no carga (son imágenes externas de
 * las páginas de la ESPOL), su sigla ocupa el mismo sitio.
 */
export default function ClubArt({ acronym, image, className = '' }) {
  const [failed, setFailed] = useState(false)
  const text = acronym ?? ''

  return (
    <div className={`club-art ${className}`} style={lacquerStyle(acronym)}>
      {image && !failed ? (
        <img
          className="club-art__media"
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="club-art__mono" style={{ '--chars': Math.max(text.length, 2) }} aria-hidden="true">
          {text}
        </span>
      )}
    </div>
  )
}
