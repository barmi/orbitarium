import { describe, expect, it } from 'vitest'

import { AU, C_LIGHT, EPS_J2000, GM, LIGHT_TIME_AU } from '@/astro/constants'

describe('astronomical constants', () => {
  describe('defining values (exact)', () => {
    it('AU is the IAU 2012 defining integer (149_597_870_700 m)', () => {
      expect(AU).toBe(149_597_870_700)
    })

    it('c is the SI defining integer (299_792_458 m/s)', () => {
      expect(C_LIGHT).toBe(299_792_458)
    })

    it('LIGHT_TIME_AU equals AU / c (bit-exact)', () => {
      expect(LIGHT_TIME_AU).toBe(149_597_870_700 / 299_792_458)
      // Also a sanity check on the value (~499.0048 s).
      expect(LIGHT_TIME_AU).toBeCloseTo(499.00478383615643, 14)
    })
  })

  describe('IAU 2006 obliquity at J2000', () => {
    it('EPS_J2000 equals ERFA obl06 result (84381.406 arcsec → rad)', () => {
      expect(EPS_J2000).toBe(0.4090926006005829)
    })

    it('EPS_J2000 round-trip arcsec ≈ 84381.406', () => {
      const arcsec = (EPS_J2000 * 180 * 3600) / Math.PI
      expect(arcsec).toBeCloseTo(84381.406, 3)
    })
  })

  describe('GM table (DE440)', () => {
    it('GM.sun matches DE440 (IEEE 754 representation of 1.32712440041279419e20)', () => {
      expect(GM.sun).toBe(1.3271244004127942e20)
    })

    it('GM.sun is consistent with IAU 2015 nominal to 7 digits', () => {
      const iau2015Nominal = 1.3271244e20
      const relErr = Math.abs(GM.sun - iau2015Nominal) / iau2015Nominal
      expect(relErr).toBeLessThan(1e-7)
    })

    it('all GM values are positive', () => {
      for (const v of Object.values(GM)) {
        expect(v).toBeGreaterThan(0)
      }
    })

    it('Earth GM is consistent with Earth-Moon barycenter GM', () => {
      // earth_moon_bary = earth + moon should hold to DE440 precision.
      const sum = GM.earth + GM.moon
      const relErr = Math.abs(sum - GM.earth_moon_bary) / GM.earth_moon_bary
      // DE440 publishes earth_moon_bary independently — small mismatch (~1e-9) expected.
      expect(relErr).toBeLessThan(1e-8)
    })

    it('GM ordering by mass: sun >> jupiter > saturn > neptune > uranus > earth_moon > venus > mars > mercury > pluto', () => {
      expect(GM.sun).toBeGreaterThan(GM.jupiter_bary)
      expect(GM.jupiter_bary).toBeGreaterThan(GM.saturn_bary)
      expect(GM.saturn_bary).toBeGreaterThan(GM.neptune_bary)
      expect(GM.neptune_bary).toBeGreaterThan(GM.uranus_bary)
      expect(GM.uranus_bary).toBeGreaterThan(GM.earth_moon_bary)
      expect(GM.earth_moon_bary).toBeGreaterThan(GM.venus_bary)
      expect(GM.venus_bary).toBeGreaterThan(GM.mars_bary)
      expect(GM.mars_bary).toBeGreaterThan(GM.mercury_bary)
      expect(GM.mercury_bary).toBeGreaterThan(GM.pluto_bary)
    })
  })
})
