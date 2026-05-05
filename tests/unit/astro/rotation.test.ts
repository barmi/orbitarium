import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  bodyFixedToInertial,
  EARTH_IAU_ROTATION,
  evaluateAngleModel,
  evaluateRotation,
  inertialToBodyFixed,
  type JdTdb,
  normalizeDegrees,
} from '@/astro'
import { matMul3, type Matrix3, transposeMatrix3 } from '@/astro/frames'

interface RotationFixture {
  label: string
  utc_iso: string | null
  jd_tdb: number
  j2000_days_tdb: number
  ra_deg: number
  dec_deg: number
  w_deg: number
  inertial_to_body_fixed: number[]
  body_fixed_to_inertial: number[]
  spice_inertial_to_body_fixed: number[]
  spice_max_abs_diff: number
}

interface RotationFixtureFile {
  _tolerance_mas: number
  _matrix_tolerance: number
  model: {
    naif_id: number
    name: string
    frame_name: string
    source: string
    pole_ra: number[]
    pole_dec: number[]
    prime_meridian: number[]
  }
  fixtures: RotationFixture[]
}

const fixtureFile = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/work-02/rotation-earth.json'), 'utf-8'),
) as RotationFixtureFile

const MAS_DEG = 1 / 1000 / 3600
const ANGLE_TOL_DEG = fixtureFile._tolerance_mas * MAS_DEG

function maxAbsDiff(a: readonly number[], b: readonly number[]): number {
  let max = 0
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    max = Math.max(max, Math.abs((a[i] ?? 0) - (b[i] ?? 0)))
  }
  return max
}

function expectOrthogonal(m: Matrix3): void {
  const product = matMul3(m, transposeMatrix3(m))
  for (let i = 0; i < 9; i++) {
    const expected = i === 0 || i === 4 || i === 8 ? 1 : 0
    expect(Math.abs(product[i]! - expected)).toBeLessThan(1e-14)
  }
}

describe('Earth IAU rotation model data', () => {
  it('matches the NAIF pck00011 BODY399 constants', () => {
    expect(EARTH_IAU_ROTATION.naifId).toBe(399)
    expect(EARTH_IAU_ROTATION.frameName).toBe('IAU_EARTH')
    expect([...EARTH_IAU_ROTATION.poleRa.polynomial.coefficients]).toEqual(
      fixtureFile.model.pole_ra,
    )
    expect([...EARTH_IAU_ROTATION.poleDec.polynomial.coefficients]).toEqual(
      fixtureFile.model.pole_dec,
    )
    expect([...EARTH_IAU_ROTATION.primeMeridian.polynomial.coefficients]).toEqual(
      fixtureFile.model.prime_meridian,
    )
  })

  it('evaluates the J2000 epoch angles', () => {
    const angles = evaluateRotation(EARTH_IAU_ROTATION, 2451545.0 as JdTdb)
    expect(angles.raDeg).toBe(0)
    expect(angles.decDeg).toBe(90)
    expect(angles.wDeg).toBe(190.147)
  })

  it('normalizes angles into [0, 360)', () => {
    expect(normalizeDegrees(-0.25)).toBe(359.75)
    expect(normalizeDegrees(720.5)).toBe(0.5)
  })

  it('evaluates sinusoidal and cosinusoidal correction terms', () => {
    const angle = evaluateAngleModel(
      {
        polynomial: { variable: 'd', coefficients: [10] },
        periodicTerms: [
          { amplitudeDeg: 2, trig: 'sin', angle: { variable: 'd', coefficients: [90] } },
          { amplitudeDeg: 3, trig: 'cos', angle: { variable: 'd', coefficients: [0] } },
        ],
      },
      0,
    )
    expect(angle).toBeCloseTo(15, 12)
  })
})

describe('Earth rotation fixtures', () => {
  for (const fixture of fixtureFile.fixtures) {
    it(`${fixture.label}: evaluates pole and prime meridian within ${fixtureFile._tolerance_mas} mas`, () => {
      const angles = evaluateRotation(EARTH_IAU_ROTATION, fixture.jd_tdb as JdTdb)
      expect(Math.abs(angles.raDeg - fixture.ra_deg)).toBeLessThan(ANGLE_TOL_DEG)
      expect(Math.abs(angles.decDeg - fixture.dec_deg)).toBeLessThan(ANGLE_TOL_DEG)
      expect(Math.abs(angles.wDeg - fixture.w_deg)).toBeLessThan(ANGLE_TOL_DEG)
    })

    it(`${fixture.label}: inertial -> body-fixed matrix matches SPICE text-PCK convention`, () => {
      const matrix = inertialToBodyFixed(EARTH_IAU_ROTATION, fixture.jd_tdb as JdTdb)
      expect(maxAbsDiff(matrix, fixture.inertial_to_body_fixed)).toBeLessThan(
        fixtureFile._matrix_tolerance,
      )
      expect(maxAbsDiff(matrix, fixture.spice_inertial_to_body_fixed)).toBeLessThan(
        fixtureFile._matrix_tolerance,
      )
      expect(fixture.spice_max_abs_diff).toBeLessThan(fixtureFile._matrix_tolerance)
    })

    it(`${fixture.label}: body-fixed -> inertial is the transpose`, () => {
      const inertialToFixed = inertialToBodyFixed(EARTH_IAU_ROTATION, fixture.jd_tdb as JdTdb)
      const fixedToInertial = bodyFixedToInertial(EARTH_IAU_ROTATION, fixture.jd_tdb as JdTdb)
      expect(maxAbsDiff(fixedToInertial, transposeMatrix3(inertialToFixed))).toBeLessThan(1e-14)
      expect(maxAbsDiff(fixedToInertial, fixture.body_fixed_to_inertial)).toBeLessThan(
        fixtureFile._matrix_tolerance,
      )
    })
  }

  it('includes the Work 2 current-date Earth W check', () => {
    const fixture = fixtureFile.fixtures.find((entry) => entry.label === 'work_02_current_date')
    expect(fixture?.utc_iso).toBe('2026-05-05T00:00:00.000Z')
    expect(fixture?.w_deg).toBeGreaterThanOrEqual(0)
    expect(fixture?.w_deg).toBeLessThan(360)
  })

  it('produces orthogonal matrices across the fixture span', () => {
    for (const fixture of fixtureFile.fixtures) {
      expectOrthogonal(inertialToBodyFixed(EARTH_IAU_ROTATION, fixture.jd_tdb as JdTdb))
    }
  })
})
