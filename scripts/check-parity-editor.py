#!/usr/bin/env python3
"""Offline production Odd/Even contracts; every possible transport is a stub."""
from __future__ import annotations

from copy import deepcopy
from datetime import date
import importlib
from pathlib import Path
import sys
import threading
import types
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = "_nikas_parity_editor_test"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(ROOT / "custom_components" / "nikas_ho_sc_8w")]
sys.modules[PACKAGE] = package
sys.modules.setdefault("tinytuya", types.ModuleType("tinytuya"))
api_module = importlib.import_module(f"{PACKAGE}.api")
production = importlib.import_module(f"{PACKAGE}.production_api")
parity = importlib.import_module(f"{PACKAGE}.parity_probe_api")
transaction = importlib.import_module(f"{PACKAGE}.dp38_transaction")
Production = production.ProductionHOSC8WAPI

# Physical report 2026-09-07: disabled Odd with 2 min/no starts and enabled
# Even with 2 min/start 14:24. Literal wire/read packets, not planner output.
FIELD_CASES = (
    ("odd", "0702FFFFFFFFFFFFFFFFFFFFFFFF03021A090601",
     "4002FFFFFFFFFFFFFFFFFFFFFFFF010000000001",
     "0702FFFFFFFFFFFFFFFFFFFFFFFF010000000001"),
    ("even", "07020EFFFFFFFFFF18FFFFFFFFFF010000000011",
     "40020EFFFFFFFFFF18FFFFFFFFFF020000000011",
     "07020EFFFFFFFFFF18FFFFFFFFFF020000000011"),
)
SOURCE = bytes.fromhex("070A05FF0CFF17FF00FF2DFF3BFF03021A090811")


class Today(date):
    @classmethod
    def today(cls):
        return cls(2026, 9, 7)


class API(parity.Zone7ParityProbeMixin, Production):
    pass


def make_api(source: bytes = SOURCE) -> API:
    api = API.__new__(API)
    api._connected = True
    api._using_cloud = False
    api._command_lock = threading.Lock()
    api._io_lock = threading.RLock()
    api.device = api_module.HOSC8WDevice()
    api.device.operation_mode = "Auto"
    api.snapshots = {
        z: {"zone": z, "fresh": True, "valid": True,
            "raw_hex": (bytes([z, z + 20]) + SOURCE[2:]).hex().upper()}
        for z in range(1, 9)
    }
    api.snapshots[7]["raw_hex"] = source.hex().upper()
    api._require_fresh_command_state = Mock()

    def collect(**kwargs):
        api.device.zone8_hex_probe_trace = {"safety_dps_seen": [101, 107, 108]}

    api.collect = collect
    api._collect_zone8_dp38_samples = Mock(side_effect=collect)
    api._build_full_dp38_snapshot = Mock(side_effect=lambda: deepcopy(api.snapshots))
    api.transport = types.SimpleNamespace(socket=object(), socketRetryLimit=5, retry=True)
    api._ensure_connection = Mock(return_value=api.transport)
    api._write_command_value = Mock(side_effect=AssertionError("Real I/O forbidden"))

    def write(block, zone):
        assert block[0] == 1 << (zone - 1) and len(block) == 20
        assert api.transport.socketRetryLimit == 0 and api.transport.retry is False
        api.snapshots[zone]["raw_hex"] = (bytes([zone]) + block[1:]).hex().upper()

    api.write = write
    api._write_dp38_mask_block = Mock(side_effect=write)
    return api


def change(api, zone, offset, value):
    block = bytearray.fromhex(api.snapshots[zone]["raw_hex"])
    block[offset] = value
    api.snapshots[zone]["raw_hex"] = block.hex().upper()


class ProductionParityTests(unittest.TestCase):
    def setUp(self):
        for context in (patch.object(production, "date", Today), patch.object(production.time, "sleep")):
            context.start()
            self.addCleanup(context.stop)

    def assert_no_write(self, api):
        api._write_dp38_mask_block.assert_not_called()
        api._write_command_value.assert_not_called()

    def test_literal_field_packets_exact_and_all_neighbours_unchanged(self):
        for mode, source, wire, expected in FIELD_CASES:
            with self.subTest(mode=mode):
                api = make_api(bytes.fromhex(source))
                baseline = deepcopy(api.snapshots)
                result = api.apply_zone_schedule(7, {"cycle_mode": mode})
                self.assertTrue(result["verified"])
                self.assertEqual(result["writes_performed"], 1)
                self.assertEqual(result["write_hex"], wire)
                self.assertEqual(result["actual_read_hex"], expected)
                self.assertEqual(result["expected_read_hex"], expected)
                self.assertEqual(result["changed_zones"], [7])
                self.assertEqual(result["unchanged_zones"], [1, 2, 3, 4, 5, 6, 8])
                self.assertEqual(len(result["before_snapshot"]), 8)
                self.assertEqual(len(result["after_snapshot"]), 8)
                self.assertEqual(api._write_dp38_mask_block.call_count, 1)
                for z in (1, 2, 3, 4, 5, 6, 8):
                    self.assertEqual(api.snapshots[z], baseline[z])
                self.assertEqual((api.transport.socketRetryLimit, api.transport.retry), (5, True))

    def test_all_zone_masks_and_six_positional_banks_preserved(self):
        for zone in range(1, 9):
            for mode, rawmode in (("odd", 1), ("even", 2)):
                with self.subTest(zone=zone, mode=mode):
                    api = make_api()
                    source = bytes.fromhex(api.snapshots[zone]["raw_hex"])
                    result = api.apply_zone_schedule(zone, {"cycle_mode": mode})
                    wire = bytes.fromhex(result["write_hex"])
                    self.assertEqual(wire[0], 1 << (zone - 1))
                    self.assertEqual(wire[1:14], source[1:14])
                    self.assertEqual(wire[14:19], bytes([rawmode, 0, 0, 0, 0]))
                    self.assertEqual(wire[19], source[19])

    def test_every_calendar_transition_uses_explicit_valid_fields(self):
        sources = {"weekly": bytes([0, 0x55, 0, 0, 0]),
                   "odd": bytes([1, 0, 0, 0, 0]), "even": bytes([2, 0, 0, 0, 0]),
                   "interval": bytes([3, 2, 26, 9, 8])}
        for initial, calendar in sources.items():
            for target in sources:
                with self.subTest(initial=initial, target=target):
                    source = SOURCE[:14] + calendar + SOURCE[19:]
                    api = make_api(source)
                    draft = {"cycle_mode": target}
                    if target == "weekly":
                        draft["weekdays"] = ["mon", "wed", "fri"]
                    if target == "interval":
                        draft.update(interval_days=3, anchor_date="2026-09-09")
                    result = api.apply_zone_schedule(7, draft)
                    expected = bytes.fromhex(result["expected_read_hex"])
                    self.assertEqual(expected[:14], source[:14])
                    self.assertEqual(expected[19], source[19])
                    if target in ("odd", "even"):
                        self.assertEqual(expected[14:19], sources[target])
                    elif target == "weekly":
                        self.assertEqual(expected[14:16], bytes([0, 0x2A]))
                        self.assertEqual(expected[16:19], source[16:19])
                    else:
                        self.assertEqual(expected[14:19], bytes([3, 3, 26, 9, 9]))

    def test_noncanonical_parity_requires_explicit_calendar_edit(self):
        for mode in (1, 2):
            source = SOURCE[:14] + bytes([mode, 0x7F, 26, 9, 3]) + SOURCE[19:]
            api = make_api(source)
            with self.assertRaisesRegex(ValueError, "zero period/date"):
                api.apply_zone_schedule(7, {"duration_minutes": 11})
            self.assert_no_write(api)
            self.assertEqual(bytes.fromhex(api.snapshots[7]["raw_hex"]), source)
            result = api.apply_zone_schedule(7, {"cycle_mode": "odd" if mode == 1 else "even", "duration_minutes": 11})
            expected = bytes.fromhex(result["expected_read_hex"])
            self.assertEqual(expected[14:19], bytes([mode, 0, 0, 0, 0]))
            self.assertEqual(expected[1], 11)

    def test_opaque_weekly_anchor_is_preserved_on_unrelated_edits(self):
        source = SOURCE[:14] + bytes([0, 0x7F, 26, 9, 3]) + SOURCE[19:]
        result = make_api(source).apply_zone_schedule(7, {"duration_minutes": 11})
        self.assertEqual(bytes.fromhex(result["expected_read_hex"])[14:19], source[14:19])

    def test_interval_transition_requires_real_future_date_and_interval(self):
        source = bytes.fromhex(FIELD_CASES[1][3])
        drafts = (
            {"cycle_mode": "interval"},
            {"cycle_mode": "interval", "interval_days": 2},
            {"cycle_mode": "interval", "anchor_date": "2026-09-08"},
            {"cycle_mode": "interval", "interval_days": 2, "anchor_date": "2026-09-06"},
            {"cycle_mode": "interval", "interval_days": 2, "anchor_date": "2026-02-30"},
            {"cycle_mode": "interval", "interval_days": 0, "anchor_date": "2026-09-08"},
        )
        for draft in drafts:
            with self.subTest(draft=draft):
                api = make_api(source)
                with self.assertRaises(ValueError):
                    api.apply_zone_schedule(7, draft)
                self.assert_no_write(api)

    def test_historical_interval_anchor_preserved_but_cannot_be_changed_to_past(self):
        source = SOURCE[:16] + bytes([26, 7, 19]) + SOURCE[19:]
        for draft in ({"duration_minutes": 11}, {"duration_minutes": 11, "anchor_date": "2026-07-19"}):
            api = make_api(source)
            result = api.apply_zone_schedule(7, draft)
            self.assertEqual(bytes.fromhex(result["expected_read_hex"])[16:19], source[16:19])
        api = make_api(source)
        with self.assertRaisesRegex(ValueError, "today"):
            api.apply_zone_schedule(7, {"anchor_date": "2026-07-20"})
        self.assert_no_write(api)

    def test_conflicting_calendar_fields_rejected_including_implicit_current_mode(self):
        for mode in ("weekly", "odd", "even"):
            for extra in ({"anchor_date": "2026-09-08"}, {"interval_days": 2}):
                with self.subTest(mode=mode, extra=extra):
                    api = make_api()
                    draft = {"cycle_mode": mode, **extra}
                    if mode == "weekly":
                        draft["weekdays"] = ["mon"]
                    with self.assertRaises(ValueError):
                        api.apply_zone_schedule(7, draft)
                    self.assert_no_write(api)
        for mode in ("odd", "even", "interval"):
            api = make_api()
            with self.assertRaises(ValueError):
                api.apply_zone_schedule(7, {"cycle_mode": mode, "weekdays": ["mon"]})
            self.assert_no_write(api)
        api = make_api(bytes.fromhex(FIELD_CASES[1][3]))
        with self.assertRaises(ValueError):
            api.apply_zone_schedule(7, {"anchor_date": "2026-09-08"})
        self.assert_no_write(api)

    def test_zero_duration_blocked_for_parity_even_when_disabled(self):
        for enabled in (False, True):
            for mode in ("odd", "even"):
                api = make_api()
                with self.assertRaisesRegex(ValueError, "1 minute"):
                    api.apply_zone_schedule(7, {"cycle_mode": mode, "program_enabled": enabled, "duration_minutes": 0})
                self.assert_no_write(api)

    def test_enabled_zero_duration_or_no_start_blocked_for_every_mode(self):
        for mode, raw in (("weekly", 0), ("odd", 1), ("even", 2), ("interval", 3)):
            for no_starts in (False, True):
                with self.subTest(mode=mode, no_starts=no_starts):
                    source = bytearray(SOURCE)
                    source[14] = raw
                    source[15] = 0x7F if raw == 0 else (2 if raw == 3 else 0)
                    api = make_api(bytes(source))
                    draft = {"program_enabled": True}
                    draft.update({"start_times": []} if no_starts else {"duration_minutes": 0})
                    with self.assertRaises(ValueError):
                        api.apply_zone_schedule(7, draft)
                    self.assert_no_write(api)

    def test_disabled_parity_no_starts_with_positive_duration_allowed(self):
        api = make_api(bytes.fromhex(FIELD_CASES[0][1]))
        self.assertTrue(api.apply_zone_schedule(7, {"cycle_mode": "odd"})["verified"])
        self.assertEqual(api.snapshots[7]["raw_hex"], FIELD_CASES[0][3])

    def test_replacing_slots_keeps_later_slot_indices_and_flags(self):
        api = make_api(bytes.fromhex(FIELD_CASES[1][3]))
        result = api.apply_zone_schedule(7, {"start_times": [None, "06:17", None, "15:42", "", "23:59"]})
        block = bytes.fromhex(result["expected_read_hex"])
        self.assertEqual(block[2:8], bytes([255, 6, 255, 15, 255, 23]))
        self.assertEqual(block[8:14], bytes([255, 17, 255, 42, 255, 59]))
        self.assertEqual(block[14:20], bytes.fromhex("020000000011"))

    def test_flags_patch_preserves_other_nibble_and_calendar(self):
        for flags in (0x00, 0x01, 0x10, 0x11):
            for field in ("program_enabled", "rain_sensor_follow"):
                with self.subTest(flags=flags, field=field):
                    source = SOURCE[:14] + bytes([2, 0, 0, 0, 0, flags])
                    result = make_api(source).apply_zone_schedule(7, {field: True})
                    target = bytes.fromhex(result["expected_read_hex"])
                    self.assertEqual(target[:19], source[:19])
                    expected_flags = (flags & 0x0F) | 0x10 if field == "program_enabled" else (flags & 0xF0) | 1
                    self.assertEqual(target[19], expected_flags)

    def test_validation_rejects_fractional_boolean_and_unknown_inputs(self):
        for draft in ({"duration_minutes": 1.5}, {"duration_minutes": True},
                      {"cycle_mode": "mystery"}, {"unknown": 1}, {"start_times": [False]},
                      {"start_times": ["25:00"]}, {"program_enabled": 1}):
            with self.subTest(draft=draft):
                api = make_api()
                with self.assertRaises(ValueError):
                    api.apply_zone_schedule(7, draft)
                self.assert_no_write(api)

    def test_zone_validation_rejects_fractional_and_boolean_values(self):
        for zone in (7.9, True, False, "7.9", 0, 9):
            api = make_api()
            with self.assertRaises(ValueError):
                api.apply_zone_schedule(zone, {"cycle_mode": "odd"})
            self.assert_no_write(api)

    def test_unknown_source_mode_requires_explicit_supported_override(self):
        source = SOURCE[:14] + bytes([99]) + SOURCE[15:]
        api = make_api(source)
        with self.assertRaises(ValueError):
            api.apply_zone_schedule(7, {"duration_minutes": 12})
        self.assert_no_write(api)
        self.assertTrue(api.apply_zone_schedule(7, {"cycle_mode": "odd"})["verified"])

    def test_noop_has_zero_dispatch_and_full_fresh_baseline(self):
        api = make_api(bytes.fromhex(FIELD_CASES[1][3]))
        result = api.apply_zone_schedule(7, {"cycle_mode": "even"})
        self.assertFalse(result["changed"])
        self.assertEqual(result["writes_performed"], 0)
        self.assertEqual(len(result["before_snapshot"]), 8)
        self.assert_no_write(api)

    def test_no_partial_stale_invalid_or_ambiguous_preflight(self):
        for case in ("missing", "stale", "invalid", "malformed", "ambiguous"):
            with self.subTest(case=case):
                api = make_api()
                if case == "missing":
                    del api.snapshots[1]
                elif case in {"stale", "invalid"}:
                    api.snapshots[1]["fresh" if case == "stale" else "valid"] = False
                elif case == "malformed":
                    api.snapshots[2]["raw_hex"] = "02"
                else:
                    api._build_full_dp38_snapshot.side_effect = RuntimeError("multiple variants")
                with self.assertRaises((RuntimeError, ValueError)):
                    api.apply_zone_schedule(7, {"cycle_mode": "odd"})
                self.assert_no_write(api)
                self.assertFalse(getattr(api, "_production_schedule_locked", False))

    def test_each_safety_dp_and_state_races_block_before_dispatch(self):
        for case in (101, 107, 108, "active", "queued", "off", "cloud"):
            with self.subTest(case=case):
                api = make_api()
                def collect(**kwargs):
                    api.collect(**kwargs)
                    if isinstance(case, int):
                        api.device.zone8_hex_probe_trace["safety_dps_seen"].remove(case)
                    elif case == "active":
                        api.device.active_zone = 1
                    elif case == "queued":
                        api.device.queued_zone = 2
                    elif case == "off":
                        api.device.operation_mode = "off"
                    else:
                        api._using_cloud = True
                api._collect_zone8_dp38_samples.side_effect = collect
                with self.assertRaises(RuntimeError):
                    api.apply_zone_schedule(7, {"cycle_mode": "odd"})
                self.assert_no_write(api)

    def test_fresh_state_or_concurrent_command_blocks_write(self):
        for busy in (False, True):
            api = make_api()
            if busy:
                api._command_lock.acquire()
            else:
                api._require_fresh_command_state.side_effect = RuntimeError("stale")
            with self.assertRaises(RuntimeError):
                api.apply_zone_schedule(7, {"cycle_mode": "odd"})
            self.assert_no_write(api)
            if busy:
                api._command_lock.release()

    def assert_locked_both_services(self, api):
        before_calls = api._write_dp38_mask_block.call_count
        self.assertTrue(api.device.production_schedule_result["locked"])
        for action in (lambda: api.apply_zone_schedule(1, {"duration_minutes": 30}),
                       lambda: api.prepare_zone7_parity("even")):
            with self.assertRaisesRegex(RuntimeError, "locked"):
                action()
        self.assertEqual(api._write_dp38_mask_block.call_count, before_calls)

    def test_target_mismatch_publishes_facts_and_locks_both_services(self):
        api = make_api()
        api._write_dp38_mask_block.side_effect = None
        with self.assertRaisesRegex(RuntimeError, "read-back"):
            api.apply_zone_schedule(7, {"cycle_mode": "odd"})
        self.assertEqual(api.device.schedule_blocks[7], SOURCE)
        self.assertEqual(api.device.production_schedule_result["status"], "mismatch")
        self.assert_locked_both_services(api)

    def test_each_neighbour_collateral_change_is_rejected_and_published(self):
        for zone in (1, 2, 3, 4, 5, 6, 8):
            with self.subTest(zone=zone):
                api = make_api()
                def write(block, target):
                    api.write(block, target)
                    change(api, zone, 1, 99)
                api._write_dp38_mask_block.side_effect = lambda block, zone: write(block, zone)
                with self.assertRaises(RuntimeError):
                    api.apply_zone_schedule(7, {"cycle_mode": "odd"})
                self.assertEqual(api.device.production_schedule_result["collateral_changed_zones"], [zone])
                self.assertEqual(api.device.schedule_blocks[zone][1], 99)
                self.assert_locked_both_services(api)

    def test_postdispatch_partial_read_publishes_only_new_unambiguous_facts(self):
        api = make_api()
        def collect(**kwargs):
            api.collect(**kwargs)
            if api._write_dp38_mask_block.call_count:
                api.device.zone8_hex_probe_samples = [
                    {"station": 7, "raw_hex": api.snapshots[7]["raw_hex"]},
                    {"station": 3, "raw_hex": api.snapshots[3]["raw_hex"]},
                    {"station": 3, "raw_hex": (bytes([3, 88]) + SOURCE[2:]).hex()},
                ]
                raise RuntimeError("missing zones")
        api._collect_zone8_dp38_samples.side_effect = collect
        with self.assertRaisesRegex(RuntimeError, "missing zones"):
            api.apply_zone_schedule(7, {"cycle_mode": "odd"})
        self.assertEqual([e["zone"] for e in api.device.production_schedule_result["after_snapshot"]], [7])
        self.assertEqual(api.device.schedule_blocks[7][14], 1)
        self.assert_locked_both_services(api)

    def test_lost_ack_reconciles_with_read_only_and_never_resends(self):
        api = make_api()
        def lost_ack(block, zone):
            api.write(block, zone)
            raise OSError("lost ACK")
        api._write_dp38_mask_block.side_effect = lost_ack
        with self.assertRaisesRegex(RuntimeError, "lost ACK"):
            api.apply_zone_schedule(7, {"cycle_mode": "odd"})
        state = api.device.production_schedule_result
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)
        self.assertEqual(api._collect_zone8_dp38_samples.call_count, 2)
        self.assertEqual(state["status"], "uncertain")
        self.assertIsNone(state["writes_performed"])
        self.assertFalse(state["verified"])
        self.assertEqual(len(state["after_snapshot"]), 8)
        self.assertEqual(api.device.schedule_blocks[7][14], 1)
        self.assertEqual((api.transport.socketRetryLimit, api.transport.retry), (5, True))
        self.assert_locked_both_services(api)

    def test_missing_socket_never_dispatches_and_transport_settings_survive(self):
        api = make_api()
        api.transport.socket = None
        with self.assertRaisesRegex(RuntimeError, "connected"):
            api.apply_zone_schedule(7, {"cycle_mode": "odd"})
        self.assert_no_write(api)
        self.assertEqual((api.transport.socketRetryLimit, api.transport.retry), (5, True))

    def test_previous_probe_uncertainty_blocks_production(self):
        api = make_api()
        api._zone7_parity_locked = True
        with self.assertRaisesRegex(RuntimeError, "locked"):
            api.apply_zone_schedule(7, {"cycle_mode": "odd"})
        self.assert_no_write(api)


if __name__ == "__main__":
    unittest.main(verbosity=2)
