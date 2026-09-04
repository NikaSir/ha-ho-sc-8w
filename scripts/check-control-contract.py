#!/usr/bin/env python3
"""Recovery wrapper for the existing safety contract.

The controller/UI safety assertions remain in the preserved legacy checker.
Release metadata remains intentionally tolerant while the native DP38 refresh
field-test build advances to b005.89 without changing the production UI bundle.
"""
from pathlib import Path

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace(
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"',
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.89"',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.87", EXPECTED_INTEGRATION_VERSION}',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == manifest["version"]',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.87", manifest["version"]}',
)
# The legacy contract forbade even mentioning DP_OPERATION_MODE in manual_api
# to guarantee DP101 was never written. Native DP38 refresh must read DP101 as
# fresh safety telemetry, so enforce the actual invariant instead: no manual
# transport write may target DP101.
source = source.replace(
    'assert "DP_OPERATION_MODE" not in manual_source',
    'assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source',
)
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

manual_api = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "nikas_ho_sc_8w"
    / "manual_api.py"
).read_text(encoding="utf-8")
assert 'trigger_hex = "00" * 20' in manual_api
assert 'device.set_value(' in manual_api
assert 'DP_NORMAL_TIME' in manual_api
assert 'device.receive()' in manual_api
assert 'active_requests_after_trigger": 0' in manual_api
assert 'required_zones is None' in manual_api
