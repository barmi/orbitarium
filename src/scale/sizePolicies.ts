import { AU, type Meters } from '@/astro'

import { BODY_MEAN_EQUATORIAL_RADIUS_M } from './constants'
import type { SizePolicy, SizeScene } from './types'
import { sizeScene } from './types'

const meters = (n: number): Meters => n as Meters

export const UNIFORM_DEFAULT_K = 1

export const UniformPolicy: SizePolicy = {
  name: 'uniform',
  forward(radiusM: Meters): SizeScene {
    return sizeScene((radiusM / AU) * UNIFORM_DEFAULT_K)
  },
  inverse(radiusScene: SizeScene): Meters {
    return meters((radiusScene / UNIFORM_DEFAULT_K) * AU)
  },
  metadata: { k: UNIFORM_DEFAULT_K, mode: 'r/AU' },
}

export const LOGMAG_R0_M = BODY_MEAN_EQUATORIAL_RADIUS_M[399]!
export const LOGMAG_K = 0.5
export const LOGMAG_BASE_SCENE = 0.005

export const LogarithmicMagnificationPolicy: SizePolicy = {
  name: 'logarithmic-magnification',
  forward(radiusM: Meters): SizeScene {
    return sizeScene(LOGMAG_BASE_SCENE + LOGMAG_K * Math.log10(1 + radiusM / LOGMAG_R0_M))
  },
  inverse(radiusScene: SizeScene): Meters {
    return meters(LOGMAG_R0_M * (10 ** ((radiusScene - LOGMAG_BASE_SCENE) / LOGMAG_K) - 1))
  },
  metadata: { r0Meters: LOGMAG_R0_M, k: LOGMAG_K, baseScene: LOGMAG_BASE_SCENE },
}

export const MINMAX_R_MIN_M = BODY_MEAN_EQUATORIAL_RADIUS_M[999]!
export const MINMAX_R_MAX_M = BODY_MEAN_EQUATORIAL_RADIUS_M[10]!
export const MINMAX_MIN_SCENE = 0.005
export const MINMAX_MAX_SCENE = 5

const MINMAX_LOG_R_MIN = Math.log10(MINMAX_R_MIN_M)
const MINMAX_LOG_R_MAX = Math.log10(MINMAX_R_MAX_M)
const MINMAX_LOG_R_SPAN = MINMAX_LOG_R_MAX - MINMAX_LOG_R_MIN
const MINMAX_SCENE_SPAN = MINMAX_MAX_SCENE - MINMAX_MIN_SCENE

export const MinMaxClampPolicy: SizePolicy = {
  name: 'minmax-clamp',
  forward(radiusM: Meters): SizeScene {
    const t = (Math.log10(radiusM) - MINMAX_LOG_R_MIN) / MINMAX_LOG_R_SPAN
    return sizeScene(MINMAX_MIN_SCENE + t * MINMAX_SCENE_SPAN)
  },
  inverse(radiusScene: SizeScene): Meters {
    const t = (radiusScene - MINMAX_MIN_SCENE) / MINMAX_SCENE_SPAN
    return meters(10 ** (MINMAX_LOG_R_MIN + t * MINMAX_LOG_R_SPAN))
  },
  metadata: {
    rMinMeters: MINMAX_R_MIN_M,
    rMaxMeters: MINMAX_R_MAX_M,
    minScene: MINMAX_MIN_SCENE,
    maxScene: MINMAX_MAX_SCENE,
  },
}

export const SIZE_POLICIES: readonly SizePolicy[] = [
  UniformPolicy,
  LogarithmicMagnificationPolicy,
  MinMaxClampPolicy,
]

export function getSizePolicy(name: string): SizePolicy {
  const policy = SIZE_POLICIES.find((p) => p.name === name)
  if (!policy) {
    throw new Error(`unknown size policy: ${name}`)
  }
  return policy
}

export function radiusToScene(radiusM: Meters, policy: SizePolicy): SizeScene {
  return policy.forward(radiusM)
}

export function sceneToRadius(radiusScene: SizeScene, policy: SizePolicy): Meters {
  return policy.inverse(radiusScene)
}
