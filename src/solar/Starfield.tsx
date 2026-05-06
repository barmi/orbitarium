import { useEffect, useMemo, useState } from 'react'

import { createStarfieldMesh, loadStarfieldFromUrl, type StarfieldData } from '@/render'

import { STARFIELD_URL } from './constants'

interface Props {
  readonly enabled?: boolean
  readonly vmagCutoff?: number
}

function filterByVmag(data: StarfieldData, cutoff: number): StarfieldData {
  if (cutoff >= 6) return data
  // magBucket is uint8; bucket = round((vmag - (-2)) / (8 - (-2)) * 255).
  const cutoffBucket = Math.round(((cutoff - -2) / (8 - -2)) * 255)
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
}

export default function Starfield({ enabled = true, vmagCutoff = 6 }: Props) {
  const [data, setData] = useState<StarfieldData | null>(null)
  useEffect(() => {
    let cancelled = false
    loadStarfieldFromUrl(STARFIELD_URL)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        // Silent fallback — main view still renders without stars.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => (data ? filterByVmag(data, vmagCutoff) : null), [data, vmagCutoff])

  const mesh = useMemo(
    () => (filtered ? createStarfieldMesh(filtered, { baseSize: 4 }) : null),
    [filtered],
  )

  if (!enabled || !mesh) return null
  return <primitive object={mesh} />
}
