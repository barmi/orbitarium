import { describe, expect, it } from 'vitest'

import { meters } from '@/astro'
import { positionICRF } from '@/ephemeris'
import {
  anchorKind,
  applyAnchor,
  bodyCentricAnchor,
  heliocentricAnchor,
  positionToWorld,
  type SceneAnchorContext,
  ssbAnchor,
} from '@/render'
import { getDistancePolicy } from '@/scale'

import { expectCloseMeters, TOL_DISTANCE_MM } from '../../helpers/expectClose'
import { loadWorkFixture } from '../../helpers/fixtures'

const AU_M = 149_597_870_700

describe('anchorKind', () => {
  it('returns the discriminator for each anchor kind', () => {
    expect(anchorKind(ssbAnchor())).toBe('ssb')
    expect(anchorKind(heliocentricAnchor(positionICRF(meters(0), meters(0), meters(0))))).toBe(
      'heliocentric',
    )
    expect(anchorKind(bodyCentricAnchor(positionICRF(meters(0), meters(0), meters(0))))).toBe(
      'body-centric',
    )
  })
})

describe('SSB anchor (identity)', () => {
  it('returns the input position bit-exact', () => {
    const p = positionICRF(meters(AU_M), meters(0), meters(0))
    const out = applyAnchor(p, ssbAnchor())
    expect(out[0]).toBe(p[0])
    expect(out[1]).toBe(p[1])
    expect(out[2]).toBe(p[2])
  })
})

describe('Heliocentric anchor', () => {
  it('subtracts the sun position from the input', () => {
    const sun = positionICRF(meters(1_000_000), meters(-500_000), meters(0))
    const earth = positionICRF(meters(AU_M + 1_000_000), meters(-500_000), meters(0))
    const out = applyAnchor(earth, heliocentricAnchor(sun))
    expectCloseMeters(out[0], AU_M, TOL_DISTANCE_MM)
    expectCloseMeters(out[1], 0, TOL_DISTANCE_MM)
    expectCloseMeters(out[2], 0, TOL_DISTANCE_MM)
  })

  it('Sun lands at origin under its own heliocentric anchor', () => {
    const sun = positionICRF(meters(1_500_000_000), meters(-700_000_000), meters(100_000))
    const out = applyAnchor(sun, heliocentricAnchor(sun))
    expect(out[0]).toBe(0)
    expect(out[1]).toBe(0)
    expect(out[2]).toBe(0)
  })
})

describe('Body-centric anchor', () => {
  it('subtracts the body position from the input', () => {
    const earth = positionICRF(meters(AU_M), meters(0), meters(0))
    const moon = positionICRF(meters(AU_M + 384_400_000), meters(0), meters(0))
    const out = applyAnchor(moon, bodyCentricAnchor(earth))
    expectCloseMeters(out[0], 384_400_000, TOL_DISTANCE_MM)
    expectCloseMeters(out[1], 0, TOL_DISTANCE_MM)
    expectCloseMeters(out[2], 0, TOL_DISTANCE_MM)
  })

  it('round-trips a target through body-centric and inverse offset within 1 mm', () => {
    const ref = positionICRF(meters(123_456_789), meters(987_654_321), meters(-555_555_555))
    const target = positionICRF(meters(7_777), meters(-3_333), meters(11_111))
    const shifted = applyAnchor(target, bodyCentricAnchor(ref))
    const restored = positionICRF(
      meters(shifted[0] + ref[0]),
      meters(shifted[1] + ref[1]),
      meters(shifted[2] + ref[2]),
    )
    expectCloseMeters(restored[0], target[0], TOL_DISTANCE_MM)
    expectCloseMeters(restored[1], target[1], TOL_DISTANCE_MM)
    expectCloseMeters(restored[2], target[2], TOL_DISTANCE_MM)
  })
})

describe('positionToWorld (anchor + policy + Vector3)', () => {
  it('SSB anchor + linear-au returns scene Vector3 ~ pos / AU', () => {
    const earth = positionICRF(meters(AU_M), meters(0), meters(0))
    const v = positionToWorld(earth, getDistancePolicy('linear-au'), ssbAnchor())
    expect(v.x).toBeCloseTo(1.0, 12)
    expect(v.y).toBe(0)
    expect(v.z).toBe(0)
  })

  it('Heliocentric anchor centers Sun at world origin', () => {
    const sun = positionICRF(meters(1_500_000_000), meters(-700_000_000), meters(100_000))
    const v = positionToWorld(sun, getDistancePolicy('linear-au'), heliocentricAnchor(sun))
    expect(v.x).toBe(0)
    expect(v.y).toBe(0)
    expect(v.z).toBe(0)
  })

  it('Body-centric Earth + Moon returns Moon offset divided by AU under linear-au', () => {
    const earth = positionICRF(meters(AU_M), meters(0), meters(0))
    const moon = positionICRF(meters(AU_M + 384_400_000), meters(0), meters(0))
    const v = positionToWorld(moon, getDistancePolicy('linear-au'), bodyCentricAnchor(earth))
    expect(v.x).toBeCloseTo(384_400_000 / AU_M, 12)
    expect(v.y).toBe(0)
    expect(v.z).toBe(0)
  })
})

interface AnchorFixtureSample {
  sample: string
  position_icrf_m: [number, number, number]
  applied_m: [number, number, number]
}

interface AnchorFixtureEntry {
  name: string
  kind: 'ssb' | 'heliocentric' | 'body-centric'
  reference_ssb_m?: [number, number, number]
  samples: AnchorFixtureSample[]
}

interface AnchorFixture {
  anchors: AnchorFixtureEntry[]
}

describe('scene-anchors fixture cross-check (TS vs Python)', () => {
  const fixture = loadWorkFixture<AnchorFixture>(5, 'scene-anchors.json')

  for (const entry of fixture.anchors) {
    it(`${entry.name}: matches TS applyAnchor within 1 mm`, () => {
      let anchor: SceneAnchorContext
      if (entry.kind === 'ssb') {
        anchor = ssbAnchor()
      } else if (entry.kind === 'heliocentric') {
        const ref = entry.reference_ssb_m!
        anchor = heliocentricAnchor(positionICRF(meters(ref[0]), meters(ref[1]), meters(ref[2])))
      } else {
        const ref = entry.reference_ssb_m!
        anchor = bodyCentricAnchor(positionICRF(meters(ref[0]), meters(ref[1]), meters(ref[2])))
      }
      for (const sample of entry.samples) {
        const input = positionICRF(
          meters(sample.position_icrf_m[0]),
          meters(sample.position_icrf_m[1]),
          meters(sample.position_icrf_m[2]),
        )
        const out = applyAnchor(input, anchor)
        expectCloseMeters(out[0], sample.applied_m[0], TOL_DISTANCE_MM)
        expectCloseMeters(out[1], sample.applied_m[1], TOL_DISTANCE_MM)
        expectCloseMeters(out[2], sample.applied_m[2], TOL_DISTANCE_MM)
      }
    })
  }
})
