#!/usr/bin/env python3
"""Verify the safety-critical HO-SC-8W write and release contract."""

from __future__ import annotations

import importlib.util
import json
import struct
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"


def load_models():
    package_name = "ho_sc_8w_contract"
    package = types.ModuleType(package_name)
    package.__path__ = [str(INTEGRATION)]
    sys.modules[package_name] = package
    spec = importlib.util.spec_from_file_location(
        f"{package_name}.models", INTEGRATION / "models.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load models.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


models = load_models()
payload = models.encode_dp45_start_manual({1: 1, 4: 10, 6: 120})
assert len(payload) == 34
assert payload[:2] == b"\x01\x01"
assert payload[18:34] == bytes(16)
expected = {1: 1, 4: 10, 6: 120}
for zone in range(1, 9):
    value = struct.unpack_from(">H", payload, 2 + (zone - 1) * 2)[0]
    assert value == expected.get(zone, 0)

stop_payload = models.encode_dp45_start_manual({zone: 0 for zone in range(1, 9)})
assert len(stop_payload) == 34
assert stop_payload[:2] == b"\x01\x01"
assert stop_payload[2:] == bytes(32)

manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))
panel_manifest = json.loads((ROOT / "panel_manifest.json").read_text(encoding="utf-8"))
const_source = (INTEGRATION / "const.py").read_text(encoding="utf-8")
setup_source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
manual_source = (INTEGRATION / "manual_api.py").read_text(encoding="utf-8")
sensor_source = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
frontend_source = (INTEGRATION / "frontend" / "irrigation-panel.js").read_text(encoding="utf-8")
inherited_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0633.mjs").read_text(encoding="utf-8")
compact_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0634.mjs").read_text(encoding="utf-8")
fit_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0635.mjs").read_text(encoding="utf-8")
active_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0636.mjs").read_text(encoding="utf-8")
wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0637.mjs").read_text(encoding="utf-8")
combined_frontend_source = frontend_source + inherited_wrapper_source + compact_wrapper_source + fit_wrapper_source + active_wrapper_source + wrapper_source

assert manifest["version"] == "1.0.0-b005.56"
assert panel["panel"]["dashboard_version"] == "0.6.37"
assert panel_manifest["panel_version"] == "0.6.37"
assert panel_manifest["integration_version"] == manifest["version"]
assert 'PANEL_VERSION = "0.6.37"' in const_source
assert 'irrigation-panel-v0637.mjs' in const_source
assert 'const UI_VERSION = "0.6.37"' in wrapper_source
assert 'irrigation-panel-v0636.mjs' in wrapper_source
assert 'replace("<small>ПРОГРАММА</small>", "")' in compact_wrapper_source
assert "Зоны — просмотр. Сезон — изменение с подтверждением." in fit_wrapper_source
assert ".programPageIntro{padding-bottom:8px}" in fit_wrapper_source
assert 'return raw_bitmask, "dp107" if raw_bitmask else "idle"' in sensor_source
assert '"dp45_unconfirmed": bitmask == 0 and any(dp45_remaining.values())' in sensor_source
assert panel["panel"]["rule_set"] == "1.17"
assert panel_manifest["rule_set"] == "1.17"

assert "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI" in setup_source
for marker in (
    "class NativeManualHOSC8WAPI",
    "def start_manual_queue(",
    "def stop_manual(",
    "_write_dp45_manual_payload",
    "DP_IRRIGATION_TIME_ALL",
    'cloud_code="irrigation_time_all"',
    "def skip_current_manual(",
    "self._manual_queue_plan",
    "DP45 manual queue was sent",
    "DP45 reset did not confirm watering stop via DP107",
):
    assert marker in manual_source, f"Missing native manual-control marker: {marker}"

assert "DP_OPERATION_MODE" not in manual_source
assert 'cloud_code="operation_mode"' not in manual_source
assert '"OFF"' not in manual_source
assert "SERVICE_SKIP_CURRENT_MANUAL" in setup_source
assert "async_skip_current_manual" in setup_source

manual_meta = panel["panel"]["control_actions"]["manual_queue"]
assert manual_meta["write_dp"] == 45
assert manual_meta["readback"] == [107]
assert manual_meta["operation_mode_dp101_write"] is False
assert manual_meta["ui"] == "zone_cards_with_per_zone_duration_and_switches"
manifest_manual_meta = panel_manifest["control_actions"]["manual_queue"]
assert manifest_manual_meta["write_dp"] == 45
assert manifest_manual_meta["readback_dps"] == [107]
assert manifest_manual_meta["operation_mode_dp101_write"] is False

for marker in (
    'callService("nikas_ho_sc_8w", "start_manual_queue"',
    'callService("nikas_ho_sc_8w", "stop_manual"',
    'callService("nikas_ho_sc_8w", "skip_current_manual"',
    "data-manual-start",
    "data-queue-toggle",
    "data-queue-step",
    "manualZoneCard",
    "manualDuration",
    "manualZoneSwitch",
    "previousToggleManualZone.call",
    "Стоп всё",
):
    assert marker in combined_frontend_source, f"Missing frontend marker: {marker}"
assert "set_value(" not in combined_frontend_source
assert "sendcommand(" not in combined_frontend_source

print("HO-SC-8W DP45 native control, release, and manual UI contract passed")
