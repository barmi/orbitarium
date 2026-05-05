export const EPHEMERIS_TOL_M = 1e-3
export const EPHEMERIS_TOL_VEL_M_S = 1e-6

export const DE440_TIME_RANGE_START_YEAR = 1900
export const DE440_TIME_RANGE_END_YEAR = 2150

export const DE440_KERNEL_NAME = 'de440'
export const DE440_KERNEL_SOURCE =
  'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440.bsp'

export const DE440_BODY_NAIF_IDS = [
  10, // Sun
  1, // Mercury barycenter
  2, // Venus barycenter
  3, // Earth-Moon barycenter
  4, // Mars barycenter
  5, // Jupiter barycenter
  6, // Saturn barycenter
  7, // Uranus barycenter
  8, // Neptune barycenter
  9, // Pluto barycenter
  199, // Mercury
  299, // Venus
  399, // Earth
  499, // Mars
  599, // Jupiter
  699, // Saturn
  799, // Uranus
  899, // Neptune
  999, // Pluto
  301, // Moon
] as const

export type De440BodyNaifId = (typeof DE440_BODY_NAIF_IDS)[number]
