import "./irrigation-panel-v0687.mjs";

const UI_VERSION = "0.6.88";
const APPLY_SERVICE = "apply_zone_schedule";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0687 panel is not registered");
const p = Panel.prototype;
const previousProgramEditorCard = p._programEditorCard;
const previousProgramEditorPatch = p._programEditorPatch;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

const logicalFields = (patch) => {
  const fields = new Set();
  if (Object.prototype.hasOwnProperty.call(patch || {}, "duration_minutes")) fields.add("duration_minutes");
  if (["cycle_mode", "weekdays", "interval_days"].some((key) => Object.prototype.hasOwnProperty.call(patch || {}, key))) fields.add("repeat");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "anchor_date")) fields.add("anchor_date");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "rain_sensor_follow")) fields.add("rain_sensor_follow");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "start_times")) fields.add("start_times");
  return fields;
};

p._programEditorPatch = function programEditorPatchV0688(state) {
  const patch = previousProgramEditorPatch.call(this, state);
  const base = state?.base?.start_times || [];
  const draft = state?.values?.start_times || [];
  if (JSON.stringify(base) !== JSON.stringify(draft)) {
    patch.start_times = Array.from({ length: 6 }, (_, index) => {
      const value = String(draft[index] ?? "").trim();
      return value || null;
    });
  }
  return patch;
};

p._programEditorSummary = function programEditorSummaryV0688(patch) {
  const rows = [];
  if (Object.prototype.hasOwnProperty.call(patch, "duration_minutes")) rows.push(`Длительность: ${patch.duration_minutes} мин`);
  if (Object.prototype.hasOwnProperty.call(patch, "start_times")) rows.push(`Запуски: ${Array.from({ length: 6 }, (_, index) => patch.start_times[index] || "--:--").join(" · ")}`);
  if (patch.cycle_mode === "weekly") rows.push("Повтор: по дням недели");
  if (patch.cycle_mode === "interval") rows.push(`Повтор: каждые ${patch.interval_days} дн.`);
  if (Object.prototype.hasOwnProperty.call(patch, "anchor_date")) rows.push(`Опорная дата: ${patch.anchor_date}`);
  if (Object.prototype.hasOwnProperty.call(patch, "rain_sensor_follow")) rows.push(`Датчик дождя: ${patch.rain_sensor_follow ? "учитывать" : "не учитывать"}`);
  return rows;
};

p.applyProgramDraft = async function applyProgramDraftV0688(zone) {
  const entities = this.entities();
  const state = this._programEditorState(entities, zone);
  const patch = this._programEditorPatch(state);
  if (!Object.keys(patch).length) return;
  const validation = this._programEditorValidation(state);
  if (validation) { this.notify(validation); return; }
  const permission = this._programEditorPermission(entities);
  if (!permission.allowed) { this.notify(permission.text); return; }
  const requestedFields = logicalFields(patch);
  const message = [
    `Применить изменения программы зоны ${zone}?`, "", ...this._programEditorSummary(patch), "",
    "Контроллер будет перечитан полностью перед записью.",
    "Будет отправлена одна запись только выбранной зоны.",
    "После записи будут снова считаны зоны 1–8 и проверены соседние зоны.",
    "Автоматического повтора и отката нет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._programApplyBusy = true;
  this._programApplyZone = zone;
  this._programFieldFeedback = null;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", APPLY_SERVICE, { ...this.serviceTargetData(), zone, schedule: patch });
    delete this._programDrafts?.[zone];
    await this.refreshNow();
    this._programApplyFeedback = { zone, kind: "success", until: Date.now() + 5000 };
    this._programFieldFeedback = { zone, confirmed: [...requestedFields], rejected: [], until: Date.now() + 5000 };
    this.notify(`Программа зоны ${zone} записана и подтверждена полным read-back 1–8`);
  } catch (error) {
    await this.refreshNow().catch(() => {});
    const refreshed = this._programEditorState(this.entities(), zone);
    const remainingFields = logicalFields(this._programEditorPatch(refreshed));
    this._programApplyFeedback = { zone, kind: "error", until: Date.now() + 6000 };
    this._programFieldFeedback = {
      zone,
      confirmed: [...requestedFields].filter((field) => !remainingFields.has(field)),
      rejected: [...requestedFields].filter((field) => remainingFields.has(field)),
      until: Date.now() + 6000,
    };
    this.notify(this.serviceError(error, `Не удалось полностью подтвердить программу зоны ${zone}`));
  } finally {
    this._programApplyBusy = false;
    this._programApplyZone = null;
    this.render();
  }
};

p._programEditorCard = function programEditorCardV0688(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousProgramEditorCard.call(this, entities, zone);
  const feedback = this._programFieldFeedback?.zone === zone && Date.now() < Number(this._programFieldFeedback?.until || 0) ? this._programFieldFeedback : null;
  const confirmed = new Set(feedback?.confirmed || []);
  const rejected = new Set(feedback?.rejected || []);
  const decorate = (field, node) => {
    if (!node) return;
    node.classList.toggle("confirmed", confirmed.has(field));
    node.classList.toggle("rejected", rejected.has(field));
  };
  decorate("duration_minutes", template.content.querySelector('[data-program-field="duration_minutes"]')?.closest(".programEditField"));
  decorate("repeat", template.content.querySelector('[data-program-field="cycle_mode"]')?.closest(".programEditField"));
  decorate("anchor_date", template.content.querySelector('[data-program-field="anchor_date"]')?.closest(".programEditField"));
  decorate("rain_sensor_follow", template.content.querySelector('[data-program-field="rain_sensor_follow"]')?.closest(".programEditField"));
  decorate("repeat", template.content.querySelector(".programRepeatEditor"));
  decorate("start_times", template.content.querySelector(".programStartsEditor"));
  template.content.querySelectorAll(".programEditStart").forEach((field) => {
    const input = field.querySelector("input[data-program-start]");
    if (!input) return;
    decorate("start_times", field);
    const slot = Number(input.dataset.programStart);
    input.setAttribute("placeholder", "--:--");
    const shell = document.createElement("span");
    shell.className = `programTimeInputShell ${input.value ? "filled" : "empty"}`;
    input.replaceWith(shell); shell.append(input);
    const empty = document.createElement("span");
    empty.className = "programTimeEmpty"; empty.setAttribute("aria-hidden", "true"); empty.textContent = "--:--"; shell.append(empty);
    const clear = document.createElement("button");
    clear.type = "button"; clear.className = "programTimeClear"; clear.dataset.programStartClear = `${zone}:${slot}`; clear.disabled = !input.value;
    clear.setAttribute("aria-label", `Очистить время запуска ${slot + 1}`); clear.setAttribute("title", "Очистить время");
    clear.innerHTML = '<ha-icon icon="mdi:close"></ha-icon>'; shell.append(clear);
  });
  return template.innerHTML;
};

p._restoreDp38SnapshotLabV0688 = function restoreDp38SnapshotLabV0688(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = String(attrs.dp38_snapshot_status || "idle");
  const baseline = attrs.dp38_snapshot_baseline || [];
  const current = attrs.dp38_snapshot_current || [];
  const diff = attrs.dp38_snapshot_diff || {};
  const trace = attrs.dp38_snapshot_trace || {};
  const baselineAvailable = attrs.dp38_snapshot_baseline_available === true;
  const allowed = attrs.dp38_snapshot_allowed === true && this.commandAvailable("capture_dp38_snapshot") && !this._dp38SnapshotBusy;
  const tone = status === "baseline_saved" || status === "compared_unchanged" ? "ok" : status === "compared_changes" ? "changed" : status === "incomplete" ? "error" : "";
  return `<section class="lab dp38SnapshotLab dp38FullSnapshot">
    <div class="zone8ProbeHead"><span><small>DP38 · СНИМОК 1–8</small><h3>До и после изменения на приборе</h3></span><b class="${allowed ? "ready" : "blocked"}">Только чтение</b></div>
    <p>Сохраняются точные 20-байтовые блоки всех зон. При контрольном чтении сравнивается каждый байт каждой зоны.</p>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite"><small>Результат</small><b>${this.esc(this._dp38SnapshotStatusText(status))}</b>${attrs.dp38_snapshot_detail ? `<span>${this.esc(attrs.dp38_snapshot_detail)}</span>` : ""}</div>
    ${this._dp38SnapshotDiff(diff, status)}
    <details class="dp38SnapshotDetails" ${baselineAvailable && !current.length ? "open" : ""}><summary>Исходный снимок · ${baseline.length || 0} из 8</summary>${this._dp38SnapshotRows(baseline, "Исходный снимок отсутствует")}</details>
    ${current.length ? `<details class="dp38SnapshotDetails"><summary>Контрольный снимок · ${current.length} из 8</summary>${this._dp38SnapshotRows(current, "Контрольный снимок отсутствует")}</details>` : ""}
    ${Number.isFinite(Number(trace.active_requests)) ? `<div class="zone8Trace">Запросов: ${Number(trace.active_requests)} · ответов: ${Number(trace.responses || 0)} · зоны: ${this.esc((trace.zones_seen || []).join(", ") || "нет")}</div>` : ""}
    <div class="dp38SnapshotActions">
      <button type="button" class="zone8ProbeButton secondary" data-dp38-snapshot-phase="baseline" ${allowed ? "" : "disabled"}><ha-icon icon="mdi:camera-outline"></ha-icon>${this._dp38SnapshotBusy ? "Идёт чтение" : baselineAvailable ? "Переснять исходный снимок 1–8" : "Снять исходный снимок 1–8"}</button>
      <button type="button" class="zone8ProbeButton" data-dp38-snapshot-phase="compare" ${allowed && baselineAvailable ? "" : "disabled"}><ha-icon icon="mdi:compare"></ha-icon>Снять контрольный снимок и сравнить</button>
    </div>
    <p class="zone8ProbeWarning">Во время каждого снимка последовательно откройте на самом приборе зоны 1–8. Ничего не редактируйте до завершения чтения.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0688(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const snapshot = this._restoreDp38SnapshotLabV0688(entities);
  const rainMarker = '<section class="lab rainSensorProbeLab">';
  if (content.includes(rainMarker)) return content.replace(rainMarker, `${snapshot}${rainMarker}`);
  return `${snapshot}${content}`;
};

p._ensureV0688Events = function ensureV0688Events() {
  if (this._v0688EventsBound) return;
  this._v0688EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const clear = event.target?.closest?.("[data-program-start-clear]");
    if (!clear) return;
    event.preventDefault(); event.stopPropagation();
    const [zoneText, slotText] = String(clear.dataset.programStartClear || "").split(":");
    const zone = Number(zoneText); const slot = Number(slotText); const state = this._programDrafts?.[zone];
    if (!state || !Number.isInteger(slot) || slot < 0 || slot > 5) return;
    state.values.start_times[slot] = "";
    this._programFieldFeedback = null; this._programNativePickerOpen = false; this._programForceRender = true;
    try { this.render(); } finally { this._programForceRender = false; }
  }, true);
};

p._render = function renderV0688() {
  previousRender.call(this);
  this._ensureV0688Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0688() {
  return `${previousStyles.call(this)}
    .programEditField,.programRepeatEditor,.programStartsEditor,.programEditStart{transition:background .16s ease,border-color .16s ease,box-shadow .16s ease}
    .programEditField.confirmed,.programRepeatEditor.confirmed,.programStartsEditor.confirmed,.programEditStart.confirmed{border-color:color-mix(in srgb,var(--green) 42%,var(--line))!important;background:color-mix(in srgb,var(--green) 8%,var(--card))!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--green) 7%,transparent)!important}
    .programEditField.confirmed input,.programEditField.confirmed select,.programEditStart.confirmed input{border-color:color-mix(in srgb,var(--green) 38%,var(--line))!important}
    .programEditField.rejected,.programRepeatEditor.rejected,.programStartsEditor.rejected,.programEditStart.rejected{border-color:color-mix(in srgb,var(--error-color,#db4437) 46%,var(--line))!important;background:color-mix(in srgb,var(--error-color,#db4437) 6%,var(--card))!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 6%,transparent)!important}
    .programEditField.rejected input,.programEditField.rejected select,.programEditStart.rejected input{border-color:color-mix(in srgb,var(--error-color,#db4437) 42%,var(--line))!important}
    .programTimeInputShell{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 38px;align-items:center;gap:6px;width:100%;min-width:0}
    .programTimeInputShell>input{position:relative;z-index:1;min-width:0!important;width:100%!important;background:var(--card)!important}.programTimeInputShell.empty>input{color:transparent!important}.programTimeInputShell.empty:focus-within>input{color:var(--text)!important}
    .programTimeEmpty{position:absolute;z-index:2;left:0;right:44px;top:0;height:42px;display:grid;place-items:center;color:var(--muted);font-size:16px;font-weight:800;letter-spacing:.04em;pointer-events:none;opacity:0}.programTimeInputShell.empty .programTimeEmpty{opacity:1}.programTimeInputShell.empty:focus-within .programTimeEmpty{opacity:0}
    .programTimeClear{display:grid;place-items:center;width:38px;height:42px;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--a