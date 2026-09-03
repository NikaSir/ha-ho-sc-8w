import "./irrigation-panel-v0660.mjs";

const UI_VERSION = "0.6.61";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p._updateNavigationState = function updateNavigationStateV0661() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
  if (!viewport) return;
  const longContent = (this._view === "status" && this._systemSettingsOpen)
    || this._view === "zones"
    || this._view === "manual";
  viewport.classList.toggle("longContentViewport", longContent);
};

p.manualView = function manualViewV0661(entities) {
  return previousManualView.call(this, entities)
    .replace(
      '<button type="button" class="manualStartTop" data-manual-start',
      '<button type="button" class="manualStartTop manualStartWide" data-manual-start',
    )
    .replace('<ha-icon icon="mdi:play"></ha-icon><span>Старт</span>', '<span>Старт полива</span>');
};

p._render = function renderV0661() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0661() {
  return `${previousStyles.call(this)}
    /* UI v0.6.61 — true auto-height scrolling and full-width Manual start. */
    .workViewport.isNative.longContentViewport{overflow-x:hidden;overflow-y:auto}
    .workViewport.isNative.longContentViewport .workCanvas{height:auto;min-height:100%}
    .workViewport.isNative.longContentViewport .workCanvas>.content{height:auto;min-height:100%;padding-bottom:18px}
    .manualApprovedIntro:has(.manualStartWide){grid-template-columns:minmax(0,1fr)}
    .manualStartWide{width:100%;min-width:0;height:52px;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 16px}
    .manualStartWide>span{font-size:19px}.manualStartWide>small:empty{display:none}
    @media(max-width:520px){.workViewport.isNative.longContentViewport .workCanvas>.content{padding-bottom:14px}.manualStartWide{height:48px;border-radius:16px}.manualStartWide>span{font-size:18px}}
  `;
};
