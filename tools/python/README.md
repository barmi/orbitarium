# orbitarium-tools

Python tooling for the [Orbitarium](../../) solar system simulator.

**Purpose** — provide an authoritative reference for time/coordinate/ephemeris
computations against which the TypeScript implementation is cross-checked,
plus build-time data preprocessing utilities.

See [`docs/plan/overview.md`](../../docs/plan/overview.md) §4.2 and §8 for the
full strategy.

## Roles

1. **Reference Implementation** — astropy / spiceypy / astroquery results are
   the "ground truth"; TS code must match within a documented tolerance.
2. **Golden Value Generation** — fixtures (JSON/CSV) consumed by the JS/TS
   regression tests.
3. **Data Preprocessing** — DE440 SPK kernels → browser-friendly chunks,
   star catalog → binary attribute buffers, etc.
4. **CLI / Notebooks** — quick lookups and exploratory analysis.

## Quick start

```bash
cd tools/python

# Editable install with desired extras (uv or pip)
pip install -e ".[astro,viz]"        # most common combo
# or everything:
pip install -e ".[all]"

orbitarium-tools --help
orbitarium-tools version
pytest                                # smoke test
```

## Extras

| Group      | Packages                                  | Used by             |
|------------|-------------------------------------------|---------------------|
| `astro`    | astropy, astroquery, spiceypy             | Work 2, 3, 6, 8     |
| `viz`      | matplotlib, scipy                         | Work 4, 9, 11       |
| `notebook` | jupyter, ipykernel                        | exploration         |
| `dev`      | pytest, ruff, mypy                        | always              |
| `all`      | all of the above                          | full local setup    |

## Layout

```
tools/python/
├── pyproject.toml
├── README.md
├── src/orbitarium_tools/    # package modules — added during their respective Works
│   ├── __init__.py
│   └── cli.py               # `orbitarium-tools` entry point
├── notebooks/               # exploratory Jupyter notebooks
└── tests/                   # pytest suite (golden value verification)
```

### Module growth plan

Modules are added in the Work that needs them (no premature scaffolding):

| Work | Modules                                     |
|------|---------------------------------------------|
| 2    | `time.py`, `frames.py`                      |
| 3    | `horizons.py`, `de440.py`                   |
| 4    | `scaling.py`                                |
| 5    | `starfield.py`                              |
| 6    | `rotation.py`                               |
| 7    | `orbits.py`                                 |
| 8    | `events.py`                                 |
| 11   | `bench.py`                                  |
| 12   | `validate.py` (top-level reporter)          |

## Conventions

- Type hints required; checked with `mypy --strict`.
- Public functions accept SI units (seconds, meters, radians) unless documented otherwise.
- Time inputs accept `astropy.time.Time` or ISO strings; outputs document scale (UTC/TDB/TT).
- Frame inputs/outputs document the reference frame (ICRF, ecliptic-J2000, body-fixed-…).
- Each module exposes a `generate_fixtures(out_dir)` function for golden value emission.
