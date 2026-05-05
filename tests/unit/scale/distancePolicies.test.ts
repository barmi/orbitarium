import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { AU, type Meters } from '@/astro'
import {
  DISTANCE_POLICIES,
  getDistancePolicy,
  LinearAuPolicy,
  LogarithmicPolicy,
  PIECEWISE_INPUT_BREAKS_AU,
  PIECEWISE_OUTPUT_BREAKS_SCENE,
  PiecewiseMonotonicPolicy,
  SCALE_TOL_M,
  type SceneUnit,
} from '@/scale'

const m = (n: number): Meters => n as Meters
const s = (n: number): SceneUnit => n as SceneUnit

interface PolicySample {
  distance_au: number
  distance_m: number
  forward_scene: number
  inverse_m: number
  round_trip_diff_m: number
}

interface DistanceFixtureFile {
  _tolerance_m: number
  policies: { name: string; samples: PolicySample[] }[]
}

const fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/work-04/distance-policies.json'), 'utf-8'),
) as DistanceFixtureFile

describe('LinearAuPolicy', () => {
  it('forwards 1 AU to 1 scene unit', () => {
    expect(LinearAuPolicy.forward(m(AU))).toBeCloseTo(1, 14)
  })
  it('round-trips bit-exact', () => {
    for (const d of [0, AU * 0.01, AU, AU * 30, AU * 100]) {
      const f = LinearAuPolicy.forward(m(d))
      expect(LinearAuPolicy.inverse(f)).toBe(d)
    }
  })
})

describe('PiecewiseMonotonicPolicy', () => {
  it('exposes break points [0.4, 5, 50] AU -> [0.4, 1.5, 3.0] scene', () => {
    expect([...PIECEWISE_INPUT_BREAKS_AU]).toEqual([0.4, 5, 50])
    expect([...PIECEWISE_OUTPUT_BREAKS_SCENE]).toEqual([0.4, 1.5, 3.0])
  })

  it('matches break points exactly at the input boundaries', () => {
    for (let i = 0; i < PIECEWISE_INPUT_BREAKS_AU.length; i++) {
      const inAu = PIECEWISE_INPUT_BREAKS_AU[i]!
      const outScene = PIECEWISE_OUTPUT_BREAKS_SCENE[i]!
      expect(PiecewiseMonotonicPolicy.forward(m(inAu * AU))).toBeCloseTo(outScene, 12)
    }
  })

  it('is strictly monotonic across [0, 100] AU', () => {
    let prev = -Infinity
    for (let i = 0; i <= 100; i++) {
      const v = PiecewiseMonotonicPolicy.forward(m((i / 100) * 100 * AU))
      expect(v).toBeGreaterThan(prev)
      prev = v
    }
  })

  // Same IEEE 754 LSB story as logarithmic: ~1 mm at 30 AU, scales linearly
  // beyond. Strict 1 mm absolute holds up through the inner system.
  it('round-trips inside 1 mm tolerance up to 30 AU', () => {
    for (const auD of [0.1, 0.4, 0.5, 1, 5, 10, 30]) {
      const meters = auD * AU
      const f = PiecewiseMonotonicPolicy.forward(m(meters))
      const back = PiecewiseMonotonicPolicy.inverse(f)
      expect(Math.abs(back - meters)).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('round-trip relative error stays at IEEE 754 LSB beyond 30 AU', () => {
    for (const auD of [40, 50, 100]) {
      const meters = auD * AU
      const back = PiecewiseMonotonicPolicy.inverse(PiecewiseMonotonicPolicy.forward(m(meters)))
      expect(Math.abs(back - meters) / meters).toBeLessThan(1e-14)
    }
  })
})

describe('LogarithmicPolicy', () => {
  it('forwards 0 to 0', () => {
    expect(LogarithmicPolicy.forward(m(0))).toBe(0)
  })
  it('forwards 1 AU to ln(2)', () => {
    expect(LogarithmicPolicy.forward(m(AU))).toBeCloseTo(Math.log(2), 14)
  })
  // Round-trip is bounded by IEEE 754 (at d AU, log/exp LSB ~= d * 2^-52 * AU).
  // 1 mm absolute holds up to ~30 AU; beyond that the floor scales linearly
  // with distance (Pluto=40 AU still ~1.3 mm). Use absolute tol up to Pluto
  // and a relative tol beyond (visualization scope covers <= 50 AU).
  it('round-trips inside 1 mm tolerance up to Pluto-class distances', () => {
    for (const auD of [0.001, 0.4, 1, 5, 30]) {
      const meters = auD * AU
      const back = LogarithmicPolicy.inverse(LogarithmicPolicy.forward(m(meters)))
      expect(Math.abs(back - meters)).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('round-trip relative error stays at IEEE 754 LSB up to 1000 AU', () => {
    for (const auD of [40, 50, 100, 1000]) {
      const meters = auD * AU
      const back = LogarithmicPolicy.inverse(LogarithmicPolicy.forward(m(meters)))
      expect(Math.abs(back - meters) / meters).toBeLessThan(1e-14)
    }
  })
})

describe('DISTANCE_POLICIES registry', () => {
  it('lists three policies', () => {
    expect(DISTANCE_POLICIES.map((p) => p.name)).toEqual([
      'linear-au',
      'piecewise-monotonic',
      'logarithmic',
    ])
  })
  it('getDistancePolicy throws on unknown', () => {
    expect(() => getDistancePolicy('nope')).toThrow(/unknown/)
  })
})

describe('distance-policies.json fixture', () => {
  it('has tolerance metadata 1mm', () => {
    expect(fixture._tolerance_m).toBe(1e-3)
  })
  it('matches each policy forward+inverse within tolerance', () => {
    const tol = fixture._tolerance_m
    for (const policyEntry of fixture.policies) {
      const policy = getDistancePolicy(policyEntry.name)
      for (const sample of policyEntry.samples) {
        const forward = policy.forward(m(sample.distance_m))
        expect(Math.abs(forward - sample.forward_scene)).toBeLessThan(1e-12)
        const inverse = policy.inverse(s(forward))
        expect(Math.abs(inverse - sample.inverse_m)).toBeLessThan(tol)
      }
    }
  })
})
