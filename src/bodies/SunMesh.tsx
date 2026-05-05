import { useEffect, useState } from 'react'
import { AdditiveBlending, type Texture, TextureLoader } from 'three'

import type { JdTdb } from '@/astro'

import Body from './Body'
import type { BodyDefinition } from './types'

export interface SunMeshProps {
  readonly body: BodyDefinition
  readonly jdTdb: JdTdb
  readonly worldPosition: readonly [number, number, number]
  readonly worldRadius: number
  readonly haloUrl?: string
  readonly haloScale?: number
}

/**
 * Sun mesh + additive halo sprite (P3 #Sun halo).
 *
 * Halo is a screen-aligned sprite scaled to ``haloScale`` × world radius. If
 * the halo texture is missing (404), the sprite is omitted silently.
 */
export default function SunMesh({
  body,
  jdTdb,
  worldPosition,
  worldRadius,
  haloUrl = '/data/textures/sun-halo.png',
  haloScale = 4,
}: SunMeshProps) {
  const [haloTexture, setHaloTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = new TextureLoader()
    loader.load(
      haloUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        setHaloTexture(tex)
      },
      undefined,
      () => {
        if (!cancelled) setHaloTexture(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [haloUrl])

  const haloRadius = worldRadius * haloScale

  return (
    <group position={worldPosition}>
      <Body body={body} jdTdb={jdTdb} worldPosition={[0, 0, 0]} worldRadius={worldRadius} />
      {haloTexture && (
        <sprite scale={[haloRadius, haloRadius, haloRadius]}>
          <spriteMaterial
            map={haloTexture}
            color="#ffd166"
            blending={AdditiveBlending}
            depthWrite={false}
            transparent
          />
        </sprite>
      )}
    </group>
  )
}
