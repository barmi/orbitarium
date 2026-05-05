"""IAU body rotation model foundation — Python reference for Work 2 P4.

This mirrors ``src/astro/rotation.ts`` and also cross-checks the matrix
convention against SPICE text-PCK evaluation for Earth. P4 intentionally includes
Earth only; Work 6 extends the data set to additional bodies.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Final, Literal

import spiceypy as spice  # type: ignore[import-untyped]

from orbitarium_tools.frames import Matrix3, mat_mul3, transpose_matrix3
from orbitarium_tools.time import J2000_JD_TDB, SECONDS_PER_DAY, utc_to_jd_tdb

JULIAN_CENTURY_DAYS: Final[int] = 36525

IAURotationTimeVariable = Literal["d", "T"]
IAUTrigFunction = Literal["sin", "cos"]


@dataclass(frozen=True, slots=True)
class IAUPolynomialDegrees:
    variable: IAURotationTimeVariable
    coefficients: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class IAUPeriodicTerm:
    amplitude_deg: float
    trig: IAUTrigFunction
    angle: IAUPolynomialDegrees


@dataclass(frozen=True, slots=True)
class IAUAngleModel:
    polynomial: IAUPolynomialDegrees
    periodic_terms: tuple[IAUPeriodicTerm, ...] = ()


@dataclass(frozen=True, slots=True)
class IAURotationModel:
    naif_id: int
    name: str
    frame_name: str
    source: str
    pole_ra: IAUAngleModel
    pole_dec: IAUAngleModel
    prime_meridian: IAUAngleModel


@dataclass(frozen=True, slots=True)
class IAURotationAngles:
    ra_deg: float
    dec_deg: float
    w_deg: float


EARTH_IAU_ROTATION: Final[IAURotationModel] = IAURotationModel(
    naif_id=399,
    name="Earth",
    frame_name="IAU_EARTH",
    source=(
        "NAIF pck00011.tpc BODY399_* constants; "
        "Earth orientation inherited from WGCCRE 2009"
    ),
    pole_ra=IAUAngleModel(IAUPolynomialDegrees("T", (0.0, -0.641, 0.0))),
    pole_dec=IAUAngleModel(IAUPolynomialDegrees("T", (90.0, -0.557, 0.0))),
    prime_meridian=IAUAngleModel(IAUPolynomialDegrees("d", (190.147, 360.9856235, 0.0))),
)


_PCK = "NAIF pck00011.tpc; IAU WGCCRE 2015 (Archinal et al. 2018)"


def _model(
    naif_id: int,
    name: str,
    frame_name: str,
    source: str,
    pole_ra: tuple[float, float, float],
    pole_dec: tuple[float, float, float],
    pm: tuple[float, float, float],
    pm_variable: IAURotationTimeVariable = "d",
) -> IAURotationModel:
    return IAURotationModel(
        naif_id=naif_id,
        name=name,
        frame_name=frame_name,
        source=source,
        pole_ra=IAUAngleModel(IAUPolynomialDegrees("T", pole_ra)),
        pole_dec=IAUAngleModel(IAUPolynomialDegrees("T", pole_dec)),
        prime_meridian=IAUAngleModel(IAUPolynomialDegrees(pm_variable, pm)),
    )


SUN_IAU_ROTATION: Final[IAURotationModel] = _model(
    10, "Sun", "IAU_SUN", _PCK, (286.13, 0.0, 0.0), (63.87, 0.0, 0.0), (84.176, 14.1844, 0.0)
)
MERCURY_IAU_ROTATION: Final[IAURotationModel] = _model(
    199,
    "Mercury",
    "IAU_MERCURY",
    f"{_PCK}; libration terms omitted (Work 11)",
    (281.0103, -0.0328, 0.0),
    (61.4155, -0.0049, 0.0),
    (329.5988, 6.1385108, 0.0),
)
VENUS_IAU_ROTATION: Final[IAURotationModel] = _model(
    299,
    "Venus",
    "IAU_VENUS",
    _PCK,
    (272.76, 0.0, 0.0),
    (67.16, 0.0, 0.0),
    (160.2, -1.4813688, 0.0),
)
MOON_IAU_ROTATION: Final[IAURotationModel] = _model(
    301,
    "Moon",
    "IAU_MOON",
    f"{_PCK}; nutation/libration terms omitted (Work 11)",
    (269.9949, 0.0031, 0.0),
    (66.5392, 0.013, 0.0),
    (38.3213, 13.17635815, -1.4e-12),
)
MARS_IAU_ROTATION: Final[IAURotationModel] = _model(
    499,
    "Mars",
    "IAU_MARS",
    _PCK,
    (317.68143, -0.1061, 0.0),
    (52.8865, -0.0609, 0.0),
    (176.63, 350.89198226, 0.0),
)
JUPITER_IAU_ROTATION: Final[IAURotationModel] = _model(
    599,
    "Jupiter",
    "IAU_JUPITER",
    _PCK,
    (268.056595, -0.006499, 0.0),
    (64.495303, 0.002413, 0.0),
    (284.95, 870.536, 0.0),
)
SATURN_IAU_ROTATION: Final[IAURotationModel] = _model(
    699,
    "Saturn",
    "IAU_SATURN",
    _PCK,
    (40.589, -0.036, 0.0),
    (83.537, -0.004, 0.0),
    (38.9, 810.7939024, 0.0),
)
URANUS_IAU_ROTATION: Final[IAURotationModel] = _model(
    799,
    "Uranus",
    "IAU_URANUS",
    _PCK,
    (257.311, 0.0, 0.0),
    (-15.175, 0.0, 0.0),
    (203.81, -501.1600928, 0.0),
)
NEPTUNE_IAU_ROTATION: Final[IAURotationModel] = _model(
    899,
    "Neptune",
    "IAU_NEPTUNE",
    f"{_PCK}; periodic N term omitted (Work 11)",
    (299.36, 0.0, 0.0),
    (43.46, 0.0, 0.0),
    (253.18, 536.3128492, 0.0),
)
PLUTO_IAU_ROTATION: Final[IAURotationModel] = _model(
    999,
    "Pluto",
    "IAU_PLUTO",
    _PCK,
    (132.993, 0.0, 0.0),
    (-6.163, 0.0, 0.0),
    (302.695, 56.3625225, 0.0),
)


IAU_ROTATION_MODELS: Final[dict[str, IAURotationModel]] = {
    "sun": SUN_IAU_ROTATION,
    "mercury": MERCURY_IAU_ROTATION,
    "venus": VENUS_IAU_ROTATION,
    "earth": EARTH_IAU_ROTATION,
    "moon": MOON_IAU_ROTATION,
    "mars": MARS_IAU_ROTATION,
    "jupiter": JUPITER_IAU_ROTATION,
    "saturn": SATURN_IAU_ROTATION,
    "uranus": URANUS_IAU_ROTATION,
    "neptune": NEPTUNE_IAU_ROTATION,
    "pluto": PLUTO_IAU_ROTATION,
}


def get_iau_rotation_model(key: str) -> IAURotationModel | None:
    return IAU_ROTATION_MODELS.get(key)


def normalize_degrees(deg: float) -> float:
    if 0.0 <= deg < 360.0:
        return 0.0 if deg == -0.0 else deg
    wrapped = deg % 360.0
    return 0.0 if wrapped == -0.0 else wrapped


def evaluate_polynomial_degrees(
    polynomial: IAUPolynomialDegrees, j2000_days_tdb: float
) -> float:
    x = (
        j2000_days_tdb
        if polynomial.variable == "d"
        else j2000_days_tdb / JULIAN_CENTURY_DAYS
    )
    value = 0.0
    for coefficient in reversed(polynomial.coefficients):
        value = value * x + coefficient
    return value


def evaluate_angle_model(model: IAUAngleModel, j2000_days_tdb: float) -> float:
    value = evaluate_polynomial_degrees(model.polynomial, j2000_days_tdb)
    for term in model.periodic_terms:
        angle_rad = math.radians(evaluate_polynomial_degrees(term.angle, j2000_days_tdb))
        if term.trig == "sin":
            value += term.amplitude_deg * math.sin(angle_rad)
        else:
            value += term.amplitude_deg * math.cos(angle_rad)
    return value


def evaluate_rotation(model: IAURotationModel, jd_tdb: float) -> IAURotationAngles:
    j2000_days_tdb = jd_tdb - J2000_JD_TDB
    return IAURotationAngles(
        ra_deg=normalize_degrees(evaluate_angle_model(model.pole_ra, j2000_days_tdb)),
        dec_deg=evaluate_angle_model(model.pole_dec, j2000_days_tdb),
        w_deg=normalize_degrees(evaluate_angle_model(model.prime_meridian, j2000_days_tdb)),
    )


def _rotation_x(angle_rad: float) -> Matrix3:
    c = math.cos(angle_rad)
    s = math.sin(angle_rad)
    return (1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c)


def _rotation_z(angle_rad: float) -> Matrix3:
    c = math.cos(angle_rad)
    s = math.sin(angle_rad)
    return (c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0)


def inertial_to_body_fixed(model: IAURotationModel, jd_tdb: float) -> Matrix3:
    """ICRF/J2000 inertial -> body-fixed matrix for ``model`` at ``jd_tdb``."""
    angles = evaluate_rotation(model, jd_tdb)
    ra = math.radians(angles.ra_deg)
    dec = math.radians(angles.dec_deg)
    w = math.radians(angles.w_deg)
    return mat_mul3(
        _rotation_z(-w),
        mat_mul3(
            _rotation_x(dec - math.pi / 2.0),
            _rotation_z(-(math.pi / 2.0 + ra)),
        ),
    )


def body_fixed_to_inertial(model: IAURotationModel, jd_tdb: float) -> Matrix3:
    """Body-fixed -> ICRF/J2000 inertial matrix, inverse of ``inertial_to_body_fixed``."""
    return transpose_matrix3(inertial_to_body_fixed(model, jd_tdb))


def _padded_coefficients(polynomial: IAUPolynomialDegrees) -> tuple[float, float, float]:
    return (
        polynomial.coefficients[0] if len(polynomial.coefficients) > 0 else 0.0,
        polynomial.coefficients[1] if len(polynomial.coefficients) > 1 else 0.0,
        polynomial.coefficients[2] if len(polynomial.coefficients) > 2 else 0.0,
    )


def earth_spice_pck_lines() -> tuple[str, ...]:
    """Return minimal text-PCK assignments for the embedded Earth model."""
    return spice_pck_lines(EARTH_IAU_ROTATION)


def spice_pck_lines(model: IAURotationModel) -> tuple[str, ...]:
    """Generate minimal text-PCK assignments for an arbitrary IAU model."""
    ra = _padded_coefficients(model.pole_ra.polynomial)
    dec = _padded_coefficients(model.pole_dec.polynomial)
    pm = _padded_coefficients(model.prime_meridian.polynomial)
    nid = model.naif_id
    return (
        f"BODY{nid}_POLE_RA = ( {ra[0]} {ra[1]} {ra[2]} )",
        f"BODY{nid}_POLE_DEC = ( {dec[0]} {dec[1]} {dec[2]} )",
        f"BODY{nid}_PM = ( {pm[0]} {pm[1]} {pm[2]} )",
        f"BODY{nid}_LONG_AXIS = ( 0.0 )",
    )


def spice_earth_inertial_to_body_fixed(jd_tdb: float) -> Matrix3:
    """Evaluate Earth ICRF/J2000 -> IAU_EARTH using SPICE text-PCK semantics."""
    return spice_inertial_to_body_fixed(EARTH_IAU_ROTATION, jd_tdb)


def spice_inertial_to_body_fixed(model: IAURotationModel, jd_tdb: float) -> Matrix3:
    """Evaluate ICRF/J2000 -> body-fixed using SPICE text-PCK semantics."""
    spice.kclear()
    try:
        spice.lmpool(list(spice_pck_lines(model)))
        et = (jd_tdb - J2000_JD_TDB) * SECONDS_PER_DAY
        matrix = spice.pxform("J2000", model.frame_name, et)
        return tuple(float(x) for x in matrix.flatten())  # type: ignore[return-value]
    finally:
        spice.kclear()


ROTATION_CASES: Final[tuple[tuple[str, float], ...]] = (
    ("j2000_minus_50y", J2000_JD_TDB - JULIAN_CENTURY_DAYS / 2.0),
    ("j2000_epoch", J2000_JD_TDB),
    ("j2000_plus_12h", J2000_JD_TDB + 0.5),
    ("j2000_plus_10y", J2000_JD_TDB + 3652.5),
    ("j2000_plus_50y", J2000_JD_TDB + JULIAN_CENTURY_DAYS / 2.0),
)

ROTATION_UTC_CASES: Final[tuple[tuple[str, str], ...]] = (
    ("voyager_1_launch", "1977-09-05T12:56:00.000Z"),
    ("hubble_launch", "1990-04-24T12:33:51.000Z"),
    ("work_02_current_date", "2026-05-05T00:00:00.000Z"),
    ("future_2030", "2030-01-01T00:00:00.000Z"),
)


def _datetime_from_utc_iso(iso: str) -> datetime:
    d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    if d.tzinfo is None:
        d = d.replace(tzinfo=UTC)
    return d


def _fixture_entry(label: str, jd_tdb: float, utc_iso: str | None = None) -> dict[str, Any]:
    angles = evaluate_rotation(EARTH_IAU_ROTATION, jd_tdb)
    inertial_to_fixed = inertial_to_body_fixed(EARTH_IAU_ROTATION, jd_tdb)
    fixed_to_inertial = body_fixed_to_inertial(EARTH_IAU_ROTATION, jd_tdb)
    spice_matrix = spice_earth_inertial_to_body_fixed(jd_tdb)
    return {
        "label": label,
        "utc_iso": utc_iso,
        "jd_tdb": jd_tdb,
        "j2000_days_tdb": jd_tdb - J2000_JD_TDB,
        "ra_deg": angles.ra_deg,
        "dec_deg": angles.dec_deg,
        "w_deg": angles.w_deg,
        "inertial_to_body_fixed": list(inertial_to_fixed),
        "body_fixed_to_inertial": list(fixed_to_inertial),
        "spice_inertial_to_body_fixed": list(spice_matrix),
        "spice_max_abs_diff": max(
            abs(actual - expected)
            for actual, expected in zip(inertial_to_fixed, spice_matrix, strict=True)
        ),
    }


def generate_fixtures(out_dir: Path | str) -> Path:
    """Generate ``rotation-earth.json`` with Earth rotation golden values."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    fixtures = [_fixture_entry(label, jd_tdb) for label, jd_tdb in ROTATION_CASES]
    for label, iso in ROTATION_UTC_CASES:
        fixtures.append(_fixture_entry(label, utc_to_jd_tdb(_datetime_from_utc_iso(iso)), iso))

    out_file = out_path / "rotation-earth.json"
    payload = {
        "_comment": (
            "Generated by orbitarium_tools.rotation.generate_fixtures. "
            "Re-run: orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/"
        ),
        "_source": (
            "NAIF pck00011.tpc BODY399_* constants. Earth orientation is inherited "
            "from WGCCRE 2009 because the 2015 report no longer provides Earth "
            "orientation; matrix convention cross-checked with spiceypy pxform."
        ),
        "_tolerance_mas": 1,
        "_matrix_tolerance": 1e-10,
        "model": {
            "naif_id": EARTH_IAU_ROTATION.naif_id,
            "name": EARTH_IAU_ROTATION.name,
            "frame_name": EARTH_IAU_ROTATION.frame_name,
            "source": EARTH_IAU_ROTATION.source,
            "pole_ra": list(EARTH_IAU_ROTATION.pole_ra.polynomial.coefficients),
            "pole_dec": list(EARTH_IAU_ROTATION.pole_dec.polynomial.coefficients),
            "prime_meridian": list(EARTH_IAU_ROTATION.prime_meridian.polynomial.coefficients),
        },
        "fixtures": fixtures,
    }
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return out_file
