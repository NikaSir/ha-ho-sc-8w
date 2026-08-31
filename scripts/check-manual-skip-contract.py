#!/usr/bin/env python3
"""Exercise the DP45 queue/skip state machine without controller hardware."""

from __future__ import annotations

import importlib.util
import sys
import threading
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"
PACKAGE = "ho_sc_8w_manual_skip_contract"

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


load_module("const")
load_module("models")
api_module = load_module("api")
manual_module = load_module("manual_api")
manual_module.time.sleep = lambda _seconds: None

api = object.__new__(manual_module.NativeManualHOSC8WAPI)
api._command_lock = threading.Lock()
api._io_lock = threading.RLock()
api._manual_queue_plan = {}
api.device = api_module.HOSC8WDevice()
api.device.online = True
api.device.operation_mode = "Manual"
api.device.irrigation_mode = "order"
api._using_cloud = False
api._connected = True
api._require_fresh_command_state = lambda: None
api._wait_for_readback = lambda predicate, timeout_seconds: predicate()

writes: list[dict[int, int]] = []


def write_dp45(durations: dict[int, int]) -> None:
    writes.append(dict(durations))
    api.device.active_zone = 1 << (min(durations) - 1) if durations else 0


api._write_dp45_manual_payload = write_dp45

started = api.start_manual_queue({2: 10, 4: 7, 6: 3})
assert started["verified"] is True
assert api.device.active_zone == 2
assert writes[-1] == {2: 10, 4: 7, 6: 3}

first_skip = api.skip_current_manual()
assert first_skip["skipped_zone"] == 2
assert first_skip["next_zone"] == 4
assert writes[-1] == {4: 7, 6: 3}

second_skip = api.skip_current_manual()
assert second_skip["skipped_zone"] == 4
assert second_skip["next_zone"] == 6
assert writes[-1] == {6: 3}

last_skip = api.skip_current_manual()
assert last_skip["skipped_zone"] == 6
assert last_skip["next_zone"] is None
assert writes[-1] == {}
assert api.device.active_zone == 0

# A restart loses the submitted plan.  In that state the test command must
# fail before writing anything instead of guessing from DP45/DP108.
api.device.active_zone = 2
writes_before_restart_case = len(writes)
try:
    api.skip_current_manual()
except RuntimeError as exc:
    assert "integration restart" in str(exc)
else:
    raise AssertionError("skip without a runtime queue plan must fail")
assert len(writes) == writes_before_restart_case

print("HO-SC-8W DP45 current-zone skip contract passed")
