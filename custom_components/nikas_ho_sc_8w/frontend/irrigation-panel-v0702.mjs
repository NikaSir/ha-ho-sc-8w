import "./irrigation-panel-v0701.mjs";

const UI_VERSION = "0.7.02";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0701 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

function pressureTone(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return "unknown";
  const raw = panel.state(entity);
  if (panel.bad(raw)) return "unknown";
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return "unknown";
  if (value === 0 || value < 0.3 || value > 4.0) return "danger";
  if (value < 2.5 || value > 3.5) return "warning";
  return "good";
}

function nearestVisualCard(node, root, minWidth = 140) {
  let current = node;
  while (current && current !== root) {
    const rect = current.getBoundingClientRect?.();
    const style = getComputedStyle(current);
    const radius = parseFloat(style.borderTopLeftRadius || "0");
    const border = parseFloat(style.borderTopWidth || "0");
    if (rect && rect.width >= minWidth && radius >= 10 && border > 0) return current;
    current = current.parentElement;
  }
  return null;
}

function applyTone(card, tone) {
  if (!card) return;
  const map = {
    danger: { fg: "var(--danger,#e53935)", bg: "color-mix(in srgb,var(--danger,#e53935) 9%,var(--card))", border: "color-mix(in srgb,var(--danger,#e53935) 68%,var(--line))" },
    warning: { fg: "var(--orange,#f59e0b)", bg: "color-mix(in srgb,var(--orange,#f59e0b) 9%,var(--card))", border: "color-mix(in srgb,var(--orange,#f59e0b) 62%,var(--line))" },
    good: { fg: "var(--green,#08a52b)", bg: "color-mix(in srgb,var(--green,#08a52b) 8%,var(--card))", border: "color-mix(in srgb,var(--green,#08a52b) 54%,var(--line))" },
    unknown: { fg: "var(--muted)", bg: "var(--soft)", border: "var(--line)" },
  };
  const c = map[tone] || map.unknown;
  card.style.setProperty("background", c.bg, "important");
  card.style.setProperty("border-color", c.border, "important");
  card.dataset.pressureTone = tone;
  for (const node of card.querySelectorAll("ha-icon,b,strong,h1")) {
    if ((node.textContent || "").includes("Локально")) continue;
    node.style.setProperty("color", c.fg, "important");
  }
}

p._syncActualPressureCardsV0702 = function syncActualPressureCardsV0702() {
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const entities = this.entities();
  const tone = pressureTone(this, entities);

  // Pressure metric: locate by its visible heading, then climb to the actual bordered card.
  const pressureLabel = [...root.querySelectorAll("small,b,span")].find((n) => (n.textContent || "").trim() === "Давление");
  applyTone(nearestVisualCard(pressureLabel, root, 140), tone);

  // Hero: locate the current status title and climb to the large bordered status card.
  const status = this.systemStatus(entities);
  const heroTitle = [...root.querySelectorAll("h1,h2,strong,b")].find((n) => (n.textContent || "").trim() === String(status?.title || "").trim());
  applyTone(nearestVisualCard(heroTitle, root, 300), status?.tone === "danger" ? "danger" : status?.tone === "warning" ? "warning" : status?.tone === "unknown" ? "unknown" : "good");
};

p._render = function renderV0702() {
  previousRender.call(this);
  this._syncActualPressureCardsV0702();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
