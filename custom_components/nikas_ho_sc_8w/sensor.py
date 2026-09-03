"""Read-only telemetry sensors for HO-SC-8W."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    CONNECTION_MODE_LOCAL,
    DOMAIN,
    NUM_ZONES,
    ZONE8_ANCHOR_DATE_TEST_ENABLED,
    ZONE8_ANCHOR_DATE_TEST_TARGET_HEX,
    ZONE8_DP38_HEX_PROBE_ENABLED,
    ZONE8_DP38_WRITES_ENABLED,
    ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX,
    ZONE8_MASK_WRITE_TEST_ENABLED,
    ZONE8_DAMAGED_BLOCK_HEX,
    ZONE8_KNOWN_BACKUP_HEX,
    ZONE8_KNOWN_RESTORE_ENABLED,
)
from .coordinator import HOSC8WCoordinator
from .entity import HOSC8WEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: HOSC8WCoordinator = hass.data[DOMAIN][entry.entry_id]
    entities: list[SensorEntity] = []
    for zone in range(1, NUM_ZONES + 1):
        entities.extend(
            [
                HOSC8WZoneRemaining(coordinator, zone),
                HOSC8WZoneElapsed(coordinator, zone),
                HOSC8WScheduleZone(coordinator, zone),
            ]
        )
    entities.extend(
        [
            HOSC8WOperationMode(coordinator),
            HOSC8WConnectionMode(coordinator),
            HOSC8WIrrigationMode(coordinator),
            HOSC8WActiveZones(coordinator),
            HOSC8WQueuedZones(coordinator),
            HOSC8WSeasonalAdjustmentSensor(coordinator),
            HOSC8WRainSensorState(coordinator),
            HOSC8WTimerErrorState(coordinator),
            HOSC8WAlarmVoiceState(coordinator),
            HOSC8WScheduleCacheStatus(coordinator),
            HOSC8WMergeHistoryRaw(coordinator),
        ]
    )
    async_add_entities(entities)


class HOSC8WZoneRemaining(HOSC8WEntity, SensorEntity):
    _attr_native_unit_of_measurement = "min"
    _attr_icon = "mdi:timer-outline"
    _attr_suggested_display_precision = 0

    def __init__(self, coordinator: HOSC8WCoordinator, zone: int) -> None:
        super().__init__(coordinator)
        self._zone = zone
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_zone_{zone}_remaining"
        self._attr_name = f"Zone {zone} time remaining"

    @property
    def native_value(self) -> int:
        return self.coordinator.api.device.zone_countdown.get(self._zone, 0)


class HOSC8WZoneElapsed(HOSC8WEntity, SensorEntity):
    _attr_native_unit_of_measurement = "min"
    _attr_icon = "mdi:timer-check-outline"
    _attr_suggested_display_precision = 0

    def __init__(self, coordinator: HOSC8WCoordinator, zone: int) -> None:
        super().__init__(coordinator)
        self._zone = zone
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_zone_{zone}_elapsed"
        self._attr_name = f"Zone {zone} time elapsed"

    @property
    def native_value(self) -> int:
        return self.coordinator.api.device.zone_duration.get(self._zone, 0)


class HOSC8WScheduleZone(HOSC8WEntity, SensorEntity):
    """Latest DP38 block cached for one zone."""

    _attr_icon = "mdi:calendar-clock"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: HOSC8WCoordinator, zone: int) -> None:
        super().__init__(coordinator)
        self._zone = zone
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_schedule_zone_{zone}"
        self._attr_name = f"Schedule zone {zone}"

    @property
    def native_value(self) -> str:
        channel = self.coordinator.api.device.schedule_channels.get(self._zone)
        if channel is None:
            return "unknown"
        return "configured" if channel.enabled else "disabled"

    @property
    def extra_state_attributes(self) -> dict:
        device = self.coordinator.api.device
        channel = device.schedule_channels.get(self._zone)
        block = device.schedule_blocks.get(self._zone)
        attrs = {
            "zone": self._zone,
            "source_dp": 38,
            "block_size": 20,
            "raw_hex": block.hex().upper() if block else "",
            "cache_source": device.schedule_sources.get(self._zone, "missing"),
            "complete_zone_cache": len(device.schedule_blocks) == NUM_ZONES,
        }
        if self._zone == 8:
            attrs.update(
                {
                    "lab_backup_available": device.zone8_lab_backup_available,
                    "lab_last_status": device.zone8_lab_last_status,
                    "lab_last_field": device.zone8_lab_last_field,
                    "lab_requested_value": device.zone8_lab_requested_value,
                    "lab_last_readback_raw": device.zone8_lab_last_readback_raw,
                    "lab_write_allowed": (
                        ZONE8_DP38_WRITES_ENABLED
                        and len(device.schedule_blocks) == NUM_ZONES
                        and device.schedule_sources.get(8) == "controller"
                        and not device.active_zone
                        and not device.queued_zone
                    ),
                    "hex_probe_status": device.zone8_hex_probe_status,
                    "hex_probe_detail": device.zone8_hex_probe_detail,
                    "hex_probe_samples": device.zone8_hex_probe_samples,
                    "hex_probe_trace": device.zone8_hex_probe_trace,
                    "hex_probe_allowed": (
                        ZONE8_DP38_HEX_PROBE_ENABLED
                        and self.coordinator.api.active_transport
                        == CONNECTION_MODE_LOCAL
                        and str(device.operation_mode).lower() == "off"
                        and not device.active_zone
                        and not device.queued_zone
                    ),
                    "dp38_snapshot_status": device.dp38_snapshot_status,
                    "dp38_snapshot_detail": device.dp38_snapshot_detail,
                    "dp38_snapshot_baseline": [
                        device.dp38_snapshot_baseline[zone]
                        for zone in sorted(device.dp38_snapshot_baseline)
                    ],
                    "dp38_snapshot_current": [
                        device.dp38_snapshot_current[zone]
                        for zone in sorted(device.dp38_snapshot_current)
                    ],
                    "dp38_snapshot_diff": device.dp38_snapshot_diff,
                    "dp38_snapshot_baseline_at": (
                        device.dp38_snapshot_baseline_at
                    ),
                    "dp38_snapshot_current_at": device.dp38_snapshot_current_at,
                    "dp38_snapshot_trace": device.dp38_snapshot_trace,
                    "dp38_snapshot_baseline_available": (
                        len(device.dp38_snapshot_baseline) == NUM_ZONES
                    ),
                    "dp38_snapshot_allowed": (
                        self.coordinator.api.active_transport
                        == CONNECTION_MODE_LOCAL
                        and str(device.operation_mode).lower() == "auto"
                        and not device.active_zone
                        and not device.queued_zone
                    ),
                    "mask_write_test_status": device.zone8_mask_write_test_status,
                    "mask_write_test_detail": device.zone8_mask_write_test_detail,
                    "mask_write_test_attempted": device.zone8_mask_write_test_attempted,
                    "mask_write_test_current_read_hex": (
                        device.zone8_mask_write_test_current_read_hex
                    ),
                    "mask_write_test_payload_hex": (
                        device.zone8_mask_write_test_payload_hex
                    ),
                    "mask_write_test_expected_read_hex": (
                        device.zone8_mask_write_test_expected_read_hex
                    ),
                    "mask_write_test_allowed": (
                        ZONE8_MASK_WRITE_TEST_ENABLED
                        and self.coordinator.api.active_transport
                        == CONNECTION_MODE_LOCAL
                        and str(device.operation_mode).lower() == "auto"
                        and not device.active_zone
                        and not device.queued_zone
                        and not device.zone8_mask_write_test_attempted
                        and device.dp38_snapshot_status == "baseline_saved"
                        and device.dp38_snapshot_baseline.get(8, {}).get("raw_hex")
                        == ZONE8_MASK_WRITE_TEST_CURRENT_READ_HEX
                    ),
                    "known_restore_status": device.zone8_restore_status,
                    "known_restore_detail": device.zone8_restore_detail,
                    "known_restore_from_hex": device.zone8_restore_from_hex,
                    "known_restore_to_hex": device.zone8_restore_to_hex,
                    "known_restore_readback_hex": device.zone8_restore_readback_hex,
                    "known_restore_expected_from_hex": ZONE8_DAMAGED_BLOCK_HEX,
                    "known_restore_expected_to_hex": ZONE8_KNOWN_BACKUP_HEX,
                    "known_restore_allowed": (
                        ZONE8_KNOWN_RESTORE_ENABLED
                        and self.coordinator.api.active_transport
                        == CONNECTION_MODE_LOCAL
                        and str(device.operation_mode).lower() == "off"
                        and not device.active_zone
                        and not device.queued_zone
                    ),
                    "anchor_date_test_status": device.zone8_anchor_date_test_status,
                    "anchor_date_test_detail": device.zone8_anchor_date_test_detail,
                    "anchor_date_test_from_hex": device.zone8_anchor_date_test_from_hex,
                    "anchor_date_test_to_hex": device.zone8_anchor_date_test_to_hex,
                    "anchor_date_test_readback_hex": (
                        device.zone8_anchor_date_test_readback_hex
                    ),
                    "anchor_date_test_expected_from_hex": ZONE8_KNOWN_BACKUP_HEX,
                    "anchor_date_test_expected_to_hex": (
                        ZONE8_ANCHOR_DATE_TEST_TARGET_HEX
                    ),
                    "anchor_date_test_attempted": (
                        device.zone8_anchor_date_test_attempted
                    ),
                    "anchor_date_test_allowed": (
                        ZONE8_ANCHOR_DATE_TEST_ENABLED
                        and self.coordinator.api.active_transport
                        == CONNECTION_MODE_LOCAL
                        and str(device.operation_mode).lower() == "off"
                        and not device.active_zone
                        and not device.queued_zone
                        and not device.zone8_anchor_date_test_attempted
                    ),
                }
            )
        if channel is not None:
            attrs.update(channel.as_dict())
        if block:
            attrs["start_slots"] = [
                (
                    None
                    if block[2 + slot] == 0xFF and block[8 + slot] == 0xFF
                    else f"{block[2 + slot]:02d}:{block[8 + slot]:02d}"
                )
                for slot in range(6)
            ]
        return attrs


class HOSC8WOperationMode(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:water-pump"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_operation_mode"
        self._attr_name = "Operation mode"

    @property
    def native_value(self) -> str:
        return self.coordinator.api.device.operation_mode


class HOSC8WConnectionMode(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:connection"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_connection_mode"
        self._attr_name = "Connection mode"

    @property
    def native_value(self) -> str:
        return self.coordinator.api.active_transport

    @property
    def extra_state_attributes(self) -> dict:
        return {
            "selected_preference": self.coordinator.api.connection_preference,
            "active_transport": self.coordinator.api.active_transport,
            "fail_count": self.coordinator.api.fail_count,
            "online": self.coordinator.api.device.online,
            "cloud_available": self.coordinator.api.has_cloud,
            "device_model": "HO-SC-8W",
            "tuya_protocol": "3.3",
        }


class HOSC8WIrrigationMode(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:format-list-numbered"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_irrigation_mode"
        self._attr_name = "Irrigation mode"

    @property
    def native_value(self) -> str:
        return self.coordinator.api.device.irrigation_mode


class HOSC8WActiveZones(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:sprinkler"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_active_zones"
        self._attr_name = "Active zones"

    def _effective_bitmask(self) -> tuple[int, str]:
        """Report active watering only when the controller confirms it via DP107."""
        device = self.coordinator.api.device
        raw_bitmask = int(device.active_zone or 0)
        return raw_bitmask, "dp107" if raw_bitmask else "idle"

    @property
    def native_value(self) -> str:
        bitmask, _source = self._effective_bitmask()
        zones = [str(z) for z in range(1, NUM_ZONES + 1) if bitmask & (1 << (z - 1))]
        return ", ".join(zones) if zones else "None"

    @property
    def extra_state_attributes(self) -> dict:
        device = self.coordinator.api.device
        bitmask, source = self._effective_bitmask()
        dp45_remaining = {
            str(zone): int(device.zone_countdown.get(zone, 0) or 0)
            for zone in range(1, NUM_ZONES + 1)
        }
        return {
            "bitmask": bitmask,
            "source": source,
            "dp107_bitmask": int(device.active_zone or 0),
            "dp45_remaining_minutes": dp45_remaining,
            "dp45_unconfirmed": bitmask == 0 and any(dp45_remaining.values()),
            "operation_mode": device.operation_mode,
        }


class HOSC8WQueuedZones(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:playlist-play"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_queued_zones"
        self._attr_name = "Queued zones"

    @property
    def native_value(self) -> str:
        bitmask = self.coordinator.api.device.queued_zone
        zones = [str(z) for z in range(1, NUM_ZONES + 1) if bitmask & (1 << (z - 1))]
        return ", ".join(zones) if zones else "None"

    @property
    def extra_state_attributes(self) -> dict:
        return {"bitmask": self.coordinator.api.device.queued_zone}


class HOSC8WSeasonalAdjustmentSensor(HOSC8WEntity, SensorEntity):
    _attr_native_unit_of_measurement = "%"
    _attr_icon = "mdi:percent-outline"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_seasonal_adjustment"
        self._attr_name = "Seasonal adjustment"

    @property
    def native_value(self) -> int:
        return self.coordinator.api.device.seasonal_adjust


class HOSC8WRainSensorState(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:weather-rainy"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_rain_sensor_state"
        self._attr_name = "Rain sensor"

    @property
    def native_value(self) -> str:
        return "enabled" if self.coordinator.api.device.rain_sensor_enabled else "disabled"


class HOSC8WTimerErrorState(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:alarm-light-outline"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_timer_error_state"
        self._attr_name = "Timer error alarm"

    @property
    def native_value(self) -> str:
        return "active" if self.coordinator.api.device.timeerror_alarm else "clear"


class HOSC8WAlarmVoiceState(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:volume-alert"

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_alarm_voice_state"
        self._attr_name = "Alarm voice cancel"

    @property
    def native_value(self) -> str:
        return "cancelled" if self.coordinator.api.device.cancel_alarm_voice else "enabled"


class HOSC8WScheduleCacheStatus(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:database-check-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_schedule_cache_status"
        self._attr_name = "Schedule cache"

    @property
    def native_value(self) -> str:
        return "complete" if len(self.coordinator.api.device.schedule_blocks) == NUM_ZONES else "partial"

    @property
    def extra_state_attributes(self) -> dict:
        device = self.coordinator.api.device
        present = sorted(device.schedule_blocks)
        return {
            "present_zones": present,
            "missing_zones": [z for z in range(1, NUM_ZONES + 1) if z not in present],
            "block_count": len(present),
            "sources": {str(z): device.schedule_sources.get(z, "unknown") for z in present},
            "controller_write_performed": False,
        }


class HOSC8WMergeHistoryRaw(HOSC8WEntity, SensorEntity):
    _attr_icon = "mdi:code-braces"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_entity_registry_enabled_default = False

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_{self._device_id}_merge_history_raw"
        self._attr_name = "Merge history raw"

    @property
    def native_value(self) -> str:
        raw = self.coordinator.api.device.merge_history_raw
        return raw.hex().upper() if raw else ""

    @property
    def extra_state_attributes(self) -> dict:
        return {"source_dp": 104, "semantic_decoding_verified": False}
