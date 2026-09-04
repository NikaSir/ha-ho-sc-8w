import "./irrigation-panel-v0664.mjs";

const UI_VERSION = "0.6.65";
const FEEDBACK_DURATION_MS = 1500;
const FEEDBACK_KINDS = new Set(["success", "same", "error"]);
const FEEDBACK_CLASSES = Object.freeze([
  "seasonalFeedback-success",
  "seasonalFeedback-same",
  "seasonalFeedback-error",
]);
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

function seasonalValue(value) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return Number.isInteger(numeric)
    && numeric >= -90
    && numeric <= 100
    && numeric % 10 === 0
    ? numeric
    : null;
}

p._currentSeasonalValue = function currentSeasonalValueV0665() {
  return seasonalValue(this.state(this.entities().seasonal));
};

p._syncSeasonalApplyState = function syncSeasonalApplyStateV0665(selectedOverride) {
  const select = this.shadowRoot?.querySelector("[data-seasonal-select]");
  const button = this.shadowRoot?.querySelector("[data-season-apply]");
  if (!select || !button) return;
  const selected = seasonalValue(selectedOverride ?? select.value);
  const current = this._currentSeasonalValue();
  const changed = selected !== null && current !== null && selected !== current;
  const enabled = changed && this.commandAvailable("set_seasonal_adjustment");
  button.disabled = !enabled;
  button.setAttribute("aria-disabled", String(!enabled));
  button.dataset.seasonalChanged = changed ? "true" : "false";
};

p._applySeasonalFeedbackState = function applySeasonalFeedbackStateV0665() {
  const now = Date.now();
  if (this._seasonalFeedbackKind && now >= Number(this._seasonalFeedbackUntil || 0)) {
    this._seasonalFeedbackKind = null;
    this._seasonalFeedbackUntil = 0;
  }
  const control = this.shadowRoot?.querySelector(
    ".settingsSeasonal .seasonalSelectControl",
  );
  if (!control) return;
  control.classList.remove(...FEEDBACK_CLASSES);
  delete control.dataset.seasonalFeedback;
  const kind = this._seasonalFeedbackKind;
  if (!FEEDBACK_KINDS.has(kind)) return;
  control.classList.add(`seasonalFeedback-${kind}`);
  control.dataset.seasonalFeedback = kind;
};

p._clearSeasonalFeedback = function clearSeasonalFeedbackV0665() {
  clearTimeout(this._seasonalFeedbackTimer);
  this._seasonalFeedbackTimer = null;
  this._seasonalFeedbackToken = Number(this._seasonalFeedbackToken || 0) + 1;
  this._seasonalFeedbackKind = null;
  this._seasonalFeedbackUntil = 0;
  this._applySeasonalFeedbackState();
};

p._setSeasonalFeedback = function setSeasonalFeedbackV0665(kind) {
  if (!FEEDBACK_KINDS.has(kind)) return;
  clearTimeout(this._seasonalFeedbackTimer);
  const token = Number(this._seasonalFeedbackToken || 0) + 1;
  this._seasonalFeedbackToken = token;
  this._seasonalFeedbackKind = kind;
  this._seasonalFeedbackUntil = Date.now() + FEEDBACK_DURATION_MS;
  this.render();
  requestAnimationFrame(() => {
    if (this._seasonalFeedbackToken !== token) return;
    this._applySeasonalFeedbackState();
    this._syncSeasonalApplyState();
  });
  this._seasonalFeedbackTimer = setTimeout(() => {
    if (this._seasonalFeedbackToken !== token) return;
    this._seasonalFeedbackKind = null;
    this._seasonalFeedbackUntil = 0;
    this._seasonalFeedbackTimer = null;
    this._applySeasonalFeedbackState();
    this._syncSeasonalApplyState();
  }, FEEDBACK_DURATION_MS + 40);
};

p._ensureSeasonalFeedbackEvents = function ensureSeasonalFeedbackEventsV0665() {
  if (this._seasonalFeedbackEventsBound) return;
  this._seasonalFeedbackEventsBound = true;
  this.shadowRoot.addEventListener("change", (event) => {
    const select = event.target.closest?.("[data-seasonal-select]");
    if (!select) return;
    this._seasonalDraft = select.value;
    const selected = seasonalValue(select.value);
    const current = this._currentSeasonalValue();
    if (selected !== null && current !== null && selected === current) {
      this._setSeasonalFeedback("same");
    } else {
      this._clearSeasonalFeedback();
    }
    this._syncSeasonalApplyState(select.value);
  }, true);
};

p.applySeasonalAdjustment = async function applySeasonalAdjustmentV0665() {
  if (this.rejectUnavailableCommand("set_seasonal_adjustment")) {
    this._setSeasonalFeedback("error");
    return;
  }
  const input = this.shadowRoot.querySelector("[data-season-value]");
  const value = seasonalValue(input?.value ?? this._seasonalDraft);
  if (value === null) {
    this.notify("Сезонная коррекция: от −90% до 100%, шаг 10%");
    input?.focus();
    this._setSeasonalFeedback("error");
    return;
  }
  const currentRaw = this.state(this.entities().seasonal);
  const current = seasonalValue(currentRaw);
  if (current !== null && value === current) {
    this._setSeasonalFeedback("same");
    this._syncSeasonalApplyState(value);
    return;
  }
  if (!window.confirm(`Применить сезонную коррекцию ${value}%?\n\nТекущее значение: ${currentRaw}%.`)) return;
  this._clearSeasonalFeedback();
  this._seasonalBusy = true;
  this.render();
  let feedback = null;
  try {
    await this._hass.callService("nikas_ho_sc_8w", "set_seasonal_adjustment", {
      ...this.serviceTargetData(), value,
    });
    this._seasonalDraft = null;
    await this.refreshNow();
    feedback = "success";
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить сезонную коррекцию"));
    feedback = "error";
  } finally {
    this._seasonalBusy = false;
    if (feedback) this._setSeasonalFeedback(feedback);
    else this.render();
  }
};

p._render = function renderV0665() {
  previousRender.call(this);
  this._ensureSeasonalFeedbackEvents();
  this._applySeasonalFeedbackState();
  this._syncSeasonalApplyState();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0665() {
  return `${previousStyles.call(this)}
    /* UI v0.6.65 — local write feedback and change-gated Apply action. */
    .settingsSeasonal .seasonalSelectControl{
      transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease;
    }
    .settingsSeasonal [data-season-apply]:disabled{
      opacity:1;
      border-color:var(--line);
      background:var(--soft);
      color:var(--muted);
      box-shadow:none;
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-success{
      background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--soft));
      border-color:color-mix(in srgb,var(--success-color,#43a047) 34%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--success-color,#43a047) 12%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-success ha-icon{
      color:var(--success-color,#43a047);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-same{
      background:color-mix(in srgb,var(--a) 7%,var(--soft));
      border-color:color-mix(in srgb,var(--a) 28%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 8%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-error{
      background:color-mix(in srgb,var(--error-color,#db4437) 8%,var(--soft));
      border-color:color-mix(in srgb,var(--error-color,#db4437) 34%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 10%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-error ha-icon{
      color:var(--error-color,#db4437);
    }
    @media(prefers-reduced-motion:reduce){
      .settingsSeasonal .seasonalSelectControl{transition:none}
    }
  `;
};
