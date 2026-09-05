import "./irrigation-panel-v0691.mjs";

const UI_VERSION = "0.6.92";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0691 panel is not registered");
const p = Panel.prototype;
const previousEditorBase = p._programEditorBase;
const previousEditorPatch = p._programEditorPatch;
const previousEditorSummary = p._programEditorSummary;
const previousEditorCard = p._programEditorCard;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorBase = function programEditorBaseV0692(entities, zone) {
  const base = previousEditorBase.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  base.program_enabled = attrs.dp38_program_enabled === true
    ? true
    : attrs.dp38_program_enabled === false ? false : null;
  return base;
};

p._programEditorPatch = function programEditorPatchV0692(state) {
  const patch = previousEditorPatch.call(this, state);
  const base = state?.base || {};
  const draft = state?.values || {};
  if (typeof draft.program_enabled === "boolean" && draft.program_enabled !== base.program_enabled) {
    patch.program_enabled = draft.program_enabled;
  }
  return patch;
};

p._programEditorSummary = function programEditorSummaryV0692(patch) {
  const rows = previousEditorSummary.call(this, patch);
  if (Object.prototype.hasOwnProperty.call(patch, "program_enabled")) {
    rows.push(`Программа зоны: ${patch.program_enabled ? "включить" : "выключить"}`);
  }
  return rows;
};

p._programEditorCard = function programEditorCardV0692(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousEditorCard.call(this, entities, zone);
  const state = this._programEditorState(entities, zone);
  const draft = state.values;
  const changed = this._programEditorChanged(state, "program_enabled");

  const oldHighNibble = [...template.content.querySelectorAll(".programEditField")]
    .find((node) => node.textContent.includes("high nibble byte 19"));
  if (oldHighNibble) {
    const card = document.createElement("div");
    card.className = `programEditField programEnabledField ${changed ? "changed" : ""}`;
    const known = typeof draft.program_enabled === "boolean";
    card.innerHTML = `<small>Программа зоны</small>
      <button type="button" class="programEnabledToggle ${draft.program_enabled === true ? "on" : draft.program_enabled === false ? "off" : "unknown"}" data-program-enabled-toggle="${zone}" ${known ? "" : "disabled"} aria-pressed="${draft.program_enabled === true}">
        <ha-icon icon="${draft.program_enabled === true ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"}"></ha-icon>
        <b>${draft.program_enabled === true ? "Включена" : draft.program_enabled === false ? "Выключена" : "Нет данных"}</b>
      </button>
      <em>Локальный флаг программы этой зоны</em>`;
    oldHighNibble.replaceWith(card);
  }

  const note = template.content.querySelector(".programEditorNote span");
  if (note) {
    note.textContent = "Изменения накапливаются только в панели. После «Применить» выполняются свежий preflight 1–8, одна запись выбранной зоны и полный read-back 1–8.";
  }
  return template.innerHTML;
};

p._ensureV0692Events = function ensureV0692Events() {
  if (this._v0692EventsBound) return;
  this._v0692EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const control = event.target?.closest?.("[data-program-enabled-toggle]");
    if (!control || control.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const zone = Number(control.dataset.programEnabledToggle);
    const state = this._programEditorState(this.entities(), zone);
    if (typeof state.values.program_enabled !== "boolean") return;
    state.values.program_enabled = !state.values.program_enabled;
    this._programFieldFeedback = null;
    this._programForceRender = true;
    try { this.render(); } finally { this._programForceRender = false; }
  }, true);
};

p._render = function renderV0692() {
  previousRender.call(this);
  this._ensureV0692Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0692() {
  return `${previousStyles.call(this)}
    /* UI 0.6.92: neutral editor at rest; blue draft; green only verified; red mismatch. */
    .programEditor .programEditField,
    .programEditor .programRepeatEditor,
    .programEditor .programStartsEditor,
    .programEditor .programEditStart{
      border-color:var(--line)!important;
      background:var(--card)!important;
      box-shadow:none!important;
    }
    .programEditor .programEditField.readOnly{background:var(--soft)!important}
    .programEditor .programEditField.changed,
    .programEditor .programRepeatEditor.changed,
    .programEditor .programStartsEditor.changed,
    .programEditor .programEditStart.changed,
    .programEditor .programEnabledField.changed{
      border-color:color-mix(in srgb,var(--a) 54%,var(--line))!important;
      background:color-mix(in srgb,var(--a) 7%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 8%,transparent)!important;
    }
    .programEditor .confirmed{
      border-color:color-mix(in srgb,var(--green) 46%,var(--line))!important;
      background:color-mix(in srgb,var(--green) 8%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--green) 7%,transparent)!important;
    }
    .programEditor .rejected{
      border-color:color-mix(in srgb,var(--error-color,#db4437) 48%,var(--line))!important;
      background:color-mix(in srgb,var(--error-color,#db4437) 7%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 7%,transparent)!important;
    }
    .programEnabledField{display:grid;align-content:start;gap:7px}
    .programEnabledToggle{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:6px 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft);color:var(--text);text-align:left}
    .programEnabledToggle ha-icon{--mdc-icon-size:27px;color:var(--muted)}
    .programEnabledToggle.on ha-icon{color:var(--green)}
    .programEnabledToggle.off ha-icon{color:var(--muted)}
    .programEnabledToggle b{font-size:16px}
    .programEnabledToggle:disabled{opacity:.58}
  `;
};
