import { useMemo } from 'react'

import { AU, type Meters } from '@/astro'
import { type DistancePolicy } from '@/scale'

interface Props {
  readonly distancePolicy: DistancePolicy
}

const SVG_WIDTH = 760
const SVG_HEIGHT = 200
const PAD = 28

const DISTANCE_AU_DOMAIN: readonly number[] = [
  0.001, 0.01, 0.05, 0.1, 0.2, 0.4, 0.7, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 50, 70, 100,
]

export default function PolicyCurves({ distancePolicy }: Props) {
  const samples = useMemo(() => {
    const xs = DISTANCE_AU_DOMAIN
    const ys = xs.map((au) => distancePolicy.forward((au * AU) as Meters))
    return { xs, ys }
  }, [distancePolicy])

  const xMin = Math.log10(samples.xs[0]!)
  const xMax = Math.log10(samples.xs[samples.xs.length - 1]!)
  const yMin = Math.min(...samples.ys)
  const yMax = Math.max(...samples.ys)

  const xPos = (auX: number): number => {
    const t = (Math.log10(auX) - xMin) / (xMax - xMin)
    return PAD + t * (SVG_WIDTH - 2 * PAD)
  }
  const yPos = (sceneY: number): number => {
    const t = (sceneY - yMin) / Math.max(yMax - yMin, 1e-9)
    return SVG_HEIGHT - PAD - t * (SVG_HEIGHT - 2 * PAD)
  }

  const path = samples.xs
    .map((au, i) => {
      const x = xPos(au)
      const y = yPos(samples.ys[i]!)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="scale-curve-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 3</p>
          <h2 id="scale-curve-title">Distance Curve (log-linear)</h2>
        </div>
        <output data-testid="curve-policy-name">{distancePolicy.name}</output>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="scale-curve-svg"
        role="img"
        aria-label="Distance policy curve"
      >
        {/* Axes */}
        <line
          x1={PAD}
          y1={SVG_HEIGHT - PAD}
          x2={SVG_WIDTH - PAD}
          y2={SVG_HEIGHT - PAD}
          stroke="#3a4541"
        />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_HEIGHT - PAD} stroke="#3a4541" />

        {/* Grid + AU markers */}
        {[0.01, 0.1, 1, 10, 100].map((au) => {
          if (au < samples.xs[0]! || au > samples.xs[samples.xs.length - 1]!) return null
          return (
            <g key={au}>
              <line x1={xPos(au)} y1={PAD} x2={xPos(au)} y2={SVG_HEIGHT - PAD} stroke="#1f2826" />
              <text
                x={xPos(au)}
                y={SVG_HEIGHT - PAD + 12}
                fontSize={9}
                fill="#a7b0ad"
                textAnchor="middle"
              >
                {au} AU
              </text>
            </g>
          )
        })}

        <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 5} fontSize={9} fill="#a7b0ad" textAnchor="middle">
          distance (AU, log)
        </text>
        <text
          x={10}
          y={SVG_HEIGHT / 2}
          fontSize={9}
          fill="#a7b0ad"
          transform={`rotate(-90, 10, ${SVG_HEIGHT / 2})`}
          textAnchor="middle"
        >
          scene unit
        </text>

        <path d={path} fill="none" stroke="#8fb8ff" strokeWidth={2} />

        {samples.xs.map((au, i) => (
          <circle key={au} cx={xPos(au)} cy={yPos(samples.ys[i]!)} r={2.2} fill="#95d5b2">
            <title>
              {au} AU → {samples.ys[i]!.toFixed(4)} scene
            </title>
          </circle>
        ))}
      </svg>
    </section>
  )
}
