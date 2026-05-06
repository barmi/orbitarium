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
