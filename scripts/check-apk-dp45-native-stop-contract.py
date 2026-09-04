#!/usr/bin/env python3
"""Pure contract checks for DP45 semantics recovered from INKBIRD 2.1.11 APK.

This script does not touch hardware. It documents and validates the byte-level
payloads used by the stock IIC-800 presenters and compares them with the current
HO-SC-8W integration strategy before any physical test.
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


def apk_stop_selected(mode: int, remain: dict[int, int], watered: dict[int, int], selected: set[int]) -> bytes:
    """Mirror Iic800ManualPresenter.stopManual()."""
    next_remain = dict(remain)
    next_watered = dict(watered)
    for zone in selected:
        next_remain[zone] = 0
        next_watered[zone] = 0
    return encode_dp45(0x01, mode, next_remain, next_watered)


def apk_schedule_stop_selected(remain: dict[int, int], watered: dict[int, int], selected: set[int]) -> bytes:
    """Mirror Iic800SchedulePresenter.stopManual()."""
    next_remain = dict(remain)
    next_watered = dict(watered)
    for zone in selected:
        next_remain[zone] = 0
        next_watered[zone] = 0
    return encode_dp45(0x02, 0x01, next_remain, next_watered)


def apk_stop_all() -> bytes:
    """Mirror 8-zone Iic800ManualPresenter.stopAllManual()."""
    return encode_dp45(0x01, 0x00, {}, {})


start = apk_start_order({2: 10, 4: 7, 6: 3})
assert len(start) == 34
assert start.hex().upper().startswith("0101")

# Normal sequential queue: current zone 2 has watered for 3 minutes; future
# zones 4 and 6 have not started, so their factual remain values still equal
# submitted durations and their watered values are zero.
remain = {2: 7, 4: 7, 6: 3}
watered = {2: 3, 4: 0, 6: 0}
manual_stop = apk_stop_selected(0x01, remain, watered, {2})

assert manual_stop[:2] == bytes((0x01, 0x01))
assert struct.unpack_from(">H", manual_stop, 2 + (2 - 1) * 2)[0] == 0
assert struct.unpack_from(">H", manual_stop, 18 + (2 - 1) * 2)[0] == 0
assert struct.unpack_from(">H", manual_stop, 2 + (4 - 1) * 2)[0] == 7
assert struct.unpack_from(">H", manual_stop, 2 + (6 - 1) * 2)[0] == 3

# The current integration skip resubmits only future zones with command=01,
# target=01 and a zero watered bank. Under the normal sequential invariant this
# is byte-for-byte identical to Iic800ManualPresenter.stopManual().
current_skip = apk_start_order({4: 7, 6: 3})
assert current_skip == manual_stop

# The schedule screen uses command=02,target=01 with the same banks. This is a
# distinct stock-app path and should not be substituted without a field test.
schedule_stop = apk_schedule_stop_selected(remain, watered, {2})
assert schedule_stop[:2] == bytes((0x02, 0x01))
assert schedule_stop[2:] == manual_stop[2:]
assert schedule_stop != current_skip

stop_all = apk_stop_all()
assert stop_all == bytes((0x01, 0x00)) + bytes(32)

# Boundary of equivalence: if a future/non-current zone already has factual
# state different from the locally submitted plan, rebuilding from the plan is
# no longer guaranteed to match the stock manual-screen command.
nonstandard_remain = {2: 7, 4: 5, 6: 3}
nonstandard_watered = {2: 3, 4: 2, 6: 0}
manual_stop_nonstandard = apk_stop_selected(0x01, nonstandard_remain, nonstandard_watered, {2})
assert current_skip != manual_stop_nonstandard

print("INKBIRD APK DP45 native stop contract passed")
print("start_order             =", start.hex().upper())
print("manual_stop_z2          =", manual_stop.hex().upper())
print("current_skip            =", current_skip.hex().upper())
print("schedule_stop_z2        =", schedule_stop.hex().upper())
print("stop_all                =", stop_all.hex().upper())
print("manual_stop_nonstandard =", manual_stop_nonstandard.hex().upper())
