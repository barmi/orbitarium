import { describe, expect, it } from 'vitest'

import { average, createEmptyWindow, p99, pushSample } from '@/perf'

describe('perf window', () => {
  it('createEmptyWindow returns 0 samples', () => {
    const w = createEmptyWindow()
    expect(w.samples).toHaveLength(0)
  })

  it('pushSample adds + trims samples outside window', () => {
    const w = createEmptyWindow(1000)
    const w1 = pushSample(w, { fps: 60, drawCalls: 10, triangles: 1000, gpuMemoryMb: 100 }, 1000)
    expect(w1.samples).toHaveLength(1)
    const w2 = pushSample(w1, { fps: 30, drawCalls: 20, triangles: 2000, gpuMemoryMb: 200 }, 2500)
    // First sample (t=1000) is now outside [1500, 2500] window
    expect(w2.samples).toHaveLength(1)
    expect(w2.samples[0]!.fps).toBe(30)
  })

  it('average computes mean across samples', () => {
    let w = createEmptyWindow()
    w = pushSample(w, { fps: 60, drawCalls: 10, triangles: 1000, gpuMemoryMb: 100 }, 1000)
    w = pushSample(w, { fps: 30, drawCalls: 20, triangles: 2000, gpuMemoryMb: 200 }, 1100)
    const avg = average(w)
    expect(avg.fps).toBeCloseTo(45, 9)
    expect(avg.drawCalls).toBeCloseTo(15, 9)
  })

  it('p99 picks near-top sample', () => {
    let w = createEmptyWindow()
    for (let i = 0; i < 100; i++) {
      w = pushSample(w, { fps: i, drawCalls: 0, triangles: 0, gpuMemoryMb: 0 }, 1000 + i)
    }
    expect(p99(w, 'fps')).toBeGreaterThanOrEqual(98)
  })

  it('average returns zeros on empty', () => {
    const avg = average(createEmptyWindow())
    expect(avg.fps).toBe(0)
  })
})
