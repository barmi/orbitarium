import { useEffect, useMemo, useState } from 'react'

import { EARTH_IAU_ROTATION, evaluateRotation, inertialToBodyFixed, utcToJdTdb } from '@/astro'

import { formatFixed } from './format'
import { dateToUtcInputValue, parseUtcInput } from './timeInput'

export default function EarthRotation() {
  const [isLive, setIsLive] = useState(true)
  const [input, setInput] = useState(() => dateToUtcInputValue(new Date()))

  useEffect(() => {
    if (!isLive) return undefined
    const tick = () => setInput(dateToUtcInputValue(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isLive])

  const result = useMemo(() => {
    const date = parseUtcInput(input)
    if (!date) return null
    try {
      const jdTdb = utcToJdTdb(date)
      const angles = evaluateRotation(EARTH_IAU_ROTATION, jdTdb)
      const matrix = inertialToBodyFixed(EARTH_IAU_ROTATION, jdTdb)
      return { date, jdTdb, angles, matrix }
    } catch {
      return null
    }
  }, [input])

  return (
    <section className="astro-panel" aria-labelledby="earth-rotation-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 4</p>
          <h2 id="earth-rotation-title">Earth Rotation</h2>
        </div>
        <button
          type="button"
          aria-pressed={isLive}
          onClick={() => {
            setIsLive(true)
            setInput(dateToUtcInputValue(new Date()))
          }}
        >
          Live
        </button>
      </div>

      <label className="astro-field">
        <span>UTC</span>
        <input
          aria-label="Earth rotation UTC"
          type="datetime-local"
          step="1"
          value={input}
          onChange={(event) => {
            setIsLive(false)
            setInput(event.currentTarget.value)
          }}
        />
      </label>

      {result ? (
        <>
          <div className="astro-rotation-readout">
            <span>W</span>
            <strong data-testid="earth-w">{formatFixed(result.angles.wDeg, 6)}°</strong>
          </div>
          <dl className="astro-kv astro-kv--two">
            <div>
              <dt>Pole RA</dt>
              <dd>{formatFixed(result.angles.raDeg, 9)}°</dd>
            </div>
            <div>
              <dt>Pole Dec</dt>
              <dd>{formatFixed(result.angles.decDeg, 9)}°</dd>
            </div>
            <div>
              <dt>JD TDB</dt>
              <dd>{formatFixed(result.jdTdb, 9)}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{isLive ? 'live' : 'fixed'}</dd>
            </div>
          </dl>
          <div className="astro-matrix" aria-label="Inertial to body-fixed matrix">
            {result.matrix.map((value, index) => (
              <span key={index}>{formatFixed(value, 6)}</span>
            ))}
          </div>
        </>
      ) : (
        <p className="astro-error" role="alert">
          Earth rotation is available for supported post-1972 UTC dates.
        </p>
      )}
    </section>
  )
}
