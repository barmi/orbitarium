"""NAIF catalog structural validation. Mirrors `tests/unit/astro/naif.test.ts`."""

from __future__ import annotations

from orbitarium_tools.naif import NAIF_CATALOG, NAIF_IDS, get_by_naif_id


def test_catalog_has_29_entries() -> None:
    assert len(NAIF_CATALOG) == 29
    assert len(NAIF_IDS) == 29


def test_all_naif_ids_unique() -> None:
    assert len(set(NAIF_IDS)) == len(NAIF_IDS)


def test_sun_is_only_top_level() -> None:
    assert NAIF_CATALOG["sun"].id == 10
    assert NAIF_CATALOG["sun"].parent is None
    top_level = [e for e in NAIF_CATALOG.values() if e.parent is None]
    assert len(top_level) == 1


def test_planet_bodies_use_barycenter_as_parent() -> None:
    planet_keys = [
        "mercury",
        "venus",
        "earth",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
    ]
    for key in planet_keys:
        planet = NAIF_CATALOG[key]
        assert planet.kind == "planet"
        assert planet.parent is not None
        # 199 → 1, 299 → 2, …, 999 → 9
        assert planet.id // 100 == planet.parent


def test_moon_parent_is_earth() -> None:
    assert NAIF_CATALOG["moon"].parent == NAIF_CATALOG["earth"].id


def test_galilean_moons_are_four() -> None:
    galilean = [
        e for e in NAIF_CATALOG.values() if e.parent == NAIF_CATALOG["jupiter"].id
    ]
    assert len(galilean) == 4
    assert sorted(e.name for e in galilean) == ["Callisto", "Europa", "Ganymede", "Io"]


def test_saturn_major_five() -> None:
    saturn_moons = [
        e for e in NAIF_CATALOG.values() if e.parent == NAIF_CATALOG["saturn"].id
    ]
    assert len(saturn_moons) == 5
    assert sorted(e.name for e in saturn_moons) == [
        "Enceladus",
        "Iapetus",
        "Mimas",
        "Rhea",
        "Titan",
    ]


def test_get_by_naif_id_known() -> None:
    sun = get_by_naif_id(10)
    assert sun is not None
    assert sun.name == "Sun"

    earth = get_by_naif_id(399)
    assert earth is not None
    assert earth.name == "Earth"

    titan = get_by_naif_id(606)
    assert titan is not None
    assert titan.name == "Titan"


def test_get_by_naif_id_unknown_returns_none() -> None:
    assert get_by_naif_id(99999) is None
