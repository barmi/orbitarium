import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  type ColorSpace,
  LinearToneMapping,
  SRGBColorSpace,
  type ToneMapping,
} from 'three'

import { EXPOSURE_MAX, EXPOSURE_MIN, RENDER_DEFAULTS } from './constants'
import type { OutputColorSpace, RenderSettings, ToneMappingName } from './types'

const TONE_MAPPING_BY_NAME: Record<ToneMappingName, ToneMapping> = {
  'aces-filmic': ACESFilmicToneMapping,
  linear: LinearToneMapping,
  cineon: CineonToneMapping,
}

const COLOR_SPACE_BY_NAME: Record<OutputColorSpace, ColorSpace> = {
  srgb: SRGBColorSpace,
}

export interface RendererCanvasGl {
  readonly antialias: boolean
  readonly logarithmicDepthBuffer: boolean
  readonly outputColorSpace: ColorSpace
  readonly toneMapping: ToneMapping
  readonly toneMappingExposure: number
}

export interface RendererCanvasCamera {
  readonly fov: number
  readonly near: number
  readonly far: number
  readonly position: readonly [number, number, number]
}

export interface RendererCanvasProps {
  readonly gl: RendererCanvasGl
  readonly camera: RendererCanvasCamera
}

export interface RendererCameraOverrides {
  readonly fov?: number
  readonly near?: number
  readonly far?: number
  readonly position?: readonly [number, number, number]
}

export const DEFAULT_CAMERA_FOV = 50
export const DEFAULT_CAMERA_POSITION: readonly [number, number, number] = [0, 0, 5]

export function clampExposure(value: number): number {
  if (Number.isNaN(value)) return RENDER_DEFAULTS.toneMappingExposure
  if (value < EXPOSURE_MIN) return EXPOSURE_MIN
  if (value > EXPOSURE_MAX) return EXPOSURE_MAX
  return value
}

export function resolveToneMapping(name: ToneMappingName): ToneMapping {
  return TONE_MAPPING_BY_NAME[name]
}

export function resolveOutputColorSpace(name: OutputColorSpace): ColorSpace {
  return COLOR_SPACE_BY_NAME[name]
}

export function createRendererProps(
  settings: RenderSettings = RENDER_DEFAULTS,
  cameraOverrides: RendererCameraOverrides = {},
): RendererCanvasProps {
  return {
    gl: {
      antialias: settings.antialias,
      logarithmicDepthBuffer: settings.logarithmicDepthBuffer,
      outputColorSpace: COLOR_SPACE_BY_NAME[settings.outputColorSpace],
      toneMapping: TONE_MAPPING_BY_NAME[settings.toneMapping],
      toneMappingExposure: clampExposure(settings.toneMappingExposure),
    },
    camera: {
      fov: cameraOverrides.fov ?? DEFAULT_CAMERA_FOV,
      near: cameraOverrides.near ?? settings.cameraNear,
      far: cameraOverrides.far ?? settings.cameraFar,
      position: cameraOverrides.position ?? DEFAULT_CAMERA_POSITION,
    },
  }
}
