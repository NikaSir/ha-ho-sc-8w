import "./irrigation-panel-v0702.mjs";

const UI_VERSION = "0.7.03";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0702 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

p._programReadOnlyCardV0690 = function programReadOnlyCardV0703(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";

  // The green eye badge already establishes read-only mode. Keep only one
  // operational snapshot line below the hero: freshness + DP38 + timestamp.
  const status = card?.querySelector(".programReadFresh");
  if (status) {
    status.innerHTML = `<span><i></i><b>Данные актуальны · DP38${received ? ` · ${this.esc(received)}` : ""}</b></span>`;
  }
  return template.innerHTML;
};

p._applyProgramFreshnessToneV0699 = function applyProgramFreshnessToneV0703() {
  const root = this.shadowRoot;
  if (!root) return;
  for (const card of root.querySelectorAll(".programReadOnly")) {
    const zone = Number(this._programZone) || 1;
    const attrs = this.attrs(this.entities().zones[zone]?.schedule);
    const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";
    const stale = (root.textContent || "").includes("Данные устарели");
    const fresh = !stale && (root.textContent || "").includes("Данные свежие");
    card.classList.toggle("programSnapshotStale", stale);
    card.classList.toggle("programSnapshotFresh", fresh);
    const label = card.querySelector(".programReadFresh b");
    if (label) label.textContent = `${stale ? "Данные устарели" : "Данные актуальны"} · DP38${received ? ` · ${received}` : ""}`;
  }
};

p._render = function renderV0703() {
  previousRender.call(this);
  this._applyProgramFreshnessToneV0699();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0703() {
  return `${previousStyles.call(this)}
    .programReadOnly .programReadFresh{justify-content:flex-start!important}
    .programReadOnly .programReadFresh b::after{content:none!important}
  `;
};
