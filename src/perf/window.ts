import type { PerfMetrics, PerfSample, PerfWindow } from './types'

export const DEFAULT_PERF_WINDOW_MS = 5000

export function createEmptyWindow(windowMs: number = DEFAULT_PERF_WINDOW_MS): PerfWindow {
  return { samples: [], windowMs }
}

export function pushSample(
  window: PerfWindow,
  metrics: PerfMetrics,
  timestampMs: number = Date.now(),
): PerfWindow {
  const cutoff = timestampMs - window.windowMs
  const trimmed = window.samples.filter((s) => s.timestampMs >= cutoff)
  const sample: PerfSample = { ...metrics, timestampMs }
  return { ...window, samples: [...trimmed, sample] }
}

export function average(window: PerfWindow): PerfMetrics {
  if (window.samples.length === 0) {
    return { fps: 0, drawCalls: 0, triangles: 0, gpuMemoryMb: 0 }
  }
  let fps = 0
  let dc = 0
  let tri = 0
  let mem = 0
  for (const s of window.samples) {
    fps += s.fps
    dc += s.drawCalls
    tri += s.triangles
    mem += s.gpuMemoryMb
  }
  const n = window.samples.length
  return {
    fps: fps / n,
    drawCalls: dc / n,
    triangles: tri / n,
    gpuMemoryMb: mem / n,
  }
}

export function p99(window: PerfWindow, key: keyof PerfMetrics): number {
  if (window.samples.length === 0) return 0
  const sorted = [...window.samples].map((s) => s[key]).sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * 0.99)
  return sorted[Math.min(idx, sorted.length - 1)]!
}
