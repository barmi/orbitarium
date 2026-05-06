"""Orbit polyline reference (Work 7).

Mirrors ``src/orbits/`` semantics. Provides:

- ``OrbitSample`` / ``OrbitPolyline`` dataclasses (TS-mirror).
- Default tolerances and trail / predict durations.
- (P2) ``sample_orbit`` — calls DE440 evaluator across a time grid.
- (P2) ``extract_keplerian`` — Keplerian elements (sma / ecc / inc / raan /
  argp / mean anomaly) from a single ICRF state vector.
- (P4) ``generate_asteroid_belt`` — deterministic synthetic main-belt.
- (P6) ``generate_fixtures`` — orbit polylines + Keplerian elements + belt.

P1 placeholder — only constants + dataclasses.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

ORBIT_TOL_MM: Final[float] = 1.0
ORBIT_TOL_M: Final[float] = 100.0

DEFAULT_TRAIL_DAYS: Final[int] = 365
DEFAULT_PREDICT_DAYS: Final[int] = 365
DEFAULT_SAMPLE_COUNT: Final[int] = 256

ASTEROID_BELT_DEFAULT_COUNT: Final[int] = 256


@dataclass(frozen=True, slots=True)
class OrbitSample:
    jd_tdb: float
    position_m: tuple[float, float, float]


@dataclass(frozen=True, slots=True)
class OrbitPolyline:
    naif_id: int
    jd_tdbs: tuple[float, ...]
    positions_m: tuple[tuple[float, float, float], ...]


@dataclass(frozen=True, slots=True)
class TrailConfig:
    duration_days: int = DEFAULT_TRAIL_DAYS
    sample_count: int = DEFAULT_SAMPLE_COUNT


@dataclass(frozen=True, slots=True)
class PredictConfig:
    duration_days: int = DEFAULT_PREDICT_DAYS
    sample_count: int = DEFAULT_SAMPLE_COUNT
