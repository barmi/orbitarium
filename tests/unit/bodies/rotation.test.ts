import { Matrix4, Quaternion } from 'three'
import { describe, expect, it } from 'vitest'

import { EARTH_IAU_ROTATION, inertialToBodyFixed, type JdTdb, JUPITER_IAU_ROTATION } from '@/astro'
import type { Matrix3 as IauMatrix3 } from '@/astro/frames'
import { bodyOrientationQuaternion, matrix3ToQuaternion } from '@/bodies'

const J2000: JdTdb = 2_451_545.0 as JdTdb

describe('matrix3ToQuaternion', () => {
  it('identity matrix → identity quaternion', () => {
    const id: IauMatrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    const q = matrix3ToQuaternion(id)
    expect(q.x).toBeCloseTo(0, 12)
    expect(q.y).toBeCloseTo(0, 12)
    expect(q.z).toBeCloseTo(0, 12)
    expect(Math.abs(q.w)).toBeCloseTo(1, 12)
  })

  it('quaternion has unit norm', () => {
    const m = inertialToBodyFixed(EARTH_IAU_ROTATION, J2000)
    const q = matrix3ToQuaternion(m)
    const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
    expect(Math.abs(n - 1)).toBeLessThan(1e-12)
  })

  it('quaternion → matrix4 reconstructs the transposed input matrix (body→world)', () => {
    // matrix3ToQuaternion(m) interprets m as row-major and produces a
    // body→world quaternion (= transpose of inertial→body). When we re-
    // materialize via Matrix4.makeRotationFromQuaternion, elements (column-
    // major) column 0 should equal row 0 of m (input row-major).
    const m = inertialToBodyFixed(JUPITER_IAU_ROTATION, J2000)
    const q = matrix3ToQuaternion(m)
    const m4 = new Matrix4().makeRotationFromQuaternion(q)
    const elements = m4.elements
    expect(elements[0]).toBeCloseTo(m[0], 12)
    expect(elements[1]).toBeCloseTo(m[1], 12)
    expect(elements[2]).toBeCloseTo(m[2], 12)
    expect(elements[4]).toBeCloseTo(m[3], 12)
    expect(elements[5]).toBeCloseTo(m[4], 12)
    expect(elements[6]).toBeCloseTo(m[5], 12)
  })
})

describe('bodyOrientationQuaternion', () => {
  it('returns a Quaternion with unit norm for Earth', () => {
    const q = bodyOrientationQuaternion(EARTH_IAU_ROTATION, J2000)
    expect(q).toBeInstanceOf(Quaternion)
    const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
    expect(Math.abs(n - 1)).toBeLessThan(1e-12)
  })
})
