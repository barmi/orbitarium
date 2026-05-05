"""Frame conversion tests: matrix invariants + ERFA / astropy cross-check."""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from astropy import units as u
from astropy.coordinates import (
    ICRS,
    BarycentricMeanEcliptic,
    CartesianRepresentation,
)
from astropy.time import Time

from orbitarium_tools.frames import (
    ECLIPTIC_J2000_TO_ICRF,
    EME2000_TO_ECLIPTIC_J2000,
    EME2000_TO_ICRF,
    EPS_J2000,
    ICRF_TO_ECLIPTIC_J2000,
    ICRF_TO_EME2000,
    IDENTITY_MATRIX3,
    erfa_frame_bias_matrix,
    generate_fixtures,
    icrf_to_ecliptic,
    mat_mul3,
    mat_vec3,
    transpose_matrix3,
)

# ---------- Embedded matrix sanity ----------


def test_identity_matrix3_is_identity() -> None:
    assert IDENTITY_MATRIX3 == (1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)


def test_icrf_to_eme2000_matches_erfa_bp00_bit_exact() -> None:
    """Embedded frame-bias matrix must match a fresh ERFA bp00 call exactly."""
    assert erfa_frame_bias_matrix() == ICRF_TO_EME2000


def test_frame_bias_off_diagonals_within_17_mas() -> None:
    # RB[0][1] ~ -14.6 mas, RB[0][2] ~ +16.6 mas, RB[1][2] ~ +6.8 mas
    off_diag = (
        ICRF_TO_EME2000[1],
        ICRF_TO_EME2000[2],
        ICRF_TO_EME2000[3],
        ICRF_TO_EME2000[5],
        ICRF_TO_EME2000[6],
        ICRF_TO_EME2000[7],
    )
    for x in off_diag:
        assert abs(x) < 1e-7  # < 21 mas
        assert abs(x) > 1e-9  # > 0.2 mas (real bias, not noise)


def test_eme2000_to_ecliptic_uses_eps_j2000() -> None:
    c = math.cos(EPS_J2000)
    s = math.sin(EPS_J2000)
    expected = (1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c)
    assert expected == EME2000_TO_ECLIPTIC_J2000


# ---------- Matrix orthogonality / round-trip ----------


def _is_orthogonal(m: tuple[float, ...], tol: float = 1e-14) -> None:
    product = mat_mul3(m, transpose_matrix3(m))  # type: ignore[arg-type]
    for i in range(9):
        is_diag = i in (0, 4, 8)
        expected = 1.0 if is_diag else 0.0
        assert abs(product[i] - expected) < tol, f"product[{i}]={product[i]}"


def test_icrf_to_eme2000_orthogonal() -> None:
    _is_orthogonal(ICRF_TO_EME2000)


def test_eme2000_to_ecliptic_orthogonal() -> None:
    _is_orthogonal(EME2000_TO_ECLIPTIC_J2000)


def test_icrf_to_ecliptic_orthogonal() -> None:
    _is_orthogonal(ICRF_TO_ECLIPTIC_J2000)


def test_eme2000_to_icrf_is_transpose() -> None:
    assert transpose_matrix3(ICRF_TO_EME2000) == EME2000_TO_ICRF


def test_ecliptic_to_icrf_is_transpose() -> None:
    assert transpose_matrix3(ICRF_TO_ECLIPTIC_J2000) == ECLIPTIC_J2000_TO_ICRF


# ---------- Vector transforms ----------


def test_round_trip_icrf_to_ecliptic_to_icrf() -> None:
    v = (1.5, -2.3, 0.8)
    back = mat_vec3(ECLIPTIC_J2000_TO_ICRF, mat_vec3(ICRF_TO_ECLIPTIC_J2000, v))
    for i in range(3):
        assert abs(back[i] - v[i]) < 1e-14


def test_icrf_x_axis_lies_on_ecliptic_plane_within_frame_bias() -> None:
    """ICRF X is the equinox direction; Z in ecliptic is near zero (frame bias ~21 mas)."""
    ecl = icrf_to_ecliptic((1.0, 0.0, 0.0))
    assert abs(ecl[2]) < 2e-7  # < 41 mas


def test_icrf_z_axis_tilts_in_ecliptic_by_eps() -> None:
    """R_x(eps) sends (0,0,1) -> (0, sin eps, cos eps). Frame bias adds ~17 mas."""
    ecl = icrf_to_ecliptic((0.0, 0.0, 1.0))
    assert abs(ecl[0]) < 2e-7
    assert abs(ecl[1] - math.sin(EPS_J2000)) < 1e-7
    assert abs(ecl[2] - math.cos(EPS_J2000)) < 1e-7


# ---------- astropy cross-check (independent reference) ----------


def _astropy_icrf_to_mean_ecliptic_j2000(v: tuple[float, float, float]) -> np.ndarray:
    """Use astropy to convert an ICRF vector to BarycentricMeanEcliptic at J2000."""
    icrs = ICRS(
        CartesianRepresentation(
            x=v[0] * u.dimensionless_unscaled,
            y=v[1] * u.dimensionless_unscaled,
            z=v[2] * u.dimensionless_unscaled,
        )
    )
    ecl = icrs.transform_to(BarycentricMeanEcliptic(equinox=Time("J2000.0")))
    xyz = ecl.cartesian.xyz.value
    return np.asarray(xyz, dtype=float)


def test_icrf_to_ecliptic_matches_astropy_within_1mas() -> None:
    """Our ICRF -> Ecliptic J2000 transform should agree with astropy to ~1 mas."""
    mas_rad = (1.0 / 1000.0 / 3600.0) * (math.pi / 180.0)
    cases: list[tuple[float, float, float]] = [
        (1.0, 0.0, 0.0),
        (0.0, 1.0, 0.0),
        (0.0, 0.0, 1.0),
        (1.0 / math.sqrt(3.0),) * 3,
        (1.5, -2.3, 0.8),
    ]
    for v in cases:
        ours = np.array(icrf_to_ecliptic(v), dtype=float)
        astro = _astropy_icrf_to_mean_ecliptic_j2000(v)
        diff = np.linalg.norm(ours - astro)
        length = max(np.linalg.norm(ours), 1.0)
        # 1 mas tolerance on direction => 1 mas * |v| on component RSS
        assert diff < 1.0 * mas_rad * length, (
            f"v={v}: |diff|={diff:.3e}, |v|={length:.3e}, "
            f"tol={mas_rad * length:.3e}"
        )


# ---------- Fixture generation ----------


def test_generate_fixtures_writes_valid_json(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    assert out_file.exists()
    assert out_file.name == "frames.json"
    data = json.loads(out_file.read_text())
    assert "fixtures" in data
    assert len(data["fixtures"]) >= 10
    assert "matrices" in data
    assert "icrf_to_eme2000" in data["matrices"]
    assert len(data["matrices"]["icrf_to_eme2000"]) == 9


def test_generate_fixtures_self_consistent(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    data = json.loads(out_file.read_text())
    for entry in data["fixtures"]:
        v: tuple[float, float, float] = (
            entry["icrf"][0],
            entry["icrf"][1],
            entry["icrf"][2],
        )
        eme = mat_vec3(ICRF_TO_EME2000, v)
        ecl = mat_vec3(ICRF_TO_ECLIPTIC_J2000, v)
        for i in range(3):
            assert eme[i] == entry["eme2000"][i]
            assert ecl[i] == entry["ecliptic_j2000"][i]
