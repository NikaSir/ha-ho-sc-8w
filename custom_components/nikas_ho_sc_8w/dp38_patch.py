"""Conservative DP38 patch builder for research and controlled validation.

This module does not send commands.  It converts a fresh 20-byte controller
READ block into a single-zone WRITE block and changes only explicitly supplied
fields.  All untouched bytes are preserved verbatim.
"""

from __future__ import annotations

from collections.abc import Iterable

from .models import (
    DP38_BLOCK_SIZE,
    dp38_set_flags,
    dp38_zone_write_mask,
    encode_dp38_weekdays,
    validate_dp38_block,
    validate_dp38_write_block,
)


def build_dp38_patch(
    read_block: bytes,
    *,
    duration_minutes: int | None = None,
    start_times: list[tuple[int, int]] | None = None,
    cycle_mode: int | None = None,
    weekdays: Iterable[str] | None = None,
    interval_days: int | None = None,
    anchor_date: tuple[int, int, int] | None = None,
    program_enabled: bool | None = None,
    rain_sensor_follow: bool | None = None,
) -> bytes:
    """Build one DP38 WRITE block by patching a fresh controller READ block.

    The input must use the controller read representation in byte 0 (zone 1..8).
    The returned block uses the proven one-hot write selector.  Fields omitted
    by the caller are byte-for-byte preserved.
    """
    validate_dp38_block(read_block)
    if len(read_block) != DP38_BLOCK_SIZE:
        raise ValueError("DP38 patch source must be exactly one 20-byte block")

    zone = read_block[0]
    block = bytearray(read_block)
    block[0] = dp38_zone_write_mask(zone)

    if duration_minutes is not None:
        if not 0 <= duration_minutes <= 0xFF:
            raise ValueError("duration_minutes must be 0..255")
        block[1] = duration_minutes

    if start_times is not None:
        if len(start_times) > 6:
            raise ValueError("HO-SC-8W supports at most six start times")
        # Explicit replacement of the start-time field clears unused slots.
        for slot in range(6):
            block[2 + slot] = 0xFF
            block[8 + slot] = 0xFF
        for slot, (hour, minute) in enumerate(start_times):
            if not 0 <= hour <= 23 or not 0 <= minute <= 59:
                raise ValueError(f"Invalid start time {hour}:{minute}")
            block[2 + slot] = hour
            block[8 + slot] = minute

    if cycle_mode is not None:
        if cycle_mode not in {0, 1, 2, 3}:
            raise ValueError("cycle_mode must be 0..3")
        block[14] = cycle_mode

    if weekdays is not None:
        effective_mode = block[14] if cycle_mode is None else cycle_mode
        if effective_mode != 0:
            raise ValueError("weekdays may only be set for weekly mode")
        block[15] = encode_dp38_weekdays(weekdays)

    if interval_days is not None:
        effective_mode = block[14] if cycle_mode is None else cycle_mode
        if effective_mode != 3:
            raise ValueError("interval_days may only be set for interval mode")
        if not 1 <= interval_days <= 0xFF:
            raise ValueError("interval_days must be 1..255")
        block[15] = interval_days

    if anchor_date is not None:
        year, month, day = anchor_date
        if not 2000 <= year <= 2255:
            raise ValueError("anchor year must be 2000..2255")
        if not 1 <= month <= 12 or not 1 <= day <= 31:
            raise ValueError("invalid anchor date components")
        block[16] = year - 2000
        block[17] = month
        block[18] = day

    if program_enabled is not None or rain_sensor_follow is not None:
        block[19] = dp38_set_flags(
            block[19],
            program_enabled=program_enabled,
            rain_sensor_follow=rain_sensor_follow,
        )

    result = bytes(block)
    validate_dp38_write_block(result, expected_zone=zone)
    return result


def expected_readback(write_block: bytes) -> bytes:
    """Convert a validated one-hot WRITE block to expected controller READ form."""
    validate_dp38_write_block(write_block)
    zone = write_block[0].bit_length()
    return bytes([zone]) + write_block[1:]
