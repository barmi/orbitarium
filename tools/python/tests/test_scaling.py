import math
from pathlib import Path

from orbitarium_tools.constants import AU
from orbitarium_tools.scaling import (
    BODY_MEAN_EQUATORIAL_RADIUS_M,
    DISTANCE_POLICIES,
    EARTH_MEAN_EQUATORIAL_RADIUS_M,
    LINEAR_AU_POLICY,
    LOGARITHMIC_POLICY,
    PIECEWISE_INPUT_BREAKS_AU,
    PIECEWISE_MONOTONIC_POLICY,
    PIECEWISE_OUTPUT_BREAKS_SCENE,
    SCALE_BODY_NAIF_IDS,
    SCALE_TOL_M,
    SCALE_TOL_SIZE_M,
    generate_fixtures,
    get_distance_policy,
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


def test_distance_policy_registry_lists_three_policies() -> None:
    names = [p.name for p in DISTANCE_POLICIES]
    assert names == ["linear-au", "piecewise-monotonic", "logarithmic"]
    assert get_distance_policy("linear-au") is LINEAR_AU_POLICY


def test_linear_policy_round_trips_bit_exact() -> None:
    for d_au in [0.0, 0.4, 1.0, 30.0, 100.0]:
        d_m = d_au * AU
        assert LINEAR_AU_POLICY.inverse(LINEAR_AU_POLICY.forward(d_m)) == d_m


def test_piecewise_break_points_match_decision() -> None:
    assert PIECEWISE_INPUT_BREAKS_AU == (0.4, 5.0, 50.0)
    assert PIECEWISE_OUTPUT_BREAKS_SCENE == (0.4, 1.5, 3.0)
    for in_au, out_scene in zip(
        PIECEWISE_INPUT_BREAKS_AU, PIECEWISE_OUTPUT_BREAKS_SCENE, strict=True
    ):
        assert math.isclose(
            PIECEWISE_MONOTONIC_POLICY.forward(in_au * AU), out_scene, rel_tol=1e-12
        )


def test_piecewise_round_trips_within_one_mm_up_to_30_au() -> None:
    # IEEE 754 LSB is ~1 mm at 30 AU; outer planets (Pluto ~40 AU) sit at the
    # ~1.3 mm floor. Absolute 1 mm tolerance holds inside the inner system.
    for d_au in [0.1, 0.4, 1.0, 5.0, 10.0, 30.0]:
        d_m = d_au * AU
        back = PIECEWISE_MONOTONIC_POLICY.inverse(PIECEWISE_MONOTONIC_POLICY.forward(d_m))
        assert abs(back - d_m) < SCALE_TOL_M


def test_piecewise_round_trip_relative_error_at_outer_planets() -> None:
    for d_au in [40.0, 50.0, 100.0]:
        d_m = d_au * AU
        back = PIECEWISE_MONOTONIC_POLICY.inverse(PIECEWISE_MONOTONIC_POLICY.forward(d_m))
        assert abs(back - d_m) / d_m < 1e-14


def test_logarithmic_policy_zero_and_one_au() -> None:
    assert LOGARITHMIC_POLICY.forward(0.0) == 0.0
    assert math.isclose(LOGARITHMIC_POLICY.forward(AU), math.log(2.0), rel_tol=1e-14)


def test_logarithmic_round_trips_within_one_mm_up_to_30_au() -> None:
    for d_au in [0.001, 0.4, 1.0, 5.0, 30.0]:
        d_m = d_au * AU
        back = LOGARITHMIC_POLICY.inverse(LOGARITHMIC_POLICY.forward(d_m))
        assert abs(back - d_m) < SCALE_TOL_M


def test_size_policy_registry_lists_three_policies() -> None:
    from orbitarium_tools.scaling import (
        LOGARITHMIC_MAGNIFICATION_POLICY,
        MIN_MAX_CLAMP_POLICY,
        SIZE_POLICIES,
        UNIFORM_POLICY,
        get_size_policy,
    )

    names = [p.name for p in SIZE_POLICIES]
    assert names == ["uniform", "logarithmic-magnification", "minmax-clamp"]
    assert get_size_policy("uniform") is UNIFORM_POLICY
    assert get_size_policy("minmax-clamp") is MIN_MAX_CLAMP_POLICY
    assert LOGARITHMIC_MAGNIFICATION_POLICY in SIZE_POLICIES


def test_uniform_size_policy_round_trips_for_body_table() -> None:
    from orbitarium_tools.scaling import UNIFORM_POLICY

    for naif_id in SCALE_BODY_NAIF_IDS:
        r = BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id]
        assert UNIFORM_POLICY.inverse(UNIFORM_POLICY.forward(r)) == r


def test_logmag_policy_positive_and_round_trips() -> None:
    from orbitarium_tools.scaling import LOGARITHMIC_MAGNIFICATION_POLICY

    for naif_id in SCALE_BODY_NAIF_IDS:
        r = BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id]
        scene = LOGARITHMIC_MAGNIFICATION_POLICY.forward(r)
        assert scene > 0
        back = LOGARITHMIC_MAGNIFICATION_POLICY.inverse(scene)
        assert abs(back - r) < SCALE_TOL_SIZE_M


def test_minmax_clamp_endpoints_and_round_trips() -> None:
    from orbitarium_tools.scaling import (
        MIN_MAX_CLAMP_POLICY,
        MINMAX_MAX_SCENE,
        MINMAX_MIN_SCENE,
    )

    pluto = BODY_MEAN_EQUATORIAL_RADIUS_M[999]
    sun = BODY_MEAN_EQUATORIAL_RADIUS_M[10]
    assert math.isclose(MIN_MAX_CLAMP_POLICY.forward(pluto), MINMAX_MIN_SCENE, rel_tol=1e-12)
    assert math.isclose(MIN_MAX_CLAMP_POLICY.forward(sun), MINMAX_MAX_SCENE, rel_tol=1e-12)
    for naif_id in SCALE_BODY_NAIF_IDS:
        r = BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id]
        back = MIN_MAX_CLAMP_POLICY.inverse(MIN_MAX_CLAMP_POLICY.forward(r))
        assert abs(back - r) < SCALE_TOL_SIZE_M


def test_generate_fixtures_writes_distance_and_size_json(tmp_path: Path) -> None:
    out_files = generate_fixtures(tmp_path)
    assert [p.name for p in out_files] == ["distance-policies.json", "size-policies.json"]
    for out_file in out_files:
        assert out_file.exists()
        assert out_file.read_text(encoding="utf-8").startswith("{\n")
