(() => {
  const UI_VERSION = "0.5.3";
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);
  const VIEWS = ["status", "zones", "program", "manual", "diagnostics"];

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._view = "status";
      this._drillZone = null;
      this._manualZone = 1;
      this._manualDuration = 10;
    }

    set hass(value) { this._hass = value; this.render(); }
    set panel(value) { this._panel = value; }
    set narrow(value) { this.toggleAttribute("narrow", Boolean(value)); }
    connectedCallback() {
      this.render();
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    }

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
    state(entityId) { return entityId && this.states()[entityId] ? this.states()[entityId].state : "unavailable"; }
    attrs(entityId) { return entityId && this.states()[entityId] ? this.states()[entityId].attributes || {} : {}; }
    bad(value) { return BAD.has(value); }
    zoneSet(value) {
      if (this.bad(value) || value === "None") return new Set();
      return new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean));
    }
    moreInfo(entityId) {
      if (!entityId || !this.states()[entityId]) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId }, bubbles: true, composed: true,
      }));
    }
    openHaMenu() {
      this.dispatchEvent(new CustomEvent("hass-toggle-menu", {
        bubbles: true,
        composed: true,
      }));
    }
    async refreshNow() {
      if (!this._hass?.callService) return;
      const e = this.entities();
      const ids = [
        e.connection, e.operation, e.irrigation, e.active, e.queued,
        e.rain, e.seasonal, e.timerError, e.cache,
        ...Object.values(e.zones).flatMap((z) => [z.remaining, z.elapsed, z.schedule]),
      ].filter((id, index, all) => id && this.states()[id] && all.indexOf(id) === index);
      if (!ids.length) return;
      try {
        await this._hass.callService("homeassistant", "update_entity", { entity_id: ids });
      } catch (_err) {
        // The panel remains factual if forced refresh is unsupported.
      }
    }

    entities() {
      const base = "sensor.kontroller_poliva_ho_sc_8w";
      const e = {
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
        e.zones[zone] = {
          remaining: this.entity(`${base}_zone_${zone}_time_remaining`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_remaining`),
          elapsed: this.entity(`${base}_zone_${zone}_time_elapsed`, `_kontroller_poliva_ho_sc_8w_zone_${zone}_time_elapsed`),
          schedule: this.entity(`${base}_schedule_zone_${zone}`, `_kontroller_poliva_ho_sc_8w_schedule_zone_${zone}`),
        };
      }
      return e;
    }

    human(kind, value) {
      if (this.bad(value)) return "Нет данных";
      const maps = {
        operation: { Auto: "Авто", Manual: "Ручной", OFF: "Выключен" },
        irrigation: { order: "По порядку" },
        rain: { enabled: "Включён", disabled: "Выкл", true: "Включён", false: "Выкл" },
        cache: { complete: "Полный", partial: "Неполный" },
        alarm: { clear: "Нет", active: "Есть", true: "Есть", false: "Нет" },
      };
      return maps[kind]?.[String(value)] ?? String(value);
    }
    zoneStateText(value) {
      if (value === "configured") return "Готова";
      if (value === "disabled") return "Выключена";
      if (this.bad(value)) return "Нет данных";
      return String(value);
    }
    starts(attrs) { return Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : []; }
    compactStarts(attrs) {
      const starts = this.starts(attrs);
      if (!starts.length) return "—";
      return starts.length === 1 ? starts[0] : `${starts[0]} +${starts.length - 1}`;
    }
    cycleText(attrs) {
      const mode = attrs.calendar_mode || attrs.cycle_mode || "—";
      if (mode === "interval" && Number(attrs.interval_days) > 0) return `Каждые ${attrs.interval_days} дн.`;
      if (mode === "odd") return "Нечётные дни";
      if (mode === "even") return "Чётные дни";
      if (mode === "weekly") return "По дням недели";
      if (mode === "disabled") return "Выключено";
      return String(mode);
    }
    updatedAge(entityId) {
      const obj = entityId ? this.states()[entityId] : null;
      const stamp = obj?.last_updated || obj?.last_changed;
      if (!stamp) return "Нет времени данных";
      const seconds = Math.max(0, Math.round((Date.now() - new Date(stamp).getTime()) / 1000));
      if (seconds < 60) return `Обновлено ${seconds} с назад`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `Обновлено ${minutes} мин назад`;
      return `Обновлено ${Math.floor(minutes / 60)} ч назад`;
    }

    header() {
      return `<header class="appHeader">
        <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
        <div class="headerTitle"><strong>HO-SC-8W</strong><small>Система полива · UI v${UI_VERSION}</small></div>
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
      return `<nav class="bottomNav"><div class="bottomNavInner">${tabs.map(([id, icon, label]) => `<button class="${this._view === id ? "active" : ""}" data-view="${id}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</div></nav>`;
    }

    systemStatus(e) {
      const connection = this.state(e.connection);
      const operation = this.state(e.operation);
      const activeValue = this.state(e.active);
      const active = this.zoneSet(activeValue);
      const timerError = this.state(e.timerError);
      if (this.bad(connection) || this.bad(activeValue)) return { tone: "unknown", title: "Состояние неизвестно", sub: "Нет достоверных данных контроллера" };
      if (timerError === "active" || timerError === "true") return { tone: "warning", title: "Требуется внимание", sub: "Контроллер сообщает об ошибке таймера" };
      if (active.size) return { tone: "active", title: `Полив идёт · зона ${[...active][0]}`, sub: "Контроллер выполняет программу" };
      if (operation === "OFF") return { tone: "off", title: "Система выключена", sub: "Контроллер находится в режиме OFF" };
      return { tone: "ready", title: "Система готова", sub: "Автополив работает штатно" };
    }
    connectionBadge(e) {
      const value = this.state(e.connection);
      const label = value === "local" ? "Локально" : value === "cloud" ? "Облако" : "Нет данных";
      const tone = value === "local" ? "local" : value === "cloud" ? "cloud" : "unknown";
      return `<div class="connectionWrap"><div class="connectionBadge ${tone}"><i></i><b>${label}</b></div><small>${this.esc(this.updatedAge(e.connection))}</small></div>`;
    }
    zoneIcon(zone) {
      return ({ 1: "mdi:sprinkler", 2: "mdi:sprinkler-variant", 3: "mdi:flower", 4: "mdi:greenhouse", 5: "mdi:sprout", 6: "mdi:pine-tree" })[zone] || "mdi:water";
    }
    zoneRuntime(e, zone) {
      const q = e.zones[zone];
      const active = this.zoneSet(this.state(e.active));
      const queued = this.zoneSet(this.state(e.queued));
      const state = this.state(q.schedule);
      const attrs = this.attrs(q.schedule);
      const isActive = active.has(String(zone));
      const isQueued = queued.has(String(zone));
      let tone = "ready", label = this.zoneStateText(state);
      if (isActive) { tone = "running"; label = `Полив · ${this.state(q.remaining)} мин`; }
      else if (isQueued) { tone = "queued"; label = "В очереди"; }
      else if (state === "disabled") tone = "off";
      else if (this.bad(state)) tone = "unknown";
      return {
        q, tone, label,
        duration: attrs.duration_min ?? attrs.duration_minutes ?? "—",
        start: this.compactStarts(attrs),
        attrs,
      };
    }

    irrigationDiagram(e) {
      const active = this.zoneSet(this.state(e.active));
      const queued = this.zoneSet(this.state(e.queued));
      const valveXs = [246, 378, 510, 642, 774, 906];
      const waterLines = valveXs.map((x, idx) => {
        const zone = idx + 1;
        const cls = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "water";
        return `<path class="pipe ${cls}" d="M ${x} 304 V 320"/>`;
      }).join("");
      const controlDrops = valveXs.map((x) => `<path class="wire control" d="M ${x} 190 V 228"/>`).join("");
      const valves = valveXs.map((_, idx) => {
        const zone = idx + 1;
        const cls = active.has(String(zone)) ? "running" : queued.has(String(zone)) ? "queued" : "";
        return `<span class="valve ${cls}"><b>${zone}</b><i></i><em></em></span>`;
      }).join("");
      const zones = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
        const z = this.zoneRuntime(e, zone);
        const readyIcon = z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";
        return `<button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">
          <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>
          <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>
          <span class="duration">${this.esc(z.duration)}<small>мин</small></span>
          <ha-icon class="readyIcon" icon="${readyIcon}"></ha-icon>
        </button>`;
      }).join("");
      return `<div class="systemDiagram">
        <svg class="pipes" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
          <path class="wire rainWire" d="M 150 178 H 186 V 92 H 224"/>
          <path class="wire control" d="M 126 352 V 370 H 184 V 190 H 906"/>
          ${controlDrops}
          <path class="pipe supply" d="M 45 485 H 965 V 294 H 940"/>
          ${waterLines}
        </svg>
        <button class="controller" data-entity="${this.esc(e.connection)}"><div class="cap"></div><div class="body"><b>HO-SC-8W</b><i></i><small>INKBIRD / HiOazo</small></div><div class="ports"><i></i><i></i></div></button>
        <span class="controllerCheck ${this.bad(this.state(e.connection)) ? "bad" : ""}"><ha-icon icon="${this.bad(this.state(e.connection)) ? "mdi:help" : "mdi:check"}"></ha-icon></span>
        <div class="manifold"><div class="valves">${valves}</div><div class="rail"></div></div>
        <button class="rainSensor" data-entity="${this.esc(e.rain)}"><ha-icon icon="mdi:access-point"></ha-icon><span>Датчик<br>дождя</span></button>
        <div class="controlLabel">Провод управления клапанами</div>
        <div class="zoneRow">${zones}</div>
        <div class="mainlineDevice"><ha-icon icon="mdi:gauge"></ha-icon></div>
        <div class="mainlineLabel"><span>Входящая магистраль · Давление ·</span><b>Нет датчика</b></div>
      </div>`;
    }

    metrics(e) {
      const activeValue = this.state(e.active);
      const activeCount = this.bad(activeValue) ? "—" : this.zoneSet(activeValue).size;
      const seasonal = this.state(e.seasonal);
      const operation = this.state(e.operation);
      const rain = this.state(e.rain);
      const data = [
        ["mdi:home-automation", "Режим", this.human("operation", operation), e.operation, operation === "Auto" ? "good" : ""],
        ["mdi:account-group", "Активные зоны", activeCount, e.active, activeCount === 0 ? "" : "active"],
        ["mdi:water-percent", "Сезонная коррекция", this.bad(seasonal) ? "Нет данных" : `${seasonal} %`, e.seasonal, "water"],
        ["mdi:weather-rainy", "Дождевой датчик", this.human("rain", rain), e.rain, rain === "enabled" ? "good" : ""],
      ];
      return `<div class="metrics">${data.map(([icon, label, value, id, tone]) => `<button class="metric ${tone}" data-entity="${this.esc(id)}"><ha-icon icon="${icon}"></ha-icon><span><small>${label}</small><b>${this.esc(value)}</b>${label === "Активные зоны" && value === 0 ? `<em>Ожидание</em>` : ""}</span></button>`).join("")}</div>`;
    }
    hero(e) {
      const status = this.systemStatus(e);
      return `<section class="hero ${status.tone}"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionBadge(e)}</div>${this.irrigationDiagram(e)}${this.metrics(e)}</section>`;
    }

    nodes(e) {
      const connection = this.state(e.connection);
      const controller = this.bad(connection) ? "Нет связи" : connection === "local" ? "Онлайн" : connection === "cloud" ? "Облако" : connection;
      const cards = [
        ["mdi:memory", "Контроллер", controller, connection === "local" ? "Локальный канал" : "", e.connection, this.bad(connection) ? "bad" : "good"],
        ["mdi:pipe-valve", "Клапаны", "6 зон", "Зоны 1–6", null, "good"],
        ["mdi:water-pump", "Магистраль", "Нет датчика", "Не вычисляется", null, "unknown"],
        ["mdi:clipboard-text-outline", "Тест зона 8", "Диагн.", "Лабораторная", e.zones[8].schedule, "good"],
      ];
      return `<section class="sectionCard"><div class="sectionTitle">ОСНОВНЫЕ УЗЛЫ</div><div class="nodeGrid">${cards.map(([icon, title, value, note, id, tone]) => `<button class="node ${tone}" ${id ? `data-entity="${this.esc(id)}"` : ""}><ha-icon icon="${icon}"></ha-icon><span><small>${title}</small><b>${this.esc(value)}</b><em>${note}</em></span></button>`).join("")}</div></section>`;
    }
    currentMode(e) {
      const operation = this.state(e.operation);
      const seasonal = this.state(e.seasonal);
      return `<section class="sectionCard"><div class="sectionTitle">ТЕКУЩИЙ РЕЖИМ</div><div class="modeGrid">
        <button class="mode ${operation === "Auto" ? "active" : ""}" data-entity="${this.esc(e.operation)}"><ha-icon icon="mdi:home-automation"></ha-icon><b>Авто</b><small>${operation === "Auto" ? "Сейчас активно" : "Режим контроллера"}</small></button>
        <button class="mode" data-go="manual"><ha-icon icon="mdi:hand-back-right-outline"></ha-icon><b>Ручной</b><small>Доступен</small></button>
        <button class="mode disabled" disabled><ha-icon icon="mdi:pause-circle-outline"></ha-icon><b>Пауза</b><small>Недоступно</small></button>
        <button class="mode" data-go="program"><ha-icon icon="mdi:leaf"></ha-icon><b>Сезон</b><small>${this.bad(seasonal) ? "Нет данных" : `${seasonal} %`}</small></button>
      </div></section>`;
    }
    statusView(e) { return `${this.hero(e)}${this.nodes(e)}${this.currentMode(e)}`; }

    zoneDetail(e, zone) {
      const z = this.zoneRuntime(e, zone);
      const a = z.attrs;
      return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button><section class="detailCard"><div class="detailHead"><span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span><div><small>ЗОНА ${zone}</small><h2>${this.esc(z.label)}</h2></div></div><div class="detailGrid"><div><small>Длительность</small><b>${this.esc(z.duration)} мин</b></div><div><small>Старт</small><b>${this.esc(z.start)}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Дождь</small><b>${a.rain_sensor_follow === true ? "Учитывать" : a.rain_sensor_follow === false ? "Игнорировать" : "—"}</b></div></div><p>Фактические параметры DP38. Редактирование и raw-write из панели отсутствуют.</p></section>`;
    }
    zonesView(e) {
      if (this._drillZone) return this.zoneDetail(e, this._drillZone);
      const cards = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
        const z = this.zoneRuntime(e, zone);
        return `<button class="zoneCard ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span><span><small>ЗОНА ${zone}</small><b>${this.esc(z.label)}</b><em>${this.esc(z.start)} · ${this.esc(z.duration)} мин</em></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
      }).join("");
      return `<div class="pageIntro"><small>ЗОНЫ 1–6</small><h2>Рабочие зоны</h2><p>Фактическое состояние и программа каждого канала.</p></div><div class="zoneCards">${cards}</div>`;
    }
    programView(e) {
      const seasonal = this.state(e.seasonal);
      const rain = this.state(e.rain);
      const zoneRows = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
        const z = this.zoneRuntime(e, zone);
        return `<button class="programRow" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span>Зона ${zone}</span><b>${this.esc(z.start)} · ${this.esc(z.duration)} мин</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
      }).join("");
      return `<div class="pageIntro"><small>ПРОГРАММА</small><h2>Автоматический полив</h2><p>Read-only представление программы контроллера.</p></div><section class="summaryGrid"><button data-entity="${this.esc(e.operation)}"><small>Режим</small><b>${this.esc(this.human("operation", this.state(e.operation)))}</b></button><button data-entity="${this.esc(e.seasonal)}"><small>Сезон</small><b>${this.bad(seasonal) ? "Нет данных" : `${seasonal} %`}</b></button><button data-entity="${this.esc(e.rain)}"><small>Дождь</small><b>${this.esc(this.human("rain", rain))}</b></button><button data-entity="${this.esc(e.cache)}"><small>Кэш DP38</small><b>${this.esc(this.human("cache", this.state(e.cache)))}</b></button></section><section class="programList">${zoneRows}</section>`;
    }
    manualView(e) {
      const zoneButtons = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => `<button class="manualZone ${this._manualZone === zone ? "active" : ""}" data-manual-zone="${zone}">${zone}<small>Зона ${zone}</small></button>`).join("");
      return `<div class="pageIntro"><small>РУЧНОЙ ПОЛИВ</small><h2>Подготовка запуска</h2><p>Команда запуска остаётся закрытой до проверенного Actions API.</p></div><section class="manualCard"><div class="manualZones">${zoneButtons}</div><div class="stepper"><button data-duration="-1"><ha-icon icon="mdi:minus"></ha-icon></button><b>${this._manualDuration}<small> мин</small></b><button data-duration="1"><ha-icon icon="mdi:plus"></ha-icon></button></div><button class="lockedStart" disabled><ha-icon icon="mdi:lock-outline"></ha-icon>Запуск пока недоступен</button></section>`;
    }
    diagnosticsView(e) {
      const rows = [
        ["Соединение", e.connection, this.state(e.connection), ""],
        ["Режим", e.operation, this.state(e.operation), "operation"],
        ["Активные зоны", e.active, this.state(e.active), ""],
        ["Очередь", e.queued, this.state(e.queued), ""],
        ["Кэш DP38", e.cache, this.state(e.cache), "cache"],
        ["Ошибка таймера", e.timerError, this.state(e.timerError), "alarm"],
      ];
      const z8 = e.zones[8].schedule;
      return `<div class="pageIntro"><small>ДИАГНОСТИКА</small><h2>Состояние интеграции</h2><p>Только фактическая телеметрия.</p></div><section class="diagList">${rows.map(([label, id, value, kind]) => `<button data-entity="${this.esc(id)}"><span>${label}</span><b>${this.esc(kind ? this.human(kind, value) : value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`).join("")}</section><section class="lab"><h3>Зона 8 · лабораторная</h3><p>Состояние: <b>${this.esc(this.zoneStateText(this.state(z8)))}</b></p><p>Raw-write из панели отсутствует.</p></section>`;
    }

    bindActions() {
      this.shadowRoot.querySelector("[data-ha-menu]")?.addEventListener("click", () => this.openHaMenu());
      this.shadowRoot.querySelector("[data-refresh]")?.addEventListener("click", () => this.refreshNow());
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
        this._view = button.dataset.view || "status";
        this._drillZone = null;
        this.render();
        window.scrollTo({ top: 0, behavior: "auto" });
      }));
      this.shadowRoot.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => {
        this._view = button.dataset.go;
        this._drillZone = null;
        this.render();
        window.scrollTo({ top: 0, behavior: "auto" });
      }));
      this.shadowRoot.querySelector("[data-drill-back]")?.addEventListener("click", () => {
        this._drillZone = null;
        this.render();
      });
      this.shadowRoot.querySelectorAll("[data-zone]").forEach((button) => button.addEventListener("click", (event) => {
        if (event.currentTarget.dataset.zone) {
          this._view = "zones";
          this._drillZone = Number(event.currentTarget.dataset.zone);
          this.render();
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }));
      this.shadowRoot.querySelectorAll("[data-manual-zone]").forEach((button) => button.addEventListener("click", () => {
        this._manualZone = Number(button.dataset.manualZone) || 1;
        this.render();
      }));
      this.shadowRoot.querySelectorAll("[data-duration]").forEach((button) => button.addEventListener("click", () => {
        this._manualDuration = Math.min(120, Math.max(1, this._manualDuration + Number(button.dataset.duration || 0)));
        this.render();
      }));
      this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
        if (button.dataset.zone) return;
        let timer = null;
        let held = false;
        const id = button.dataset.entity;
        const clear = () => { if (timer) clearTimeout(timer); timer = null; };
        button.addEventListener("pointerdown", () => {
          held = false;
          timer = setTimeout(() => { held = true; this.moreInfo(id); }, 550);
        });
        button.addEventListener("pointerup", clear);
        button.addEventListener("pointercancel", clear);
        button.addEventListener("pointerleave", clear);
        button.addEventListener("click", (event) => {
          if (held) { event.preventDefault(); held = false; return; }
          this.moreInfo(id);
        });
      });
    }

    styles() {
      return `
        :host{--a:var(--primary-color,#079bd0);--green:#1fa647;--orange:#f59e0b;--card:var(--card-background-color,#fff);--bg:var(--primary-background-color,#fafafa);--text:var(--primary-text-color,#151515);--muted:var(--secondary-text-color,#6f6f72);--line:color-mix(in srgb,var(--text) 10%,transparent);--soft:color-mix(in srgb,var(--text) 4%,var(--card));--danger:var(--error-color,#d84040);display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}
        *{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}.app{max-width:920px;margin:0 auto;padding:0 14px calc(106px + env(safe-area-inset-bottom));min-height:100vh}.appHeader{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:56px minmax(0,1fr) 56px;align-items:center;gap:10px;min-height:80px;padding:calc(9px + env(safe-area-inset-top)) 0 8px;background:color-mix(in srgb,var(--bg) 97%,transparent);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid color-mix(in srgb,var(--text) 6%,transparent)}.headerButton{display:grid;place-items:center;width:56px;height:56px;padding:0;border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:0 6px 18px #0000000c;cursor:pointer}.headerButton ha-icon{--mdc-icon-size:30px}.refreshButton{color:var(--a)}.headerTitle{text-align:center;min-width:0}.headerTitle strong{display:block;font-size:25px;line-height:1;letter-spacing:-.04em}.headerTitle small{display:block;margin-top:5px;color:var(--muted);font-size:11px}.content{padding-top:12px}
        .hero,.sectionCard,.detailCard,.zoneCard,.programList,.summaryGrid,.manualCard,.diagList,.lab{background:var(--card);border:1px solid var(--line);box-shadow:0 8px 26px #00000008}.hero{padding:18px;border-radius:28px;background:linear-gradient(145deg,#fff 0%,#fff 78%,#f5fcff 100%)}.hero.ready{border-color:color-mix(in srgb,var(--green) 22%,var(--line))}.hero.active{border-color:color-mix(in srgb,var(--a) 45%,var(--line))}.hero.warning{border-color:color-mix(in srgb,var(--orange) 45%,var(--line))}.hero.unknown{border-color:color-mix(in srgb,var(--muted) 35%,var(--line))}.heroHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.heroHead>div:first-child{min-width:0}.heroHead small,.sectionTitle,.pageIntro>small{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.11em}.heroHead h1{margin:7px 0 5px;font-size:32px;line-height:.98;letter-spacing:-.05em}.heroHead p{margin:0;color:var(--muted);font-size:14px}.connectionWrap{text-align:right;flex:0 0 auto}.connectionBadge{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:99px;background:var(--soft);font-size:14px}.connectionBadge i{width:10px;height:10px;border-radius:50%;background:var(--muted)}.connectionBadge.local{background:#eaf7ee;color:var(--green)}.connectionBadge.local i{background:var(--green)}.connectionBadge.cloud{background:#edf8fc;color:var(--a)}.connectionBadge.cloud i{background:var(--a)}.connectionWrap>small{display:block;margin-top:6px;color:var(--muted);font-size:8px}
        .systemDiagram{position:relative;height:395px;margin-top:16px;border-radius:24px;background:linear-gradient(180deg,#fbfdfe,#fbfdfb);border:1px solid color-mix(in srgb,var(--text) 5%,transparent);overflow:hidden}.pipes{position:absolute;inset:0;width:100%;height:100%}.pipe{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.pipe.idle{stroke:#d0d8e2}.pipe.run,.pipe.supply{stroke:var(--a)}.pipe.queue{stroke:var(--orange)}.pipe.sensor{stroke:#b9c2cc;stroke-width:3;stroke-dasharray:8 7}.controller{position:absolute;z-index:2;left:2.5%;top:25%;width:20%;height:49%;padding:0;border:1px solid #cbd3dc;border-radius:15px;background:linear-gradient(180deg,#fbfcfd,#e5ebf0);box-shadow:0 10px 20px #00000016;overflow:hidden}.controller .cap{height:13%;border-bottom:1px solid #cbd3dc;background:linear-gradient(#fff,#e9edf1)}.controller .body{height:74%;display:grid;place-items:center;align-content:center;gap:10px;color:#4a535d}.controller .body b{font-size:12px}.controller .body small{font-size:7px;color:#808994}.controller .body>i{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px #1fa6471b}.controller .ports{height:13%;display:flex;justify-content:center;gap:20px;border-top:1px solid #cbd3dc;background:#dfe5ea}.controller .ports i{width:10px;height:12px;background:#26313a;border-radius:0 0 4px 4px}.controllerCheck{position:absolute;z-index:3;left:17.4%;top:22%;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:var(--green);color:#fff;box-shadow:0 5px 11px #0002}.controllerCheck.bad{background:var(--muted)}.controllerCheck ha-icon{--mdc-icon-size:19px}.manifold{position:absolute;z-index:2;left:25%;top:38%;width:34%;height:30%}.valves{position:absolute;left:2%;right:2%;top:0;display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.valve{display:grid;justify-items:center;color:var(--muted)}.valve b{font-size:8px;margin-bottom:2px}.valve i{width:17px;height:53px;border-radius:7px;background:linear-gradient(#39434c,#161b20);border:1px solid #111;box-shadow:inset 0 8px 0 #4a555e}.valve em{width:8px;height:14px;margin-top:-2px;border-radius:0 0 3px 3px;background:#65717b}.valve.running i{box-shadow:inset 0 8px 0 #2d7b98,0 0 0 2px #079bd077}.valve.queued i{box-shadow:inset 0 8px 0 #977628,0 0 0 2px #f59e0b66}.rail{position:absolute;left:0;right:0;top:55%;height:20px;border-radius:10px;background:linear-gradient(#505961,#252b31);box-shadow:0 5px 10px #0003}.rainSensor{position:absolute;z-index:3;left:49%;top:3%;display:grid;grid-template-columns:34px auto;align-items:center;gap:7px;padding:7px 10px;border:0;background:transparent;color:var(--muted);text-align:left}.rainSensor ha-icon{color:#8e98a3;--mdc-icon-size:28px}.rainSensor span{font-size:8px;line-height:1.1}.zoneStack{position:absolute;z-index:2;right:2%;top:7%;width:35.5%;display:grid;gap:6px}.diagramZone{display:grid;grid-template-columns:51px minmax(0,1fr) auto 17px;align-items:center;gap:7px;min-height:51px;padding:5px 7px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;box-shadow:0 3px 8px #00000006}.diagramZone.running{border-color:#079bd088;background:#f1fbff}.diagramZone.queued{border-color:#f59e0b77}.diagramZone.off,.diagramZone.unknown{opacity:.62}.scene{display:grid;place-items:center;width:51px;height:40px;border-radius:9px;color:white;text-shadow:0 1px 3px #0008;overflow:hidden}.scene ha-icon{--mdc-icon-size:23px}.scene1,.scene2{background:linear-gradient(180deg,#77c9e8 0 40%,#75c85b 41% 100%)}.scene3{background:linear-gradient(145deg,#6fb25b,#e76f92 50%,#79563c)}.scene4{background:linear-gradient(145deg,#74badb,#e1f0ec 53%,#5b9f59)}.scene5{background:linear-gradient(145deg,#8cbf62,#6b4d31)}.scene6{background:linear-gradient(145deg,#75b4dc,#4d9758 58%,#6f5037)}.zoneText{min-width:0}.zoneText b{display:block;font-size:10.5px;line-height:1}.zoneText small{display:block;margin-top:3px;overflow:hidden;color:var(--muted);font-size:7px;white-space:nowrap;text-overflow:ellipsis}.duration{font-size:12px;font-weight:850;text-align:right}.duration small{display:block;font-size:6px;color:var(--muted)}.readyIcon{color:var(--green);--mdc-icon-size:15px}.mainlineDevice{position:absolute;z-index:2;left:44.5%;bottom:6.5%;display:grid;place-items:center;width:64px;height:36px;border-radius:14px;background:linear-gradient(#555e66,#252b31);color:#55bdea;box-shadow:0 4px 10px #0003}.mainlineDevice ha-icon{--mdc-icon-size:24px}.mainlineLabel{position:absolute;z-index:3;left:39%;bottom:0.5%;display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:12px;background:#fff;border:1px solid var(--line);font-size:8px;color:var(--muted)}.mainlineLabel b{color:var(--muted);font-size:9px}
        .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.metric{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:8px;min-height:72px;padding:9px;border:1px solid var(--line);border-radius:18px;background:#fff;text-align:left}.metric ha-icon{color:var(--muted);--mdc-icon-size:29px}.metric small{display:block;color:var(--muted);font-size:7px;line-height:1.1}.metric b{display:block;margin-top:3px;font-size:14px;line-height:1.05}.metric em{display:block;margin-top:3px;color:var(--muted);font-size:7px;font-style:normal}.metric.good b,.metric.good ha-icon{color:var(--green)}.metric.water ha-icon{color:var(--a)}.metric.active b,.metric.active ha-icon{color:var(--a)}
        .sectionCard{margin-top:12px;padding:16px;border-radius:25px}.sectionTitle{margin:0 0 11px 2px}.nodeGrid,.modeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.node{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:8px;min-height:80px;padding:10px;border:1px solid var(--line);border-radius:18px;background:#fff;text-align:left}.node>ha-icon{color:var(--muted);--mdc-icon-size:30px}.node small{display:block;color:var(--muted);font-size:7px}.node b{display:block;margin-top:3px;font-size:13px;line-height:1.05}.node em{display:block;margin-top:4px;color:var(--muted);font-size:7px;font-style:normal}.node.good b,.node.good>ha-icon{color:var(--green)}.node.bad b,.node.bad>ha-icon{color:var(--danger)}.node.unknown{opacity:.7}.mode{display:grid;place-items:center;align-content:center;min-height:104px;padding:10px;border:1px solid var(--line);border-radius:20px;background:#fff;text-align:center}.mode ha-icon{color:var(--muted);--mdc-icon-size:34px}.mode b{margin-top:7px;font-size:14px}.mode small{margin-top:4px;color:var(--muted);font-size:8px}.mode.active{border-color:#079bd099;background:#f4fbff}.mode.active ha-icon,.mode.active b,.mode.active small{color:var(--a)}.mode.disabled{opacity:.55}
        .pageIntro{padding:7px 4px 15px}.pageIntro h2{margin:5px 0 0;font-size:27px;letter-spacing:-.04em}.pageIntro p{margin:6px 0 0;color:var(--muted);font-size:12px}.zoneCards{display:grid;gap:9px}.zoneCard{display:grid;grid-template-columns:54px minmax(0,1fr) 22px;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:20px;text-align:left}.zoneCard span:nth-child(2) small{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.08em}.zoneCard span:nth-child(2) b{display:block;margin-top:3px;font-size:16px}.zoneCard span:nth-child(2) em{display:block;margin-top:3px;color:var(--muted);font-size:9px;font-style:normal}.inlineBack{display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;padding:8px 11px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--a)}.detailCard{padding:16px;border-radius:22px}.detailHead{display:flex;align-items:center;gap:12px}.detailHead small{color:var(--muted);font-size:8px;font-weight:800}.detailHead h2{margin:3px 0 0;font-size:22px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.detailGrid>div{padding:10px;border-radius:14px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:8px}.detailGrid b{display:block;margin-top:3px;font-size:12px}.detailCard p{color:var(--muted);font-size:10px;line-height:1.4}.summaryGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px;border-radius:22px}.summaryGrid button{padding:10px;border:0;border-radius:14px;background:var(--soft);text-align:left}.summaryGrid small{display:block;color:var(--muted);font-size:8px}.summaryGrid b{display:block;margin-top:3px;font-size:14px}.programList{margin-top:10px;border-radius:22px;overflow:hidden}.programRow{display:grid;grid-template-columns:1fr auto 20px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 13px;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left}.programRow:last-child{border-bottom:0}.programRow b{font-size:11px}.programRow ha-icon{color:var(--muted)}.manualCard{padding:16px;border-radius:22px}.manualZones{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.manualZone{display:grid;place-items:center;min-height:64px;border:1px solid var(--line);border-radius:16px;background:var(--soft);font-size:20px;font-weight:800}.manualZone small{display:block;color:var(--muted);font-size:8px;font-weight:500}.manualZone.active{border-color:#079bd099;background:#f2fbff;color:var(--a)}.stepper{display:grid;grid-template-columns:54px 1fr 54px;align-items:center;gap:10px;margin-top:18px}.stepper button{display:grid;place-items:center;height:54px;border:1px solid var(--line);border-radius:16px;background:var(--soft)}.stepper>b{text-align:center;font-size:32px}.stepper>b small{font-size:13px;color:var(--muted)}.lockedStart{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:54px;margin-top:15px;border:0;border-radius:16px;background:var(--soft);color:var(--muted);font-weight:800}.diagList{border-radius:22px;overflow:hidden}.diagList button{display:grid;grid-template-columns:1fr auto 20px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 13px;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left}.diagList button:last-child{border-bottom:0}.diagList b{font-size:11px}.lab{margin-top:10px;padding:14px;border-radius:22px}.lab h3{margin:0 0 8px}.lab p{margin:5px 0;color:var(--muted);font-size:10px}
        .bottomNav{position:fixed;z-index:30;left:0;right:0;bottom:0;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 97%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;max-width:920px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:3px;min-height:65px;border:0;border-radius:17px;background:transparent;color:var(--muted);font-size:9px;font-weight:750}.bottomNav button ha-icon{--mdc-icon-size:25px}.bottomNav button.active{background:#eaf7fc;color:var(--a)}
        @media(max-width:520px){.app{padding-left:10px;padding-right:10px}.appHeader{grid-template-columns:50px minmax(0,1fr) 50px;min-height:74px;padding-top:calc(7px + env(safe-area-inset-top))}.headerButton{width:50px;height:50px;border-radius:18px}.headerButton ha-icon{--mdc-icon-size:27px}.headerTitle strong{font-size:21px}.headerTitle small{font-size:9.5px}.content{padding-top:9px}.hero{padding:14px;border-radius:24px}.heroHead h1{font-size:26px}.heroHead p{font-size:11.5px}.connectionBadge{padding:8px 11px;font-size:11px}.connectionWrap>small{font-size:7px}.systemDiagram{height:350px;margin-top:13px}.controller{left:2%;top:27%;width:20.5%;height:49%}.controller .body b{font-size:10px}.controller .body small{font-size:6px}.controllerCheck{left:17%;top:24%;width:28px;height:28px}.manifold{left:25%;top:40%;width:35%}.valve i{width:14px;height:47px}.zoneStack{right:1.5%;top:6.5%;width:36.5%;gap:5px}.diagramZone{grid-template-columns:42px minmax(0,1fr) auto 14px;gap:5px;min-height:47px;padding:4px 5px}.scene{width:42px;height:36px}.scene ha-icon{--mdc-icon-size:19px}.zoneText b{font-size:9px}.zoneText small{font-size:6px}.duration{font-size:10px}.readyIcon{--mdc-icon-size:13px}.rainSensor{left:47%;top:2%;padding:5px}.mainlineDevice{left:44%;bottom:6%}.mainlineLabel{left:35%;bottom:.5%}.metrics{gap:5px}.metric{grid-template-columns:27px minmax(0,1fr);min-height:62px;padding:6px}.metric ha-icon{--mdc-icon-size:22px}.metric small{font-size:6.2px}.metric b{font-size:11px}.nodeGrid,.modeGrid{gap:5px}.node{grid-template-columns:28px minmax(0,1fr);min-height:69px;padding:7px}.node>ha-icon{--mdc-icon-size:23px}.node small{font-size:6.5px}.node b{font-size:10.5px}.node em{font-size:6px}.mode{min-height:88px;padding:7px}.mode ha-icon{--mdc-icon-size:28px}.mode b{font-size:12px}.mode small{font-size:7px}.bottomNav button{min-height:63px}}
        @media(max-width:390px){.heroHead h1{font-size:23px}.connectionBadge{font-size:10px;padding:7px 9px}.systemDiagram{height:330px}.zoneStack{width:37.5%}.diagramZone{grid-template-columns:35px minmax(0,1fr) auto 12px}.scene{width:35px;height:31px}.zoneText b{font-size:8px}.duration{font-size:9px}.metrics,.nodeGrid,.modeGrid{grid-template-columns:repeat(2,1fr)}}
        /* v0.5.3: separate hydraulic routing from controller wiring. */
        .systemDiagram{height:430px}
        .pipe.water{stroke:color-mix(in srgb,var(--a) 62%,#d9e9f3)}
        .wire{fill:none;stroke:#74818d;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
        .wire.rainWire{stroke-width:2.7}
        .controller{left:2.5%;top:25%;width:14.5%;height:44%}
        .controller .body b{font-size:10px}.controller .body small{font-size:6px}.controller .ports{gap:11px}.controller .ports i{width:7px;height:10px;background:#59656f}
        .controllerCheck{left:13.5%;top:22.5%;width:27px;height:27px}.controllerCheck ha-icon{--mdc-icon-size:16px}
        .manifold{left:18%;right:3%;top:39%;width:auto;height:27%}.valves{left:0;right:0;gap:5px}.valve b{font-size:8px}.rail{top:55%}
        .rainSensor{left:18%;top:3%;grid-template-columns:30px auto;padding:6px 8px}.rainSensor ha-icon{--mdc-icon-size:25px}.rainSensor span{font-size:8px}
        .controlLabel{position:absolute;z-index:3;right:10%;top:27%;padding:3px 7px;border-radius:9px;background:#fbfdfdcc;color:#687681;font-size:9px;white-space:nowrap}
        .zoneRow{position:absolute;z-index:2;left:18%;right:3%;top:59%;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
        .zoneRow .diagramZone{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:50px auto auto;align-content:start;justify-items:stretch;gap:4px;min-width:0;min-height:118px;padding:6px 5px;border-radius:14px;text-align:left}
        .zoneRow .scene{width:100%;height:50px;border-radius:9px}.zoneRow .scene ha-icon{--mdc-icon-size:23px}
        .zoneRow .zoneText{min-width:0;text-align:left}.zoneRow .zoneText b{font-size:9.5px;white-space:nowrap}.zoneRow .zoneText small{margin-top:3px;font-size:6.5px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
        .zoneRow .duration{display:flex;align-items:baseline;gap:2px;font-size:12px;text-align:left}.zoneRow .duration small{display:inline;font-size:6px}
        .zoneRow .readyIcon{position:absolute;right:3px;top:3px;--mdc-icon-size:13px;filter:drop-shadow(0 1px 2px #fff)}
        .mainlineDevice{left:5%;bottom:5.5%;width:39px;height:39px;border:2px solid #687681;border-radius:50%;background:#fff;color:var(--a);box-shadow:none}.mainlineDevice ha-icon{--mdc-icon-size:25px}
        .mainlineLabel{left:50%;bottom:.5%;transform:translateX(-50%);gap:4px;padding:4px 8px;font-size:8px;white-space:nowrap}.mainlineLabel b{font-size:8.5px}
        @media(max-width:520px){.systemDiagram{height:385px}.controller{left:2%;top:27%;width:15%;height:42%}.controller .body b{font-size:8px}.controller .body small{font-size:5px}.controllerCheck{left:12.8%;top:24%;width:24px;height:24px}.manifold{left:18%;right:2%;top:40%;height:26%}.valve i{width:14px;height:47px}.rainSensor{left:17%;top:2%;padding:4px}.rainSensor span{font-size:7px}.controlLabel{right:4%;top:27%;font-size:7px}.zoneRow{left:18%;right:2%;top:59%;gap:4px}.zoneRow .diagramZone{grid-template-rows:35px auto auto;gap:3px;min-height:105px;padding:4px 3px;border-radius:11px}.zoneRow .scene{height:35px;border-radius:7px}.zoneRow .scene ha-icon{--mdc-icon-size:17px}.zoneRow .zoneText b{font-size:7.5px}.zoneRow .zoneText small{font-size:5.2px}.zoneRow .duration{font-size:9.5px}.zoneRow .duration small{font-size:5px}.zoneRow .readyIcon{right:2px;top:2px;--mdc-icon-size:10px}.mainlineDevice{left:4%;bottom:5%;width:34px;height:34px}.mainlineDevice ha-icon{--mdc-icon-size:21px}.mainlineLabel{bottom:.3%;padding:3px 6px;font-size:6.8px}.mainlineLabel b{font-size:7px}}
        @media(max-width:390px){.systemDiagram{height:370px}.controlLabel{font-size:6.3px}.zoneRow .diagramZone{grid-template-rows:31px auto auto;min-height:99px;padding:3px 2px}.zoneRow .scene{height:31px}.zoneRow .zoneText b{font-size:7px}.zoneRow .zoneText small{font-size:4.8px}.zoneRow .duration{font-size:9px}.mainlineLabel{font-size:6.2px}.mainlineLabel b{font-size:6.5px}}
      `;
    }

    render() {
      if (!this.shadowRoot) return;
      if (!VIEWS.includes(this._view)) this._view = "status";
      const header = this.header();
      if (!this._hass) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content"><section class="hero unknown"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>Загрузка данных…</h1><p>Ожидание Home Assistant</p></div></div><div class="systemDiagram"></div></section></main></div>${this.bottomNav()}`;
        this.bindActions();
        return;
      }
      const e = this.entities();
      let content = this.statusView(e);
      if (this._view === "zones") content = this.zonesView(e);
      else if (this._view === "program") content = this.programView(e);
      else if (this._view === "manual") content = this.manualView(e);
      else if (this._view === "diagnostics") content = this.diagnosticsView(e);
      this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${header}<main class="content">${content}</main></div>${this.bottomNav()}`;
      this.bindActions();
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) {
    customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
  }
})();
