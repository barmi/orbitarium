import { describe, expect, it } from 'vitest'

import {
  EARTH_IAU_ROTATION,
  evaluateRotation,
  getIauRotationModel,
  IAU_ROTATION_MODELS,
  inertialToBodyFixed,
  type JdTdb,
  JUPITER_IAU_ROTATION,
  MARS_IAU_ROTATION,
  MERCURY_IAU_ROTATION,
  MOON_IAU_ROTATION,
  NEPTUNE_IAU_ROTATION,
  PLUTO_IAU_ROTATION,
  SATURN_IAU_ROTATION,
  SUN_IAU_ROTATION,
  URANUS_IAU_ROTATION,
  VENUS_IAU_ROTATION,
} from '@/astro'

import { expectCloseRadians, TOL_ANGLE_MAS } from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'

describe('IAU_ROTATION_MODELS (Work 6 P2 extension)', () => {
  it('lists exactly 11 models keyed by lowercase slug', () => {
    expect(Object.keys(IAU_ROTATION_MODELS).sort()).toEqual([
      'earth',
      'jupiter',
      'mars',
      'mercury',
      'moon',
      'neptune',
      'pluto',
      'saturn',
      'sun',
      'uranus',
      'venus',
    ])
  })

  it('each model has matching naifId / frameName', () => {
    expect(SUN_IAU_ROTATION.naifId).toBe(10)
    expect(MERCURY_IAU_ROTATION.naifId).toBe(199)
    expect(VENUS_IAU_ROTATION.naifId).toBe(299)
    expect(EARTH_IAU_ROTATION.naifId).toBe(399)
    expect(MOON_IAU_ROTATION.naifId).toBe(301)
    expect(MARS_IAU_ROTATION.naifId).toBe(499)
    expect(JUPITER_IAU_ROTATION.naifId).toBe(599)
    expect(SATURN_IAU_ROTATION.naifId).toBe(699)
    expect(URANUS_IAU_ROTATION.naifId).toBe(799)
    expect(NEPTUNE_IAU_ROTATION.naifId).toBe(899)
    expect(PLUTO_IAU_ROTATION.naifId).toBe(999)
  })

  it('getIauRotationModel returns the matching entry', () => {
    expect(getIauRotationModel('jupiter')).toBe(JUPITER_IAU_ROTATION)
    expect(getIauRotationModel('tidally-locked')).toBeUndefined()
  })

  it('Earth model 의 polynomial coefficients 가 Work 2 P4 값과 일치', () => {
    expect(EARTH_IAU_ROTATION.poleRa.polynomial.coefficients).toEqual([0.0, -0.641, 0.0])
    expect(EARTH_IAU_ROTATION.poleDec.polynomial.coefficients).toEqual([90.0, -0.557, 0.0])
    expect(EARTH_IAU_ROTATION.primeMeridian.polynomial.coefficients).toEqual([
      190.147, 360.9856235, 0.0,
    ])
  })

  it('Sun PM rate 는 약 14.18°/day (Carrington)', () => {
    expect(SUN_IAU_ROTATION.primeMeridian.polynomial.coefficients[1]).toBe(14.1844)
  })

  it('Venus PM rate 는 음수 (역회전)', () => {
    expect(VENUS_IAU_ROTATION.primeMeridian.polynomial.coefficients[1]).toBeLessThan(0)
  })

  it('Uranus pole declination 음수 (역회전 축)', () => {
    expect(URANUS_IAU_ROTATION.poleDec.polynomial.coefficients[0]).toBeLessThan(0)
  })

  it('Neptune source string mentions deferred N term', () => {
    expect(NEPTUNE_IAU_ROTATION.source).toContain('Work 11')
  })

  it('Mercury / Moon source mention omitted libration / nutation', () => {
    expect(MERCURY_IAU_ROTATION.source).toContain('libration')
    expect(MOON_IAU_ROTATION.source).toContain('nutation')
  })
})

describe('Cross-checks: evaluateRotation produces sensible angles', () => {
  const J2000: JdTdb = 2_451_545.0 as JdTdb

  it('Sun α/δ at J2000 매치 Carrington pole', () => {
    const a = evaluateRotation(SUN_IAU_ROTATION, J2000)
    expect(a.raDeg).toBeCloseTo(286.13, 6)
    expect(a.decDeg).toBeCloseTo(63.87, 6)
  })

  it('Earth W at J2000 매치 polynomial[0] = 190.147', () => {
    const a = evaluateRotation(EARTH_IAU_ROTATION, J2000)
    expect(a.wDeg).toBeCloseTo(190.147, 6)
  })

  it('inertialToBodyFixed for Jupiter at J2000 → 3x3 orthonormal matrix', () => {
    const m = inertialToBodyFixed(JUPITER_IAU_ROTATION, J2000)
    // Each row should have unit length (orthonormality check, sample row 0)
    const r0Sq = m[0] * m[0] + m[1] * m[1] + m[2] * m[2]
    expect(Math.abs(r0Sq - 1)).toBeLessThan(1e-12)
  })
})

interface RotationFixtureSample {
  label: string
  jd_tdb: number
  j2000_days_tdb: number
  ra_deg: number
  dec_deg: number
  w_deg: number
  inertial_to_body_fixed: number[]
  spice_max_abs_diff: number
}

interface RotationFixtureModel {
  key: string
  naif_id: number
  name: string
  frame_name: string
  samples: RotationFixtureSample[]
}

interface RotationFixture {
  models: RotationFixtureModel[]
}

describe('iau-rotation fixture cross-check (TS vs Python vs SPICE polynomial-only)', () => {
  const fixture = loadWorkFixture<RotationFixture>(6, 'iau-rotation.json')

  for (const model of fixture.models) {
    it(`${model.key}: TS evaluateRotation matches Python within 1 mas`, () => {
      const tsModel = getIauRotationModel(model.key)
      expect(tsModel).toBeDefined()
      for (const sample of model.samples) {
        const ts = evaluateRotation(tsModel!, sample.jd_tdb as JdTdb)
        const tsRaRad = (ts.raDeg * Math.PI) / 180
        const pyRaRad = (sample.ra_deg * Math.PI) / 180
        const tsDecRad = (ts.decDeg * Math.PI) / 180
        const pyDecRad = (sample.dec_deg * Math.PI) / 180
        expectCloseRadians(tsRaRad, pyRaRad, TOL_ANGLE_MAS)
        expectCloseRadians(tsDecRad, pyDecRad, TOL_ANGLE_MAS)
        const tsW = ((ts.wDeg + 360) % 360) * (Math.PI / 180)
        const pyW = ((sample.w_deg + 360) % 360) * (Math.PI / 180)
        // Wrap-aware comparison via shortest angular diff
        let diff = Math.abs(tsW - pyW)
        if (diff > Math.PI) diff = 2 * Math.PI - diff
        expect(diff * (180 / Math.PI) * 3_600_000).toBeLessThan(TOL_ANGLE_MAS)
      }
    })

    it(`${model.key}: TS inertialToBodyFixed matches fixture matrix entry-wise`, () => {
      const tsModel = getIauRotationModel(model.key)!
      for (const sample of model.samples) {
        const m = inertialToBodyFixed(tsModel, sample.jd_tdb as JdTdb)
        for (let i = 0; i < 9; i++) {
          expect(Math.abs(m[i]! - sample.inertial_to_body_fixed[i]!)).toBeLessThan(1e-12)
        }
      }
    })

    it(`${model.key}: Python ↔ SPICE polynomial-only diff < 1e-10`, () => {
      for (const sample of model.samples) {
        expect(sample.spice_max_abs_diff).toBeLessThan(1e-10)
      }
    })
  }
})
