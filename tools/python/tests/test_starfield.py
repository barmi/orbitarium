"""Tests for orbitarium_tools.starfield (Work 5)."""

from __future__ import annotations

from orbitarium_tools.starfield import (
    DEFAULT_VMAG_CUTOFF,
    FALLBACK_COLOR_TEMP_K,
    MAG_BUCKET_COUNT,
    MAG_VMAG_MAX,
    MAG_VMAG_MIN,
    PALETTE_KELVIN_MAX,
    PALETTE_KELVIN_MIN,
    PALETTE_SIZE,
    STARFIELD_FORMAT_VERSION,
    STARFIELD_HEADER_BYTES,
    STARFIELD_MAGIC,
    STARFIELD_SCENE_RADIUS,
    build_palette,
    kelvin_for_palette_index,
    kelvin_to_rgb_u8,
    magnitude_to_bucket,
    palette_index_for_kelvin,
)


def test_magic_is_4_byte_strf() -> None:
    assert STARFIELD_MAGIC == b"STRF"
    assert len(STARFIELD_MAGIC) == 4


def test_format_version_starts_at_1() -> None:
    assert STARFIELD_FORMAT_VERSION == 1


def test_header_size_16_bytes() -> None:
    assert STARFIELD_HEADER_BYTES == 16


def test_palette_size_256() -> None:
    assert PALETTE_SIZE == 256


def test_palette_kelvin_range_is_2000_to_30000() -> None:
    assert PALETTE_KELVIN_MIN == 2000.0
    assert PALETTE_KELVIN_MAX == 30000.0
    assert PALETTE_KELVIN_MAX > PALETTE_KELVIN_MIN


def test_mag_bucket_count_256_range_neg2_to_8() -> None:
    assert MAG_BUCKET_COUNT == 256
    assert MAG_VMAG_MIN == -2.0
    assert MAG_VMAG_MAX == 8.0


def test_default_vmag_cutoff_6() -> None:
    assert DEFAULT_VMAG_CUTOFF == 6.0


def test_starfield_scene_radius_far_celestial_sphere() -> None:
    assert STARFIELD_SCENE_RADIUS == 1.0e9


def test_fallback_color_temp_is_sun_like() -> None:
    assert FALLBACK_COLOR_TEMP_K == 5778.0


def test_kelvin_to_rgb_returns_triple_in_0_255() -> None:
    for kelvin in (1500.0, 2000.0, 5778.0, 10000.0, 30000.0, 40000.0):
        r, g, b = kelvin_to_rgb_u8(kelvin)
        assert 0 <= r <= 255
        assert 0 <= g <= 255
        assert 0 <= b <= 255


def test_kelvin_to_rgb_sun_5778k_is_warm_white() -> None:
    r, g, b = kelvin_to_rgb_u8(5778.0)
    assert r == 255
    assert 235 <= g <= 255
    assert 230 <= b <= 255


def test_kelvin_to_rgb_cool_blue_at_30000k() -> None:
    r, g, b = kelvin_to_rgb_u8(30000.0)
    assert b >= 240
    assert r < g < b


def test_kelvin_to_rgb_warm_red_at_2000k() -> None:
    r, g, b = kelvin_to_rgb_u8(2000.0)
    assert r >= 240
    assert b < g < r


def test_palette_index_round_trip_at_endpoints() -> None:
    assert palette_index_for_kelvin(PALETTE_KELVIN_MIN) == 0
    assert palette_index_for_kelvin(PALETTE_KELVIN_MAX) == PALETTE_SIZE - 1
    assert kelvin_for_palette_index(0) == PALETTE_KELVIN_MIN
    assert kelvin_for_palette_index(PALETTE_SIZE - 1) == PALETTE_KELVIN_MAX


def test_palette_index_round_trip_within_one_bucket() -> None:
    for kelvin in (3000.0, 5000.0, 5778.0, 10000.0, 20000.0):
        idx = palette_index_for_kelvin(kelvin)
        recovered = kelvin_for_palette_index(idx)
        idx2 = palette_index_for_kelvin(recovered)
        assert abs(idx2 - idx) <= 1


def test_palette_index_clamps_outside_range() -> None:
    assert palette_index_for_kelvin(500.0) == 0
    assert palette_index_for_kelvin(50000.0) == PALETTE_SIZE - 1


def test_build_palette_size_and_endpoints() -> None:
    palette = build_palette()
    assert len(palette) == PALETTE_SIZE * 4
    r0, g0, b0, a0 = palette[0:4]
    assert r0 >= 240 and b0 < g0 < r0
    assert a0 == 255
    r_last, g_last, b_last, a_last = palette[(PALETTE_SIZE - 1) * 4 : PALETTE_SIZE * 4]
    assert b_last >= 240 and r_last < g_last < b_last
    assert a_last == 255


def test_magnitude_to_bucket_endpoints_and_clamps() -> None:
    assert magnitude_to_bucket(MAG_VMAG_MIN) == 0
    assert magnitude_to_bucket(MAG_VMAG_MAX) == MAG_BUCKET_COUNT - 1
    assert magnitude_to_bucket(-100.0) == 0
    assert magnitude_to_bucket(100.0) == MAG_BUCKET_COUNT - 1


def test_magnitude_to_bucket_monotonic_for_typical_stars() -> None:
    sirius = magnitude_to_bucket(-1.46)
    vega = magnitude_to_bucket(0.03)
    polaris = magnitude_to_bucket(1.97)
    sun_like = magnitude_to_bucket(4.83)
    assert sirius < vega < polaris < sun_like


from orbitarium_tools.starfield import (  # noqa: E402
    HIPPARCOS_EPOCH_TO_J2000_YEARS,
    StarRecord,
    apply_proper_motion,
    bv_to_kelvin,
    deserialize_starfield_bin,
    radec_to_unit_vector,
    serialize_starfield_bin,
    stars_to_starfield,
)


def test_bv_to_kelvin_sun_like_5840k() -> None:
    assert 5700 < bv_to_kelvin(0.65) < 5900


def test_bv_to_kelvin_nan_or_extreme_falls_back() -> None:
    import math as _math

    assert bv_to_kelvin(_math.nan) == FALLBACK_COLOR_TEMP_K
    assert bv_to_kelvin(-1.0) == FALLBACK_COLOR_TEMP_K
    assert bv_to_kelvin(3.0) == FALLBACK_COLOR_TEMP_K


def test_apply_proper_motion_zero_pm_passthrough() -> None:
    assert apply_proper_motion(180.0, 30.0, 0.0, 0.0, 100.0) == (180.0, 30.0)


def test_apply_proper_motion_dec_linear() -> None:
    _, dec = apply_proper_motion(0.0, 0.0, 0.0, 1000.0, 1.0)
    assert abs(dec - 1000.0 / 3_600_000.0) < 1e-12


def test_hipparcos_epoch_delta_8_75_years() -> None:
    assert HIPPARCOS_EPOCH_TO_J2000_YEARS == 8.75


def test_radec_to_unit_vector_axis_conventions() -> None:
    x, y, z = radec_to_unit_vector(0.0, 0.0)
    assert abs(x - 1.0) < 1e-12 and abs(y) < 1e-12 and abs(z) < 1e-12
    _, _, zn = radec_to_unit_vector(0.0, 90.0)
    assert abs(zn - 1.0) < 1e-12


def test_radec_to_unit_vector_norm_is_one() -> None:
    import math as _math

    for ra in (10.0, 90.0, 180.0, 270.0):
        for dec in (-60.0, 0.0, 30.0, 80.0):
            x, y, z = radec_to_unit_vector(ra, dec)
            assert abs(_math.sqrt(x * x + y * y + z * z) - 1.0) < 1e-12


def test_serialize_deserialize_round_trip() -> None:
    stars = [
        StarRecord(
            hip=1,
            ra_deg=10.0,
            dec_deg=20.0,
            vmag=3.0,
            bv=0.5,
            pmra_mas_per_yr=0.0,
            pmdec_mas_per_yr=0.0,
        ),
        StarRecord(
            hip=2,
            ra_deg=120.0,
            dec_deg=-45.0,
            vmag=1.0,
            bv=-0.2,
            pmra_mas_per_yr=10.0,
            pmdec_mas_per_yr=-5.0,
        ),
    ]
    data = stars_to_starfield(stars, scene_radius=STARFIELD_SCENE_RADIUS)
    blob = serialize_starfield_bin(data)
    decoded = deserialize_starfield_bin(blob)
    assert decoded.scene_radius == STARFIELD_SCENE_RADIUS
    assert len(decoded.positions) == len(data.positions)
    for a, b in zip(decoded.positions, data.positions, strict=True):
        for av, bv in zip(a, b, strict=True):
            assert abs(av - bv) < max(1.0, abs(bv) * 1e-6)
    assert decoded.color_idx == data.color_idx
    assert decoded.mag_bucket == data.mag_bucket


def test_serialize_rejects_length_mismatch() -> None:
    import pytest as _pytest

    from orbitarium_tools.starfield import StarfieldData

    bad = StarfieldData(
        scene_radius=STARFIELD_SCENE_RADIUS,
        positions=[(0.0, 0.0, 0.0)],
        color_idx=[1, 2],
        mag_bucket=[3],
    )
    with _pytest.raises(ValueError, match="length mismatch"):
        serialize_starfield_bin(bad)


def test_deserialize_rejects_bad_magic() -> None:
    import pytest as _pytest

    bad = bytearray(STARFIELD_HEADER_BYTES + 14)
    bad[0:4] = b"BAD!"
    with _pytest.raises(ValueError, match="magic"):
        deserialize_starfield_bin(bytes(bad))
