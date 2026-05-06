import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { type JdTdb, utcToJdTdb } from '@/astro'
import { BODY_CATALOG, getBodyBySlug } from '@/bodies'
import { createDe440Evaluator, type De440Evaluator } from '@/ephemeris'
import { AsteroidBelt, OrbitLine, type OrbitPolyline, sampleOrbit } from '@/orbits'
import { createRendererProps, RENDER_DEFAULTS, ssbAnchor } from '@/render'
import { getDistancePolicy } from '@/scale'

import { createWebDe440Loader } from '../ephemeris/webLoader'

const NOW = new Date('2026-05-06T00:00:00Z')

const PLANET_SLUGS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']

const RENDERER_PROPS = createRendererProps(RENDER_DEFAULTS, {
  fov: 50,
  near: 0.05,
  far: 1e6,
  position: [4, 3, 7],
})

interface SamplerResult {
  trail: OrbitPolyline | null
  predict: OrbitPolyline | null
  error: string | null
}

export default function OrbitsDemo() {
  const [bodySlug, setBodySlug] = useState('earth')
  const [trailDays, setTrailDays] = useState(365)
  const [predictDays, setPredictDays] = useState(365)
  const [sampleCount, setSampleCount] = useState(128)
  const [showTrail, setShowTrail] = useState(true)
  const [showPredict, setShowPredict] = useState(true)
  const [showBelt, setShowBelt] = useState(false)
  const [result, setResult] = useState<SamplerResult>({ trail: null, predict: null, error: null })

  const evaluator = useMemo<De440Evaluator>(() => createDe440Evaluator(createWebDe440Loader()), [])
  const distancePolicy = useMemo(() => getDistancePolicy('piecewise-monotonic'), [])
  const anchor = useMemo(() => ssbAnchor(), [])
  const body = getBodyBySlug(bodySlug)

  useEffect(() => {
    if (!body) {
      setResult({ trail: null, predict: null, error: `unknown body ${bodySlug}` })
      return
    }
    let cancelled = false
    const jdNow = utcToJdTdb(NOW)
    const trailStart = (jdNow - trailDays) as JdTdb
    const predictEnd = (jdNow + predictDays) as JdTdb

    const samples = Promise.all([
      sampleOrbit(evaluator, body.naifId, trailStart, jdNow, sampleCount),
      sampleOrbit(evaluator, body.naifId, jdNow, predictEnd, sampleCount),
    ])
    samples
      .then(([trail, predict]) => {
        if (!cancelled) setResult({ trail, predict, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            trail: null,
            predict: null,
            error: err instanceof Error ? err.message : 'sampler failed',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [body, bodySlug, evaluator, trailDays, predictDays, sampleCount])

  return (
    <main className="orbits-demo">
      <header className="orbits-demo__header">
        <div>
          <p className="orbits-panel__eyebrow">Work 7</p>
          <h1>Orbits & Trajectories</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="orbits-demo__grid">
        <section className="orbits-panel">
          <p className="orbits-panel__eyebrow">Panel 1</p>
          <h2>Body</h2>
          <label className="orbits-control">
            <span className="orbits-control__label">Select</span>
            <select
              aria-label="Body picker"
              value={bodySlug}
              onChange={(e) => setBodySlug(e.currentTarget.value)}
            >
              {BODY_CATALOG.filter((b) => PLANET_SLUGS.includes(b.slug) || b.slug === 'pluto').map(
                (b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.label}
                  </option>
                ),
              )}
            </select>
          </label>
        </section>

        <section className="orbits-panel">
          <p className="orbits-panel__eyebrow">Panel 2</p>
          <h2>Time Window</h2>
          <label className="orbits-control">
            <span className="orbits-control__label">
              Trail (days) <strong data-testid="trail-days">{trailDays}</strong>
            </span>
            <input
              aria-label="Trail days"
              type="range"
              min={30}
              max={3650}
              step={30}
              value={trailDays}
              onChange={(e) => setTrailDays(Number(e.currentTarget.value))}
            />
          </label>
          <label className="orbits-control">
            <span className="orbits-control__label">
              Predict (days) <strong data-testid="predict-days">{predictDays}</strong>
            </span>
            <input
              aria-label="Predict days"
              type="range"
              min={30}
              max={3650}
              step={30}
              value={predictDays}
              onChange={(e) => setPredictDays(Number(e.currentTarget.value))}
            />
          </label>
          <label className="orbits-control">
            <span className="orbits-control__label">
              Sample count <strong data-testid="sample-count">{sampleCount}</strong>
            </span>
            <input
              aria-label="Sample count"
              type="range"
              min={32}
              max={512}
              step={32}
              value={sampleCount}
              onChange={(e) => setSampleCount(Number(e.currentTarget.value))}
            />
          </label>
        </section>

        <section className="orbits-panel">
          <p className="orbits-panel__eyebrow">Panel 3</p>
          <h2>Layers</h2>
          <div className="orbits-toggle-row">
            <label>
              <input
                type="checkbox"
                aria-label="Trail toggle"
                checked={showTrail}
                onChange={(e) => setShowTrail(e.currentTarget.checked)}
              />
              Trail
            </label>
            <label>
              <input
                type="checkbox"
                aria-label="Predict toggle"
                checked={showPredict}
                onChange={(e) => setShowPredict(e.currentTarget.checked)}
              />
              Predict
            </label>
            <label>
              <input
                type="checkbox"
                aria-label="Asteroid belt toggle"
                checked={showBelt}
                onChange={(e) => setShowBelt(e.currentTarget.checked)}
              />
              Belt
            </label>
          </div>
          <div className="orbits-info" data-testid="orbits-status">
            {result.error
              ? 'error'
              : result.trail
                ? `trail ${result.trail.count} pts · predict ${result.predict?.count ?? 0} pts`
                : 'loading…'}
          </div>
          {result.error && <p className="orbits-error">{result.error}</p>}
        </section>

        <section className="orbits-demo__canvas-panel" data-testid="orbits-canvas-panel">
          <Canvas gl={RENDERER_PROPS.gl} camera={RENDERER_PROPS.camera} dpr={[1, 2]}>
            <ambientLight intensity={RENDER_DEFAULTS.ambientIntensity} />
            <pointLight position={[0, 0, 0]} intensity={RENDER_DEFAULTS.sunIntensity} decay={0} />
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.05, 24, 16]} />
              <meshBasicMaterial color="#ffd166" />
            </mesh>
            {showTrail && result.trail && (
              <OrbitLine
                polyline={result.trail}
                distancePolicy={distancePolicy}
                anchor={anchor}
                variant="trail"
              />
            )}
            {showPredict && result.predict && (
              <OrbitLine
                polyline={result.predict}
                distancePolicy={distancePolicy}
                anchor={anchor}
                variant="predict"
              />
            )}
            {showBelt && (
              <AsteroidBelt distancePolicy={distancePolicy} anchor={anchor} count={256} seed={1} />
            )}
          </Canvas>
        </section>
      </div>
    </main>
  )
}
