/**
 * Phantom (brand) types for unit safety. Compile-time only — zero runtime cost.
 *
 * Truth-layer code SHOULD use these. They guard function boundaries against
 * unit confusion (e.g. passing degrees where radians are expected).
 */

export type Meters = number & { readonly __unit: 'm' }
export type MetersPerSecond = number & { readonly __unit: 'm/s' }
export type CubicMetersPerSecondSquared = number & { readonly __unit: 'm^3/s^2' }
export type Seconds = number & { readonly __unit: 's' }
export type Radians = number & { readonly __unit: 'rad' }
export type Degrees = number & { readonly __unit: 'deg' }
export type ArcSeconds = number & { readonly __unit: 'arcsec' }

export const meters = (n: number): Meters => n as Meters
export const metersPerSecond = (n: number): MetersPerSecond => n as MetersPerSecond
export const cubicMetersPerSecondSquared = (n: number): CubicMetersPerSecondSquared =>
  n as CubicMetersPerSecondSquared
export const seconds = (n: number): Seconds => n as Seconds
export const radians = (n: number): Radians => n as Radians
export const degrees = (n: number): Degrees => n as Degrees
export const arcSeconds = (n: number): ArcSeconds => n as ArcSeconds

export const degToRad = (d: Degrees): Radians => ((d * Math.PI) / 180) as Radians
export const radToDeg = (r: Radians): Degrees => ((r * 180) / Math.PI) as Degrees
export const arcSecToRad = (a: ArcSeconds): Radians => ((a * Math.PI) / (180 * 3600)) as Radians
export const radToArcSec = (r: Radians): ArcSeconds => ((r * 180 * 3600) / Math.PI) as ArcSeconds
