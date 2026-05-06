import type { PredictConfig, TrailConfig } from './types'

/** 1 mm position tolerance (matches Work 4) for round-trip checks. */
export const ORBIT_TOL_MM = 1
/** 100 m end-to-end tolerance for polyline reconstruction (interpolation accepted). */
export const ORBIT_TOL_M = 100

export const DEFAULT_TRAIL_DAYS = 365
export const DEFAULT_PREDICT_DAYS = 365
export const DEFAULT_SAMPLE_COUNT = 256

export const DEFAULT_TRAIL_CONFIG: TrailConfig = {
  durationDays: DEFAULT_TRAIL_DAYS,
  sampleCount: DEFAULT_SAMPLE_COUNT,
}

export const DEFAULT_PREDICT_CONFIG: PredictConfig = {
  durationDays: DEFAULT_PREDICT_DAYS,
  sampleCount: DEFAULT_SAMPLE_COUNT,
}

export const ASTEROID_BELT_DEFAULT_COUNT = 256
