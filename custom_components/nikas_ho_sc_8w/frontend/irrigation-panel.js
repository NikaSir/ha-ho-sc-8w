(() => {
  const UI_VERSION = "0.5.1";
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
      this._menuOpen = false;
      this._manualZone = 1;
      this._manualDuration = 10;
    }

    set hass(value) { this._hass = value; this.render(); }
    set panel(value) { this._panel = value; this.render(); }
    set narrow(value) { this.toggleAttribute("narrow", Boolean(value)); }
    connectedCallback() { this.render(); }

    esc(value) {
      return String(value ?? "—").replace(/[&<>\"]/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
      })[char]);
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
    state(entityId) {
      return entityId && this.states()[entityId] ? this.states()[entityId].state : "unavailable";
    }
    attrs(entityId) {
      return entityId && this.states()[entityId] ? this.states()[entityId].attributes || {} : {};
    }
    bad(value) { return BAD.has(value); }
    zoneSet(value) {
      if (this.bad(value) || value === "None") return new Set();
      return new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean));
    }
    parentPath() { return this._panel?.config?.parent_path || FALLBACK_PARENT; }
    explicitNavigate(path) {
      const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.pushState({ from }, "", path);
      window.dispatchEvent(new CustomEvent("location-changed", {
        bubbles: true, composed: true, detail: { replace: false }
      }));
    }
    moreInfo(entityId) {
      if (!entityId || !this.states()[entityId]) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId }, bubbles: true, composed: true
      }));
    }
    async refreshNow() {
      if (!this._hass?.callService) return;
      const entities = this.entities();
      const ids = [
        entities.connection, entities.operation, entities.irrigation,
        entities.active, entities.queued, entities.rain,
        entities.seasonal, entities.timerError, entities.cache,
        ...Object.values(entities.zones).flatMap((zone) => [
          zone.remaining, zone.elapsed, zone.schedule
        ]),
      ].filter((id, index, all) => id && this.states()[id] && all.indexOf(id) === index);
      if (!ids.length) return;
      try {
        await this._hass.callService("homeassistant", "update_entity", { entity_id: ids });
      } catch (_err) {
        // Keep the UI factual even if a forced refresh is unsupported.
      }
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
            const candidate = new Date(
              day.getFullYear(), day.getMonth(), day.getDate(),
              Number(match[1]), Number(match[2])
            );
            if (candidate <= now) continue;
            if (!best || candidate < best.when) {
              best = {
                zone, when: candidate, time: start,
                duration: attrs.duration_min ?? "—",
                rain: attrs.rain_sensor_follow,
              };
            }
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
      const title = this._drill?.type === "zone" ? `Зона ${this._drill.zone}` :
        this._drill?.type === "program-audit" ? "Проверка программы" : "HO-SC-8W";
      const subtitle = this._drill ? "Система полива · подробнее" : `Система полива · UI v${UI_VERSION}`;
      return `<header class="appHeader">
        <button class="headerButton menuButton" data-menu aria-label="Меню"><ha-icon icon="mdi:menu"></ha-icon></button>
        <div class="headerTitle"><strong>${this.esc(title)}</strong><small>${this.esc(subtitle)}</small></div>
        <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
      </header>`;
    }
    bottomNav() {
      const tabs = [
        ["status", "mdi:home-outline", "Состояние"],
        ["zones", "mdi:sprinkler", "Зоны"],
        ["program", "mdi:calendar-clock", "Программа"],
        ["manual", "mdi:hand-back-right-outline", "Ручной"],
        ["diagnostics", "mdi:stethoscope", "Диагн."],
      ];
      return `<nav class="bottomNav" aria-label="Разделы Полив"><div class="bottomNavInner">${
        tabs.map(([view, icon, label]) => `<button class="${this._view === view ? "active" : ""}" data-view="${view}" aria-current="${this._view === view ? "page" : "false"}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")
      }</div></nav>`;
    }
    menuSheet() {
      if (!this._menuOpen) return "";
      const tabs = [
        ["status", "mdi:home-outline", "Состояние системы"],
        ["zones", "mdi:sprinkler", "Зоны 1–6"],
        ["program", "mdi:calendar-clock", "Программа"],
        ["manual", "mdi:hand-back-right-outline", "Ручной полив"],
        ["diagnostics", "mdi:stethoscope", "Диагностика"],
      ];
      const drillBack = this._drill ? `<button class="menuItem menuReturn" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon><span><b>Вернуться в раздел</b><small>${this._view === "diagnostics" ? "Диагностика" : this._view === "program" ? "Программа" : "Зоны"}</small></span></button>` : "";
      return `<div class="menuScrim" data-menu-close>
        <aside class="menuSheet" role="dialog" aria-label="Меню панели" aria-modal="true" data-menu-panel>
          <div class="menuHead"><div><small>NIKAS · ПОЛИВ</small><h2>HO-SC-8W</h2></div><button data-menu-close aria-label="Закрыть"><ha-icon icon="mdi:close"></ha-icon></button></div>
          ${drillBack}
          <div class="menuItems">${tabs.map(([view, icon, label]) => `<button class="menuItem ${this._view === view && !this._drill ? "active" : ""}" data-menu-view="${view}"><ha-icon icon="${icon}"></ha-icon><span><b>${label}</b></span></button>`).join("")}</div>
          <div class="menuDivider"></div>
          <button class="menuItem parentItem" data-parent><ha-icon icon="mdi:lightning-bolt-outline"></ha-icon><span><b>Действия</b><small>Вернуться в основное меню</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>
        </aside>
      </div>`;
    }

    systemStatus(entities) {
      const connection = this.state(entities.connection);
      const operation = this.state(entities.operation);
      const activeValue = this.state(entities.active);
      const active = this.zoneSet(activeValue);
      const timerError = this.state(entities.timerError);
      const cache = this.state(entities.cache);
      if (this.bad(connection)) return { tone: "unreliable", title: "Состояние неизвестно", sub: "Нет достоверной связи с контроллером" };
      if (timerError === "active" || timerError === "true") return { tone: "warning", title: "Требуется внимание", sub: "Контроллер сообщает об ошибке таймера" };
      if (this.bad(activeValue)) return { tone: "unreliable", title: "Состояние неизвестно", sub: "Runtime-данные зон недоступны" };
      if (active.size) return { tone: "active", title: `Полив идёт · ${active.size === 1 ? `зона ${[...active][0]}` : `${active.size} зоны`}`, sub: "Контроллер выполняет текущую программу" };
      if (operation === "OFF") return { tone: "off", title: "Система выключена", sub: "Контроллер находится в режиме OFF" };
      if (operation === "Manual") return { tone: "ready", title: "Ручной режим", sub: "Контроллер готов к ручному поливу" };
      const cacheNote = cache === "partial" ? " · кэш программы неполный" : "";
      return { tone: "ready", title: "Система готова", sub: `Автополив работает штатно${cacheNote}` };
    }
    connectionBadge(entities) {
      const connection = this.state(entities.connection);
      let cls = "unknown", label = "Нет данных";
      if (connection === "local") { cls = "local"; label = "Локально"; }
      else if (connection === "cloud") { cls = "cloud"; label = "Облако"; }
      return `<div class="connectionWrap"><div class="connectionBadge ${cls}"><i></i><span>${this.esc(label)}</span></div><small>${this.esc(this.updatedAge(entities.connection))}</small></div>`;
    }
    zoneVisual(zone) {
      const icons = {
        1: "mdi:sprinkler", 2: "mdi:sprinkler-variant",
        3: "mdi:flower", 4: "mdi:greenhouse",
        5: "mdi:sprout", 6: "mdi:pine-tree",
      };
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
      return {
        stateClass, label, duration, starts: this.compactStarts(attrs),
        scheduleState, attrs, entity: q.schedule,
      };
    }

    irrigationDiagram(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const zoneYs = [96, 166, 236, 306, 376, 446];
      const valveXs = [338, 382, 426, 470, 514, 558];
      const lines = valveXs.map((x, idx) => {
        const zone = idx + 1;
        const cls = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "idle";
        return `<path class="pipe ${cls}" d="M ${x} 250 C ${x + 35} 250, 615 ${zoneYs[idx]}, 665 ${zoneYs[idx]}"/>`;
      }).join("");
      const zones = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const info = this.zoneRuntime(entities, zone);
        zones.push(`<button class="diagramZone ${info.stateClass}" data-zone-detail="${zone}" data-entity="${this.esc(info.entity)}">
          <span class="sceneThumb scene${zone}"><ha-icon icon="${this.zoneVisual(zone)}"></ha-icon></span>
          <span class="zoneCopy"><b>Зона ${zone}</b><small>${this.esc(info.label)}</small></span>
          <span class="zoneDuration">${this.esc(info.duration)}<small>мин</small></span>
          <ha-icon class="zoneReady" icon="${info.stateClass === "unknown" ? "mdi:help-circle" : info.stateClass === "off" ? "mdi:minus-circle" : "mdi:check-circle"}"></ha-icon>
        </button>`);
      }
      const valves = valveXs.map((x, idx) => {
        const zone = idx + 1;
        const cls = active.has(String(zone)) ? "running" : queued.has(String(zone)) ? "queued" : "";
        return `<span class="valve ${cls}" title="Зона ${zone}"><b>${zone}</b><i></i><em></em></span>`;
      }).join("");
      const rain = this.state(entities.rain);
      const rainBad = this.bad(rain);
      return `<div class="systemDiagram">
        <svg class="pipes" viewBox="0 0 1000 545" preserveAspectRatio="none" aria-hidden="true">
          <path class="pipe supply" d="M 212 286 C 258 286, 277 250, 318 250"/>
          ${lines}
          <path class="pipe idle" d="M 205 335 C 225 430, 355 491, 522 491"/>
          <path class="pipe sensor" d="M 575 90 L 575 196"/>
        </svg>
        <button class="controllerGraphic" data-entity="${this.esc(entities.connection)}">
          <div class="controllerCap"></div>
          <div class="controllerBody"><b>HO-SC-8W</b><i class="controllerLed"></i><small>INKBIRD / HiOazo</small></div>
          <div class="controllerPorts"><i></i><i></i></div>
        </button>
        <div class="controllerOk ${this.bad(this.state(entities.connection)) ? "bad" : ""}"><ha-icon icon="${this.bad(this.state(entities.connection)) ? "mdi:help" : "mdi:check"}"></ha-icon></div>
        <div class="manifold"><div class="valves">${valves}</div><div class="manifoldRail"></div></div>
        <button class="rainNode ${rainBad ? "unknown" : ""}" data-entity="${this.esc(entities.rain)}"><ha-icon icon="mdi:weather-rainy"></ha-icon><span>Учёт дождя</span><b>${this.esc(this.human("rain", rain))}</b></button>
        <div class="zoneStack">${zones.join("")}</div>
        <div class="mainlinePump"><ha-icon icon="mdi:water-pump"></ha-icon></div>
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

    statusHero(entities) {
      const status = this.systemStatus(entities);
      return `<section class="systemHero ${status.tone}">
        <div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionBadge(entities)}</div>
        ${this.irrigationDiagram(entities)}
        ${this.heroMetrics(entities)}
      </section>`;
    }
    nextCard(entities) {
      if (this.bad(this.state(entities.connection))) return "";
      const next = this.nextWatering(entities);
      if (!next) return `<section class="nextCard"><ha-icon icon="mdi:calendar-question"></ha-icon><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><b>Расчёт недоступен</b><span>Недостаточно декодированных данных программы</span></div></section>`;
      return `<section class="nextCard"><ha-icon icon="mdi:calendar-clock"></ha-icon><div><small>СЛЕДУЮЩИЙ ПОЛИВ</small><b>${this.esc(this.relativeDay(next.when))} · ${this.esc(next.time)} · зона ${next.zone}</b><span>База ${this.esc(next.duration)} мин · ${this.esc(this.rainText(next.rain, true))}</span></div></section>`;
    }
    nodeTile(icon, title, value, note, entityId, tone = "") {
      return `<button class="nodeTile ${tone}" ${entityId ? `data-entity="${this.esc(entityId)}"` : ""}><ha-icon icon="${icon}"></ha-icon><span><small>${this.esc(title)}</small><b>${this.esc(value)}</b>${note ? `<em>${this.esc(note)}</em>` : ""}</span></button>`;
    }
    systemNodes(entities) {
      const connection = this.state(entities.connection);
      const z8 = this.state(entities.zones[8].schedule);
      const z8Text = this.bad(z8) ? "Нет данных" : this.zoneStateText(z8);
      const controllerText = this.bad(connection) ? "Нет связи" :
        connection === "local" ? "Онлайн" : connection === "cloud" ? "Облако" : connection;
      return `<section class="sectionCard"><div class="sectionLabel">ОСНОВНЫЕ УЗЛЫ</div><div class="nodeGrid">
        ${this.nodeTile("mdi:memory", "Контроллер", controllerText, connection === "local" ? "Локальный канал" : "", entities.connection, this.bad(connection) ? "bad" : "good")}
        ${this.nodeTile("mdi:pipe-valve", "Клапаны", "6 каналов", "Зоны 1–6", null, "good")}
        ${this.nodeTile("mdi:water-pump", "Магистраль", "Нет датчика", "Не вычисляется", null, "unknown")}
        ${this.nodeTile("mdi:clipboard-text-outline", "Зона 8", z8Text, "Лабораторная", entities.zones[8].schedule, this.bad(z8) ? "unknown" : "")}
      </div></section>`;
    }
    statusView(entities) { return `${this.statusHero(entities)}${this.nextCard(entities)}${this.systemNodes(entities)}`; }

    zonesView(entities) {
      const active = this.zoneSet(this.state(entities.active));
      const queued = this.zoneSet(this.state(entities.queued));
      const cards = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const q = entities.zones[zone];
        const info = this.zoneRuntime(entities, zone);
        const remaining = this.state(q.remaining);
        const elapsed = this.state(q.elapsed);
        cards.push(`<button class="zoneCard ${info.stateClass}" data-zone-detail="${zone}" data-entity="${this.esc(q.schedule)}">
          <div class="zoneCardTop"><span class="zoneBigIcon"><ha-icon icon="${this.zoneVisual(zone)}"></ha-icon></span><span><small>ЗОНА ${zone}</small><b>${this.esc(info.label)}</b></span><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></div>
          <div class="zoneFacts"><div><small>Программа</small><b>${this.esc(info.duration)} мин</b></div><div><small>Старт</small><b>${this.esc(info.starts)}</b></div><div><small>Прошло</small><b>${this.bad(elapsed) ? "—" : `${this.esc(elapsed)} мин`}</b></div><div><small>Осталось</small><b>${this.bad(remaining) ? "—" : `${this.esc(remaining)} мин`}</b></div></div>
          ${active.has(String(zone)) ? `<div class="zoneLive"><i></i><span>Полив выполняется</span></div>` : queued.has(String(zone)) ? `<div class="zoneLive queue"><i></i><span>Ожидает запуска</span></div>` : ""}
        </button>`);
      }
      return `<div class="pageIntro"><small>ЗОНЫ 1–6</small><h2>Рабочие зоны</h2><p>Фактическая программа и runtime-состояние каждого канала.</p></div><div class="zoneCards">${cards.join("")}</div>`;
    }

    zoneDetail(entities, zone) {
      const q = entities.zones[zone], id = q.schedule, st = this.state(id);
      const a = this.attrs(id), starts = this.starts(a), seasonal = this.state(entities.seasonal);
      const enabled = st === "configured";
      return `<div class="pageIntro drillIntro"><div class="titleRow"><div><small>ЗОНА ${zone}</small><h2>Программа зоны</h2></div><span class="readOnly">Только просмотр</span></div><p>Фактические параметры DP38, сохранённые контроллером.</p></div>
        <section class="zoneDetailStatus ${enabled ? "enabled" : "disabledState"}"><div class="zoneDetailStatusIcon"><ha-icon icon="${enabled ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"}"></ha-icon></div><div><small>СОСТОЯНИЕ ПРОГРАММЫ</small><h2>${this.esc(this.zoneStateText(st))}</h2><p>Зона ${zone}</p></div></section>
        <section class="detailCard"><h3>Расписание</h3><div class="detailGrid"><div><small>Базовая длительность</small><b>${this.esc(a.duration_min ?? "—")} мин</b></div><div><small>Старт</small><b>${this.esc(starts.length ? starts.join(" · ") : "—")}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Начало цикла</small><b>${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</b></div><div><small>Дождь</small><b>${this.esc(this.rainText(a.rain_sensor_follow))}</b></div><div><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b></div></div></section>
        <section class="lockedInfo"><ha-icon icon="mdi:lock-outline"></ha-icon><div><b>Редактирование пока не опубликовано</b><p>Запись появится только через проверенный API интеграции после безопасного DP38 write-gate.</p></div></section>
        <button class="wideMore" data-entity="${this.esc(id)}"><span>Подробнее в Home Assistant</span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
    }

    programCard(label, value, note, icon, entityId) {
      return `<button class="programMetric" data-entity="${this.esc(entityId)}"><ha-icon icon="${icon}"></ha-icon><span><small>${this.esc(label)}</small><b>${this.esc(value)}</b>${note ? `<em>${this.esc(note)}</em>` : ""}</span></button>`;
    }
    programAudit(entities) {
      const cards = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        const id = entities.zones[zone].schedule, st = this.state(id);
        const a = this.attrs(id), starts = this.starts(a);
        cards.push(`<button class="auditZone" data-zone-detail="${zone}" data-entity="${this.esc(id)}"><div class="auditZoneTop"><span class="num">${zone}</span><div><b>Зона ${zone}</b><small>${this.esc(this.zoneStateText(st))}</small></div><span class="auditBadge">${this.esc(a.duration_min ?? "—")} мин</span></div><div class="auditPrimary">${this.esc(starts.length ? starts.join(" · ") : "—")}</div><div class="auditSecondary">${this.esc(this.cycleText(a))} · ${this.esc(this.rainText(a.rain_sensor_follow))}</div><div class="auditAnchor">Начало цикла: ${this.esc(a.interval_start ?? a.anchor_date ?? "—")}</div></button>`);
      }
      return `<section class="programAudit"><div class="sectionLabel">ЗОНЫ 1–6</div><div class="auditList">${cards.join("")}</div></section>`;
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
      </div>${this.nextCard(entities)}${this.programAudit(entities)}`;
    }

    manualView(entities) {
      const zoneButtons = [];
      for (let zone = 1; zone <= 6; zone += 1) {
        zoneButtons.push(`<button class="manualZone ${this._manualZone === zone ? "active" : ""}" data-manual-zone="${zone}"><span>${zone}</span><small>Зона ${zone}</small></button>`);
      }
      const controllerBusy = this.zoneSet(this.state(entities.active)).size > 0;
      return `<div class="pageIntro"><small>РУЧНОЙ ПОЛИВ</small><h2>Подготовка запуска</h2><p>Зона и длительность выбираются локально в интерфейсе. Команда запуска пока заблокирована.</p></div><section class="manualCard"><div class="manualHead"><div><small>ЗОНА</small><h3>Выбери канал</h3></div><ha-icon icon="mdi:watering-can-outline"></ha-icon></div><div class="manualZones">${zoneButtons.join("")}</div><div class="manualDurationBlock"><small>ДЛИТЕЛЬНОСТЬ</small><div class="durationStepper"><button data-duration-step="-1" aria-label="Уменьшить время"><ha-icon icon="mdi:minus"></ha-icon></button><div><strong>${this._manualDuration}</strong><span>мин</span></div><button data-duration-step="1" aria-label="Увеличить время"><ha-icon icon="mdi:plus"></ha-icon></button></div></div><div class="manualSummary"><span>Зона ${this._manualZone}</span><b>${this._manualDuration} мин</b></div><button class="manualStart" disabled><ha-icon icon="mdi:play"></ha-icon><span>${controllerBusy ? "Контроллер занят" : "Запуск пока недоступен"}</span></button><p class="manualSafety"><ha-icon icon="mdi:shield-lock-outline"></ha-icon><span>Панель не отправляет raw DP45 и не имитирует неподтверждённое управление.</span></p></section>`;
    }

    diagnosticsView(entities) {
      const rows = [
        ["Активное соединение", entities.connection, this.state(entities.connection), ""],
        ["Режим контроллера", entities.operation, this.state(entities.operation), "operation"],
        ["Порядок полива", entities.irrigation, this.state(entities.irrigation), "irrigation"],
        ["Активные зоны", entities.active, this.state(entities.active), "zones"],
        ["Очередь зон", entities.queued, this.state(entities.queued), "zones"],
        ["Кэш расписания", entities.cache, this.state(entities.cache), "cache"],
        ["Учёт дождя", entities.rain, this.state(entities.rain), "rain"],
        ["Ошибка таймера", entities.timerError, this.state(entities.timerError), "alarm"],
      ];
      const rowHtml = rows.map(([label,id,value,kind]) => `<button data-entity="${this.esc(id)}"><span>${this.esc(label)}</span><b class="${this.bad(value) ? "bad" : ""}">${this.esc(kind ? this.human(kind,value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("");
      const z8 = entities.zones[8].schedule, a8 = this.attrs(z8);
      return `<div class="pageIntro"><small>ДИАГНОСТИКА</small><h2>Достоверность данных</h2><p>Транспорт, кэш программы и лабораторная зона 8.</p></div><button class="diagnosticAction" data-drill="program-audit"><span class="diagnosticActionIcon"><ha-icon icon="mdi:clipboard-check-outline"></ha-icon></span><span><b>Проверка программы</b><small>Сверить параметры зон 1–6</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button><section class="diag diagnosticRows">${rowHtml}</section><section class="diag infoBox"><h3>Панель</h3><div><span>UI</span><b>v${UI_VERSION}</b></div><div><span>Frontend</span><b>self-contained bundle</b></div><div><span>Raw write</span><b>Отсутствует</b></div></section><section class="diag infoBox"><h3>Магистраль / главный клапан</h3><div><span>Источник состояния</span><b>Не подтверждён</b></div><p>Панель не вычисляет состояние магистрали или главного клапана по косвенным признакам.</p></section><section class="diag zone8"><h3>Зона 8 · лабораторная</h3><div><span>Состояние</span><b>${this.esc(this.zoneStateText(this.state(z8)))}</b></div><div><span>Источник кэша</span><b>${this.esc(a8.cache_source ?? "—")}</b></div><pre>${this.esc(a8.raw_hex || "RAW DP38 отсутствует")}</pre><p>Зона 8 не является пользовательской зоной. Raw-write из панели отсутствует.</p></section>`;
    }
    programAuditDrill(entities) {
      return `<div class="pageIntro drillIntro"><small>ПРОВЕРКА ПРОГРАММЫ</small><h2>DP38 · зоны 1–6</h2><p>Контрольный снимок декодированной программы. Здесь ничего не редактируется.</p></div>${this.programAudit(entities)}`;
    }

    bindActions() {
      this.shadowRoot.querySelector("[data-menu]")?.addEventListener("click", () => {
        this._menuOpen = true; this.render();
      });
      this.shadowRoot.querySelectorAll("[data-menu-close]").forEach((node) => node.addEventListener("click", (event) => {
        if (node.dataset.menuPanel !== undefined) return;
        if (event.target.closest("[data-menu-panel]") && !event.target.closest("[data-menu-close]")) return;
        this._menuOpen = false; this.render();
      }));
      this.shadowRoot.querySelector("[data-menu-panel]")?.addEventListener("click", (event) => event.stopPropagation());
      this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", async () => {
        await this.refreshNow();
      });
      this.shadowRoot.querySelector("[data-parent]")?.addEventListener("click", () => {
        this._menuOpen = false; this.explicitNavigate(this.parentPath());
      });
      this.shadowRoot.querySelector("[data-drill-back]")?.addEventListener("click", () => {
        this._drill = null; this._menuOpen = false; this.render(); window.scrollTo({ top: 0, behavior: "auto" });
      });
      this.shadowRoot.querySelectorAll("[data-menu-view]").forEach((button) => button.addEventListener("click", () => {
        this._drill = null; this._view = button.dataset.menuView || "status"; this._menuOpen = false;
        this.render(); window.scrollTo({ top: 0, behavior: "auto" });
      }));
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
        this._drill = null; this._view = button.dataset.view || "status"; this._menuOpen = false;
        this.render(); window.scrollTo({ top: 0, behavior: "auto" });
      }));
      this.shadowRoot.querySelectorAll("[data-drill]").forEach((button) => button.addEventListener("click", () => {
        if (button.dataset.drill === "program-audit") {
          this._drill = { type: "program-audit", parentView: "diagnostics" };
          this._view = "diagnostics"; this.render(); window.scrollTo({ top: 0, behavior: "auto" });
        }
      }));
      this.shadowRoot.querySelectorAll("[data-manual-zone]").forEach((button) => button.addEventListener("click", () => {
        this._manualZone = Number(button.dataset.manualZone) || 1; this.render();
      }));
      this.shadowRoot.querySelectorAll("[data-duration-step]").forEach((button) => button.addEventListener("click", () => {
        const next = this._manualDuration + Number(button.dataset.durationStep || 0);
        this._manualDuration = Math.min(120, Math.max(1, next)); this.render();
      }));
      this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
        let timer = null, held = false;
        const entityId = button.dataset.entity;
        const zoneDetail = Number(button.dataset.zoneDetail || 0);
        const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
        button.addEventListener("pointerdown", () => {
          held = false;
          timer = setTimeout(() => { held = true; this.moreInfo(entityId); }, 550);
        });
        button.addEventListener("pointerup", cancel);
        button.addEventListener("pointercancel", cancel);
        button.addEventListener("pointerleave", cancel);
        button.addEventListener("click", (event) => {
          if (held) { event.preventDefault(); held = false; return; }
          if (zoneDetail) {
            this._drill = { type: "zone", zone: zoneDetail, parentView: this._view };
            this.render(); window.scrollTo({ top: 0, behavior: "auto" }); return;
          }
          this.moreInfo(entityId);
        });
      });
    }

    styles() {
      return `
        :host{--a:var(--primary-color,#079bd0);--green:#20a44b;--orange:#f59e0b;--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#f7f8fa);--text:var(--primary-text-color,#17191c);--muted:var(--secondary-text-color,#6d7176);--line:color-mix(in srgb,var(--text) 10%,transparent);--soft:color-mix(in srgb,var(--text) 4.2%,var(--card));--danger:var(--error-color,#d84040);display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}
        *{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent;cursor:pointer}
        .app{max-width:920px;min-height:100vh;margin:0 auto;padding:0 14px calc(112px + env(safe-area-inset-bottom))}
        .appHeader{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:56px minmax(0,1fr) 56px;align-items:center;gap:10px;min-height:86px;padding:calc(12px + env(safe-area-inset-top)) 0 10px;background:color-mix(in srgb,var(--bg) 97%,transparent);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid color-mix(in srgb,var(--text) 6%,transparent)}
        .headerButton{display:grid;place-items:center;width:56px;height:56px;padding:0;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--card) 96%,transparent);box-shadow:0 7px 20px #0000000b;color:var(--text)}
        .headerButton ha-icon{--mdc-icon-size:29px}.refreshButton{color:var(--a)}
        .headerTitle{min-width:0;text-align:center}.headerTitle strong{display:block;font-size:24px;line-height:1.02;letter-spacing:-.04em;white-space:nowrap}.headerTitle small{display:block;margin-top:5px;overflow:hidden;color:var(--muted);font-size:11px;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
        .content{padding-top:13px}
        .systemHero,.sectionCard,.nextCard,.zoneCard,.zoneDetailStatus,.detailCard,.lockedInfo,.manualCard,.programMetric,.programAudit,.auditZone,.diagnosticAction,.wideMore,.diag{background:var(--card);border:1px solid var(--line);box-shadow:0 8px 28px #00000008}
        .systemHero{position:relative;overflow:hidden;padding:18px;border-radius:28px;background:linear-gradient(145deg,var(--card) 0%,var(--card) 76%,color-mix(in srgb,var(--a) 5%,var(--card)) 100%)}
        .systemHero.ready{border-color:color-mix(in srgb,var(--green) 22%,var(--line))}.systemHero.active{border-color:color-mix(in srgb,var(--a) 40%,var(--line))}.systemHero.warning{border-color:color-mix(in srgb,var(--orange) 42%,var(--line))}.systemHero.unreliable{border-color:color-mix(in srgb,var(--muted) 36%,var(--line))}
        .heroHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.heroHead>div:first-child{min-width:0}.heroHead small,.pageIntro>small,.sectionLabel{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.11em}.heroHead h1{margin:7px 0 5px;font-size:32px;line-height:.98;letter-spacing:-.05em}.heroHead p{margin:0;color:var(--muted);font-size:14px;line-height:1.35}
        .connectionWrap{flex:0 0 auto;text-align:right}.connectionBadge{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:99px;background:var(--soft);font-weight:800;font-size:14px}.connectionBadge i{width:10px;height:10px;border-radius:50%;background:var(--muted)}.connectionBadge.local{background:color-mix(in srgb,var(--green) 10%,var(--card));color:var(--green)}.connectionBadge.local i{background:var(--green)}.connectionBadge.cloud{background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.connectionBadge.cloud i{background:var(--a)}.connectionWrap>small{display:block;margin-top:6px;color:var(--muted);font-size:8.5px}
        .systemDiagram{position:relative;min-height:382px;margin-top:16px;border-radius:24px;background:linear-gradient(180deg,#fbfdfe,#f9fcfb);border:1px solid color-mix(in srgb,var(--text) 5%,transparent);overflow:hidden}
        .pipes{position:absolute;inset:0;width:100%;height:100%;z-index:0}.pipe{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.pipe.idle{stroke:#cbd5e1}.pipe.run,.pipe.supply{stroke:var(--a)}.pipe.queue{stroke:var(--orange)}.pipe.sensor{stroke:#aab4bf;stroke-width:3;stroke-dasharray:8 7}
        .controllerGraphic{position:absolute;z-index:2;left:2.5%;top:28%;width:20%;height:45%;min-width:78px;padding:0;border:1px solid #cbd3dc;border-radius:15px;background:linear-gradient(180deg,#fafbfc,#e6ebef);box-shadow:0 10px 22px #00000018;overflow:hidden}
        .controllerCap{height:12%;background:linear-gradient(180deg,#fff,#e7ebef);border-bottom:1px solid #ccd4dc}.controllerBody{height:76%;display:grid;place-items:center;align-content:center;gap:9px;color:#48515c}.controllerBody b{font-size:12px}.controllerBody small{font-size:7px;color:#7b8590}.controllerLed{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px #20a44b1c}.controllerPorts{display:flex;justify-content:center;gap:20px;height:12%;border-top:1px solid #ccd4dc;background:#dfe5ea}.controllerPorts i{width:10px;height:12px;background:#28313a;border-radius:0 0 4px 4px}
        .controllerOk{position:absolute;z-index:3;left:17.5%;top:25.5%;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:var(--green);color:white;box-shadow:0 5px 12px #00000020}.controllerOk.bad{background:var(--muted)}.controllerOk ha-icon{--mdc-icon-size:19px}
        .manifold{position:absolute;z-index:2;left:25.5%;top:40%;width:34%;height:28%}.manifoldRail{position:absolute;left:0;right:0;top:52%;height:19px;border-radius:10px;background:linear-gradient(180deg,#505861,#242a30);box-shadow:0 5px 11px #00000024}.valves{position:absolute;left:2%;right:2%;top:0;display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
        .valve{position:relative;display:grid;justify-items:center;color:var(--muted)}.valve b{font-size:8px;margin-bottom:2px}.valve i{width:16px;height:52px;border-radius:7px;background:linear-gradient(180deg,#333c45,#151a1f);border:1px solid #111;box-shadow:inset 0 8px 0 #46515a}.valve em{width:7px;height:15px;margin-top:-2px;border-radius:0 0 3px 3px;background:#5f6972}.valve.running i{box-shadow:inset 0 8px 0 #2d7b98,0 0 0 2px color-mix(in srgb,var(--a) 55%,transparent)}.valve.queued i{box-shadow:inset 0 8px 0 #8e6f22,0 0 0 2px color-mix(in srgb,var(--orange) 50%,transparent)}
        .rainNode{position:absolute;z-index:3;left:48.5%;top:4%;display:grid;grid-template-columns:34px 1fr;grid-template-rows:auto auto;align-items:center;width:23%;min-width:112px;padding:8px 10px;border-radius:15px;background:color-mix(in srgb,var(--card) 97%,transparent);border:1px solid var(--line);text-align:left}.rainNode ha-icon{grid-row:1/3;color:var(--a);--mdc-icon-size:28px}.rainNode span{font-size:8px;color:var(--muted)}.rainNode b{font-size:11px}.rainNode.unknown{opacity:.65}
        .zoneStack{position:absolute;z-index:2;right:2%;top:7.5%;width:35.5%;display:grid;gap:6px}.diagramZone{display:grid;grid-template-columns:50px minmax(0,1fr) auto 17px;align-items:center;gap:7px;min-height:51px;padding:5px 7px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--card) 98%,transparent);text-align:left;box-shadow:0 3px 8px #00000006}.diagramZone.running{border-color:color-mix(in srgb,var(--a) 60%,var(--line));background:color-mix(in srgb,var(--a) 7%,var(--card))}.diagramZone.queued{border-color:color-mix(in srgb,var(--orange) 50%,var(--line))}.diagramZone.off,.diagramZone.unknown{opacity:.62}
        .sceneThumb{display:grid;place-items:center;width:50px;height:40px;border-radius:10px;overflow:hidden;color:white;text-shadow:0 1px 3px #0008}.sceneThumb ha-icon{--mdc-icon-size:24px}.scene1,.scene2{background:linear-gradient(180deg,#75c7e8 0 38%,#7ec65b 39% 100%)}.scene3{background:linear-gradient(150deg,#78b65d,#e87397 52%,#7b5c3d)}.scene4{background:linear-gradient(145deg,#75bedd,#d9eee8 55%,#61a35b)}.scene5{background:linear-gradient(145deg,#8abf62,#684a30)}.scene6{background:linear-gradient(145deg,#74b4df,#4a9456 58%,#70513a)}
        .zoneCopy{min-width:0}.zoneCopy b{display:block;font-size:10.5px;line-height:1}.zoneCopy small{display:block;margin-top:3px;overflow:hidden;color:var(--muted);font-size:7.5px;text-overflow:ellipsis;white-space:nowrap}.zoneDuration{font-size:12px;font-weight:850;text-align:right}.zoneDuration small{display:block;font-size:6px;color:var(--muted);font-weight:600}.zoneReady{color:var(--green);--mdc-icon-size:15px}.diagramZone.off .zoneReady,.diagramZone.unknown .zoneReady{color:var(--muted)}
        .mainlinePump{position:absolute;z-index:2;left:46%;bottom:8%;display:grid;place-items:center;width:58px;height:34px;border-radius:13px;background:linear-gradient(180deg,#525b63,#252b31);color:#55bde9;box-shadow:0 4px 10px #00000020}.mainlinePump ha-icon{--mdc-icon-size:22px}.mainlineUnknown{position:absolute;z-index:3;left:37%;bottom:1.5%;display:grid;grid-template-columns:30px auto;grid-template-rows:auto auto;align-items:center;gap:0 8px;padding:7px 11px;border-radius:14px;background:color-mix(in srgb,var(--card) 97%,transparent);border:1px solid var(--line)}.mainlineUnknown ha-icon{grid-row:1/3;color:var(--muted);--mdc-icon-size:25px}.mainlineUnknown span{font-size:7px;color:var(--muted)}.mainlineUnknown b{font-size:10px;color:var(--muted)}
        .heroMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.metricTile{display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:8px;min-height:68px;padding:9px;border:1px solid var(--line);border-radius:18px;background:var(--card);text-align:left}.metricTile ha-icon{color:var(--muted);--mdc-icon-size:28px}.metricTile span{min-width:0}.metricTile small{display:block;color:var(--muted);font-size:7.5px;line-height:1.05}.metricTile b{display:block;margin-top:4px;font-size:14px;line-height:1.08;white-space:normal;word-break:break-word}.metricTile.good b,.metricTile.good ha-icon{color:var(--green)}.metricTile.active b,.metricTile.active ha-icon{color:var(--a)}
        .nextCard{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:center;margin-top:12px;padding:15px 18px;border-radius:24px}.nextCard>ha-icon{color:var(--a);--mdc-icon-size:36px}.nextCard small{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.1em}.nextCard b{display:block;margin-top:3px;font-size:16px}.nextCard span{display:block;margin-top:3px;color:var(--muted);font-size:10px}
        .sectionCard{margin-top:12px;padding:16px;border-radius:25px}.sectionLabel{margin:0 0 11px 2px}.nodeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.nodeTile{display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:8px;min-height:78px;padding:10px;border:1px solid var(--line);border-radius:18px;background:var(--card);text-align:left}.nodeTile>ha-icon{color:var(--muted);--mdc-icon-size:29px}.nodeTile small{display:block;color:var(--muted);font-size:7.5px}.nodeTile b{display:block;margin-top:3px;font-size:13px;line-height:1.08}.nodeTile em{display:block;margin-top:4px;color:var(--muted);font-size:7.5px;font-style:normal}.nodeTile.good b,.nodeTile.good>ha-icon{color:var(--green)}.nodeTile.bad b,.nodeTile.bad>ha-icon{color:var(--danger)}.nodeTile.unknown{opacity:.72}
        .pageIntro{padding:7px 4px 15px}.pageIntro h2{margin:5px 0 0;font-size:26px;line-height:1.02;letter-spacing:-.04em}.pageIntro p{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.42}.titleRow{display:flex;align-items:center;justify-content:space-between;gap:10px}.readOnly,.auditBadge{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px;white-space:nowrap}
        .zoneCards{display:grid;grid-template-columns:1fr;gap:9px}.zoneCard{width:100%;padding:13px;border-radius:22px;text-align:left}.zoneCard.running{border-color:color-mix(in srgb,var(--a) 45%,var(--line));background:linear-gradient(135deg,var(--card),color-mix(in srgb,var(--a) 7%,var(--card)))}.zoneCard.queued{border-color:color-mix(in srgb,var(--orange) 45%,var(--line))}.zoneCard.off,.zoneCard.unknown{opacity:.7}.zoneCardTop{display:grid;grid-template-columns:48px minmax(0,1fr) 24px;align-items:center;gap:10px}.zoneBigIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:color-mix(in srgb,var(--green) 8%,var(--soft));color:var(--green)}.zoneBigIcon ha-icon{--mdc-icon-size:27px}.zoneCardTop small{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.08em}.zoneCardTop b{display:block;margin-top:3px;font-size:17px}.zoneCardTop .chev{color:var(--muted)}.zoneFacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:11px}.zoneFacts>div{padding:8px;border-radius:13px;background:var(--soft)}.zoneFacts small{display:block;color:var(--muted);font-size:7px}.zoneFacts b{display:block;margin-top:2px;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.zoneLive{display:flex;align-items:center;gap:7px;margin-top:9px;color:var(--a);font-size:10px;font-weight:750}.zoneLive i{width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 12%,transparent)}.zoneLive.queue{color:var(--orange)}.zoneLive.queue i{background:var(--orange);box-shadow:0 0 0 4px color-mix(in srgb,var(--orange) 12%,transparent)}
        .zoneDetailStatus{display:flex;align-items:center;gap:14px;padding:17px;border-radius:22px}.zoneDetailStatusIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--a) 12%,var(--card));color:var(--a)}.zoneDetailStatusIcon ha-icon{--mdc-icon-size:25px}.zoneDetailStatus small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.zoneDetailStatus h2{margin:3px 0 1px;font-size:22px}.zoneDetailStatus p{margin:0;color:var(--muted)}.zoneDetailStatus.disabledState{opacity:.65}.detailCard{margin-top:10px;padding:16px;border-radius:22px}.detailCard h3{margin:0 0 12px;font-size:18px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detailGrid>div{min-width:0;padding:11px;border-radius:15px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase}.detailGrid b{display:block;margin-top:3px;font-size:13px;line-height:1.25;word-break:break-word}.lockedInfo{display:flex;gap:11px;margin-top:10px;padding:14px;border-radius:19px;background:color-mix(in srgb,var(--text) 3%,var(--card))}.lockedInfo>ha-icon{flex:0 0 auto;color:var(--muted);--mdc-icon-size:22px}.lockedInfo b{font-size:13px}.lockedInfo p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.42}.wideMore{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:50px;margin-top:10px;padding:0 15px;border-radius:18px;color:var(--a);font-weight:750;text-align:left}
        .programMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.programMetric{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:9px;min-height:72px;padding:10px 12px;border-radius:19px;text-align:left}.programMetric>ha-icon{color:var(--a);--mdc-icon-size:26px}.programMetric small{display:block;color:var(--muted);font-size:8px}.programMetric b{display:block;margin-top:2px;font-size:14px}.programMetric em{display:block;margin-top:2px;color:var(--muted);font-size:8px;font-style:normal}.programAudit{margin-top:10px;padding:13px;border-radius:22px}.auditList{display:grid;grid-template-columns:1fr;gap:8px}.auditZone{width:100%;padding:13px 14px;border-radius:18px;text-align:left;box-shadow:none}.auditZoneTop{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px}.num{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a);font-weight:800}.auditZoneTop b{display:block;font-size:15px}.auditZoneTop small{display:block;margin-top:1px;color:var(--muted);font-size:10px}.auditPrimary{margin-top:10px;font-size:14px;font-weight:750}.auditSecondary{margin-top:3px;color:var(--muted);font-size:11px}.auditAnchor{margin-top:4px;color:var(--muted);font-size:10px}
        .manualCard{padding:16px;border-radius:22px}.manualHead{display:flex;align-items:center;justify-content:space-between}.manualHead small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.manualHead h3{margin:2px 0 0;font-size:19px}.manualHead>ha-icon{color:var(--a);--mdc-icon-size:28px}.manualZones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.manualZone{min-height:64px;border:1px solid var(--line);border-radius:17px;background:var(--soft);display:grid;place-items:center;align-content:center;gap:2px}.manualZone span{font-size:20px;font-weight:800}.manualZone small{color:var(--muted);font-size:10px}.manualZone.active{border-color:color-mix(in srgb,var(--a) 55%,var(--line));background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.manualDurationBlock{margin-top:18px}.manualDurationBlock>small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.1em}.durationStepper{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;gap:10px;margin-top:8px}.durationStepper button{display:grid;place-items:center;min-height:54px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.durationStepper>div{text-align:center}.durationStepper strong{font-size:34px;letter-spacing:-.04em}.durationStepper span{margin-left:5px;color:var(--muted);font-size:14px}.manualSummary{display:flex;justify-content:space-between;margin-top:15px;padding:12px 2px;border-top:1px solid var(--line);color:var(--muted)}.manualSummary b{color:var(--text)}.manualStart{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;margin-top:4px;border:0;border-radius:17px;background:var(--soft);color:var(--muted);font-weight:800;opacity:.8;cursor:not-allowed}.manualSafety{display:flex;align-items:flex-start;gap:7px;margin:10px 2px 0;color:var(--muted);font-size:10px;line-height:1.4}.manualSafety ha-icon{flex:0 0 auto;--mdc-icon-size:17px}
        .diagnosticAction{display:grid;grid-template-columns:44px minmax(0,1fr) 22px;align-items:center;gap:11px;width:100%;min-height:70px;margin-bottom:10px;padding:10px 14px;border-radius:20px;text-align:left}.diagnosticActionIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.diagnosticActionIcon ha-icon{--mdc-icon-size:22px}.diagnosticAction b{display:block;font-size:14px}.diagnosticAction small{display:block;margin-top:2px;color:var(--muted);font-size:10px}.diag{overflow:hidden;border-radius:21px}.diag>button,.diag>div{display:grid;grid-template-columns:minmax(0,1fr) auto 22px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 14px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left}.diag>button:last-child,.diag>div:last-of-type{border-bottom:0}.diag span{color:var(--muted);font-size:12px}.diag b{font-size:12px;text-align:right}.diag ha-icon{color:var(--muted);--mdc-icon-size:20px}.diag .bad{color:var(--danger)}.diag+.diag{margin-top:9px}.infoBox,.zone8{padding:14px}.infoBox h3,.zone8 h3{margin:0 0 7px;font-size:17px}.infoBox>div,.zone8>div{min-height:34px;padding:0}.infoBox p,.zone8 p{margin-top:8px;font-size:11px;line-height:1.42;color:var(--muted)}.zone8 pre{overflow-x:auto;margin:9px 0 0;padding:9px;border-radius:13px;background:var(--soft);color:var(--text);font-size:9px}
        .menuScrim{position:fixed;z-index:80;inset:0;background:#00000038;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}.menuSheet{position:absolute;top:0;bottom:0;left:0;width:min(84vw,360px);padding:calc(18px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));background:var(--card);box-shadow:18px 0 45px #00000022;overflow:auto}.menuHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:4px 5px 18px}.menuHead small{color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.12em}.menuHead h2{margin:4px 0 0;font-size:24px}.menuHead button{display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:14px;background:var(--soft)}.menuItems{display:grid;gap:5px}.menuItem{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:58px;padding:8px 10px;border:0;border-radius:16px;background:transparent;text-align:left}.menuItem>ha-icon:first-child{color:var(--muted);--mdc-icon-size:24px}.menuItem b{display:block;font-size:13px}.menuItem small{display:block;margin-top:2px;color:var(--muted);font-size:9px}.menuItem.active{background:color-mix(in srgb,var(--a) 10%,var(--card));color:var(--a)}.menuItem.active>ha-icon:first-child{color:var(--a)}.menuReturn{margin-bottom:8px;background:var(--soft)}.menuDivider{height:1px;margin:12px 5px;background:var(--line)}.parentItem{background:color-mix(in srgb,var(--text) 2.5%,var(--card))}
        .bottomNav{position:fixed;z-index:30;right:0;bottom:0;left:0;width:100%;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 97%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;max-width:920px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:3px;min-height:66px;border:0;border-radius:17px;background:transparent;color:var(--muted);font-size:10px;font-weight:750}.bottomNav button ha-icon{--mdc-icon-size:25px}.bottomNav button.active{background:color-mix(in srgb,var(--a) 10%,transparent);color:var(--a)}
        @media(min-width:720px){.app{padding-right:22px;padding-left:22px}.zoneCards{grid-template-columns:repeat(2,minmax(0,1fr))}.auditList{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){
          .app{padding-right:10px;padding-left:10px}.appHeader{grid-template-columns:50px minmax(0,1fr) 50px;min-height:78px;padding-top:calc(9px + env(safe-area-inset-top))}.headerButton{width:50px;height:50px;border-radius:18px}.headerButton ha-icon{--mdc-icon-size:27px}.headerTitle strong{font-size:21px}.headerTitle small{font-size:9.5px}
          .content{padding-top:10px}.systemHero{padding:14px;border-radius:24px}.heroHead h1{font-size:26px}.heroHead p{font-size:11.5px}.connectionBadge{padding:8px 11px;font-size:11.5px}.connectionWrap>small{font-size:7px}.systemDiagram{min-height:356px;margin-top:13px}
          .controllerGraphic{left:2%;top:29%;width:20%}.controllerBody b{font-size:10px}.controllerBody small{font-size:6px}.controllerOk{left:17%;top:26.5%;width:28px;height:28px}
          .manifold{left:25%;width:35%;top:41%}.valve i{width:14px;height:46px}.valve em{height:13px}.zoneStack{right:1.6%;top:7%;width:36%;gap:5px}.diagramZone{grid-template-columns:42px minmax(0,1fr) auto 14px;gap:5px;min-height:47px;padding:4px 5px}.sceneThumb{width:42px;height:36px;border-radius:9px}.sceneThumb ha-icon{--mdc-icon-size:20px}.zoneCopy b{font-size:9px}.zoneCopy small{font-size:6.5px}.zoneDuration{font-size:10px}.zoneReady{--mdc-icon-size:13px}.rainNode{left:47%;width:24%;padding:6px 7px}.rainNode ha-icon{--mdc-icon-size:24px}.mainlinePump{left:45%;bottom:8%}.mainlineUnknown{left:35%;bottom:1%}
          .heroMetrics{gap:5px}.metricTile{grid-template-columns:27px minmax(0,1fr);min-height:61px;padding:6px}.metricTile ha-icon{--mdc-icon-size:22px}.metricTile small{font-size:6.5px}.metricTile b{font-size:11.5px}.nextCard{grid-template-columns:38px minmax(0,1fr);padding:13px 14px}.nextCard>ha-icon{--mdc-icon-size:31px}.nextCard b{font-size:14px}
          .nodeGrid{gap:5px}.nodeTile{grid-template-columns:28px minmax(0,1fr);min-height:70px;padding:7px}.nodeTile>ha-icon{--mdc-icon-size:23px}.nodeTile small{font-size:6.8px}.nodeTile b{font-size:11px}.nodeTile em{font-size:6.5px}.bottomNav button{min-height:64px;font-size:9px}.bottomNav button ha-icon{--mdc-icon-size:23px}.zoneFacts{gap:4px}.zoneFacts>div{padding:6px}.zoneFacts b{font-size:9.5px}
        }
        @media(max-width:390px){
          .heroHead{gap:7px}.heroHead h1{font-size:23px}.connectionBadge{font-size:10px;padding:7px 9px}.systemDiagram{min-height:338px}.controllerGraphic{width:20.5%}.rainNode{left:46%;width:25%}.zoneStack{width:37%}.diagramZone{grid-template-columns:35px minmax(0,1fr) auto 12px}.sceneThumb{width:35px;height:32px}.sceneThumb ha-icon{--mdc-icon-size:18px}.zoneCopy b{font-size:8px}.zoneCopy small{font-size:5.8px}.zoneDuration{font-size:9px}.heroMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.nodeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.bottomNav button span{font-size:8px}
        }
      `;
    }

    render() {
      if (!this.shadowRoot) return;
      if (!this._view || !VIEW_IDS.includes(this._view)) this._view = "status";
      const header = this.header();
      if (!this._hass) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content"><section class="systemHero unreliable"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>Загрузка данных…</h1><p>Ожидание Home Assistant</p></div></div><div class="systemDiagram"></div></section></main></div>${this.bottomNav()}${this.menuSheet()}`;
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
      this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content">${content}</main></div>${this.bottomNav()}${this.menuSheet()}`;
      this.bindActions();
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
})();
