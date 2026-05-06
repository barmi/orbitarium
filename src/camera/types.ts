export type CameraMode = 'free-fly' | 'focus' | 'follow' | 'pov'

export interface CameraState {
  readonly mode: CameraMode
  readonly targetNaifId: number | null
  readonly position: readonly [number, number, number]
  readonly lookAt: readonly [number, number, number]
  readonly fov: number
}

export type CameraAction =
  | { readonly type: 'setMode'; readonly mode: CameraMode; readonly targetNaifId?: number | null }
  | { readonly type: 'setPosition'; readonly position: readonly [number, number, number] }
  | { readonly type: 'setLookAt'; readonly lookAt: readonly [number, number, number] }
  | { readonly type: 'setFov'; readonly fov: number }
  | { readonly type: 'applyPreset'; readonly preset: CameraState }

export interface CameraPreset {
  readonly id: string
  readonly label: string
  readonly state: CameraState
}
