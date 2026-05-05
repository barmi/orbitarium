import { describe, expect, it } from 'vitest'

import {
  BODY_CATALOG,
  BODY_KINDS,
  type BodyDefinition,
  type BodyKind,
  getBodyByNaifId,
  getBodyBySlug,
  MOON_MEAN_EQUATORIAL_RADIUS_M,
} from '@/bodies'
import { BODY_MEAN_EQUATORIAL_RADIUS_M } from '@/scale'

describe('BodyKind union', () => {
  it('lists exactly four body kinds', () => {
    expect(BODY_KINDS).toEqual(['sun', 'planet', 'moon', 'pluto-system'])
  })

  it('BodyKind type accepts each literal', () => {
    const kinds: BodyKind[] = ['sun', 'planet', 'moon', 'pluto-system']
    expect(kinds).toHaveLength(4)
  })
})

describe('BODY_CATALOG', () => {
  it('contains 20 entries (Sun + 8 planets + Pluto + Moon + 4 Galilean + 5 Saturn major)', () => {
    expect(BODY_CATALOG).toHaveLength(20)
  })

  it('exactly one Sun (kind=sun)', () => {
    const suns = BODY_CATALOG.filter((b) => b.kind === 'sun')
    expect(suns).toHaveLength(1)
    expect(suns[0]!.naifId).toBe(10)
  })

  it('eight planets (kind=planet) covering NAIF 199..899 + Saturn rings only on Saturn', () => {
    const planets = BODY_CATALOG.filter((b) => b.kind === 'planet')
    expect(planets).toHaveLength(8)
    const ids = planets.map((p) => p.naifId).sort((a, b) => a - b)
    expect(ids).toEqual([199, 299, 399, 499, 599, 699, 799, 899])
    const ringed = planets.filter((p) => p.rings !== null)
    expect(ringed).toHaveLength(1)
    expect(ringed[0]!.slug).toBe('saturn')
  })

  it('Pluto is the lone pluto-system entry', () => {
    const plutos = BODY_CATALOG.filter((b) => b.kind === 'pluto-system')
    expect(plutos).toHaveLength(1)
    expect(plutos[0]!.naifId).toBe(999)
  })

  it('ten moons (Moon + 4 Galilean + 5 Saturn major)', () => {
    const moons = BODY_CATALOG.filter((b) => b.kind === 'moon')
    expect(moons).toHaveLength(10)
    const ids = moons.map((m) => m.naifId).sort((a, b) => a - b)
    expect(ids).toEqual([301, 501, 502, 503, 504, 601, 602, 605, 606, 608])
  })

  it('every entry has a unique slug + NAIF id', () => {
    const slugs = new Set(BODY_CATALOG.map((b) => b.slug))
    const ids = new Set(BODY_CATALOG.map((b) => b.naifId))
    expect(slugs.size).toBe(BODY_CATALOG.length)
    expect(ids.size).toBe(BODY_CATALOG.length)
  })

  it('slug uses kebab-case (lowercase + dashes only)', () => {
    for (const body of BODY_CATALOG) {
      expect(body.slug).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('every BodyDefinition has a positive radius matching the IAU 2015 source', () => {
    for (const body of BODY_CATALOG) {
      expect(body.radiusM).toBeGreaterThan(0)
      const work4 = BODY_MEAN_EQUATORIAL_RADIUS_M[body.naifId]
      const work6Moon = MOON_MEAN_EQUATORIAL_RADIUS_M[body.naifId]
      const expected = work4 ?? work6Moon
      expect(expected).toBeDefined()
      expect(body.radiusM).toBe(expected)
    }
  })

  it('Sun rotation key is `sun`, planets / moons map to slug or `tidally-locked`', () => {
    const sun = BODY_CATALOG.find((b) => b.kind === 'sun')!
    expect(sun.rotationModelKey).toBe('sun')
    for (const body of BODY_CATALOG) {
      if (body.rotationModelKey === 'tidally-locked') {
        expect(body.kind).toBe('moon')
      } else {
        expect(body.rotationModelKey).toBe(body.slug)
      }
    }
  })

  it('atmosphere flag set on Venus / Earth / Mars / 4 gas giants / Titan only', () => {
    const withAtmosphere = BODY_CATALOG.filter((b) => b.atmosphere)
      .map((b) => b.slug)
      .sort()
    expect(withAtmosphere).toEqual([
      'earth',
      'jupiter',
      'mars',
      'neptune',
      'saturn',
      'titan',
      'uranus',
      'venus',
    ])
  })

  it('fallback color is hex (#rrggbb)', () => {
    for (const body of BODY_CATALOG) {
      expect(body.fallbackColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('non-textured Saturn moons (Mimas/Enceladus/Rhea/Iapetus) have textureUrl=null', () => {
    const noTexture = BODY_CATALOG.filter((b) => b.textureUrl === null)
      .map((b) => b.slug)
      .sort()
    expect(noTexture).toEqual(['enceladus', 'iapetus', 'mimas', 'rhea'])
  })
})

describe('Saturn rings config', () => {
  it('inner < outer radius, both in meters', () => {
    const saturn = BODY_CATALOG.find((b) => b.slug === 'saturn')!
    expect(saturn.rings).not.toBeNull()
    const rings = saturn.rings!
    expect(rings.innerRadiusM).toBeGreaterThan(0)
    expect(rings.outerRadiusM).toBeGreaterThan(rings.innerRadiusM)
    expect(rings.outerRadiusM).toBeLessThan(200_000_000)
  })

  it('rings inner radius > Saturn equatorial radius (~60.3M m)', () => {
    const saturn = BODY_CATALOG.find((b) => b.slug === 'saturn')!
    expect(saturn.rings!.innerRadiusM).toBeGreaterThan(saturn.radiusM)
  })
})

describe('lookup helpers', () => {
  it('getBodyByNaifId returns the catalog entry', () => {
    const earth = getBodyByNaifId(399)
    expect(earth?.slug).toBe('earth')
    expect(getBodyByNaifId(0)).toBeUndefined()
  })

  it('getBodyBySlug returns the catalog entry', () => {
    const titan = getBodyBySlug('titan')
    expect(titan?.naifId).toBe(606)
    expect(getBodyBySlug('mars-2')).toBeUndefined()
  })

  it('lookups roundtrip (slug → entry → naifId)', () => {
    for (const body of BODY_CATALOG) {
      const found: BodyDefinition | undefined = getBodyBySlug(body.slug)
      expect(found).toBeDefined()
      expect(found!.naifId).toBe(body.naifId)
    }
  })
})
