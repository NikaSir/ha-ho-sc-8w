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

_PANEL_PREREQUISITES = (
    ("/nikas-ho-sc-8w/irrigation-panel-v03.js", "irrigation-panel-v03.js"),
    ("/nikas-ho-sc-8w/irrigation-panel-v032.js", "irrigation-panel-v032.js"),
    ("/nikas-ho-sc-8w/irrigation-panel-v033.js", "irrigation-panel-v033.js"),
    ("/nikas-ho-sc-8w/irrigation-panel-v040.js", "irrigation-panel-v040.js"),
)


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the integration-owned irrigation panel."""
    frontend_dir = Path(__file__).parent / "frontend"
    current_file = frontend_dir / Path(PANEL_JS_URL).name
    prerequisite_files = [frontend_dir / name for _, name in _PANEL_PREREQUISITES]

    missing = [path for path in [*prerequisite_files, current_file] if not path.is_file()]
    if missing:
        _LOGGER.warning("HO-SC-8W panel asset(s) missing: %s", ", ".join(map(str, missing)))
        return

    static_paths = [
        StaticPathConfig(url, str(frontend_dir / name), False)
        for url, name in _PANEL_PREREQUISITES
    ]
    static_paths.append(StaticPathConfig(PANEL_JS_URL, str(current_file), False))

    try:
        await hass.http.async_register_static_paths(static_paths)
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
            "header": {
                "title_alignment": "viewport_center",
                "show_brand_icon": False,
                "back": {
                    "icon": "mdi:arrow-left",
                    "parent_path": PANEL_PARENT_PATH,
                },
            },
            "navigation": {
                "primary": "full_width_fixed_bottom_tab_bar",
                "floating": False,
                "tabs": ["overview", "manual", "settings", "diagnostics"],
            },
            "information_architecture": {
                "overview": "compact_program_status_and_zone_drilldown",
                "manual": "zone_then_duration_then_start",
                "settings": "controller_global_parameters",
                "diagnostics": "integration_health_and_program_audit",
                "program_audit": "diagnostics_drilldown_read_only",
            },
            "overview_density": {
                "target": "all_zones_1_6_visible_without_scroll",
                "viewport": "iphone_pro_max_portrait",
            },
            "primary_device": "iphone_pro_max_portrait",
        },
        config_panel_domain=DOMAIN,
    )
    _LOGGER.info(
        "Registered HO-SC-8W irrigation panel at /%s (v%s)",
        PANEL_URL_PATH,
        PANEL_VERSION,
    )
