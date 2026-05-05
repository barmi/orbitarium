import { useMemo } from 'react'

import { createStarfieldMesh, type StarfieldData } from '@/render'

interface Props {
  readonly data: StarfieldData
  readonly visibleCutoff: number
  readonly baseSize?: number
  readonly pixelRatio?: number
}

export default function StarfieldGroup({ data, visibleCutoff, baseSize, pixelRatio }: Props) {
  const filtered = useMemo(() => {
    if (visibleCutoff >= 6) return data
    const cutoffBucket = Math.round(((visibleCutoff - -2) / (8 - -2)) * 255)
    const positions: number[] = []
    const colorIdx: number[] = []
    const magBucket: number[] = []
    for (let i = 0; i < data.count; i++) {
      const bucket = data.magBucket[i]!
      if (bucket > cutoffBucket) continue
      positions.push(data.positions[i * 3]!, data.positions[i * 3 + 1]!, data.positions[i * 3 + 2]!)
      colorIdx.push(data.colorIdx[i]!)
      magBucket.push(bucket)
    }
    return {
      sceneRadius: data.sceneRadius,
      count: colorIdx.length,
      positions: new Float32Array(positions),
      colorIdx: new Uint8Array(colorIdx),
      magBucket: new Uint8Array(magBucket),
    }
  }, [data, visibleCutoff])

  const mesh = useMemo(
    () => createStarfieldMesh(filtered, { baseSize, pixelRatio }),
    [baseSize, filtered, pixelRatio],
  )

  return <primitive object={mesh} />
}
