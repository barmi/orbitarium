import type { NaifId } from '@/astro'
import type { JdTdb } from '@/astro'
import type { Meters, MetersPerSecond } from '@/astro'

export type PositionICRF = readonly [Meters, Meters, Meters]
export type VelocityICRF = readonly [MetersPerSecond, MetersPerSecond, MetersPerSecond]

export interface StateVectorICRF {
  readonly naifId: NaifId
  readonly jdTdb: JdTdb
  readonly position: PositionICRF
  readonly velocity: VelocityICRF
}

export const positionICRF = (x: number, y: number, z: number): PositionICRF =>
  [x, y, z] as unknown as PositionICRF

export const velocityICRF = (vx: number, vy: number, vz: number): VelocityICRF =>
  [vx, vy, vz] as unknown as VelocityICRF
