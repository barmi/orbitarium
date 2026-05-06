"""Tests for orbitarium_tools.orbits (Work 7)."""

from __future__ import annotations

from orbitarium_tools.orbits import (
    ASTEROID_BELT_DEFAULT_COUNT,
    DEFAULT_PREDICT_DAYS,
    DEFAULT_SAMPLE_COUNT,
    DEFAULT_TRAIL_DAYS,
    ORBIT_TOL_M,
    ORBIT_TOL_MM,
    OrbitPolyline,
    OrbitSample,
    PredictConfig,
    TrailConfig,
)


def test_constants() -> None:
    assert ORBIT_TOL_MM == 1.0
    assert ORBIT_TOL_M == 100.0
    assert DEFAULT_TRAIL_DAYS == 365
    assert DEFAULT_PREDICT_DAYS == 365
    assert DEFAULT_SAMPLE_COUNT == 256
    assert ASTEROID_BELT_DEFAULT_COUNT == 256


def test_default_configs() -> None:
    trail = TrailConfig()
    predict = PredictConfig()
    assert trail.duration_days == DEFAULT_TRAIL_DAYS
    assert trail.sample_count == DEFAULT_SAMPLE_COUNT
    assert predict.duration_days == DEFAULT_PREDICT_DAYS
    assert predict.sample_count == DEFAULT_SAMPLE_COUNT


def test_orbit_sample_dataclass() -> None:
    s = OrbitSample(jd_tdb=2_451_545.0, position_m=(1.0, 2.0, 3.0))
    assert s.jd_tdb == 2_451_545.0
    assert s.position_m == (1.0, 2.0, 3.0)


def test_orbit_polyline_dataclass() -> None:
    p = OrbitPolyline(naif_id=399, jd_tdbs=(2_451_545.0,), positions_m=((1.0, 0.0, 0.0),))
    assert p.naif_id == 399
    assert len(p.jd_tdbs) == len(p.positions_m)


import math  # noqa: E402

from orbitarium_tools.orbits import (  # noqa: E402
    GM_SUN_M3_PER_S2,
    extract_keplerian,
)


def test_keplerian_circular_earth_orbit() -> None:
    """Earth at 1 AU on +x with circular velocity → ecc ≈ 0, inc ≈ 0."""
    au = 149_597_870_700.0
    v_circ = math.sqrt(GM_SUN_M3_PER_S2 / au)  # circular speed at 1 AU
    elements = extract_keplerian(
        position_m=(au, 0.0, 0.0),
        velocity_m_per_s=(0.0, v_circ, 0.0),
    )
    assert math.isclose(elements.sma_m, au, rel_tol=1e-9)
    assert elements.ecc < 1e-12
    assert elements.inc_rad < 1e-12


def test_keplerian_inclined_orbit() -> None:
    au = 149_597_870_700.0
    v_circ = math.sqrt(GM_SUN_M3_PER_S2 / au)
    inc_target = math.radians(23.5)
    elements = extract_keplerian(
        position_m=(au, 0.0, 0.0),
        velocity_m_per_s=(0.0, v_circ * math.cos(inc_target), v_circ * math.sin(inc_target)),
    )
    assert math.isclose(elements.inc_rad, inc_target, rel_tol=1e-6)


def test_keplerian_elliptical_orbit() -> None:
    """Earth-like elliptical orbit with eccentricity ~0.0167."""
    au = 149_597_870_700.0
    a_target = au
    e_target = 0.0167
    perihelion_r = a_target * (1.0 - e_target)
    v_perihelion = math.sqrt(
        GM_SUN_M3_PER_S2 * (2.0 / perihelion_r - 1.0 / a_target)
    )
    elements = extract_keplerian(
        position_m=(perihelion_r, 0.0, 0.0),
        velocity_m_per_s=(0.0, v_perihelion, 0.0),
    )
    assert math.isclose(elements.sma_m, a_target, rel_tol=1e-9)
    assert math.isclose(elements.ecc, e_target, rel_tol=1e-6)
