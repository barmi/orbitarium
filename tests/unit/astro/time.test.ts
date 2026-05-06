import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  J2000_JD_TDB,
  jdTdbToUtc,
  jdToJ2000Days,
  jdToMjd,
  leapSecondsAt,
  SECONDS_PER_DAY,
  TT_TAI_OFFSET_S,
  utcToJdTai,
  utcToJdTdb,
  utcToJdTt,
  utcToJdUtc,
} from '@/astro/time'

interface TimeFixture {
  utc_iso: string
  leap_seconds: number
  jd_utc: number
  jd_tai: number
  jd_tt: number
  jd_tdb: number
  j2000_days_tdb: number
  mjd_tdb: number
}

interface FixtureFile {
  _tolerance_us: number
  _tdb_tolerance_us: number
  fixtures: TimeFixture[]
}

const fixtureFile = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/work-02/time.json'), 'utf-8'),
) as FixtureFile

const TOL_US = fixtureFile._tolerance_us
const TDB_TOL_US = fixtureFile._tdb_tolerance_us
const TOL_DAYS = TOL_US / 1e6 / SECONDS_PER_DAY
const TDB_TOL_DAYS = TDB_TOL_US / 1e6 / SECONDS_PER_DAY

describe('time scale conversions vs golden fixtures', () => {
  it('fixture file has 20+ entries', () => {
    expect(fixtureFile.fixtures.length).toBeGreaterThanOrEqual(20)
  })

  for (const f of fixtureFile.fixtures) {
    describe(f.utc_iso, () => {
      const d = new Date(f.utc_iso)

      it('leap seconds match', () => {
        expect(leapSecondsAt(d)).toBe(f.leap_seconds)
      })

      it(`UTC JD within ${TOL_US}µs`, () => {
        expect(Math.abs(utcToJdUtc(d) - f.jd_utc)).toBeLessThan(TOL_DAYS)
      })

      it(`TAI JD within ${TOL_US}µs`, () => {
        expect(Math.abs(utcToJdTai(d) - f.jd_tai)).toBeLessThan(TOL_DAYS)
      })

      it(`TT JD within ${TOL_US}µs`, () => {
        expect(Math.abs(utcToJdTt(d) - f.jd_tt)).toBeLessThan(TOL_DAYS)
      })

      it(`TDB JD within ${TDB_TOL_US}µs`, () => {
        expect(Math.abs(utcToJdTdb(d) - f.jd_tdb)).toBeLessThan(TDB_TOL_DAYS)
      })

      it(`J2000 days TDB within ${TDB_TOL_US}µs`, () => {
        const j2000 = jdToJ2000Days(utcToJdTdb(d))
        expect(Math.abs(j2000 - f.j2000_days_tdb)).toBeLessThan(TDB_TOL_DAYS)
      })

      it(`MJD TDB within ${TDB_TOL_US}µs`, () => {
        expect(Math.abs(jdToMjd(utcToJdTdb(d)) - f.mjd_tdb)).toBeLessThan(TDB_TOL_DAYS)
      })
    })
  }
})

describe('time scale conversions — invariants', () => {
  // JD ~ 2.46e6 in IEEE 754 has ~9 fractional digits of precision (~1e-4 s = 100µs).
  // Subtracting two near-equal JDs cancels precision; the algorithm is bit-exact
  // via fixture comparison, so these invariant tests use a slack tolerance.
  it('TT − TAI = 32.184 s (defining offset, ~100µs cancellation slack)', () => {
    const d = new Date('2025-06-15T12:34:56Z')
    const diffS = (utcToJdTt(d) - utcToJdTai(d)) * SECONDS_PER_DAY
    expect(diffS).toBeCloseTo(TT_TAI_OFFSET_S, 4)
  })

  it('TAI − UTC = leap_seconds(t) (~µs cancellation slack)', () => {
    const d = new Date('2025-06-15T12:34:56Z')
    const diffS = (utcToJdTai(d) - utcToJdUtc(d)) * SECONDS_PER_DAY
    expect(diffS).toBeCloseTo(leapSecondsAt(d), 4)
  })

  it('J2000_JD_TDB equals 2451545.0', () => {
    expect(J2000_JD_TDB).toBe(2451545.0)
  })

  it('jdToJ2000Days(2451545.0) === 0', () => {
    expect(jdToJ2000Days(2451545.0)).toBe(0)
  })

  it('jdToMjd(2400000.5) === 0', () => {
    expect(jdToMjd(2400000.5)).toBe(0)
  })

  it('throws RangeError for pre-1972 UTC', () => {
    expect(() => leapSecondsAt(new Date('1971-12-31T23:59:59Z'))).toThrow(RangeError)
  })

  it('leap seconds = 10 at 1972-01-01 boundary', () => {
    expect(leapSecondsAt(new Date('1972-01-01T00:00:00Z'))).toBe(10)
  })

  it('leap seconds = 36 just before 2017-01-01', () => {
    expect(leapSecondsAt(new Date('2016-12-31T23:59:59Z'))).toBe(36)
  })

  it('leap seconds = 37 from 2017-01-01 onward', () => {
    expect(leapSecondsAt(new Date('2017-01-01T00:00:00Z'))).toBe(37)
    expect(leapSecondsAt(new Date('2026-05-05T00:00:00Z'))).toBe(37)
  })

  it('TDB − TT bounded under 2 ms', () => {
    for (const iso of ['2000-01-01T12:00:00Z', '2050-06-15T00:00:00Z']) {
      const d = new Date(iso)
      const diffS = (utcToJdTdb(d) - utcToJdTt(d)) * SECONDS_PER_DAY
      expect(Math.abs(diffS)).toBeLessThan(2e-3)
    }
  })

  it('jdTdbToUtc inverts utcToJdTdb within ~1 second (HUD-grade)', () => {
    for (const iso of [
      '1990-03-15T08:30:00Z',
      '2000-01-01T12:00:00Z',
      '2026-05-06T00:00:00Z',
      '2050-12-31T23:59:59Z',
    ]) {
      const d = new Date(iso)
      const jd = utcToJdTdb(d)
      const back = jdTdbToUtc(jd)
      expect(Math.abs(back.getTime() - d.getTime())).toBeLessThan(1000)
    }
  })
})
