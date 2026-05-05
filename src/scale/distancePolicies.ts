import { AU, type Meters } from '@/astro'

import type { DistancePolicy } from './types'
import { type SceneUnit, sceneUnit } from './types'

const meters = (n: number): Meters => n as Meters

export const LinearAuPolicy: DistancePolicy = {
  name: 'linear-au',
  forward(distanceM: Meters): SceneUnit {
    return sceneUnit(distanceM / AU)
  },
  inverse(distanceScene: SceneUnit): Meters {
    return meters(distanceScene * AU)
  },
  metadata: { auMeters: AU },
}

export const PIECEWISE_INPUT_BREAKS_AU = [0.4, 5, 50] as const
export const PIECEWISE_OUTPUT_BREAKS_SCENE = [0.4, 1.5, 3.0] as const

function piecewiseForwardAu(distanceAu: number): number {
  let prevIn = 0
  let prevOut = 0
  for (let i = 0; i < PIECEWISE_INPUT_BREAKS_AU.length; i++) {
    const inBreak = PIECEWISE_INPUT_BREAKS_AU[i]!
    const outBreak = PIECEWISE_OUTPUT_BREAKS_SCENE[i]!
    if (distanceAu <= inBreak) {
      const t = (distanceAu - prevIn) / (inBreak - prevIn)
      return prevOut + t * (outBreak - prevOut)
    }
    prevIn = inBreak
    prevOut = outBreak
  }
  const lastIn = PIECEWISE_INPUT_BREAKS_AU[PIECEWISE_INPUT_BREAKS_AU.length - 1]!
  const lastOut = PIECEWISE_OUTPUT_BREAKS_SCENE[PIECEWISE_OUTPUT_BREAKS_SCENE.length - 1]!
  const prevInLast = PIECEWISE_INPUT_BREAKS_AU[PIECEWISE_INPUT_BREAKS_AU.length - 2]!
  const prevOutLast = PIECEWISE_OUTPUT_BREAKS_SCENE[PIECEWISE_OUTPUT_BREAKS_SCENE.length - 2]!
  const slope = (lastOut - prevOutLast) / (lastIn - prevInLast)
  return lastOut + (distanceAu - lastIn) * slope
}

function piecewiseInverseScene(distanceScene: number): number {
  let prevIn = 0
  let prevOut = 0
  for (let i = 0; i < PIECEWISE_OUTPUT_BREAKS_SCENE.length; i++) {
    const inBreak = PIECEWISE_INPUT_BREAKS_AU[i]!
    const outBreak = PIECEWISE_OUTPUT_BREAKS_SCENE[i]!
    if (distanceScene <= outBreak) {
      const t = (distanceScene - prevOut) / (outBreak - prevOut)
      return prevIn + t * (inBreak - prevIn)
    }
    prevIn = inBreak
    prevOut = outBreak
  }
  const lastIn = PIECEWISE_INPUT_BREAKS_AU[PIECEWISE_INPUT_BREAKS_AU.length - 1]!
  const lastOut = PIECEWISE_OUTPUT_BREAKS_SCENE[PIECEWISE_OUTPUT_BREAKS_SCENE.length - 1]!
  const prevInLast = PIECEWISE_INPUT_BREAKS_AU[PIECEWISE_INPUT_BREAKS_AU.length - 2]!
  const prevOutLast = PIECEWISE_OUTPUT_BREAKS_SCENE[PIECEWISE_OUTPUT_BREAKS_SCENE.length - 2]!
  const slope = (lastOut - prevOutLast) / (lastIn - prevInLast)
  return lastIn + (distanceScene - lastOut) / slope
}

export const PiecewiseMonotonicPolicy: DistancePolicy = {
  name: 'piecewise-monotonic',
  forward(distanceM: Meters): SceneUnit {
    return sceneUnit(piecewiseForwardAu(distanceM / AU))
  },
  inverse(distanceScene: SceneUnit): Meters {
    return meters(piecewiseInverseScene(distanceScene) * AU)
  },
  metadata: {
    inputBreaksAu: PIECEWISE_INPUT_BREAKS_AU,
    outputBreaksScene: PIECEWISE_OUTPUT_BREAKS_SCENE,
  },
}

export const LOGARITHMIC_R0_M = AU

export const LogarithmicPolicy: DistancePolicy = {
  name: 'logarithmic',
  forward(distanceM: Meters): SceneUnit {
    return sceneUnit(Math.log(1 + distanceM / LOGARITHMIC_R0_M))
  },
  inverse(distanceScene: SceneUnit): Meters {
    return meters((Math.exp(distanceScene) - 1) * LOGARITHMIC_R0_M)
  },
  metadata: { r0Meters: LOGARITHMIC_R0_M },
}

export const DISTANCE_POLICIES: readonly DistancePolicy[] = [
  LinearAuPolicy,
  PiecewiseMonotonicPolicy,
  LogarithmicPolicy,
]

export function getDistancePolicy(name: string): DistancePolicy {
  const policy = DISTANCE_POLICIES.find((p) => p.name === name)
  if (!policy) {
    throw new Error(`unknown distance policy: ${name}`)
  }
  return policy
}
