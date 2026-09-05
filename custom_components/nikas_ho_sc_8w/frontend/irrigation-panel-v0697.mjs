import "./irrigation-panel-v0696.mjs";

const UI_VERSION = "0.6.97";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0696 panel is not registered");
const p = Panel.prototype;
const previousValidation = p._programEditorValidation;
const previousEditorCard = p._programEditorCard;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorValidation = function programEditorValidationV0697(state) {
  const prior = previousValidation.call(this, state);
  if (prior) return prior;
  const draft = state?.values || {};
  const duration = Number(draft.duration_minutes);
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
  const date = template.content.querySelector('[data-program-field="anchor_date"]');
  const dateField = date?.closest(".programEditField");
  if (dateField) dateField.classList.add("programAnchorDateField");
  return template.innerHTML;
};

p._render = function renderV0697() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0697() {
  return `${previousStyles.call(this)}
    .programEditor .programAnchorDateField{overflow:visible!important;min-width:0!important}
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]{
      display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
      height:44px!important;margin:0!important;padding:0 10px!important;box-sizing:border-box!important;
      border:1px solid var(--line)!important;border-radius:13px!important;background:var(--card)!important;
      box-shadow:none!important;color:var(--text)!important;font:inherit!important;font-size:16px!important;
      font-weight:800!important;text-align:center!important;-webkit-appearance:none!important;appearance:none!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-date-and-time-value{
      width:100%!important;min-width:0!important;margin:0!important;padding:0!important;text-align:center!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-calendar-picker-indicator{
      margin:0!important;padding:4px!important;opacity:.72!important;
    }
    @media(max-width:520px){.programEditor .programAnchorDateField>[data-program-field="anchor_date"]{height:42px!important;padding:0 7px!important;font-size:15px!important}}
  `;
};
