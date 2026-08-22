"""Read-only Home Assistant integration for INKBIRD / HiOazo HO-SC-8W."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import entity_registry as er

from .api import HOSC8WAPI
from .const import (
    CONF_CLOUD_API_KEY,
    CONF_CLOUD_API_REGION,
    CONF_CLOUD_API_SECRET,
    CONF_CONNECTION_MODE,
    CONF_DEVICE_ID,
    CONF_DEVICE_IP,
    CONF_LOCAL_KEY,
    CONNECTION_MODE_AUTO,
    CONNECTION_MODE_CLOUD,
    CONNECTION_MODE_LOCAL,
    DOMAIN,
)
from .coordinator import HOSC8WCoordinator
from .frontend import async_setup_panel

_LOGGER = logging.getLogger(__name__)

# b002 migration gate: no writable Home Assistant platforms are loaded.
PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Set up integration-wide resources once per Home Assistant process."""
    await async_setup_panel(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one HO-SC-8W config entry in read-only mode."""
    preference = entry.options.get(CONF_CONNECTION_MODE, CONNECTION_MODE_AUTO)
    if preference not in {
        CONNECTION_MODE_AUTO,
        CONNECTION_MODE_CLOUD,
        CONNECTION_MODE_LOCAL,
    }:
        preference = CONNECTION_MODE_AUTO

    api = HOSC8WAPI(
        entry.data[CONF_DEVICE_ID],
        entry.data[CONF_LOCAL_KEY],
        entry.data[CONF_DEVICE_IP],
        cloud_api_key=entry.data.get(CONF_CLOUD_API_KEY, ""),
        cloud_api_secret=entry.data.get(CONF_CLOUD_API_SECRET, ""),
        cloud_api_region=entry.data.get(CONF_CLOUD_API_REGION, "eu"),
        connection_preference=preference,
    )

    if preference == CONNECTION_MODE_CLOUD:
        connected = await hass.async_add_executor_job(api.activate_cloud)
        transport = "cloud"
    else:
        connected = await hass.async_add_executor_job(api.activate_local)
        transport = "local"
        if not connected and preference == CONNECTION_MODE_AUTO and api.has_cloud:
            connected = await hass.async_add_executor_job(api.activate_cloud)
            transport = "cloud"

    if not connected:
        raise ConfigEntryNotReady(
            f"Cannot connect to HO-SC-8W using requested policy {preference}"
        )

    _LOGGER.info("Starting HO-SC-8W read-only integration using %s transport", transport)
    coordinator = HOSC8WCoordinator(hass, api, entry)
    await coordinator.async_initialize_schedule_cache()
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    registry = er.async_get(hass)
    for entity in list(er.async_entries_for_config_entry(registry, entry.entry_id)):
        if entity.platform == DOMAIN and entity.domain in {"switch", "number", "select"}:
            registry.async_remove(entity.entity_id)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    async def _async_late_schedule_bootstrap(_event: Event | None = None) -> None:
        """Retry legacy snapshot import after YAML template entities exist."""
        imported = await coordinator.schedule_cache.async_late_bootstrap()
        if imported:
            _LOGGER.info("Late DP38 bootstrap imported %d schedule zone(s)", imported)
            coordinator.async_set_updated_data(api.device)

    if hass.state == CoreState.running:
        await _async_late_schedule_bootstrap()
    else:
        entry.async_on_unload(
            hass.bus.async_listen_once(
                EVENT_HOMEASSISTANT_STARTED,
                _async_late_schedule_bootstrap,
            )
        )

    await coordinator.async_start_listener()
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one HO-SC-8W config entry."""
    coordinator: HOSC8WCoordinator | None = hass.data.get(DOMAIN, {}).get(
        entry.entry_id
    )
    if coordinator:
        await coordinator.async_stop_listener()
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok
