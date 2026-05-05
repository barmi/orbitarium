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
