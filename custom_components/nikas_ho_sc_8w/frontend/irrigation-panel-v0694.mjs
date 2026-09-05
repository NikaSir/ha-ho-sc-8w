import "./irrigation-panel-v0693.mjs";

const UI_VERSION = "0.6.94";
const ARTWORK_STORAGE_KEY = "nikas_ho_sc_8w.zone_artwork.v1";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0693 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._zoneArtworkState = function zoneArtworkStateV0694() {
  if (this.__zoneArtworkState) return this.__zoneArtworkState;
  let saved = {};
  try { saved = JSON.parse(window.localStorage.getItem(ARTWORK_STORAGE_KEY) || "{}"); } catch (_error) {}
  this.__zoneArtworkState = Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
    const zone = index + 1;
    const choice = ["lawn", "flowers", "shrubs", "greenhouse", "none"].includes(saved?.[zone]) ? saved[zone] : "none";
    return [zone, choice];
  }));
  return this.__zoneArtworkState;
};

p._render = function renderV0694() {
  previousRender.call(this);
  // Re-apply the browser-local artwork state after every render. Explicit
  // Settings choices are authoritative; zones without a saved choice are gray.
  this._applyZoneArtwork?.();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0694() {
  return `${previousStyles.call(this)}
    /* UI 0.6.94 — browser-selected artwork is authoritative; unsaved zones are neutral gray. */
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
