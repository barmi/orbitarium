/**
 * IAU rotation model data.
 *
 * P4 intentionally includes Earth only as the interface seed for Work 6. The
 * Earth orientation constants are the NAIF `pck00011.tpc` values for `IAU_EARTH`;
 * that file notes the 2015 WGCCRE report no longer provides Earth orientation,
 * so these values are inherited from the 2009 WGCCRE report.
 */

import type { IAURotationModel } from './rotation'

export const EARTH_IAU_ROTATION: IAURotationModel = {
  naifId: 399,
  name: 'Earth',
  frameName: 'IAU_EARTH',
  source: 'NAIF pck00011.tpc BODY399_* constants; Earth orientation inherited from WGCCRE 2009',
  poleRa: {
    polynomial: {
      variable: 'T',
      coefficients: [0.0, -0.641, 0.0],
    },
  },
  poleDec: {
    polynomial: {
      variable: 'T',
      coefficients: [90.0, -0.557, 0.0],
    },
  },
  primeMeridian: {
    polynomial: {
      variable: 'd',
      coefficients: [190.147, 360.9856235, 0.0],
    },
  },
}
