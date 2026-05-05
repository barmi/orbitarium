import { useEffect, useMemo, useState } from 'react'

import {
  eme2000ToIcrf,
  icrfToEcliptic,
  icrfToEme2000,
  type JdTdb,
  utcToJdTdb,
  type Vec3,
} from '@/astro'
import { type De440Evaluator, type StateVectorICRF } from '@/ephemeris'

import { dateToUtcInputValue, parseUtcInput } from '../astro/timeInput'
import { DEMO_BODIES, type DemoBody } from './bodies'
import { formatExp, metersToAu, metersToKm, vectorMagnitude } from './format'

interface Props {
  readonly evaluator: De440Evaluator | null
  readonly evaluatorError: string | null
}

type Frame = 'ICRF' | 'EME2000' | 'Ecliptic'

interface FrameStates {
  readonly position: Vec3
  readonly velocity: Vec3
}

function frameTransform(state: StateVectorICRF, frame: Frame): FrameStates {
  const pos: Vec3 = [state.position[0], state.position[1], state.position[2]]
  const vel: Vec3 = [state.velocity[0], state.velocity[1], state.velocity[2]]
  if (frame === 'ICRF') {
    return { position: pos, velocity: vel }
  }
  if (frame === 'EME2000') {
    return { position: icrfToEme2000(pos), velocity: icrfToEme2000(vel) }
  }
  return { position: icrfToEcliptic(pos), velocity: icrfToEcliptic(vel) }
}

export default function StateVectorPanel({ evaluator, evaluatorError }: Props) {
  const [bodyKey, setBodyKey] = useState<string>('earth')
  const [utcInput, setUtcInput] = useState(() => dateToUtcInputValue(new Date()))
  const [frame, setFrame] = useState<Frame>('ICRF')
  const [state, setState] = useState<StateVectorICRF | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const body: DemoBody = useMemo(
    () => DEMO_BODIES.find((b) => b.key === bodyKey) ?? DEMO_BODIES[0]!,
    [bodyKey],
  )
  const date = useMemo(() => parseUtcInput(utcInput), [utcInput])
  const jdTdb = useMemo<JdTdb | null>(() => (date ? utcToJdTdb(date) : null), [date])

  useEffect(() => {
    if (!evaluator || !jdTdb) {
      setState(null)
      return
    }
    let cancelled = false
    setBusy(true)
    setError(null)
    void evaluator
      .getStateAt(body.naifId, jdTdb)
      .then((sv) => {
        if (!cancelled) setState(sv)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'evaluation failed')
          setState(null)
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [evaluator, body.naifId, jdTdb])

  const frameStates = state ? frameTransform(state, frame) : null
  const distanceFromSunM = state ? vectorMagnitude(state.position) : null

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="ephemeris-state-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 1</p>
          <h2 id="ephemeris-state-title">State Vector</h2>
        </div>
        <button type="button" onClick={() => setUtcInput(dateToUtcInputValue(new Date()))}>
          Now
        </button>
      </div>

      <div className="ephemeris-controls">
        <fieldset className="ephemeris-body-picker" aria-label="Body">
          <legend>Body</legend>
          {DEMO_BODIES.map((b) => (
            <label key={b.key}>
              <input
                type="radio"
                name="ephemeris-body"
                value={b.key}
                checked={b.key === bodyKey}
                onChange={() => setBodyKey(b.key)}
              />
              <span>{b.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="astro-field">
          <span>UTC</span>
          <input
            aria-label="UTC datetime"
            type="datetime-local"
            step="1"
            value={utcInput}
            onChange={(event) => setUtcInput(event.currentTarget.value)}
          />
        </label>

        <fieldset className="astro-segmented" aria-label="Frame">
          <legend className="ephemeris-sr-only">Frame</legend>
          {(['ICRF', 'EME2000', 'Ecliptic'] as const).map((f) => (
            <label key={f}>
              <input
                type="radio"
                name="ephemeris-frame"
                value={f}
                checked={f === frame}
                onChange={() => setFrame(f)}
              />
              <span>{f}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {evaluatorError ? (
        <p className="astro-error" role="alert">
          {evaluatorError}
          {' — run '}
          <code>pnpm de440:preprocess</code>
          {' once.'}
        </p>
      ) : error ? (
        <p className="astro-error" role="alert">
          {error}
        </p>
      ) : busy && !state ? (
        <p className="ephemeris-status">Loading…</p>
      ) : frameStates && state && jdTdb && distanceFromSunM != null ? (
        <dl className="astro-kv astro-kv--two">
          <div>
            <dt>JD TDB</dt>
            <dd data-testid="state-jd-tdb">{(jdTdb as number).toFixed(9)}</dd>
          </div>
          <div>
            <dt>Distance from SSB</dt>
            <dd>
              {formatExp(metersToAu(distanceFromSunM), 6)} AU ({formatExp(distanceFromSunM, 6)} m)
            </dd>
          </div>
          <div>
            <dt>Position {frame} (m)</dt>
            <dd data-testid="state-position-m">
              [{frameStates.position.map((c) => formatExp(c)).join(', ')}]
            </dd>
          </div>
          <div>
            <dt>Position {frame} (km)</dt>
            <dd>[{frameStates.position.map((c) => formatExp(metersToKm(c))).join(', ')}]</dd>
          </div>
          <div>
            <dt>Velocity {frame} (m/s)</dt>
            <dd data-testid="state-velocity-m-s">
              [{frameStates.velocity.map((c) => formatExp(c)).join(', ')}]
            </dd>
          </div>
          <div>
            <dt>Speed</dt>
            <dd>{formatExp(vectorMagnitude(frameStates.velocity), 6)} m/s</dd>
          </div>
        </dl>
      ) : (
        <p className="ephemeris-status">Choose a body and time.</p>
      )}

      {/* Sanity: round-trip ICRF→EME2000→ICRF should be identical. */}
      {frameStates && state && (
        <p className="ephemeris-note">
          {frame === 'EME2000'
            ? `EME2000→ICRF round-trip residual: ${formatExp(
                vectorMagnitude([
                  eme2000ToIcrf(frameStates.position)[0] - state.position[0],
                  eme2000ToIcrf(frameStates.position)[1] - state.position[1],
                  eme2000ToIcrf(frameStates.position)[2] - state.position[2],
                ]),
                3,
              )} m`
            : `Source frame: ICRF (DE440 native).`}
        </p>
      )}
    </section>
  )
}
