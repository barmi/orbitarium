import { LineBasicMaterial, LineDashedMaterial } from 'three'

export interface OrbitMaterialOptions {
  readonly color?: string
  readonly opacity?: number
}

export function createTrailMaterial(options: OrbitMaterialOptions = {}): LineBasicMaterial {
  return new LineBasicMaterial({
    color: options.color ?? '#88aaff',
    transparent: true,
    opacity: options.opacity ?? 0.85,
    depthWrite: false,
  })
}

export function createPredictMaterial(options: OrbitMaterialOptions = {}): LineDashedMaterial {
  return new LineDashedMaterial({
    color: options.color ?? '#88aaff',
    transparent: true,
    opacity: options.opacity ?? 0.5,
    depthWrite: false,
    dashSize: 0.05,
    gapSize: 0.05,
  })
}
