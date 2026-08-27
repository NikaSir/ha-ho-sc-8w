from pathlib import Path
import json

PANEL=Path('custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js')
p=PANEL.read_text(encoding='utf-8')

def once(a,b):
    global p
    if a not in p:
        raise RuntimeError('missing marker: '+a[:120])
    p=p.replace(a,b,1)

once('const UI_VERSION = "0.6.17";', 'const UI_VERSION = "0.6.18";')
once('const ASSET_VERSION = "0.6.17";', 'const ASSET_VERSION = "0.6.18";')

# Provisional DP102 mapping for on-screen validation: current observed state must allow irrigation.
once('''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Блокирует", tone: "blocked" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "clear" };\n      return { label: "Нет данных", tone: "unknown" };\n    }''','''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", detail: "Состояние неизвестно", tone: "unknown", icon: "mdi:help-circle" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Не блокирует", detail: "Полив разрешён", tone: "clear", icon: "mdi:check-circle" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Блокирует", detail: "Полив запрещён", tone: "blocked", icon: "mdi:alert-circle" };\n      return { label: "Нет данных", detail: "Состояние неизвестно", tone: "unknown", icon: "mdi:help-circle" };\n    }''')

old='''      const pressure = this.pressurePresentation(e);\n      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";\n      const connectionEntity = e.connection ? ` data-entity="${this.esc(e.connection)}"` : "";\n      const aria = `${label}. ${freshness}`;\n      return `<div class="connectionWrap"><button class="systemConnection ${tone}" data-connection-indicator${connectionEntity} aria-label="${this.esc(aria)}"><span class="systemConnectionMain"><i></i><b>${label}</b></span><small class="freshness ${freshnessTone}">${freshness}</small></button><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button></div>`;'''
new='''      const pressure = this.pressurePresentation(e);\n      const rain = this.rainPresentation(e);\n      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";\n      const rainEntity = e.rain ? ` data-entity="${this.esc(e.rain)}"` : "";\n      const connectionEntity = e.connection ? ` data-entity="${this.esc(e.connection)}"` : "";\n      const aria = `${label}. ${freshness}`;\n      return `<div class="connectionWrap"><button class="systemConnection ${tone}" data-connection-indicator${connectionEntity} aria-label="${this.esc(aria)}"><span class="systemConnectionMain"><i></i><b>${label}</b></span><small class="freshness ${freshnessTone}">${freshness}</small></button><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button><button class="rainStatusCard ${rain.tone}"${rainEntity}><span class="rainStatusPhoto" aria-hidden="true"></span><span class="rainStatusText"><b>Датчик дождя</b><strong>${this.esc(rain.label)}</strong><small>${this.esc(rain.detail)}</small></span><ha-icon icon="${rain.icon}"></ha-icon></button></div>`;'''
once(old,new)

# Remove rain sensor and its wire from the schematic; controller-to-valve control lead remains.
once('          <path class="wire rainWire" d="M 294 50 H 452"/>\n','')
once('''        <button class="rainSensor ${rain.tone}" data-entity="${this.esc(e.rain)}"><span class="rainSensorText"><b>Датчик дождя</b><small>${this.esc(rain.label)}</small></span></button>\n''','')
once('      const rain = this.rainPresentation(e);\n      return `<div class="systemDiagram">','      return `<div class="systemDiagram">')

# Restore approved informative zone-card hierarchy including semantic ready colour and program note.
once('''            <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>\n            <span class="duration"><b>${this.esc(z.duration)}</b><small>мин</small></span>''','''            <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>\n            <span class="duration"><span><b>${this.esc(z.duration)}</b><small>мин</small></span><em>по программе</em></span>''')

# Append final v0.6.18 visual overrides before style template closes.
marker='''        /* v0.6.17 smooth pinch */\n        .workCanvas{will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform-origin:0 0}\n        .rainSensor.blocked .rainSensorText small{color:var(--orange)}.rainSensor.clear .rainSensorText small{color:var(--green)}\n'''
css='''        /* v0.6.18 approved rain card under pressure; no rain wire in schematic. */\n        .rainStatusCard{position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) 22px;align-items:center;gap:7px;width:100%;min-height:62px;padding:6px 8px;border:1px solid color-mix(in srgb,var(--muted) 24%,transparent);border-radius:14px;background:var(--card);text-align:left;box-shadow:none}\n        .rainStatusCard.clear{background:color-mix(in srgb,var(--green) 8%,var(--card));border-color:color-mix(in srgb,var(--green) 24%,transparent)}.rainStatusCard.blocked{background:color-mix(in srgb,var(--orange) 8%,var(--card));border-color:color-mix(in srgb,var(--orange) 35%,transparent)}\n        .rainStatusPhoto{display:block;width:30px;height:48px;background:transparent url("${APPROVED_VISUALS.rain}") center/contain no-repeat}.rainStatusText{display:grid;gap:1px;min-width:0}.rainStatusText b{font-size:11px;line-height:1.05;color:var(--muted)}.rainStatusText strong{font-size:13px;line-height:1.05;color:var(--green);white-space:nowrap}.rainStatusText small{font-size:11px!important;line-height:1.05;color:var(--muted);white-space:nowrap}.rainStatusCard.blocked .rainStatusText strong,.rainStatusCard.blocked>ha-icon{color:var(--orange)}.rainStatusCard.clear>ha-icon{color:var(--green)}.rainStatusCard.unknown .rainStatusText strong,.rainStatusCard.unknown>ha-icon{color:var(--muted)}.rainStatusCard>ha-icon{--mdc-icon-size:20px}\n        .statusScreen .systemDiagram{margin-top:5px}.controller{top:3%;height:24%}.controlBus{top:31%}.schemaGrid{top:30%}.manifoldRail{top:48%}.supplyLine{top:calc(48% + 7px)}\n        .schemaGrid .diagramZone .zoneText small{color:var(--green)!important;font-weight:700}.schemaGrid .diagramZone.running .zoneText small{color:var(--a)!important}.schemaGrid .diagramZone.queued .zoneText small{color:var(--orange)!important}.schemaGrid .diagramZone.off .zoneText small,.schemaGrid .diagramZone.unknown .zoneText small{color:var(--muted)!important}\n        .schemaGrid .diagramZone .duration{display:grid!important;gap:2px;align-content:start}.schemaGrid .diagramZone .duration>span{display:flex;align-items:baseline;gap:3px}.schemaGrid .diagramZone .duration em{display:block;font-size:9px;font-style:normal;font-weight:500;line-height:1;color:var(--muted);white-space:nowrap}\n        @media(max-width:520px){.rainStatusCard{grid-template-columns:30px minmax(0,1fr) 20px;min-height:58px;padding:5px 7px;gap:6px}.rainStatusPhoto{width:27px;height:44px}.rainStatusText b{font-size:10px}.rainStatusText strong{font-size:12px}.rainStatusText small{font-size:10px!important}.statusScreen .systemDiagram{margin-top:4px}.controller{top:3%;height:24%}.controlBus{top:31%}.schemaGrid{top:30%}.manifoldRail{top:48%}.supplyLine{top:calc(48% + 6px)}.schemaGrid .diagramZone .duration em{font-size:8px}}\n'''
if marker not in p: raise RuntimeError('v0.6.17 css marker missing')
p=p.replace(marker,marker+css,1)
PANEL.write_text(p,encoding='utf-8')

# Version metadata.
const=Path('custom_components/nikas_ho_sc_8w/const.py'); s=const.read_text(); const.write_text(s.replace('PANEL_VERSION = "0.6.17"','PANEL_VERSION = "0.6.18"'))
manifest=Path('custom_components/nikas_ho_sc_8w/manifest.json'); d=json.loads(manifest.read_text()); d['version']='1.0.0-b005.36'; manifest.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for fn in ['panel.json','panel_manifest.json']:
    x=Path(fn); d=json.loads(x.read_text())
    if fn=='panel.json': d['panel']['dashboard_version']='0.6.18'
    else: d['panel_version']='0.6.18'; d['integration_version']='1.0.0-b005.36'
    x.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

g=Path('scripts/check-panel-ui-v16.mjs'); s=g.read_text().replace('const UI_VERSION = "0.6.17"','const UI_VERSION = "0.6.18"')
s=s.replace("  'label: \"Блокирует\"',\n  'label: \"Не блокирует\"',", "  'label: \"Блокирует\"',\n  'label: \"Не блокирует\"',\n  'class=\"rainStatusCard ${rain.tone}\"',\n  '<em>по программе</em>',")
s=s.replace("  'd=\"M 294 50 H 452\"',\n",'')
g.write_text(s)
