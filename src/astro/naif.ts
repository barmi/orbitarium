/**
 * NAIF integer ID catalog for bodies of interest in Orbitarium.
 *
 * Coverage (Work 2 P1 decision):
 *   Sun + 9 planet barycenters + 9 planet bodies + Moon + Galilean 4 + Saturn 5
 *   = 29 entries. Extended in Work 6 (more moons, asteroids).
 *
 * NAIF ID conventions (per SPICE):
 *   - Solar System Barycenter: 0
 *   - Sun: 10
 *   - Planet barycenters: 1–9 (Mercury, Venus, ..., Pluto)
 *   - Planet bodies: 199, 299, …, 999 (= barycenter * 100 + 99)
 *   - Major moons: 3-digit IDs starting with parent planet's barycenter id
 *
 * Saturn major-5 selection rationale: Titan (largest, atmosphere),
 * Rhea (2nd largest), Iapetus (two-tone surface), Enceladus (cryovolcanism),
 * Mimas ("Death Star" crater).
 */

export type NaifId = number
export type NaifKind = 'star' | 'barycenter' | 'planet' | 'moon'

export interface NaifEntry {
  readonly id: NaifId
  readonly name: string
  readonly kind: NaifKind
  /** Parent NAIF id; null for the Sun (top of hierarchy). */
  readonly parent: NaifId | null
}

export const NAIF_CATALOG = {
  sun: { id: 10, name: 'Sun', kind: 'star', parent: null },

  // Planet barycenters
  mercury_bary: { id: 1, name: 'Mercury Barycenter', kind: 'barycenter', parent: 10 },
  venus_bary: { id: 2, name: 'Venus Barycenter', kind: 'barycenter', parent: 10 },
  earth_moon_bary: { id: 3, name: 'Earth-Moon Barycenter', kind: 'barycenter', parent: 10 },
  mars_bary: { id: 4, name: 'Mars Barycenter', kind: 'barycenter', parent: 10 },
  jupiter_bary: { id: 5, name: 'Jupiter Barycenter', kind: 'barycenter', parent: 10 },
  saturn_bary: { id: 6, name: 'Saturn Barycenter', kind: 'barycenter', parent: 10 },
  uranus_bary: { id: 7, name: 'Uranus Barycenter', kind: 'barycenter', parent: 10 },
  neptune_bary: { id: 8, name: 'Neptune Barycenter', kind: 'barycenter', parent: 10 },
  pluto_bary: { id: 9, name: 'Pluto Barycenter', kind: 'barycenter', parent: 10 },

  // Planet bodies
  mercury: { id: 199, name: 'Mercury', kind: 'planet', parent: 1 },
  venus: { id: 299, name: 'Venus', kind: 'planet', parent: 2 },
  earth: { id: 399, name: 'Earth', kind: 'planet', parent: 3 },
  mars: { id: 499, name: 'Mars', kind: 'planet', parent: 4 },
  jupiter: { id: 599, name: 'Jupiter', kind: 'planet', parent: 5 },
  saturn: { id: 699, name: 'Saturn', kind: 'planet', parent: 6 },
  uranus: { id: 799, name: 'Uranus', kind: 'planet', parent: 7 },
  neptune: { id: 899, name: 'Neptune', kind: 'planet', parent: 8 },
  pluto: { id: 999, name: 'Pluto', kind: 'planet', parent: 9 },

  // Earth's moon
  moon: { id: 301, name: 'Moon', kind: 'moon', parent: 399 },

  // Galilean moons
  io: { id: 501, name: 'Io', kind: 'moon', parent: 599 },
  europa: { id: 502, name: 'Europa', kind: 'moon', parent: 599 },
  ganymede: { id: 503, name: 'Ganymede', kind: 'moon', parent: 599 },
  callisto: { id: 504, name: 'Callisto', kind: 'moon', parent: 599 },

  // Saturn major-5 (selection: largest + most distinctive)
  mimas: { id: 601, name: 'Mimas', kind: 'moon', parent: 699 },
  enceladus: { id: 602, name: 'Enceladus', kind: 'moon', parent: 699 },
  rhea: { id: 605, name: 'Rhea', kind: 'moon', parent: 699 },
  titan: { id: 606, name: 'Titan', kind: 'moon', parent: 699 },
  iapetus: { id: 608, name: 'Iapetus', kind: 'moon', parent: 699 },
} as const satisfies Record<string, NaifEntry>

export type NaifKey = keyof typeof NAIF_CATALOG

const ENTRIES: readonly NaifEntry[] = Object.values(NAIF_CATALOG)

/** All NAIF ids in catalog (insertion order). */
export const NAIF_IDS: readonly NaifId[] = ENTRIES.map((e) => e.id)

/** Lookup catalog entry by NAIF id. Returns undefined when not present. */
export function getByNaifId(id: NaifId): NaifEntry | undefined {
  return ENTRIES.find((e) => e.id === id)
}
