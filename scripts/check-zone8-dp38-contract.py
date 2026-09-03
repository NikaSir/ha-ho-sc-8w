#!/usr/bin/env python3
"""Hardware-free contract check for the isolated Zone 8 DP38 HEX probe."""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"
PACKAGE = "ho_sc_8w_zone8_contract"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(INTEGRATION)]
sys.modules[PACKAGE] = package
sys.modules["tinytuya"] = types.ModuleType("tinytuya")


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(
        f"{PACKAGE}.{name}", INTEGRATION / f"{name}.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


const = load_module("const")
models = load_module("models")
api_module = load_module("api")
HOSC8WAPI = api_module.HOSC8WAPI
DP_NORMAL_TIME = const.DP_NORMAL_TIME
ScheduleChannel = models.ScheduleChannel
encode_dp38_channel = models.encode_dp38_channel
api_module.time.sleep = lambda _seconds: None


class FakeZone8API(HOSC8WAPI):
    def __init__(self) -> None:
        super().__init__("device", "key", "127.0.0.1")
        self.writes: list[tuple[int, Any, str, Any]] = []

    def _refresh_command_state(self) -> bool:
        self.device.online = True
        return True

    def _write_command_value(
        self,
        dp: int,
        value: Any,
        *,
        cloud_code: str,
        cloud_value: Any | None = None,
        nowait: bool = False,
    ) -> None:
        self.writes.append((dp, value, cloud_code, cloud_value))
        assert isinstance(value, str) and len(value) == 40
        assert value == value.upper()
        raw = bytes.fromhex(value)
        self.device.ingest_schedule_raw(raw, source="controller")


def block(zone: int) -> bytes:
    return encode_dp38_channel(
        ScheduleChannel(
            station=zone,
            duration_minutes=10 if zone != 8 else 0,
            start_times=[(5, 0)] if zone != 8 else [],
            cycle_mode=0,
            cycle_value=0x7F,
            anchor_date=(2026, 9, 2),
            flags_raw=1,
        )
    )


class ActiveRefreshDevice:
    """Model the observed controller: every DP38 read returns only Zone 8."""

    def __init__(self) -> None:
        self.status_calls = 0
        self.refresh_calls = 0
        self.timeouts: list[int] = []

    def set_socketTimeout(self, value: int) -> None:
        self.timeouts.append(value)

    def status(self) -> dict[str, Any]:
        self.status_calls += 1
        return {
            "dps": {
                str(DP_NORMAL_TIME): block(8).hex().upper(),
                str(const.DP_OPERATION_MODE): "OFF",
                str(const.DP_ACTIVE_ZONE): 0,
                str(const.DP_QUEUED_ZONE): 0,
            }
        }

    def updatedps(self, indexes: list[int]) -> dict[str, Any]:
        assert indexes == [DP_NORMAL_TIME]
        self.refresh_calls += 1
        return {"dps": {str(DP_NORMAL_TIME): block(8).hex().upper()}}

    def receive(self) -> None:
        return None


class ActiveRefreshAPI(HOSC8WAPI):
    def __init__(self) -> None:
        super().__init__("device", "key", "127.0.0.1")
        self.fake_device = ActiveRefreshDevice()
        self._connected = True
        self._tuya = self.fake_device

    def _reset_connection(self) -> None:
        # Keep the deterministic fake connection across the collector reset.
        self._connected = True
        self._tuya = self.fake_device

    def _ensure_connection(self) -> ActiveRefreshDevice:
        return self.fake_device


active_refresh = ActiveRefreshAPI()
fresh = active_refresh._collect_confirmed_zone8_dp38(timeout_seconds=1)
assert fresh == block(8)
assert active_refresh.fake_device.status_calls == 1
assert active_refresh.fake_device.refresh_calls == 1
assert active_refresh.fake_device.timeouts == [1, 5]
assert active_refresh.device.schedule_sources[8] == "controller"


api = FakeZone8API()
for zone in range(1, 9):
    api.device.ingest_schedule_block(block(zone), source="controller")

snapshot = api.snapshot_zone8_schedule_for_lab()
assert const.ZONE8_DP38_WRITES_ENABLED is False
for action in (
    lambda: api.set_zone8_schedule_field("duration_minutes", "1", snapshot),
    lambda: api.restore_zone8_schedule(snapshot),
):
    try:
        action()
    except RuntimeError as exc:
        assert "disabled" in str(exc)
    else:
        raise AssertionError("Every DP38 schedule write must be blocked")
assert api.writes == []

# Exercise the corrected encoder without changing the production safety flag.
api_module.ZONE8_DP38_WRITES_ENABLED = True
probe = FakeZone8API()
for zone in range(1, 9):
    probe.device.ingest_schedule_block(block(zone), source="controller")
before_all = dict(probe.device.schedule_blocks)
current = bytearray(probe.snapshot_zone8_schedule_for_lab())
current[14] |= 0xA0
probe.device.ingest_schedule_block(bytes(current), source="controller")

snapshot = probe.snapshot_zone8_schedule_for_lab()
result = probe.set_zone8_schedule_field("cycle_mode", "interval", snapshot)
assert result["verified"] is True and result["changed"] is True
assert len(probe.writes) == 1 and probe.writes[0][0] == DP_NORMAL_TIME
assert probe.writes[0][2] == "normal_time"
written = bytes.fromhex(probe.writes[0][1])
assert written[0] == 8 and written[14] == 0xA3
assert probe.device.schedule_blocks[8] == written
assert all(probe.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

restored = probe.restore_zone8_schedule(snapshot)
assert restored["verified"] is True
assert probe.device.schedule_blocks[8] == snapshot
assert all(probe.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

api.device.active_zone = 1
try:
    api.snapshot_zone8_schedule_for_lab()
except RuntimeError as exc:
    assert "Stop all watering" in str(exc)
else:
    raise AssertionError("Active watering must block Zone 8 DP38 writes")


class IsolatedProbeAPI(FakeZone8API):
    def __init__(self) -> None:
        super().__init__()
        for zone in range(1, 9):
            self.device.ingest_schedule_block(block(zone), source="controller")
        self.reads = 0

    def _collect_confirmed_zone8_dp38(
        self, timeout_seconds: float = 8.0
    ) -> bytes:
        del timeout_seconds
        self.reads += 1
        return self.device.schedule_blocks[8]


isolated = IsolatedProbeAPI()
before_probe = dict(isolated.device.schedule_blocks)
result = isolated.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
assert result == {
    "verified": True,
    "read_only": True,
    "writes_performed": 0,
    "zone": 8,
    "raw_hex": before_probe[8].hex().upper(),
}
assert isolated.reads == 1
assert isolated.writes == []
assert isolated.device.schedule_blocks == before_probe
assert isolated.device.zone8_hex_probe_status == "verified"
assert before_probe[8].hex().upper() in isolated.device.zone8_hex_probe_detail

blocked = IsolatedProbeAPI()
blocked.device.operation_mode = "Auto"
try:
    blocked.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
except RuntimeError as exc:
    assert "physical controller to OFF" in str(exc)
else:
    raise AssertionError("The HEX probe must require physical OFF")
assert blocked.writes == []

try:
    IsolatedProbeAPI().probe_zone8_dp38_hex("wrong")
except PermissionError:
    pass
else:
    raise AssertionError("The HEX probe must require its exact confirmation token")

api_source = (INTEGRATION / "api.py").read_text(encoding="utf-8")
for marker in (
    "safety_dps_seen",
    "required_safety_dps",
    "device.updatedps([DP_NORMAL_TIME])",
    "matching_reads < 2",
    '"writes_performed": 0',
    '"read_only": True',
    "block.hex().upper()",
):
    assert marker in api_source, f"Missing Zone 8 probe safety marker: {marker}"

print("Zone 8 DP38 double-read inspection and write hold: PASS")
