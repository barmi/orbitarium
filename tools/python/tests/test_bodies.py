"""Tests for orbitarium_tools.bodies (Work 6)."""

from __future__ import annotations

from orbitarium_tools.bodies import (
    BODY_CATALOG,
    BODY_KINDS,
    MOON_MEAN_EQUATORIAL_RADIUS_M,
    SATURN_RING_INNER_M,
    SATURN_RING_OUTER_M,
    BodyDefinition,
    get_body_by_naif_id,
    get_body_by_slug,
)
from orbitarium_tools.scaling import BODY_MEAN_EQUATORIAL_RADIUS_M


def test_body_kinds_lists_four_kinds() -> None:
    assert BODY_KINDS == ("sun", "planet", "moon", "pluto-system")


def test_body_catalog_has_twenty_entries() -> None:
    assert len(BODY_CATALOG) == 20


def test_body_catalog_unique_slugs_and_naif_ids() -> None:
    slugs = {b.slug for b in BODY_CATALOG}
    ids = {b.naif_id for b in BODY_CATALOG}
    assert len(slugs) == len(BODY_CATALOG)
    assert len(ids) == len(BODY_CATALOG)


def test_body_catalog_one_sun() -> None:
    suns = [b for b in BODY_CATALOG if b.kind == "sun"]
    assert len(suns) == 1
    assert suns[0].naif_id == 10


def test_body_catalog_eight_planets_with_rings_on_saturn() -> None:
    planets = [b for b in BODY_CATALOG if b.kind == "planet"]
    assert len(planets) == 8
    ids = sorted(p.naif_id for p in planets)
    assert ids == [199, 299, 399, 499, 599, 699, 799, 899]
    ringed = [p for p in planets if p.rings is not None]
    assert len(ringed) == 1
    assert ringed[0].slug == "saturn"


def test_body_catalog_pluto_system_singleton() -> None:
    plutos = [b for b in BODY_CATALOG if b.kind == "pluto-system"]
    assert len(plutos) == 1
    assert plutos[0].naif_id == 999


def test_body_catalog_ten_moons() -> None:
    moons = [b for b in BODY_CATALOG if b.kind == "moon"]
    assert len(moons) == 10
    ids = sorted(m.naif_id for m in moons)
    assert ids == [301, 501, 502, 503, 504, 601, 602, 605, 606, 608]


def test_body_catalog_radius_matches_iau_source() -> None:
    for body in BODY_CATALOG:
        assert body.radius_m > 0
        if body.naif_id in BODY_MEAN_EQUATORIAL_RADIUS_M:
            assert body.radius_m == BODY_MEAN_EQUATORIAL_RADIUS_M[body.naif_id]
        else:
            assert body.radius_m == MOON_MEAN_EQUATORIAL_RADIUS_M[body.naif_id]


def test_body_catalog_rotation_key_pattern() -> None:
    for body in BODY_CATALOG:
        if body.rotation_model_key == "tidally-locked":
            assert body.kind == "moon"
        else:
            assert body.rotation_model_key == body.slug


def test_body_catalog_atmosphere_set_correctly() -> None:
    expected = {"venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "titan"}
    actual = {b.slug for b in BODY_CATALOG if b.atmosphere}
    assert actual == expected


def test_body_catalog_fallback_color_is_hex() -> None:
    import re

    pattern = re.compile(r"^#[0-9a-fA-F]{6}$")
    for body in BODY_CATALOG:
        assert pattern.match(body.fallback_color), body.fallback_color


def test_non_textured_saturn_moons_have_no_texture_url() -> None:
    no_texture = sorted(b.slug for b in BODY_CATALOG if b.texture_url is None)
    assert no_texture == ["enceladus", "iapetus", "mimas", "rhea"]


def test_saturn_rings_inner_outer_geometry() -> None:
    saturn = get_body_by_slug("saturn")
    assert saturn is not None
    assert saturn.rings is not None
    rings = saturn.rings
    assert rings.inner_radius_m == SATURN_RING_INNER_M
    assert rings.outer_radius_m == SATURN_RING_OUTER_M
    assert rings.inner_radius_m < rings.outer_radius_m
    assert rings.inner_radius_m > saturn.radius_m


def test_lookup_by_naif_id_roundtrip() -> None:
    earth = get_body_by_naif_id(399)
    assert earth is not None
    assert earth.slug == "earth"
    assert get_body_by_naif_id(0) is None


def test_lookup_by_slug_roundtrip() -> None:
    titan = get_body_by_slug("titan")
    assert titan is not None
    assert titan.naif_id == 606
    assert get_body_by_slug("mars-2") is None


def test_lookup_returns_same_instance() -> None:
    for body in BODY_CATALOG:
        found: BodyDefinition | None = get_body_by_slug(body.slug)
        assert found is not None
        assert found.naif_id == body.naif_id
