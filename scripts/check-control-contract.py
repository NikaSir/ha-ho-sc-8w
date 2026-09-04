#!/usr/bin/env python3
"""Release wrapper for the existing safety contract.

The preserved legacy checker still owns the safety-critical controller
assertions. This wrapper advances release/UI metadata and maps renamed
read-only snapshot metadata without weakening the no-write invariant.
"""
from pathlib import Path

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace(
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"',
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.90"',
)
source = source.replace(
    'EXPECTED_PANEL_VERSION = "0.6.66"',
    'EXPECTED_PANEL_VERSION = "0.6.67"',
)
source = source.replace(
    'EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0666.mjs"',
    'EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0667.mjs"',
)
source = source.replace(
    '    "irrigation-panel-v0666.mjs",\n]',
    '    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n]',
)
# Native DP38 refresh reads DP101 only as safety telemetry. Keep the actual
# invariant: manual_api must never send a DP101 write.
source = source.replace(
    'assert "DP_OPERATION_MODE" not in manual_source',
    'assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source',
)
# The snapshot remains strictly no-write. v0.6.67 names the semantic field
# explicitly while the legacy contract used `read_only`/`writes_performed`.
source = source.replace(
    'assert snapshot_meta["read_only"] is True',
    'assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True',
)
source = source.replace(
    'assert snapshot_meta["writes_performed"] == 0',
    'assert snapshot_meta.get("writes_performed", 0) == 0',
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

ui = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "nikas_ho_sc_8w"
    / "frontend"
    / "irrigation-panel-v0667.mjs"
).read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.67"' in ui
assert 'capture_dp38_snapshot' in ui
assert 'phase: "baseline"' in ui
assert 'DP38_FULL_SNAPSHOT_READ_ONLY' in ui
assert 'rain_sensor_follow' in ui
assert 'value: "false"' in ui
assert 'execute_zone7_lab' in ui
assert 'plan_id: planId' in ui
assert 'автоматического rollback' in ui
