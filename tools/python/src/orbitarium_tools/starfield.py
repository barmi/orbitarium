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
