import { describe, expect, it } from 'vitest'

import { decodeShareState, encodeShareState, SHARE_VERSION, type ShareState } from '@/share'

describe('encodeShareState / decodeShareState', () => {
  const baseState = (overrides: Partial<ShareState>): ShareState => ({
    jdTdb: 2_451_545.0,
    bodySlug: null,
    cameraMode: null,
    distancePolicy: null,
    sizePolicy: null,
    showOrbits: null,
    showStarfield: null,
    vmagCutoff: null,
    ...overrides,
  })

  it('encodes version + jdTdb + body + camera mode', () => {
    const hash = encodeShareState(
      baseState({ jdTdb: 2_460_000.5, bodySlug: 'earth', cameraMode: 'focus' }),
    )
    expect(hash).toContain('v=1')
    expect(hash).toContain('jd=2460000.500000')
    expect(hash).toContain('body=earth')
    expect(hash).toContain('cam=focus')
  })

  it('round-trips through decode', () => {
    const hash = encodeShareState(baseState({ bodySlug: 'mars' }))
    const back = decodeShareState(hash)
    expect(back).not.toBeNull()
    expect(back!.jdTdb).toBeCloseTo(2_451_545.0, 6)
    expect(back!.bodySlug).toBe('mars')
    expect(back!.cameraMode).toBeNull()
  })

  it('omits null body / camera / policy / view fields', () => {
    const hash = encodeShareState(baseState({ jdTdb: 100 }))
    expect(hash).not.toContain('body=')
    expect(hash).not.toContain('cam=')
    expect(hash).not.toContain('dist=')
    expect(hash).not.toContain('size=')
    expect(hash).not.toContain('o=')
    expect(hash).not.toContain('s=')
    expect(hash).not.toContain('vm=')
  })

  it('round-trips distance + size policy fields', () => {
    const hash = encodeShareState(
      baseState({ distancePolicy: 'logarithmic', sizePolicy: 'minmax-clamp' }),
    )
    expect(hash).toContain('dist=logarithmic')
    expect(hash).toContain('size=minmax-clamp')
    const back = decodeShareState(hash)
    expect(back!.distancePolicy).toBe('logarithmic')
    expect(back!.sizePolicy).toBe('minmax-clamp')
  })

  it('encodes only false orbit/starfield toggles (defaults stay implicit)', () => {
    const hashTrue = encodeShareState(baseState({ showOrbits: true, showStarfield: true }))
    expect(hashTrue).not.toContain('o=')
    expect(hashTrue).not.toContain('s=')
    const hashFalse = encodeShareState(baseState({ showOrbits: false, showStarfield: false }))
    expect(hashFalse).toContain('o=0')
    expect(hashFalse).toContain('s=0')
  })

  it('round-trips vmag cutoff', () => {
    const hash = encodeShareState(baseState({ vmagCutoff: 4.5 }))
    expect(hash).toContain('vm=4.50')
    const back = decodeShareState(hash)
    expect(back!.vmagCutoff).toBeCloseTo(4.5, 2)
  })

  it('rejects mismatched version', () => {
    const bad = `#?v=999&jd=100`
    expect(decodeShareState(bad)).toBeNull()
  })

  it('rejects empty hash', () => {
    expect(decodeShareState('')).toBeNull()
    expect(decodeShareState('#')).toBeNull()
  })

  it('SHARE_VERSION constant exported', () => {
    expect(SHARE_VERSION).toBe(1)
  })
})
