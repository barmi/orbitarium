import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import { RENDER_DEFAULTS } from './constants'

export default function HomeScene() {
  return (
    <>
      <ambientLight intensity={RENDER_DEFAULTS.ambientIntensity} />
      <pointLight
        position={[3, 2, 4]}
        intensity={RENDER_DEFAULTS.sunIntensity}
        color="#ffffff"
        decay={0}
      />
      <RotatingSphere />
      <SingleStar />
    </>
  )
}

function RotatingSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x += delta * 0.08
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#9bb6ff" roughness={0.7} metalness={0.05} />
    </mesh>
  )
}

function SingleStar() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([3.2, 1.4, -1.8]), 3))
    return geo
  }, [])

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation />
    </points>
  )
}
