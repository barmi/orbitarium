"""DE440 preprocessor tests.

The DE440 SPK kernel (~120MB) is downloaded once into ``tools/python/.cache/de440/``
(gitignored). Tests skip gracefully when offline.
"""

from __future__ import annotations

import socket
import struct
from pathlib import Path
from urllib.error import URLError

import numpy as np
import pytest

from orbitarium_tools.de440 import (
    BINARY_HEADER_FORMAT,
    DE440_SEGMENT_TARGETS_AND_CENTERS,
    PLANET_BODY_ALIASES,
    De440Segment,
    crop_segment,
    download_de440_kernel,
    evaluate_segment,
    preprocess,
    read_segment_binary,
    resolve_chain,
    write_segment_binary,
)

CACHE_DIR = Path(__file__).resolve().parent.parent / ".cache" / "de440"
SPK_CACHE = CACHE_DIR / "de440.bsp"


def _have_internet() -> bool:
    try:
        socket.create_connection(("naif.jpl.nasa.gov", 443), timeout=3).close()
        return True
    except OSError:
        return False


@pytest.fixture(scope="module")
def spk_path() -> Path:
    if SPK_CACHE.exists() and SPK_CACHE.stat().st_size > 100_000_000:
        return SPK_CACHE
    if not _have_internet():
        pytest.skip("DE440 SPK not cached and no network available")
    try:
        return download_de440_kernel(SPK_CACHE)
    except URLError:  # pragma: no cover
        pytest.skip("Cannot reach NAIF kernel server")


def test_segment_targets_inventory_matches_de440() -> None:
    """DE440 publishes 14 segments: 10 SSB-children + 4 inner-system body refinements."""
    assert len(DE440_SEGMENT_TARGETS_AND_CENTERS) == 14
    targets = {tc[0] for tc in DE440_SEGMENT_TARGETS_AND_CENTERS}
    assert targets == {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 199, 299, 301, 399}


def test_planet_body_aliases_cover_outer_planets() -> None:
    assert PLANET_BODY_ALIASES == {499: 4, 599: 5, 699: 6, 799: 7, 899: 8, 999: 9}


def test_resolve_chain_for_inner_and_outer_planets() -> None:
    assert resolve_chain(10) == [10]
    assert resolve_chain(3) == [3]
    assert resolve_chain(399) == [399, 3]
    assert resolve_chain(301) == [301, 3]
    assert resolve_chain(199) == [199, 1]
    # Outer planet body aliases to its barycenter
    assert resolve_chain(499) == [4]
    assert resolve_chain(699) == [6]


def test_binary_header_format_is_fixed_size() -> None:
    assert struct.calcsize(BINARY_HEADER_FORMAT) == 32  # 4*4 ints + 2*8 doubles


def test_crop_segment_round_trip(spk_path: Path, tmp_path: Path) -> None:
    """Write a segment binary, read it back, evaluate at a sample JD — bit-identical."""
    from jplephem.spk import SPK

    spk = SPK.open(str(spk_path))
    try:
        segment = crop_segment(spk, 399, 3, 2451545.0 - 365, 2451545.0 + 365)
    finally:
        spk.close()

    bin_path = tmp_path / "earth.bin"
    write_segment_binary(bin_path, segment)
    reread = read_segment_binary(bin_path)

    assert reread.target == segment.target
    assert reread.center == segment.center
    assert reread.init_jd_tdb == segment.init_jd_tdb
    assert reread.interval_length_days == segment.interval_length_days
    np.testing.assert_array_equal(reread.coefficients, segment.coefficients)


def test_evaluator_matches_jplephem_within_one_mm(spk_path: Path) -> None:
    """Our Chebyshev evaluator vs jplephem ``compute_and_differentiate`` for all 14 segments."""
    from jplephem.spk import SPK

    spk = SPK.open(str(spk_path))
    try:
        sample_jds = [2451545.0, 2451545.0 + 100.0, 2451545.0 + 1000.0, 2451545.0 - 1000.0]
        for target, center in DE440_SEGMENT_TARGETS_AND_CENTERS:
            segment = crop_segment(spk, target, center, 2451545.0 - 2000, 2451545.0 + 2000)
            ref_seg = next(s for s in spk.segments if s.target == target and s.center == center)
            for jd in sample_jds:
                pos_m, vel_m_s = evaluate_segment(segment, jd)
                ref_pos_km, ref_vel_km_per_day = ref_seg.compute_and_differentiate(jd)
                ref_pos_m = np.asarray(ref_pos_km) * 1000.0
                ref_vel_m_s = np.asarray(ref_vel_km_per_day) * 1000.0 / 86400.0
                pos_diff_mm = float(np.max(np.abs(pos_m - ref_pos_m)) * 1000.0)
                vel_diff_um_s = float(np.max(np.abs(vel_m_s - ref_vel_m_s)) * 1e6)
                assert pos_diff_mm < 1.0, (
                    f"target={target} jd={jd}: position diff {pos_diff_mm:.6f} mm"
                )
                assert vel_diff_um_s < 1.0, (
                    f"target={target} jd={jd}: velocity diff {vel_diff_um_s:.6f} um/s"
                )
    finally:
        spk.close()


def test_evaluator_chain_matches_spiceypy(spk_path: Path) -> None:
    """SSB-centered position via chain matches spiceypy ``spkezr`` within 1 mm / 1 um/s."""
    import spiceypy as sp
    from jplephem.spk import SPK

    spk = SPK.open(str(spk_path))
    sp.furnsh(str(spk_path))
    try:
        segments_by_target: dict[int, De440Segment] = {}
        for target, center in DE440_SEGMENT_TARGETS_AND_CENTERS:
            segments_by_target[target] = crop_segment(
                spk, target, center, 2451545.0 - 2000, 2451545.0 + 2000
            )

        # Test a representative spread; aliases also exercised.
        test_targets = [10, 3, 199, 299, 399, 301, 499, 599, 699, 799, 899, 999]
        sample_jds = [2451545.0, 2451545.0 + 365.0, 2451545.0 - 365.0]

        for target in test_targets:
            for jd in sample_jds:
                chain = resolve_chain(target)
                pos = np.zeros(3)
                vel = np.zeros(3)
                for sub_target in chain:
                    p, v = evaluate_segment(segments_by_target[sub_target], jd)
                    pos += p
                    vel += v

                et = (jd - 2451545.0) * 86400.0
                spice_target = str(PLANET_BODY_ALIASES.get(target, target))
                state, _ = sp.spkezr(spice_target, et, "J2000", "NONE", "0")
                ref_pos = np.asarray(state[:3]) * 1000.0
                ref_vel = np.asarray(state[3:]) * 1000.0  # SPICE returns km/s

                pos_diff_mm = float(np.max(np.abs(pos - ref_pos)) * 1000.0)
                vel_diff_um_s = float(np.max(np.abs(vel - ref_vel)) * 1e6)
                assert pos_diff_mm < 1.0, (
                    f"target={target} jd={jd}: SSB position diff {pos_diff_mm:.6f} mm"
                )
                assert vel_diff_um_s < 1.0, (
                    f"target={target} jd={jd}: SSB velocity diff {vel_diff_um_s:.6f} um/s"
                )
    finally:
        sp.kclear()
        spk.close()


def test_preprocess_writes_manifest_and_binaries(spk_path: Path, tmp_path: Path) -> None:
    """Smoke test for the full preprocess pipeline (small range)."""
    manifest = preprocess(
        spk_path=spk_path,
        out_dir=tmp_path,
        jd_start=2451545.0 - 100.0,
        jd_end=2451545.0 + 100.0,
    )
    assert manifest["kernel"] == "de440"
    assert isinstance(manifest["segments"], list)
    assert len(manifest["segments"]) == 14
    assert (tmp_path / "manifest.json").exists()
    for tc in DE440_SEGMENT_TARGETS_AND_CENTERS:
        bin_file = tmp_path / f"spk_{tc[0]}_{tc[1]}.bin"
        assert bin_file.exists()
        assert bin_file.stat().st_size > 32  # at least a header
