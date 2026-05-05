import { describe, expect, it } from 'vitest'

import {
  DE440_BINARY_HEADER_BYTES,
  parseManifestJson,
  parseSegmentBinary,
} from '@/ephemeris/de440Format'

function buildSegmentBuffer(opts: {
  target: number
  center: number
  nIntervals: number
  coefCount: number
  initJdTdb: number
  intervalLengthDays: number
  coefficients: readonly number[]
}): ArrayBuffer {
  const payloadFloats = 3 * opts.nIntervals * opts.coefCount
  expect(opts.coefficients).toHaveLength(payloadFloats)
  const total = DE440_BINARY_HEADER_BYTES + payloadFloats * 8
  const buf = new ArrayBuffer(total)
  const dv = new DataView(buf)
  dv.setInt32(0, opts.target, true)
  dv.setInt32(4, opts.center, true)
  dv.setInt32(8, opts.nIntervals, true)
  dv.setInt32(12, opts.coefCount, true)
  dv.setFloat64(16, opts.initJdTdb, true)
  dv.setFloat64(24, opts.intervalLengthDays, true)
  const f64 = new Float64Array(buf, DE440_BINARY_HEADER_BYTES, payloadFloats)
  for (let i = 0; i < payloadFloats; i++) {
    f64[i] = opts.coefficients[i]!
  }
  return buf
}

describe('parseSegmentBinary', () => {
  it('round-trips header and coefficients', () => {
    const coefs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    const buf = buildSegmentBuffer({
      target: 399,
      center: 3,
      nIntervals: 2,
      coefCount: 2,
      initJdTdb: 2451545.0,
      intervalLengthDays: 4.0,
      coefficients: coefs,
    })
    const seg = parseSegmentBinary(buf)
    expect(seg.target).toBe(399)
    expect(seg.center).toBe(3)
    expect(seg.nIntervals).toBe(2)
    expect(seg.coefCount).toBe(2)
    expect(seg.initJdTdb).toBe(2451545.0)
    expect(seg.intervalLengthDays).toBe(4.0)
    expect(Array.from(seg.coefficients)).toEqual(coefs)
  })

  it('throws when payload size mismatches the header', () => {
    const buf = new ArrayBuffer(DE440_BINARY_HEADER_BYTES + 8)
    const dv = new DataView(buf)
    dv.setInt32(8, 5, true) // n_intervals = 5 → expects 5*3*coefCount > 1 floats
    dv.setInt32(12, 5, true)
    expect(() => parseSegmentBinary(buf)).toThrow(/size mismatch/i)
  })

  it('throws when buffer is shorter than the header', () => {
    expect(() => parseSegmentBinary(new ArrayBuffer(8))).toThrow(/too short/i)
  })
})

describe('parseManifestJson', () => {
  it('parses a minimal manifest', () => {
    const json = JSON.stringify({
      kernel: 'de440',
      kernel_source: 'https://example/de440.bsp',
      kernel_sha256: 'deadbeef',
      generated_at_utc: '2026-05-05T00:00:00+00:00',
      time_range_jd_tdb: [2415020.5, 2506717.5],
      binary_format: {
        header: 'h',
        endianness: 'little',
        coefficient_layout: 'l',
        position_units: 'p',
        velocity_units: 'v',
      },
      segments: [
        {
          target: 10,
          center: 0,
          file: 'spk_10_0.bin',
          init_jd_tdb: 2415020.5,
          interval_length_days: 16,
          n_intervals: 5732,
          coef_count: 11,
          end_jd_tdb: 2506720.5,
        },
      ],
      aliases_planet_body_to_barycenter: { '499': 4 },
    })
    const manifest = parseManifestJson(json)
    expect(manifest.kernel).toBe('de440')
    expect(manifest.segments).toHaveLength(1)
    expect(manifest.aliases_planet_body_to_barycenter['499']).toBe(4)
  })

  it('rejects when segments is not an array', () => {
    expect(() => parseManifestJson(JSON.stringify({ segments: 'not-an-array' }))).toThrow(
      /segments/,
    )
  })
})
