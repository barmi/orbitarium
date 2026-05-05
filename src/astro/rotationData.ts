/**
 * IAU rotation model data.
 *
 * Work 2 P4 seeded the interface with Earth only. Work 6 P2 extends to Sun + 8
 * planets + Earth's Moon + Pluto = 11 polynomial-only models. Mercury and the
 * Moon have published nutation / libration terms; here we use the polynomial
 * part only — the SPICE diff is ~arcsec-level and is documented in the Work 6
 * handoff. Galilean / Saturn major / Pluto-system periodic models are deferred
 * to Work 11.
 *
 * All polynomial coefficients are taken from NAIF `pck00011.tpc` (the same
 * source as the original Earth seed). The 2015 WGCCRE report inherits some of
 * these values from earlier reports — see body comments for provenance.
 */

import type { IAURotationModel } from './rotation'

const PCK = 'NAIF pck00011.tpc; IAU WGCCRE 2015 (Archinal et al. 2018)'

export const SUN_IAU_ROTATION: IAURotationModel = {
  naifId: 10,
  name: 'Sun',
  frameName: 'IAU_SUN',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [286.13, 0.0, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [63.87, 0.0, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [84.176, 14.1844, 0.0] } },
}

export const MERCURY_IAU_ROTATION: IAURotationModel = {
  naifId: 199,
  name: 'Mercury',
  frameName: 'IAU_MERCURY',
  source: `${PCK}; libration terms omitted (Work 11)`,
  poleRa: { polynomial: { variable: 'T', coefficients: [281.0103, -0.0328, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [61.4155, -0.0049, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [329.5988, 6.1385108, 0.0] } },
}

export const VENUS_IAU_ROTATION: IAURotationModel = {
  naifId: 299,
  name: 'Venus',
  frameName: 'IAU_VENUS',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [272.76, 0.0, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [67.16, 0.0, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [160.2, -1.4813688, 0.0] } },
}

export const EARTH_IAU_ROTATION: IAURotationModel = {
  naifId: 399,
  name: 'Earth',
  frameName: 'IAU_EARTH',
  source: 'NAIF pck00011.tpc BODY399_* constants; Earth orientation inherited from WGCCRE 2009',
  poleRa: { polynomial: { variable: 'T', coefficients: [0.0, -0.641, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [90.0, -0.557, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [190.147, 360.9856235, 0.0] } },
}

export const MOON_IAU_ROTATION: IAURotationModel = {
  naifId: 301,
  name: 'Moon',
  frameName: 'IAU_MOON',
  source: `${PCK}; nutation/libration terms omitted (Work 11)`,
  poleRa: { polynomial: { variable: 'T', coefficients: [269.9949, 0.0031, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [66.5392, 0.013, 0.0] } },
  primeMeridian: {
    polynomial: { variable: 'd', coefficients: [38.3213, 13.17635815, -1.4e-12] },
  },
}

export const MARS_IAU_ROTATION: IAURotationModel = {
  naifId: 499,
  name: 'Mars',
  frameName: 'IAU_MARS',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [317.68143, -0.1061, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [52.8865, -0.0609, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [176.63, 350.89198226, 0.0] } },
}

export const JUPITER_IAU_ROTATION: IAURotationModel = {
  naifId: 599,
  name: 'Jupiter',
  frameName: 'IAU_JUPITER',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [268.056595, -0.006499, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [64.495303, 0.002413, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [284.95, 870.536, 0.0] } },
}

export const SATURN_IAU_ROTATION: IAURotationModel = {
  naifId: 699,
  name: 'Saturn',
  frameName: 'IAU_SATURN',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [40.589, -0.036, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [83.537, -0.004, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [38.9, 810.7939024, 0.0] } },
}

export const URANUS_IAU_ROTATION: IAURotationModel = {
  naifId: 799,
  name: 'Uranus',
  frameName: 'IAU_URANUS',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [257.311, 0.0, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [-15.175, 0.0, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [203.81, -501.1600928, 0.0] } },
}

export const NEPTUNE_IAU_ROTATION: IAURotationModel = {
  naifId: 899,
  name: 'Neptune',
  frameName: 'IAU_NEPTUNE',
  source: `${PCK}; periodic N term omitted (Work 11)`,
  poleRa: { polynomial: { variable: 'T', coefficients: [299.36, 0.0, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [43.46, 0.0, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [253.18, 536.3128492, 0.0] } },
}

export const PLUTO_IAU_ROTATION: IAURotationModel = {
  naifId: 999,
  name: 'Pluto',
  frameName: 'IAU_PLUTO',
  source: PCK,
  poleRa: { polynomial: { variable: 'T', coefficients: [132.993, 0.0, 0.0] } },
  poleDec: { polynomial: { variable: 'T', coefficients: [-6.163, 0.0, 0.0] } },
  primeMeridian: { polynomial: { variable: 'd', coefficients: [302.695, 56.3625225, 0.0] } },
}

/**
 * Lookup table keyed by ``BodyDefinition.rotationModelKey`` (Work 6 P1 #2).
 *
 * Bodies whose model is omitted (Galilean / Saturn major / Charon / Pluto-system
 * minor bodies) fall back to ``'tidally-locked'`` in their BodyDefinition; the
 * mesh layer (Work 6 P3 / P4) renders them with a static parent-facing
 * orientation until full IAU models land in Work 11.
 */
export const IAU_ROTATION_MODELS: Readonly<Record<string, IAURotationModel>> = {
  sun: SUN_IAU_ROTATION,
  mercury: MERCURY_IAU_ROTATION,
  venus: VENUS_IAU_ROTATION,
  earth: EARTH_IAU_ROTATION,
  moon: MOON_IAU_ROTATION,
  mars: MARS_IAU_ROTATION,
  jupiter: JUPITER_IAU_ROTATION,
  saturn: SATURN_IAU_ROTATION,
  uranus: URANUS_IAU_ROTATION,
  neptune: NEPTUNE_IAU_ROTATION,
  pluto: PLUTO_IAU_ROTATION,
}

export function getIauRotationModel(key: string): IAURotationModel | undefined {
  return IAU_ROTATION_MODELS[key]
}
