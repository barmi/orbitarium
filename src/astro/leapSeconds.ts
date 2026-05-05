/**
 * IERS leap second table — TAI minus UTC offsets.
 *
 * Source: IERS Bulletin C 70 (last verified 2026-01).
 * Most recent leap second: 2017-01-01 (TAI - UTC = +37s). No further additions
 * announced as of 2026-05.
 *
 * Each entry: `{ date, jdUtc, offset }` where `jdUtc` is the POSIX-style continuous
 * Julian Date at 00:00:00 UTC of `date`, and `offset` = TAI - UTC (seconds) for any
 * UTC instant `t` with `entry.jdUtc <= t.jdUtc < next.jdUtc`.
 *
 * Pre-1972 (rate-based, fractional seconds) is intentionally NOT supported —
 * `time.ts` throws `RangeError` for such inputs.
 *
 * Update procedure when IERS announces a new leap second:
 *   1. Append `{ date: 'YYYY-MM-DD', jdUtc: <computed>, offset: <new total> }`.
 *   2. Mirror in `tools/python/src/orbitarium_tools/time.py::LEAP_SECONDS`.
 *   3. Regenerate fixtures: `orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/`.
 */

export interface LeapSecondEntry {
  readonly date: string
  readonly jdUtc: number
  readonly offset: number
}

export const LEAP_SECONDS = [
  { date: '1972-01-01', jdUtc: 2441317.5, offset: 10 },
  { date: '1972-07-01', jdUtc: 2441499.5, offset: 11 },
  { date: '1973-01-01', jdUtc: 2441683.5, offset: 12 },
  { date: '1974-01-01', jdUtc: 2442048.5, offset: 13 },
  { date: '1975-01-01', jdUtc: 2442413.5, offset: 14 },
  { date: '1976-01-01', jdUtc: 2442778.5, offset: 15 },
  { date: '1977-01-01', jdUtc: 2443144.5, offset: 16 },
  { date: '1978-01-01', jdUtc: 2443509.5, offset: 17 },
  { date: '1979-01-01', jdUtc: 2443874.5, offset: 18 },
  { date: '1980-01-01', jdUtc: 2444239.5, offset: 19 },
  { date: '1981-07-01', jdUtc: 2444786.5, offset: 20 },
  { date: '1982-07-01', jdUtc: 2445151.5, offset: 21 },
  { date: '1983-07-01', jdUtc: 2445516.5, offset: 22 },
  { date: '1985-07-01', jdUtc: 2446247.5, offset: 23 },
  { date: '1988-01-01', jdUtc: 2447161.5, offset: 24 },
  { date: '1990-01-01', jdUtc: 2447892.5, offset: 25 },
  { date: '1991-01-01', jdUtc: 2448257.5, offset: 26 },
  { date: '1992-07-01', jdUtc: 2448804.5, offset: 27 },
  { date: '1993-07-01', jdUtc: 2449169.5, offset: 28 },
  { date: '1994-07-01', jdUtc: 2449534.5, offset: 29 },
  { date: '1996-01-01', jdUtc: 2450083.5, offset: 30 },
  { date: '1997-07-01', jdUtc: 2450630.5, offset: 31 },
  { date: '1999-01-01', jdUtc: 2451179.5, offset: 32 },
  { date: '2006-01-01', jdUtc: 2453736.5, offset: 33 },
  { date: '2009-01-01', jdUtc: 2454832.5, offset: 34 },
  { date: '2012-07-01', jdUtc: 2456109.5, offset: 35 },
  { date: '2015-07-01', jdUtc: 2457204.5, offset: 36 },
  { date: '2017-01-01', jdUtc: 2457754.5, offset: 37 },
] as const satisfies readonly LeapSecondEntry[]

export const FIRST_LEAP_JD_UTC = LEAP_SECONDS[0].jdUtc
export const FIRST_LEAP_OFFSET_S = LEAP_SECONDS[0].offset
