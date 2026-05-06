import { describe, expect, it } from 'vitest'

import { type JdTdb, meters, metersPerSecond } from '@/astro'
import type { De440Evaluator, StateVectorICRF } from '@/ephemeris'
import { positionICRF, velocityICRF } from '@/ephemeris'
import { sampleOrbit } from '@/orbits'

function syntheticEvaluator(positionAt: (jd: number) => [number, number, number]): De440Evaluator {
  return {
    getManifest() {
      return Promise.reject(new Error('not used in sampler test'))
    },
    getStateAt(naifId: number, jdTdb: JdTdb): Promise<StateVectorICRF> {
      const [x, y, z] = positionAt(jdTdb)
      return Promise.resolve<StateVectorICRF>({
        naifId,
        jdTdb,
        position: positionICRF(meters(x), meters(y), meters(z)),
        velocity: velocityICRF(metersPerSecond(0), metersPerSecond(0), metersPerSecond(0)),
      })
    },
  }
}

describe('sampleOrbit', () => {
  it('count == 1 returns a single sample at jdStart (no division)', async () => {
    const evaluator = syntheticEvaluator(() => [1, 2, 3])
    const polyline = await sampleOrbit(
      evaluator,
      399,
      2_451_545.0 as JdTdb,
      2_451_546.0 as JdTdb,
      1,
    )
    expect(polyline.count).toBe(1)
    expect(polyline.jdTdbs[0]).toBe(2_451_545.0)
    expect(polyline.positionsM[0]).toBe(1)
    expect(polyline.positionsM[1]).toBe(2)
    expect(polyline.positionsM[2]).toBe(3)
  })

  it('count >= 2 spans jdStart..jdEnd inclusively', async () => {
    const evaluator = syntheticEvaluator((jd) => [jd, 0, 0])
    const polyline = await sampleOrbit(evaluator, 399, 100 as JdTdb, 200 as JdTdb, 5)
    expect(polyline.count).toBe(5)
    expect(polyline.jdTdbs[0]).toBe(100)
    expect(polyline.jdTdbs[4]).toBe(200)
    expect(polyline.jdTdbs[2]).toBeCloseTo(150, 9)
    expect(polyline.positionsM[0]).toBe(100)
    expect(polyline.positionsM[12]).toBe(200)
  })

  it('positionsM length is count * 3', async () => {
    const evaluator = syntheticEvaluator(() => [0, 0, 0])
    const polyline = await sampleOrbit(evaluator, 399, 0 as JdTdb, 1 as JdTdb, 8)
    expect(polyline.positionsM.length).toBe(24)
    expect(polyline.jdTdbs.length).toBe(8)
  })

  it('throws on count < 1', async () => {
    const evaluator = syntheticEvaluator(() => [0, 0, 0])
    await expect(sampleOrbit(evaluator, 399, 0 as JdTdb, 1 as JdTdb, 0)).rejects.toThrow(/count/)
  })

  it('parallel evaluation completes for 256 samples', async () => {
    const evaluator = syntheticEvaluator((jd) => [jd, jd, jd])
    const polyline = await sampleOrbit(evaluator, 399, 0 as JdTdb, 100 as JdTdb, 256)
    expect(polyline.count).toBe(256)
    // Sample 0 should be (0, 0, 0); sample 255 should be (100, 100, 100)
    expect(polyline.positionsM[0]).toBe(0)
    expect(polyline.positionsM[255 * 3]).toBe(100)
  })
})
