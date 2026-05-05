export interface De440SegmentMeta {
  readonly target: number
  readonly center: number
  readonly file: string
  readonly init_jd_tdb: number
  readonly interval_length_days: number
  readonly n_intervals: number
  readonly coef_count: number
  readonly end_jd_tdb: number
}

export interface De440BinaryFormat {
  readonly header: string
  readonly endianness: 'little'
  readonly coefficient_layout: string
  readonly position_units: string
  readonly velocity_units: string
}

export interface De440Manifest {
  readonly kernel: string
  readonly kernel_source: string
  readonly kernel_sha256: string
  readonly generated_at_utc: string
  readonly time_range_jd_tdb: readonly [number, number]
  readonly binary_format: De440BinaryFormat
  readonly segments: readonly De440SegmentMeta[]
  readonly aliases_planet_body_to_barycenter: Readonly<Record<string, number>>
}

export interface De440Segment {
  readonly target: number
  readonly center: number
  readonly initJdTdb: number
  readonly intervalLengthDays: number
  readonly nIntervals: number
  readonly coefCount: number
  /** Float64 in `[3 components][n_intervals][coef_count]` C-order. */
  readonly coefficients: Float64Array
}

const HEADER_BYTES = 32

export function parseSegmentBinary(buffer: ArrayBuffer): De440Segment {
  if (buffer.byteLength < HEADER_BYTES) {
    throw new Error(`segment binary too short: ${buffer.byteLength} bytes`)
  }
  const dv = new DataView(buffer)
  const target = dv.getInt32(0, true)
  const center = dv.getInt32(4, true)
  const nIntervals = dv.getInt32(8, true)
  const coefCount = dv.getInt32(12, true)
  const initJdTdb = dv.getFloat64(16, true)
  const intervalLengthDays = dv.getFloat64(24, true)

  const expectedFloats = 3 * nIntervals * coefCount
  const expectedBytes = HEADER_BYTES + expectedFloats * 8
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `segment binary size mismatch: expected ${expectedBytes}, got ${buffer.byteLength}`,
    )
  }

  const coefficients = new Float64Array(buffer.slice(HEADER_BYTES))
  return {
    target,
    center,
    nIntervals,
    coefCount,
    initJdTdb,
    intervalLengthDays,
    coefficients,
  }
}

export function parseManifestJson(json: string): De440Manifest {
  const parsed = JSON.parse(json) as De440Manifest
  if (!Array.isArray(parsed.segments)) {
    throw new Error('manifest.segments must be an array')
  }
  return parsed
}

export const DE440_BINARY_HEADER_BYTES = HEADER_BYTES
