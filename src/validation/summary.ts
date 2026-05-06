import type { ValidationReport, ValidationSample } from './types'

export function summarize(samples: readonly ValidationSample[]): ValidationReport['summary'] {
  const finite = samples.filter(
    (
      s,
    ): s is ValidationSample & {
      diffMagnitudeM: number
      angularErrorMas: number
    } =>
      typeof s.diffMagnitudeM === 'number' &&
      Number.isFinite(s.diffMagnitudeM) &&
      typeof s.angularErrorMas === 'number' &&
      Number.isFinite(s.angularErrorMas),
  )
  if (finite.length === 0) {
    return {
      bodies: new Set(samples.map((s) => s.bodyKey)).size,
      samples: samples.length,
      meanDiffM: null,
      maxDiffM: null,
      meanAngularMas: null,
      maxAngularMas: null,
    }
  }
  const meanDiff = finite.reduce((acc, s) => acc + s.diffMagnitudeM, 0) / finite.length
  const maxDiff = finite.reduce((m, s) => Math.max(m, s.diffMagnitudeM), 0)
  const meanAng = finite.reduce((acc, s) => acc + s.angularErrorMas, 0) / finite.length
  const maxAng = finite.reduce((m, s) => Math.max(m, s.angularErrorMas), 0)
  return {
    bodies: new Set(samples.map((s) => s.bodyKey)).size,
    samples: samples.length,
    meanDiffM: meanDiff,
    maxDiffM: maxDiff,
    meanAngularMas: meanAng,
    maxAngularMas: maxAng,
  }
}
