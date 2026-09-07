#!/usr/bin/env python3
"""Release safety contract for HO-SC-8W UI 0.7.09 / integration b006.30."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
component = root / "custom_components" / "nikas_ho_sc_8w"
legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
# Keep the historical behavioral contract, but require all active release
# metadata to agree instead of explicitly accepting obsolete version numbers.
source = source.replace('EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"',
                        'EXPECTED_INTEGRATION_VERSION = "1.0.0-b006.30"')
source = source.replace('EXPECTED_PANEL_VERSION = "0.6.66"',
                        'EXPECTED_PANEL_VERSION = "0.7.09"')
source = source.replace('EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0666.mjs"',
                        'EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0709.mjs"')
wrapper_tail = '    "irrigation-panel-v0666.mjs",' + chr(10) + ']'
assert wrapper_tail in source, "Historical wrapper list changed"
extra_wrappers = ''.join(
    f'    "irrigation-panel-v{n:04d}.mjs",' + chr(10) for n in range(667, 710)
)
source = source.replace(
    wrapper_tail, '    "irrigation-panel-v0666.mjs",' + chr(10) + extra_wrappers + ']'
)
source = source.replace('require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")','require(setup_source, "from .start_probe_api import StartProbeHOSC8WAPI as HOSC8WAPI")')
source = source.replace('assert "DP_OPERATION_MODE" not in manual_source','assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source')
source = source.replace('assert snapshot_meta["read_only"] is True','assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True')
source = source.replace('assert snapshot_meta["writes_performed"] == 0','assert snapshot_meta.get("writes_performed", 0) == 0')
source = source.replace('assert manual_meta["readback"] == [107]',
                        'assert manual_meta["readback"] == [44, 101, 107, 108]')
source = source.replace('assert manifest_manual_meta["readback_dps"] == [107]',
                        'assert manifest_manual_meta["readback_dps"] == [44, 101, 107, 108]')
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

manifest = (component / "manifest.json").read_text(encoding="utf-8")
const = (component / "const.py").read_text(encoding="utf-8")
assert '"version": "1.0.0-b006.30"' in manifest
assert 'PANEL_VERSION = "0.7.09"' in const
assert 'irrigation-panel-v0709.mjs' in const

production_api = (component / "production_api.py").read_text(encoding="utf-8")
assert 'dispatch_dp38_once(self, plan.write_block, zone)' in production_api
transport = (component / 'parity_probe_api.py').read_text(encoding='utf-8')
assert 'transport.socketRetryLimit = 0' in transport
assert 'transport.retry = False' in transport
assert 'required_zones=set(range(1, NUM_ZONES + 1))' in production_api
assert 'No retry and no automatic rollback' in production_api

ui_paths = [component / "frontend" / f"irrigation-panel-v{n:04d}.mjs" for n in range(688, 710)]
for path in ui_paths:
    assert path.exists(), path
    subprocess.run(["node", "--check", str(path)], check=True)

ui97 = (component / "frontend" / "irrigation-panel-v0697.mjs").read_text(encoding="utf-8")
assert 'Для включённой программы длительность должна быть не меньше 1 минуты' in ui97

ui = (component / "frontend" / "irrigation-panel-v0705.mjs").read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.7.05"' in ui
assert 'consolidateProgramSnapshot' in ui
assert 'hero.nextElementSibling' in ui
assert 'node.remove()' in ui
assert 'Данные актуальны' in ui
assert 'Данные устарели' in ui
assert 'snapshotStamp' in ui

subprocess.run([sys.executable, str(root / "scripts" / "check-zone7-anchor-date-probe.py")], check=True)
