import "./irrigation-panel-v0693.mjs";

const UI_VERSION = "0.6.94";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0693 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._render = function renderV0694() {
  previousRender.call(this);
  // Re-apply the browser-local artwork state after every render. The actual
  // selection is owned by v0658/v0659 and stored in zone_artwork.v1.
  this._applyZoneArtwork?.();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0694() {
  return `${previousStyles.call(this)}
    /* UI 0.6.94 — browser-selected artwork is authoritative on every zone surface. */
    .scene1{background-image:var(--zone-artwork-1)!important}
    .scene2{background-image:var(--zone-artwork-2)!important}
    .scene3{background-image:var(--zone-artwork-3)!important}
    .scene4{background-image:var(--zone-artwork-4)!important}
    .scene5{background-image:var(--zone-artwork-5)!important}
    .scene6{background-image:var(--zone-artwork-6)!important}
    .scene7{background-image:var(--zone-artwork-7)!important}
    .scene8{background-image:var(--zone-artwork-8)!important}
  `;
};
