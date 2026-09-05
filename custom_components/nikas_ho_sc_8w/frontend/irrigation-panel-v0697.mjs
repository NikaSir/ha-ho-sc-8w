import "./irrigation-panel-v0696.mjs";

const UI_VERSION = "0.6.97";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0696 panel is not registered");
const p = Panel.prototype;
const previousValidation = p._programEditorValidation;
const previousEditorCard = p._programEditorCard;
const previousRender = p._render;

p._programEditorValidation = function programEditorValidationV0697(state) {
  const prior = previousValidation.call(this, state);
  if (prior) return prior;
  const draft = state?.values || {};
  const duration = Number(draft.duration_minutes);
  // Controller observation: an enabled program with duration 0 does not retain
  // interval semantics and normalizes cycle_mode on read-back. Keep 0 as a
  // factual state for empty/disabled zones, but never dispatch it as an active
  // schedule. This preserves strict read-back instead of weakening verification.
  if (draft.program_enabled === true && duration === 0) {
    return "Для включённой программы длительность должна быть не меньше 1 минуты";
  }
  return "";
};

p._programEditorCard = function programEditorCardV0697(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousEditorCard.call(this, entities, zone);
  const state = this._programEditorState(entities, zone);
  const input = template.content.querySelector('[data-program-field="duration_minutes"]');
  if (input) input.min = state?.values?.program_enabled === true ? "1" : "0";
  const durationField = input?.closest(".programEditField");
  if (durationField && state?.values?.program_enabled === true) {
    const note = durationField.querySelector("em");
    if (note) note.textContent = "Включённая программа: минимум 1 мин";
  }
  return template.innerHTML;
};

p._render = function renderV0697() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
