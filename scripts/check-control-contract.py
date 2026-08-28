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
    """Load the pure protocol module without executing integration __init__.py."""
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
    """Load the transport module with a fake TinyTuya namespace."""
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

# DP45 one-shot contract: bytes 0/1 select manual/specific-stations, the first
# eight 16-bit fields stay zero, and requested minutes live in bytes 18..33.
payload = models.encode_dp45_start_manual({1: 1, 4: 10, 6: 120})
assert len(payload) == 34, f"DP45 must be 34 bytes, got {len(payload)}"
assert payload[:2] == b"\x01\x01", f"Unexpected DP45 flags: {payload[:2].hex()}"
assert payload[2:18] == bytes(16), "DP45 telemetry bank must stay zero on start"
expected = {1: 1, 4: 10, 6: 120}
for zone in range(1, 9):
    value = struct.unpack_from(">H", payload, 18 + (zone - 1) * 2)[0]
    assert value == expected.get(zone, 0), (
        f"DP45 zone {zone} command duration is {value}, "
        f"expected {expected.get(zone, 0)}"
    )

api_source = (INTEGRATION / "api.py").read_text(encoding="utf-8")
setup_source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
frontend_source = (INTEGRATION / "frontend" / "irrigation-panel.js").read_text(
    encoding="utf-8"
)
manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))
panel_manifest = json.loads((ROOT / "panel_manifest.json").read_text(encoding="utf-8"))

assert manifest["version"] == "1.0.0-b005.46"
assert panel["panel"]["dashboard_version"] == "0.6.29"
assert panel_manifest["panel_version"] == "0.6.29"
assert panel_manifest["integration_version"] == manifest["version"]
assert panel["panel"]["rule_set"] == "1.17"
assert panel_manifest["rule_set"] == "1.17"
assert 'const NIKAS_HO_SC_8W_UI_VERSION = "0.6.29"' in frontend_source

metrics_section = frontend_source.split("metrics(e) {", 1)[1].split("hero(e) {", 1)[0]
program_section = frontend_source.split("programView(e) {", 1)[1].split("manualView(e) {", 1)[0]
zones_override = frontend_source.split("p.zonesView =", 1)[1].split("p.zoneDetail =", 1)[0]

assert "data-season-value" not in metrics_section
assert "data-season-apply" not in metrics_section
assert "data-season-value" in program_section
assert "data-season-apply" in program_section
assert 'class="programSeasonEditor' in program_section
assert "const singleStart" not in zones_override
assert 'class="zoneCardTimes"' in zones_override
assert '${this.esc(z.duration)} мин</em>${startTimes}' in zones_override
assert "max-width:1280px" in frontend_source

for marker in (
    "def start_manual_queue(",
    "DP_IRRIGATION_TIME_ALL",
    'cloud_code="irrigation_time_all"',
    "cloud_value=raw_payload.hex()",
    'cloud_code="operation_mode"',
    "expected_mask",
    "self.device.active_zone | self.device.queued_zone",
    "def stop_manual(",
    "def resume_automatic(",
    "def set_seasonal_adjustment(",
    "_wait_for_readback",
    "_require_fresh_command_state",
    "_fail_safe_stop_after_unconfirmed_start",
    "fail-safe OFF",
):
    assert marker in api_source, f"Missing integration command marker: {marker}"

for marker in (
    "SERVICE_START_MANUAL_QUEUE",
    "SERVICE_STOP_MANUAL",
    "SERVICE_RESUME_AUTOMATIC",
    "SERVICE_SET_SEASONAL_ADJUSTMENT",
    "_START_MANUAL_QUEUE_SCHEMA",
    "_SEASONAL_ADJUSTMENT_SCHEMA",
):
    assert marker in setup_source, f"Missing service boundary marker: {marker}"

for marker in (
    'callService("nikas_ho_sc_8w", "start_manual_queue"',
    'callService("nikas_ho_sc_8w", "stop_manual"',
    'callService("nikas_ho_sc_8w", "resume_automatic"',
    'callService("nikas_ho_sc_8w", "set_seasonal_adjustment"',
    "data-season-apply",
    "data-manual-start",
    "data-manual-stop",
    "data-resume-auto",
):
    assert marker in frontend_source, f"Missing frontend action marker: {marker}"

assert frontend_source.count("window.confirm(") >= 4, (
    "Every panel controller write must pass through a user confirmation"
)
assert "set_value(" not in frontend_source, "Frontend contains a raw local DP write"
assert "sendcommand(" not in frontend_source, "Frontend contains a raw cloud DP write"


class FakeLocalDevice:
    """TinyTuya-shaped local device that returns factual DP read-back."""

    def __init__(self) -> None:
        self.mode = "Auto"
        self.season = 20
        self.requested_mask = 0
        self.commands: list[tuple[int, object, bool]] = []

    def set_value(self, dp: int, value: object, nowait: bool = False) -> None:
        self.commands.append((dp, value, nowait))
        if dp == 45:
            raw = base64.b64decode(str(value))
            self.requested_mask = sum(
                1 << index
                for index in range(8)
                if int.from_bytes(raw[18 + index * 2 : 20 + index * 2], "big")
            )
        elif dp == 101:
            self.mode = str(value)
        elif dp == 103:
            self.season = int(value)
        return None

    def status(self) -> dict[str, dict[str, object]]:
        active = (
            self.requested_mask & -self.requested_mask
            if self.mode == "Manual"
            else 0
        )
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
    """TinyTuya-shaped cloud API with the same read-back state machine."""

    def __init__(self) -> None:
        self.mode = "Auto"
        self.season = 20
        self.irrigation_mode = "order"
        self.requested_mask = 0
        self.commands: list[dict[str, object]] = []

    def sendcommand(
        self, _device_id: str, payload: dict[str, list[dict[str, object]]]
    ) -> dict[str, bool]:
        command = payload["commands"][0]
        self.commands.append(command)
        code = command["code"]
        value = command["value"]
        if code == "irrigation_time_all":
            raw = bytes.fromhex(str(value))
            self.requested_mask = sum(
                1 << index
                for index in range(8)
                if int.from_bytes(raw[18 + index * 2 : 20 + index * 2], "big")
            )
        elif code == "operation_mode":
            self.mode = str(value)
        elif code == "SeaAdjValue":
            self.season = int(value)
        elif code == "irrigation_mode":
            self.irrigation_mode = str(value)
        return {"success": True}

    def getstatus(self, _device_id: str) -> dict[str, object]:
        active = (
            self.requested_mask & -self.requested_mask
            if self.mode == "Manual"
            else 0
        )
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
assert [command[0] for command in local_device.commands] == [45, 101]
wire_payload = base64.b64decode(str(local_device.commands[0][1]))
assert wire_payload == payload, "Local DP45 payload differs from the verified encoder"
assert local_device.commands[0][2] is True, "Local DP45 must use nowait"

api.stop_manual()
assert local_device.mode == "OFF"
assert api.device.active_zone == 0 and api.device.queued_zone == 0
api.resume_automatic()
assert local_device.mode == "Auto"
api.set_seasonal_adjustment(30)
assert local_device.season == 30 and api.device.seasonal_adjust == 30

try:
    api.set_seasonal_adjustment(25)
except ValueError:
    pass
else:
    raise AssertionError("A seasonal value outside the 10% step was accepted")

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
cloud_wire = bytes.fromhex(str(cloud.commands[0]["value"]))
assert cloud_wire[:2] == b"\x01\x01" and cloud_wire[2:18] == bytes(16)
assert struct.unpack_from(">H", cloud_wire, 20)[0] == 5
assert struct.unpack_from(">H", cloud_wire, 26)[0] == 15

print("HO-SC-8W verified control contract passed")
