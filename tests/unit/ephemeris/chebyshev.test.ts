import { describe, expect, it } from 'vitest'

import { evaluateChebyshev, evaluateChebyshevAndDerivative } from '@/ephemeris/chebyshev'

describe('evaluateChebyshev', () => {
  it('returns 0 for empty coefficients', () => {
    expect(evaluateChebyshev([], 0.5)).toBe(0)
  })

  it('returns the constant for a degree-0 polynomial', () => {
    expect(evaluateChebyshev([3.7], 0.42)).toBe(3.7)
  })

  it('returns coefs[0] + coefs[1]*s for a degree-1 polynomial', () => {
    // T_0=1, T_1=s
    expect(evaluateChebyshev([1, 2], 0.5)).toBe(1 + 2 * 0.5)
  })

  it('computes T_2(s) = 2s^2 - 1', () => {
    // coefs = [0, 0, 1] → T_2(s) = 2s^2 - 1
    for (const s of [-1, -0.5, 0, 0.25, 0.7, 1]) {
      expect(evaluateChebyshev([0, 0, 1], s)).toBeCloseTo(2 * s * s - 1, 12)
    }
  })

  it('computes T_3(s) = 4s^3 - 3s', () => {
    for (const s of [-1, -0.3, 0, 0.6, 1]) {
      expect(evaluateChebyshev([0, 0, 0, 1], s)).toBeCloseTo(4 * s ** 3 - 3 * s, 12)
    }
  })
})

describe('evaluateChebyshevAndDerivative', () => {
  it('matches T_3 value and derivative dT_3/ds = 12s^2 - 3', () => {
    for (const s of [-0.9, -0.4, 0, 0.4, 0.9]) {
      const { value, derivative } = evaluateChebyshevAndDerivative([0, 0, 0, 1], s)
      expect(value).toBeCloseTo(4 * s ** 3 - 3 * s, 12)
      expect(derivative).toBeCloseTo(12 * s * s - 3, 12)
    }
  })

  it('matches the value evaluator for random polynomials', () => {
    const coefs = [0.3, -1.7, 2.05, 0.42, -0.91, 0.15]
    for (const s of [-0.7, -0.1, 0.0, 0.4, 0.85]) {
      const expected = evaluateChebyshev(coefs, s)
      const both = evaluateChebyshevAndDerivative(coefs, s)
      expect(both.value).toBeCloseTo(expected, 13)
    }
  })

  it('returns zero derivative for constant polynomial', () => {
    expect(evaluateChebyshevAndDerivative([5], 0.3).derivative).toBe(0)
  })
})
