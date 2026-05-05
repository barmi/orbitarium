import type { Meters } from '@/astro'
import type { PositionICRF } from '@/ephemeris'

import type { DistancePolicy } from './types'
import { type PositionScene, positionScene, type SceneUnit } from './types'

function magnitude(x: number, y: number, z: number): number {
  return Math.hypot(x, y, z)
}

const meters = (n: number): Meters => n as Meters

export function positionToScene(pos: PositionICRF, policy: DistancePolicy): PositionScene {
  const x = pos[0] as number
  const y = pos[1] as number
  const z = pos[2] as number
  const rMeters = magnitude(x, y, z)
  if (rMeters === 0) {
    return positionScene(0, 0, 0)
  }
  const sScene = policy.forward(meters(rMeters))
  const ratio = sScene / rMeters
  return positionScene(x * ratio, y * ratio, z * ratio)
}

export function sceneToPosition(posScene: PositionScene, policy: DistancePolicy): PositionICRF {
  const x = posScene[0] as number
  const y = posScene[1] as number
  const z = posScene[2] as number
  const sScene = magnitude(x, y, z)
  if (sScene === 0) {
    return [meters(0), meters(0), meters(0)] as unknown as PositionICRF
  }
  const rMeters = policy.inverse(sScene as unknown as SceneUnit)
  const ratio = rMeters / sScene
  return [meters(x * ratio), meters(y * ratio), meters(z * ratio)] as unknown as PositionICRF
}
