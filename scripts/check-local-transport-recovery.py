#!/usr/bin/env python3
"""Exercise local transport recovery with synthetic TinyTuya responses only."""
from __future__ import annotations

import ast
from pathlib import Path
from types import SimpleNamespace
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
API_PATH = ROOT / "custom_components" / "nikas_ho_sc_8w" / "api.py"
COORDINATOR_PATH = ROOT / "custom_components" / "nikas_ho_sc_8w" / "coordinator.py"


def load_api_class():
    tree = ast.parse(API_PATH.read_text(encoding="utf-8"), filename=str(API_PATH))
    class_node = next(
        item for item in tree.body
        if isinstance(item, ast.ClassDef) and item.name == "HOSC8WAPI"
    )
    names = {
        "receive_push_update",
        "_is_transport_error",
        "_record_transport_error",
        "_on_transport_error",
        "_reset_connection",
    }
    methods = [
        item for item in class_node.body
        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))
        and item.name in names
    ]
    assert {item.name for item in methods} == names
    module = ast.Module(body=methods, type_ignores=[])
    namespace = {
        "Any": object,
        "LOCAL_TRANSPORT_ERROR_LIMIT": 3,
        "_LOGGER": SimpleNamespace(debug=lambda *args: None, warning=lambda *args: None),
        "time": SimpleNamespace(monotonic=lambda: 100.0),
    }
    exec(compile(ast.fix_missing_locations(module), str(API_PATH), "exec"), namespace)
    return type("API", (), {name: namespace[name] for name in names})


API = load_api_class()


class FakeTuya:
    def __init__(self, responses, heartbeats=None):
        self.responses = iter(responses)
        self.heartbeats = iter(heartbeats or [{}])
        self.closed = False

    def receive(self):
        return next(self.responses)

    def heartbeat(self):
        return next(self.heartbeats)

    def close(self):
        self.closed = True


def fixture(responses, heartbeats=None):
    api = API()
    api._io_lock = threading.RLock()
    api._tuya = FakeTuya(responses, heartbeats)
    api._connected = True
    api._fail_count = 0
    api._device_ip = "192.0.2.8"
    api._last_heartbeat = 100.0
    api._heartbeat_interval = 30.0
    updates = []
    api.device = SimpleNamespace(
        online=True,
        update_from_dps=lambda dps: updates.append(dps),
    )
    return api, api._tuya, updates


class LocalTransportRecoveryTests(unittest.TestCase):
    def test_three_wire_errors_close_socket_and_mark_offline(self):
        api, socket, _ = fixture([
            {"Err": 905, "Error": "Network Error"},
            {"Error": "Network Error"},
            {"error": "Network Error"},
        ])
        self.assertFalse(api.receive_push_update())
        self.assertFalse(api.receive_push_update())
        self.assertTrue(api._connected)
        self.assertEqual(api._fail_count, 2)
        self.assertFalse(api.receive_push_update())
        self.assertTrue(socket.closed)
        self.assertFalse(api._connected)
        self.assertIsNone(api._tuya)
        self.assertFalse(api.device.online)

    def test_empty_push_is_not_a_transport_failure(self):
        api, socket, _ = fixture([None, {}])
        self.assertFalse(api.receive_push_update())
        self.assertFalse(api.receive_push_update())
        self.assertEqual(api._fail_count, 0)
        self.assertTrue(api._connected)
        self.assertFalse(socket.closed)
        self.assertTrue(api.device.online)

    def test_heartbeat_errors_use_same_bounded_recovery(self):
        api, socket, _ = fixture(
            [None, None, None],
            [{"Err": 905}, {"Error": "Network Error"}, {"error": "timeout"}],
        )
        api._heartbeat_interval = 0.0
        for _ in range(3):
            self.assertFalse(api.receive_push_update())
        self.assertTrue(socket.closed)
        self.assertFalse(api.device.online)

    def test_valid_dps_restores_state_and_clears_failure_streak(self):
        api, _, updates = fixture([
            {"Err": 905},
            {"dps": {"101": "Auto", "107": 0}},
        ])
        self.assertFalse(api.receive_push_update())
        self.assertEqual(api._fail_count, 1)
        self.assertTrue(api.receive_push_update())
        self.assertEqual(api._fail_count, 0)
        self.assertTrue(api.device.online)
        self.assertEqual(updates, [{"101": "Auto", "107": 0}])

    def test_coordinator_publishes_loss_before_scheduling_retry(self):
        tree = ast.parse(
            COORDINATOR_PATH.read_text(encoding="utf-8"),
            filename=str(COORDINATOR_PATH),
        )
        class_node = next(
            item for item in tree.body
            if isinstance(item, ast.ClassDef) and item.name == "HOSC8WCoordinator"
        )
        method = next(
            item for item in class_node.body
            if isinstance(item, ast.AsyncFunctionDef)
            and item.name == "_async_run_transport"
        )
        source = ast.get_source_segment(COORDINATOR_PATH.read_text(encoding="utf-8"), method)
        loss_branch = source.split(
            "if self.api.active_transport == CONNECTION_MODE_LOCAL:", 1
        )[1].split("if transport == CONNECTION_MODE_CLOUD:", 1)[0]
        self.assertLess(
            loss_branch.index("self.async_set_updated_data(self.api.device)"),
            loss_branch.index("next_local_attempt = time.monotonic() + local_failure_delay"),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
