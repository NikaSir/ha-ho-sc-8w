from __future__ import annotations

import json
from pathlib import Path

PANEL_VERSION = "0.6.15"
INTEGRATION_VERSION = "1.0.0-b005.33"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing {label}: {old[:120]}")
    return text.replace(old, new, 1)


panel_path = Path("custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js")
text = panel_path.read_text(encoding="utf-8")
text = replace_once(text, 'const UI_VERSION = "0.6.14";', f'const UI_VERSION = "{PANEL_VERSION}";', "UI version")
text = replace_once(text, 'const ASSET_VERSION = "0.6.14";', f'const ASSET_VERSION = "{PANEL_VERSION}";', "asset version")

old_indicator = '''    connectionBadge(e) {
      const value = this.state(e.connection);
      const label = value === "local" ? "Локально" : value === "cloud" ? "Облако" : "Нет данных";
      const tone = value === "local" ? "local" : value === "cloud" ? "cloud" : "unknown";
      const pressure = this.pressurePresentation(e);
      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";
      return `<div class="connectionWrap"><div class="connectionBadge ${tone}"><i></i><b>${label}</b></div><small>${this.esc(this.updatedAge(e.connection))}</small><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button></div>`;
    }
'''
new_indicator = '''    connectionIndicator(e) {
      const value = this.state(e.connection);
      const attrs = this.attrs(e.connection);
      const exists = Boolean(e.connection && this.states()[e.connection]);
      const stale = attrs.online === false || Number(attrs.fail_count || 0) > 0;
      let label = "Нет данных";
      let tone = "unknown";
      let freshness = "Нет данных";
      let freshnessTone = "nodata";
      if (exists && value === "local") {
        label = "Локально";
        tone = "ok";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "cloud") {
        label = "Облако";
        tone = "ok";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "reserve") {
        label = "Резерв";
        tone = "reserve";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "unavailable") {
        label = "Нет связи";
        tone = "offline";
      }
      const pressure = this.pressurePresentation(e);
      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";
      const connectionEntity = e.connection ? ` data-entity="${this.esc(e.connection)}"` : "";
      const aria = `${label}. ${freshness}`;
      return `<div class="connectionWrap"><button class="systemConnection ${tone}" data-connection-indicator${connectionEntity} aria-label="${this.esc(aria)}"><span class="systemConnectionMain"><i></i><b>${label}</b></span><small class="freshness ${freshnessTone}">${freshness}</small></button><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button></div>`;
    }
'''
text = replace_once(text, old_indicator, new_indicator, "connection indicator")
text = replace_once(text, '${this.connectionBadge(e)}', '${this.connectionIndicator(e)}', "hero indicator call")
text = replace_once(
    text,
    '    statusView(e) { return `${this.hero(e)}${this.metrics(e)}${this.currentMode(e)}${this.nodes(e)}`; }',
    '    statusView(e) { return `<div class="statusScreen">${this.hero(e)}${this.metrics(e)}${this.currentMode(e)}</div>`; }',
    "status layout",
)
text = replace_once(
    text,
    '<path class="wire rainWire" d="M 248 57 L 338 82"/>',
    '<path class="wire rainWire" d="M 286 48 H 455"/>',
    "rain wire",
)

css_marker = '''        @media(max-width:520px){.schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);min-height:76px;padding:3px}.schemaGrid .diagramZone .scene{height:100%;min-height:68px;border-radius:8px}}
      `;'''
css_patch = '''        @media(max-width:520px){.schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);min-height:76px;padding:3px}.schemaGrid .diagramZone .scene{height:100%;min-height:68px;border-radius:8px}}
        /* v0.6.15: standard connection indicator, no status strip, filled phone composition. */
        .statusScreen{display:block;min-width:0}
        .systemConnection{display:grid;gap:2px;min-width:168px;padding:8px 12px;border:1px solid color-mix(in srgb,var(--muted) 30%,transparent);border-radius:16px;background:color-mix(in srgb,var(--muted) 9%,var(--card));color:var(--muted);text-align:left;box-shadow:none}
        .systemConnectionMain{display:flex;align-items:center;gap:8px;min-width:0}.systemConnectionMain i{display:block;flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:currentColor}.systemConnectionMain b{font-size:16px;font-weight:700;line-height:1.05;white-space:nowrap}.systemConnection .freshness{display:block;margin-left:18px;color:var(--muted);font-size:13px!important;font-weight:600;line-height:1.1;white-space:nowrap}
        .systemConnection.ok{color:var(--green);background:color-mix(in srgb,var(--green) 10%,var(--card));border-color:color-mix(in srgb,var(--green) 30%,transparent)}.systemConnection.reserve{color:var(--orange);background:color-mix(in srgb,var(--orange) 10%,var(--card));border-color:color-mix(in srgb,var(--orange) 30%,transparent)}.systemConnection.offline{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,var(--card));border-color:color-mix(in srgb,var(--danger) 30%,transparent)}.systemConnection .freshness.stale{color:var(--orange)}.systemConnection.offline .freshness,.systemConnection .freshness.nodata{color:var(--muted)}
        .connectionWrap{display:flex;flex-direction:column;align-items:stretch;gap:6px;text-align:left}.heroPressure{width:100%;margin:0;justify-content:space-between;padding:5px 9px;border-radius:12px}
        .statusScreen .hero{display:flex;flex-direction:column;min-height:0}.statusScreen .systemDiagram{height:clamp(410px,50dvh,520px);aspect-ratio:auto;margin-top:10px}.statusScreen .metrics{margin-top:7px}.statusScreen .quickActions{margin-top:7px}
        .controller{left:1%;top:2%;width:28%;height:21%}.rainSensor{left:45.5%;top:2%;width:27%;height:21%;background-position:left center;background-size:auto 48%}.rainSensor span{left:43%;top:36%}.controlBus{top:29%;left:8.33%;right:8.33%}.controlBus span{left:50%;right:auto;bottom:9px;transform:translateX(-50%)}
        @media(max-width:520px){
          .heroHead{align-items:flex-start;gap:8px}.heroHead>div:first-child{padding-top:2px}.systemConnection{min-width:158px;padding:7px 10px;border-radius:15px}.systemConnectionMain{gap:7px}.systemConnectionMain i{width:9px;height:9px}.systemConnectionMain b{font-size:16px}.systemConnection .freshness{margin-left:16px;font-size:13px!important}.heroPressure{padding:4px 7px}
          .statusScreen .systemDiagram{height:clamp(420px,52dvh,470px);aspect-ratio:auto;margin-top:8px}.statusScreen .metrics{margin-top:6px}.statusScreen .quickActions{margin-top:6px}.statusScreen .metric{min-height:106px}.statusScreen .quickActions .mode{min-height:104px}
          .controller{left:.5%;top:2%;width:28.5%;height:21%}.rainSensor{left:45.5%;top:2%;width:28%;height:21%;background-size:auto 48%}.rainSensor span{left:43%;top:36%}
          .controlBus{top:29%}.controlBus span{left:50%;right:auto;bottom:9px;transform:translateX(-50%)}
          .manifoldRail{top:46.5%}.supplyLine{top:calc(46.5% + 7px)}.schemaGrid{top:24%;bottom:3%;gap:5px}.schemaColumn{grid-template-rows:26px 35% 9% minmax(0,1fr)}
        }
      `;'''
text = replace_once(text, css_marker, css_patch, "v0.6.15 CSS insertion")
panel_path.write_text(text, encoding="utf-8")

sensor_path = Path("custom_components/nikas_ho_sc_8w/sensor.py")
sensor = sensor_path.read_text(encoding="utf-8")
sensor = replace_once(
    sensor,
    '            "fail_count": self.coordinator.api.fail_count,\n            "cloud_available": self.coordinator.api.has_cloud,',
    '            "fail_count": self.coordinator.api.fail_count,\n            "online": self.coordinator.api.device.online,\n            "cloud_available": self.coordinator.api.has_cloud,',
    "connection online attribute",
)
sensor_path.write_text(sensor, encoding="utf-8")

const_path = Path("custom_components/nikas_ho_sc_8w/const.py")
const_text = const_path.read_text(encoding="utf-8")
const_text = replace_once(const_text, 'PANEL_VERSION = "0.6.14"', f'PANEL_VERSION = "{PANEL_VERSION}"', "const panel version")
const_path.write_text(const_text, encoding="utf-8")

manifest_path = Path("custom_components/nikas_ho_sc_8w/manifest.json")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["version"] = INTEGRATION_VERSION
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

frontend_path = Path("custom_components/nikas_ho_sc_8w/frontend.py")
frontend = frontend_path.read_text(encoding="utf-8")
frontend = replace_once(frontend, '"status": "approved_render_system_state_summary_actions_statuses",', '"status": "system_state_connection_pressure_schematic_summary_actions",', "frontend information architecture")
frontend = replace_once(
    frontend,
    '            "connection_indicator": {\n                "two_level_indicator_enabled": False,\n                "policy": "opt_in_only",\n                "existing_transport_badge_preserved": True,\n            },',
    '            "connection_indicator": {\n                "two_level_indicator_enabled": True,\n                "policy": "explicit_product_request",\n                "transport": ["Локально", "Облако", "Резерв", "Нет связи", "Нет данных"],\n                "freshness": ["Данные актуальны", "Данные устарели", "Нет данных"],\n                "stable_dom": True,\n            },',
    "frontend connection indicator config",
)
frontend = replace_once(frontend, '"rain_sensor_path": "rain_sensor_to_controller",', '"rain_sensor_path": "direct_horizontal_midline_to_controller",', "frontend rain sensor path")
frontend_path.write_text(frontend, encoding="utf-8")

panel_json_path = Path("panel.json")
panel_json = json.loads(panel_json_path.read_text(encoding="utf-8"))
panel = panel_json["panel"]
panel["dashboard_version"] = PANEL_VERSION
panel["status_layout"]["sections"] = ["system_state", "connection_and_pressure", "program_mode_telemetry", "primary_actions"]
visual = panel["system_visualization"]
visual["rain_sensor_path"] = "direct_horizontal_midline_to_controller"
visual["rain_sensor_connection"] = "direct_horizontal_midline_to_controller"
visual["mobile_layout"] = "viewport_filled_without_status_strip"
visual["connection_indicator"] = {
    "two_level_indicator_enabled": True,
    "policy": "explicit_product_request",
    "transport": ["Локально", "Облако", "Резерв", "Нет связи", "Нет данных"],
    "freshness": ["Данные актуальны", "Данные устарели", "Нет данных"],
    "main_font_px": 16,
    "freshness_font_px": 13,
    "stable_dom": True,
}
panel_json_path.write_text(json.dumps(panel_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel_manifest_path = Path("panel_manifest.json")
panel_manifest = json.loads(panel_manifest_path.read_text(encoding="utf-8"))
panel_manifest["panel_version"] = PANEL_VERSION
panel_manifest["integration_version"] = INTEGRATION_VERSION
panel_manifest["status_layout"] = "system_state_connection_pressure_schematic_summary_actions_no_status_strip"
panel_manifest["connection_indicator"] = {
    "two_level_indicator_enabled": True,
    "transport": ["Локально", "Облако", "Резерв", "Нет связи", "Нет данных"],
    "freshness": ["Данные актуальны", "Данные устарели", "Нет данных"],
    "stable_dom": True,
}
panel_manifest["rain_sensor_connection"] = "direct_horizontal_midline_to_controller"
panel_manifest_path.write_text(json.dumps(panel_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

check_path = Path("scripts/check-panel-ui-v16.mjs")
check = check_path.read_text(encoding="utf-8")
check = replace_once(check, 'const UI_VERSION = \\"0.6.14\\"', 'const UI_VERSION = \\"0.6.15\\"', "guard UI version") if 'const UI_VERSION = \\"0.6.14\\"' in check else replace_once(check, 'const UI_VERSION = "0.6.14"', 'const UI_VERSION = "0.6.15"', "guard UI version")
marker_anchor = '  \'this._showScaleToast("Масштаб 100%")\',\n]) requireMarker(marker);'
marker_patch = '  \'this._showScaleToast("Масштаб 100%")\',\n  \'class="systemConnection ${tone}"\',\n  \'data-connection-indicator\',\n  \'"Данные актуальны"\',\n  \'"Данные устарели"\',\n  \'"Нет связи"\',\n  \'class="statusScreen"\',\n  \'d="M 286 48 H 455"\',\n]) requireMarker(marker);'
check = replace_once(check, marker_anchor, marker_patch, "guard markers")
check += '\nif (source.includes("${this.nodes(e)}")) {\n  throw new Error("Status strip must not be rendered on the status view");\n}\n'
check_path.write_text(check, encoding="utf-8")

compliance_path = Path("docs/NIKAS_SPECIALIZED_PANEL_COMPLIANCE.md")
compliance = compliance_path.read_text(encoding="utf-8")
compliance = compliance.replace('`irrigation-panel.js` v0.6.13', f'`irrigation-panel.js` v{PANEL_VERSION}', 1)
compliance = compliance.replace('integration `1.0.0-b005.31`', f'integration `{INTEGRATION_VERSION}`', 1)
compliance = compliance.replace(
    '| Optional two-level indicator | PASS | Not enabled without a repository request. The existing factual single-line transport badge is preserved; no freshness row was invented. |',
    '| Optional two-level indicator | PASS | Explicitly enabled for HO-SC-8W: canonical transport/freshness vocabulary, 16/13 typography, status tint, stable subtree and point-patched updates. |',
    1,
)
compliance += '\n## UI 0.6.15 composition delta\n\n- Status strip removed from the first screen.\n- Standard two-level connection/freshness indicator enabled by explicit product request.\n- Pressure remains compact in the hero; duplicate status cards are absent.\n- Rain sensor moved away from the controller and linked by one direct horizontal midline.\n- Phone schematic height is viewport-responsive to consume the freed first-screen space without changing Header/Bottom Tab Bar geometry.\n- Zoom/scroll engine is unchanged: one viewport/canvas, native vertical scroll at 100%, >100% axis-aware pan, two-finger reset.\n'
compliance_path.write_text(compliance, encoding="utf-8")
