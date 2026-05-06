import type { CameraAction, CameraState } from './types'

export const INITIAL_CAMERA_STATE: CameraState = {
  mode: 'free-fly',
  targetNaifId: null,
  position: [4, 3, 7],
  lookAt: [0, 0, 0],
  fov: 50,
}

function clampFov(f: number): number {
  if (Number.isNaN(f)) return 50
  if (f < 10) return 10
  if (f > 120) return 120
  return f
}

export function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'setMode':
      return {
        ...state,
        mode: action.mode,
        targetNaifId: action.targetNaifId ?? state.targetNaifId,
      }
    case 'setPosition':
      return { ...state, position: action.position }
    case 'setLookAt':
      return { ...state, lookAt: action.lookAt }
    case 'setFov':
      return { ...state, fov: clampFov(action.fov) }
    case 'applyPreset':
      return { ...action.preset }
  }
}
