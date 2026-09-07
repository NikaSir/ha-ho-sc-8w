#!/usr/bin/env python3
"""Execute production HA adapter methods without starting Home Assistant.

AST selection avoids importing HA setup/platform dependencies; method bodies are
compiled unchanged. Only HA services/executor/entity publication are stubbed.
"""
from __future__ import annotations

import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import unittest

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components" / "nikas_ho_sc_8w"


class HAError(Exception):
    pass


def load_methods(filename, names, namespace, class_name=None):
    path = COMPONENT / filename
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    scope = tree.body if class_name is None else next(
        item for item in tree.body if isinstance(item, ast.ClassDef) and item.name == class_name
    ).body
    methods = [item for item in scope if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name in names]
    assert {item.name for item in methods} == set(names)
    module = ast.Module(body=[ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0), *methods], type_ignores=[])
    exec(compile(ast.fix_missing_locations(module), str(path), "exec"), namespace)
    return {name: namespace[name] for name in names}


COORDINATOR_METHODS = (
    "async_start_manual_queue", "async_stop_manual", "async_skip_current_manual", "async_resume_automatic",
)
Coordinator = type("Coordinator", (), load_methods(
    "coordinator.py", COORDINATOR_METHODS, {}, "HOSC8WCoordinator",
))
Sensor = type("Sensor", (), load_methods(
    "sensor.py", ("_effective_bitmask", "extra_state_attributes"), {"NUM_ZONES": 8}, "HOSC8WActiveZones",
))
setup = {"HomeAssistantError": HAError, "_coordinator_for_call": lambda hass, call: hass.coordinator,
         "vol": SimpleNamespace(Invalid=ValueError), "NUM_PRODUCTION_ZONES": 8}
load_methods("__init__.py", ("_async_skip_current_manual", "_validate_manual_intent_zone"), setup)


def fixture(fail=False):
    coordinator = Coordinator()
    coordinator._transport_lock = asyncio.Lock()
    writes, publications = [], []
    api = SimpleNamespace(
        device=SimpleNamespace(active_zone=2, operation_mode="Manual", zone_countdown={}),
        manual_skip_status={"allowed": True, "active_zone": 2, "session_id": "current-token"},
    )
    for name in COORDINATOR_METHODS:
        def operation(*args, name=name):
            assert coordinator._transport_lock.locked()
            writes.append((name, args))
            if fail:
                api.manual_skip_status = {"allowed": False, "reason": "Fresh state unavailable"}
                raise RuntimeError("Unconfirmed command")
            return {"verified": True}
        setattr(api, name.removeprefix("async_"), operation)
    async def executor(callback, *args):
        return callback(*args)
    coordinator.hass = SimpleNamespace(async_add_executor_job=executor)
    coordinator.api = api
    sensor = Sensor()
    sensor.coordinator = coordinator
    coordinator.async_set_updated_data = lambda device: publications.append((device, sensor.extra_state_attributes))
    return coordinator, sensor, writes, publications


class AdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_service_forwards_exact_intent_through_coordinator(self):
        coordinator, _, writes, publications = fixture()
        await setup["_async_skip_current_manual"](
            SimpleNamespace(coordinator=coordinator),
            SimpleNamespace(data={"expected_zone": 2, "expected_session_id": "current-token"}),
        )
        self.assertEqual(writes, [("async_skip_current_manual", (2, "current-token"))])
        self.assertEqual(len(publications), 1)
        self.assertFalse(coordinator._transport_lock.locked())

    async def test_optional_service_intent_preserves_existing_callers(self):
        coordinator, _, writes, _ = fixture()
        await setup["_async_skip_current_manual"](
            SimpleNamespace(coordinator=coordinator), SimpleNamespace(data={}),
        )
        self.assertEqual(writes, [("async_skip_current_manual", (None, None))])

    async def test_error_conversion_also_publishes_revoked_session(self):
        coordinator, _, _, publications = fixture(fail=True)
        with self.assertRaisesRegex(HAError, "Unconfirmed command"):
            await setup["_async_skip_current_manual"](
                SimpleNamespace(coordinator=coordinator),
                SimpleNamespace(data={"expected_zone": 2, "expected_session_id": "stale-token"}),
            )
        self.assertFalse(publications[0][1]["manual_skip_allowed"])
        self.assertEqual(publications[0][1]["manual_session_id"], "")
        self.assertIsNone(publications[0][1]["manual_skip_zone"])
        self.assertFalse(coordinator._transport_lock.locked())

    async def test_every_manual_action_publishes_failure_and_releases_lock(self):
        for name in COORDINATOR_METHODS:
            with self.subTest(action=name):
                coordinator, _, _, publications = fixture(fail=True)
                args = ({2: 5},) if name == "async_start_manual_queue" else ()
                with self.assertRaisesRegex(RuntimeError, "Unconfirmed command"):
                    await getattr(coordinator, name)(*args)
                self.assertEqual(len(publications), 1)
                self.assertIs(publications[0][0], coordinator.api.device)
                self.assertFalse(publications[0][1]["manual_skip_allowed"])
                self.assertFalse(coordinator._transport_lock.locked())

    def test_sensor_exports_exact_guard_and_denies_missing_permission(self):
        coordinator, sensor, _, _ = fixture()
        attrs = sensor.extra_state_attributes
        self.assertEqual((attrs["manual_skip_allowed"], attrs["manual_skip_zone"], attrs["manual_session_id"]),
                         (True, 2, "current-token"))
        del coordinator.api.manual_skip_status
        self.assertFalse(sensor.extra_state_attributes["manual_skip_allowed"])
        coordinator.api.manual_skip_status = {"allowed": "true"}
        self.assertFalse(sensor.extra_state_attributes["manual_skip_allowed"])

    def test_intent_zone_rejects_coercion(self):
        validate = setup["_validate_manual_intent_zone"]
        for zone in range(1, 9):
            self.assertEqual(validate(zone), zone)
        for zone in (True, False, 2.9, 2.0, "2", None, 0, 9):
            with self.subTest(zone=zone), self.assertRaises(ValueError):
                validate(zone)


if __name__ == "__main__":
    unittest.main(verbosity=2)
