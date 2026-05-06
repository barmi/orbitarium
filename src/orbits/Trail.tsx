import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Line } from 'three'

import { meters } from '@/astro'
import { type PositionICRF, positionICRF } from '@/ephemeris'
import { applyAnchor, type SceneAnchorContext, sceneToVector3 } from '@/render'
import { type DistancePolicy, positionToScene } from '@/scale'

import { createPredictMaterial, createTrailMaterial, type OrbitMaterialOptions } from './material'
import type { OrbitPolyline } from './types'

export interface OrbitLineProps {
  readonly polyline: OrbitPolyline
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
  readonly material?: OrbitMaterialOptions
  readonly variant?: 'trail' | 'predict'
}

function buildPositions(
  polyline: OrbitPolyline,
  distancePolicy: DistancePolicy,
  anchor: SceneAnchorContext,
): Float32Array {
  const out = new Float32Array(polyline.count * 3)
  for (let i = 0; i < polyline.count; i++) {
    const px = polyline.positionsM[i * 3 + 0]!
    const py = polyline.positionsM[i * 3 + 1]!
    const pz = polyline.positionsM[i * 3 + 2]!
    const pIcrf: PositionICRF = positionICRF(meters(px), meters(py), meters(pz))
    const anchored = applyAnchor(pIcrf, anchor)
    const scene = positionToScene(anchored, distancePolicy)
    const v = sceneToVector3(scene)
    out[i * 3 + 0] = v.x
    out[i * 3 + 1] = v.y
    out[i * 3 + 2] = v.z
  }
  return out
}

/**
 * Generic orbit line — Trail (past) or Predict (future). The polyline data
 * itself is identical; only the material distinguishes them.
 */
export default function OrbitLine({
  polyline,
  distancePolicy,
  anchor,
  material,
  variant = 'trail',
}: OrbitLineProps) {
  const positions = useMemo(
    () => buildPositions(polyline, distancePolicy, anchor),
    [polyline, distancePolicy, anchor],
  )

  const lineObject = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    const mat =
      variant === 'predict' ? createPredictMaterial(material) : createTrailMaterial(material)
    const line = new Line(geo, mat)
    if (variant === 'predict') {
      line.computeLineDistances()
    }
    return line
  }, [positions, material, variant])

  useEffect(() => {
    return () => {
      lineObject.geometry.dispose()
      ;(lineObject.material as { dispose?: () => void }).dispose?.()
    }
  }, [lineObject])

  return <primitive object={lineObject} />
}
