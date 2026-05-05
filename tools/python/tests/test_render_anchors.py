"""Tests for orbitarium_tools.render_anchors (Work 5 P3)."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest

from orbitarium_tools.render_anchors import (
    SAMPLE_EARTH_SSB_M,
    SAMPLE_SUN_SSB_M,
    apply_anchor,
    body_centric_anchor,
    generate_anchor_fixtures,
    heliocentric_anchor,
    ssb_anchor,
)

AU_M = 149_597_870_700.0


def test_ssb_anchor_is_identity() -> None:
    p = (AU_M, 0.0, 0.0)
    assert apply_anchor(p, ssb_anchor()) == p


def test_heliocentric_anchor_subtracts_sun() -> None:
    sun = (1_000_000.0, -500_000.0, 0.0)
    earth = (AU_M + sun[0], sun[1], sun[2])
    out = apply_anchor(earth, heliocentric_anchor(sun))
    assert abs(out[0] - AU_M) < 1e-3
    assert abs(out[1] - 0.0) < 1e-3
    assert abs(out[2] - 0.0) < 1e-3


def test_heliocentric_sun_under_its_own_anchor_is_origin() -> None:
    sun = (1_500_000_000.0, -700_000_000.0, 100_000.0)
    out = apply_anchor(sun, heliocentric_anchor(sun))
    assert out == (0.0, 0.0, 0.0)


def test_body_centric_earth_moon_returns_offset() -> None:
    earth = (AU_M, 0.0, 0.0)
    moon = (AU_M + 384_400_000.0, 0.0, 0.0)
    out = apply_anchor(moon, body_centric_anchor(earth))
    assert abs(out[0] - 384_400_000.0) < 1e-3
    assert abs(out[1] - 0.0) < 1e-3
    assert abs(out[2] - 0.0) < 1e-3


def test_body_centric_round_trip_within_1mm() -> None:
    ref = (123_456_789.0, 987_654_321.0, -555_555_555.0)
    target = (7_777.0, -3_333.0, 11_111.0)
    shifted = apply_anchor(target, body_centric_anchor(ref))
    restored = (shifted[0] + ref[0], shifted[1] + ref[1], shifted[2] + ref[2])
    assert abs(restored[0] - target[0]) < 1e-3
    assert abs(restored[1] - target[1]) < 1e-3
    assert abs(restored[2] - target[2]) < 1e-3


def test_apply_anchor_rejects_missing_reference() -> None:
    from orbitarium_tools.render_anchors import SceneAnchorContext

    bad = SceneAnchorContext(kind="heliocentric", reference_ssb_m=None)
    with pytest.raises(ValueError, match="requires reference_ssb_m"):
        apply_anchor((0.0, 0.0, 0.0), bad)


def test_generate_anchor_fixtures_writes_expected_structure() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        out_path = generate_anchor_fixtures(tmp)
        assert out_path.name == "scene-anchors.json"
        data = json.loads(out_path.read_text(encoding="utf-8"))
        assert data["_tolerance_mm"] == 1.0
        names = [a["name"] for a in data["anchors"]]
        assert names == ["ssb", "heliocentric", "body-centric_earth"]
        helio = next(a for a in data["anchors"] if a["name"] == "heliocentric")
        assert helio["reference_ssb_m"] == list(SAMPLE_SUN_SSB_M)
        body = next(a for a in data["anchors"] if a["name"] == "body-centric_earth")
        assert body["reference_ssb_m"] == list(SAMPLE_EARTH_SSB_M)


def test_generate_anchor_fixtures_is_idempotent(tmp_path: Path) -> None:
    p1 = generate_anchor_fixtures(tmp_path)
    text1 = p1.read_text(encoding="utf-8")
    p2 = generate_anchor_fixtures(tmp_path)
    text2 = p2.read_text(encoding="utf-8")
    assert text1 == text2
