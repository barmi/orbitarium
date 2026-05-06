import { type JdTdb } from '@/astro'
import { Body, type BodyDefinition, getBodyBySlug, SaturnRings, SunMesh } from '@/bodies'
import type { PositionICRF } from '@/ephemeris'
import { positionToWorld, type SceneAnchorContext, sceneScalarToWorld } from '@/render'
import { type DistancePolicy, radiusToScene, type SizePolicy } from '@/scale'

import BodyLabel from './BodyLabel'
import { SOLAR_BODY_SLUGS, SUN_VISUAL_RADIUS_SCENE } from './constants'

interface Props {
  readonly positions: ReadonlyMap<number, PositionICRF>
  readonly distancePolicy: DistancePolicy
  readonly sizePolicy: SizePolicy
  readonly anchor: SceneAnchorContext
  readonly jdTdb: JdTdb
  readonly sizeScale: number
}

function computeWorldPosition(
  body: BodyDefinition,
  positions: ReadonlyMap<number, PositionICRF>,
  distancePolicy: DistancePolicy,
  anchor: SceneAnchorContext,
): readonly [number, number, number] | null {
  const pos = positions.get(body.naifId)
  if (!pos) return null
  const v = positionToWorld(pos, distancePolicy, anchor)
  return [v.x, v.y, v.z]
}

export default function SolarBodies({
  positions,
  distancePolicy,
  sizePolicy,
  anchor,
  jdTdb,
  sizeScale,
}: Props) {
  return (
    <>
      {SOLAR_BODY_SLUGS.map((slug) => {
        const body = getBodyBySlug(slug)
        if (!body) return null
        const worldPos = computeWorldPosition(body, positions, distancePolicy, anchor)
        if (!worldPos) return null
        const isSun = body.kind === 'sun'
        const worldRadius =
          (isSun
            ? SUN_VISUAL_RADIUS_SCENE
            : sceneScalarToWorld(radiusToScene(body.radiusM, sizePolicy))) * sizeScale

        if (isSun) {
          return (
            <SunMesh
              key={body.naifId}
              body={body}
              jdTdb={jdTdb}
              worldPosition={worldPos}
              worldRadius={worldRadius}
            />
          )
        }

        if (body.rings) {
          const rings = body.rings
          const ringScale = worldRadius / body.radiusM
          return (
            <group key={body.naifId}>
              <Body body={body} jdTdb={jdTdb} worldPosition={worldPos} worldRadius={worldRadius} />
              <SaturnRings
                body={body}
                jdTdb={jdTdb}
                innerWorldRadius={rings.innerRadiusM * ringScale}
                outerWorldRadius={rings.outerRadiusM * ringScale}
                textureUrl={rings.textureUrl}
                worldPosition={worldPos}
              />
            </group>
          )
        }

        if (body.slug === 'moon') {
          return (
            <group key={body.naifId}>
              <Body body={body} jdTdb={jdTdb} worldPosition={worldPos} worldRadius={worldRadius} />
              <BodyLabel text="Moon" worldPosition={worldPos} bodyWorldRadius={worldRadius} />
            </group>
          )
        }

        return (
          <Body
            key={body.naifId}
            body={body}
            jdTdb={jdTdb}
            worldPosition={worldPos}
            worldRadius={worldRadius}
          />
        )
      })}
    </>
  )
}
