import "./irrigation-panel-v0699.mjs";

const UI_VERSION = "0.7.00";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0699 panel is not registered");
const p = Panel.prototype;
const previousSystemStatus = p.systemStatus;
const previousRender = p._render;
const previousStyles = p.styles;

function irrigationPressureState(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  const raw = panel.state(entity);
  if (panel.bad(raw)) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  if (value === 0) return { level: "danger", value, label: "Нет давления", tone: "danger" };
  if (value < 0.3) return { level: "danger", value, label: "Аварийно низкое", tone: "danger" };
  if (value < 2.5) return { level: "warning", value, label: "Недостаточное", tone: "warning" };
  if (value <= 3.5) return { level: "normal", value, label: "Норма", tone: "good" };
  if (value <= 4.0) return { level: "warning", value, label: "Повышенное", tone: "warning" };
  return { level: "danger", value, label: "Аварийно высокое", tone: "danger" };
}

p.pressurePresentation = function pressurePresentationV0700(e) {
  const state = irrigationPressureState(this, e);
  if (state.value == null) {
    return { value: "Нет данных", note: "Нет данных о давлении", tone: "unknown", status: state.label };
  }
  const formatted = state.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    value: `${formatted} bar`,
    note: state.label,
    tone: state.tone,
    status: state.label,
  };
};

p.systemStatus = function systemStatusV0700(e) {
  const base = previousSystemStatus.call(this, e);
  const pressure = irrigationPressureState(this, e);
  if (pressure.level === "unknown") {
    return { tone: "unknown", title: "Нет данных о давлении", sub: "Состояние поливочной линии не подтверждено" };
  }
  if (pressure.level === "danger") {
    if (pressure.value === 0) return { tone: "danger", title: "Нет давления", sub: "Поливочная линия: 0,00 bar" };
    if (pressure.value < 0.3) return { tone: "danger", title: "Аварийно низкое давление", sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
    return { tone: "danger", title: "Аварийно высокое давление", sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
  }
  if (pressure.level === "warning") {
    const title = pressure.value < 2.5 ? "Недостаточное давление" : "Повышенное давление";
    return { tone: "warning", title, sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
  }
  return base;
};

p._render = function renderV0700() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0700() {
  return `${previousStyles.call(this)}
    /* Pressure thresholds are canonical with NikaS Water Accounting irrigation contour. */
    .heroPressure b.good{color:var(--green)!important}
    .heroPressure b.warning{color:var(--orange,#f59e0b)!important}
    .heroPressure b.danger{color:var(--danger,#e53935)!important}
    .heroPressure b.unknown{color:var(--muted)!important}
    .hero.warning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 42%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 5%,var(--card))!important}
    .hero.warning .heroStatus h1{color:var(--orange,#f59e0b)!important}
    .hero.danger{border-color:color-mix(in srgb,var(--danger,#e53935) 46%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 5%,var(--card))!important}
    .hero.danger .heroStatus h1{color:var(--danger,#e53935)!important}
  `;
};
