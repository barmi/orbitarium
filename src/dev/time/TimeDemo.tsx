import { useReducer } from 'react'
import { Link } from 'react-router-dom'

import type { JdTdb } from '@/astro'
import {
  type ClockAction,
  clockReducer,
  type ClockState,
  INITIAL_CLOCK_STATE,
  MAX_RATE,
  MIN_RATE,
  TIME_PRESETS,
} from '@/time'

export default function TimeDemo() {
  const [state, dispatch] = useReducer<ClockState, [ClockAction]>(clockReducer, INITIAL_CLOCK_STATE)

  const utcIso = jdTdbToUtcIso(state.jdTdb)

  return (
    <main className="time-demo">
      <header className="time-demo__header">
        <div>
          <p className="time-panel__eyebrow">Work 8</p>
          <h1>Time Control</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="time-demo__grid">
        <section className="time-panel">
          <p className="time-panel__eyebrow">Panel 1</p>
          <h2>State</h2>
          <div className="time-info">
            <div>
              jdTdb: <strong data-testid="clock-jdtdb">{state.jdTdb.toFixed(4)}</strong>
            </div>
            <div>
              UTC: <strong data-testid="clock-utc">{utcIso}</strong>
            </div>
            <div>
              mode: <strong data-testid="clock-mode">{state.mode}</strong>
            </div>
            <div>
              rate: <strong data-testid="clock-rate">{state.rate}</strong>
            </div>
          </div>
          <div className="time-actions">
            <button
              type="button"
              onClick={() => dispatch({ type: 'play' })}
              data-active={state.mode !== 'paused'}
              aria-label="Play"
            >
              ▶ Play
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'pause' })}
              data-active={state.mode === 'paused'}
              aria-label="Pause"
            >
              ⏸ Pause
            </button>
          </div>
        </section>

        <section className="time-panel">
          <p className="time-panel__eyebrow">Panel 2</p>
          <h2>Rate</h2>
          <label className="time-control">
            <span className="time-control__label">
              Rate (×) <strong>{state.rate.toExponential(1)}</strong>
            </span>
            <input
              type="range"
              aria-label="Rate"
              min={Math.log10(MIN_RATE)}
              max={Math.log10(MAX_RATE)}
              step={0.1}
              value={Math.log10(state.rate)}
              onChange={(e) =>
                dispatch({ type: 'setRate', rate: 10 ** Number(e.currentTarget.value) })
              }
            />
          </label>
          <div className="time-info">log10(rate) — 1 = real-time, 1e6 = 1M sec / sec.</div>
        </section>

        <section className="time-panel">
          <p className="time-panel__eyebrow">Panel 3</p>
          <h2>Scrubber</h2>
          <label className="time-control">
            <span className="time-control__label">jdTdb offset (days)</span>
            <input
              type="range"
              aria-label="JdTdb offset"
              min={-3650}
              max={3650}
              step={1}
              value={state.jdTdb - INITIAL_CLOCK_STATE.jdTdb}
              onChange={(e) =>
                dispatch({
                  type: 'setJdTdb',
                  jdTdb: ((INITIAL_CLOCK_STATE.jdTdb as number) +
                    Number(e.currentTarget.value)) as JdTdb,
                })
              }
            />
          </label>
        </section>

        <section className="time-panel">
          <p className="time-panel__eyebrow">Panel 4</p>
          <h2>Presets</h2>
          <div className="time-presets">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => dispatch({ type: 'setJdTdb', jdTdb: p.jdTdb })}
                aria-label={`Preset ${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function jdTdbToUtcIso(jd: number): string {
  const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
  const ms = J2000_MS + (jd - 2_451_545.0) * 86_400_000
  return new Date(ms).toISOString().replace('.000Z', 'Z')
}
