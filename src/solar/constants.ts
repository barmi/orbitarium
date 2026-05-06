/**
 * Integrated solar system view configuration (Work 12 + post-Work 12 integration).
 *
 * The dev pages exercise each Work's slice independently; this module wires
 * them into the single ``/`` route — DE440 evaluator + body catalog + scale
 * policies + render anchor + IAU rotation + Hipparcos starfield + simulation
 * clock + camera control + share URL.
 */

/**
 * Bodies rendered in the integrated view, in catalog/visual order.
 * Sun first, then planets sorted by orbit, then Earth's Moon, then Pluto.
 *
 * Galilean / Saturn major moons are deferred — their positions need separate
 * SPK kernels not in the DE440 main cache.
 */
export const SOLAR_BODY_SLUGS: readonly string[] = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

/**
 * Orbital periods (days) for trail / predict windowing. Approximate values —
 * good enough for visualization.
 */
export const ORBITAL_PERIOD_DAYS: Readonly<Record<string, number>> = {
  mercury: 88,
  venus: 225,
  earth: 365.25,
  moon: 27.3,
  mars: 687,
  jupiter: 4333,
  saturn: 10759,
  uranus: 30687,
  neptune: 60190,
  pluto: 90520,
}

/**
 * Hand-tuned visualization radius for the Sun (scene units).
 *
 * The Work 4 ``logarithmic-magnification`` size policy returns ~1.0 for the
 * Sun, which would visually swallow Mercury's orbit (0.39 scene units under
 * piecewise-monotonic). We override Sun size to fit just inside Mercury orbit.
 */
export const SUN_VISUAL_RADIUS_SCENE = 0.18

export const DEFAULT_DISTANCE_POLICY = 'piecewise-monotonic'
export const DEFAULT_SIZE_POLICY = 'logarithmic-magnification'

export const ORBIT_SAMPLE_COUNT = 256

/** Re-sample orbits every N days of jdTdb drift. 1 year keeps the inner-planet
 * orbits visually fresh while avoiding spurious refetches. */
export const ORBIT_RESAMPLE_GRANULARITY_DAYS = 365

/** Position fetch granularity (days). At rate=1 (real time) jdTdb advances by
 * ~1.16e-5 days/sec — refetching on every change is wasteful. We round jdTdb
 * to this granularity before useEffect deps; ~7 minutes resolution at any rate. */
export const POSITION_GRANULARITY_DAYS = 0.005

export const STARFIELD_URL = `${import.meta.env.BASE_URL}data/starfield/hipparcos-vmag6.bin`

/** Default camera at fresh load. Drag rotates around the focused target;
 * wheel zooms. Spherical coords below. */
export const DEFAULT_CAMERA_DISTANCE_SCENE = 8
export const DEFAULT_CAMERA_PHI_RAD = Math.PI / 3 // ~60° elevation from +y axis
export const DEFAULT_CAMERA_THETA_RAD = -Math.PI / 4

/** Spherical clamp ranges. */
export const CAMERA_PHI_MIN = 0.1
export const CAMERA_PHI_MAX = Math.PI - 0.1
/** Minimum camera distance — small enough to zoom in on a moon when the
 * user dials body-size down to see it. */
export const CAMERA_DISTANCE_MIN = 0.001
export const CAMERA_DISTANCE_MAX = 200
