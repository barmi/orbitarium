/**
 * Time scale conversions: UTC ↔ TAI ↔ TT ↔ TDB; JD/MJD/J2000 elapsed days.
 *
 * Conventions (Work 2 P2 decisions):
 *   - JD epoch is TDB-scale by default for celestial mechanics: J2000.0 = JD 2451545.0 TDB.
 *   - TT − TAI = 32.184 s exactly (defining offset).
 *   - TDB − TT computed via Fairhead-Bretagnon 1990 simplified, 1st-order
 *     (~50 µs accuracy vs IAU 2009 full series). Sufficient for visualization
 *     timelines; Work 12 may upgrade to the 787-term series.
 *   - Leap seconds: IERS Bulletin C static table (`leapSeconds.ts`).
 *   - Pre-1972 UTC is not supported (rate-based, fractional seconds).
 *
 * Tolerances (verified against the Python reference + golden fixtures):
 *   - UTC/TAI/TT/JD: bit-identical with Python (same IEEE 754 ops on same inputs).
 *   - TDB: ~50 µs offset against astropy IAU 2009 (test budget: 100 µs).
 */

import { FIRST_LEAP_JD_UTC, LEAP_SECONDS } from './leapSeconds'
import type { Seconds } from './units'

/** Seconds per day (Julian definition, no leap-second handling). */
export const SECONDS_PER_DAY = 86400

/** TT − TAI offset in seconds. Defining constant. */
export const TT_TAI_OFFSET_S: Seconds = 32.184 as Seconds

/** Julian Date at the Unix epoch, 1970-01-01 00:00:00 UTC. */
export const UNIX_EPOCH_JD = 2440587.5

/** Modified Julian Date offset: MJD = JD − 2400000.5. */
export const MJD_OFFSET = 2400000.5

/** Brand type: Julian Date with explicit time scale. */
export type JulianDate<S extends string> = number & { readonly __scale: S }
export type JdUtc = JulianDate<'UTC'>
export type JdTai = JulianDate<'TAI'>
export type JdTt = JulianDate<'TT'>
export type JdTdb = JulianDate<'TDB'>

/** J2000.0 epoch in TDB scale: JD 2451545.0 = 2000-01-01 12:00:00 TT. */
export const J2000_JD_TDB: JdTdb = 2451545.0 as JdTdb

/**
 * TAI − UTC in seconds for a given UTC `Date`.
 * Throws `RangeError` for pre-1972 inputs.
 */
export function leapSecondsAt(utc: Date): number {
  const jdUtc = utc.getTime() / 86400000 + UNIX_EPOCH_JD
  if (jdUtc < FIRST_LEAP_JD_UTC) {
    throw new RangeError(`UTC date before 1972-01-01 not supported: ${utc.toISOString()}`)
  }
  let offset: number = LEAP_SECONDS[0].offset
  for (const entry of LEAP_SECONDS) {
    if (jdUtc >= entry.jdUtc) {
      offset = entry.offset
    } else {
      break
    }
  }
  return offset
}

/**
 * UTC `Date` → JD on the UTC scale (POSIX-style continuous time, leap seconds ignored).
 *
 * NB: JS `Date` cannot represent the leap second instant itself (e.g. 2016-12-31T23:59:60Z);
 * such inputs are not constructable. For all other UTC instants this is exact within
 * IEEE 754 double precision.
 */
export function utcToJdUtc(d: Date): JdUtc {
  return (d.getTime() / 86400000 + UNIX_EPOCH_JD) as JdUtc
}

/** UTC `Date` → JD on the TAI scale (= JD_UTC + leap_seconds / 86400). */
export function utcToJdTai(d: Date): JdTai {
  const jdUtc = d.getTime() / 86400000 + UNIX_EPOCH_JD
  return (jdUtc + leapSecondsAt(d) / SECONDS_PER_DAY) as JdTai
}

/** UTC `Date` → JD on the TT scale (= JD_TAI + 32.184 / 86400). */
export function utcToJdTt(d: Date): JdTt {
  const jdUtc = d.getTime() / 86400000 + UNIX_EPOCH_JD
  const offsetS = leapSecondsAt(d) + TT_TAI_OFFSET_S
  return (jdUtc + offsetS / SECONDS_PER_DAY) as JdTt
}

/**
 * TDB − TT in seconds — Fairhead-Bretagnon 1990 simplified, 1st-order.
 *
 *   TDB − TT ≈ 0.001658·sin(g) + 0.000014·sin(2g)   [seconds]
 *   g = 6.24 + 0.017202·(JD_TT − 2451545.0)         [radians, mean anomaly of Earth]
 *
 * Bounded by ~|0.001672| s ≈ 1.67 ms; matches IAU 2009 (787 terms) to ~50 µs.
 */
export function tdbMinusTtSeconds(jdTt: number): number {
  const t = jdTt - 2451545.0
  const g = 6.24 + 0.017202 * t
  return 0.001658 * Math.sin(g) + 0.000014 * Math.sin(2 * g)
}

/** UTC `Date` → JD on the TDB scale. */
export function utcToJdTdb(d: Date): JdTdb {
  const jdTt = utcToJdTt(d)
  return (jdTt + tdbMinusTtSeconds(jdTt) / SECONDS_PER_DAY) as JdTdb
}

/** Days elapsed since J2000.0 (any JD scale; conventional usage is TDB). */
export function jdToJ2000Days(jd: number): number {
  return jd - 2451545.0
}

/** Modified Julian Date: MJD = JD − 2400000.5 (preserves the JD's time scale). */
export function jdToMjd(jd: number): number {
  return jd - MJD_OFFSET
}
