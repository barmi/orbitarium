"""Celestial body catalog reference (Work 6).

Mirrors ``src/bodies/`` semantics. Provides:
  - BodyDefinition Python dataclass with the same shape as the TS interface.
  - Mean equatorial radii for moons that aren't in Work 4's
    ``BODY_MEAN_EQUATORIAL_RADIUS_M`` (Sun + 8 planets + Earth's Moon + Pluto).
  - Body catalog (≥ 19 entries) for fixture cross-validation.

P1 placeholder — only types + catalog defined. P3 adds ``sub_solar_point`` +
mesh-equivalent helpers. P6 adds ``generate_fixtures(out_dir)``.

Conventions (Work 6 P1 decisions):
  - BodyKind: ``'sun' | 'planet' | 'moon' | 'pluto-system'``.
  - Identifier pair: ``naif_id`` (int) + ``slug`` (URL-safe kebab-case).
  - Radii: IAU WGCCRE 2015 (Archinal et al. 2018) — same source as Work 4 #9.
  - Rotation model key: index into ``IAU_MODELS`` (Work 6 P2 extension of
    ``orbitarium_tools.rotation``). Bodies without a published model use
    ``'tidally-locked'``.
  - Saturn rings inner / outer radii from NASA Saturn fact sheet.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Literal

from orbitarium_tools.rotation import (
    IAU_ROTATION_MODELS,
    evaluate_rotation,
    inertial_to_body_fixed,
    spice_inertial_to_body_fixed,
)
from orbitarium_tools.scaling import BODY_MEAN_EQUATORIAL_RADIUS_M
from orbitarium_tools.time import J2000_JD_TDB

BodyKind = Literal["sun", "planet", "moon", "pluto-system"]

BODY_KINDS: Final[tuple[BodyKind, ...]] = ("sun", "planet", "moon", "pluto-system")

# IAU WGCCRE 2015 mean equatorial radii (m) for moons not in Work 4's table.
MOON_MEAN_EQUATORIAL_RADIUS_M: Final[dict[int, float]] = {
    501: 1_821_600.0,  # Io
    502: 1_560_800.0,  # Europa
    503: 2_634_100.0,  # Ganymede
    504: 2_410_300.0,  # Callisto
    601: 198_200.0,  # Mimas
    602: 252_100.0,  # Enceladus
    605: 763_800.0,  # Rhea
    606: 2_574_730.0,  # Titan
    608: 734_400.0,  # Iapetus
}

SATURN_RING_INNER_M: Final[float] = 74_500_000.0
SATURN_RING_OUTER_M: Final[float] = 136_775_000.0


@dataclass(frozen=True, slots=True)
class RingsConfig:
    inner_radius_m: float
    outer_radius_m: float
    texture_url: str


@dataclass(frozen=True, slots=True)
class BodyDefinition:
    naif_id: int
    slug: str
    label: str
    kind: BodyKind
    radius_m: float
    rotation_model_key: str
    texture_url: str | None
    fallback_color: str
    rings: RingsConfig | None
    atmosphere: bool


_TEXTURE_BASE = "/data/textures"


def _planet(
    naif_id: int,
    slug: str,
    label: str,
    fallback_color: str,
    *,
    atmosphere: bool = True,
    rings: RingsConfig | None = None,
) -> BodyDefinition:
    return BodyDefinition(
        naif_id=naif_id,
        slug=slug,
        label=label,
        kind="planet",
        radius_m=BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id],
        rotation_model_key=slug,
        texture_url=f"{_TEXTURE_BASE}/{slug}.jpg",
        fallback_color=fallback_color,
        rings=rings,
        atmosphere=atmosphere,
    )


def _moon(
    naif_id: int,
    slug: str,
    label: str,
    fallback_color: str,
    *,
    rotation_model_key: str | None = None,
    texture_url: str | None = None,
    atmosphere: bool = False,
) -> BodyDefinition:
    return BodyDefinition(
        naif_id=naif_id,
        slug=slug,
        label=label,
        kind="moon",
        radius_m=(
            BODY_MEAN_EQUATORIAL_RADIUS_M[naif_id]
            if naif_id in BODY_MEAN_EQUATORIAL_RADIUS_M
            else MOON_MEAN_EQUATORIAL_RADIUS_M[naif_id]
        ),
        rotation_model_key=rotation_model_key or slug,
        texture_url=texture_url,
        fallback_color=fallback_color,
        rings=None,
        atmosphere=atmosphere,
    )


_SATURN_RINGS = RingsConfig(
    inner_radius_m=SATURN_RING_INNER_M,
    outer_radius_m=SATURN_RING_OUTER_M,
    texture_url=f"{_TEXTURE_BASE}/saturn-rings.png",
)

BODY_CATALOG: Final[tuple[BodyDefinition, ...]] = (
    BodyDefinition(
        naif_id=10,
        slug="sun",
        label="Sun",
        kind="sun",
        radius_m=BODY_MEAN_EQUATORIAL_RADIUS_M[10],
        rotation_model_key="sun",
        texture_url=f"{_TEXTURE_BASE}/sun.jpg",
        fallback_color="#ffd166",
        rings=None,
        atmosphere=False,
    ),
    _planet(199, "mercury", "Mercury", "#9a8a78", atmosphere=False),
    _planet(299, "venus", "Venus", "#d8c490"),
    _planet(399, "earth", "Earth", "#5a8fcd"),
    _planet(499, "mars", "Mars", "#c1542c"),
    _planet(599, "jupiter", "Jupiter", "#c79a6c"),
    _planet(699, "saturn", "Saturn", "#e0c79a", rings=_SATURN_RINGS),
    _planet(799, "uranus", "Uranus", "#aae0e0"),
    _planet(899, "neptune", "Neptune", "#3060c8"),
    BodyDefinition(
        naif_id=999,
        slug="pluto",
        label="Pluto",
        kind="pluto-system",
        radius_m=BODY_MEAN_EQUATORIAL_RADIUS_M[999],
        rotation_model_key="pluto",
        texture_url=f"{_TEXTURE_BASE}/pluto.jpg",
        fallback_color="#c8b48a",
        rings=None,
        atmosphere=False,
    ),
    _moon(301, "moon", "Moon", "#b0b0b0", texture_url=f"{_TEXTURE_BASE}/moon.jpg"),
    _moon(501, "io", "Io", "#e8d76a", texture_url=f"{_TEXTURE_BASE}/io.jpg"),
    _moon(502, "europa", "Europa", "#c5a78a", texture_url=f"{_TEXTURE_BASE}/europa.jpg"),
    _moon(503, "ganymede", "Ganymede", "#a89478", texture_url=f"{_TEXTURE_BASE}/ganymede.jpg"),
    _moon(504, "callisto", "Callisto", "#7a6c5a", texture_url=f"{_TEXTURE_BASE}/callisto.jpg"),
    _moon(601, "mimas", "Mimas", "#999999", rotation_model_key="tidally-locked"),
    _moon(602, "enceladus", "Enceladus", "#dddddd", rotation_model_key="tidally-locked"),
    _moon(605, "rhea", "Rhea", "#a8a8a8", rotation_model_key="tidally-locked"),
    _moon(
        606,
        "titan",
        "Titan",
        "#c79857",
        texture_url=f"{_TEXTURE_BASE}/titan.jpg",
        atmosphere=True,
    ),
    _moon(608, "iapetus", "Iapetus", "#8a7a6a", rotation_model_key="tidally-locked"),
)


_BY_NAIF: Final[dict[int, BodyDefinition]] = {b.naif_id: b for b in BODY_CATALOG}
_BY_SLUG: Final[dict[str, BodyDefinition]] = {b.slug: b for b in BODY_CATALOG}


def get_body_by_naif_id(naif_id: int) -> BodyDefinition | None:
    return _BY_NAIF.get(naif_id)


def get_body_by_slug(slug: str) -> BodyDefinition | None:
    return _BY_SLUG.get(slug)


# ---------------------------------------------------------------------------
# Work 6 fixture generation
# ---------------------------------------------------------------------------

# JD TDB sample times for the rotation grid (Work 6 P2 #5).
ROTATION_FIXTURE_TIMES: Final[tuple[tuple[str, float], ...]] = (
    ("j1900_01_01", 2_415_020.5),
    ("j2000_epoch", J2000_JD_TDB),
    ("voyager_2_fly", 2_446_456.5),  # 1986-01-24 Uranus encounter
    ("work_06_demo", 2_461_166.5),  # 2026-05-06 00:00 UTC ~
    ("j2100_01_01", 2_488_069.5),
)


def generate_iau_rotation_fixture(out_dir: Path | str) -> Path:
    """11 rotation models x 5 jdTdb -> ra/dec/W + matrix + SPICE max-diff."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    models_payload: list[dict[str, object]] = []
    for key, model in IAU_ROTATION_MODELS.items():
        rows: list[dict[str, object]] = []
        for label, jd in ROTATION_FIXTURE_TIMES:
            angles = evaluate_rotation(model, jd)
            inertial_to_fixed = inertial_to_body_fixed(model, jd)
            spice_matrix = spice_inertial_to_body_fixed(model, jd)
            max_abs_diff = max(
                abs(actual - expected)
                for actual, expected in zip(inertial_to_fixed, spice_matrix, strict=True)
            )
            rows.append(
                {
                    "label": label,
                    "jd_tdb": jd,
                    "j2000_days_tdb": jd - J2000_JD_TDB,
                    "ra_deg": angles.ra_deg,
                    "dec_deg": angles.dec_deg,
                    "w_deg": angles.w_deg,
                    "inertial_to_body_fixed": list(inertial_to_fixed),
                    "spice_max_abs_diff": max_abs_diff,
                }
            )
        models_payload.append(
            {
                "key": key,
                "naif_id": model.naif_id,
                "name": model.name,
                "frame_name": model.frame_name,
                "samples": rows,
            }
        )

    payload: dict[str, object] = {
        "_comment": (
            "Generated by orbitarium_tools.bodies.generate_iau_rotation_fixture. "
            "Re-run: orbitarium-tools fixtures --work=6 --out=tests/fixtures/work-06/"
        ),
        "_source": (
            "11 IAU rotation models (Work 6 P2 polynomial-only). Each row carries "
            "the SPICE pxform comparison; Mercury / Moon expect ~arcsec diff due "
            "to omitted libration / nutation terms (Work 11)."
        ),
        "_tolerance_mas_polynomial_only": 1,
        "_tolerance_arcsec_mercury_moon": 60,
        "models": models_payload,
    }

    out_file = out_path / "iau-rotation.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return out_file


def generate_body_catalog_fixture(out_dir: Path | str) -> Path:
    """BODY_CATALOG dump for TS cross-check."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    bodies = [
        {
            "naif_id": b.naif_id,
            "slug": b.slug,
            "label": b.label,
            "kind": b.kind,
            "radius_m": b.radius_m,
            "rotation_model_key": b.rotation_model_key,
            "texture_url": b.texture_url,
            "fallback_color": b.fallback_color,
            "atmosphere": b.atmosphere,
            "rings": (
                None
                if b.rings is None
                else {
                    "inner_radius_m": b.rings.inner_radius_m,
                    "outer_radius_m": b.rings.outer_radius_m,
                    "texture_url": b.rings.texture_url,
                }
            ),
        }
        for b in BODY_CATALOG
    ]

    payload: dict[str, object] = {
        "_comment": (
            "Generated by orbitarium_tools.bodies.generate_body_catalog_fixture. "
            "Mirrors src/bodies/catalog.ts BODY_CATALOG."
        ),
        "_source": "Work 4 BODY_MEAN_EQUATORIAL_RADIUS_M + Work 6 MOON_MEAN_EQUATORIAL_RADIUS_M.",
        "bodies": bodies,
    }

    out_file = out_path / "body-catalog.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    return out_file


def generate_fixtures(out_dir: Path | str) -> tuple[Path, Path]:
    """Generate Work 6 catalog + rotation fixtures."""
    return (generate_iau_rotation_fixture(out_dir), generate_body_catalog_fixture(out_dir))
