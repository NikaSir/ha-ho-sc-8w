import "./irrigation-panel-v0638.mjs";

const UI_VERSION = "0.6.39";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousConnected = p.connectedCallback;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const previousStyles = p.styles;

p.commandBusy = function commandBusyV0639() {
  return previousCommandBusy.call(this) || Boolean(this._zone8LabBusy);
};

p._zone8LabCurrent = function zone8LabCurrent(field, attrs) {
  if (field.startsWith("start_time_")) {
    const slot = Number(field.slice(-1)) - 1;
    if (Array.isArray(attrs.start_slots)) return attrs.start_slots[slot] || "";
    return Array.isArray(attrs.start_times) ? (attrs.start_times[slot] || "") : "";
  }
  if (field === "duration_minutes") return attrs.duration_minutes ?? attrs.duration_min ?? "";
  if (field === "cycle_mode") return attrs.calendar_mode || attrs.cycle_mode || "weekly";
  if (field === "cycle_value") return attrs.cycle_value ?? "";
  if (field === "anchor_date") return attrs.anchor_date || "";
  if (field === "rain_sensor_follow") return attrs.rain_sensor_follow === true ? "true" : "false";
  return "";
};

p._zone8LabValue = function zone8LabValue(field, attrs) {
  const drafts = this._zone8LabDrafts || {};
  return Object.prototype.hasOwnProperty.call(drafts, field)
    ? drafts[field]
    : this._zone8LabCurrent(field, attrs);
};

p._zone8LabStatusText = function zone8LabStatusText(status) {
  return {
    idle: "Изменений ещё не было",
    waiting_readback: "Ожидается чтение контроллера",
    confirmed: "Запись совпала с чтением контроллера",
    confirmed_no_change: "Контроллер уже содержал это значение",
    readback_mismatch: "Прочитанное значение не совпало",
    restoring: "Выполняется восстановление",
    restored: "Исходный блок восстановлен",
    restore_mismatch: "Восстановление не подтверждено",
  }[status] || String(status || "Нет данных");
};

p.applyZone8LabField = async function applyZone8LabField(field) {
  if (this.rejectUnavailableCommand("set_zone8_schedule_field")) return;
  const entity = this.entities().zones[8].schedule;
  const attrs = this.attrs(entity);
  if (attrs.lab_write_allowed !== true) {
    this.notify("Запись зоны 8 заблокирована: нужен полный свежий DP38 и остановленный полив");
    return;
  }
  const control = this.shadowRoot.querySelector(`[data-zone8-field="${field}"]`);
  const value = String(control?.value ?? this._zone8LabValue(field, attrs));
  const current = String(this._zone8LabCurrent(field, attrs));
  if (value === current) {
    this.notify("Это значение уже прочитано из контроллера");
    return;
  }
  const label = control?.dataset.zone8Label || field;
  if (!window.confirm(`Зона 8 · изменить только «${label}»?\n\nБыло: ${current || "пусто"}\nСтанет: ${value || "пусто"}\n\nИсходный блок будет сохранён для восстановления.`)) return;
  this._zone8LabBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "set_zone8_schedule_field", {
      ...this.serviceTargetData(), field, value,
    });
    if (this._zone8LabDrafts) delete this._zone8LabDrafts[field];
    await this.refreshNow();
    this.notify(`Зона 8: поле «${label}» подтверждено чтением DP38`);
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить изменение зоны 8"));
  } finally {
    this._zone8LabBusy = false;
    this.render();
  }
};

p.restoreZone8Lab = async function restoreZone8Lab() {
  if (this.rejectUnavailableCommand("restore_zone8_schedule")) return;
  const attrs = this.attrs(this.entities().zones[8].schedule);
  if (attrs.lab_backup_available !== true) {
    this.notify("Сохранённого исходного блока зоны 8 нет");
    return;
  }
  if (!window.confirm("Восстановить исходную программу зоны 8?\n\nБудет записан точный блок, сохранённый перед первой лабораторной правкой.")) return;
  this._zone8LabBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "restore_zone8_schedule", this.serviceTargetData());
    this._zone8LabDrafts = {};
    await this.refreshNow();
    this.notify("Исходная программа зоны 8 восстановлена и подтверждена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить восстановление зоны 8"));
  } finally {
    this._zone8LabBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0639(e) {
  const rows = [
    ["Соединение", e.connection, this.state(e.connection), ""],
    ["Режим", e.operation, this.state(e.operation), "operation"],
    ["Активные зоны", e.active, this.state(e.active), ""],
    ["Очередь", e.queued, this.state(e.queued), ""],
    ["Кэш DP38", e.cache, this.state(e.cache), "cache"],
    ["Ошибка таймера", e.timerError, this.state(e.timerError), "alarm"],
  ];
  const z8 = e.zones[8].schedule;
  const attrs = this.attrs(z8);
  const writeReady = attrs.lab_write_allowed === true
    && this.commandAvailable("set_zone8_schedule_field");
  const control = (field, label, type = "text", extra = "") => {
    const value = this._zone8LabValue(field, attrs);
    return `<label class="zone8LabField"><span>${label}</span><span class="zone8LabControl"><input data-zone8-field="${field}" data-zone8-label="${label}" type="${type}" value="${this.esc(value)}" ${extra} ${writeReady ? "" : "disabled"}><button data-zone8-apply="${field}" ${writeReady ? "" : "disabled"}>Записать</button></span></label>`;
  };
  const mode = this._zone8LabValue("cycle_mode", attrs);
  const knownModes = new Set(["weekly", "odd", "even", "interval"]);
  const modeOptions = `${knownModes.has(mode) ? "" : `<option value="${this.esc(mode)}" selected disabled>Неизвестно (${this.esc(attrs.cycle_mode_raw ?? "—")})</option>`}${[
    ["weekly", "По дням недели"], ["odd", "Нечётные дни"],
    ["even", "Чётные дни"], ["interval", "Интервал"],
  ].map(([value, label]) => `<option value="${value}" ${mode === value ? "selected" : ""}>${label}</option>`).join("")}`;
  const startFields = Array.from({ length: 6 }, (_, index) => control(
    `start_time_${index + 1}`, `Старт ${index + 1}`, "time"
  )).join("");
  const source = attrs.cache_source || "missing";
  const status = attrs.lab_last_status || "idle";
  const statusTone = ["confirmed", "confirmed_no_change", "restored"].includes(status) ? "ok" : status.includes("mismatch") ? "error" : "";
  return `<div class="pageIntro"><small>ДИАГНОСТИКА</small><h2>Состояние интеграции</h2><p>Зоны 1–7 не изменяются.</p></div>
    <section class="diagList">${rows.map(([label, id, value, kind]) => `<button data-entity="${this.esc(id)}"><span>${label}</span><b>${this.esc(kind ? this.human(kind, value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("")}</section>
    <section class="lab zone8ProgramLab">
      <div class="zone8LabHead"><span><small>DP38 · ЛАБОРАТОРНАЯ</small><h3>Программа зоны 8</h3></span><b class="${writeReady ? "ready" : "blocked"}">${writeReady ? "Запись разрешена" : "Только просмотр"}</b></div>
      <div class="zone8LabFacts"><span>Источник <b>${this.esc(source)}</b></span><span>Raw <code>${this.esc(attrs.raw_hex || "—")}</code></span></div>
      <div class="zone8LabGrid">
        ${control("duration_minutes", "Длительность, мин", "number", 'min="0" max="255" step="1"')}
        ${startFields}
        <label class="zone8LabField"><span>Режим календаря</span><span class="zone8LabControl"><select data-zone8-field="cycle_mode" data-zone8-label="Режим календаря" ${writeReady ? "" : "disabled"}>${modeOptions}</select><button data-zone8-apply="cycle_mode" ${writeReady ? "" : "disabled"}>Записать</button></span></label>
        ${control("cycle_value", "Значение цикла", "number", 'min="0" max="255" step="1"')}
        ${control("anchor_date", "Опорная дата", "date")}
        <label class="zone8LabField"><span>Учитывать дождь</span><span class="zone8LabControl"><select data-zone8-field="rain_sensor_follow" data-zone8-label="Учитывать дождь" ${writeReady ? "" : "disabled"}><option value="true" ${this._zone8LabValue("rain_sensor_follow", attrs) === "true" ? "selected" : ""}>Да</option><option value="false" ${this._zone8LabValue("rain_sensor_follow", attrs) === "false" ? "selected" : ""}>Нет</option></select><button data-zone8-apply="rain_sensor_follow" ${writeReady ? "" : "disabled"}>Записать</button></span></label>
      </div>
      <div class="zone8LabReadback ${statusTone}"><small>Последняя проверка</small><b>${this.esc(this._zone8LabStatusText(status))}</b>${attrs.lab_last_field ? `<span>${this.esc(attrs.lab_last_field)} → ${this.esc(attrs.lab_requested_value)}</span>` : ""}</div>
      <button class="zone8Restore" data-zone8-restore ${attrs.lab_backup_available === true && this.commandAvailable("restore_zone8_schedule") ? "" : "disabled"}><ha-icon icon="mdi:backup-restore"></ha-icon>Восстановить исходный блок зоны 8</button>
      <p class="zone8LabNote">Каждая кнопка меняет только одно поле. Успех показывается лишь после точного чтения 20-байтного блока из контроллера.</p>
    </section>`;
};

p.connectedCallback = function connectedCallbackV0639() {
  previousConnected.call(this);
  if (this._zone8LabEventsBound) return;
  this._zone8LabEventsBound = true;
  this.shadowRoot.addEventListener("input", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = { ...(this._zone8LabDrafts || {}), [input.dataset.zone8Field]: input.value };
  });
  this.shadowRoot.addEventListener("change", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = { ...(this._zone8LabDrafts || {}), [input.dataset.zone8Field]: input.value };
  });
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-zone8-apply], [data-zone8-restore]");
    if (!target) return;
    if (target.dataset.zone8Apply) this.applyZone8LabField(target.dataset.zone8Apply);
    else this.restoreZone8Lab();
  });
};

p.header = function headerV0639() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._render = function renderV0639() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
  const schedule = this.entities?.().zones?.[8]?.schedule;
  const attrs = schedule ? this.attrs(schedule) : {};
  for (const control of this.shadowRoot?.querySelectorAll("[data-zone8-field]") || []) {
    if (this.shadowRoot.activeElement === control) continue;
    const desired = String(this._zone8LabValue(control.dataset.zone8Field, attrs));
    if (control.value !== desired) control.value = desired;
  }
};

p.styles = function stylesV0639() {
  return `${previousStyles.call(this)}
    .zone8ProgramLab{display:grid;gap:12px;padding:14px}.zone8LabHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.zone8LabHead small{color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em}.zone8LabHead h3{margin:3px 0 0;font-size:20px}.zone8LabHead>b{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:11px;white-space:nowrap}.zone8LabHead>b.ready{background:color-mix(in srgb,var(--green) 12%,var(--card));color:var(--green)}
    .zone8LabFacts{display:grid;gap:5px;padding:9px 10px;border-radius:12px;background:var(--soft);font-size:11px;color:var(--muted)}.zone8LabFacts span{display:grid;grid-template-columns:56px minmax(0,1fr);gap:6px}.zone8LabFacts code{overflow-wrap:anywhere;color:var(--text);font-size:10px}
    .zone8LabGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zone8LabField{display:grid;gap:5px;padding:9px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.zone8LabField>span:first-child{color:var(--muted);font-size:11px;font-weight:700}.zone8LabControl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px}.zone8LabControl input,.zone8LabControl select{min-width:0;height:38px;padding:0 8px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font-family:inherit;font-size:13px;font-weight:700}.zone8LabControl button{min-height:38px;padding:5px 8px;border:1px solid color-mix(in srgb,var(--a) 48%,var(--line));border-radius:10px;background:var(--accent-soft);color:var(--a);font-size:11px;font-weight:800}.zone8LabControl button:disabled,.zone8LabControl input:disabled,.zone8LabControl select:disabled{opacity:.58}
    .zone8LabReadback{display:grid;gap:2px;padding:10px;border-radius:13px;background:var(--soft)}.zone8LabReadback small,.zone8LabReadback span{color:var(--muted);font-size:11px}.zone8LabReadback b{font-size:13px}.zone8LabReadback.ok{background:color-mix(in srgb,var(--green) 10%,var(--card));color:var(--green)}.zone8LabReadback.error{background:color-mix(in srgb,var(--danger) 9%,var(--card));color:var(--danger)}.zone8Restore{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--a);font-weight:800}.zone8Restore:disabled{color:var(--muted);opacity:.58}.zone8LabNote{margin:0!important;color:var(--muted);font-size:11px!important;line-height:1.35}
    @media(max-width:520px){.zone8LabGrid{grid-template-columns:1fr}.zone8LabHead{align-items:center}.zone8LabControl button{min-width:76px}}
  `;
};
