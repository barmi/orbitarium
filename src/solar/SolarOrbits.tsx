import { getBodyByNaifId } from '@/bodies'
import type { PositionICRF } from '@/ephemeris'
import { OrbitLine, type OrbitPolyline } from '@/orbits'
import { positionToWorld, type SceneAnchorContext, ssbAnchor } from '@/render'
import { type DistancePolicy } from '@/scale'

const MOON_NAIF = 301
const EARTH_NAIF = 399

interface Props {
  readonly orbits: ReadonlyMap<number, OrbitPolyline>
  readonly moonGeocentric: OrbitPolyline | null
  readonly positions: ReadonlyMap<number, PositionICRF>
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
  readonly focusedSlug: string | null
}

export default function SolarOrbits({
  orbits,
  moonGeocentric,
  positions,
  distancePolicy,
  anchor,
  focusedSlug,
}: Props) {
  // Earth's current scene position — used to attach the Moon's geocentric orbit ring.
  const earthPos = positions.get(EARTH_NAIF)
  const earthWorld = earthPos ? positionToWorld(earthPos, distancePolicy, anchor) : null

  return (
    <>
      {[...orbits.entries()].map(([naifId, polyline]) => {
        const body = getBodyByNaifId(naifId)
        if (!body) return null
        // Skip the SSB-frame Moon orbit — it visually collapses onto Earth's
        // heliocentric ellipse. We render the geocentric ring below instead.
        if (naifId === MOON_NAIF) return null
        const isFocused = focusedSlug === body.slug
        return (
          <OrbitLine
            key={naifId}
            polyline={polyline}
            distancePolicy={distancePolicy}
            anchor={anchor}
            variant="trail"
            material={{
              color: body.fallbackColor,
              opacity: isFocused ? 0.95 : 0.4,
            }}
          />
        )
      })}
      {moonGeocentric && earthWorld && (
        <group position={[earthWorld.x, earthWorld.y, earthWorld.z]}>
          <OrbitLine
            polyline={moonGeocentric}
            distancePolicy={distancePolicy}
            anchor={ssbAnchor()}
            variant="trail"
            material={{
              color: '#cfd6d3',
              opacity: focusedSlug === 'moon' || focusedSlug === 'earth' ? 0.95 : 0.7,
            }}
          />
        </group>
      )}
    </>
  )
}
