import { useEffect, useMemo, useState } from 'react'

import { createStarfieldMesh, loadStarfieldFromUrl, type StarfieldData } from '@/render'

import { STARFIELD_URL } from './constants'

export default function Starfield() {
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

  const mesh = useMemo(() => (data ? createStarfieldMesh(data, { baseSize: 4 }) : null), [data])
  if (!mesh) return null
  return <primitive object={mesh} />
}
