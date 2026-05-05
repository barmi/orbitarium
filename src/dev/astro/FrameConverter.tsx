import { useMemo, useState } from 'react'

import {
  eclipticToIcrf,
  EME2000_TO_ECLIPTIC_J2000,
  eme2000ToIcrf,
  icrfToEcliptic,
  icrfToEme2000,
  type Vec3,
} from '@/astro'

import { formatFixed, formatVector, vectorDiffNorm } from './format'

type FrameKey = 'icrf' | 'eme2000' | 'ecliptic'

const FRAME_LABELS: Record<FrameKey, string> = {
  icrf: 'ICRF',
  eme2000: 'EME2000',
  ecliptic: 'Ecliptic J2000',
}

function toIcrf(frame: FrameKey, v: Vec3): Vec3 {
  if (frame === 'icrf') return v
  if (frame === 'eme2000') return eme2000ToIcrf(v)
  return eclipticToIcrf(v)
}

function fromIcrf(frame: FrameKey, v: Vec3): Vec3 {
  if (frame === 'icrf') return v
  if (frame === 'eme2000') return icrfToEme2000(v)
  return icrfToEcliptic(v)
}

function convertAll(frame: FrameKey, v: Vec3): Record<FrameKey, Vec3> {
  const icrf = toIcrf(frame, v)
  return {
    icrf,
    eme2000: frame === 'eme2000' ? v : icrfToEme2000(icrf),
    ecliptic: frame === 'ecliptic' ? v : icrfToEcliptic(icrf),
  }
}

function parseVector(x: string, y: string, z: string): Vec3 | null {
  const vec = [Number(x), Number(y), Number(z)] as const
  return vec.every(Number.isFinite) ? [vec[0], vec[1], vec[2]] : null
}

export default function FrameConverter() {
  const [frame, setFrame] = useState<FrameKey>('icrf')
  const [x, setX] = useState('1')
  const [y, setY] = useState('0')
  const [z, setZ] = useState('0')

  const result = useMemo(() => {
    const input = parseVector(x, y, z)
    if (!input) return null
    const converted = convertAll(frame, input)
    const roundTrip = fromIcrf(frame, toIcrf(frame, input))
    return { input, converted, roundTripError: vectorDiffNorm(input, roundTrip) }
  }, [frame, x, y, z])

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="frame-converter-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 3</p>
          <h2 id="frame-converter-title">Frame Converter</h2>
        </div>
        <output>
          {result ? `Round trip ${result.roundTripError.toExponential(3)}` : 'Invalid'}
        </output>
      </div>

      <div className="astro-vector-controls">
        <fieldset className="astro-segmented" aria-label="Input frame">
          {(['icrf', 'eme2000', 'ecliptic'] satisfies FrameKey[]).map((key) => (
            <label key={key}>
              <input
                type="radio"
                name="frame"
                value={key}
                checked={frame === key}
                onChange={() => setFrame(key)}
              />
              <span>{FRAME_LABELS[key]}</span>
            </label>
          ))}
        </fieldset>

        <div className="astro-axis-grid">
          <label className="astro-field">
            <span>X</span>
            <input
              aria-label="Vector X"
              inputMode="decimal"
              value={x}
              onChange={(event) => setX(event.currentTarget.value)}
            />
          </label>
          <label className="astro-field">
            <span>Y</span>
            <input
              aria-label="Vector Y"
              inputMode="decimal"
              value={y}
              onChange={(event) => setY(event.currentTarget.value)}
            />
          </label>
          <label className="astro-field">
            <span>Z</span>
            <input
              aria-label="Vector Z"
              inputMode="decimal"
              value={z}
              onChange={(event) => setZ(event.currentTarget.value)}
            />
          </label>
        </div>
      </div>

      {result ? (
        <div className="astro-table-wrap">
          <table className="astro-table">
            <thead>
              <tr>
                <th>Frame</th>
                <th>Vector</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {(['icrf', 'eme2000', 'ecliptic'] satisfies FrameKey[]).map((key) => (
                <tr key={key}>
                  <td>{FRAME_LABELS[key]}</td>
                  <td data-testid={`frame-${key}`}>{formatVector(result.converted[key])}</td>
                  <td>{formatFixed(Math.hypot(...result.converted[key]), 9)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="astro-error" role="alert">
          Vector components must be finite numbers.
        </p>
      )}

      <dl className="astro-kv">
        <div>
          <dt>Obliquity matrix m11</dt>
          <dd>{formatFixed(EME2000_TO_ECLIPTIC_J2000[4], 12)}</dd>
        </div>
        <div>
          <dt>Round-trip norm</dt>
          <dd data-testid="round-trip-error">{result?.roundTripError.toExponential(6) ?? 'NaN'}</dd>
        </div>
      </dl>
    </section>
  )
}
