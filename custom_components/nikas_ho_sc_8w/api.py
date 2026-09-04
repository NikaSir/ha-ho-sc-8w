"""Local/cloud transport for the INKBIRD / HiOazo HO-SC-8W."""

from __future__ import annotations

import base64
from datetime import date, datetime, timezone
import hashlib
import logging
import struct
import threading
import time
from typing import Any

import tinytuya

from .const import (
    CONNECTION_MODE_AUTO,
    CONNECTION_MODE_CLOUD,
    CONNECTION_MODE_LOCAL,
    CONNECTION_MODES,
    DP38_SNAPSHOT_CONFIRMATION,
    DP_ACTIVE_ZONE,
    DP38_KNOWN_BACKUP_HEX_BY_ZONE,
    DP_CANCEL_ALARM_VOICE,
    DP_IRRIGATION_MODE,
    DP_IRRIGATION_TIME_ALL,
    DP_MERGE_HISTORY,
    DP_NORMAL_TIME,
    DP_OPERATION_MODE,
    DP_QUEUED_ZONE,
    DP_RAIN_SENSOR,
    DP_RESET_DEVICE,
    DP_SEASONAL_ADJUST,
    DP_TIMEERROR_ALARM,
    MANUAL_DURATION_MAX,
    MANUAL_DURATION_MIN,
    NUM_ZONES,
    NUM_PRODUCTION_ZONES,
    SEASONAL_ADJUST_MAX,
    SEASONAL_ADJUST_MIN,
    SEASONAL_ADJUST_STEP,
    TUYA_VERSION,
    ZONE8_ANCHOR_DATE_TEST_CONFIRMATION,
    ZONE8_ANCHOR_DATE_TEST_ENABLED,
    ZONE8_ANCHOR_DATE_TEST_TARGET_HEX,
    ZONE8_DP38_HEX_PROBE_ENABLED,
    ZONE8_DP38_WRITES_ENABLED,
    ZONE8_MASK_WRITE_TEST_CONFIRMATION,
    ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX,
    ZONE8_MASK_WRITE_TEST_ENABLED,
    ZONE8_MASK_WRITE_TEST_EXPECTED_READ_HEX,
    ZONE8_MASK_WRITE_TEST_PAYLOAD_HEX,
    ZONE8_DAMAGED_BLOCK_HEX,
    ZONE8_KNOWN_BACKUP_HEX,
    ZONE8_KNOWN_RESTORE_CONFIRMATION,
    ZONE8_KNOWN_RESTORE_ENABLED,
)
from .dp38_transaction import prepare_dp38_transaction, verify_dp38_readback
from .models import (
    PROFILE,
    ScheduleChannel,
    decode_dp38,
    decode_dp45,
    encode_dp45_start_manual,
    validate_dp38_block,
    validate_dp38_write_block,
)

_LOGGER = logging.getLogger(__name__)


class HOSC8WDevice:
    """Current cached state of one HO-SC-8W controller."""

    def __init__(self) -> None:
        self.online = False
        self.raw_dps: dict[str, Any] = {}
        self.operation_mode = "OFF"
        self.mode = "OFF"
        self.irrigation_mode = "order"
        self.rain_sensor_enabled = True
        self.seasonal_adjust = 0
        self.active_zone = 0
        self.queued_zone = 0
        self.zone_active = {z: False for z in range(1, NUM_ZONES + 1)}
        self.zone_countdown = {z: 0 for z in range(1, NUM_ZONES + 1)}
        self.zone_duration = {z: 0 for z in range(1, NUM_ZONES + 1)}
        self.irrigation_time_all = b""
        self.normal_time_raw = b""
        self.normal_time = ""
        self.schedule_blocks: dict[int, bytes] = {}
        self.schedule_channels: dict[int, ScheduleChannel] = {}
        self.schedule_sources: dict[int, str] = {}
        self.zone8_lab_backup_available = False
        self.zone8_lab_last_status = "idle"
        self.zone8_lab_last_field = ""
        self.zone8_lab_requested_value = ""
        self.zone8_lab_last_readback_raw = ""
        self.zone8_hex_probe_status = "idle"
        self.zone8_hex_probe_detail = ""
        self.zone8_hex_probe_samples: list[dict[str, Any]] = []
        self.zone8_hex_probe_trace: dict[str, Any] = {}
        self.zone8_restore_status = "idle"
        self.zone8_restore_detail = ""
        self.zone8_restore_from_hex = ""
        self.zone8_restore_to_hex = ZONE8_KNOWN_BACKUP_HEX
        self.zone8_restore_readback_hex = ""
        self.zone8_anchor_date_test_status = "idle"
        self.zone8_anchor_date_test_detail = ""
        self.zone8_anchor_date_test_from_hex = ZONE8_KNOWN_BACKUP_HEX
        self.zone8_anchor_date_test_to_hex = ZONE8_ANCHOR_DATE_TEST_TARGET_HEX
        self.zone8_anchor_date_test_readback_hex = ""
        self.zone8_anchor_date_test_attempted = False
        self.dp38_snapshot_status = "idle"
        self.dp38_snapshot_detail = ""
        self.dp38_snapshot_baseline: dict[int, dict[str, Any]] = {}
        self.dp38_snapshot_current: dict[int, dict[str, Any]] = {}
        self.dp38_snapshot_diff: dict[str, Any] = {}
        self.dp38_snapshot_baseline_at = ""
        self.dp38_snapshot_current_at = ""
        self.dp38_snapshot_trace: dict[str, Any] = {}
        self.zone8_mask_write_test_status = "idle"
        self.zone8_mask_write_test_detail = ""
        self.zone8_mask_write_test_attempted = False
        self.zone8_mask_write_test_current_read_hex = (
            ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX
        )
        self.zone8_mask_write_test_payload_hex = ZONE8_MASK_WRITE_TEST_PAYLOAD_HEX
        self.zone8_mask_write_test_expected_read_hex = (
            ZONE8_MASK_WRITE_TEST_EXPECTED_READ_HEX
        )
        self.merge_history_raw = b""
        self.reset_device = False
        self.timeerror_alarm = False
        self.cancel_alarm_voice = False

    def update_from_dps(self, dps: dict[str, Any]) -> None:
        """Merge a full or partial Tuya DP update into cached device state."""
        self.raw_dps.update(dps)
        if str(DP_OPERATION_MODE) in dps:
            self.operation_mode = str(dps[str(DP_OPERATION_MODE)])
            self.mode = self.operation_mode
        if str(DP_IRRIGATION_MODE) in dps:
            self.irrigation_mode = str(dps[str(DP_IRRIGATION_MODE)])
        if str(DP_RAIN_SENSOR) in dps:
            self.rain_sensor_enabled = bool(dps[str(DP_RAIN_SENSOR)])
        if str(DP_SEASONAL_ADJUST) in dps:
            self.seasonal_adjust = int(dps[str(DP_SEASONAL_ADJUST)])
        if str(DP_ACTIVE_ZONE) in dps:
            bitmask = int(dps[str(DP_ACTIVE_ZONE)])
            self.active_zone = bitmask
            for zone in range(1, NUM_ZONES + 1):
                self.zone_active[zone] = bool(bitmask & (1 << (zone - 1)))
        if str(DP_QUEUED_ZONE) in dps:
            self.queued_zone = int(dps[str(DP_QUEUED_ZONE)])
        if str(DP_IRRIGATION_TIME_ALL) in dps:
            self.irrigation_time_all = self._parse_raw_dp(dps[str(DP_IRRIGATION_TIME_ALL)])
            parsed = decode_dp45(self.irrigation_time_all)
            for zone in range(1, NUM_ZONES + 1):
                self.zone_countdown[zone] = parsed["remaining"].get(zone, 0)
                self.zone_duration[zone] = parsed["elapsed"].get(zone, 0)
        if str(DP_NORMAL_TIME) in dps:
            raw = self._parse_raw_dp(dps[str(DP_NORMAL_TIME)])
            self.normal_time_raw = raw
            self.normal_time = raw.hex().upper()
            self.ingest_schedule_raw(raw, source="controller")
        if str(DP_MERGE_HISTORY) in dps:
            self.merge_history_raw = self._parse_raw_dp(dps[str(DP_MERGE_HISTORY)])
        if str(DP_RESET_DEVICE) in dps:
            self.reset_device = bool(dps[str(DP_RESET_DEVICE)])
        if str(DP_TIMEERROR_ALARM) in dps:
            self.timeerror_alarm = bool(dps[str(DP_TIMEERROR_ALARM)])
        if str(DP_CANCEL_ALARM_VOICE) in dps:
            self.cancel_alarm_voice = bool(dps[str(DP_CANCEL_ALARM_VOICE)])

    def ingest_schedule_raw(self, raw: bytes, source: str) -> int:
        """Merge one or more validated DP38 blocks into the in-memory cache."""
        added = 0
        decoded = decode_dp38(raw)
        for idx, channel in enumerate(decoded):
            if not 1 <= channel.station <= NUM_ZONES:
                continue
            block = raw[idx * 20 : (idx + 1) * 20]
            if len(block) != 20:
                continue
            self.schedule_blocks[channel.station] = block
            self.schedule_channels[channel.station] = channel
            self.schedule_sources[channel.station] = source
            added += 1
        return added

    def ingest_schedule_block(self, block: bytes, source: str) -> bool:
        """Merge exactly one DP38 block from a read-only cache/bootstrap source."""
        decoded = decode_dp38(block)
        if len(block) != 20 or len(decoded) != 1:
            return False
        channel = decoded[0]
        if not 1 <= channel.station <= NUM_ZONES:
            return False
        self.schedule_blocks[channel.station] = block
        self.schedule_channels[channel.station] = channel
        self.schedule_sources[channel.station] = source
        return True

    @staticmethod
    def _parse_raw_dp(raw: Any) -> bytes:
        """Convert TinyTuya RAW values into bytes without silent normalization."""
        if isinstance(raw, bytes):
            return raw
        if isinstance(raw, bytearray):
            return bytes(raw)
        if isinstance(raw, list):
            return bytes(raw)
        if isinstance(raw, int):
            return struct.pack(">I", raw & 0xFFFFFFFF)
        if isinstance(raw, str):
            value = raw.strip()
            if value and len(value) % 2 == 0:
                try:
                    return bytes.fromhex(value)
                except ValueError:
                    pass
            try:
                decoded = base64.b64decode(value, validate=True)
                if decoded:
                    return decoded
            except (ValueError, base64.binascii.Error):
                pass
            return value.encode()
        return b""


class HOSC8WAPI:
    """Persistent TinyTuya transport dedicated to HO-SC-8W."""

    def __init__(
        self,
        device_id: str,
        local_key: str,
        device_ip: str,
        cloud_api_key: str = "",
        cloud_api_secret: str = "",
        cloud_api_region: str = "eu",
        connection_preference: str = CONNECTION_MODE_AUTO,
    ) -> None:
        self._device_id = device_id
        self._local_key = local_key
        self._device_ip = device_ip
        self._cloud_api_key = cloud_api_key
        self._cloud_api_secret = cloud_api_secret
        self._cloud_api_region = cloud_api_region
        self._tuya: tinytuya.Device | None = None
        self._cloud: tinytuya.Cloud | None = None
        self._connected = False
        self._fail_count = 0
        self._using_cloud = False
        self._connection_preference = connection_preference if connection_preference in CONNECTION_MODES else CONNECTION_MODE_AUTO
        self._command_lock = threading.Lock()
        self._io_lock = threading.RLock()
        self._last_heartbeat = 0.0
        self._heartbeat_interval = 30.0
        self.device = HOSC8WDevice()

    @property
    def profile(self):
        return PROFILE

    @property
    def has_cloud(self) -> bool:
        return self._has_cloud

    @property
    def connection_preference(self) -> str:
        return self._connection_preference

    @property
    def active_transport(self) -> str:
        if self._using_cloud:
            return CONNECTION_MODE_CLOUD
        if self._connected:
            return CONNECTION_MODE_LOCAL
        return "unavailable"

    @property
    def fail_count(self) -> int:
        return self._fail_count

    @property
    def _has_cloud(self) -> bool:
        return bool(self._cloud_api_key and self._cloud_api_secret)

    @property
    def _can_fallback_to_cloud(self) -> bool:
        return self._connection_preference == CONNECTION_MODE_AUTO and self._has_cloud

    def set_connection_preference(self, preference: str) -> None:
        if preference not in CONNECTION_MODES:
            raise ValueError(f"Unsupported connection preference: {preference}")
        self._connection_preference = preference

    def _get_cloud(self) -> tinytuya.Cloud | None:
        if not self._has_cloud:
            return None
        if not self._cloud:
            self._cloud = tinytuya.Cloud(apiRegion=self._cloud_api_region, apiKey=self._cloud_api_key, apiSecret=self._cloud_api_secret)
        return self._cloud

    def _ensure_connection(self) -> tinytuya.Device | None:
        if self._tuya and self._connected:
            return self._tuya
        try:
            self._tuya = tinytuya.Device(self._device_id, self._device_ip, self._local_key)
            self._tuya.set_version(TUYA_VERSION)
            self._tuya.set_socketPersistent(True)
            self._tuya.set_socketTimeout(5)
            self._connected = True
            self._fail_count = 0
            return self._tuya
        except Exception as exc:  # noqa: BLE001
            _LOGGER.debug("HO-SC-8W local connection setup failed: %s", exc)
            self._connected = False
            return None

    def _reset_connection(self) -> None:
        if self._tuya:
            try:
                self._tuya.close()
            except Exception:  # noqa: BLE001
                pass
        self._tuya = None
        self._connected = False

    def activate_local(self) -> bool:
        with self._io_lock:
            return self._connect()

    def recover_local(self) -> bool:
        with self._io_lock:
            return self._connect()

    def _connect(self) -> bool:
        self._reset_connection()
        device = self._ensure_connection()
        if not device:
            return False
        try:
            status = device.status()
            _LOGGER.debug("HO-SC-8W protocol v3.3 response from %s: %s", self._device_ip, status)
            dps = status.get("dps") if isinstance(status, dict) else None
            if isinstance(dps, dict) and dps:
                signature = {"38", "44", "45", "101", "107", "108"}
                if not (set(str(k) for k in dps) & signature):
                    _LOGGER.error("Device at %s responded but does not expose the HO-SC-8W DP signature", self._device_ip)
                    self._reset_connection()
                    return False
                self.device.online = True
                self._using_cloud = False
                self.device.update_from_dps(dps)
                return True
        except Exception as exc:  # noqa: BLE001
            _LOGGER.debug("HO-SC-8W local status failed: %s", exc)
        self._reset_connection()
        return False

    def activate_cloud(self) -> bool:
        with self._io_lock:
            if not self._cloud_update():
                return False
            self._reset_connection()
            self._using_cloud = True
            return True

    def poll_cloud(self) -> bool:
        with self._io_lock:
            if not self._using_cloud:
                return False
            return self._cloud_update()

    def update(self) -> bool:
        if self.device.online:
            return True
        if self._using_cloud and self._has_cloud:
            return self._cloud_update()
        return False

    def _ingest_command_response(self, response: Any) -> None:
        """Merge a TinyTuya command/status response and reject wire errors."""
        if response is None:
            return
        if not isinstance(response, dict):
            raise RuntimeError("Controller returned an invalid command response")
        error = response.get("Err") or response.get("Error") or response.get("error")
        if error:
            raise RuntimeError(f"Controller rejected the command: {error}")
        dps = response.get("dps")
        if isinstance(dps, dict) and dps:
            self.device.online = True
            self.device.update_from_dps(dps)

    def _cloud_command(self, code: str, value: Any) -> None:
        """Send one verified Tuya Cloud command and require API acceptance."""
        cloud = self._get_cloud()
        if not cloud:
            raise RuntimeError("Tuya Cloud command transport is unavailable")
        response = cloud.sendcommand(
            self._device_id,
            {"commands": [{"code": code, "value": value}]},
        )
        if not isinstance(response, dict) or not response.get("success"):
            raise RuntimeError(f"Tuya Cloud rejected {code}")

    def _write_command_value(
        self,
        dp: int,
        value: Any,
        *,
        cloud_code: str,
        cloud_value: Any | None = None,
        nowait: bool = False,
    ) -> None:
        """Write a verified DP through the currently active transport."""
        if self._using_cloud:
            self._cloud_command(cloud_code, value if cloud_value is None else cloud_value)
            return
        device = self._ensure_connection()
        if not device:
            raise RuntimeError("Local controller connection is unavailable")
        response = device.set_value(dp, value, nowait=nowait)
        self._ingest_command_response(response)

    def _refresh_command_state(self) -> bool:
        """Read the controller after a write without trusting API acceptance alone."""
        if self._using_cloud:
            return self._cloud_update()
        device = self._ensure_connection()
        if not device:
            return False
        try:
            response = device.status()
            self._ingest_command_response(response)
            return isinstance(response, dict) and isinstance(response.get("dps"), dict)
        except Exception as exc:  # noqa: BLE001
            _LOGGER.debug("HO-SC-8W command read-back failed: %s", exc)
            return False

    def _wait_for_readback(self, predicate, timeout_seconds: float = 8.0) -> bool:
        """Poll boundedly until a command is confirmed by controller state."""
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            self._refresh_command_state()
            if predicate():
                return True
            time.sleep(0.35)
        return False

    def _require_fresh_command_state(self) -> None:
        """Require a factual pre-write snapshot for guarded controller actions."""
        if not self._refresh_command_state():
            raise RuntimeError("Cannot read a fresh controller state before the write")

    def _return_to_auto_after_manual(self, timeout_seconds: float = 4.0) -> bool:
        """Stop a manual cycle by returning DP101 to Auto; never power the controller off."""
        self._write_command_value(
            DP_OPERATION_MODE,
            "Auto",
            cloud_code="operation_mode",
        )
        time.sleep(0.5)
        return self._wait_for_readback(
            lambda: str(self.device.operation_mode).lower() == "auto"
            and self.device.active_zone == 0
            and self.device.queued_zone == 0,
            timeout_seconds=timeout_seconds,
        )

    def _fail_safe_stop_after_unconfirmed_start(self) -> bool:
        """Best-effort recovery to Auto after an unconfirmed manual start."""
        try:
            return self._return_to_auto_after_manual(timeout_seconds=3.0)
        except Exception as exc:  # noqa: BLE001
            _LOGGER.error("HO-SC-8W fail-safe Auto recovery failed: %s", exc)
            return False

    def start_manual_queue(self, durations: dict[int, int]) -> dict[str, Any]:
        """Start a sequential manual queue and verify DP45/107/108 read-back."""
        normalized: dict[int, int] = {}
        for raw_zone, raw_duration in durations.items():
            zone = int(raw_zone)
            duration = int(raw_duration)
            if not 1 <= zone <= NUM_PRODUCTION_ZONES:
                raise ValueError(f"Manual zone must be 1..{NUM_PRODUCTION_ZONES}")
            if not MANUAL_DURATION_MIN <= duration <= MANUAL_DURATION_MAX:
                raise ValueError(
                    f"Zone {zone} duration must be {MANUAL_DURATION_MIN}..{MANUAL_DURATION_MAX} minutes"
                )
            normalized[zone] = duration
        if not normalized:
            raise ValueError("Manual queue must contain at least one zone")

        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Cannot replace a running or queued watering operation")
                if str(self.device.operation_mode).lower() == "manual":
                    raise RuntimeError(
                        "Controller is already in Manual; stop it or return to Auto first"
                    )

                if str(self.device.irrigation_mode).lower() != "order":
                    self._write_command_value(
                        DP_IRRIGATION_MODE,
                        "order",
                        cloud_code="irrigation_mode",
                    )
                    time.sleep(0.35)

                all_durations = {zone: 0 for zone in range(1, NUM_ZONES + 1)}
                all_durations.update(normalized)
                raw_payload = encode_dp45_start_manual(all_durations, NUM_ZONES)
                local_payload = base64.b64encode(raw_payload).decode("ascii")
                if self._using_cloud:
                    self._write_command_value(
                        DP_IRRIGATION_TIME_ALL,
                        local_payload,
                        cloud_code="irrigation_time_all",
                        cloud_value=raw_payload.hex(),
                        nowait=True,
                    )
                    time.sleep(0.5)
                    self._write_command_value(
                        DP_OPERATION_MODE,
                        "Manual",
                        cloud_code="operation_mode",
                    )
                else:
                    self._write_command_value(
                        DP_OPERATION_MODE,
                        "Manual",
                        cloud_code="operation_mode",
                    )
                    if not self._wait_for_readback(
                        lambda: str(self.device.operation_mode).lower() == "manual",
                        timeout_seconds=4.0,
                    ):
                        raise RuntimeError(
                            "DP101 did not confirm Manual; DP45 was not sent"
                        )
                    self._write_command_value(
                        DP_IRRIGATION_TIME_ALL,
                        local_payload,
                        cloud_code="irrigation_time_all",
                        cloud_value=raw_payload.hex(),
                        nowait=True,
                    )
                time.sleep(1.0)

                expected_mask = sum(1 << (zone - 1) for zone in normalized)

                def _manual_queue_confirmed() -> bool:
                    observed_mask = self.device.active_zone | self.device.queued_zone
                    return (
                        str(self.device.operation_mode).lower() == "manual"
                        and observed_mask & expected_mask == expected_mask
                    )

                if not self._wait_for_readback(_manual_queue_confirmed):
                    observed = (
                        f"mode={self.device.operation_mode}, "
                        f"active={self.device.active_zone}, "
                        f"queued={self.device.queued_zone}"
                    )
                    recovered = self._fail_safe_stop_after_unconfirmed_start()
                    raise RuntimeError(
                        "Manual queue was not confirmed by DP101/107/108 "
                        f"({observed}); "
                        + (
                            "fail-safe return to Auto was confirmed"
                            if recovered
                            else "fail-safe return to Auto could not be confirmed"
                        )
                    )

                return {
                    "verified": True,
                    "transport": self.active_transport,
                    "zones": [
                        {"zone": zone, "duration_minutes": normalized[zone]}
                        for zone in sorted(normalized)
                    ],
                    "active_zone_bitmask": self.device.active_zone,
                    "queued_zone_bitmask": self.device.queued_zone,
                }
        finally:
            self._command_lock.release()

    def stop_manual(self) -> dict[str, Any]:
        """Stop manual watering by returning to Auto without powering the controller off."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                fresh = self._refresh_command_state()
                if fresh and (
                    str(self.device.operation_mode).lower() == "auto"
                    and self.device.active_zone == 0
                    and self.device.queued_zone == 0
                ):
                    return {
                        "verified": True,
                        "changed": False,
                        "operation_mode": "Auto",
                    }
                if not self._return_to_auto_after_manual(timeout_seconds=8.0):
                    raise RuntimeError(
                        "DP101/107/108 did not confirm watering stop and return to Auto"
                    )
                return {
                    "verified": True,
                    "changed": True,
                    "operation_mode": "Auto",
                }
        finally:
            self._command_lock.release()

    def resume_automatic(self) -> dict[str, Any]:
        """Return an idle controller to automatic mode and verify DP101."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop active watering before returning to Auto")
                if str(self.device.operation_mode).lower() == "auto":
                    return {
                        "verified": True,
                        "changed": False,
                        "operation_mode": "Auto",
                    }
                self._write_command_value(
                    DP_OPERATION_MODE,
                    "Auto",
                    cloud_code="operation_mode",
                )
                time.sleep(1.0)
                if not self._wait_for_readback(
                    lambda: str(self.device.operation_mode).lower() == "auto"
                ):
                    raise RuntimeError("DP101 did not confirm automatic mode")
                return {
                    "verified": True,
                    "changed": True,
                    "operation_mode": "Auto",
                }
        finally:
            self._command_lock.release()

    def set_seasonal_adjustment(self, value: int) -> dict[str, Any]:
        """Write DP103 only after validation and verify the same value by reading it."""
        adjustment = int(value)
        if not SEASONAL_ADJUST_MIN <= adjustment <= SEASONAL_ADJUST_MAX:
            raise ValueError(
                f"Seasonal adjustment must be {SEASONAL_ADJUST_MIN}..{SEASONAL_ADJUST_MAX}%"
            )
        if adjustment % SEASONAL_ADJUST_STEP:
            raise ValueError(
                f"Seasonal adjustment must use {SEASONAL_ADJUST_STEP}% steps"
            )
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                previous = self.device.seasonal_adjust
                if previous == adjustment:
                    return {
                        "verified": True,
                        "changed": False,
                        "seasonal_adjustment": adjustment,
                    }
                self._write_command_value(
                    DP_SEASONAL_ADJUST,
                    adjustment,
                    cloud_code="SeaAdjValue",
                )
                time.sleep(1.0)
                if not self._wait_for_readback(
                    lambda: self.device.seasonal_adjust == adjustment
                ):
                    raise RuntimeError("DP103 did not confirm the seasonal adjustment")
                return {
                    "verified": True,
                    "changed": True,
                    "previous_seasonal_adjustment": previous,
                    "seasonal_adjustment": adjustment,
                }
        finally:
            self._command_lock.release()

    def snapshot_zone8_schedule_for_lab(self) -> bytes:
        """Return a fresh, guarded Zone 8 DP38 block for a laboratory write."""
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before changing the Zone 8 program")
                if len(self.device.schedule_blocks) != NUM_ZONES:
                    raise RuntimeError("A complete eight-zone DP38 cache is required")
                if self.device.schedule_sources.get(8) != "controller":
                    raise RuntimeError("Zone 8 DP38 was not freshly read from the controller")
                block = self.device.schedule_blocks.get(8, b"")
                validate_dp38_block(block, expected_zone=8)
                return bytes(block)
        finally:
            self._command_lock.release()

    @staticmethod
    def _zone8_block_with_field(
        current: bytes, field: str, raw_value: str
    ) -> bytes:
        """Change only the bytes owned by one supported Zone 8 field."""
        validate_dp38_block(current, expected_zone=8)
        requested = bytearray(current)
        value = str(raw_value).strip()
        if field == "duration_minutes":
            duration = int(value)
            if not 0 <= duration <= 255:
                raise ValueError("Zone 8 duration must be 0..255 minutes")
            requested[1] = duration
        if field.startswith("start_time_"):
            try:
                slot = int(field.removeprefix("start_time_"))
            except ValueError as exc:
                raise ValueError("Invalid Zone 8 start-time field") from exc
            if not 1 <= slot <= 6:
                raise ValueError("Zone 8 start-time slot must be 1..6")
            if value:
                try:
                    hour_text, minute_text = value.split(":", 1)
                    hour, minute = int(hour_text), int(minute_text)
                except (TypeError, ValueError) as exc:
                    raise ValueError("Start time must use HH:MM or be empty") from exc
                if not 0 <= hour <= 23 or not 0 <= minute <= 59:
                    raise ValueError("Start time must use HH:MM")
                requested[1 + slot] = hour
                requested[7 + slot] = minute
            else:
                requested[1 + slot] = 0xFF
                requested[7 + slot] = 0xFF
        if field == "cycle_mode":
            modes = {"weekly": 0, "odd": 1, "even": 2, "interval": 3}
            if value not in modes:
                raise ValueError("Cycle mode must be weekly, odd, even or interval")
            requested[14] = (requested[14] & 0xFC) | modes[value]
        if field == "cycle_value":
            cycle_value = int(value)
            if not 0 <= cycle_value <= 255:
                raise ValueError("Cycle value must be 0..255")
            requested[15] = cycle_value
        if field == "anchor_date":
            if not value:
                requested[16:19] = b"\x00\x00\x00"
            else:
                try:
                    parsed = date.fromisoformat(value)
                except ValueError as exc:
                    raise ValueError("Anchor date must use YYYY-MM-DD") from exc
                if not 2000 <= parsed.year <= 2255:
                    raise ValueError("Anchor date year must be 2000..2255")
                requested[16:19] = bytes(
                    (parsed.year - 2000, parsed.month, parsed.day)
                )
        if field == "rain_sensor_follow":
            if value not in {"true", "false"}:
                raise ValueError("Rain-sensor value must be true or false")
            requested[19] = (
                requested[19] | 0x01
                if value == "true"
                else requested[19] & ~0x01
            )
        allowed = {
            "duration_minutes",
            "cycle_mode",
            "cycle_value",
            "anchor_date",
            "rain_sensor_follow",
        }
        if field not in allowed and not field.startswith("start_time_"):
            raise ValueError(f"Unsupported Zone 8 field: {field}")
        result = bytes(requested)
        validate_dp38_block(result, expected_zone=8)
        return result

    def set_zone8_schedule_field(
        self, field: str, value: str, expected_current: bytes
    ) -> dict[str, Any]:
        """Write one Zone 8 DP38 field and require an exact controller read-back."""
        if not ZONE8_DP38_WRITES_ENABLED:
            raise RuntimeError(
                "DP38 schedule writes are disabled after a Zone 8 write changed production schedules"
            )
        validate_dp38_block(expected_current, expected_zone=8)
        requested = self._zone8_block_with_field(expected_current, field, value)
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before changing the Zone 8 program")
                current = self.device.schedule_blocks.get(8, b"")
                if (
                    current != expected_current
                    or self.device.schedule_sources.get(8) != "controller"
                ):
                    raise RuntimeError(
                        "Zone 8 DP38 changed after the safety snapshot; refresh and retry"
                    )
                self.device.zone8_lab_last_field = field
                self.device.zone8_lab_requested_value = str(value)
                if requested == current:
                    self.device.zone8_lab_last_status = "confirmed_no_change"
                    self.device.zone8_lab_last_readback_raw = current.hex().upper()
                    return {"verified": True, "changed": False, "raw_hex": current.hex().upper()}
                self.device.zone8_lab_last_status = "waiting_readback"
                # DP38 `normal_time` is a Tuya String DP. The controller data
                # model requires one 20-byte station block encoded as 40 ASCII
                # hexadecimal characters. Base64 is correct for RAW DP45, but
                # corrupts DP38 because the firmware parses it as hexadecimal.
                self._write_dp38_hex_block(requested)
                time.sleep(1.0)
                if not self._wait_for_readback(
                    lambda: self.device.schedule_sources.get(8) == "controller"
                    and self.device.schedule_blocks.get(8) == requested
                ):
                    self.device.zone8_lab_last_status = "readback_mismatch"
                    actual = self.device.schedule_blocks.get(8, b"")
                    self.device.zone8_lab_last_readback_raw = actual.hex().upper()
                    raise RuntimeError("DP38 read-back did not confirm the Zone 8 field")
                self.device.zone8_lab_last_status = "confirmed"
                self.device.zone8_lab_last_readback_raw = requested.hex().upper()
                return {"verified": True, "changed": True, "raw_hex": requested.hex().upper()}
        finally:
            self._command_lock.release()

    def restore_zone8_schedule(self, backup: bytes) -> dict[str, Any]:
        """Restore the exact saved Zone 8 block and verify controller read-back."""
        if not ZONE8_DP38_WRITES_ENABLED:
            raise RuntimeError(
                "DP38 schedule restoration is disabled because a single-zone write is not isolated"
            )
        validate_dp38_block(backup, expected_zone=8)
        current = self.snapshot_zone8_schedule_for_lab()
        if current == backup:
            self.device.zone8_lab_last_status = "restored"
            self.device.zone8_lab_last_readback_raw = backup.hex().upper()
            return {"verified": True, "changed": False, "raw_hex": backup.hex().upper()}
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self.device.zone8_lab_last_status = "restoring"
                self._write_dp38_hex_block(backup)
                time.sleep(1.0)
                if not self._wait_for_readback(
                    lambda: self.device.schedule_sources.get(8) == "controller"
                    and self.device.schedule_blocks.get(8) == backup
                ):
                    self.device.zone8_lab_last_status = "restore_mismatch"
                    raise RuntimeError("DP38 read-back did not confirm Zone 8 restoration")
                self.device.zone8_lab_last_status = "restored"
                self.device.zone8_lab_last_field = ""
                self.device.zone8_lab_requested_value = ""
                self.device.zone8_lab_last_readback_raw = backup.hex().upper()
                return {"verified": True, "changed": True, "raw_hex": backup.hex().upper()}
        finally:
            self._command_lock.release()

    def _collect_zone8_dp38_samples(
        self,
        timeout_seconds: float = 12.0,
        *,
        required_zones: set[int] | None = None,
        max_requests: int = 24,
    ) -> list[bytes]:
        """Observe fresh DP38 replies and return valid Zone 8 blocks.

        The optional ``required_zones`` target is used only by the read-only
        full snapshot.  The legacy Zone 8 probe keeps its original stop rule.
        """
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The DP38 HEX probe is local-transport only")
        device = self._ensure_connection()
        if not device:
            raise RuntimeError("Local controller connection is unavailable")
        samples: list[bytes] = []
        observed: dict[bytes, dict[str, Any]] = {}
        safety_dps_seen: set[int] = set()
        dps_seen: set[int] = set()
        response_count = 0

        def ingest(source: str, response: Any) -> None:
            nonlocal response_count
            if not isinstance(response, dict) or response.get("Err"):
                return
            dps = response.get("dps")
            if not isinstance(dps, dict):
                return
            response_count += 1
            for key in dps:
                try:
                    dps_seen.add(int(key))
                except (TypeError, ValueError):
                    continue
            normalized_dps = {str(key): value for key, value in dps.items()}
            for dp in (DP_OPERATION_MODE, DP_ACTIVE_ZONE, DP_QUEUED_ZONE):
                if str(dp) in normalized_dps:
                    safety_dps_seen.add(dp)
            # Update operational state, but do not let an exploratory DP38
            # response replace the schedule cache before it is classified.
            operational_dps = {
                key: value
                for key, value in normalized_dps.items()
                if key != str(DP_NORMAL_TIME)
            }
            self.device.update_from_dps(operational_dps)
            dp38_value = normalized_dps.get(str(DP_NORMAL_TIME))
            if dp38_value is None:
                return
            raw = self.device._parse_raw_dp(dp38_value)
            for offset in range(0, len(raw), 20):
                block = raw[offset : offset + 20]
                current = bytes(block)
                entry = observed.setdefault(
                    current,
                    {
                        "raw_hex": current.hex().upper(),
                        "length": len(current),
                        "station": current[0] if current else None,
                        "count": 0,
                        "sources": [],
                        "fresh": True,
                        "valid": False,
                    },
                )
                station = current[0] if len(current) == 20 else None
                known_backup_hex = DP38_KNOWN_BACKUP_HEX_BY_ZONE.get(station)
                entry["known_backup_hex"] = known_backup_hex or ""
                entry["matches_known_backup"] = bool(
                    known_backup_hex
                    and current.hex().upper() == known_backup_hex
                )
                entry["count"] += 1
                if source not in entry["sources"]:
                    entry["sources"].append(source)
                try:
                    validate_dp38_block(current)
                except ValueError as exc:
                    entry["error"] = str(exc)
                    continue
                entry["valid"] = True
                channel = decode_dp38(current)[0]
                entry.update(channel.as_dict())
                if current[0] == 8:
                    samples.append(current)

        def has_repeated_zone8() -> bool:
            return any(
                item.get("station") == 8
                and item.get("length") == 20
                and int(item.get("count", 0)) >= 2
                for item in observed.values()
            )

        def zones_observed() -> set[int]:
            return {
                int(item["station"])
                for item in observed.values()
                if item.get("length") == 20
                and isinstance(item.get("station"), int)
                and 1 <= int(item["station"]) <= NUM_ZONES
            }

        def has_complete_round() -> bool:
            return (
                zones_observed() == set(range(1, NUM_ZONES + 1))
                and has_repeated_zone8()
            )

        def target_collected() -> bool:
            if required_zones is not None:
                return required_zones.issubset(zones_observed())
            return has_complete_round()

        device.set_socketTimeout(1)
        request_count = 0
        try:
            deadline = time.monotonic() + timeout_seconds
            while (
                request_count < max_requests
                and not target_collected()
                and time.monotonic() < deadline
            ):
                try:
                    ingest("status", device.status())
                    request_count += 1
                except Exception:  # noqa: BLE001
                    pass
                if target_collected() or request_count >= max_requests:
                    break
                try:
                    ingest("updatedps", device.updatedps([DP_NORMAL_TIME]))
                    request_count += 1
                except Exception:  # noqa: BLE001
                    pass
                try:
                    ingest("receive", device.receive())
                except Exception:  # noqa: BLE001
                    time.sleep(0.05)
        finally:
            device.set_socketTimeout(5)
        self.device.zone8_hex_probe_samples = list(observed.values())
        observed_zones = sorted(zones_observed())
        self.device.zone8_hex_probe_trace = {
            "active_requests": request_count,
            "responses": response_count,
            "dps_seen": sorted(dps_seen),
            "safety_dps_seen": sorted(safety_dps_seen),
            "dp38_variants": len(observed),
            "zone8_replies": len(samples),
            "zones_seen": observed_zones,
            "complete_round": (
                observed_zones == list(range(1, NUM_ZONES + 1))
                and has_repeated_zone8()
            ),
            "required_zones": sorted(required_zones or []),
            "target_collected": target_collected(),
        }
        return samples

    @staticmethod
    def _dp38_snapshot_field(offset: int) -> str:
        """Return a human-readable field name for one DP38 byte offset."""
        if offset == 0:
            return "zone_identifier"
        if offset == 1:
            return "duration_minutes"
        if 2 <= offset <= 7:
            return f"start_time_{offset - 1}_hour"
        if 8 <= offset <= 13:
            return f"start_time_{offset - 7}_minute"
        return {
            14: "cycle_mode",
            15: "cycle_value",
            16: "anchor_year",
            17: "anchor_month",
            18: "anchor_day",
            19: "flags",
        }[offset]

    def _build_full_dp38_snapshot(self) -> dict[int, dict[str, Any]]:
        """Build one unambiguous fresh 20-byte observation for every zone."""
        candidates: dict[int, list[dict[str, Any]]] = {
            zone: [] for zone in range(1, NUM_ZONES + 1)
        }
        for item in self.device.zone8_hex_probe_samples:
            try:
                station = int(item.get("station"))
                raw = bytes.fromhex(str(item.get("raw_hex", "")))
            except (TypeError, ValueError):
                continue
            if station not in candidates or len(raw) != 20 or raw[0] != station:
                continue
            candidates[station].append(item)

        missing = [zone for zone, items in candidates.items() if not items]
        ambiguous = [zone for zone, items in candidates.items() if len(items) > 1]
        if missing or ambiguous:
            details = []
            if missing:
                details.append("missing zones: " + ", ".join(map(str, missing)))
            if ambiguous:
                details.append(
                    "multiple variants for zones: "
                    + ", ".join(map(str, ambiguous))
                )
            raise RuntimeError("Incomplete DP38 snapshot; " + "; ".join(details))

        snapshot: dict[int, dict[str, Any]] = {}
        for zone, items in candidates.items():
            observed = items[0]
            raw = bytes.fromhex(str(observed["raw_hex"]))
            entry = {
                "zone": zone,
                "raw_hex": raw.hex().upper(),
                "count": int(observed.get("count", 0)),
                "fresh": observed.get("fresh") is not False,
                "valid": observed.get("valid") is not False,
                "error": str(observed.get("error", "")),
                "sources": list(observed.get("sources", [])),
            }
            try:
                validate_dp38_block(raw, expected_zone=zone)
                entry.update(decode_dp38(raw)[0].as_dict())
            except ValueError:
                # A forensic snapshot must preserve malformed production data
                # byte-for-byte instead of dropping the affected zone.
                entry["valid"] = False
            entry["start_slots"] = [
                (
                    None
                    if raw[2 + slot] == 0xFF and raw[8 + slot] == 0xFF
                    else f"{raw[2 + slot]:02d}:{raw[8 + slot]:02d}"
                )
                for slot in range(6)
            ]
            snapshot[zone] = entry
        return snapshot

    def _compare_dp38_snapshots(
        self,
        baseline: dict[int, dict[str, Any]],
        current: dict[int, dict[str, Any]],
    ) -> dict[str, Any]:
        """Return exact byte changes between two complete snapshots."""
        changes: list[dict[str, Any]] = []
        unchanged: list[int] = []
        for zone in range(1, NUM_ZONES + 1):
            before = bytes.fromhex(str(baseline[zone]["raw_hex"]))
            after = bytes.fromhex(str(current[zone]["raw_hex"]))
            offsets = [
                offset
                for offset, (old, new) in enumerate(zip(before, after, strict=True))
                if old != new
            ]
            if not offsets:
                unchanged.append(zone)
                continue
            changes.append(
                {
                    "zone": zone,
                    "before_hex": before.hex().upper(),
                    "after_hex": after.hex().upper(),
                    "offsets": offsets,
                    "bytes": [
                        {
                            "offset": offset,
                            "field": self._dp38_snapshot_field(offset),
                            "before": f"{before[offset]:02X}",
                            "after": f"{after[offset]:02X}",
                        }
                        for offset in offsets
                    ],
                }
            )
        return {
            "changed": bool(changes),
            "changed_zones": [item["zone"] for item in changes],
            "unchanged_zones": unchanged,
            "changes": changes,
        }

    def _write_dp38_mask_block(self, block: bytes, zone: int) -> None:
        """Dispatch one 20-byte DP38 block using the write-side zone mask."""
        validate_dp38_write_block(block, expected_zone=zone)
        encoded = block.hex().upper()
        if len(encoded) != 40:
            raise RuntimeError("DP38 transport must contain 40 uppercase HEX characters")
        self._write_command_value(
            DP_NORMAL_TIME,
            encoded,
            cloud_code="normal_time",
            cloud_value=encoded,
        )

    def test_zone8_mask_write(self, confirmation: str) -> dict[str, Any]:
        """Advance Zone 8 with one masked block; never retry or roll back."""
        if not ZONE8_MASK_WRITE_TEST_ENABLED:
            raise RuntimeError("The Zone 8 masked write test is disabled")
        if confirmation != ZONE8_MASK_WRITE_TEST_CONFIRMATION:
            raise PermissionError("Explicit Zone 8 masked-write confirmation is required")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The DP38 masked write test is local-transport only")
        if self.device.zone8_mask_write_test_attempted:
            raise RuntimeError("The DP38 Zone 8 masked write was already attempted")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        dispatched = False
        try:
            with self._io_lock:
                self.device.zone8_mask_write_test_status = "preflight"
                self.device.zone8_mask_write_test_detail = ""
                self._require_fresh_command_state()
                if str(self.device.operation_mode).lower() != "auto":
                    raise RuntimeError("Set the physical controller to ON/Auto before the write")
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before the DP38 write")
                if self.device.dp38_snapshot_status != "baseline_saved":
                    raise RuntimeError("Capture a fresh baseline snapshot immediately before the write")
                try:
                    baseline_at = datetime.fromisoformat(
                        self.device.dp38_snapshot_baseline_at
                    )
                except ValueError as exc:
                    raise RuntimeError("The baseline snapshot timestamp is invalid") from exc
                baseline_age = (datetime.now(timezone.utc) - baseline_at).total_seconds()
                if baseline_age < 0 or baseline_age > 15 * 60:
                    raise RuntimeError(
                        "The baseline snapshot is older than 15 minutes; capture it again"
                    )

                baseline_zone8 = self.device.dp38_snapshot_baseline.get(8, {})
                try:
                    current_read = bytes.fromhex(str(baseline_zone8["raw_hex"]))
                except (KeyError, TypeError, ValueError) as exc:
                    raise RuntimeError("Fresh baseline Zone 8 block is invalid") from exc
                expected_current = bytes.fromhex(
                    ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX
                )
                payload = bytes.fromhex(ZONE8_MASK_WRITE_TEST_PAYLOAD_HEX)
                expected_readback = bytes.fromhex(
                    ZONE8_MASK_WRITE_TEST_EXPECTED_READ_HEX
                )
                validate_dp38_block(expected_current, expected_zone=8)
                validate_dp38_write_block(payload, expected_zone=8)
                validate_dp38_block(expected_readback, expected_zone=8)
                if current_read != expected_current:
                    raise RuntimeError(
                        "Fresh baseline Zone 8 must be exactly 2026-09-04 before this test"
                    )
                changed_offsets = [
                    index
                    for index, (old, new) in enumerate(
                        zip(expected_current, expected_readback, strict=True)
                    )
                    if old != new
                ]
                if changed_offsets != [18] or payload[0] != 0x80:
                    raise RuntimeError(
                        "The masked test must select Zone 8 with 0x80 and change only byte 18"
                    )
                if payload[1:] != expected_readback[1:]:
                    raise RuntimeError("Write payload and expected read-back data disagree")

                self.device.zone8_mask_write_test_attempted = True
                self.device.zone8_mask_write_test_status = "writing_once"
                # Once transport dispatch starts, any exception is ambiguous:
                # the controller may already have received the command.
                dispatched = True
                self._write_dp38_mask_block(payload, zone=8)
                self.device.zone8_mask_write_test_status = "awaiting_compare"
                self.device.zone8_mask_write_test_detail = (
                    "One 20-byte DP38 block with mask 0x80 was sent; capture a control snapshot"
                )
                return {
                    "verified": False,
                    "awaiting_control_snapshot": True,
                    "writes_performed": 1,
                    "frame_bytes": len(payload),
                    "hex_characters": len(payload.hex()),
                    "write_zone_mask": "80",
                    "changed_zone": 8,
                    "changed_byte_offset": 18,
                    "from_hex": expected_current.hex().upper(),
                    "write_hex": payload.hex().upper(),
                    "expected_readback_hex": expected_readback.hex().upper(),
                }
        except Exception as exc:
            self.device.zone8_mask_write_test_status = (
                "dispatch_unknown" if dispatched else "blocked"
            )
            self.device.zone8_mask_write_test_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

    def capture_dp38_snapshot(
        self, phase: str, confirmation: str
    ) -> dict[str, Any]:
        """Capture or compare all eight DP38 blocks without any write command."""
        if confirmation != DP38_SNAPSHOT_CONFIRMATION:
            raise PermissionError(
                "Explicit read-only DP38 snapshot confirmation is required"
            )
        if phase not in {"baseline", "compare"}:
            raise ValueError("DP38 snapshot phase must be baseline or compare")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The full DP38 snapshot is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller action is still in progress")
        try:
            with self._io_lock:
                self.device.dp38_snapshot_status = (
                    "capturing_baseline" if phase == "baseline" else "capturing_compare"
                )
                self.device.dp38_snapshot_detail = ""
                self._collect_zone8_dp38_samples(
                    timeout_seconds=35.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=80,
                )
                self.device.dp38_snapshot_trace = dict(
                    self.device.zone8_hex_probe_trace
                )
                required_safety = {
                    DP_OPERATION_MODE,
                    DP_ACTIVE_ZONE,
                    DP_QUEUED_ZONE,
                }
                seen_safety = set(
                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])
                )
                if not required_safety.issubset(seen_safety):
                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")
                if str(self.device.operation_mode).lower() != "auto":
                    raise RuntimeError(
                        "Set the physical controller to ON/Auto before the DP38 snapshot"
                    )
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before the DP38 snapshot")

                snapshot = self._build_full_dp38_snapshot()
                captured_at = datetime.now(timezone.utc).isoformat()
                for entry in snapshot.values():
                    if entry["valid"]:
                        self.device.ingest_schedule_block(
                            bytes.fromhex(entry["raw_hex"]), source="controller"
                        )

                if phase == "baseline":
                    self.device.dp38_snapshot_baseline = snapshot
                    self.device.dp38_snapshot_current = {}
                    self.device.dp38_snapshot_diff = {
                        "changed": False,
                        "changed_zones": [],
                        "unchanged_zones": list(range(1, NUM_ZONES + 1)),
                        "changes": [],
                    }
                    self.device.dp38_snapshot_baseline_at = captured_at
                    self.device.dp38_snapshot_current_at = ""
                    self.device.dp38_snapshot_status = "baseline_saved"
                    self.device.dp38_snapshot_detail = (
                        "Complete read-only baseline for zones 1-8 was saved"
                    )
                else:
                    if set(self.device.dp38_snapshot_baseline) != set(
                        range(1, NUM_ZONES + 1)
                    ):
                        raise RuntimeError(
                            "Capture a complete baseline before the comparison snapshot"
                        )
                    self.device.dp38_snapshot_current = snapshot
                    self.device.dp38_snapshot_current_at = captured_at
                    self.device.dp38_snapshot_diff = self._compare_dp38_snapshots(
                        self.device.dp38_snapshot_baseline,
                        snapshot,
                    )
                    changed = self.device.dp38_snapshot_diff["changed"]
                    self.device.dp38_snapshot_status = (
                        "compared_changes" if changed else "compared_unchanged"
                    )
                    self.device.dp38_snapshot_detail = (
                        "Read-only comparison found changed DP38 bytes"
                        if changed
                        else "All eight DP38 blocks match the baseline"
                    )
                    if self.device.zone8_mask_write_test_status == "awaiting_compare":
                        expected_before = ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX
                        expected_after = ZONE8_MASK_WRITE_TEST_EXPECTED_READ_HEX
                        changes = self.device.dp38_snapshot_diff.get("changes", [])
                        confirmed = (
                            len(changes) == 1
                            and changes[0].get("zone") == 8
                            and changes[0].get("before_hex") == expected_before
                            and changes[0].get("after_hex") == expected_after
                            and changes[0].get("offsets") == [18]
                            and self.device.dp38_snapshot_diff.get("unchanged_zones")
                            == list(range(1, 8))
                        )
                        self.device.zone8_mask_write_test_status = (
                            "confirmed" if confirmed else "comparison_mismatch"
                        )
                        self.device.zone8_mask_write_test_detail = (
                            "Only Zone 8 anchor day changed from 04 to 05"
                            if confirmed
                            else "Control snapshot did not match the masked one-block target"
                        )
                return {
                    "verified": True,
                    "read_only": True,
                    "writes_performed": 0,
                    "phase": phase,
                    "captured_at": captured_at,
                    "blocks": {
                        str(zone): item["raw_hex"]
                        for zone, item in snapshot.items()
                    },
                    "diff": self.device.dp38_snapshot_diff,
                    "trace": self.device.dp38_snapshot_trace,
                }
        except Exception as exc:
            self.device.dp38_snapshot_status = "incomplete"
            self.device.dp38_snapshot_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

    def _collect_confirmed_zone8_dp38(
        self, timeout_seconds: float = 8.0
    ) -> bytes:
        """Read the same valid Zone 8 DP38 block twice plus fresh safety DPs."""
        samples = self._collect_zone8_dp38_samples(timeout_seconds)
        if not samples:
            raise RuntimeError("Fresh Zone 8 DP38 was not observed")
        for index, candidate in enumerate(samples):
            if candidate in samples[index + 1 :]:
                self.device.ingest_schedule_block(candidate, source="controller")
                return candidate
        variants = ", ".join(dict.fromkeys(block.hex().upper() for block in samples))
        raise RuntimeError(
            "Zone 8 DP38 was not returned identically twice; observed: " + variants
        )

    def _write_dp38_hex_block(self, block: bytes) -> None:
        """Refuse archived DP38 writers that used a read-side zone number.

        The old path passed ``08`` as if it selected Zone 8, but DP38 writes
        interpret that byte as a bitmask and therefore selected Zone 4.  Only
        the separately validated one-hot-mask writer may reach transport.
        """
        if len(block) != 20:
            raise ValueError("DP38 HEX probe requires one 20-byte block")
        raise RuntimeError(
            "Legacy DP38 writes are disabled; only the guarded one-hot mask test is permitted"
        )

    def _stable_raw_zone8_observation(self) -> bytes:
        """Return one repeated 20-byte Zone 8 observation, valid or corrupt."""
        matches: list[tuple[bytes, int]] = []
        for item in self.device.zone8_hex_probe_samples:
            if item.get("station") != 8 or item.get("length") != 20:
                continue
            try:
                block = bytes.fromhex(str(item.get("raw_hex", "")))
            except ValueError:
                continue
            if len(block) == 20:
                matches.append((block, int(item.get("count", 0))))
        repeated = [(block, count) for block, count in matches if count >= 2]
        if len(repeated) != 1:
            variants = ", ".join(
                f"{block.hex().upper()} (x{count})" for block, count in matches
            )
            raise RuntimeError(
                "Zone 8 did not return one stable raw DP38 block twice"
                + (f"; observed: {variants}" if variants else "")
            )
        return repeated[0][0]

    def restore_zone8_known_backup(self, confirmation: str) -> dict[str, Any]:
        """Replace one exact known corrupt Zone 8 block with its exact backup."""
        if not ZONE8_KNOWN_RESTORE_ENABLED:
            raise RuntimeError("The guarded Zone 8 recovery is disabled")
        if confirmation != ZONE8_KNOWN_RESTORE_CONFIRMATION:
            raise PermissionError("Explicit Zone 8 recovery confirmation is required")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The guarded Zone 8 recovery is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        expected = bytes.fromhex(ZONE8_DAMAGED_BLOCK_HEX)
        target = bytes.fromhex(ZONE8_KNOWN_BACKUP_HEX)
        validate_dp38_block(target, expected_zone=8)
        try:
            with self._io_lock:
                self.device.zone8_restore_status = "reading_before"
                self.device.zone8_restore_detail = ""
                self.device.zone8_restore_from_hex = ""
                self.device.zone8_restore_readback_hex = ""
                self._collect_zone8_dp38_samples()
                required_safety = {
                    DP_OPERATION_MODE,
                    DP_ACTIVE_ZONE,
                    DP_QUEUED_ZONE,
                }
                seen_safety = set(
                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])
                )
                if not required_safety.issubset(seen_safety):
                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")
                if str(self.device.operation_mode).lower() != "off":
                    raise RuntimeError(
                        "Set the physical controller to OFF before Zone 8 recovery"
                    )
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before Zone 8 recovery")
                current = self._stable_raw_zone8_observation()
                self.device.zone8_restore_from_hex = current.hex().upper()
                if current != expected:
                    raise RuntimeError(
                        "Zone 8 current DP38 does not exactly match the approved damaged block"
                    )

                self.device.zone8_restore_status = "writing_once"
                self._write_dp38_hex_block(target)
                time.sleep(1.0)

                self.device.zone8_restore_status = "reading_after"
                self._collect_zone8_dp38_samples()
                readback = self._stable_raw_zone8_observation()
                self.device.zone8_restore_readback_hex = readback.hex().upper()
                if readback != target:
                    self.device.zone8_restore_status = "readback_mismatch"
                    self.device.zone8_restore_detail = (
                        "Sent one write only; automatic rollback was not attempted"
                    )
                    raise RuntimeError(
                        "Zone 8 recovery read-back did not match the known backup; no rollback was sent"
                    )
                self.device.ingest_schedule_block(target, source="controller")
                self.device.zone8_restore_status = "restored"
                self.device.zone8_restore_detail = (
                    "Zone 8 known backup was written once and confirmed by repeated reads"
                )
                return {
                    "verified": True,
                    "writes_performed": 1,
                    "zone": 8,
                    "from_hex": expected.hex().upper(),
                    "to_hex": target.hex().upper(),
                    "readback_hex": readback.hex().upper(),
                }
        except Exception as exc:
            if self.device.zone8_restore_status != "readback_mismatch":
                self.device.zone8_restore_status = "blocked"
                self.device.zone8_restore_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

    def test_zone8_anchor_date_write(self, confirmation: str) -> dict[str, Any]:
        """Change only Zone 8's anchor day once and verify repeated read-back."""
        if not ZONE8_ANCHOR_DATE_TEST_ENABLED:
            raise RuntimeError("The Zone 8 anchor-date write test is disabled")
        if confirmation != ZONE8_ANCHOR_DATE_TEST_CONFIRMATION:
            raise PermissionError("Explicit Zone 8 anchor-date test confirmation is required")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("The Zone 8 anchor-date write test is local-transport only")
        if self.device.zone8_anchor_date_test_attempted:
            raise RuntimeError(
                "The Zone 8 anchor-date write was already attempted; restart only after reviewing the result"
            )

        expected = bytes.fromhex(ZONE8_KNOWN_BACKUP_HEX)
        target = bytes.fromhex(ZONE8_ANCHOR_DATE_TEST_TARGET_HEX)
        validate_dp38_block(expected, expected_zone=8)
        validate_dp38_block(target, expected_zone=8)
        changed_offsets = [
            index
            for index, (before, after) in enumerate(zip(expected, target, strict=True))
            if before != after
        ]
        if changed_offsets != [18] or expected[18] != 3 or target[18] != 2:
            raise RuntimeError(
                "Zone 8 anchor-date test constants must differ only at the day byte 03 -> 02"
            )
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")

        try:
            with self._io_lock:
                self.device.zone8_anchor_date_test_status = "reading_before"
                self.device.zone8_anchor_date_test_detail = ""
                self.device.zone8_anchor_date_test_readback_hex = ""
                self._collect_zone8_dp38_samples(timeout_seconds=8.0)
                required_safety = {
                    DP_OPERATION_MODE,
                    DP_ACTIVE_ZONE,
                    DP_QUEUED_ZONE,
                }
                seen_safety = set(
                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])
                )
                if not required_safety.issubset(seen_safety):
                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")
                if str(self.device.operation_mode).lower() != "off":
                    raise RuntimeError(
                        "Set the physical controller to OFF before the Zone 8 date test"
                    )
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before the Zone 8 date test")

                current = self._stable_raw_zone8_observation()
                self.device.zone8_anchor_date_test_from_hex = current.hex().upper()
                if current != expected:
                    raise RuntimeError(
                        "Zone 8 current DP38 does not exactly match the approved 2026-09-03 baseline"
                    )

                # This is the only write in the action. Mark it before transport
                # dispatch so a timeout or mismatched answer cannot trigger a retry.
                self.device.zone8_anchor_date_test_attempted = True
                self.device.zone8_anchor_date_test_status = "writing_once"
                self._write_dp38_hex_block(target)
                time.sleep(1.0)

                self.device.zone8_anchor_date_test_status = "reading_after"
                self._collect_zone8_dp38_samples(timeout_seconds=8.0)
                readback = self._stable_raw_zone8_observation()
                self.device.zone8_anchor_date_test_readback_hex = readback.hex().upper()
                if readback != target:
                    self.device.zone8_anchor_date_test_status = "readback_mismatch"
                    self.device.zone8_anchor_date_test_detail = (
                        "Sent one ASCII-HEX write only; no retry or rollback was sent"
                    )
                    raise RuntimeError(
                        "Zone 8 anchor-date read-back did not match 2026-09-02; no retry or rollback was sent"
                    )

                self.device.ingest_schedule_block(target, source="controller")
                self.device.zone8_anchor_date_test_status = "confirmed"
                self.device.zone8_anchor_date_test_detail = (
                    "Only Zone 8 anchor day changed from 2026-09-03 to 2026-09-02"
                )
                return {
                    "verified": True,
                    "writes_performed": 1,
                    "zone": 8,
                    "changed_offsets": changed_offsets,
                    "from_hex": expected.hex().upper(),
                    "to_hex": target.hex().upper(),
                    "readback_hex": readback.hex().upper(),
                }
        except Exception as exc:
            if self.device.zone8_anchor_date_test_status != "readback_mismatch":
                self.device.zone8_anchor_date_test_status = "blocked"
                self.device.zone8_anchor_date_test_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

    def probe_zone8_dp38_hex(self, confirmation: str) -> dict[str, Any]:
        """Read and decode the current Zone 8 DP38 block without writing."""
        if not ZONE8_DP38_HEX_PROBE_ENABLED:
            raise RuntimeError("The Zone 8 DP38 HEX probe is disabled")
        if confirmation != "ZONE8_DP38_HEX_PROBE":
            raise PermissionError("Explicit Zone 8 HEX probe confirmation is required")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self.device.zone8_hex_probe_status = "reading_before"
                samples = self._collect_zone8_dp38_samples()
                if str(self.device.operation_mode).lower() != "off":
                    raise RuntimeError(
                        "Set the physical controller to OFF before the DP38 HEX probe"
                    )
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before the DP38 HEX probe")
                counts: dict[bytes, int] = {}
                for sample in samples:
                    validate_dp38_block(sample, expected_zone=8)
                    counts[sample] = counts.get(sample, 0) + 1
                observations = []
                for sample, count in counts.items():
                    channel = decode_dp38(sample)[0]
                    observations.append(
                        {
                            "raw_hex": sample.hex().upper(),
                            "count": count,
                            **channel.as_dict(),
                        }
                    )
                fresh_all = list(self.device.zone8_hex_probe_samples)
                if samples and not fresh_all:
                    fresh_all = observations
                    self.device.zone8_hex_probe_samples = observations
                stable = len(counts) == 1 and len(samples) >= 2
                original = samples[-1] if samples else None
                if stable and original is not None:
                    self.device.ingest_schedule_block(original, source="controller")
                trace = self.device.zone8_hex_probe_trace
                if samples:
                    self.device.zone8_hex_probe_status = (
                        "verified" if stable else "observed_variants"
                    )
                    variants = "; ".join(
                        f"{item['raw_hex']} (x{item['count']})" for item in observations
                    )
                    self.device.zone8_hex_probe_detail = (
                        ("Стабильный ответ зоны 8: " if stable else "Разные ответы зоны 8: ")
                        + variants
                    )
                elif fresh_all:
                    corrupt_zone8 = any(
                        item.get("station") == 8
                        and item.get("length") == 20
                        and item.get("valid") is False
                        for item in fresh_all
                    )
                    zones = sorted(
                        {item.get("station") for item in fresh_all if item.get("valid")}
                    )
                    if corrupt_zone8:
                        self.device.zone8_hex_probe_status = "corrupt_zone8"
                        self.device.zone8_hex_probe_detail = (
                            "Получен повторяющийся повреждённый блок DP38 зоны 8"
                        )
                    else:
                        self.device.zone8_hex_probe_status = "observed_other_zones"
                        self.device.zone8_hex_probe_detail = (
                            f"DP38 получен, но зоны 8 среди ответов нет. Зоны: {zones or 'нет валидных'}"
                        )
                else:
                    cached = self.device.schedule_blocks.get(8)
                    if cached:
                        channel = decode_dp38(cached)[0]
                        self.device.zone8_hex_probe_samples = [
                            {
                                "raw_hex": cached.hex().upper(),
                                "count": 1,
                                "sources": ["cache"],
                                "fresh": False,
                                "valid": True,
                                **channel.as_dict(),
                            }
                        ]
                        self.device.zone8_hex_probe_status = "cached_only"
                        self.device.zone8_hex_probe_detail = (
                            "Свежий DP38 не пришёл; показан последний ранее полученный блок зоны 8"
                        )
                    else:
                        self.device.zone8_hex_probe_status = "no_dp38"
                        self.device.zone8_hex_probe_detail = (
                            "DP38 отсутствовал во всех ответах контроллера"
                        )
                return {
                    "verified": stable,
                    "read_only": True,
                    "writes_performed": 0,
                    "zone": 8,
                    "raw_hex": original.hex().upper() if original else "",
                    "samples": self.device.zone8_hex_probe_samples,
                    "trace": trace,
                }
        except Exception as exc:
            self.device.zone8_hex_probe_status = "failed"
            self.device.zone8_hex_probe_detail = str(exc)
            raise
        finally:
            self._command_lock.release()

    def receive_push_update(self) -> bool:
        """Consume one unsolicited update from the persistent local socket."""
        with self._io_lock:
            if not self._tuya or not self._connected:
                return False
            try:
                response = self._tuya.receive()
            except Exception as exc:  # noqa: BLE001
                _LOGGER.debug("HO-SC-8W local push receive failed: %s", exc)
                self._reset_connection()
                self.device.online = False
                return False
            if not response:
                now = time.monotonic()
                if now - self._last_heartbeat >= self._heartbeat_interval:
                    try:
                        self._tuya.heartbeat()
                        self._last_heartbeat = now
                    except Exception as exc:  # noqa: BLE001
                        _LOGGER.debug("HO-SC-8W local heartbeat failed: %s", exc)
                        self._reset_connection()
                        self.device.online = False
                return False
            if not isinstance(response, dict) or "Err" in response:
                return False
            dps = response.get("dps")
            if not isinstance(dps, dict) or not dps:
                return False
            _LOGGER.debug("HO-SC-8W RAW PUSH DPs from %s: %s", self._device_ip, dps)
            self.device.online = True
            self.device.update_from_dps(dps)
            return True

    def close(self) -> None:
        with self._io_lock:
            self._reset_connection()
            self._using_cloud = False
            self.device.online = False

    def _cloud_update(self) -> bool:
        cloud = self._get_cloud()
        if not cloud:
            return False
        try:
            status = cloud.getstatus(self._device_id)
            if not isinstance(status, dict) or not status.get("success"):
                _LOGGER.warning("HO-SC-8W Tuya Cloud status request failed")
                return False
            result = status.get("result")
            if not isinstance(result, list) or not result:
                return False
            mapping = {
                "normal_time": "38",
                "irrigation_mode": "44",
                "irrigation_time_all": "45",
                "operation_mode": "101",
                "RainSen_TotalONOFF": "102",
                "SeaAdjValue": "103",
                "Merge_History": "104",
                "ResetDevice": "105",
                "timeerror_alarm": "106",
                "zonerun_state": "107",
                "pendingzone_state": "108",
                "cancel_timealarm_voice": "109",
            }
            dps: dict[str, Any] = {}
            for item in result:
                code = item.get("code", "")
                dp = mapping.get(code)
                if dp:
                    dps[dp] = item.get("value")
            if not dps:
                return False
            self.device.online = True
            self.device.update_from_dps(dps)
            return True
        except Exception as exc:  # noqa: BLE001
            _LOGGER.warning("HO-SC-8W cloud update raised %s", type(exc).__name__)
            _LOGGER.debug("HO-SC-8W cloud update failed: %s", exc)
            return False


    @staticmethod
    def _zone7_lab_patch_kwargs(field: str, raw_value: str) -> dict[str, Any]:
        """Translate one laboratory editor field into a conservative DP38 patch."""
        field = str(field).strip()
        value = str(raw_value).strip()
        if field == "duration_minutes":
            return {"duration_minutes": int(value)}
        if field.startswith("start_time_"):
            slot = int(field.removeprefix("start_time_"))
            if not 1 <= slot <= 6:
                raise ValueError("start_time slot must be 1..6")
            # The transaction planner replaces the whole start-time bank, so a
            # single-slot edit is intentionally not accepted here.  The lab UI
            # will use start_times_json once multi-slot editing is needed.
            raise ValueError("Use a non-time field for the first Zone 7 lab test")
        if field == "cycle_mode":
            modes = {"weekly": 0, "odd": 1, "even": 2, "interval": 3}
            if value not in modes:
                raise ValueError("cycle_mode must be weekly, odd, even or interval")
            return {"cycle_mode": modes[value]}
        if field == "cycle_value":
            return {"interval_days": int(value)}
        if field == "weekdays":
            days = [item.strip().lower() for item in value.split(",") if item.strip()]
            return {"cycle_mode": 0, "weekdays": days}
        if field == "anchor_date":
            parsed = date.fromisoformat(value)
            return {"anchor_date": (parsed.year, parsed.month, parsed.day)}
        if field == "program_enabled":
            if value not in {"true", "false"}:
                raise ValueError("program_enabled must be true or false")
            return {"program_enabled": value == "true"}
        if field == "rain_sensor_follow":
            if value not in {"true", "false"}:
                raise ValueError("rain_sensor_follow must be true or false")
            return {"rain_sensor_follow": value == "true"}
        raise ValueError(f"Unsupported Zone 7 lab field: {field}")

    def prepare_zone7_lab(self, field: str, value: str) -> dict[str, Any]:
        """Prepare a write plan for Zone 7 without sending any controller write."""
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 laboratory editor is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before preparing a Zone 7 lab transaction")
                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                baseline = self._build_full_dp38_snapshot()
                source = bytes.fromhex(str(baseline[7]["raw_hex"]))
                validate_dp38_block(source, expected_zone=7)
                kwargs = self._zone7_lab_patch_kwargs(field, value)
                # cycle_value is overloaded in DP38.  For the lab we only allow
                # direct cycle_value edits when the source is already interval.
                if field == "cycle_value" and source[14] != 3:
                    raise ValueError("cycle_value direct edit is allowed only when Zone 7 is already interval")
                plan = prepare_dp38_transaction(source, **kwargs)
                plan_dict = plan.as_dict()
                digest = hashlib.sha256(
                    (plan_dict["source_read_hex"] + plan_dict["write_hex"]).encode("ascii")
                ).hexdigest()[:12].upper()
                confirmation = f"WRITE_ZONE7_LAB_{digest}"
                self.device.zone7_lab_plan = {
                    **plan_dict,
                    "plan_id": digest,
                    "confirmation": confirmation,
                    "field": field,
                    "value": value,
                    "baseline": baseline,
                }
                self.device.zone7_lab_result = {
                    "status": "prepared",
                    "plan_id": digest,
                    "confirmation": confirmation,
                    "field": field,
                    "value": value,
                    "diff": plan_dict["diff"],
                    "source_read_hex": plan_dict["source_read_hex"],
                    "write_hex": plan_dict["write_hex"],
                    "expected_read_hex": plan_dict["expected_read_hex"],
                }
                return dict(self.device.zone7_lab_result)
        finally:
            self._command_lock.release()

    def execute_zone7_lab(self, plan_id: str, confirmation: str) -> dict[str, Any]:
        """Execute one prepared Zone 7 write, then compare all eight DP38 blocks."""
        plan = getattr(self.device, "zone7_lab_plan", None)
        if not isinstance(plan, dict):
            raise RuntimeError("No prepared Zone 7 laboratory transaction exists")
        if str(plan_id).strip().upper() != str(plan.get("plan_id", "")).upper():
            raise PermissionError("Zone 7 lab plan_id does not match the prepared transaction")
        if str(confirmation).strip() != str(plan.get("confirmation", "")):
            raise PermissionError("Zone 7 lab confirmation token does not match the prepared transaction")
        if self.active_transport != CONNECTION_MODE_LOCAL:
            raise RuntimeError("Zone 7 laboratory editor is local-transport only")
        if not self._command_lock.acquire(blocking=False):
            raise RuntimeError("Another controller write is still in progress")
        try:
            with self._io_lock:
                self._require_fresh_command_state()
                if self.device.active_zone or self.device.queued_zone:
                    raise RuntimeError("Stop all watering before executing a Zone 7 lab transaction")

                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                before = self._build_full_dp38_snapshot()
                baseline = plan["baseline"]
                changed_before = [
                    zone for zone in range(1, NUM_ZONES + 1)
                    if str(before[zone]["raw_hex"]) != str(baseline[zone]["raw_hex"])
                ]
                if changed_before:
                    raise RuntimeError(
                        "DP38 changed after prepare; transaction cancelled. Changed zones: "
                        + ", ".join(map(str, changed_before))
                    )

                write_block = bytes.fromhex(str(plan["write_hex"]))
                validate_dp38_write_block(write_block, expected_zone=7)
                self._write_dp38_hex_block(write_block)
                time.sleep(1.0)

                self._collect_zone8_dp38_samples(
                    timeout_seconds=12.0,
                    required_zones=set(range(1, NUM_ZONES + 1)),
                    max_requests=24,
                )
                after = self._build_full_dp38_snapshot()
                actual_zone7 = bytes.fromhex(str(after[7]["raw_hex"]))
                expected_zone7 = bytes.fromhex(str(plan["expected_read_hex"]))
                exact_zone7 = actual_zone7 == expected_zone7
                readback_diff = []
                if not exact_zone7:
                    for offset, (expected, actual) in enumerate(zip(expected_zone7, actual_zone7, strict=True)):
                        if expected != actual:
                            readback_diff.append({
                                "offset": offset,
                                "field": self._dp38_snapshot_field(offset),
                                "expected": f"{expected:02X}",
                                "actual": f"{actual:02X}",
                            })
                collateral = [
                    zone for zone in range(1, NUM_ZONES + 1)
                    if zone != 7
                    and str(after[zone]["raw_hex"]) != str(baseline[zone]["raw_hex"])
                ]
                result = {
                    "status": "verified" if exact_zone7 and not collateral else "mismatch",
                    "verified": exact_zone7 and not collateral,
                    "plan_id": plan["plan_id"],
                    "field": plan["field"],
                    "value": plan["value"],
                    "expected_read_hex": expected_zone7.hex().upper(),
                    "actual_read_hex": actual_zone7.hex().upper(),
                    "readback_diff": readback_diff,
                    "collateral_changed_zones": collateral,
                    "before": before,
                    "after": after,
                }
                self.device.zone7_lab_result = result
                # One prepared plan is single-use regardless of success.  Never
                # retry or auto-rollback a DP38 write.
                self.device.zone7_lab_plan = None
                if not result["verified"]:
                    raise RuntimeError(
                        "Zone 7 DP38 write was not isolated/confirmed; inspect zone7_lab_result before any further write"
                    )
                return result
        finally:
            self._command_lock.release()
