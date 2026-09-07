"""Explicit prepare/execute services for the isolated Zone 7 Odd/Even probe."""

from __future__ import annotations

from functools import partial

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .parity_probe_api import ZONE7_PARITY_CONFIRMATION, Zone7ParityProbeMixin
from .production_service import _coordinator_for_call
from .start_probe_api import StartProbeHOSC8WAPI

SERVICE_PREPARE_ZONE7_PARITY = "prepare_zone7_parity"
SERVICE_EXECUTE_ZONE7_PARITY = "execute_zone7_parity"

_PREPARE_ZONE7_PARITY_SCHEMA = vol.Schema({
    vol.Optional("config_entry_id"): cv.string,
    vol.Required("mode"): vol.In(["odd", "even"]),
}, extra=vol.PREVENT_EXTRA)
_EXECUTE_ZONE7_PARITY_SCHEMA = vol.Schema({
    vol.Optional("config_entry_id"): cv.string,
    vol.Required("plan_id"): cv.string,
    vol.Required("confirmation"): vol.In([ZONE7_PARITY_CONFIRMATION]),
}, extra=vol.PREVENT_EXTRA)


def _install_api_methods() -> None:
    for name, method in vars(Zone7ParityProbeMixin).items():
        if name.startswith("_parity_") or name in {"prepare_zone7_parity", "execute_zone7_parity"}:
            setattr(StartProbeHOSC8WAPI, name, method)


async def _async_parity_call(hass: HomeAssistant, call: ServiceCall, *, execute: bool) -> None:
    coordinator = _coordinator_for_call(hass, call)
    method = coordinator.api.execute_zone7_parity if execute else coordinator.api.prepare_zone7_parity
    args = (call.data["plan_id"], call.data["confirmation"]) if execute else (call.data["mode"],)
    try:
        async with coordinator._transport_lock:  # noqa: SLF001 - integration-owned service
            try:
                await hass.async_add_executor_job(method, *args)
            finally:
                # Publish complete or partial factual observations even when a
                # command throws after transport dispatch or read-back fails.
                coordinator.async_set_updated_data(coordinator.api.device)
                await coordinator.schedule_cache.async_save()
    except Exception as exc:
        raise HomeAssistantError(str(exc)) from exc


def setup_parity_probe_services(hass: HomeAssistant) -> None:
    """Expose only fixed Zone 7 modes; no arbitrary zone or raw-byte service."""
    _install_api_methods()
    for service, schema, execute in (
        (SERVICE_PREPARE_ZONE7_PARITY, _PREPARE_ZONE7_PARITY_SCHEMA, False),
        (SERVICE_EXECUTE_ZONE7_PARITY, _EXECUTE_ZONE7_PARITY_SCHEMA, True),
    ):
        if not hass.services.has_service(DOMAIN, service):
            hass.services.async_register(
                DOMAIN, service, partial(_async_parity_call, hass, execute=execute), schema=schema,
            )
