"""Ephemeris type definitions (Work 3 P1 placeholder).

Mirrors ``src/ephemeris/types.ts`` semantics. The real evaluators
(`de440.py`, `horizons.py`) are added in P2/P4 and return values that
match these types in shape and units.

Conventions:
  - Position: 3-tuple of meters (ICRF / J2000)
  - Velocity: 3-tuple of meters per second (ICRF / J2000)
  - Time input: Julian Date in TDB scale (``JdTdb``, see ``time.py``)
  - Reference frame: ICRF (DE440 native; convert via ``frames.py`` if needed)

Tolerance defaults (Work 3 P1 decision):
  - Position: 1 mm (``EPHEMERIS_TOL_M = 1e-3``)
  - Velocity: 1 um/s (``EPHEMERIS_TOL_VEL_M_S = 1e-6``)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

EPHEMERIS_TOL_M: Final[float] = 1e-3
EPHEMERIS_TOL_VEL_M_S: Final[float] = 1e-6

DE440_KERNEL_NAME: Final[str] = "de440"
DE440_KERNEL_SOURCE: Final[str] = (
    "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440.bsp"
)
DE440_TIME_RANGE_START_YEAR: Final[int] = 1900
DE440_TIME_RANGE_END_YEAR: Final[int] = 2150

DE440_BODY_NAIF_IDS: Final[tuple[int, ...]] = (
    10,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    199,
    299,
    399,
    499,
    599,
    699,
    799,
    899,
    999,
    301,
)

Position = tuple[float, float, float]
Velocity = tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class StateVectorICRF:
    """ICRF state vector at a given JdTdb. Position in meters, velocity in m/s."""

    naif_id: int
    jd_tdb: float
    position: Position
    velocity: Velocity
