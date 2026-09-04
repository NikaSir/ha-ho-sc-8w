#!/usr/bin/env python3
"""Pure checks for transactional DP38 dry-run planning.

No network, Home Assistant or controller access is used.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
PKG = "custom_components.nikas_ho_sc_8w"

# Load package modules without importing Home Assistant integration __init__.
pkg = types.ModuleType(PKG)
pkg.__path__ = [str(ROOT / "custom_components" / "nikas_ho_sc_8w")]
sys.modules[PKG] = pkg

const = types.ModuleType(f"{PKG}.const")
const.NUM_ZONES = 8
sys.modules[f"{PKG}.const"] = const

for name in ("models", "dp38_patch", "dp38_transaction"):
    path = ROOT / "custom_components" / "nikas_ho_sc_8w" / f"{name}.py"
    spec = spec_from_file_location(f"{PKG}.{name}", path)
    mod = module_from_spec(spec)
    sys.modules[f"{PKG}.{name}"] = mod
    assert spec and spec.loader
    spec.loader.exec_module(mod)

from custom_components.nikas_ho_sc_8w.dp38_transaction import (  # noqa: E402
    build_dp38_transaction,
    verify_dp38_transaction_readback,
)


def check() -> None:
    # Zone 8 read representation; 30 min, 05:00, weekly Mon/Wed/Fri, enabled+rain.
    source = bytes.fromhex("081E05FFFFFFFFFF00FFFFFFFFFF002A1A090411")

    no_op = build_dp38_transaction(source)
    assert no_op.zone == 8
    assert no_op.write_block[0] == 0x80
    assert no_op.expected_read == source
    assert no_op.changed is False
    assert [c.offset for c in no_op.changes] == [0]

    rain = build_dp38_transaction(source, rain_sensor_follow=False)
    assert rain.write_block[0] == 0x80
    assert rain.write_block[19] == 0x10
    assert rain.expected_read[0] == 0x08
    assert rain.expected_read[19] == 0x10
    assert [c.offset for c in rain.changes] == [0, 19]
    assert rain.changed is True

    weekly = build_dp38_transaction(source, weekdays=["mon", "tue", "thu"])
    assert weekly.write_block[15] == 0x16
    assert weekly.expected_read[15] == 0x16
    assert any(c.offset == 15 and c.field == "cycle_value" for c in weekly.changes)

    good = verify_dp38_transaction_readback(rain, rain.expected_read)
    assert good["verified"] is True
    assert good["mismatches"] == []

    bad_read = bytearray(rain.expected_read)
    bad_read[1] += 1
    bad = verify_dp38_transaction_readback(rain, bytes(bad_read))
    assert bad["verified"] is False
    assert bad["mismatches"] == [
        {"offset": 1, "field": "duration_minutes", "expected": "1E", "actual": "1F"}
    ]

    view = rain.as_dict()
    assert view["dry_run"] is True
    assert view["before"]["program_enabled"] is True
    assert view["after"]["rain_sensor_follow"] is False

    print("DP38 transactional dry-run contract: OK")
    print("source :", rain.source_hex)
    print("write  :", rain.write_hex)
    print("readback:", rain.expected_read_hex)
    print("changes:", [c.as_dict() for c in rain.changes])


if __name__ == "__main__":
    check()
