"""Horizons API wrapper tests.

These tests hit the live JPL Horizons service and skip gracefully when offline.
"""

from __future__ import annotations

import socket
from pathlib import Path

import numpy as np
import pytest

from orbitarium_tools.horizons import (
    HorizonsQueryResult,
    cli_describe,
    query_state,
)


def _have_internet() -> bool:
    try:
        socket.create_connection(("ssd.jpl.nasa.gov", 443), timeout=3).close()
        return True
    except OSError:
        return False


SPK_CACHE = Path(__file__).resolve().parent.parent / ".cache" / "de440" / "de440.bsp"


def test_query_state_returns_si_units_at_j2000() -> None:
    if not _have_internet():
        pytest.skip("Horizons not reachable")
    result = query_state(399, 2451545.0)
    assert isinstance(result, HorizonsQueryResult)
    assert result.naif_id == 399
    # Earth at J2000 should be ~ 1 AU from SSB (SSB is near the Sun's center
    # of mass, displaced by Jupiter's pull). Sanity check magnitude is in
    # meters, not AU.
    px, py, pz = result.state.position
    r = (px * px + py * py + pz * pz) ** 0.5
    assert 1.4e11 < r < 1.6e11, f"unexpected |r| = {r:.3e} m"


def test_outer_planet_alias_routes_to_barycenter() -> None:
    if not _have_internet():
        pytest.skip("Horizons not reachable")
    # Mars body (499) aliases to Mars barycenter (4) inside our wrapper.
    result = query_state(499, 2451545.0)
    assert result.requested_naif_id == 4
    assert result.naif_id == 499


def test_horizons_matches_local_spiceypy_within_horizons_text_precision() -> None:
    """Horizons (live) vs local DE440 evaluator agree within Horizons text precision.

    Both the live Horizons service and our local kernel are DE440 underneath,
    so any disagreement comes from Horizons returning AU-format vectors with
    ~14 significant digits (precision floor ~1 cm at 1 AU). Our evaluator
    keeps the full f64 precision (Work 3 P3 confirms < 1 mm vs spiceypy).
    The tolerance here is therefore the Horizons text-format floor, not our
    DE440 evaluator's intrinsic accuracy budget.
    """
    if not _have_internet():
        pytest.skip("Horizons not reachable")
    if not SPK_CACHE.exists():
        pytest.skip("DE440 SPK kernel not cached locally")

    import spiceypy as sp  # type: ignore[import-untyped]

    pos_tol_m = 1e-2  # ~10 mm = Horizons AU-format precision floor at 1 AU
    vel_tol_m_s = 1e-6

    sp.furnsh(str(SPK_CACHE))
    try:
        bodies = (10, 3, 399, 4, 5)  # Sun, Earth-Moon bary, Earth, Mars bary, Jupiter bary
        jd = 2451545.0
        for body in bodies:
            hz = query_state(body, jd)
            from orbitarium_tools.de440 import PLANET_BODY_ALIASES

            spice_target = str(PLANET_BODY_ALIASES.get(body, body))
            et = (jd - 2451545.0) * 86400.0
            state, _lt = sp.spkezr(spice_target, et, "J2000", "NONE", "0")
            ref_pos = np.asarray(state[:3]) * 1000.0
            ref_vel = np.asarray(state[3:]) * 1000.0  # SPICE returns km/s
            pos_diff = float(np.max(np.abs(np.asarray(hz.state.position) - ref_pos)))
            vel_diff = float(np.max(np.abs(np.asarray(hz.state.velocity) - ref_vel)))
            assert pos_diff < pos_tol_m, (
                f"body={body}: Horizons-spice pos diff {pos_diff:.3e} m"
            )
            assert vel_diff < vel_tol_m_s, (
                f"body={body}: Horizons-spice vel diff {vel_diff:.3e} m/s"
            )
    finally:
        sp.kclear()


def test_cli_describe_formats_alias_suffix() -> None:
    """Format check; pure transformation, no network."""
    from orbitarium_tools.ephemeris import StateVectorICRF

    result = HorizonsQueryResult(
        naif_id=499,
        requested_naif_id=4,
        jd_tdb=2451545.0,
        state=StateVectorICRF(
            naif_id=499,
            jd_tdb=2451545.0,
            position=(2.0e11, -3.0e10, 1.0e9),
            velocity=(2.5e4, 1.5e4, -0.5e3),
        ),
    )
    text = cli_describe(result)
    assert "NAIF 499" in text
    assert "(-> 4)" in text
    assert "JD TDB 2451545.0" in text
    assert "position (m)" in text
    assert "velocity (m/s)" in text


def test_cli_describe_no_alias_suffix_when_same_id() -> None:
    """Sun (10) is not aliased."""
    from orbitarium_tools.ephemeris import StateVectorICRF

    result = HorizonsQueryResult(
        naif_id=10,
        requested_naif_id=10,
        jd_tdb=2451545.0,
        state=StateVectorICRF(
            naif_id=10,
            jd_tdb=2451545.0,
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 0.0, 0.0),
        ),
    )
    text = cli_describe(result)
    assert "NAIF 10 @" in text
    assert "->" not in text
