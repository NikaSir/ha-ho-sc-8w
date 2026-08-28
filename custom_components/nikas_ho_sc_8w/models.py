"""Verified HO-SC-8W protocol structures and pure encoders/decoders."""

from __future__ import annotations

import struct
from dataclasses import dataclass, field
from typing import Any

from .const import NUM_ZONES

DP45_LENGTH = 34
DP38_BLOCK_SIZE = 20


@dataclass(frozen=True)
class DeviceProfile:
    """Fixed profile for the INKBIRD / HiOazo HO-SC-8W."""

    num_zones: int = NUM_ZONES
    product_id: str = "h71ip90tp4mfd6mx"
    category: str = "ggq"
    tuya_version: float = 3.3
    dp_normal_time: int = 38
    dp_irrigation_mode: int = 44
    dp_irrigation_time_all: int = 45
    dp_operation_mode: int = 101
    dp_rain_sensor: int = 102
    dp_seasonal_adjust: int = 103
    dp_merge_history: int = 104
    dp_reset_device: int = 105
    dp_timeerror_alarm: int = 106
    dp_active_zone_bitmask: int = 107
    dp_queued_zone_bitmask: int = 108
    dp_cancel_alarm_voice: int = 109


PROFILE = DeviceProfile()


@dataclass
class ScheduleChannel:
    """Parsed 20-byte DP38 schedule block for one HO-SC-8W zone."""

    station: int = 0
    duration_minutes: int = 0
    start_times: list[tuple[int, int]] = field(default_factory=list)
    cycle_mode: int = 0
    cycle_value: int = 0
    anchor_date: tuple[int, int, int] = (0, 0, 0)
    flags_raw: int = 0

    @property
    def enabled(self) -> bool:
        return self.duration_minutes > 0

    @property
    def cycle_mode_name(self) -> str:
        return {0: "weekly", 1: "odd", 2: "even", 3: "interval"}.get(
            self.cycle_mode, f"unknown_{self.cycle_mode}"
        )

    @property
    def rain_sensor_follow_inferred(self) -> bool:
        return bool(self.flags_raw & 0x01)

    def as_dict(self) -> dict[str, Any]:
        year, month, day = self.anchor_date
        anchor = f"{year:04d}-{month:02d}-{day:02d}" if year and month and day else None
        interval_days = self.cycle_value if self.cycle_mode == 3 else None
        return {
            "station": self.station,
            "enabled": self.enabled,
            "duration_minutes": self.duration_minutes,
            "duration_min": self.duration_minutes,
            "start_times": [f"{h:02d}:{m:02d}" for h, m in self.start_times],
            "cycle_mode": self.cycle_mode_name,
            "calendar_mode": self.cycle_mode_name,
            "cycle_mode_raw": self.cycle_mode,
            "cycle_value": self.cycle_value,
            "interval_days": interval_days,
            "anchor_date": anchor,
            "interval_start": anchor,
            "flags_raw": self.flags_raw,
            "rain_sensor_follow_inferred": self.rain_sensor_follow_inferred,
            "rain_sensor_follow": self.rain_sensor_follow_inferred,
            "rain_flag_write_verified": False,
        }


def encode_dp45_start_manual(
    durations: dict[int, int], num_zones: int = NUM_ZONES
) -> bytes:
    """Encode the verified one-shot manual-watering DP45 command.

    The first per-zone bank (bytes 2..17 for eight zones) carries requested
    one-shot durations in a start command and live remaining time in controller
    reports.  The second bank (bytes 18..33) stays zero in a start command.
    """
    payload = bytearray(DP45_LENGTH)
    payload[0] = 0x01
    payload[1] = 0x01
    for zone in range(1, num_zones + 1):
        duration = int(durations.get(zone, 0))
        if duration < 0 or duration > 0xFFFF:
            raise ValueError(f"Invalid manual duration for zone {zone}: {duration}")
        struct.pack_into(">H", payload, 2 + (zone - 1) * 2, duration)
    return bytes(payload)


def decode_dp45(data: bytes, num_zones: int = NUM_ZONES) -> dict[str, Any]:
    result: dict[str, Any] = {
        "command_type": 0,
        "target": 0,
        "remaining": {z: 0 for z in range(1, num_zones + 1)},
        "elapsed": {z: 0 for z in range(1, num_zones + 1)},
    }
    if len(data) < DP45_LENGTH:
        return result
    result["command_type"] = data[0]
    result["target"] = data[1]
    for zone in range(1, num_zones + 1):
        result["remaining"][zone] = struct.unpack_from(
            ">H", data, 2 + (zone - 1) * 2
        )[0]
        result["elapsed"][zone] = struct.unpack_from(
            ">H", data, 18 + (zone - 1) * 2
        )[0]
    return result


def decode_dp38(data: bytes) -> list[ScheduleChannel]:
    channels: list[ScheduleChannel] = []
    if not data or len(data) < DP38_BLOCK_SIZE:
        return channels
    blocks = len(data) // DP38_BLOCK_SIZE
    for index in range(blocks):
        block = data[index * DP38_BLOCK_SIZE : (index + 1) * DP38_BLOCK_SIZE]
        if len(block) != DP38_BLOCK_SIZE:
            continue
        start_times: list[tuple[int, int]] = []
        for slot in range(6):
            hour = block[2 + slot]
            minute = block[8 + slot]
            if hour == 0xFF and minute == 0xFF:
                continue
            start_times.append((hour, minute))
        year_raw, month, day = block[16], block[17], block[18]
        year = 2000 + year_raw if year_raw else 0
        channels.append(
            ScheduleChannel(
                station=block[0],
                duration_minutes=block[1],
                start_times=start_times,
                cycle_mode=block[14],
                cycle_value=block[15],
                anchor_date=(year, month, day),
                flags_raw=block[19],
            )
        )
    return channels


def validate_dp38_block(data: bytes, expected_zone: int | None = None) -> None:
    if len(data) != DP38_BLOCK_SIZE:
        raise ValueError(f"DP38 block must be exactly 20 bytes, got {len(data)}")
    zone = data[0]
    if not 1 <= zone <= NUM_ZONES:
        raise ValueError(f"Invalid DP38 zone byte: {zone}")
    if expected_zone is not None and zone != expected_zone:
        raise ValueError(f"Expected DP38 zone {expected_zone}, got {zone}")
    for slot in range(6):
        hour = data[2 + slot]
        minute = data[8 + slot]
        if hour == 0xFF and minute == 0xFF:
            continue
        if hour > 23 or minute > 59:
            raise ValueError(
                f"Invalid DP38 start slot {slot + 1}: {hour:02x}:{minute:02x}"
            )


def encode_dp38_channel(channel: ScheduleChannel) -> bytes:
    if not 1 <= channel.station <= NUM_ZONES:
        raise ValueError("station must be 1..8")
    if not 0 <= channel.duration_minutes <= 255:
        raise ValueError("duration_minutes must be 0..255")
    if len(channel.start_times) > 6:
        raise ValueError("HO-SC-8W supports at most six start times per zone")
    block = bytearray([0xFF] * DP38_BLOCK_SIZE)
    block[0] = channel.station
    block[1] = channel.duration_minutes
    block[14] = channel.cycle_mode & 0xFF
    block[15] = channel.cycle_value & 0xFF
    year, month, day = channel.anchor_date
    block[16] = (year - 2000) & 0xFF if year else 0
    block[17] = month & 0xFF
    block[18] = day & 0xFF
    block[19] = channel.flags_raw & 0xFF
    for slot, (hour, minute) in enumerate(channel.start_times):
        if not 0 <= hour <= 23 or not 0 <= minute <= 59:
            raise ValueError(f"Invalid start time {hour}:{minute}")
        block[2 + slot] = hour
        block[8 + slot] = minute
    validate_dp38_block(bytes(block), expected_zone=channel.station)
    return bytes(block)
