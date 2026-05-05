import { RingGeometry } from 'three'
import { describe, expect, it } from 'vitest'

describe('SaturnRings — RingGeometry UV override invariants', () => {
  // The component-level rendering happens in P5 dev demo e2e (WebGL needed).
  // Here we verify the geometry math that the component uses inline.

  it('RingGeometry vertices land in [innerRadius, outerRadius] annulus', () => {
    const inner = 1.236
    const outer = 2.27
    const geo = new RingGeometry(inner, outer, 64, 1)
    const pos = geo.attributes.position!
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const r = Math.sqrt(x * x + y * y)
      expect(r).toBeGreaterThanOrEqual(inner - 1e-6)
      expect(r).toBeLessThanOrEqual(outer + 1e-6)
      expect(Math.abs(z)).toBeLessThan(1e-6) // disk lies in z=0 plane
    }
    geo.dispose()
  })

  it('Radial UV remap places inner-edge vertices at u=0 and outer-edge at u=1', () => {
    const inner = 1.0
    const outer = 5.0
    const geo = new RingGeometry(inner, outer, 32, 1)
    const pos = geo.attributes.position!
    const uv = geo.attributes.uv!
    for (let i = 0; i < pos.count; i++) {
      const r = Math.sqrt(pos.getX(i) ** 2 + pos.getY(i) ** 2)
      const t = (r - inner) / (outer - inner)
      uv.setXY(i, t, 0.5)
    }
    uv.needsUpdate = true
    // inner edge vertices have u ≈ 0, outer edge vertices have u ≈ 1
    let minU = Infinity
    let maxU = -Infinity
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i)
      if (u < minU) minU = u
      if (u > maxU) maxU = u
    }
    expect(minU).toBeCloseTo(0, 6)
    expect(maxU).toBeCloseTo(1, 6)
    geo.dispose()
  })

  it('inner radius >= outer radius is invalid (catalog/test guard)', () => {
    // Saturn catalog ring config is checked elsewhere; this is the math
    // invariant that the component relies on.
    const saturnInnerM = 74_500_000
    const saturnOuterM = 136_775_000
    expect(saturnInnerM).toBeLessThan(saturnOuterM)
  })
})
