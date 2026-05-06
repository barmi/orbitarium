import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { type JdTdb, jdTdbToUtc, utcToJdTdb } from '@/astro'
import { getBodyBySlug } from '@/bodies'
import { DISTANCE_POLICIES, SIZE_POLICIES } from '@/scale'
import { TIME_PRESETS, useSimulationClock } from '@/time'

import { SOLAR_BODY_SLUGS } from './constants'

interface Props {
  readonly focusedSlug: string | null
  readonly onSelectFocus: (slug: string | null) => void
  readonly distancePolicy: string
  readonly sizePolicy: string
  readonly onDistancePolicyChange: (name: string) => void
  readonly onSizePolicyChange: (name: string) => void
  readonly showOrbits: boolean
  readonly showStarfield: boolean
  readonly vmagCutoff: number
  readonly sizeScale: number
  readonly onShowOrbitsChange: (next: boolean) => void
  readonly onShowStarfieldChange: (next: boolean) => void
  readonly onVmagCutoffChange: (next: number) => void
  readonly onSizeScaleChange: (next: number) => void
  readonly loaded: boolean
  readonly error: string | null
}

const RATE_PRESETS = [1, 60, 3600, 86_400, 86_400 * 30, 86_400 * 365] // 1s/s ... 1yr/s

const STEP_BUTTONS: readonly { readonly label: string; readonly days: number }[] = [
  { label: '-1y', days: -365 },
  { label: '-1mo', days: -30 },
  { label: '-1d', days: -1 },
  { label: '-1h', days: -1 / 24 },
  { label: '+1h', days: 1 / 24 },
  { label: '+1d', days: 1 },
  { label: '+1mo', days: 30 },
  { label: '+1y', days: 365 },
]

function jdTdbToIsoUtc(jd: number): string {
  const d = jdTdbToUtc(jd)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function jdTdbToInputValue(jd: number): string {
  const d = jdTdbToUtc(jd)
  if (!Number.isFinite(d.getTime())) return ''
  // datetime-local format: YYYY-MM-DDTHH:MM:SS (no millis, no Z)
  return d.toISOString().slice(0, 19)
}

function rateLabel(r: number): string {
  if (r >= 86_400 * 365) return `${(r / (86_400 * 365)).toFixed(0)}y/s`
  if (r >= 86_400 * 30) return `${(r / (86_400 * 30)).toFixed(0)}mo/s`
  if (r >= 86_400) return `${(r / 86_400).toFixed(0)}d/s`
  if (r >= 3600) return `${(r / 3600).toFixed(0)}h/s`
  return `${r}s/s`
}

export default function SolarHUD({
  focusedSlug,
  onSelectFocus,
  distancePolicy,
  sizePolicy,
  onDistancePolicyChange,
  onSizePolicyChange,
  showOrbits,
  showStarfield,
  vmagCutoff,
  sizeScale,
  onShowOrbitsChange,
  onShowStarfieldChange,
  onVmagCutoffChange,
  onSizeScaleChange,
  loaded,
  error,
}: Props) {
  const { state: clock, dispatch } = useSimulationClock()
  const [jumpDraft, setJumpDraft] = useState<string>(() => jdTdbToInputValue(clock.jdTdb))
  const [editingJump, setEditingJump] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Keep the date input synced with the clock when the user isn't editing it.
  useEffect(() => {
    if (!editingJump) setJumpDraft(jdTdbToInputValue(clock.jdTdb))
  }, [clock.jdTdb, editingJump])

  const utc = jdTdbToIsoUtc(clock.jdTdb)
  const focusedBody = focusedSlug ? getBodyBySlug(focusedSlug) : null

  const applyJump = useCallback(() => {
    if (!jumpDraft) return
    const ms = Date.parse(`${jumpDraft}Z`)
    if (!Number.isFinite(ms)) return
    const next = utcToJdTdb(new Date(ms))
    dispatch({ type: 'setJdTdb', jdTdb: next })
    setEditingJump(false)
  }, [dispatch, jumpDraft])

  const jumpToNow = useCallback(() => {
    dispatch({ type: 'setJdTdb', jdTdb: utcToJdTdb(new Date()) })
  }, [dispatch])

  const stepBy = useCallback(
    (days: number) => {
      const next = ((clock.jdTdb as number) + days) as JdTdb
      dispatch({ type: 'setJdTdb', jdTdb: next })
    },
    [clock.jdTdb, dispatch],
  )

  const flipDirection = useCallback(() => {
    dispatch({ type: 'setDirection', direction: clock.direction === 1 ? -1 : 1 })
  }, [clock.direction, dispatch])

  return (
    <div className="solar-hud">
      <header className="solar-hud__top">
        <div className="solar-hud__title">
          <h1>Orbitarium</h1>
          <p className="solar-hud__subtitle">
            real-position solar system{focusedBody ? ` · focus: ${focusedBody.label}` : ''}
          </p>
          <button
            type="button"
            className="solar-hud__settings-toggle"
            data-testid="solar-settings-toggle"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((v) => !v)}
          >
            {settingsOpen ? '▾ Settings' : '▸ Settings'}
          </button>
          {settingsOpen && (
            <div className="solar-hud__settings" data-testid="solar-settings-panel">
              <fieldset className="solar-hud__radio-group">
                <legend>Distance scale</legend>
                {DISTANCE_POLICIES.map((p) => (
                  <label key={p.name}>
                    <input
                      type="radio"
                      name="solar-distance-policy"
                      value={p.name}
                      checked={p.name === distancePolicy}
                      data-testid={`solar-distance-${p.name}`}
                      onChange={() => onDistancePolicyChange(p.name)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="solar-hud__radio-group">
                <legend>Size scale</legend>
                {SIZE_POLICIES.map((p) => (
                  <label key={p.name}>
                    <input
                      type="radio"
                      name="solar-size-policy"
                      value={p.name}
                      checked={p.name === sizePolicy}
                      data-testid={`solar-size-${p.name}`}
                      onChange={() => onSizePolicyChange(p.name)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="solar-hud__radio-group">
                <legend>View options</legend>
                <label>
                  <input
                    type="checkbox"
                    data-testid="solar-toggle-orbits"
                    checked={showOrbits}
                    onChange={(e) => onShowOrbitsChange(e.currentTarget.checked)}
                  />
                  <span>show orbits</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    data-testid="solar-toggle-starfield"
                    checked={showStarfield}
                    onChange={(e) => onShowStarfieldChange(e.currentTarget.checked)}
                  />
                  <span>show starfield</span>
                </label>
                <label className="solar-hud__slider">
                  <span>
                    vmag cutoff{' '}
                    <strong data-testid="solar-vmag-value">{vmagCutoff.toFixed(1)}</strong>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.1}
                    value={vmagCutoff}
                    data-testid="solar-vmag-slider"
                    disabled={!showStarfield}
                    onChange={(e) => onVmagCutoffChange(Number(e.currentTarget.value))}
                  />
                </label>
                <label className="solar-hud__slider">
                  <span>
                    body size ×{' '}
                    <strong data-testid="solar-sizescale-value">{sizeScale.toFixed(3)}</strong>
                  </span>
                  <input
                    type="range"
                    min={Math.log10(0.005)}
                    max={Math.log10(2)}
                    step={0.01}
                    value={Math.log10(sizeScale)}
                    data-testid="solar-sizescale-slider"
                    onChange={(e) => onSizeScaleChange(10 ** Number(e.currentTarget.value))}
                  />
                  <div className="solar-hud__slider-presets">
                    <button
                      type="button"
                      data-testid="solar-sizescale-default"
                      onClick={() => onSizeScaleChange(1)}
                    >
                      reset (×1)
                    </button>
                    <button
                      type="button"
                      data-testid="solar-sizescale-moons"
                      onClick={() => onSizeScaleChange(0.02)}
                      title="Earth's visual radius shrinks below the Earth–Moon scene distance, so the Moon emerges from inside Earth."
                    >
                      moons visible (×0.02)
                    </button>
                  </div>
                </label>
              </fieldset>
            </div>
          )}
        </div>

        <div className="solar-hud__time" data-testid="solar-time-panel">
          <div className="solar-hud__time-row solar-hud__time-row--readout">
            <span className="solar-hud__utc-label">UTC</span>
            <span className="solar-hud__utc" data-testid="solar-utc">
              {utc}
            </span>
          </div>

          <div className="solar-hud__time-row">
            <label className="solar-hud__time-label" htmlFor="solar-jump-input">
              Jump
            </label>
            <input
              id="solar-jump-input"
              type="datetime-local"
              step="1"
              value={jumpDraft}
              data-testid="solar-jump-input"
              onChange={(e) => {
                setJumpDraft(e.currentTarget.value)
                setEditingJump(true)
              }}
              onFocus={() => setEditingJump(true)}
              onBlur={() => setEditingJump(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyJump()
              }}
            />
            <button type="button" data-testid="solar-jump-apply" onClick={applyJump}>
              Apply
            </button>
            <button type="button" data-testid="solar-now" onClick={jumpToNow}>
              Now
            </button>
          </div>

          <div className="solar-hud__time-row">
            <label className="solar-hud__time-label" htmlFor="solar-preset-select">
              Preset
            </label>
            <select
              id="solar-preset-select"
              data-testid="solar-preset"
              defaultValue=""
              onChange={(e) => {
                const id = e.currentTarget.value
                if (!id) return
                const preset = TIME_PRESETS.find((p) => p.id === id)
                if (preset) dispatch({ type: 'setJdTdb', jdTdb: preset.jdTdb })
                e.currentTarget.value = ''
              }}
            >
              <option value="">— jump to preset —</option>
              {TIME_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="solar-hud__time-row solar-hud__time-row--steps">
            <span className="solar-hud__time-label">Step</span>
            <div className="solar-hud__step-grid">
              {STEP_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  data-testid={`solar-step-${btn.label}`}
                  onClick={() => stepBy(btn.days)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="solar-hud__time-row solar-hud__time-row--play">
            <button
              type="button"
              aria-label={clock.direction === 1 ? 'Play forward' : 'Play backward'}
              aria-pressed={clock.direction === -1}
              data-testid="solar-direction-toggle"
              onClick={flipDirection}
              title={
                clock.direction === 1 ? 'forward — click to reverse' : 'reverse — click to forward'
              }
            >
              {clock.direction === 1 ? '▶▶' : '◀◀'}
            </button>
            <button
              type="button"
              aria-label={clock.mode === 'paused' ? 'Play' : 'Pause'}
              data-testid="solar-play-toggle"
              onClick={() => dispatch({ type: clock.mode === 'paused' ? 'play' : 'pause' })}
            >
              {clock.mode === 'paused' ? (clock.direction === 1 ? '▶' : '◀') : '⏸'}
            </button>
            <select
              aria-label="Rate"
              data-testid="solar-rate"
              value={clock.rate}
              onChange={(e) => dispatch({ type: 'setRate', rate: Number(e.currentTarget.value) })}
            >
              {RATE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  ×{rateLabel(r)}
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
