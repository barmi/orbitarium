/**
 * `@/orbits` types — orbit polyline data model (Work 7).
 *
 * Pure types only. R3F components live in `Trail.tsx` / `Predict.tsx` /
 * `AsteroidBelt.tsx`. Sampling lives in `sampler.ts`.
 */

import type { JdTdb } from '@/astro'
import type { PositionICRF } from '@/ephemeris'

/**
 * Single sample on an orbit polyline. Positions are in m, ICRF, SSB-centered.
 */
export interface OrbitSample {
  readonly jdTdb: JdTdb
  readonly position: PositionICRF
}

/**
 * Compact polyline representation. Memory layout (Work 7 P1 #orbit memory):
 * - ``positionsM``: ``Float64Array`` of length ``count * 3`` (xyz interleaved).
 * - ``jdTdbs``: ``Float64Array`` of length ``count`` (TDB Julian dates).
 *
 * Both arrays are aligned by index. Constructed by ``sampleOrbit`` (P2).
 */
export interface OrbitPolyline {
  readonly count: number
  readonly positionsM: Float64Array
  readonly jdTdbs: Float64Array
}

export interface TrailConfig {
  readonly durationDays: number
  readonly sampleCount: number
}

export interface PredictConfig {
  readonly durationDays: number
  readonly sampleCount: number
}
