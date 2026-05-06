import '../solar/solar.css'

import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type JdTdb, utcToJdTdb } from '@/astro'
import { createDe440Evaluator } from '@/ephemeris'
import { createRendererProps, RENDER_DEFAULTS } from '@/render'
import { decodeShareState, encodeShareState } from '@/share'
import { SolarHUD, SolarScene } from '@/solar'
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
}

function readInitialState(): InitialState {
  const decoded = typeof window !== 'undefined' ? decodeShareState(window.location.hash) : null
  if (decoded) {
    return {
      jdTdb: decoded.jdTdb as JdTdb,
      focusedSlug: decoded.bodySlug,
    }
  }
  return {
    jdTdb: utcToJdTdb(new Date()),
    focusedSlug: null,
  }
}

export default function Solar() {
  const initial = useMemo(() => readInitialState(), [])
  const [focusedSlug, setFocusedSlug] = useState<string | null>(initial.focusedSlug)

  return (
    <SimulationClockProvider initial={{ jdTdb: initial.jdTdb }}>
      <SolarApp focusedSlug={focusedSlug} onSelectFocus={setFocusedSlug} />
    </SimulationClockProvider>
  )
}

function SolarApp({
  focusedSlug,
  onSelectFocus,
}: {
  readonly focusedSlug: string | null
  readonly onSelectFocus: (slug: string | null) => void
}) {
  const { state: clock } = useSimulationClock()
  const evaluator = useMemo(() => createDe440Evaluator(createWebDe440Loader()), [])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reflect clock + focus into the URL fragment so the view is shareable.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = encodeShareState({
      jdTdb: clock.jdTdb,
      bodySlug: focusedSlug,
      cameraMode: null,
    })
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [clock.jdTdb, focusedSlug])

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
          onPositionsLoaded={handleLoaded}
          onPositionsError={handleError}
        />
      </Canvas>
      <SolarHUD
        focusedSlug={focusedSlug}
        onSelectFocus={onSelectFocus}
        loaded={loaded}
        error={error}
      />
    </main>
  )
}
