import { describe, expect, it } from 'vitest'

import { AU, type Meters } from '@/astro'
import type { PositionICRF } from '@/ephemeris'
import {
  LinearAuPolicy,
  LogarithmicPolicy,
  PiecewiseMonotonicPolicy,
  positionScene,
  positionToScene,
  SCALE_TOL_M,
  sceneToPosition,
} from '@/scale'

const m = (n: number): Meters => n as Meters
const pos = (x: number, y: number, z: number): PositionICRF =>
  [m(x), m(y), m(z)] as unknown as PositionICRF

describe('positionToScene / sceneToPosition', () => {
  it('handles the zero vector', () => {
    expect(positionToScene(pos(0, 0, 0), LinearAuPolicy)).toEqual(positionScene(0, 0, 0))
    expect(sceneToPosition(positionScene(0, 0, 0), LinearAuPolicy)[0]).toBe(0)
  })

  it('preserves direction with LinearAuPolicy (1 AU on x axis)', () => {
    const p = positionToScene(pos(AU, 0, 0), LinearAuPolicy)
    expect(p[0]).toBeCloseTo(1, 14)
    expect(p[1]).toBe(0)
    expect(p[2]).toBe(0)
  })

  it('preserves direction with PiecewiseMonotonicPolicy (5 AU on y axis -> 1.5 scene y)', () => {
    const p = positionToScene(pos(0, 5 * AU, 0), PiecewiseMonotonicPolicy)
    expect(p[0]).toBe(0)
    expect(p[1]).toBeCloseTo(1.5, 12)
    expect(p[2]).toBe(0)
  })

  it('round-trips an arbitrary direction within 1 mm', () => {
    for (const policy of [LinearAuPolicy, PiecewiseMonotonicPolicy, LogarithmicPolicy]) {
      const original = pos(1.5 * AU, -3.7 * AU, 0.8 * AU)
      const sceneVec = positionToScene(original, policy)
      const back = sceneToPosition(sceneVec, policy)
      const dx = (back[0] as number) - (original[0] as number)
      const dy = (back[1] as number) - (original[1] as number)
      const dz = (back[2] as number) - (original[2] as number)
      const diff = Math.hypot(dx, dy, dz)
      expect(diff).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('preserves direction (cosine 1.0) for non-zero vectors', () => {
    for (const policy of [LinearAuPolicy, PiecewiseMonotonicPolicy, LogarithmicPolicy]) {
      const v = pos(2 * AU, 1 * AU, -0.5 * AU)
      const scene = positionToScene(v, policy)
      const dot = v[0] * scene[0] + v[1] * scene[1] + v[2] * scene[2]
      const vMag = Math.hypot(v[0], v[1], v[2])
      const sMag = Math.hypot(scene[0], scene[1], scene[2])
      expect(dot / (vMag * sMag)).toBeCloseTo(1, 14)
    }
  })
})
