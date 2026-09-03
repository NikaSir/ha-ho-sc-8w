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

# Even if an archived feature flag is changed in a test process, the shared
# single-block writer must still stop before transport dispatch.
api_module.ZONE8_DP38_WRITES_ENABLED = True
probe = FakeZone8API()
for zone in range(1, 9):
    probe.device.ingest_schedule_block(block(zone), source="controller")
current = bytearray(probe.snapshot_zone8_schedule_for_lab())
current[14] |= 0xA0
probe.device.ingest_schedule_block(bytes(current), source="controller")

snapshot = probe.snapshot_zone8_schedule_for_lab()
try:
    probe.set_zone8_schedule_field("cycle_mode", "interval", snapshot)
except RuntimeError as exc:
    assert "Zone 8 command affected Zone 4" in str(exc)
else:
    raise AssertionError("The archived Zone 8 editor must not reach transport")
assert probe.writes == []
api_module.ZONE8_DP38_WRITES_ENABLED = False

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

# Even an explicit test-process override cannot bypass the shared transport
# refusal retained under the archived recovery implementation.
api_module.ZONE8_KNOWN_RESTORE_ENABLED = True
restore = GuardedRestoreAPI([damaged])
try:
    restore.restore_zone8_known_backup(const.ZONE8_KNOWN_RESTORE_CONFIRMATION)
except RuntimeError as exc:
    assert "Zone 8 command affected Zone 4" in str(exc)
else:
    raise AssertionError("Archived recovery must stop before transport")
assert restore.writes == []
api_module.ZONE8_KNOWN_RESTORE_ENABLED = False

# Preserve the decoded evidence from the hardware incident while requiring the
# fixed anchor-date action itself to remain disabled.
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

assert const.ZONE8_ANCHOR_DATE_TEST_ENABLED is False
anchor_test = GuardedRestoreAPI([anchor_baseline])
try:
    anchor_test.test_zone8_anchor_date_write(
        const.ZONE8_ANCHOR_DATE_TEST_CONFIRMATION
    )
except RuntimeError as exc:
    assert "disabled" in str(exc)
else:
    raise AssertionError("The anchor-date write must be emergency-disabled")
assert anchor_test.writes == []

affected_zone4 = bytes.fromhex(
    "0400FFFFFFFFFFFFFFFFFFFFFFFF007F1A090211"
)
decoded_affected_zone4 = models.decode_dp38(affected_zone4)[0]
assert decoded_affected_zone4.station == 4
assert decoded_affected_zone4.duration_minutes == 0
assert decoded_affected_zone4.start_times == []
assert decoded_affected_zone4.cycle_mode_name == "weekly"
assert decoded_affected_zone4.cycle_value == 127
assert decoded_affected_zone4.anchor_date == (2026, 9, 2)
assert decoded_affected_zone4.rain_sensor_follow_inferred is True


class FullSnapshotAPI(FakeZone8API):
    """Return one deterministic read-only DP38 block for every zone."""

    def __init__(self) -> None:
        super().__init__()
        self._connected = True
        self.snapshot_operation = "Auto"
        self.snapshot_blocks = {
            zone: bytes.fromhex(raw_hex)
            for zone, raw_hex in const.DP38_KNOWN_BACKUP_HEX_BY_ZONE.items()
        }
        # A full forensic snapshot must preserve a malformed zone instead of
        # discarding it; this reproduces the damaged start bytes seen on hardware.
        self.snapshot_blocks[7] = bytes.fromhex(
            "07EFEFEFEFEFEFFF8A9FDFEFFBFF007F1A090311"
        )

    def _collect_zone8_dp38_samples(
        self,
        timeout_seconds: float = 12.0,
        *,
        required_zones: set[int] | None = None,
        max_requests: int = 24,
    ) -> list[bytes]:
        del timeout_seconds, max_requests
        assert required_zones == set(range(1, 9))
        observations = []
        for zone, raw in sorted(self.snapshot_blocks.items()):
            observation = {
                "raw_hex": raw.hex().upper(),
                "length": 20,
                "station": zone,
                "count": 1,
                "sources": ["status"],
                "fresh": True,
                "valid": True,
            }
            try:
                models.validate_dp38_block(raw, expected_zone=zone)
                observation.update(models.decode_dp38(raw)[0].as_dict())
            except ValueError as exc:
                observation["valid"] = False
                observation["error"] = str(exc)
            observations.append(observation)
        self.device.operation_mode = self.snapshot_operation
        self.device.active_zone = 0
        self.device.queued_zone = 0
        self.device.zone8_hex_probe_samples = observations
        self.device.zone8_hex_probe_trace = {
            "safety_dps_seen": [
                const.DP_OPERATION_MODE,
                const.DP_ACTIVE_ZONE,
                const.DP_QUEUED_ZONE,
            ],
            "zones_seen": list(range(1, 9)),
            "target_collected": True,
        }
        return [self.snapshot_blocks[8]]


full_snapshot = FullSnapshotAPI()
baseline_result = full_snapshot.capture_dp38_snapshot(
    "baseline", const.DP38_SNAPSHOT_CONFIRMATION
)
assert baseline_result["verified"] is True
assert baseline_result["read_only"] is True
assert baseline_result["writes_performed"] == 0
assert baseline_result["phase"] == "baseline"
assert set(baseline_result["blocks"]) == {str(zone) for zone in range(1, 9)}
assert full_snapshot.device.dp38_snapshot_status == "baseline_saved"
assert full_snapshot.device.dp38_snapshot_baseline[7]["valid"] is False
assert full_snapshot.device.operation_mode == "Auto"

blocked_snapshot = FullSnapshotAPI()
blocked_snapshot.snapshot_operation = "OFF"
try:
    blocked_snapshot.capture_dp38_snapshot(
        "baseline", const.DP38_SNAPSHOT_CONFIRMATION
    )
except RuntimeError as exc:
    assert "ON/Auto" in str(exc)
else:
    raise AssertionError("The full snapshot must require physical ON/Auto")
assert blocked_snapshot.writes == []

changed_zone8 = bytearray(full_snapshot.snapshot_blocks[8])
changed_zone8[1] = 1
full_snapshot.snapshot_blocks[8] = bytes(changed_zone8)
compare_result = full_snapshot.capture_dp38_snapshot(
    "compare", const.DP38_SNAPSHOT_CONFIRMATION
)
assert compare_result["verified"] is True
assert compare_result["writes_performed"] == 0
assert compare_result["diff"]["changed_zones"] == [8]
assert compare_result["diff"]["changes"][0]["offsets"] == [1]
assert compare_result["diff"]["changes"][0]["bytes"] == [
    {
        "offset": 1,
        "field": "duration_minutes",
        "before": "00",
        "after": "01",
    }
]
assert full_snapshot.writes == []

api_source = (INTEGRATION / "api.py").read_text(encoding="utf-8")
for marker in (
    "safety_dps_seen",
    "device.updatedps([DP_NORMAL_TIME])",
    "has_complete_round",
    '"zones_seen"',
    '"complete_round"',
    "DP38_KNOWN_BACKUP_HEX_BY_ZONE",
    "request_count < max_requests",
    "zone8_hex_probe_samples",
    "zone8_hex_probe_trace",
    '"cached_only"',
    '"no_dp38"',
    '"observed_variants"',
    '"corrupt_zone8"',
    '"writes_performed": 0',
    '"read_only": True',
    "capture_dp38_snapshot",
    "required_zones=set(range(1, NUM_ZONES + 1))",
    "Set the physical controller to ON/Auto before the DP38 snapshot",
    "restore_zone8_known_backup",
    "automatic rollback was not attempted",
    "test_zone8_anchor_date_write",
    "changed_offsets != [18]",
    "zone8_anchor_date_test_attempted = True",
    "no retry or rollback was sent",
    "Single-block DP38 writes are disabled after a Zone 8 command affected Zone 4",
):
    assert marker in api_source, f"Missing Zone 8 probe safety marker: {marker}"

writer_source = api_source.split("def _write_dp38_hex_block", 1)[1].split(
    "def _stable_raw_zone8_observation", 1
)[0]
assert "_write_command_value" not in writer_source
assert "raise RuntimeError" in writer_source

snapshot_source = api_source.split("def capture_dp38_snapshot", 1)[1].split(
    "def _collect_confirmed_zone8_dp38", 1
)[0]
assert "_write_command_value" not in snapshot_source
assert "_write_dp38_hex_block" not in snapshot_source
assert "_write_local_dps" not in snapshot_source

print("DP38 read-only observer and cross-zone write lockout: PASS")
