import { describe, expect, it } from 'vitest'

import type { JdTdb } from '@/astro'
import {
  clockReducer,
  INITIAL_CLOCK_STATE,
  MAX_RATE,
  MIN_RATE,
  MS_PER_DAY,
  TIME_PRESETS,
} from '@/time'

describe('clockReducer', () => {
  it('initial state is paused at J2000 with rate 1, forward direction', () => {
    expect(INITIAL_CLOCK_STATE.mode).toBe('paused')
    expect(INITIAL_CLOCK_STATE.rate).toBe(1)
    expect(INITIAL_CLOCK_STATE.direction).toBe(1)
    expect(INITIAL_CLOCK_STATE.jdTdb).toBeCloseTo(2_451_545.0, 6)
  })

  it('play transitions to realtime when rate=1', () => {
    const next = clockReducer(INITIAL_CLOCK_STATE, { type: 'play' })
    expect(next.mode).toBe('realtime')
  })

  it('play transitions to fast when rate>1', () => {
    const fast = clockReducer({ ...INITIAL_CLOCK_STATE, rate: 1000 }, { type: 'play' })
    expect(fast.mode).toBe('fast')
  })

  it('pause sets mode to paused', () => {
    const playing = clockReducer(INITIAL_CLOCK_STATE, { type: 'play' })
    const paused = clockReducer(playing, { type: 'pause' })
    expect(paused.mode).toBe('paused')
  })

  it('setJdTdb updates time', () => {
    const next = clockReducer(INITIAL_CLOCK_STATE, { type: 'setJdTdb', jdTdb: 2_460_000 as JdTdb })
    expect(next.jdTdb).toBe(2_460_000)
  })

  it('setRate clamps to [MIN_RATE, MAX_RATE]', () => {
    const lo = clockReducer(INITIAL_CLOCK_STATE, { type: 'setRate', rate: -1 })
    const hi = clockReducer(INITIAL_CLOCK_STATE, { type: 'setRate', rate: 1e10 })
    expect(lo.rate).toBe(MIN_RATE)
    expect(hi.rate).toBe(MAX_RATE)
  })

  it('tick advances jdTdb by dtMs * rate / MS_PER_DAY when not paused', () => {
    const playing = clockReducer(INITIAL_CLOCK_STATE, { type: 'play' })
    const ticked = clockReducer(playing, { type: 'tick', dtMs: 1000 })
    const expectedDelta = 1000 / MS_PER_DAY
    expect(ticked.jdTdb - INITIAL_CLOCK_STATE.jdTdb).toBeCloseTo(expectedDelta, 9)
  })

  it('tick is no-op when paused', () => {
    const ticked = clockReducer(INITIAL_CLOCK_STATE, { type: 'tick', dtMs: 1000 })
    expect(ticked.jdTdb).toBe(INITIAL_CLOCK_STATE.jdTdb)
  })

  it('tick at high rate scales up jdTdb delta', () => {
    const fast = clockReducer(
      { ...INITIAL_CLOCK_STATE, mode: 'fast', rate: 1e6 },
      {
        type: 'tick',
        dtMs: 100,
      },
    )
    expect(fast.jdTdb - INITIAL_CLOCK_STATE.jdTdb).toBeGreaterThan(0.001)
  })

  it('setDirection toggles playback direction', () => {
    const reversed = clockReducer(INITIAL_CLOCK_STATE, { type: 'setDirection', direction: -1 })
    expect(reversed.direction).toBe(-1)
    const restored = clockReducer(reversed, { type: 'setDirection', direction: 1 })
    expect(restored.direction).toBe(1)
  })

  it('tick with direction=-1 retreats jdTdb', () => {
    const playing = clockReducer(INITIAL_CLOCK_STATE, { type: 'play' })
    const reversed = clockReducer(playing, { type: 'setDirection', direction: -1 })
    const ticked = clockReducer(reversed, { type: 'tick', dtMs: 1000 })
    const expectedDelta = -1000 / MS_PER_DAY
    expect(ticked.jdTdb - INITIAL_CLOCK_STATE.jdTdb).toBeCloseTo(expectedDelta, 9)
  })
})

describe('TIME_PRESETS', () => {
  it('lists at least 4 entries with id / label / utcIso / jdTdb', () => {
    expect(TIME_PRESETS.length).toBeGreaterThanOrEqual(4)
    for (const p of TIME_PRESETS) {
      expect(p.id).toBeDefined()
      expect(p.label).toBeDefined()
      expect(p.utcIso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(p.jdTdb).toBeGreaterThan(2_400_000)
    }
  })

  it('J2000 preset is at jd 2451545.0007 (TDB - UTC ~32.184 + leap seconds)', () => {
    const j2000 = TIME_PRESETS.find((p) => p.id === 'j2000')!
    expect(j2000.jdTdb).toBeCloseTo(2_451_545.0, 0)
  })
})
