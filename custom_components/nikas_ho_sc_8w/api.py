"""Local/cloud transport for the INKBIRD / HiOazo HO-SC-8W."""

from __future__ import annotations

import base64
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
    NUM_ZONES,
    TUYA_VERSION,
)
from .models import (
    DP38_PROTOCOL_LAB_ZONE,
    PROFILE,
    ScheduleChannel,
    build_dp38_zone8_rain_probe,
    decode_dp38,
    decode_dp45,
    dp38_byte_diff,
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
        self._command_lock = False
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

    def prepare_dp38_zone8_rain_probe(self, follow_rain_sensor: bool) -> dict[str, Any]:
        """Prepare, but never send, the controlled DP38 Zone 8 rain-bit mutation."""
        zone = DP38_PROTOCOL_LAB_ZONE
        source = self.device.schedule_sources.get(zone)
        original = self.device.schedule_blocks.get(zone)
        if original is None:
            raise RuntimeError("No DP38 Zone 8 block is available for the protocol probe")
        if source != "controller":
            raise RuntimeError(
                "DP38 Zone 8 probe requires a fresh controller-sourced block; "
                f"current source is {source or 'unknown'}"
            )
        validate_dp38_block(original, expected_zone=zone)
        candidate = build_dp38_zone8_rain_probe(original, follow_rain_sensor)
        changes = dp38_byte_diff(original, candidate)
        return {
            "zone": zone,
            "source": source,
            "follow_rain_sensor": follow_rain_sensor,
            "before_hex": original.hex().upper(),
            "candidate_hex": candidate.hex().upper(),
            "diff": changes,
            "already_in_requested_state": not changes,
            "local_transport": self.active_transport == CONNECTION_MODE_LOCAL,
            "controller_idle": self.device.active_zone == 0 and self.device.queued_zone == 0,
            "write_exposed_to_home_assistant": False,
        }

    def _lab_receive_dp38_zone8(
        self, expected: bytes, timeout_seconds: float = 4.0
    ) -> bytes | None:
        """Wait for a controller DP38 push containing the expected Zone 8 block."""
        if not self._tuya or not self._connected:
            return None
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            try:
                response = self._tuya.receive()
            except Exception as exc:  # noqa: BLE001
                _LOGGER.debug("Zone 8 DP38 probe receive failed: %s", exc)
                return None
            if not isinstance(response, dict) or "Err" in response:
                continue
            dps = response.get("dps")
            if not isinstance(dps, dict) or str(DP_NORMAL_TIME) not in dps:
                continue
            self.device.update_from_dps(dps)
            current = self.device.schedule_blocks.get(DP38_PROTOCOL_LAB_ZONE)
            if current == expected:
                return current
        return None

    def _lab_write_dp38_zone8_rain_probe(
        self,
        follow_rain_sensor: bool,
        *,
        confirmation: str,
        timeout_seconds: float = 4.0,
    ) -> dict[str, Any]:
        """Execute one Zone 8 DP38 write/read-back/rollback laboratory probe.

        This private method is deliberately not registered as a Home Assistant
        service, entity action, or frontend command. It is restricted to the
        physically unused Zone 8 and requires an explicit confirmation token.
        """
        if confirmation != "ZONE8_DP38_WRITE":
            raise PermissionError("Explicit Zone 8 protocol-lab confirmation is required")

        with self._io_lock:
            prepared = self.prepare_dp38_zone8_rain_probe(follow_rain_sensor)
            if prepared["already_in_requested_state"]:
                raise ValueError(
                    "Zone 8 already has the requested rain flag; choose the opposite state "
                    "so the probe produces a one-bit mutation"
                )
            if not prepared["local_transport"]:
                raise RuntimeError("DP38 protocol probe is local-transport only")
            if not prepared["controller_idle"]:
                raise RuntimeError("DP38 protocol probe requires no active or queued watering")

            original = bytes.fromhex(prepared["before_hex"])
            candidate = bytes.fromhex(prepared["candidate_hex"])
            device = self._ensure_connection()
            if not device:
                raise RuntimeError("Local controller connection is unavailable")

            result = dict(prepared)
            result.update(
                {
                    "candidate_sent": False,
                    "candidate_read_back": False,
                    "rollback_sent": False,
                    "rollback_read_back": False,
                }
            )

            _LOGGER.warning(
                "HO-SC-8W protocol lab: writing DP38 Zone 8 only; diff=%s",
                prepared["diff"],
            )
            device.set_socketTimeout(1)
            try:
                device.set_value(DP_NORMAL_TIME, candidate, nowait=True)
                result["candidate_sent"] = True
                result["candidate_read_back"] = (
                    self._lab_receive_dp38_zone8(candidate, timeout_seconds) == candidate
                )
            finally:
                try:
                    device.set_value(DP_NORMAL_TIME, original, nowait=True)
                    result["rollback_sent"] = True
                    result["rollback_read_back"] = (
                        self._lab_receive_dp38_zone8(original, timeout_seconds) == original
                    )
                finally:
                    device.set_socketTimeout(5)

            result["probe_verified"] = bool(
                result["candidate_sent"]
                and result["candidate_read_back"]
                and result["rollback_sent"]
                and result["rollback_read_back"]
            )
            if not result["rollback_read_back"]:
                _LOGGER.error(
                    "HO-SC-8W protocol lab could not verify the Zone 8 DP38 rollback"
                )
            return result

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
