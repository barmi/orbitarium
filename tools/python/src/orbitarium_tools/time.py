"""Time scale conversions — Python reference, mirrors `src/astro/time.ts`.

Two roles:
  1. **Bit-identical mirror** of the TS algorithm. Fixtures generated here are
     consumed by the TS test suite at 1µs tolerance — same IEEE 754 ops on the
     same inputs produce identical doubles in both languages.
  2. **astropy cross-check**: independent tests compare our simplified TDB-TT
     against astropy.time (IAU 2009 full series, 787 terms) at 100µs budget.

Fixture generator is exposed via the CLI:
  ``orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/``
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Final

SECONDS_PER_DAY: Final[int] = 86400
TT_TAI_OFFSET_S: Final[float] = 32.184
UNIX_EPOCH_JD: Final[float] = 2440587.5
MJD_OFFSET: Final[float] = 2400000.5
J2000_JD_TDB: Final[float] = 2451545.0


@dataclass(frozen=True, slots=True)
class LeapSecondEntry:
    date: str
    jd_utc: float
    offset: int


# Mirror of `src/astro/leapSeconds.ts::LEAP_SECONDS` (IERS Bulletin C 70).
LEAP_SECONDS: Final[tuple[LeapSecondEntry, ...]] = (
    LeapSecondEntry("1972-01-01", 2441317.5, 10),
    LeapSecondEntry("1972-07-01", 2441499.5, 11),
    LeapSecondEntry("1973-01-01", 2441683.5, 12),
    LeapSecondEntry("1974-01-01", 2442048.5, 13),
    LeapSecondEntry("1975-01-01", 2442413.5, 14),
    LeapSecondEntry("1976-01-01", 2442778.5, 15),
    LeapSecondEntry("1977-01-01", 2443144.5, 16),
    LeapSecondEntry("1978-01-01", 2443509.5, 17),
    LeapSecondEntry("1979-01-01", 2443874.5, 18),
    LeapSecondEntry("1980-01-01", 2444239.5, 19),
    LeapSecondEntry("1981-07-01", 2444786.5, 20),
    LeapSecondEntry("1982-07-01", 2445151.5, 21),
    LeapSecondEntry("1983-07-01", 2445516.5, 22),
    LeapSecondEntry("1985-07-01", 2446247.5, 23),
    LeapSecondEntry("1988-01-01", 2447161.5, 24),
    LeapSecondEntry("1990-01-01", 2447892.5, 25),
    LeapSecondEntry("1991-01-01", 2448257.5, 26),
    LeapSecondEntry("1992-07-01", 2448804.5, 27),
    LeapSecondEntry("1993-07-01", 2449169.5, 28),
    LeapSecondEntry("1994-07-01", 2449534.5, 29),
    LeapSecondEntry("1996-01-01", 2450083.5, 30),
    LeapSecondEntry("1997-07-01", 2450630.5, 31),
    LeapSecondEntry("1999-01-01", 2451179.5, 32),
    LeapSecondEntry("2006-01-01", 2453736.5, 33),
    LeapSecondEntry("2009-01-01", 2454832.5, 34),
    LeapSecondEntry("2012-07-01", 2456109.5, 35),
    LeapSecondEntry("2015-07-01", 2457204.5, 36),
    LeapSecondEntry("2017-01-01", 2457754.5, 37),
)


def leap_seconds_at(utc: datetime) -> int:
    """TAI - UTC in seconds for a UTC datetime. Raises for pre-1972 inputs."""
    if utc.tzinfo is None:
        raise ValueError("datetime must be timezone-aware (UTC)")
    jd_utc = utc.timestamp() / SECONDS_PER_DAY + UNIX_EPOCH_JD
    if jd_utc < LEAP_SECONDS[0].jd_utc:
        raise ValueError(f"UTC date before 1972-01-01 not supported: {utc.isoformat()}")
    offset = LEAP_SECONDS[0].offset
    for entry in LEAP_SECONDS:
        if jd_utc >= entry.jd_utc:
            offset = entry.offset
        else:
            break
    return offset


def utc_to_jd_utc(d: datetime) -> float:
    """UTC datetime → JD on the UTC scale (POSIX-style continuous)."""
    if d.tzinfo is None:
        raise ValueError("datetime must be timezone-aware (UTC)")
    return d.timestamp() / SECONDS_PER_DAY + UNIX_EPOCH_JD


def utc_to_jd_tai(d: datetime) -> float:
    """UTC datetime → JD on the TAI scale."""
    jd_utc = utc_to_jd_utc(d)
    return jd_utc + leap_seconds_at(d) / SECONDS_PER_DAY


def utc_to_jd_tt(d: datetime) -> float:
    """UTC datetime → JD on the TT scale."""
    jd_utc = utc_to_jd_utc(d)
    offset_s = leap_seconds_at(d) + TT_TAI_OFFSET_S
    return jd_utc + offset_s / SECONDS_PER_DAY


def tdb_minus_tt_seconds(jd_tt: float) -> float:
    """TDB - TT (s), Fairhead-Bretagnon 1990 simplified, 1st-order.

    Mirrors `src/astro/time.ts::tdbMinusTtSeconds`.
    """
    t = jd_tt - 2451545.0
    g = 6.24 + 0.017202 * t
    return 0.001658 * math.sin(g) + 0.000014 * math.sin(2 * g)


def utc_to_jd_tdb(d: datetime) -> float:
    """UTC datetime → JD on the TDB scale."""
    jd_tt = utc_to_jd_tt(d)
    return jd_tt + tdb_minus_tt_seconds(jd_tt) / SECONDS_PER_DAY


def jd_to_j2000_days(jd: float) -> float:
    """Days elapsed since J2000.0 (preserves the JD's time scale)."""
    return jd - 2451545.0


def jd_to_mjd(jd: float) -> float:
    """Modified Julian Date: MJD = JD - 2400000.5."""
    return jd - MJD_OFFSET


# ---------- Fixture generation ----------

# Representative UTC instants exercising leap-second boundaries, mission events,
# and a wide span (1972-2100) for TDB-TT model behavior.
REPRESENTATIVE_TIMES_UTC: Final[tuple[str, ...]] = (
    # Around J2000.0 epoch
    "2000-01-01T11:58:55.816Z",
    "2000-01-01T12:00:00.000Z",
    "2000-01-01T00:00:00.000Z",
    # First leap-second epoch
    "1972-01-01T00:00:00.000Z",
    "1972-01-01T00:00:01.000Z",
    "1972-07-01T00:00:00.000Z",
    # 2017 leap-second boundary (most recent)
    "2016-12-31T23:59:59.000Z",
    "2017-01-01T00:00:00.000Z",
    "2017-01-01T00:00:00.500Z",
    # Round dates spanning history
    "1980-01-01T00:00:00.000Z",
    "1990-01-01T00:00:00.000Z",
    "2010-01-01T00:00:00.000Z",
    "2020-01-01T00:00:00.000Z",
    "2025-01-01T00:00:00.000Z",
    "2026-05-05T00:00:00.000Z",
    # Mission events (post-1972)
    "1977-08-20T14:29:44.000Z",
    "1977-09-05T12:56:00.000Z",
    "1990-04-24T12:33:51.000Z",
    # Future
    "2030-01-01T00:00:00.000Z",
    "2050-01-01T00:00:00.000Z",
    "2100-01-01T00:00:00.000Z",
)


def generate_fixtures(out_dir: Path | str) -> Path:
    """Generate `time.json` with derived scales for representative UTC instants.

    Returns the output file path.
    """
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    fixtures: list[dict[str, Any]] = []
    for iso in REPRESENTATIVE_TIMES_UTC:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=UTC)
        jd_utc = utc_to_jd_utc(d)
        jd_tai = utc_to_jd_tai(d)
        jd_tt = utc_to_jd_tt(d)
        jd_tdb = utc_to_jd_tdb(d)
        fixtures.append(
            {
                "utc_iso": iso,
                "leap_seconds": leap_seconds_at(d),
                "jd_utc": jd_utc,
                "jd_tai": jd_tai,
                "jd_tt": jd_tt,
                "jd_tdb": jd_tdb,
                "j2000_days_tdb": jd_to_j2000_days(jd_tdb),
                "mjd_tdb": jd_to_mjd(jd_tdb),
            }
        )

    out_file = out_path / "time.json"
    payload = {
        "_comment": (
            "Generated by orbitarium_tools.time.generate_fixtures. "
            "Re-run: orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/"
        ),
        "_source": (
            "Fairhead-Bretagnon 1990 simplified TDB-TT (1st order, ~50us); "
            "IERS Bulletin C 70 leap seconds"
        ),
        "_tolerance_us": 1,
        "_tdb_tolerance_us": 100,
        "fixtures": fixtures,
    }
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return out_file
