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

SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PROBE = "protocol_lab_zone8_rain_probe"
ATTR_CONFIG_ENTRY_ID = "config_entry_id"
ATTR_FOLLOW_RAIN_SENSOR = "follow_rain_sensor"
ATTR_CONFIRMATION = "confirmation"
CONFIRMATION_TOKEN = "ZONE8_DP38_WRITE"

SERVICE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_FOLLOW_RAIN_SENSOR): cv.boolean,
        vol.Required(ATTR_CONFIRMATION): cv.string,
    }
)


async def async_setup_protocol_lab(hass: HomeAssistant) -> None:
    """Register the branch-only, admin-gated Zone 8 protocol probe action."""

    async def _async_handle_probe(call: ServiceCall) -> dict[str, Any]:
        entry_id = call.data[ATTR_CONFIG_ENTRY_ID]

        # This action performs a controller write. System/automation contexts and
        # non-admin users are deliberately rejected even if they know the token.
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
        SERVICE_PROTOCOL_LAB_ZONE8_RAIN_PROBE,
        _async_handle_probe,
        schema=SERVICE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
