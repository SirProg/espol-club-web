/**
 * Ramas de Club-search: lacas de guitarra y pictogramas por tema.
 *
 * Es una agrupación editorial para dar color a los clubes, no un dato oficial,
 * y por eso no viene del API. La sigla es la clave porque es lo único que llega
 * en todas las respuestas (las membresías no traen áreas de interés). Un club
 * nuevo sin entrada cae en `otras`.
 */

export const BRANCHES = {
  programacion: { name: 'Programación y datos', color: '#2E5BD6', ink: '#FFFFFF' },
  robotica: { name: 'Robótica y electrónica', color: '#C93A2C', ink: '#FFFFFF' },
  tierra: { name: 'Ingeniería civil y de la tierra', color: '#3D7A38', ink: '#FFFFFF' },
  industria: { name: 'Industria y producción', color: '#F0A030', ink: '#1C1A3A' },
  arte: { name: 'Arte, cine y diseño', color: '#F2A7BC', ink: '#1C1A3A' },
  cultura: { name: 'Cultura e identidad', color: '#7FD3C0', ink: '#1C1A3A' },
  comunidad: { name: 'Debate, liderazgo y comunidad', color: '#6A4FC9', ink: '#FFFFFF' },
  otras: { name: 'Otras organizaciones', color: '#5F5B78', ink: '#FFFFFF' },
}

const CLUB_BRANCH = {
  KOKOA: 'programacion',
  CIAP: 'programacion',
  TAWS: 'programacion',
  NIOT: 'programacion',
  MSP: 'programacion',
  'D.A.T.A': 'programacion',
  MECATRÓNICA: 'robotica',
  PHYCOM: 'robotica',
  IEEE: 'robotica',
  RAS: 'robotica',
  ROBOTA: 'robotica',
  ASCE: 'tierra',
  AAPG: 'tierra',
  GISSC: 'tierra',
  SPE: 'tierra',
  ACI: 'tierra',
  SME: 'tierra',
  IAHR: 'tierra',
  ASME: 'industria',
  IIE: 'industria',
  IFT: 'industria',
  CLIP: 'industria',
  ASHRAE: 'industria',
  AICHE: 'industria',
  SNAME: 'industria',
  AWS: 'industria',
  CIMAT: 'industria',
  MAEC: 'industria',
  TWEENING: 'arte',
  ALUCINE: 'arte',
  'D-PRO': 'arte',
  BREIK: 'arte',
  FANPOL: 'cultura',
  ARQUEOLOGÍA: 'cultura',
  ACP: 'cultura',
  ARGUMENTUM: 'comunidad',
  ACUP: 'comunidad',
  CDS: 'comunidad',
}

export function branchOf(acronym) {
  return CLUB_BRANCH[(acronym ?? '').toUpperCase()] ?? 'otras'
}

/** Variables CSS que consumen .lacquered, .club-art y .club-fold. */
export function lacquerStyle(acronym) {
  const { color, ink } = BRANCHES[branchOf(acronym)]
  return { '--lacquer': color, '--lacquer-ink': ink }
}
