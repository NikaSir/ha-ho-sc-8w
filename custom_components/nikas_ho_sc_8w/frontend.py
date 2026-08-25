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
    PANEL_STATIC_URL,
    PANEL_PARENT_PATH,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_VERSION,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the self-contained integration-owned irrigation panel."""
    frontend_dir = Path(__file__).parent / "frontend"
    bundle_file = frontend_dir / Path(PANEL_JS_URL).name

    if not bundle_file.is_file():
        _LOGGER.warning("HO-SC-8W panel bundle is missing: %s", bundle_file)
        return

    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_STATIC_URL, str(frontend_dir), False)]
        )
    except RuntimeError:
        _LOGGER.debug("HO-SC-8W panel static path already registered")

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
            "preferred_view": "status",
            "parent_path": PANEL_PARENT_PATH,
            "header": {
                "title_alignment": "viewport_center",
                "left_action": "home_assistant_sidebar_menu",
                "right_action": "refresh",
                "menu_event": "hass-toggle-menu",
            },
            "navigation": {
                "primary": "full_width_fixed_bottom_tab_bar",
                "floating": False,
                "tabs": ["status", "zones", "program", "manual", "diagnostics"],
            },
            "information_architecture": {
                "status": "approved_render_system_state_summary_actions_statuses",
                "zones": "production_zones_1_6_status_and_drilldown",
                "program": "controller_resident_dp38_read_only_program",
                "manual": "zone_then_duration_then_start_gate",
                "diagnostics": "integration_health_and_zone_8_lab",
            },
            "frontend_bundle": {
                "mode": "self_contained",
                "runtime_historical_imports": False,
                "cache_busting": "query_string",
            },
            "system_visualization": {
                "hydraulic_path": "incoming_mainline_to_manifold_to_valves_to_zones",
                "mainline_connection_side": "left_direct_to_manifold",
                "electrical_path": "controller_to_valve_actuators",
                "rain_sensor_path": "rain_sensor_to_controller",
                "water_passes_through_controller": False,
                "orthogonal_zone_routing": True,
                "mobile_layout": "approved_light_reference_first_screen",
                "manifold_layout": "single_six_column_grid_with_shared_valve_pipe_zone_axes",
                "mainline_pressure_presentation": "text_only_two_decimal_bar_value",
                "theme_strategy": "fixed_light_reference_dark_theme_deferred",
                "production_zones": [1, 2, 3, 4, 5, 6],
                "mainline_state_source_verified": True,
                "mainline_entity_resolution": "sensor.nikas_h2000_pro_voda_na_poliv_2_then_bar_fallback",
                "zone_8_diagnostics_only": True,
            },
            "primary_device": "iphone_pro_max_portrait",
        },
        config_panel_domain=DOMAIN,
    )
    _LOGGER.info(
        "Registered HO-SC-8W irrigation panel at /%s (v%s, local assets)",
        PANEL_URL_PATH,
        PANEL_VERSION,
    )
