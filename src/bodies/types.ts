/**
 * `@/bodies` types — celestial body catalog (Work 6).
 *
 * Pure types only — no three.js runtime dependency. Mesh / material / R3F
 * components live in dedicated files (`material.ts`, `Body.tsx`, `SunMesh.tsx`).
 */

import type { Meters, NaifId } from '@/astro'

export type BodyKind = 'sun' | 'planet' | 'moon' | 'pluto-system'

export const BODY_KINDS = [
  'sun',
  'planet',
  'moon',
  'pluto-system',
] as const satisfies readonly BodyKind[]

/**
 * Saturn rings configuration. ``inner`` / ``outer`` are body-centric radii in
 * meters from Saturn's center. Texture is sampled radially from inner→outer.
 */
export interface RingsConfig {
  readonly innerRadiusM: Meters
  readonly outerRadiusM: Meters
  readonly textureUrl: string
}

/**
 * Single body entry — single-source-of-truth for radius, rotation model,
 * texture URL, and per-body capabilities (rings, atmosphere).
 *
 * - ``slug`` is URL-safe (kebab-case). Used by ``/dev/body/:slug``.
 * - ``rotationModelKey`` indexes into Work 2 P4 ``EARTH_IAU_ROTATION`` extension
 *   (Work 6 P2). Bodies without a published IAU model use ``'tidally-locked'``.
 * - ``textureUrl = null`` falls back to a flat ``fallbackColor`` material.
 * - ``rings`` is non-null only for Saturn (currently). Add other ringed bodies
 *   in a future Work.
 * - ``atmosphere`` is a hint for Work 11 atmospheric scattering — no effect on
 *   Work 6 mesh.
 */
export interface BodyDefinition {
  readonly naifId: NaifId
  readonly slug: string
  readonly label: string
  readonly kind: BodyKind
  readonly radiusM: Meters
  readonly rotationModelKey: string
  readonly textureUrl: string | null
  readonly fallbackColor: string
  readonly rings: RingsConfig | null
  readonly atmosphere: boolean
}
