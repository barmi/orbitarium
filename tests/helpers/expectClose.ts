import { expect } from 'vitest'

export const TOL_TIME_US = 1
export const TOL_TIME_TDB_US = 100
export const TOL_ANGLE_MAS = 1
export const TOL_DISTANCE_MM = 1

const SECONDS_PER_DAY = 86400
const US_PER_S = 1e6
const MM_PER_METER = 1000
const MAS_PER_DEG = 3_600_000
const DEG_PER_RAD = 180 / Math.PI

export type Vec3Like = readonly [number, number, number]
export type Matrix3Like = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export function masToDeg(mas: number): number {
  return mas / MAS_PER_DEG
}

export function masToRad(mas: number): number {
  return mas / MAS_PER_DEG / DEG_PER_RAD
}

export function usToDays(us: number): number {
  return us / US_PER_S / SECONDS_PER_DAY
}

export function expectCloseSeconds(actualS: number, expectedS: number, tolUs = TOL_TIME_US): void {
  const diffUs = Math.abs(actualS - expectedS) * US_PER_S
  expect(diffUs).toBeLessThan(tolUs)
}

export function expectCloseDays(
  actualDays: number,
  expectedDays: number,
  tolUs = TOL_TIME_US,
): void {
  const tolDays = usToDays(tolUs)
  expect(Math.abs(actualDays - expectedDays)).toBeLessThan(tolDays)
}

export function expectCloseDegrees(
  actualDeg: number,
  expectedDeg: number,
  tolMas = TOL_ANGLE_MAS,
): void {
  expect(Math.abs(actualDeg - expectedDeg)).toBeLessThan(masToDeg(tolMas))
}

export function expectCloseRadians(
  actualRad: number,
  expectedRad: number,
  tolMas = TOL_ANGLE_MAS,
): void {
  expect(Math.abs(actualRad - expectedRad)).toBeLessThan(masToRad(tolMas))
}

export function expectCloseMeters(
  actualM: number,
  expectedM: number,
  tolMm = TOL_DISTANCE_MM,
): void {
  const diffMm = Math.abs(actualM - expectedM) * MM_PER_METER
  expect(diffMm).toBeLessThan(tolMm)
}

export function expectCloseVec3(
  actual: Vec3Like | readonly number[],
  expected: Vec3Like | readonly number[],
  tol: number,
): void {
  let sumSq = 0
  for (let i = 0; i < 3; i++) {
    const d = (actual[i] ?? Number.NaN) - (expected[i] ?? Number.NaN)
    sumSq += d * d
  }
  expect(Math.sqrt(sumSq)).toBeLessThan(tol)
}

export function expectCloseMatrix3(
  actual: Matrix3Like | readonly number[],
  expected: Matrix3Like | readonly number[],
  tolElement: number,
): void {
  let maxAbs = 0
  for (let i = 0; i < 9; i++) {
    const d = Math.abs((actual[i] ?? Number.NaN) - (expected[i] ?? Number.NaN))
    if (d > maxAbs) maxAbs = d
  }
  expect(maxAbs).toBeLessThan(tolElement)
}
