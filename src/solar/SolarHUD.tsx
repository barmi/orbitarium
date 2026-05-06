import { Link } from 'react-router-dom'

import { getBodyBySlug } from '@/bodies'
import { useSimulationClock } from '@/time'

import { SOLAR_BODY_SLUGS } from './constants'

interface Props {
  readonly focusedSlug: string | null
  readonly onSelectFocus: (slug: string | null) => void
  readonly loaded: boolean
  readonly error: string | null
}

function jdTdbToUtcIso(jd: number): string {
  const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
  const ms = J2000_MS + (jd - 2_451_545.0) * 86_400_000
  if (!Number.isFinite(ms)) return '—'
  try {
    return new Date(ms).toISOString().replace('.000Z', 'Z')
  } catch {
    return '—'
  }
}

const RATE_PRESETS = [1, 60, 3600, 86_400, 86_400 * 30, 86_400 * 365] // 1s/s ... 1yr/s

export default function SolarHUD({ focusedSlug, onSelectFocus, loaded, error }: Props) {
  const { state: clock, dispatch } = useSimulationClock()
  const utc = jdTdbToUtcIso(clock.jdTdb)

  const focusedBody = focusedSlug ? getBodyBySlug(focusedSlug) : null

  return (
    <div className="solar-hud">
      <header className="solar-hud__top">
        <div className="solar-hud__title">
          <h1>Orbitarium</h1>
          <p className="solar-hud__subtitle">
            real-position solar system{focusedBody ? ` · focus: ${focusedBody.label}` : ''}
          </p>
        </div>
        <div className="solar-hud__time" data-testid="solar-time-panel">
          <span className="solar-hud__utc" data-testid="solar-utc">
            {utc}
          </span>
          <div className="solar-hud__time-actions">
            <button
              type="button"
              aria-label={clock.mode === 'paused' ? 'Play' : 'Pause'}
              data-testid="solar-play-toggle"
              onClick={() => dispatch({ type: clock.mode === 'paused' ? 'play' : 'pause' })}
            >
              {clock.mode === 'paused' ? '▶' : '⏸'}
            </button>
            <select
              aria-label="Rate"
              data-testid="solar-rate"
              value={clock.rate}
              onChange={(e) => dispatch({ type: 'setRate', rate: Number(e.currentTarget.value) })}
            >
              {RATE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  ×
                  {r >= 86400
                    ? `${(r / 86400).toFixed(0)}d/s`
                    : r >= 3600
                      ? `${(r / 3600).toFixed(0)}h/s`
                      : `${r}s/s`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {!loaded && !error && (
        <div className="solar-hud__loading" data-testid="solar-loading">
          loading ephemeris…
        </div>
      )}
      {error && (
        <div className="solar-hud__error" data-testid="solar-error">
          {error}
        </div>
      )}

      <footer className="solar-hud__bottom">
        <div className="solar-hud__chips" data-testid="solar-chips">
          <button
            type="button"
            className="ui-body-chip"
            data-active={focusedSlug === null}
            data-testid="solar-chip-system"
            onClick={() => onSelectFocus(null)}
            aria-label="Body system"
          >
            System
          </button>
          {SOLAR_BODY_SLUGS.map((slug) => {
            const body = getBodyBySlug(slug)
            if (!body) return null
            return (
              <button
                key={slug}
                type="button"
                className="ui-body-chip"
                data-active={focusedSlug === slug}
                data-testid={`solar-chip-${slug}`}
                onClick={() => onSelectFocus(slug)}
                aria-label={`Body ${slug}`}
              >
                {body.label}
              </button>
            )
          })}
        </div>
      </footer>

      <Link to="/dev/index" className="solar-hud__dev-link">
        → /dev/index
      </Link>
    </div>
  )
}
