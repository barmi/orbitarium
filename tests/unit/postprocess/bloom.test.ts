import { describe, expect, it } from 'vitest'

import { BLOOM_PRESETS, clampBloom, DEFAULT_BLOOM_SETTINGS } from '@/postprocess'

describe('bloom settings', () => {
  it('default is disabled with conservative params', () => {
    expect(DEFAULT_BLOOM_SETTINGS.enabled).toBe(false)
    expect(DEFAULT_BLOOM_SETTINGS.strength).toBe(1.2)
  })

  it('presets cover off / subtle / cinematic / intense', () => {
    expect(Object.keys(BLOOM_PRESETS).sort()).toEqual(['cinematic', 'intense', 'off', 'subtle'])
    expect(BLOOM_PRESETS.off!.enabled).toBe(false)
    expect(BLOOM_PRESETS.intense!.strength).toBeGreaterThan(BLOOM_PRESETS.subtle!.strength)
  })

  it('clampBloom keeps strength in [0, 5]', () => {
    expect(clampBloom({ ...DEFAULT_BLOOM_SETTINGS, strength: -1 }).strength).toBe(0)
    expect(clampBloom({ ...DEFAULT_BLOOM_SETTINGS, strength: 99 }).strength).toBe(5)
  })

  it('clampBloom keeps radius / threshold in [0, 1]', () => {
    const c = clampBloom({ ...DEFAULT_BLOOM_SETTINGS, radius: 5, threshold: -2 })
    expect(c.radius).toBe(1)
    expect(c.threshold).toBe(0)
  })
})
