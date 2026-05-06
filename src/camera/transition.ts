import type { CameraState } from './types'

export function smoothstep(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t * t * (3 - 2 * t)
}

function lerpVec3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/**
 * Cinematic transition between two camera states (smoothstep + linear lerp).
 * Mode + targetNaifId snap to ``to`` at t >= 0.5 — they're discrete.
 */
export function lerpCamera(from: CameraState, to: CameraState, t: number): CameraState {
  const eased = smoothstep(t)
  return {
    mode: t >= 0.5 ? to.mode : from.mode,
    targetNaifId: t >= 0.5 ? to.targetNaifId : from.targetNaifId,
    position: lerpVec3(from.position, to.position, eased),
    lookAt: lerpVec3(from.lookAt, to.lookAt, eased),
    fov: from.fov + (to.fov - from.fov) * eased,
  }
}

export const DEFAULT_TRANSITION_MS = 1500
