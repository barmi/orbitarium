import { useEffect, useMemo, useRef } from 'react'
import {
  IcosahedronGeometry,
  type InstancedMesh as InstancedMeshType,
  Matrix4,
  MeshBasicMaterial,
} from 'three'

import { meters } from '@/astro'
import { type PositionICRF, positionICRF } from '@/ephemeris'
import { applyAnchor, type SceneAnchorContext, sceneToVector3 } from '@/render'
import { type DistancePolicy, positionToScene } from '@/scale'

import { ASTEROID_BELT_DEFAULT_COUNT } from './constants'

export interface AsteroidBeltProps {
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
  readonly count?: number
  readonly seed?: number
  readonly color?: string
  readonly bodySceneRadius?: number
}

const AU_M = 149_597_870_700
const SMA_MIN_AU = 2.2
const SMA_MAX_AU = 3.3
const ECC_MAX = 0.2
const INC_MAX_RAD = (15 * Math.PI) / 180
const DEFAULT_COLOR = '#7a6c5a'

/**
 * Mulberry32 — 32-bit deterministic PRNG. Same algorithm in Python (P4
 * fixture generator) so the belt distribution is reproducible cross-runtime.
 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface AsteroidPosition {
  readonly position: PositionICRF
}

function generateAsteroids(count: number, seed: number): AsteroidPosition[] {
  const rng = makeRng(seed)
  const out: AsteroidPosition[] = []
  for (let i = 0; i < count; i++) {
    const sma = SMA_MIN_AU + rng() * (SMA_MAX_AU - SMA_MIN_AU)
    const ecc = rng() * ECC_MAX
    const inc = (rng() * 2 - 1) * INC_MAX_RAD
    const trueAnom = rng() * 2 * Math.PI
    const r = (sma * (1 - ecc * ecc)) / (1 + ecc * Math.cos(trueAnom))
    const xPlane = r * Math.cos(trueAnom)
    const yPlane = r * Math.sin(trueAnom)
    // Tilt by inc around x-axis (simplified — no RAAN/argp)
    const x = xPlane
    const y = yPlane * Math.cos(inc)
    const z = yPlane * Math.sin(inc)
    out.push({
      position: positionICRF(meters(x * AU_M), meters(y * AU_M), meters(z * AU_M)),
    })
  }
  return out
}

export default function AsteroidBelt({
  distancePolicy,
  anchor,
  count = ASTEROID_BELT_DEFAULT_COUNT,
  seed = 1,
  color = DEFAULT_COLOR,
  bodySceneRadius = 0.005,
}: AsteroidBeltProps) {
  const meshRef = useRef<InstancedMeshType>(null)

  const asteroids = useMemo(() => generateAsteroids(count, seed), [count, seed])

  const geometry = useMemo(() => new IcosahedronGeometry(bodySceneRadius, 0), [bodySceneRadius])
  const material = useMemo(() => new MeshBasicMaterial({ color }), [color])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const matrix = new Matrix4()
    for (let i = 0; i < asteroids.length; i++) {
      const anchored = applyAnchor(asteroids[i]!.position, anchor)
      const scene = positionToScene(anchored, distancePolicy)
      const v = sceneToVector3(scene)
      matrix.makeTranslation(v.x, v.y, v.z)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [asteroids, anchor, distancePolicy])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, asteroids.length]}
      frustumCulled={false}
    />
  )
}
