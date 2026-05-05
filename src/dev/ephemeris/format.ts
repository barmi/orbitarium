import { AU } from '@/astro'

export function formatExp(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return 'NaN'
  if (n === 0) return '0'
  return n.toExponential(digits)
}

export function metersToAu(m: number): number {
  return m / AU
}

export function metersToKm(m: number): number {
  return m / 1000
}

export function vectorMagnitude(v: readonly [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2])
}
