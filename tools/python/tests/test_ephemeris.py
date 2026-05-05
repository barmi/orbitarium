from orbitarium_tools.ephemeris import (
    DE440_BODY_NAIF_IDS,
    DE440_KERNEL_NAME,
    DE440_TIME_RANGE_END_YEAR,
    DE440_TIME_RANGE_START_YEAR,
    EPHEMERIS_TOL_M,
    EPHEMERIS_TOL_VEL_M_S,
    StateVectorICRF,
)


def test_tolerance_constants_are_one_mm_and_one_um_per_s() -> None:
    assert EPHEMERIS_TOL_M == 1e-3
    assert EPHEMERIS_TOL_VEL_M_S == 1e-6


def test_de440_default_range_is_1900_to_2150() -> None:
    assert DE440_KERNEL_NAME == "de440"
    assert DE440_TIME_RANGE_START_YEAR == 1900
    assert DE440_TIME_RANGE_END_YEAR == 2150


def test_de440_body_naif_ids_cover_sun_planets_and_moon() -> None:
    assert 10 in DE440_BODY_NAIF_IDS
    assert 301 in DE440_BODY_NAIF_IDS
    for bid in (1, 2, 3, 4, 5, 6, 7, 8, 9):
        assert bid in DE440_BODY_NAIF_IDS
    for bid in (199, 299, 399, 499, 599, 699, 799, 899, 999):
        assert bid in DE440_BODY_NAIF_IDS
    assert len(DE440_BODY_NAIF_IDS) == 20


def test_state_vector_icrf_holds_components() -> None:
    sv = StateVectorICRF(
        naif_id=399,
        jd_tdb=2451545.0,
        position=(1.495978707e11, 0.0, 0.0),
        velocity=(0.0, 29780.0, 0.0),
    )
    assert sv.naif_id == 399
    assert sv.jd_tdb == 2451545.0
    assert sv.position == (1.495978707e11, 0.0, 0.0)
    assert sv.velocity == (0.0, 29780.0, 0.0)
