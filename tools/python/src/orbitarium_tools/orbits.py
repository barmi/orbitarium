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

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

# Standard gravitational parameter of the Sun (m^3/s^2). IAU 2015 value.
GM_SUN_M3_PER_S2: Final[float] = 1.32712440018e20

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


@dataclass(frozen=True, slots=True)
class KeplerianElements:
    sma_m: float          # semi-major axis (m)
    ecc: float            # eccentricity
    inc_rad: float        # inclination
    raan_rad: float       # longitude of ascending node
    argp_rad: float       # argument of periapsis
    mean_anomaly_rad: float


def extract_keplerian(
    position_m: Sequence[float],
    velocity_m_per_s: Sequence[float],
    mu_m3_per_s2: float = GM_SUN_M3_PER_S2,
) -> KeplerianElements:
    """Convert Cartesian state vector → classical Keplerian elements.

    Reference: Vallado, "Fundamentals of Astrodynamics and Applications",
    Algorithm RV2COE (simplified — no special-case handling for circular /
    equatorial orbits beyond the obvious epsilon guards).
    """
    rx, ry, rz = float(position_m[0]), float(position_m[1]), float(position_m[2])
    vx, vy, vz = (
        float(velocity_m_per_s[0]),
        float(velocity_m_per_s[1]),
        float(velocity_m_per_s[2]),
    )
    r_mag = math.sqrt(rx * rx + ry * ry + rz * rz)
    v_mag2 = vx * vx + vy * vy + vz * vz

    # Specific angular momentum h = r × v
    hx = ry * vz - rz * vy
    hy = rz * vx - rx * vz
    hz = rx * vy - ry * vx
    h_mag = math.sqrt(hx * hx + hy * hy + hz * hz)

    # Inclination: cos(inc) = hz / h_mag
    inc = math.acos(max(-1.0, min(1.0, hz / h_mag))) if h_mag > 0 else 0.0

    # Node line N = k × h = (-hy, hx, 0)
    nx, ny = -hy, hx
    n_mag = math.sqrt(nx * nx + ny * ny)

    # RAAN
    if n_mag == 0.0:
        raan = 0.0
    else:
        raan = math.acos(max(-1.0, min(1.0, nx / n_mag)))
        if ny < 0.0:
            raan = 2.0 * math.pi - raan

    # Eccentricity vector e = ((v² - μ/r) r - (r·v) v) / μ
    rv_dot = rx * vx + ry * vy + rz * vz
    coeff_r = v_mag2 - mu_m3_per_s2 / r_mag
    ex = (coeff_r * rx - rv_dot * vx) / mu_m3_per_s2
    ey = (coeff_r * ry - rv_dot * vy) / mu_m3_per_s2
    ez = (coeff_r * rz - rv_dot * vz) / mu_m3_per_s2
    ecc = math.sqrt(ex * ex + ey * ey + ez * ez)

    # argp
    if n_mag == 0.0 or ecc == 0.0:
        argp = 0.0
    else:
        cos_argp = (nx * ex + ny * ey) / (n_mag * ecc)
        argp = math.acos(max(-1.0, min(1.0, cos_argp)))
        if ez < 0.0:
            argp = 2.0 * math.pi - argp

    # True anomaly ν, then mean anomaly M
    if ecc == 0.0:
        nu = 0.0
    else:
        cos_nu = (ex * rx + ey * ry + ez * rz) / (ecc * r_mag)
        nu = math.acos(max(-1.0, min(1.0, cos_nu)))
        if rv_dot < 0.0:
            nu = 2.0 * math.pi - nu

    # Eccentric anomaly E and mean anomaly M (elliptical only).
    if ecc < 1.0:
        # E from ν
        e_anom = 2.0 * math.atan2(
            math.sqrt(1.0 - ecc) * math.sin(nu / 2.0),
            math.sqrt(1.0 + ecc) * math.cos(nu / 2.0),
        )
        mean_anomaly = e_anom - ecc * math.sin(e_anom)
    else:
        mean_anomaly = nu

    # Semi-major axis from energy: ε = v²/2 - μ/r = -μ/(2 a)
    energy = 0.5 * v_mag2 - mu_m3_per_s2 / r_mag
    if abs(energy) < 1e-30:
        sma = float("inf")
    else:
        sma = -mu_m3_per_s2 / (2.0 * energy)

    return KeplerianElements(
        sma_m=sma,
        ecc=ecc,
        inc_rad=inc,
        raan_rad=raan,
        argp_rad=argp,
        mean_anomaly_rad=mean_anomaly,
    )
