"""Orbitarium tools CLI entry point.

Subcommands are registered as each Work adds modules. This stub exists so the
package is importable and ``orbitarium-tools --help`` / ``orbitarium-tools version``
work from day one (Work 1 smoke test).
"""

from __future__ import annotations

import argparse

from orbitarium_tools import __version__


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="orbitarium-tools",
        description="Python tooling for the Orbitarium solar system simulator.",
    )
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    sub.add_parser("version", help="Show the package version.")
    # Future Works will register subcommands here, e.g.:
    #   work 3 → `horizons`, `de440`
    #   work 12 → `validate`
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "version":
        print(__version__)
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
