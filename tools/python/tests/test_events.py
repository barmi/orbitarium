"""Tests for orbitarium_tools.events (Work 8)."""

from __future__ import annotations

from orbitarium_tools.events import TIME_PRESETS, generate_fixtures


def test_time_presets_count() -> None:
    assert len(TIME_PRESETS) >= 4


def test_time_presets_have_required_fields() -> None:
    for p in TIME_PRESETS:
        assert p.id
        assert p.label
        assert p.utc_iso.startswith("19") or p.utc_iso.startswith("20")
        assert p.jd_tdb > 2_400_000


def test_j2000_preset_jd_tdb() -> None:
    j2000 = next(p for p in TIME_PRESETS if p.id == "j2000")
    assert abs(j2000.jd_tdb - 2_451_545.0) < 0.001


def test_generate_fixtures_writes_json(tmp_path: object) -> None:
    import json
    from pathlib import Path

    paths = generate_fixtures(tmp_path)
    assert len(paths) == 1
    p = Path(str(paths[0]))
    assert p.exists()
    data = json.loads(p.read_text())
    assert "presets" in data
    assert len(data["presets"]) >= 4
