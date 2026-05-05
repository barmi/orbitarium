import { describe, expect, it } from 'vitest'

import { AU, type Meters } from '@/astro'
import {
  BODY_MEAN_EQUATORIAL_RADIUS_M,
  lerpDistancePolicy,
  lerpSizePolicy,
  LinearAuPolicy,
  LogarithmicMagnificationPolicy,
  LogarithmicPolicy,
  MinMaxClampPolicy,
  PiecewiseMonotonicPolicy,
  SCALE_TOL_M,
  SCALE_TOL_SIZE_M,
  type SceneUnit,
  type SizeScene,
  smoothstep,
  UniformPolicy,
  ZOOM_INNER,
  ZOOM_OUTER,
  zoomLevel,
} from '@/scale'

const m = (n: number): Meters => n as Meters
const s = (n: number): SceneUnit => n as SceneUnit
const sz = (n: number): SizeScene => n as SizeScene

describe('smoothstep', () => {
  it('returns 0 at edge0, 1 at edge1', () => {
    expect(smoothstep(0, 1, 0)).toBe(0)
    expect(smoothstep(0, 1, 1)).toBe(1)
  })
  it('returns 0.5 at midpoint', () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 14)
  })
  it('clamps outside [edge0, edge1]', () => {
    expect(smoothstep(0, 1, -0.5)).toBe(0)
    expect(smoothstep(0, 1, 1.5)).toBe(1)
  })
  it('handles edge0 == edge1 as a step', () => {
    expect(smoothstep(2, 2, 1)).toBe(0)
    expect(smoothstep(2, 2, 3)).toBe(1)
  })
})

describe('ZOOM_INNER / ZOOM_OUTER constants', () => {
  it('cover Mercury (~0.4 AU = log10 ≈ -0.4) and Pluto (~50 AU = log10 ≈ 1.7)', () => {
    expect(ZOOM_INNER).toBe(-0.4)
    expect(ZOOM_OUTER).toBe(1.7)
  })
})

describe('lerpDistancePolicy', () => {
  const adaptive = lerpDistancePolicy(LinearAuPolicy, LogarithmicPolicy, ZOOM_INNER, ZOOM_OUTER)

  it('matches policyAt0 at zoomEdge0 (Linear at inner zoom)', () => {
    expect(adaptive.forward(m(AU), ZOOM_INNER)).toBeCloseTo(LinearAuPolicy.forward(m(AU)), 14)
    expect(adaptive.forward(m(5 * AU), ZOOM_INNER)).toBeCloseTo(
      LinearAuPolicy.forward(m(5 * AU)),
      14,
    )
  })

  it('matches policyAt1 at zoomEdge1 (Logarithmic at outer zoom)', () => {
    expect(adaptive.forward(m(AU), ZOOM_OUTER)).toBeCloseTo(LogarithmicPolicy.forward(m(AU)), 14)
    expect(adaptive.forward(m(50 * AU), ZOOM_OUTER)).toBeCloseTo(
      LogarithmicPolicy.forward(m(50 * AU)),
      14,
    )
  })

  // P2 documented: log-based policies hit IEEE 754 LSB ~1 mm at 30 AU. Tests
  // here stay inside the inner system to keep the absolute tolerance trivial.
  it('round-trips at zoom edges (delegates to base policy inverse)', () => {
    for (const d of [0.5, 1, 5, 20].map((au) => au * AU)) {
      const f0 = adaptive.forward(m(d), ZOOM_INNER)
      expect(Math.abs(adaptive.inverse(f0, ZOOM_INNER) - d)).toBeLessThan(SCALE_TOL_M)
      const f1 = adaptive.forward(m(d), ZOOM_OUTER)
      expect(Math.abs(adaptive.inverse(f1, ZOOM_OUTER) - d)).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('round-trips at intermediate zoom (binary search inverse) within 1 mm', () => {
    const midZoom = zoomLevel(0.5 * (ZOOM_INNER + ZOOM_OUTER))
    for (const d of [0.5, 1, 5, 20].map((au) => au * AU)) {
      const forward = adaptive.forward(m(d), midZoom)
      const back = adaptive.inverse(forward, midZoom)
      expect(Math.abs(back - d)).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('forward is monotonic in distance at every zoom level', () => {
    for (const z of [ZOOM_INNER, zoomLevel(0), ZOOM_OUTER]) {
      let prev = -Infinity
      for (let auD = 0.1; auD <= 50; auD *= 1.3) {
        const v = adaptive.forward(m(auD * AU), z)
        expect(v).toBeGreaterThan(prev)
        prev = v
      }
    }
  })

  it('also lerps Piecewise <-> Logarithmic and round-trips mid-zoom', () => {
    const adaptive2 = lerpDistancePolicy(
      PiecewiseMonotonicPolicy,
      LogarithmicPolicy,
      ZOOM_INNER,
      ZOOM_OUTER,
    )
    const midZoom = zoomLevel(0.7)
    for (const d of [0.5, 1, 5, 20].map((au) => au * AU)) {
      const back = adaptive2.inverse(adaptive2.forward(m(d), midZoom), midZoom)
      expect(Math.abs(back - d)).toBeLessThan(SCALE_TOL_M)
    }
  })

  it('exposes a name', () => {
    expect(adaptive.name).toContain('lerp')
    const named = lerpDistancePolicy(
      LinearAuPolicy,
      LogarithmicPolicy,
      ZOOM_INNER,
      ZOOM_OUTER,
      'distance-adaptive',
    )
    expect(named.name).toBe('distance-adaptive')
  })
})

describe('lerpSizePolicy', () => {
  const adaptive = lerpSizePolicy(
    UniformPolicy,
    LogarithmicMagnificationPolicy,
    ZOOM_INNER,
    ZOOM_OUTER,
  )

  it('matches base policies at zoom edges', () => {
    const earth = m(BODY_MEAN_EQUATORIAL_RADIUS_M[399]!)
    expect(adaptive.forward(earth, ZOOM_INNER)).toBe(UniformPolicy.forward(earth))
    expect(adaptive.forward(earth, ZOOM_OUTER)).toBe(LogarithmicMagnificationPolicy.forward(earth))
  })

  it('round-trips at intermediate zoom inside 1 mm for body catalog', () => {
    const midZoom = zoomLevel(0)
    for (const id of [10, 199, 399, 599, 999]) {
      const r = m(BODY_MEAN_EQUATORIAL_RADIUS_M[id]!)
      const back = adaptive.inverse(adaptive.forward(r, midZoom), midZoom)
      expect(Math.abs(back - r)).toBeLessThan(SCALE_TOL_SIZE_M)
    }
  })

  it('also lerps Uniform <-> MinMaxClamp and round-trips at edges', () => {
    const adaptive2 = lerpSizePolicy(UniformPolicy, MinMaxClampPolicy, ZOOM_INNER, ZOOM_OUTER)
    const earth = m(BODY_MEAN_EQUATORIAL_RADIUS_M[399]!)
    const f0 = adaptive2.forward(earth, ZOOM_INNER)
    expect(Math.abs(adaptive2.inverse(f0, ZOOM_INNER) - earth)).toBeLessThan(SCALE_TOL_SIZE_M)
    const f1 = adaptive2.forward(earth, ZOOM_OUTER)
    expect(Math.abs(adaptive2.inverse(f1, ZOOM_OUTER) - earth)).toBeLessThan(SCALE_TOL_SIZE_M)
  })
})

describe('zoom invariant tests', () => {
  it('beyond zoomEdge1 forward stays at policyAt1', () => {
    const adaptive = lerpDistancePolicy(LinearAuPolicy, LogarithmicPolicy, ZOOM_INNER, ZOOM_OUTER)
    const beyond = zoomLevel(5)
    expect(adaptive.forward(m(AU), beyond)).toBeCloseTo(LogarithmicPolicy.forward(m(AU)), 14)
  })

  it('below zoomEdge0 forward stays at policyAt0', () => {
    const adaptive = lerpDistancePolicy(LinearAuPolicy, LogarithmicPolicy, ZOOM_INNER, ZOOM_OUTER)
    const below = zoomLevel(-5)
    expect(adaptive.forward(m(AU), below)).toBeCloseTo(LinearAuPolicy.forward(m(AU)), 14)
  })

  it('inverse argument 0 returns 0 (delegated by base policies through bracket)', () => {
    const adaptive = lerpDistancePolicy(LinearAuPolicy, LogarithmicPolicy, ZOOM_INNER, ZOOM_OUTER)
    expect(adaptive.inverse(s(0), ZOOM_INNER)).toBe(0)
    expect(adaptive.inverse(s(0), ZOOM_OUTER)).toBe(0)
  })

  it('size: inverse argument matching min-scene returns valid radius (smoke)', () => {
    const adaptive = lerpSizePolicy(
      UniformPolicy,
      LogarithmicMagnificationPolicy,
      ZOOM_INNER,
      ZOOM_OUTER,
    )
    const earth = m(BODY_MEAN_EQUATORIAL_RADIUS_M[399]!)
    const sceneSize = adaptive.forward(earth, ZOOM_INNER)
    const back = adaptive.inverse(sz(sceneSize), ZOOM_INNER)
    expect(Math.abs(back - earth)).toBeLessThan(SCALE_TOL_SIZE_M)
  })
})
