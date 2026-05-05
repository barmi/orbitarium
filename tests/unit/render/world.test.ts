import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import {
  SCENE_TO_THREE_UNIT_RATIO,
  sceneScalarToWorld,
  sceneToVector3,
  vector3ToScene,
  worldScalarToScene,
} from '@/render'
import { positionScene, sceneUnit } from '@/scale'

describe('sceneToVector3 / vector3ToScene', () => {
  it('returns a three.js Vector3 with axis-mapped components', () => {
    const p = positionScene(1.5, -2.5, 3.0)
    const v = sceneToVector3(p)
    expect(v).toBeInstanceOf(Vector3)
    expect(v.x).toBe(1.5)
    expect(v.y).toBe(-2.5)
    expect(v.z).toBe(3.0)
  })

  it('round-trips bit-exact at 1:1 ratio', () => {
    const p = positionScene(0.123, 4.567e6, -8.9e-3)
    const v = sceneToVector3(p)
    const restored = vector3ToScene(v)
    expect(restored[0]).toBe(p[0])
    expect(restored[1]).toBe(p[1])
    expect(restored[2]).toBe(p[2])
  })
})

describe('scalar adapters', () => {
  it('sceneScalarToWorld passes through at 1:1 ratio', () => {
    expect(sceneScalarToWorld(sceneUnit(0.42))).toBe(0.42)
    expect(sceneScalarToWorld(sceneUnit(0))).toBe(0)
    expect(sceneScalarToWorld(sceneUnit(1e9))).toBe(1e9)
  })

  it('worldScalarToScene round-trips bit-exact at 1:1 ratio', () => {
    const s = sceneUnit(0.42)
    expect(worldScalarToScene(sceneScalarToWorld(s))).toBe(s)
  })

  it('SCENE_TO_THREE_UNIT_RATIO stays at 1 (Work 4 #3 carry-over)', () => {
    expect(SCENE_TO_THREE_UNIT_RATIO).toBe(1)
  })
})
