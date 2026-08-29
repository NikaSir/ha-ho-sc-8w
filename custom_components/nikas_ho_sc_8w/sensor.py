"""Read-only telemetry sensors for HO-SC-8W."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, NUM_ZONES
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
        if channel is not None:
            attrs.update(channel.as_dict())
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
        """Prefer factual DP107, with DP45 remaining time as a verified fallback."""
        device = self.coordinator.api.device
        raw_bitmask = int(device.active_zone or 0)
        if raw_bitmask:
            return raw_bitmask, "dp107"

        inferred = 0
        for zone in range(1, NUM_ZONES + 1):
            if int(device.zone_countdown.get(zone, 0) or 0) > 0:
                inferred |= 1 << (zone - 1)
        return inferred, "dp45_remaining" if inferred else "idle"

    @property
    def native_value(self) -> str:
        bitmask, _source = self._effective_bitmask()
        zones = [str(z) for z in range(1, NUM_ZONES + 1) if bitmask & (1 << (z - 1))]
        return ", ".join(zones) if zones else "None"

    @property
    def extra_state_attributes(self) -> dict:
        device = self.coordinator.api.device
        bitmask, source = self._effective_bitmask()
        return {
            "bitmask": bitmask,
            "source": source,
            "dp107_bitmask": int(device.active_zone or 0),
            "dp45_remaining_minutes": {
                str(zone): int(device.zone_countdown.get(zone, 0) or 0)
                for zone in range(1, NUM_ZONES + 1)
            },
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
