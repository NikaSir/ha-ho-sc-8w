#!/usr/bin/env python3
"""Hardware-free contract check for the isolated Zone 8 DP38 HEX probe."""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"
PACKAGE = "ho_sc_8w_zone8_contract"
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


const = load_module("const")
models = load_module("models")
api_module = load_module("api")
HOSC8WAPI = api_module.HOSC8WAPI
DP_NORMAL_TIME = const.DP_NORMAL_TIME
ScheduleChannel = models.ScheduleChannel
encode_dp38_channel = models.encode_dp38_channel
api_module.time.sleep = lambda _seconds: None


class FakeZone8API(HOSC8WAPI):
    def __init__(self) -> None:
        super().__init__("device", "key", "127.0.0.1")
        self.writes: list[tuple[int, Any, str, Any]] = []

    def _refresh_command_state(self) -> bool:
        self.device.online = True
        return True

    def _write_command_value(
        self,
        dp: int,
        value: Any,
        *,
        cloud_code: str,
        cloud_value: Any | None = None,
        nowait: bool = False,
    ) -> None:
        self.writes.append((dp, value, cloud_code, cloud_value))
        assert isinstance(value, str) and len(value) == 40
        assert value == value.upper()
        raw = bytes.fromhex(value)
        self.device.ingest_schedule_raw(raw, source="controller")


def block(zone: int) -> bytes:
    return encode_dp38_channel(
        ScheduleChannel(
            station=zone,
            duration_minutes=10 if zone != 8 else 0,
            start_times=[(5, 0)] if zone != 8 else [],
            cycle_mode=0,
            cycle_value=0x7F,
            anchor_date=(2026, 9, 2),
            flags_raw=1,
        )
    )


class ActiveRefreshDevice:
    """Model the observed controller: every DP38 read returns only Zone 8."""

    def __init__(self) -> None:
        self.status_calls = 0
        self.refresh_calls = 0
        self.timeouts: list[int] = []

    def set_socketTimeout(self, value: int) -> None:
        self.timeouts.append(value)

    def status(self) -> dict[str, Any]:
        self.status_calls += 1
        return {
            "dps": {
                str(DP_NORMAL_TIME): block(8).hex().upper(),
                str(const.DP_OPERATION_MODE): "OFF",
                str(const.DP_ACTIVE_ZONE): 0,
                str(const.DP_QUEUED_ZONE): 0,
            }
        }

    def updatedps(self, indexes: list[int]) -> dict[str, Any]:
        assert indexes == [DP_NORMAL_TIME]
        self.refresh_calls += 1
        return {"dps": {str(DP_NORMAL_TIME): block(8).hex().upper()}}

    def receive(self) -> None:
        return None


class ActiveRefreshAPI(HOSC8WAPI):
    def __init__(self) -> None:
        super().__init__("device", "key", "127.0.0.1")
        self.fake_device = ActiveRefreshDevice()
        self._connected = True
        self._tuya = self.fake_device

    def _reset_connection(self) -> None:
        # Keep the deterministic fake connection across the collector reset.
        self._connected = True
        self._tuya = self.fake_device

    def _ensure_connection(self) -> ActiveRefreshDevice:
        return self.fake_device


active_refresh = ActiveRefreshAPI()
fresh = active_refresh._collect_confirmed_zone8_dp38(timeout_seconds=1)
assert fresh == block(8)
assert active_refresh.fake_device.status_calls == 12
assert active_refresh.fake_device.refresh_calls == 12
assert active_refresh.fake_device.timeouts == [1, 5]
assert active_refresh.device.schedule_sources[8] == "controller"
assert active_refresh.device.zone8_hex_probe_trace["complete_round"] is False
assert active_refresh.device.zone8_hex_probe_trace["zones_seen"] == [8]


class SequentialRefreshDevice(ActiveRefreshDevice):
    """Return one station per response, with Zone 8 only after six others."""

    def __init__(self) -> None:
        super().__init__()
        self.response_index = 0
        self.sequence = [2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]

    def _response(self, include_safety: bool) -> dict[str, Any]:
        zone = self.sequence[self.response_index]
        self.response_index += 1
        raw = const.DP38_KNOWN_BACKUP_HEX_BY_ZONE[zone]
        dps: dict[str, Any] = {str(DP_NORMAL_TIME): raw}
        if include_safety:
            dps.update({
                str(const.DP_OPERATION_MODE): "OFF",
                str(const.DP_ACTIVE_ZONE): 0,
                str(const.DP_QUEUED_ZONE): 0,
            })
        return {"dps": dps}

    def status(self) -> dict[str, Any]:
        self.status_calls += 1
        return self._response(True)

    def updatedps(self, indexes: list[int]) -> dict[str, Any]:
        assert indexes == [DP_NORMAL_TIME]
        self.refresh_calls += 1
        return self._response(False)


sequential = ActiveRefreshAPI()
sequential.fake_device = SequentialRefreshDevice()
sequential._tuya = sequential.fake_device
sequential_fresh = sequential._collect_confirmed_zone8_dp38(timeout_seconds=2)
assert sequential_fresh == bytes.fromhex(const.ZONE8_KNOWN_BACKUP_HEX)
assert sequential.fake_device.response_index == 15
assert sequential.device.zone8_hex_probe_trace["active_requests"] == 15
assert sequential.device.zone8_hex_probe_trace["dp38_variants"] == 8
assert sequential.device.zone8_hex_probe_trace["zones_seen"] == list(range(1, 9))
assert sequential.device.zone8_hex_probe_trace["complete_round"] is True
assert all(
    sample["matches_known_backup"] is True
    for sample in sequential.device.zone8_hex_probe_samples
)


api = FakeZone8API()
for zone in range(1, 9):
    api.device.ingest_schedule_block(block(zone), source="controller")

snapshot = api.snapshot_zone8_schedule_for_lab()
assert const.ZONE8_DP38_WRITES_ENABLED is False
for action in (
    lambda: api.set_zone8_schedule_field("duration_minutes", "1", snapshot),
    lambda: api.restore_zone8_schedule(snapshot),
):
    try:
        action()
    except RuntimeError as exc:
        assert "disabled" in str(exc)
    else:
        raise AssertionError("Every DP38 schedule write must be blocked")
assert api.writes == []

# Exercise the corrected encoder without changing the production safety flag.
api_module.ZONE8_DP38_WRITES_ENABLED = True
probe = FakeZone8API()
for zone in range(1, 9):
    probe.device.ingest_schedule_block(block(zone), source="controller")
before_all = dict(probe.device.schedule_blocks)
current = bytearray(probe.snapshot_zone8_schedule_for_lab())
current[14] |= 0xA0
probe.device.ingest_schedule_block(bytes(current), source="controller")

snapshot = probe.snapshot_zone8_schedule_for_lab()
result = probe.set_zone8_schedule_field("cycle_mode", "interval", snapshot)
assert result["verified"] is True and result["changed"] is True
assert len(probe.writes) == 1 and probe.writes[0][0] == DP_NORMAL_TIME
assert probe.writes[0][2] == "normal_time"
written = bytes.fromhex(probe.writes[0][1])
assert written[0] == 8 and written[14] == 0xA3
assert probe.device.schedule_blocks[8] == written
assert all(probe.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

restored = probe.restore_zone8_schedule(snapshot)
assert restored["verified"] is True
assert probe.device.schedule_blocks[8] == snapshot
assert all(probe.device.schedule_blocks[z] == before_all[z] for z in range(1, 8))

api.device.active_zone = 1
try:
    api.snapshot_zone8_schedule_for_lab()
except RuntimeError as exc:
    assert "Stop all watering" in str(exc)
else:
    raise AssertionError("Active watering must block Zone 8 DP38 writes")


class IsolatedProbeAPI(FakeZone8API):
    def __init__(self) -> None:
        super().__init__()
        for zone in range(1, 9):
            self.device.ingest_schedule_block(block(zone), source="controller")
        self.reads = 0

    def _collect_zone8_dp38_samples(
        self, timeout_seconds: float = 8.0
    ) -> list[bytes]:
        del timeout_seconds
        self.reads += 1
        return [self.device.schedule_blocks[8], self.device.schedule_blocks[8]]


isolated = IsolatedProbeAPI()
before_probe = dict(isolated.device.schedule_blocks)
result = isolated.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
assert result["verified"] is True
assert result["read_only"] is True
assert result["writes_performed"] == 0
assert result["zone"] == 8
assert result["raw_hex"] == before_probe[8].hex().upper()
assert result["samples"][0]["raw_hex"] == before_probe[8].hex().upper()
assert result["samples"][0]["count"] == 2
assert isolated.reads == 1
assert isolated.writes == []
assert isolated.device.schedule_blocks == before_probe
assert isolated.device.zone8_hex_probe_status == "verified"
assert before_probe[8].hex().upper() in isolated.device.zone8_hex_probe_detail


class AlternatingProbeAPI(IsolatedProbeAPI):
    def _collect_zone8_dp38_samples(
        self, timeout_seconds: float = 8.0
    ) -> list[bytes]:
        del timeout_seconds
        first = self.device.schedule_blocks[8]
        second = bytearray(first)
        second[16:19] = bytes((26, 9, 3))
        return [first, bytes(second)]


alternating = AlternatingProbeAPI()
alternating_before = dict(alternating.device.schedule_blocks)
alternating_result = alternating.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
assert alternating_result["verified"] is False
assert alternating_result["writes_performed"] == 0
assert len(alternating_result["samples"]) == 2
assert alternating.device.zone8_hex_probe_status == "observed_variants"
assert alternating.writes == []
assert alternating.device.schedule_blocks == alternating_before


class NoDP38Device(ActiveRefreshDevice):
    def status(self) -> dict[str, Any]:
        self.status_calls += 1
        return {
            "dps": {
                str(const.DP_OPERATION_MODE): "OFF",
                str(const.DP_ACTIVE_ZONE): 0,
                str(const.DP_QUEUED_ZONE): 0,
            }
        }

    def updatedps(self, indexes: list[int]) -> dict[str, Any]:
        assert indexes == [DP_NORMAL_TIME]
        self.refresh_calls += 1
        return {"dps": {str(const.DP_OPERATION_MODE): "OFF"}}


class CachedOnlyProbeAPI(ActiveRefreshAPI):
    def __init__(self) -> None:
        HOSC8WAPI.__init__(self, "device", "key", "127.0.0.1")
        self.fake_device = NoDP38Device()
        self._connected = True
        self._tuya = self.fake_device
        self.device.ingest_schedule_block(block(8), source="restore_cache")


cached_only = CachedOnlyProbeAPI()
cached_result = cached_only.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
assert cached_result["verified"] is False
assert cached_result["writes_performed"] == 0
assert cached_result["raw_hex"] == ""
assert cached_result["trace"]["active_requests"] == 24
assert cached_only.device.zone8_hex_probe_status == "cached_only"
assert cached_only.device.zone8_hex_probe_samples[0]["fresh"] is False
assert cached_only.device.zone8_hex_probe_samples[0]["raw_hex"] == block(8).hex().upper()

blocked = IsolatedProbeAPI()
blocked.device.operation_mode = "Auto"
try:
    blocked.probe_zone8_dp38_hex("ZONE8_DP38_HEX_PROBE")
except RuntimeError as exc:
    assert "physical controller to OFF" in str(exc)
else:
    raise AssertionError("The HEX probe must require physical OFF")
assert blocked.writes == []

try:
    IsolatedProbeAPI().probe_zone8_dp38_hex("wrong")
except PermissionError:
    pass
else:
    raise AssertionError("The HEX probe must require its exact confirmation token")


class GuardedRestoreAPI(FakeZone8API):
    def __init__(self, reads: list[bytes]) -> None:
        super().__init__()
        self._connected = True
        self.reads = list(reads)
        self.device.operation_mode = "OFF"
        self.device.active_zone = 0
        self.device.queued_zone = 0
        for zone in range(1, 8):
            self.device.ingest_schedule_block(block(zone), source="controller")

    def _collect_zone8_dp38_samples(
        self, timeout_seconds: float = 12.0
    ) -> list[bytes]:
        del timeout_seconds
        current = self.reads.pop(0)
        try:
            models.validate_dp38_block(current, expected_zone=8)
            valid = True
            error = ""
        except ValueError as exc:
            valid = False
            error = str(exc)
        self.device.zone8_hex_probe_samples = [{
            "raw_hex": current.hex().upper(),
            "length": 20,
            "station": 8,
            "count": 2,
            "sources": ["status", "updatedps"],
            "fresh": True,
            "valid": valid,
            "error": error,
        }]
        self.device.zone8_hex_probe_trace = {
            "safety_dps_seen": [
                const.DP_OPERATION_MODE,
                const.DP_ACTIVE_ZONE,
                const.DP_QUEUED_ZONE,
            ]
        }
        return [current] if valid else []


damaged = bytes.fromhex(const.ZONE8_DAMAGED_BLOCK_HEX)
backup = bytes.fromhex(const.ZONE8_KNOWN_BACKUP_HEX)
disabled_restore = GuardedRestoreAPI([damaged])
try:
    disabled_restore.restore_zone8_known_backup(
        const.ZONE8_KNOWN_RESTORE_CONFIRMATION
    )
except RuntimeError as exc:
    assert "disabled" in str(exc)
else:
    raise AssertionError("Zone 8 recovery must be emergency-disabled")
assert disabled_restore.writes == []

# Preserve coverage of the archived one-write implementation without enabling it
# in the production integration.
api_module.ZONE8_KNOWN_RESTORE_ENABLED = True
restore = GuardedRestoreAPI([damaged, backup])
production_before = dict(restore.device.schedule_blocks)
recovered = restore.restore_zone8_known_backup(
    const.ZONE8_KNOWN_RESTORE_CONFIRMATION
)
assert recovered["verified"] is True
assert recovered["writes_performed"] == 1
assert recovered["from_hex"] == const.ZONE8_DAMAGED_BLOCK_HEX
assert recovered["to_hex"] == const.ZONE8_KNOWN_BACKUP_HEX
assert len(restore.writes) == 1
assert restore.writes[0][0] == DP_NORMAL_TIME
assert restore.writes[0][1] == const.ZONE8_KNOWN_BACKUP_HEX
assert all(
    restore.device.schedule_blocks[zone] == production_before[zone]
    for zone in range(1, 8)
)
assert restore.device.zone8_restore_status == "restored"
assert restore.device.zone8_restore_readback_hex == const.ZONE8_KNOWN_BACKUP_HEX

mismatch = bytearray(backup)
mismatch[16:19] = bytes((26, 9, 4))
bad_readback = GuardedRestoreAPI([damaged, bytes(mismatch)])
try:
    bad_readback.restore_zone8_known_backup(const.ZONE8_KNOWN_RESTORE_CONFIRMATION)
except RuntimeError as exc:
    assert "no rollback" in str(exc)
else:
    raise AssertionError("A mismatched read-back must fail")
assert len(bad_readback.writes) == 1, "Read-back failure must never auto-rollback"

wrong_current = GuardedRestoreAPI([backup])
try:
    wrong_current.restore_zone8_known_backup(const.ZONE8_KNOWN_RESTORE_CONFIRMATION)
except RuntimeError as exc:
    assert "does not exactly match" in str(exc)
else:
    raise AssertionError("A changed current block must stop before writing")
assert wrong_current.writes == []

wrong_mode = GuardedRestoreAPI([damaged])
wrong_mode.device.operation_mode = "Auto"
try:
    wrong_mode.restore_zone8_known_backup(const.ZONE8_KNOWN_RESTORE_CONFIRMATION)
except RuntimeError as exc:
    assert "physical controller to OFF" in str(exc)
else:
    raise AssertionError("Recovery must require physical OFF")
assert wrong_mode.writes == []

try:
    GuardedRestoreAPI([damaged]).restore_zone8_known_backup("wrong")
except PermissionError:
    pass
else:
    raise AssertionError("Recovery must require its exact confirmation token")
api_module.ZONE8_KNOWN_RESTORE_ENABLED = False

# The only enabled DP38 write is a fixed Zone 8 anchor-date experiment. It
# accepts one exact baseline and changes byte offset 18 from day 03 to day 02.
anchor_baseline = bytes.fromhex(const.ZONE8_KNOWN_BACKUP_HEX)
anchor_target = bytes.fromhex(const.ZONE8_ANCHOR_DATE_TEST_TARGET_HEX)
decoded_anchor_baseline = models.decode_dp38(anchor_baseline)[0]
assert decoded_anchor_baseline.station == 8
assert decoded_anchor_baseline.duration_minutes == 0
assert decoded_anchor_baseline.start_times == []
assert decoded_anchor_baseline.cycle_mode_name == "interval"
assert decoded_anchor_baseline.cycle_value == 1
assert decoded_anchor_baseline.anchor_date == (2026, 9, 3)
assert decoded_anchor_baseline.rain_sensor_follow_inferred is True
changed_offsets = [
    index
    for index, (before, after) in enumerate(
        zip(anchor_baseline, anchor_target, strict=True)
    )
    if before != after
]
assert changed_offsets == [18]
assert anchor_baseline[18] == 3
assert anchor_target[18] == 2

anchor_test = GuardedRestoreAPI([anchor_baseline, anchor_target])
anchor_production_before = dict(anchor_test.device.schedule_blocks)
anchor_result = anchor_test.test_zone8_anchor_date_write(
    const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
)
assert anchor_result["verified"] is True
assert anchor_result["writes_performed"] == 1
assert anchor_result["changed_offsets"] == [18]
assert anchor_result["from_hex"] == const.ZONE8_KNOWN_BACKUP_HEX
assert anchor_result["to_hex"] == const.ZONE8_ANCHOR_DATE_TEST_TARGET_HEX
assert anchor_result["readback_hex"] == const.ZONE8_ANCHOR_DATE_TEST_TARGET_HEX
assert len(anchor_test.writes) == 1
assert anchor_test.writes[0][0] == DP_NORMAL_TIME
assert anchor_test.writes[0][1] == const.ZONE8_ANCHOR_DATE_TEST_TARGET_HEX
assert anchor_test.device.zone8_anchor_date_test_status == "confirmed"
assert anchor_test.device.zone8_anchor_date_test_attempted is True
assert all(
    anchor_test.device.schedule_blocks[zone] == anchor_production_before[zone]
    for zone in range(1, 8)
)

anchor_mismatch = GuardedRestoreAPI([anchor_baseline, anchor_baseline])
try:
    anchor_mismatch.test_zone8_anchor_date_write(
        const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
    )
except RuntimeError as exc:
    assert "no retry or rollback" in str(exc)
else:
    raise AssertionError("A mismatched date read-back must fail")
assert len(anchor_mismatch.writes) == 1
assert anchor_mismatch.device.zone8_anchor_date_test_attempted is True
assert anchor_mismatch.device.zone8_anchor_date_test_status == "readback_mismatch"

try:
    anchor_mismatch.test_zone8_anchor_date_write(
        const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
    )
except RuntimeError as exc:
    assert "already attempted" in str(exc)
else:
    raise AssertionError("A failed date test must not write again in the same runtime")
assert len(anchor_mismatch.writes) == 1

anchor_wrong_current = GuardedRestoreAPI([anchor_target])
try:
    anchor_wrong_current.test_zone8_anchor_date_write(
        const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
    )
except RuntimeError as exc:
    assert "does not exactly match" in str(exc)
else:
    raise AssertionError("A changed Zone 8 baseline must stop before writing")
assert anchor_wrong_current.writes == []

anchor_wrong_mode = GuardedRestoreAPI([anchor_baseline])
anchor_wrong_mode.device.operation_mode = "Auto"
try:
    anchor_wrong_mode.test_zone8_anchor_date_write(
        const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
    )
except RuntimeError as exc:
    assert "physical controller to OFF" in str(exc)
else:
    raise AssertionError("The date test must require physical OFF")
assert anchor_wrong_mode.writes == []

try:
    GuardedRestoreAPI([anchor_baseline]).test_zone8_anchor_date_write("wrong")
except PermissionError:
    pass
else:
    raise AssertionError("The date test must require its exact confirmation token")

api_source = (INTEGRATION / "api.py").read_text(encoding="utf-8")
for marker in (
    "safety_dps_seen",
    "device.updatedps([DP_NORMAL_TIME])",
    "has_complete_round",
    '"zones_seen"',
    '"complete_round"',
    "DP38_KNOWN_BACKUP_HEX_BY_ZONE",
    "request_count < 24",
    "zone8_hex_probe_samples",
    "zone8_hex_probe_trace",
    '"cached_only"',
    '"no_dp38"',
    '"observed_variants"',
    '"corrupt_zone8"',
    '"writes_performed": 0',
    '"read_only": True',
    "block.hex().upper()",
    "restore_zone8_known_backup",
    "automatic rollback was not attempted",
    "test_zone8_anchor_date_write",
    "changed_offsets != [18]",
    "zone8_anchor_date_test_attempted = True",
    "no retry or rollback was sent",
):
    assert marker in api_source, f"Missing Zone 8 probe safety marker: {marker}"

print("DP38 observer, guarded recovery, and fixed Zone 8 date test: PASS")
