import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { utcToJdTdb } from '@/astro'
import { createDe440Evaluator, type De440Evaluator, type PositionICRF } from '@/ephemeris'
import {
  createRendererProps,
  loadStarfieldFromUrl,
  RENDER_DEFAULTS,
  type SceneAnchor,
  type StarfieldData,
  type ToneMappingName,
} from '@/render'

import { createWebDe440Loader } from '../ephemeris/webLoader'
import AnchorPicker from './AnchorPicker'
import InfoPanel from './InfoPanel'
import RendererControls from './RendererControls'
import AnchorMarker from './scene/AnchorMarker'
import LogDepthPair from './scene/LogDepthPair'
import StarfieldGroup from './scene/StarfieldGroup'
import StarfieldControls from './StarfieldControls'

const STARFIELD_URL = `${import.meta.env.BASE_URL}data/starfield/hipparcos-vmag6.bin`
const DEMO_UTC = new Date('2026-05-06T00:00:00Z')

const BODY_CHOICES = [
  { naifId: 199, label: 'Mercury (199)' },
  { naifId: 299, label: 'Venus (299)' },
  { naifId: 399, label: 'Earth (399)' },
  { naifId: 499, label: 'Mars (499)' },
  { naifId: 599, label: 'Jupiter (599)' },
  { naifId: 699, label: 'Saturn (699)' },
  { naifId: 799, label: 'Uranus (799)' },
  { naifId: 899, label: 'Neptune (899)' },
] as const

function FpsTracker({ onFps }: { readonly onFps: (fps: number) => void }) {
  const lastRef = useRef<number>(performance.now())
  const acc = useRef<number>(0)
  const frames = useRef<number>(0)
  useFrame(() => {
    const now = performance.now()
    acc.current += now - lastRef.current
    lastRef.current = now
    frames.current += 1
    if (acc.current >= 500) {
      onFps((frames.current * 1000) / acc.current)
      acc.current = 0
      frames.current = 0
    }
  })
  return null
}

export default function RenderDemo() {
  const [exposure, setExposure] = useState(RENDER_DEFAULTS.toneMappingExposure)
  const [toneMapping, setToneMapping] = useState<ToneMappingName>(RENDER_DEFAULTS.toneMapping)
  const [logDepth, setLogDepth] = useState(RENDER_DEFAULTS.logarithmicDepthBuffer)
  const [starfieldOn, setStarfieldOn] = useState(true)
  const [vmagCutoff, setVmagCutoff] = useState(6.0)
  const [anchorKind, setAnchorKind] = useState<SceneAnchor>('ssb')
  const [bodyNaifId, setBodyNaifId] = useState<number>(399)
  const [fps, setFps] = useState<number | null>(null)
  const [starfieldData, setStarfieldData] = useState<StarfieldData | null>(null)
  const [starfieldError, setStarfieldError] = useState<string | null>(null)
  const [evaluatorError, setEvaluatorError] = useState<string | null>(null)
  const [sunSsb, setSunSsb] = useState<PositionICRF | null>(null)
  const [bodySsb, setBodySsb] = useState<PositionICRF | null>(null)

  const evaluator = useMemo<De440Evaluator>(() => createDe440Evaluator(createWebDe440Loader()), [])

  const visibleStarCount = useMemo(() => {
    if (!starfieldData) return 0
    if (vmagCutoff >= 6) return starfieldData.count
    const cutoffBucket = Math.round(((vmagCutoff - -2) / (8 - -2)) * 255)
    let count = 0
    for (let i = 0; i < starfieldData.count; i++) {
      if (starfieldData.magBucket[i]! <= cutoffBucket) count += 1
    }
    return count
  }, [starfieldData, vmagCutoff])

  useEffect(() => {
    let cancelled = false
    loadStarfieldFromUrl(STARFIELD_URL)
      .then((data) => {
        if (!cancelled) setStarfieldData(data)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setStarfieldError(err instanceof Error ? err.message : 'starfield load failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const jd = utcToJdTdb(DEMO_UTC)
    void evaluator
      .getStateAt(10, jd)
      .then((state) => {
        if (!cancelled) setSunSsb(state.position)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setEvaluatorError(err instanceof Error ? err.message : 'sun position failed')
      })
    return () => {
      cancelled = true
    }
  }, [evaluator])

  useEffect(() => {
    if (anchorKind !== 'body-centric') {
      setBodySsb(null)
      return
    }
    let cancelled = false
    const jd = utcToJdTdb(DEMO_UTC)
    void evaluator
      .getStateAt(bodyNaifId, jd)
      .then((state) => {
        if (!cancelled) setBodySsb(state.position)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setEvaluatorError(err instanceof Error ? err.message : 'body position failed')
      })
    return () => {
      cancelled = true
    }
  }, [anchorKind, bodyNaifId, evaluator])

  const anchorReferenceM = useMemo<readonly [number, number, number] | null>(() => {
    if (anchorKind === 'ssb') return null
    if (anchorKind === 'heliocentric') return sunSsb ? [sunSsb[0], sunSsb[1], sunSsb[2]] : null
    return bodySsb ? [bodySsb[0], bodySsb[1], bodySsb[2]] : null
  }, [anchorKind, bodySsb, sunSsb])

  const rendererProps = useMemo(
    () =>
      createRendererProps(
        {
          ...RENDER_DEFAULTS,
          toneMapping,
          toneMappingExposure: exposure,
          logarithmicDepthBuffer: logDepth,
        },
        { fov: 55, near: 0.1, far: 1e10, position: [4, 3, 7] },
      ),
    [exposure, logDepth, toneMapping],
  )

  return (
    <main className="render-demo">
      <header className="render-demo__header">
        <div>
          <p className="render-panel__eyebrow">Work 5</p>
          <h1>Rendering Foundation</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="render-demo__grid">
        <RendererControls
          exposure={exposure}
          toneMapping={toneMapping}
          logDepth={logDepth}
          onExposureChange={setExposure}
          onToneMappingChange={setToneMapping}
          onLogDepthChange={setLogDepth}
        />
        <StarfieldControls
          starfieldOn={starfieldOn}
          vmagCutoff={vmagCutoff}
          visibleCount={visibleStarCount}
          totalCount={starfieldData?.count ?? 0}
          loadError={starfieldError}
          onStarfieldToggle={setStarfieldOn}
          onVmagChange={setVmagCutoff}
        />
        <AnchorPicker
          anchorKind={anchorKind}
          bodyNaifId={bodyNaifId}
          bodyChoices={BODY_CHOICES}
          anchorReferenceM={anchorReferenceM}
          evaluatorError={evaluatorError}
          onAnchorChange={setAnchorKind}
          onBodyChange={setBodyNaifId}
        />
        <InfoPanel
          fps={fps}
          logDepth={logDepth}
          toneMapping={toneMapping}
          exposure={exposure}
          anchorKind={anchorKind}
          utcIso={DEMO_UTC.toISOString().replace('.000Z', 'Z')}
        />

        <section className="render-demo__canvas-panel" data-testid="render-canvas-panel">
          <Canvas
            key={logDepth ? 'log-on' : 'log-off'}
            gl={rendererProps.gl}
            camera={rendererProps.camera}
            dpr={[1, 2]}
          >
            <ambientLight intensity={RENDER_DEFAULTS.ambientIntensity} />
            <pointLight
              position={[10, 10, 10]}
              intensity={RENDER_DEFAULTS.sunIntensity}
              decay={0}
            />
            <LogDepthPair />
            <AnchorMarker anchorKind={anchorKind} />
            {starfieldOn && starfieldData && (
              <StarfieldGroup data={starfieldData} visibleCutoff={vmagCutoff} baseSize={5} />
            )}
            <FpsTracker onFps={setFps} />
          </Canvas>
          <div className="render-demo__overlay">
            log-depth: <strong>{logDepth ? 'ON' : 'OFF'}</strong> · stars{' '}
            <strong>{visibleStarCount}</strong>
          </div>
        </section>
      </div>
    </main>
  )
}
