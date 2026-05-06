import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Panel } from '@/ui'
import { summarize, type ValidationSample } from '@/validation'

// Synthetic samples mirroring orbitarium_tools.validate.synthetic_validation_samples
const SAMPLES: ValidationSample[] = (
  [
    ['mercury', 199],
    ['venus', 299],
    ['earth', 399],
    ['mars', 499],
    ['jupiter', 599],
  ] as const
).flatMap(([bodyKey]) =>
  ['2000-01-01T12:00:00Z', '2024-04-08T18:18:00Z', '2026-05-06T00:00:00Z'].map((utcIso) => ({
    bodyKey,
    utcIso,
    jdTdb: 2_451_545.0,
    de440PositionM: [1e11, 0, 0] as readonly [number, number, number],
    horizonsPositionM: [1e11 + 1.5, 0, 0] as readonly [number, number, number],
    diffMagnitudeM: 1.5,
    angularErrorMas: 0,
  })),
)

export default function ValidationDemo() {
  const summary = useMemo(() => summarize(SAMPLES), [])

  return (
    <main
      style={{
        padding: '1.25rem 1.5rem',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="ui-panel__eyebrow">WORK 12</p>
          <h1>Validation</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <Panel title="Summary" eyebrow="Synthetic dataset">
        <div data-testid="validation-summary">
          <div>Bodies: {summary.bodies}</div>
          <div>Samples: {summary.samples}</div>
          <div>Mean diff (m): {summary.meanDiffM?.toFixed(3) ?? '—'}</div>
          <div>Max diff (m): {summary.maxDiffM?.toFixed(3) ?? '—'}</div>
          <div>Mean angular (mas): {summary.meanAngularMas?.toFixed(3) ?? '—'}</div>
        </div>
      </Panel>

      <Panel title="Per-sample table" eyebrow="DE440 vs Horizons">
        <table style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'monospace' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Body</th>
              <th style={{ textAlign: 'left' }}>UTC</th>
              <th style={{ textAlign: 'right' }}>diff (m)</th>
              <th style={{ textAlign: 'right' }}>angular (mas)</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLES.map((s, i) => (
              <tr key={i} data-testid={`validation-row-${i}`}>
                <td>{s.bodyKey}</td>
                <td>{s.utcIso}</td>
                <td style={{ textAlign: 'right' }}>{s.diffMagnitudeM?.toFixed(3) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{s.angularErrorMas?.toFixed(3) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="How to run" eyebrow="CLI">
        <pre style={{ fontSize: '0.78rem', overflowX: 'auto' }}>
          {`# Generate validation report (synthetic placeholder)
pnpm fixtures:work-12

# Or directly:
cd tools/python && uv run orbitarium-tools fixtures --work=12 --out=tests/fixtures/work-12/`}
        </pre>
      </Panel>
    </main>
  )
}
