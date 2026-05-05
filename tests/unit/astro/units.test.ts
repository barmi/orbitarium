import { describe, expect, it } from 'vitest'

import { arcSecToRad, degrees, degToRad, radToArcSec, radToDeg } from '@/astro/units'

describe('unit conversions', () => {
  it('degToRad / radToDeg are inverses', () => {
    const d = degrees(45)
    expect(radToDeg(degToRad(d))).toBeCloseTo(45, 14)
  })

  it('arcSecToRad / radToArcSec are inverses', () => {
    const a = 84381.406
    expect(radToArcSec(arcSecToRad(a as never))).toBeCloseTo(a, 9)
  })

  it('1° = π/180 rad', () => {
    expect(degToRad(degrees(1))).toBeCloseTo(Math.PI / 180, 16)
  })

  it('1° = 3600 arcsec (round-trip via radians)', () => {
    const oneDegInArcsec = radToArcSec(degToRad(degrees(1)))
    expect(oneDegInArcsec).toBeCloseTo(3600, 9)
  })
})
