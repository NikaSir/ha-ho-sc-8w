#!/usr/bin/env python3
"""Verify the safety-critical HO-SC-8W write and release contract."""

from __future__ import annotations

import importlib.util
import json
import struct
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "nikas_ho_sc_8w"
FRONTEND = INTEGRATION / "frontend"
EXPECTED_INTEGRATION_VERSION = "1.0.0-b005.85"
EXPECTED_PANEL_VERSION = "0.6.65"
EXPECTED_PANEL_BUNDLE = "irrigation-panel-v0665.mjs"


def load_models():
    package_name = "ho_sc_8w_contract"
    package = types.ModuleType(package_name)
    package.__path__ = [str(INTEGRATION)]
    sys.modules[package_name] = package
    spec = importlib.util.spec_from_file_location(
        f"{package_name}.models", INTEGRATION / "models.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load models.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def require(source: str, *markers: str) -> None:
    for marker in markers:
        assert marker in source, f"Missing contract marker: {marker}"


models = load_models()
payload = models.encode_dp45_start_manual({1: 1, 4: 10, 6: 120, 7: 15, 8: 25})
assert len(payload) == 34
assert payload[:2] == b"\x01\x01"
assert payload[18:34] == bytes(16)
expected = {1: 1, 4: 10, 6: 120, 7: 15, 8: 25}
for zone in range(1, 9):
    value = struct.unpack_from(">H", payload, 2 + (zone - 1) * 2)[0]
    assert value == expected.get(zone, 0)

stop_payload = models.encode_dp45_start_manual({zone: 0 for zone in range(1, 9)})
assert len(stop_payload) == 34
assert stop_payload[:2] == b"\x01\x01"
assert stop_payload[2:] == bytes(32)

manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
panel = json.loads((ROOT / "panel.json").read_text(encoding="utf-8"))
panel_manifest = json.loads((ROOT / "panel_manifest.json").read_text(encoding="utf-8"))
const_source = (INTEGRATION / "const.py").read_text(encoding="utf-8")
setup_source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
manual_source = (INTEGRATION / "manual_api.py").read_text(encoding="utf-8")
sensor_source = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
services_source = (INTEGRATION / "services.yaml").read_text(encoding="utf-8")
frontend_source = (FRONTEND / "irrigation-panel.js").read_text(encoding="utf-8")

wrapper_files = [
    "irrigation-panel-v0633.mjs",
    "irrigation-panel-v0634.mjs",
    "irrigation-panel-v0635.mjs",
    "irrigation-panel-v0636.mjs",
    "irrigation-panel-v0637.mjs",
    "irrigation-panel-v0638.mjs",
    "irrigation-panel-v0639.mjs",
    "irrigation-panel-v0640.mjs",
    "irrigation-panel-v0641.mjs",
    "irrigation-panel-v0642.mjs",
    "irrigation-panel-v0643.mjs",
    "irrigation-panel-v0644.mjs",
    "irrigation-panel-v0645.mjs",
    "irrigation-panel-v0646.mjs",
    "irrigation-panel-v0647.mjs",
    "irrigation-panel-v0648.mjs",
    "irrigation-panel-v0649.mjs",
    "irrigation-panel-v0650.mjs",
    "irrigation-panel-v0651.mjs",
    "irrigation-panel-v0652.mjs",
    "irrigation-panel-v0653.mjs",
    "irrigation-panel-v0654.mjs",
    "irrigation-panel-v0655.mjs",
    "irrigation-panel-v0656.mjs",
    "irrigation-panel-v0657.mjs",
    "irrigation-panel-v0658.mjs",
    "irrigation-panel-v0659.mjs",
    "irrigation-panel-v0660.mjs",
    "irrigation-panel-v0661.mjs",
    "irrigation-panel-v0662.mjs",
    "irrigation-panel-v0663.mjs",
    "irrigation-panel-v0664.mjs",
    "irrigation-panel-v0665.mjs",
]
wrappers = {
    name: (FRONTEND / name).read_text(encoding="utf-8") for name in wrapper_files
}
combined_frontend_source = frontend_source + "".join(wrappers.values())

assert manifest["version"] == EXPECTED_INTEGRATION_VERSION
assert panel["panel"]["dashboard_version"] == EXPECTED_PANEL_VERSION
assert panel_manifest["panel_version"] == EXPECTED_PANEL_VERSION
assert panel_manifest["integration_version"] == EXPECTED_INTEGRATION_VERSION
assert panel_manifest["integration_version"] == manifest["version"]
require(
    const_source,
    f'PANEL_VERSION = "{EXPECTED_PANEL_VERSION}"',
    EXPECTED_PANEL_BUNDLE,
    "NUM_PRODUCTION_ZONES = 8",
    "ZONE8_DP38_WRITES_ENABLED = False",
    "ZONE8_DP38_HEX_PROBE_ENABLED = True",
    "ZONE8_KNOWN_RESTORE_ENABLED = False",
    "ZONE8_ANCHOR_DATE_TEST_ENABLED = False",
    'ZONE8_KNOWN_BACKUP_HEX = "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090311"',
    'ZONE8_ANCHOR_DATE_TEST_TARGET_HEX = "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090211"',
)
assert panel["panel"]["frontend"]["module_url"].endswith(EXPECTED_PANEL_BUNDLE)
assert panel_manifest["bundle"].endswith(EXPECTED_PANEL_BUNDLE)

require(
    wrappers["irrigation-panel-v0638.mjs"],
    'const UI_VERSION = "0.6.38"',
    "irrigation-panel-v0637.mjs",
    'className = "manualZoneRemaining"',
    '`Осталось ${runtime.remaining} мин`',
    ".manualZoneRemaining{",
)
require(
    wrappers["irrigation-panel-v0639.mjs"],
    'const UI_VERSION = "0.6.39"',
    "set_zone8_schedule_field",
    "restore_zone8_schedule",
    "data-zone8-apply",
    "Каждая кнопка меняет только одно поле",
)
require(
    wrappers["irrigation-panel-v0640.mjs"],
    'const UI_VERSION = "0.6.40"',
    "this._ensureZone8LabEvents()",
    "if (this._zone8LabEventsBound) return",
    '"[data-zone8-field]"',
)
require(
    wrappers["irrigation-panel-v0641.mjs"],
    'const UI_VERSION = "0.6.41"',
    "Запись DP38 аварийно отключена",
)
require(
    wrappers["irrigation-panel-v0642.mjs"],
    'const UI_VERSION = "0.6.42"',
    "confirmation: CONFIRMATION",
    "data-zone8-hex-probe",
    "probe_zone8_dp38_hex",
    "Тест не восстанавливает зоны 1, 2 и 4",
)
require(
    wrappers["irrigation-panel-v0643.mjs"],
    'const UI_VERSION = "0.6.43"',
    "Активный сбор свежих DP38",
    "Тест остановлен защитой до записи",
)
require(
    wrappers["irrigation-panel-v0644.mjs"],
    'const UI_VERSION = "0.6.44"',
    "Прочитать зону 8",
    "Команды записи не отправляются",
    "Текущий блок зоны 8 прочитан без записи",
)
require(
    wrappers["irrigation-panel-v0645.mjs"],
    'const UI_VERSION = "0.6.45"',
    "Контроллер вернул разные ответы",
    "hex_probe_samples",
)
require(
    wrappers["irrigation-panel-v0646.mjs"],
    'const UI_VERSION = "0.6.46"',
    "Собираются все ответы DP38 без фильтра по зоне",
    "hex_probe_trace",
    "Контроллер не вернул DP38",
)
require(
    wrappers["irrigation-panel-v0647.mjs"],
    'const UI_VERSION = "0.6.47"',
    "Получен повреждённый блок зоны 8",
    "restore_zone8_known_backup",
    "Восстановить исходную зону 8",
    "Зоны 1–6 не записываются",
)
require(
    wrappers["irrigation-panel-v0648.mjs"],
    'const UI_VERSION = "0.6.48"',
    "irrigation-panel-v0647.mjs",
)
require(
    wrappers["irrigation-panel-v0649.mjs"],
    'const UI_VERSION = "0.6.49"',
    "irrigation-panel-v0648.mjs",
    "Запись аварийно остановлена",
    "резерв: совпадает",
    "полный круг:",
)
require(
    wrappers["irrigation-panel-v0650.mjs"],
    'const UI_VERSION = "0.6.50"',
    "irrigation-panel-v0649.mjs",
    "Расшифрованное состояние зоны 8",
    "_zone8LatestDecoded",
    "Записать дату 02.09.2026 один раз",
    "test_zone8_anchor_date_write",
    "WRITE_ZONE8_ANCHOR_DATE_2026_09_02_ONCE",
)
require(
    wrappers["irrigation-panel-v0651.mjs"],
    'const UI_VERSION = "0.6.51"',
    "irrigation-panel-v0650.mjs",
    "Запись расписаний отключена",
    "зона 8 осталась без изменений",
    "зоне 4",
    "Только чтение",
)
assert "data-zone8-anchor-date-test" not in wrappers["irrigation-panel-v0651.mjs"]
require(
    wrappers["irrigation-panel-v0652.mjs"],
    'const UI_VERSION = "0.6.52"',
    "irrigation-panel-v0651.mjs",
    "Базовая длительность",
    "Все шесть слотов",
    "Каждый день",
    "По дням недели",
    "Дата начала цикла",
    "Сезонная коррекция",
    "Ближайший запуск",
    "Датчик дождя",
    ".zoneProgramDetail{min-height:0!important",
    "background-size:cover!important",
)
assert "data-zone8-anchor-date-test" not in wrappers["irrigation-panel-v0652.mjs"]
require(
    wrappers["irrigation-panel-v0653.mjs"],
    'const UI_VERSION = "0.6.53"',
    "irrigation-panel-v0652.mjs",
    "capture_dp38_snapshot",
    "DP38_FULL_SNAPSHOT_READ_ONLY",
    "Снять исходный снимок 1–8",
    "Снять контрольный снимок и сравнить",
    "Команды записи DP38 не отправляются",
    'data-program-section="general"',
    'data-program-section="zones"',
    "Общие параметры",
    "Параметры зон",
    "data-program-zone-select",
    "data-program-zone-state",
    "this.zoneDetail(e, zone)",
    'this._programSection === "zones" ? "zones" : "general"',
    "title.hidden = zoneMode",
    "refresh.hidden = zoneMode",
    "zoneState.hidden = !zoneMode",
    ".headerProgramContext{display:grid;place-items:center",
    "Разрешение полива",
    "Пауза полива",
    "Сезонный коэффициент",
)
assert "programExpandedList" not in wrappers["irrigation-panel-v0653.mjs"]
assert "Первый запуск" not in wrappers["irrigation-panel-v0653.mjs"]
assert "data-zone8-anchor-date-test" not in wrappers["irrigation-panel-v0653.mjs"]
require(
    wrappers["irrigation-panel-v0654.mjs"],
    'const UI_VERSION = "0.6.54"',
    "irrigation-panel-v0653.mjs",
    'operation !== "auto"',
    "контроллер и установите режим Auto",
    "Контроллер должен быть включён, находиться в режиме Auto",
    "Команды записи DP38 не отправляются",
)
require(
    wrappers["irrigation-panel-v0655.mjs"],
    'const UI_VERSION = "0.6.55"',
    "irrigation-panel-v0654.mjs",
    "test_zone8_full_frame_write",
    "Будут отправлены все восемь исходных блоков",
    "Повтора и автоматического отката не будет",
)
require(
    wrappers["irrigation-panel-v0656.mjs"],
    'const UI_VERSION = "0.6.56"',
    'data-program-zone="${number}"',
    "Array.from({ length: 8 }",
)
assert "data-program-section" not in wrappers["irrigation-panel-v0656.mjs"]
assert "programZoneContext" not in wrappers["irrigation-panel-v0656.mjs"]
require(
    wrappers["irrigation-panel-v0657.mjs"],
    'const UI_VERSION = "0.6.57"',
    "irrigation-panel-v0656.mjs",
    "test_zone8_mask_write",
    "Первый байт записи: 80",
    "Передаётся ровно 20 байт",
)
require(
    wrappers["irrigation-panel-v0658.mjs"],
    'const UI_VERSION = "0.6.58"',
    "irrigation-panel-v0657.mjs",
    '["status", "mdi:tune-variant", "Система"]',
    "data-zone-artwork-open",
    "Без картинки",
    "window.localStorage",
)
assert "Состояние контроллера" not in wrappers["irrigation-panel-v0658.mjs"]
require(
    wrappers["irrigation-panel-v0659.mjs"],
    'const UI_VERSION = "0.6.59"',
    "irrigation-panel-v0658.mjs",
    "data-system-settings",
    "mdi:cog-outline",
    "PHYSICAL_ZONES_STORAGE_KEY",
    "data-physical-zone-toggle",
    "Array.from({ length: 8 }",
    "data-zone-artwork-overlay",
    "Следующая по программе",
    "this._nextPhysicalZone(entities)",
)
assert ".showModal()" not in wrappers["irrigation-panel-v0659.mjs"]
require(
    wrappers["irrigation-panel-v0660.mjs"],
    'const UI_VERSION = "0.6.60"',
    "irrigation-panel-v0659.mjs",
    'viewport.classList.remove("zonesFitsViewport", "manualFitsViewport")',
    ".programZoneTabs{position:sticky",
    "background-size:contain!important",
)
require(
    wrappers["irrigation-panel-v0661.mjs"],
    'const UI_VERSION = "0.6.61"',
    "irrigation-panel-v0660.mjs",
    'viewport.classList.toggle("longContentViewport", longContent)',
    ".workViewport.isNative.longContentViewport .workCanvas{height:auto",
    "manualStartTop manualStartWide",
    "<span>Старт полива</span>",
)
require(
    wrappers["irrigation-panel-v0662.mjs"],
    'const UI_VERSION = "0.6.62"',
    "irrigation-panel-v0661.mjs",
    "_systemWideZoneCard",
    "systemZoneStatus",
    "viewFootnote",
    ".systemSettingsButton{position:static",
)
require(
    wrappers["irrigation-panel-v0663.mjs"],
    'const UI_VERSION = "0.6.63"',
    "irrigation-panel-v0662.mjs",
    "systemConnectionLamp",
    "systemConnectionCopy",
    "grid-template-columns:10px minmax(0,1fr)",
    "column-gap:11px",
    "width:168px",
    "min-height:58px",
    "padding:12px 14px",
    "border-radius:18px",
    "font-size:16px",
    "font-weight:700",
    "font-size:13px!important",
    "font-weight:600",
    "0 4px 14px rgba(0,0,0,.055)",
    "var(--success-color,#43a047) 11%",
    "var(--warning-color,#f6a623) 10%",
    "var(--error-color,#db4437) 10%",
    "var(--secondary-text-color,#6f6f72) 8%",
)
require(
    wrappers["irrigation-panel-v0664.mjs"],
    'const UI_VERSION = "0.6.64"',
    "irrigation-panel-v0663.mjs",
    "Array.from({ length: 20 }",
    "data-seasonal-select",
    "<select data-season-value",
    "seasonalSelectControl",
)
feedback_source = wrappers["irrigation-panel-v0665.mjs"]
require(
    feedback_source,
    'const UI_VERSION = "0.6.65"',
    "irrigation-panel-v0664.mjs",
    "FEEDBACK_DURATION_MS = 1500",
    "_syncSeasonalApplyState",
    "selected !== current",
    "button.disabled = !enabled",
    'button.dataset.seasonalChanged = changed ? "true" : "false"',
    "seasonalFeedback-success",
    "seasonalFeedback-same",
    "seasonalFeedback-error",
    "p.applySeasonalAdjustment = async function applySeasonalAdjustmentV0665",
    ".settingsSeasonal [data-season-apply]:disabled",
    "Не удалось подтвердить сезонную коррекцию",
)
assert "Сезонная коррекция ${value}% подтверждена контроллером" not in feedback_source
assert 'this.notify("Это значение уже установлено")' not in feedback_source
assert 'role="switch"' in wrappers["irrigation-panel-v0637.mjs"]

connection_meta = panel["panel"]["system_visualization"]["connection_indicator"]
manifest_connection_meta = panel_manifest["connection_indicator"]
assert connection_meta["reference"] == "NikaS Specialized Panel UI Standard v2.2 / S8 OMNI"
assert manifest_connection_meta["reference"] == connection_meta["reference"]
for key, expected_value in {
    "state_invariant_width_px": 168,
    "min_height_px": 58,
    "padding_px": [12, 14],
    "radius_px": 18,
    "lamp_px": 10,
    "column_gap_px": 11,
    "main_font": "16px/700",
    "freshness_font": "13px/600",
    "success_background_mix_percent": 11,
    "status_background_mix_percent": 10,
    "neutral_background_mix_percent": 8,
    "status_border_mix_percent": 30,
    "neutral_border_mix_percent": 28,
}.items():
    assert connection_meta[key] == expected_value
    assert manifest_connection_meta[key] == expected_value

seasonal_meta = panel["panel"]["control_actions"]["seasonal_adjustment"]
manifest_seasonal_meta = panel_manifest["control_actions"]["seasonal_adjustment"]
expected_seasonal_values = list(range(-90, 101, 10))
for meta in (seasonal_meta, manifest_seasonal_meta):
    assert meta["range_percent"] == [-90, 100]
    assert meta["step_percent"] == 10
    assert meta["allowed_values_percent"] == expected_seasonal_values
    assert meta["input_control"] == "native_select"
    assert meta["native_keyboard"] is False
feedback_meta = manifest_seasonal_meta["feedback"]
assert feedback_meta["scope"] == "seasonal_adjustment_only"
assert feedback_meta["success"] == "pale_green_value_field_no_system_notification"
assert feedback_meta["same_value"] == "pale_primary_value_field_no_system_notification"
assert feedback_meta["error"] == "pale_error_value_field_and_system_notification"
assert feedback_meta["duration_ms"] == 1500
assert feedback_meta["success_requires_confirmed_readback"] is True
assert feedback_meta["apply_enabled_when"] == "selected_value_differs_from_controller"
assert feedback_meta["future_rollout"] == "other_write_controls_after_program_write"

program_meta = panel["panel"]["control_actions"]["program_view"]
manifest_program_meta = panel_manifest["control_actions"]["program_view"]
for meta in (program_meta, manifest_program_meta):
    assert meta["subtabs"] == []
    assert meta["default_subtab"] == "zone_parameters"
    assert meta["zone_selector"] == "sticky_button_row_below_header"
    assert meta["selected_zone_status"] == "inside_zone_form"
    assert meta["zone_scope"] == list(range(1, 9))
    assert meta["zone_form"] == "complete_decoded_zone_detail_read_only"
    assert meta["zone_artwork"] == "browser_local_presets_or_neutral_gray"
    assert meta["zone_artwork_trigger"] == "system_settings_zone_image"
    assert meta["vertical_scroll"] == "central_work_area_only"

expected_zone_detail_fields = [
    "base_duration",
    "six_start_slots",
    "cycle_mode_and_value",
    "weekly_days",
    "cycle_anchor_date",
    "seasonal_adjustment",
    "calculated_next_start",
    "rain_sensor_follow",
]
assert panel["panel"]["system_visualization"]["zone_detail_fields"] == expected_zone_detail_fields
assert panel_manifest["zone_detail_fields"] == expected_zone_detail_fields

zone8_panel_meta = panel["panel"]["control_actions"]["zone_8_schedule_lab"]
zone8_manifest_meta = panel_manifest["control_actions"]["zone_8_schedule_lab"]
assert zone8_panel_meta["write_enabled"] is False
assert zone8_panel_meta["hex_probe_enabled"] is True
assert zone8_manifest_meta["write_enabled"] is False
assert zone8_manifest_meta["recovery_enabled"] is False
assert zone8_manifest_meta["maximum_writes_per_action"] == 0
assert zone8_manifest_meta["anchor_date_test_enabled"] is False
assert zone8_manifest_meta["anchor_date_test_maximum_writes_per_action"] == 0
assert zone8_manifest_meta["observed_cross_zone_write"]["affected_zone"] == 4
assert zone8_manifest_meta["observed_cross_zone_write"]["zone_8_unchanged"] is True
assert zone8_manifest_meta["automatic_retry"] is False
assert zone8_manifest_meta["automatic_rollback"] is False
snapshot_meta = zone8_manifest_meta["full_snapshot"]
assert snapshot_meta["zones"] == list(range(1, 9))
assert snapshot_meta["read_only"] is True
assert snapshot_meta["writes_performed"] == 0
assert snapshot_meta["requires_physical_mode"] == "AUTO_ON"
assert snapshot_meta["requires_idle_controller"] is True
mask_write_meta = zone8_manifest_meta["zone8_mask_write_test"]
assert mask_write_meta["enabled"] is True
assert mask_write_meta["read_zone_identifier"] == "0x08"
assert mask_write_meta["write_zone_mask"] == "0x80"
assert mask_write_meta["frame_bytes"] == 20
assert mask_write_meta["maximum_writes_per_action"] == 1
assert mask_write_meta["automatic_retry"] is False
assert mask_write_meta["automatic_rollback"] is False

require(sensor_source, '"hex_probe_allowed"', '"anchor_date_test_allowed"')
assert "partial(_async_set_zone8_schedule_field, hass)" not in setup_source
assert "partial(_async_restore_zone8_schedule, hass)" not in setup_source
require(
    setup_source,
    "partial(_async_probe_zone8_dp38_hex, hass)",
    "partial(_async_restore_zone8_known_backup, hass)",
    "if ZONE8_KNOWN_RESTORE_ENABLED:",
    "if ZONE8_ANCHOR_DATE_TEST_ENABLED:",
    "partial(_async_test_zone8_anchor_date_write, hass)",
    "hass.services.async_remove(DOMAIN, SERVICE_RESTORE_ZONE8_KNOWN_BACKUP)",
    "hass.services.async_remove(DOMAIN, SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE)",
)
assert "restore_zone8_known_backup:" not in services_source
assert "test_zone8_anchor_date_write:" not in services_source
require(
    wrappers["irrigation-panel-v0634.mjs"],
    'replace("<small>ПРОГРАММА</small>", "")',
)
require(
    wrappers["irrigation-panel-v0635.mjs"],
    "Зоны — просмотр. Сезон — изменение с подтверждением.",
    ".programPageIntro{padding-bottom:8px}",
)
require(
    sensor_source,
    'return raw_bitmask, "dp107" if raw_bitmask else "idle"',
    '"dp45_unconfirmed": bitmask == 0 and any(dp45_remaining.values())',
)
assert panel["panel"]["rule_set"] == "1.17"
assert panel_manifest["rule_set"] == "1.17"

require(setup_source, "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI")
require(
    manual_source,
    "class NativeManualHOSC8WAPI",
    "def start_manual_queue(",
    "def stop_manual(",
    "_write_dp45_manual_payload",
    "DP_IRRIGATION_TIME_ALL",
    'cloud_code="irrigation_time_all"',
    "def skip_current_manual(",
    "self._manual_queue_plan",
    "DP45 manual queue was sent",
    "DP45 reset did not confirm watering stop via DP107",
)
assert "DP_OPERATION_MODE" not in manual_source
assert 'cloud_code="operation_mode"' not in manual_source
assert '"OFF"' not in manual_source
require(setup_source, "SERVICE_SKIP_CURRENT_MANUAL", "async_skip_current_manual")

manual_meta = panel["panel"]["control_actions"]["manual_queue"]
assert manual_meta["write_dp"] == 45
assert manual_meta["readback"] == [107]
assert manual_meta["operation_mode_dp101_write"] is False
assert manual_meta["ui"] == "browser_selected_physical_zone_cards_with_per_zone_duration_and_switches"
assert manual_meta["production_zones"] == list(range(1, 9))
manifest_manual_meta = panel_manifest["control_actions"]["manual_queue"]
assert manifest_manual_meta["write_dp"] == 45
assert manifest_manual_meta["readback_dps"] == [107]
assert manifest_manual_meta["operation_mode_dp101_write"] is False

require(
    combined_frontend_source,
    'callService("nikas_ho_sc_8w", "start_manual_queue"',
    'callService("nikas_ho_sc_8w", "stop_manual"',
    'callService("nikas_ho_sc_8w", "skip_current_manual"',
    "data-manual-start",
    "data-queue-toggle",
    "data-queue-step",
    "manualZoneCard",
    "manualDuration",
    "manualZoneSwitch",
    "previousToggleManualZone.call",
    "Стоп всё",
)
assert "set_value(" not in combined_frontend_source
assert "sendcommand(" not in combined_frontend_source

print("HO-SC-8W DP45 native control, release, seasonal feedback, and manual UI contract passed")
