import "./irrigation-panel-v0663.mjs";

const UI_VERSION = "0.6.64";
const SEASONAL_VALUES = Object.freeze(
  Array.from({ length: 20 }, (_, index) => -90 + index * 10),
);
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;
const previousSystemSettingsView = p._systemSettingsView;

function seasonalOptionLabel(value) {
  if (value > 0) return `+${value} %`;
  if (value < 0) return `−${Math.abs(value)} %`;
  return "0 %";
}

function validSeasonalValue(value) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return SEASONAL_VALUES.includes(numeric) ? numeric : null;
}

p._seasonalSelectMarkup = function seasonalSelectMarkupV0664(entities) {
  const currentRaw = this.state(entities.seasonal);
  const current = validSeasonalValue(currentRaw);
  const draft = this._seasonalDraft === null
    ? current
    : validSeasonalValue(this._seasonalDraft);
  const selected = draft === null ? current : draft;
  const available = current !== null
    && this.commandAvailable("set_seasonal_adjustment");
  const options = SEASONAL_VALUES.map((value) => (
    `<option value="${value}"${value === selected ? " selected" : ""}>${seasonalOptionLabel(value)}</option>`
  )).join("");
  const placeholder = selected === null
    ? '<option value="" selected>Нет данных</option>'
    : "";
  return `<label class="seasonalSelectControl">
    <select data-season-value data-seasonal-select aria-label="Сезонная коррекция, процентов" ${available ? "" : "disabled"}>${placeholder}${options}</select>
    <ha-icon icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
  </label>`;
};

p._systemSettingsView = function systemSettingsViewV0664(entities) {
  return previousSystemSettingsView.call(this, entities).replace(
    /<label><input data-season-value[\s\S]*?<\/label>/,
    this._seasonalSelectMarkup(entities),
  );
};

p._ensureSeasonalSelectEvents = function ensureSeasonalSelectEventsV0664() {
  if (this._seasonalSelectEventsBound) return;
  this._seasonalSelectEventsBound = true;
  this.shadowRoot.addEventListener("change", (event) => {
    const select = event.target.closest?.("[data-seasonal-select]");
    if (!select) return;
    this._seasonalDraft = select.value;
  });
};

p._render = function renderV0664() {
  previousRender.call(this);
  this._ensureSeasonalSelectEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0664() {
  return `${previousStyles.call(this)}
    /* UI v0.6.64 — fixed-value seasonal adjustment selector. */
    .settingsSeasonal{grid-template-columns:minmax(0,1fr) 116px minmax(100px,.8fr)}
    .settingsSeasonal .seasonalSelectControl{
      position:relative;
      display:grid;
      grid-template-columns:minmax(0,1fr) 20px;
      align-items:center;
      min-width:0;
      min-height:42px;
      padding:0 8px 0 10px;
      border:1px solid var(--line);
      border-radius:13px;
      background:var(--soft);
    }
    .settingsSeasonal .seasonalSelectControl:focus-within{
      border-color:var(--a);
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 17%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl select{
      appearance:none;
      -webkit-appearance:none;
      width:100%;
      min-width:0;
      height:40px;
      padding:0;
      border:0;
      outline:0;
      background:transparent;
      color:var(--text);
      font:inherit;
      font-size:18px;
      font-weight:800;
      line-height:1;
      text-align:center;
      text-align-last:center;
    }
    .settingsSeasonal .seasonalSelectControl select:disabled{opacity:.52}
    .settingsSeasonal .seasonalSelectControl select option{
      background:var(--card);
      color:var(--text);
      font-size:18px;
    }
    .settingsSeasonal .seasonalSelectControl ha-icon{
      pointer-events:none;
      color:var(--a);
      --mdc-icon-size:20px;
    }
    .settingsSeasonal .seasonalSelectControl:has(select:disabled) ha-icon{
      color:var(--muted);
      opacity:.52;
    }
    @media(max-width:520px){
      .settingsSeasonal{grid-template-columns:minmax(0,1fr) 116px}
      .settingsSeasonal>button{grid-column:1/3}
    }
  `;
};
