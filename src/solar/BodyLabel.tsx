import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, type Sprite, SRGBColorSpace } from 'three'

interface Props {
  readonly text: string
  readonly worldPosition: readonly [number, number, number]
  /** World-space radius of the body the label refers to — pushes the label
   * just past the body silhouette in screen space. Default 0. */
  readonly bodyWorldRadius?: number
  /** Hex color for the text. Default '#ffd166'. */
  readonly color?: string
}

function buildLabelTexture(text: string, color: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = 'bold 72px ui-sans-serif, system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // soft black halo for legibility against bright backgrounds
  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
  ctx.fillStyle = color
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/**
 * Screen-stable text label as a billboarded Sprite. Auto-scales so the label
 * occupies a roughly constant fraction of the viewport regardless of camera
 * distance. depthTest is off so it shows through the parent body's mesh
 * (helpful when sizeScale is large and the moon is inside Earth).
 */
export default function BodyLabel({
  text,
  worldPosition,
  bodyWorldRadius = 0,
  color = '#ffd166',
}: Props) {
  const ref = useRef<Sprite>(null)
  const texture = useMemo(() => buildLabelTexture(text, color), [text, color])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame(({ camera }) => {
    const sprite = ref.current
    if (!sprite) return
    // Push the label just past the body's apparent edge (along the camera-to-body axis).
    const camPos = camera.position
    const dx = worldPosition[0] - camPos.x
    const dy = worldPosition[1] - camPos.y
    const dz = worldPosition[2] - camPos.z
    const dist = Math.hypot(dx, dy, dz)
    const offset = bodyWorldRadius + dist * 0.012
    if (dist > 0) {
      const nx = dx / dist
      const ny = dy / dist
      const nz = dz / dist
      // step "back" from the body toward the camera so label sits in front
      sprite.position.set(
        worldPosition[0] - nx * offset,
        worldPosition[1] - ny * offset,
        worldPosition[2] - nz * offset,
      )
    } else {
      sprite.position.set(worldPosition[0], worldPosition[1], worldPosition[2])
    }
    // Constant-size in screen space: scale ∝ camera distance.
    const s = dist * 0.04
    sprite.scale.set(s * 4, s, 1)
  })

  return (
    <sprite ref={ref} renderOrder={999}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  )
}
