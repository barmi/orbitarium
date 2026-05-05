import { useEffect, useMemo, useState } from 'react'

import { type JdTdb, utcToJdTdb } from '@/astro'
import { type De440Evaluator, type StateVectorICRF } from '@/ephemeris'

import { dateToUtcInputValue } from '../astro/timeInput'
import { DEMO_BODIES, PLANET_BODY_KEYS_FOR_LINEUP } from './bodies'
import { formatExp, metersToAu, vectorMagnitude } from './format'

interface Props {
  readonly evaluator: De440Evaluator | null
}

const PLANETS = DEMO_BODIES.filter((b) => PLANET_BODY_KEYS_FOR_LINEUP.includes(b.key))

interface Row {
  readonly key: string
  readonly label: string
  readonly distanceAu: number | null
  readonly speedKmS: number | null
}

export default function PlanetLineupPanel({ evaluator }: Props) {
  const [now, setNow] = useState(() => dateToUtcInputValue(new Date()))
  const [rows, setRows] = useState<readonly Row[]>([])
  const [error, setError] = useState<string | null>(null)

  const jdTdb = useMemo<JdTdb | null>(() => {
    const date = new Date(`${now}Z`)
    if (Number.isNaN(date.getTime())) return null
    return utcToJdTdb(date)
  }, [now])

  useEffect(() => {
    if (!evaluator || !jdTdb) {
      setRows([])
      return
    }
    let cancelled = false
    setError(null)
    void Promise.all(
      PLANETS.map(async (b): Promise<Row> => {
        try {
          const sv: StateVectorICRF = await evaluator.getStateAt(b.naifId, jdTdb)
          return {
            key: b.key,
            label: b.label,
            distanceAu: metersToAu(vectorMagnitude(sv.position)),
            speedKmS: vectorMagnitude(sv.velocity) / 1000,
          }
        } catch (err) {
          if (err instanceof Error) setError(err.message)
          return { key: b.key, label: b.label, distanceAu: null, speedKmS: null }
        }
      }),
    ).then((next) => {
      if (!cancelled) setRows(next)
    })
    return () => {
      cancelled = true
    }
  }, [evaluator, jdTdb])

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="ephemeris-lineup-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 3</p>
          <h2 id="ephemeris-lineup-title">Planet Lineup (SSB-centered)</h2>
        </div>
        <button type="button" onClick={() => setNow(dateToUtcInputValue(new Date()))}>
          Now
        </button>
      </div>

      {error && (
        <p className="astro-error" role="alert">
          {error}
        </p>
      )}

      <div className="astro-table-wrap">
        <table className="astro-table" data-testid="planet-lineup-table">
          <thead>
            <tr>
              <th>Body</th>
              <th>NAIF</th>
              <th>|r| (AU)</th>
              <th>Speed (km/s)</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((b) => {
              const row = rows.find((r) => r.key === b.key)
              return (
                <tr key={b.key}>
                  <td>{b.label}</td>
                  <td>{b.naifId}</td>
                  <td>{row?.distanceAu != null ? formatExp(row.distanceAu, 4) : '—'}</td>
                  <td>{row?.speedKmS != null ? formatExp(row.speedKmS, 4) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
