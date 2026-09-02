#!/usr/bin/env python3
"""Hardware-free contract check for guarded Zone 8 DP38 laboratory writes."""

from __future__ import annotations

import base64
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
        raw = base64.b64decode(value)
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

before_all = dict(api.device.schedule_blocks)
snapshot = api.snapshot_zone8_schedule_for_lab()
result = api.set_zone8_schedule_field("duration_minutes", "1", snapshot)
assert result["verified"] is True and result["changed"] is True
assert len(api.writes) == 1 and api.writes[0][0] == DP_NORMAL_TIME
assert api.writes[0][2] == "normal_time"
assert base64.b64decode(api.writes[0][1])[0] == 8
assert api.device.schedule_blocks[8][1] == 1
assert all(api.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

current = api.snapshot_zone8_schedule_for_lab()
api.set_zone8_schedule_field("rain_sensor_follow", "false", current)
assert api.device.schedule_blocks[8][19] == before_all[8][19] & ~0x01
assert all(api.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

current = api.snapshot_zone8_schedule_for_lab()
api.set_zone8_schedule_field("start_time_3", "12:34", current)
changed = api.device.schedule_blocks[8]
assert changed[4] == 12 and changed[10] == 34
assert changed[:4] == current[:4] and changed[5:10] == current[5:10]
assert changed[11:] == current[11:]

restored = api.restore_zone8_schedule(before_all[8])
assert restored["verified"] is True
assert api.device.schedule_blocks == before_all
assert all(write[0] == DP_NORMAL_TIME for write in api.writes)

api.device.active_zone = 1
try:
    api.snapshot_zone8_schedule_for_lab()
except RuntimeError as exc:
    assert "Stop all watering" in str(exc)
else:
    raise AssertionError("Active watering must block Zone 8 DP38 writes")

print("Zone 8 DP38 laboratory contract: PASS")
