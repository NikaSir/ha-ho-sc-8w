#!/usr/bin/env python3
"""Release wrapper for the existing safety contract.

UI 0.6.84 adds the guarded reverse Zone-7 program disabled->enabled byte-19
probe. Integration b006.8 keeps every preceding write guard and uses a small
runtime extension that accepts only the exact confirmed disabled source state.
"""
from pathlib import Path
import subprocess
import sys

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace('EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"','EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.90"')
source = source.replace('EXPECTED_PANEL_VERSION = "0.6.66"','EXPECTED_PANEL_VERSION = "0.6.67"')
source = source.replace('EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0666.mjs"','EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0667.mjs"')
source = source.replace('assert manifest["version"] == EXPECTED_INTEGRATION_VERSION','assert manifest["version"] == "1.0.0-b006.8"')
source = source.replace('assert panel_manifest["integration_version"] == manifest["version"]','assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b006.8"')
source = source.replace('f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'','\'PANEL_VERSION = "0.6.84"\'')
source = source.replace('    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",','    "irrigation-panel-v0684.mjs",\n    "NUM_PRODUCTION_ZONES = 8",')
source = source.replace('    "irrigation-panel-v0666.mjs",\n]','    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n    "irrigation-panel-v0669.mjs",\n    "irrigation-panel-v0670.mjs",\n    "irrigation-panel-v0671.mjs",\n    "irrigation-panel-v0672.mjs",\n    "irrigation-panel-v0673.mjs",\n    "irrigation-panel-v0674.mjs",\n    "irrigation-panel-v0675.mjs",\n    "irrigation-panel-v0676.mjs",\n    "irrigation-panel-v0677.mjs",\n    "irrigation-panel-v0678.mjs",\n    "irrigation-panel-v0679.mjs",\n    "irrigation-panel-v0680.mjs",\n    "irrigation-panel-v0681.mjs",\n    "irrigation-panel-v0682.mjs",\n    "irrigation-panel-v0683.mjs",\n    "irrigation-panel-v0684.mjs",\n]')
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
assert 'return {"anchor_date": (2026, 9, 4)}' in start_probe
assert '_validate_zone7_anchor_date_plan' in start_probe
assert 'field_name == "weekdays"' in start_probe
assert 'value == "tue"' in start_probe
assert 'value == "tue,thu"' in start_probe
assert 'return {"cycle_mode": 0, "weekdays": ["tue"]}' in start_probe
assert 'return {"cycle_mode": 0, "weekdays": ["tue", "thu"]}' in start_probe
assert '_validate_zone7_weekday_plan' in start_probe
assert '0711060C17FFFFFF1E2D3BFFFFFF00041A090410' in start_probe
assert 'expected_value = 0x14' in start_probe
assert 'expected_diff = [(0, "07", "40"), (15, "04", "14")]' in start_probe
assert 'field_name == "program_enabled"' in start_probe
assert 'value != "false"' in start_probe
assert 'return {"program_enabled": False}' in start_probe
assert '_validate_zone7_program_enabled_plan' in start_probe
assert '0711060C17FFFFFF1E2D3BFFFFFF00141A090410' in start_probe
assert 'expected[19] = 0x00' in start_probe
assert 'changes != [(0, "07", "40"), (19, "10", "00")]' in start_probe

patch_source = (root / "custom_components" / "nikas_ho_sc_8w" / "program_enable_probe_patch.py").read_text(encoding="utf-8")
assert 'value == "true"' in patch_source
assert 'return {"program_enabled": True}' in patch_source
assert '0711060C17FFFFFF1E2D3BFFFFFF00141A090400' in patch_source
assert 'expected[19] = 0x10' in patch_source
assert 'changes != [(0, "07", "40"), (19, "00", "10")]' in patch_source
assert 'StartProbeHOSC8WAPI._zone7_lab_patch_kwargs = staticmethod' in patch_source
assert 'StartProbeHOSC8WAPI._validate_zone7_program_enabled_plan = staticmethod' in patch_source

api_source = (root / "custom_components" / "nikas_ho_sc_8w" / "api.py").read_text(encoding="utf-8")
assert 'Stop all watering before preparing a Zone 7 lab transaction' in api_source
assert 'Stop all watering before executing a Zone 7 lab transaction' in api_source
assert 'Zone 7 write selector must be exactly 0x40' in api_source
assert '"weekly": 0' in api_source

models = (root / "custom_components" / "nikas_ho_sc_8w" / "models.py").read_text(encoding="utf-8")
assert '"mon": 0x02' in models
assert '"tue": 0x04' in models
assert '"thu": 0x10' in models
assert 'dp38_program_enabled' in models
assert 'cycle_mode_name' in models

init_source = (root / "custom_components" / "nikas_ho_sc_8w" / "__init__.py").read_text(encoding="utf-8")
assert 'from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI' in init_source
assert '"cycle_mode"' in init_source
assert '"weekdays"' in init_source
assert '"program_enabled"' in init_source

frontend_source = (root / "custom_components" / "nikas_ho_sc_8w" / "frontend.py").read_text(encoding="utf-8")
assert 'from .program_enable_probe_patch import apply_patch as _apply_program_enable_probe_patch' in frontend_source
assert '_apply_program_enable_probe_patch()' in frontend_source

sensor = (root / "custom_components" / "nikas_ho_sc_8w" / "sensor.py").read_text(encoding="utf-8")
assert 'if self._zone == 8:' in sensor
assert '"dp38_snapshot_baseline_available"' in sensor
assert '"dp38_snapshot_baseline_at"' in sensor

ui_path = root / "custom_components" / "nikas_ho_sc_8w" / "frontend" / "irrigation-panel-v0684.mjs"
ui = ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.84"' in ui
assert 'import "./irrigation-panel-v0683.mjs"' in ui
assert 'const TARGET_FIELD = "program_enabled"' in ui
assert 'const TARGET_VALUE = "true"' in ui
assert 'const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF00141A090400"' in ui
assert 'const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00141A090410"' in ui
assert 'const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00141A090410"' in ui
assert 'byte 19 00 → 10' in ui
assert 'data-zone7-program-on-prepare' in ui
assert 'data-zone7-program-on-execute' in ui
assert 'exactPrepared' in ui and 'exactVerified' in ui
assert 'execute_zone7_lab' in ui
subprocess.run(["node", "--check", str(ui_path)], check=True)
subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
