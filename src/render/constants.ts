import type { RenderSettings } from './types'

/**
 * Work 4 P1 #3 carry-over: 1 scene unit maps to 1 three.js world unit.
 * Single-source-of-truth for any future ratio change.
 */
export const SCENE_TO_THREE_UNIT_RATIO = 1

/**
 * Default renderer settings (Work 5 P1 decisions). Used by Home + Dev routes.
 *
 * - Output sRGB + ACES Filmic tone mapping = overview §5 "HDR linear-space"
 *   (internal lighting in linear space, tone-mapped to sRGB on output).
 *   Float framebuffers are deferred to Work 11.
 * - logarithmicDepthBuffer covers the 13-orders-of-magnitude near/far span.
 * - sunIntensity is the three.js r150+ PI-based unit, retuned in Work 6.
 */
export const RENDER_DEFAULTS: RenderSettings = {
  outputColorSpace: 'srgb',
  toneMapping: 'aces-filmic',
  toneMappingExposure: 1.0,
  logarithmicDepthBuffer: true,
  antialias: true,
  cameraNear: 1e-3,
  cameraFar: 1e10,
  sunIntensity: 1.0,
  ambientIntensity: 0.05,
}

export const EXPOSURE_MIN = 0.1
export const EXPOSURE_MAX = 4.0
