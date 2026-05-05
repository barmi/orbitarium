import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  Points,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

export const STARFIELD_MAGIC = 'STRF' as const
export const STARFIELD_FORMAT_VERSION = 1
export const STARFIELD_HEADER_BYTES = 16

export const PALETTE_SIZE = 256
export const PALETTE_KELVIN_MIN = 2000
export const PALETTE_KELVIN_MAX = 30000

export const MAG_BUCKET_COUNT = 256
export const MAG_VMAG_MIN = -2
export const MAG_VMAG_MAX = 8

export const DEFAULT_VMAG_CUTOFF = 6.0

export const STARFIELD_SCENE_RADIUS = 1e9

export const FALLBACK_COLOR_TEMP_K = 5778
export const HIPPARCOS_EPOCH_TO_J2000_YEARS = 8.75

const _MAGIC_BYTES = new Uint8Array([0x53, 0x54, 0x52, 0x46]) // "STRF"

function clampU8(x: number): number {
  if (x <= 0) return 0
  if (x >= 255) return 255
  return Math.round(x)
}

export function kelvinToRgbU8(kelvin: number): [number, number, number] {
  const t = Math.max(1000, Math.min(40000, kelvin)) / 100

  const red = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592)

  const green =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492)

  let blue: number
  if (t >= 66) blue = 255
  else if (t <= 19) blue = 0
  else blue = 138.5177312231 * Math.log(t - 10) - 305.0447927307

  return [clampU8(red), clampU8(green), clampU8(blue)]
}

export function paletteIndexForKelvin(kelvin: number): number {
  if (kelvin <= PALETTE_KELVIN_MIN) return 0
  if (kelvin >= PALETTE_KELVIN_MAX) return PALETTE_SIZE - 1
  const logMin = Math.log(PALETTE_KELVIN_MIN)
  const logMax = Math.log(PALETTE_KELVIN_MAX)
  const t = (Math.log(kelvin) - logMin) / (logMax - logMin)
  const idx = Math.round(t * (PALETTE_SIZE - 1))
  return Math.max(0, Math.min(PALETTE_SIZE - 1, idx))
}

export function kelvinForPaletteIndex(index: number): number {
  if (index <= 0) return PALETTE_KELVIN_MIN
  if (index >= PALETTE_SIZE - 1) return PALETTE_KELVIN_MAX
  const logMin = Math.log(PALETTE_KELVIN_MIN)
  const logMax = Math.log(PALETTE_KELVIN_MAX)
  const t = index / (PALETTE_SIZE - 1)
  return Math.exp(logMin + t * (logMax - logMin))
}

export function buildPalette(): Uint8Array {
  const out = new Uint8Array(PALETTE_SIZE * 4)
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const kelvin = kelvinForPaletteIndex(i)
    const [r, g, b] = kelvinToRgbU8(kelvin)
    out[i * 4 + 0] = r
    out[i * 4 + 1] = g
    out[i * 4 + 2] = b
    out[i * 4 + 3] = 255
  }
  return out
}

export function magnitudeToBucket(vmag: number): number {
  if (vmag <= MAG_VMAG_MIN) return 0
  if (vmag >= MAG_VMAG_MAX) return MAG_BUCKET_COUNT - 1
  const t = (vmag - MAG_VMAG_MIN) / (MAG_VMAG_MAX - MAG_VMAG_MIN)
  return Math.max(0, Math.min(MAG_BUCKET_COUNT - 1, Math.round(t * (MAG_BUCKET_COUNT - 1))))
}

export function bvToKelvin(bv: number): number {
  if (Number.isNaN(bv) || bv < -0.5 || bv > 2.5) return FALLBACK_COLOR_TEMP_K
  const a = 0.92 * bv + 1.7
  const b = 0.92 * bv + 0.62
  if (a === 0 || b === 0) return FALLBACK_COLOR_TEMP_K
  return 4600 * (1 / a + 1 / b)
}

export function applyProperMotion(
  raDeg: number,
  decDeg: number,
  pmraMasPerYr: number,
  pmdecMasPerYr: number,
  dtYears: number = HIPPARCOS_EPOCH_TO_J2000_YEARS,
): [number, number] {
  const cosDec = Math.cos((decDeg * Math.PI) / 180)
  const raNew = cosDec === 0 ? raDeg : raDeg + ((pmraMasPerYr / cosDec) * dtYears) / 3_600_000 // mas / arcsec_per_deg
  const decNew = decDeg + (pmdecMasPerYr * dtYears) / 3_600_000
  const wrapped = ((raNew % 360) + 360) % 360
  return [wrapped, decNew]
}

export function radecToUnitVector(raDeg: number, decDeg: number): [number, number, number] {
  const ra = (raDeg * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  const cosDec = Math.cos(dec)
  return [cosDec * Math.cos(ra), cosDec * Math.sin(ra), Math.sin(dec)]
}

export interface StarfieldData {
  readonly sceneRadius: number
  readonly count: number
  readonly positions: Float32Array
  readonly colorIdx: Uint8Array
  readonly magBucket: Uint8Array
}

export function decodeStarfieldBin(buffer: ArrayBuffer): StarfieldData {
  if (buffer.byteLength < STARFIELD_HEADER_BYTES) {
    throw new Error(`Starfield bin too short: ${buffer.byteLength} bytes`)
  }
  const view = new DataView(buffer)
  const magic = new Uint8Array(buffer, 0, 4)
  for (let i = 0; i < 4; i++) {
    if (magic[i] !== _MAGIC_BYTES[i]) {
      throw new Error(`Bad starfield magic: expected "STRF"`)
    }
  }
  const version = view.getUint32(4, true)
  if (version !== STARFIELD_FORMAT_VERSION) {
    throw new Error(`Unsupported starfield format version: ${version}`)
  }
  const count = view.getUint32(8, true)
  const sceneRadius = view.getFloat32(12, true)

  const expected = STARFIELD_HEADER_BYTES + count * 14
  if (buffer.byteLength !== expected) {
    throw new Error(`Starfield bin size mismatch: got ${buffer.byteLength}, expected ${expected}`)
  }

  const posOff = STARFIELD_HEADER_BYTES
  const colorOff = posOff + count * 12
  const magOff = colorOff + count

  const positions = new Float32Array(buffer.slice(posOff, posOff + count * 12))
  const colorIdx = new Uint8Array(buffer.slice(colorOff, colorOff + count))
  const magBucket = new Uint8Array(buffer.slice(magOff, magOff + count))

  return { sceneRadius, count, positions, colorIdx, magBucket }
}

export function createStarfieldGeometry(data: StarfieldData): BufferGeometry {
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(data.positions, 3))
  geo.setAttribute(
    'colorIdx',
    new BufferAttribute(
      Float32Array.from(data.colorIdx, (v) => v),
      1,
    ),
  )
  geo.setAttribute(
    'magBucket',
    new BufferAttribute(
      Float32Array.from(data.magBucket, (v) => v),
      1,
    ),
  )
  return geo
}

const VERTEX_SHADER = /* glsl */ `
  attribute float colorIdx;
  attribute float magBucket;

  uniform sampler2D paletteTexture;
  uniform float pixelRatio;
  uniform float baseSize;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float t = colorIdx / 255.0;
    vec4 paletteSample = texture2D(paletteTexture, vec2(t, 0.5));
    vColor = paletteSample.rgb;

    float brightness = 1.0 - magBucket / 255.0;
    float magFactor = 0.2 + brightness * brightness;
    gl_PointSize = baseSize * magFactor * pixelRatio;
    vAlpha = max(0.6, brightness);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);
    if (r2 > 0.25) discard;
    float falloff = smoothstep(0.25, 0.0, r2);
    gl_FragColor = vec4(vColor, vAlpha * falloff);
  }
`

export interface StarfieldMaterialOptions {
  readonly baseSize?: number
  readonly pixelRatio?: number
}

export function createStarfieldMaterial(
  palette: Uint8Array,
  options: StarfieldMaterialOptions = {},
): ShaderMaterial {
  const paletteTexture = new DataTexture(palette, PALETTE_SIZE, 1, RGBAFormat, UnsignedByteType)
  paletteTexture.colorSpace = SRGBColorSpace
  paletteTexture.needsUpdate = true

  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      paletteTexture: { value: paletteTexture },
      pixelRatio: { value: options.pixelRatio ?? 1 },
      baseSize: { value: options.baseSize ?? 6 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })
}

export function createStarfieldMesh(
  data: StarfieldData,
  options: StarfieldMaterialOptions = {},
): Points {
  const palette = buildPalette()
  const geometry = createStarfieldGeometry(data)
  const material = createStarfieldMaterial(palette, options)
  return new Points(geometry, material)
}
