import { describe, expect, it } from 'vitest'

import { decodeShareState, encodeShareState, SHARE_VERSION, type ShareState } from '@/share'

describe('encodeShareState / decodeShareState', () => {
  it('encodes version + jdTdb + body + camera mode', () => {
    const state: ShareState = {
      jdTdb: 2_460_000.5,
      bodySlug: 'earth',
      cameraMode: 'focus',
      distancePolicy: null,
      sizePolicy: null,
    }
    const hash = encodeShareState(state)
    expect(hash).toContain('v=1')
    expect(hash).toContain('jd=2460000.500000')
    expect(hash).toContain('body=earth')
    expect(hash).toContain('cam=focus')
  })

  it('round-trips through decode', () => {
    const state: ShareState = {
      jdTdb: 2_451_545.0,
      bodySlug: 'mars',
      cameraMode: null,
      distancePolicy: null,
      sizePolicy: null,
    }
    const hash = encodeShareState(state)
    const back = decodeShareState(hash)
    expect(back).not.toBeNull()
    expect(back!.jdTdb).toBeCloseTo(state.jdTdb, 6)
    expect(back!.bodySlug).toBe(state.bodySlug)
    expect(back!.cameraMode).toBeNull()
  })

  it('omits null body / camera / policy fields', () => {
    const hash = encodeShareState({
      jdTdb: 100,
      bodySlug: null,
      cameraMode: null,
      distancePolicy: null,
      sizePolicy: null,
    })
    expect(hash).not.toContain('body=')
    expect(hash).not.toContain('cam=')
    expect(hash).not.toContain('dist=')
    expect(hash).not.toContain('size=')
  })

  it('round-trips distance + size policy fields', () => {
    const hash = encodeShareState({
      jdTdb: 2_451_545.0,
      bodySlug: null,
      cameraMode: null,
      distancePolicy: 'logarithmic',
      sizePolicy: 'minmax-clamp',
    })
    expect(hash).toContain('dist=logarithmic')
    expect(hash).toContain('size=minmax-clamp')
    const back = decodeShareState(hash)
    expect(back!.distancePolicy).toBe('logarithmic')
    expect(back!.sizePolicy).toBe('minmax-clamp')
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
