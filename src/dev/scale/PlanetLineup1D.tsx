import { useEffect, useMemo, useState } from 'react'

import { AU, type JdTdb, type Meters, utcToJdTdb } from '@/astro'
import { type De440Evaluator, type StateVectorICRF } from '@/ephemeris'
import {
  BODY_MEAN_EQUATORIAL_RADIUS_M,
  type DistancePolicy,
  type SceneUnit,
  type SizePolicy,
} from '@/scale'

interface BodyEntry {
  readonly key: string
  readonly naifId: number
  readonly label: string
}

const PLANETS: readonly BodyEntry[] = [
  { key: 'sun', naifId: 10, label: 'Sun' },
  { key: 'mercury', naifId: 199, label: 'Mercury' },
  { key: 'venus', naifId: 299, label: 'Venus' },
  { key: 'earth', naifId: 399, label: 'Earth' },
  { key: 'mars', naifId: 499, label: 'Mars' },
  { key: 'jupiter', naifId: 599, label: 'Jupiter' },
  { key: 'saturn', naifId: 699, label: 'Saturn' },
  { key: 'uranus', naifId: 799, label: 'Uranus' },
  { key: 'neptune', naifId: 899, label: 'Neptune' },
  { key: 'pluto', naifId: 999, label: 'Pluto' },
]

interface Props {
  readonly evaluator: De440Evaluator | null
  readonly evaluatorError: string | null
  readonly distancePolicy: DistancePolicy
  readonly sizePolicy: SizePolicy
}

interface Row {
  readonly key: string
  readonly label: string
  readonly distanceM: number
  readonly distanceScene: number
  readonly sizeScene: number
}

const SVG_WIDTH = 760
const SVG_HEIGHT = 132
const SVG_MARGIN_X = 30
const AXIS_Y = 76

function formatAuTick(distanceAu: number): string {
  if (distanceAu >= 10) return distanceAu.toFixed(0)
  if (distanceAu >= 1) return distanceAu.toFixed(1)
  return distanceAu.toFixed(2)
}

export default function PlanetLineup1D({
  evaluator,
  evaluatorError,
  distancePolicy,
  sizePolicy,
}: Props) {
  const [rows, setRows] = useState<readonly Row[]>([])

  useEffect(() => {
    if (!evaluator) {
      setRows([])
      return
    }
    let cancelled = false
    const jd: JdTdb = utcToJdTdb(new Date())
    void Promise.all(
      PLANETS.map(async (b): Promise<Row> => {
        const sv: StateVectorICRF = await evaluator.getStateAt(b.naifId, jd)
        const distanceM = Math.hypot(sv.position[0], sv.position[1], sv.position[2])
        return {
          key: b.key,
          label: b.label,
          distanceM,
          distanceScene: distancePolicy.forward(distanceM as Meters),
          sizeScene: sizePolicy.forward(BODY_MEAN_EQUATORIAL_RADIUS_M[b.naifId]!),
        }
      }),
    ).then((next) => {
      if (!cancelled) setRows(next)
    })
    return () => {
      cancelled = true
    }
  }, [evaluator, distancePolicy, sizePolicy])

  const maxDistanceScene = useMemo(
    () => (rows.length > 0 ? Math.max(...rows.map((r) => r.distanceScene)) : 1),
    [rows],
  )
  const tickScenes = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxDistanceScene),
    [maxDistanceScene],
  )
  const xScale = (sceneX: number): number =>
    SVG_MARGIN_X + (sceneX / Math.max(maxDistanceScene, 0.0001)) * (SVG_WIDTH - 2 * SVG_MARGIN_X)

  return (
    <section className="astro-panel astro-panel--wide" aria-labelledby="scale-lineup-title">
      <div className="astro-panel__head">
        <div>
          <p className="astro-panel__eyebrow">Panel 2</p>
          <h2 id="scale-lineup-title">1D Planet Lineup (current time)</h2>
        </div>
      </div>

      {evaluatorError && (
        <p className="astro-error" role="alert">
          {evaluatorError} — run <code>pnpm de440:preprocess</code>.
        </p>
      )}

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="scale-lineup-svg"
        role="img"
        aria-label="Planet lineup"
        data-testid="planet-lineup-svg"
      >
        <line
          x1={SVG_MARGIN_X}
          y1={AXIS_Y}
          x2={SVG_WIDTH - SVG_MARGIN_X}
          y2={AXIS_Y}
          stroke="#3a4541"
          strokeWidth={1}
        />
        {tickScenes.map((sceneX) => {
          const cx = xScale(sceneX)
          const au = distancePolicy.inverse(sceneX as SceneUnit) / AU
          return (
            <g key={sceneX}>
              <line x1={cx} y1={AXIS_Y - 6} x2={cx} y2={AXIS_Y + 7} stroke="#3a4541" />
              <text x={cx} y={AXIS_Y + 22} fontSize={8.5} fill="#a7b0ad" textAnchor="middle">
                {sceneX.toFixed(2)} scene
              </text>
              <text x={cx} y={AXIS_Y + 34} fontSize={8.5} fill="#95d5b2" textAnchor="middle">
                {formatAuTick(au)} AU
              </text>
            </g>
          )
        })}
        {rows.map((r, index) => {
          const cx = xScale(r.distanceScene)
          const cy = AXIS_Y
          const dotR = Math.max(2, Math.min(20, r.sizeScene * 8))
          const labelY = index % 2 === 0 ? AXIS_Y - 34 : AXIS_Y - 20
          return (
            <g key={r.key}>
              <circle cx={cx} cy={cy} r={dotR} fill="#8fb8ff" opacity={0.85}>
                <title>
                  {r.label}: {(r.distanceM / AU).toFixed(3)} AU → scene {r.distanceScene.toFixed(4)}
                  , size {r.sizeScene.toFixed(4)}
                </title>
              </circle>
              <text
                x={cx}
                y={labelY}
                fontSize={9}
                fill="#cfd8d4"
                textAnchor="middle"
                pointerEvents="none"
              >
                {r.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="astro-table-wrap">
        <table className="astro-table" data-testid="lineup-table">
          <thead>
            <tr>
              <th>Body</th>
              <th>|r| (AU)</th>
              <th>Scene distance</th>
              <th>Scene size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{(r.distanceM / AU).toFixed(4)}</td>
                <td>{r.distanceScene.toFixed(5)}</td>
                <td>{r.sizeScene.toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
