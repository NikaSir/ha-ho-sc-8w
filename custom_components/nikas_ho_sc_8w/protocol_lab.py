"""Branch-only protocol laboratory actions for HO-SC-8W.

LAB ONLY: this module exists to execute the controlled DP38 Zone 8 hardware probe.
It must be removed before any production release that exposes writable behavior.
"""

from __future__ import annotations

from functools import partial
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import ServiceValidationError, Unauthorized
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .coordinator import HOSC8WCoordinator
from .models import DP38_PROTOCOL_LAB_ZONE

SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PREFLIGHT = "protocol_lab_zone8_rain_preflight"
SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PROBE = "protocol_lab_zone8_rain_probe"
ATTR_CONFIG_ENTRY_ID = "config_entry_id"
ATTR_FOLLOW_RAIN_SENSOR = "follow_rain_sensor"
ATTR_CONFIRMATION = "confirmation"
CONFIRMATION_TOKEN = "ZONE8_DP38_WRITE"

PREFLIGHT_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
    }
)

PROBE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_FOLLOW_RAIN_SENSOR): cv.boolean,
        vol.Required(ATTR_CONFIRMATION): cv.string,
    }
)


async def async_setup_protocol_lab(hass: HomeAssistant) -> None:
    """Register the branch-only, admin-gated Zone 8 protocol lab actions."""

    async def _async_get_admin_coordinator(call: ServiceCall) -> HOSC8WCoordinator:
        entry_id = call.data[ATTR_CONFIG_ENTRY_ID]

        # Laboratory actions must be explicitly initiated by a real HA admin.
        # System/automation contexts are rejected, including for preflight, so
        # the write workflow cannot be embedded into an unattended automation.
        user_id = call.context.user_id
        if user_id is None:
            raise Unauthorized(
                context=call.context,
                config_entry_id=entry_id,
            )
        user = await hass.auth.async_get_user(user_id)
        if user is None or not user.is_admin:
            raise Unauthorized(
                context=call.context,
                user_id=user_id,
                config_entry_id=entry_id,
            )

        entry = hass.config_entries.async_get_entry(entry_id)
        if entry is None:
            raise ServiceValidationError("HO-SC-8W config entry not found")
        if entry.state is not ConfigEntryState.LOADED:
            raise ServiceValidationError("HO-SC-8W config entry is not loaded")

        coordinator = hass.data.get(DOMAIN, {}).get(entry_id)
        if not isinstance(coordinator, HOSC8WCoordinator):
            raise ServiceValidationError("HO-SC-8W runtime is unavailable")
        return coordinator

    async def _async_handle_preflight(call: ServiceCall) -> dict[str, Any]:
        """Build and return the exact one-bit candidate without writing DP38."""
        coordinator = await _async_get_admin_coordinator(call)
        api = coordinator.api

        def _locked_preflight() -> dict[str, Any]:
            # Serialize against the persistent TinyTuya listener so the block,
            # source, active-zone and queued-zone facts form one coherent snapshot.
            with api._io_lock:
                channel = api.device.schedule_channels.get(DP38_PROTOCOL_LAB_ZONE)
                if channel is None:
                    raise RuntimeError("No decoded DP38 Zone 8 channel is available")
                current_follow = channel.rain_sensor_follow_inferred
                result = api.prepare_dp38_zone8_rain_probe(not current_follow)
                result["current_follow_rain_sensor"] = current_follow
                result["proposed_follow_rain_sensor"] = not current_follow
                result["preflight_only"] = True
                return result

        try:
            return await hass.async_add_executor_job(_locked_preflight)
        except (RuntimeError, ValueError) as exc:
            raise ServiceValidationError(str(exc)) from exc

    async def _async_handle_probe(call: ServiceCall) -> dict[str, Any]:
        """Execute the confirmed write/read-back/rollback transaction."""
        coordinator = await _async_get_admin_coordinator(call)
        confirmation = call.data[ATTR_CONFIRMATION]
        if confirmation != CONFIRMATION_TOKEN:
            raise ServiceValidationError(
                f"Confirmation must be exactly {CONFIRMATION_TOKEN}"
            )

        try:
            result = await hass.async_add_executor_job(
                partial(
                    coordinator.api._lab_write_dp38_zone8_rain_probe,
                    call.data[ATTR_FOLLOW_RAIN_SENSOR],
                    confirmation=confirmation,
                )
            )
        except (PermissionError, RuntimeError, ValueError) as exc:
            raise ServiceValidationError(str(exc)) from exc

        # The API transaction always attempts rollback in ``finally``. Persist
        # whatever controller state was actually read back so diagnostics never
        # report a stale pre-probe cache after the action returns.
        await coordinator.schedule_cache.async_save()
        coordinator.async_set_updated_data(coordinator.api.device)
        return result

    hass.services.async_register(
        DOMAIN,
        SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PREFLIGHT,
        _async_handle_preflight,
        schema=PREFLIGHT_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PROBE,
        _async_handle_probe,
        schema=PROBE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
