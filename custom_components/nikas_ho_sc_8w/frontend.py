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
                "center_action": "return_to_source_base_panel",
                "center_style": "clickable_plaque",
                "center_chevron": False,
                "source_return_resolution": ["query_from", "history_state_from", "parent_path"],
                "menu_event": "hass-toggle-menu",
            },
            "navigation": {
                "primary": "full_width_fixed_bottom_tab_bar",
                "floating": False,
                "header_grid": "52px_minmax_52px_48px_narrow",
                "header_button_px": 44,
                "header_icon_px": 25,
                "header_title_px": 23,
                "header_subtitle_px": 14,
                "header_narrow_title_px": 21,
                "header_narrow_subtitle_px": 13,
                "bottom_tab_min_height_px": 52,
                "bottom_tab_icon_px": 28,
                "bottom_tab_label_px": 12,
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
                "stable_shell_dom": True,
                "shadow_root_inner_html": "initial_mount_only",
                "telemetry_updates": "patch_existing_nodes",
                "view_switching": "lazy_dom_cache_and_reattach",
            },
            "typography": {
                "meaningful_min_px": 12,
                "meaningful_max_px": 25,
                "schematic_redundant_annotation_px": 10,
            },
            "connection_indicator": {
                "two_level_indicator_enabled": False,
                "policy": "opt_in_only",
                "existing_transport_badge_preserved": True,
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
                "mainline_pressure_presentation": "text_only_two_decimal_bar_value_below_connection_status",
                "theme_strategy": "fixed_light_reference_dark_theme_deferred",
                "production_zones": [1, 2, 3, 4, 5, 6],
                "zone_thumbnails": {1: "lawn", 2: "lawn", 3: "lawn", 4: "flowerbed", 5: "shrubs", 6: "greenhouse"},
                "mainline_state_source_verified": True,
                "mainline_entity_resolution": "sensor.nikas_h2000_pro_voda_na_poliv_2_then_bar_fallback",
                "zone_8_diagnostics_only": True,
            },
            "content_zoom": {
                "engine": "native_scroll_100_transform_pan_above_100_v3",
                "default_percent": 100,
                "reset_percent": 100,
                "minimum_percent": 75,
                "maximum_percent": 200,
                "controls": "two_finger_pinch_and_two_finger_double_tap_reset",
                "permanent_onscreen_controls": False,
                "scope": "single_work_canvas_only_header_and_bottom_navigation_native",
                "pinch_origin": "touch_midpoint",
                "native_vertical_scroll_at_100": True,
                "horizontal_scroll_at_100": False,
                "origin_at_100": [0, 0],
                "one_pointer_pan_above_100_only": True,
                "pan_only_on_overflowing_axes": True,
                "clamp_after_resize": True,
                "tab_change_returns_to_top": True,
                "snap_to_100_percent": [97, 103],
                "persist_per_panel_client_and_view": True,
                "shell_reconciliation": "stable_dom_point_patch",
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
