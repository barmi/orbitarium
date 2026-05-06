import type { BodyChipProps } from './types'

export default function BodyChip({ slug, label, active = false, onClick, testId }: BodyChipProps) {
  return (
    <button
      type="button"
      className="ui-body-chip"
      data-active={active}
      data-slug={slug}
      data-testid={testId}
      onClick={onClick}
      aria-label={`Body ${slug}`}
    >
      {label}
    </button>
  )
}
