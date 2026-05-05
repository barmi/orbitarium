import { describe, expect, it } from 'vitest'

import { getByNaifId, NAIF_CATALOG, NAIF_IDS } from '@/astro/naif'

describe('NAIF catalog', () => {
  it('contains exactly 29 entries (Work 2 P1 scope)', () => {
    expect(Object.keys(NAIF_CATALOG)).toHaveLength(29)
    expect(NAIF_IDS).toHaveLength(29)
  })

  it('all NAIF ids are unique', () => {
    expect(new Set(NAIF_IDS).size).toBe(NAIF_IDS.length)
  })

  it('Sun (10) is the only top-level entry', () => {
    expect(NAIF_CATALOG.sun.id).toBe(10)
    expect(NAIF_CATALOG.sun.parent).toBeNull()
    const topLevel = Object.values(NAIF_CATALOG).filter((e) => e.parent === null)
    expect(topLevel).toHaveLength(1)
  })

  it('planet bodies use parent = barycenter, body id = barycenter * 100 + 99', () => {
    const planetKeys = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
    ] as const
    for (const key of planetKeys) {
      const planet = NAIF_CATALOG[key]
      expect(planet.kind).toBe('planet')
      expect(planet.parent).not.toBeNull()
      // 199 → 1, 299 → 2, …, 999 → 9
      expect(Math.floor(planet.id / 100)).toBe(planet.parent)
    }
  })

  it('Moon (301) has Earth (399) as parent', () => {
    expect(NAIF_CATALOG.moon.parent).toBe(NAIF_CATALOG.earth.id)
  })

  it('Galilean moons are 4 entries with Jupiter as parent', () => {
    const galilean = Object.values(NAIF_CATALOG).filter((e) => e.parent === NAIF_CATALOG.jupiter.id)
    expect(galilean).toHaveLength(4)
    expect(galilean.map((e) => e.name).sort()).toEqual(['Callisto', 'Europa', 'Ganymede', 'Io'])
  })

  it('Saturn major-5 are 5 entries with Saturn as parent', () => {
    const saturnMoons = Object.values(NAIF_CATALOG).filter(
      (e) => e.parent === NAIF_CATALOG.saturn.id,
    )
    expect(saturnMoons).toHaveLength(5)
    expect(saturnMoons.map((e) => e.name).sort()).toEqual([
      'Enceladus',
      'Iapetus',
      'Mimas',
      'Rhea',
      'Titan',
    ])
  })

  it('getByNaifId resolves known ids and returns undefined for unknown', () => {
    expect(getByNaifId(10)?.name).toBe('Sun')
    expect(getByNaifId(399)?.name).toBe('Earth')
    expect(getByNaifId(606)?.name).toBe('Titan')
    expect(getByNaifId(99999)).toBeUndefined()
  })
})
