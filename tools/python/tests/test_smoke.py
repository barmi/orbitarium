"""Smoke tests — verify the package installs, imports, and runs.

These are intentionally tiny. Real reference / golden-value tests arrive
per-Work (Work 2 onward) in dedicated modules.
"""

from __future__ import annotations

import subprocess
import sys

import orbitarium_tools


def test_version_attribute() -> None:
    assert orbitarium_tools.__version__ == "0.1.0"


def test_cli_version_subcommand() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "orbitarium_tools.cli", "version"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "0.1.0"
    assert result.returncode == 0


def test_cli_help_runs_without_command() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "orbitarium_tools.cli"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert "orbitarium-tools" in result.stdout.lower()
    assert "version" in result.stdout
