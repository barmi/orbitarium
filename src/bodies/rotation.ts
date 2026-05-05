import { Matrix4, Quaternion } from 'three'

import { type IAURotationModel, inertialToBodyFixed, type JdTdb } from '@/astro'
import type { Matrix3 as IauMatrix3 } from '@/astro/frames'

/**
 * Convert Work 2's row-major 3x3 IAU rotation matrix to a Three.js Quaternion.
 *
 * The Work 2 / Work 6 ``inertialToBodyFixed`` matrix maps ICRF (J2000) inertial
 * vectors to body-fixed coordinates. Three.js mesh ``quaternion`` rotates the
 * body's local frame into world space — the inverse direction. So we invert by
 * transposing the rotation (= setting the matrix from row vectors directly,
 * since the IAU output is body-fixed → inertial when transposed). The simplest
 * route is to build a ``Matrix4`` from the row-major 9 elements and then call
 * ``setFromRotationMatrix``: Three.js' ``setFromRotationMatrix`` interprets the
 * matrix as a body→world rotation, which matches the inverse of
 * ``inertialToBodyFixed``. Therefore we transpose first.
 */
export function matrix3ToQuaternion(m: IauMatrix3): Quaternion {
  // Transpose row-major → column-major for body→world orientation.
  const m4 = new Matrix4().set(
    m[0],
    m[3],
    m[6],
    0,
    m[1],
    m[4],
    m[7],
    0,
    m[2],
    m[5],
    m[8],
    0,
    0,
    0,
    0,
    1,
  )
  return new Quaternion().setFromRotationMatrix(m4)
}

export function bodyOrientationQuaternion(model: IAURotationModel, jdTdb: JdTdb): Quaternion {
  return matrix3ToQuaternion(inertialToBodyFixed(model, jdTdb))
}
