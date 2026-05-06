import { useMemo } from 'react'

import { type JdTdb } from '@/astro'
import type { De440Evaluator } from '@/ephemeris'
import { RENDER_DEFAULTS, ssbAnchor } from '@/render'
import { getDistancePolicy, getSizePolicy } from '@/scale'

import CameraController from './CameraController'
import SolarBodies from './SolarBodies'
import SolarOrbits from './SolarOrbits'
import Starfield from './Starfield'
import { useSolarOrbits } from './useSolarOrbits'
import { useSolarPositions } from './useSolarPositions'

interface Props {
  readonly evaluator: De440Evaluator
  readonly jdTdb: JdTdb
  readonly focusedSlug: string | null
  readonly distancePolicyName: string
  readonly sizePolicyName: string
  readonly onPositionsLoaded?: (loaded: boolean) => void
  readonly onPositionsError?: (error: string | null) => void
}

export default function SolarScene({
  evaluator,
  jdTdb,
  focusedSlug,
  distancePolicyName,
  sizePolicyName,
  onPositionsLoaded,
  onPositionsError,
}: Props) {
  const distancePolicy = useMemo(() => getDistancePolicy(distancePolicyName), [distancePolicyName])
  const sizePolicy = useMemo(() => getSizePolicy(sizePolicyName), [sizePolicyName])
  const anchor = useMemo(() => ssbAnchor(), [])

  const positions = useSolarPositions(evaluator, jdTdb)
  const orbits = useSolarOrbits(evaluator, jdTdb)

  // Surface load state to parent.
  useMemo(() => {
    onPositionsLoaded?.(positions.loaded)
    onPositionsError?.(positions.error)
  }, [positions.loaded, positions.error, onPositionsLoaded, onPositionsError])

  return (
    <>
      <ambientLight intensity={RENDER_DEFAULTS.ambientIntensity} />
      <pointLight position={[0, 0, 0]} intensity={RENDER_DEFAULTS.sunIntensity * 1.5} decay={0} />
      <Starfield />
      <SolarBodies
        positions={positions.map}
        distancePolicy={distancePolicy}
        sizePolicy={sizePolicy}
        anchor={anchor}
        jdTdb={jdTdb}
      />
      <SolarOrbits
        orbits={orbits.map}
        distancePolicy={distancePolicy}
        anchor={anchor}
        focusedSlug={focusedSlug}
      />
      <CameraController
        focusedSlug={focusedSlug}
        positions={positions.map}
        distancePolicy={distancePolicy}
        anchor={anchor}
      />
    </>
  )
}
