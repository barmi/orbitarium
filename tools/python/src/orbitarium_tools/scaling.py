"""Scale system type definitions (Work 4 P1 placeholder).

Mirrors ``src/scale/types.ts`` semantics. The real distance/size policy
implementations are added in P2/P3 and produce values matching these
units (scene unit) and tolerances.

Conventions (Work 4 P1 decision):
  - scene unit = 1 AU display unit (post-policy). 1 SceneUnit ~ visual 1 AU.
  - Position: 3-tuple of SceneUnit (transform of ``PositionICRF`` in m).
  - Size: scalar SceneUnit (transform of body radius in m).
  - Reversibility: every policy provides ``forward`` + ``inverse`` (round-trip
    within ``SCALE_TOL_M`` = 1 mm).
  - Body radii: IAU WGCCRE 2015 mean equatorial (m), keyed by NAIF id.
"""

from __future__ import annotations

from typing import Final

SCALE_TOL_M: Final[float] = 1e-3
SCALE_TOL_SIZE_M: Final[float] = 1e-3

EARTH_MEAN_EQUATORIAL_RADIUS_M: Final[float] = 6_378_136.6

BODY_MEAN_EQUATORIAL_RADIUS_M: Final[dict[int, float]] = {
    10: 695_700_000.0,
    199: 2_440_500.0,
    299: 6_051_800.0,
    399: 6_378_136.6,
    301: 1_737_400.0,
    499: 3_396_190.0,
    599: 71_492_000.0,
    699: 60_268_000.0,
    799: 25_559_000.0,
    899: 24_764_000.0,
    999: 1_188_300.0,
}

SCALE_BODY_NAIF_IDS: Final[tuple[int, ...]] = (
    10,
    199,
    299,
    399,
    301,
    499,
    599,
    699,
    799,
    899,
    999,
)
