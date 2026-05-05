import { readFileSync } from 'node:fs'
import path from 'node:path'

import { Points } from 'three'
import { describe, expect, it } from 'vitest'

import {
  applyProperMotion,
  buildPalette,
  bvToKelvin,
  createStarfieldGeometry,
  createStarfieldMesh,
  decodeStarfieldBin,
  FALLBACK_COLOR_TEMP_K,
  HIPPARCOS_EPOCH_TO_J2000_YEARS,
  kelvinForPaletteIndex,
  kelvinToRgbU8,
  magnitudeToBucket,
  PALETTE_KELVIN_MAX,
  PALETTE_KELVIN_MIN,
  PALETTE_SIZE,
  paletteIndexForKelvin,
  radecToUnitVector,
  STARFIELD_FORMAT_VERSION,
  STARFIELD_HEADER_BYTES,
  STARFIELD_SCENE_RADIUS,
} from '@/render'

import { loadWorkFixture } from '../../helpers/fixtures'

const PUBLIC_BIN_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'public',
  'data',
  'starfield',
  'hipparcos-vmag6.bin',
)

function readPublicBin(): ArrayBuffer {
  const buf = readFileSync(PUBLIC_BIN_PATH)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

describe('starfield TS / Python parity (color temp + palette + mag bucket)', () => {
  it('Tanner Helland Sun-like 5778 K matches Python (255, 248-ish, ...)', () => {
    const [r, g, b] = kelvinToRgbU8(5778)
    expect(r).toBe(255)
    expect(g).toBeGreaterThanOrEqual(235)
    expect(g).toBeLessThanOrEqual(255)
    expect(b).toBeGreaterThanOrEqual(230)
  })

  it('palette round-trips at endpoints + within 1 bucket', () => {
    expect(paletteIndexForKelvin(PALETTE_KELVIN_MIN)).toBe(0)
    expect(paletteIndexForKelvin(PALETTE_KELVIN_MAX)).toBe(PALETTE_SIZE - 1)
    for (const k of [3000, 5778, 10000, 20000]) {
      const idx = paletteIndexForKelvin(k)
      const recovered = kelvinForPaletteIndex(idx)
      const idx2 = paletteIndexForKelvin(recovered)
      expect(Math.abs(idx2 - idx)).toBeLessThanOrEqual(1)
    }
  })

  it('buildPalette returns 1024 bytes (256 × RGBA)', () => {
    const palette = buildPalette()
    expect(palette.length).toBe(PALETTE_SIZE * 4)
    expect(palette[3]).toBe(255)
    expect(palette[(PALETTE_SIZE - 1) * 4 + 3]).toBe(255)
  })

  it('magnitudeToBucket clamps + monotonic for named stars', () => {
    expect(magnitudeToBucket(-100)).toBe(0)
    expect(magnitudeToBucket(100)).toBe(255)
    const sirius = magnitudeToBucket(-1.46)
    const vega = magnitudeToBucket(0.03)
    const polaris = magnitudeToBucket(1.97)
    const sunLike = magnitudeToBucket(4.83)
    expect(sirius).toBeLessThan(vega)
    expect(vega).toBeLessThan(polaris)
    expect(polaris).toBeLessThan(sunLike)
  })

  it('bvToKelvin Sun B-V 0.65 ≈ 5840 K (Ballesteros 2012)', () => {
    expect(bvToKelvin(0.65)).toBeGreaterThan(5700)
    expect(bvToKelvin(0.65)).toBeLessThan(5900)
  })

  it('bvToKelvin NaN / extreme falls back to 5778 K', () => {
    expect(bvToKelvin(Number.NaN)).toBe(FALLBACK_COLOR_TEMP_K)
    expect(bvToKelvin(-1)).toBe(FALLBACK_COLOR_TEMP_K)
    expect(bvToKelvin(3)).toBe(FALLBACK_COLOR_TEMP_K)
  })
})

describe('proper motion + radec → unit vector', () => {
  it('zero PM returns input unchanged', () => {
    const [ra, dec] = applyProperMotion(180, 30, 0, 0, 100)
    expect(ra).toBeCloseTo(180, 9)
    expect(dec).toBeCloseTo(30, 9)
  })

  it('Hipparcos default epoch delta is 8.75 years', () => {
    expect(HIPPARCOS_EPOCH_TO_J2000_YEARS).toBe(8.75)
  })

  it('Dec PM accumulates linearly', () => {
    const [, dec] = applyProperMotion(0, 0, 0, 1000, 1)
    expect(dec).toBeCloseTo(1000 / 3_600_000, 12)
  })

  it('radecToUnitVector returns unit-norm and matches axis conventions', () => {
    const [x, y, z] = radecToUnitVector(0, 0)
    expect(x).toBeCloseTo(1, 12)
    expect(y).toBeCloseTo(0, 12)
    expect(z).toBeCloseTo(0, 12)
    const [, , zn] = radecToUnitVector(0, 90)
    expect(zn).toBeCloseTo(1, 12)
  })
})

describe('decodeStarfieldBin', () => {
  it('decodes the public hipparcos-vmag6.bin and matches header invariants', () => {
    const bin = readPublicBin()
    const data = decodeStarfieldBin(bin)
    expect(data.sceneRadius).toBeCloseTo(STARFIELD_SCENE_RADIUS, 0)
    expect(data.count).toBeGreaterThan(2000)
    expect(data.positions.length).toBe(data.count * 3)
    expect(data.colorIdx.length).toBe(data.count)
    expect(data.magBucket.length).toBe(data.count)
    expect(bin.byteLength).toBe(STARFIELD_HEADER_BYTES + data.count * 14)
  })

  it('every star sits on the celestial sphere within ~10 m (Float32 round-off)', () => {
    const data = decodeStarfieldBin(readPublicBin())
    const tolM = 1e4
    for (let i = 0; i < data.count; i++) {
      const x = data.positions[i * 3]!
      const y = data.positions[i * 3 + 1]!
      const z = data.positions[i * 3 + 2]!
      const r = Math.sqrt(x * x + y * y + z * z)
      expect(Math.abs(r - data.sceneRadius)).toBeLessThan(tolM)
    }
  })

  it('rejects truncated / wrong-magic / wrong-version buffers', () => {
    expect(() => decodeStarfieldBin(new ArrayBuffer(8))).toThrow()
    const bad = new Uint8Array(STARFIELD_HEADER_BYTES + 14)
    bad.set([0x42, 0x41, 0x44, 0x21], 0) // "BAD!"
    new DataView(bad.buffer).setUint32(4, STARFIELD_FORMAT_VERSION, true)
    new DataView(bad.buffer).setUint32(8, 1, true)
    expect(() => decodeStarfieldBin(bad.buffer)).toThrow(/magic/)

    const wrongVersion = new Uint8Array(STARFIELD_HEADER_BYTES + 14)
    wrongVersion.set([0x53, 0x54, 0x52, 0x46], 0)
    new DataView(wrongVersion.buffer).setUint32(4, 99, true)
    new DataView(wrongVersion.buffer).setUint32(8, 1, true)
    expect(() => decodeStarfieldBin(wrongVersion.buffer)).toThrow(/version/)
  })
})

describe('createStarfieldMesh (lightweight smoke — no WebGL needed)', () => {
  it('builds a Points object with 3 attributes', () => {
    const data = decodeStarfieldBin(readPublicBin())
    const geo = createStarfieldGeometry(data)
    expect(geo.getAttribute('position').count).toBe(data.count)
    expect(geo.getAttribute('colorIdx').count).toBe(data.count)
    expect(geo.getAttribute('magBucket').count).toBe(data.count)
    const mesh = createStarfieldMesh(data, { baseSize: 4, pixelRatio: 2 })
    expect(mesh).toBeInstanceOf(Points)
  })
})

interface ColorTempFixtureSample {
  bv: number
  kelvin: number
  palette_index: number
  rgb_u8: [number, number, number]
}
interface ColorTempFixture {
  samples: ColorTempFixtureSample[]
}

describe('color-temperature fixture cross-check (TS vs Python)', () => {
  const fixture = loadWorkFixture<ColorTempFixture>(5, 'color-temperature.json')

  for (const sample of fixture.samples) {
    it(`bv=${sample.bv}: matches Python kelvin / palette / rgb`, () => {
      const k = bvToKelvin(sample.bv)
      expect(Math.abs(k - sample.kelvin)).toBeLessThan(1)
      const idx = paletteIndexForKelvin(k)
      expect(idx).toBe(sample.palette_index)
      const [r, g, b] = kelvinToRgbU8(k)
      expect([r, g, b]).toEqual(sample.rgb_u8)
    })
  }
})

interface StarfieldSampleFixture {
  name: string
  hip: number
  ra_j2000_deg?: number
  dec_j2000_deg?: number
  ra_j2000_deg_expected?: number
  dec_j2000_deg_expected?: number
  unit_vector?: [number, number, number]
  vmag?: number
  bv?: number
  kelvin?: number
  palette_index?: number
  mag_bucket?: number
  skipped?: string
}
interface StarfieldSamplesFixture {
  _tolerance_arcsec: number
  samples: StarfieldSampleFixture[]
}

describe('starfield-samples fixture sanity', () => {
  const fixture = loadWorkFixture<StarfieldSamplesFixture>(5, 'starfield-samples.json')
  const tolDeg = fixture._tolerance_arcsec / 3600

  for (const s of fixture.samples) {
    if (s.skipped) {
      it.skip(`${s.name}: skipped (${s.skipped})`, () => undefined)
      continue
    }
    it(`${s.name}: post-PM RA/Dec within ${fixture._tolerance_arcsec}″ of expected J2000`, () => {
      expect(Math.abs(s.ra_j2000_deg! - s.ra_j2000_deg_expected!)).toBeLessThan(tolDeg)
      expect(Math.abs(s.dec_j2000_deg! - s.dec_j2000_deg_expected!)).toBeLessThan(tolDeg)
    })
    it(`${s.name}: TS palette / mag bucket match Python`, () => {
      expect(paletteIndexForKelvin(s.kelvin!)).toBe(s.palette_index)
      expect(magnitudeToBucket(s.vmag!)).toBe(s.mag_bucket)
    })
    it(`${s.name}: unit vector reconstructed from RA/Dec matches stored`, () => {
      const [x, y, z] = radecToUnitVector(s.ra_j2000_deg!, s.dec_j2000_deg!)
      expect(x).toBeCloseTo(s.unit_vector![0], 6)
      expect(y).toBeCloseTo(s.unit_vector![1], 6)
      expect(z).toBeCloseTo(s.unit_vector![2], 6)
    })
  }
})
