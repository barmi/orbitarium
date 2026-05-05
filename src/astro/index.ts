/**
 * `@/astro` — Astronomy foundations (Work 2).
 *
 * Truth-layer modules for time systems, reference frames, IAU rotation,
 * astronomical constants, and the NAIF body catalog. All values are in SI
 * units / standard reference frames; display-layer scaling is the
 * responsibility of `@/render` (Work 4+).
 */

export * from './constants'
export * from './naif'
export * from './units'
