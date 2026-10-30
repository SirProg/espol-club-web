/** Logo de Kokoa, el mismo de la cabecera de Club-search. */
export default function BrandMark({ height = 28 }) {
  return (
    <img
      src="/Kokoa.svg"
      alt=""
      className="shrink-0"
      style={{ height, width: (height * 574) / 263 }}
    />
  )
}
