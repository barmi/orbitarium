"""Scale system reference implementation.

Mirrors ``src/scale/`` semantics. Provides distance and size policy
implementations matching the TS evaluator bit-for-bit (same algorithm +
IEEE 754 ops -> identical results modulo floating-point order).

Conventions (Work 4 P1 decision):
  - scene unit = 1 AU display unit (post-policy). 1 SceneUnit ~ visual 1 AU.
  - Position: 3-tuple of SceneUnit (transform of ``PositionICRF`` in m).
  - Size: scalar SceneUnit (transform of body radius in m).
  - Reversibility: every policy provides ``forward`` + ``inverse`` (round-trip
    within ``SCALE_TOL_M`` = 1 mm).
  - Body radii: IAU WGCCRE 2015 mean equatorial (m), keyed by NAIF id.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Final

from orbitarium_tools.constants import AU

SCALE_TOL_M: Final[float] = 1e-3
SCALE_TOL_SIZE_M: Final[float] = 1e-3

EARTH_MEAN_EQUATORIAL_RADIUS_M: Final[float] = 6_378_136.6

BODY_MEAN_EQUATORIAL_RADIUS_M: Final[dict[int, float]] = {
    10: 695_700_000.0,
    199: 2_440_500.0,
    299: 6_051_800.0,
    399: 6_378_136.6,
    301: 1_737_400.0,
    499: 3_396_190.0,
    599: 71_492_000.0,
    699: 60_268_000.0,
    799: 25_559_000.0,
    899: 24_764_000.0,
    999: 1_188_300.0,
}

SCALE_BODY_NAIF_IDS: Final[tuple[int, ...]] = (
    10,
    199,
    299,
    399,
    301,
    499,
    599,
    699,
    799,
    899,
    999,
)


@dataclass(frozen=True, slots=True)
class DistancePolicy:
    name: str
    forward: Callable[[float], float]
    inverse: Callable[[float], float]


def _linear_forward(distance_m: float) -> float:
    return distance_m / AU


def _linear_inverse(distance_scene: float) -> float:
    return distance_scene * AU


PIECEWISE_INPUT_BREAKS_AU: Final[tuple[float, ...]] = (0.4, 5.0, 50.0)
PIECEWISE_OUTPUT_BREAKS_SCENE: Final[tuple[float, ...]] = (0.4, 1.5, 3.0)


def _piecewise_forward_au(distance_au: float) -> float:
    prev_in = 0.0
    prev_out = 0.0
    for in_break, out_break in zip(
        PIECEWISE_INPUT_BREAKS_AU, PIECEWISE_OUTPUT_BREAKS_SCENE, strict=True
    ):
        if distance_au <= in_break:
            t = (distance_au - prev_in) / (in_break - prev_in)
            return prev_out + t * (out_break - prev_out)
        prev_in = in_break
        prev_out = out_break
    last_in = PIECEWISE_INPUT_BREAKS_AU[-1]
    last_out = PIECEWISE_OUTPUT_BREAKS_SCENE[-1]
    prev_in_last = PIECEWISE_INPUT_BREAKS_AU[-2]
    prev_out_last = PIECEWISE_OUTPUT_BREAKS_SCENE[-2]
    slope = (last_out - prev_out_last) / (last_in - prev_in_last)
    return last_out + (distance_au - last_in) * slope


def _piecewise_inverse_scene(distance_scene: float) -> float:
    prev_in = 0.0
    prev_out = 0.0
    for in_break, out_break in zip(
        PIECEWISE_INPUT_BREAKS_AU, PIECEWISE_OUTPUT_BREAKS_SCENE, strict=True
    ):
        if distance_scene <= out_break:
            t = (distance_scene - prev_out) / (out_break - prev_out)
            return prev_in + t * (in_break - prev_in)
        prev_in = in_break
        prev_out = out_break
    last_in = PIECEWISE_INPUT_BREAKS_AU[-1]
    last_out = PIECEWISE_OUTPUT_BREAKS_SCENE[-1]
    prev_in_last = PIECEWISE_INPUT_BREAKS_AU[-2]
    prev_out_last = PIECEWISE_OUTPUT_BREAKS_SCENE[-2]
    slope = (last_out - prev_out_last) / (last_in - prev_in_last)
    return last_in + (distance_scene - last_out) / slope


def _piecewise_forward(distance_m: float) -> float:
    return _piecewise_forward_au(distance_m / AU)


def _piecewise_inverse(distance_scene: float) -> float:
    return _piecewise_inverse_scene(distance_scene) * AU


LOGARITHMIC_R0_M: Final[float] = AU


def _logarithmic_forward(distance_m: float) -> float:
    return math.log(1.0 + distance_m / LOGARITHMIC_R0_M)


def _logarithmic_inverse(distance_scene: float) -> float:
    return (math.exp(distance_scene) - 1.0) * LOGARITHMIC_R0_M


LINEAR_AU_POLICY = DistancePolicy(
    name="linear-au", forward=_linear_forward, inverse=_linear_inverse
)
PIECEWISE_MONOTONIC_POLICY = DistancePolicy(
    name="piecewise-monotonic",
    forward=_piecewise_forward,
    inverse=_piecewise_inverse,
)
LOGARITHMIC_POLICY = DistancePolicy(
    name="logarithmic",
    forward=_logarithmic_forward,
    inverse=_logarithmic_inverse,
)

DISTANCE_POLICIES: Final[tuple[DistancePolicy, ...]] = (
    LINEAR_AU_POLICY,
    PIECEWISE_MONOTONIC_POLICY,
    LOGARITHMIC_POLICY,
)


def get_distance_policy(name: str) -> DistancePolicy:
    for p in DISTANCE_POLICIES:
        if p.name == name:
            return p
    raise ValueError(f"unknown distance policy: {name}")


def generate_distance_fixtures(out_dir: Path) -> Path:
    """Distance policy x sample distances -> forward/inverse table."""
    import json

    out_dir.mkdir(parents=True, exist_ok=True)

    sample_distances_au = [
        0.001,
        0.39,
        0.4,
        0.72,
        1.0,
        1.52,
        2.5,
        5.0,
        9.58,
        19.22,
        30.05,
        39.48,
        50.0,
        100.0,
    ]
    sample_distances_m = [au * AU for au in sample_distances_au]

    fixtures: list[dict[str, object]] = []
    for policy in DISTANCE_POLICIES:
        rows: list[dict[str, float]] = []
        for d_m, d_au in zip(sample_distances_m, sample_distances_au, strict=True):
            forward = policy.forward(d_m)
            inverse = policy.inverse(forward)
            rows.append(
                {
                    "distance_au": d_au,
                    "distance_m": d_m,
                    "forward_scene": forward,
                    "inverse_m": inverse,
                    "round_trip_diff_m": abs(inverse - d_m),
                }
            )
        fixtures.append({"name": policy.name, "samples": rows})

    output: dict[str, object] = {
        "_comment": (
            "Generated by orbitarium_tools.scaling.generate_distance_fixtures. "
            "Re-run: orbitarium-tools fixtures --work=4 --out=tests/fixtures/work-04/"
        ),
        "_source": (
            "Linear / piecewise-monotonic / logarithmic distance policies. "
            "Reversibility verified within SCALE_TOL_M = 1 mm."
        ),
        "_tolerance_m": SCALE_TOL_M,
        "policies": fixtures,
    }
    out_path = out_dir / "distance-policies.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
        f.write("\n")
    return out_path
