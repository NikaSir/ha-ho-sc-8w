#!/usr/bin/env python3
"""Pure contract checks for the DP45 semantics recovered from INKBIRD 2.1.11 APK.

This script does not touch hardware. It documents and validates the byte-level
payloads used by the stock IIC-800 presenters so we can compare them with the
current HO-SC-8W integration before any physical test.
"""

from __future__ import annotations

import struct

NUM_ZONES = 8
DP45_LEN = 34


def encode_dp45(command: int, mode: int, remain: dict[int, int], watered: dict[int, int]) -> bytes:
    payload = bytearray(DP45_LEN)
    payload[0] = command & 0xFF
    payload[1] = mode & 0xFF
    for zone in range(1, NUM_ZONES + 1):
        struct.pack_into(">H", payload, 2 + (zone - 1) * 2, int(remain.get(zone, 0)))
        struct.pack_into(">H", payload, 18 + (zone - 1) * 2, int(watered.get(zone, 0)))
    return bytes(payload)


def apk_start_order(durations: dict[int, int]) -> bytes:
    return encode_dp45(0x01, 0x01, durations, {})


def apk_change_order(remain: dict[int, int], watered: dict[int, int]) -> bytes:
    return encode_dp45(0x02, 0x01, remain, watered)


def apk_stop_selected(mode: int, remain: dict[int, int], watered: dict[int, int], selected: set[int]) -> bytes:
    """Mirror Iic800ManualPresenter.stopManual().

    Stock app uses command=01, preserves the current manualMode byte, zeroes
    BOTH banks only for selected/wateringSwitch zones, and preserves factual
    remain/watered values for every other zone.
    """
    next_remain = dict(remain)
    next_watered = dict(watered)
    for zone in selected:
        next_remain[zone] = 0
        next_watered[zone] = 0
    return encode_dp45(0x01, mode, next_remain, next_watered)


def apk_schedule_stop_selected(remain: dict[int, int], watered: dict[int, int], selected: set[int]) -> bytes:
    """Mirror Iic800SchedulePresenter.stopManual().

    Schedule screen uses command=02,target=01 for an in-flight modification.
    """
    next_remain = dict(remain)
    next_watered = dict(watered)
    for zone in selected:
        next_remain[zone] = 0
        next_watered[zone] = 0
    return encode_dp45(0x02, 0x01, next_remain, next_watered)


def apk_stop_all() -> bytes:
    """Mirror 8-zone Iic800ManualPresenter.stopAllManual()."""
    return encode_dp45(0x01, 0x00, {}, {})


# Start selected zones 2,4,6 exactly as the stock app does.
start = apk_start_order({2: 10, 4: 7, 6: 3})
assert len(start) == 34
assert start.hex().upper().startswith("0101")

# Model a controller report after zone 2 has watered for 3 minutes.
remain = {2: 7, 4: 7, 6: 3}
watered = {2: 3, 4: 0, 6: 0}

# Native stop of zone 2 MUST preserve factual state for zones 4 and 6 while
# clearing both banks for zone 2. It must not resend their original durations
# from an integration-side plan.
manual_stop = apk_stop_selected(0x01, remain, watered, {2})
assert manual_stop[:2] == bytes((0x01, 0x01))
assert struct.unpack_from(">H", manual_stop, 2 + (2 - 1) * 2)[0] == 0
assert struct.unpack_from(">H", manual_stop, 18 + (2 - 1) * 2)[0] == 0
assert struct.unpack_from(">H", manual_stop, 2 + (4 - 1) * 2)[0] == 7
assert struct.unpack_from(">H", manual_stop, 2 + (6 - 1) * 2)[0] == 3

schedule_stop = apk_schedule_stop_selected(remain, watered, {2})
assert schedule_stop[:2] == bytes((0x02, 0x01))
assert schedule_stop[2:] == manual_stop[2:]

stop_all = apk_stop_all()
assert stop_all == bytes((0x01, 0x00)) + bytes(32)

# The current integration-side workaround would restart only the remainder
# using command=01,target=01 and a fresh zeroed watered bank. Demonstrate that
# this is bytewise DIFFERENT from the stock native in-flight modification.
workaround_restart = apk_start_order({4: 7, 6: 3})
assert workaround_restart != manual_stop
assert workaround_restart != schedule_stop

print("INKBIRD APK DP45 native stop contract passed")
print("start_order       =", start.hex().upper())
print("manual_stop_z2    =", manual_stop.hex().upper())
print("schedule_stop_z2  =", schedule_stop.hex().upper())
print("stop_all          =", stop_all.hex().upper())
print("current_workaround=", workaround_restart.hex().upper())
