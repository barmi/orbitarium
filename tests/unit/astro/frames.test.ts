import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ECLIPTIC_J2000_TO_EME2000,
  ECLIPTIC_J2000_TO_ICRF,
  eclipticToEme2000,
  eclipticToIcrf,
  EME2000_TO_ECLIPTIC_J2000,
  EME2000_TO_ICRF,
  eme2000ToEcliptic,
  eme2000ToIcrf,
  ICRF_TO_ECLIPTIC_J2000,
  ICRF_TO_EME2000,
  icrfToEcliptic,
  icrfToEme2000,
  IDENTITY_MATRIX3,
  matMul3,
  type Matrix3,
  matVec3,
  transposeMatrix3,
  type Vec3,
} from '@/astro/frames'

interface FrameFixture {
  icrf: [number, number, number]
  eme2000: [number, number, number]
  ecliptic_j2000: [number, number, number]
  round_trip_icrf: [number, number, number]
}

interface FixtureFile {
  _tolerance_mas: number
  matrices: {
    icrf_to_eme2000: number[]
    eme2000_to_ecliptic_j2000: number[]
    icrf_to_ecliptic_j2000: number[]
  }
  fixtures: FrameFixture[]
}

const fixtureFile = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/work-02/frames.json'), 'utf-8'),
) as FixtureFile

const MAS_RAD = (1 / 1000 / 3600) * (Math.PI / 180) // 1 mas in rad ≈ 4.848e-9
const TOL_RAD = fixtureFile._tolerance_mas * MAS_RAD

function vecLength(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
}

function vecDiff(a: Vec3, b: readonly number[]): number {
  return Math.sqrt(
    (a[0] - (b[0] ?? 0)) ** 2 + (a[1] - (b[1] ?? 0)) ** 2 + (a[2] - (b[2] ?? 0)) ** 2,
  )
}

describe('matrix utilities', () => {
  it('IDENTITY_MATRIX3 is the 3×3 identity', () => {
    expect([...IDENTITY_MATRIX3]).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1])
  })

  it('matVec3 applies identity correctly', () => {
    const v: Vec3 = [3, 4, 5]
    expect(matVec3(IDENTITY_MATRIX3, v)).toEqual(v)
  })

  it('transposeMatrix3 swaps off-diagonals', () => {
    const m: Matrix3 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect([...transposeMatrix3(m)]).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9])
  })

  it('matMul3(I, M) = M', () => {
    const m: Matrix3 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect([...matMul3(IDENTITY_MATRIX3, m)]).toEqual([...m])
  })

  it('matMul3(M, I) = M', () => {
    const m: Matrix3 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect([...matMul3(m, IDENTITY_MATRIX3)]).toEqual([...m])
  })
})

describe('embedded frame matrices', () => {
  it('ICRF_TO_EME2000 matches fixture (bit-exact)', () => {
    expect([...ICRF_TO_EME2000]).toEqual(fixtureFile.matrices.icrf_to_eme2000)
  })

  it('EME2000_TO_ECLIPTIC_J2000 matches fixture (bit-exact)', () => {
    expect([...EME2000_TO_ECLIPTIC_J2000]).toEqual(fixtureFile.matrices.eme2000_to_ecliptic_j2000)
  })

  it('ICRF_TO_ECLIPTIC_J2000 matches fixture (bit-exact, computed via matMul3)', () => {
    expect([...ICRF_TO_ECLIPTIC_J2000]).toEqual(fixtureFile.matrices.icrf_to_ecliptic_j2000)
  })

  it('frame bias off-diagonals are within ~17 mas (RSS ≈ 23 mas)', () => {
    // RB[0][1] ≈ -14.6 mas, RB[0][2] ≈ +16.6 mas, RB[1][2] ≈ +6.8 mas
    const offDiag = [
      ICRF_TO_EME2000[1],
      ICRF_TO_EME2000[2],
      ICRF_TO_EME2000[3],
      ICRF_TO_EME2000[5],
      ICRF_TO_EME2000[6],
      ICRF_TO_EME2000[7],
    ]
    for (const x of offDiag) {
      expect(Math.abs(x)).toBeLessThan(1e-7) // < 21 mas
      expect(Math.abs(x)).toBeGreaterThan(1e-9) // > 0.2 mas (real bias)
    }
  })
})

describe('matrix orthogonality (B Bᵀ = I within IEEE 754 limit)', () => {
  function expectOrthogonal(m: Matrix3): void {
    const product = matMul3(m, transposeMatrix3(m))
    for (let i = 0; i < 9; i++) {
      const diag = i === 0 || i === 4 || i === 8
      expect(Math.abs(product[i]! - (diag ? 1 : 0))).toBeLessThan(1e-14)
    }
  }

  it('ICRF_TO_EME2000 is orthogonal', () => {
    expectOrthogonal(ICRF_TO_EME2000)
  })
  it('EME2000_TO_ECLIPTIC_J2000 is orthogonal', () => {
    expectOrthogonal(EME2000_TO_ECLIPTIC_J2000)
  })
  it('ICRF_TO_ECLIPTIC_J2000 is orthogonal', () => {
    expectOrthogonal(ICRF_TO_ECLIPTIC_J2000)
  })
})

describe('inverse pairs (transpose for orthogonal matrices)', () => {
  it('EME2000_TO_ICRF == transpose(ICRF_TO_EME2000)', () => {
    expect([...EME2000_TO_ICRF]).toEqual([...transposeMatrix3(ICRF_TO_EME2000)])
  })
  it('ECLIPTIC_J2000_TO_EME2000 == transpose(EME2000_TO_ECLIPTIC_J2000)', () => {
    expect([...ECLIPTIC_J2000_TO_EME2000]).toEqual([...transposeMatrix3(EME2000_TO_ECLIPTIC_J2000)])
  })
  it('ECLIPTIC_J2000_TO_ICRF == transpose(ICRF_TO_ECLIPTIC_J2000)', () => {
    expect([...ECLIPTIC_J2000_TO_ICRF]).toEqual([...transposeMatrix3(ICRF_TO_ECLIPTIC_J2000)])
  })
})

describe('vector transforms vs golden fixtures', () => {
  for (const f of fixtureFile.fixtures) {
    const label = `[${f.icrf.map((n) => n.toExponential(2)).join(', ')}]`
    describe(label, () => {
      const v: Vec3 = [f.icrf[0], f.icrf[1], f.icrf[2]]
      const len = vecLength(v) || 1 // unit vector if zero (won't happen)
      // Component-wise tolerance scales with vector magnitude.
      const tol = TOL_RAD * len

      it(`ICRF → EME2000 within ${fixtureFile._tolerance_mas} mas`, () => {
        expect(vecDiff(icrfToEme2000(v), f.eme2000)).toBeLessThan(tol)
      })

      it(`ICRF → Ecliptic within ${fixtureFile._tolerance_mas} mas`, () => {
        expect(vecDiff(icrfToEcliptic(v), f.ecliptic_j2000)).toBeLessThan(tol)
      })

      it(`Round-trip ICRF → Ecliptic → ICRF within ${fixtureFile._tolerance_mas} mas`, () => {
        const back = eclipticToIcrf(icrfToEcliptic(v))
        expect(vecDiff(back, [...v])).toBeLessThan(tol)
      })

      it('Round-trip ICRF → EME2000 → ICRF preserves length', () => {
        const back = eme2000ToIcrf(icrfToEme2000(v))
        expect(Math.abs(vecLength(back) - len)).toBeLessThan(1e-12 * len)
      })

      it('EME2000 → Ecliptic → EME2000 round-trips bit-tight', () => {
        const eme = icrfToEme2000(v)
        const back = eclipticToEme2000(eme2000ToEcliptic(eme))
        expect(vecDiff(back, [...eme])).toBeLessThan(tol)
      })
    })
  }
})

describe('axis directions', () => {
  it('ICRF X axis maps to ecliptic with z ≈ 0 (X is in the equinox direction)', () => {
    const ecl = icrfToEcliptic([1, 0, 0])
    // Vernal equinox is the intersection of equator and ecliptic — Z component
    // in ecliptic coords should be near zero (frame bias contributes ~21 mas).
    expect(Math.abs(ecl[2])).toBeLessThan(2e-7) // < 41 mas
  })

  it('ICRF Z axis tilts in ecliptic by ε (~23.44°)', () => {
    const ecl = icrfToEcliptic([0, 0, 1])
    // R_x(ε) sends (0,0,1) → (0, sin ε, cos ε). Frame bias adds ~17 mas.
    expect(Math.abs(ecl[0])).toBeLessThan(2e-7) // small frame bias
    expect(ecl[1]).toBeCloseTo(Math.sin(0.4090926006005829), 6)
    expect(ecl[2]).toBeCloseTo(Math.cos(0.4090926006005829), 6)
  })
})
