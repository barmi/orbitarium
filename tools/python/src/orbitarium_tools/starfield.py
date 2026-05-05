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
