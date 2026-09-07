#!/usr/bin/env python3
"""Offline behavioral checks for the isolated Zone-7 Odd/Even experiment.

Real planning and execution code is loaded without Home Assistant setup. Only
native snapshot collection, fresh-state acquisition, the clock and the transport
writer are replaced. Every unmocked network entry point raises immediately.
"""
from __future__ import annotations

from copy import deepcopy
import importlib
from pathlib import Path
import sys
import threading
import types
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = "_nikas_parity_probe_test"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(ROOT / "custom_components" / "nikas_ho_sc_8w")]
sys.modules[PACKAGE] = package
sys.modules.setdefault("tinytuya", types.ModuleType("tinytuya"))
api_module = importlib.import_module(f"{PACKAGE}.api")
parity_module = importlib.import_module(f"{PACKAGE}.parity_probe_api")
StartProbe = importlib.import_module(f"{PACKAGE}.start_probe_api").StartProbeHOSC8WAPI
Production = importlib.import_module(f"{PACKAGE}.production_api").ProductionHOSC8WAPI


class Probe(parity_module.Zone7ParityProbeMixin, StartProbe):
    """Use the same methods as the installed API without HA registration."""


# Synthetic fixture: 10 min, slots 1/3/5 populated, interval 2, program/rain on.
# Literal expected frames come from the APK field mapping, not the planner.
SOURCE = bytes.fromhex("070A05FF0CFF17FF00FF2DFF3BFF03021A090811")
EXPECTED = {
    "odd": bytes.fromhex("070A05FF0CFF17FF00FF2DFF3BFF010000000011"),
    "even": bytes.fromhex("070A05FF0CFF17FF00FF2DFF3BFF020000000011"),
}
WIRE = {
    "odd": bytes.fromhex("400A05FF0CFF17FF00FF2DFF3BFF010000000011"),
    "even": bytes.fromhex("400A05FF0CFF17FF00FF2DFF3BFF020000000011"),
}


def make_api(source: bytes = SOURCE) -> Probe:
    api = Probe.__new__(Probe)
    api._connected = True
    api._using_cloud = False
    api._command_lock = threading.Lock()
    api._io_lock = threading.RLock()
    api.device = api_module.HOSC8WDevice()
    api.device.operation_mode = "Auto"
    api.device.zone8_hex_probe_trace = {"safety_dps_seen": [101, 107, 108]}
    # Neighbours have distinct durations so a copy-to-all implementation fails.
    api.test_snapshot = {
        zone: {
            "zone": zone,
            "valid": True,
            "raw_hex": (bytes([zone, 20 + zone]) + SOURCE[2:]).hex().upper(),
        }
        for zone in range(1, 9)
    }
    api.test_snapshot[7]["raw_hex"] = source.hex().upper()
    api._require_fresh_command_state = Mock()

    def collect(**kwargs) -> None:
        api.device.zone8_hex_probe_trace = {"safety_dps_seen": [101, 107, 108]}

    api.test_collect = collect
    api._collect_zone8_dp38_samples = Mock(side_effect=collect)
    api._build_full_dp38_snapshot = Mock(side_effect=lambda: deepcopy(api.test_snapshot))
    # No send/receive methods exist: only retry settings can be inspected.
    api.test_transport = types.SimpleNamespace(
        socketRetryLimit=5, retry=True, socket=object()
    )
    api._ensure_connection = Mock(return_value=api.test_transport)
    api._write_command_value = Mock(side_effect=AssertionError("Raw I/O forbidden"))

    def write(block: bytes, zone: int) -> None:
        assert zone == 7 and len(block) == 20 and block[0] == 0x40
        assert api.test_transport.socketRetryLimit == 0
        assert api.test_transport.retry is False
        api.test_snapshot[7]["raw_hex"] = (bytes([7]) + block[1:]).hex().upper()

    api.test_write = write
    api._write_dp38_mask_block = Mock(side_effect=write)
    return api


def prepare(api: Probe, mode: str = "odd") -> dict:
    return api.prepare_zone7_parity(mode)


def execute(api: Probe, plan: dict) -> dict:
    return api.execute_zone7_parity(
        plan["plan_id"], parity_module.ZONE7_PARITY_CONFIRMATION
    )


def alter_byte(api: Probe, zone: int, offset: int, value: int) -> None:
    block = bytearray.fromhex(api.test_snapshot[zone]["raw_hex"])
    block[offset] = value
    api.test_snapshot[zone]["raw_hex"] = block.hex().upper()


class Zone7ParityProbeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.now = 1000.0
        timer = patch.object(parity_module.time, "monotonic", side_effect=lambda: self.now)
        timer.start()
        self.addCleanup(timer.stop)
        sleeper = patch.object(parity_module.time, "sleep", return_value=None)
        sleeper.start()
        self.addCleanup(sleeper.stop)

    def assert_no_write(self, api: Probe) -> None:
        api._write_dp38_mask_block.assert_not_called()
        api._write_command_value.assert_not_called()

    def assert_consumed_and_locked(self, api: Probe, plan: dict) -> None:
        result = api.device.zone7_parity_probe
        self.assertFalse(bool(result.get("verified")))
        self.assertTrue(result["locked"])
        for mode in ("odd", "even"):
            with self.assertRaises((ValueError, RuntimeError, PermissionError)):
                prepare(api, mode)
        with self.assertRaises((ValueError, RuntimeError, PermissionError)):
            execute(api, plan)
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)
        self.assertEqual(api.test_transport.socketRetryLimit, 5)
        self.assertTrue(api.test_transport.retry)

    def test_prepare_exact_apk_bytes_and_zero_writes(self) -> None:
        for mode in ("odd", "even"):
            with self.subTest(mode=mode):
                api = make_api()
                baseline = deepcopy(api.test_snapshot)
                plan = prepare(api, mode)
                self.assertEqual(plan["status"], "prepared")
                self.assertEqual(plan["zone"], 7)
                self.assertEqual(plan["source_read_hex"], SOURCE.hex().upper())
                self.assertEqual(plan["expected_read_hex"], EXPECTED[mode].hex().upper())
                self.assertEqual(plan["write_hex"], WIRE[mode].hex().upper())
                expected = bytes.fromhex(plan["expected_read_hex"])
                self.assertEqual(expected[1:14], SOURCE[1:14])
                self.assertEqual(expected[19], SOURCE[19])
                self.assertEqual(expected[15:19], b"\x00" * 4)
                self.assertEqual(api.test_snapshot, baseline)
                self.assertEqual(
                    api._collect_zone8_dp38_samples.call_args.kwargs["required_zones"],
                    set(range(1, 9)),
                )
                self.assert_no_write(api)

    def test_duration_zero_rejected_even_when_program_disabled(self) -> None:
        for flags in (0x11, 0x01):
            with self.subTest(flags=flags):
                source = bytearray(SOURCE)
                source[1], source[19] = 0, flags
                api = make_api(bytes(source))
                with self.assertRaises((RuntimeError, ValueError)):
                    prepare(api)
                self.assert_no_write(api)

    def test_both_flag_nibbles_preserved_for_every_boolean_combination(self) -> None:
        for flags in (0x00, 0x01, 0x10, 0x11):
            with self.subTest(flags=flags):
                source = SOURCE[:-1] + bytes([flags])
                api = make_api(source)
                result = prepare(api)
                self.assertEqual(bytes.fromhex(result["write_hex"])[19], flags)
                self.assertEqual(bytes.fromhex(result["expected_read_hex"])[19], flags)
                self.assert_no_write(api)

    def test_enabled_without_starts_rejected(self) -> None:
        source = bytearray(SOURCE)
        source[2:14] = b"\xff" * 12
        api = make_api(bytes(source))
        with self.assertRaises((RuntimeError, ValueError)):
            prepare(api)
        self.assert_no_write(api)

    def test_invalid_modes_rejected_without_write(self) -> None:
        for mode in ("weekly", "interval", "", "3", None):
            with self.subTest(mode=mode):
                api = make_api()
                with self.assertRaises((RuntimeError, ValueError, TypeError)):
                    prepare(api, mode)
                self.assert_no_write(api)

    def test_local_transport_required_at_prepare_and_execute(self) -> None:
        for unavailable in ("cloud", "offline"):
            for stage in ("prepare", "execute"):
                with self.subTest(transport=unavailable, stage=stage):
                    api = make_api()
                    plan = prepare(api) if stage == "execute" else None
                    api._using_cloud = unavailable == "cloud"
                    api._connected = unavailable != "offline"
                    with self.assertRaises(RuntimeError):
                        execute(api, plan) if plan else prepare(api)
                    self.assert_no_write(api)

    def test_safety_state_before_and_during_each_preflight(self) -> None:
        for stage in ("prepare", "execute"):
            for timing in ("before", "during"):
                for attr, value in (
                    ("operation_mode", "OFF"),
                    ("operation_mode", "Manual"),
                    ("active_zone", 1),
                    ("queued_zone", 1),
                ):
                    with self.subTest(stage=stage, timing=timing, attr=attr, value=value):
                        api = make_api()
                        plan = prepare(api) if stage == "execute" else None
                        if timing == "before":
                            setattr(api.device, attr, value)
                        else:
                            def safety_changed(**kwargs) -> None:
                                api.test_collect(**kwargs)
                                setattr(api.device, attr, value)

                            api._collect_zone8_dp38_samples.side_effect = safety_changed
                        with self.assertRaises(RuntimeError):
                            execute(api, plan) if plan else prepare(api)
                        self.assert_no_write(api)

    def test_missing_fresh_state_blocks_before_native_collection(self) -> None:
        for stage in ("prepare", "execute"):
            with self.subTest(stage=stage):
                api = make_api()
                plan = prepare(api) if stage == "execute" else None
                calls = api._collect_zone8_dp38_samples.call_count
                api._require_fresh_command_state.side_effect = RuntimeError("State is stale")
                with self.assertRaises(RuntimeError):
                    execute(api, plan) if plan else prepare(api)
                self.assertEqual(api._collect_zone8_dp38_samples.call_count, calls)
                self.assert_no_write(api)

    def test_each_missing_native_safety_dp_blocks(self) -> None:
        for stage in ("prepare", "execute"):
            for missing in (101, 107, 108):
                with self.subTest(stage=stage, missing=missing):
                    api = make_api()
                    plan = prepare(api) if stage == "execute" else None
                    api._collect_zone8_dp38_samples.side_effect = lambda **kwargs: (
                        api.device.zone8_hex_probe_trace.update(
                            safety_dps_seen=[dp for dp in (101, 107, 108) if dp != missing]
                        )
                    )
                    with self.assertRaises(RuntimeError):
                        execute(api, plan) if plan else prepare(api)
                    self.assert_no_write(api)

    def test_incomplete_or_invalid_baseline_never_arms_write(self) -> None:
        for error in ("missing", "bad_length", "wrong_zone", "invalid_slot", "stale", "invalid"):
            with self.subTest(error=error):
                api = make_api()
                if error == "missing":
                    del api.test_snapshot[4]
                elif error == "bad_length":
                    api.test_snapshot[3]["raw_hex"] = "03"
                elif error == "wrong_zone":
                    alter_byte(api, 2, 0, 5)
                elif error == "invalid_slot":
                    alter_byte(api, 1, 2, 24)
                elif error == "stale":
                    api.test_snapshot[1]["fresh"] = False
                else:
                    api.test_snapshot[1]["valid"] = False
                with self.assertRaises((RuntimeError, ValueError, KeyError)):
                    prepare(api)
                self.assert_no_write(api)

    def test_changed_target_or_any_neighbour_blocks_execution(self) -> None:
        for zone in range(1, 9):
            with self.subTest(zone=zone):
                api = make_api()
                plan = prepare(api)
                alter_byte(api, zone, 1, 99)
                with self.assertRaises(RuntimeError):
                    execute(api, plan)
                self.assert_no_write(api)

    def test_expiry_before_execute_and_during_collection(self) -> None:
        for timing in ("before", "during"):
            with self.subTest(timing=timing):
                api = make_api()
                plan = prepare(api)
                if timing == "before":
                    self.now += parity_module.ZONE7_PARITY_PLAN_TTL + 1
                else:
                    def expire(**kwargs) -> None:
                        api.test_collect(**kwargs)
                        self.now += parity_module.ZONE7_PARITY_PLAN_TTL + 1
                    api._collect_zone8_dp38_samples.side_effect = expire
                with self.assertRaises(RuntimeError):
                    execute(api, plan)
                self.assertEqual(api.device.zone7_parity_probe["status"], "expired")
                self.assert_no_write(api)

    def test_wrong_token_and_wrong_confirmation_send_nothing(self) -> None:
        for wrong_token in (True, False):
            with self.subTest(wrong_token=wrong_token):
                api = make_api()
                plan = prepare(api)
                with self.assertRaises((RuntimeError, ValueError, PermissionError)):
                    api.execute_zone7_parity(
                        "wrong" if wrong_token else plan["plan_id"],
                        parity_module.ZONE7_PARITY_CONFIRMATION if wrong_token else "wrong",
                    )
                self.assert_no_write(api)

    def test_new_prepare_invalidates_previous_token(self) -> None:
        api = make_api()
        first = prepare(api, "odd")
        second = prepare(api, "even")
        self.assertNotEqual(first["plan_id"], second["plan_id"])
        with self.assertRaises((RuntimeError, ValueError, PermissionError)):
            execute(api, first)
        self.assert_no_write(api)

    def test_preview_mutation_cannot_replace_private_write_authority(self) -> None:
        api = make_api()
        plan = prepare(api)
        plan["write_hex"] = "80" + WIRE["even"].hex()[2:]
        plan["expected_read_hex"] = EXPECTED["even"].hex()
        api.device.zone7_parity_probe["write_hex"] = plan["write_hex"]
        api.device.zone7_parity_probe["expected_read_hex"] = plan["expected_read_hex"]
        result = execute(api, plan)
        self.assertTrue(result["verified"])
        self.assertEqual(api._write_dp38_mask_block.call_args.args[0], WIRE["odd"])
        self.assertEqual(result["actual_read_hex"], EXPECTED["odd"].hex().upper())

    def test_other_command_lock_blocks_prepare_and_execution(self) -> None:
        for stage in ("prepare", "execute"):
            with self.subTest(stage=stage):
                api = make_api()
                plan = prepare(api) if stage == "execute" else None
                api._command_lock.acquire()
                try:
                    with self.assertRaises(RuntimeError):
                        execute(api, plan) if plan else prepare(api)
                    self.assert_no_write(api)
                finally:
                    api._command_lock.release()

    def test_exact_full8_readback_single_write_and_single_use(self) -> None:
        for mode in ("odd", "even"):
            with self.subTest(mode=mode):
                api = make_api()
                baseline = deepcopy(api.test_snapshot)
                plan = prepare(api, mode)
                result = execute(api, plan)
                self.assertTrue(result["verified"])
                self.assertEqual(result["status"], "verified")
                self.assertEqual(result["actual_read_hex"], EXPECTED[mode].hex().upper())
                self.assertEqual(result["collateral_changed_zones"], [])
                self.assertEqual(api._write_dp38_mask_block.call_count, 1)
                args, kwargs = api._write_dp38_mask_block.call_args
                self.assertEqual(args[0], WIRE[mode])
                self.assertEqual(kwargs.get("zone", args[1] if len(args) > 1 else None), 7)
                self.assertEqual(api._collect_zone8_dp38_samples.call_count, 3)
                self.assertEqual(api.test_transport.socketRetryLimit, 5)
                self.assertTrue(api.test_transport.retry)
                for zone in (1, 2, 3, 4, 5, 6, 8):
                    self.assertEqual(api.test_snapshot[zone], baseline[zone])
                with self.assertRaises((RuntimeError, ValueError, PermissionError)):
                    execute(api, plan)
                self.assertEqual(api._write_dp38_mask_block.call_count, 1)

    def test_target_mismatch_consumes_and_locks(self) -> None:
        api = make_api()
        plan = prepare(api)
        api._write_dp38_mask_block.side_effect = None
        with self.assertRaises(RuntimeError):
            execute(api, plan)
        self.assertEqual(api.device.schedule_blocks[7], SOURCE)
        self.assert_consumed_and_locked(api, plan)

    def test_collateral_change_consumes_and_locks(self) -> None:
        api = make_api()
        plan = prepare(api)

        def collateral(block: bytes, zone: int) -> None:
            api.test_write(block, zone)
            alter_byte(api, 4, 1, 99)

        api._write_dp38_mask_block.side_effect = collateral
        with self.assertRaises(RuntimeError):
            execute(api, plan)
        self.assertIn(4, api.device.zone7_parity_probe["collateral_changed_zones"])
        self.assertEqual(api.device.schedule_blocks[4][1], 99)
        self.assert_consumed_and_locked(api, plan)

    def test_postdispatch_read_failure_consumes_and_locks(self) -> None:
        for outcome in ("timeout", "missing_zone"):
            with self.subTest(outcome=outcome):
                api = make_api()
                plan = prepare(api)

                def failed_read(**kwargs) -> None:
                    api.test_collect(**kwargs)
                    if api._write_dp38_mask_block.call_count:
                        if outcome == "timeout":
                            api.device.zone8_hex_probe_samples = [{
                                "station": 7,
                                "raw_hex": api.test_snapshot[7]["raw_hex"],
                            }]
                            raise RuntimeError("Native receive timed out")
                        del api.test_snapshot[8]

                api._collect_zone8_dp38_samples.side_effect = failed_read
                with self.assertRaises((RuntimeError, ValueError, KeyError)):
                    execute(api, plan)
                if outcome == "timeout":
                    observations = api.device.zone7_parity_probe["after_snapshot"]
                    self.assertEqual(len(observations), 1)
                    self.assertEqual(observations[0]["zone"], 7)
                    self.assertEqual(observations[0]["raw_hex"], EXPECTED["odd"].hex().upper())
                    self.assertEqual(api.device.schedule_blocks[7], EXPECTED["odd"])
                self.assert_consumed_and_locked(api, plan)

    def test_send_exception_consumes_and_locks_even_without_ack(self) -> None:
        api = make_api()
        plan = prepare(api)

        def lost_ack(block: bytes, zone: int) -> None:
            api.test_write(block, zone)
            raise OSError("Ack lost after transport accepted bytes")

        api._write_dp38_mask_block.side_effect = lost_ack
        with self.assertRaises((RuntimeError, OSError)):
            execute(api, plan)
        self.assertEqual(api.device.zone7_parity_probe["status"], "uncertain")
        self.assertEqual(api.device.zone7_parity_probe["after_snapshot"], [])
        self.assert_consumed_and_locked(api, plan)

    def test_noop_has_no_executable_token_and_no_write(self) -> None:
        for mode in ("odd", "even"):
            with self.subTest(mode=mode):
                api = make_api(EXPECTED[mode])
                result = prepare(api, mode)
                self.assertEqual(result["status"], "noop")
                self.assertFalse(result.get("plan_id"))
                self.assert_no_write(api)

    def test_explicit_odd_then_even_are_separate_transactions(self) -> None:
        api = make_api()
        first = prepare(api, "odd")
        self.assertTrue(execute(api, first)["verified"])
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)
        second = prepare(api, "even")
        self.assertNotEqual(first["plan_id"], second["plan_id"])
        self.assertEqual(second["source_read_hex"], EXPECTED["odd"].hex().upper())
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)
        self.assertTrue(execute(api, second)["verified"])
        self.assertEqual(api._write_dp38_mask_block.call_count, 2)
        self.assertEqual(api.test_snapshot[7]["raw_hex"], EXPECTED["even"].hex().upper())

    def test_production_odd_even_remain_blocked(self) -> None:
        for zone in range(1, 9):
            for mode in ("odd", "even"):
                with self.subTest(zone=zone, mode=mode):
                    api = make_api()
                    api._normalize_schedule_patch = Production._normalize_schedule_patch
                    with self.assertRaisesRegex(ValueError, "field verification"):
                        Production.apply_zone_schedule(api, zone, {"cycle_mode": mode})
                    self.assert_no_write(api)


if __name__ == "__main__":
    unittest.main()
