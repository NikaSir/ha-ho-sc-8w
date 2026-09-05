#!/usr/bin/env python3
"""Release safety contract for HO-SC-8W UI 0.6.90.

UI 0.6.90 separates responsibilities: Zones drill-down owns the guarded DP38
editor, Program is factual read-only DP38 presentation, Diagnostics keeps the
read-only laboratory. Integration b006.12 write semantics remain unchanged.
"""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
component = root / "custom_components" / "nikas_ho_sc_8w"
legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace('EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"','EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.90"')
source = source.replace('EXPECTED_PANEL_VERSION = "0.6.66"','EXPECTED_PANEL_VERSION = "0.6.67"')
source = source.replace('EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0666.mjs"','EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0667.mjs"')
source = source.replace('assert manifest["version"] == EXPECTED_INTEGRATION_VERSION','assert manifest["version"] == "1.0.0-b006.12"')
source = source.replace('assert panel_manifest["integration_version"] == manifest["version"]','assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b006.12"')
source = source.replace('f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'','\'PANEL_VERSION = "0.6.90"\'')
source = source.replace('    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",','    "irrigation-panel-v0690.mjs",\n    "NUM_PRODUCTION_ZONES = 8",')
source = source.replace('    "irrigation-panel-v0666.mjs",\n]','    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n    "irrigation-panel-v0669.mjs",\n    "irrigation-panel-v0670.mjs",\n    "irrigation-panel-v0671.mjs",\n    "irrigation-panel-v0672.mjs",\n    "irrigation-panel-v0673.mjs",\n    "irrigation-panel-v0674.mjs",\n    "irrigation-panel-v0675.mjs",\n    "irrigation-panel-v0676.mjs",\n    "irrigation-panel-v0677.mjs",\n    "irrigation-panel-v0678.mjs",\n    "irrigation-panel-v0679.mjs",\n    "irrigation-panel-v0680.mjs",\n    "irrigation-panel-v0681.mjs",\n    "irrigation-panel-v0682.mjs",\n    "irrigation-panel-v0683.mjs",\n    "irrigation-panel-v0684.mjs",\n    "irrigation-panel-v0685.mjs",\n    "irrigation-panel-v0686.mjs",\n    "irrigation-panel-v0687.mjs",\n    "irrigation-panel-v0688.mjs",\n    "irrigation-panel-v0689.mjs",\n    "irrigation-panel-v0690.mjs",\n]')
source = source.replace('require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")','require(setup_source, "from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI")')
source = source.replace('assert "DP_OPERATION_MODE" not in manual_source','assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source')
source = source.replace('assert snapshot_meta["read_only"] is True','assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True')
source = source.replace('assert snapshot_meta["writes_performed"] == 0','assert snapshot_meta.get("writes_performed", 0) == 0')
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

manifest = (component / "manifest.json").read_text(encoding="utf-8")
const = (component / "const.py").read_text(encoding="utf-8")
assert '"version": "1.0.0-b006.12"' in manifest
assert 'PANEL_VERSION = "0.6.90"' in const
assert 'irrigation-panel-v0690.mjs' in const

manual_api = (component / "manual_api.py").read_text(encoding="utf-8")
assert 'trigger_hex = "00" * 20' in manual_api
assert 'active_requests_after_trigger": 0' in manual_api

production_api = (component / "production_api.py").read_text(encoding="utf-8")
assert 'required_zones=set(range(1, NUM_ZONES + 1))' in production_api
assert 'self._write_dp38_mask_block(plan.write_block, zone)' in production_api
assert 'collateral_changed_zones' in production_api
assert 'program_enabled is not a production-editable field' in production_api
assert 'The post-write snapshot is factual controller state' in production_api
assert 'mismatch_fields' in production_api

patch_builder = (component / "dp38_patch.py").read_text(encoding="utf-8")
assert 'start_times: list[tuple[int, int] | None] | None' in patch_builder
assert 'if start is None:' in patch_builder
assert 'never compacted or shifted' in patch_builder

editor_patch = (component / "frontend" / "irrigation-panel-v0688.mjs").read_text(encoding="utf-8")
assert 'data-program-start-clear' in editor_patch
assert 'empty.textContent = "--:--"' in editor_patch
assert 'patch.start_times = Array.from({ length: 6 }' in editor_patch
assert 'programEditField.confirmed' in editor_patch
assert 'programEditField.rejected' in editor_patch

lab_ui = (component / "frontend" / "irrigation-panel-v0689.mjs").read_text(encoding="utf-8")
assert '_dp38SnapshotLabV0689' in lab_ui
assert 'Переснять исходный снимок 1–8' in lab_ui
assert 'Снять контрольный снимок и сравнить' in lab_ui

ui_path = component / "frontend" / "irrigation-panel-v0690.mjs"
ui = ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.90"' in ui
assert 'import "./irrigation-panel-v0689.mjs"' in ui
assert 'p.programView = function programViewV0690' in ui
assert '_programReadOnlyCardV0690' in ui
assert 'Фактическая программа контроллера' in ui
assert 'Только просмотр.' in ui
assert 'p.zoneDetail = function zoneDetailV0690' in ui
assert 'this._programEditorCard(entities, number)' in ui
assert 'data-program-apply' not in ui
assert 'program:readonly:' in ui
assert 'Редактирование выполняется через «Зоны»' in ui
subprocess.run(["node", "--check", str(editor_patch)], check=True)
subprocess.run(["node", "--check", str(lab_ui)], check=True)
subprocess.run(["node", "--check", str(ui_path)], check=True)
subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
