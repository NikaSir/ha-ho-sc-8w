import "./irrigation-panel-v0652.mjs";

const UI_VERSION = "0.6.53";
const SNAPSHOT_CONFIRMATION = "DP38_FULL_SNAPSHOT_READ_ONLY";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;

const formatDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return value ? "Некорректная дата" : "Не задана";
  return `${match[3]}.${match[2]}.${match[1]}`;
};

p.commandBusy = function commandBusyV0653() {
  return previousCommandBusy.call(this) || Boolean(this._dp38SnapshotBusy);
};

p._programSectionName = function programSectionName() {
  return this._programSection === "zones" ? "zones" : "general";
};

p._programZoneNumber = function programZoneNumber() {
  const zone = Number(this._programZone);
  return Number.isInteger(zone) && zone >= 1 && zone <= 6 ? zone : 1;
};

p._programZoneForm = function programZoneForm(e, zone) {
  const detail = this.zoneDetail(e, zone);
  const formStart = detail.indexOf('<section class="detailCard zoneProgramDetail">');
  return formStart >= 0 ? detail.slice(formStart) : detail;
};

p._programPermission = function programPermission(operation) {
  if (this.bad(operation)) return { value: "Нет данных", note: "Режим контроллера не получен", tone: "unknown" };
  if (String(operation).toLowerCase() === "auto") return { value: "Разрешён", note: "Автоматический режим", tone: "active" };
  if (String(operation).toLowerCase() === "manual") return { value: "Ручной режим", note: "Автозапуск не выполняется", tone: "warning" };
  if (String(operation).toLowerCase() === "off") return { value: "Отключён", note: "Контроллер в режиме OFF", tone: "off" };
  return { value: this.human("operation", operation), note: "Текущее состояние контроллера", tone: "unknown" };
};

p.programView = function programViewV0653(e) {
  const section = this._programSectionName();
  const zone = this._programZoneNumber();
  const seasonal = this.state(e.seasonal);
  const rain = this.rainPresentation(e);
  const operation = this.state(e.operation);
  const permission = this._programPermission(operation);
  const seasonalCommandAvailable = this.commandAvailable("set_seasonal_adjustment") && !this.bad(seasonal);
  const seasonalValue = this._seasonalDraft === null
    ? (this.bad(seasonal) ? "" : seasonal)
    : this._seasonalDraft;
  const general = `<section class="programGeneralGrid" aria-label="Общие параметры полива">
    <button class="programGeneralCard ${permission.tone}" data-entity="${this.esc(e.operation)}"><ha-icon icon="mdi:water-check-outline"></ha-icon><span><small>Разрешение полива</small><b>${this.esc(permission.value)}</b><em>${this.esc(permission.note)} · ${this.esc(this.human("irrigation", this.state(e.irrigation)))}</em></span></button>
    <article class="programGeneralCard off" aria-label="Пауза полива"><ha-icon icon="mdi:pause-circle-outline"></ha-icon><span><small>Пауза полива</small><b>Не поддерживается</b><em>У прибора нет отдельного параметра паузы</em></span></article>
    <button class="programGeneralCard ${this.esc(rain.tone)}" data-entity="${this.esc(e.rain)}"><ha-icon icon="${this.esc(rain.icon)}"></ha-icon><span><small>Датчик дождя</small><b>${this.esc(rain.label)}</b><em>${this.esc(rain.detail)}</em></span></button>
    <article class="programGeneralCard programSeasonEditor ${this.bad(seasonal) ? "unknown" : "active"}"><ha-icon icon="mdi:percent-outline"></ha-icon><span><small>Сезонный коэффициент</small><span class="programSeasonControls"><label class="seasonalInput"><input data-season-value type="number" inputmode="numeric" min="-90" max="100" step="10" value="${this.esc(seasonalValue)}" aria-label="Сезонная коррекция, процентов" ${seasonalCommandAvailable ? "" : "disabled"}><b>%</b></label><button data-season-apply ${seasonalCommandAvailable ? "" : "disabled"}>${this._seasonalBusy ? "Проверка…" : "Применить"}</button></span><em>Общее значение для всех зон</em></span></article>
  </section>`;
  const zoneForm = `<section class="programZoneSection" aria-label="Параметры зоны ${zone}">
    <div class="programZoneContext"><span><small>ВЫБРАНА В ШАПКЕ</small><b>Зона ${zone}</b></span><em>Полная расшифрованная форма · только просмотр</em></div>
    ${this._programZoneForm(e, zone)}
  </section>`;
  return `<div class="pageIntro programPageIntro expandedProgramIntro">
    <small>ПРОГРАММА</small>
    <h2>Автоматический полив</h2>
    <p>Общие параметры отделены от полной программы выбранной зоны.</p>
  </div>
  <nav class="programSections" aria-label="Раздел программы">
    <button type="button" class="${section === "general" ? "active" : ""}" data-program-section="general" aria-pressed="${section === "general"}">Общие параметры</button>
    <button type="button" class="${section === "zones" ? "active" : ""}" data-program-section="zones" aria-pressed="${section === "zones"}">Параметры зон</button>
  </nav>
  <div class="programSectionBody">${section === "zones" ? zoneForm : general}</div>`;
};

p._structureKey = function structureKeyV0653() {
  if (this._view === "program") {
    return `program:${this._programSectionName()}:${this._programZoneNumber()}`;
  }
  return previousStructureKey.call(this);
};

p._dp38SnapshotDecoded = function dp38SnapshotDecoded(item) {
  const rawHex = String(item?.raw_hex || "").toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(rawHex)) return null;
  const bytes = Array.from({ length: 20 }, (_, index) =>
    Number.parseInt(rawHex.slice(index * 2, index * 2 + 2), 16));
  const starts = Array.from({ length: 6 }, (_, slot) => {
    const hour = bytes[2 + slot];
    const minute = bytes[8 + slot];
    if (hour === 0xFF && minute === 0xFF) return "";
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  });
  const mode = ["weekly", "odd", "even", "interval"][bytes[14] & 0x03] || "unknown";
  const attrs = {
    calendar_mode: mode,
    cycle_mode: mode,
    cycle_mode_raw: bytes[14] & 0x03,
    cycle_value: bytes[15],
    interval_days: mode === "interval" ? bytes[15] : null,
  };
  const anchorDate = bytes[16] && bytes[17] && bytes[18]
    ? `${2000 + bytes[16]}-${String(bytes[17]).padStart(2, "0")}-${String(bytes[18]).padStart(2, "0")}`
    : "";
  return {
    rawHex,
    zone: bytes[0],
    duration: bytes[1],
    starts,
    cycle: this._zoneCyclePresentation(attrs),
    anchorDate,
    rain: (bytes[19] & 0x01) === 0x01,
  };
};

p._dp38SnapshotRows = function dp38SnapshotRows(items, emptyText) {
  const rows = Array.isArray(items) ? [...items].sort((left, right) => Number(left.zone) - Number(right.zone)) : [];
  if (!rows.length) return `<div class="dp38SnapshotEmpty">${this.esc(emptyText)}</div>`;
  return `<div class="dp38SnapshotRows">${rows.map((item) => {
    const decoded = this._dp38SnapshotDecoded(item);
    if (!decoded) return `<article class="invalid"><b>Зона ${this.esc(item?.zone || "?")}</b><code>${this.esc(item?.raw_hex || "Нет RAW")}</code><span>Блок не удалось расшифровать</span></article>`;
    const starts = decoded.starts.filter(Boolean).join(" · ") || "нет запусков";
    const repeat = Number(item?.count || 0) > 1 ? ` · повторов ${Number(item.count)}` : "";
    const freshness = item?.fresh === false ? "сохранён" : `свежий${repeat}`;
    return `<article class="${item?.valid === false ? "invalid" : ""}">
      <span class="dp38SnapshotRowHead"><b>Зона ${decoded.zone}</b><em>${this.esc(freshness)}</em></span>
      <code>${decoded.rawHex}</code>
      <span>${decoded.duration} мин · ${this.esc(starts)} · ${this.esc(decoded.cycle.value)} · ${this.esc(formatDate(decoded.anchorDate))} · дождь: ${decoded.rain ? "да" : "нет"}</span>
    </article>`;
  }).join("")}</div>`;
};

p._dp38DiffField = function dp38DiffField(field) {
  const exact = {
    zone_identifier: "идентификатор зоны",
    duration_minutes: "длительность",
    cycle_mode: "режим повтора",
    cycle_value: "значение повтора",
    anchor_year: "год начала",
    anchor_month: "месяц начала",
    anchor_day: "день начала",
    flags: "флаги / дождь",
  };
  if (exact[field]) return exact[field];
  const start = /^start_time_(\d)_(hour|minute)$/.exec(String(field || ""));
  if (start) return `запуск ${start[1]} · ${start[2] === "hour" ? "часы" : "минуты"}`;
  return String(field || "неизвестное поле");
};

p._dp38SnapshotDiff = function dp38SnapshotDiff(diff, status) {
  if (!status.startsWith("compared_")) return "";
  const changes = Array.isArray(diff?.changes) ? diff.changes : [];
  if (!changes.length) return `<section class="dp38DiffResult ok"><small>СРАВНЕНИЕ</small><b>Изменений нет</b><span>Все восемь блоков полностью совпадают с исходным снимком.</span></section>`;
  return `<section class="dp38DiffResult changed"><small>СРАВНЕНИЕ</small><b>Изменены зоны: ${this.esc((diff.changed_zones || []).join(", "))}</b>
    <div>${changes.map((change) => `<article><strong>Зона ${this.esc(change.zone)}</strong><code>${this.esc(change.before_hex)}</code><ha-icon icon="mdi:arrow-down"></ha-icon><code>${this.esc(change.after_hex)}</code><p>${(change.bytes || []).map((byte) => `<span>Байт ${this.esc(byte.offset)} · ${this.esc(this._dp38DiffField(byte.field))}: <b>${this.esc(byte.before)} → ${this.esc(byte.after)}</b></span>`).join("")}</p></article>`).join("")}</div>
    <span>Без изменений: зоны ${this.esc((diff.unchanged_zones || []).join(", ") || "нет")}</span>
  </section>`;
};

p._dp38SnapshotStatusText = function dp38SnapshotStatusText(status) {
  return {
    idle: "Исходный снимок ещё не сделан",
    capturing_baseline: "Собираю исходные блоки зон 1–8",
    baseline_saved: "Исходный снимок сохранён",
    capturing_compare: "Собираю контрольные блоки зон 1–8",
    compared_changes: "Сравнение завершено — найдены изменения",
    compared_unchanged: "Сравнение завершено — изменений нет",
    incomplete: "Полный снимок получить не удалось",
  }[status] || String(status || "Нет данных");
};

p.runDp38FullSnapshot = async function runDp38FullSnapshot(phase) {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  const entities = this.entities();
  const attrs = this.attrs(entities.zones[8].schedule);
  if (String(this.state(entities.operation)).toLowerCase() !== "off") {
    this.notify("Перед снимком физически переведите контроллер в режим OFF");
    return;
  }
  if (phase === "compare" && attrs.dp38_snapshot_baseline_available !== true) {
    this.notify("Сначала сохраните исходный снимок зон 1–8");
    return;
  }
  const message = phase === "baseline"
    ? [
      attrs.dp38_snapshot_baseline_available === true ? "Заменить ранее сохранённый исходный снимок?" : "Снять исходный снимок зон 1–8?",
      "",
      "После запуска последовательно откройте на приборе зоны 1 → 8, ничего не изменяя. На сбор отведено до 35 секунд.",
      "",
      "Команды записи DP38 не отправляются.",
    ].join("\n")
    : [
      "Снять контрольный снимок и сравнить с исходным?",
      "",
      "Сначала измените на самом приборе только согласованный параметр зоны 8. Затем во время чтения последовательно откройте зоны 1 → 8.",
      "",
      "Команды записи DP38 не отправляются.",
    ].join("\n");
  if (!window.confirm(message)) return;
  this._dp38SnapshotBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase, confirmation: SNAPSHOT_CONFIRMATION,
    });
    await this.refreshNow();
    this.notify(phase === "baseline" ? "Исходный снимок зон 1–8 сохранён" : "Контрольный снимок сопоставлен с исходным");
  } catch (error) {
    this.notify(this.serviceError(error, "Полный снимок DP38 не получен"));
  } finally {
    this._dp38SnapshotBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0653(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = String(attrs.dp38_snapshot_status || "idle");
  const baseline = attrs.dp38_snapshot_baseline || [];
  const current = attrs.dp38_snapshot_current || [];
  const diff = attrs.dp38_snapshot_diff || {};
  const trace = attrs.dp38_snapshot_trace || {};
  const baselineAvailable = attrs.dp38_snapshot_baseline_available === true;
  const allowed = attrs.dp38_snapshot_allowed === true
    && this.commandAvailable("capture_dp38_snapshot")
    && !this._dp38SnapshotBusy;
  const tone = status === "baseline_saved" || status === "compared_unchanged" ? "ok"
    : status === "compared_changes" ? "changed"
      : status === "incomplete" ? "error" : "";
  const snapshotSection = `<section class="lab dp38FullSnapshot">
    <div class="zone8ProbeHead">
      <span><small>DP38 · СНИМОК 1–8</small><h3>До и после изменения на приборе</h3></span>
      <b class="${allowed ? "ready" : "blocked"}">Только чтение</b>
    </div>
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
  const content = previousDiagnosticsView.call(this, entities);
  if (content.includes('<section class="lab zone8WriteIncident">')) {
    return content.replace('<section class="lab zone8WriteIncident">', `${snapshotSection}<section class="lab zone8WriteIncident">`);
  }
  return `${content}${snapshotSection}`;
};

p._ensureDp38SnapshotEvents = function ensureDp38SnapshotEvents() {
  if (this._dp38SnapshotEventsBound) return;
  this._dp38SnapshotEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-dp38-snapshot-phase]");
    if (target) {
      this.runDp38FullSnapshot(target.dataset.dp38SnapshotPhase);
      return;
    }
    const programSection = event.target.closest?.("[data-program-section]");
    if (!programSection) return;
    this._programSection = programSection.dataset.programSection === "zones" ? "zones" : "general";
    this._pendingScrollTop = 0;
    this.render();
  });
  this.shadowRoot.addEventListener("change", (event) => {
    const selector = event.target.closest?.("[data-program-zone-select]");
    if (!selector) return;
    const zone = Number(selector.value);
    if (!Number.isInteger(zone) || zone < 1 || zone > 6) return;
    this._programZone = zone;
    this._pendingScrollTop = 0;
    this.render();
  });
};

p._syncProgramHeader = function syncProgramHeader() {
  const zoneMode = this._view === "program" && this._programSectionName() === "zones";
  const title = this.shadowRoot?.querySelector("[data-default-header-title]");
  const picker = this.shadowRoot?.querySelector("[data-program-zone-picker]");
  const refresh = this.shadowRoot?.querySelector("[data-refresh]");
  const zoneState = this.shadowRoot?.querySelector("[data-program-zone-state]");
  if (title) title.hidden = zoneMode;
  if (picker) picker.hidden = !zoneMode;
  if (refresh) refresh.hidden = zoneMode;
  if (zoneState) zoneState.hidden = !zoneMode;
  if (!zoneMode || !this._hass || !zoneState) return;

  const zone = this._programZoneNumber();
  const selector = picker?.querySelector("[data-program-zone-select]");
  if (selector) selector.value = String(zone);
  const runtime = this.zoneRuntime(this.entities(), zone);
  const icon = runtime.tone === "running" ? "mdi:water"
    : runtime.tone === "queued" ? "mdi:clock-outline"
      : runtime.tone === "unknown" ? "mdi:alert-circle-outline"
        : runtime.tone === "off" ? "mdi:minus-circle-outline" : "mdi:check-circle";
  zoneState.className = `headerButton headerZoneState ${runtime.tone}`;
  zoneState.dataset.entity = runtime.q.schedule || "";
  zoneState.setAttribute("aria-label", `Зона ${zone}: ${runtime.label}`);
  const stateIcon = zoneState.querySelector("ha-icon");
  if (stateIcon) stateIcon.setAttribute("icon", icon);
};

p._render = function renderV0653() {
  previousRender.call(this);
  this._ensureDp38SnapshotEvents();
  this._syncProgramHeader();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0653() {
  const zoneOptions = Array.from({ length: 6 }, (_, index) => index + 1)
    .map((zone) => `<option value="${zone}">Зона ${zone}</option>`).join("");
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <div class="headerProgramContext">
      <button class="headerTitle" type="button" data-default-header-title data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${UI_VERSION}</small></button>
      <label class="headerZonePicker" data-program-zone-picker hidden><small>Параметры зоны</small><select data-program-zone-select aria-label="Выбрать зону">${zoneOptions}</select></label>
    </div>
    <div class="headerActionSlot">
      <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
      <button class="headerButton headerZoneState" data-program-zone-state hidden aria-label="Состояние выбранной зоны"><ha-icon icon="mdi:help-circle-outline"></ha-icon></button>
    </div>
  </header>`;
};

p.styles = function stylesV0653() {
  return `${previousStyles.call(this)}
    /* UI v0.6.53 — agreed program subtabs and read-only DP38 snapshots. */
    [hidden]{display:none!important}.headerProgramContext{display:grid;place-items:center;min-width:0}.headerActionSlot{display:grid;place-items:center;width:52px;height:52px}.headerActionSlot>.headerButton{grid-area:1/1}.headerZonePicker{display:grid;grid-template-columns:auto minmax(86px,1fr);align-items:center;gap:8px;width:100%;min-height:44px;padding:5px 9px;border:1px solid color-mix(in srgb,var(--a) 24%,var(--line));border-radius:16px;background:color-mix(in srgb,var(--a) 5%,var(--card));color:var(--text)}.headerZonePicker small{color:var(--muted);font-size:12px;font-weight:700;white-space:nowrap}.headerZonePicker select{width:100%;min-width:0;height:32px;padding:0 25px 0 9px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:inherit;font-size:14px;font-weight:800}.headerZoneState.ready{color:var(--green)}.headerZoneState.running{color:var(--a)}.headerZoneState.queued{color:var(--orange)}.headerZoneState.off{color:var(--muted)}.headerZoneState.unknown{color:var(--danger)}
    .expandedProgramIntro{padding-bottom:8px}.expandedProgramIntro p{white-space:normal!important}
    .programSections{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:11px;padding:5px;border:1px solid var(--line);border-radius:16px;background:var(--soft)}.programSections button{min-height:42px;padding:7px 10px;border:0;border-radius:12px;background:transparent;color:var(--muted);font-weight:800}.programSections button.active{background:var(--card);color:var(--a);box-shadow:0 3px 10px #11182710}.programSectionBody{padding-bottom:8px}
    .programGeneralGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:22px;background:var(--card);box-shadow:var(--shadow)}.programGeneralCard{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:start;gap:9px;min-height:112px;padding:12px;border:0;border-radius:16px;background:var(--soft);color:var(--text);text-align:left}.programGeneralCard>ha-icon{margin-top:2px;color:var(--muted);--mdc-icon-size:28px}.programGeneralCard>span{display:grid;gap:4px;min-width:0}.programGeneralCard small{color:var(--muted);font-size:12px;font-weight:700}.programGeneralCard b{font-size:16px;line-height:1.15}.programGeneralCard em{color:var(--muted);font-size:12px;font-style:normal;line-height:1.3}.programGeneralCard.active>ha-icon,.programGeneralCard.active b,.programGeneralCard.clear>ha-icon,.programGeneralCard.clear b{color:var(--green)}.programGeneralCard.warning>ha-icon,.programGeneralCard.warning b{color:var(--orange)}.programGeneralCard.off>ha-icon,.programGeneralCard.off b,.programGeneralCard.unknown>ha-icon{color:var(--muted)}.programGeneralCard.programSeasonEditor{grid-template-columns:34px minmax(0,1fr)}.programGeneralCard .programSeasonControls{grid-template-columns:minmax(72px,.72fr) minmax(100px,1fr)}
    .programZoneSection{display:grid;gap:10px}.programZoneContext{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:16px;background:var(--card)}.programZoneContext span{display:grid;gap:2px}.programZoneContext small{color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.08em}.programZoneContext b{font-size:17px}.programZoneContext em{color:var(--muted);font-size:12px;font-style:normal;text-align:right}.programZoneSection .zoneProgramDetail{margin:0}.programZoneSection .zoneProgramNote{margin-bottom:0!important}
    .dp38FullSnapshot{display:grid;gap:11px;padding:14px}.dp38FullSnapshot>p{margin:0;color:var(--muted);font-size:12px;line-height:1.4}.dp38SnapshotState,.dp38DiffResult{display:grid;gap:4px;padding:11px;border-radius:14px;background:var(--soft)}.dp38SnapshotState small,.dp38DiffResult>small{color:var(--muted);font-size:11px}.dp38SnapshotState b,.dp38DiffResult>b{font-size:14px}.dp38SnapshotState span,.dp38DiffResult>span{color:var(--muted);font-size:11px;line-height:1.35}.dp38SnapshotState.ok,.dp38DiffResult.ok{background:var(--green-soft);color:var(--green)}.dp38SnapshotState.changed,.dp38DiffResult.changed{background:#fff6df;color:#956500}.dp38SnapshotState.error{background:var(--danger-soft);color:var(--danger)}
    .dp38SnapshotDetails{border:1px solid var(--line);border-radius:14px;background:var(--card);overflow:hidden}.dp38SnapshotDetails summary{padding:11px;font-size:12px;font-weight:800;cursor:pointer}.dp38SnapshotRows{display:grid;gap:7px;padding:0 9px 9px}.dp38SnapshotRows article{display:grid;gap:4px;padding:9px;border-radius:11px;background:var(--soft)}.dp38SnapshotRows article.invalid{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--danger) 45%,transparent)}.dp38SnapshotRowHead{display:flex;justify-content:space-between;gap:8px}.dp38SnapshotRowHead b{font-size:12px}.dp38SnapshotRowHead em{color:var(--muted);font-size:10px;font-style:normal}.dp38SnapshotRows code{overflow-wrap:anywhere;font-size:10.5px;font-weight:800}.dp38SnapshotRows article>span:last-child{color:var(--muted);font-size:10.5px;line-height:1.35}.dp38SnapshotEmpty{padding:12px;color:var(--muted);font-size:12px}
    .dp38DiffResult>div{display:grid;gap:7px;margin-top:4px}.dp38DiffResult article{display:grid;gap:5px;padding:9px;border-radius:11px;background:var(--card)}.dp38DiffResult article strong{font-size:13px}.dp38DiffResult article code{overflow-wrap:anywhere;font-size:10px;color:var(--text)}.dp38DiffResult article ha-icon{justify-self:center;--mdc-icon-size:18px;color:var(--a)}.dp38DiffResult article p{display:grid;gap:3px;margin:0}.dp38DiffResult article p span{font-size:10.5px;color:var(--muted)}.dp38DiffResult article p b{color:var(--text)}
    .dp38SnapshotActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dp38SnapshotActions .zone8ProbeButton{min-height:58px;padding:9px;font-size:12px;line-height:1.2}.dp38SnapshotActions .zone8ProbeButton.secondary{background:var(--card);color:var(--a)}
    @media(max-width:520px){.headerActionSlot{width:48px;height:48px}.headerZonePicker{grid-template-columns:1fr;padding:4px 6px;gap:1px}.headerZonePicker small{text-align:center;font-size:12px!important}.headerZonePicker select{height:28px;font-size:13px}.programGeneralGrid{grid-template-columns:1fr;padding:10px}.programGeneralCard{min-height:96px}.programZoneContext{align-items:flex-start}.programZoneContext em{max-width:180px}.dp38SnapshotActions{grid-template-columns:1fr}.dp38SnapshotActions .zone8ProbeButton{font-size:13px}}
  `;
};
