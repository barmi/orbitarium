import { describe, expect, it } from 'vitest'

import {
  CAMERA_PRESETS,
  cameraReducer,
  INITIAL_CAMERA_STATE,
  lerpCamera,
  smoothstep,
} from '@/camera'

describe('cameraReducer', () => {
  it('initial state is free-fly with default position / fov', () => {
    expect(INITIAL_CAMERA_STATE.mode).toBe('free-fly')
    expect(INITIAL_CAMERA_STATE.fov).toBe(50)
  })

  it('setMode updates mode + optional target', () => {
    const focused = cameraReducer(INITIAL_CAMERA_STATE, {
      type: 'setMode',
      mode: 'focus',
      targetNaifId: 399,
    })
    expect(focused.mode).toBe('focus')
    expect(focused.targetNaifId).toBe(399)
  })

  it('setPosition / setLookAt update vectors', () => {
    const moved = cameraReducer(INITIAL_CAMERA_STATE, {
      type: 'setPosition',
      position: [10, 20, 30],
    })
    expect(moved.position).toEqual([10, 20, 30])
  })

  it('setFov clamps to [10, 120]', () => {
    const tooSmall = cameraReducer(INITIAL_CAMERA_STATE, { type: 'setFov', fov: 0 })
    const tooBig = cameraReducer(INITIAL_CAMERA_STATE, { type: 'setFov', fov: 999 })
    expect(tooSmall.fov).toBe(10)
    expect(tooBig.fov).toBe(120)
  })

  it('applyPreset replaces entire state', () => {
    const preset = CAMERA_PRESETS[0]!
    const applied = cameraReducer(INITIAL_CAMERA_STATE, {
      type: 'applyPreset',
      preset: preset.state,
    })
    expect(applied.position).toEqual(preset.state.position)
    expect(applied.fov).toBe(preset.state.fov)
  })
})

describe('CAMERA_PRESETS', () => {
  it('lists at least 4 presets', () => {
    expect(CAMERA_PRESETS.length).toBeGreaterThanOrEqual(4)
    for (const p of CAMERA_PRESETS) {
      expect(p.id).toBeDefined()
      expect(p.label).toBeDefined()
      expect(p.state.fov).toBeGreaterThan(0)
    }
  })
})

describe('smoothstep', () => {
  it('returns 0 / 1 at endpoints', () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(-5)).toBe(0)
    expect(smoothstep(99)).toBe(1)
  })

  it('returns 0.5 at t=0.5', () => {
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 9)
  })
})

describe('lerpCamera', () => {
  const a = INITIAL_CAMERA_STATE
  const b = CAMERA_PRESETS[0]!.state

  it('t=0 returns a state matching the from camera', () => {
    const c = lerpCamera(a, b, 0)
    expect(c.position).toEqual(a.position)
    expect(c.fov).toBeCloseTo(a.fov, 9)
  })

  it('t=1 returns the to state', () => {
    const c = lerpCamera(a, b, 1)
    expect(c.position).toEqual(b.position)
    expect(c.fov).toBeCloseTo(b.fov, 9)
  })

  it('t=0.5 interpolates fov + position', () => {
    const c = lerpCamera(a, b, 0.5)
    expect(c.fov).toBeCloseTo((a.fov + b.fov) / 2, 9)
    expect(c.position[0]).toBeCloseTo((a.position[0] + b.position[0]) / 2, 9)
  })

  it('mode + target snap at t>=0.5', () => {
    expect(lerpCamera(a, b, 0.49).mode).toBe(a.mode)
    expect(lerpCamera(a, b, 0.5).mode).toBe(b.mode)
  })
})
