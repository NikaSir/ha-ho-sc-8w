import "./irrigation-panel-v0697.mjs";

const UI_VERSION = "0.6.98";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0697 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._render = function renderV0698() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0698() {
  return `${previousStyles.call(this)}
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      line-height:1!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-date-and-time-value{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      height:100%!important;
      text-align:center!important;
      line-height:1!important;
    }
  `;
};
