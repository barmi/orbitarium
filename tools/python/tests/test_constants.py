"""Cross-validation: TS-mirrored constants vs astropy / ERFA standards."""

from __future__ import annotations

import erfa
from astropy import constants as const

from orbitarium_tools.constants import (
    AU,
    C_LIGHT,
    EPS_J2000,
    GM,
    LIGHT_TIME_AU,
)


def test_au_matches_iau2012_defining_value() -> None:
    assert AU == 149_597_870_700


def test_c_matches_si_defining_value() -> None:
    assert C_LIGHT == 299_792_458


def test_light_time_au_is_au_over_c() -> None:
    assert LIGHT_TIME_AU == AU / C_LIGHT


def test_au_matches_astropy() -> None:
    assert const.au.value == AU


def test_c_matches_astropy() -> None:
    assert const.c.value == C_LIGHT


def test_eps_j2000_matches_erfa_obl06() -> None:
    """IAU 2006 mean obliquity at J2000.0 from ERFA."""
    assert erfa.obl06(2451545.0, 0.0) == EPS_J2000


def test_eps_j2000_arcsec_is_84381p406() -> None:
    """Round-trip rad → arcsec should yield the canonical 84381.406 arcsec."""
    import math

    arcsec = EPS_J2000 * 180 * 3600 / math.pi
    assert abs(arcsec - 84381.406) < 1e-9


def test_gm_sun_matches_de440() -> None:
    # 1.32712440041279419e20 (DE440 publication) rounds to this IEEE 754 double.
    assert GM["sun"] == 1.3271244004127942e20


def test_gm_sun_consistent_with_iau2015_nominal_to_7_digits() -> None:
    iau2015_nominal = 1.3271244e20
    rel_err = abs(GM["sun"] - iau2015_nominal) / iau2015_nominal
    assert rel_err < 1e-7


def test_gm_sun_matches_astropy_iau2015() -> None:
    """astropy's GM_sun is the IAU 2015 nominal (7 digits); DE440 is more precise."""
    rel_err = abs(GM["sun"] - const.GM_sun.value) / const.GM_sun.value
    assert rel_err < 1e-7


def test_gm_earth_matches_astropy_iau2015() -> None:
    rel_err = abs(GM["earth"] - const.GM_earth.value) / const.GM_earth.value
    assert rel_err < 1e-7


def test_gm_values_all_positive() -> None:
    for name, v in GM.items():
        assert v > 0, f"GM[{name}] must be positive"


def test_gm_ordering_by_mass() -> None:
    assert GM["sun"] > GM["jupiter_bary"]
    assert GM["jupiter_bary"] > GM["saturn_bary"]
    assert GM["saturn_bary"] > GM["neptune_bary"]
    assert GM["neptune_bary"] > GM["uranus_bary"]
    assert GM["uranus_bary"] > GM["earth_moon_bary"]
    assert GM["earth_moon_bary"] > GM["venus_bary"]
    assert GM["venus_bary"] > GM["mars_bary"]
    assert GM["mars_bary"] > GM["mercury_bary"]
    assert GM["mercury_bary"] > GM["pluto_bary"]


def test_earth_moon_barycenter_equals_earth_plus_moon_to_de440_precision() -> None:
    s = GM["earth"] + GM["moon"]
    rel_err = abs(s - GM["earth_moon_bary"]) / GM["earth_moon_bary"]
    # DE440 publishes earth_moon_bary independently; mismatch ~1e-9 expected.
    assert rel_err < 1e-8
