export interface PerfMetrics {
  readonly fps: number
  readonly drawCalls: number
  readonly triangles: number
  readonly gpuMemoryMb: number
}

export interface PerfSample extends PerfMetrics {
  readonly timestampMs: number
}

export interface PerfWindow {
  readonly samples: readonly PerfSample[]
  readonly windowMs: number
}
