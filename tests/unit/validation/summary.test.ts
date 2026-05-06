import { describe, expect, it } from 'vitest'

import type { ValidationSample } from '@/validation'
import { summarize } from '@/validation'

const sample = (bodyKey: string, diff: number | null, ang: number | null): ValidationSample => ({
  bodyKey,
  utcIso: '2026-05-06T00:00:00Z',
  jdTdb: 2_451_545.0,
  de440PositionM: [0, 0, 0],
  horizonsPositionM: [diff ?? 0, 0, 0],
  diffMagnitudeM: diff,
  angularErrorMas: ang,
})

describe('validation summary', () => {
  it('empty samples → null aggregates', () => {
    const s = summarize([])
    expect(s.samples).toBe(0)
    expect(s.meanDiffM).toBeNull()
    expect(s.maxDiffM).toBeNull()
  })

  it('all-null diffs → null aggregates', () => {
    const s = summarize([sample('earth', null, null)])
    expect(s.bodies).toBe(1)
    expect(s.meanDiffM).toBeNull()
  })

  it('mixed samples → mean / max from finite ones', () => {
    const s = summarize([
      sample('earth', 1, 0.1),
      sample('mars', 2, 0.2),
      sample('jupiter', 3, 0.3),
    ])
    expect(s.bodies).toBe(3)
    expect(s.meanDiffM).toBeCloseTo(2, 9)
    expect(s.maxDiffM).toBe(3)
    expect(s.meanAngularMas).toBeCloseTo(0.2, 9)
    expect(s.maxAngularMas).toBeCloseTo(0.3, 9)
  })
})
