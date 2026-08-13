import { TONE_CLASSES } from './tones'

/**
 * Etiqueta de estado. Cuadrada (6px), no píldora — como dicta la escala del
 * proyecto. El tono lo decide `statusTone()` en lib/enums.
 */
export default function Badge({ text, tone = 'neutral', title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-[6px] px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap ${TONE_CLASSES[tone] ?? TONE_CLASSES.neutral}`}
    >
      {text ?? '—'}
    </span>
  )
}
