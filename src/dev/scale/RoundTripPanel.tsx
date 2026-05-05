import { useState } from 'react'

import { AU, type Meters } from '@/astro'
import { type DistancePolicy, type SceneUnit } from '@/scale'

interface Props {
  readonly distancePolicy: DistancePolicy
}

export default function RoundTripPanel({ distancePolicy }: Props) {
  const [auInput, setAuInput] = useState('5')

  const auValue = Number(auInput)
  const valid = Number.isFinite(auValue) && auValue > 0
  const meters = valid ? auValue * AU : 0
  const forward = valid ? distancePolicy.forward(meters as Meters) : 0
  const inverse = valid ? distancePolicy.inverse(forward as SceneUnit) : 0
  const diffM = Math.abs(inverse - meters)

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="scale-roundtrip-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 4</p>
          <h2 id="scale-roundtrip-title">Round-trip Sanity</h2>
        </div>
        <output data-testid="roundtrip-policy">{distancePolicy.name}</output>
      </div>

      <label className="astro-field">
        <span>Test distance (AU)</span>
        <input
          aria-label="Round-trip test AU"
          type="number"
          step={0.1}
          min={0}
          value={auInput}
          onChange={(event) => setAuInput(event.currentTarget.value)}
        />
      </label>

      {valid ? (
        <dl className="astro-kv astro-kv--two">
          <div>
            <dt>Input (m)</dt>
            <dd>{meters.toExponential(6)}</dd>
          </div>
          <div>
            <dt>Forward (scene)</dt>
            <dd data-testid="roundtrip-forward">{forward.toFixed(6)}</dd>
          </div>
          <div>
            <dt>Inverse (m)</dt>
            <dd>{inverse.toExponential(6)}</dd>
          </div>
          <div>
            <dt>|Δ| (m)</dt>
            <dd data-testid="roundtrip-diff">{diffM.toExponential(3)}</dd>
          </div>
        </dl>
      ) : (
        <p className="astro-error" role="alert">
          Enter a positive AU value.
        </p>
      )}
    </section>
  )
}
