"""Astronomical event presets reference (Work 8).

Mirrors ``src/time/presets.ts``. Produces a JSON fixture for cross-validation.
P3 expansion can add eclipse / conjunction event search using skyfield.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Final

from orbitarium_tools.time import utc_to_jd_tdb


@dataclass(frozen=True, slots=True)
class TimePreset:
    id: str
    label: str
    utc_iso: str
    jd_tdb: float


def _preset(pid: str, label: str, utc_iso: str) -> TimePreset:
    from datetime import UTC, datetime

    dt = datetime.fromisoformat(utc_iso.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return TimePreset(id=pid, label=label, utc_iso=utc_iso, jd_tdb=utc_to_jd_tdb(dt))


TIME_PRESETS: Final[tuple[TimePreset, ...]] = (
    _preset("j2000", "J2000 (2000-01-01 12:00 TT)", "2000-01-01T12:00:00Z"),
    _preset("voyager1_launch", "Voyager 1 launch", "1977-09-05T12:56:00Z"),
    _preset("eclipse_2024", "2024-04-08 total eclipse", "2024-04-08T18:18:00Z"),
    _preset("present", "2026-05-06 (Work 8 demo)", "2026-05-06T00:00:00Z"),
)


def generate_fixtures(out_dir: object) -> tuple[object]:
    out = Path(str(out_dir))
    out.mkdir(parents=True, exist_ok=True)
    payload: dict[str, object] = {
        "_comment": "Work 8 time presets — TS / Python should produce same jdTdb.",
        "_tolerance_sec": 1e-3,
        "presets": [
            {"id": p.id, "label": p.label, "utc_iso": p.utc_iso, "jd_tdb": p.jd_tdb}
            for p in TIME_PRESETS
        ],
    }
    out_path = out / "time-presets.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return (out_path,)
