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
    PANEL_STATIC_URL,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_VERSION,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the self-contained integration-owned irrigation panel."""
    frontend_dir = Path(__file__).parent / "frontend"
    bundle_relative = PANEL_JS_URL.removeprefix(f"{PANEL_STATIC_URL}/")
    bundle_file = frontend_dir / bundle_relative

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
            "rule_set": "1.17",
            "owner": "ha-ho-sc-8w",
            "preferred_view": "status",
            "parent_path": PANEL_PARENT_PATH,
            "header": {
                "title_alignment": "viewport_center",
                "center_action": "parent_panel_return",
                "left_action": "home_assistant_sidebar_menu",
                "right_action": "refresh",
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
                "status": "system_state_connection_pressure_informative_zones_program_mode_seasonal_read_only",
                "zones": "production_zones_1_6_complete_read_only_program_drilldown",
                "program": "direct_zone_1_8_controller_resident_dp38_read_only_program",
                "manual": "multi_zone_queue_per_zone_duration_confirmed_start",
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
            "control_actions": {
                "policy": "draft_explicit_apply_confirmation_write_readback",
                "frontend_raw_dp_writes": False,
                "manual_queue": {
                    "production_zones": [1, 2, 3, 4, 5, 6],
                    "per_zone_duration_minutes": [1, 120],
                    "execution_order": "ascending_controller_order",
                    "readback_dps": [101, 107, 108],
                },
                "seasonal_adjustment": {
                    "range_percent": [-90, 100],
                    "step_percent": 10,
                    "status_view": "read_only",
                    "editable_view": "not_exposed_in_panel",
                    "apply_location": "none",
                    "explicit_apply": True,
                    "readback_dps": [103],
                },
                "zone_8_schedule_lab": {
                    "zone": 8,
                    "write_enabled": False,
                    "mode": "decoded_read_only_after_cross_zone_write_incident",
                    "decoded_editor_source": (
                        "latest_repeated_valid_zone_8_raw_dp38"
                    ),
                    "hex_probe_enabled": True,
                    "recovery_enabled": False,
                    "anchor_date_test_enabled": False,
                    "anchor_date_test_from_hex": (
                        "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090311"
                    ),
                    "anchor_date_test_to_hex": (
                        "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090211"
                    ),
                    "anchor_date_test_changed_byte_offset": 18,
                    "hex_probe_transport": "uppercase_ascii_hex",
                    "hex_probe_scope": "complete_zone_1_8_raw_observer_read_only",
                    "requires_complete_cache": False,
                    "requires_controller_source": True,
                    "requires_idle_controller": True,
                    "requires_physical_mode": "OFF",
                    "requires_exact_repeated_preflight": True,
                    "persistent_exact_backup": True,
                    "explicit_restore": False,
                    "readback_dps": [38],
                    "maximum_generic_writes_per_action": 0,
                    "anchor_date_test_maximum_writes_per_action": 0,
                    "automatic_retry": False,
                    "automatic_rollback": False,
                    "observed_cross_zone_write": {
                        "requested_zone": 8,
                        "affected_zone": 4,
                        "zone_8_unchanged": True,
                        "destination_selection": "not_isolated",
                        "cycle_encoding": "not_isolated",
                    },
                    "production_zones_untouched": [1, 2, 3, 5, 6],
                    "zone8_mask_write_test": {
                        "enabled": True,
                        "read_zone_identifier": "0x08",
                        "write_zone_mask": "0x80",
                        "frame_bytes": 20,
                        "transport": "40_uppercase_ascii_hex_characters",
                        "change": "zone_8_anchor_day_04_to_05_at_byte_18",
                        "maximum_writes_per_action": 1,
                        "requires_fresh_baseline": True,
                        "requires_control_snapshot": True,
                        "automatic_retry": False,
                        "automatic_rollback": False,
                        "protocol_evidence": "DP38 uploads/downloads each station in eight separate operations",
                    },
                },
            },
            "typography": {
                "meaningful_min_px": 12,
                "meaningful_max_px": 25,
                "schematic_redundant_annotation_px": 10,
            },
            "responsive_geometry": {
                "reference_canvas_px": [1280, 800],
                "desktop_max_width_px": 1280,
            },
            "connection_indicator": {
                "two_level_indicator_enabled": True,
                "policy": "explicit_product_request",
                "transport": ["Локально", "Облако", "Резерв", "Нет связи", "Нет данных"],
                "freshness": ["Данные актуальны", "Данные устарели", "Нет данных"],
                "stable_dom": True,
            },
            "system_visualization": {
                "hydraulic_path": "not_rendered_on_status_view",
                "mainline_connection_side": "left_direct_to_manifold",
                "electrical_path": "controller_to_six_numbered_zone_nodes",
                "rain_sensor_path": "direct_horizontal_midline_to_controller",
                "water_passes_through_controller": False,
                "orthogonal_zone_routing": True,
                "mobile_layout": "status_fits_work_viewport_without_scroll_at_100",
                "status_scroll_at_100": False,
                "zone_card_fields": ["image", "zone_number", "activity", "program_duration"],
                "zone_time_layout": "duration_muted_line_all_start_times_separate_bold_line",
                "zone_detail_fields": [
                    "base_duration",
                    "six_start_slots",
                    "cycle_mode_and_value",
                    "weekly_days",
                    "cycle_anchor_date",
                    "seasonal_adjustment",
                    "calculated_next_start",
                    "rain_sensor_follow",
                ],
                "control_wire_caption": False,
                "rain_sensor_semantics": "dp102_follow_enabled_or_bypassed_current_wet_contact_not_exposed",
                "manifold_layout": "removed_from_status_view",
                "mainline_pressure_presentation": "text_only_two_decimal_bar_value_below_connection_status",
                "theme_strategy": "fixed_light_reference_dark_theme_deferred",
                "production_zones": [1, 2, 3, 4, 5, 6],
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
                "viewport_locked_host": True,
                "outer_document_scroll_owner": False,
                "scroll_boundary_guard": "prevent_default_at_top_and_bottom",
                "fixed_chrome_touch_action": "none",
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
