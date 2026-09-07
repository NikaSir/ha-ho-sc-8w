#!/usr/bin/env python3
"""Preserve the existing CI entrypoint for the full native manual contract."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name("check-manual-session-contract.py")), run_name="__main__")
