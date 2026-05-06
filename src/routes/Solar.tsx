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
  near: 0.05,
  far: 1e10,
  position: [4, 3, 7],
})

interface InitialState {
  readonly jdTdb: JdTdb
  readonly focusedSlug: string | null
  readonly distancePolicy: string
  readonly sizePolicy: string
}

function readInitialState(): InitialState {
  const decoded = typeof window !== 'undefined' ? decodeShareState(window.location.hash) : null
  if (decoded) {
    return {
      jdTdb: decoded.jdTdb as JdTdb,
      focusedSlug: decoded.bodySlug,
      distancePolicy: decoded.distancePolicy ?? DEFAULT_DISTANCE_POLICY,
      sizePolicy: decoded.sizePolicy ?? DEFAULT_SIZE_POLICY,
    }
  }
  return {
    jdTdb: utcToJdTdb(new Date()),
    focusedSlug: null,
    distancePolicy: DEFAULT_DISTANCE_POLICY,
    sizePolicy: DEFAULT_SIZE_POLICY,
  }
}

export default function Solar() {
  const initial = useMemo(() => readInitialState(), [])
  const [focusedSlug, setFocusedSlug] = useState<string | null>(initial.focusedSlug)
  const [distancePolicy, setDistancePolicy] = useState<string>(initial.distancePolicy)
  const [sizePolicy, setSizePolicy] = useState<string>(initial.sizePolicy)

  return (
    <SimulationClockProvider initial={{ jdTdb: initial.jdTdb }}>
      <SolarApp
        focusedSlug={focusedSlug}
        onSelectFocus={setFocusedSlug}
        distancePolicy={distancePolicy}
        sizePolicy={sizePolicy}
        onDistancePolicyChange={setDistancePolicy}
        onSizePolicyChange={setSizePolicy}
      />
    </SimulationClockProvider>
  )
}

function SolarApp({
  focusedSlug,
  onSelectFocus,
  distancePolicy,
  sizePolicy,
  onDistancePolicyChange,
  onSizePolicyChange,
}: {
  readonly focusedSlug: string | null
  readonly onSelectFocus: (slug: string | null) => void
  readonly distancePolicy: string
  readonly sizePolicy: string
  readonly onDistancePolicyChange: (name: string) => void
  readonly onSizePolicyChange: (name: string) => void
}) {
  const { state: clock } = useSimulationClock()
  const evaluator = useMemo(() => createDe440Evaluator(createWebDe440Loader()), [])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reflect clock + focus + scale policy into the URL fragment so the view is shareable.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = encodeShareState({
      jdTdb: clock.jdTdb,
      bodySlug: focusedSlug,
      cameraMode: null,
      distancePolicy: distancePolicy === DEFAULT_DISTANCE_POLICY ? null : distancePolicy,
      sizePolicy: sizePolicy === DEFAULT_SIZE_POLICY ? null : sizePolicy,
    })
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [clock.jdTdb, focusedSlug, distancePolicy, sizePolicy])

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
        loaded={loaded}
        error={error}
      />
    </main>
  )
}
