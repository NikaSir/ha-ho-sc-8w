import "./irrigation-panel-v0698.mjs";

const UI_VERSION = "0.6.99";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0698 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._applyProgramFreshnessToneV0699 = function applyProgramFreshnessToneV0699() {
  const root = this.shadowRoot;
  if (!root) return;
  const pageText = root.textContent || "";
  const stale = pageText.includes("Данные устарели");
  const fresh = pageText.includes("Данные свежие");
  for (const card of root.querySelectorAll(".programReadOnly")) {
    card.classList.toggle("programSnapshotStale", stale);
    card.classList.toggle("programSnapshotFresh", fresh && !stale);
  }
};

p._render = function renderV0699() {
  previousRender.call(this);
  this._applyProgramFreshnessToneV0699();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0699() {
  return `${previousStyles.call(this)}
    /* Factual DP38 values are green only while the full snapshot is fresh. */
    .programReadOnly.programSnapshotStale .programReadGrid article.factualConfirmed,
    .programReadOnly.programSnapshotStale .programReadStarts article.factualConfirmed{
      border-color:color-mix(in srgb,var(--warning-color,#f59e0b) 45%,var(--line))!important;
      background:color-mix(in srgb,var(--warning-color,#f59e0b) 8%,var(--card))!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh i{
      background:var(--warning-color,#f59e0b)!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh b,
    .programReadOnly.programSnapshotStale .zoneProgramStatus.ready{
      color:var(--warning-color,#f59e0b)!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh b::after{
      content:" · снимок устарел";
      font-weight:700;
    }
  `;
};
