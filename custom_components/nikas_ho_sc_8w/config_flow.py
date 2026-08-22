"""Config flow for the standalone HO-SC-8W integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow
from homeassistant.data_entry_flow import FlowResult

from .api import HOSC8WAPI
from .const import (
    CONF_CLOUD_API_KEY,
    CONF_CLOUD_API_REGION,
    CONF_CLOUD_API_SECRET,
    CONF_DEVICE_ID,
    CONF_DEVICE_IP,
    CONF_DEVICE_NAME,
    CONF_LOCAL_KEY,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_DEVICE_NAME, default="Контроллер полива HO-SC-8W"): str,
        vol.Required(CONF_DEVICE_ID): str,
        vol.Required(CONF_LOCAL_KEY): str,
        vol.Required(CONF_DEVICE_IP): str,
        vol.Optional(CONF_CLOUD_API_KEY): str,
        vol.Optional(CONF_CLOUD_API_SECRET): str,
        vol.Optional(CONF_CLOUD_API_REGION, default="eu"): str,
    }
)


class HOSC8WConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle configuration for one HO-SC-8W controller."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            api = HOSC8WAPI(
                user_input[CONF_DEVICE_ID],
                user_input[CONF_LOCAL_KEY],
                user_input[CONF_DEVICE_IP],
                cloud_api_key=user_input.get(CONF_CLOUD_API_KEY, ""),
                cloud_api_secret=user_input.get(CONF_CLOUD_API_SECRET, ""),
                cloud_api_region=user_input.get(CONF_CLOUD_API_REGION, "eu"),
            )
            try:
                connected = await self.hass.async_add_executor_job(api.activate_local)
                if not connected and api.has_cloud:
                    connected = await self.hass.async_add_executor_job(api._cloud_update)
            finally:
                await self.hass.async_add_executor_job(api.close)
            if connected:
                await self.async_set_unique_id(user_input[CONF_DEVICE_ID])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=user_input[CONF_DEVICE_NAME], data=user_input
                )
            errors["base"] = "cannot_connect"
        return self.async_show_form(
            step_id="user", data_schema=STEP_USER_DATA_SCHEMA, errors=errors
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        return self.async_show_menu(
            step_id="reconfigure",
            menu_options=["reconfigure_local", "reconfigure_cloud"],
        )

    async def async_step_reconfigure_local(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            was_loaded = entry.entry_id in self.hass.data.get(DOMAIN, {})
            if was_loaded and not await self.hass.config_entries.async_unload(entry.entry_id):
                errors["base"] = "cannot_prepare_local"
            else:
                api = HOSC8WAPI(
                    entry.data[CONF_DEVICE_ID],
                    user_input[CONF_LOCAL_KEY],
                    user_input[CONF_DEVICE_IP],
                )
                try:
                    connected = await self.hass.async_add_executor_job(api.activate_local)
                finally:
                    await self.hass.async_add_executor_job(api.close)
                if connected:
                    return self.async_update_reload_and_abort(
                        entry,
                        data_updates={
                            CONF_LOCAL_KEY: user_input[CONF_LOCAL_KEY],
                            CONF_DEVICE_IP: user_input[CONF_DEVICE_IP],
                        },
                        reason="reconfigure_successful",
                    )
                if was_loaded:
                    await self.hass.config_entries.async_reload(entry.entry_id)
                errors["base"] = "cannot_connect_local"
        schema = vol.Schema(
            {
                vol.Required(CONF_LOCAL_KEY): str,
                vol.Required(
                    CONF_DEVICE_IP, default=entry.data.get(CONF_DEVICE_IP, "")
                ): str,
            }
        )
        return self.async_show_form(
            step_id="reconfigure_local", data_schema=schema, errors=errors
        )

    async def async_step_reconfigure_cloud(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            api = HOSC8WAPI(
                entry.data[CONF_DEVICE_ID],
                entry.data[CONF_LOCAL_KEY],
                entry.data[CONF_DEVICE_IP],
                cloud_api_key=user_input[CONF_CLOUD_API_KEY],
                cloud_api_secret=user_input[CONF_CLOUD_API_SECRET],
                cloud_api_region=user_input[CONF_CLOUD_API_REGION],
            )
            cloud_ok = await self.hass.async_add_executor_job(api._cloud_update)
            if cloud_ok:
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates={
                        CONF_CLOUD_API_KEY: user_input[CONF_CLOUD_API_KEY],
                        CONF_CLOUD_API_SECRET: user_input[CONF_CLOUD_API_SECRET],
                        CONF_CLOUD_API_REGION: user_input[CONF_CLOUD_API_REGION],
                    },
                    reason="reconfigure_successful",
                )
            errors["base"] = "cannot_connect"
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_CLOUD_API_KEY,
                    default=entry.data.get(CONF_CLOUD_API_KEY, ""),
                ): str,
                vol.Required(CONF_CLOUD_API_SECRET): str,
                vol.Required(
                    CONF_CLOUD_API_REGION,
                    default=entry.data.get(CONF_CLOUD_API_REGION, "eu"),
                ): str,
            }
        )
        return self.async_show_form(
            step_id="reconfigure_cloud", data_schema=schema, errors=errors
        )
