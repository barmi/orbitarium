import { useEffect, useState } from 'react'

interface Props {
  className?: string
}

export default function FpsOverlay({ className = '' }: Props) {
  const [fps, setFps] = useState(0)

  useEffect(() => {
    let frameCount = 0
    let lastUpdate = performance.now()
    let rafId = 0

    const tick = () => {
      frameCount += 1
      const now = performance.now()
      if (now - lastUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastUpdate)))
        frameCount = 0
        lastUpdate = now
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className={`fps-overlay ${className}`.trim()}>
      <span className="fps-overlay__num">{fps.toString().padStart(3, ' ')}</span>
      <span className="fps-overlay__unit">fps</span>
    </div>
  )
}
