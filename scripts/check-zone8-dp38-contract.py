#!/usr/bin/env python3
"""Hardware-free contract check that every Zone 8 DP38 write is disabled."""

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

print("Zone 8 DP38 read-only incident hold: PASS")
