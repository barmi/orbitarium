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

    # Specific angular momentum h = r x v
    hx = ry * vz - rz * vy
    hy = rz * vx - rx * vz
    hz = rx * vy - ry * vx
    h_mag = math.sqrt(hx * hx + hy * hy + hz * hz)

    # Inclination: cos(inc) = hz / h_mag
    inc = math.acos(max(-1.0, min(1.0, hz / h_mag))) if h_mag > 0 else 0.0

    # Node line N = k x h = (-hy, hx, 0)
    nx, ny = -hy, hx
    n_mag = math.sqrt(nx * nx + ny * ny)

    # RAAN
    if n_mag == 0.0:
        raan = 0.0
    else:
        raan = math.acos(max(-1.0, min(1.0, nx / n_mag)))
        if ny < 0.0:
            raan = 2.0 * math.pi - raan

    # Eccentricity vector e = ((v^2 - mu/r) r - (r dot v) v) / mu
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

    # True anomaly nu, then mean anomaly M
    if ecc == 0.0:
        nu = 0.0
    else:
        cos_nu = (ex * rx + ey * ry + ez * rz) / (ecc * r_mag)
        nu = math.acos(max(-1.0, min(1.0, cos_nu)))
        if rv_dot < 0.0:
            nu = 2.0 * math.pi - nu

    # Eccentric anomaly E_anom and mean anomaly M (elliptical only).
    if ecc < 1.0:
        # E from nu
        e_anom = 2.0 * math.atan2(
            math.sqrt(1.0 - ecc) * math.sin(nu / 2.0),
            math.sqrt(1.0 + ecc) * math.cos(nu / 2.0),
        )
        mean_anomaly = e_anom - ecc * math.sin(e_anom)
    else:
        mean_anomaly = nu

    # Semi-major axis from energy: eps = v^2/2 - mu/r = -mu/(2 a)
    energy = 0.5 * v_mag2 - mu_m3_per_s2 / r_mag
    sma = float("inf") if abs(energy) < 1e-30 else -mu_m3_per_s2 / (2.0 * energy)

    return KeplerianElements(
        sma_m=sma,
        ecc=ecc,
        inc_rad=inc,
        raan_rad=raan,
        argp_rad=argp,
        mean_anomaly_rad=mean_anomaly,
    )


_AU_M: Final[float] = 149_597_870_700.0
SMA_BELT_MIN_AU: Final[float] = 2.2
SMA_BELT_MAX_AU: Final[float] = 3.3
ECC_BELT_MAX: Final[float] = 0.2
INC_BELT_MAX_RAD: Final[float] = 15.0 * math.pi / 180.0


def _mulberry32(seed: int) -> object:
    """Mulberry32 PRNG mirroring src/orbits/AsteroidBelt.tsx (deterministic)."""
    state = [seed & 0xFFFFFFFF]

    def _next() -> float:
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + ((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return _next


def generate_asteroid_belt(
    count: int = ASTEROID_BELT_DEFAULT_COUNT,
    seed: int = 1,
) -> list[tuple[float, float, float]]:
    """Deterministic synthetic main-belt positions (m, ICRF, SSB).

    Distribution matches ``src/orbits/AsteroidBelt.tsx`` so the TS belt and
    Python-generated belt agree bit-for-bit (modulo unavoidable FP).
    """
    rng = _mulberry32(seed)
    out: list[tuple[float, float, float]] = []
    for _ in range(count):
        sma = SMA_BELT_MIN_AU + rng() * (SMA_BELT_MAX_AU - SMA_BELT_MIN_AU)  # type: ignore[operator]
        ecc = rng() * ECC_BELT_MAX  # type: ignore[operator]
        inc = (rng() * 2 - 1) * INC_BELT_MAX_RAD  # type: ignore[operator]
        true_anom = rng() * 2 * math.pi  # type: ignore[operator]
        r = sma * (1 - ecc * ecc) / (1 + ecc * math.cos(true_anom))
        x_plane = r * math.cos(true_anom)
        y_plane = r * math.sin(true_anom)
        x = x_plane
        y = y_plane * math.cos(inc)
        z = y_plane * math.sin(inc)
        out.append((x * _AU_M, y * _AU_M, z * _AU_M))
    return out


def generate_fixtures(out_dir: object) -> tuple[object, object]:
    """Generate Work 7 golden fixtures (keplerian + asteroid-belt)."""
    import json
    from pathlib import Path

    out = Path(str(out_dir))
    out.mkdir(parents=True, exist_ok=True)

    au = 149_597_870_700.0
    v_circ = math.sqrt(GM_SUN_M3_PER_S2 / au)

    cases: list[dict[str, object]] = [
        {
            "name": "circular_1au",
            "position_m": [au, 0.0, 0.0],
            "velocity_m_per_s": [0.0, v_circ, 0.0],
        },
        {
            "name": "ecc_0.0167_at_perihelion",
            "position_m": [au * (1 - 0.0167), 0.0, 0.0],
            "velocity_m_per_s": [
                0.0,
                math.sqrt(GM_SUN_M3_PER_S2 * (2.0 / (au * (1 - 0.0167)) - 1.0 / au)),
                0.0,
            ],
        },
        {
            "name": "inclined_23.5deg",
            "position_m": [au, 0.0, 0.0],
            "velocity_m_per_s": [
                0.0,
                v_circ * math.cos(math.radians(23.5)),
                v_circ * math.sin(math.radians(23.5)),
            ],
        },
    ]
    rows: list[dict[str, object]] = []
    for case in cases:
        elements = extract_keplerian(
            case["position_m"],  # type: ignore[arg-type]
            case["velocity_m_per_s"],  # type: ignore[arg-type]
        )
        rows.append(
            {
                **case,
                "sma_m": elements.sma_m,
                "ecc": elements.ecc,
                "inc_rad": elements.inc_rad,
                "raan_rad": elements.raan_rad,
                "argp_rad": elements.argp_rad,
                "mean_anomaly_rad": elements.mean_anomaly_rad,
            }
        )
    kep_payload: dict[str, object] = {
        "_comment": "Generated by orbitarium_tools.orbits.generate_fixtures (Vallado RV2COE).",
        "_tolerance_rel": 1e-6,
        "_mu_m3_per_s2": GM_SUN_M3_PER_S2,
        "samples": rows,
    }
    kep_path = out / "keplerian.json"
    with kep_path.open("w", encoding="utf-8") as f:
        json.dump(kep_payload, f, indent=2)
        f.write("\n")

    belt = generate_asteroid_belt(count=64, seed=1)
    belt_payload: dict[str, object] = {
        "_comment": "Synthetic main-belt (Mulberry32 seed=1, count=64).",
        "_tolerance_au": 1e-12,
        "count": len(belt),
        "seed": 1,
        "positions_m": [list(p) for p in belt],
    }
    belt_path = out / "asteroid-belt.json"
    with belt_path.open("w", encoding="utf-8") as f:
        json.dump(belt_payload, f, indent=2)
        f.write("\n")
    return kep_path, belt_path
