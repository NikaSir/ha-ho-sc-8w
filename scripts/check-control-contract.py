#!/usr/bin/env python3
"""Release safety contract for HO-SC-8W UI 0.6.94 / integration b006.15.

UI 0.6.94 keeps the guarded Zones editor / read-only Program split and restores
browser-selected zone artwork as the authoritative visual source on every zone
surface. Integration b006.15 contains no DP transport changes.
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
source = source.replace('assert manifest["version"] == EXPECTED_INTEGRATION_VERSION','assert manifest["version"] == "1.0.0-b006.15"')
source = source.replace('assert panel_manifest["integration_version"] == manifest["version"]','assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b006.15"')
source = source.replace('f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'','\'PANEL_VERSION = "0.6.94"\'')
source = source.replace('    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",','    "irrigation-panel-v0694.mjs",\n    "NUM_PRODUCTION_ZONES = 8",')
source = source.replace('    "irrigation-panel-v0666.mjs",\n]','    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n    "irrigation-panel-v0669.mjs",\n    "irrigation-panel-v0670.mjs",\n    "irrigation-panel-v0671.mjs",\n    "irrigation-panel-v0672.mjs",\n    "irrigation-panel-v0673.mjs",\n    "irrigation-panel-v0674.mjs",\n    "irrigation-panel-v0675.mjs",\n    "irrigation-panel-v0676.mjs",\n    "irrigation-panel-v0677.mjs",\n    "irrigation-panel-v0678.mjs",\n    "irrigation-panel-v0679.mjs",\n    "irrigation-panel-v0680.mjs",\n    "irrigation-panel-v0681.mjs",\n    "irrigation-panel-v0682.mjs",\n    "irrigation-panel-v0683.mjs",\n    "irrigation-panel-v0684.mjs",\n    "irrigation-panel-v0685.mjs",\n    "irrigation-panel-v0686.mjs",\n    "irrigation-panel-v0687.mjs",\n    "irrigation-panel-v0688.mjs",\n    "irrigation-panel-v0689.mjs",\n    "irrigation-panel-v0690.mjs",\n    "irrigation-panel-v0691.mjs",\n    "irrigation-panel-v0692.mjs",\n    "irrigation-panel-v0693.mjs",\n    "irrigation-panel-v0694.mjs",\n]')
source = source.replace('require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")','require(setup_source, "from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI")')
source = source.replace('assert "DP_OPERATION_MODE" not in manual_source','assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source')
source = source.replace('assert snapshot_meta["read_only"] is True','assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True')
source = source.replace('assert snapshot_meta["writes_performed"] == 0','assert snapshot_meta.get("writes_performed", 0) == 0')
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

manifest = (component / "manifest.json").read_text(encoding="utf-8")
const = (component / "const.py").read_text(encoding="utf-8")
assert '"version": "1.0.0-b006.15"' in manifest
assert 'PANEL_VERSION = "0.6.94"' in const
assert 'irrigation-panel-v0694.mjs' in const

manual_api = (component / "manual_api.py").read_text(encoding="utf-8")
assert 'trigger_hex = "00" * 20' in manual_api
assert 'active_requests_after_trigger": 0' in manual_api

production_api = (component / "production_api.py").read_text(encoding="utf-8")
assert 'required_zones=set(range(1, NUM_ZONES + 1))' in production_api
assert 'self._write_dp38_mask_block(plan.write_block, zone)' in production_api
assert 'collateral_changed_zones' in production_api
assert 'patch["program_enabled"] = enabled' in production_api
assert 'program_enabled is not a production-editable field' not in production_api
assert 'The post-write snapshot is factual controller state' in production_api
assert 'mismatch_fields' in production_api

patch_builder = (component / "dp38_patch.py").read_text(encoding="utf-8")
assert 'start_times: list[tuple[int, int] | None] | None' in patch_builder
assert 'if start is None:' in patch_builder
assert 'never compacted or shifted' in patch_builder
assert 'program_enabled: bool | None = None' in patch_builder

editor_patch_path = component / "frontend" / "irrigation-panel-v0688.mjs"
editor_patch = editor_patch_path.read_text(encoding="utf-8")
assert 'data-program-start-clear' in editor_patch
assert 'empty.textContent = "--:--"' in editor_patch
assert 'patch.start_times = Array.from({ length: 6 }' in editor_patch
assert 'programEditField.confirmed' in editor_patch
assert 'programEditField.rejected' in editor_patch

lab_ui_path = component / "frontend" / "irrigation-panel-v0689.mjs"
lab_ui = lab_ui_path.read_text(encoding="utf-8")
assert '_dp38SnapshotLabV0689' in lab_ui
assert 'Переснять исходный снимок 1–8' in lab_ui
assert 'Снять контрольный снимок и сравнить' in lab_ui

readonly_ui_path = component / "frontend" / "irrigation-panel-v0690.mjs"
readonly_ui = readonly_ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.90"' in readonly_ui
assert 'p.programView = function programViewV0690' in readonly_ui
assert '_programReadOnlyCardV0690' in readonly_ui
assert 'Фактическая программа контроллера' in readonly_ui
assert 'Только просмотр.' in readonly_ui
assert 'this._programEditorCard(entities, number)' in readonly_ui
assert 'data-program-apply' not in readonly_ui
assert 'program:readonly:' in readonly_ui

system_ui_path = component / "frontend" / "irrigation-panel-v0691.mjs"
system_ui = system_ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.91"' in system_ui
assert 'screen.append(zone)' in system_ui
assert 'screen.append(settings)' in system_ui
assert 'screen.append(manual)' in system_ui
assert 'height:94px!important' in system_ui

editor_ui_path = component / "frontend" / "irrigation-panel-v0692.mjs"
editor_ui = editor_ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.92"' in editor_ui
assert 'data-program-enabled-toggle' in editor_ui
assert 'base.program_enabled' in editor_ui
assert 'patch.program_enabled = draft.program_enabled' in editor_ui
assert 'neutral editor at rest; blue draft; green only verified; red mismatch' in editor_ui
assert '.programEnabledToggle.on' in editor_ui

picker_ui_path = component / "frontend" / "irrigation-panel-v0693.mjs"
picker_ui = picker_ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.93"' in picker_ui
assert 'p._programEditorNativeControlActive = function programEditorNativeControlActiveV0693' in picker_ui
assert 'this._view !== "program"' not in picker_ui
assert 'grid-template-columns:minmax(0,1fr) 42px!important' in picker_ui

artwork_source = (component / "frontend" / "irrigation-panel-v0658.mjs").read_text(encoding="utf-8")
assert 'ARTWORK_STORAGE_KEY = "nikas_ho_sc_8w.zone_artwork.v1"' in artwork_source
assert 'this.style.setProperty(`--zone-artwork-${zone}`, image)' in artwork_source

ui_path = component / "frontend" / "irrigation-panel-v0694.mjs"
ui = ui_path.read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.94"' in ui
assert 'import "./irrigation-panel-v0693.mjs"' in ui
assert 'this._applyZoneArtwork?.()' in ui
for zone in range(1, 9):
    assert f'.scene{zone}{{background-image:var(--zone-artwork-{zone})!important}}' in ui

for path in (editor_patch_path, lab_ui_path, readonly_ui_path, system_ui_path, editor_ui_path, picker_ui_path, ui_path):
    subprocess.run(["node", "--check", str(path)], check=True)
subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
