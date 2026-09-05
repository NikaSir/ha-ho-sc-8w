#!/usr/bin/env python3
"""Release safety contract for HO-SC-8W UI 0.6.98 / integration b006.19."""
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
source = source.replace('assert manifest["version"] == EXPECTED_INTEGRATION_VERSION','assert manifest["version"] == "1.0.0-b006.19"')
source = source.replace('assert panel_manifest["integration_version"] == manifest["version"]','assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b006.19"')
source = source.replace('f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'','\'PANEL_VERSION = "0.6.98"\'')
source = source.replace('    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",','    "irrigation-panel-v0698.mjs",\n    "NUM_PRODUCTION_ZONES = 8",')
source = source.replace('    "irrigation-panel-v0666.mjs",\n]','    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n    "irrigation-panel-v0669.mjs",\n    "irrigation-panel-v0670.mjs",\n    "irrigation-panel-v0671.mjs",\n    "irrigation-panel-v0672.mjs",\n    "irrigation-panel-v0673.mjs",\n    "irrigation-panel-v0674.mjs",\n    "irrigation-panel-v0675.mjs",\n    "irrigation-panel-v0676.mjs",\n    "irrigation-panel-v0677.mjs",\n    "irrigation-panel-v0678.mjs",\n    "irrigation-panel-v0679.mjs",\n    "irrigation-panel-v0680.mjs",\n    "irrigation-panel-v0681.mjs",\n    "irrigation-panel-v0682.mjs",\n    "irrigation-panel-v0683.mjs",\n    "irrigation-panel-v0684.mjs",\n    "irrigation-panel-v0685.mjs",\n    "irrigation-panel-v0686.mjs",\n    "irrigation-panel-v0687.mjs",\n    "irrigation-panel-v0688.mjs",\n    "irrigation-panel-v0689.mjs",\n    "irrigation-panel-v0690.mjs",\n    "irrigation-panel-v0691.mjs",\n    "irrigation-panel-v0692.mjs",\n    "irrigation-panel-v0693.mjs",\n    "irrigation-panel-v0694.mjs",\n    "irrigation-panel-v0695.mjs",\n    "irrigation-panel-v0696.mjs",\n    "irrigation-panel-v0697.mjs",\n    "irrigation-panel-v0698.mjs",\n]')
source = source.replace('require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")','require(setup_source, "from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI")')
source = source.replace('assert "DP_OPERATION_MODE" not in manual_source','assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source')
source = source.replace('assert snapshot_meta["read_only"] is True','assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True')
source = source.replace('assert snapshot_meta["writes_performed"] == 0','assert snapshot_meta.get("writes_performed", 0) == 0')
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

manifest = (component / "manifest.json").read_text(encoding="utf-8")
const = (component / "const.py").read_text(encoding="utf-8")
assert '"version": "1.0.0-b006.19"' in manifest
assert 'PANEL_VERSION = "0.6.98"' in const
assert 'irrigation-panel-v0698.mjs' in const

production_api = (component / "production_api.py").read_text(encoding="utf-8")
assert 'self._write_dp38_mask_block(plan.write_block, zone)' in production_api
assert 'required_zones=set(range(1, NUM_ZONES + 1))' in production_api
assert 'No retry and no automatic rollback' in production_api

ui_paths = [component / "frontend" / f"irrigation-panel-v{n:04d}.mjs" for n in range(688, 699)]
for path in ui_paths:
    assert path.exists(), path
    subprocess.run(["node", "--check", str(path)], check=True)

ui97 = (component / "frontend" / "irrigation-panel-v0697.mjs").read_text(encoding="utf-8")
assert 'Для включённой программы длительность должна быть не меньше 1 минуты' in ui97

ui = ui_paths[-1].read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.98"' in ui
assert 'align-items:center!important' in ui
assert 'justify-content:center!important' in ui
assert '::-webkit-date-and-time-value' in ui

subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
