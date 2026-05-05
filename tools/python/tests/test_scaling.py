from orbitarium_tools.scaling import (
    BODY_MEAN_EQUATORIAL_RADIUS_M,
    EARTH_MEAN_EQUATORIAL_RADIUS_M,
    SCALE_BODY_NAIF_IDS,
    SCALE_TOL_M,
    SCALE_TOL_SIZE_M,
)


def test_tolerances_are_one_mm() -> None:
    assert SCALE_TOL_M == 1e-3
    assert SCALE_TOL_SIZE_M == 1e-3


def test_earth_radius_matches_iau() -> None:
    assert EARTH_MEAN_EQUATORIAL_RADIUS_M == 6_378_136.6


def test_body_radius_table_covers_eleven_entries() -> None:
    assert len(SCALE_BODY_NAIF_IDS) == 11
    for naif_id in SCALE_BODY_NAIF_IDS:
        assert BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id] > 0


def test_sun_largest_pluto_smallest() -> None:
    radii = [BODY_MEAN_EQUATORIAL_RADIUS_M[i] for i in SCALE_BODY_NAIF_IDS]
    assert max(radii) == BODY_MEAN_EQUATORIAL_RADIUS_M[10]
    assert min(radii) == BODY_MEAN_EQUATORIAL_RADIUS_M[999]
