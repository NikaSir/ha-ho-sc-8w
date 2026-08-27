from pathlib import Path
import json

PANEL = Path('custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js')
p = PANEL.read_text(encoding='utf-8')

def once(old, new):
    global p
    if old not in p:
        raise RuntimeError('missing marker: ' + old[:100])
    p = p.replace(old, new, 1)

once('const UI_VERSION = "0.6.16";', 'const UI_VERSION = "0.6.17";')
once('const ASSET_VERSION = "0.6.16";', 'const ASSET_VERSION = "0.6.17";')
once('      this._wheelSaveTimer = null;\n', '      this._wheelSaveTimer = null;\n      this._transformFrame = 0;\n      this._pendingTransform = null;\n')
once('''    _applyTransform() {\n      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");\n      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");\n      if (canvas) canvas.style.transform = this._transformCss();\n      if (viewport) {\n        viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1);\n        viewport.classList.toggle("isNative", this._viewTransform.scale <= 1);\n      }\n    }''', '''    _applyTransform() {\n      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");\n      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");\n      if (canvas) canvas.style.transform = this._transformCss();\n      if (viewport) {\n        viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1);\n        viewport.classList.toggle("isNative", this._viewTransform.scale <= 1);\n      }\n    }\n\n    _scheduleGestureTransform(transform) {\n      this._pendingTransform = transform;\n      if (this._transformFrame) return;\n      this._transformFrame = requestAnimationFrame(() => {\n        this._transformFrame = 0;\n        if (!this._pendingTransform) return;\n        this._viewTransform = this._pendingTransform;\n        this._pendingTransform = null;\n        this._clampAndApplyTransform(false);\n      });\n    }''')
once('''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Учитывается", tone: "armed" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "bypass" };\n      return { label: String(value), tone: "unknown" };\n    }''', '''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Блокирует", tone: "blocked" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "clear" };\n      return { label: "Нет данных", tone: "unknown" };\n    }''')
once('''          this._viewTransform = {\n            scale: nextScale,\n            x: mid.x - start.contentX * nextScale,\n            y: mid.y - start.contentY * nextScale,\n          };\n          this._cancelLongPresses();\n          this._clampAndApplyTransform(false);''', '''          this._scheduleGestureTransform({\n            scale: nextScale,\n            x: mid.x - start.contentX * nextScale,\n            y: mid.y - start.contentY * nextScale,\n          });\n          this._cancelLongPresses();''')
once('''        this._viewTransform = { ...this._viewTransform, x: start.x + dx, y: start.y + dy };\n        this._clampAndApplyTransform(false);''', '''        this._scheduleGestureTransform({ ...this._viewTransform, x: start.x + dx, y: start.y + dy });''')
once('''      const finishPointer = (event) => {\n        if (!this._gesturePointers.has(event.pointerId)) return;''', '''      const finishPointer = (event) => {\n        if (this._pendingTransform) {\n          this._viewTransform = this._pendingTransform;\n          this._pendingTransform = null;\n        }\n        if (this._transformFrame) { cancelAnimationFrame(this._transformFrame); this._transformFrame = 0; }\n        if (!this._gesturePointers.has(event.pointerId)) return;''')
# final CSS override for visual target + GPU-stable transform
needle = '      `;\n    }\n\n    _render() {'
css = '''\n        /* v0.6.17: approved card geometry, binary rain copy and frame-coalesced pinch. */\n        .workCanvas{will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform-origin:0 0;contain:layout paint style}\n        .rainSensor.blocked .rainSensorText small{color:var(--orange)}.rainSensor.clear .rainSensorText small{color:var(--green)}\n        .schemaGrid .diagramZone{grid-template-rows:40px auto auto!important;padding:4px 5px 5px!important}\n        .schemaGrid .diagramZone .zoneText b{font-size:12px!important;font-weight:800}.schemaGrid .diagramZone .zoneText small{font-size:12px!important}.schemaGrid .diagramZone .duration b{font-size:16px!important}.schemaGrid .diagramZone .duration small{font-size:12px!important}\n'''
if needle not in p: raise RuntimeError('css insertion marker missing')
p = p.replace(needle, css + needle, 1)
PANEL.write_text(p, encoding='utf-8')

# versions
const = Path('custom_components/nikas_ho_sc_8w/const.py')
s = const.read_text(); s=s.replace('PANEL_VERSION = "0.6.16"','PANEL_VERSION = "0.6.17"'); const.write_text(s)
manifest=Path('custom_components/nikas_ho_sc_8w/manifest.json'); data=json.loads(manifest.read_text()); data['version']='1.0.0-b005.35'; manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for fn in ['panel.json','panel_manifest.json']:
    path=Path(fn); data=json.loads(path.read_text());
    if fn=='panel.json': data['panel']['dashboard_version']='0.6.17'
    else: data['panel_version']='0.6.17'; data['integration_version']='1.0.0-b005.35'
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# guard version and new markers
g=Path('scripts/check-panel-ui-v16.mjs'); s=g.read_text(); s=s.replace('const UI_VERSION = "0.6.16"','const UI_VERSION = "0.6.17"'); s=s.replace("  'd=\"M 294 50 H 452\"',", "  'd=\"M 294 50 H 452\"',\n  '_scheduleGestureTransform(transform)',\n  'label: \"Блокирует\"',\n  'label: \"Не блокирует\"',") ; g.write_text(s)
