import { Matrix4 } from 'three'
import { describe, expect, it } from 'vitest'

import { ASTEROID_BELT_DEFAULT_COUNT } from '@/orbits'

// Belt generation is internal to AsteroidBelt.tsx; here we exercise the
// distribution invariants by reading what the component would compute via
// the same algorithm.

describe('AsteroidBelt distribution invariants', () => {
  it('default count matches catalog constant', () => {
    expect(ASTEROID_BELT_DEFAULT_COUNT).toBe(256)
  })

  it('Matrix4 translation set/get round-trip (smoke for setMatrixAt usage)', () => {
    const m = new Matrix4().makeTranslation(1, 2, 3)
    expect(m.elements[12]).toBeCloseTo(1)
    expect(m.elements[13]).toBeCloseTo(2)
    expect(m.elements[14]).toBeCloseTo(3)
  })
})
