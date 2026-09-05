#!/usr/bin/env python3
"""Exercise the fixed date guard and real generic writer with mocked I/O.

These tests never connect to hardware. The production planner/writer is loaded
without Home Assistant setup; only transport and snapshot collection are mocked.
"""
from __future__ import annotations

from copy import deepcopy
import importlib
from pathlib import Path
import subprocess
import sys
import threading
import types
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = "_nikas_anchor_probe_test"
package = types.ModuleType(PACKAGE)
package.__path__ = [str(ROOT / "custom_components" / "nikas_ho_sc_8w")]
sys.modules[PACKAGE] = package
sys.modules.setdefault("tinytuya", types.ModuleType("tinytuya"))
api_module = importlib.import_module(f"{PACKAGE}.api")
Probe = importlib.import_module(f"{PACKAGE}.start_probe_api").StartProbeHOSC8WAPI
SOURCE = bytes.fromhex("0711060C17FFFFFF1E2D3BFFFFFF03021A090310")
EXPECTED = bytes.fromhex("0711060C17FFFFFF1E2D3BFFFFFF03021A090410")
WRITE = bytes.fromhex("4011060C17FFFFFF1E2D3BFFFFFF03021A090410")


def make_api(source: bytes = SOURCE):
    api = Probe.__new__(Probe)
    api._connected = True
    api._using_cloud = False
    api._command_lock = threading.Lock()
    api._io_lock = threading.RLock()
    api.device = api_module.HOSC8WDevice()
    api.device.operation_mode = "Auto"
    api.device.zone7_lab_plan = None
    api.device.zone8_hex_probe_trace = {"safety_dps_seen": [101, 107, 108]}
    # All non-target blocks are synthetic fixtures, not production schedules.
    api.test_snapshot = {
        zone: {"raw_hex": (bytes([zone]) + source[1:]).hex().upper()}
        for zone in range(1, 9)
    }
    api._require_fresh_command_state = Mock()
    api._collect_zone8_dp38_samples = Mock()
    api._build_full_dp38_snapshot = Mock(side_effect=lambda: deepcopy(api.test_snapshot))
    api._ensure_connection = Mock(side_effect=AssertionError("Network I/O forbidden"))
    api._write_command_value = Mock(side_effect=AssertionError("Raw I/O forbidden"))

    def write(block: bytes, *, zone: int):
        assert zone == 7 and block[0] == 0x40
        api.test_snapshot[zone]["raw_hex"] = (bytes([zone]) + block[1:]).hex().upper()

    api._write_dp38_mask_block = Mock(side_effect=write)
    return api


def prepare(api):
    return api.prepare_zone7_lab("anchor_date", "2026-09-04")


def execute(api, plan):
    with patch.object(api_module.time, "sleep", return_value=None):
        return api.execute_zone7_lab(plan["plan_id"], plan["confirmation"])


class AnchorDateProbeTests(unittest.TestCase):
    def test_prepare_preserves_every_other_byte_and_does_not_write(self):
        api = make_api()
        result = prepare(api)
        self.assertEqual(result["source_read_hex"], SOURCE.hex().upper())
        self.assertEqual(result["write_hex"], WRITE.hex().upper())
        self.assertEqual(result["expected_read_hex"], EXPECTED.hex().upper())
        self.assertEqual([(i["offset"], i["before"], i["after"]) for i in result["diff"]],
                         [(0, "07", "40"), (18, "03", "04")])
        self.assertEqual([i for i in range(20) if SOURCE[i] != EXPECTED[i]], [18])
        self.assertEqual(api._collect_zone8_dp38_samples.call_args.kwargs["required_zones"], set(range(1, 9)))
        api._write_dp38_mask_block.assert_not_called()

    def test_any_changed_source_byte_is_rejected(self):
        for offset in range(20):
            with self.subTest(offset=offset):
                source = bytearray(SOURCE)
                source[offset] ^= 1
                api = make_api(bytes(source))
                if offset == 0:
                    api.test_snapshot[7]["raw_hex"] = source.hex().upper()
                with self.assertRaises((ValueError, RuntimeError)):
                    prepare(api)
                self.assertIsNone(api.device.zone7_lab_plan)
                api._write_dp38_mask_block.assert_not_called()

    def test_unsupported_date_is_rejected(self):
        api = make_api()
        with self.assertRaises(ValueError):
            api.prepare_zone7_lab("anchor_date", "2026-09-05")
        api._write_dp38_mask_block.assert_not_called()

    def test_wrong_day_at_same_offset_is_rejected(self):
        api = make_api()
        with patch.object(api, "_zone7_lab_patch_kwargs", return_value={"anchor_date": (2026, 9, 5)}):
            with self.assertRaises(RuntimeError):
                prepare(api)
        self.assertIsNone(api.device.zone7_lab_plan)
        self.assertEqual(api.device.zone7_lab_result["status"], "blocked")
        api._write_dp38_mask_block.assert_not_called()

    def test_invalid_plan_and_selector_are_rejected(self):
        api = make_api()
        prepare(api)
        for key, value in (("write_hex", "80" + WRITE.hex()[2:]),
                           ("expected_read_hex", SOURCE.hex()),
                           ("source_read_hex", "00"), ("diff", [])):
            with self.subTest(key=key):
                invalid = deepcopy(api.device.zone7_lab_plan)
                invalid[key] = value
                with self.assertRaises(ValueError):
                    Probe._validate_zone7_anchor_date_plan(invalid)

    def test_incomplete_prepare_round_blocks_plan(self):
        api = make_api()
        api._collect_zone8_dp38_samples.side_effect = RuntimeError("Incomplete snapshot")
        with self.assertRaises(RuntimeError):
            prepare(api)
        self.assertIsNone(api.device.zone7_lab_plan)
        api._write_dp38_mask_block.assert_not_called()

    def test_active_watering_blocks_prepare_and_execute(self):
        for attr in ("active_zone", "queued_zone"):
            with self.subTest(attr=attr):
                api = make_api()
                setattr(api.device, attr, 1)
                with self.assertRaises(RuntimeError):
                    prepare(api)
                setattr(api.device, attr, 0)
                result = prepare(api)
                setattr(api.device, attr, 1)
                with self.assertRaises(RuntimeError):
                    execute(api, result)
                api._write_dp38_mask_block.assert_not_called()

    def test_changed_neighbour_during_preflight_blocks_write(self):
        api = make_api()
        result = prepare(api)
        api.test_snapshot[1]["raw_hex"] = "01" + "12" + SOURCE.hex()[4:]
        with self.assertRaisesRegex(RuntimeError, "changed after prepare"):
            execute(api, result)
        api._write_dp38_mask_block.assert_not_called()

    def test_confirmation_is_required(self):
        api = make_api()
        result = prepare(api)
        with self.assertRaises(PermissionError):
            api.execute_zone7_lab(result["plan_id"], "wrong")
        api._write_dp38_mask_block.assert_not_called()

    def test_exact_full_readback_and_single_use(self):
        api = make_api()
        result = prepare(api)
        verified = execute(api, result)
        self.assertTrue(verified["verified"])
        self.assertEqual(verified["actual_read_hex"], EXPECTED.hex().upper())
        self.assertEqual(verified["collateral_changed_zones"], [])
        self.assertEqual(api._collect_zone8_dp38_samples.call_count, 3)
        api._write_dp38_mask_block.assert_called_once_with(WRITE, zone=7)
        with self.assertRaises(RuntimeError):
            execute(api, result)
        with self.assertRaises(RuntimeError):
            prepare(api)  # Already at day 04: the fixed experiment cannot repeat.
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)

    def test_wrong_readback_is_not_reported_as_success(self):
        api = make_api()
        result = prepare(api)
        api._write_dp38_mask_block.side_effect = None  # Simulate an unaccepted write.
        with self.assertRaises(RuntimeError):
            execute(api, result)
        self.assertFalse(api.device.zone7_lab_result["verified"])
        self.assertIsNone(api.device.zone7_lab_plan)
        self.assertEqual(api._write_dp38_mask_block.call_count, 1)

    def test_frontend_prepare_never_executes_and_cancel_sends_nothing(self):
        script = r'''
const fs = require("fs"), vm = require("vm"), assert = require("assert/strict");
let confirmed = false;
class Panel {
  constructor() {
    this.calls = []; this.data = {}; this.notifications = [];
    this._hass = {callService: async (domain, service, data) => {
      this.calls.push({domain, service, data});
      this.data.zone7_lab_result = service === "prepare_zone7_lab"
        ? {status:"prepared", field:"anchor_date", value:"2026-09-04", plan_id:"P", confirmation:"C", diff:[]}
        : {status:"verified", field:"anchor_date", value:"2026-09-04", plan_id:"P", verified:true};
    }};
  }
  commandBusy() { return false; }
  commandAvailable() { return true; }
  rejectUnavailableCommand() { return this.commandBusy(); }
  diagnosticsView() { return '<section class="lab zone7Interval2Lab">old</section>'; }
  _render() {}
  render() {}
  refreshNow() { return Promise.resolve(); }
  serviceTargetData() { return {config_entry_id:"test"}; }
  entities() { return {zones:{7:{schedule:"z7"}}}; }
  attrs() { return this.data; }
  notify(text) { this.notifications.push(text); }
  serviceError(error) { return String(error); }
  esc(value) { return String(value); }
}
const file = process.argv[1];
const source = fs.readFileSync(file, "utf8").replace(/^import[^\n]*\n/, "");
vm.runInNewContext(source, {customElements:{get:()=>Panel}, window:{confirm:()=>confirmed}});
(async () => {
  const panel = new Panel();
  assert.equal(panel.calls.length, 0);
  assert(panel.diagnosticsView(panel.entities()).includes("Дата 03.09 → 04.09.2026"));
  await panel.prepareZone7AnchorDate();
  assert.equal(panel.calls.length, 1);
  assert.equal(panel.calls[0].service, "prepare_zone7_lab");
  assert.equal(panel.calls[0].data.value, "2026-09-04");
  await panel.executeZone7AnchorDate();
  assert.equal(panel.calls.length, 1); // Cancelled confirmation.
  confirmed = true;
  await panel.executeZone7AnchorDate();
  assert.equal(panel.calls[1].service, "execute_zone7_lab");
  assert.equal(panel.calls[1].data.plan_id, "P");
  await panel.executeZone7AnchorDate();
  assert.equal(panel.calls.length, 2); // Not prepared after verified result.
  assert.equal(panel.commandBusy(), false);
})().catch(error => { console.error(error); process.exitCode = 1; });
'''
        subprocess.run(["node", "-e", script, str(ROOT / "custom_components" / "nikas_ho_sc_8w" / "frontend" / "irrigation-panel-v0679.mjs")], check=True)


if __name__ == "__main__":
    unittest.main()
