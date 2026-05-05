import type { Vec3 } from '@/astro'

export function formatFixed(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return 'NaN'
  return n.toFixed(digits)
}

export function formatSignedExp(n: number): string {
  if (!Number.isFinite(n)) return 'NaN'
  if (n === 0) return '0'
  return n.toExponential(6)
}

export function formatVector(v: Vec3): string {
  return `[${v.map((n) => formatSignedExp(n)).join(', ')}]`
}

export function vectorDiffNorm(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}
