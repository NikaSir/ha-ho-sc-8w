#!/usr/bin/env python3
"""Test real native DP45 parsing, ownership and fresh read-back with an offline wire peer."""
from __future__ import annotations

import base64
from collections import deque
import importlib.util
import struct
import sys
import threading
import types
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"
PACKAGE = "ho_sc_8w_manual_session_contract"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(INTEGRATION)]
sys.modules[PACKAGE] = package
sys.modules["tinytuya"] = types.ModuleType("tinytuya")


def load_module(name):
    spec = importlib.util.spec_from_file_location(f"{PACKAGE}.{name}", INTEGRATION / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


load_module("const")
load_module("models")
api_module = load_module("api")
manual_module = load_module("manual_api")


class Clock:
    now = 0.0

    @classmethod
    def sleep(cls, seconds):
        cls.now += seconds


manual_module.time.sleep = Clock.sleep
manual_module.time.monotonic = lambda: Clock.now


class Transport:
    """Only the wire is stubbed; production methods retain real locks and polling."""
    def __init__(self):
        self.state = {"101": "Auto", "107": 0, "108": 0, "44": "order"}
        self.responses = deque()
        self.pushes = deque()
        self.writes = []
        self.after_write = None
        self.status_override = None
        self.heartbeat_response = None

    def status(self):
        response = self.responses.popleft() if self.responses else (
            self.status_override() if self.status_override else {"dps": dict(self.state)}
        )
        if isinstance(response, Exception):
            raise response
        return response

    def set_value(self, dp, value, nowait=False):
        self.writes.append((dp, value, nowait))
        if dp == 45:
            payload = base64.b64decode(value, validate=True)
            assert payload[:2] == b"\x01\x01" and payload[18:] == bytes(16)
            durations = {zone: struct.unpack_from(">H", payload, 2 + (zone - 1) * 2)[0] for zone in range(1, 9)}
            active = [zone for zone, duration in durations.items() if duration]
            self.state["107"] = 1 << (min(active) - 1) if active else 0
            self.state["108"] = 0  # Field-tested firmware omits its native queue.
            if active:
                self.state["101"] = "Manual"
        else:
            self.state[str(dp)] = value
        if self.after_write:
            self.after_write(dp)
        return None

    def receive(self):
        response = self.pushes.popleft() if self.pushes else None
        if isinstance(response, Exception):
            raise response
        return response

    def heartbeat(self):
        return self.heartbeat_response

    def close(self):
        pass


class ManualSessionTests(unittest.TestCase):
    def setUp(self):
        Clock.now = 0.0
        self.api = manual_module.NativeManualHOSC8WAPI("offline-id", "offline-key", "127.0.0.1")
        self.transport = Transport()
        self.api._tuya = self.transport
        self.api._connected = True
        self.api.device.online = True
        self.api.device.update_from_dps(dict(self.transport.state))

    def start(self, plan=None):
        return self.api.start_manual_queue(plan or {2: 10, 4: 7, 6: 3})

    def push(self, **dps):
        self.transport.state.update(dps)
        self.transport.pushes.append({"dps": dps})
        self.api.receive_push_update()

    def assert_no_write(self, callback):
        before = len(self.transport.writes)
        with self.assertRaises((RuntimeError, ValueError)):
            callback()
        self.assertEqual(len(self.transport.writes), before)

    def assert_locks_released(self):
        acquired = []

        def probe():
            for lock in (self.api._command_lock, self.api._io_lock):
                held = lock.acquire(blocking=False)
                acquired.append(held)
                if held:
                    lock.release()

        thread = threading.Thread(target=probe)
        thread.start()
        thread.join(timeout=1)
        self.assertEqual(acquired, [True, True])

    def test_verified_queue_can_skip_all_zones_with_dp108_zero(self):
        self.assertTrue(self.start()["verified"])
        status = self.api.manual_skip_status
        self.assertTrue(status["allowed"])
        self.assertEqual(status["active_zone"], 2)
        first = self.api.skip_current_manual(2, status["session_id"])
        self.assertEqual((first["skipped_zone"], first["next_zone"]), (2, 4))
        self.assertNotEqual(status["session_id"], self.api.manual_skip_status["session_id"])
        self.assertEqual(self.api.skip_current_manual()["next_zone"], 6)
        self.assertIsNone(self.api.skip_current_manual()["next_zone"])
        self.assertFalse(self.api.manual_skip_status["allowed"])
        self.assertEqual(self.api.device.active_zone, 0)
        self.assertEqual([dp for dp, _, _ in self.transport.writes], [45, 45, 45, 45])
        self.assert_locks_released()

    def test_natural_ascending_progress_drops_completed_zones(self):
        self.start()
        self.push(**{"107": 8})
        self.assertTrue(self.api.manual_skip_status["allowed"])
        result = self.api.skip_current_manual()
        self.assertEqual((result["skipped_zone"], result["next_zone"]), (4, 6))

    def test_auto_with_matching_old_plan_cannot_send_dp45(self):
        self.start()
        self.push(**{"101": "Auto"})
        self.assert_no_write(self.api.skip_current_manual)
        self.assertFalse(self.api.manual_skip_status["allowed"])
        self.assert_locks_released()

    def test_finish_then_same_zone_external_restart_cannot_recover_ownership(self):
        self.start()
        self.push(**{"107": 0})
        self.push(**{"101": "Manual", "107": 2})
        self.assert_no_write(self.api.skip_current_manual)

    def test_mode_exit_then_matching_manual_restart_cannot_recover_ownership(self):
        self.start()
        self.push(**{"101": "Auto"})
        self.push(**{"101": "Manual"})
        self.assert_no_write(self.api.skip_current_manual)

    def test_foreign_manual_queue_has_no_ownership(self):
        self.push(**{"101": "Manual", "107": 2})
        self.assert_no_write(self.api.skip_current_manual)

    def test_unexpected_or_regressive_zone_invalidates(self):
        for observed in (1, 3, 128, -1, True, "unknown"):
            with self.subTest(observed=observed):
                self.setUp()
                self.start()
                try:
                    self.push(**{"107": observed})
                except ValueError:
                    pass  # Invalid wire data must still destroy old ownership.
                self.assert_no_write(self.api.skip_current_manual)
        self.setUp()
        self.start()
        self.push(**{"107": 8})
        self.push(**{"107": 2})
        self.assert_no_write(self.api.skip_current_manual)

    def test_unexpected_pending_zone_invalidates_but_zero_is_valid(self):
        self.start()
        self.push(**{"108": 128})
        self.assert_no_write(self.api.skip_current_manual)

    def test_preflight_requires_each_fresh_queue_safety_dp(self):
        cases = [None, {"dps": {}}, {"Err": "offline"}, RuntimeError("offline")]
        cases += [{"dps": {key: value for key, value in {
            "101": "Manual", "107": 2, "108": 0, "44": "order",
        }.items() if key != missing}} for missing in ("101", "107", "108", "44")]
        for response in cases:
            with self.subTest(response=response):
                self.setUp()
                self.start()
                self.transport.responses.append(response)
                self.assert_no_write(self.api.skip_current_manual)
                self.assertFalse(self.api.manual_skip_status["allowed"])
                self.assert_locks_released()

    def test_invalid_safety_values_never_allow_write(self):
        for dp, value in [("101", "unknown"), ("107", -1), ("107", True), ("108", "unknown")]:
            with self.subTest(dp=dp, value=value):
                self.setUp()
                self.transport.state[dp] = value
                self.assert_no_write(self.start)
                self.assert_locks_released()

    def test_failed_or_partial_readback_never_creates_session(self):
        for response in ({"Err": "offline"}, {"dps": {"107": 2}}, {"dps": {}}, None):
            with self.subTest(response=response):
                self.setUp()
                self.transport.after_write = lambda _dp: setattr(
                    self.transport, "status_override", lambda: response
                )
                with self.assertRaisesRegex(RuntimeError, "DP45 manual queue was sent"):
                    self.start()
                self.assertEqual(len(self.transport.writes), 1)
                self.assertFalse(self.api.manual_skip_status["allowed"])
                self.transport.status_override = None
                self.assert_no_write(self.api.skip_current_manual)
                self.assert_locks_released()

    def test_start_requires_manual_mode_and_exact_first_zone(self):
        for patch in ({"101": "Auto"}, {"107": 10}, {"107": 8}, {"108": 128}, {"44": "parallel"}):
            with self.subTest(patch=patch):
                self.setUp()
                self.transport.after_write = lambda _dp: self.transport.state.update(patch)
                with self.assertRaisesRegex(RuntimeError, "DP45 manual queue was sent"):
                    self.start()
                self.assertFalse(self.api.manual_skip_status["allowed"])

    def test_start_cannot_assume_cached_or_default_sequential_mode(self):
        self.transport.responses.append({"dps": {"101": "Auto", "107": 0, "108": 0}})
        self.assert_no_write(self.start)
        self.transport.after_write = lambda _dp: setattr(
            self.transport, "status_override", lambda: {
                "dps": {key: value for key, value in self.transport.state.items() if key != "44"}
            }
        )
        with self.assertRaisesRegex(RuntimeError, "DP45 manual queue was sent"):
            self.start()
        self.assertFalse(self.api.manual_skip_status["allowed"])

    def test_sequential_mode_change_is_confirmed_before_dp45(self):
        self.transport.state["44"] = "parallel"
        self.assertTrue(self.start()["verified"])
        self.assertEqual([dp for dp, _, _ in self.transport.writes], [44, 45])
        self.setUp()
        self.transport.state["44"] = "parallel"
        self.transport.after_write = lambda _dp: self.transport.state.update({"107": 1})
        with self.assertRaisesRegex(RuntimeError, "Watering started"):
            self.start()
        self.assertEqual([dp for dp, _, _ in self.transport.writes], [44])

    def test_failed_skip_destroys_previous_session(self):
        self.start()
        self.transport.after_write = lambda _dp: setattr(
            self.transport, "status_override", lambda: {"Err": "offline"}
        )
        with self.assertRaisesRegex(RuntimeError, "DP45 revised queue was sent"):
            self.api.skip_current_manual()
        self.transport.status_override = None
        self.assert_no_write(self.api.skip_current_manual)
        self.assert_locks_released()

    def test_dispatch_error_destroys_ownership_and_releases_locks(self):
        self.start()

        def fail(_dp):
            raise RuntimeError("Wire write outcome is unknown")

        self.transport.after_write = fail
        with self.assertRaisesRegex(RuntimeError, "outcome is unknown"):
            self.api.skip_current_manual()
        self.assertFalse(self.api.manual_skip_status["allowed"])
        self.assert_locks_released()

    def test_skip_rejects_stale_ui_intent_without_destroying_current_session(self):
        self.start()
        status = self.api.manual_skip_status
        self.assert_no_write(lambda: self.api.skip_current_manual(4, status["session_id"]))
        self.assert_no_write(lambda: self.api.skip_current_manual(2, "old-session"))
        self.assertTrue(self.api.manual_skip_status["allowed"])
        self.assertTrue(self.api.skip_current_manual(2, status["session_id"])["verified"])

    def test_natural_progress_while_confirmation_open_rejects_old_zone(self):
        self.start()
        status = self.api.manual_skip_status
        self.push(**{"107": 8})
        self.assert_no_write(lambda: self.api.skip_current_manual(2, status["session_id"]))
        self.assertTrue(self.api.manual_skip_status["allowed"])

    def test_stop_and_resume_do_not_preserve_old_manual_queue(self):
        self.start()
        self.assertTrue(self.api.stop_manual()["verified"])
        self.assertTrue(self.api.resume_automatic()["verified"])
        self.push(**{"101": "Manual", "107": 2})
        self.assert_no_write(self.api.skip_current_manual)

    def test_stop_is_available_without_owned_session(self):
        self.push(**{"101": "Manual", "107": 2})
        self.assertTrue(self.api.stop_manual()["verified"])
        self.assertEqual(self.api.device.active_zone, 0)

    def test_disconnect_push_error_and_heartbeat_error_destroy_ownership(self):
        for response in (RuntimeError("disconnect"), {"Err": "offline"}, {"Error": "offline"}):
            with self.subTest(response=response):
                self.setUp()
                self.start()
                self.transport.pushes.append(response)
                self.api.receive_push_update()
                self.assertFalse(self.api.manual_skip_status["allowed"])
        self.setUp()
        self.start()
        self.transport.heartbeat_response = {"Err": "offline"}
        Clock.now += 31
        self.api.receive_push_update()
        self.assertFalse(self.api.manual_skip_status["allowed"])

    def test_reset_and_cloud_failure_destroy_ownership(self):
        self.start()
        self.api._reset_connection()
        self.assertFalse(self.api.manual_skip_status["allowed"])
        self.setUp()
        self.start()
        self.api._using_cloud = True
        self.assertFalse(self.api._cloud_update())
        self.assertFalse(self.api.manual_skip_status["allowed"])

    def test_failed_other_status_read_cannot_preserve_old_session(self):
        self.start()
        self.transport.responses.append({"Err": "offline"})
        self.assertFalse(self.api._refresh_command_state())
        self.assert_no_write(self.api.skip_current_manual)

    def test_readonly_permission_does_not_query_the_controller(self):
        self.start()
        self.transport.status_override = lambda: (_ for _ in ()).throw(AssertionError("Unexpected I/O"))
        self.assertTrue(self.api.manual_skip_status["allowed"])
        self.assertEqual(len(self.transport.writes), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
