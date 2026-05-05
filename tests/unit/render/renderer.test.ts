import { ACESFilmicToneMapping, CineonToneMapping, LinearToneMapping, SRGBColorSpace } from 'three'
import { describe, expect, it } from 'vitest'

import {
  clampExposure,
  createRendererProps,
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_POSITION,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  RENDER_DEFAULTS,
  resolveOutputColorSpace,
  resolveToneMapping,
} from '@/render'

describe('resolveToneMapping', () => {
  it('maps each ToneMappingName to a three.js constant', () => {
    expect(resolveToneMapping('aces-filmic')).toBe(ACESFilmicToneMapping)
    expect(resolveToneMapping('linear')).toBe(LinearToneMapping)
    expect(resolveToneMapping('cineon')).toBe(CineonToneMapping)
  })
})

describe('resolveOutputColorSpace', () => {
  it('maps "srgb" to three.js SRGBColorSpace', () => {
    expect(resolveOutputColorSpace('srgb')).toBe(SRGBColorSpace)
  })
})

describe('clampExposure', () => {
  it('passes through values inside [EXPOSURE_MIN, EXPOSURE_MAX]', () => {
    expect(clampExposure(0.5)).toBe(0.5)
    expect(clampExposure(1.0)).toBe(1.0)
    expect(clampExposure(EXPOSURE_MIN)).toBe(EXPOSURE_MIN)
    expect(clampExposure(EXPOSURE_MAX)).toBe(EXPOSURE_MAX)
  })

  it('clamps below EXPOSURE_MIN and above EXPOSURE_MAX', () => {
    expect(clampExposure(-1)).toBe(EXPOSURE_MIN)
    expect(clampExposure(0)).toBe(EXPOSURE_MIN)
    expect(clampExposure(99)).toBe(EXPOSURE_MAX)
  })

  it('falls back to default exposure on NaN', () => {
    expect(clampExposure(Number.NaN)).toBe(RENDER_DEFAULTS.toneMappingExposure)
  })
})

describe('createRendererProps (HDR linear-space pipeline)', () => {
  it('produces gl + camera using RENDER_DEFAULTS by default', () => {
    const props = createRendererProps()
    expect(props.gl.antialias).toBe(true)
    expect(props.gl.logarithmicDepthBuffer).toBe(true)
    expect(props.gl.outputColorSpace).toBe(SRGBColorSpace)
    expect(props.gl.toneMapping).toBe(ACESFilmicToneMapping)
    expect(props.gl.toneMappingExposure).toBe(1.0)
    expect(props.camera.fov).toBe(DEFAULT_CAMERA_FOV)
    expect(props.camera.near).toBe(RENDER_DEFAULTS.cameraNear)
    expect(props.camera.far).toBe(RENDER_DEFAULTS.cameraFar)
    expect(props.camera.position).toEqual(DEFAULT_CAMERA_POSITION)
  })

  it('honors RenderSettings overrides', () => {
    const props = createRendererProps({
      ...RENDER_DEFAULTS,
      toneMapping: 'cineon',
      toneMappingExposure: 2.5,
      logarithmicDepthBuffer: false,
      antialias: false,
    })
    expect(props.gl.toneMapping).toBe(CineonToneMapping)
    expect(props.gl.toneMappingExposure).toBe(2.5)
    expect(props.gl.logarithmicDepthBuffer).toBe(false)
    expect(props.gl.antialias).toBe(false)
  })

  it('clamps exposure into the slider range', () => {
    const low = createRendererProps({ ...RENDER_DEFAULTS, toneMappingExposure: -5 })
    const high = createRendererProps({ ...RENDER_DEFAULTS, toneMappingExposure: 100 })
    expect(low.gl.toneMappingExposure).toBe(EXPOSURE_MIN)
    expect(high.gl.toneMappingExposure).toBe(EXPOSURE_MAX)
  })

  it('honors camera overrides while keeping settings near/far defaults', () => {
    const props = createRendererProps(RENDER_DEFAULTS, {
      fov: 35,
      position: [10, 20, 30],
    })
    expect(props.camera.fov).toBe(35)
    expect(props.camera.position).toEqual([10, 20, 30])
    expect(props.camera.near).toBe(RENDER_DEFAULTS.cameraNear)
    expect(props.camera.far).toBe(RENDER_DEFAULTS.cameraFar)
  })

  it('camera near/far overrides bypass settings', () => {
    const props = createRendererProps(RENDER_DEFAULTS, { near: 0.1, far: 1000 })
    expect(props.camera.near).toBe(0.1)
    expect(props.camera.far).toBe(1000)
  })
})
