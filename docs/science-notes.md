# Orbitarium — Science Notes

> Sources, models, and accuracy estimates (Work 12).

## Coordinate Frames

- **ICRF / J2000** — primary inertial frame (Work 2).
- **EME2000 / Ecliptic J2000** — derived via fixed rotation matrices.
- **Body-fixed** — IAU WGCCRE 2015 rotation matrix per body (Work 6).

## Time Systems

- **UTC ↔ TAI ↔ TT ↔ TDB ↔ JD** — Work 2. UTC for display, TDB for ephemeris
  evaluation.
- ERFA via astropy in Python; pure-TS implementation cross-checked to ≤ 100 µs
  for TDB (Work 2 fixtures).

## Ephemeris Source

- **JPL DE440 / DE441** — Chebyshev-coefficient polynomial evaluation (Work 3).
- Cached SPK kernels are preprocessed into per-segment binary chunks via
  `pnpm de440:preprocess`.
- Browser-side evaluator matches `spiceypy.spkez` to nm / mm precision (Work 3
  fixtures).

## Body Catalog (Work 6)

Sun + 8 planets + Pluto + Earth's Moon + 4 Galilean + 5 Saturn major = 20
entries. Charon (NAIF 901) is deferred (Work 2 NAIF_CATALOG extension required).

Mean equatorial radii: IAU WGCCRE 2015 (Archinal et al. 2018), mirroring NAIF
`pck00011.tpc`.

## IAU Rotation Models (Work 6 P2)

11 polynomial-only models (Sun + 8 planets + Moon + Pluto). Mercury libration,
Moon nutation, and Neptune's periodic N term are **omitted** — adding them is
a Work 11 polish item. Polynomial-only diffs vs full SPICE pxform are at
machine precision (~1e-12) for the embedded model; the full-model accuracy
gap is body-specific (~mas to arcsec for Mercury / Moon).

## Starfield (Work 5 P4)

- **Hipparcos main catalog**, Vmag ≤ 6.0 → ~5 000 stars after NaN row drop.
- **Color temperature** via Ballesteros 2012 (B-V → K) → **Tanner Helland 2012**
  (K → 8-bit sRGB).
- **Proper motion** applied from J1991.25 → J2000 (validated against published
  positions to ~60″ for named stars; full mas-precision needs nutation /
  parallax depth — Work 11 candidates).
- **Tycho-2** (~2.5 M stars) is deferred to Work 11 + LOD / instancing.

## Scaling Policies (Work 4)

- **Distance**: `linear-au`, `piecewise-monotonic` (default), `logarithmic`.
- **Size**: `uniform`, `logarithmic-magnification` (default), `minmax-clamp`.
- **Adaptive scale** lerp interface (camera-zoom-driven) defined; main-app
  wiring is Work 9 / 10.
- All policies guarantee 1 mm round-trip up to 30 AU (IEEE 754 LSB floor).

## Renderer Pipeline (Work 5)

- **HDR linear-space** internal lighting → ACES Filmic tone mapping → sRGB
  output. Float framebuffer is Work 11.
- **Logarithmic depth buffer** (WebGL 2 + `EXT_frag_depth`) — handles
  1e-3 ~ 1e10 scene-unit span without z-fighting.
- Scene anchors: SSB (default), heliocentric, body-centric.

## Textures (Work 6 P1 / P3 / P4)

- **Solar System Scope CC4** — recommended source.
- Each body has a `fallbackColor` so missing textures degrade gracefully.
- Real asset commit is intentionally deferred (separate cleanup task) — see
  [`public/data/textures/README.md`](../public/data/textures/README.md).

## Validation

- **DE440 ↔ JPL Horizons** matrix (Work 12 P1) — `orbitarium-tools fixtures
  --work=12` produces a synthetic placeholder. Real network calls are
  exercised by `orbitarium-tools horizons --body=399 --jd-tdb=...`.
- Per-body cross-validation tolerances are documented in each work's
  conventions file (e.g. `astro-conventions.md`, `ephemeris-conventions.md`).

## Known Caveats

- Hipparcos epoch correction uses simple linear PM; full nutation / aberration
  is Work 11.
- Atmospheric scattering, planet shadows on Saturn rings, Sun corona, eclipse
  geometry — all deferred to Work 11 polish.
- Asteroid belt is **synthetic** (Mulberry32 PRNG) — real MPC catalog is
  Work 11.
- Camera follow / orbit interactive controls (mouse / touch / keyboard) are
  Work 10/11. Work 9 only supplies the state model + presets + transition.

## License Attribution

- DE440 / DE441 ephemeris — public domain (NASA/JPL).
- Hipparcos / Tycho-2 catalogs — VizieR (public, citation requested).
- IAU WGCCRE 2015 (Archinal et al. 2018) — public, citation:
  Archinal et al., *Celest. Mech. Dyn. Astron.* (2018) 130:22.
- Solar System Scope textures — CC BY 4.0 (INOVE / Solar System Scope).
