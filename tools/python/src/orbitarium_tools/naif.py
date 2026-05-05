"""NAIF integer ID catalog — Python mirror of `src/astro/naif.ts`.

Coverage (Work 2 P1): Sun + 9 planet barycenters + 9 planet bodies + Moon +
Galilean 4 + Saturn major-5 = 29 entries. Extended in Work 6.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final, Literal

NaifKind = Literal["star", "barycenter", "planet", "moon"]


@dataclass(frozen=True, slots=True)
class NaifEntry:
    id: int
    name: str
    kind: NaifKind
    parent: int | None


NAIF_CATALOG: Final[dict[str, NaifEntry]] = {
    "sun": NaifEntry(10, "Sun", "star", None),
    "mercury_bary": NaifEntry(1, "Mercury Barycenter", "barycenter", 10),
    "venus_bary": NaifEntry(2, "Venus Barycenter", "barycenter", 10),
    "earth_moon_bary": NaifEntry(3, "Earth-Moon Barycenter", "barycenter", 10),
    "mars_bary": NaifEntry(4, "Mars Barycenter", "barycenter", 10),
    "jupiter_bary": NaifEntry(5, "Jupiter Barycenter", "barycenter", 10),
    "saturn_bary": NaifEntry(6, "Saturn Barycenter", "barycenter", 10),
    "uranus_bary": NaifEntry(7, "Uranus Barycenter", "barycenter", 10),
    "neptune_bary": NaifEntry(8, "Neptune Barycenter", "barycenter", 10),
    "pluto_bary": NaifEntry(9, "Pluto Barycenter", "barycenter", 10),
    "mercury": NaifEntry(199, "Mercury", "planet", 1),
    "venus": NaifEntry(299, "Venus", "planet", 2),
    "earth": NaifEntry(399, "Earth", "planet", 3),
    "mars": NaifEntry(499, "Mars", "planet", 4),
    "jupiter": NaifEntry(599, "Jupiter", "planet", 5),
    "saturn": NaifEntry(699, "Saturn", "planet", 6),
    "uranus": NaifEntry(799, "Uranus", "planet", 7),
    "neptune": NaifEntry(899, "Neptune", "planet", 8),
    "pluto": NaifEntry(999, "Pluto", "planet", 9),
    "moon": NaifEntry(301, "Moon", "moon", 399),
    "io": NaifEntry(501, "Io", "moon", 599),
    "europa": NaifEntry(502, "Europa", "moon", 599),
    "ganymede": NaifEntry(503, "Ganymede", "moon", 599),
    "callisto": NaifEntry(504, "Callisto", "moon", 599),
    "mimas": NaifEntry(601, "Mimas", "moon", 699),
    "enceladus": NaifEntry(602, "Enceladus", "moon", 699),
    "rhea": NaifEntry(605, "Rhea", "moon", 699),
    "titan": NaifEntry(606, "Titan", "moon", 699),
    "iapetus": NaifEntry(608, "Iapetus", "moon", 699),
}

NAIF_IDS: Final[tuple[int, ...]] = tuple(e.id for e in NAIF_CATALOG.values())


def get_by_naif_id(id: int) -> NaifEntry | None:
    """Lookup catalog entry by NAIF id. Returns None when not present."""
    for entry in NAIF_CATALOG.values():
        if entry.id == id:
            return entry
    return None
