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
