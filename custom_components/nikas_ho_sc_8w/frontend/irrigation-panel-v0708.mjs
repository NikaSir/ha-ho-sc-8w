import "./irrigation-panel-v0706.mjs";

const UI_VERSION = "0.7.08";
const MODE_LABEL = Object.freeze({
  weekly: "По дням недели", interval: "Интервал", odd: "Нечётные дни", even: "Чётные дни",
});
const WEEKDAY_LABEL = Object.freeze({ sun: "Вс", mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб" });
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0706 panel is not registered");
const p = Panel.prototype;
const previousEditorBase = p._programEditorBase;
const previousEditorState = p._programEditorState;
const previousEditorPermission = p._programEditorPermission;
const previousEditorCard = p._programEditorCard;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;

const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const isParity = (mode) => mode === "odd" || mode === "even";
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T12:00:00`);
  return year >= 2000 && year <= 2255 && date.getFullYear() === year
    && date.getMonth() + 1 === month && date.getDate() === day;
};
const intentOf = (state) => {
  if (!(state.intent instanceof Set)) state.intent = new Set();
  return state.intent;
};

p._programEditorBase = function programEditorBaseV0707(entities, zone) {
  const base = previousEditorBase.call(this, entities, zone);
  // Weekly and parity calendars have no anchor date. Do not turn the parser's
  // legacy date fallback into either a displayed fact or a new editor value.
  if (base.cycle_mode !== "interval") base.anchor_date = "";
  else if (!validDate(base.anchor_date)) base.anchor_date = "";
  return base;
};

p._programEditorState = function programEditorStateV0707(entities, zone) {
  const state = previousEditorState.call(this, entities, zone);
  // v0696 refreshes untouched fields from the current source. When that source
  // is still an interval, its date must not leak into a parity/weekly draft.
  if (state.values.cycle_mode !== "interval") state.values.anchor_date = "";
  return state;
};

p._programEditorPermission = function programEditorPermissionV0707(entities) {
  if (Object.values(entities.zones || {}).some((zone) => this.attrs(zone?.schedule).dp38_schedule_write_locked === true)) {
    return { allowed: false, text: "Запись расписаний остановлена после неподтверждённого результата" };
  }
  return previousEditorPermission.call(this, entities);
};

p._programEditorSelectMode = function programEditorSelectModeV0707(state, mode) {
  if (!state || !own(MODE_LABEL, mode) || mode === state.values.cycle_mode) return false;
  const intent = intentOf(state);
  intent.add("repeat");
  state.values.cycle_mode = mode;
  if (mode === "interval") {
    // An interval requires a deliberate choice of both the period and its
    // starting date. Viewing or selecting a mode never invents today's date.
    state.values.interval_days = "";
    state.values.anchor_date = "";
    intent.add("anchor_date");
  } else {
    state.values.anchor_date = "";
    intent.delete("anchor_date");
    if (mode === "weekly") state.values.weekdays = [];
  }
  return true;
};

p._programEditorPatch = function programEditorPatchV0707(state) {
  if (!state) return {};
  const base = state.base || {};
  const draft = state.values || {};
  const intent = intentOf(state);
  const patch = {};
  if (intent.has("duration_minutes") && Number(draft.duration_minutes) !== Number(base.duration_minutes)) {
    patch.duration_minutes = Number(draft.duration_minutes);
  }
  if (intent.has("start_times") && !same(draft.start_times || [], base.start_times || [])) {
    // DP38 stores six positional slots. Clearing slot 2 must never move slot 3.
    patch.start_times = Array.from({ length: 6 }, (_, i) => String(draft.start_times?.[i] ?? "").trim() || null);
  }
  const mode = String(draft.cycle_mode || "");
  if (intent.has("repeat")) {
    const changedMode = mode !== base.cycle_mode;
    if (mode === "weekly" && (changedMode || !same(draft.weekdays || [], base.weekdays || []))) {
      patch.cycle_mode = mode;
      patch.weekdays = [...(draft.weekdays || [])];
    } else if (mode === "interval" && (changedMode || Number(draft.interval_days) !== Number(base.interval_days))) {
      patch.cycle_mode = mode;
      patch.interval_days = Number(draft.interval_days);
    } else if (isParity(mode) && changedMode) {
      // Backend supplies the verified parity encoding (bytes 15–18 = zero).
      // Never forward hidden interval/date/weekdays from an earlier draft.
      patch.cycle_mode = mode;
    }
  }
  if (mode === "interval" && intent.has("anchor_date")
      && (mode !== base.cycle_mode || String(draft.anchor_date || "") !== String(base.anchor_date || ""))) {
    patch.anchor_date = String(draft.anchor_date || "");
  }
  for (const key of ["rain_sensor_follow", "program_enabled"]) {
    if (intent.has(key) && typeof draft[key] === "boolean" && draft[key] !== base[key]) patch[key] = draft[key];
  }
  return patch;
};

p._programEditorValidation = function programEditorValidationV0707(state) {
  const draft = state?.values || {};
  const mode = draft.cycle_mode;
  if (!own(MODE_LABEL, mode)) return "Выберите режим повтора";
  const duration = Number(draft.duration_minutes);
  if (!Number.isInteger(duration) || duration < 0 || duration > 255) return "Длительность: 0–255 минут";
  if (isParity(mode) && duration < 1) return "Для нечётных и чётных дней длительность должна быть не меньше 1 минуты";
  if (draft.program_enabled === true && duration < 1) return "Для включённой программы длительность должна быть не меньше 1 минуты";
  const starts = draft.start_times || [];
  if (!Array.isArray(starts) || starts.length !== 6 || starts.some((value) => value && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value)))) {
    return "Проверьте все шесть времён запуска";
  }
  const activeStarts = starts.filter(Boolean);
  if (new Set(activeStarts).size !== activeStarts.length) return "Времена запуска не должны повторяться";
  if (draft.program_enabled === true && !activeStarts.length) return "Для включённой программы нужен хотя бы один запуск";
  if (mode === "weekly" && (!Array.isArray(draft.weekdays) || !draft.weekdays.length
      || draft.weekdays.some((day) => !own(WEEKDAY_LABEL, day)))) return "Выберите хотя бы один день недели";
  if (mode === "interval") {
    const interval = Number(draft.interval_days);
    if (!Number.isInteger(interval) || interval < 1 || interval > 255) return "Интервал: 1–255 дней";
    if (!validDate(draft.anchor_date)) return "Укажите опорную дату интервала";
    const patch = this._programEditorPatch(state);
    // A historical date read from the controller remains a fact. Only a newly
    // chosen date is constrained to today or the future; no implicit rollback.
    if ((own(patch, "anchor_date") || state.base?.cycle_mode !== "interval") && draft.anchor_date < todayIso()) {
      return "Новую опорную дату можно установить только на сегодня или позже";
    }
    if (state.base?.cycle_mode !== "interval" && (!own(patch, "anchor_date") || !own(patch, "interval_days"))) {
      return "Для перехода на интервал укажите период и опорную дату";
    }
  }
  return "";
};

p._programEditorSummary = function programEditorSummaryV0707(patch) {
  const rows = [];
  if (own(patch, "duration_minutes")) rows.push(`Длительность: ${patch.duration_minutes} мин`);
  if (own(patch, "start_times")) rows.push(`Запуски: ${Array.from({ length: 6 }, (_, i) => patch.start_times[i] || "--:--").join(" · ")}`);
  if (own(MODE_LABEL, patch.cycle_mode)) {
    rows.push(patch.cycle_mode === "interval" ? `Повтор: каждые ${patch.interval_days} дн.` : `Повтор: ${MODE_LABEL[patch.cycle_mode]}`);
    if (patch.cycle_mode === "weekly") rows.push(`Дни: ${(patch.weekdays || []).map((day) => WEEKDAY_LABEL[day] || day).join(" · ")}`);
  }
  if (own(patch, "anchor_date")) rows.push(`Опорная дата: ${patch.anchor_date}`);
  if (own(patch, "rain_sensor_follow")) rows.push(`Датчик дождя: ${patch.rain_sensor_follow ? "учитывать" : "не учитывать"}`);
  if (own(patch, "program_enabled")) rows.push(`Программа зоны: ${patch.program_enabled ? "включить" : "выключить"}`);
  return rows;
};

p._programEditorCard = function programEditorCardV0707(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousEditorCard.call(this, entities, zone);
  const draft = this._programEditorState(entities, zone).values;
  const mode = draft.cycle_mode;
  const select = template.content.querySelector('[data-program-field="cycle_mode"]');
  if (select) {
    select.disabled = false;
    select.innerHTML = `${!own(MODE_LABEL, mode) ? '<option value="unknown" disabled selected>Выберите режим</option>' : ""}${Object.entries(MODE_LABEL).map(([value, label]) => `<option value="${value}" ${mode === value ? "selected" : ""}>${label}</option>`).join("")}`;
    const note = select.closest(".programEditField")?.querySelector("em");
    if (note) note.textContent = "Изменение после «Применить» и подтверждения";
  }
  const date = template.content.querySelector('[data-program-field="anchor_date"]');
  if (mode !== "interval") date?.closest(".programEditField")?.remove();
  const duration = template.content.querySelector('[data-program-field="duration_minutes"]');
  if (duration && isParity(mode)) {
    duration.min = "1";
    const note = duration.closest(".programEditField")?.querySelector("em");
    if (note) note.textContent = "Для этого режима: минимум 1 мин";
  }
  if (isParity(mode)) {
    const repeat = template.content.querySelector(".programRepeatEditor");
    const heading = repeat?.querySelector(".programEditorSectionHead b");
    if (heading) heading.textContent = MODE_LABEL[mode];
    const detail = repeat?.querySelector(".programReadOnlyMode");
    if (detail) detail.textContent = `${MODE_LABEL[mode]} месяца. Опорная дата для этого режима не используется.`;
  }
  return template.innerHTML;
};

p._programReadOnlyCardV0690 = function programReadOnlyCardV0707(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const base = this._programEditorBase(entities, zone);
  // Match semantic labels, not a grid index: removing a non-applicable date
  // must not accidentally replace the program flag or the rain rule.
  for (const article of template.content.querySelectorAll(".programReadGrid > article")) {
    const label = article.querySelector("small")?.textContent?.trim();
    if (label === "Опорная дата" && base.cycle_mode !== "interval") article.remove();
    if (label === "Режим повтора" && own(MODE_LABEL, base.cycle_mode)) {
      const title = article.querySelector("b");
      if (title) title.textContent = MODE_LABEL[base.cycle_mode];
      if (isParity(base.cycle_mode)) {
        const detail = article.querySelector("em");
        if (detail) detail.textContent = "По числам месяца";
      }
    }
  }
  return template.innerHTML;
};

p._ensureV0707Events = function ensureV0707Events() {
  if (this._v0707EventsBound || !this.shadowRoot) return;
  this._v0707EventsBound = true;
  const handle = (event) => {
    const target = event.target;
    const zone = Number(target?.dataset?.programZoneEdit);
    const state = this._programDrafts?.[zone];
    if (!state) return;
    const field = target.dataset.programField;
    const intent = intentOf(state);
    if (target.matches?.("[data-program-start]")) intent.add("start_times");
    else if (field) intent.add(["cycle_mode", "weekdays", "interval_days"].includes(field) ? "repeat" : field);
    if (field !== "cycle_mode" || event.type !== "change") return;
    // Run before legacy change listeners, which render immediately. Otherwise
    // the old state synchronizer can restore the source mode before intent is
    // marked and retain an inactive date from the previous calendar.
    event.preventDefault();
    event.stopImmediatePropagation();
    this._programEditorSelectMode(state, target.value);
    this._programFieldFeedback = null;
    this._programNativePickerOpen = false;
    this._programForceRender = true;
    try { this.render(); } finally { this._programForceRender = false; }
  };
  this.shadowRoot.addEventListener("input", handle, true);
  this.shadowRoot.addEventListener("change", handle, true);
  this.shadowRoot.addEventListener("click", (event) => {
    const clear = event.target?.closest?.("[data-program-start-clear]");
    const enabled = event.target?.closest?.("[data-program-enabled-toggle]");
    const weekday = event.target?.closest?.("[data-program-weekday]");
    const control = clear || enabled || weekday;
    if (!control || control.disabled) return;
    const zone = clear ? Number(String(clear.dataset.programStartClear).split(":")[0])
      : enabled ? Number(enabled.dataset.programEnabledToggle) : Number(weekday.dataset.programZoneEdit);
    const state = this._programDrafts?.[zone];
    if (state) intentOf(state).add(clear ? "start_times" : enabled ? "program_enabled" : "repeat");
  }, true);
};

p._render = function renderV0707() {
  this._ensureV0707Events();
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

// Permission is published by the backend owning the confirmed manual queue.
// The active release replaces v0707 in the chain; it does not import that file.
const previousCommandAvailable = p.commandAvailable;

p._manualSkipContext = function manualSkipContext(zone = null) {
  const entities = this.entities();
  const entity = this._hass?.states?.[entities.active];
  const attrs = entity?.attributes || {};
  const activeZone = attrs.manual_skip_zone;
  const sessionId = attrs.manual_session_id;
  const allowed = this._hass?.connection?.connected !== false
    && entity && !this.bad(entity.state)
    && String(this.state(entities.operation)).toLowerCase() === "manual"
    && attrs.manual_skip_allowed === true
    && Number.isInteger(activeZone) && activeZone >= 1 && activeZone <= 8
    && typeof sessionId === "string" && sessionId.length > 0
    && (zone === null || activeZone === Number(zone));
  return { allowed: Boolean(allowed), activeZone, sessionId };
};

p.commandAvailable = function commandAvailableV0708(service) {
  return previousCommandAvailable.call(this, service)
    && (service !== "skip_current_manual" || this._manualSkipContext().allowed);
};

p.stopCurrentManual = async function stopCurrentManualV0708(zone) {
  const intent = this._manualSkipContext(zone);
  if (!intent.allowed || !this.commandAvailable("skip_current_manual")) {
    this.notify("Пропуск зоны недоступен: текущая ручная очередь не подтверждена");
    return;
  }
  if (!window.confirm(`Остановить полив зоны ${zone} и перейти к следующей?\n\nОставшаяся очередь будет сохранена.`)) return;
  const current = this._manualSkipContext(zone);
  if (!current.allowed || current.sessionId !== intent.sessionId
      || !this.commandAvailable("skip_current_manual")) {
    this.notify("Состояние полива изменилось. Проверьте текущую зону и повторите действие");
    return;
  }
  this._manualBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "skip_current_manual", {
      ...this.serviceTargetData(), expected_zone: intent.activeZone,
      expected_session_id: intent.sessionId,
    });
    this._manualQueue = this.selectedManualZones().filter((item) => item > Number(zone));
    this.notify("Текущая зона остановлена, контроллер перешёл к следующей");
    await this.refreshNow();
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить переход к следующей зоне"));
  } finally {
    this._manualBusy = false;
    this.render();
  }
};
