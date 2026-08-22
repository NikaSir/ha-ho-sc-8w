"""Base entity for read-only HO-SC-8W telemetry."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, MANUFACTURER, MODEL
from .coordinator import HOSC8WCoordinator


class HOSC8WEntity(CoordinatorEntity[HOSC8WCoordinator]):
    """Base class for all read-only HO-SC-8W entities."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: HOSC8WCoordinator) -> None:
        super().__init__(coordinator)
        self._device_id = coordinator.entry.data["device_id"]

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self._device_id)},
            name=self.coordinator.entry.data.get(
                "device_name", "Контроллер полива HO-SC-8W"
            ),
            manufacturer=MANUFACTURER,
            model=MODEL,
        )
