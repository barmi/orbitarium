import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DoubleSide,
  type Mesh,
  RingGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three'

import { getIauRotationModel, type JdTdb } from '@/astro'

import { bodyOrientationQuaternion } from './rotation'
import type { BodyDefinition } from './types'

export interface SaturnRingsProps {
  readonly body: BodyDefinition
  readonly jdTdb: JdTdb
  readonly innerWorldRadius: number
  readonly outerWorldRadius: number
  readonly textureUrl: string
  readonly worldPosition: readonly [number, number, number]
  readonly segments?: number
}

const DEFAULT_RING_COLOR = '#c0a070'
const DEFAULT_RING_OPACITY = 0.45

/**
 * Saturn rings — disk in body's equatorial plane (Work 6 P4).
 *
 * - ``RingGeometry(inner, outer, segments=128)`` lies in the local XY plane.
 *   Since the IAU body-fixed frame's XY = equatorial, the same rotation
 *   matrix that orients the body also orients the rings — we apply the same
 *   quaternion (computed identically to ``Body``) to keep the two in sync.
 * - UV coordinates of ``RingGeometry`` default to angular sweep; we override
 *   with radial UV (inner=0 / outer=1) so a 1D radial texture (Solar System
 *   Scope's ``saturn-rings.png``) maps as expected.
 * - Texture missing → flat translucent disk (alpha 0.45, color #c0a070). No
 *   self-shadow / Saturn shadow on the rings — Work 11 polish.
 */
export default function SaturnRings({
  body,
  jdTdb,
  innerWorldRadius,
  outerWorldRadius,
  textureUrl,
  worldPosition,
  segments = 128,
}: SaturnRingsProps) {
  const meshRef = useRef<Mesh>(null)
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new TextureLoader()
    loader.load(
      textureUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [textureUrl])

  const geometry = useMemo(() => {
    const geo = new RingGeometry(innerWorldRadius, outerWorldRadius, segments, 1)
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    if (pos && uv) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const r = Math.sqrt(x * x + y * y)
        const t = (r - innerWorldRadius) / (outerWorldRadius - innerWorldRadius)
        uv.setXY(i, t, 0.5)
      }
      uv.needsUpdate = true
    }
    return geo
  }, [innerWorldRadius, outerWorldRadius, segments])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const model = getIauRotationModel(body.rotationModelKey)
    if (!model) return
    mesh.quaternion.copy(bodyOrientationQuaternion(model, jdTdb))
  }, [body.rotationModelKey, jdTdb])

  return (
    <mesh ref={meshRef} geometry={geometry} position={worldPosition}>
      <meshBasicMaterial
        map={texture ?? undefined}
        alphaMap={texture ?? undefined}
        color={texture ? '#ffffff' : DEFAULT_RING_COLOR}
        transparent
        opacity={texture ? 1 : DEFAULT_RING_OPACITY}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
