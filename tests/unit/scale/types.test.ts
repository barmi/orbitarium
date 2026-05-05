import { describe, expect, it } from 'vitest'

import {
  BODY_MEAN_EQUATORIAL_RADIUS_M,
  EARTH_MEAN_EQUATORIAL_RADIUS_M,
  type PositionScene,
  positionScene,
  SCALE_BODY_NAIF_IDS,
  SCALE_TOL_M,
  SCALE_TOL_SIZE_M,
  sceneUnit,
  type SizeScene,
  sizeScene,
} from '@/scale'

describe('scale constants', () => {
  it('uses 1mm round-trip tolerances for distance and size', () => {
    expect(SCALE_TOL_M).toBe(1e-3)
    expect(SCALE_TOL_SIZE_M).toBe(1e-3)
  })

  it('Earth mean equatorial radius matches IAU WGCCRE 2015', () => {
    expect(EARTH_MEAN_EQUATORIAL_RADIUS_M).toBe(6_378_136.6)
  })

  it('body radius table covers Sun + 8 planets + Moon + Pluto = 11 entries', () => {
    expect(SCALE_BODY_NAIF_IDS).toHaveLength(11)
    for (const id of SCALE_BODY_NAIF_IDS) {
      expect(BODY_MEAN_EQUATORIAL_RADIUS_M[id]).toBeGreaterThan(0)
    }
  })

  it('Sun radius is the largest, Pluto the smallest', () => {
    const radii = SCALE_BODY_NAIF_IDS.map((id) => BODY_MEAN_EQUATORIAL_RADIUS_M[id]!)
    expect(Math.max(...radii)).toBe(BODY_MEAN_EQUATORIAL_RADIUS_M[10])
    expect(Math.min(...radii)).toBe(BODY_MEAN_EQUATORIAL_RADIUS_M[999])
  })

  it('Earth radius matches the per-body table entry', () => {
    expect(BODY_MEAN_EQUATORIAL_RADIUS_M[399]).toBe(EARTH_MEAN_EQUATORIAL_RADIUS_M)
  })
})

describe('scale brand types', () => {
  it('sceneUnit / sizeScene factories preserve values', () => {
    expect(sceneUnit(1.5)).toBe(1.5)
    expect(sizeScene(0.42)).toBe(0.42)
  })

  it('positionScene returns a 3-tuple', () => {
    const p: PositionScene = positionScene(1, 2, 3)
    expect(p).toHaveLength(3)
    expect(p[0]).toBe(1)
    expect(p[1]).toBe(2)
    expect(p[2]).toBe(3)
  })

  it('SizeScene is interchangeable with SceneUnit', () => {
    const s: SizeScene = sizeScene(0.7)
    const u = sceneUnit(0.7)
    expect(s).toBe(u)
  })
})
