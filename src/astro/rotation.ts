/**
 * IAU body rotation model foundation.
 *
 * Conventions (Work 2 P4 decisions):
 *   - Time variable: TDB days from J2000.0 (`d`) and Julian centuries (`T = d / 36525`).
 *   - Angles are degrees in the data model, matching IAU WGCCRE / NAIF PCK
 *     publications. Matrix helpers convert to radians internally.
 *   - The inertial frame is ICRF, labeled "J2000" by SPICE PCK APIs.
 *   - Body-fixed orientation follows the SPICE text-PCK Euler sequence:
 *     `Rz(-W) * Rx(dec - 90deg) * Rz(-(90deg + ra))` for inertial -> body-fixed.
 *
 * P4 includes Earth only; Work 6 extends `IAURotationModel` data to more bodies.
 */

import type { Matrix3 } from './frames'
import { matMul3, transposeMatrix3 } from './frames'
import { J2000_JD_TDB, type JdTdb } from './time'
import type { Degrees, Radians } from './units'

/** Julian days per Julian century. */
export const JULIAN_CENTURY_DAYS = 36525

export type IAURotationTimeVariable = 'd' | 'T'
export type IAUTrigFunction = 'sin' | 'cos'

/** Polynomial in degrees: `c0 + c1*x + c2*x^2 + ...`, where `x` is `d` or `T`. */
export interface IAUPolynomialDegrees {
  readonly variable: IAURotationTimeVariable
  readonly coefficients: readonly number[]
}

/** Periodic correction term in degrees: `amplitudeDeg * trig(angle)`. */
export interface IAUPeriodicTerm {
  readonly amplitudeDeg: number
  readonly trig: IAUTrigFunction
  readonly angle: IAUPolynomialDegrees
}

/** One IAU angle model: polynomial plus optional sinusoidal/cosinusoidal terms. */
export interface IAUAngleModel {
  readonly polynomial: IAUPolynomialDegrees
  readonly periodicTerms?: readonly IAUPeriodicTerm[]
}

/** IAU pole / prime-meridian model for a body. */
export interface IAURotationModel {
  readonly naifId: number
  readonly name: string
  readonly frameName: string
  readonly source: string
  readonly poleRa: IAUAngleModel
  readonly poleDec: IAUAngleModel
  readonly primeMeridian: IAUAngleModel
}

export interface IAURotationAngles {
  /** Right ascension of the north pole, normalized to [0, 360). */
  readonly raDeg: Degrees
  /** Declination of the north pole. */
  readonly decDeg: Degrees
  /** Prime meridian angle, normalized to [0, 360). */
  readonly wDeg: Degrees
}

const DEG_TO_RAD = Math.PI / 180

export function normalizeDegrees(deg: number): Degrees {
  if (deg >= 0 && deg < 360) {
    return (Object.is(deg, -0) ? 0 : deg) as Degrees
  }
  const wrapped = ((deg % 360) + 360) % 360
  return (Object.is(wrapped, -0) ? 0 : wrapped) as Degrees
}

export function evaluatePolynomialDegrees(
  polynomial: IAUPolynomialDegrees,
  j2000DaysTdb: number,
): number {
  const x = polynomial.variable === 'd' ? j2000DaysTdb : j2000DaysTdb / JULIAN_CENTURY_DAYS
  let value = 0
  for (let i = polynomial.coefficients.length - 1; i >= 0; i--) {
    value = value * x + (polynomial.coefficients[i] ?? 0)
  }
  return value
}

export function evaluateAngleModel(model: IAUAngleModel, j2000DaysTdb: number): Degrees {
  let value = evaluatePolynomialDegrees(model.polynomial, j2000DaysTdb)
  for (const term of model.periodicTerms ?? []) {
    const angleRad = evaluatePolynomialDegrees(term.angle, j2000DaysTdb) * DEG_TO_RAD
    value += term.amplitudeDeg * (term.trig === 'sin' ? Math.sin(angleRad) : Math.cos(angleRad))
  }
  return value as Degrees
}

/** Evaluate IAU pole RA, pole Dec, and prime meridian `W` for a TDB Julian Date. */
export function evaluateRotation(model: IAURotationModel, jdTdb: JdTdb): IAURotationAngles {
  const j2000DaysTdb = jdTdb - J2000_JD_TDB
  return {
    raDeg: normalizeDegrees(evaluateAngleModel(model.poleRa, j2000DaysTdb)),
    decDeg: evaluateAngleModel(model.poleDec, j2000DaysTdb),
    wDeg: normalizeDegrees(evaluateAngleModel(model.primeMeridian, j2000DaysTdb)),
  }
}

function degreesToRadians(deg: Degrees): Radians {
  return (deg * DEG_TO_RAD) as Radians
}

function rotationX(angleRad: Radians): Matrix3 {
  const c = Math.cos(angleRad)
  const s = Math.sin(angleRad)
  return [1, 0, 0, 0, c, -s, 0, s, c]
}

function rotationZ(angleRad: Radians): Matrix3 {
  const c = Math.cos(angleRad)
  const s = Math.sin(angleRad)
  return [c, -s, 0, s, c, 0, 0, 0, 1]
}

/**
 * ICRF/J2000 inertial -> body-fixed matrix for the model at `jdTdb`.
 *
 * This matches SPICE `pxform("J2000", model.frameName, et)` for a text PCK
 * containing the same IAU model coefficients.
 */
export function inertialToBodyFixed(model: IAURotationModel, jdTdb: JdTdb): Matrix3 {
  const angles = evaluateRotation(model, jdTdb)
  const ra = degreesToRadians(angles.raDeg)
  const dec = degreesToRadians(angles.decDeg)
  const w = degreesToRadians(angles.wDeg)

  return matMul3(
    rotationZ((-1 * w) as Radians),
    matMul3(
      rotationX((dec - Math.PI / 2) as Radians),
      rotationZ((-1 * (Math.PI / 2 + ra)) as Radians),
    ),
  )
}

/** Body-fixed -> ICRF/J2000 inertial matrix, inverse of `inertialToBodyFixed`. */
export function bodyFixedToInertial(model: IAURotationModel, jdTdb: JdTdb): Matrix3 {
  return transposeMatrix3(inertialToBodyFixed(model, jdTdb))
}
