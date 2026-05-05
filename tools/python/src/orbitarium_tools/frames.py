"""Reference frame conversions — Python reference, mirrors `src/astro/frames.ts`.

Two roles (same as `time.py`):
  1. **Bit-identical mirror** of the TS algorithm. Fixtures generated here are
     consumed by the TS test suite at sub-mas tolerance.
  2. **astropy / ERFA cross-check**: verify the embedded frame-bias matrix
     against ERFA `bp00` and full transforms against astropy.coordinates at
     1 mas tolerance.

Matrices are stored as 9-tuples in row-major order. 3-vectors are 3-tuples.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Final

import erfa  # type: ignore[import-untyped]

# Mirror of `src/astro/constants.ts::EPS_J2000`.
EPS_J2000: Final[float] = 0.4090926006005829

# 3x3 matrix as a 9-tuple in row-major order.
Matrix3 = tuple[
    float, float, float,
    float, float, float,
    float, float, float,
]

Vec3 = tuple[float, float, float]


def mat_vec3(m: Matrix3, v: Vec3) -> Vec3:
    """Multiply a row-major 3x3 matrix by a column 3-vector: M.v."""
    return (
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
        m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
        m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
    )


def mat_mul3(a: Matrix3, b: Matrix3) -> Matrix3:
    """Multiply two row-major 3x3 matrices: A.B."""
    return (
        a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
        a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
        a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
        a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
        a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
        a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
        a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
        a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
        a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
    )


def transpose_matrix3(m: Matrix3) -> Matrix3:
    return (m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8])


IDENTITY_MATRIX3: Final[Matrix3] = (1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)


# ICRF -> EME2000 frame bias matrix from ERFA bp00 (IAU 2006/2000A).
# Hardcoded to mirror the TS source exactly; verified at runtime in tests.
ICRF_TO_EME2000: Final[Matrix3] = (
    0.9999999999999942, -7.078279744199198e-8, 8.056217146976134e-8,
    7.078279477857338e-8, 0.9999999999999969, 3.3060414542221364e-8,
    -8.056217380986972e-8, -3.3060408839805523e-8, 0.9999999999999962,
)
EME2000_TO_ICRF: Final[Matrix3] = transpose_matrix3(ICRF_TO_EME2000)

_COS_EPS = math.cos(EPS_J2000)
_SIN_EPS = math.sin(EPS_J2000)
EME2000_TO_ECLIPTIC_J2000: Final[Matrix3] = (
    1.0, 0.0, 0.0,
    0.0, _COS_EPS, _SIN_EPS,
    0.0, -_SIN_EPS, _COS_EPS,
)
ECLIPTIC_J2000_TO_EME2000: Final[Matrix3] = transpose_matrix3(EME2000_TO_ECLIPTIC_J2000)

ICRF_TO_ECLIPTIC_J2000: Final[Matrix3] = mat_mul3(
    EME2000_TO_ECLIPTIC_J2000, ICRF_TO_EME2000
)
ECLIPTIC_J2000_TO_ICRF: Final[Matrix3] = transpose_matrix3(ICRF_TO_ECLIPTIC_J2000)


# Vector convenience wrappers -------------------------------------------------


def icrf_to_eme2000(v: Vec3) -> Vec3:
    return mat_vec3(ICRF_TO_EME2000, v)


def eme2000_to_icrf(v: Vec3) -> Vec3:
    return mat_vec3(EME2000_TO_ICRF, v)


def eme2000_to_ecliptic(v: Vec3) -> Vec3:
    return mat_vec3(EME2000_TO_ECLIPTIC_J2000, v)


def ecliptic_to_eme2000(v: Vec3) -> Vec3:
    return mat_vec3(ECLIPTIC_J2000_TO_EME2000, v)


def icrf_to_ecliptic(v: Vec3) -> Vec3:
    return mat_vec3(ICRF_TO_ECLIPTIC_J2000, v)


def ecliptic_to_icrf(v: Vec3) -> Vec3:
    return mat_vec3(ECLIPTIC_J2000_TO_ICRF, v)


def erfa_frame_bias_matrix() -> Matrix3:
    """Return the ICRF -> EME2000 frame bias from ERFA bp00 directly.

    Reference for cross-check tests; should match `ICRF_TO_EME2000` to one ULP
    because ERFA/libm builds can differ in the final bit.
    """
    rb, _, _ = erfa.bp00(2451545.0, 0.0)
    return tuple(float(x) for x in rb.flatten())  # type: ignore[return-value]


# Fixture generation -----------------------------------------------------------

# Representative test vectors for cross-platform verification.
# Mix of unit axes, normalized random directions, and a large-magnitude vector.
_TEST_VECTORS_ICRF: Final[tuple[Vec3, ...]] = (
    # Unit axes (probe each rotation independently)
    (1.0, 0.0, 0.0),  # vernal equinox direction (X)
    (0.0, 1.0, 0.0),
    (0.0, 0.0, 1.0),  # ICRF Z-axis (close to celestial north pole)
    (-1.0, 0.0, 0.0),
    (0.0, -1.0, 0.0),
    (0.0, 0.0, -1.0),
    # Diagonal unit-vector
    (
        1.0 / math.sqrt(3.0),
        1.0 / math.sqrt(3.0),
        1.0 / math.sqrt(3.0),
    ),
    # Random directions (some normalized, some not)
    (0.5, 0.7, 0.5),
    (1.5, -2.3, 0.8),
    (-3.7, 1.2, 4.5),
    # Large-magnitude vector (simulates a position at ~1 AU in meters)
    (1.495978707e11, 0.0, 0.0),
    (0.0, 1.495978707e11, 0.0),
)


def generate_fixtures(out_dir: Path | str) -> Path:
    """Generate `frames.json` with golden conversions and the embedded matrices."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    fixtures: list[dict[str, Any]] = []
    for v in _TEST_VECTORS_ICRF:
        v_eme = mat_vec3(ICRF_TO_EME2000, v)
        v_ecl = mat_vec3(ICRF_TO_ECLIPTIC_J2000, v)
        v_back = mat_vec3(ECLIPTIC_J2000_TO_ICRF, v_ecl)
        fixtures.append(
            {
                "icrf": list(v),
                "eme2000": list(v_eme),
                "ecliptic_j2000": list(v_ecl),
                "round_trip_icrf": list(v_back),
            }
        )

    out_file = out_path / "frames.json"
    payload = {
        "_comment": (
            "Generated by orbitarium_tools.frames.generate_fixtures. "
            "Re-run: orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/"
        ),
        "_source": (
            "ERFA bp00 frame bias (IAU 2006/2000A) + IAU 2006 obliquity at J2000.0. "
            "No precession/nutation applied."
        ),
        "_tolerance_mas": 1,
        "matrices": {
            "icrf_to_eme2000": list(ICRF_TO_EME2000),
            "eme2000_to_ecliptic_j2000": list(EME2000_TO_ECLIPTIC_J2000),
            "icrf_to_ecliptic_j2000": list(ICRF_TO_ECLIPTIC_J2000),
        },
        "fixtures": fixtures,
    }
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return out_file
