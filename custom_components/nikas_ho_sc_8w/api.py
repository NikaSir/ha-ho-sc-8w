"""Local/cloud transport for the INKBIRD / HiOazo HO-SC-8W."""

from __future__ import annotations

import base64
from datetime import date
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
    DP_ACTIVE_ZONE,
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
)
from .models import (
    PROFILE,
    ScheduleChannel,
    decode_dp38,
    decode_dp45,
    encode_dp45_start_manual,
    validate_dp38_block,
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
            requested[14] = modes[value]
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
                encoded = base64.b64encode(requested).decode("ascii")
                self._write_command_value(
                    DP_NORMAL_TIME,
                    encoded,
                    cloud_code="normal_time",
                    cloud_value=requested.hex().upper(),
                )
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
                self._write_command_value(
                    DP_NORMAL_TIME,
                    base64.b64encode(backup).decode("ascii"),
                    cloud_code="normal_time",
                    cloud_value=backup.hex().upper(),
                )
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
