interface Props {
  readonly raDeg: number | null
  readonly decDeg: number | null
  readonly wDeg: number | null
  readonly subSolarLonDeg: number | null
  readonly subSolarLatDeg: number | null
}

function fmt(value: number | null, suffix = '°'): string {
  if (value === null) return '—'
  return `${value.toFixed(3)}${suffix}`
}

export default function RotationReadout({
  raDeg,
  decDeg,
  wDeg,
  subSolarLonDeg,
  subSolarLatDeg,
}: Props) {
  return (
    <section className="body-panel" aria-labelledby="body-rotation-title">
      <div className="body-panel__head">
        <p className="body-panel__eyebrow">Panel 3</p>
        <h2 id="body-rotation-title">Rotation</h2>
      </div>
      <div className="body-info">
        <div className="body-info__row">
          <span>Pole α (RA)</span>
          <span data-testid="ra-readout">{fmt(raDeg)}</span>
        </div>
        <div className="body-info__row">
          <span>Pole δ (Dec)</span>
          <span data-testid="dec-readout">{fmt(decDeg)}</span>
        </div>
        <div className="body-info__row">
          <span>Prime meridian W</span>
          <span data-testid="w-readout">{fmt(wDeg)}</span>
        </div>
        <div className="body-info__row">
          <span>Sub-solar lon</span>
          <span data-testid="subsolar-lon">{fmt(subSolarLonDeg)}</span>
        </div>
        <div className="body-info__row">
          <span>Sub-solar lat</span>
          <span data-testid="subsolar-lat">{fmt(subSolarLatDeg)}</span>
        </div>
      </div>
    </section>
  )
}
