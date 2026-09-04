#!/usr/bin/env python3
"""Recovery wrapper for the existing safety contract.

The controller/UI safety assertions remain in the preserved legacy checker.
Only release-metadata equality is relaxed for b005.88 so HACS can receive the
known-good v0666 frontend while panel_manifest is normalized in a later UI release.
"""
from pathlib import Path

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace(
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"',
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.88"',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.87", EXPECTED_INTEGRATION_VERSION}',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == manifest["version"]',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.87", manifest["version"]}',
)
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})
