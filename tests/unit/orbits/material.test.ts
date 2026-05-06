import { LineBasicMaterial, LineDashedMaterial } from 'three'
import { describe, expect, it } from 'vitest'

import { createPredictMaterial, createTrailMaterial } from '@/orbits'

describe('orbit materials', () => {
  it('createTrailMaterial returns LineBasicMaterial transparent', () => {
    const m = createTrailMaterial()
    expect(m).toBeInstanceOf(LineBasicMaterial)
    expect(m.transparent).toBe(true)
    expect(m.depthWrite).toBe(false)
    expect(m.opacity).toBeCloseTo(0.85)
  })

  it('createPredictMaterial returns LineDashedMaterial', () => {
    const m = createPredictMaterial()
    expect(m).toBeInstanceOf(LineDashedMaterial)
    expect(m.transparent).toBe(true)
    expect(m.dashSize).toBeGreaterThan(0)
    expect(m.gapSize).toBeGreaterThan(0)
  })

  it('options override defaults', () => {
    const m = createTrailMaterial({ color: '#ff0000', opacity: 0.3 })
    expect(`#${m.color.getHexString()}`).toBe('#ff0000')
    expect(m.opacity).toBeCloseTo(0.3)
  })
})
