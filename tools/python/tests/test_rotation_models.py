"""Tests for the Work 6 P2 IAU rotation model extension."""

from __future__ import annotations

import math

from orbitarium_tools.rotation import (
    EARTH_IAU_ROTATION,
    IAU_ROTATION_MODELS,
    JUPITER_IAU_ROTATION,
    MERCURY_IAU_ROTATION,
    MOON_IAU_ROTATION,
    NEPTUNE_IAU_ROTATION,
    SUN_IAU_ROTATION,
    URANUS_IAU_ROTATION,
    VENUS_IAU_ROTATION,
    evaluate_rotation,
    get_iau_rotation_model,
    inertial_to_body_fixed,
    spice_inertial_to_body_fixed,
)
from orbitarium_tools.time import J2000_JD_TDB


def test_iau_rotation_models_lists_eleven_keys() -> None:
    assert sorted(IAU_ROTATION_MODELS.keys()) == [
        "earth",
        "jupiter",
        "mars",
        "mercury",
        "moon",
        "neptune",
        "pluto",
        "saturn",
        "sun",
        "uranus",
        "venus",
    ]


def test_iau_naif_ids_are_correct() -> None:
    expected = {
        "sun": 10,
        "mercury": 199,
        "venus": 299,
        "earth": 399,
        "moon": 301,
        "mars": 499,
        "jupiter": 599,
        "saturn": 699,
        "uranus": 799,
        "neptune": 899,
        "pluto": 999,
    }
    for key, expected_id in expected.items():
        assert IAU_ROTATION_MODELS[key].naif_id == expected_id


def test_get_iau_rotation_model_lookup() -> None:
    assert get_iau_rotation_model("jupiter") is JUPITER_IAU_ROTATION
    assert get_iau_rotation_model("tidally-locked") is None


def test_earth_polynomial_unchanged_from_p4() -> None:
    assert EARTH_IAU_ROTATION.pole_ra.polynomial.coefficients == (0.0, -0.641, 0.0)
    assert EARTH_IAU_ROTATION.pole_dec.polynomial.coefficients == (90.0, -0.557, 0.0)
    assert EARTH_IAU_ROTATION.prime_meridian.polynomial.coefficients == (
        190.147,
        360.9856235,
        0.0,
    )


def test_sun_carrington_pm_rate() -> None:
    assert SUN_IAU_ROTATION.prime_meridian.polynomial.coefficients[1] == 14.1844


def test_venus_pm_rate_negative_retrograde() -> None:
    assert VENUS_IAU_ROTATION.prime_meridian.polynomial.coefficients[1] < 0


def test_uranus_dec_negative_retrograde_axis() -> None:
    assert URANUS_IAU_ROTATION.pole_dec.polynomial.coefficients[0] < 0


def test_mercury_moon_neptune_source_strings_mention_omitted_terms() -> None:
    assert "libration" in MERCURY_IAU_ROTATION.source
    assert "nutation" in MOON_IAU_ROTATION.source
    assert "Work 11" in NEPTUNE_IAU_ROTATION.source


def test_evaluate_rotation_sun_at_j2000() -> None:
    angles = evaluate_rotation(SUN_IAU_ROTATION, J2000_JD_TDB)
    assert math.isclose(angles.ra_deg, 286.13, abs_tol=1e-6)
    assert math.isclose(angles.dec_deg, 63.87, abs_tol=1e-6)


def test_evaluate_rotation_earth_w_at_j2000() -> None:
    angles = evaluate_rotation(EARTH_IAU_ROTATION, J2000_JD_TDB)
    assert math.isclose(angles.w_deg, 190.147, abs_tol=1e-6)


def test_inertial_to_body_fixed_jupiter_orthonormal() -> None:
    m = inertial_to_body_fixed(JUPITER_IAU_ROTATION, J2000_JD_TDB)
    row0_sq = m[0] ** 2 + m[1] ** 2 + m[2] ** 2
    assert math.isclose(row0_sq, 1.0, abs_tol=1e-12)


def test_spice_polynomial_only_diff_within_machine_precision() -> None:
    """All 11 models — polynomial-only PCK eval matches Python implementation."""
    sample_jds = [
        2_415_020.5,
        J2000_JD_TDB,
        2_446_456.5,
        2_461_166.5,
        2_488_069.5,
    ]
    for key, model in IAU_ROTATION_MODELS.items():
        for jd in sample_jds:
            ts_matrix = inertial_to_body_fixed(model, jd)
            spice_matrix = spice_inertial_to_body_fixed(model, jd)
            max_diff = max(
                abs(a - b) for a, b in zip(ts_matrix, spice_matrix, strict=True)
            )
            assert max_diff < 1e-10, f"{key} @ jd={jd}: diff={max_diff}"
