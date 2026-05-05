import { describe, expect, it } from 'vitest'

import type { JdTdb } from '@/astro'
import {
  DE440_BODY_NAIF_IDS,
  DE440_KERNEL_NAME,
  DE440_TIME_RANGE_END_YEAR,
  DE440_TIME_RANGE_START_YEAR,
  EPHEMERIS_TOL_M,
  EPHEMERIS_TOL_VEL_M_S,
  type PositionICRF,
  positionICRF,
  type StateVectorICRF,
  type VelocityICRF,
  velocityICRF,
} from '@/ephemeris'

describe('ephemeris constants', () => {
  it('uses 1mm position and 1µm/s velocity tolerances', () => {
    expect(EPHEMERIS_TOL_M).toBe(1e-3)
    expect(EPHEMERIS_TOL_VEL_M_S).toBe(1e-6)
  })

  it('targets DE440 1900-2150 by default', () => {
    expect(DE440_KERNEL_NAME).toBe('de440')
    expect(DE440_TIME_RANGE_START_YEAR).toBe(1900)
    expect(DE440_TIME_RANGE_END_YEAR).toBe(2150)
  })

  it('lists Sun + 9 planet barycenters + 9 planet bodies + Moon', () => {
    expect(DE440_BODY_NAIF_IDS).toContain(10)
    expect(DE440_BODY_NAIF_IDS).toContain(301)
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(DE440_BODY_NAIF_IDS).toContain(id)
    }
    for (const id of [199, 299, 399, 499, 599, 699, 799, 899, 999]) {
      expect(DE440_BODY_NAIF_IDS).toContain(id)
    }
    expect(DE440_BODY_NAIF_IDS).toHaveLength(20)
  })
})

describe('ephemeris brand types', () => {
  it('positionICRF / velocityICRF builders preserve component values', () => {
    const p = positionICRF(1, 2, 3)
    expect(p[0]).toBe(1)
    expect(p[1]).toBe(2)
    expect(p[2]).toBe(3)
    const v = velocityICRF(0.1, 0.2, 0.3)
    expect(v[0]).toBeCloseTo(0.1, 15)
    expect(v[1]).toBeCloseTo(0.2, 15)
    expect(v[2]).toBeCloseTo(0.3, 15)
  })

  it('StateVectorICRF accepts brand-typed components', () => {
    const sv: StateVectorICRF = {
      naifId: 399,
      jdTdb: 2451545.0 as JdTdb,
      position: positionICRF(1.495978707e11, 0, 0),
      velocity: velocityICRF(0, 29780, 0),
    }
    expect(sv.naifId).toBe(399)
    expect(sv.position[0]).toBeCloseTo(1.495978707e11, 0)
    expect(sv.velocity[1]).toBe(29780)
  })

  it('PositionICRF / VelocityICRF are 3-element readonly tuples', () => {
    const p: PositionICRF = positionICRF(0, 0, 0)
    const v: VelocityICRF = velocityICRF(0, 0, 0)
    expect(p).toHaveLength(3)
    expect(v).toHaveLength(3)
  })
})
