import "./irrigation-panel-v0700.mjs";

const UI_VERSION = "0.7.01";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0700 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

const HERO_TONES = ["ready", "active", "warning", "danger", "unknown", "off"];
const PRESSURE_TONES = ["pressureGood", "pressureWarning", "pressureDanger", "pressureUnknown"];

function pressureTone(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return "pressureUnknown";
  const raw = panel.state(entity);
  if (panel.bad(raw)) return "pressureUnknown";
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return "pressureUnknown";
  if (value === 0 || value < 0.3 || value > 4.0) return "pressureDanger";
  if (value < 2.5 || value > 3.5) return "pressureWarning";
  return "pressureGood";
}

p._syncPressureVisualToneV0701 = function syncPressureVisualToneV0701() {
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const entities = this.entities();
  const status = this.systemStatus(entities);
  const hero = root.querySelector(".statusScreen .hero");
  if (hero) {
    hero.classList.remove(...HERO_TONES);
    hero.classList.add(HERO_TONES.includes(status?.tone) ? status.tone : "unknown");
  }
  const tone = pressureTone(this, entities);
  const pressureNodes = [...root.querySelectorAll(".statusScreen button")].filter((node) => {
    const title = node.querySelector("small")?.textContent?.trim().toLocaleLowerCase("ru-RU") || "";
    return title === "давление" || node.classList.contains("heroPressure");
  });
  for (const node of pressureNodes) {
    node.classList.remove(...PRESSURE_TONES);
    node.classList.add(tone);
  }
};

p._render = function renderV0701() {
  previousRender.call(this);
  this._syncPressureVisualToneV0701();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0701() {
  return `${previousStyles.call(this)}
    .statusScreen .hero.danger{border-color:color-mix(in srgb,var(--danger,#e53935) 62%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 7%,var(--card))!important}
    .statusScreen .hero.danger .heroStatus h1{color:var(--danger,#e53935)!important}
    .statusScreen .hero.warning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 58%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 7%,var(--card))!important}
    .statusScreen .hero.warning .heroStatus h1{color:var(--orange,#f59e0b)!important}
    .statusScreen button.pressureDanger{border-color:color-mix(in srgb,var(--danger,#e53935) 58%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 8%,var(--card))!important}
    .statusScreen button.pressureDanger ha-icon,.statusScreen button.pressureDanger b{color:var(--danger,#e53935)!important}
    .statusScreen button.pressureWarning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 55%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 8%,var(--card))!important}
    .statusScreen button.pressureWarning ha-icon,.statusScreen button.pressureWarning b{color:var(--orange,#f59e0b)!important}
    .statusScreen button.pressureGood{border-color:color-mix(in srgb,var(--green,#08a52b) 48%,var(--line))!important;background:color-mix(in srgb,var(--green,#08a52b) 7%,var(--card))!important}
    .statusScreen button.pressureGood ha-icon,.statusScreen button.pressureGood b{color:var(--green,#08a52b)!important}
    .statusScreen button.pressureUnknown{border-color:var(--line)!important;background:var(--soft)!important}
    .statusScreen button.pressureUnknown ha-icon,.statusScreen button.pressureUnknown b{color:var(--muted)!important}
  `;
};
