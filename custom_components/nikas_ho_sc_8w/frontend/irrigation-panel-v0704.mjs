import "./irrigation-panel-v0703.mjs";

const UI_VERSION = "0.7.04";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0703 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

p._programReadOnlyCardV0690 = function programReadOnlyCardV0704(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  if (!card) return template.innerHTML;

  // The legacy program hero contains a separate freshness row. Remove it from
  // Program view; .programReadFresh is the single canonical snapshot status.
  const legacyFresh = [...card.children].find((node) =>
    node !== card.querySelector(".programReadFresh") &&
    /Данные (свежие|устарели)/.test(node.textContent || "")
  );
  legacyFresh?.remove();
  return template.innerHTML;
};

p._syncSingleProgramFreshnessV0704 = function syncSingleProgramFreshnessV0704() {
  const root = this.shadowRoot;
  if (!root || this._view !== "program") return;
  const card = root.querySelector(".programReadOnly");
  if (!card) return;

  // Defensive cleanup for legacy markup inserted outside the read-only card.
  for (const node of root.querySelectorAll(".freshLine,.dataFresh,.programFresh,.zoneFresh,.detailFresh")) {
    if (node.closest(".programReadFresh")) continue;
    if (/Данные (свежие|устарели)/.test(node.textContent || "")) node.remove();
  }
};

p._render = function renderV0704() {
  previousRender.call(this);
  this._syncSingleProgramFreshnessV0704();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0704() {
  return `${previousStyles.call(this)}
    .programReadOnly>.freshLine,
    .programReadOnly>.dataFresh,
    .programReadOnly>.programFresh,
    .programReadOnly>.zoneFresh,
    .programReadOnly>.detailFresh{display:none!important}
  `;
};
