(() => {
  const UI_VERSION = "0.5.0";
  const FALLBACK_PARENT = "/dashboard-actions";
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);
  const VIEW_IDS = ["status", "zones", "program", "manual", "diagnostics"];

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._panel = null;
      this._view = "status";
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
        this._view = this._drill.parentView || "status";
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
        alarm: { clear: "Нет", false: "Нет", true: "Есть", active: "Есть" },
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
    updatedAge(entityId) {
      const obj = entityId ? this.states()[entityId] : null;
      const stamp = obj?.last_updated || obj?.last_changed;
      if (!stamp) return "Нет времени данных";
      const seconds = Math.max(0, Math.round((Date.now() - new Date(stamp).getTime()) / 1000));
      if (seconds < 60) return `Обновлено ${seconds} с назад`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `Обновлено ${minutes} мин назад`;
      const hours = Math.floor(minutes / 60);
      return `Обновлено ${hours} ч назад`;
    }

    header() {
      if (this._drill?.type === "zone") return this.headerTemplate(`Зона ${this._drill.zone}`, "HO-SC-8W · программа");
      if (this._drill?.type === "program-audit") return this.headerTemplate("Проверка программы", "HO-SC-8W · только просмотр", true);
      return this.headerTemplate("HO-SC-8W", `Система полива · UI v${UI_VERSION}`);
    }
    headerTemplate(title, subtitle, compact = false) {
      return `<header class="appHeader"><button class="headerButton backButton" data-back aria-label="Назад"><ha-icon icon="mdi:arrow-left"></ha-icon></button><div class="headerTitle ${compact ? "headerTitleCompact" : ""}"><strong>${this.esc(title)}</strong><small>${this.esc(subtitle)}</small></div><div class="headerRight" aria-hidden="true"></div></header>`;
    }
    bottomNav() {
      const tabs = [
        ["status", "mdi:home-outline", "Состояние"],
        ["zones", "mdi:sprinkler", "Зоны"],
        ["program", "mdi:calendar-clock", "Программа"],
        ["manual", "mdi:hand-back-right-outline", "Ручной"],
        ["diagnostics", "mdi:stethoscope", "Диагн."],
      ];
      return `<nav class="bottomNav" aria-label="Разделы Полив"><div class="bottomNavInner">${tabs.map(([view, icon, label]) => `<button class="${this._view === view ? "active" : ""}" data-view="${view}" aria-current="${this._view === view ? "page" : "false"}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</div></nav>`;
    }

    systemStatus(entities) {
      const connection = this.state(entities.connection);
      const operation = this.state(entities.operation);
      const activeValue = this.state(entities.active);
      const active = this.zoneSet(activeValue);
      const timerError = this.state(entities.timerError);
      const cache = this.state(entities.cache);
      if (this.bad(connection)) return { tone: "unreliable", icon: "mdi:help-circle-outline", title: "Состояние неизвестно", sub: "Нет достоверной связи с контроллером" };
      if (timerError === "active" || timerError === "true") return { tone: "warning", icon: "mdi:alert-outline", title: "Требуется внимание", sub: "Контроллер сообщает об ошибке таймера" };
      if (this.bad(activeValue)) return { tone: "unreliable", icon: "mdi:help-circle-outline", title: "Состояние неизвестно", sub: "Runtime-данные зон недоступны" };
      if (active.size) return { tone: "active", icon: "mdi:water", title: `Полив идёт · ${active.size === 1 ? `зона ${[...active][0]}` : `${active.size} зоны`}`, sub: "Контроллер выполняет текущую программу" };
      if (operation === "OFF") return { tone: "off", icon: "mdi:power", title: "Система выключена", sub: "Контроллер находится в режиме OFF" };
      if (operation === "Manual") return { tone: "ready", icon: "mdi:hand-back-right-outline", title: "Ручной режим", sub: "Контроллер готов к ручному поливу" };
      const cacheNote = cache === "partial" ? " · кэш программы неполный" : "";
      return { tone: "ready", icon: "mdi:check-circle-outline", title: "Система готова", sub: `Автополив работает штатно${cacheNote}` };
    }

    connectionBadge(entities) {
      const connection = this.state(entities.connection);
      let cls = "unknown", label = "Нет данных";
      if (connection === "local") { cls = "local"; label = "Локально"; }
      else if (connection === "cloud") { cls = "cloud"; label = "Облако"; }
      return `<div class="connectionWrap"><div class="connectionBadge ${cls}"><i></i><span>${this.esc(label)}</span></div><small>${this.esc(this.updatedAge(entities.connection))}</small></div>`;
    }

    zoneVisual(zone) {
      const icons = { 1: "mdi:sprinkler", 2: "mdi:water-pump", 3: "mdi:flower", 4: "mdi:greenhouse", 5: "mdi:sprout", 6: "mdi:pine-tree" };
      return icons[zone] || "mdi:water";
    }

    zoneRuntime(entities, zone) {
      const q = entities.zones[zone];
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const scheduleState = this.state(q.schedule);
      const attrs = this.attrs(q.schedule);
      const isActive = active.has(String(zone));
      const isQueued = queued.has(String(zone));
      let stateClass = "ready", label = "Готова";
      if (isActive) { stateClass = "running"; label = `Полив · ${this.state(q.remaining)} мин`; }
      else if (isQueued) { stateClass = "queued"; label = "В очереди"; }
      else if (scheduleState === "disabled") { stateClass = "off"; label = "Выключена"; }
      else if (this.bad(scheduleState)) { stateClass = "unknown"; label = "Нет данных"; }
      const duration = attrs.duration_min ?? attrs.duration_minutes ?? "—";
      return { stateClass, label, duration, starts: this.compactStarts(attrs), scheduleState, attrs, entity: q.schedule };
    }

    irrigationDiagram(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const linePath = (zone, y, x) => {
        const cls = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "idle";
        return `<path class="pipe ${cls}" d="M ${x} 248 C ${x + 20} 248, 620 ${y}, 664 ${y}"/>`;
      };
      const zoneYs = [102, 170, 238, 306, 374, 442];
      const valveXs = [352, 392, 432, 472, 512, 552];
      const zones = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const info = this.zoneRuntime(entities, zone);
        zones.push(`<button class="diagramZone ${info.stateClass}" data-zone-detail="${zone}" data-entity="${this.esc(info.entity)}"><span class="zoneIcon"><ha-icon icon="${this.zoneVisual(zone)}"></ha-icon></span><span class="zoneCopy"><b>Зона ${zone}</b><small>${this.esc(info.label)}</small></span><span class="zoneDuration">${this.esc(info.duration)}<small>мин</small></span></button>`);
      }
      const valves = valveXs.map((x, idx) => {
        const zone = idx + 1;
        const cls = active.has(String(zone)) ? "running" : queued.has(String(zone)) ? "queued" : "";
        return `<span class="valve ${cls}" title="Зона ${zone}"><i></i><b>${zone}</b></span>`;
      }).join("");
      return `<div class="systemDiagram">
        <svg class="pipes" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
          <path class="pipe supply" d="M 210 260 C 260 260, 282 248, 330 248"/>
          ${valveXs.map((x, idx) => linePath(idx + 1, zoneYs[idx], x)).join("")}
          <path class="pipe sensor" d="M 536 90 L 536 208"/>
          <path class="pipe idle" d="M 210 310 C 235 425, 360 478, 510 478"/>
        </svg>
        <div class="controllerGraphic" data-entity="${this.esc(entities.connection)}"><div class="controllerTop"></div><div class="controllerBody"><span>HO-SC-8W</span><i class="controllerLed"></i><small>INKBIRD / HiOazo</small></div><div class="controllerPorts"><i></i><i></i></div></div>
        <div class="controllerOk ${this.bad(this.state(entities.connection)) ? "bad" : ""}"><ha-icon icon="${this.bad(this.state(entities.connection)) ? "mdi:help" : "mdi:check"}"></ha-icon></div>
        <div class="rainNode" data-entity="${this.esc(entities.rain)}"><ha-icon icon="mdi:weather-rainy"></ha-icon><span>Учёт дождя</span><b>${this.esc(this.human("rain", this.state(entities.rain)))}</b></div>
        <div class="manifold"><div class="manifoldRail"></div><div class="valves">${valves}</div></div>
        <div class="zoneStack">${zones.join("")}</div>
        <div class="mainlineUnknown"><ha-icon icon="mdi:pipe-valve"></ha-icon><span>Магистраль</span><b>Нет датчика</b></div>
      </div>`;
    }

    heroMetrics(entities) {
      const activeValue = this.state(entities.active);
      const activeCount = this.bad(activeValue) ? "—" : this.zoneSet(activeValue).size;
      const seasonal = this.state(entities.seasonal);
      const operation = this.state(entities.operation);
      const rain = this.state(entities.rain);
      const metrics = [
        ["mdi:home-automation", "Режим", this.human("operation", operation), entities.operation, operation === "Auto" ? "good" : ""],
        ["mdi:sprinkler", "Активные зоны", activeCount, entities.active, activeCount === 0 ? "" : "active"],
        ["mdi:percent-outline", "Сезонная коррекция", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, entities.seasonal, ""],
        ["mdi:weather-rainy", "Учёт дождя", this.human("rain", rain), entities.rain, rain === "enabled" ? "good" : ""],
      ];
      return `<div class="heroMetrics">${metrics.map(([icon,label,value,id,tone]) => `<button class="metricTile ${tone}" data-entity="${this.esc(id)}"><ha-icon icon="${icon}"></ha-icon><span><small>${this.esc(label)}</small><b>${this.esc(value)}</b></span></button>`).join("")}</div>`;
    }

    nextStrip(entities) {
      if (this.bad(this.state(entities.connection))) return "";
      const next = this.nextWatering(entities);
      if (!next) return `<div class="nextStrip"><ha-icon icon="mdi:calendar-question"></ha-icon><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><b>Расчёт недоступен</b><span>Для текущего режима программы недостаточно декодированных данных</span></div></div>`;
      return `<div class="nextStrip"><ha-icon icon="mdi:calendar-clock"></ha-icon><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><b>${this.esc(this.relativeDay(next.when))} · ${this.esc(next.time)} · зона ${next.zone}</b><span>База ${this.esc(next.duration)} мин · ${this.esc(this.rainText(next.rain, true))}</span></div></div>`;
    }

    statusHero(entities) {
      const status = this.systemStatus(entities);
      return `<section class="systemHero ${status.tone}"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionBadge(entities)}</div>${this.irrigationDiagram(entities)}${this.heroMetrics(entities)}${this.nextStrip(entities)}</section>`;
    }

    nodeTile(icon, title, value, note, entityId, tone = "") {
      return `<button class="nodeTile ${tone}" ${entityId ? `data-entity="${this.esc(entityId)}"` : ""}><ha-icon icon="${icon}"></ha-icon><span><small>${this.esc(title)}</small><b>${this.esc(value)}</b>${note ? `<em>${this.esc(note)}</em>` : ""}</span></button>`;
    }

    systemNodes(entities) {
      const connection = this.state(entities.connection);
      const z8 = this.state(entities.zones[8].schedule);
      const z8Text = this.bad(z8) ? "Нет данных" : this.zoneStateText(z8);
      const controllerText = this.bad(connection) ? "Нет связи" : connection === "local" ? "Онлайн" : connection === "cloud" ? "Облако" : connection;
      return `<section class="sectionCard"><div class="sectionLabel">ОСНОВНЫЕ УЗЛЫ</div><div class="nodeGrid">
        ${this.nodeTile("mdi:memory", "Контроллер", controllerText, connection === "local" ? "Локальный канал" : "", entities.connection, this.bad(connection) ? "bad" : "good")}
        ${this.nodeTile("mdi:pipe-valve", "Клапаны", "6 каналов", "Зоны 1–6", null, "good")}
        ${this.nodeTile("mdi:water-pump", "Магистраль", "Нет датчика", "Не вычисляется", null, "unknown")}
        ${this.nodeTile("mdi:clipboard-text-outline", "Зона 8", z8Text, "Лабораторная", entities.zones[8].schedule, this.bad(z8) ? "unknown" : "")}
      </div></section>`;
    }

    modeTile(icon, label, caption, active, entityId) {
      return `<button class="modeTile ${active ? "active" : ""}" data-entity="${this.esc(entityId)}"><ha-icon icon="${icon}"></ha-icon><b>${this.esc(label)}</b><small>${this.esc(caption)}</small></button>`;
    }
    currentMode(entities) {
      const operation = this.state(entities.operation);
      const seasonal = this.state(entities.seasonal);
      return `<section class="sectionCard"><div class="sectionLabel">ТЕКУЩИЙ РЕЖИМ</div><div class="modeGrid">
        ${this.modeTile("mdi:home-automation", "Авто", operation === "Auto" ? "Сейчас активно" : "Режим контроллера", operation === "Auto", entities.operation)}
        ${this.modeTile("mdi:hand-back-right-outline", "Ручной", operation === "Manual" ? "Сейчас активно" : "Только просмотр", operation === "Manual", entities.operation)}
        ${this.modeTile("mdi:power", "Выключен", operation === "OFF" ? "Сейчас активно" : "Режим OFF", operation === "OFF", entities.operation)}
        ${this.modeTile("mdi:leaf", "Сезон", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, false, entities.seasonal)}
      </div></section>`;
    }

    statusView(entities) { return `${this.statusHero(entities)}${this.systemNodes(entities)}${this.currentMode(entities)}`; }

    zonesView(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const cards = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const q = entities.zones[zone];
        const info = this.zoneRuntime(entities, zone);
        const remaining = this.state(q.remaining);
        const elapsed = this.state(q.elapsed);
        cards.push(`<button class="zoneCard ${info.stateClass}" data-zone-detail="${zone}" data-entity="${this.esc(q.schedule)}"><div class="zoneCardTop"><span class="zoneBigIcon"><ha-icon icon="${this.zoneVisual(zone)}"></ha-icon></span><span><small>ЗОНА ${zone}</small><b>${this.esc(info.label)}</b></span><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></div><div class="zoneFacts"><div><small>Программа</small><b>${this.esc(info.duration)} мин</b></div><div><small>Старт</small><b>${this.esc(info.starts)}</b></div><div><small>Прошло</small><b>${this.bad(elapsed) ? "—" : `${this.esc(elapsed)} мин`}</b></div><div><small>Осталось</small><b>${this.bad(remaining) ? "—" : `${this.esc(remaining)} мин`}</b></div></div>${active.has(String(zone)) ? `<div class="zoneLive"><i></i><span>Полив выполняется</span></div>` : queued.has(String(zone)) ? `<div class="zoneLive queue"><i></i><span>Ожидает запуска</span></div>` : ""}</button>`);
      }
      return `<div class="pageIntro"><small>ЗОНЫ 1–6</small><h2>Рабочие зоны</h2><p>Фактическая программа и runtime-состояние каждого канала.</p></div><div class="zoneCards">${cards.join("")}</div>`;
    }

    zoneDetail(entities, zone) {
      const q = entities.zones[zone], id = q.schedule, st = this.state(id), a = this.attrs(id), starts = this.starts(a), seasonal = this.state(entities.seasonal);
      const enabled = st === "configured";
      return `<div class="pageIntro drillIntro"><div class="titleRow"><div><small>ЗОНА ${zone}</small><h2>Программа зоны</h2></div><span class="readOnly">Только просмотр</span></div><p>Фактические параметры DP38, сохранённые контроллером.</p></div><section class="zoneDetailStatus ${enabled ? "enabled" : "disabledState"}"><div class="zoneDetailStatusIcon"><ha-icon icon="${enabled ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"}"></ha-icon></div><div><small>СОСТОЯНИЕ ПРОГРАММЫ</small><h2>${this.esc(this.zoneStateText(st))}</h2><p>Зона ${zone}</p></div></section><section class="detailCard"><h3>Расписание</h3><div class="detailGrid"><div><small>Базовая длительность</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Старт</small><b>${this.esc(starts.length ? starts.join(" · ") : "—")}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Начало цикла</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div><div><small>Дождь</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></div><div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div></div></section><section class="lockedInfo"><ha-icon icon="mdi:lock-outline"></ha-icon><div><b>Редактирование пока не опубликовано</b><p>Запись появится только через проверенный API интеграции после безопасного DP38 write-gate.</p></div></section><button class="wideMore" data-entity="${this.esc(id)}"><span>Подробнее в Home Assistant</span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
    }

    programCard(label, value, note, icon, entityId) {
      return `<button class="programMetric" data-entity="${this.esc(entityId)}"><ha-icon icon="${icon}"></ha-icon><span><small>${this.esc(label)}</small><b>${this.esc(value)}</b>${note ? `<em>${this.esc(note)}</em>` : ""}</span></button>`;
    }
    programView(entities) {
      const seasonal = this.state(entities.seasonal);
      const rain = this.state(entities.rain);
      const cache = this.state(entities.cache);
      return `<div class="pageIntro"><small>ПРОГРАММА</small><h2>Автоматический полив</h2><p>Контроллер-resident DP38 · чтение без записи.</p></div><div class="programMetrics">
        ${this.programCard("Режим", this.human("operation", this.state(entities.operation)), "Auto / Manual / OFF", "mdi:autorenew", entities.operation)}
        ${this.programCard("Сезонная коррекция", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, "Общая для всех зон", "mdi:percent-outline", entities.seasonal)}
        ${this.programCard("Учёт дождя", this.human("rain", rain), "Глобальное разрешение", "mdi:weather-rainy", entities.rain)}
        ${this.programCard("Кэш DP38", this.human("cache", cache), "Read-only snapshot", "mdi:database-check-outline", entities.cache)}
      </div>${this.nextStrip(entities)}${this.programAudit(entities)}`;
    }

    programAudit(entities) {
      const cards = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule, st = this.state(id), a = this.attrs(id), starts = this.starts(a);
        cards.push(`<button class="auditZone" data-zone-detail="${zone}" data-entity="${this.esc(id)}"><div class="auditZoneTop"><span class="num">${zone}</span><div><b>Зона ${zone}</b><small>${this.esc(this.zoneStateText(st))}</small></div><span class="auditBadge">${this.esc(a.duration_min ?? "—")} мин</span></div><div class="auditPrimary">${this.esc(starts.length ? starts.join(" · ") : "—")}</div><div class="auditSecondary">${this.esc(this.cycleText(a))} · ${this.esc(this.rainText(a.rain_sensor_follow))}</div><div class="auditAnchor">Начало цикла: ${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</div></button>`);
      }
      return `<section class="programAudit"><div class="sectionLabel">ЗОНЫ 1–6</div><div class="auditList">${cards.join("")}</div></section>`;
    }

    manualView(entities) {
      const zoneButtons = [];
      for (let zone = 1; zone <= 6; zone += 1) zoneButtons.push(`<button class="manualZone ${this._manualZone === zone ? "active" : ""}" data-manual-zone="${zone}"><span>${zone}</span><small>Зона ${zone}</small></button>`);
      const controllerBusy = this.zoneSet(this.state(entities.active)).size > 0;
      return `<div class="pageIntro"><small>РУЧНОЙ ПОЛИВ</small><h2>Подготовка запуска</h2><p>Зона и длительность выбираются локально в интерфейсе. Команда запуска пока заблокирована.</p></div><section class="manualCard"><div class="manualHead"><div><small>ЗОНА</small><h3>Выбери канал</h3></div><ha-icon icon="mdi:watering-can-outline"></ha-icon></div><div class="manualZones">${zoneButtons.join("")}</div><div class="manualDurationBlock"><small>ДЛИТЕЛЬНОСТЬ</small><div class="durationStepper"><button data-duration-step="-1" aria-label="Уменьшить время"><ha-icon icon="mdi:minus"></ha-icon></button><div><strong>${this._manualDuration}</strong><span>мин</span></div><button data-duration-step="1" aria-label="Увеличить время"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="manualSummary"><span>Зона ${this._manualZone}</span><b>${this._manualDuration} мин</b></div><button class="manualStart" disabled><ha-icon icon="mdi:play"></ha-icon><span>${controllerBusy ? "Контроллер занят" : "Запуск пока недоступен"}</span></button><p class="manualSafety"><ha-icon icon="mdi:shield-lock-outline"></ha-icon><span>Панель не отправляет raw DP45 и не имитирует неподтверждённое управление.</span></p></section>`;
    }

    diagnosticsView(entities) {
      const rows = [["Активное соединение", entities.connection, this.state(entities.connection), ""],["Режим контроллера", entities.operation, this.state(entities.operation), "operation"],["Порядок полива", entities.irrigation, this.state(entities.irrigation), "irrigation"],["Активные зоны", entities.active, this.state(entities.active), "zones"],["Очередь зон", entities.queued, this.state(entities.queued), "zones"],["Кэш расписания", entities.cache, this.state(entities.cache), "cache"],["Учёт дождя", entities.rain, this.state(entities.rain), "rain"],["Ошибка таймера", entities.timerError, this.state(entities.timerError), "alarm"]];
      const rowHtml = rows.map(([label,id,value,kind]) => `<button data-entity="${this.esc(id)}"><span>${this.esc(label)}</span><b class="${this.bad(value) ? "bad" : ""}">${this.esc(kind ? this.human(kind,value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("");
      const z8 = entities.zones[8].schedule, a8 = this.attrs(z8);
      return `<div class="pageIntro"><small>ДИАГНОСТИКА</small><h2>Достоверность данных</h2><p>Транспорт, кэш программы и лабораторная зона 8.</p></div><button class="diagnosticAction" data-drill="program-audit"><span class="diagnosticActionIcon"><ha-icon icon="mdi:clipboard-check-outline"></ha-icon></span><span><b>Проверка программы</b><small>Сверить параметры зон 1–6</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="diag diagnosticRows">${rowHtml}</section><section class="diag infoBox"><h3>Панель</h3><div><span>UI</span><b>v${UI_VERSION}</b></div><div><span>Frontend</span><b>self-contained bundle</b></div><div><span>Raw write</span><b>Отсутствует</b></div></section><section class="diag infoBox"><h3>Магистраль / главный клапан</h3><div><span>Источник состояния</span><b>Не подтверждён</b></div><p>Панель не вычисляет состояние магистрали или главного клапана по косвенным признакам.</p></section><section class="diag zone8"><h3>Зона 8 · лабораторная</h3><div><span>Состояние</span><b>${this.esc(this.zoneStateText(this.state(z8)))}</b></div><div><span>Источник кэша</span><b>${this.esc(a8.cache_source ?? "—")}</b></div><pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre><p>Зона 8 не является пользовательской зоной. Raw-write из панели отсутствует.</p></section>`;
    }

    programAuditDrill(entities) {
      return `<div class="pageIntro drillIntro"><small>ПРОВЕРКА ПРОГРАММЫ</small><h2>DP38 · зоны 1–6</h2><p>Контрольный снимок декодированной программы. Здесь ничего не редактируется.</p></div>${this.programAudit(entities)}`;
    }

    bindActions() {
      this.shadowRoot.querySelector("[data-back]")?.addEventListener("click", () => this.goBack());
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { this._drill = null; this._view = button.dataset.view || "status"; this.render(); window.scrollTo({ top: 0, behavior: "auto" }); }));
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
            this._drill = { type: "zone", zone: zoneDetail, parentView: this._view };
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
        :host{--a:var(--primary-color,#08a0cf);--green:#20a44b;--orange:#f59e0b;--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#f7f8fa);--text:var(--primary-text-color,#17191c);--muted:var(--secondary-text-color,#6d7176);--line:color-mix(in srgb,var(--text) 11%,transparent);--soft:color-mix(in srgb,var(--text) 4.5%,var(--card));--danger:var(--error-color,#d84040);display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}*{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent;cursor:pointer}.app{max-width:900px;min-height:100vh;margin:0 auto;padding:0 14px calc(116px + env(safe-area-inset-bottom))}.appHeader{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:52px minmax(0,1fr) 52px;align-items:center;gap:8px;min-height:68px;padding:calc(7px + env(safe-area-inset-top)) 0 7px;background:color-mix(in srgb,var(--bg) 96%,transparent);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid color-mix(in srgb,var(--text) 6%,transparent)}.headerButton{display:grid;place-items:center;width:52px;min-height:46px;padding:0;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--card) 94%,transparent);box-shadow:0 6px 18px #0000000a;color:var(--text)}.headerButton ha-icon{--mdc-icon-size:25px}.headerTitle{min-width:0;text-align:center}.headerTitle strong{display:block;font-size:22px;line-height:1.03;letter-spacing:-.035em;white-space:nowrap}.headerTitle small{display:block;margin-top:3px;overflow:hidden;color:var(--muted);font-size:10px;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}.headerTitleCompact strong{font-size:17px}.headerRight{width:52px;min-height:46px}.content{padding-top:9px}
        .systemHero,.sectionCard,.zoneCard,.zoneDetailStatus,.detailCard,.lockedInfo,.manualCard,.programMetric,.programAudit,.auditZone,.diagnosticAction,.wideMore,.diag{background:var(--card);border:1px solid var(--line);box-shadow:0 8px 28px #00000008}.systemHero{position:relative;overflow:hidden;padding:16px;border-radius:26px;background:linear-gradient(145deg,var(--card) 0%,var(--card) 70%,color-mix(in srgb,var(--a) 7%,var(--card)) 100%)}.systemHero.ready{border-color:color-mix(in srgb,var(--green) 16%,var(--line))}.systemHero.active{border-color:color-mix(in srgb,var(--a) 35%,var(--line))}.systemHero.warning{border-color:color-mix(in srgb,var(--orange) 35%,var(--line))}.systemHero.unreliable{border-color:color-mix(in srgb,var(--muted) 34%,var(--line))}.heroHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.heroHead>div:first-child{min-width:0}.heroHead small,.pageIntro>small,.sectionLabel{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.heroHead h1{margin:5px 0 3px;font-size:29px;line-height:.98;letter-spacing:-.045em}.heroHead p{margin:0;color:var(--muted);font-size:13px;line-height:1.35}.connectionWrap{flex:0 0 auto;text-align:right}.connectionBadge{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:99px;background:var(--soft);font-weight:800;font-size:13px}.connectionBadge i{width:9px;height:9px;border-radius:50%;background:var(--muted)}.connectionBadge.local{background:color-mix(in srgb,var(--green) 10%,var(--card));color:var(--green)}.connectionBadge.local i{background:var(--green)}.connectionBadge.cloud{background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.connectionBadge.cloud i{background:var(--a)}.connectionWrap>small{display:block;margin-top:5px;color:var(--muted);font-size:8px}
        .systemDiagram{position:relative;min-height:338px;margin-top:12px;border-radius:22px;background:linear-gradient(180deg,color-mix(in srgb,var(--a) 2%,var(--card)),color-mix(in srgb,var(--green) 1.5%,var(--card)));border:1px solid color-mix(in srgb,var(--text) 5%,transparent);overflow:hidden}.pipes{position:absolute;inset:0;width:100%;height:100%;z-index:0}.pipe{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.pipe.idle{stroke:#cbd5e1}.pipe.run,.pipe.supply{stroke:var(--a)}.pipe.queue{stroke:var(--orange)}.pipe.sensor{stroke:#aab4bf;stroke-width:3;stroke-dasharray:8 7}.controllerGraphic{position:absolute;z-index:2;left:3%;top:25%;width:19%;height:45%;min-width:74px;border-radius:13px;background:linear-gradient(180deg,#f8fafc,#e8edf2);border:1px solid #cbd3dc;box-shadow:0 9px 18px #00000018;overflow:hidden}.controllerTop{height:12%;background:linear-gradient(180deg,#fff,#e7ebef);border-bottom:1px solid #ccd4dc}.controllerBody{position:relative;height:76%;display:grid;place-items:center;align-content:center;gap:7px;color:#48515c}.controllerBody span{font-size:11px;font-weight:800}.controllerBody small{font-size:6.5px;color:#7b8590}.controllerLed{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px #20a44b1c}.controllerPorts{display:flex;justify-content:center;gap:18px;height:12%;border-top:1px solid #ccd4dc;background:#dfe5ea}.controllerPorts i{width:9px;height:11px;background:#28313a;border-radius:0 0 4px 4px}.controllerOk{position:absolute;z-index:3;left:17.5%;top:23%;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--green);color:white;box-shadow:0 4px 10px #00000020}.controllerOk.bad{background:var(--muted)}.controllerOk ha-icon{--mdc-icon-size:17px}.rainNode{position:absolute;z-index:2;left:49%;top:3%;display:grid;grid-template-columns:30px 1fr;grid-template-rows:auto auto;align-items:center;width:22%;min-width:105px;padding:7px 8px;border-radius:13px;background:color-mix(in srgb,var(--card) 94%,transparent);border:1px solid var(--line)}.rainNode ha-icon{grid-row:1/3;color:var(--a);--mdc-icon-size:25px}.rainNode span{font-size:8px;color:var(--muted)}.rainNode b{font-size:10px}.manifold{position:absolute;z-index:2;left:27%;top:39%;width:31%;height:28%}.manifoldRail{position:absolute;left:0;right:0;top:51%;height:17px;border-radius:8px;background:linear-gradient(180deg,#49515a,#252b31);box-shadow:0 5px 9px #00000020}.valves{position:absolute;left:2%;right:2%;top:0;display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.valve{position:relative;display:grid;justify-items:center;gap:2px;color:var(--muted)}.valve:before{content:"";width:12px;height:43px;border-radius:6px;background:linear-gradient(180deg,#303942,#161b20);border:1px solid #111}.valve i{position:absolute;top:-5px;width:18px;height:9px;border-radius:5px;background:#46515a;box-shadow:inset 0 0 0 2px #222}.valve b{font-size:8px}.valve.running:before,.valve.running i{box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 55%,transparent);background:linear-gradient(180deg,#2b6e88,#113c4e)}.valve.queued:before,.valve.queued i{box-shadow:0 0 0 2px color-mix(in srgb,var(--orange) 45%,transparent)}.zoneStack{position:absolute;z-index:2;right:2.5%;top:8.5%;width:35%;display:grid;gap:5px}.diagramZone{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:6px;min-height:44px;padding:5px 7px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--card) 95%,transparent);text-align:left;box-shadow:0 3px 8px #00000006}.diagramZone.running{border-color:color-mix(in srgb,var(--a) 55%,var(--line));background:color-mix(in srgb,var(--a) 8%,var(--card))}.diagramZone.queued{border-color:color-mix(in srgb,var(--orange) 45%,var(--line))}.diagramZone.off,.diagramZone.unknown{opacity:.65}.zoneIcon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:color-mix(in srgb,var(--green) 8%,var(--soft));color:var(--green)}.zoneIcon ha-icon{--mdc-icon-size:17px}.zoneCopy{min-width:0}.zoneCopy b{display:block;font-size:10px;line-height:1}.zoneCopy small{display:block;margin-top:2px;overflow:hidden;color:var(--muted);font-size:7.5px;text-overflow:ellipsis;white-space:nowrap}.zoneDuration{font-size:11px;font-weight:850;text-align:right}.zoneDuration small{display:block;font-size:6px;color:var(--muted);font-weight:600}.mainlineUnknown{position:absolute;z-index:2;left:34%;bottom:2.5%;display:grid;grid-template-columns:28px auto;grid-template-rows:auto auto;align-items:center;gap:0 7px;padding:6px 10px;border-radius:13px;background:color-mix(in srgb,var(--card) 94%,transparent);border:1px solid var(--line)}.mainlineUnknown ha-icon{grid-row:1/3;color:var(--muted);--mdc-icon-size:23px}.mainlineUnknown span{font-size:7px;color:var(--muted)}.mainlineUnknown b{font-size:9px;color:var(--muted)}
        .heroMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.metricTile{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:7px;min-height:64px;padding:8px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--card) 96%,transparent);text-align:left}.metricTile ha-icon{color:var(--muted);--mdc-icon-size:26px}.metricTile span{min-width:0}.metricTile small{display:block;color:var(--muted);font-size:7.5px;line-height:1.05}.metricTile b{display:block;margin-top:3px;overflow:hidden;font-size:14px;line-height:1.05;text-overflow:ellipsis;white-space:nowrap}.metricTile.good b,.metricTile.good ha-icon{color:var(--green)}.metricTile.active b,.metricTile.active ha-icon{color:var(--a)}.nextStrip{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:center;margin-top:9px;padding:10px 12px;border-radius:17px;background:var(--soft)}.nextStrip>ha-icon{color:var(--a);--mdc-icon-size:27px}.nextStrip small{display:block;color:var(--muted);font-size:7.5px;font-weight:800;letter-spacing:.09em}.nextStrip b{display:block;margin-top:2px;font-size:13px}.nextStrip span{display:block;margin-top:2px;color:var(--muted);font-size:9px}
        .sectionCard{margin-top:11px;padding:15px;border-radius:24px}.sectionLabel{margin:0 0 10px 2px}.nodeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.nodeTile{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:7px;min-height:72px;padding:9px;border:1px solid var(--line);border-radius:17px;background:var(--card);text-align:left}.nodeTile>ha-icon{color:var(--muted);--mdc-icon-size:27px}.nodeTile small{display:block;color:var(--muted);font-size:7.5px}.nodeTile b{display:block;margin-top:2px;font-size:13px;line-height:1.05}.nodeTile em{display:block;margin-top:3px;color:var(--muted);font-size:7.5px;font-style:normal}.nodeTile.good b,.nodeTile.good>ha-icon{color:var(--green)}.nodeTile.bad b,.nodeTile.bad>ha-icon{color:var(--danger)}.nodeTile.unknown{opacity:.72}.modeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.modeTile{display:grid;place-items:center;align-content:center;min-height:92px;padding:9px;border:1px solid var(--line);border-radius:19px;background:var(--card);text-align:center}.modeTile ha-icon{color:var(--muted);--mdc-icon-size:31px}.modeTile b{margin-top:6px;font-size:14px}.modeTile small{margin-top:3px;color:var(--muted);font-size:8px}.modeTile.active{border-color:color-mix(in srgb,var(--a) 62%,var(--line));background:color-mix(in srgb,var(--a) 6%,var(--card))}.modeTile.active ha-icon,.modeTile.active b,.modeTile.active small{color:var(--a)}
        .pageIntro{padding:6px 4px 14px}.pageIntro h2{margin:4px 0 0;font-size:25px;line-height:1.02;letter-spacing:-.04em}.pageIntro p{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.42}.titleRow{display:flex;align-items:center;justify-content:space-between;gap:10px}.readOnly,.auditBadge{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px;white-space:nowrap}.zoneCards{display:grid;grid-template-columns:1fr;gap:9px}.zoneCard{width:100%;padding:13px;border-radius:22px;text-align:left}.zoneCard.running{border-color:color-mix(in srgb,var(--a) 45%,var(--line));background:linear-gradient(135deg,var(--card),color-mix(in srgb,var(--a) 7%,var(--card)))}.zoneCard.queued{border-color:color-mix(in srgb,var(--orange) 45%,var(--line))}.zoneCard.off,.zoneCard.unknown{opacity:.7}.zoneCardTop{display:grid;grid-template-columns:48px minmax(0,1fr) 24px;align-items:center;gap:10px}.zoneBigIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:color-mix(in srgb,var(--green) 8%,var(--soft));color:var(--green)}.zoneBigIcon ha-icon{--mdc-icon-size:27px}.zoneCardTop small{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.08em}.zoneCardTop b{display:block;margin-top:3px;font-size:17px}.zoneCardTop .chev{color:var(--muted)}.zoneFacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:11px}.zoneFacts>div{padding:8px;border-radius:13px;background:var(--soft)}.zoneFacts small{display:block;color:var(--muted);font-size:7px}.zoneFacts b{display:block;margin-top:2px;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.zoneLive{display:flex;align-items:center;gap:7px;margin-top:9px;color:var(--a);font-size:10px;font-weight:750}.zoneLive i{width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 12%,transparent)}.zoneLive.queue{color:var(--orange)}.zoneLive.queue i{background:var(--orange);box-shadow:0 0 0 4px color-mix(in srgb,var(--orange) 12%,transparent)}
        .zoneDetailStatus{display:flex;align-items:center;gap:14px;padding:17px;border-radius:22px}.zoneDetailStatusIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--a) 12%,var(--card));color:var(--a)}.zoneDetailStatusIcon ha-icon{--mdc-icon-size:25px}.zoneDetailStatus small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.zoneDetailStatus h2{margin:3px 0 1px;font-size:22px}.zoneDetailStatus p{margin:0;color:var(--muted)}.zoneDetailStatus.disabledState{opacity:.65}.detailCard{margin-top:10px;padding:16px;border-radius:22px}.detailCard h3{margin:0 0 12px;font-size:18px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detailGrid>div{min-width:0;padding:11px;border-radius:15px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.detailGrid b{display:block;margin-top:3px;font-size:13px;line-height:1.25;word-break:break-word}.lockedInfo{display:flex;gap:11px;margin-top:10px;padding:14px;border-radius:19px;background:color-mix(in srgb,var(--text) 3%,var(--card))}.lockedInfo>ha-icon{flex:0 0 auto;color:var(--muted);--mdc-icon-size:22px}.lockedInfo b{font-size:13px}.lockedInfo p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.42}.wideMore{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:50px;margin-top:10px;padding:0 15px;border-radius:18px;color:var(--a);font-weight:750;text-align:left}
        .programMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.programMetric{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:9px;min-height:72px;padding:10px 12px;border-radius:19px;text-align:left}.programMetric>ha-icon{color:var(--a);--mdc-icon-size:26px}.programMetric small{display:block;color:var(--muted);font-size:8px}.programMetric b{display:block;margin-top:2px;font-size:14px}.programMetric em{display:block;margin-top:2px;color:var(--muted);font-size:8px;font-style:normal}.programAudit{margin-top:10px;padding:13px;border-radius:22px}.auditList{display:grid;grid-template-columns:1fr;gap:8px}.auditZone{width:100%;padding:13px 14px;border-radius:18px;text-align:left;box-shadow:none}.auditZoneTop{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px}.num{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a);font-weight:800}.auditZoneTop b{display:block;font-size:15px}.auditZoneTop small{display:block;margin-top:1px;color:var(--muted);font-size:10px}.auditPrimary{margin-top:10px;font-size:14px;font-weight:750}.auditSecondary{margin-top:3px;color:var(--muted);font-size:11px}.auditAnchor{margin-top:4px;color:var(--muted);font-size:10px}
        .manualCard{padding:16px;border-radius:22px}.manualHead{display:flex;align-items:center;justify-content:space-between}.manualHead small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.manualHead h3{margin:2px 0 0;font-size:19px}.manualHead>ha-icon{color:var(--a);--mdc-icon-size:28px}.manualZones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.manualZone{min-height:64px;border:1px solid var(--line);border-radius:17px;background:var(--soft);display:grid;place-items:center;align-content:center;gap:2px}.manualZone span{font-size:20px;font-weight:800}.manualZone small{color:var(--muted);font-size:10px}.manualZone.active{border-color:color-mix(in srgb,var(--a) 55%,var(--line));background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.manualDurationBlock{margin-top:18px}.manualDurationBlock>small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.durationStepper{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;gap:10px;margin-top:8px}.durationStepper button{display:grid;place-items:center;min-height:54px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.durationStepper>div{text-align:center}.durationStepper strong{font-size:34px;letter-spacing:-.04em}.durationStepper span{margin-left:5px;color:var(--muted);font-size:14px}.manualSummary{display:flex;justify-content:space-between;margin-top:15px;padding:12px 2px;border-top:1px solid var(--line);color:var(--muted)}.manualSummary b{color:var(--text)}.manualStart{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;margin-top:4px;border:0;border-radius:17px;background:var(--soft);color:var(--muted);font-weight:800;opacity:.8;cursor:not-allowed}.manualSafety{display:flex;align-items:flex-start;gap:7px;margin:10px 2px 0;color:var(--muted);font-size:10px;line-height:1.4}.manualSafety ha-icon{flex:0 0 auto;--mdc-icon-size:17px}
        .diagnosticAction{display:grid;grid-template-columns:44px minmax(0,1fr) 22px;align-items:center;gap:11px;width:100%;min-height:70px;margin-bottom:10px;padding:10px 14px;border-radius:20px;text-align:left}.diagnosticActionIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.diagnosticActionIcon ha-icon{--mdc-icon-size:22px}.diagnosticAction b{display:block;font-size:14px}.diagnosticAction small{display:block;margin-top:2px;color:var(--muted);font-size:10px}.diag{overflow:hidden;border-radius:21px}.diag>button,.diag>div{display:grid;grid-template-columns:minmax(0,1fr) auto 22px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 14px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.diag>button:last-child,.diag>div:last-of-type{border-bottom:0}.diag span{color:var(--muted);font-size:12px}.diag b{font-size:12px;text-align:right}.diag ha-icon{color:var(--muted);--mdc-icon-size:20px}.diag .bad{color:var(--danger)}.diag+.diag{margin-top:9px}.infoBox,.zone8{padding:14px}.infoBox h3,.zone8 h3{margin:0 0 7px;font-size:17px}.infoBox>div,.zone8>div{min-height:34px;padding:0}.infoBox p,.zone8 p{margin-top:8px;font-size:11px;line-height:1.42;color:var(--muted)}.zone8 pre{overflow-x:auto;margin:9px 0 0;padding:9px;border-radius:13px;background:var(--soft);color:var(--text);font-size:9px}
        .bottomNav{position:fixed;z-index:30;right:0;bottom:0;left:0;width:100%;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 96%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;max-width:900px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:3px;min-height:66px;border:0;border-radius:17px;background:transparent;color:var(--muted);font-size:10px;font-weight:750}.bottomNav button ha-icon{--mdc-icon-size:25px}.bottomNav button.active{background:color-mix(in srgb,var(--a) 10%,transparent);color:var(--a)}
        @media(min-width:720px){.app{padding-right:22px;padding-left:22px}.zoneCards{grid-template-columns:repeat(2,minmax(0,1fr))}.auditList{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.app{padding-right:10px;padding-left:10px}.appHeader{grid-template-columns:48px minmax(0,1fr) 48px}.headerButton,.headerRight{width:48px}.headerTitle strong{font-size:20px}.heroHead h1{font-size:25px}.heroHead p{font-size:11px}.connectionBadge{padding:7px 10px;font-size:11px}.connectionWrap>small{font-size:7px}.systemHero{padding:13px;border-radius:23px}.systemDiagram{min-height:320px}.zoneStack{right:2%;width:36%;gap:4px}.diagramZone{grid-template-columns:25px minmax(0,1fr) auto;min-height:41px;padding:4px 5px}.zoneIcon{width:25px;height:25px}.zoneIcon ha-icon{--mdc-icon-size:15px}.zoneCopy b{font-size:9px}.zoneCopy small{font-size:6.7px}.zoneDuration{font-size:10px}.rainNode{left:47%;width:24%;padding:5px 6px}.manifold{left:25%;width:33%}.heroMetrics{gap:5px}.metricTile{grid-template-columns:27px minmax(0,1fr);min-height:60px;padding:6px}.metricTile ha-icon{--mdc-icon-size:22px}.metricTile small{font-size:6.5px}.metricTile b{font-size:11.5px}.nodeGrid{gap:5px}.nodeTile{grid-template-columns:28px minmax(0,1fr);min-height:67px;padding:7px}.nodeTile>ha-icon{--mdc-icon-size:23px}.nodeTile small{font-size:6.8px}.nodeTile b{font-size:11px}.nodeTile em{font-size:6.5px}.modeGrid{gap:5px}.modeTile{min-height:86px;padding:7px}.modeTile ha-icon{--mdc-icon-size:27px}.modeTile b{font-size:12px}.modeTile small{font-size:7px}.bottomNav button{min-height:64px;font-size:9px}.bottomNav button ha-icon{--mdc-icon-size:23px}.zoneFacts{gap:4px}.zoneFacts>div{padding:6px}.zoneFacts b{font-size:9.5px}}
        @media(max-width:390px){.heroHead{gap:6px}.heroHead h1{font-size:22px}.connectionBadge{font-size:10px}.systemDiagram{min-height:302px}.controllerGraphic{left:2%;width:20%}.controllerBody span{font-size:9px}.rainNode{left:46%;width:25%}.zoneStack{width:37%;}.diagramZone{grid-template-columns:22px minmax(0,1fr) auto}.zoneIcon{width:22px;height:22px}.zoneCopy b{font-size:8px}.zoneCopy small{font-size:6px}.zoneDuration{font-size:9px}.heroMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.nodeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.modeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.bottomNav button span{font-size:8px}}
      `;
    }

    render() {
      if (!this.shadowRoot) return;
      if (!this._view || !VIEW_IDS.includes(this._view)) this._view = "status";
      const header = this.header();
      if (!this._hass) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content"><section class="systemHero unreliable"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>Загрузка данных…</h1><p>Ожидание Home Assistant</p></div></div><div class="systemDiagram"></div></section></main></div>${this.bottomNav()}`;
        this.bindActions();
        return;
      }
      const entities = this.entities();
      let content;
      if (this._drill?.type === "zone") content = this.zoneDetail(entities, this._drill.zone);
      else if (this._drill?.type === "program-audit") content = this.programAuditDrill(entities);
      else if (this._view === "zones") content = this.zonesView(entities);
      else if (this._view === "program") content = this.programView(entities);
      else if (this._view === "manual") content = this.manualView(entities);
      else if (this._view === "diagnostics") content = this.diagnosticsView(entities);
      else content = this.statusView(entities);
      this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content">${content}</main></div>${this.bottomNav()}`;
      this.bindActions();
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
})();
