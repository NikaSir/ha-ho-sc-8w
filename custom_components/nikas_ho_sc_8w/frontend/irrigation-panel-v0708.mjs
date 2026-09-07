import "./irrigation-panel-v0707.mjs";

const UI_VERSION = "0.7.08";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0707 panel is not registered");
const p = Panel.prototype;
const previousSync = p._syncActualPressureCardsV0702;
const previousRender = p._render;

p._syncActualPressureCardsV0702 = function syncPressureCardsV0708() {
  previousSync.call(this);
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const status = this.systemStatus(this.entities());
  if (["danger", "warning", "unknown"].includes(status?.tone)) return;

  // The inherited sync marks the actual bordered cards after every render.
  // Neutralise only the controller card containing the current status title;
  // the separate pressure metric keeps its normal green indication.
  for (const card of root.querySelectorAll('[data-pressure-tone="good"]')) {
    const hasStatus = [...card.querySelectorAll("h1,h2,strong,b")].some(
      (node) => (node.textContent || "").trim() === String(status?.title || "").trim(),
    );
    if (!hasStatus) continue;
    card.style.setProperty("background", "var(--card)", "important");
    card.style.setProperty("border-color", "var(--line)", "important");
  }
};

p._render = function renderV0708() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
