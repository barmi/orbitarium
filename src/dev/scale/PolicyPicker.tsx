import { DISTANCE_POLICIES, SIZE_POLICIES, ZOOM_INNER, ZOOM_OUTER } from '@/scale'

interface Props {
  readonly distancePolicyName: string
  readonly sizePolicyName: string
  readonly zoom: number
  readonly onDistanceChange: (name: string) => void
  readonly onSizeChange: (name: string) => void
  readonly onZoomChange: (zoom: number) => void
}

export default function PolicyPicker({
  distancePolicyName,
  sizePolicyName,
  zoom,
  onDistanceChange,
  onSizeChange,
  onZoomChange,
}: Props) {
  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="scale-picker-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 1</p>
          <h2 id="scale-picker-title">Policy Picker</h2>
        </div>
      </div>

      <div className="scale-controls">
        <fieldset className="astro-segmented" aria-label="Distance policy">
          <legend>Distance</legend>
          {DISTANCE_POLICIES.map((p) => (
            <label key={p.name}>
              <input
                type="radio"
                name="scale-distance-policy"
                value={p.name}
                checked={p.name === distancePolicyName}
                onChange={() => onDistanceChange(p.name)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="astro-segmented" aria-label="Size policy">
          <legend>Size</legend>
          {SIZE_POLICIES.map((p) => (
            <label key={p.name}>
              <input
                type="radio"
                name="scale-size-policy"
                value={p.name}
                checked={p.name === sizePolicyName}
                onChange={() => onSizeChange(p.name)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </fieldset>

        <label className="scale-zoom-slider">
          <span>
            Adaptive zoom: log<sub>10</sub>(AU) ={' '}
            <strong data-testid="zoom-value">{zoom.toFixed(2)}</strong>
          </span>
          <input
            aria-label="Adaptive zoom"
            type="range"
            min={ZOOM_INNER}
            max={ZOOM_OUTER}
            step={0.05}
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
          />
        </label>
      </div>
    </section>
  )
}
