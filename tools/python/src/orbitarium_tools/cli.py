"""Orbitarium tools CLI entry point.

Subcommands:
  - ``version``                Show package version.
  - ``fixtures --work=N --out=DIR``    Generate golden fixtures for a given Work.
  - ``de440 preprocess --start=JD --end=JD --out=DIR``
                               Crop the DE440 SPK kernel to a JD range and
                               serialise per-segment Chebyshev binaries plus a
                               manifest, ready for browser consumption.

Each Work registers its fixtures under a Work number; missing Works fall through
with a non-zero exit.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from orbitarium_tools import __version__


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="orbitarium-tools",
        description="Python tooling for the Orbitarium solar system simulator.",
    )
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    sub.add_parser("version", help="Show the package version.")

    p_fix = sub.add_parser(
        "fixtures",
        help="Generate golden fixtures for a given Work.",
    )
    p_fix.add_argument("--work", type=int, required=True, help="Work number (e.g. 2).")
    p_fix.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output directory (e.g. tests/fixtures/work-02/).",
    )

    p_hz = sub.add_parser(
        "horizons",
        help="Query JPL Horizons for an SSB-centered state vector.",
    )
    p_hz.add_argument(
        "--body",
        type=str,
        required=True,
        help="NAIF id or major-body name (e.g. 399, mars, 'Earth').",
    )
    p_hz.add_argument(
        "--jd-tdb",
        type=float,
        required=True,
        help="Julian Date in TDB scale (e.g. 2451545.0 for J2000).",
    )

    p_de = sub.add_parser(
        "de440",
        help="DE440 SPK kernel utilities.",
    )
    de_sub = p_de.add_subparsers(dest="de_command", metavar="<de440-command>")
    p_pre = de_sub.add_parser(
        "preprocess",
        help="Crop DE440 to a JD range and write Chebyshev binaries + manifest.",
    )
    p_pre.add_argument(
        "--start",
        type=float,
        required=True,
        help="Start Julian Date in TDB (e.g. 2415020.5 for 1900-01-01).",
    )
    p_pre.add_argument(
        "--end",
        type=float,
        required=True,
        help="End Julian Date in TDB (e.g. 2506717.5 for 2150-12-31).",
    )
    p_pre.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output directory (e.g. public/data/de440/).",
    )
    p_pre.add_argument(
        "--spk",
        type=Path,
        default=None,
        help="Path to DE440 SPK; if missing, downloaded into a default cache.",
    )

    p_sf = sub.add_parser(
        "starfield",
        help="Hipparcos starfield utilities.",
    )
    sf_sub = p_sf.add_subparsers(dest="sf_command", metavar="<starfield-command>")
    p_sf_pre = sf_sub.add_parser(
        "preprocess",
        help="Download Hipparcos and serialize a starfield binary for the browser.",
    )
    p_sf_pre.add_argument(
        "--catalog",
        type=str,
        default="hipparcos",
        choices=["hipparcos"],
        help="Source catalog (Tycho-2 deferred to Work 11).",
    )
    p_sf_pre.add_argument(
        "--vmag",
        type=float,
        default=6.0,
        help="Visual magnitude cutoff (default 6.0 ~ 9 100 stars).",
    )
    p_sf_pre.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output bin path (e.g. public/data/starfield/hipparcos-vmag6.bin).",
    )
    return parser


def _run_fixtures(args: argparse.Namespace) -> int:
    if args.work == 2:
        from orbitarium_tools.frames import generate_fixtures as gen_frames
        from orbitarium_tools.rotation import generate_fixtures as gen_rotation
        from orbitarium_tools.time import generate_fixtures as gen_time

        for out_file in (gen_time(args.out), gen_frames(args.out), gen_rotation(args.out)):
            print(f"Generated {out_file}")
        return 0
    if args.work == 3:
        from orbitarium_tools.de440 import generate_fixtures as gen_de440
        from orbitarium_tools.horizons import generate_fixtures as gen_horizons

        print(f"Generated {gen_de440(args.out)}")
        print(f"Generated {gen_horizons(args.out)}")
        return 0
    if args.work == 4:
        from orbitarium_tools.scaling import generate_fixtures as gen_scaling

        for out_file in gen_scaling(args.out):
            print(f"Generated {out_file}")
        return 0
    if args.work == 5:
        from orbitarium_tools.render_anchors import generate_anchor_fixtures
        from orbitarium_tools.starfield import generate_fixtures as gen_starfield

        print(f"Generated {generate_anchor_fixtures(args.out)}")
        for out_file in gen_starfield(args.out):
            print(f"Generated {out_file}")
        return 0
    if args.work == 6:
        from orbitarium_tools.bodies import generate_fixtures as gen_bodies

        for out_file in gen_bodies(args.out):
            print(f"Generated {out_file}")
        return 0
    if args.work == 7:
        from orbitarium_tools.orbits import generate_fixtures as gen_orbits

        for path in gen_orbits(args.out):
            print(f"Generated {path}")
        return 0
    print(f"Work {args.work} fixtures not implemented", file=sys.stderr)
    return 1


def _run_horizons(args: argparse.Namespace) -> int:
    from orbitarium_tools.horizons import cli_describe, query_state

    body_arg: str = args.body
    try:
        naif_id = int(body_arg)
    except ValueError:
        # Map common name to NAIF id via the catalog
        from orbitarium_tools.naif import NAIF_CATALOG

        normalized = body_arg.lower().replace(" ", "_")
        entry = next(
            (NAIF_CATALOG[k] for k in NAIF_CATALOG if k == normalized),
            None,
        )
        if entry is None:
            print(f"Unknown body: {body_arg}", file=sys.stderr)
            return 2
        naif_id = entry.id
    result = query_state(naif_id, args.jd_tdb)
    print(cli_describe(result))
    return 0


def _run_starfield(args: argparse.Namespace) -> int:
    if args.sf_command == "preprocess":
        from orbitarium_tools.starfield import preprocess

        out_path = preprocess(args.out, vmag_cutoff=args.vmag)
        print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")
        return 0
    print("usage: orbitarium-tools starfield preprocess ...", file=sys.stderr)
    return 1


def _run_de440(args: argparse.Namespace) -> int:
    if args.de_command == "preprocess":
        from orbitarium_tools.de440 import download_de440_kernel, preprocess

        spk_path = args.spk
        if spk_path is None:
            cache_dir = Path(__file__).resolve().parent.parent.parent / ".cache" / "de440"
            spk_path = cache_dir / "de440.bsp"
            spk_path = download_de440_kernel(spk_path)

        manifest = preprocess(
            spk_path=spk_path,
            out_dir=args.out,
            jd_start=args.start,
            jd_end=args.end,
        )
        segments = manifest["segments"]
        assert isinstance(segments, list)
        print(f"Wrote {len(segments)} segments to {args.out}")
        return 0
    print("usage: orbitarium-tools de440 preprocess ...", file=sys.stderr)
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "version":
        print(__version__)
        return 0
    if args.command == "fixtures":
        return _run_fixtures(args)
    if args.command == "horizons":
        return _run_horizons(args)
    if args.command == "de440":
        return _run_de440(args)
    if args.command == "starfield":
        return _run_starfield(args)

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
