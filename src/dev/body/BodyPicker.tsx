import { useNavigate } from 'react-router-dom'

import { BODY_CATALOG } from '@/bodies'

interface Props {
  readonly currentSlug: string
}

export default function BodyPicker({ currentSlug }: Props) {
  const navigate = useNavigate()
  return (
    <section className="body-panel" aria-labelledby="body-picker-title">
      <div className="body-panel__head">
        <p className="body-panel__eyebrow">Panel 1</p>
        <h2 id="body-picker-title">Body</h2>
      </div>
      <label className="body-control">
        <span className="body-control__label">Select</span>
        <select
          aria-label="Body picker"
          value={currentSlug}
          onChange={(e) => {
            void navigate(`/dev/body/${e.currentTarget.value}`)
          }}
        >
          {BODY_CATALOG.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.label} ({b.kind})
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
