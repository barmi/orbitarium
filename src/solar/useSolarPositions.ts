import { useEffect, useState } from 'react'

import { type JdTdb } from '@/astro'
import { getBodyBySlug } from '@/bodies'
import type { De440Evaluator, PositionICRF } from '@/ephemeris'

import { POSITION_GRANULARITY_DAYS, SOLAR_BODY_SLUGS } from './constants'

export interface SolarPositions {
  readonly map: ReadonlyMap<number, PositionICRF>
  readonly loaded: boolean
  readonly error: string | null
}

const EMPTY = new Map<number, PositionICRF>()

/**
 * Fetch SSB-centered ICRF positions for all integrated-view bodies at the
 * current ``jdTdb``. Throttled by rounding ``jdTdb`` to a fixed granularity so
 * repeated frames at the same wall-clock instant don't re-trigger DE440
 * lookups.
 */
export function useSolarPositions(evaluator: De440Evaluator, jdTdb: JdTdb): SolarPositions {
  const granular =
    Math.round((jdTdb as number) / POSITION_GRANULARITY_DAYS) * POSITION_GRANULARITY_DAYS
  const [state, setState] = useState<SolarPositions>({
    map: EMPTY,
    loaded: false,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const naifIds = SOLAR_BODY_SLUGS.map((slug) => getBodyBySlug(slug)!.naifId)
    Promise.all(naifIds.map((id) => evaluator.getStateAt(id, granular as JdTdb)))
      .then((states) => {
        if (cancelled) return
        const map = new Map<number, PositionICRF>()
        states.forEach((s, i) => map.set(naifIds[i]!, s.position))
        setState({ map, loaded: true, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          map: EMPTY,
          loaded: false,
          error: err instanceof Error ? err.message : 'positions failed',
        })
      })
    return () => {
      cancelled = true
    }
  }, [evaluator, granular])

  return state
}
