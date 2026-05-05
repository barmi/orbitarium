import { describe, expect, it } from 'vitest'

import {
  expectCloseDays,
  expectCloseDegrees,
  expectCloseMatrix3,
  expectCloseMeters,
  expectCloseRadians,
  expectCloseSeconds,
  expectCloseVec3,
  masToDeg,
  masToRad,
  TOL_ANGLE_MAS,
  TOL_DISTANCE_MM,
  TOL_TIME_US,
  usToDays,
} from '../../helpers/expectClose'

describe('tolerance constants', () => {
  it('defaults to 1µs / 1mas / 1mm', () => {
    expect(TOL_TIME_US).toBe(1)
    expect(TOL_ANGLE_MAS).toBe(1)
    expect(TOL_DISTANCE_MM).toBe(1)
  })

  it('mas → deg / rad conversions', () => {
    expect(masToDeg(3_600_000)).toBe(1) // 1 deg = 3.6e6 mas
    expect(masToRad(3_600_000)).toBeCloseTo(Math.PI / 180, 15)
  })

  it('us → days conversion', () => {
    expect(usToDays(86400 * 1e6)).toBe(1)
  })
})

describe('expectCloseSeconds', () => {
  it('passes when within tolerance', () => {
    expectCloseSeconds(1.0000005, 1.0, 1) // 0.5 µs < 1 µs
  })
  it('passes when actual = expected', () => {
    expectCloseSeconds(42, 42)
  })
  it('throws when above tolerance', () => {
    expect(() => expectCloseSeconds(1.000002, 1.0, 1)).toThrow()
  })
})

describe('expectCloseDays', () => {
  // JD ~2.45e6 in IEEE 754 has ~9 fractional digits, so we test with small day
  // values where 1µs (~1.16e-11 days) is resolvable.
  it('passes for sub-µs day difference', () => {
    expectCloseDays(0.5, 0.5 + 0.5e-6 / 86400, 1)
  })
  it('throws when day difference exceeds tolerance', () => {
    expect(() => expectCloseDays(0.5, 0.5 + 2e-6 / 86400, 1)).toThrow()
  })
})

describe('expectCloseDegrees / expectCloseRadians', () => {
  it('passes within 1 mas', () => {
    expectCloseDegrees(45.0, 45.0 + 0.5 / 3_600_000) // 0.5 mas
    expectCloseRadians(1.0, 1.0 + (0.5 / 3_600_000) * (Math.PI / 180))
  })
  it('throws above 1 mas', () => {
    expect(() => expectCloseDegrees(45.0, 45.0 + 2 / 3_600_000)).toThrow()
    expect(() => expectCloseRadians(1.0, 1.0 + (2 / 3_600_000) * (Math.PI / 180))).toThrow()
  })
})

describe('expectCloseMeters', () => {
  it('passes within 1 mm', () => {
    expectCloseMeters(1000, 1000.0005) // 0.5 mm
  })
  it('throws above 1 mm', () => {
    expect(() => expectCloseMeters(1000, 1000.002)).toThrow()
  })
})

describe('expectCloseVec3', () => {
  it('passes for L2 distance below tolerance', () => {
    expectCloseVec3([1, 2, 3], [1, 2, 3.000001], 1e-5)
  })
  it('throws when L2 distance exceeds tolerance', () => {
    expect(() => expectCloseVec3([1, 2, 3], [1, 2, 4], 0.5)).toThrow()
  })
  it('handles plain number arrays from JSON fixtures', () => {
    expectCloseVec3([1, 0, 0] as const, [1, 0, 0], 1e-12)
  })
})

describe('expectCloseMatrix3', () => {
  it('passes for element-wise diff below tolerance', () => {
    const m: readonly number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    expectCloseMatrix3(m, [1, 0, 0, 0, 1, 0, 0, 0, 1.0000001], 1e-6)
  })
  it('throws when any element exceeds tolerance', () => {
    const m: readonly number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    expect(() => expectCloseMatrix3(m, [1, 0, 0, 0, 1, 0, 0, 0, 0.9], 1e-6)).toThrow()
  })
})
