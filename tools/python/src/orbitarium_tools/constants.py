"""Astronomical constants — Python reference for cross-validation against TS.

Values mirror `src/astro/constants.ts` exactly. The TS test suite consumes
golden fixtures generated here; Python tests verify these values against
astropy / ERFA so the TS source of truth stays anchored to standards.
"""

from __future__ import annotations

from typing import Final

# IAU 2012 Resolution B2 — exact integer (m).
AU: Final[int] = 149_597_870_700

# SI defining constant (m/s) — exact integer.
C_LIGHT: Final[int] = 299_792_458

# Light-time across one AU (s). Derived: AU / c.
LIGHT_TIME_AU: Final[float] = AU / C_LIGHT

# Mean obliquity of the ecliptic at J2000.0 (rad), IAU 2006 P03 (ERFA obl06).
EPS_J2000: Final[float] = 0.4090926006005829

# Gravitational parameter GM (m^3/s^2) — DE440 (Park et al. 2021, Table 8).
# Keys must stay aligned with `src/astro/constants.ts::GM`.
GM: Final[dict[str, float]] = {
    # 1.32712440041279419e20 (DE440 publication) rounds to this IEEE 754 double.
    "sun": 1.3271244004127942e20,
    "mercury_bary": 2.203186855e13,
    "venus_bary": 3.24858592e14,
    "earth_moon_bary": 4.03503235502e14,
    "mars_bary": 4.2828375816e13,
    "jupiter_bary": 1.26712764100e17,
    "saturn_bary": 3.79405848418e16,
    "uranus_bary": 5.7945564e15,
    "neptune_bary": 6.83652710058e15,
    "pluto_bary": 9.755e11,
    "earth": 3.986004356e14,
    "moon": 4.902800066e12,
}
