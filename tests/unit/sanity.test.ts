import { describe, expect, it } from 'vitest'

import { devPages } from '@/dev/registry'

describe('sanity', () => {
  it('arithmetic still holds', () => {
    expect(1 + 1).toBe(2)
  })
})

describe('dev page registry', () => {
  it('contains 11 placeholder entries (Work 2 ~ 12)', () => {
    expect(devPages.length).toBe(11)
    const numbers = devPages.map((p) => p.workNumber).sort((a, b) => a - b)
    expect(numbers).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('all entries have unique slugs', () => {
    const slugs = devPages.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all entries have non-empty title and summary', () => {
    for (const p of devPages) {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.summary.length).toBeGreaterThan(0)
    }
  })
})
