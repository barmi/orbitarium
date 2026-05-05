interface Props {
  readonly utcIso: string
  readonly daysOffset: number
  readonly onDaysOffsetChange: (value: number) => void
}

const MAX_OFFSET_DAYS = 365 * 5 // ±5 years

export default function TimeControl({ utcIso, daysOffset, onDaysOffsetChange }: Props) {
  return (
    <section className="body-panel" aria-labelledby="body-time-title">
      <div className="body-panel__head">
        <p className="body-panel__eyebrow">Panel 2</p>
        <h2 id="body-time-title">Time</h2>
      </div>
      <label className="body-control">
        <span className="body-control__label">
          Offset (days) <strong data-testid="time-offset">{daysOffset.toFixed(1)}</strong>
        </span>
        <input
          aria-label="Time offset days"
          type="range"
          min={-MAX_OFFSET_DAYS}
          max={MAX_OFFSET_DAYS}
          step={1}
          value={daysOffset}
          onChange={(e) => onDaysOffsetChange(Number(e.currentTarget.value))}
        />
      </label>
      <div className="body-info">
        <div className="body-info__row">
          <span>UTC (now + offset)</span>
          <span data-testid="body-utc">{utcIso}</span>
        </div>
      </div>
    </section>
  )
}
