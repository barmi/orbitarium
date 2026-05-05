import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { type Meters } from '@/astro'
import {
  BODY_MEAN_EQUATORIAL_RADIUS_M,
  EARTH_MEAN_EQUATORIAL_RADIUS_M,
  getSizePolicy,
  LogarithmicMagnificationPolicy,
  LOGMAG_BASE_SCENE,
  LOGMAG_K,
  LOGMAG_R0_M,
  MINMAX_MAX_SCENE,
  MINMAX_MIN_SCENE,
  MinMaxClampPolicy,
  radiusToScene,
  SCALE_BODY_NAIF_IDS,
  sceneToRadius,
  SIZE_POLICIES,
  type SizeScene,
  UniformPolicy,
} from '@/scale'

import { expectCloseMeters } from '../../helpers/expectClose'

const m = (n: number): Meters => n as Meters
const s = (n: number): SizeScene => n as SizeScene

interface PolicySample {
  naif_id: number
  radius_m: number
  forward_scene: number
  inverse_m: number
  round_trip_diff_m: number
}

interface SizeFixtureFile {
  _tolerance_m: number
  policies: { name: string; samples: PolicySample[] }[]
}

const fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/work-04/size-policies.json'), 'utf-8'),
) as SizeFixtureFile

describe('UniformPolicy', () => {
  it('round-trips bit-exact for the body radius table', () => {
    for (const id of SCALE_BODY_NAIF_IDS) {
      const r = BODY_MEAN_EQUATORIAL_RADIUS_M[id]!
      expect(UniformPolicy.inverse(UniformPolicy.forward(r))).toBe(r)
    }
  })
})

describe('LogarithmicMagnificationPolicy', () => {
  it('uses Earth radius as r0 and k=0.5 / base=0.005', () => {
    expect(LOGMAG_R0_M).toBe(EARTH_MEAN_EQUATORIAL_RADIUS_M)
    expect(LOGMAG_K).toBe(0.5)
    expect(LOGMAG_BASE_SCENE).toBe(0.005)
  })

  it('forwards Earth (r=r0) to base + k*log10(2)', () => {
    expect(LogarithmicMagnificationPolicy.forward(m(LOGMAG_R0_M))).toBeCloseTo(
      LOGMAG_BASE_SCENE + LOGMAG_K * Math.log10(2),
      14,
    )
  })

  it('produces strictly positive sizes for all bodies in catalog', () => {
    for (const id of SCALE_BODY_NAIF_IDS) {
      const r = BODY_MEAN_EQUATORIAL_RADIUS_M[id]!
      const sceneSize = LogarithmicMagnificationPolicy.forward(r)
      expect(sceneSize).toBeGreaterThan(0)
    }
  })

  it('round-trips inside 1 mm for the body radius table', () => {
    for (const id of SCALE_BODY_NAIF_IDS) {
      const r = BODY_MEAN_EQUATORIAL_RADIUS_M[id]!
      const back = LogarithmicMagnificationPolicy.inverse(LogarithmicMagnificationPolicy.forward(r))
      expectCloseMeters(back, r)
    }
  })

  it('is monotonic across the radius range', () => {
    let prev = -Infinity
    const sortedRadii = SCALE_BODY_NAIF_IDS.map((id) => BODY_MEAN_EQUATORIAL_RADIUS_M[id]!).sort(
      (a, b) => a - b,
    )
    for (const r of sortedRadii) {
      const v = LogarithmicMagnificationPolicy.forward(r)
      expect(v).toBeGreaterThan(prev)
      prev = v
    }
  })
})

describe('MinMaxClampPolicy', () => {
  it('maps Pluto (r_min) to MIN_SCENE and Sun (r_max) to MAX_SCENE', () => {
    expect(MinMaxClampPolicy.forward(BODY_MEAN_EQUATORIAL_RADIUS_M[999]!)).toBeCloseTo(
      MINMAX_MIN_SCENE,
      14,
    )
    expect(MinMaxClampPolicy.forward(BODY_MEAN_EQUATORIAL_RADIUS_M[10]!)).toBeCloseTo(
      MINMAX_MAX_SCENE,
      14,
    )
  })

  it('round-trips inside 1 mm for the body radius table', () => {
    for (const id of SCALE_BODY_NAIF_IDS) {
      const r = BODY_MEAN_EQUATORIAL_RADIUS_M[id]!
      const back = MinMaxClampPolicy.inverse(MinMaxClampPolicy.forward(r))
      expectCloseMeters(back, r)
    }
  })

  it('is monotonic across the body radius table', () => {
    let prev = -Infinity
    const sortedRadii = SCALE_BODY_NAIF_IDS.map((id) => BODY_MEAN_EQUATORIAL_RADIUS_M[id]!).sort(
      (a, b) => a - b,
    )
    for (const r of sortedRadii) {
      const v = MinMaxClampPolicy.forward(r)
      expect(v).toBeGreaterThan(prev)
      prev = v
    }
  })
})

describe('SIZE_POLICIES registry', () => {
  it('lists three policies', () => {
    expect(SIZE_POLICIES.map((p) => p.name)).toEqual([
      'uniform',
      'logarithmic-magnification',
      'minmax-clamp',
    ])
  })
  it('getSizePolicy throws on unknown', () => {
    expect(() => getSizePolicy('nope')).toThrow(/unknown/)
  })
})

describe('radiusToScene / sceneToRadius helpers', () => {
  it('delegate to the policy', () => {
    const r = m(BODY_MEAN_EQUATORIAL_RADIUS_M[399]!)
    expect(radiusToScene(r, UniformPolicy)).toBe(UniformPolicy.forward(r))
    const back = sceneToRadius(s(0.156), LogarithmicMagnificationPolicy)
    expect(back).toBe(LogarithmicMagnificationPolicy.inverse(s(0.156)))
  })
})

describe('size-policies.json fixture', () => {
  it('has tolerance metadata 1mm', () => {
    expect(fixture._tolerance_m).toBe(1e-3)
  })
  it('matches each policy forward+inverse within tolerance', () => {
    const tol = fixture._tolerance_m
    for (const policyEntry of fixture.policies) {
      const policy = getSizePolicy(policyEntry.name)
      for (const sample of policyEntry.samples) {
        const forward = policy.forward(m(sample.radius_m))
        expect(Math.abs(forward - sample.forward_scene)).toBeLessThan(1e-12)
        const inverse = policy.inverse(s(forward))
        expectCloseMeters(inverse, sample.inverse_m, tol * 1000)
      }
    }
  })
})
