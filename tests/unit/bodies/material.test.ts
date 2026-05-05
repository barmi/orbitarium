import { MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import { createPlanetMaterial, createSunMaterial } from '@/bodies'

describe('createPlanetMaterial', () => {
  it('returns MeshStandardMaterial with PBR defaults (Work 6 P3 #planet)', () => {
    const mat = createPlanetMaterial(null, '#5a8fcd')
    expect(mat).toBeInstanceOf(MeshStandardMaterial)
    expect(mat.roughness).toBeCloseTo(0.85)
    expect(mat.metalness).toBeCloseTo(0.0)
  })

  it('without texture, color carries fallback', () => {
    const mat = createPlanetMaterial(null, '#c1542c')
    expect(`#${mat.color.getHexString()}`).toBe('#c1542c')
    expect(mat.map).toBeNull()
  })

  it('with texture, color is white (texture shows through)', () => {
    const tex = new Texture()
    const mat = createPlanetMaterial(tex, '#c1542c')
    expect(mat.map).toBe(tex)
    expect(`#${mat.color.getHexString()}`).toBe('#ffffff')
  })
})

describe('createSunMaterial', () => {
  it('returns MeshBasicMaterial (lighting-agnostic)', () => {
    const mat = createSunMaterial(null, '#ffd166')
    expect(mat).toBeInstanceOf(MeshBasicMaterial)
  })

  it('without texture, color carries fallback', () => {
    const mat = createSunMaterial(null, '#ffd166')
    expect(`#${mat.color.getHexString()}`).toBe('#ffd166')
  })

  it('with texture, color is white', () => {
    const tex = new Texture()
    const mat = createSunMaterial(tex, '#ffd166')
    expect(mat.map).toBe(tex)
    expect(`#${mat.color.getHexString()}`).toBe('#ffffff')
  })
})
