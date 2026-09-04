import "./irrigation-panel-v0666.mjs?v=0.6.67";

const UI_VERSION = "0.6.67";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0.6.66 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._render = function renderV0667() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
