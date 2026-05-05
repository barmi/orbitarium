/**
 * Astronomical constants — single source of truth for the Truth layer.
 *
 * Sources:
 * - AU, c: SI / IAU 2012 defining values (exact integers).
 * - eps_J2000: IAU 2006 mean obliquity at J2000.0 epoch (ERFA `obl06`, in radians).
 * - GM table: JPL DE440 (Park, Folkner, Williams, Boggs 2021, AJ 161:105, Table 8).
 *   Values stored in m^3/s^2 (DE440 publishes in km^3/s^2; multiplied by 1e9).
 *
 * IAU 2015 nominal values (Resolution B3) are checked against DE440 in tests
 * to ensure 7-digit agreement. DE440 carries extra precision (10–12 digits)
 * used by ephemeris evaluation in Work 3.
 */

import type {
  CubicMetersPerSecondSquared,
  Meters,
  MetersPerSecond,
  Radians,
  Seconds,
} from './units'

/** Astronomical Unit (m). IAU 2012 Resolution B2 — exact integer. */
export const AU: Meters = 149_597_870_700 as Meters

/** Speed of light in vacuum (m/s). SI defining constant — exact integer. */
export const C_LIGHT: MetersPerSecond = 299_792_458 as MetersPerSecond

/** Light-time across one AU (s). Derived: AU / c. */
export const LIGHT_TIME_AU: Seconds = (AU / C_LIGHT) as Seconds

/**
 * Mean obliquity of the ecliptic at J2000.0 (rad).
 * IAU 2006 P03 model evaluated by ERFA `obl06(2451545.0, 0.0)`.
 * Equivalent to 84381.406 arcsec = 23.4392794444…°.
 */
export const EPS_J2000: Radians = 0.4090926006005829 as Radians

/**
 * Gravitational parameter GM (m^3/s^2) — DE440.
 * Keys map to bodies/barycenters. NAIF IDs are in `naif.ts`.
 *
 * Note: planet barycenters include the planet + all moons (e.g. `earth_moon_bary`
 * = Earth + Moon). The body-only GM is given separately for Earth (`earth`) and
 * Moon (`moon`); Work 3 will add the rest as needed.
 */
export const GM: {
  readonly sun: CubicMetersPerSecondSquared
  readonly mercury_bary: CubicMetersPerSecondSquared
  readonly venus_bary: CubicMetersPerSecondSquared
  readonly earth_moon_bary: CubicMetersPerSecondSquared
  readonly mars_bary: CubicMetersPerSecondSquared
  readonly jupiter_bary: CubicMetersPerSecondSquared
  readonly saturn_bary: CubicMetersPerSecondSquared
  readonly uranus_bary: CubicMetersPerSecondSquared
  readonly neptune_bary: CubicMetersPerSecondSquared
  readonly pluto_bary: CubicMetersPerSecondSquared
  readonly earth: CubicMetersPerSecondSquared
  readonly moon: CubicMetersPerSecondSquared
} = {
  // 1.32712440041279419e20 (DE440 publication) rounds to this IEEE 754 double.
  sun: 1.3271244004127942e20 as CubicMetersPerSecondSquared,
  mercury_bary: 2.203186855e13 as CubicMetersPerSecondSquared,
  venus_bary: 3.24858592e14 as CubicMetersPerSecondSquared,
  earth_moon_bary: 4.03503235502e14 as CubicMetersPerSecondSquared,
  mars_bary: 4.2828375816e13 as CubicMetersPerSecondSquared,
  jupiter_bary: 1.267127641e17 as CubicMetersPerSecondSquared,
  saturn_bary: 3.79405848418e16 as CubicMetersPerSecondSquared,
  uranus_bary: 5.7945564e15 as CubicMetersPerSecondSquared,
  neptune_bary: 6.83652710058e15 as CubicMetersPerSecondSquared,
  pluto_bary: 9.755e11 as CubicMetersPerSecondSquared,
  earth: 3.986004356e14 as CubicMetersPerSecondSquared,
  moon: 4.902800066e12 as CubicMetersPerSecondSquared,
}

export type GMKey = keyof typeof GM
