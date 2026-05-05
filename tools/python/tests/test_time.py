"""Time module tests: TS-mirror invariants + astropy reference cross-check."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
from astropy.time import Time

from orbitarium_tools.time import (
    J2000_JD_TDB,
    LEAP_SECONDS,
    SECONDS_PER_DAY,
    TT_TAI_OFFSET_S,
    generate_fixtures,
    jd_to_j2000_days,
    jd_to_mjd,
    leap_seconds_at,
    tdb_minus_tt_seconds,
    utc_to_jd_tai,
    utc_to_jd_tdb,
    utc_to_jd_tt,
    utc_to_jd_utc,
)

# ---------- Leap seconds table ----------


def test_leap_table_has_28_entries() -> None:
    assert len(LEAP_SECONDS) == 28


def test_first_leap_is_1972_at_10s() -> None:
    assert LEAP_SECONDS[0].date == "1972-01-01"
    assert LEAP_SECONDS[0].offset == 10
    assert LEAP_SECONDS[0].jd_utc == 2441317.5


def test_latest_leap_is_2017_at_37s() -> None:
    assert LEAP_SECONDS[-1].date == "2017-01-01"
    assert LEAP_SECONDS[-1].offset == 37


def test_leap_offset_at_known_dates() -> None:
    cases = [
        (datetime(1972, 1, 1, tzinfo=UTC), 10),
        (datetime(1980, 1, 1, tzinfo=UTC), 19),
        (datetime(2016, 12, 31, 23, 59, 0, tzinfo=UTC), 36),
        (datetime(2017, 1, 1, tzinfo=UTC), 37),
        (datetime(2026, 5, 5, tzinfo=UTC), 37),
    ]
    for d, expected in cases:
        assert leap_seconds_at(d) == expected


def test_leap_pre_1972_raises() -> None:
    with pytest.raises(ValueError, match="before 1972-01-01"):
        leap_seconds_at(datetime(1971, 12, 31, tzinfo=UTC))


def test_leap_naive_datetime_raises() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        leap_seconds_at(datetime(2025, 1, 1))


# ---------- Time scale conversion invariants ----------


# JD ~ 2.46e6 in IEEE 754 has ~9 fractional digits (~1e-4 s). Subtracting two
# near-equal JDs cancels precision; the algorithm is verified bit-exactly via
# fixture comparison, so these invariant tests use a slack tolerance.
def test_tt_minus_tai_is_32184ms() -> None:
    d = datetime(2025, 6, 15, 12, 34, 56, tzinfo=UTC)
    diff_s = (utc_to_jd_tt(d) - utc_to_jd_tai(d)) * SECONDS_PER_DAY
    assert abs(diff_s - TT_TAI_OFFSET_S) < 1e-4


def test_tai_minus_utc_is_leap_seconds() -> None:
    d = datetime(2025, 6, 15, 12, 34, 56, tzinfo=UTC)
    diff_s = (utc_to_jd_tai(d) - utc_to_jd_utc(d)) * SECONDS_PER_DAY
    assert abs(diff_s - leap_seconds_at(d)) < 1e-4


def test_jd_at_2017_leap_boundary_is_2457754p5() -> None:
    d = datetime(2017, 1, 1, tzinfo=UTC)
    assert utc_to_jd_utc(d) == 2457754.5


def test_jd_at_unix_epoch_is_2440587p5() -> None:
    d = datetime(1970, 1, 1, tzinfo=UTC)
    # Pre-1972 forbidden via leap_seconds, but raw JD_UTC is fine.
    assert utc_to_jd_utc(d) == 2440587.5


# ---------- TDB - TT model ----------


def test_tdb_minus_tt_at_j2000_matches_formula() -> None:
    """At J2000.0 (g ~ 6.24), TDB - TT ~ 0.001658*sin(g) + 0.000014*sin(2g)."""
    import math

    expected = 0.001658 * math.sin(6.24) + 0.000014 * math.sin(2 * 6.24)
    assert tdb_minus_tt_seconds(2451545.0) == expected


def test_tdb_minus_tt_bounded_under_2ms() -> None:
    """Simplified model amplitude: abs(TDB - TT) < 2 ms by construction."""
    for jd in [2440000.0, 2451545.0, 2470000.0, 2500000.0]:
        assert abs(tdb_minus_tt_seconds(jd)) < 2e-3


# ---------- astropy cross-check (independent reference) ----------


def test_jd_tt_matches_astropy_at_j2000_within_1us() -> None:
    """JD_TT should match astropy IAU 2009 to 1 µs (TT is deterministic given UTC)."""
    iso = "2000-01-01T12:00:00"
    d = datetime.fromisoformat(iso).replace(tzinfo=UTC)
    diff_s = abs(utc_to_jd_tt(d) - Time(iso, scale="utc").tt.jd) * SECONDS_PER_DAY
    assert diff_s < 1e-6


def test_jd_tdb_matches_astropy_within_100us() -> None:
    """Simplified TDB-TT diverges from astropy IAU 2009 by ~50µs; budget 100µs."""
    cases = [
        "2000-01-01T12:00:00",
        "2025-01-01T00:00:00",
        "2050-06-15T12:00:00",
        "2017-01-01T00:00:00",
    ]
    for iso in cases:
        d = datetime.fromisoformat(iso).replace(tzinfo=UTC)
        ours = utc_to_jd_tdb(d)
        astro = Time(iso, scale="utc").tdb.jd
        diff_us = abs(ours - astro) * SECONDS_PER_DAY * 1e6
        assert diff_us < 100, f"{iso}: diff = {diff_us:.1f} µs"


def test_leap_seconds_match_astropy_at_recent_date() -> None:
    """Cross-check our static table against astropy's IERS data."""
    iso = "2025-06-15T12:00:00"
    d = datetime.fromisoformat(iso).replace(tzinfo=UTC)
    ours = leap_seconds_at(d)
    # astropy: TAI - UTC at this UTC instant
    t_utc = Time(iso, scale="utc")
    astro_diff = round((t_utc.tai.jd - t_utc.utc.jd) * SECONDS_PER_DAY)
    assert ours == astro_diff


# ---------- Fixture generation ----------


def test_generate_fixtures_writes_valid_json(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    assert out_file.exists()
    assert out_file.name == "time.json"

    data = json.loads(out_file.read_text())
    assert "fixtures" in data
    assert len(data["fixtures"]) >= 20

    required_keys = {
        "utc_iso",
        "leap_seconds",
        "jd_utc",
        "jd_tai",
        "jd_tt",
        "jd_tdb",
        "j2000_days_tdb",
        "mjd_tdb",
    }
    for entry in data["fixtures"]:
        assert required_keys.issubset(entry.keys())


def test_generate_fixtures_self_consistent(tmp_path: Path) -> None:
    out_file = generate_fixtures(tmp_path)
    data = json.loads(out_file.read_text())
    for entry in data["fixtures"]:
        d = datetime.fromisoformat(entry["utc_iso"].replace("Z", "+00:00"))
        assert utc_to_jd_utc(d) == entry["jd_utc"]
        assert utc_to_jd_tai(d) == entry["jd_tai"]
        assert utc_to_jd_tt(d) == entry["jd_tt"]
        assert utc_to_jd_tdb(d) == entry["jd_tdb"]


# ---------- J2000 / MJD ----------


def test_j2000_at_jd_2451545_is_zero() -> None:
    assert jd_to_j2000_days(2451545.0) == 0.0


def test_j2000_jd_tdb_constant_is_2451545() -> None:
    assert J2000_JD_TDB == 2451545.0


def test_mjd_offset() -> None:
    assert jd_to_mjd(2400000.5) == 0.0
    assert jd_to_mjd(2451545.0) == 51544.5
