"""Tests for orbitarium_tools.share (Work 10)."""

from __future__ import annotations

from orbitarium_tools.share import (
    SHARE_VERSION,
    ShareState,
    decode_share_state,
    encode_share_state,
)


def test_encode_round_trip() -> None:
    state = ShareState(jd_tdb=2_451_545.0, body_slug="earth", camera_mode="focus")
    hash_str = encode_share_state(state)
    assert "v=1" in hash_str
    assert "jd=2451545" in hash_str
    assert "body=earth" in hash_str
    decoded = decode_share_state(hash_str)
    assert decoded is not None
    assert abs(decoded.jd_tdb - state.jd_tdb) < 1e-6
    assert decoded.body_slug == state.body_slug
    assert decoded.camera_mode == state.camera_mode


def test_encode_omits_null_fields() -> None:
    hash_str = encode_share_state(
        ShareState(jd_tdb=100.0, body_slug=None, camera_mode=None),
    )
    assert "body=" not in hash_str
    assert "cam=" not in hash_str


def test_decode_rejects_bad_version() -> None:
    assert decode_share_state("#?v=999&jd=100") is None


def test_decode_empty_returns_none() -> None:
    assert decode_share_state("") is None
    assert decode_share_state("#") is None


def test_share_version_const() -> None:
    assert SHARE_VERSION == 1
