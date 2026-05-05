/**
 * Reference frame conversions: ICRF ↔ EME2000 ↔ Ecliptic of J2000.0.
 *
 * Conventions (Work 2 P3 decisions):
 *   - Precession/nutation: NOT applied — frames fixed at J2000.0 epoch.
 *     For J2000 ± 100 yr timelines this introduces up to ~50" accumulated error;
 *     Work 7/8 may revisit when extending the timeline.
 *   - ICRF ↔ EME2000 frame bias: APPLIED (~23 mas RSS) using the constant
 *     RB matrix from ERFA `bp00` (IAU 2006/2000A, Capitaine et al. 2003).
 *   - Ecliptic obliquity ε at J2000.0: `EPS_J2000 = 0.4090926006005829` rad
 *     (IAU 2006 P03 / ERFA `obl06`). Defined in `constants.ts`.
 *   - 3×3 matrices in row-major order: `[m00, m01, m02, m10, m11, m12, m20, m21, m22]`.
 *   - 3-vectors as `[x, y, z]`. SI / dimensionless in the truth layer.
 *
 * Tolerances (verified against ERFA / astropy + golden fixtures):
 *   - Matrix orthogonality (B Bᵀ = I): ~1e-15 (IEEE 754 limit).
 *   - Round-trip vector fidelity: <1e-15 component error.
 *   - astropy ICRS → BarycentricMeanEcliptic agreement: <1 mas (5e-9 rad).
 */

import { EPS_J2000 } from './constants'

/** 3D vector. */
export type Vec3 = readonly [number, number, number]

/** 3×3 matrix, row-major: `[m00, m01, m02, m10, m11, m12, m20, m21, m22]`. */
export type Matrix3 = readonly [
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

/** Multiply a row-major 3×3 matrix by a column 3-vector: `M · v`. */
export function matVec3(m: Matrix3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

/** Multiply two row-major 3×3 matrices: `A · B`. */
export function matMul3(a: Matrix3, b: Matrix3): Matrix3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ]
}

/** Transpose a 3×3 matrix. */
export function transposeMatrix3(m: Matrix3): Matrix3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]
}

/** 3×3 identity. */
export const IDENTITY_MATRIX3: Matrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/**
 * ICRF → EME2000 (J2000.0 mean equator and equinox) frame bias matrix.
 *
 * From ERFA `bp00(2451545.0, 0.0)` (IAU 2006/2000A). Frame bias is a fixed
 * constant — independent of date — so this matrix is computed once and embedded.
 *
 * Off-diagonal magnitudes correspond to:
 *   dα₀ ≈ -14.6 mas, ξ₀ ≈ 16.6 mas, η₀ ≈ 6.8 mas (RSS ≈ 23 mas).
 */
export const ICRF_TO_EME2000: Matrix3 = [
  0.9999999999999942, -7.078279744199198e-8, 8.056217146976134e-8, 7.078279477857338e-8,
  0.9999999999999969, 3.3060414542221364e-8, -8.056217380986972e-8, -3.3060408839805523e-8,
  0.9999999999999962,
]

/** EME2000 → ICRF (= transpose of bias; bias is orthogonal). */
export const EME2000_TO_ICRF: Matrix3 = transposeMatrix3(ICRF_TO_EME2000)

const COS_EPS_J2000 = Math.cos(EPS_J2000)
const SIN_EPS_J2000 = Math.sin(EPS_J2000)

/**
 * EME2000 → Ecliptic of J2000.0 — rotation about the X axis by ε_J2000.
 *
 * Convention: ecliptic Z = ecliptic north pole, equator X = ecliptic X
 * (vernal equinox). `R_x(ε) = [[1,0,0], [0, cos ε, sin ε], [0, -sin ε, cos ε]]`.
 */
export const EME2000_TO_ECLIPTIC_J2000: Matrix3 = [
  1,
  0,
  0,
  0,
  COS_EPS_J2000,
  SIN_EPS_J2000,
  0,
  -SIN_EPS_J2000,
  COS_EPS_J2000,
]

/** Ecliptic of J2000.0 → EME2000 (= transpose of obliquity rotation). */
export const ECLIPTIC_J2000_TO_EME2000: Matrix3 = transposeMatrix3(EME2000_TO_ECLIPTIC_J2000)

/** ICRF → Ecliptic of J2000.0 (composed: `R_x(ε) · RB`). */
export const ICRF_TO_ECLIPTIC_J2000: Matrix3 = matMul3(EME2000_TO_ECLIPTIC_J2000, ICRF_TO_EME2000)

/** Ecliptic of J2000.0 → ICRF. */
export const ECLIPTIC_J2000_TO_ICRF: Matrix3 = transposeMatrix3(ICRF_TO_ECLIPTIC_J2000)

// Vector convenience wrappers --------------------------------------------------

export function icrfToEme2000(v: Vec3): Vec3 {
  return matVec3(ICRF_TO_EME2000, v)
}
export function eme2000ToIcrf(v: Vec3): Vec3 {
  return matVec3(EME2000_TO_ICRF, v)
}
export function eme2000ToEcliptic(v: Vec3): Vec3 {
  return matVec3(EME2000_TO_ECLIPTIC_J2000, v)
}
export function eclipticToEme2000(v: Vec3): Vec3 {
  return matVec3(ECLIPTIC_J2000_TO_EME2000, v)
}
export function icrfToEcliptic(v: Vec3): Vec3 {
  return matVec3(ICRF_TO_ECLIPTIC_J2000, v)
}
export function eclipticToIcrf(v: Vec3): Vec3 {
  return matVec3(ECLIPTIC_J2000_TO_ICRF, v)
}
