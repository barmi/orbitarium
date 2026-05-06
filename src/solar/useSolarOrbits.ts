import { useEffect, useState } from 'react'

import { type JdTdb } from '@/astro'
import { getBodyBySlug } from '@/bodies'
import type { De440Evaluator } from '@/ephemeris'
import { type OrbitPolyline, sampleOrbit, sampleRelativeOrbit } from '@/orbits'

import {
  ORBIT_RESAMPLE_GRANULARITY_DAYS,
  ORBIT_SAMPLE_COUNT,
  ORBITAL_PERIOD_DAYS,
  SOLAR_BODY_SLUGS,
} from './constants'

const EMPTY = new Map<number, OrbitPolyline>()

const MOON_NAIF = 301
const EARTH_NAIF = 399

export interface SolarOrbitsResult {
  /** SSB-frame polylines (heliocentric ellipses for planets / Pluto). */
  readonly map: ReadonlyMap<number, OrbitPolyline>
  /** Geocentric Moon orbit — small ring (~38万 km) relative to Earth.
   * Render translated to Earth's current world position. ``null`` while loading. */
  readonly moonGeocentric: OrbitPolyline | null
  readonly loaded: boolean
}

/**
 * One-orbit-period polyline per planet/Pluto/Moon, centered on the current
 * ``jdTdb`` (rounded to ``ORBIT_RESAMPLE_GRANULARITY_DAYS``).
 *
 * Sun is excluded — at SSB origin its trail is a tiny barycenter wobble.
 *
 * Moon gets a SECOND polyline sampled in the geocentric frame so its orbit
 * (~38万 km) doesn't collapse onto Earth's heliocentric ellipse visually.
 */
export function useSolarOrbits(evaluator: De440Evaluator, jdTdb: JdTdb): SolarOrbitsResult {
  const granular =
    Math.round((jdTdb as number) / ORBIT_RESAMPLE_GRANULARITY_DAYS) *
    ORBIT_RESAMPLE_GRANULARITY_DAYS
  const [state, setState] = useState<SolarOrbitsResult>({
    map: EMPTY,
    moonGeocentric: null,
    loaded: false,
  })

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

    const moonPeriod = ORBITAL_PERIOD_DAYS.moon ?? 27.3
    const moonStart = (granular - moonPeriod * 0.5) as JdTdb
    const moonEnd = (granular + moonPeriod * 0.5) as JdTdb

    Promise.all([
      Promise.all(
        targets.map((t) =>
          sampleOrbit(evaluator, t.naifId, t.start, t.end, ORBIT_SAMPLE_COUNT).then(
            (pl) => [t.naifId, pl] as const,
          ),
        ),
      ),
      sampleRelativeOrbit(evaluator, MOON_NAIF, EARTH_NAIF, moonStart, moonEnd, ORBIT_SAMPLE_COUNT),
    ])
      .then(([pairs, moonGeocentric]) => {
        if (cancelled) return
        setState({ map: new Map(pairs), moonGeocentric, loaded: true })
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
