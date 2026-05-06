"""Tests for orbitarium_tools.validate (Work 12)."""

from __future__ import annotations

from pathlib import Path

from orbitarium_tools.validate import (
    VALIDATION_TARGETS,
    VALIDATION_TIMES,
    ValidationSample,
    angular_separation_mas,
    diff_magnitude_m,
    magnitude,
    summarize,
    synthetic_validation_samples,
    write_report,
)


def test_magnitude_zero_vector() -> None:
    assert magnitude((0.0, 0.0, 0.0)) == 0.0


def test_diff_magnitude_known_offset() -> None:
    a = (0.0, 0.0, 0.0)
    b = (3.0, 4.0, 0.0)
    assert diff_magnitude_m(a, b) == 5.0


def test_angular_separation_zero_when_aligned() -> None:
    assert angular_separation_mas((1.0, 0.0, 0.0), (2.0, 0.0, 0.0)) == 0.0


def test_angular_separation_90deg() -> None:
    sep = angular_separation_mas((1.0, 0.0, 0.0), (0.0, 1.0, 0.0))
    # 90° = 90 * 3.6e6 mas = 3.24e8 mas
    assert abs(sep - 90 * 3_600_000) < 1.0


def test_synthetic_samples_count_matches_matrix() -> None:
    samples = synthetic_validation_samples()
    assert len(samples) == len(VALIDATION_TARGETS) * len(VALIDATION_TIMES)


def test_summarize_synthetic() -> None:
    samples = synthetic_validation_samples()
    summary = summarize(samples)
    assert summary["bodies"] == len(VALIDATION_TARGETS)
    assert summary["samples"] == len(samples)
    assert summary["max_diff_m"] is not None


def test_write_report_emits_json_and_md(tmp_path: Path) -> None:
    samples = synthetic_validation_samples()
    json_path, md_path = write_report(samples, tmp_path)
    assert json_path.exists()
    assert md_path.exists()
    md_text = md_path.read_text()
    assert "Validation Report" in md_text
    assert "earth" in md_text


def test_validation_sample_dataclass() -> None:
    s = ValidationSample(
        body_key="earth",
        utc_iso="2024-01-01T00:00:00Z",
        jd_tdb=2_460_310.5,
        de440_position_m=(1.0, 2.0, 3.0),
        horizons_position_m=None,
        diff_magnitude_m=None,
        angular_error_mas=None,
    )
    assert s.body_key == "earth"
    assert s.horizons_position_m is None
