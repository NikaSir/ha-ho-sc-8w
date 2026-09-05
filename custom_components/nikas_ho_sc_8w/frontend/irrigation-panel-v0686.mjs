import "./irrigation-panel-v0685.mjs";

const UI_VERSION = "0.6.86";
const APPLY_SERVICE = "apply_zone_schedule";
const WEEKDAYS = Object.freeze([
  ["sun", "Вс"], ["mon", "Пн"], ["tue", "Вт"], ["wed", "Ср"],
  ["thu", "Чт"], ["fri", "Пт"], ["sat", "Сб"],
]);
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0685 panel is not registered");
const p = Panel.prototype;
const previousStatusView = p.statusView;
const previousManualView = p.manualView;
const previousDiagnosticsView = p.diagnosticsView;
const previousZoneDetail = p.zoneDetail;
const previousCommandBusy = p.commandBusy;
const previousStructureKey = p._structureKey;
const previousRender = p._render;
const previousStyles = p.styles;

const clone = (value) => JSON.parse(JSON.stringify(value));
const arraysEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const validTime = (value) => !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value));
const todayIso = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
const pluralZones = (count) => {
  const n = Math.abs(Number(count));
  if (n % 10 === 1 && n % 100 !== 11) return "зона";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "зоны";
  return "зон";
};

p.commandBusy = function commandBusyV0686() {
  return previousCommandBusy.call(this) || Boolean(this._programApplyBusy);
};

p._programEditorBase = function programEditorBaseV0686(entities, zone) {
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const slots = Array.isArray(attrs.start_slots)
    ? attrs.start_slots
    : Array.isArray(attrs.start_times) ? attrs.start_times : [];
  const starts = Array.from({ length: 6 }, (_, index) => {
    const value = slots[index];
    return value == null ? "" : String(value);
  });
  const mode = String(attrs.calendar_mode || attrs.cycle_mode || "unknown").toLowerCase();
  const weekdays = Array.isArray(attrs.weekdays) ? attrs.weekdays.map((item) => String(item).toLowerCase()) : [];
  const rain = attrs.rain_sensor_follow === true ? true : attrs.rain_sensor_follow === false ? false : null;
  return {
    raw: String(attrs.raw_hex || ""),
    duration_minutes: Number(attrs.duration_minutes ?? attrs.duration_min ?? 0),
    start_times: starts,
    cycle_mode: mode,
    weekdays,
    interval_days: Number(attrs.interval_days ?? attrs.cycle_value ?? 1),
    anchor_date: String(attrs.anchor_date || attrs.interval_start || ""),
    rain_sensor_follow: rain,
  };
};

p._programEditorState = function programEditorStateV0686(entities, zone) {
  this._programDrafts ||= {};
  const base = this._programEditorBase(entities, zone);
  let state = this._programDrafts[zone];
  if (!state) {
    state = { base, values: clone(base) };
    this._programDrafts[zone] = state;
  } else {
    const oldPatch = this._programEditorPatch(state);
    if (!Object.keys(oldPatch).length && state.base.raw !== base.raw) {
      state.values = clone(base);
    }
    state.base = base;
  }
  return state;
};

p._programEditorPatch = function programEditorPatchV0686(state) {
  if (!state) return {};
  const base = state.base || {};
  const draft = state.values || {};
  const patch = {};
  if (Number(draft.duration_minutes) !== Number(base.duration_minutes)) {
    patch.duration_minutes = Number(draft.duration_minutes);
  }
  if (!arraysEqual(draft.start_times || [], base.start_times || [])) {
    patch.start_times = (draft.start_times || []).filter(Boolean);
  }
  const draftMode = String(draft.cycle_mode || "");
  const baseMode = String(base.cycle_mode || "");
  if (draftMode === "weekly") {
    if (draftMode !== baseMode || !arraysEqual(draft.weekdays || [], base.weekdays || [])) {
      patch.cycle_mode = "weekly";
      patch.weekdays = [...(draft.weekdays || [])];
    }
  } else if (draftMode === "interval") {
    if (draftMode !== baseMode || Number(draft.interval_days) !== Number(base.interval_days)) {
      patch.cycle_mode = "interval";
      patch.interval_days = Number(draft.interval_days);
    }
  }
  if (String(draft.anchor_date || "") !== String(base.anchor_date || "")) {
    patch.anchor_date = String(draft.anchor_date || "");
  }
  if (draft.rain_sensor_follow !== base.rain_sensor_follow && typeof draft.rain_sensor_follow === "boolean") {
    patch.rain_sensor_follow = draft.rain_sensor_follow;
  }
  return patch;
};

p._programEditorValidation = function programEditorValidationV0686(state) {
  const draft = state?.values || {};
  const duration = Number(draft.duration_minutes);
  if (!Number.isInteger(duration) || duration < 0 || duration > 255) return "Длительность: 0–255 минут";
  const starts = draft.start_times || [];
  if (starts.some((value) => !validTime(value))) return "Проверьте время запуска";
  const compact = starts.filter(Boolean);
  if (new Set(compact).size !== compact.length) return "Времена запуска не должны повторяться";
  if (draft.cycle_mode === "weekly" && !(draft.weekdays || []).length) return "Выберите хотя бы один день недели";
  if (draft.cycle_mode === "interval") {
    const interval = Number(draft.interval_days);
    if (!Number.isInteger(interval) || interval < 1 || interval > 255) return "Интервал: 1–255 дней";
  }
  const patch = this._programEditorPatch(state);
  if (Object.prototype.hasOwnProperty.call(patch, "anchor_date")) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(patch.anchor_date || ""))) return "Укажите опорную дату";
    if (String(patch.anchor_date) < todayIso()) return "Новую опорную дату можно установить только на сегодня или позже";
  }
  return "";
};

p._programEditorChanged = function programEditorChangedV0686(state, field) {
  const patch = this._programEditorPatch(state);
  if (field === "start_times") return Object.prototype.hasOwnProperty.call(patch, "start_times");
  if (field === "repeat") return Object.prototype.hasOwnProperty.call(patch, "cycle_mode") || Object.prototype.hasOwnProperty.call(patch, "weekdays") || Object.prototype.hasOwnProperty.call(patch, "interval_days");
  return Object.prototype.hasOwnProperty.call(patch, field);
};

p._programEditorPermission = function programEditorPermissionV0686(entities) {
  const local = String(this.state(entities.connection)).toLowerCase() === "local";
  const auto = String(this.state(entities.operation)).toLowerCase() === "auto";
  const active = this.zoneSet(this.state(entities.active)).size > 0;
  const queued = this.zoneSet(this.state(entities.queued)).size > 0;
  const service = this.commandAvailable(APPLY_SERVICE);
  if (!local) return { allowed: false, text: "Редактирование доступно только по локальной связи" };
  if (!auto) return { allowed: false, text: "Для записи программы нужен режим Auto/ON" };
  if (active || queued) return { allowed: false, text: "Перед применением остановите полив и очередь" };
  if (!service) return { allowed: false, text: "Сервис редактора программы ещё не загружен" };
  return { allowed: true, text: "Перед записью будет выполнен свежий preflight 1–8 и полный read-back" };
};

p._programEditorSummary = function programEditorSummaryV0686(patch) {
  const rows = [];
  if (Object.prototype.hasOwnProperty.call(patch, "duration_minutes")) rows.push(`Длительность: ${patch.duration_minutes} мин`);
  if (Object.prototype.hasOwnProperty.call(patch, "start_times")) rows.push(`Запуски: ${patch.start_times.length ? patch.start_times.join(" · ") : "все очищены"}`);
  if (patch.cycle_mode === "weekly") rows.push(`Повтор: ${patch.weekdays.map((day) => Object.fromEntries(WEEKDAYS)[day] || day).join(" · ")}`);
  if (patch.cycle_mode === "interval") rows.push(`Повтор: каждые ${patch.interval_days} дн.`);
  if (Object.prototype.hasOwnProperty.call(patch, "anchor_date")) rows.push(`Опорная дата: ${patch.anchor_date}`);
  if (Object.prototype.hasOwnProperty.call(patch, "rain_sensor_follow")) rows.push(`Датчик дождя: ${patch.rain_sensor_follow ? "учитывать" : "не учитывать"}`);
  return rows;
};

p.applyProgramDraft = async function applyProgramDraftV0686(zone) {
  const entities = this.entities();
  const state = this._programEditorState(entities, zone);
  const patch = this._programEditorPatch(state);
  if (!Object.keys(patch).length) return;
  const validation = this._programEditorValidation(state);
  if (validation) {
    this.notify(validation);
    return;
  }
  const permission = this._programEditorPermission(entities);
  if (!permission.allowed) {
    this.notify(permission.text);
    return;
  }
  const summary = this._programEditorSummary(patch);
  const message = [
    `Применить изменения программы зоны ${zone}?`, "", ...summary, "",
    "Контроллер будет перечитан полностью перед записью.",
    "Будет отправлена одна запись только выбранной зоны.",
    "После записи будут снова считаны зоны 1–8 и проверены соседние зоны.",
    "Автоматического повтора и отката нет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._programApplyBusy = true;
  this._programApplyZone = zone;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", APPLY_SERVICE, {
      ...this.serviceTargetData(), zone, schedule: patch,
    });
    delete this._programDrafts?.[zone];
    await this.refreshNow();
    this._programApplyFeedback = { zone, kind: "success", until: Date.now() + 1800 };
    this.notify(`Программа зоны ${zone} записана и подтверждена полным read-back 1–8`);
  } catch (error) {
    this._programApplyFeedback = { zone, kind: "error", until: Date.now() + 2600 };
    this.notify(this.serviceError(error, `Не удалось подтвердить программу зоны ${zone}`));
  } finally {
    this._programApplyBusy = false;
    this._programApplyZone = null;
    this.render();
  }
};

p._programEditorCard = function programEditorCardV0686(entities, zone) {
  const runtime = this.zoneRuntime(entities, zone);
  const state = this._programEditorState(entities, zone);
  const draft = state.values;
  const patch = this._programEditorPatch(state);
  const changes = Object.keys(patch).length;
  const validation = this._programEditorValidation(state);
  const permission = this._programEditorPermission(entities);
  const busy = this._programApplyBusy && Number(this._programApplyZone) === zone;
  const feedback = this._programApplyFeedback?.zone === zone && Date.now() < Number(this._programApplyFeedback?.until || 0)
    ? this._programApplyFeedback.kind : "";
  const applyAllowed = changes > 0 && !validation && permission.allowed && !this.commandBusy();
  const editableMode = ["weekly", "interval"].includes(String(draft.cycle_mode));
  const seasonal = this.state(entities.seasonal);
  const startsCount = (draft.start_times || []).filter(Boolean).length;
  const weekdays = new Set(draft.weekdays || []);
  const fieldClass = (name) => this._programEditorChanged(state, name) ? "changed" : "";
  const starts = (draft.start_times || []).map((value, index) => `<label class="programEditStart ${fieldClass("start_times")}"><small>Запуск ${index + 1}</small><input type="time" step="60" value="${this.esc(value)}" data-program-start="${index}" data-program-zone-edit="${zone}"></label>`).join("");
  const dayButtons = WEEKDAYS.map(([id, label]) => `<button type="button" class="${weekdays.has(id) ? "active" : ""}" data-program-weekday="${id}" data-program-zone-edit="${zone}" aria-pressed="${weekdays.has(id)}">${label}</button>`).join("");
  const repeatControl = draft.cycle_mode === "weekly"
    ? `<div class="programWeekdays ${fieldClass("repeat")}" aria-label="Дни недели">${dayButtons}</div>`
    : draft.cycle_mode === "interval"
      ? `<label class="programInterval ${fieldClass("repeat")}"><small>Интервал, дней</small><input type="number" min="1" max="255" step="1" value="${this.esc(draft.interval_days)}" data-program-field="interval_days" data-program-zone-edit="${zone}"></label>`
      : `<div class="programReadOnlyMode">Режим ${this.esc(draft.cycle_mode)} пока доступен только для просмотра</div>`;
  const feedbackText = feedback === "success" ? "Запись подтверждена" : feedback === "error" ? "Запись не подтверждена" : "";
  return `<section class="detailCard zoneProgramDetail programEditor ${feedback ? `feedback-${feedback}` : ""}">
    <div class="zoneProgramHero">
      <span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>
      <div class="zoneProgramIdentity"><small>ЗОНА ${zone}</small><h2>Зона ${zone}</h2><span class="zoneProgramStatus ready"><ha-icon icon="mdi:pencil-outline"></ha-icon>Редактор</span><span class="zoneProgramCount">${startsCount} из 6</span></div>
    </div>
    <div class="programEditorGrid">
      <label class="programEditField ${fieldClass("duration_minutes")}"><small>Базовая длительность</small><span><input type="number" min="0" max="255" step="1" value="${this.esc(draft.duration_minutes)}" data-program-field="duration_minutes" data-program-zone-edit="${zone}"><b>мин</b></span><em>До сезонной коррекции</em></label>
      <div class="programEditField readOnly"><small>Сезонная коррекция</small><strong>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</strong><em>Общая, меняется в «Настройках»</em></div>
      <label class="programEditField ${fieldClass("repeat")}"><small>Режим повтора</small><select data-program-field="cycle_mode" data-program-zone-edit="${zone}" ${editableMode ? "" : "disabled"}><option value="weekly" ${draft.cycle_mode === "weekly" ? "selected" : ""}>По дням недели</option><option value="interval" ${draft.cycle_mode === "interval" ? "selected" : ""}>Интервал</option>${!editableMode ? `<option selected value="${this.esc(draft.cycle_mode)}">${this.esc(draft.cycle_mode)}</option>` : ""}</select><em>${editableMode ? "Подтверждённые режимы" : "Изменение режима пока заблокировано"}</em></label>
      <label class="programEditField ${fieldClass("anchor_date")}"><small>Опорная дата</small><input type="date" min="${todayIso()}" value="${this.esc(draft.anchor_date)}" data-program-field="anchor_date" data-program-zone-edit="${zone}"><em>Новую дату можно ставить сегодня или позже</em></label>
      <label class="programEditField ${fieldClass("rain_sensor_follow")}"><small>Датчик дождя</small><select data-program-field="rain_sensor_follow" data-program-zone-edit="${zone}"><option value="true" ${draft.rain_sensor_follow === true ? "selected" : ""}>Учитывать</option><option value="false" ${draft.rain_sensor_follow === false ? "selected" : ""}>Не учитывать</option></select><em>Правило только этой зоны</em></label>
      <div class="programEditField readOnly"><small>Состояние high nibble byte 19</small><strong>Не редактируется</strong><em>Семантика ещё исследуется</em></div>
    </div>
    <section class="programRepeatEditor"><div class="programEditorSectionHead"><span><small>ПОВТОР</small><b>${draft.cycle_mode === "weekly" ? "Дни недели" : draft.cycle_mode === "interval" ? "Интервал" : "Текущий режим"}</b></span>${this._programEditorChanged(state, "repeat") ? "<em>Изменено</em>" : ""}</div>${repeatControl}</section>
    <section class="programStartsEditor"><div class="programEditorSectionHead"><span><small>ВРЕМЯ ЗАПУСКА</small><b>Все шесть слотов</b></span><em>${startsCount} из 6</em></div><div class="programEditStarts">${starts}</div></section>
    <div class="programApplyBar ${changes ? "changed" : ""}"><span><small>${changes ? `Изменений: ${changes}` : "Изменений нет"}</small><em>${validation || permission.text}</em>${feedbackText ? `<b>${feedbackText}</b>` : ""}</span><button type="button" data-program-apply="${zone}" ${applyAllowed ? "" : "disabled"}>${busy ? "Проверка 1–8…" : "Применить"}</button></div>
    <p class="programEditorNote"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span>Изменения накапливаются только в панели. Контроллер получает их после «Применить» и подтверждения. High nibble byte 19 не изменяется редактором.</span></p>
  </section>`;
};

p.programView = function programViewV0686(entities) {
  const zones = this._physicalZoneNumbers ? this._physicalZoneNumbers() : Array.from({ length: 8 }, (_, i) => i + 1);
  const selected = Number(this._programZone);
  const zone = zones.includes(selected) ? selected : zones[0];
  this._programZone = zone;
  const tabs = zones.map((number) => `<button type="button" class="${number === zone ? "active" : ""}" data-program-zone="${number}" aria-pressed="${number === zone}">${number}</button>`).join("");
  return `<nav class="programZoneTabs" style="--physical-zone-count:${zones.length}" aria-label="Выбор зоны">${tabs}</nav><div class="programSectionBody programZoneBody">${this._programEditorCard(entities, zone)}</div>`;
};

p.zoneDetail = function zoneDetailV0686(entities, zone) {
  if (!Number.isInteger(Number(zone)) || Number(zone) < 1 || Number(zone) > 8) return previousZoneDetail.call(this, entities, zone);
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button>${this._programEditorCard(entities, Number(zone))}`;
};

p._manualContext = function manualContextV0686(entities) {
  const active = [...this.zoneSet(this.state(entities.active))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const queued = [...this.zoneSet(this.state(entities.queued))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const selected = this.selectedManualZones();
  const total = selected.reduce((sum, zone) => sum + Number(this._manualDurations?.[zone] || 0), 0);
  return { active, queued, selected, total, watering: active.length > 0 || queued.length > 0 };
};

p.manualView = function manualViewV0686(entities) {
  const template = document.createElement("template");
  template.innerHTML = previousManualView.call(this, entities);
  const context = this._manualContext(entities);
  const intro = template.content.querySelector(".manualApprovedIntro,.pageIntro");
  let topAction = template.content.querySelector(".manualStartTop") || template.content.querySelector("[data-manual-start]") || template.content.querySelector("[data-manual-stop]");
  if (!topAction && intro) {
    topAction = document.createElement("button");
    intro.append(topAction);
  }
  if (topAction) {
    topAction.setAttribute("type", "button");
    topAction.className = `manualStartTop manualStartWide manualContextTop ${context.watering ? "stop" : "start"}`;
    topAction.removeAttribute("data-manual-start");
    topAction.removeAttribute("data-manual-stop");
    if (context.watering) {
      topAction.setAttribute("data-manual-stop", "");
      topAction.disabled = !this.commandAvailable("stop_manual") || this.commandBusy();
      const current = context.active.length ? `Зона ${context.active.join(", ")}` : "Очередь активна";
      topAction.innerHTML = `<span><b>Стоп всё</b><small>${this.esc(current)}</small></span>`;
    } else {
      topAction.setAttribute("data-manual-start", "");
      topAction.disabled = !context.selected.length || !this.commandAvailable("start_manual_queue") || this.commandBusy();
      const detail = context.selected.length ? `${context.selected.length} ${pluralZones(context.selected.length)} · ${context.total} мин` : "Сначала выберите зоны";
      topAction.innerHTML = `<span><b>Старт полива</b><small>${this.esc(detail)}</small></span>`;
    }
  }
  template.content.querySelectorAll("[data-manual-stop]").forEach((node) => {
    if (node !== topAction) node.remove();
  });
  template.content.querySelectorAll("[data-manual-start]").forEach((node) => {
    if (node !== topAction) node.remove();
  });
  return template.innerHTML;
};

p._systemManualAction = function systemManualActionV0686(entities) {
  const context = this._manualContext(entities);
  if (context.watering) {
    const active = context.active[0];
    const remainingRaw = active ? Number(this.state(entities.zones[active]?.remaining)) : 0;
    const detail = active ? `Сейчас зона ${active}${remainingRaw > 0 ? ` · осталось ${Math.round(remainingRaw)} мин` : ""}` : "Активная очередь";
    return `<button type="button" class="systemManualAction stop" data-system-manual-action="stop"><span class="systemManualActionIcon"><ha-icon icon="mdi:stop"></ha-icon></span><span><b>Стоп всё</b><small>${this.esc(detail)}</small></span></button>`;
  }
  if (!context.selected.length) {
    return `<button type="button" class="systemManualAction start" data-system-manual-action="open"><span class="systemManualActionIcon"><ha-icon icon="mdi:play"></ha-icon></span><span><b>Старт ручного полива</b><small>Выберите зоны на вкладке «Ручной»</small></span></button>`;
  }
  const title = context.selected.length === 1 ? `Старт · Зона ${context.selected[0]}` : `Старт · ${context.selected.length} ${pluralZones(context.selected.length)}`;
  const detail = context.selected.length === 1 ? `${context.total} мин` : `Зоны ${context.selected.join(" → ")} · ${context.total} мин`;
  return `<button type="button" class="systemManualAction start ready" data-system-manual-action="start"><span class="systemManualActionIcon"><ha-icon icon="mdi:play"></ha-icon></span><span><b>${this.esc(title)}</b><small>${this.esc(detail)}</small></span></button>`;
};

p.statusView = function statusViewV0686(entities) {
  const content = previousStatusView.call(this, entities);
  if (this._systemSettingsOpen) return content;
  const template = document.createElement("template");
  template.innerHTML = content;
  const settings = template.content.querySelector(".systemSettingsButton");
  if (settings) settings.insertAdjacentHTML("beforebegin", this._systemManualAction(entities));
  else template.content.firstElementChild?.insertAdjacentHTML("beforeend", this._systemManualAction(entities));
  return template.innerHTML;
};

p.diagnosticsView = function diagnosticsViewV0686(entities) {
  const template = document.createElement("template");
  template.innerHTML = previousDiagnosticsView.call(this, entities);
  template.content.querySelectorAll(".lab").forEach((node) => {
    if (node.classList.contains("rainSensorProbeLab")) return;
    if (node.classList.contains("dp38SnapshotLab")) return;
    node.remove();
  });
  return template.innerHTML;
};

p._structureKey = function structureKeyV0686() {
  if (this._view === "program") return `program:editor:${Number(this._programZone) || 1}`;
  return previousStructureKey.call(this);
};

p._ensureV0686Events = function ensureV0686Events() {
  if (this._v0686EventsBound) return;
  this._v0686EventsBound = true;
  this.shadowRoot.addEventListener("change", (event) => {
    const target = event.target;
    const zone = Number(target?.dataset?.programZoneEdit);
    if (!Number.isInteger(zone) || !this._programDrafts?.[zone]) return;
    const state = this._programDrafts[zone];
    if (target.matches?.("[data-program-start]")) {
      state.values.start_times[Number(target.dataset.programStart)] = target.value;
      this.render();
      return;
    }
    const field = target.dataset.programField;
    if (!field) return;
    if (field === "duration_minutes" || field === "interval_days") state.values[field] = Number(target.value);
    else if (field === "rain_sensor_follow") state.values[field] = target.value === "true";
    else state.values[field] = target.value;
    this.render();
  }, true);
  this.shadowRoot.addEventListener("click", (event) => {
    const weekday = event.target.closest?.("[data-program-weekday]");
    if (weekday) {
      const zone = Number(weekday.dataset.programZoneEdit);
      const state = this._programDrafts?.[zone];
      if (!state) return;
      const day = weekday.dataset.programWeekday;
      const selected = new Set(state.values.weekdays || []);
      if (selected.has(day)) selected.delete(day); else selected.add(day);
      state.values.weekdays = WEEKDAYS.map(([id]) => id).filter((id) => selected.has(id));
      this.render();
      return;
    }
    const apply = event.target.closest?.("[data-program-apply]");
    if (apply) {
      this.applyProgramDraft(Number(apply.dataset.programApply));
      return;
    }
    const systemManual = event.target.closest?.("[data-system-manual-action]");
    if (!systemManual) return;
    const action = systemManual.dataset.systemManualAction;
    if (action === "stop") this.stopManual();
    else if (action === "start") this.startManualQueue();
    else this._switchView("manual");
  });
};

p._render = function renderV0686() {
  previousRender.call(this);
  this._ensureV0686Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0686() {
  return `${previousStyles.call(this)}
    /* UI v0.6.86 — production editor, context Start/Stop, cleaned laboratory. */
    .programEditor{gap:12px!important}.programEditorGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.programEditField{display:grid;align-content:start;gap:5px;min-height:108px;padding:11px;border:1px solid var(--line);border-radius:17px;background:var(--soft);transition:background .16s ease,border-color .16s ease,box-shadow .16s ease}.programEditField>small,.programEditStart>small{color:var(--muted);font-size:11px;font-weight:800}.programEditField>em{color:var(--muted);font-size:10.5px;font-style:normal;line-height:1.25}.programEditField>strong{font-size:17px}.programEditField>span{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px}.programEditField input,.programEditField select,.programEditStart input,.programInterval input{width:100%;min-width:0;height:42px;padding:0 9px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--text);font:inherit;font-size:16px;font-weight:800;outline:0}.programEditField select{appearance:none;-webkit-appearance:none}.programEditField.changed,.programEditStart.changed,.programInterval.changed,.programWeekdays.changed{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:color-mix(in srgb,var(--a) 8%,var(--card));box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 8%,transparent)}.programEditField.changed input,.programEditField.changed select,.programEditStart.changed input,.programInterval.changed input{border-color:color-mix(in srgb,var(--a) 45%,var(--line))}.programEditField.readOnly{background:color-mix(in srgb,var(--card) 94%,var(--muted) 6%)}
    .programRepeatEditor,.programStartsEditor{display:grid;gap:8px;padding:12px;border:1px solid var(--line);border-radius:18px;background:var(--card)}.programEditorSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}.programEditorSectionHead span{display:grid;gap:2px}.programEditorSectionHead small{color:var(--muted);font-size:10px;font-weight:850;letter-spacing:.1em}.programEditorSectionHead b{font-size:19px}.programEditorSectionHead>em{padding:4px 8px;border-radius:99px;background:var(--accent-soft);color:var(--a);font-size:10px;font-style:normal;font-weight:800}.programWeekdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;padding:6px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.programWeekdays button{min-width:0;height:40px;padding:0;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--muted);font-weight:850}.programWeekdays button.active{border-color:color-mix(in srgb,var(--a) 40%,var(--line));background:var(--card);color:var(--a)}.programInterval{display:grid;grid-template-columns:minmax(0,1fr) 120px;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.programInterval small{color:var(--muted);font-weight:800}.programReadOnlyMode{padding:10px;border-radius:13px;background:var(--soft);color:var(--muted);font-size:12px}.programEditStarts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.programEditStart{display:grid;gap:5px;padding:9px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
    .programApplyBar{display:grid;grid-template-columns:minmax(0,1fr) 136px;align-items:center;gap:10px;padding:10px 11px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.programApplyBar>span{display:grid;gap:2px;min-width:0}.programApplyBar small{font-size:12px;font-weight:850}.programApplyBar em{color:var(--muted);font-size:10.5px;font-style:normal;line-height:1.25}.programApplyBar b{color:var(--green);font-size:11px}.programApplyBar.changed{border-color:color-mix(in srgb,var(--a) 35%,var(--line));background:color-mix(in srgb,var(--a) 6%,var(--card))}.programApplyBar button{height:46px;border:0;border-radius:13px;background:var(--a);color:#fff;font-weight:850}.programApplyBar button:disabled{background:var(--surface);color:var(--muted);opacity:.65}.programEditorNote{display:grid!important;grid-template-columns:28px minmax(0,1fr);align-items:start;gap:7px;margin:0!important;padding:9px 10px;border-radius:14px;background:var(--soft);color:var(--muted)!important;font-size:10.5px!important;line-height:1.35}.programEditorNote ha-icon{color:var(--a);--mdc-icon-size:22px}.programEditor.feedback-success{border-color:color-mix(in srgb,var(--green) 45%,var(--line))}.programEditor.feedback-error{border-color:color-mix(in srgb,var(--danger) 45%,var(--line))}
    .manualContextTop{width:100%!important;min-width:0!important;min-height:64px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:9px 16px!important;border-radius:18px!important}.manualContextTop>span{display:grid;gap:2px;text-align:center}.manualContextTop b{font-size:18px}.manualContextTop small{font-size:11px;opacity:.85}.manualContextTop.stop{border-color:color-mix(in srgb,var(--danger) 55%,transparent)!important;background:var(--danger)!important;color:#fff!important}.manualContextTop.start{background:linear-gradient(135deg,color-mix(in srgb,var(--a) 64%,white),var(--a))!important;color:#fff!important}.manualContextTop:disabled{opacity:.48!important}
    .systemCompactScreen{display:flex!important;flex-direction:column!important;gap:10px!important;height:100%!important;min-height:0!important}.systemSettingsButton{margin-top:auto!important}.systemManualAction{display:grid;grid-template-columns:54px minmax(0,1fr);align-items:center;gap:13px;width:100%;min-height:76px;padding:10px 14px;border:1px solid color-mix(in srgb,var(--a) 35%,var(--line));border-radius:20px;background:linear-gradient(135deg,color-mix(in srgb,var(--a) 68%,white),var(--a));color:#fff;text-align:left;box-shadow:0 8px 20px color-mix(in srgb,var(--a) 18%,transparent)}.systemManualAction.stop{border-color:color-mix(in srgb,var(--danger) 55%,var(--line));background:linear-gradient(135deg,color-mix(in srgb,var(--danger) 78%,white),var(--danger));box-shadow:0 8px 20px color-mix(in srgb,var(--danger) 16%,transparent)}.systemManualActionIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#fff;color:var(--a)}.systemManualAction.stop .systemManualActionIcon{color:var(--danger)}.systemManualActionIcon ha-icon{--mdc-icon-size:29px}.systemManualAction>span:last-child{display:grid;gap:3px;min-width:0}.systemManualAction b{font-size:18px;line-height:1.05}.systemManualAction small{font-size:11px;line-height:1.2;opacity:.9}
    @media(max-width:520px){.programEditorGrid{gap:7px}.programEditField{min-height:102px;padding:10px}.programEditStarts{gap:6px}.programWeekdays{gap:3px;padding:5px}.programWeekdays button{height:38px;font-size:12px}.programApplyBar{grid-template-columns:minmax(0,1fr) 118px}.programApplyBar button{height:44px}.systemManualAction{min-height:70px;border-radius:18px}.systemManualAction b{font-size:17px}}
  `;
};
