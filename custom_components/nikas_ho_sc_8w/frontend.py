"""Integration-owned frontend panel for HO-SC-8W."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    PANEL_ELEMENT_NAME,
    PANEL_ICON,
    PANEL_JS_URL,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_VERSION,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the integration-owned irrigation panel."""
    js_file = Path(__file__).parent / "frontend" / "irrigation-panel.js"
    if not js_file.is_file():
        _LOGGER.warning("HO-SC-8W panel asset is missing: %s", js_file)
        return

    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_JS_URL, str(js_file), False)]
        )
    except RuntimeError:
        _LOGGER.debug("HO-SC-8W panel static path already registered")

    if frontend.async_panel_exists(hass, PANEL_URL_PATH):
        _LOGGER.warning(
            "HO-SC-8W panel route /%s already exists; keeping existing panel",
            PANEL_URL_PATH,
        )
        return

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL_PATH,
        config={
            "_panel_custom": {
                "name": PANEL_ELEMENT_NAME,
                "embed_iframe": False,
                "trust_external": False,
                "js_url": f"{PANEL_JS_URL}?v={PANEL_VERSION}",
            },
            "version": PANEL_VERSION,
            "owner": "ha-ho-sc-8w",
            "preferred_view": "overview",
        },
        require_admin=False,
    )
    _LOGGER.info(
        "Registered HO-SC-8W irrigation panel at /%s (v%s)",
        PANEL_URL_PATH,
        PANEL_VERSION,
    )
