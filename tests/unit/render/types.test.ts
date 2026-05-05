import { describe, expect, it } from 'vitest'

import {
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  RENDER_DEFAULTS,
  SCENE_ANCHORS,
  SCENE_TO_THREE_UNIT_RATIO,
  type SceneAnchor,
  TONE_MAPPING_NAMES,
  type ToneMappingName,
} from '@/render'

describe('render constants', () => {
  it('1 scene unit = 1 three.js unit (Work 4 #3 carry-over)', () => {
    expect(SCENE_TO_THREE_UNIT_RATIO).toBe(1)
  })

  it('exposure slider range [0.1, 4.0]', () => {
    expect(EXPOSURE_MIN).toBe(0.1)
    expect(EXPOSURE_MAX).toBe(4.0)
    expect(RENDER_DEFAULTS.toneMappingExposure).toBeGreaterThanOrEqual(EXPOSURE_MIN)
    expect(RENDER_DEFAULTS.toneMappingExposure).toBeLessThanOrEqual(EXPOSURE_MAX)
  })
})

describe('RENDER_DEFAULTS (HDR linear-space pipeline)', () => {
  it('uses sRGB output + ACES Filmic tone mapping', () => {
    expect(RENDER_DEFAULTS.outputColorSpace).toBe('srgb')
    expect(RENDER_DEFAULTS.toneMapping).toBe('aces-filmic')
  })

  it('default exposure is 1.0', () => {
    expect(RENDER_DEFAULTS.toneMappingExposure).toBe(1.0)
  })

  it('logarithmic depth buffer enabled by default', () => {
    expect(RENDER_DEFAULTS.logarithmicDepthBuffer).toBe(true)
  })

  it('camera near/far span >12 orders of magnitude (log-depth-friendly)', () => {
    expect(RENDER_DEFAULTS.cameraNear).toBe(1e-3)
    expect(RENDER_DEFAULTS.cameraFar).toBe(1e10)
    const span = Math.log10(RENDER_DEFAULTS.cameraFar / RENDER_DEFAULTS.cameraNear)
    expect(span).toBeGreaterThan(12)
  })

  it('antialias enabled (MSAA)', () => {
    expect(RENDER_DEFAULTS.antialias).toBe(true)
  })

  it('Sun PointLight + minimal ambient (intensity 0.05)', () => {
    expect(RENDER_DEFAULTS.ambientIntensity).toBe(0.05)
    expect(RENDER_DEFAULTS.sunIntensity).toBeGreaterThan(0)
  })
})

describe('SceneAnchor', () => {
  it('lists exactly three anchor kinds', () => {
    expect(SCENE_ANCHORS).toHaveLength(3)
    expect(SCENE_ANCHORS).toEqual(['ssb', 'heliocentric', 'body-centric'])
  })

  it('SceneAnchor type accepts each literal', () => {
    const ssb: SceneAnchor = 'ssb'
    const helio: SceneAnchor = 'heliocentric'
    const body: SceneAnchor = 'body-centric'
    expect([ssb, helio, body]).toHaveLength(3)
  })
})

describe('ToneMappingName', () => {
  it('lists ACES + Linear + Cineon (P2 picker options)', () => {
    expect(TONE_MAPPING_NAMES).toEqual(['aces-filmic', 'linear', 'cineon'])
  })

  it('ToneMappingName type accepts each literal', () => {
    const a: ToneMappingName = 'aces-filmic'
    const l: ToneMappingName = 'linear'
    const c: ToneMappingName = 'cineon'
    expect([a, l, c]).toHaveLength(3)
  })
})
