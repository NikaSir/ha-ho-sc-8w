#!/usr/bin/env python3
"""Pure byte-contract tests for conservative DP38 patching."""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "custom_components" / "nikas_ho_sc_8w"

pkg = types.ModuleType("nikas_ho_sc_8w")
pkg.__path__ = [str(PKG)]
sys.modules["nikas_ho_sc_8w"] = pkg

const_spec = importlib.util.spec_from_file_location("nikas_ho_sc_8w.const", PKG / "const.py")
const = importlib.util.module_from_spec(const_spec)
sys.modules[const_spec.name] = const
const_spec.loader.exec_module(const)

models_spec = importlib.util.spec_from_file_location("nikas_ho_sc_8w.models", PKG / "models.py")
models = importlib.util.module_from_spec(models_spec)
sys.modules[models_spec.name] = models
models_spec.loader.exec_module(models)

patch_spec = importlib.util.spec_from_file_location("nikas_ho_sc_8w.dp38_patch", PKG / "dp38_patch.py")
patch = importlib.util.module_from_spec(patch_spec)
sys.modules[patch_spec.name] = patch
patch_spec.loader.exec_module(patch)


def check() -> None:
    # Realistic zone-8 READ form used during our DP38 investigation.
    source = bytes.fromhex("080A05FFFFFFFFFFFFFFFFFF000315090411")
    assert len(source) == 20

    # Toggle only rain behavior: everything except byte0/write selector and
    # low nibble of byte19 must remain byte-for-byte identical.
    write = patch.build_dp38_patch(source, rain_sensor_follow=False)
    assert write[0] == 0x80
    assert write[1:19] == source[1:19]
    assert write[19] == (source[19] & 0xF0)
    readback = patch.expected_readback(write)
    assert readback[0] == 8
    assert readback[1:19] == source[1:19]

    # Toggle program enable only, preserving the rain nibble.
    write2 = patch.build_dp38_patch(source, program_enabled=False)
    assert write2[19] == (source[19] & 0x0F)

    # Weekly change must touch mode/day only (plus selector representation).
    weekly = patch.build_dp38_patch(
        source,
        cycle_mode=0,
        weekdays=["mon", "wed", "fri"],
    )
    assert weekly[14] == 0
    assert weekly[15] == 0x2A
    for idx in list(range(1, 14)) + [16, 17, 18, 19]:
        assert weekly[idx] == source[idx]

    # Replacing start times explicitly clears unused slots with FF/FF.
    times = patch.build_dp38_patch(source, start_times=[(5, 0), (6, 30)])
    assert times[2:8] == bytes([5, 6, 0xFF, 0xFF, 0xFF, 0xFF])
    assert times[8:14] == bytes([0, 30, 0xFF, 0xFF, 0xFF, 0xFF])

    print("DP38 conservative patch contract: OK")


if __name__ == "__main__":
    check()
