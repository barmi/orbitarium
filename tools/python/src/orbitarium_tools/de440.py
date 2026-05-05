"""DE440 SPK kernel preprocessor.

Reads the JPL DE440 binary SPK kernel via ``jplephem`` and writes a compact
per-segment Chebyshev binary plus a JSON manifest for browser consumption
(see ``src/ephemeris/`` in TS for the matching evaluator).

Conventions (Work 3 P1/P2 decisions):
  - Output position: meters (kilometers in SPK * 1000)
  - Output velocity: meters / second
  - Reference frame: ICRF (DE440 native, sometimes called "J2000")
  - Time scale: TDB
  - Binary format: little-endian Float64, ``[3 components, n_intervals, coef_count]``
  - Time range default: 1900-2150 (~91250 days)

DE440 only contains 14 segments; planet bodies for Mars+ are aliased to
their barycenter because in DE440 the planet position equals its barycenter
position (planet >> total moon mass for those systems).
"""

from __future__ import annotations

import hashlib
import json
import ssl
import struct
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import certifi
import numpy as np
from jplephem.spk import SPK  # type: ignore[import-untyped]
from numpy.typing import NDArray

from orbitarium_tools.ephemeris import DE440_KERNEL_NAME, DE440_KERNEL_SOURCE

DE440_SEGMENT_TARGETS_AND_CENTERS: tuple[tuple[int, int], ...] = (
    # Solar System Barycenter -> planet barycenters and Sun
    (1, 0),
    (2, 0),
    (3, 0),
    (4, 0),
    (5, 0),
    (6, 0),
    (7, 0),
    (8, 0),
    (9, 0),
    (10, 0),
    # Inner-system body refinements (body relative to its bary)
    (199, 1),
    (299, 2),
    (301, 3),
    (399, 3),
)

# Outer-planet body NAIF ids -> their barycenter id. DE440 stores only the
# barycenter for these because the planet dominates the system mass; the
# barycenter offset is below the kernel's interpolation noise.
PLANET_BODY_ALIASES: dict[int, int] = {
    499: 4,  # Mars
    599: 5,  # Jupiter
    699: 6,  # Saturn
    799: 7,  # Uranus
    899: 8,  # Neptune
    999: 9,  # Pluto
}

# target, center, n_intervals, coef_count, init_jd, interval_length_days
BINARY_HEADER_FORMAT = "<iiiidd"
BINARY_HEADER_SIZE = struct.calcsize(BINARY_HEADER_FORMAT)


@dataclass(frozen=True, slots=True)
class De440Segment:
    target: int
    center: int
    init_jd_tdb: float
    interval_length_days: float
    coefficients: NDArray[np.float64]

    @property
    def n_intervals(self) -> int:
        return int(self.coefficients.shape[1])

    @property
    def coef_count(self) -> int:
        return int(self.coefficients.shape[2])

    @property
    def end_jd_tdb(self) -> float:
        return self.init_jd_tdb + self.interval_length_days * self.n_intervals


def download_de440_kernel(out_path: Path, *, force: bool = False) -> Path:
    """Download DE440 SPK from NAIF if missing or zero-byte."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not force and out_path.exists() and out_path.stat().st_size > 100_000_000:
        return out_path

    ctx = ssl.create_default_context(cafile=certifi.where())
    with (
        urllib.request.urlopen(DE440_KERNEL_SOURCE, context=ctx) as response,
        open(out_path, "wb") as f,
    ):
        while True:
            chunk = response.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    return out_path


def crop_segment(
    spk: SPK,
    target: int,
    center: int,
    jd_start: float,
    jd_end: float,
) -> De440Segment:
    """Extract a target/center segment from the SPK and crop to [jd_start, jd_end].

    Cropping snaps to interval boundaries so evaluation precision is preserved.
    """
    segment = next(s for s in spk.segments if s.target == target and s.center == center)
    initial_epoch, interval_length_days, coefs = segment.load_array()
    # coefs shape from jplephem load_array: [3 components, n_intervals, coef_count]
    n_total = int(coefs.shape[1])
    end_epoch = initial_epoch + interval_length_days * n_total

    if jd_start < initial_epoch or jd_end > end_epoch:
        raise ValueError(
            f"Requested range [{jd_start}, {jd_end}] outside segment "
            f"[{initial_epoch}, {end_epoch}] for target={target}"
        )

    i_start = max(0, int((jd_start - initial_epoch) / interval_length_days))
    i_end = min(n_total, int(np.ceil((jd_end - initial_epoch) / interval_length_days)))
    if i_end <= i_start:
        raise ValueError(f"Empty interval slice for target={target}")

    cropped_init = initial_epoch + i_start * interval_length_days
    cropped_coefs = np.ascontiguousarray(coefs[:, i_start:i_end, :], dtype=np.float64)

    return De440Segment(
        target=target,
        center=center,
        init_jd_tdb=float(cropped_init),
        interval_length_days=float(interval_length_days),
        coefficients=cropped_coefs,
    )


def write_segment_binary(out_path: Path, segment: De440Segment) -> Path:
    """Write a segment to a compact Float64 LE binary file."""
    header = struct.pack(
        BINARY_HEADER_FORMAT,
        segment.target,
        segment.center,
        segment.n_intervals,
        segment.coef_count,
        segment.init_jd_tdb,
        segment.interval_length_days,
    )
    payload = np.ascontiguousarray(segment.coefficients, dtype="<f8").tobytes()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(header)
        f.write(payload)
    return out_path


def read_segment_binary(path: Path) -> De440Segment:
    """Read a segment binary back. Inverse of ``write_segment_binary``."""
    with open(path, "rb") as f:
        header = f.read(BINARY_HEADER_SIZE)
        target, center, n_intervals, coef_count, init_jd, interval_length = struct.unpack(
            BINARY_HEADER_FORMAT, header
        )
        n_floats = 3 * n_intervals * coef_count
        raw = f.read(n_floats * 8)
    coefs = np.frombuffer(raw, dtype="<f8").reshape(3, n_intervals, coef_count).copy()
    return De440Segment(
        target=int(target),
        center=int(center),
        init_jd_tdb=float(init_jd),
        interval_length_days=float(interval_length),
        coefficients=coefs,
    )


def _chebyshev_basis(s: float, k: int) -> NDArray[np.float64]:
    """Return T_0(s)..T_{k-1}(s) using the standard recurrence."""
    t = np.empty(k, dtype=np.float64)
    t[0] = 1.0
    if k > 1:
        t[1] = s
    for i in range(2, k):
        t[i] = 2.0 * s * t[i - 1] - t[i - 2]
    return t


def _chebyshev_basis_derivative(s: float, k: int) -> NDArray[np.float64]:
    """Return dT_0/ds..dT_{k-1}/ds via recurrence T'_n = 2T_{n-1} + 2s T'_{n-1} - T'_{n-2}."""
    t = _chebyshev_basis(s, k)
    tp = np.zeros(k, dtype=np.float64)
    if k > 1:
        tp[1] = 1.0
    for i in range(2, k):
        tp[i] = 2.0 * t[i - 1] + 2.0 * s * tp[i - 1] - tp[i - 2]
    return tp


def evaluate_segment(
    segment: De440Segment, jd_tdb: float
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Evaluate position (m) and velocity (m/s) at jd_tdb in segment frame (relative to center).

    The segment must cover ``jd_tdb`` within its interval range.
    """
    rel = jd_tdb - segment.init_jd_tdb
    if rel < 0.0 or rel > segment.interval_length_days * segment.n_intervals:
        raise ValueError(
            f"jd_tdb={jd_tdb} outside segment range "
            f"[{segment.init_jd_tdb}, {segment.end_jd_tdb}]"
        )

    idx = int(rel / segment.interval_length_days)
    if idx == segment.n_intervals:
        idx -= 1
    s = 2.0 * (rel - idx * segment.interval_length_days) / segment.interval_length_days - 1.0

    t_basis = _chebyshev_basis(s, segment.coef_count)
    tp_basis = _chebyshev_basis_derivative(s, segment.coef_count)
    ds_djd = 2.0 / segment.interval_length_days  # 1/day

    pos_km = np.array([float(np.dot(segment.coefficients[c, idx, :], t_basis)) for c in range(3)])
    vel_km_per_day = np.array(
        [
            float(np.dot(segment.coefficients[c, idx, :], tp_basis)) * ds_djd
            for c in range(3)
        ]
    )

    pos_m = pos_km * 1000.0
    vel_m_s = vel_km_per_day * 1000.0 / 86400.0
    return pos_m, vel_m_s


def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(1 << 20)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def preprocess(
    *,
    spk_path: Path,
    out_dir: Path,
    jd_start: float,
    jd_end: float,
) -> dict[str, object]:
    """Read SPK, crop to [jd_start, jd_end], write per-segment binaries + manifest.

    Returns the manifest dict (also written to ``out_dir/manifest.json``).
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    spk = SPK.open(str(spk_path))
    try:
        segments_meta: list[dict[str, object]] = []
        for target, center in DE440_SEGMENT_TARGETS_AND_CENTERS:
            segment = crop_segment(spk, target, center, jd_start, jd_end)
            bin_filename = f"spk_{target}_{center}.bin"
            write_segment_binary(out_dir / bin_filename, segment)
            segments_meta.append(
                {
                    "target": target,
                    "center": center,
                    "file": bin_filename,
                    "init_jd_tdb": segment.init_jd_tdb,
                    "interval_length_days": segment.interval_length_days,
                    "n_intervals": segment.n_intervals,
                    "coef_count": segment.coef_count,
                    "end_jd_tdb": segment.end_jd_tdb,
                }
            )
    finally:
        spk.close()

    manifest: dict[str, object] = {
        "kernel": DE440_KERNEL_NAME,
        "kernel_source": DE440_KERNEL_SOURCE,
        "kernel_sha256": _file_sha256(spk_path),
        "generated_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
        "time_range_jd_tdb": [jd_start, jd_end],
        "binary_format": {
            "header": (
                "i32 target, i32 center, i32 n_intervals, i32 coef_count, "
                "f64 init_jd_tdb, f64 interval_length_days"
            ),
            "endianness": "little",
            "coefficient_layout": (
                "f64[3 components][n_intervals][coef_count] "
                "(component, interval, coefficient)"
            ),
            "position_units": "km in SPK; evaluator converts to meters",
            "velocity_units": "km/day in derivative; evaluator converts to m/s",
        },
        "segments": segments_meta,
        "aliases_planet_body_to_barycenter": PLANET_BODY_ALIASES,
    }
    with open(out_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    return manifest


def resolve_chain(target: int) -> list[int]:
    """Walk a target NAIF id back to SSB through DE440's segment graph.

    Returns the chain of (sub_target) values; positions sum along the chain.
    For target=399 returns [399, 3] meaning: pos = SPK(399, center=3) + SPK(3, center=0).
    """
    if target in PLANET_BODY_ALIASES:
        target = PLANET_BODY_ALIASES[target]
    chain: list[int] = [target]
    while True:
        # Find a segment whose target matches the head of the chain.
        match = next(
            (tc for tc in DE440_SEGMENT_TARGETS_AND_CENTERS if tc[0] == chain[-1]),
            None,
        )
        if match is None:
            raise ValueError(f"No DE440 segment found for target={chain[-1]}")
        _, center_id = match
        if center_id == 0:
            break
        chain.append(center_id)
    return chain
