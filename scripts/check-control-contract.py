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
frontend_source = (INTEGRATION / "frontend" / "irrigation-panel.js").read_text(encoding="utf-8")
inherited_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0633.mjs").read_text(encoding="utf-8")
compact_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0634.mjs").read_text(encoding="utf-8")
fit_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0635.mjs").read_text(encoding="utf-8")
active_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0636.mjs").read_text(encoding="utf-8")
manual_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0637.mjs").read_text(encoding="utf-8")
wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0638.mjs").read_text(encoding="utf-8")
zone8_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0639.mjs").read_text(encoding="utf-8")
draft_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0640.mjs").read_text(encoding="utf-8")
incident_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0641.mjs").read_text(encoding="utf-8")
probe_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0642.mjs").read_text(encoding="utf-8")
refresh_probe_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0643.mjs").read_text(encoding="utf-8")
read_probe_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0644.mjs").read_text(encoding="utf-8")
sample_probe_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0645.mjs").read_text(encoding="utf-8")
raw_probe_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0646.mjs").read_text(encoding="utf-8")
restore_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0647.mjs").read_text(encoding="utf-8")
sequential_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0648.mjs").read_text(encoding="utf-8")
emergency_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0649.mjs").read_text(encoding="utf-8")
anchor_date_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0650.mjs").read_text(encoding="utf-8")
safety_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0651.mjs").read_text(encoding="utf-8")
program_form_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0652.mjs").read_text(encoding="utf-8")
snapshot_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0653.mjs").read_text(encoding="utf-8")
snapshot_mode_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0654.mjs").read_text(encoding="utf-8")
full_frame_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0655.mjs").read_text(encoding="utf-8")
program_navigation_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0656.mjs").read_text(encoding="utf-8")
mask_write_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0657.mjs").read_text(encoding="utf-8")
system_artwork_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0658.mjs").read_text(encoding="utf-8")
settings_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0659.mjs").read_text(encoding="utf-8")
layout_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0660.mjs").read_text(encoding="utf-8")
scroll_wrapper_source = (INTEGRATION / "frontend" / "irrigation-panel-v0661.mjs").read_text(encoding="utf-8")
combined_frontend_source = frontend_source + inherited_wrapper_source + compact_wrapper_source + fit_wrapper_source + active_wrapper_source + manual_wrapper_source + wrapper_source + zone8_wrapper_source + draft_wrapper_source + incident_wrapper_source + probe_wrapper_source + refresh_probe_wrapper_source + read_probe_wrapper_source + sample_probe_wrapper_source + raw_probe_wrapper_source + restore_wrapper_source + sequential_wrapper_source + emergency_wrapper_source + anchor_date_wrapper_source + safety_wrapper_source + program_form_wrapper_source + snapshot_wrapper_source + snapshot_mode_wrapper_source + full_frame_wrapper_source + program_navigation_wrapper_source + mask_write_wrapper_source + system_artwork_wrapper_source + settings_wrapper_source + layout_wrapper_source + scroll_wrapper_source

assert manifest["version"] == "1.0.0-b005.81"
assert panel["panel"]["dashboard_version"] == "0.6.61"
assert panel_manifest["panel_version"] == "0.6.61"
assert panel_manifest["integration_version"] == manifest["version"]
assert 'PANEL_VERSION = "0.6.61"' in const_source
assert 'irrigation-panel-v0661.mjs' in const_source
assert "NUM_PRODUCTION_ZONES = 8" in const_source
assert "ZONE8_DP38_WRITES_ENABLED = False" in const_source
assert "ZONE8_DP38_HEX_PROBE_ENABLED = True" in const_source
assert "ZONE8_KNOWN_RESTORE_ENABLED = False" in const_source
assert "ZONE8_ANCHOR_DATE_TEST_ENABLED = False" in const_source
assert 'ZONE8_KNOWN_BACKUP_HEX = "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090311"' in const_source
assert 'ZONE8_ANCHOR_DATE_TEST_TARGET_HEX = "0800FFFFFFFFFFFFFFFFFFFFFFFF03011A090211"' in const_source
assert 'const UI_VERSION = "0.6.38"' in wrapper_source
assert 'irrigation-panel-v0637.mjs' in wrapper_source
assert 'className = "manualZoneRemaining"' in wrapper_source
assert '`Осталось ${runtime.remaining} мин`' in wrapper_source
assert '.manualZoneRemaining{' in wrapper_source
assert 'const UI_VERSION = "0.6.39"' in zone8_wrapper_source
assert 'set_zone8_schedule_field' in zone8_wrapper_source
assert 'restore_zone8_schedule' in zone8_wrapper_source
assert 'data-zone8-apply' in zone8_wrapper_source
assert 'Каждая кнопка меняет только одно поле' in zone8_wrapper_source
assert 'const UI_VERSION = "0.6.40"' in draft_wrapper_source
assert 'this._ensureZone8LabEvents()' in draft_wrapper_source
assert 'if (this._zone8LabEventsBound) return' in draft_wrapper_source
assert '"[data-zone8-field]"' in draft_wrapper_source
assert 'const UI_VERSION = "0.6.41"' in incident_wrapper_source
assert "Запись DP38 аварийно отключена" in incident_wrapper_source
assert 'const UI_VERSION = "0.6.42"' in probe_wrapper_source
assert 'confirmation: CONFIRMATION' in probe_wrapper_source
assert 'data-zone8-hex-probe' in probe_wrapper_source
assert 'probe_zone8_dp38_hex' in probe_wrapper_source
assert 'Тест не восстанавливает зоны 1, 2 и 4' in probe_wrapper_source
assert 'const UI_VERSION = "0.6.43"' in refresh_probe_wrapper_source
assert 'Активный сбор свежих DP38' in refresh_probe_wrapper_source
assert 'Тест остановлен защитой до записи' in refresh_probe_wrapper_source
assert 'const UI_VERSION = "0.6.44"' in read_probe_wrapper_source
assert 'Прочитать зону 8' in read_probe_wrapper_source
assert 'Команды записи не отправляются' in read_probe_wrapper_source
assert 'Текущий блок зоны 8 прочитан без записи' in read_probe_wrapper_source
assert 'const UI_VERSION = "0.6.45"' in sample_probe_wrapper_source
assert 'Контроллер вернул разные ответы' in sample_probe_wrapper_source
assert 'hex_probe_samples' in sample_probe_wrapper_source
assert 'const UI_VERSION = "0.6.46"' in raw_probe_wrapper_source
assert 'Собираются все ответы DP38 без фильтра по зоне' in raw_probe_wrapper_source
assert 'hex_probe_trace' in raw_probe_wrapper_source
assert 'Контроллер не вернул DP38' in raw_probe_wrapper_source
assert 'const UI_VERSION = "0.6.47"' in restore_wrapper_source
assert 'Получен повреждённый блок зоны 8' in restore_wrapper_source
assert 'restore_zone8_known_backup' in restore_wrapper_source
assert 'Восстановить исходную зону 8' in restore_wrapper_source
assert 'Зоны 1–6 не записываются' in restore_wrapper_source
assert 'const UI_VERSION = "0.6.48"' in sequential_wrapper_source
assert 'irrigation-panel-v0647.mjs' in sequential_wrapper_source
assert 'const UI_VERSION = "0.6.49"' in emergency_wrapper_source
assert 'irrigation-panel-v0648.mjs' in emergency_wrapper_source
assert 'Запись аварийно остановлена' in emergency_wrapper_source
assert 'резерв: совпадает' in emergency_wrapper_source
assert 'полный круг:' in emergency_wrapper_source
assert 'const UI_VERSION = "0.6.50"' in anchor_date_wrapper_source
assert 'irrigation-panel-v0649.mjs' in anchor_date_wrapper_source
assert 'Расшифрованное состояние зоны 8' in anchor_date_wrapper_source
assert '_zone8LatestDecoded' in anchor_date_wrapper_source
assert 'Записать дату 02.09.2026 один раз' in anchor_date_wrapper_source
assert 'test_zone8_anchor_date_write' in anchor_date_wrapper_source
assert 'WRITE_ZONE8_ANCHOR_DATE_2026_09_02_ONCE' in anchor_date_wrapper_source
assert 'const UI_VERSION = "0.6.51"' in safety_wrapper_source
assert 'irrigation-panel-v0650.mjs' in safety_wrapper_source
assert 'Запись расписаний отключена' in safety_wrapper_source
assert 'зона 8 осталась без изменений' in safety_wrapper_source
assert 'зоне 4' in safety_wrapper_source
assert 'Только чтение' in safety_wrapper_source
assert 'data-zone8-anchor-date-test' not in safety_wrapper_source
assert 'const UI_VERSION = "0.6.52"' in program_form_wrapper_source
assert 'irrigation-panel-v0651.mjs' in program_form_wrapper_source
assert 'Базовая длительность' in program_form_wrapper_source
assert 'Все шесть слотов' in program_form_wrapper_source
assert 'Каждый день' in program_form_wrapper_source
assert 'По дням недели' in program_form_wrapper_source
assert 'Дата начала цикла' in program_form_wrapper_source
assert 'Сезонная коррекция' in program_form_wrapper_source
assert 'Ближайший запуск' in program_form_wrapper_source
assert 'Датчик дождя' in program_form_wrapper_source
assert '.zoneProgramDetail{min-height:0!important' in program_form_wrapper_source
assert 'background-size:cover!important' in program_form_wrapper_source
assert 'data-zone8-anchor-date-test' not in program_form_wrapper_source
assert 'const UI_VERSION = "0.6.53"' in snapshot_wrapper_source
assert 'irrigation-panel-v0652.mjs' in snapshot_wrapper_source
assert 'capture_dp38_snapshot' in snapshot_wrapper_source
assert 'DP38_FULL_SNAPSHOT_READ_ONLY' in snapshot_wrapper_source
assert 'Снять исходный снимок 1–8' in snapshot_wrapper_source
assert 'Снять контрольный снимок и сравнить' in snapshot_wrapper_source
assert 'Команды записи DP38 не отправляются' in snapshot_wrapper_source
assert 'data-program-section="general"' in snapshot_wrapper_source
assert 'data-program-section="zones"' in snapshot_wrapper_source
assert 'Общие параметры' in snapshot_wrapper_source
assert 'Параметры зон' in snapshot_wrapper_source
assert 'data-program-zone-select' in snapshot_wrapper_source
assert 'data-program-zone-state' in snapshot_wrapper_source
assert 'this.zoneDetail(e, zone)' in snapshot_wrapper_source
assert 'this._programSection === "zones" ? "zones" : "general"' in snapshot_wrapper_source
assert 'title.hidden = zoneMode' in snapshot_wrapper_source
assert 'refresh.hidden = zoneMode' in snapshot_wrapper_source
assert 'zoneState.hidden = !zoneMode' in snapshot_wrapper_source
assert '.headerProgramContext{display:grid;place-items:center' in snapshot_wrapper_source
assert 'Разрешение полива' in snapshot_wrapper_source
assert 'Пауза полива' in snapshot_wrapper_source
assert 'Сезонный коэффициент' in snapshot_wrapper_source
assert 'programExpandedList' not in snapshot_wrapper_source
assert 'Первый запуск' not in snapshot_wrapper_source
assert 'data-zone8-anchor-date-test' not in snapshot_wrapper_source
assert 'const UI_VERSION = "0.6.54"' in snapshot_mode_wrapper_source
assert 'irrigation-panel-v0653.mjs' in snapshot_mode_wrapper_source
assert 'operation !== "auto"' in snapshot_mode_wrapper_source
assert 'контроллер и установите режим Auto' in snapshot_mode_wrapper_source
assert 'Контроллер должен быть включён, находиться в режиме Auto' in snapshot_mode_wrapper_source
assert 'Команды записи DP38 не отправляются' in snapshot_mode_wrapper_source
assert 'const UI_VERSION = "0.6.55"' in full_frame_wrapper_source
assert 'irrigation-panel-v0654.mjs' in full_frame_wrapper_source
assert 'test_zone8_full_frame_write' in full_frame_wrapper_source
assert 'Будут отправлены все восемь исходных блоков' in full_frame_wrapper_source
assert 'Повтора и автоматического отката не будет' in full_frame_wrapper_source
assert 'const UI_VERSION = "0.6.56"' in program_navigation_wrapper_source
assert 'data-program-zone="${number}"' in program_navigation_wrapper_source
assert 'Array.from({ length: 8 }' in program_navigation_wrapper_source
assert 'const UI_VERSION = "0.6.57"' in mask_write_wrapper_source
assert 'irrigation-panel-v0656.mjs' in mask_write_wrapper_source
assert 'test_zone8_mask_write' in mask_write_wrapper_source
assert 'Первый байт записи: 80' in mask_write_wrapper_source
assert 'Передаётся ровно 20 байт' in mask_write_wrapper_source
assert 'data-program-section' not in program_navigation_wrapper_source
assert 'programZoneContext' not in program_navigation_wrapper_source
assert 'const UI_VERSION = "0.6.58"' in system_artwork_wrapper_source
assert 'irrigation-panel-v0657.mjs' in system_artwork_wrapper_source
assert '["status", "mdi:tune-variant", "Система"]' in system_artwork_wrapper_source
assert 'Состояние контроллера' not in system_artwork_wrapper_source
assert 'data-zone-artwork-open' in system_artwork_wrapper_source
assert 'Без картинки' in system_artwork_wrapper_source
assert 'window.localStorage' in system_artwork_wrapper_source
assert 'const UI_VERSION = "0.6.59"' in settings_wrapper_source
assert 'irrigation-panel-v0658.mjs' in settings_wrapper_source
assert 'data-system-settings' in settings_wrapper_source
assert 'mdi:cog-outline' in settings_wrapper_source
assert 'PHYSICAL_ZONES_STORAGE_KEY' in settings_wrapper_source
assert 'data-physical-zone-toggle' in settings_wrapper_source
assert 'Array.from({ length: 8 }' in settings_wrapper_source
assert 'data-zone-artwork-overlay' in settings_wrapper_source
assert '.showModal()' not in settings_wrapper_source
assert 'system_settings_zone_image' == panel["panel"]["control_actions"]["program_view"]["zone_artwork_trigger"]
assert 'system_settings_zone_image' == panel_manifest["control_actions"]["program_view"]["zone_artwork_trigger"]
assert 'Следующая по программе' in settings_wrapper_source
assert 'this._nextPhysicalZone(entities)' in settings_wrapper_source
assert 'const UI_VERSION = "0.6.60"' in layout_wrapper_source
assert 'irrigation-panel-v0659.mjs' in layout_wrapper_source
assert 'viewport.classList.remove("zonesFitsViewport", "manualFitsViewport")' in layout_wrapper_source
assert '.programZoneTabs{position:sticky' in layout_wrapper_source
assert 'background-size:contain!important' in layout_wrapper_source
assert 'const UI_VERSION = "0.6.61"' in scroll_wrapper_source
assert 'irrigation-panel-v0660.mjs' in scroll_wrapper_source
assert 'viewport.classList.toggle("longContentViewport", longContent)' in scroll_wrapper_source
assert '.workViewport.isNative.longContentViewport .workCanvas{height:auto' in scroll_wrapper_source
assert 'manualStartTop manualStartWide' in scroll_wrapper_source
assert '<span>Старт полива</span>' in scroll_wrapper_source
assert 'role="switch"' in manual_wrapper_source
assert panel["panel"]["frontend"]["module_url"].endswith("irrigation-panel-v0661.mjs")
assert panel_manifest["bundle"].endswith("irrigation-panel-v0661.mjs")
expected_program_subtabs = []
program_meta = panel["panel"]["control_actions"]["program_view"]
manifest_program_meta = panel_manifest["control_actions"]["program_view"]
assert program_meta["subtabs"] == expected_program_subtabs
assert manifest_program_meta["subtabs"] == expected_program_subtabs
assert program_meta["default_subtab"] == "zone_parameters"
assert program_meta["zone_selector"] == "sticky_button_row_below_header"
assert program_meta["selected_zone_status"] == "inside_zone_form"
assert program_meta["zone_scope"] == list(range(1, 9))
assert program_meta["zone_form"] == "complete_decoded_zone_detail_read_only"
assert program_meta["zone_artwork"] == "browser_local_presets_or_neutral_gray"
assert program_meta["zone_artwork_trigger"] == "system_settings_zone_image"
assert manifest_program_meta["zone_artwork"] == program_meta["zone_artwork"]
assert manifest_program_meta["zone_artwork_trigger"] == program_meta["zone_artwork_trigger"]
assert program_meta["vertical_scroll"] == "central_work_area_only"
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
assert panel["panel"]["control_actions"]["zone_8_schedule_lab"]["write_enabled"] is False
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["write_enabled"] is False
assert panel["panel"]["control_actions"]["zone_8_schedule_lab"]["hex_probe_enabled"] is True
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["recovery_enabled"] is False
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["maximum_writes_per_action"] == 0
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["anchor_date_test_enabled"] is False
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["anchor_date_test_maximum_writes_per_action"] == 0
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["observed_cross_zone_write"]["affected_zone"] == 4
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["observed_cross_zone_write"]["zone_8_unchanged"] is True
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["automatic_retry"] is False
assert panel_manifest["control_actions"]["zone_8_schedule_lab"]["automatic_rollback"] is False
snapshot_meta = panel_manifest["control_actions"]["zone_8_schedule_lab"]["full_snapshot"]
assert snapshot_meta["zones"] == list(range(1, 9))
assert snapshot_meta["read_only"] is True
assert snapshot_meta["writes_performed"] == 0
mask_write_meta = panel_manifest["control_actions"]["zone_8_schedule_lab"]["zone8_mask_write_test"]
assert mask_write_meta["enabled"] is True
assert mask_write_meta["read_zone_identifier"] == "0x08"
assert mask_write_meta["write_zone_mask"] == "0x80"
assert mask_write_meta["frame_bytes"] == 20
assert mask_write_meta["maximum_writes_per_action"] == 1
assert mask_write_meta["automatic_retry"] is False
assert mask_write_meta["automatic_rollback"] is False
assert snapshot_meta["requires_physical_mode"] == "AUTO_ON"
assert snapshot_meta["requires_idle_controller"] is True
assert '"hex_probe_allowed"' in sensor_source
assert '"anchor_date_test_allowed"' in sensor_source
assert "partial(_async_set_zone8_schedule_field, hass)" not in setup_source
assert "partial(_async_restore_zone8_schedule, hass)" not in setup_source
assert "partial(_async_probe_zone8_dp38_hex, hass)" in setup_source
assert "partial(_async_restore_zone8_known_backup, hass)" in setup_source
assert "if ZONE8_KNOWN_RESTORE_ENABLED:" in setup_source
assert "if ZONE8_ANCHOR_DATE_TEST_ENABLED:" in setup_source
assert "partial(_async_test_zone8_anchor_date_write, hass)" in setup_source
assert "hass.services.async_remove(DOMAIN, SERVICE_RESTORE_ZONE8_KNOWN_BACKUP)" in setup_source
assert "hass.services.async_remove(DOMAIN, SERVICE_TEST_ZONE8_ANCHOR_DATE_WRITE)" in setup_source
assert "restore_zone8_known_backup:" not in services_source
assert "test_zone8_anchor_date_write:" not in services_source
assert 'replace("<small>ПРОГРАММА</small>", "")' in compact_wrapper_source
assert "Зоны — просмотр. Сезон — изменение с подтверждением." in fit_wrapper_source
assert ".programPageIntro{padding-bottom:8px}" in fit_wrapper_source
assert 'return raw_bitmask, "dp107" if raw_bitmask else "idle"' in sensor_source
assert '"dp45_unconfirmed": bitmask == 0 and any(dp45_remaining.values())' in sensor_source
assert panel["panel"]["rule_set"] == "1.17"
assert panel_manifest["rule_set"] == "1.17"

assert "from .manual_api import NativeManualHOSC8WAPI as HOSC8WAPI" in setup_source
for marker in (
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
):
    assert marker in manual_source, f"Missing native manual-control marker: {marker}"

assert "DP_OPERATION_MODE" not in manual_source
assert 'cloud_code="operation_mode"' not in manual_source
assert '"OFF"' not in manual_source
assert "SERVICE_SKIP_CURRENT_MANUAL" in setup_source
assert "async_skip_current_manual" in setup_source

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

for marker in (
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
):
    assert marker in combined_frontend_source, f"Missing frontend marker: {marker}"
assert "set_value(" not in combined_frontend_source
assert "sendcommand(" not in combined_frontend_source

print("HO-SC-8W DP45 native control, release, and manual UI contract passed")
