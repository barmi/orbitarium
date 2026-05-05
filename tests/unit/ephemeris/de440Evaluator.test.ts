import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import type { JdTdb } from '@/astro'
import { createDe440Evaluator, type De440SegmentLoader } from '@/ephemeris/de440Evaluator'
import {
  type De440Manifest,
  type De440Segment,
  parseManifestJson,
  parseSegmentBinary,
} from '@/ephemeris/de440Format'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const DATA_DIR = path.join(REPO_ROOT, 'public/data/ephemeris/de440')
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests/fixtures/work-03/de440-states.json')

const dataAvailable = existsSync(path.join(DATA_DIR, 'manifest.json')) && existsSync(FIXTURE_PATH)

interface De440StateFixture {
  readonly naif_id: number
  readonly jd_tdb: number
  readonly position_m: readonly [number, number, number]
  readonly velocity_m_s: readonly [number, number, number]
}

interface De440StateFixtureFile {
  readonly _tolerance_m: number
  readonly _tolerance_vel_m_s: number
  readonly fixtures: readonly De440StateFixture[]
}

function diskLoader(): De440SegmentLoader {
  return {
    loadManifest(): Promise<De440Manifest> {
      const manifestText = readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf-8')
      return Promise.resolve(parseManifestJson(manifestText))
    },
    loadSegment(target: number, center: number): Promise<De440Segment> {
      const binPath = path.join(DATA_DIR, `spk_${target}_${center}.bin`)
      const fileBuffer = readFileSync(binPath)
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength,
      )
      return Promise.resolve(parseSegmentBinary(arrayBuffer))
    },
  }
}

describe.skipIf(!dataAvailable)('createDe440Evaluator vs spiceypy fixtures', () => {
  it('evaluates state vectors within 1 mm / 1 µm/s', async () => {
    const fixtureFile = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as De440StateFixtureFile

    const evaluator = createDe440Evaluator(diskLoader())
    const tolPosM = fixtureFile._tolerance_m
    const tolVelMps = fixtureFile._tolerance_vel_m_s

    // Component-wise L_inf comparison: each axis must agree to within
    // tolerance. L2 norm would accumulate ~sqrt(3)x the precision floor
    // (one IEEE 754 LSB at 30 AU ≈ 1 mm per axis).
    let maxPosDiff = 0
    let maxVelDiff = 0
    for (const fixture of fixtureFile.fixtures) {
      const sv = await evaluator.getStateAt(fixture.naif_id, fixture.jd_tdb as JdTdb)
      const posDiff = Math.max(
        Math.abs(sv.position[0] - fixture.position_m[0]),
        Math.abs(sv.position[1] - fixture.position_m[1]),
        Math.abs(sv.position[2] - fixture.position_m[2]),
      )
      const velDiff = Math.max(
        Math.abs(sv.velocity[0] - fixture.velocity_m_s[0]),
        Math.abs(sv.velocity[1] - fixture.velocity_m_s[1]),
        Math.abs(sv.velocity[2] - fixture.velocity_m_s[2]),
      )
      if (posDiff > maxPosDiff) maxPosDiff = posDiff
      if (velDiff > maxVelDiff) maxVelDiff = velDiff
      expect(posDiff, `body=${fixture.naif_id} jd=${fixture.jd_tdb}: position diff`).toBeLessThan(
        tolPosM,
      )
      expect(velDiff, `body=${fixture.naif_id} jd=${fixture.jd_tdb}: velocity diff`).toBeLessThan(
        tolVelMps,
      )
    }
    expect(maxPosDiff).toBeLessThan(tolPosM)
    expect(maxVelDiff).toBeLessThan(tolVelMps)
  })

  it('caches segments — second call to same body reuses load', async () => {
    let manifestLoads = 0
    let segmentLoads = 0
    const realLoader = diskLoader()
    const countingLoader: De440SegmentLoader = {
      loadManifest: async () => {
        manifestLoads += 1
        return realLoader.loadManifest()
      },
      loadSegment: async (t, c) => {
        segmentLoads += 1
        return realLoader.loadSegment(t, c)
      },
    }
    const ev = createDe440Evaluator(countingLoader)
    await ev.getStateAt(399, 2451545.0 as JdTdb)
    const after1 = segmentLoads
    await ev.getStateAt(399, 2451545.5 as JdTdb)
    expect(manifestLoads).toBe(1)
    expect(segmentLoads).toBe(after1)
  })

  it('throws for jdTdb outside the kernel range', async () => {
    const ev = createDe440Evaluator(diskLoader())
    await expect(ev.getStateAt(10, 1500000.0 as JdTdb)).rejects.toThrow(/outside segment/i)
  })
})

describe('createDe440Evaluator chain & alias logic', () => {
  it('applies alias and walks chain on a synthetic two-segment manifest', async () => {
    // Synthesize a tiny in-memory dataset:
    // Earth (399) → center 3 (linear x), and 3 → 0 (linear y)
    // At jd_tdb = init_jd, s = -1 → T_0=1, T_1=-1. So coefs [a, b] yield a + b*(-1) = a - b.
    const initJd = 2451545.0
    const intLen = 4.0
    const buildSeg = (
      target: number,
      center: number,
      perComponent: readonly [number, number, number],
    ): De440Segment => {
      const coefs = new Float64Array(3 * 1 * 2)
      // For each component we want a + b*(s) so set coefs[c*2+0] = perComponent[c], coefs[c*2+1] = 0
      for (let c = 0; c < 3; c++) {
        coefs[c * 2 + 0] = perComponent[c]!
        coefs[c * 2 + 1] = 0
      }
      return {
        target,
        center,
        nIntervals: 1,
        coefCount: 2,
        initJdTdb: initJd,
        intervalLengthDays: intLen,
        coefficients: coefs,
      }
    }
    const segments = new Map<string, De440Segment>([
      ['399/3', buildSeg(399, 3, [1, 0, 0])], // 1 km on x
      ['3/0', buildSeg(3, 0, [0, 2, 0])], // 2 km on y
    ])
    const manifest: De440Manifest = {
      kernel: 'de440',
      kernel_source: '',
      kernel_sha256: '',
      generated_at_utc: '',
      time_range_jd_tdb: [initJd, initJd + intLen],
      binary_format: {
        header: '',
        endianness: 'little',
        coefficient_layout: '',
        position_units: '',
        velocity_units: '',
      },
      segments: [
        {
          target: 399,
          center: 3,
          file: 'spk_399_3.bin',
          init_jd_tdb: initJd,
          interval_length_days: intLen,
          n_intervals: 1,
          coef_count: 2,
          end_jd_tdb: initJd + intLen,
        },
        {
          target: 3,
          center: 0,
          file: 'spk_3_0.bin',
          init_jd_tdb: initJd,
          interval_length_days: intLen,
          n_intervals: 1,
          coef_count: 2,
          end_jd_tdb: initJd + intLen,
        },
      ],
      aliases_planet_body_to_barycenter: { '499': 4 },
    }
    const loader: De440SegmentLoader = {
      loadManifest: () => Promise.resolve(manifest),
      loadSegment: (t, c) => {
        const seg = segments.get(`${t}/${c}`)
        if (!seg) throw new Error('missing')
        return Promise.resolve(seg)
      },
    }
    const ev = createDe440Evaluator(loader)
    const sv = await ev.getStateAt(399, (initJd + intLen / 2) as JdTdb)
    // At s=0 each component evaluates to its first coefficient (in km).
    // Earth contributes (1, 0, 0) km, EMB contributes (0, 2, 0) km. Sum = (1, 2, 0) km.
    expect(sv.position[0]).toBeCloseTo(1000, 6)
    expect(sv.position[1]).toBeCloseTo(2000, 6)
    expect(sv.position[2]).toBeCloseTo(0, 6)
  })
})
