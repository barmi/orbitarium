interface Props {
  readonly starfieldOn: boolean
  readonly vmagCutoff: number
  readonly visibleCount: number
  readonly totalCount: number
  readonly loadError: string | null
  readonly onStarfieldToggle: (value: boolean) => void
  readonly onVmagChange: (value: number) => void
}

export default function StarfieldControls({
  starfieldOn,
  vmagCutoff,
  visibleCount,
  totalCount,
  loadError,
  onStarfieldToggle,
  onVmagChange,
}: Props) {
  return (
    <section className="render-panel" aria-labelledby="render-starfield-title">
      <div className="render-panel__head">
        <p className="render-panel__eyebrow">Panel 2</p>
        <h2 id="render-starfield-title">Starfield (Hipparcos)</h2>
      </div>

      <label className="render-control">
        <span className="render-control__label">
          Visible <strong data-testid="starfield-toggle">{starfieldOn ? 'ON' : 'OFF'}</strong>
        </span>
        <input
          aria-label="Starfield toggle"
          type="checkbox"
          checked={starfieldOn}
          onChange={(e) => onStarfieldToggle(e.currentTarget.checked)}
        />
      </label>

      <label className="render-control">
        <span className="render-control__label">
          Vmag cutoff <strong data-testid="vmag-value">{vmagCutoff.toFixed(1)}</strong>
        </span>
        <input
          aria-label="Vmag cutoff"
          type="range"
          min={0}
          max={6}
          step={0.1}
          value={vmagCutoff}
          onChange={(e) => onVmagChange(Number(e.currentTarget.value))}
        />
      </label>

      <div className="render-info">
        <div className="render-info__row">
          <span>Catalog</span>
          <span data-testid="starfield-count">
            {totalCount > 0 ? `${visibleCount} / ${totalCount} stars` : '— loading'}
          </span>
        </div>
        {loadError && <p className="render-error">{loadError}</p>}
      </div>
    </section>
  )
}
