"""Production schedule-editor service for HO-SC-8W.

The runtime integration still instantiates StartProbeHOSC8WAPI. This module
adds the verified production DP38 writer to that class and registers one
Home Assistant service used by the UI editor.
"""

from __future__ import annotations

from functools import partial
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, NUM_ZONES
from .production_api import ProductionHOSC8WAPI
from .start_probe_api import StartProbeHOSC8WAPI

SERVICE_APPLY_ZONE_SCHEDULE = "apply_zone_schedule"
ATTR_CONFIG_ENTRY_ID = "config_entry_id"
ATTR_ZONE = "zone"
ATTR_SCHEDULE = "schedule"

_APPLY_ZONE_SCHEDULE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_ZONE): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=NUM_ZONES)
        ),
        vol.Required(ATTR_SCHEDULE): dict,
    },
    extra=vol.PREVENT_EXTRA,
)

_PATCHED = False


def _install_api_methods() -> None:
    """Attach the production writer to the already-instantiated API class."""
    global _PATCHED
    if _PATCHED:
        return
    StartProbeHOSC8WAPI._normalize_schedule_patch = staticmethod(  # type: ignore[attr-defined]
        ProductionHOSC8WAPI._normalize_schedule_patch
    )
    StartProbeHOSC8WAPI.apply_zone_schedule = (  # type: ignore[attr-defined]
        ProductionHOSC8WAPI.apply_zone_schedule
    )
    _PATCHED = True


def _coordinator_for_call(hass: HomeAssistant, call: ServiceCall) -> Any:
    coordinators = hass.data.get(DOMAIN, {})
    entry_id = call.data.get(ATTR_CONFIG_ENTRY_ID)
    if entry_id:
        coordinator = coordinators.get(entry_id)
        if coordinator is None:
            raise HomeAssistantError(
                f"HO-SC-8W config entry {entry_id} is not loaded"
            )
        return coordinator
    loaded = list(coordinators.values())
    if len(loaded) != 1:
        raise HomeAssistantError(
            "Specify config_entry_id when zero or multiple HO-SC-8W controllers are loaded"
        )
    return loaded[0]


async def _async_apply_zone_schedule(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    coordinator = _coordinator_for_call(hass, call)
    zone = int(call.data[ATTR_ZONE])
    schedule = dict(call.data[ATTR_SCHEDULE])
    try:
        async with coordinator._transport_lock:  # noqa: SLF001 - integration-owned service
            await hass.async_add_executor_job(
                coordinator.api.apply_zone_schedule,
                zone,
                schedule,
            )
            await coordinator.schedule_cache.async_save()
            coordinator.async_set_updated_data(coordinator.api.device)
    except (PermissionError, RuntimeError, TypeError, ValueError) as exc:
        coordinator.async_set_updated_data(coordinator.api.device)
        raise HomeAssistantError(str(exc)) from exc


def setup_production_service(hass: HomeAssistant) -> None:
    """Register the production schedule service exactly once."""
    _install_api_methods()
    if hass.services.has_service(DOMAIN, SERVICE_APPLY_ZONE_SCHEDULE):
        return
    hass.services.async_register(
        DOMAIN,
        SERVICE_APPLY_ZONE_SCHEDULE,
        partial(_async_apply_zone_schedule, hass),
        schema=_APPLY_ZONE_SCHEDULE_SCHEMA,
    )
