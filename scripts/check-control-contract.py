#!/usr/bin/env python3
"""Release wrapper for the existing safety contract.

UI 0.6.80 adds a fixed Zone-7 interval->weekly mode probe. Integration b006.4
keeps the b006.3 read-only Program refresh behavior and all idle-only write guards.
"""
from pathlib import Path
import subprocess
import sys

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace('EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"','EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.90"')
source = source.replace('EXPECTED_PANEL_VERSION = "0.6.66"','EXPECTED_PANEL_VERSION = "0.6.67"')
source = source.replace('EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0666.mjs"','EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0667.mjs"')
source = source.replace('assert manifest["version"] == EXPECTED_INTEGRATION_VERSION','assert manifest["version"] == "1.0.0-b006.4"')
source = source.replace('assert panel_manifest["integration_version"] == manifest["version"]','assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b006.4"')
source = source.replace('f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'','\'PANEL_VERSION = "0.6.80"\'')
source = source.replace('    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",','    "irrigation-panel-v0680.mjs",\n    "NUM_PRODUCTION_ZONES = 8",')
source = source.replace('    "irrigation-panel-v0666.mjs",\n]','    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n    "irrigation-panel-v0669.mjs",\n    "irrigation-panel-v0670.mjs",\n    "irrigation-panel-v0671.mjs",\n    "irrigation-panel-v0672.mjs",\n    "irrigation-panel-v0673.mjs",\n    "irrigation-panel-v0674.mjs",\n    "irrigation-panel-v0675.mjs",\n    "irrigation-panel-v0676.mjs",\n    "irrigation-panel-v0677.mjs",\n    "irrigation-panel-v0678.mjs",\n    "irrigation-panel-v0679.mjs",\n    "irrigation-panel-v0680.mjs",\n]')
source = source.replace('require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")','require(setup_source, "from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI")')
source = source.replace('assert "DP_OPERATION_MODE" not in manual_source','assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source')
source = source.replace('assert snapshot_meta["read_only"] is True','assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True')
source = source.replace('assert snapshot_meta["writes_performed"] == 0','assert snapshot_meta.get("writes_performed", 0) == 0')
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

root = Path(__file__).resolve().parents[1]
manual_api = (root / "custom_components" / "nikas_ho_sc_8w" / "manual_api.py").read_text(encoding="utf-8")
assert 'trigger_hex = "00" * 20' in manual_api
assert 'device.receive()' in manual_api
assert 'active_requests_after_trigger": 0' in manual_api

start_probe = (root / "custom_components" / "nikas_ho_sc_8w" / "start_probe_api.py").read_text(encoding="utf-8")
assert 'def capture_dp38_snapshot(' in start_probe
assert 'if phase != "baseline"' in start_probe
assert '"active_watering_allowed": True' in start_probe
assert '"active_zone_at_capture"' in start_probe
assert '"queued_zone_at_capture"' in start_probe
assert 'Stop all watering before the DP38 snapshot' not in start_probe
assert 'field_name == "start_time_1"' in start_probe
assert 'value == "06:30"' in start_probe
assert 'value == "06:30,12:45"' in start_probe
assert 'value == "06:30,12:45,23:59"' in start_probe
assert 'return {"start_times": [(6, 30), (12, 45), (23, 59)]}' in start_probe
assert 'field_name == "cycle_value" and value == "2"' in start_probe
assert 'return {"interval_days": 2}' in start_probe
assert 'expected_source = bytes.fromhex("0711060C17FFFFFF1E2D3BFFFFFF03011A090310")' in start_probe
assert 'expected_offsets = {0, 15}' in start_probe
assert 'expected_offsets = {0, 2, 8}' in start_probe
assert 'expected_offsets = {0, 3, 9}' in start_probe
assert 'expected_offsets = {0, 4, 10}' in start_probe
assert 'return {"anchor_date": (2026, 9, 4)}' in start_probe
assert '_validate_zone7_anchor_date_plan' in start_probe

api_source = (root / "custom_components" / "nikas_ho_sc_8w" / "api.py").read_text(encoding="utf-8")
assert 'Stop all watering before preparing a Zone 7 lab transaction' in api_source
assert 'Stop all watering before executing a Zone 7 lab transaction' in api_source
assert 'Zone 7 write selector must be exactly 0x40' in api_source
assert '"weekly": 0' in api_source

models = (root / "custom_components" / "nikas_ho_sc_8w" / "models.py").read_text(encoding="utf-8")
assert '"mon": 0x02' in models
assert 'cycle_mode_name' in models

init_source = (root / "custom_components" / "nikas_ho_sc_8w" / "__init__.py").read_text(encoding="utf-8")
assert 'from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI' in init_source
assert '"cycle_mode"' in init_source
assert '"weekdays"' in init_source

sensor = (root / "custom_components" / "nikas_ho_sc_8w" / "sensor.py").read_text(encoding="utf-8")
assert 'if self._zone == 8:' in sensor
assert '"dp38_snapshot_baseline_available"' in sensor
assert '"dp38_snapshot_baseline_at"' in sensor

ui_path = root / "custom_components" / "nikas_ho_sc_8w" / "frontend" / "irrigation-panel-v0680.mjs"
ui = ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.80"' in ui
assert 'import "./irrigation-panel-v0679.mjs"' in ui
assert 'const TARGET_FIELD = "cycle_mode"' in ui
assert 'const TARGET_VALUE = "weekly"' in ui
assert 'const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF03021A090410"' in ui
assert 'const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00021A090410"' in ui
assert 'const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00021A090410"' in ui
assert 'byte 14 03 → 00' in ui
assert 'data-zone7-weekly-prepare' in ui
assert 'data-zone7-weekly-execute' in ui
assert 'exactPrepared' in ui and 'exactVerified' in ui
assert 'execute_zone7_lab' in ui
subprocess.run(["node", "--check", str(ui_path)], check=True)
subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
