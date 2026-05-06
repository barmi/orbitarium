import '../solar/solar.css'

import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type JdTdb, utcToJdTdb } from '@/astro'
import { createDe440Evaluator } from '@/ephemeris'
import { createRendererProps, RENDER_DEFAULTS } from '@/render'
import { decodeShareState, encodeShareState } from '@/share'
import { DEFAULT_DISTANCE_POLICY, DEFAULT_SIZE_POLICY, SolarHUD, SolarScene } from '@/solar'
import { ClockTickDriver, SimulationClockProvider, useSimulationClock } from '@/time'

import { createWebDe440Loader } from '../dev/ephemeris/webLoader'

const RENDERER_PROPS = createRendererProps(RENDER_DEFAULTS, {
  fov: 50,
  // near must be < CAMERA_DISTANCE_MIN (0.001) so geometries between the
  // camera and the focused body (e.g. Moon when Earth is focused at small
  // sizeScale) aren't clipped.
  near: 1e-4,
  far: 1e10,
  position: [4, 3, 7],
})

const DEFAULT_VMAG_CUTOFF = 6
const DEFAULT_SIZE_SCALE = 1

interface InitialState {
  readonly jdTdb: JdTdb
  readonly focusedSlug: string | null
  readonly distancePolicy: string
  readonly sizePolicy: string
  readonly showOrbits: boolean
  readonly showStarfield: boolean
  readonly vmagCutoff: number
  readonly sizeScale: number
}

function readInitialState(): InitialState {
  const decoded = typeof window !== 'undefined' ? decodeShareState(window.location.hash) : null
  if (decoded) {
    return {
      jdTdb: decoded.jdTdb as JdTdb,
      focusedSlug: decoded.bodySlug,
      distancePolicy: decoded.distancePolicy ?? DEFAULT_DISTANCE_POLICY,
      sizePolicy: decoded.sizePolicy ?? DEFAULT_SIZE_POLICY,
      showOrbits: decoded.showOrbits ?? true,
      showStarfield: decoded.showStarfield ?? true,
      vmagCutoff: decoded.vmagCutoff ?? DEFAULT_VMAG_CUTOFF,
      sizeScale: decoded.sizeScale ?? DEFAULT_SIZE_SCALE,
    }
  }
  return {
    jdTdb: utcToJdTdb(new Date()),
    focusedSlug: null,
    distancePolicy: DEFAULT_DISTANCE_POLICY,
    sizePolicy: DEFAULT_SIZE_POLICY,
    showOrbits: true,
    showStarfield: true,
    vmagCutoff: DEFAULT_VMAG_CUTOFF,
    sizeScale: DEFAULT_SIZE_SCALE,
  }
}

export default function Solar() {
  const initial = useMemo(() => readInitialState(), [])
  const [focusedSlug, setFocusedSlug] = useState<string | null>(initial.focusedSlug)
  const [distancePolicy, setDistancePolicy] = useState<string>(initial.distancePolicy)
  const [sizePolicy, setSizePolicy] = useState<string>(initial.sizePolicy)
  const [showOrbits, setShowOrbits] = useState<boolean>(initial.showOrbits)
  const [showStarfield, setShowStarfield] = useState<boolean>(initial.showStarfield)
  const [vmagCutoff, setVmagCutoff] = useState<number>(initial.vmagCutoff)
  const [sizeScale, setSizeScale] = useState<number>(initial.sizeScale)

  return (
    <SimulationClockProvider initial={{ jdTdb: initial.jdTdb }}>
      <SolarApp
        focusedSlug={focusedSlug}
        onSelectFocus={setFocusedSlug}
        distancePolicy={distancePolicy}
        sizePolicy={sizePolicy}
        onDistancePolicyChange={setDistancePolicy}
        onSizePolicyChange={setSizePolicy}
        showOrbits={showOrbits}
        showStarfield={showStarfield}
        vmagCutoff={vmagCutoff}
        sizeScale={sizeScale}
        onShowOrbitsChange={setShowOrbits}
        onShowStarfieldChange={setShowStarfield}
        onVmagCutoffChange={setVmagCutoff}
        onSizeScaleChange={setSizeScale}
      />
    </SimulationClockProvider>
  )
}

interface SolarAppProps {
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
}

function SolarApp({
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
}: SolarAppProps) {
  const { state: clock } = useSimulationClock()
  const evaluator = useMemo(() => createDe440Evaluator(createWebDe440Loader()), [])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reflect clock + focus + scale + view state into the URL fragment.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = encodeShareState({
      jdTdb: clock.jdTdb,
      bodySlug: focusedSlug,
      cameraMode: null,
      distancePolicy: distancePolicy === DEFAULT_DISTANCE_POLICY ? null : distancePolicy,
      sizePolicy: sizePolicy === DEFAULT_SIZE_POLICY ? null : sizePolicy,
      showOrbits: showOrbits ? null : false,
      showStarfield: showStarfield ? null : false,
      vmagCutoff: vmagCutoff === DEFAULT_VMAG_CUTOFF ? null : vmagCutoff,
      sizeScale: sizeScale === DEFAULT_SIZE_SCALE ? null : sizeScale,
    })
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [
    clock.jdTdb,
    focusedSlug,
    distancePolicy,
    sizePolicy,
    showOrbits,
    showStarfield,
    vmagCutoff,
    sizeScale,
  ])

  const handleLoaded = useCallback((next: boolean) => setLoaded(next), [])
  const handleError = useCallback((next: string | null) => setError(next), [])

  return (
    <main className="solar" data-testid="solar-main">
      <Canvas gl={RENDERER_PROPS.gl} camera={RENDERER_PROPS.camera} dpr={[1, 2]}>
        <ClockTickDriver />
        <SolarScene
          evaluator={evaluator}
          jdTdb={clock.jdTdb}
          focusedSlug={focusedSlug}
          distancePolicyName={distancePolicy}
          sizePolicyName={sizePolicy}
          showOrbits={showOrbits}
          showStarfield={showStarfield}
          vmagCutoff={vmagCutoff}
          sizeScale={sizeScale}
          onPositionsLoaded={handleLoaded}
          onPositionsError={handleError}
        />
      </Canvas>
      <SolarHUD
        focusedSlug={focusedSlug}
        onSelectFocus={onSelectFocus}
        distancePolicy={distancePolicy}
        sizePolicy={sizePolicy}
        onDistancePolicyChange={onDistancePolicyChange}
        onSizePolicyChange={onSizePolicyChange}
        showOrbits={showOrbits}
        showStarfield={showStarfield}
        vmagCutoff={vmagCutoff}
        sizeScale={sizeScale}
        onShowOrbitsChange={onShowOrbitsChange}
        onShowStarfieldChange={onShowStarfieldChange}
        onVmagCutoffChange={onVmagCutoffChange}
        onSizeScaleChange={onSizeScaleChange}
        loaded={loaded}
        error={error}
      />
    </main>
  )
}
