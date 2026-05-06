import { describe, expect, it } from 'vitest'

import {
  ASTEROID_BELT_DEFAULT_COUNT,
  DEFAULT_PREDICT_CONFIG,
  DEFAULT_PREDICT_DAYS,
  DEFAULT_SAMPLE_COUNT,
  DEFAULT_TRAIL_CONFIG,
  DEFAULT_TRAIL_DAYS,
  ORBIT_TOL_M,
  ORBIT_TOL_MM,
  type OrbitPolyline,
  type OrbitSample,
} from '@/orbits'

describe('orbits constants', () => {
  it('1 mm tolerance + 100 m polyline reconstruction tolerance', () => {
    expect(ORBIT_TOL_MM).toBe(1)
    expect(ORBIT_TOL_M).toBe(100)
  })

  it('default trail / predict 365 days each', () => {
    expect(DEFAULT_TRAIL_DAYS).toBe(365)
    expect(DEFAULT_PREDICT_DAYS).toBe(365)
  })

  it('default sample count 256', () => {
    expect(DEFAULT_SAMPLE_COUNT).toBe(256)
  })

  it('default trail / predict configs use the constants', () => {
    expect(DEFAULT_TRAIL_CONFIG.durationDays).toBe(365)
    expect(DEFAULT_TRAIL_CONFIG.sampleCount).toBe(256)
    expect(DEFAULT_PREDICT_CONFIG.durationDays).toBe(365)
    expect(DEFAULT_PREDICT_CONFIG.sampleCount).toBe(256)
  })

  it('asteroid belt default count 256', () => {
    expect(ASTEROID_BELT_DEFAULT_COUNT).toBe(256)
  })
})

describe('OrbitSample / OrbitPolyline shape', () => {
  it('OrbitPolyline carries typed arrays aligned by index', () => {
    const positionsM = new Float64Array([1, 2, 3, 4, 5, 6])
    const jdTdbs = new Float64Array([2451545.0, 2451546.0])
    const polyline: OrbitPolyline = { count: 2, positionsM, jdTdbs }
    expect(polyline.positionsM.length).toBe(polyline.count * 3)
    expect(polyline.jdTdbs.length).toBe(polyline.count)
  })

  it('OrbitSample is a structurally-typed object', () => {
    const sample: OrbitSample = {
      jdTdb: 2451545.0 as never,
      position: [1, 2, 3] as never,
    }
    expect(sample.jdTdb).toBeDefined()
  })
})
