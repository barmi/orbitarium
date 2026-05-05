/**
 * `@/render` types — three.js renderer pipeline + scene graph anchors (Work 5).
 *
 * Pure types only — no three.js runtime dependency. Adapters that bridge to
 * `THREE.Vector3` / `WebGLRenderer` live in dedicated files (`world.ts`,
 * `renderer.ts`).
 */

export type SceneAnchor = 'ssb' | 'heliocentric' | 'body-centric'

export const SCENE_ANCHORS = [
  'ssb',
  'heliocentric',
  'body-centric',
] as const satisfies readonly SceneAnchor[]

export type ToneMappingName = 'aces-filmic' | 'linear' | 'cineon'

export const TONE_MAPPING_NAMES = [
  'aces-filmic',
  'linear',
  'cineon',
] as const satisfies readonly ToneMappingName[]

export type OutputColorSpace = 'srgb'

export interface RenderSettings {
  readonly outputColorSpace: OutputColorSpace
  readonly toneMapping: ToneMappingName
  readonly toneMappingExposure: number
  readonly logarithmicDepthBuffer: boolean
  readonly antialias: boolean
  readonly cameraNear: number
  readonly cameraFar: number
  readonly sunIntensity: number
  readonly ambientIntensity: number
}
