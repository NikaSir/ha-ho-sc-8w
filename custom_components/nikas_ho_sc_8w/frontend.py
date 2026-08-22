"""Integration-owned frontend panel for HO-SC-8W."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    PANEL_ELEMENT_NAME,
    PANEL_ICON,
    PANEL_JS_URL,
    PANEL_PARENT_PATH,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_VERSION,
)

_LOGGER = logging.getLogger(__name__)

_BASE_JS_URL = "/nikas-ho-sc-8w/irrigation-panel-v03.js"
_BASE_JS_NAME = "irrigation-panel-v03.js"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the integration-owned irrigation panel."""
    frontend_dir = Path(__file__).parent / "frontend"
    js_file = frontend_dir / Path(PANEL_JS_URL).name
    base_js_file = frontend_dir / _BASE_JS_NAME
    if not js_file.is_file() or not base_js_file.is_file():
        _LOGGER.warning(
            "HO-SC-8W panel asset is missing: module=%s base=%s",
            js_file,
            base_js_file,
        )
        return

    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(_BASE_JS_URL, str(base_js_file), False),
                StaticPathConfig(PANEL_JS_URL, str(js_file), False),
            ]
        )
    except RuntimeError:
        _LOGGER.debug("HO-SC-8W panel static paths already registered")

    if frontend.async_panel_exists(hass, PANEL_URL_PATH):
        _LOGGER.warning(
            "HO-SC-8W panel route /%s already exists; keeping existing panel",
            PANEL_URL_PATH,
        )
        return

    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_ELEMENT_NAME,
        module_url=f"{PANEL_JS_URL}?v={PANEL_VERSION}",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=False,
        handle_safe_area=True,
        config={
            "version": PANEL_VERSION,
            "owner": "ha-ho-sc-8w",
            "preferred_view": "overview",
            "parent_path": PANEL_PARENT_PATH,
            "navigation": "fixed_bottom_bar",
            "header_back": "explicit_parent_route",
            "primary_device": "iphone_pro_max_portrait",
        },
        config_panel_domain=DOMAIN,
    )
    _LOGGER.info(
        "Registered HO-SC-8W irrigation panel at /%s (v%s)",
        PANEL_URL_PATH,
        PANEL_VERSION,
    )
