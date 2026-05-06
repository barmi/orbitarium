import type { JdTdb } from '@/astro'
import type { De440Evaluator } from '@/ephemeris'

import type { OrbitPolyline } from './types'

/**
 * Sample a body's SSB-centered ICRF position over a uniform jdTdb grid.
 *
 * Endpoints inclusive: ``count >= 2`` produces ``count`` samples evenly spaced
 * from ``jdStart`` (index 0) to ``jdEnd`` (index count-1). ``count == 1``
 * yields a single sample at ``jdStart`` (no division by zero).
 *
 * Async — calls ``evaluator.getStateAt`` ``count`` times in parallel via
 * ``Promise.all``.
 */
export async function sampleOrbit(
  evaluator: De440Evaluator,
  naifId: number,
  jdStart: JdTdb,
  jdEnd: JdTdb,
  count: number,
): Promise<OrbitPolyline> {
  if (count < 1) {
    throw new Error(`sampleOrbit: count must be >= 1, got ${count}`)
  }
  const positionsM = new Float64Array(count * 3)
  const jdTdbs = new Float64Array(count)

  if (count === 1) {
    jdTdbs[0] = jdStart
    const state = await evaluator.getStateAt(naifId, jdStart)
    positionsM[0] = state.position[0]
    positionsM[1] = state.position[1]
    positionsM[2] = state.position[2]
    return { count, positionsM, jdTdbs }
  }

  const step = (jdEnd - jdStart) / (count - 1)
  for (let i = 0; i < count; i++) {
    jdTdbs[i] = jdStart + step * i
  }

  const states = await Promise.all(
    Array.from({ length: count }, (_, i) => evaluator.getStateAt(naifId, jdTdbs[i] as JdTdb)),
  )
  for (let i = 0; i < count; i++) {
    const state = states[i]!
    positionsM[i * 3 + 0] = state.position[0]
    positionsM[i * 3 + 1] = state.position[1]
    positionsM[i * 3 + 2] = state.position[2]
  }

  return { count, positionsM, jdTdbs }
}

/**
 * Paired SSB samples of two bodies at the same time grid. Used for accurate
 * geocentric orbit rendering — to draw Moon's orbit at the same scale that
 * Moon's body appears at, both bodies' SSB positions must go through the
 * (potentially non-linear) distance policy *separately*, then be subtracted
 * in scene space. Naively applying the policy to the difference vector gives
 * the wrong scale: piecewise-monotonic uses a steep slope near 0 AU and a
 * gentler slope near 1 AU, so a 384,000-km vector mapped at 0 AU != Moon's
 * actual scene displacement around Earth at 1 AU.
 */
export interface PairedOrbitSamples {
  readonly count: number
  /** Body SSB samples, count*3 (Float64Array, x/y/z meters). */
  readonly positionsM: Float64Array
  /** Reference body SSB samples, count*3 (paired by index). */
  readonly refPositionsM: Float64Array
  readonly jdTdbs: Float64Array
}

/**
 * Sample ``naifId`` and ``refNaifId``'s SSB positions over the same uniform
 * jdTdb grid. Both arrays are aligned by index. Use ``PairedOrbitSamples``
 * when you need to compute a relative orbit *after* per-body distance-policy
 * conversion — see e.g. `MoonOrbitRing` in solar/.
 */
export async function samplePairedOrbit(
  evaluator: De440Evaluator,
  naifId: number,
  refNaifId: number,
  jdStart: JdTdb,
  jdEnd: JdTdb,
  count: number,
): Promise<PairedOrbitSamples> {
  if (count < 1) {
    throw new Error(`samplePairedOrbit: count must be >= 1, got ${count}`)
  }
  const positionsM = new Float64Array(count * 3)
  const refPositionsM = new Float64Array(count * 3)
  const jdTdbs = new Float64Array(count)

  if (count === 1) {
    jdTdbs[0] = jdStart
    const [s, ref] = await Promise.all([
      evaluator.getStateAt(naifId, jdStart),
      evaluator.getStateAt(refNaifId, jdStart),
    ])
    positionsM[0] = s.position[0]
    positionsM[1] = s.position[1]
    positionsM[2] = s.position[2]
    refPositionsM[0] = ref.position[0]
    refPositionsM[1] = ref.position[1]
    refPositionsM[2] = ref.position[2]
    return { count, positionsM, refPositionsM, jdTdbs }
  }

  const step = (jdEnd - jdStart) / (count - 1)
  for (let i = 0; i < count; i++) {
    jdTdbs[i] = jdStart + step * i
  }

  const pairs = await Promise.all(
    Array.from({ length: count }, (_, i) => {
      const jd = jdTdbs[i] as JdTdb
      return Promise.all([evaluator.getStateAt(naifId, jd), evaluator.getStateAt(refNaifId, jd)])
    }),
  )
  for (let i = 0; i < count; i++) {
    const [s, ref] = pairs[i]!
    positionsM[i * 3 + 0] = s.position[0]
    positionsM[i * 3 + 1] = s.position[1]
    positionsM[i * 3 + 2] = s.position[2]
    refPositionsM[i * 3 + 0] = ref.position[0]
    refPositionsM[i * 3 + 1] = ref.position[1]
    refPositionsM[i * 3 + 2] = ref.position[2]
  }

  return { count, positionsM, refPositionsM, jdTdbs }
}
