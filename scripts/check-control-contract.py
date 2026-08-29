#!/usr/bin/env python3
"""Verify the safety-critical HO-SC-8W write contract without HA runtime deps."""

from __future__ import annotations

import base64
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


def load_api():
    tinytuya = types.ModuleType("tinytuya")
    tinytuya.Device = object
    tinytuya.Cloud = object
    sys.modules["tinytuya"] = tinytuya
    spec = importlib.util.spec_from_file_location(
        "ho_sc_8w_contract.api", INTEGRATION / "api.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load api.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    module.time.sleep = lambda _seconds: None
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

api_source = (INTEGRATION / "api.py").read_text(encoding="utf-8")
setup_source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
frontend_source = (INTEGRATION / "frontend" / "irrigation-panel.js").read_text(
    encoding="utf-8"
)
manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))
panel_manifest = json.loads((ROOT / "panel_manifest.json").read_text(encoding="utf-8"))

assert manifest["version"] == "1.0.0-b005.49"
assert panel["panel"]["title"] == "Автополив"
assert panel["panel"]["dashboard_version"] == "0.6.30"
assert panel_manifest["panel_version"] == "0.6.30"
assert panel_manifest["integration_version"] == manifest["version"]
assert panel["panel"]["rule_set"] == "1.17"
assert panel_manifest["rule_set"] == "1.17"
assert 'const NIKAS_HO_SC_8W_UI_VERSION = "0.6.30"' in frontend_source

for marker in (
    "def start_manual_queue(",
    "DP_IRRIGATION_TIME_ALL",
    'cloud_code="irrigation_time_all"',
    "cloud_value=raw_payload.hex()",
    "expected_mask",
    "self.device.active_zone | self.device.queued_zone",
    "def stop_manual(",
    "def resume_automatic(",
    "def set_seasonal_adjustment(",
    "_wait_for_readback",
    "_require_fresh_command_state",
    "_fail_safe_stop_after_unconfirmed_start",
    "_return_to_auto_after_manual",
    "fail-safe return to Auto",
):
    assert marker in api_source, f"Missing integration command marker: {marker}"

assert 'DP_OPERATION_MODE,\n                "OFF"' not in api_source
assert 'DP_OPERATION_MODE,\n                    "OFF"' not in api_source

for marker in (
    "SERVICE_START_MANUAL_QUEUE",
    "SERVICE_STOP_MANUAL",
    "SERVICE_RESUME_AUTOMATIC",
    "SERVICE_SET_SEASONAL_ADJUSTMENT",
):
    assert marker in setup_source

for marker in (
    'callService("nikas_ho_sc_8w", "start_manual_queue"',
    'callService("nikas_ho_sc_8w", "stop_manual"',
    'callService("nikas_ho_sc_8w", "resume_automatic"',
    'callService("nikas_ho_sc_8w", "set_seasonal_adjustment"',
    "data-manual-start",
    "data-manual-stop",
):
    assert marker in frontend_source

assert frontend_source.count("window.confirm(") >= 4
assert "set_value(" not in frontend_source
assert "sendcommand(" not in frontend_source


class FakeLocalDevice:
    def __init__(self, *, reject_manual: bool = False) -> None:
        self.mode = "Auto"
        self.season = 20
        self.requested_mask = 0
        self.reject_manual = reject_manual
        self.commands: list[tuple[int, object, bool]] = []

    def set_value(self, dp: int, value: object, nowait: bool = False) -> None:
        self.commands.append((dp, value, nowait))
        if dp == 45:
            raw = base64.b64decode(str(value))
            self.requested_mask = sum(
                1 << index
                for index in range(8)
                if int.from_bytes(raw[2 + index * 2 : 4 + index * 2], "big")
            )
        elif dp == 101:
            if not (self.reject_manual and str(value) == "Manual"):
                self.mode = str(value)
        elif dp == 103:
            self.season = int(value)
        return None

    def status(self) -> dict[str, dict[str, object]]:
        active = self.requested_mask & -self.requested_mask if self.mode == "Manual" else 0
        queued = self.requested_mask ^ active if self.mode == "Manual" else 0
        return {
            "dps": {
                "44": "order",
                "101": self.mode,
                "103": self.season,
                "107": active,
                "108": queued,
            }
        }


class FakeCloud:
    def __init__(self) -> None:
        self.mode = "Auto"
        self.season = 20
        self.irrigation_mode = "order"
        self.requested_mask = 0
        self.commands: list[dict[str, object]] = []

    def sendcommand(self, _device_id: str, payload: dict[str, list[dict[str, object]]]) -> dict[str, bool]:
        command = payload["commands"][0]
        self.commands.append(command)
        code = command["code"]
        value = command["value"]
        if code == "irrigation_time_all":
            raw = bytes.fromhex(str(value))
            self.requested_mask = sum(
                1 << index
                for index in range(8)
                if int.from_bytes(raw[2 + index * 2 : 4 + index * 2], "big")
            )
        elif code == "operation_mode":
            self.mode = str(value)
        elif code == "SeaAdjValue":
            self.season = int(value)
        elif code == "irrigation_mode":
            self.irrigation_mode = str(value)
        return {"success": True}

    def getstatus(self, _device_id: str) -> dict[str, object]:
        active = self.requested_mask & -self.requested_mask if self.mode == "Manual" else 0
        queued = self.requested_mask ^ active if self.mode == "Manual" else 0
        return {
            "success": True,
            "result": [
                {"code": "irrigation_mode", "value": self.irrigation_mode},
                {"code": "operation_mode", "value": self.mode},
                {"code": "SeaAdjValue", "value": self.season},
                {"code": "zonerun_state", "value": active},
                {"code": "pendingzone_state", "value": queued},
            ],
        }


api_module = load_api()
local_device = FakeLocalDevice()
api = api_module.HOSC8WAPI("device", "local-key", "192.0.2.1")
api._tuya = local_device
api._connected = True
api._using_cloud = False
api.device.online = True
api.device.operation_mode = "Auto"
api.device.irrigation_mode = "order"

result = api.start_manual_queue({1: 1, 4: 10, 6: 120})
assert result["verified"] is True
assert result["active_zone_bitmask"] == 1
assert result["queued_zone_bitmask"] == 40
assert [command[0] for command in local_device.commands] == [101, 45]
assert base64.b64decode(str(local_device.commands[1][1])) == payload
assert local_device.commands[1][2] is True

api.stop_manual()
assert local_device.mode == "Auto"
assert api.device.active_zone == 0 and api.device.queued_zone == 0
assert all(not (dp == 101 and str(value).upper() == "OFF") for dp, value, _ in local_device.commands)

# A completed manual cycle is controller-driven; the API does not send a follow-up OFF.
local_device.mode = "Auto"
local_device.requested_mask = 0
api._refresh_command_state()
assert api.device.operation_mode == "Auto"

api.resume_automatic()
assert local_device.mode == "Auto"
api.set_seasonal_adjustment(30)
assert local_device.season == 30 and api.device.seasonal_adjust == 30

rejecting_device = FakeLocalDevice(reject_manual=True)
rejecting_api = api_module.HOSC8WAPI("device", "local-key", "192.0.2.1")
rejecting_api._tuya = rejecting_device
rejecting_api._connected = True
rejecting_api._using_cloud = False
rejecting_api.device.online = True
rejecting_api.device.operation_mode = "Auto"
rejecting_api.device.irrigation_mode = "order"
rejecting_api._wait_for_readback = lambda predicate, timeout_seconds=8.0: predicate()
try:
    rejecting_api.start_manual_queue({1: 1})
except RuntimeError as error:
    assert "DP45 was not sent" in str(error)
else:
    raise AssertionError("A local manual start continued without DP101 confirmation")
assert [command[0] for command in rejecting_device.commands] == [101]

cloud = FakeCloud()
cloud_api = api_module.HOSC8WAPI(
    "device",
    "local-key",
    "192.0.2.1",
    cloud_api_key="api-key",
    cloud_api_secret="api-secret",
)
cloud_api._cloud = cloud
cloud_api._using_cloud = True
cloud_api.device.online = True
cloud_api.device.operation_mode = "Auto"
cloud_api.device.irrigation_mode = "order"
cloud_result = cloud_api.start_manual_queue({2: 5, 5: 15})
assert cloud_result["verified"] is True
assert [command["code"] for command in cloud.commands] == [
    "irrigation_time_all",
    "operation_mode",
]
cloud_api.stop_manual()
assert cloud.mode == "Auto"
assert not any(
    command["code"] == "operation_mode" and str(command["value"]).upper() == "OFF"
    for command in cloud.commands
)

print("HO-SC-8W verified control contract passed")
