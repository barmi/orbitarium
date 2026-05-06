"""Tests for orbitarium_tools.bench (Work 11)."""

from __future__ import annotations

import json
from pathlib import Path

from orbitarium_tools.bench import (
    REGRESSION_DRAWCALL_THRESHOLD,
    REGRESSION_FPS_THRESHOLD,
    BenchResult,
    detect_regression,
    load_bench,
)


def _write_bench(path: Path, fps: float, draw_calls: float, triangles: float = 0.0) -> None:
    path.write_text(
        json.dumps(
            {
                "label": "test",
                "fps_avg": fps,
                "fps_p1": fps * 0.8,
                "draw_calls_avg": draw_calls,
                "triangles_avg": triangles,
                "gpu_memory_mb_avg": 0.0,
            }
        )
    )


def test_load_bench_round_trip(tmp_path: Path) -> None:
    p = tmp_path / "b.json"
    _write_bench(p, 60.0, 100.0)
    result = load_bench(p)
    assert result.fps_avg == 60.0
    assert result.draw_calls_avg == 100.0


def test_detect_regression_fps_drop(tmp_path: Path) -> None:
    prev = BenchResult("prev", 60.0, 50.0, 100.0, 1000.0, 50.0)
    curr = BenchResult("curr", 30.0, 25.0, 100.0, 1000.0, 50.0)
    issues = detect_regression(prev, curr)
    assert "fps" in issues


def test_detect_regression_drawcalls_jump() -> None:
    prev = BenchResult("prev", 60.0, 50.0, 100.0, 1000.0, 50.0)
    curr = BenchResult("curr", 60.0, 50.0, 200.0, 1000.0, 50.0)
    issues = detect_regression(prev, curr)
    assert "draw_calls" in issues


def test_detect_no_regression() -> None:
    prev = BenchResult("prev", 60.0, 50.0, 100.0, 1000.0, 50.0)
    curr = BenchResult("curr", 58.0, 48.0, 105.0, 1010.0, 52.0)
    assert detect_regression(prev, curr) == {}


def test_thresholds() -> None:
    assert REGRESSION_FPS_THRESHOLD == 0.9
    assert REGRESSION_DRAWCALL_THRESHOLD == 1.2
