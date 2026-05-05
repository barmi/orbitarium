import type { Vector3 } from 'three'

import { type PositionICRF, positionICRF } from '@/ephemeris'
import { type DistancePolicy, positionToScene } from '@/scale'

import type { SceneAnchor } from './types'
import { sceneToVector3 } from './world'

export type SceneAnchorContext =
  | { readonly kind: 'ssb' }
  | { readonly kind: 'heliocentric'; readonly sunSsb: PositionICRF }
  | { readonly kind: 'body-centric'; readonly bodySsb: PositionICRF }

export const SSB_ANCHOR: SceneAnchorContext = { kind: 'ssb' }

export function ssbAnchor(): SceneAnchorContext {
  return SSB_ANCHOR
}

export function heliocentricAnchor(sunSsb: PositionICRF): SceneAnchorContext {
  return { kind: 'heliocentric', sunSsb }
}

export function bodyCentricAnchor(bodySsb: PositionICRF): SceneAnchorContext {
  return { kind: 'body-centric', bodySsb }
}

export function anchorKind(anchor: SceneAnchorContext): SceneAnchor {
  return anchor.kind
}

export function applyAnchor(positionIcrf: PositionICRF, anchor: SceneAnchorContext): PositionICRF {
  switch (anchor.kind) {
    case 'ssb':
      return positionIcrf
    case 'heliocentric':
      return positionICRF(
        positionIcrf[0] - anchor.sunSsb[0],
        positionIcrf[1] - anchor.sunSsb[1],
        positionIcrf[2] - anchor.sunSsb[2],
      )
    case 'body-centric':
      return positionICRF(
        positionIcrf[0] - anchor.bodySsb[0],
        positionIcrf[1] - anchor.bodySsb[1],
        positionIcrf[2] - anchor.bodySsb[2],
      )
  }
}

export function positionToWorld(
  positionIcrf: PositionICRF,
  policy: DistancePolicy,
  anchor: SceneAnchorContext,
): Vector3 {
  return sceneToVector3(positionToScene(applyAnchor(positionIcrf, anchor), policy))
}
