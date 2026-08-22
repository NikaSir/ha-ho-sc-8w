(() => {
  const UI_VERSION = "0.4.3";
  const FALLBACK_PARENT = "/dashboard-actions";
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._panel = null;
      this._view = "overview";
      this._drill = null;
      this._manualZone = 1;
      this._manualDuration = 10;
    }

    set hass(value) { this._hass = value; this.render(); }
    set panel(value) { this._panel = value; this.render(); }
    set narrow(value) { this.toggleAttribute("narrow", Boolean(value)); }
    connectedCallback() { this.render(); }

    esc(value) {
      return String(value ?? "—").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
    }
    states() { return this._hass?.states || {}; }
    entity(preferred, ...suffixes) {
      const states = this.states();
      if (preferred && states[preferred]) return preferred;
      const keys = Object.keys(states);
      for (const suffix of suffixes) {
        const hit = keys.find((key) => key.endsWith(suffix));
        if (hit) return hit;
      }
      return preferred || null;
    }
    state(entityId) { return entityId && this.states()[entityId] ? this.states()[entityId].state : "unavailable"; }
    attrs(entityId) { return entityId && this.states()[entityId] ? this.states()[entityId].attributes || {} : {}; }
    bad(value) { return BAD.has(value); }
    zoneSet(value) {
      if (this.bad(value) || value === "None") return new Set();
      return new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean));
    }
    parentPath() { return this._panel?.config?.parent_path || FALLBACK_PARENT; }
    explicitNavigate(path) {
      const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.pushState({ from }, "", path);
      window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true, detail: { replace: false } }));
    }
    goBack() {
      if (this._drill) {
        this._view = this._drill.parentView || "overview";
        this._drill = null;
        this.render();
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      this.explicitNavigate(this.parentPath());
    }
    moreInfo(entityId) {
      if (!entityId || !this.states()[entityId]) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
    }

    entities() {
      const base = "sensor.kontroller_poliva_ho_sc_8w";
      const entities = {
        connection: this.entity(`${base}_connection_mode`, "_kontroller_poliva_ho_sc_8w_connection_mode"),
        operation: this.entity(`${base}_operation_mode`, "_kontroller_poliva_ho_sc_8w_operation_mode"),
        irrigation: this.entity(`${base}_irrigation_mode`, "_kontroller_poliva_ho_sc_8w_irrigation_mode"),
        active: this.entity(`${base}_active_zones`, "_kontroller_poliva_ho_sc_8w_active_zones"),
        queued: this.entity(`${base}_queued_zones`, "_kontroller_poliva_ho_sc_8w_queued_zones"),
        rain: this.entity(null, "_kontroller_poliva_ho_sc_8w_rain_sensor"),
        seasonal: this.entity(null, "_kontroller_poliva_ho_sc_8w_seasonal_adjustment"),
        timerError: this.entity(null, "_kontroller_poliva_ho_sc_8w_timer_error_alarm"),
        cache: this.entity(`${base}_schedule_cache`, "_kontroller_poliva_ho_sc_8w_schedule_cache"),
        zones: {},
      };
      for (let zone = 1; zone <= 8; zone += 1) {
        entities.zones[zone] = {
          remaining: this.entity(`${base}_zone_${zone}_time_remaining`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_remaining`),
          elapsed: this.entity(`${base}_zone_${zone}_time_elapsed`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_elapsed`),
          schedule: this.entity(`${base}_schedule_zone_${zone}`, `_kontroller_poliva_ho_sc_8w_schedule_zone_${zone}`),
        };
      }
      return entities;
    }

    human(kind, value) {
      if (this.bad(value)) return "Нет данных";
      const maps = {
        operation: { Auto: "Авто", Manual: "Ручной", OFF: "Выключен" },
        irrigation: { order: "По порядку" },
        rain: { enabled: "Включён", disabled: "Выключен", true: "Включён", false: "Выключен" },
        alarm: { clear: "Нет", false: "Нет", true: "Есть" },
        cache: { complete: "Полный", partial: "Неполный" },
        zones: { None: "Нет" },
      };
      return maps[kind]?.[String(value)] ?? String(value);
    }
    zoneStateText(state) {
      if (state === "configured") return "Активна";
      if (state === "disabled") return "Выключена";
      if (this.bad(state)) return "Нет данных";
      return String(state);
    }
    starts(attrs) { return Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : []; }
    compactStarts(attrs) {
      const starts = this.starts(attrs);
      if (!starts.length) return "Без запуска";
      return starts.length === 1 ? starts[0] : `${starts[0]} +${starts.length - 1}`;
    }
    rainText(value, compact = false) {
      if (value === true) return compact ? "дождь ✓" : "Учитывать";
      if (value === false) return compact ? "дождь ✕" : "Игнорировать";
      return compact ? "дождь —" : "—";
    }
    cycleText(attrs) {
      const mode = attrs.calendar_mode || attrs.cycle_mode || "—";
      if (mode === "interval" && attrs.interval_days) {
        const n = Number(attrs.interval_days);
        return `Каждые ${n} ${n === 1 ? "день" : n >= 2 && n <= 4 ? "дня" : "дней"}`;
      }
      if (mode === "odd") return "Нечётные дни";
      if (mode === "even") return "Чётные дни";
      if (mode === "weekly") return "По дням недели";
      if (mode === "disabled") return "Выключено";
      return String(mode);
    }
    parseDate(value) {
      if (!value || typeof value !== "string") return null;
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    }
    dayOnly(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
    eligibleDay(attrs, date) {
      const mode = attrs.calendar_mode || attrs.cycle_mode;
      if (mode === "disabled") return false;
      if (mode === "odd") return date.getDate() % 2 === 1;
      if (mode === "even") return date.getDate() % 2 === 0;
      if (mode === "weekly") return false;
      if (mode === "interval" && Number(attrs.interval_days) > 0) {
        const anchor = this.parseDate(attrs.interval_start || attrs.anchor_date || "");
        if (!anchor) return false;
        const diff = Math.round((this.dayOnly(date) - this.dayOnly(anchor)) / 86400000);
        return diff >= 0 && diff % Number(attrs.interval_days) === 0;
      }
      return false;
    }
    nextWatering(entities) {
      const now = new Date();
      let best = null;
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule;
        if (this.state(id) !== "configured") continue;
        const attrs = this.attrs(id);
        for (let offset = 0; offset <= 35; offset += 1) {
          const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
          if (!this.eligibleDay(attrs, day)) continue;
          for (const start of this.starts(attrs)) {
            const match = String(start).match(/^(\d{1,2}):(\d{2})$/);
            if (!match) continue;
            const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(match[1]), Number(match[2]));
            if (candidate <= now) continue;
            if (!best || candidate < best.when) best = { zone, when: candidate, time: start, duration: attrs.duration_min ?? "—", rain: attrs.rain_sensor_follow };
          }
        }
      }
      return best;
    }
    relativeDay(date) {
      const diff = Math.round((this.dayOnly(date) - this.dayOnly(new Date())) / 86400000);
      if (diff === 0) return "Сегодня";
      if (diff === 1) return "Завтра";
      return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
    }

    header() {
      if (this._drill?.type === "zone") return this.headerTemplate(`Зона ${this._drill.zone}`, "Полив · HO-SC-8W");
      if (this._drill?.type === "program-audit") return this.headerTemplate("Проверка программы", "Диагностика · только просмотр", true);
      return this.headerTemplate("Полив", `HO-SC-8W · UI v${UI_VERSION}`);
    }
    headerTemplate(title, subtitle, compact = false) {
      return `<header class="appHeader"><button class="backButton" data-back aria-label="Назад"><ha-icon icon="mdi:arrow-left"></ha-icon><span>Назад</span></button><div class="headerTitle ${compact ? "headerTitleCompact" : ""}"><strong>${this.esc(title)}</strong><small>${this.esc(subtitle)}</small></div><div class="headerRight" aria-hidden="true"></div></header>`;
    }
    bottomNav() {
      const tabs = [["overview", "mdi:home-outline", "Обзор"],["manual", "mdi:watering-can-outline", "Ручной"],["settings", "mdi:cog-outline", "Настройки"],["diagnostics", "mdi:stethoscope", "Диагн."]];
      return `<nav class="bottomNav" aria-label="Разделы Полив"><div class="bottomNavInner">${tabs.map(([view, icon, label]) => `<button class="${this._view === view ? "active" : ""}" data-view="${view}" aria-current="${this._view === view ? "page" : "false"}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</div></nav>`;
    }

    hero(entities) {
      const connection = this.state(entities.connection);
      const activeValue = this.state(entities.active);
      const queued = this.zoneSet(this.state(entities.queued));
      const active = this.zoneSet(activeValue);
      const zone = [...active][0];
      let cls = "ok", icon = "mdi:check", title = "Полив не идёт", sub = "Контроллер готов";
      if (this.bad(connection)) { cls = "danger"; icon = "mdi:alert"; title = "Контроллер недоступен"; sub = "Текущее состояние недостоверно"; }
      else if (this.bad(activeValue)) { cls = "danger"; icon = "mdi:alert"; title = "Состояние неизвестно"; sub = "Runtime-данные неполные"; }
      else if (zone) { cls = "active"; icon = "mdi:water"; title = `Полив идёт · зона ${zone}`; sub = queued.size ? `Далее: ${[...queued].join(", ")}` : "Очередь пуста"; }
      let progress = "";
      if (zone) {
        const q = entities.zones[Number(zone)];
        const remaining = this.state(q.remaining), elapsed = this.state(q.elapsed);
        const total = (Number(remaining) || 0) + (Number(elapsed) || 0);
        const pct = total ? Math.min(100, ((Number(elapsed) || 0) / total) * 100) : 0;
        progress = `<div class="times"><span>Прошло <b>${this.esc(elapsed)} мин</b></span><span>Осталось <b>${this.esc(remaining)} мин</b></span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
      }
      return `<section class="hero ${cls}"><div class="heroRow"><div class="orb"><ha-icon icon="${icon}"></ha-icon></div><div><small>ПОЛИВ СЕЙЧАС</small><h1>${this.esc(title)}</h1><p>${this.esc(sub)}</p></div></div>${progress}</section>`;
    }
    chip(label, display, entityId, tone = "") { return `<button class="chip ${tone}" data-entity="${this.esc(entityId)}"><small>${this.esc(label)}</small><strong>${this.esc(display)}</strong></button>`; }
    nextCard(entities) {
      if (this.bad(this.state(entities.connection))) return "";
      const next = this.nextWatering(entities);
      if (!next) return `<section class="next"><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><h2>Расчёт недоступен</h2><p>Для текущего типа программы недостаточно декодированных данных.</p></div></section>`;
      return `<section class="next"><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><h2>${this.esc(this.relativeDay(next.when))} · ${this.esc(next.time)}</h2><p>Зона ${next.zone} · база ${this.esc(next.duration)} мин · ${this.esc(this.rainText(next.rain, true))}</p></div><ha-icon icon="mdi:water-outline"></ha-icon></section>`;
    }
    overview(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const rows = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const q = entities.zones[zone], id = q.schedule, st = this.state(id), a = this.attrs(id);
        const isActive = active.has(String(zone)), isQueued = queued.has(String(zone));
        const remaining = this.state(q.remaining);
        let detail;
        if (isActive) detail = `Полив · осталось ${remaining} мин`;
        else if (isQueued) detail = "В очереди";
        else if (st === "disabled") detail = "Выключена";
        else if (this.bad(st)) detail = "Нет данных";
        else detail = `${this.compactStarts(a)} · ${a.duration_min ?? "—"} мин · ${this.rainText(a.rain_sensor_follow, true)}`;
        rows.push(`<button class="zoneLine ${isActive ? "running" : ""}" data-zone-detail="${zone}" data-entity="${this.esc(id)}"><span class="num">${zone}</span><span><b>Зона ${zone}</b><small>${this.esc(detail)}</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`);
      }
      const connection = this.state(entities.connection), rain = this.state(entities.rain), seasonal = this.state(entities.seasonal);
      return `<div class="overviewCompact">${this.hero(entities)}<div class="chips">${this.chip("Связь", this.bad(connection) ? "Нет данных" : connection, entities.connection, connection === "local" ? "good" : "")}${this.chip("Режим", this.human("operation", this.state(entities.operation)), entities.operation)}${this.chip("Дождь", this.human("rain", rain), entities.rain)}${this.chip("Сезон", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal)}</div>${this.nextCard(entities)}<div class="sectionHead"><h2>Зоны 1–6</h2></div><div class="zoneList">${rows.join("")}</div></div>`;
    }

    zoneDetail(entities, zone) {
      const q = entities.zones[zone], id = q.schedule, st = this.state(id), a = this.attrs(id), starts = this.starts(a), seasonal = this.state(entities.seasonal);
      const enabled = st === "configured";
      return `<div class="intro drillIntro"><div class="titleRow"><h2>Настройка зоны</h2><span class="readOnly">Только просмотр</span></div><p>Фактические параметры программы, сохранённые контроллером.</p></div><section class="zoneDetailStatus ${enabled ? "enabled" : "disabledState"}"><div class="zoneDetailStatusIcon"><ha-icon icon="${enabled ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"}"></ha-icon></div><div><small>СОСТОЯНИЕ ПРОГРАММЫ</small><h2>${this.esc(this.zoneStateText(st))}</h2><p>Зона ${zone}</p></div></section><section class="detailCard"><h3>Расписание</h3><div class="detailGrid"><div><small>Базовая длительность</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Старт</small><b>${this.esc(starts.length ? starts.join(" · ") : "—")}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Начало цикла</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div><div><small>Дождь</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></div><div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div></div></section><section class="lockedInfo"><ha-icon icon="mdi:lock-outline"></ha-icon><div><b>Редактирование пока не опубликовано</b><p>Запись появится только через проверенный публичный API интеграции.</p></div></section><button class="wideMore" data-entity="${this.esc(id)}"><span>Подробнее в Home Assistant</span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
    }
    manual(entities) {
      const zoneButtons = [];
      for (let zone = 1; zone <= 6; zone += 1) zoneButtons.push(`<button class="manualZone ${this._manualZone === zone ? "active" : ""}" data-manual-zone="${zone}"><span>${zone}</span><small>Зона ${zone}</small></button>`);
      const controllerBusy = this.zoneSet(this.state(entities.active)).size > 0;
      return `<div class="intro"><h2>Ручной полив</h2><p>Выбери зону и длительность. Запуск будет доступен только через подтверждённый Actions API.</p></div><section class="manualCard"><div class="manualHead"><div><small>ЗОНА</small><h3>Выбери канал</h3></div><ha-icon icon="mdi:watering-can-outline"></ha-icon></div><div class="manualZones">${zoneButtons.join("")}</div><div class="manualDurationBlock"><small>ДЛИТЕЛЬНОСТЬ</small><div class="durationStepper"><button data-duration-step="-1" aria-label="Уменьшить время"><ha-icon icon="mdi:minus"></ha-icon></button><div><strong>${this._manualDuration}</strong><span>мин</span></div><button data-duration-step="1" aria-label="Увеличить время"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="manualSummary"><span>Зона ${this._manualZone}</span><b>${this._manualDuration} мин</b></div><button class="manualStart" disabled><ha-icon icon="mdi:play"></ha-icon><span>${controllerBusy ? "Контроллер занят" : "Запуск пока недоступен"}</span></button><p class="manualSafety">Панель не отправляет raw DP45 и не имитирует неподтверждённое управление.</p></section>`;
    }
    settingRow(label, value, entityId, icon, hint = "") { return `<button class="settingRow" data-entity="${this.esc(entityId)}"><span class="settingIcon"><ha-icon icon="${icon}"></ha-icon></span><span class="settingText"><b>${this.esc(label)}</b>${hint ? `<small>${this.esc(hint)}</small>` : ""}</span><strong>${this.esc(value)}</strong><ha-icon class="settingChevron" icon="mdi:chevron-right"></ha-icon></button>`; }
    settings(entities) {
      const seasonal = this.state(entities.seasonal);
      return `<div class="intro"><div class="titleRow"><h2>Настройки</h2><span class="readOnly">Только просмотр</span></div><p>Общие параметры всего контроллера.</p></div><section class="settingsCard">${this.settingRow("Режим контроллера", this.human("operation", this.state(entities.operation)), entities.operation, "mdi:autorenew", "Auto / Manual / Off")}${this.settingRow("Сезонная коррекция", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal, "mdi:percent-outline", "Общая для всех зон")}${this.settingRow("Датчик дождя", this.human("rain", this.state(entities.rain)), entities.rain, "mdi:weather-rainy", "Глобальное разрешение")}${this.settingRow("Порядок полива", this.human("irrigation", this.state(entities.irrigation)), entities.irrigation, "mdi:format-list-numbered", "Последовательное выполнение")}</section><section class="lockedInfo settingsLock"><ha-icon icon="mdi:lock-outline"></ha-icon><div><b>Изменение параметров пока закрыто</b><p>Текущие значения — фактические данные контроллера.</p></div></section>`;
    }
    programAudit(entities) {
      const seasonal = this.state(entities.seasonal), rain = this.state(entities.rain), cards = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule, st = this.state(id), a = this.attrs(id), starts = this.starts(a);
        cards.push(`<button class="auditZone" data-entity="${this.esc(id)}"><div class="auditZoneTop"><span class="num">${zone}</span><div><b>Зона ${zone}</b><small>${this.esc(this.zoneStateText(st))}</small></div><span class="auditBadge">${this.esc(this.zoneStateText(st))}</span></div><div class="auditPrimary">${this.esc(starts.length ? starts.join(" · ") : "—")} · ${this.esc(a.duration_min ?? "—")} мин</div><div class="auditSecondary">${this.esc(this.cycleText(a))} · ${this.esc(this.rainText(a.rain_sensor_follow))}</div><div class="auditAnchor">Начало цикла: ${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</div></button>`);
      }
      return `<div class="intro drillIntro"><h2>Фактическая программа</h2><p>Контрольный снимок декодированного DP38. Здесь ничего не редактируется.</p></div><section class="auditSummary"><div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div><div><small>Датчик дождя</small><b>${this.esc(this.human("rain", rain))}</b></div></section><div class="auditList">${cards.join("")}</div>`;
    }
    diagnostics(entities) {
      const rows = [["Активное соединение", entities.connection, this.state(entities.connection), ""],["Режим контроллера", entities.operation, this.state(entities.operation), "operation"],["Порядок полива", entities.irrigation, this.state(entities.irrigation), "irrigation"],["Активные зоны", entities.active, this.state(entities.active), "zones"],["Очередь зон", entities.queued, this.state(entities.queued), "zones"],["Кэш расписания", entities.cache, this.state(entities.cache), "cache"],["Датчик дождя", entities.rain, this.state(entities.rain), "rain"],["Ошибка таймера", entities.timerError, this.state(entities.timerError), "alarm"]];
      const rowHtml = rows.map(([label,id,value,kind]) => `<button data-entity="${this.esc(id)}"><span>${this.esc(label)}</span><b class="${this.bad(value) ? "bad" : ""}">${this.esc(kind ? this.human(kind,value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("");
      const z8 = entities.zones[8].schedule, a8 = this.attrs(z8);
      return `<div class="intro"><h2>Диагностика</h2><p>Проверка достоверности данных, интеграции и фактически сохранённой программы.</p></div><button class="diagnosticAction" data-drill="program-audit"><span class="diagnosticActionIcon"><ha-icon icon="mdi:clipboard-check-outline"></ha-icon></span><span><b>Проверка программы</b><small>Сверить все параметры зон 1–6</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="diag diagnosticRows">${rowHtml}</section><section class="diag infoBox"><h3>Панель</h3><div><span>UI</span><b>v${UI_VERSION}</b></div><div><span>Frontend</span><b>self-contained bundle</b></div></section><section class="diag infoBox"><h3>Главный клапан</h3><div><span>Источник состояния</span><b>Не подтверждён</b></div><p>Панель не вычисляет состояние главного клапана по косвенным признакам.</p></section><section class="diag zone8"><h3>Зона 8 · лабораторная</h3><div><span>Состояние</span><b>${this.esc(this.zoneStateText(this.state(z8)))}</b></div><div><span>Источник кэша</span><b>${this.esc(a8.cache_source ?? "—")}</b></div><pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre><p>Зона 8 не является пользовательской зоной. Raw-write из панели отсутствует.</p></section>`;
    }

    bindActions() {
      this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => this.goBack());
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { this._drill = null; this._view = button.dataset.view || "overview"; this.render(); window.scrollTo({ top: 0, behavior: "auto" }); }));
      this.shadowRoot.querySelectorAll("[data-drill]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.drill === "program-audit") { this._drill = { type: "program-audit", parentView: "diagnostics" }; this._view = "diagnostics"; this.render(); window.scrollTo({ top: 0, behavior: "auto" }); } }));
      this.shadowRoot.querySelectorAll("[data-manual-zone]").forEach((button) => button.addEventListener("click", () => { this._manualZone = Number(button.dataset.manualZone) || 1; this.render(); }));
      this.shadowRoot.querySelectorAll("[data-duration-step]").forEach((button) => button.addEventListener("click", () => { const next = this._manualDuration + Number(button.dataset.durationStep || 0); this._manualDuration = Math.min(120, Math.max(1, next)); this.render(); }));
      this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
        let timer = null, held = false;
        const entityId = button.dataset.entity, zoneDetail = Number(button.dataset.zoneDetail || 0);
        const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
        button.addEventListener("pointerdown", () => { held = false; timer = setTimeout(() => { held = true; this.moreInfo(entityId); }, 550); });
        button.addEventListener("pointerup", cancel);
        button.addEventListener("pointercancel", cancel);
        button.addEventListener("pointerleave", cancel);
        button.addEventListener("click", (event) => {
          if (held) { event.preventDefault(); held = false; return; }
          if (zoneDetail) {
            this._drill = { type: "zone", zone: zoneDetail, parentView: "overview" };
            this._view = "overview";
            this.render();
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
          }
          this.moreInfo(entityId);
        });
      });
    }

    styles() {
      return `
        :host{--a:var(--primary-color,#08a0cf);--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#f7f8fa);--text:var(--primary-text-color,#17191c);--muted:var(--secondary-text-color,#6d7176);--line:color-mix(in srgb,var(--text) 12%,transparent);--soft:color-mix(in srgb,var(--text) 5%,var(--card));--danger:var(--error-color,#d84040);display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}*{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}.app{max-width:860px;min-height:100vh;margin:0 auto;padding:0 14px calc(124px + env(safe-area-inset-bottom))}.appHeader{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:82px minmax(0,1fr) 82px;align-items:center;gap:8px;min-height:56px;padding:calc(4px + env(safe-area-inset-top)) 0 4px;background:color-mix(in srgb,var(--bg) 96%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}.backButton{display:flex;align-items:center;gap:3px;min-height:44px;padding:0 5px;border:0;background:transparent;color:var(--a);font-size:13px;font-weight:700;cursor:pointer}.backButton ha-icon{--mdc-icon-size:23px}.headerTitle{min-width:0;text-align:center}.headerTitle strong{display:block;font-size:17px;line-height:1.05;letter-spacing:-.02em;white-space:nowrap}.headerTitle small{display:block;margin-top:1px;overflow:hidden;color:var(--muted);font-size:8px;line-height:1.1;text-overflow:ellipsis;white-space:nowrap;text-align:center}.headerTitleCompact strong{font-size:15px}.headerRight{width:82px;min-height:44px}.content{padding-top:4px}
        .hero,.next,.chip,.zoneLine,.zoneDetailStatus,.detailCard,.lockedInfo,.manualCard,.settingsCard,.auditSummary,.auditZone,.diagnosticAction,.wideMore,.diag{background:var(--card);border:1px solid var(--line);box-shadow:0 1px 0 #00000003}.hero{padding:11px 13px;border-radius:18px}.heroRow{display:flex;align-items:center;gap:9px}.orb,.num{display:inline-grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--a) 13%,var(--card));color:var(--a);font-weight:800}.orb ha-icon{--mdc-icon-size:21px}.hero small,.next small{color:var(--muted);font-size:7.5px;font-weight:800;letter-spacing:.1em}.hero h1{margin:1px 0;font-size:20px;line-height:1.08;letter-spacing:-.035em}.hero p,.next p,.intro p,.zoneDetailStatus p,.lockedInfo p,.diag p{margin:0;color:var(--muted)}.hero.danger{border-color:color-mix(in srgb,var(--danger) 40%,var(--line))}.hero.danger .orb{background:color-mix(in srgb,var(--danger) 12%,var(--card));color:var(--danger)}.hero.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line))}.times{display:flex;justify-content:space-between;gap:12px;margin-top:7px;color:var(--muted);font-size:9px}.times b{color:var(--text)}.bar{height:4px;margin-top:4px;overflow:hidden;border-radius:99px;background:var(--soft)}.bar i{display:block;height:100%;border-radius:inherit;background:var(--a)}
        .chips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:6px}.chip{min-height:48px;padding:7px 8px;border-radius:14px;text-align:left;cursor:pointer}.chip small{display:block;margin-bottom:2px;color:var(--muted);font-size:7px;text-transform:uppercase}.chip strong{display:block;overflow:hidden;font-size:12px;line-height:1.05;text-overflow:ellipsis;white-space:nowrap}.chip.good strong{color:#2ba66a}.next{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:54px;margin-top:6px;padding:8px 12px;border-radius:15px}.next h2{margin:1px 0;font-size:15px;line-height:1.1}.next p{font-size:9.5px;line-height:1.15}.next>ha-icon{flex:0 0 auto;color:var(--a);--mdc-icon-size:22px}.sectionHead{margin:11px 2px 5px}.sectionHead h2,.intro h2{margin:0;font-size:21px;line-height:1.05;letter-spacing:-.035em}.zoneList{display:grid;grid-template-columns:1fr;gap:5px}.zoneLine{display:grid;grid-template-columns:38px minmax(0,1fr) 20px;align-items:center;gap:9px;width:100%;min-height:57px;padding:6px 10px;border-radius:16px;text-align:left;cursor:pointer}.zoneLine .num{font-size:16px}.zoneLine b{display:block;font-size:14px;line-height:1.05}.zoneLine small{display:block;margin-top:1px;overflow:hidden;color:var(--muted);font-size:9.5px;line-height:1.05;text-overflow:ellipsis;white-space:nowrap}.zoneLine>ha-icon{color:var(--muted);--mdc-icon-size:20px}.zoneLine.running{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:color-mix(in srgb,var(--a) 7%,var(--card))}
        .intro{padding:6px 4px 13px}.intro p{margin-top:5px;font-size:13px;line-height:1.42}.titleRow{display:flex;align-items:center;justify-content:space-between;gap:10px}.readOnly,.auditBadge{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px;white-space:nowrap}.drillIntro{padding-top:8px}.zoneDetailStatus{display:flex;align-items:center;gap:14px;padding:17px;border-radius:22px}.zoneDetailStatusIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--a) 12%,var(--card));color:var(--a)}.zoneDetailStatusIcon ha-icon{--mdc-icon-size:25px}.zoneDetailStatus small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.zoneDetailStatus h2{margin:3px 0 1px;font-size:22px}.zoneDetailStatus.disabledState{opacity:.65}.detailCard{margin-top:10px;padding:16px;border-radius:22px}.detailCard h3{margin:0 0 12px;font-size:18px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detailGrid>div{min-width:0;padding:11px;border-radius:15px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.detailGrid b{display:block;margin-top:3px;font-size:13px;line-height:1.25;word-break:break-word}.lockedInfo{display:flex;gap:11px;margin-top:10px;padding:14px;border-radius:19px;background:color-mix(in srgb,var(--text) 3%,var(--card))}.lockedInfo>ha-icon{flex:0 0 auto;color:var(--muted);--mdc-icon-size:22px}.lockedInfo b{font-size:13px}.lockedInfo p{margin-top:4px;font-size:11px;line-height:1.42}.wideMore{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:50px;margin-top:10px;padding:0 15px;border-radius:18px;color:var(--a);font-weight:750;text-align:left}.wideMore ha-icon{--mdc-icon-size:22px}
        .manualCard{padding:16px;border-radius:22px}.manualHead{display:flex;align-items:center;justify-content:space-between}.manualHead small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.manualHead h3{margin:2px 0 0;font-size:19px}.manualHead>ha-icon{color:var(--a);--mdc-icon-size:28px}.manualZones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.manualZone{min-height:64px;border:1px solid var(--line);border-radius:17px;background:var(--soft);display:grid;place-items:center;align-content:center;gap:2px}.manualZone span{font-size:20px;font-weight:800}.manualZone small{color:var(--muted);font-size:10px}.manualZone.active{border-color:color-mix(in srgb,var(--a) 55%,var(--line));background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.manualDurationBlock{margin-top:18px}.manualDurationBlock>small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.durationStepper{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;gap:10px;margin-top:8px}.durationStepper button{display:grid;place-items:center;min-height:54px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.durationStepper button ha-icon{--mdc-icon-size:24px}.durationStepper>div{text-align:center}.durationStepper strong{font-size:34px;letter-spacing:-.04em}.durationStepper span{margin-left:5px;color:var(--muted);font-size:14px}.manualSummary{display:flex;justify-content:space-between;margin-top:15px;padding:12px 2px;border-top:1px solid var(--line);color:var(--muted)}.manualSummary b{color:var(--text)}.manualStart{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;margin-top:4px;border:0;border-radius:17px;background:var(--soft);color:var(--muted);font-weight:800;opacity:.8}.manualSafety{margin:9px 2px 0;color:var(--muted);font-size:10px;line-height:1.4}
        .settingsCard{overflow:hidden;border-radius:22px}.settingRow{display:grid;grid-template-columns:42px minmax(0,1fr) auto 20px;align-items:center;gap:10px;width:100%;min-height:68px;padding:8px 13px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.settingRow:last-child{border-bottom:0}.settingIcon{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;background:var(--soft);color:var(--a)}.settingIcon ha-icon{--mdc-icon-size:21px}.settingText{min-width:0}.settingText b{display:block;font-size:13px}.settingText small{display:block;margin-top:2px;overflow:hidden;color:var(--muted);font-size:10px;text-overflow:ellipsis;white-space:nowrap}.settingRow>strong{font-size:13px;text-align:right}.settingChevron{color:var(--muted);--mdc-icon-size:20px}.settingsLock{margin-top:10px}
        .diagnosticAction{display:grid;grid-template-columns:44px minmax(0,1fr) 22px;align-items:center;gap:11px;width:100%;min-height:70px;margin-bottom:10px;padding:10px 14px;border-radius:20px;text-align:left}.diagnosticActionIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.diagnosticActionIcon ha-icon{--mdc-icon-size:22px}.diagnosticAction b{display:block;font-size:14px}.diagnosticAction small{display:block;margin-top:2px;color:var(--muted);font-size:10px}.diagnosticAction>ha-icon{color:var(--muted);--mdc-icon-size:21px}.diag{overflow:hidden;border-radius:21px}.diag>button,.diag>div{display:grid;grid-template-columns:minmax(0,1fr) auto 22px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 14px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.diag>button:last-child,.diag>div:last-of-type{border-bottom:0}.diag span{color:var(--muted);font-size:12px}.diag b{font-size:12px;text-align:right}.diag ha-icon{color:var(--muted);--mdc-icon-size:20px}.diag .bad{color:var(--danger)}.diag+.diag{margin-top:9px}.infoBox,.zone8{padding:14px}.infoBox h3,.zone8 h3{margin:0 0 7px;font-size:17px}.infoBox>div,.zone8>div{min-height:34px;padding:0}.infoBox p,.zone8 p{margin-top:8px;font-size:11px;line-height:1.42}.zone8 pre{overflow-x:auto;margin:9px 0 0;padding:9px;border-radius:13px;background:var(--soft);color:var(--text);font-size:9px}
        .auditSummary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:hidden;border-radius:20px;margin-bottom:9px}.auditSummary>div{padding:13px 14px}.auditSummary>div+div{border-left:1px solid var(--line)}.auditSummary small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.auditSummary b{display:block;margin-top:3px;font-size:16px}.auditList{display:grid;grid-template-columns:1fr;gap:8px}.auditZone{width:100%;padding:13px 14px;border-radius:20px;text-align:left}.auditZoneTop{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px}.auditZoneTop .num{width:42px;height:42px}.auditZoneTop b{display:block;font-size:15px}.auditZoneTop small{display:block;margin-top:1px;color:var(--muted);font-size:10px}.auditPrimary{margin-top:10px;font-size:14px;font-weight:750}.auditSecondary{margin-top:3px;color:var(--muted);font-size:11px}.auditAnchor{margin-top:4px;color:var(--muted);font-size:10px}
        .bottomNav{position:fixed;z-index:10;right:0;bottom:0;left:0;width:100%;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 96%,transparent);border-top:1px solid var(--line);border-radius:0;box-shadow:none;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;max-width:860px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:4px;min-height:68px;border:0;border-radius:16px;background:transparent;color:var(--muted);font-size:12px;font-weight:750;cursor:pointer;box-shadow:none;transform:none}.bottomNav button ha-icon{--mdc-icon-size:28px}.bottomNav button.active{background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--a)}
        /* v0.4.3: occupy the full Overview field above navigation on iPhone Pro Max. */
        .overviewCompact .hero{padding:13px 15px;border-radius:19px}.overviewCompact .heroRow{gap:11px}.overviewCompact .orb{width:42px;height:42px}.overviewCompact .orb ha-icon{--mdc-icon-size:23px}.overviewCompact .hero small{font-size:8px}.overviewCompact .hero h1{font-size:21.5px}.overviewCompact .hero p{font-size:11.5px}
        .overviewCompact .chips{gap:6px;margin-top:7px}.overviewCompact .chip{min-height:52px;padding:8px;border-radius:15px}.overviewCompact .chip small{font-size:7.5px}.overviewCompact .chip strong{font-size:12.5px}
        .overviewCompact .next{min-height:60px;margin-top:7px;padding:9px 13px;border-radius:16px}.overviewCompact .next h2{font-size:16.5px}.overviewCompact .next p{font-size:10px}.overviewCompact .next>ha-icon{--mdc-icon-size:23px}
        .overviewCompact .sectionHead{margin:13px 3px 6px}.overviewCompact .sectionHead h2{font-size:22px}.overviewCompact .zoneList{gap:6px}.overviewCompact .zoneLine{grid-template-columns:42px minmax(0,1fr) 21px;gap:10px;min-height:67px;padding:7px 11px;border-radius:17px}.overviewCompact .zoneLine .num{width:42px;height:42px;font-size:17px}.overviewCompact .zoneLine b{font-size:14.5px}.overviewCompact .zoneLine small{font-size:10px;line-height:1.08}.overviewCompact .zoneLine>ha-icon{--mdc-icon-size:21px}
        @media(min-width:720px){.app{padding-right:22px;padding-left:22px}.auditList{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:420px){.app{padding-right:10px;padding-left:10px}.appHeader{grid-template-columns:74px minmax(0,1fr) 74px}.headerRight{width:74px}.chips{gap:4px}.chip{padding:7px 6px}.chip strong{font-size:11.5px}.bottomNav{padding-left:8px;padding-right:8px}.bottomNav button{min-height:66px;font-size:11.5px}.bottomNav button ha-icon{--mdc-icon-size:27px}.detailGrid{gap:6px}.manualZones{gap:6px}.settingRow{grid-template-columns:40px minmax(0,1fr) auto 18px;gap:8px}}
        @media(max-width:390px){.chips{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `;
    }

    render() {
      if (!this.shadowRoot) return;
      if (!this._view || !["overview", "manual", "settings", "diagnostics"].includes(this._view)) this._view = "overview";
      const header = this.header();
      if (!this._hass) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content"><section class="hero"><p>Загрузка данных…</p></section></main></div>${this.bottomNav()}`;
        this.bindActions();
        return;
      }
      const entities = this.entities();
      let content;
      if (this._drill?.type === "zone") content = this.zoneDetail(entities, this._drill.zone);
      else if (this._drill?.type === "program-audit") content = this.programAudit(entities);
      else if (this._view === "manual") content = this.manual(entities);
      else if (this._view === "settings") content = this.settings(entities);
      else if (this._view === "diagnostics") content = this.diagnostics(entities);
      else content = this.overview(entities);
      this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content">${content}</main></div>${this.bottomNav()}`;
      this.bindActions();
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
})();
