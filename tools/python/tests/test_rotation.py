"""IAU Earth rotation model tests: evaluator invariants + SPICE cross-check."""

from __future__ import annotations

import json
import math
from pathlib import Path

from orbitarium_tools.frames import mat_mul3, transpose_matrix3
from orbitarium_tools.rotation import (
    EARTH_IAU_ROTATION,
    J2000_JD_TDB,
    IAUAngleModel,
    IAUPeriodicTerm,
    IAUPolynomialDegrees,
    body_fixed_to_inertial,
    earth_spice_pck_lines,
    evaluate_angle_model,
    evaluate_rotation,
    generate_fixtures,
    inertial_to_body_fixed,
    normalize_degrees,
    spice_earth_inertial_to_body_fixed,
)


def test_earth_model_matches_naif_pck00011_body399_constants() -> None:
    assert EARTH_IAU_ROTATION.naif_id == 399
    assert EARTH_IAU_ROTATION.frame_name == "IAU_EARTH"
    assert EARTH_IAU_ROTATION.pole_ra.polynomial.coefficients == (0.0, -0.641, 0.0)
    assert EARTH_IAU_ROTATION.pole_dec.polynomial.coefficients == (90.0, -0.557, 0.0)
    assert EARTH_IAU_ROTATION.prime_meridian.polynomial.coefficients == (
        190.147,
        360.9856235,
        0.0,
    )


def test_earth_spice_pck_lines_use_body399_variables() -> None:
    lines = earth_spice_pck_lines()
    assert "BODY399_POLE_RA" in lines[0]
    assert "BODY399_POLE_DEC" in lines[1]
    assert "BODY399_PM" in lines[2]
    assert "BODY399_LONG_AXIS" in lines[3]


def test_evaluate_earth_rotation_at_j2000() -> None:
    angles = evaluate_rotation(EARTH_IAU_ROTATION, J2000_JD_TDB)
    assert angles.ra_deg == 0.0
    assert angles.dec_deg == 90.0
    assert angles.w_deg == 190.147


def test_normalize_degrees_wraps_negative_and_large_values() -> None:
    assert normalize_degrees(-0.25) == 359.75
    assert normalize_degrees(720.5) == 0.5


def test_evaluate_angle_model_supports_periodic_terms() -> None:
    angle = evaluate_angle_model(
        IAUAngleModel(
            polynomial=IAUPolynomialDegrees("d", (10.0,)),
            periodic_terms=(
                IAUPeriodicTerm(2.0, "sin", IAUPolynomialDegrees("d", (90.0,))),
                IAUPeriodicTerm(3.0, "cos", IAUPolynomialDegrees("d", (0.0,))),
            ),
        ),
        0.0,
    )
    assert angle == 15.0


def _assert_orthogonal(m: tuple[float, ...], tol: float = 1e-14) -> None:
    product = mat_mul3(m, transpose_matrix3(m))  # type: ignore[arg-type]
    for i in range(9):
        expected = 1.0 if i in (0, 4, 8) else 0.0
        assert abs(product[i] - expected) < tol, f"product[{i}]={product[i]}"


def test_earth_rotation_matrix_is_orthogonal() -> None:
    _assert_orthogonal(inertial_to_body_fixed(EARTH_IAU_ROTATION, 2461165.5))


def test_body_fixed_to_inertial_is_transpose() -> None:
    jd_tdb = 2461165.5
    assert body_fixed_to_inertial(EARTH_IAU_ROTATION, jd_tdb) == transpose_matrix3(
        inertial_to_body_fixed(EARTH_IAU_ROTATION, jd_tdb)
    )


def test_earth_inertial_to_body_fixed_matches_spice_text_pck_within_1mas() -> None:
    matrix_tolerance = math.radians(1.0 / 1000.0 / 3600.0)
    for jd_tdb in (
        J2000_JD_TDB - 36525.0 / 2.0,
        J2000_JD_TDB,
        J2000_JD_TDB + 0.5,
        2460435.5,
        J2000_JD_TDB + 36525.0 / 2.0,
    ):
        ours = inertial_to_body_fixed(EARTH_IAU_ROTATION, jd_tdb)
        spice_matrix = spice_earth_inertial_to_body_fixed(jd_tdb)
        max_abs_diff = max(abs(a - b) for a, b in zip(ours, spice_matrix, strict=True))
        assert max_abs_diff < matrix_tolerance


def test_generate_fixtures_writes_rotation_earth_json(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    data = json.loads(out_file.read_text())
    assert out_file.name == "rotation-earth.json"
    assert data["model"]["naif_id"] == 399
    assert data["fixtures"]
    assert any(entry["label"] == "work_02_current_date" for entry in data["fixtures"])


def test_generate_fixtures_self_consistent(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    data = json.loads(out_file.read_text())
    for entry in data["fixtures"]:
        jd_tdb = entry["jd_tdb"]
        angles = evaluate_rotation(EARTH_IAU_ROTATION, jd_tdb)
        matrix = inertial_to_body_fixed(EARTH_IAU_ROTATION, jd_tdb)
        assert angles.ra_deg == entry["ra_deg"]
        assert angles.dec_deg == entry["dec_deg"]
        assert angles.w_deg == entry["w_deg"]
        for actual, expected in zip(matrix, entry["inertial_to_body_fixed"], strict=True):
            assert actual == expected
