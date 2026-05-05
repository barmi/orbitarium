export interface DemoBody {
  readonly key: string
  readonly naifId: number
  readonly label: string
}

export const DEMO_BODIES: readonly DemoBody[] = [
  { key: 'sun', naifId: 10, label: 'Sun' },
  { key: 'mercury', naifId: 199, label: 'Mercury' },
  { key: 'venus', naifId: 299, label: 'Venus' },
  { key: 'earth', naifId: 399, label: 'Earth' },
  { key: 'moon', naifId: 301, label: 'Moon' },
  { key: 'mars', naifId: 499, label: 'Mars' },
  { key: 'jupiter', naifId: 599, label: 'Jupiter' },
  { key: 'saturn', naifId: 699, label: 'Saturn' },
  { key: 'uranus', naifId: 799, label: 'Uranus' },
  { key: 'neptune', naifId: 899, label: 'Neptune' },
  { key: 'pluto', naifId: 999, label: 'Pluto' },
] as const

export const PLANET_BODY_KEYS_FOR_LINEUP: readonly string[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]
