import { TONE_CLASSES } from './tones'

/**
 * Etiqueta de estado en píldora, como los chips de Club-search. El tono lo decide `statusTone()` en lib/enums.
 */
export default function Badge({ text, tone = 'neutral', title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold leading-5 whitespace-nowrap ${TONE_CLASSES[tone] ?? TONE_CLASSES.neutral}`}
    >
      {text ?? '—'}
    </span>
  )
}
