import type { Meters } from '@/astro'

export type SceneUnit = number & { readonly __unit: 'scene' }
export type PositionScene = readonly [SceneUnit, SceneUnit, SceneUnit]
export type SizeScene = SceneUnit

export const sceneUnit = (n: number): SceneUnit => n as SceneUnit
export const positionScene = (x: number, y: number, z: number): PositionScene =>
  [x, y, z] as unknown as PositionScene
export const sizeScene = (n: number): SizeScene => n as SizeScene

export interface DistancePolicy {
  readonly name: string
  forward(distanceM: Meters): SceneUnit
  inverse(distanceScene: SceneUnit): Meters
  readonly metadata: Readonly<Record<string, number | string | readonly number[]>>
}

export interface SizePolicy {
  readonly name: string
  forward(radiusM: Meters): SizeScene
  inverse(radiusScene: SizeScene): Meters
  readonly metadata: Readonly<Record<string, number | string | readonly number[]>>
}
