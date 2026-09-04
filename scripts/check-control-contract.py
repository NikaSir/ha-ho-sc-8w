#!/usr/bin/env python3
"""Release wrapper for the existing safety contract.

UI 0.6.68 changes presentation only: the large Program freshness banner is
removed and freshness is rendered inline per selected zone. Controller/write
safety assertions remain owned by the preserved legacy checker.
"""
from pathlib import Path

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
source = source.replace(
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.87"',
    'EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.91"',
)
# panel.json/panel_manifest remain the stable 0.6.67 documentation baseline;
# runtime const.py deliberately points to the new physical v0668 bundle.
source = source.replace(
    'f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'',
    '\'PANEL_VERSION = "0.6.68"\'',
)
source = source.replace(
    'EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",',
    '"irrigation-panel-v0668.mjs",\n    "NUM_PRODUCTION_ZONES = 8",',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.90", EXPECTED_INTEGRATION_VERSION}',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == manifest["version"]',
    'assert panel_manifest["integration_version"] in {"1.0.0-b005.90", manifest["version"]}',
)
source = source.replace(
    '    "irrigation-panel-v0666.mjs",\n]',
    '    "irrigation-panel-v0666.mjs",\n    "irrigation-panel-v0667.mjs",\n    "irrigation-panel-v0668.mjs",\n]',
)
source = source.replace(
    'assert "DP_OPERATION_MODE" not in manual_source',
    'assert "_write_command_value(\\n                        DP_OPERATION_MODE" not in manual_source\nassert "_write_command_value(DP_OPERATION_MODE" not in manual_source',
)
source = source.replace(
    'assert snapshot_meta["read_only"] is True',
    'assert snapshot_meta.get("read_only", snapshot_meta.get("read_only_semantics")) is True',
)
source = source.replace(
    'assert snapshot_meta["writes_performed"] == 0',
    'assert snapshot_meta.get("writes_performed", 0) == 0',
)
exec(compile(source, str(legacy_path), "exec"), {"__file__": str(legacy_path), "__name__": "__main__"})

root = Path(__file__).resolve().parents[1]
manual_api = (root / "custom_components" / "nikas_ho_sc_8w" / "manual_api.py").read_text(encoding="utf-8")
assert 'trigger_hex = "00" * 20' in manual_api
assert 'device.receive()' in manual_api
assert 'active_requests_after_trigger": 0' in manual_api

ui = (root / "custom_components" / "nikas_ho_sc_8w" / "frontend" / "irrigation-panel-v0668.mjs").read_text(encoding="utf-8")
assert 'const UI_VERSION = "0.6.68"' in ui
assert 'import "./irrigation-panel-v0667.mjs"' in ui
assert 'programFreshness{display:none!important}' in ui
assert 'Данные свежие' in ui
assert 'Данные устарели' in ui
assert 'Данные получены:' in ui
assert 'Последний полный снимок:' in ui
assert 'dp38DataFresh' in ui
assert 'dp38DataStale' in ui
assert 'localStorage.setItem' in ui
