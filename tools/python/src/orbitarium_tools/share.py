"""Share URL encoding (Work 10) — Python mirror.

TS / Python encode/decode produce the same fragment string for the same
``ShareState`` (modulo URL-encoded character order, which we keep deterministic
by writing fields in a fixed order).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final
from urllib.parse import parse_qs

SHARE_VERSION: Final[int] = 1


@dataclass(frozen=True, slots=True)
class ShareState:
    jd_tdb: float
    body_slug: str | None
    camera_mode: str | None


def encode_share_state(state: ShareState) -> str:
    parts = [
        f"v={SHARE_VERSION}",
        f"jd={state.jd_tdb:.6f}",
    ]
    if state.body_slug:
        parts.append(f"body={state.body_slug}")
    if state.camera_mode:
        parts.append(f"cam={state.camera_mode}")
    return "#?" + "&".join(parts)


def decode_share_state(hash_str: str) -> ShareState | None:
    cleaned = hash_str.lstrip("#").lstrip("?")
    if not cleaned:
        return None
    params = parse_qs(cleaned, keep_blank_values=True)
    v_raw = params.get("v", ["0"])[0]
    try:
        v = int(v_raw)
    except ValueError:
        return None
    if v != SHARE_VERSION:
        return None
    jd_raw = params.get("jd", [""])[0]
    try:
        jd = float(jd_raw)
    except ValueError:
        return None
    return ShareState(
        jd_tdb=jd,
        body_slug=params.get("body", [None])[0],
        camera_mode=params.get("cam", [None])[0],
    )
