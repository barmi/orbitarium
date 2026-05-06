import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'

import { getBodyBySlug } from '@/bodies'
import type { PositionICRF } from '@/ephemeris'
import { positionToWorld, type SceneAnchorContext } from '@/render'
import { type DistancePolicy } from '@/scale'

import {
  CAMERA_DISTANCE_MAX,
  CAMERA_DISTANCE_MIN,
  CAMERA_PHI_MAX,
  CAMERA_PHI_MIN,
  DEFAULT_CAMERA_DISTANCE_SCENE,
  DEFAULT_CAMERA_PHI_RAD,
  DEFAULT_CAMERA_THETA_RAD,
} from './constants'

interface Props {
  readonly focusedSlug: string | null
  readonly positions: ReadonlyMap<number, PositionICRF>
  readonly distancePolicy: DistancePolicy
  readonly anchor: SceneAnchorContext
}

/**
 * Camera controller — orbits around the focused body (or SSB origin if no
 * focus). Drag to rotate, scroll to zoom. Frame-by-frame updates keep the
 * camera glued to a moving target while time advances.
 */
export default function CameraController({
  focusedSlug,
  positions,
  distancePolicy,
  anchor,
}: Props) {
  const { camera, gl } = useThree()
  const phi = useRef(DEFAULT_CAMERA_PHI_RAD)
  const theta = useRef(DEFAULT_CAMERA_THETA_RAD)
  const distance = useRef(DEFAULT_CAMERA_DISTANCE_SCENE)

  // Drag-to-rotate + wheel-to-zoom event listeners on the canvas.
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      ;(e.target as Element | null)?.setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      theta.current -= dx * 0.005
      const next = phi.current - dy * 0.005
      phi.current = Math.max(CAMERA_PHI_MIN, Math.min(CAMERA_PHI_MAX, next))
    }
    const onPointerUp = () => {
      dragging = false
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = 1 + e.deltaY * 0.001
      const next = distance.current * factor
      distance.current = Math.max(CAMERA_DISTANCE_MIN, Math.min(CAMERA_DISTANCE_MAX, next))
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  // Smoothly recenter on a newly-focused body.
  useEffect(() => {
    // Bigger zoom-in when focusing a specific planet.
    if (focusedSlug) {
      distance.current = Math.min(distance.current, 4)
    } else {
      distance.current = Math.max(distance.current, 6)
    }
  }, [focusedSlug])

  const targetWorld = useMemo<readonly [number, number, number]>(() => {
    if (!focusedSlug) return [0, 0, 0]
    const body = getBodyBySlug(focusedSlug)
    if (!body) return [0, 0, 0]
    const pos = positions.get(body.naifId)
    if (!pos) return [0, 0, 0]
    const v = positionToWorld(pos, distancePolicy, anchor)
    return [v.x, v.y, v.z]
  }, [focusedSlug, positions, distancePolicy, anchor])

  useFrame(() => {
    const sinPhi = Math.sin(phi.current)
    const cosPhi = Math.cos(phi.current)
    const x = targetWorld[0] + distance.current * sinPhi * Math.cos(theta.current)
    const y = targetWorld[1] + distance.current * cosPhi
    const z = targetWorld[2] + distance.current * sinPhi * Math.sin(theta.current)
    camera.position.set(x, y, z)
    camera.lookAt(targetWorld[0], targetWorld[1], targetWorld[2])
  })

  return null
}
