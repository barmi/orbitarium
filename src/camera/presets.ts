import type { CameraPreset } from './types'

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: 'ecliptic_top',
    label: 'Ecliptic top-down',
    state: {
      mode: 'free-fly',
      targetNaifId: null,
      position: [0, 50, 0],
      lookAt: [0, 0, 0],
      fov: 50,
    },
  },
  {
    id: 'sun_pov',
    label: 'Sun POV',
    state: {
      mode: 'pov',
      targetNaifId: 10,
      position: [0, 0, 0],
      lookAt: [1, 0, 0],
      fov: 90,
    },
  },
  {
    id: 'earth_focus',
    label: 'Earth focus',
    state: {
      mode: 'focus',
      targetNaifId: 399,
      position: [3, 1, 3],
      lookAt: [1, 0, 0],
      fov: 35,
    },
  },
  {
    id: 'voyager_1',
    label: 'Voyager 1 vantage',
    state: {
      mode: 'free-fly',
      targetNaifId: null,
      position: [-150, 30, -150],
      lookAt: [0, 0, 0],
      fov: 25,
    },
  },
]
