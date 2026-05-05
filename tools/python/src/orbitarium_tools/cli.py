"""Orbitarium tools CLI entry point.

Subcommands:
  - ``version``        Show package version.
  - ``fixtures``       Generate golden fixtures for a given Work
                       (e.g. ``orbitarium-tools fixtures --work=2 --out=tests/fixtures/work-02/``).

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
    p_fix.add_argument(
        "--work", type=int, required=True, help="Work number (e.g. 2)."
    )
    p_fix.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output directory (e.g. tests/fixtures/work-02/).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "version":
        print(__version__)
        return 0

    if args.command == "fixtures":
        if args.work == 2:
            from orbitarium_tools.time import generate_fixtures

            out_file = generate_fixtures(args.out)
            print(f"Generated {out_file}")
            return 0
        print(f"Work {args.work} fixtures not implemented", file=sys.stderr)
        return 1

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
