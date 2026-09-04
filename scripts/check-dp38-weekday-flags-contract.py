#!/usr/bin/env python3
"""Pure contract checks for DP38 semantics recovered from INKBIRD 2.1.11 APK.

Research-only: does not contact the controller and performs no writes.
"""

WEEKDAY_BITS = {
    "sun": 0x01,
    "mon": 0x02,
    "tue": 0x04,
    "wed": 0x08,
    "thu": 0x10,
    "fri": 0x20,
    "sat": 0x40,
}

MODE_NAMES = {0: "weekly", 1: "odd", 2: "even", 3: "interval"}


def decode_weekdays(mask: int) -> list[str]:
    if mask & ~0x7F:
        raise ValueError(f"invalid weekly mask 0x{mask:02X}")
    return [name for name, bit in WEEKDAY_BITS.items() if mask & bit]


def encode_weekdays(days: list[str]) -> int:
    value = 0
    for day in days:
        value |= WEEKDAY_BITS[day]
    return value


def dp38_enabled(flags_raw: int) -> bool:
    return ((flags_raw >> 4) & 0x0F) == 1


def dp38_obey_rain_sensor(flags_raw: int) -> bool:
    return (flags_raw & 0x0F) == 1


def check() -> None:
    assert encode_weekdays(["sun"]) == 0x01
    assert encode_weekdays(["mon"]) == 0x02
    assert encode_weekdays(["tue"]) == 0x04
    assert encode_weekdays(["wed"]) == 0x08
    assert encode_weekdays(["thu"]) == 0x10
    assert encode_weekdays(["fri"]) == 0x20
    assert encode_weekdays(["sat"]) == 0x40
    assert encode_weekdays(list(WEEKDAY_BITS)) == 0x7F
    assert decode_weekdays(0x7F) == list(WEEKDAY_BITS)

    assert MODE_NAMES == {0: "weekly", 1: "odd", 2: "even", 3: "interval"}

    assert dp38_enabled(0x11) is True
    assert dp38_obey_rain_sensor(0x11) is True
    assert dp38_enabled(0x10) is True
    assert dp38_obey_rain_sensor(0x10) is False
    assert dp38_enabled(0x01) is False
    assert dp38_obey_rain_sensor(0x01) is True
    assert dp38_enabled(0x00) is False
    assert dp38_obey_rain_sensor(0x00) is False

    print("DP38 weekday/flags contract: OK")
    print("weekday bits:", ", ".join(f"{k}=0x{v:02X}" for k, v in WEEKDAY_BITS.items()))
    print("modes:", MODE_NAMES)


if __name__ == "__main__":
    check()
