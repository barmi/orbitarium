import { getBodyByNaifId } from '@/bodies'
import { OrbitLine, type OrbitPolyline } from '@/orbits'
import { type SceneAnchorContext } from '@/render'
import { type DistancePolicy } from '@/scale'

interface Props {
  readonly orbits: ReadonlyMap<number, OrbitPolyline>
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
  readonly focusedSlug: string | null
}

export default function SolarOrbits({ orbits, distancePolicy, anchor, focusedSlug }: Props) {
  return (
    <>
      {[...orbits.entries()].map(([naifId, polyline]) => {
        const body = getBodyByNaifId(naifId)
        if (!body) return null
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
    </>
  )
}
