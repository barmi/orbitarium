export interface ChebyshevValueAndDerivative {
  readonly value: number
  readonly derivative: number
}

export function evaluateChebyshev(coefs: ArrayLike<number>, s: number): number {
  const n = coefs.length
  if (n === 0) return 0
  if (n === 1) return coefs[0]!
  if (n === 2) return coefs[0]! + s * coefs[1]!

  let t0 = 1
  let t1 = s
  let value = coefs[0]! + coefs[1]! * t1
  for (let k = 2; k < n; k++) {
    const t = 2 * s * t1 - t0
    value += coefs[k]! * t
    t0 = t1
    t1 = t
  }
  return value
}

export function evaluateChebyshevAndDerivative(
  coefs: ArrayLike<number>,
  s: number,
): ChebyshevValueAndDerivative {
  const n = coefs.length
  if (n === 0) return { value: 0, derivative: 0 }
  if (n === 1) return { value: coefs[0]!, derivative: 0 }

  let t0 = 1
  let t1 = s
  let tp0 = 0
  let tp1 = 1
  let value = coefs[0]! + coefs[1]! * t1
  let derivative = coefs[1]! * tp1
  for (let k = 2; k < n; k++) {
    const t = 2 * s * t1 - t0
    const tp = 2 * t1 + 2 * s * tp1 - tp0
    value += coefs[k]! * t
    derivative += coefs[k]! * tp
    t0 = t1
    t1 = t
    tp0 = tp1
    tp1 = tp
  }
  return { value, derivative }
}
