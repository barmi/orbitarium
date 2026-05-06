"""Performance benchmark analysis (Work 11).

Reads JSON-formatted bench results (produced by `/dev/perf` overlay export)
and detects regressions vs prior runs.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Final


@dataclass(frozen=True, slots=True)
class BenchResult:
    label: str
    fps_avg: float
    fps_p1: float
    draw_calls_avg: float
    triangles_avg: float
    gpu_memory_mb_avg: float


REGRESSION_FPS_THRESHOLD: Final[float] = 0.9
REGRESSION_DRAWCALL_THRESHOLD: Final[float] = 1.2


def load_bench(path: Path) -> BenchResult:
    raw = json.loads(path.read_text())
    return BenchResult(
        label=str(raw["label"]),
        fps_avg=float(raw["fps_avg"]),
        fps_p1=float(raw.get("fps_p1", raw["fps_avg"])),
        draw_calls_avg=float(raw.get("draw_calls_avg", 0.0)),
        triangles_avg=float(raw.get("triangles_avg", 0.0)),
        gpu_memory_mb_avg=float(raw.get("gpu_memory_mb_avg", 0.0)),
    )


def detect_regression(prev: BenchResult, curr: BenchResult) -> dict[str, str]:
    issues: dict[str, str] = {}
    if curr.fps_avg < prev.fps_avg * REGRESSION_FPS_THRESHOLD:
        issues["fps"] = (
            f"FPS dropped from {prev.fps_avg:.1f} to {curr.fps_avg:.1f} "
            f"(< {REGRESSION_FPS_THRESHOLD * 100:.0f}% of previous)"
        )
    if curr.draw_calls_avg > prev.draw_calls_avg * REGRESSION_DRAWCALL_THRESHOLD:
        issues["draw_calls"] = (
            f"Draw calls jumped from {prev.draw_calls_avg:.0f} to "
            f"{curr.draw_calls_avg:.0f} (> +{(REGRESSION_DRAWCALL_THRESHOLD - 1) * 100:.0f}%)"
        )
    return issues
