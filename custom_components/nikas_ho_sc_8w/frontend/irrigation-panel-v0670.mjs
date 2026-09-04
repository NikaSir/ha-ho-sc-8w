import "./irrigation-panel-v0669.mjs";

const UI_VERSION = "0.6.70";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0669 panel is not registered");
const p = Panel.prototype;
const previousSwitchView = p._switchView;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

p.refreshProgramDp38 = async function refreshProgramDp38V0670() {
  if (this._programSuppressImmediateRefresh) {
    this._programSuppressImmediateRefresh = false;
    if (this._programAutoRefreshTimer) window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = window.setTimeout(() => {
      this._programAutoRefreshTimer = null;
      if (this._view === "program" || this.view === "program" || this._currentView === "program") {
        previousRefreshProgramDp38.call(this);
      }
    }, 900);
    return;
  }
  return previousRefreshProgramDp38.call(this);
};

p._switchView = function switchViewV0670(view) {
  if (view === "program") this._programSuppressImmediateRefresh = true;
  previousSwitchView.call(this, view);
  if (view !== "program" && this._programAutoRefreshTimer) {
    window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = null;
  }
};

p._render = function renderV0670() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
