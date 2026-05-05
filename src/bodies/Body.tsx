import { useEffect, useMemo, useRef, useState } from 'react'
import { type Mesh, SRGBColorSpace, type Texture, TextureLoader } from 'three'

import { getIauRotationModel, type JdTdb } from '@/astro'

import { createPlanetMaterial, createSunMaterial } from './material'
import { bodyOrientationQuaternion } from './rotation'
import type { BodyDefinition } from './types'

export interface BodyProps {
  readonly body: BodyDefinition
  readonly jdTdb: JdTdb
  readonly worldPosition: readonly [number, number, number]
  readonly worldRadius: number
  readonly geometrySegments?: readonly [number, number]
}

const DEFAULT_SEGMENTS: readonly [number, number] = [64, 32]

/**
 * Generic celestial body mesh.
 *
 * - Texture loads asynchronously; on 404 / network failure the material falls
 *   back to ``body.fallbackColor`` (P3 #Body 위치 prop + texture fallback).
 * - IAU rotation matrix is applied to ``mesh.quaternion`` whenever ``jdTdb``
 *   or the body changes — re-evaluation is cheap (~µs) but skipped while time
 *   is paused (P3 #rotation 갱신 정책).
 * - Sun is rendered with ``MeshBasicMaterial`` (lighting-agnostic). All other
 *   bodies use ``MeshStandardMaterial`` so the Work 5 PointLight illuminates
 *   them.
 */
export default function Body({
  body,
  jdTdb,
  worldPosition,
  worldRadius,
  geometrySegments = DEFAULT_SEGMENTS,
}: BodyProps) {
  const meshRef = useRef<Mesh>(null)
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    if (!body.textureUrl) {
      setTexture(null)
      return
    }
    let cancelled = false
    const loader = new TextureLoader()
    loader.load(
      body.textureUrl,
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
  }, [body.textureUrl])

  const material = useMemo(() => {
    return body.kind === 'sun'
      ? createSunMaterial(texture, body.fallbackColor)
      : createPlanetMaterial(texture, body.fallbackColor)
  }, [body.fallbackColor, body.kind, texture])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const model = getIauRotationModel(body.rotationModelKey)
    if (!model) return
    const q = bodyOrientationQuaternion(model, jdTdb)
    mesh.quaternion.copy(q)
  }, [body.rotationModelKey, jdTdb])

  return (
    <mesh ref={meshRef} position={worldPosition}>
      <sphereGeometry args={[worldRadius, geometrySegments[0], geometrySegments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
