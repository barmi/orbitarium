import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Line } from 'three'

import { meters } from '@/astro'
import { positionICRF } from '@/ephemeris'
import { createTrailMaterial, type PairedOrbitSamples } from '@/orbits'
import { positionToWorld, type SceneAnchorContext } from '@/render'
import { type DistancePolicy } from '@/scale'

interface Props {
  readonly samples: PairedOrbitSamples
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
  readonly color: string
  readonly opacity: number
}

/**
 * Geocentric Moon orbit ring rendered at body-accurate scale. For each
 * paired Moon/Earth SSB sample, run `positionToWorld` on both separately,
 * then store the world-space offset (Moon − Earth). The resulting Line is
 * rendered inside a `<group position={earthCurrentWorld}>` so the ring sits
 * exactly where Moon's body appears at each phase of the cycle.
 *
 * This is the correct way to render a relative orbit when the distance
 * policy is non-linear: applying the policy to a tiny displacement vector
 * (as `sampleRelativeOrbit` would) uses the wrong slope (slope at 0 AU
 * vs. slope at 1 AU for piecewise-monotonic), which produced a ~4× too-large
 * ring previously.
 */
export default function MoonOrbitRing({ samples, distancePolicy, anchor, color, opacity }: Props) {
  const lineObject = useMemo(() => {
    const positions = new Float32Array(samples.count * 3)
    for (let i = 0; i < samples.count; i++) {
      const moon = positionICRF(
        meters(samples.positionsM[i * 3 + 0]!),
        meters(samples.positionsM[i * 3 + 1]!),
        meters(samples.positionsM[i * 3 + 2]!),
      )
      const earth = positionICRF(
        meters(samples.refPositionsM[i * 3 + 0]!),
        meters(samples.refPositionsM[i * 3 + 1]!),
        meters(samples.refPositionsM[i * 3 + 2]!),
      )
      const moonWorld = positionToWorld(moon, distancePolicy, anchor)
      const earthWorld = positionToWorld(earth, distancePolicy, anchor)
      positions[i * 3 + 0] = moonWorld.x - earthWorld.x
      positions[i * 3 + 1] = moonWorld.y - earthWorld.y
      positions[i * 3 + 2] = moonWorld.z - earthWorld.z
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    const mat = createTrailMaterial({ color, opacity })
    return new Line(geo, mat)
  }, [samples, distancePolicy, anchor, color, opacity])

  useEffect(() => {
    return () => {
      lineObject.geometry.dispose()
      ;(lineObject.material as { dispose?: () => void }).dispose?.()
    }
  }, [lineObject])

  return <primitive object={lineObject} />
}
