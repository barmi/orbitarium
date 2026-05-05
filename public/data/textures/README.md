# Body Texture Assets

> Solar System Scope CC4 textures for Work 6 celestial bodies. Used by
> `src/bodies/Body.tsx` (P3) and `src/bodies/SaturnRings.tsx` (P4).

## License + Attribution

All textures are licensed **CC BY 4.0** by **Solar System Scope**:

- Source: <https://www.solarsystemscope.com/textures/>
- Author: INOVE / Solar System Scope
- License: <https://creativecommons.org/licenses/by/4.0/>

When redistributing or screenshotting Orbitarium output, attribution per CC4
must remain. The dev demo `/dev/body/<slug>` page links back to this page.

## Files (P3 / P4 가 추가)

| File                | Body                           | Resolution        | Phase |
| ------------------- | ------------------------------ | ----------------- | ----- |
| `sun.jpg`           | Sun (emissive)                 | 2048 × 1024 JPEG  | P3    |
| `sun-halo.png`      | Sun additive halo (radial PNG) | 1024 × 1024 PNG   | P3    |
| `mercury.jpg`       | Mercury                        | 2048 × 1024       | P3    |
| `venus.jpg`         | Venus surface                  | 2048 × 1024       | P3    |
| `earth.jpg`         | Earth (day map)                | 2048 × 1024       | P3    |
| `moon.jpg`          | Earth's Moon                   | 2048 × 1024       | P3    |
| `mars.jpg`          | Mars                           | 2048 × 1024       | P3    |
| `jupiter.jpg`       | Jupiter                        | 2048 × 1024       | P3    |
| `saturn.jpg`        | Saturn                         | 2048 × 1024       | P3    |
| `saturn-rings.png`  | Saturn rings (alpha)           | 1024 × 256 PNG    | P4    |
| `uranus.jpg`        | Uranus                         | 2048 × 1024       | P3    |
| `neptune.jpg`       | Neptune                        | 2048 × 1024       | P3    |
| `pluto.jpg`         | Pluto                          | 1024 × 512        | P3    |
| `io.jpg`            | Io                             | 1024 × 512        | P4    |
| `europa.jpg`        | Europa                         | 1024 × 512        | P4    |
| `ganymede.jpg`      | Ganymede                       | 1024 × 512        | P4    |
| `callisto.jpg`      | Callisto                       | 1024 × 512        | P4    |
| `titan.jpg`         | Titan                          | 1024 × 512        | P4    |

Saturn major moons without published high-quality CC4 textures (Mimas,
Enceladus, Rhea, Iapetus) use a flat fallback color set on the BodyDefinition
(see `src/bodies/catalog.ts` `fallbackColor` field).

## Refresh

To update textures from upstream:

1. Download from <https://www.solarsystemscope.com/textures/>.
2. Resize to the resolutions above (`magick mogrify -resize 2048x1024`).
3. Convert PNG → JPEG (quality 85 for ~150–250 KB per planet).
4. Verify total `public/data/textures/` size stays under ~6 MB.
5. Run `pnpm build` to confirm Vite copies assets.
6. Commit with rationale (which body / why).

## Format conventions

- Equirectangular projection (longitude on X, latitude on Y).
- sRGB color space (TS reads via `texture.colorSpace = SRGBColorSpace`).
- Bodies face +Z = north pole at (0, +1, 0) after IAU rotation matrix applied
  (Work 6 P3 wiring).
- Saturn rings texture: linear gradient outward, alpha encodes ring gaps.
