import "./irrigation-panel-v0710.mjs";

const UI_VERSION = "0.7.11";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0710 panel is not registered");
const p = Panel.prototype;
const previousRenderV0711 = p._render;
const previousStylesV0711 = p.styles;

p.styles = function stylesV0711() {
  return `${previousStylesV0711.call(this)}
    /* UI v0.7.11 — pale-blue corner accent from the vacuum reference. */
    .systemOverview{position:relative;isolation:isolate;overflow:hidden}
    .systemOverview::before{content:"";position:absolute;top:-90px;right:-65px;width:200px;height:200px;border-radius:50%;background:rgba(0,160,200,.07);pointer-events:none;z-index:0}
    .systemOverview>.systemControllerPhoto,.systemOverview>.connectionWrap,.systemOverview>.systemReadiness{position:relative;z-index:1}
  `;
};

p._render = function renderV0711() {
  previousRenderV0711.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
