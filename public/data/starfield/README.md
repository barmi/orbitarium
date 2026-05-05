# Starfield Binary Data

> Hipparcos catalog → 브라우저용 바이너리. Work 5 P4 산출물.

## 파일

- `hipparcos-vmag6.bin` (~70 KB, 4 992 stars × 14 B + 16 B header)

## 재생성

```bash
pnpm starfield:preprocess
```

내부 동작:

1. VizieR (Hipparcos main, `I/239/hip_main`) 에서 `Vmag <= 6.0` 조건으로 catalog 다운로드.
2. `tools/python/.cache/hipparcos/hipparcos_main.ecsv` 에 캐시 (gitignore).
3. position / Vmag NaN row 제거 → `StarRecord` 변환.
4. PM 적용 (J1991.25 → J2000, 8.75 yr).
5. RA/Dec → ICRF unit vector × `STARFIELD_SCENE_RADIUS = 1e9` scene unit.
6. B-V → Kelvin (Ballesteros 2012) → 256-entry palette index.
7. Vmag → 256-bucket linear ([-2, 8]).
8. `serialize_starfield_bin` → little-endian binary.

## 바이너리 포맷 (little-endian)

| Offset (byte) | 길이 | 타입 | 의미 |
| ------------- | ---- | ---- | ---- |
| 0  | 4 | char[4] | magic `b"STRF"` |
| 4  | 4 | uint32  | format version (현재 1) |
| 8  | 4 | uint32  | star count `N` |
| 12 | 4 | float32 | scene radius (1e9) |
| 16 | 12 × N | float32[3] | position `[x, y, z]` (scene unit) |
| 16 + 12N | N | uint8 | color palette index 0..255 |
| 16 + 13N | N | uint8 | magnitude bucket 0..255 |

총 길이: `16 + 14 × N` bytes.

## 디코더

- TS: `decodeStarfieldBin(buffer)` in `src/render/starfield.ts`
- TS loader: `loadStarfieldFromUrl(url)` in `src/render/starfieldLoader.ts`
- Python: `deserialize_starfield_bin(blob)` in `tools/python/src/orbitarium_tools/starfield.py`

## 팔레트 / mag bucket 매핑

- Palette: 256 entries, log-uniform in Kelvin range `[2000, 30000]`. RGBA u8.
  - sRGB-encoded (Tanner Helland 2012). GPU sampler 가 sRGB → linear-RGB 자동 변환.
- Mag bucket: linear in Vmag `[-2, 8]`. 작은 값 = 밝은 별 (size 큼 + alpha 진함).

상세 결정은 [`docs/plan/work-05-render.md`](../../../docs/plan/work-05-render.md) §3 P4 +
[`docs/plan/work-05-render-handoff.md`](../../../docs/plan/work-05-render-handoff.md) #19~#20 / #30~#37
참조.

## 캐시 / git 정책

- VizieR 응답 캐시: `tools/python/.cache/hipparcos/` (gitignore).
- bin 파일: 작아서 (`~70 KB`) commit 함 — CI / reviewer 가 다운로드 없이 reproducible.
- bin 갱신은 의도적 결정. handoff 결정 로그에 먼저 기록 후 `pnpm starfield:preprocess` 재실행.
