from __future__ import annotations

import json
from pathlib import Path

PANEL_VERSION = "0.6.16"
INTEGRATION_VERSION = "1.0.0-b005.34"


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing expected marker: {old[:120]}")
    return text.replace(old, new, 1)


panel_path = Path("custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js")
text = panel_path.read_text(encoding="utf-8")
text = replace_once(text, 'const UI_VERSION = "0.6.15";', f'const UI_VERSION = "{PANEL_VERSION}";')
text = replace_once(text, 'const ASSET_VERSION = "0.6.15";', f'const ASSET_VERSION = "{PANEL_VERSION}";')

text = replace_once(
    text,
    '''    zoneStateText(value) {\n      if (value === "configured") return "Готова";\n      if (value === "disabled") return "Выключена";\n      if (this.bad(value)) return "Нет данных";\n      return String(value);\n    }''',
    '''    zoneStateText(value) {\n      if (value === "configured") return "Готова";\n      if (value === "disabled") return "Выключена";\n      if (this.bad(value)) return "Нет данных";\n      return String(value);\n    }\n    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Учитывается", tone: "armed" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "bypass" };\n      return { label: String(value), tone: "unknown" };\n    }''',
)

text = replace_once(
    text,
    'if (isActive) { tone = "running"; label = `Полив · ${this.state(q.remaining)} мин`; }',
    'if (isActive) { tone = "running"; label = "Полив"; }',
)

old_columns = '''        const readyIcon = z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";\n        return `<div class="schemaColumn" data-axis="${zone}">\n          <span class="valveNumber">${zone}</span>\n          <span class="valvePhoto ${valveTone}" aria-hidden="true"></span>\n          <span class="waterBranch ${branchTone}" aria-hidden="true"></span>\n          <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">\n            <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>\n          </button>\n        </div>`;'''
new_columns = '''        const readyIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline" : z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";\n        return `<div class="schemaColumn" data-axis="${zone}">\n          <span class="valveNumber">${zone}</span>\n          <span class="valvePhoto ${valveTone}" aria-hidden="true"></span>\n          <span class="waterBranch ${branchTone}" aria-hidden="true"></span>\n          <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">\n            <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>\n            <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>\n            <span class="duration"><b>${this.esc(z.duration)}</b><small>мин</small></span>\n            <ha-icon class="readyIcon" icon="${readyIcon}"></ha-icon>\n          </button>\n        </div>`;'''
text = replace_once(text, old_columns, new_columns)

old_diagram = '''      return `<div class="systemDiagram">\n        <svg class="deviceWires" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">\n          <path class="wire rainWire" d="M 286 48 H 455"/>\n          <path class="wire controlLead" d="M 205 82 V 110 H 82"/>\n        </svg>\n        <button class="controller" data-entity="${this.esc(e.connection)}"><div class="cap"></div><div class="body"><b>HO-SC-8W</b><i></i><small>INKBIRD / HiOazo</small></div><div class="ports"><i></i><i></i></div></button>\n        <button class="rainSensor" data-entity="${this.esc(e.rain)}"><ha-icon icon="mdi:access-point"></ha-icon><span>Датчик<br>дождя</span></button>\n        <div class="controlBus"><span>Провод управления клапанами</span></div>\n        <div class="manifoldRail" aria-hidden="true"></div>\n        <div class="supplyLine" aria-hidden="true"></div>\n        <div class="schemaGrid">${columns}</div>\n      </div>`;'''
new_diagram = '''      const rain = this.rainPresentation(e);\n      return `<div class="systemDiagram">\n        <svg class="deviceWires" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">\n          <path class="wire rainWire" d="M 294 50 H 452"/>\n          <path class="wire controlLead" d="M 205 82 V 108 H 84"/>\n        </svg>\n        <button class="controller" data-entity="${this.esc(e.connection)}"><div class="cap"></div><div class="body"><b>HO-SC-8W</b><i></i><small>INKBIRD / HiOazo</small></div><div class="ports"><i></i><i></i></div></button>\n        <button class="rainSensor ${rain.tone}" data-entity="${this.esc(e.rain)}"><span class="rainSensorText"><b>Датчик дождя</b><small>${this.esc(rain.label)}</small></span></button>\n        <div class="controlBus" aria-hidden="true"></div>\n        <div class="manifoldRail" aria-hidden="true"></div>\n        <div class="supplyLine" aria-hidden="true"></div>\n        <div class="schemaGrid">${columns}</div>\n      </div>`;'''
text = replace_once(text, old_diagram, new_diagram)

old_metrics = '''      const data = [\n        ["mdi:calendar-blank-outline", "ПРОГРАММА", nextStart, "Следующий полив", e.zones[1].schedule, "water"],\n        ["mdi:autorenew", "РЕЖИМ", this.human("operation", operation), this.bad(seasonal) ? "Сезон · —" : `Сезон · ${seasonal} %`, e.operation, operation === "Auto" ? "active" : ""],\n        ["mdi:signal", "ТЕЛЕМЕТРИЯ", this.updatedValue(e.connection), "Последнее обновление", e.connection, "good"],\n      ];'''
new_metrics = '''      const data = [\n        ["mdi:calendar-blank-outline", "ПРОГРАММА", nextStart, "Следующий полив", e.zones[1].schedule, "water"],\n        ["mdi:autorenew", "РЕЖИМ", this.human("operation", operation), this.human("irrigation", this.state(e.irrigation)), e.operation, operation === "Auto" ? "active" : ""],\n        ["mdi:percent-outline", "СЕЗОННАЯ КОРРЕКЦИЯ", this.bad(seasonal) ? "—" : `${seasonal} %`, "Текущая поправка", e.seasonal, this.bad(seasonal) ? "" : "active"],\n      ];'''
text = replace_once(text, old_metrics, new_metrics)

old_hero = 'return `<section class="hero ${status.tone}"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionIndicator(e)}</div>${this.irrigationDiagram(e)}</section>`;'
new_hero = 'return `<section class="hero ${status.tone}"><div class="heroHead"><div class="heroStatus"><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionIndicator(e)}</div>${this.irrigationDiagram(e)}</section>`;'
text = replace_once(text, old_hero, new_hero)

old_nav_state = '''    _updateNavigationState() {\n      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {\n        button.classList.toggle("active", button.dataset.view === this._view);\n      });\n    }'''
new_nav_state = '''    _updateNavigationState() {\n      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {\n        button.classList.toggle("active", button.dataset.view === this._view);\n      });\n      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");\n      if (viewport) viewport.classList.toggle("statusFitsViewport", this._view === "status");\n    }'''
text = replace_once(text, old_nav_state, new_nav_state)

css_patch = r'''
        /* v0.6.16: informative zone cards, compact schematic and fit-without-scroll status view. */
        .workViewport.isNative .workCanvas{height:100%}
        .workViewport.isNative .workCanvas>.content{height:100%;min-height:100%;padding-bottom:4px}
        .workViewport.isNative.statusFitsViewport{overflow-y:hidden}
        .workViewport.isNative .statusScreen{height:100%;min-height:0;overflow:hidden;display:grid;grid-template-rows:minmax(0,1fr) auto auto;gap:6px}
        .statusScreen .hero{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);padding:10px 12px 9px}
        .statusScreen .heroHead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px}
        .heroStatus{min-width:0;padding-top:1px}.heroStatus h1{margin:0 0 4px;font-size:25px;line-height:1;letter-spacing:-.045em}.heroStatus p{margin:0;font-size:12px;line-height:1.2}
        .connectionWrap{display:flex;flex-direction:column;align-items:stretch;gap:5px;min-width:146px}.systemConnection{min-width:146px;padding:6px 9px;border-radius:14px}.systemConnectionMain{gap:7px}.systemConnectionMain i{width:9px;height:9px}.systemConnectionMain b{font-size:16px}.systemConnection .freshness{margin-left:16px;font-size:13px!important}.heroPressure{width:100%;margin:0;padding:4px 7px;border-radius:11px;justify-content:space-between}.heroPressure span{font-size:12px}.heroPressure b{font-size:14px}
        .statusScreen .systemDiagram{height:auto;min-height:0;aspect-ratio:auto;margin-top:6px;border-radius:19px}
        .controller{left:1%;top:2%;width:28%;height:22%}.rainSensor{left:44%;top:2%;width:52%;height:22%;padding:0;border:0;background:transparent url("${APPROVED_VISUALS.rain}") left center/auto 52% no-repeat;color:var(--muted);text-align:left}.rainSensor .rainSensorText{position:absolute;left:30%;top:50%;display:grid;gap:3px;transform:translateY(-50%);white-space:nowrap}.rainSensor .rainSensorText b{font-size:12px;font-weight:750;line-height:1.05}.rainSensor .rainSensorText small{font-size:12px!important;font-weight:650;line-height:1.05;color:var(--muted)}.rainSensor.armed .rainSensorText small{color:var(--a)}.rainSensor.bypass .rainSensorText small{color:var(--green)}
        .controlBus{top:28%;left:8.33%;right:8.33%}.controlBus span{display:none!important}.manifoldRail{top:47%}.supplyLine{top:calc(47% + 7px)}
        .schemaGrid{top:27%;bottom:1.5%;gap:5px}.schemaColumn{grid-template-rows:24px 30% 7% minmax(0,1fr)}.schemaColumn::before{top:10px;height:28px}.valveNumber{width:23px;height:23px;font-size:12px}.valvePhoto{width:112%;background-size:contain}.waterBranch{height:100%}
        .schemaGrid .diagramZone{position:relative;display:grid!important;grid-template-columns:1fr;grid-template-rows:40px auto auto;align-content:start;gap:3px;height:100%;min-height:0;padding:4px 4px 5px;border-radius:10px;overflow:hidden;text-align:left}.schemaGrid .diagramZone .scene{display:block!important;width:100%;height:40px;min-height:0;border-radius:7px}.schemaGrid .diagramZone .zoneText{display:block!important;min-width:0;line-height:1.05}.schemaGrid .diagramZone .zoneText b{display:block;font-size:12px;line-height:1.05;white-space:nowrap}.schemaGrid .diagramZone .zoneText small{display:block;margin-top:2px;font-size:12px!important;line-height:1.05;white-space:normal;overflow:visible}.schemaGrid .diagramZone .duration{display:flex!important;align-items:baseline;gap:3px;margin-top:1px;color:var(--text);text-align:left}.schemaGrid .diagramZone .duration b{font-size:16px;font-weight:850;line-height:1}.schemaGrid .diagramZone .duration small{display:inline!important;font-size:12px!important;color:var(--muted)}.schemaGrid .diagramZone .readyIcon{display:block!important;position:absolute;right:3px;top:4px;--mdc-icon-size:14px;color:var(--green);filter:drop-shadow(0 1px 2px #fff)}.schemaGrid .diagramZone.running .readyIcon{color:var(--a)}.schemaGrid .diagramZone.queued .readyIcon{color:var(--orange)}.schemaGrid .diagramZone.off .readyIcon,.schemaGrid .diagramZone.unknown .readyIcon{color:var(--muted)}
        .statusScreen .metrics{margin-top:0;gap:5px}.statusScreen .metric{min-height:86px;padding:8px 7px;border-radius:16px}.statusScreen .metric>small{font-size:12px!important;line-height:1.05;min-height:25px}.statusScreen .metric>div{grid-template-columns:31px minmax(0,1fr);gap:6px}.statusScreen .metric>div>ha-icon{--mdc-icon-size:29px}.statusScreen .metric b{font-size:17px}.statusScreen .metric em{font-size:12px!important;line-height:1.05}
        .statusScreen .quickActions{margin-top:0}.statusScreen .quickActions .modeGrid{gap:5px}.statusScreen .quickActions .mode{min-height:88px;padding:6px;border-radius:16px}.statusScreen .quickActions .mode ha-icon{--mdc-icon-size:29px}.statusScreen .quickActions .mode b{font-size:14px}.statusScreen .quickActions .mode small{font-size:12px!important}
        @media(max-width:520px){
          .statusScreen .hero{padding:8px 10px 7px}.statusScreen .heroHead{gap:6px}.heroStatus h1{font-size:24px}.heroStatus p{font-size:12px}.connectionWrap{min-width:144px}.systemConnection{min-width:144px;padding:5px 8px}.heroPressure{padding:3px 6px}
          .statusScreen .systemDiagram{height:auto;min-height:0;margin-top:5px}.controller{left:.5%;top:2%;width:28.5%;height:22%}.rainSensor{left:43%;top:2%;width:54%;height:22%;background-size:auto 50%}.rainSensor .rainSensorText{left:29%}
          .controlBus{top:28%}.manifoldRail{top:47%;height:18px}.supplyLine{top:calc(47% + 6px);height:5px}.schemaGrid{top:27%;bottom:1%;gap:4px}.schemaColumn{grid-template-rows:23px 29% 7% minmax(0,1fr)}.schemaColumn::before{top:10px;height:27px}.valvePhoto{width:116%}
          .schemaGrid .diagramZone{grid-template-rows:37px auto auto;gap:2px;padding:3px 3px 4px;border-radius:9px}.schemaGrid .diagramZone .scene{height:37px;border-radius:6px}.schemaGrid .diagramZone .zoneText b,.schemaGrid .diagramZone .zoneText small{font-size:12px!important}.schemaGrid .diagramZone .duration b{font-size:15px}.schemaGrid .diagramZone .duration small{font-size:12px!important}.schemaGrid .diagramZone .readyIcon{right:2px;top:3px;--mdc-icon-size:13px}
          .statusScreen .metric{min-height:82px;padding:7px 6px}.statusScreen .metric>small{min-height:24px}.statusScreen .metric>div{grid-template-columns:28px minmax(0,1fr);gap:5px}.statusScreen .metric>div>ha-icon{--mdc-icon-size:27px}.statusScreen .metric b{font-size:16px}.statusScreen .quickActions .mode{min-height:84px;padding:5px}.statusScreen .quickActions .mode ha-icon{--mdc-icon-size:27px}
        }
'''
insert_at = text.rfind("\n      `;")
if insert_at < 0:
    raise RuntimeError("Could not find styles() template terminator")
text = text[:insert_at] + css_patch + text[insert_at:]
panel_path.write_text(text, encoding="utf-8")

const_path = Path("custom_components/nikas_ho_sc_8w/const.py")
const_text = const_path.read_text(encoding="utf-8")
const_text = replace_once(const_text, 'PANEL_VERSION = "0.6.15"', f'PANEL_VERSION = "{PANEL_VERSION}"')
const_path.write_text(const_text, encoding="utf-8")

manifest_path = Path("custom_components/nikas_ho_sc_8w/manifest.json")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["version"] = INTEGRATION_VERSION
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

frontend_path = Path("custom_components/nikas_ho_sc_8w/frontend.py")
frontend = frontend_path.read_text(encoding="utf-8")
frontend = frontend.replace(
    '"status": "system_state_connection_pressure_schematic_summary_actions",',
    '"status": "system_state_connection_pressure_informative_zones_program_mode_seasonal_actions",',
    1,
)
frontend = frontend.replace(
    '"mobile_layout": "approved_light_reference_first_screen",',
    '"mobile_layout": "status_fits_work_viewport_without_scroll_at_100",\n                "status_scroll_at_100": False,\n                "zone_card_fields": ["image", "zone_number", "activity", "program_duration"],\n                "control_wire_caption": False,\n                "rain_sensor_semantics": "dp102_follow_enabled_or_bypassed_current_wet_contact_not_exposed",',
    1,
)
frontend_path.write_text(frontend, encoding="utf-8")

panel_json_path = Path("panel.json")
panel_json = json.loads(panel_json_path.read_text(encoding="utf-8"))
panel_json["panel"]["dashboard_version"] = PANEL_VERSION
panel_json["panel"]["status_layout"]["sections"] = [
    "system_state",
    "connection_and_pressure",
    "controller_rain_and_informative_zone_schematic",
    "program_mode_seasonal_adjustment",
    "primary_actions",
]
visual = panel_json["panel"]["system_visualization"]
visual["mobile_layout"] = "status_fits_work_viewport_without_scroll_at_100"
visual["rain_sensor_path"] = "direct_horizontal_midline_to_controller"
visual["rain_sensor_state_semantics"] = "dp102_follow_enabled_or_bypassed_current_wet_contact_not_exposed"
visual["control_wire_caption"] = False
visual["zone_thumbnail_content"] = "image_zone_number_activity_program_duration"
visual["status_scroll_at_100"] = False
visual["long_views_native_vertical_scroll_at_100"] = True
visual["summary_cards"] = ["program", "mode", "seasonal_adjustment"]
panel_json_path.write_text(json.dumps(panel_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel_manifest_path = Path("panel_manifest.json")
panel_manifest = json.loads(panel_manifest_path.read_text(encoding="utf-8"))
panel_manifest["panel_version"] = PANEL_VERSION
panel_manifest["integration_version"] = INTEGRATION_VERSION
panel_manifest["zone_thumbnail_content"] = "image_zone_number_activity_program_duration"
panel_manifest["status_layout"] = "system_state_connection_pressure_informative_zones_program_mode_seasonal_actions_fit_without_scroll"
panel_manifest["status_scroll_at_100"] = False
panel_manifest["long_views_native_vertical_scroll_at_100"] = True
panel_manifest["summary_cards"] = ["program", "mode", "seasonal_adjustment"]
panel_manifest["control_wire_caption"] = False
panel_manifest["rain_sensor_state_semantics"] = "dp102_follow_enabled_or_bypassed_current_wet_contact_not_exposed"
panel_manifest_path.write_text(json.dumps(panel_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

guard_path = Path("scripts/check-panel-ui-v16.mjs")
guard = guard_path.read_text(encoding="utf-8")
guard = replace_once(guard, 'const UI_VERSION = "0.6.15"', 'const UI_VERSION = "0.6.16"')
guard = replace_once(guard, 'd="M 286 48 H 455"', 'd="M 294 50 H 452"')
guard = guard.replace(
    '  \'class="statusScreen"\',\n',
    '  \'class="statusScreen"\',\n  "statusFitsViewport",\n  \'"СЕЗОННАЯ КОРРЕКЦИЯ"\',\n  \'<b>Зона ${zone}</b>\',\n  \'class="rainSensor ${rain.tone}"\',\n',
    1,
)
guard += '''\nif (source.includes("СОСТОЯНИЕ СИСТЕМЫ")) {\n  throw new Error("Redundant system-state eyebrow must be absent from the first screen");\n}\nif (source.includes("Провод управления клапанами")) {\n  throw new Error("Control-wire caption must be removed from the first screen");\n}\nif (source.includes('"ТЕЛЕМЕТРИЯ"')) {\n  throw new Error("Telemetry age summary card must be replaced by seasonal adjustment");\n}\n'''
guard_path.write_text(guard, encoding="utf-8")

compliance_path = Path("docs/NIKAS_SPECIALIZED_PANEL_COMPLIANCE.md")
compliance = compliance_path.read_text(encoding="utf-8")
compliance = compliance.replace(
    "**Runtime:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js` v0.6.13",
    f"**Runtime:** `custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js` v{PANEL_VERSION}",
    1,
)
compliance = compliance.replace(
    "**Manifest:** integration `1.0.0-b005.33`",
    f"**Manifest:** integration `{INTEGRATION_VERSION}`",
    1,
)
compliance += '''\n## UI 0.6.16 composition delta\n\n- The redundant `СОСТОЯНИЕ СИСТЕМЫ` eyebrow and control-wire caption are removed.\n- The status view is explicitly sized to the work viewport and has no native vertical scroll at 100%; long views such as Diagnostics retain native vertical scrolling.\n- Zone cards again show image, `Зона N`, factual activity state and DP38 programmed duration at the 12 px semantic-text floor.\n- Summary row is `Программа / Режим / Сезонная коррекция`; telemetry age remains represented by the connection freshness indicator rather than a duplicate card.\n- Rain sensor text reports only factual DP102 semantics: `Учитывается / Не блокирует / Нет данных`. The current wet-contact blocking state is not claimed because the integration does not expose it.\n- Pinch, reset, pan, one viewport/canvas and stable DOM architecture are unchanged.\n'''
compliance_path.write_text(compliance, encoding="utf-8")
