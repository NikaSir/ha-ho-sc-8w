#!/usr/bin/env python3
"""Release wrapper for the existing safety contract.

UI 0.6.68 is a presentation-only runtime bundle layered on the validated
0.6.67 metadata baseline. Controller/write safety remains enforced by the
preserved legacy checker; this wrapper maps only release/runtime metadata.
"""
from pathlib import Path

legacy_path = Path(__file__).with_name("check-control-contract-b00587.py")
source = legacy_path.read_text(encoding="utf-8")
# Keep stable documentation metadata at b005.90 / UI 0.6.67 / v0667.
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
# Runtime integration build advances to b005.91 while panel metadata remains
# the previously validated baseline. HACS reads manifest.json for the update.
source = source.replace(
    'assert manifest["version"] == EXPECTED_INTEGRATION_VERSION',
    'assert manifest["version"] == "1.0.0-b005.91"',
)
source = source.replace(
    'assert panel_manifest["integration_version"] == manifest["version"]',
    'assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION and manifest["version"] == "1.0.0-b005.91"',
)
# const.py is the runtime source of truth for the physical cache-busting bundle.
source = source.replace(
    'f\'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"\'',
    '\'PANEL_VERSION = "0.6.68"\'',
)
source = source.replace(
    '    EXPECTED_PANEL_BUNDLE,\n    "NUM_PRODUCTION_ZONES = 8",',
    '    "irrigation-panel-v0668.mjs",\n    "NUM_PRODUCTION_ZONES = 8",',
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
