import { Vector3 } from 'three'

import { type PositionScene, positionScene, type SceneUnit, sceneUnit } from '@/scale'

import { SCENE_TO_THREE_UNIT_RATIO } from './constants'

export function sceneToVector3(scene: PositionScene): Vector3 {
  return new Vector3(
    scene[0] * SCENE_TO_THREE_UNIT_RATIO,
    scene[1] * SCENE_TO_THREE_UNIT_RATIO,
    scene[2] * SCENE_TO_THREE_UNIT_RATIO,
  )
}

export function vector3ToScene(v: Vector3): PositionScene {
  return positionScene(
    v.x / SCENE_TO_THREE_UNIT_RATIO,
    v.y / SCENE_TO_THREE_UNIT_RATIO,
    v.z / SCENE_TO_THREE_UNIT_RATIO,
  )
}

export function sceneScalarToWorld(s: SceneUnit): number {
  return s * SCENE_TO_THREE_UNIT_RATIO
}

export function worldScalarToScene(world: number): SceneUnit {
  return sceneUnit(world / SCENE_TO_THREE_UNIT_RATIO)
}
