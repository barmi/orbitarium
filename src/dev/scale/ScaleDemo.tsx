import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { createDe440Evaluator, type De440Evaluator } from '@/ephemeris'
import {
  type DistancePolicy,
  getDistancePolicy,
  getSizePolicy,
  lerpDistancePolicy,
  lerpSizePolicy,
  LogarithmicPolicy,
  type SizePolicy,
  UniformPolicy,
  ZOOM_INNER,
  ZOOM_OUTER,
  zoomLevel,
} from '@/scale'

import { createWebDe440Loader } from '../ephemeris/webLoader'
import PlanetLineup1D from './PlanetLineup1D'
import PolicyCurves from './PolicyCurves'
import PolicyPicker from './PolicyPicker'
import RoundTripPanel from './RoundTripPanel'

export default function ScaleDemo() {
  const evaluator = useMemo<De440Evaluator>(() => createDe440Evaluator(createWebDe440Loader()), [])
  const [evaluatorError, setEvaluatorError] = useState<string | null>(null)
  const [distancePolicyName, setDistancePolicyName] = useState('piecewise-monotonic')
  const [sizePolicyName, setSizePolicyName] = useState('logarithmic-magnification')
  const [zoom, setZoom] = useState(0)
  const activeZoom = zoomLevel(zoom)

  const baseDistancePolicy = useMemo(
    () => getDistancePolicy(distancePolicyName),
    [distancePolicyName],
  )
  const baseSizePolicy = useMemo(() => getSizePolicy(sizePolicyName), [sizePolicyName])

  const activeDistancePolicy = useMemo<DistancePolicy>(() => {
    const adaptive = lerpDistancePolicy(
      baseDistancePolicy,
      LogarithmicPolicy,
      ZOOM_INNER,
      ZOOM_OUTER,
      `${baseDistancePolicy.name} -> ${LogarithmicPolicy.name}`,
    )
    return {
      name: `${adaptive.name} @ ${activeZoom.toFixed(2)}`,
      metadata: {
        base: baseDistancePolicy.name,
        target: LogarithmicPolicy.name,
        zoom: activeZoom,
      },
      forward(distanceM) {
        return adaptive.forward(distanceM, activeZoom)
      },
      inverse(distanceScene) {
        return adaptive.inverse(distanceScene, activeZoom)
      },
    }
  }, [activeZoom, baseDistancePolicy])

  const activeSizePolicy = useMemo<SizePolicy>(() => {
    const adaptive = lerpSizePolicy(
      UniformPolicy,
      baseSizePolicy,
      ZOOM_INNER,
      ZOOM_OUTER,
      `${UniformPolicy.name} -> ${baseSizePolicy.name}`,
    )
    return {
      name: `${adaptive.name} @ ${activeZoom.toFixed(2)}`,
      metadata: {
        base: UniformPolicy.name,
        target: baseSizePolicy.name,
        zoom: activeZoom,
      },
      forward(radiusM) {
        return adaptive.forward(radiusM, activeZoom)
      },
      inverse(radiusScene) {
        return adaptive.inverse(radiusScene, activeZoom)
      },
    }
  }, [activeZoom, baseSizePolicy])

  useEffect(() => {
    let cancelled = false
    void evaluator.getManifest().catch((err: unknown) => {
      if (!cancelled) {
        setEvaluatorError(err instanceof Error ? err.message : 'manifest load failed')
      }
    })
    return () => {
      cancelled = true
    }
  }, [evaluator])

  return (
    <main className="astro-demo">
      <header className="astro-demo__header">
        <div>
          <p className="astro-panel__eyebrow">Work 4</p>
          <h1>Scale System</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="astro-demo__grid">
        <PolicyPicker
          distancePolicyName={distancePolicyName}
          sizePolicyName={sizePolicyName}
          zoom={zoom}
          onDistanceChange={setDistancePolicyName}
          onSizeChange={setSizePolicyName}
          onZoomChange={setZoom}
        />
        <PlanetLineup1D
          evaluator={evaluatorError ? null : evaluator}
          evaluatorError={evaluatorError}
          distancePolicy={activeDistancePolicy}
          sizePolicy={activeSizePolicy}
        />
        <PolicyCurves distancePolicy={activeDistancePolicy} />
        <RoundTripPanel distancePolicy={activeDistancePolicy} />
      </div>
    </main>
  )
}
