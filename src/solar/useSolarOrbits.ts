import { useEffect, useState } from 'react'

import { type JdTdb } from '@/astro'
import { getBodyBySlug } from '@/bodies'
import type { De440Evaluator } from '@/ephemeris'
import { type OrbitPolyline, sampleOrbit } from '@/orbits'

import {
  ORBIT_RESAMPLE_GRANULARITY_DAYS,
  ORBIT_SAMPLE_COUNT,
  ORBITAL_PERIOD_DAYS,
  SOLAR_BODY_SLUGS,
} from './constants'

const EMPTY = new Map<number, OrbitPolyline>()

/**
 * One-orbit-period polyline per planet/Pluto/Moon, centered on the current
 * ``jdTdb`` (rounded to ``ORBIT_RESAMPLE_GRANULARITY_DAYS``).
 *
 * Sun is excluded — at SSB origin its trail is a tiny barycenter wobble.
 */
export function useSolarOrbits(
  evaluator: De440Evaluator,
  jdTdb: JdTdb,
): {
  readonly map: ReadonlyMap<number, OrbitPolyline>
  readonly loaded: boolean
} {
  const granular =
    Math.round((jdTdb as number) / ORBIT_RESAMPLE_GRANULARITY_DAYS) *
    ORBIT_RESAMPLE_GRANULARITY_DAYS
  const [state, setState] = useState<{
    map: ReadonlyMap<number, OrbitPolyline>
    loaded: boolean
  }>({ map: EMPTY, loaded: false })

  useEffect(() => {
    let cancelled = false
    const targets = SOLAR_BODY_SLUGS.filter((slug) => slug !== 'sun').map((slug) => {
      const body = getBodyBySlug(slug)!
      const period = ORBITAL_PERIOD_DAYS[slug] ?? 365
      return {
        naifId: body.naifId,
        start: (granular - period * 0.5) as JdTdb,
        end: (granular + period * 0.5) as JdTdb,
      }
    })

    Promise.all(
      targets.map((t) =>
        sampleOrbit(evaluator, t.naifId, t.start, t.end, ORBIT_SAMPLE_COUNT).then(
          (pl) => [t.naifId, pl] as const,
        ),
      ),
    )
      .then((pairs) => {
        if (cancelled) return
        setState({ map: new Map(pairs), loaded: true })
      })
      .catch(() => {
        // Orbits are decorative — silent fall-through (positions hook surfaces errors).
      })
    return () => {
      cancelled = true
    }
  }, [evaluator, granular])

  return state
}
