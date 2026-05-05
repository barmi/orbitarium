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

from dataclasses import dataclass
from typing import Final, Literal

from orbitarium_tools.scaling import BODY_MEAN_EQUATORIAL_RADIUS_M

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
