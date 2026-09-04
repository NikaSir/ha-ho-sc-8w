#!/usr/bin/env python3
"""Pure contract checks against the integration's DP38 model helpers.

Research-only: imports models.py, performs no network/device I/O, and does not
exercise production DP38 writes.
"""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "custom_components" / "nikas_ho_sc_8w"

# Load the package modules without importing Home Assistant.
pkg = types.ModuleType("custom_components.nikas_ho_sc_8w")
pkg.__path__ = [str(PKG)]
sys.modules[pkg.__name__] = pkg

const_mod = types.ModuleType("custom_components.nikas_ho_sc_8w.const")
const_mod.NUM_ZONES = 8
sys.modules[const_mod.__name__] = const_mod

spec = importlib.util.spec_from_file_location(
    "custom_components.nikas_ho_sc_8w.models", PKG / "models.py"
)
assert spec and spec.loader
models = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = models
spec.loader.exec_module(models)


def block(zone: int, duration: int, mode: int, value: int, flags: int) -> bytes:
    data = bytearray([0xFF] * 20)
    data[0] = zone
    data[1] = duration
    data[2] = 5
    data[8] = 0
    data[14] = mode
    data[15] = value
    data[16:19] = bytes([0x1A, 0x09, 0x04])
    data[19] = flags
    return bytes(data)


def check() -> None:
    # Exact weekday order recovered from WeekAdapter + Iic800Constant.weeks.
    assert models.encode_dp38_weekdays(["sun"]) == 0x01
    assert models.encode_dp38_weekdays(["mon"]) == 0x02
    assert models.encode_dp38_weekdays(["tue"]) == 0x04
    assert models.encode_dp38_weekdays(["wed"]) == 0x08
    assert models.encode_dp38_weekdays(["thu"]) == 0x10
    assert models.encode_dp38_weekdays(["fri"]) == 0x20
    assert models.encode_dp38_weekdays(["sat"]) == 0x40
    assert models.encode_dp38_weekdays(["mon", "wed", "fri"]) == 0x2A
    assert models.decode_dp38_weekdays(0x2A) == ["mon", "wed", "fri"]
    assert models.decode_dp38_weekdays(0x7F) == [
        "sun", "mon", "tue", "wed", "thu", "fri", "sat"
    ]

    # Enable is the high nibble of byte19, independent of duration.
    disabled = models.decode_dp38(block(1, 30, 0, 0x7F, 0x01))[0]
    assert disabled.duration_minutes == 30
    assert disabled.enabled is False
    assert disabled.rain_sensor_follow is True

    enabled = models.decode_dp38(block(1, 30, 0, 0x2A, 0x10))[0]
    assert enabled.enabled is True
    assert enabled.rain_sensor_follow is False
    assert enabled.weekdays == ["mon", "wed", "fri"]
    attrs = enabled.as_dict()
    assert attrs["program_enabled"] is True
    assert attrs["weekday_mask"] == 0x2A
    assert attrs["weekdays"] == ["mon", "wed", "fri"]

    # Read-modify-write must change one proven nibble without touching the other.
    assert models.dp38_set_flags(0x01, program_enabled=True) == 0x11
    assert models.dp38_set_flags(0x11, program_enabled=False) == 0x01
    assert models.dp38_set_flags(0x10, rain_sensor_follow=True) == 0x11
    assert models.dp38_set_flags(0x11, rain_sensor_follow=False) == 0x10

    # Encoder retains raw flags and uses the already-proven one-hot zone selector.
    channel = models.ScheduleChannel(
        station=8,
        duration_minutes=10,
        start_times=[(5, 0)],
        cycle_mode=0,
        cycle_value=models.encode_dp38_weekdays(["mon", "wed", "fri"]),
        anchor_date=(2026, 9, 4),
        flags_raw=0x11,
    )
    encoded = models.encode_dp38_channel(channel)
    assert len(encoded) == 20
    assert encoded[0] == 0x80
    assert encoded[14] == 0
    assert encoded[15] == 0x2A
    assert encoded[19] == 0x11

    print("models.py DP38 contract: OK")


if __name__ == "__main__":
    check()
