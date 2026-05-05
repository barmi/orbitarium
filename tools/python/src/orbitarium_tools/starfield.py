"""Starfield reference implementation (Work 5).

Mirrors ``src/render/starfield.ts`` semantics. Provides Hipparcos catalog
access, B-V → color temperature mapping (Ballesteros 2012), 256-entry
Kelvin → RGB palette, and the binary serialization consumed by the browser
starfield mesh.

P1 placeholder — only constants and binary-format / palette config defined.
P2 adds color-temperature → RGB conversion.
P4 adds Hipparcos download + filtering + binary serialization.
P6 adds ``generate_fixtures(out_dir)``.

Conventions (Work 5 P1 decisions):
  - Hipparcos main catalog, ``Vmag <= 6.0`` cutoff (~9 100 stars).
  - Star frame: ICRS / J2000 with Hipparcos epoch (J1991.25) proper motion
    applied forward to J2000 before serialization.
  - Single celestial sphere — every star placed at radius
    ``STARFIELD_SCENE_RADIUS`` (1e9 scene units). Parallax-based depth is a
    Work 9/11 candidate.
  - Color temperature: Ballesteros 2012 ``T = 4600 * (1/(0.92 BV + 1.7) +
    1/(0.92 BV + 0.62))``. Stars with missing B-V default to a Sun-like
    5778 K.
  - Palette: 256 entries, log-uniform Kelvin in [2000, 30000].
  - Magnitude bucket: 256 buckets, linear Vmag in [-2, 8].
  - Binary format: 16-byte little-endian header (``b"STRF"`` magic + uint32
    version + uint32 count + float32 sceneRadius) followed by ``Float32 [x,
    y, z] * N + Uint8 [colorIdx] * N + Uint8 [magBucket] * N``.
"""

from __future__ import annotations

import math
import struct
import warnings
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Final

STARFIELD_MAGIC: Final[bytes] = b"STRF"
STARFIELD_FORMAT_VERSION: Final[int] = 1
STARFIELD_HEADER_BYTES: Final[int] = 16

PALETTE_SIZE: Final[int] = 256
PALETTE_KELVIN_MIN: Final[float] = 2000.0
PALETTE_KELVIN_MAX: Final[float] = 30000.0

MAG_BUCKET_COUNT: Final[int] = 256
MAG_VMAG_MIN: Final[float] = -2.0
MAG_VMAG_MAX: Final[float] = 8.0

DEFAULT_VMAG_CUTOFF: Final[float] = 6.0

STARFIELD_SCENE_RADIUS: Final[float] = 1.0e9

FALLBACK_COLOR_TEMP_K: Final[float] = 5778.0


def _clamp_u8(x: float) -> int:
    if x <= 0.0:
        return 0
    if x >= 255.0:
        return 255
    return round(x)


def kelvin_to_rgb_u8(kelvin: float) -> tuple[int, int, int]:
    """Black-body temperature (Kelvin) -> 8-bit sRGB triple.

    Tanner Helland 2012 piecewise approximation. Output is sRGB-encoded;
    the renderer reads palette samples as sRGB and the GPU linearizes them
    before lighting math (matches Work 5 P2 #4 decision -- linear-RGB
    interpolation in shader).
    """

    t = max(1000.0, min(40000.0, kelvin)) / 100.0

    red = 255.0 if t <= 66.0 else 329.698727446 * ((t - 60.0) ** -0.1332047592)
    green = (
        99.4708025861 * math.log(t) - 161.1195681661
        if t <= 66.0
        else 288.1221695283 * ((t - 60.0) ** -0.0755148492)
    )
    if t >= 66.0:
        blue = 255.0
    elif t <= 19.0:
        blue = 0.0
    else:
        blue = 138.5177312231 * math.log(t - 10.0) - 305.0447927307

    return _clamp_u8(red), _clamp_u8(green), _clamp_u8(blue)


def palette_index_for_kelvin(kelvin: float) -> int:
    """Map Kelvin to a 0..PALETTE_SIZE-1 bucket using log-uniform spacing."""

    if kelvin <= PALETTE_KELVIN_MIN:
        return 0
    if kelvin >= PALETTE_KELVIN_MAX:
        return PALETTE_SIZE - 1
    log_min = math.log(PALETTE_KELVIN_MIN)
    log_max = math.log(PALETTE_KELVIN_MAX)
    t = (math.log(kelvin) - log_min) / (log_max - log_min)
    return max(0, min(PALETTE_SIZE - 1, round(t * (PALETTE_SIZE - 1))))


def kelvin_for_palette_index(index: int) -> float:
    """Inverse of :func:`palette_index_for_kelvin` -- bucket centroid Kelvin."""

    if index <= 0:
        return PALETTE_KELVIN_MIN
    if index >= PALETTE_SIZE - 1:
        return PALETTE_KELVIN_MAX
    log_min = math.log(PALETTE_KELVIN_MIN)
    log_max = math.log(PALETTE_KELVIN_MAX)
    t = index / (PALETTE_SIZE - 1)
    return float(math.exp(log_min + t * (log_max - log_min)))


def build_palette() -> bytes:
    """Pre-compute the 256-entry RGB palette (1 KB sRGB triples + 1 byte pad).

    Returns ``PALETTE_SIZE * 4`` bytes (RGBA) so the browser texture can be
    a single-channel ``Uint8Array`` with stride 4 -- friendlier for WebGL
    integer textures.
    """

    out = bytearray(PALETTE_SIZE * 4)
    for i in range(PALETTE_SIZE):
        kelvin = kelvin_for_palette_index(i)
        r, g, b = kelvin_to_rgb_u8(kelvin)
        out[i * 4 + 0] = r
        out[i * 4 + 1] = g
        out[i * 4 + 2] = b
        out[i * 4 + 3] = 255
    return bytes(out)


def magnitude_to_bucket(vmag: float) -> int:
    """Clamp + linearly map Vmag to a 0..255 bucket (P1 #magBucket decision)."""

    if vmag <= MAG_VMAG_MIN:
        return 0
    if vmag >= MAG_VMAG_MAX:
        return MAG_BUCKET_COUNT - 1
    t = (vmag - MAG_VMAG_MIN) / (MAG_VMAG_MAX - MAG_VMAG_MIN)
    return max(0, min(MAG_BUCKET_COUNT - 1, round(t * (MAG_BUCKET_COUNT - 1))))


# Hipparcos catalog epoch (J1991.25) -> J2000 proper-motion delta in years.
HIPPARCOS_EPOCH_TO_J2000_YEARS: Final[float] = 8.75


def bv_to_kelvin(bv: float) -> float:
    """Ballesteros 2012: B-V color index -> blackbody temperature (K).

    ``T = 4600 K * ( 1 / (0.92 BV + 1.7) + 1 / (0.92 BV + 0.62) )``.

    NaN / extreme inputs fall back to :data:`FALLBACK_COLOR_TEMP_K`.
    """

    if math.isnan(bv) or bv < -0.5 or bv > 2.5:
        return FALLBACK_COLOR_TEMP_K
    a = 0.92 * bv + 1.7
    b = 0.92 * bv + 0.62
    if a == 0.0 or b == 0.0:
        return FALLBACK_COLOR_TEMP_K
    return 4600.0 * (1.0 / a + 1.0 / b)


def apply_proper_motion(
    ra_deg: float,
    dec_deg: float,
    pmra_mas_per_yr: float,
    pmdec_mas_per_yr: float,
    dt_years: float = HIPPARCOS_EPOCH_TO_J2000_YEARS,
) -> tuple[float, float]:
    """Apply linear proper motion in RA / Dec.

    Hipparcos ``pmRA`` is ``mu_alpha * cos(delta)`` in mas/yr; convert back
    to true mu_alpha by dividing by cos(delta) before stepping RA. Dec is
    direct.
    """

    cos_dec = math.cos(math.radians(dec_deg))
    ra_new = (
        ra_deg
        if cos_dec == 0.0
        else ra_deg + (pmra_mas_per_yr / cos_dec) * dt_years / 3_600_000.0
    )
    dec_new = dec_deg + pmdec_mas_per_yr * dt_years / 3_600_000.0
    ra_new = ra_new % 360.0
    return ra_new, dec_new


def radec_to_unit_vector(ra_deg: float, dec_deg: float) -> tuple[float, float, float]:
    """ICRS RA / Dec (deg) -> unit vector in ICRF coords.

    Convention: equatorial right-handed (x = vernal equinox, z = north pole).
    """

    ra_rad = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)
    cos_dec = math.cos(dec_rad)
    return (cos_dec * math.cos(ra_rad), cos_dec * math.sin(ra_rad), math.sin(dec_rad))


@dataclass(frozen=True, slots=True)
class StarRecord:
    hip: int
    ra_deg: float
    dec_deg: float
    vmag: float
    bv: float
    pmra_mas_per_yr: float
    pmdec_mas_per_yr: float


@dataclass(frozen=True, slots=True)
class StarfieldData:
    scene_radius: float
    positions: list[tuple[float, float, float]]
    color_idx: list[int]
    mag_bucket: list[int]


def stars_to_starfield(
    stars: Sequence[StarRecord],
    scene_radius: float = STARFIELD_SCENE_RADIUS,
) -> StarfieldData:
    """Apply PM (J1991.25 -> J2000), B-V -> Kelvin -> palette index, mag bucket."""

    positions: list[tuple[float, float, float]] = []
    color_idx: list[int] = []
    mag_bucket: list[int] = []
    for star in stars:
        ra_j2000, dec_j2000 = apply_proper_motion(
            star.ra_deg, star.dec_deg, star.pmra_mas_per_yr, star.pmdec_mas_per_yr
        )
        ux, uy, uz = radec_to_unit_vector(ra_j2000, dec_j2000)
        positions.append((ux * scene_radius, uy * scene_radius, uz * scene_radius))
        kelvin = bv_to_kelvin(star.bv)
        color_idx.append(palette_index_for_kelvin(kelvin))
        mag_bucket.append(magnitude_to_bucket(star.vmag))
    return StarfieldData(
        scene_radius=scene_radius,
        positions=positions,
        color_idx=color_idx,
        mag_bucket=mag_bucket,
    )


def serialize_starfield_bin(data: StarfieldData) -> bytes:
    """Pack StarfieldData into the wire format (little-endian)."""

    n = len(data.positions)
    if n != len(data.color_idx) or n != len(data.mag_bucket):
        raise ValueError("StarfieldData arrays length mismatch")

    out = bytearray()
    # Header: 4B magic + 4B version + 4B count + 4B scene radius (float32)
    out += STARFIELD_MAGIC
    out += STARFIELD_FORMAT_VERSION.to_bytes(4, "little")
    out += n.to_bytes(4, "little")
    out += struct.pack("<f", data.scene_radius)
    assert len(out) == STARFIELD_HEADER_BYTES

    # Float32 positions
    pos_buf = bytearray(n * 12)
    for i, (x, y, z) in enumerate(data.positions):
        struct.pack_into("<fff", pos_buf, i * 12, x, y, z)
    out += pos_buf

    out += bytes(data.color_idx)
    out += bytes(data.mag_bucket)
    return bytes(out)


def deserialize_starfield_bin(blob: bytes) -> StarfieldData:
    """Inverse of :func:`serialize_starfield_bin` (used by tests + Python tools)."""

    if len(blob) < STARFIELD_HEADER_BYTES:
        raise ValueError(f"Buffer too short for header: {len(blob)} bytes")
    if blob[:4] != STARFIELD_MAGIC:
        raise ValueError(f"Bad magic: {blob[:4]!r}")
    version = int.from_bytes(blob[4:8], "little")
    if version != STARFIELD_FORMAT_VERSION:
        raise ValueError(f"Unsupported version: {version}")
    count = int.from_bytes(blob[8:12], "little")
    (scene_radius,) = struct.unpack_from("<f", blob, 12)

    expected = STARFIELD_HEADER_BYTES + count * 14
    if len(blob) != expected:
        raise ValueError(f"Buffer length mismatch: got {len(blob)}, expected {expected}")

    positions: list[tuple[float, float, float]] = []
    pos_off = STARFIELD_HEADER_BYTES
    for i in range(count):
        x, y, z = struct.unpack_from("<fff", blob, pos_off + i * 12)
        positions.append((x, y, z))
    color_off = pos_off + count * 12
    mag_off = color_off + count
    color_idx = list(blob[color_off : color_off + count])
    mag_bucket = list(blob[mag_off : mag_off + count])
    return StarfieldData(
        scene_radius=scene_radius,
        positions=positions,
        color_idx=color_idx,
        mag_bucket=mag_bucket,
    )


def _cache_dir() -> Path:
    return Path(__file__).resolve().parent.parent.parent / ".cache" / "hipparcos"


HIPPARCOS_CACHE_FILENAME: Final[str] = "hipparcos_main.ecsv"


def _safe_float(value: object, default: float = float("nan")) -> float:
    if value is None:
        return default
    mask_attr = getattr(value, "mask", None)
    if mask_attr is True:
        return default
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            x = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    if math.isnan(x):
        return default
    return x


def download_hipparcos(
    out_dir: Path | None = None,
    *,
    vmag_cutoff: float = DEFAULT_VMAG_CUTOFF,
    force: bool = False,
) -> Path:
    """Download the Hipparcos main catalog (vmag <= cutoff) via VizieR.

    Cached as ECSV (astropy plaintext) under ``tools/python/.cache/hipparcos/``.
    Subsequent calls hit the cache unless ``force=True``.
    """

    out_dir = out_dir or _cache_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_path = out_dir / HIPPARCOS_CACHE_FILENAME
    if cache_path.exists() and not force:
        return cache_path

    from astroquery.vizier import Vizier  # type: ignore[import-untyped]

    vizier = Vizier(
        columns=["HIP", "_RA.icrs", "_DE.icrs", "Vmag", "B-V", "pmRA", "pmDE"],
        catalog="I/239/hip_main",
        row_limit=-1,
    )
    result = vizier.query_constraints(Vmag=f"<{vmag_cutoff:.3f}")
    if not result:
        raise RuntimeError("VizieR returned no Hipparcos rows")
    table = result[0]
    table.write(str(cache_path), format="ascii.ecsv", overwrite=True)
    return cache_path


def load_hipparcos(cache_path: Path) -> list[StarRecord]:
    """Load cached Hipparcos rows into typed :class:`StarRecord` list."""

    from astropy.table import Table  # type: ignore[import-untyped]

    table = Table.read(str(cache_path), format="ascii.ecsv")
    stars: list[StarRecord] = []
    for row in table:
        ra = _safe_float(row["_RA.icrs"])
        dec = _safe_float(row["_DE.icrs"])
        vmag = _safe_float(row["Vmag"])
        if math.isnan(ra) or math.isnan(dec) or math.isnan(vmag):
            continue
        stars.append(
            StarRecord(
                hip=int(row["HIP"]),
                ra_deg=ra,
                dec_deg=dec,
                vmag=vmag,
                bv=_safe_float(row["B-V"]),
                pmra_mas_per_yr=_safe_float(row["pmRA"], default=0.0),
                pmdec_mas_per_yr=_safe_float(row["pmDE"], default=0.0),
            )
        )
    return stars


def filter_by_magnitude(stars: Sequence[StarRecord], vmag_cutoff: float) -> list[StarRecord]:
    return [s for s in stars if not math.isnan(s.vmag) and s.vmag <= vmag_cutoff]


def preprocess(
    out_path: Path,
    *,
    vmag_cutoff: float = DEFAULT_VMAG_CUTOFF,
    cache_dir: Path | None = None,
) -> Path:
    """End-to-end: download -> filter -> apply PM -> serialize bin."""

    cache_path = download_hipparcos(cache_dir, vmag_cutoff=vmag_cutoff)
    stars = filter_by_magnitude(load_hipparcos(cache_path), vmag_cutoff)
    data = stars_to_starfield(stars)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(serialize_starfield_bin(data))
    return out_path


# Named stars used for cross-validation (J2000 ICRS, post-PM expected positions).
# Reference: SIMBAD, Hipparcos main (post-PM applied via apply_proper_motion).
@dataclass(frozen=True, slots=True)
class NamedStarRef:
    name: str
    hip: int
    ra_j2000_deg: float
    dec_j2000_deg: float


NAMED_STAR_REFERENCES: Final[tuple[NamedStarRef, ...]] = (
    NamedStarRef("Sirius", 32349, 101.287155, -16.716116),
    NamedStarRef("Vega", 91262, 279.234735, 38.783689),
    NamedStarRef("Polaris", 11767, 37.954560, 89.264108),
    NamedStarRef("Betelgeuse", 27989, 88.792939, 7.407064),
    NamedStarRef("Arcturus", 69673, 213.915417, 19.182222),
)


def generate_color_temperature_fixture(out_dir: Path | str) -> Path:
    """B-V grid -> Kelvin -> palette index table for TS cross-check."""

    import json

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    bv_grid = [-0.3, -0.1, 0.0, 0.15, 0.3, 0.5, 0.65, 0.8, 1.0, 1.3, 1.6, 2.0]
    rows: list[dict[str, object]] = []
    for bv in bv_grid:
        kelvin = bv_to_kelvin(bv)
        idx = palette_index_for_kelvin(kelvin)
        r, g, b = kelvin_to_rgb_u8(kelvin)
        rows.append(
            {
                "bv": bv,
                "kelvin": kelvin,
                "palette_index": idx,
                "rgb_u8": [r, g, b],
            }
        )

    output: dict[str, object] = {
        "_comment": (
            "B-V -> Kelvin (Ballesteros 2012) -> palette index + RGB 8-bit. "
            "Re-run: orbitarium-tools fixtures --work=5 --out=tests/fixtures/work-05/"
        ),
        "_source": "Ballesteros 2012 + Tanner Helland 2012 piecewise + log-uniform palette.",
        "_palette_size": PALETTE_SIZE,
        "_kelvin_range": [PALETTE_KELVIN_MIN, PALETTE_KELVIN_MAX],
        "samples": rows,
    }
    out_path = out_dir / "color-temperature.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
        f.write("\n")
    return out_path


def generate_starfield_samples_fixture(out_dir: Path | str) -> Path:
    """Named star reference samples (post-PM J2000 ICRS positions + colors).

    Uses :data:`NAMED_STAR_REFERENCES` as ground truth — the actual cached
    Hipparcos rows are read at fixture-gen time so PM application is exercised.
    """

    import json

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cache = _cache_dir() / HIPPARCOS_CACHE_FILENAME
    rows: list[dict[str, object]] = []
    if not cache.exists():
        for ref in NAMED_STAR_REFERENCES:
            rows.append({"name": ref.name, "hip": ref.hip, "skipped": "cache_missing"})
    else:
        stars_by_hip = {s.hip: s for s in load_hipparcos(cache)}
        for ref in NAMED_STAR_REFERENCES:
            star = stars_by_hip.get(ref.hip)
            if star is None:
                rows.append(
                    {
                        "name": ref.name,
                        "hip": ref.hip,
                        "skipped": "missing_in_catalog",
                    }
                )
                continue
            ra_j2000, dec_j2000 = apply_proper_motion(
                star.ra_deg, star.dec_deg, star.pmra_mas_per_yr, star.pmdec_mas_per_yr
            )
            ux, uy, uz = radec_to_unit_vector(ra_j2000, dec_j2000)
            kelvin = bv_to_kelvin(star.bv)
            rows.append(
                {
                    "name": ref.name,
                    "hip": star.hip,
                    "ra_raw_deg": star.ra_deg,
                    "dec_raw_deg": star.dec_deg,
                    "ra_j2000_deg": ra_j2000,
                    "dec_j2000_deg": dec_j2000,
                    "ra_j2000_deg_expected": ref.ra_j2000_deg,
                    "dec_j2000_deg_expected": ref.dec_j2000_deg,
                    "unit_vector": [ux, uy, uz],
                    "vmag": star.vmag,
                    "bv": star.bv,
                    "kelvin": kelvin,
                    "palette_index": palette_index_for_kelvin(kelvin),
                    "mag_bucket": magnitude_to_bucket(star.vmag),
                }
            )

    output: dict[str, object] = {
        "_comment": (
            "Named star post-PM positions + color samples vs published J2000 ICRS values. "
            "If 'skipped' is present, run `orbitarium-tools starfield preprocess` first "
            "to populate the Hipparcos cache."
        ),
        "_tolerance_arcsec": 60.0,
        "samples": rows,
    }
    out_path = out_dir / "starfield-samples.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
        f.write("\n")
    return out_path


def generate_fixtures(out_dir: Path | str) -> tuple[Path, Path]:
    """Generate Work 5 starfield + color-temp fixtures."""

    out_path = Path(out_dir)
    return (
        generate_color_temperature_fixture(out_path),
        generate_starfield_samples_fixture(out_path),
    )
