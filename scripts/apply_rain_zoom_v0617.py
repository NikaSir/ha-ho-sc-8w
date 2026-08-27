from pathlib import Path
import json
PANEL=Path('custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js'); p=PANEL.read_text()
def once(a,b):
 global p
 if a not in p: raise RuntimeError('missing '+a[:80])
 p=p.replace(a,b,1)
once('const UI_VERSION = "0.6.16";','const UI_VERSION = "0.6.17";'); once('const ASSET_VERSION = "0.6.16";','const ASSET_VERSION = "0.6.17";')
once('      this._wheelSaveTimer = null;\n','      this._wheelSaveTimer = null;\n      this._transformFrame = 0;\n      this._pendingTransform = null;\n')
once('''    _applyTransform() {\n      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");\n      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");\n      if (canvas) canvas.style.transform = this._transformCss();\n      if (viewport) {\n        viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1);\n        viewport.classList.toggle("isNative", this._viewTransform.scale <= 1);\n      }\n    }''','''    _applyTransform() {\n      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");\n      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");\n      if (canvas) canvas.style.transform = this._transformCss();\n      if (viewport) { viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1); viewport.classList.toggle("isNative", this._viewTransform.scale <= 1); }\n    }\n    _scheduleGestureTransform(transform) {\n      this._pendingTransform = transform;\n      if (this._transformFrame) return;\n      this._transformFrame = requestAnimationFrame(() => {\n        this._transformFrame = 0;\n        if (!this._pendingTransform) return;\n        this._viewTransform = this._pendingTransform; this._pendingTransform = null; this._clampAndApplyTransform(false);\n      });\n    }''')
once('''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Учитывается", tone: "armed" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "bypass" };\n      return { label: String(value), tone: "unknown" };\n    }''','''    rainPresentation(e) {\n      const value = this.state(e.rain);\n      if (this.bad(value)) return { label: "Нет данных", tone: "unknown" };\n      if (["enabled", "true", "on"].includes(String(value))) return { label: "Блокирует", tone: "blocked" };\n      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не блокирует", tone: "clear" };\n      return { label: "Нет данных", tone: "unknown" };\n    }''')
once('''          this._viewTransform = {\n            scale: nextScale,\n            x: mid.x - start.contentX * nextScale,\n            y: mid.y - start.contentY * nextScale,\n          };\n          this._cancelLongPresses();\n          this._clampAndApplyTransform(false);''','''          this._scheduleGestureTransform({ scale: nextScale, x: mid.x - start.contentX * nextScale, y: mid.y - start.contentY * nextScale });\n          this._cancelLongPresses();''')
once('''        this._viewTransform = { ...this._viewTransform, x: start.x + dx, y: start.y + dy };\n        this._clampAndApplyTransform(false);''','''        this._scheduleGestureTransform({ ...this._viewTransform, x: start.x + dx, y: start.y + dy });''')
once('''      const finishPointer = (event) => {\n        if (!this._gesturePointers.has(event.pointerId)) return;''','''      const finishPointer = (event) => {\n        if (this._pendingTransform) { this._viewTransform = this._pendingTransform; this._pendingTransform = null; }\n        if (this._transformFrame) { cancelAnimationFrame(this._transformFrame); this._transformFrame = 0; }\n        if (!this._gesturePointers.has(event.pointerId)) return;''')
# add CSS immediately before styles template return close nearest _render
idx=p.rfind('      `;\n    }\n\n    _render')
if idx<0: idx=p.rfind('      `;\n    }')
if idx<0: raise RuntimeError('style close missing')
css='''        /* v0.6.17 smooth pinch */\n        .workCanvas{will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform-origin:0 0}\n        .rainSensor.blocked .rainSensorText small{color:var(--orange)}.rainSensor.clear .rainSensorText small{color:var(--green)}\n'''
p=p[:idx]+css+p[idx:]; PANEL.write_text(p)
const=Path('custom_components/nikas_ho_sc_8w/const.py'); const.write_text(const.read_text().replace('PANEL_VERSION = "0.6.16"','PANEL_VERSION = "0.6.17"'))
m=Path('custom_components/nikas_ho_sc_8w/manifest.json'); d=json.loads(m.read_text()); d['version']='1.0.0-b005.35'; m.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for fn in ['panel.json','panel_manifest.json']:
 x=Path(fn); d=json.loads(x.read_text());
 if fn=='panel.json': d['panel']['dashboard_version']='0.6.17'
 else: d['panel_version']='0.6.17'; d['integration_version']='1.0.0-b005.35'
 x.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
g=Path('scripts/check-panel-ui-v16.mjs'); s=g.read_text().replace('const UI_VERSION = "0.6.16"','const UI_VERSION = "0.6.17"'); s=s.replace("  'd=\"M 294 50 H 452\"',", "  'd=\"M 294 50 H 452\"',\n  '_scheduleGestureTransform(transform)',\n  'label: \"Блокирует\"',\n  'label: \"Не блокирует\"',"); g.write_text(s)
