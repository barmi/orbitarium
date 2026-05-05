import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { createDe440Evaluator, type De440Evaluator } from '@/ephemeris'

import PlanetLineupPanel from './PlanetLineupPanel'
import ReferenceDiffPanel from './ReferenceDiffPanel'
import StateVectorPanel from './StateVectorPanel'
import { createWebDe440Loader } from './webLoader'

export default function EphemerisDemo() {
  const evaluator = useMemo<De440Evaluator>(() => createDe440Evaluator(createWebDe440Loader()), [])
  const [evaluatorError, setEvaluatorError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void evaluator.getManifest().catch((err: unknown) => {
      if (!cancelled) {
        const message = err instanceof Error ? err.message : 'manifest load failed'
        setEvaluatorError(message)
      }
    })
    return () => {
      cancelled = true
    }
  }, [evaluator])

  return (
    <main className="astro-demo">
      <header className="astro-demo__header">
        <div>
          <p className="astro-panel__eyebrow">Work 3</p>
          <h1>Ephemeris Data Layer</h1>
        </div>
        <Link to="/dev/index">Dev Catalog</Link>
      </header>

      <div className="astro-demo__grid">
        <StateVectorPanel
          evaluator={evaluatorError ? null : evaluator}
          evaluatorError={evaluatorError}
        />
        <ReferenceDiffPanel evaluator={evaluatorError ? null : evaluator} />
        <PlanetLineupPanel evaluator={evaluatorError ? null : evaluator} />
      </div>
    </main>
  )
}
