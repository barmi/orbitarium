import type { Meters } from '@/astro'
import { BODY_MEAN_EQUATORIAL_RADIUS_M } from '@/scale'

import type { BodyDefinition } from './types'

const TEXTURE_BASE = `${import.meta.env.BASE_URL}data/textures`

/**
 * Mean equatorial radii for moons not in Work 4's `BODY_MEAN_EQUATORIAL_RADIUS_M`
 * (which covers Sun + 8 planets + Earth's Moon + Pluto). All values from IAU
 * WGCCRE 2015 (Archinal et al. 2018) — same source as Work 4 P1 #9.
 */
export const MOON_MEAN_EQUATORIAL_RADIUS_M: Readonly<Record<number, Meters>> = {
  501: 1_821_600 as Meters, // Io
  502: 1_560_800 as Meters, // Europa
  503: 2_634_100 as Meters, // Ganymede
  504: 2_410_300 as Meters, // Callisto
  601: 198_200 as Meters, // Mimas
  602: 252_100 as Meters, // Enceladus
  605: 763_800 as Meters, // Rhea
  606: 2_574_730 as Meters, // Titan
  608: 734_400 as Meters, // Iapetus
}

/**
 * Saturn rings outer / inner radii. From NASA Saturn fact sheet — D ring inner
 * edge to A ring outer edge.
 */
const SATURN_RING_INNER_M = 74_500_000 as Meters
const SATURN_RING_OUTER_M = 136_775_000 as Meters

const SUN: BodyDefinition = {
  naifId: 10,
  slug: 'sun',
  label: 'Sun',
  kind: 'sun',
  radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[10]!,
  rotationModelKey: 'sun',
  textureUrl: `${TEXTURE_BASE}/sun.jpg`,
  fallbackColor: '#ffd166',
  rings: null,
  atmosphere: false,
}

const PLANETS: readonly BodyDefinition[] = [
  {
    naifId: 199,
    slug: 'mercury',
    label: 'Mercury',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[199]!,
    rotationModelKey: 'mercury',
    textureUrl: `${TEXTURE_BASE}/mercury.jpg`,
    fallbackColor: '#9a8a78',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 299,
    slug: 'venus',
    label: 'Venus',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[299]!,
    rotationModelKey: 'venus',
    textureUrl: `${TEXTURE_BASE}/venus.jpg`,
    fallbackColor: '#d8c490',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 399,
    slug: 'earth',
    label: 'Earth',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[399]!,
    rotationModelKey: 'earth',
    textureUrl: `${TEXTURE_BASE}/earth.jpg`,
    fallbackColor: '#5a8fcd',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 499,
    slug: 'mars',
    label: 'Mars',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[499]!,
    rotationModelKey: 'mars',
    textureUrl: `${TEXTURE_BASE}/mars.jpg`,
    fallbackColor: '#c1542c',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 599,
    slug: 'jupiter',
    label: 'Jupiter',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[599]!,
    rotationModelKey: 'jupiter',
    textureUrl: `${TEXTURE_BASE}/jupiter.jpg`,
    fallbackColor: '#c79a6c',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 699,
    slug: 'saturn',
    label: 'Saturn',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[699]!,
    rotationModelKey: 'saturn',
    textureUrl: `${TEXTURE_BASE}/saturn.jpg`,
    fallbackColor: '#e0c79a',
    rings: {
      innerRadiusM: SATURN_RING_INNER_M,
      outerRadiusM: SATURN_RING_OUTER_M,
      textureUrl: `${TEXTURE_BASE}/saturn-rings.png`,
    },
    atmosphere: true,
  },
  {
    naifId: 799,
    slug: 'uranus',
    label: 'Uranus',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[799]!,
    rotationModelKey: 'uranus',
    textureUrl: `${TEXTURE_BASE}/uranus.jpg`,
    fallbackColor: '#aae0e0',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 899,
    slug: 'neptune',
    label: 'Neptune',
    kind: 'planet',
    radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[899]!,
    rotationModelKey: 'neptune',
    textureUrl: `${TEXTURE_BASE}/neptune.jpg`,
    fallbackColor: '#3060c8',
    rings: null,
    atmosphere: true,
  },
]

const PLUTO: BodyDefinition = {
  naifId: 999,
  slug: 'pluto',
  label: 'Pluto',
  kind: 'pluto-system',
  radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[999]!,
  rotationModelKey: 'pluto',
  textureUrl: `${TEXTURE_BASE}/pluto.jpg`,
  fallbackColor: '#c8b48a',
  rings: null,
  atmosphere: false,
}

const EARTH_MOON: BodyDefinition = {
  naifId: 301,
  slug: 'moon',
  label: 'Moon',
  kind: 'moon',
  radiusM: BODY_MEAN_EQUATORIAL_RADIUS_M[301]!,
  rotationModelKey: 'moon',
  textureUrl: `${TEXTURE_BASE}/moon.jpg`,
  fallbackColor: '#b0b0b0',
  rings: null,
  atmosphere: false,
}

const GALILEAN: readonly BodyDefinition[] = [
  {
    naifId: 501,
    slug: 'io',
    label: 'Io',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[501]!,
    rotationModelKey: 'io',
    textureUrl: `${TEXTURE_BASE}/io.jpg`,
    fallbackColor: '#e8d76a',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 502,
    slug: 'europa',
    label: 'Europa',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[502]!,
    rotationModelKey: 'europa',
    textureUrl: `${TEXTURE_BASE}/europa.jpg`,
    fallbackColor: '#c5a78a',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 503,
    slug: 'ganymede',
    label: 'Ganymede',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[503]!,
    rotationModelKey: 'ganymede',
    textureUrl: `${TEXTURE_BASE}/ganymede.jpg`,
    fallbackColor: '#a89478',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 504,
    slug: 'callisto',
    label: 'Callisto',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[504]!,
    rotationModelKey: 'callisto',
    textureUrl: `${TEXTURE_BASE}/callisto.jpg`,
    fallbackColor: '#7a6c5a',
    rings: null,
    atmosphere: false,
  },
]

const SATURN_MAJOR: readonly BodyDefinition[] = [
  {
    naifId: 601,
    slug: 'mimas',
    label: 'Mimas',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[601]!,
    rotationModelKey: 'tidally-locked',
    textureUrl: null,
    fallbackColor: '#999999',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 602,
    slug: 'enceladus',
    label: 'Enceladus',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[602]!,
    rotationModelKey: 'tidally-locked',
    textureUrl: null,
    fallbackColor: '#dddddd',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 605,
    slug: 'rhea',
    label: 'Rhea',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[605]!,
    rotationModelKey: 'tidally-locked',
    textureUrl: null,
    fallbackColor: '#a8a8a8',
    rings: null,
    atmosphere: false,
  },
  {
    naifId: 606,
    slug: 'titan',
    label: 'Titan',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[606]!,
    rotationModelKey: 'titan',
    textureUrl: `${TEXTURE_BASE}/titan.jpg`,
    fallbackColor: '#c79857',
    rings: null,
    atmosphere: true,
  },
  {
    naifId: 608,
    slug: 'iapetus',
    label: 'Iapetus',
    kind: 'moon',
    radiusM: MOON_MEAN_EQUATORIAL_RADIUS_M[608]!,
    rotationModelKey: 'tidally-locked',
    textureUrl: null,
    fallbackColor: '#8a7a6a',
    rings: null,
    atmosphere: false,
  },
]

export const BODY_CATALOG: readonly BodyDefinition[] = [
  SUN,
  ...PLANETS,
  PLUTO,
  EARTH_MOON,
  ...GALILEAN,
  ...SATURN_MAJOR,
]

const BY_NAIF: ReadonlyMap<number, BodyDefinition> = new Map(BODY_CATALOG.map((b) => [b.naifId, b]))
const BY_SLUG: ReadonlyMap<string, BodyDefinition> = new Map(BODY_CATALOG.map((b) => [b.slug, b]))

export function getBodyByNaifId(naifId: number): BodyDefinition | undefined {
  return BY_NAIF.get(naifId)
}

export function getBodyBySlug(slug: string): BodyDefinition | undefined {
  return BY_SLUG.get(slug)
}
