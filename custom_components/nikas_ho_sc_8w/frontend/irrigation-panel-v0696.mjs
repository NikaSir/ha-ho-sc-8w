import "./irrigation-panel-v0695.mjs";

const UI_VERSION = "0.6.96";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0695 panel is not registered");
const p = Panel.prototype;
const previousEditorState = p._programEditorState;
const previousEditorPatch = p._programEditorPatch;
const previousRender = p._render;

const repeatKeys = new Set(["cycle_mode", "weekdays", "interval_days"]);

function ensureIntent(state) {
  if (!state) return new Set();
  if (!(state.intent instanceof Set)) state.intent = new Set();
  return state.intent;
}

function markIntent(state, key) {
  const intent = ensureIntent(state);
  intent.add(repeatKeys.has(key) ? "repeat" : key);
}

p._programEditorState = function programEditorStateV0696(entities, zone) {
  const state = previousEditorState.call(this, entities, zone);
  const intent = ensureIntent(state);
  const fresh = this._programEditorBase(entities, zone);

  // Controller state is authoritative for every field the user has not touched.
  // This prevents a stale draft from becoming a new edit after a fresh read-back.
  const sync = (key) => {
    if (intent.has(key)) return;
    state.values[key] = structuredClone(fresh[key]);
  };
  sync("duration_minutes");
  sync("start_times");
  if (!intent.has("repeat")) {
    state.values.cycle_mode = fresh.cycle_mode;
    state.values.weekdays = structuredClone(fresh.weekdays);
    state.values.interval_days = fresh.interval_days;
  }
  sync("anchor_date");
  sync("rain_sensor_follow");
  sync("program_enabled");
  state.base = fresh;
  return state;
};

p._programEditorPatch = function programEditorPatchV0696(state) {
  const candidate = previousEditorPatch.call(this, state);
  const intent = ensureIntent(state);
  const patch = {};
  const copy = (key) => {
    if (Object.prototype.hasOwnProperty.call(candidate, key)) patch[key] = candidate[key];
  };
  if (intent.has("duration_minutes")) copy("duration_minutes");
  if (intent.has("start_times")) copy("start_times");
  if (intent.has("repeat")) {
    copy("cycle_mode"); copy("weekdays"); copy("interval_days");
  }
  if (intent.has("anchor_date")) copy("anchor_date");
  if (intent.has("rain_sensor_follow")) copy("rain_sensor_follow");
  if (intent.has("program_enabled")) copy("program_enabled");
  return patch;
};

p._ensureV0696Events = function ensureV0696Events() {
  if (this._v0696EventsBound) return;
  this._v0696EventsBound = true;
  const root = this.shadowRoot;
  const zoneFrom = (node) => Number(node?.dataset?.programZoneEdit || node?.closest?.("[data-program-zone-edit]")?.dataset?.programZoneEdit || 0);

  root.addEventListener("input", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit]");
    if (!control) return;
    const zone = zoneFrom(control);
    const state = this._programDrafts?.[zone];
    if (!state) return;
    if (control.matches("[data-program-start]")) markIntent(state, "start_times");
    else if (control.dataset.programField) markIntent(state, control.dataset.programField);
  }, true);

  root.addEventListener("change", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit]");
    if (!control) return;
    const zone = zoneFrom(control);
    const state = this._programDrafts?.[zone];
    if (!state) return;
    if (control.matches("[data-program-start]")) markIntent(state, "start_times");
    else if (control.dataset.programField) markIntent(state, control.dataset.programField);
  }, true);

  root.addEventListener("click", (event) => {
    const enabled = event.target?.closest?.("[data-program-enabled-toggle]");
    if (enabled) {
      const zone = Number(enabled.dataset.programEnabledToggle);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "program_enabled");
      return;
    }
    const clear = event.target?.closest?.("[data-program-start-clear]");
    if (clear) {
      const zone = Number(String(clear.dataset.programStartClear || "").split(":")[0]);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "start_times");
      return;
    }
    const weekday = event.target?.closest?.("[data-program-weekday]");
    if (weekday) {
      const zone = zoneFrom(weekday);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "repeat");
    }
  }, true);
};

// On any failed dispatch, discard the stale draft after factual refresh. The
// controller read-back becomes the new baseline; only a new user gesture can
// create another patch. This never retries a write.
const previousApply = p.applyProgramDraft;
p.applyProgramDraft = async function applyProgramDraftV0696(zone) {
  try {
    return await previousApply.call(this, zone);
  } finally {
    const state = this._programDrafts?.[zone];
    if (state && this._programApplyFeedback?.zone === zone && this._programApplyFeedback?.kind === "error") {
      delete this._programDrafts[zone];
      this._programForceRender = true;
      try { this.render(); } finally { this._programForceRender = false; }
    }
  }
};

p._render = function renderV0696() {
  previousRender.call(this);
  this._ensureV0696Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
