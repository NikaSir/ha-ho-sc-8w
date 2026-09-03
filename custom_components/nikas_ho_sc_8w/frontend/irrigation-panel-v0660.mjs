import "./irrigation-panel-v0659.mjs";

const UI_VERSION = "0.6.60";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p._updateNavigationState = function updateNavigationStateV0660() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
  if (!viewport) return;

  // The compact six-zone layouts used to suppress scrolling. The current
  // screens can contain up to eight zones and Settings is taller than Status.
  viewport.classList.remove("zonesFitsViewport", "manualFitsViewport");
  if (this._view === "status" && this._systemSettingsOpen) {
    viewport.classList.remove("statusFitsViewport");
  }
};

p._render = function renderV0660() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0660() {
  return `${previousStyles.call(this)}
    /* UI v0.6.60 — scrollable long views and persistent program-zone tabs. */
    .workViewport.isNative.zonesFitsViewport,
    .workViewport.isNative.manualFitsViewport{overflow-y:auto}
    .workViewport.isNative.statusFitsViewport .settingsScreen{overflow:visible}
    .programZoneTabs{position:sticky;top:0;z-index:18;margin-top:0;background:color-mix(in srgb,var(--bg) 96%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
    .settingsArtworkRow .scene,.settingsScreen .zoneArtworkPreview{background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;background-color:var(--soft)}
    .systemSettingsButton{bottom:calc(68px + env(safe-area-inset-bottom))}
    @media(max-width:520px){.systemSettingsButton{bottom:calc(66px + env(safe-area-inset-bottom))}}
  `;
};
