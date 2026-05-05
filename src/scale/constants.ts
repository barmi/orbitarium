import type { Meters } from '@/astro'

export const SCALE_TOL_M = 1e-3
export const SCALE_TOL_SIZE_M = 1e-3

export const EARTH_MEAN_EQUATORIAL_RADIUS_M = 6_378_136.6 as Meters

export const BODY_MEAN_EQUATORIAL_RADIUS_M: Readonly<Record<number, Meters>> = {
  10: 695_700_000 as Meters,
  199: 2_440_500 as Meters,
  299: 6_051_800 as Meters,
  399: 6_378_136.6 as Meters,
  301: 1_737_400 as Meters,
  499: 3_396_190 as Meters,
  599: 71_492_000 as Meters,
  699: 60_268_000 as Meters,
  799: 25_559_000 as Meters,
  899: 24_764_000 as Meters,
  999: 1_188_300 as Meters,
}

export const SCALE_BODY_NAIF_IDS = [10, 199, 299, 399, 301, 499, 599, 699, 799, 899, 999] as const
