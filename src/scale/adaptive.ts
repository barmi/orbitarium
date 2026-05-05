import type { Meters } from '@/astro'

import type { DistancePolicy, SceneUnit, SizePolicy, SizeScene } from './types'
import { sceneUnit, sizeScene } from './types'

export type ZoomLevel = number & { readonly __unit: 'log10AU' }

export const zoomLevel = (n: number): ZoomLevel => n as ZoomLevel

export const ZOOM_INNER = -0.4 as ZoomLevel
export const ZOOM_OUTER = 1.7 as ZoomLevel

export interface AdaptiveDistancePolicy {
  readonly name: string
  forward(distanceM: Meters, zoom: ZoomLevel): SceneUnit
  inverse(distanceScene: SceneUnit, zoom: ZoomLevel): Meters
}

export interface AdaptiveSizePolicy {
  readonly name: string
  forward(radiusM: Meters, zoom: ZoomLevel): SizeScene
  inverse(radiusScene: SizeScene, zoom: ZoomLevel): Meters
}

const meters = (n: number): Meters => n as Meters

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Bracket width tolerance is in input units (meters). 1 µm is well under the
// SCALE_TOL_M = 1 mm round-trip budget, so bisection converges before the
// scene-unit residual matters. Value tolerance is set tight enough to avoid
// premature exit at coarse brackets (1 LSB of a typical scene output ≈ 1e-15
// relative; using 1e-15 absolute prevents converting LSB-floor noise back into
// large input errors via the inverse slope).
const INVERSE_BISECT_VALUE_TOL = 1e-15
const INVERSE_BISECT_BRACKET_TOL = 1e-6
const INVERSE_BISECT_MAX_ITER = 200

function bisectInverse(
  forward: (r: number) => number,
  target: number,
  rLow: number,
  rHigh: number,
): number {
  let lo = Math.min(rLow, rHigh)
  let hi = Math.max(rLow, rHigh)
  for (let i = 0; i < INVERSE_BISECT_MAX_ITER; i++) {
    const mid = 0.5 * (lo + hi)
    const v = forward(mid)
    if (Math.abs(v - target) <= INVERSE_BISECT_VALUE_TOL || hi - lo <= INVERSE_BISECT_BRACKET_TOL) {
      return mid
    }
    if (v < target) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

export function lerpDistancePolicy(
  policyAt0: DistancePolicy,
  policyAt1: DistancePolicy,
  zoomEdge0: ZoomLevel,
  zoomEdge1: ZoomLevel,
  name?: string,
): AdaptiveDistancePolicy {
  return {
    name: name ?? `lerp(${policyAt0.name}<->${policyAt1.name})`,
    forward(distanceM: Meters, zoom: ZoomLevel): SceneUnit {
      const t = smoothstep(zoomEdge0, zoomEdge1, zoom)
      const a = policyAt0.forward(distanceM)
      const b = policyAt1.forward(distanceM)
      return sceneUnit(a + (b - a) * t)
    },
    inverse(distanceScene: SceneUnit, zoom: ZoomLevel): Meters {
      const t = smoothstep(zoomEdge0, zoomEdge1, zoom)
      if (t === 0) return policyAt0.inverse(distanceScene)
      if (t === 1) return policyAt1.inverse(distanceScene)
      const r0 = policyAt0.inverse(distanceScene)
      const r1 = policyAt1.inverse(distanceScene)
      const forward = (r: number): number => {
        const a = policyAt0.forward(meters(r))
        const b = policyAt1.forward(meters(r))
        return a + (b - a) * t
      }
      return meters(bisectInverse(forward, distanceScene, r0, r1))
    },
  }
}

export function lerpSizePolicy(
  policyAt0: SizePolicy,
  policyAt1: SizePolicy,
  zoomEdge0: ZoomLevel,
  zoomEdge1: ZoomLevel,
  name?: string,
): AdaptiveSizePolicy {
  return {
    name: name ?? `lerp(${policyAt0.name}<->${policyAt1.name})`,
    forward(radiusM: Meters, zoom: ZoomLevel): SizeScene {
      const t = smoothstep(zoomEdge0, zoomEdge1, zoom)
      const a = policyAt0.forward(radiusM)
      const b = policyAt1.forward(radiusM)
      return sizeScene(a + (b - a) * t)
    },
    inverse(radiusScene: SizeScene, zoom: ZoomLevel): Meters {
      const t = smoothstep(zoomEdge0, zoomEdge1, zoom)
      if (t === 0) return policyAt0.inverse(radiusScene)
      if (t === 1) return policyAt1.inverse(radiusScene)
      const r0 = policyAt0.inverse(radiusScene)
      const r1 = policyAt1.inverse(radiusScene)
      const forward = (r: number): number => {
        const a = policyAt0.forward(meters(r))
        const b = policyAt1.forward(meters(r))
        return a + (b - a) * t
      }
      return meters(bisectInverse(forward, radiusScene, r0, r1))
    },
  }
}
