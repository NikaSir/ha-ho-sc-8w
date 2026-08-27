(() => {
  const UI_VERSION = "0.6.14";
  const ASSET_VERSION = "0.6.14";
  const ASSET_BASE = "/nikas-ho-sc-8w/assets";
  const assetUrl = (name) => `${ASSET_BASE}/${name}?v=${ASSET_VERSION}`;
  const APPROVED_VISUALS = Object.freeze({
    nodeController: assetUrl("ho-sc-8w-controller-node-v4.webp"),
    nodeValve: assetUrl("valve-v2.webp"),
    nodeMainline: assetUrl("mainline-node.webp"),
    controller: assetUrl("ho-sc-8w-controller-v4.webp"),
    rain: assetUrl("rain-sensor-v5.webp"),
    manifold: assetUrl("manifold-v1.webp"),
    zone1: assetUrl("zone-1.webp"),
    zone2: assetUrl("zone-1.webp"),
    zone3: assetUrl("zone-1.webp"),
    zone4: assetUrl("zone-3.webp"),
    zone5: assetUrl("zone-5.webp"),
    zone6: assetUrl("zone-4.webp"),
  });
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);
  const VIEWS = ["status", "zones", "program", "manual", "diagnostics"];
  const VIEW_SCALE_MIN = 0.75;
  const VIEW_SCALE_MAX = 2;
  const VIEW_SCALE_SNAP_MIN = 0.97;
  const VIEW_SCALE_SNAP_MAX = 1.03;
  const VIEW_STATE_PREFIX = "nikas_ho_sc_8w.view_transform.v2";

  class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._view = "status";
      this._drillZone = null;
      this._manualZone = 1;
      this._manualDuration = 10;
      this._renderQueued = false;
      this._renderDeferred = false;
      this._viewTransform = { scale: 1, x: 0, y: 0 };
      this._viewTransformKey = null;
      this._gesturePointers = new Map();
      this._gestureStart = null;
      this._gestureMoved = false;
      this._hadMultiTouch = false;
      this._twoFingerTapAt = 0;
      this._suppressClicksUntil = 0;
      this._scaleToastTimer = null;
      this._resizeBound = false;
      this._wheelSaveTimer = null;
      this._nativeScrollPositions = new Map();
      this._pendingScrollTop = null;
      this._shellMounted = false;
      this._renderedStructureKey = null;
      this._viewNodeCache = new Map();
      this._longPressTimer = null;
      this._longPressTarget = null;
      this._longPressHeld = false;
      this._onRealViewportResize = () => requestAnimationFrame(() => this._clampAndApplyTransform(false));
    }

    set hass(value) { this._hass = value; this._queueRender(); }
    set panel(value) { this._panel = value; this._viewTransformKey = null; this._queueRender(); }
    set narrow(value) { this.toggleAttribute("narrow", Boolean(value)); }
    connectedCallback() {
      if (!this._resizeBound) {
        window.addEventListener("resize", this._onRealViewportResize);
        window.visualViewport?.addEventListener("resize", this._onRealViewportResize);
        this._resizeBound = true;
      }
      this._queueRender();
    }
    disconnectedCallback() {
      window.removeEventListener("resize", this._onRealViewportResize);
      window.visualViewport?.removeEventListener("resize", this._onRealViewportResize);
      this._resizeBound = false;
    }

    _queueRender() {
      if (this._gesturePointers.size) {
        this._renderDeferred = true;
        return;
      }
      if (this._renderQueued) return;
      const currentViewport = this.shadowRoot?.querySelector("[data-work-viewport]");
      if (currentViewport && this._viewTransform.scale <= 1) {
        this._nativeScrollPositions.set(this._transformStorageKey(), currentViewport.scrollTop);
      }
      this._renderQueued = true;
      requestAnimationFrame(() => {
        this._renderQueued = false;
        if (this._gesturePointers.size) {
          this._renderDeferred = true;
          return;
        }
        this._render();
      });
    }

    _transformStorageKey() {
      const owner = this._panel?.config?.entry_id || this._panel?.config?.device_id || "default";
      return `${VIEW_STATE_PREFIX}:${owner}:${this._view}`;
    }

    _restoreTransform(force = false) {
      const key = this._transformStorageKey();
      if (!force && this._viewTransformKey === key) return;
      this._viewTransformKey = key;
      this._viewTransform = { scale: 1, x: 0, y: 0 };
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        if (saved && Number.isFinite(saved.scale) && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          this._viewTransform = { scale: this._clampScale(saved.scale), x: saved.x, y: saved.y };
        }
      } catch (_error) { /* storage may be unavailable or stale */ }
    }

    _saveTransform() {
      try { localStorage.setItem(this._transformStorageKey(), JSON.stringify(this._viewTransform)); } catch (_error) { /* storage may be unavailable */ }
    }

    _clampScale(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 1;
      return Math.min(VIEW_SCALE_MAX, Math.max(VIEW_SCALE_MIN, numeric));
    }

    _transformCss() {
      const { scale, x, y } = this._viewTransform;
      return `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    }

    _workspace(content) {
      this._restoreTransform(false);
      const mode = this._viewTransform.scale > 1 ? "isZoomed" : "isNative";
      return `<div class="workViewport ${mode}" data-work-viewport>
        <div class="workCanvas" data-work-canvas style="transform:${this._transformCss()}"><main class="content">${content}</main></div>
        <div class="scaleToast" data-scale-toast aria-live="polite"></div>
      </div>`;
    }

    _showScaleToast(text) {
      const toast = this.shadowRoot.querySelector("[data-scale-toast]");
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add("show");
      clearTimeout(this._scaleToastTimer);
      this._scaleToastTimer = setTimeout(() => toast.classList.remove("show"), 1100);
    }

    _applyTransform() {
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");
      if (canvas) canvas.style.transform = this._transformCss();
      if (viewport) {
        viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1);
        viewport.classList.toggle("isNative", this._viewTransform.scale <= 1);
      }
    }

    _clampAndApplyTransform(persist = false) {
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");
      if (!viewport || !canvas) return;
      const scale = this._clampScale(this._viewTransform.scale);
      if (scale <= 1) {
        this._viewTransform = { scale, x: 0, y: 0 };
        this._applyTransform();
        if (persist) this._saveTransform();
        return;
      }
      const naturalWidth = Math.max(canvas.offsetWidth, 1);
      const naturalHeight = Math.max(canvas.scrollHeight, canvas.offsetHeight, 1);
      const minX = Math.min(0, viewport.clientWidth - naturalWidth * scale);
      const minY = Math.min(0, viewport.clientHeight - naturalHeight * scale);
      this._viewTransform = {
        scale,
        x: Math.min(0, Math.max(minX, this._viewTransform.x)),
        y: Math.min(0, Math.max(minY, this._viewTransform.y)),
      };
      this._applyTransform();
      if (persist) this._saveTransform();
    }

    _resetTransform(showToast = true) {
      this._viewTransform = { scale: 1, x: 0, y: 0 };
      this._clampAndApplyTransform(true);
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      if (viewport) viewport.scrollTop = 0;
      this._nativeScrollPositions.set(this._transformStorageKey(), 0);
      if (showToast) this._showScaleToast("Масштаб 100%");
    }

    _switchView(view) {
      this._saveTransform();
      this._view = VIEWS.includes(view) ? view : "status";
      this._drillZone = null;
      this._viewTransformKey = null;
      this._restoreTransform(true);
      this._viewTransform = { scale: this._viewTransform.scale, x: 0, y: 0 };
      this._saveTransform();
      this._pendingScrollTop = 0;
      this._nativeScrollPositions.set(this._transformStorageKey(), 0);
      this.render();
    }

    _restoreNativeScroll() {
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      if (!viewport || this._viewTransform.scale > 1) return;
      const saved = this._pendingScrollTop ?? this._nativeScrollPositions.get(this._transformStorageKey()) ?? 0;
      this._pendingScrollTop = null;
      viewport.scrollTop = Math.max(0, saved);
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
    normalizedLabel(value) {
      return String(value ?? "").trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, " ");
    }
    entityByFriendlyName(...names) {
      const wanted = names.map((name) => this.normalizedLabel(name)).filter(Boolean);
      const entries = Object.entries(this.states());
      const exact = entries.find(([, value]) => wanted.includes(this.normalizedLabel(value?.attributes?.friendly_name)));
      if (exact) return exact[0];
      const related = entries.find(([, value]) => {
        const friendlyName = this.normalizedLabel(value?.attributes?.friendly_name);
        return wanted.some((name) => friendlyName.includes(name));
      });
      return related?.[0] || null;
    }
    pressureEntity() {
      const exactEntityId = "sensor.nikas_h2000_pro_voda_na_poliv_2";
      if (this.states()[exactEntityId]) return exactEntityId;
      const irrigationWater = Object.entries(this.states()).find(([entityId, value]) => {
        if (!entityId.startsWith("sensor.")) return false;
        const haystack = `${this.normalizedLabel(entityId)} ${this.normalizedLabel(value?.attributes?.friendly_name)}`;
        const unit = this.normalizedLabel(value?.attributes?.unit_of_measurement);
        const isIrrigationWater = haystack.includes("вода на полив") || haystack.includes("voda_na_poliv");
        return isIrrigationWater && (unit === "bar" || unit === "бар");
      });
      if (irrigationWater) return irrigationWater[0];
      const named = this.entityByFriendlyName("Датчик давления полив");
      if (named) return named;
      const related = Object.entries(this.states()).find(([entityId, value]) => {
        if (!entityId.startsWith("sensor.")) return false;
        const haystack = `${this.normalizedLabel(entityId)} ${this.normalizedLabel(value?.attributes?.friendly_name)}`;
        const isPressure = haystack.includes("давлен") || haystack.includes("pressure");
        const isIrrigation = haystack.includes("полив") || haystack.includes("irrig");
        return isPressure && isIrrigation;
      });
      return related?.[0] || null;
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
        e.rain, e.pressure, e.seasonal, e.timerError, e.cache,
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
        pressure: this.pressureEntity(),
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
    pressurePresentation(e) {
      if (!e.pressure) {
        return { value: "Нет данных", note: "NikaS H2000+Pro · Вода на полив", tone: "unknown" };
      }
      const value = this.state(e.pressure);
      if (this.bad(value)) {
        return { value: "Нет данных", note: "NikaS H2000+Pro · Вода на полив", tone: "unknown" };
      }
      const unit = this.attrs(e.pressure).unit_of_measurement;
      const numeric = Number(String(value).replace(",", "."));
      const formatted = (unit === "bar" || unit === "бар") && Number.isFinite(numeric)
        ? numeric.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value;
      return {
        value: `${formatted}${unit ? ` ${unit}` : ""}`,
        note: "NikaS H2000+Pro · Вода на полив",
        tone: "good",
      };
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
    updatedValue(entityId) {
      const obj = entityId ? this.states()[entityId] : null;
      const stamp = obj?.last_updated || obj?.last_changed;
      if (!stamp) return "—";
      const seconds = Math.max(0, Math.round((Date.now() - new Date(stamp).getTime()) / 1000));
      if (seconds < 60) return `${seconds} с`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} мин`;
      return `${Math.floor(minutes / 60)} ч`;
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
      const pressure = this.pressurePresentation(e);
      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";
      return `<div class="connectionWrap"><div class="connectionBadge ${tone}"><i></i><b>${label}</b></div><small>${this.esc(this.updatedAge(e.connection))}</small><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button></div>`;
    }
    zoneIcon(zone) {
      return ({ 1: "mdi:sprinkler", 2: "mdi:sprinkler", 3: "mdi:sprinkler", 4: "mdi:flower", 5: "mdi:shrub", 6: "mdi:greenhouse" })[zone] || "mdi:water";
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
      const columns = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
        const z = this.zoneRuntime(e, zone);
        const valveTone = active.has(String(zone)) ? "running" : queued.has(String(zone)) ? "queued" : "";
        const branchTone = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "water";
        const readyIcon = z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";
        return `<div class="schemaColumn" data-axis="${zone}">
          <span class="valveNumber">${zone}</span>
          <span class="valvePhoto ${valveTone}" aria-hidden="true"></span>
          <span class="waterBranch ${branchTone}" aria-hidden="true"></span>
          <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">
            <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>
          </button>
        </div>`;
      }).join("");
      return `<div class="systemDiagram">
        <svg class="deviceWires" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">
          <path class="wire rainWire" d="M 248 57 L 338 82"/>
          <path class="wire controlLead" d="M 205 82 V 110 H 82"/>
        </svg>
        <button class="controller" data-entity="${this.esc(e.connection)}"><div class="cap"></div><div class="body"><b>HO-SC-8W</b><i></i><small>INKBIRD / HiOazo</small></div><div class="ports"><i></i><i></i></div></button>
        <button class="rainSensor" data-entity="${this.esc(e.rain)}"><ha-icon icon="mdi:access-point"></ha-icon><span>Датчик<br>дождя</span></button>
        <div class="controlBus"><span>Провод управления клапанами</span></div>
        <div class="manifoldRail" aria-hidden="true"></div>
        <div class="supplyLine" aria-hidden="true"></div>
        <div class="schemaGrid">${columns}</div>
      </div>`;
    }

    metrics(e) {
      const seasonal = this.state(e.seasonal);
      const operation = this.state(e.operation);
      const nextStart = this.zoneRuntime(e, 1).start;
      const data = [
        ["mdi:calendar-blank-outline", "ПРОГРАММА", nextStart, "Следующий полив", e.zones[1].schedule, "water"],
        ["mdi:autorenew", "РЕЖИМ", this.human("operation", operation), this.bad(seasonal) ? "Сезон · —" : `Сезон · ${seasonal} %`, e.operation, operation === "Auto" ? "active" : ""],
        ["mdi:signal", "ТЕЛЕМЕТРИЯ", this.updatedValue(e.connection), "Последнее обновление", e.connection, "good"],
      ];
      return `<div class="metrics">${data.map(([icon, label, value, note, id, tone]) => `<button class="metric ${tone}" data-entity="${this.esc(id)}"><small>${label}</small><div><ha-icon icon="${icon}"></ha-icon><span><b>${this.esc(value)}</b><em>${this.esc(note)}</em></span></div></button>`).join("")}</div>`;
    }
    hero(e) {
      const status = this.systemStatus(e);
      return `<section class="hero ${status.tone}"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionBadge(e)}</div>${this.irrigationDiagram(e)}</section>`;
    }

    nodes(e) {
      const connection = this.state(e.connection);
      const controller = this.bad(connection) ? "Нет связи" : connection === "local" ? "Локально" : connection === "cloud" ? "Облако" : connection;
      const pressure = this.pressurePresentation(e);
      const cards = [
        ["mdi:memory", "Контроллер", controller, connection === "local" ? "Локальный канал" : "", e.connection, this.bad(connection) ? "bad" : "good"],
        ["mdi:pipe-valve", "Клапаны", "6 зон", "Зоны 1–6", null, "good"],
        ["mdi:water", "Давление", pressure.value, "Норма", e.pressure, pressure.tone],
        ["mdi:weather-rainy", "Дождь", this.human("rain", this.state(e.rain)), "Без блокировки", e.rain, this.state(e.rain) === "enabled" ? "good" : ""],
      ];
      return `<section class="sectionCard statusesCard"><div class="statusesHead"><div class="sectionTitle">Статусы</div><span>Все ›</span></div><div class="nodeGrid">${cards.map(([icon, title, value, note, id, tone]) => `<button class="node ${tone}" ${id ? `data-entity="${this.esc(id)}"` : ""}><small>${title}</small><ha-icon icon="${icon}"></ha-icon><span><b>${this.esc(value)}</b><em>${note}</em></span></button>`).join("")}</div></section>`;
    }
    currentMode(e) {
      const operation = this.state(e.operation);
      return `<section class="quickActions"><div class="modeGrid">
        <button class="mode ${operation === "Auto" ? "active" : ""}" data-entity="${this.esc(e.operation)}"><ha-icon icon="mdi:play"></ha-icon><b>Полив</b><small>${operation === "Auto" ? "Авто" : this.esc(this.human("operation", operation))}</small></button>
        <button class="mode disabled" disabled><ha-icon icon="mdi:pause-circle-outline"></ha-icon><b>Пауза</b><small>Недоступно</small></button>
        <button class="mode manualAction" data-go="manual"><ha-icon icon="mdi:hand-back-right-outline"></ha-icon><b>Ручной</b><small>Доступен</small></button>
      </div></section>`;
    }
    statusView(e) { return `${this.hero(e)}${this.metrics(e)}${this.currentMode(e)}${this.nodes(e)}`; }

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

    _cancelLongPresses() {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
      this._longPressTarget = null;
      this._longPressHeld = false;
      this.shadowRoot.querySelectorAll("[data-entity]").forEach((node) => {
        node.dispatchEvent(new Event("pointercancel", { bubbles: false }));
      });
    }

    _bindWorkspaceGestures() {
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      if (!viewport) return;
      const point = (event) => {
        const rect = viewport.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };
      const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const distance = (a, b) => Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const beginPinch = () => {
        const points = [...this._gesturePointers.values()];
        if (points.length < 2) return;
        const mid = midpoint(points[0], points[1]);
        const scale = this._viewTransform.scale;
        const nativeScrollTop = scale <= 1 ? viewport.scrollTop : 0;
        if (nativeScrollTop) viewport.scrollTop = 0;
        this._gestureStart = {
          type: "pinch",
          distance: distance(points[0], points[1]),
          scale,
          midX: mid.x,
          midY: mid.y,
          contentX: (mid.x - this._viewTransform.x) / scale,
          contentY: (mid.y + nativeScrollTop - this._viewTransform.y) / scale,
        };
      };

      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const current = point(event);
        this._gesturePointers.set(event.pointerId, current);
        if (this._gesturePointers.size === 1) {
          this._gestureMoved = false;
          this._hadMultiTouch = false;
          if (this._viewTransform.scale > 1) {
            try { viewport.setPointerCapture(event.pointerId); } catch (_error) { /* capture may be unavailable */ }
            this._gestureStart = { type: "pan", point: current, x: this._viewTransform.x, y: this._viewTransform.y };
          } else {
            this._gestureStart = { type: "native", point: current };
          }
        } else if (this._gesturePointers.size === 2) {
          for (const id of this._gesturePointers.keys()) {
            try { viewport.setPointerCapture(id); } catch (_error) { /* capture may be unavailable */ }
          }
          this._hadMultiTouch = true;
          this._suppressClicksUntil = Date.now() + 500;
          this._cancelLongPresses();
          beginPinch();
        }
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!this._gesturePointers.has(event.pointerId)) return;
        const current = point(event);
        this._gesturePointers.set(event.pointerId, current);
        if (this._gesturePointers.size >= 2) {
          event.preventDefault();
          const points = [...this._gesturePointers.values()];
          if (this._gestureStart?.type !== "pinch") beginPinch();
          const start = this._gestureStart;
          if (!start || start.type !== "pinch") return;
          const mid = midpoint(points[0], points[1]);
          const nextScale = this._clampScale(start.scale * distance(points[0], points[1]) / start.distance);
          if (Math.abs(nextScale - start.scale) > 0.008 || Math.hypot(mid.x - start.midX, mid.y - start.midY) > 4) this._gestureMoved = true;
          this._viewTransform = {
            scale: nextScale,
            x: mid.x - start.contentX * nextScale,
            y: mid.y - start.contentY * nextScale,
          };
          this._cancelLongPresses();
          this._clampAndApplyTransform(false);
          return;
        }
        const start = this._gestureStart;
        if (start?.type === "native") {
          if (Math.hypot(current.x - start.point.x, current.y - start.point.y) > 4) {
            this._gestureMoved = true;
            this._cancelLongPresses();
          }
          return;
        }
        if (!start || start.type !== "pan" || this._viewTransform.scale <= 1) return;
        const dx = current.x - start.point.x;
        const dy = current.y - start.point.y;
        if (Math.hypot(dx, dy) > 4) {
          this._gestureMoved = true;
          this._cancelLongPresses();
        }
        if (!this._gestureMoved) return;
        event.preventDefault();
        this._viewTransform = { ...this._viewTransform, x: start.x + dx, y: start.y + dy };
        this._clampAndApplyTransform(false);
      }, { passive: false });

      const finishPointer = (event) => {
        if (!this._gesturePointers.has(event.pointerId)) return;
        this._gesturePointers.delete(event.pointerId);
        try { viewport.releasePointerCapture(event.pointerId); } catch (_error) { /* capture may already be released */ }
        if (this._gesturePointers.size === 1) {
          const remaining = [...this._gesturePointers.values()][0];
          this._gestureStart = this._viewTransform.scale > 1
            ? { type: "pan", point: remaining, x: this._viewTransform.x, y: this._viewTransform.y }
            : { type: "native", point: remaining };
          return;
        }
        if (this._gesturePointers.size) return;

        const now = Date.now();
        if (this._hadMultiTouch && !this._gestureMoved) {
          if (now - this._twoFingerTapAt < 450) {
            this._twoFingerTapAt = 0;
            this._resetTransform(true);
          } else {
            this._twoFingerTapAt = now;
          }
        } else if (this._hadMultiTouch && this._viewTransform.scale >= VIEW_SCALE_SNAP_MIN && this._viewTransform.scale <= VIEW_SCALE_SNAP_MAX) {
          this._viewTransform.scale = 1;
          this._clampAndApplyTransform(true);
          this._showScaleToast("Масштаб 100%");
        } else {
          this._clampAndApplyTransform(true);
        }
        if (this._gestureMoved) this._suppressClicksUntil = now + 350;
        this._gestureStart = null;
        this._gestureMoved = false;
        this._hadMultiTouch = false;
        if (this._renderDeferred) {
          this._renderDeferred = false;
          this._queueRender();
        }
      };
      viewport.addEventListener("pointerup", finishPointer);
      viewport.addEventListener("pointercancel", finishPointer);
      viewport.addEventListener("click", (event) => {
        if (Date.now() < this._suppressClicksUntil) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
      viewport.addEventListener("scroll", () => {
        if (this._viewTransform.scale <= 1) {
          this._nativeScrollPositions.set(this._transformStorageKey(), viewport.scrollTop);
        }
      }, { passive: true });
      viewport.addEventListener("wheel", (event) => {
        if (this._viewTransform.scale <= 1) return;
        event.preventDefault();
        this._viewTransform = {
          ...this._viewTransform,
          x: this._viewTransform.x - event.deltaX,
          y: this._viewTransform.y - event.deltaY,
        };
        this._clampAndApplyTransform(false);
        clearTimeout(this._wheelSaveTimer);
        this._wheelSaveTimer = setTimeout(() => this._saveTransform(), 180);
      }, { passive: false });
    }

    bindActions() {
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      this._bindWorkspaceGestures();

      this.shadowRoot.addEventListener("pointerdown", (event) => {
        const target = event.target.closest?.("[data-entity]");
        if (!target || target.dataset.zone || this._gesturePointers.size > 1) return;
        clearTimeout(this._longPressTimer);
        this._longPressHeld = false;
        this._longPressTarget = target;
        const entityId = target.dataset.entity;
        this._longPressTimer = setTimeout(() => {
          if (this._longPressTarget !== target || this._gesturePointers.size > 1) return;
          this._longPressHeld = true;
          this.moreInfo(entityId);
          setTimeout(() => {
            if (this._longPressTarget === target) {
              this._longPressHeld = false;
              this._longPressTarget = null;
            }
          }, 1000);
        }, 550);
      });

      const clearLongPress = () => {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
        if (!this._longPressHeld) this._longPressTarget = null;
      };
      this.shadowRoot.addEventListener("pointerup", clearLongPress);
      this.shadowRoot.addEventListener("pointercancel", () => {
        clearLongPress();
        this._longPressHeld = false;
        this._longPressTarget = null;
      });

      this.shadowRoot.addEventListener("click", (event) => {
        const target = event.target.closest?.("button, [data-ha-menu], [data-refresh]");
        if (!target) return;
        if (this._longPressHeld && target === this._longPressTarget) {
          event.preventDefault();
          this._longPressHeld = false;
          this._longPressTarget = null;
          return;
        }
        this._longPressHeld = false;
        this._longPressTarget = null;
        if (target.matches("[data-ha-menu]")) { this.openHaMenu(); return; }
        if (target.matches("[data-refresh]")) { this.refreshNow(); return; }
        if (target.dataset.view) { this._switchView(target.dataset.view || "status"); return; }
        if (target.dataset.go) { this._switchView(target.dataset.go); return; }
        if (target.hasAttribute("data-drill-back")) {
          this._drillZone = null;
          this.render();
          return;
        }
        if (target.dataset.zone) {
          this._view = "zones";
          this._drillZone = Number(target.dataset.zone);
          this.render();
          return;
        }
        if (target.dataset.manualZone) {
          this._manualZone = Number(target.dataset.manualZone) || 1;
          this.render();
          return;
        }
        if (target.dataset.duration) {
          this._manualDuration = Math.min(120, Math.max(1, this._manualDuration + Number(target.dataset.duration || 0)));
          this.render();
          return;
        }
        if (target.dataset.entity) this.moreInfo(target.dataset.entity);
      });

      viewport?.addEventListener("pointerleave", clearLongPress);
    }

    _viewContent() {
      if (!this._hass) {
        return `<section class="hero unknown"><div class="heroHead"><div><small>СОСТОЯНИЕ СИСТЕМЫ</small><h1>Загрузка данных…</h1><p>Ожидание Home Assistant</p></div></div><div class="systemDiagram"></div></section>`;
      }
      const e = this.entities();
      if (this._view === "zones") return this.zonesView(e);
      if (this._view === "program") return this.programView(e);
      if (this._view === "manual") return this.manualView(e);
      if (this._view === "diagnostics") return this.diagnosticsView(e);
      return this.statusView(e);
    }

    _structureKey() {
      if (!this._hass) return "loading";
      return `${this._view}:${this._view === "zones" && this._drillZone ? "detail" : "root"}`;
    }

    _patchExistingTree(current, next) {
      if (!current || !next || current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
        current?.replaceWith(next?.cloneNode(true));
        return;
      }
      if (current.nodeType === 3) {
        if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
        return;
      }
      if (current.nodeType !== 1) return;

      for (const attribute of [...current.attributes]) {
        if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
      }
      for (const attribute of [...next.attributes]) {
        if (current.getAttribute(attribute.name) !== attribute.value) {
          current.setAttribute(attribute.name, attribute.value);
        }
      }

      const currentChildren = [...current.childNodes];
      const nextChildren = [...next.childNodes];
      const shared = Math.min(currentChildren.length, nextChildren.length);
      for (let index = 0; index < shared; index += 1) {
        this._patchExistingTree(currentChildren[index], nextChildren[index]);
      }
      for (let index = currentChildren.length - 1; index >= nextChildren.length; index -= 1) {
        currentChildren[index].remove();
      }
      for (let index = currentChildren.length; index < nextChildren.length; index += 1) {
        current.append(nextChildren[index].cloneNode(true));
      }
    }

    _createWorkContent(content) {
      const template = document.createElement("template");
      template.innerHTML = `<main class="content">${content}</main>`;
      return template.content.firstElementChild;
    }

    _patchContentNode(current, content) {
      const next = this._createWorkContent(content);
      if (current && next) this._patchExistingTree(current, next);
    }

    _reuseWorkContent(content, structureKey) {
      const canvas = this.shadowRoot.querySelector("[data-work-canvas]");
      const current = canvas?.querySelector(":scope > .content");
      if (!canvas || !current) return;

      if (this._renderedStructureKey) {
        this._viewNodeCache.set(this._renderedStructureKey, current);
      }

      let next = this._viewNodeCache.get(structureKey);
      if (next) {
        this._patchContentNode(next, content);
      } else {
        next = this._createWorkContent(content);
        if (!next) return;
        this._viewNodeCache.set(structureKey, next);
      }

      if (next !== current) current.replaceWith(next);
    }

    _patchWorkContent(content) {
      const current = this.shadowRoot.querySelector("[data-work-canvas] > .content");
      if (!current) return;
      this._patchContentNode(current, content);
    }

    _updateNavigationState() {
      this.shadowRoot.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === this._view);
      });
    }

    styles() {
      return `
        :host{--a:var(--primary-color,#079bd0);--green:#1fa647;--orange:#f59e0b;--card:var(--card-background-color,var(--ha-card-background,#fff));--bg:var(--primary-background-color,#fafafa);--text:var(--primary-text-color,#151515);--muted:var(--secondary-text-color,#6f6f72);--line:color-mix(in srgb,var(--text) 14%,transparent);--soft:color-mix(in srgb,var(--card) 94%,var(--text) 6%);--surface:color-mix(in srgb,var(--card) 91%,var(--text) 9%);--diagram:color-mix(in srgb,var(--card) 96%,var(--a) 4%);--accent-soft:color-mix(in srgb,var(--card) 86%,var(--a) 14%);--green-soft:color-mix(in srgb,var(--card) 86%,var(--green) 14%);--orange-soft:color-mix(in srgb,var(--card) 86%,var(--orange) 14%);--danger:var(--error-color,#d84040);color-scheme:light dark;display:block;min-height:100vh;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif}
        *{box-sizing:border-box}button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}.app{max-width:920px;margin:0 auto;padding:0 14px calc(106px + env(safe-area-inset-bottom));min-height:100vh}.appHeader{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:56px minmax(0,1fr) 56px;align-items:center;gap:10px;min-height:80px;padding:calc(9px + env(safe-area-inset-top)) 0 8px;background:color-mix(in srgb,var(--bg) 97%,transparent);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid color-mix(in srgb,var(--text) 6%,transparent)}.headerButton{display:grid;place-items:center;width:56px;height:56px;padding:0;border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:0 6px 18px #0000000c;cursor:pointer}.headerButton ha-icon{--mdc-icon-size:30px}.refreshButton{color:var(--a)}.headerTitle{text-align:center;min-width:0}.headerTitle strong{display:block;font-size:25px;line-height:1;letter-spacing:-.04em}.headerTitle small{display:block;margin-top:5px;color:var(--muted);font-size:11px}.content{padding-top:12px}
        .hero,.sectionCard,.detailCard,.zoneCard,.programList,.summaryGrid,.manualCard,.diagList,.lab{background:var(--card);border:1px solid var(--line);box-shadow:0 8px 26px #00000012}.hero{padding:18px;border-radius:28px;background:linear-gradient(145deg,var(--card) 0%,var(--card) 78%,var(--diagram) 100%)}.hero.ready{border-color:color-mix(in srgb,var(--green) 28%,var(--line))}.hero.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line))}.hero.warning{border-color:color-mix(in srgb,var(--orange) 48%,var(--line))}.hero.unknown{border-color:color-mix(in srgb,var(--muted) 40%,var(--line))}.heroHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.heroHead>div:first-child{min-width:0}.heroHead small,.sectionTitle,.pageIntro>small{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.11em}.heroHead h1{margin:7px 0 5px;font-size:32px;line-height:.98;letter-spacing:-.05em;color:var(--text)}.heroHead p{margin:0;color:var(--muted);font-size:14px}.connectionWrap{text-align:right;flex:0 0 auto}.connectionBadge{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:99px;background:var(--soft);font-size:14px}.connectionBadge i{width:10px;height:10px;border-radius:50%;background:var(--muted)}.connectionBadge.local{background:var(--green-soft);color:var(--green)}.connectionBadge.local i{background:var(--green)}.connectionBadge.cloud{background:var(--accent-soft);color:var(--a)}.connectionBadge.cloud i{background:var(--a)}.connectionWrap>small{display:block;margin-top:6px;color:var(--muted);font-size:8px}
        .systemDiagram{position:relative;height:395px;margin-top:16px;border-radius:24px;background:linear-gradient(180deg,var(--diagram),var(--soft));border:1px solid var(--line);overflow:hidden;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--text) 7%,transparent)}.pipes{position:absolute;inset:0;width:100%;height:100%}.pipe{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.pipe.idle{stroke:color-mix(in srgb,var(--muted) 48%,transparent)}.pipe.run,.pipe.supply{stroke:var(--a)}.pipe.queue{stroke:var(--orange)}.pipe.sensor{stroke:var(--muted);stroke-width:3;stroke-dasharray:8 7}.controller{position:absolute;z-index:2;left:2.5%;top:25%;width:20%;height:49%;padding:0;border:1px solid #bdc7d0;border-radius:15px;background:linear-gradient(145deg,#ffffff 0%,#e8edf1 62%,#d6dde3 100%);box-shadow:0 10px 22px #00000028,inset 1px 1px 0 #fff;overflow:hidden}.controller .cap{height:13%;border-bottom:1px solid #c3ccd4;background:linear-gradient(#fff,#e7ebef)}.controller .body{height:74%;display:grid;place-items:center;align-content:center;gap:10px;color:#3e4953}.controller .body b{font-size:12px}.controller .body small{font-size:7px;color:#75818b}.controller .body>i{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px #1fa64726,0 0 9px #1fa64777}.controller .ports{height:13%;display:flex;justify-content:center;gap:20px;border-top:1px solid #bdc7d0;background:#d9e0e6}.controller .ports i{width:10px;height:12px;background:#34414b;border-radius:0 0 4px 4px}.controllerCheck{position:absolute;z-index:3;left:17.4%;top:22%;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:var(--green);color:#fff;box-shadow:0 5px 11px #0003}.controllerCheck.bad{background:var(--muted)}.controllerCheck ha-icon{--mdc-icon-size:19px}.manifold{position:absolute;z-index:2;left:25%;top:38%;width:34%;height:30%}.valves{position:absolute;left:2%;right:2%;top:0;display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.valve{display:grid;justify-items:center;color:var(--text)}.valve b{font-size:8px;margin-bottom:2px}.valve i{width:17px;height:53px;border-radius:7px;background:linear-gradient(#53616b 0 18%,#2f3a43 19% 38%,#12181d 39% 100%);border:1px solid #0c1014;box-shadow:inset 0 8px 0 #64727d,0 3px 5px #0005}.valve em{width:8px;height:14px;margin-top:-2px;border-radius:0 0 3px 3px;background:#72808b}.valve.running i{box-shadow:inset 0 8px 0 #2d7b98,0 0 0 2px #079bd099,0 0 12px #079bd055}.valve.queued i{box-shadow:inset 0 8px 0 #977628,0 0 0 2px #f59e0b88}.rail{position:absolute;left:0;right:0;top:55%;height:20px;border-radius:10px;background:linear-gradient(#59636b 0%,#313a41 42%,#181e23 100%);border:1px solid #11181d;box-shadow:0 5px 12px #0005,inset 0 1px 0 #ffffff26}.rainSensor{position:absolute;z-index:3;left:49%;top:3%;display:grid;grid-template-columns:34px auto;align-items:center;gap:7px;padding:7px 10px;border:0;background:transparent;color:var(--muted);text-align:left}.rainSensor ha-icon{color:var(--muted);--mdc-icon-size:28px}.rainSensor span{font-size:8px;line-height:1.1}.zoneStack{position:absolute;z-index:2;right:2%;top:7%;width:35.5%;display:grid;gap:6px}.diagramZone{display:grid;grid-template-columns:51px minmax(0,1fr) auto 17px;align-items:center;gap:7px;min-height:51px;padding:5px 7px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--text);text-align:left;box-shadow:0 4px 10px #00000018}.diagramZone.running{border-color:color-mix(in srgb,var(--a) 72%,var(--line));background:var(--accent-soft)}.diagramZone.queued{border-color:color-mix(in srgb,var(--orange) 68%,var(--line));background:var(--orange-soft)}.diagramZone.off{filter:saturate(.72)}.diagramZone.unknown{border-style:dashed}.scene{display:grid;place-items:center;width:51px;height:40px;border-radius:9px;color:white;text-shadow:0 1px 3px #0008;overflow:hidden;box-shadow:inset 0 0 0 1px #ffffff26}.scene ha-icon{--mdc-icon-size:23px}.scene1,.scene2{background:linear-gradient(180deg,#55bfe8 0 42%,#65c74d 43% 100%)}.scene3{background:linear-gradient(145deg,#5fa44d,#ec658d 50%,#704b35)}.scene4{background:linear-gradient(145deg,#58b2da,#d8efeb 53%,#48974f)}.scene5{background:linear-gradient(145deg,#84b950,#60452f)}.scene6{background:linear-gradient(145deg,#5aabd8,#328d50 58%,#66432d)}.zoneText{min-width:0}.zoneText b{display:block;font-size:10.5px;line-height:1;color:var(--text)}.zoneText small{display:block;margin-top:3px;overflow:hidden;color:var(--muted);font-size:7px;white-space:nowrap;text-overflow:ellipsis}.duration{font-size:12px;font-weight:850;text-align:right;color:var(--text)}.duration small{display:block;font-size:6px;color:var(--muted)}.readyIcon{color:var(--green);--mdc-icon-size:15px}.mainlineDevice{position:absolute;z-index:2;left:44.5%;bottom:6.5%;display:grid;place-items:center;width:64px;height:36px;border-radius:14px;background:var(--surface);border:2px solid var(--muted);color:var(--a);box-shadow:0 4px 10px #0003}.mainlineDevice ha-icon{--mdc-icon-size:24px}.mainlineLabel{position:absolute;z-index:3;left:39%;bottom:0.5%;display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:12px;background:var(--surface);border:1px solid var(--line);font-size:8px;color:var(--muted);box-shadow:0 2px 6px #0002}.mainlineLabel b{color:var(--text);font-size:9px}
        .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.metric{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:8px;min-height:72px;padding:9px;border:1px solid var(--line);border-radius:18px;background:#fff;text-align:left}.metric ha-icon{color:var(--muted);--mdc-icon-size:29px}.metric small{display:block;color:var(--muted);font-size:7px;line-height:1.1}.metric b{display:block;margin-top:3px;font-size:14px;line-height:1.05}.metric em{display:block;margin-top:3px;color:var(--muted);font-size:7px;font-style:normal}.metric.good b,.metric.good ha-icon{color:var(--green)}.metric.water ha-icon{color:var(--a)}.metric.active b,.metric.active ha-icon{color:var(--a)}
        .sectionCard{margin-top:12px;padding:16px;border-radius:25px}.sectionTitle{margin:0 0 11px 2px}.nodeGrid,.modeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.node{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:8px;min-height:80px;padding:10px;border:1px solid var(--line);border-radius:18px;background:#fff;text-align:left}.node>ha-icon{color:var(--muted);--mdc-icon-size:30px}.node small{display:block;color:var(--muted);font-size:7px}.node b{display:block;margin-top:3px;font-size:13px;line-height:1.05}.node em{display:block;margin-top:4px;color:var(--muted);font-size:7px;font-style:normal}.node.good b,.node.good>ha-icon{color:var(--green)}.node.bad b,.node.bad>ha-icon{color:var(--danger)}.node.unknown{opacity:.7}.mode{display:grid;place-items:center;align-content:center;min-height:104px;padding:10px;border:1px solid var(--line);border-radius:20px;background:#fff;text-align:center}.mode ha-icon{color:var(--muted);--mdc-icon-size:34px}.mode b{margin-top:7px;font-size:14px}.mode small{margin-top:4px;color:var(--muted);font-size:8px}.mode.active{border-color:#079bd099;background:#f4fbff}.mode.active ha-icon,.mode.active b,.mode.active small{color:var(--a)}.mode.disabled{opacity:.55}
        .pageIntro{padding:7px 4px 15px}.pageIntro h2{margin:5px 0 0;font-size:27px;letter-spacing:-.04em}.pageIntro p{margin:6px 0 0;color:var(--muted);font-size:12px}.zoneCards{display:grid;gap:9px}.zoneCard{display:grid;grid-template-columns:54px minmax(0,1fr) 22px;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:20px;text-align:left}.zoneCard span:nth-child(2) small{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.08em}.zoneCard span:nth-child(2) b{display:block;margin-top:3px;font-size:16px}.zoneCard span:nth-child(2) em{display:block;margin-top:3px;color:var(--muted);font-size:9px;font-style:normal}.inlineBack{display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;padding:8px 11px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--a)}.detailCard{padding:16px;border-radius:22px}.detailHead{display:flex;align-items:center;gap:12px}.detailHead small{color:var(--muted);font-size:8px;font-weight:800}.detailHead h2{margin:3px 0 0;font-size:22px}.detailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.detailGrid>div{padding:10px;border-radius:14px;background:var(--soft)}.detailGrid small{display:block;color:var(--muted);font-size:8px}.detailGrid b{display:block;margin-top:3px;font-size:12px}.detailCard p{color:var(--muted);font-size:10px;line-height:1.4}.summaryGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px;border-radius:22px}.summaryGrid button{padding:10px;border:0;border-radius:14px;background:var(--soft);text-align:left}.summaryGrid small{display:block;color:var(--muted);font-size:8px}.summaryGrid b{display:block;margin-top:3px;font-size:14px}.programList{margin-top:10px;border-radius:22px;overflow:hidden}.programRow{display:grid;grid-template-columns:1fr auto 20px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 13px;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left}.programRow:last-child{border-bottom:0}.programRow b{font-size:11px}.programRow ha-icon{color:var(--muted)}.manualCard{padding:16px;border-radius:22px}.manualZones{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.manualZone{display:grid;place-items:center;min-height:64px;border:1px solid var(--line);border-radius:16px;background:var(--soft);font-size:20px;font-weight:800}.manualZone small{display:block;color:var(--muted);font-size:8px;font-weight:500}.manualZone.active{border-color:#079bd099;background:#f2fbff;color:var(--a)}.stepper{display:grid;grid-template-columns:54px 1fr 54px;align-items:center;gap:10px;margin-top:18px}.stepper button{display:grid;place-items:center;height:54px;border:1px solid var(--line);border-radius:16px;background:var(--soft)}.stepper>b{text-align:center;font-size:32px}.stepper>b small{font-size:13px;color:var(--muted)}.lockedStart{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:54px;margin-top:15px;border:0;border-radius:16px;background:var(--soft);color:var(--muted);font-weight:800}.diagList{border-radius:22px;overflow:hidden}.diagList button{display:grid;grid-template-columns:1fr auto 20px;align-items:center;gap:8px;width:100%;min-height:50px;padding:0 13px;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left}.diagList button:last-child{border-bottom:0}.diagList b{font-size:11px}.lab{margin-top:10px;padding:14px;border-radius:22px}.lab h3{margin:0 0 8px}.lab p{margin:5px 0;color:var(--muted);font-size:10px}
        .bottomNav{position:fixed;z-index:30;left:0;right:0;bottom:0;padding:7px 8px calc(7px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 97%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.bottomNavInner{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;max-width:920px;margin:0 auto}.bottomNav button{display:grid;place-items:center;align-content:center;gap:3px;min-height:65px;border:0;border-radius:17px;background:transparent;color:var(--muted);font-size:9px;font-weight:750}.bottomNav button ha-icon{--mdc-icon-size:25px}.bottomNav button.active{background:#eaf7fc;color:var(--a)}
        @media(max-width:520px){.app{padding-left:10px;padding-right:10px}.appHeader{grid-template-columns:50px minmax(0,1fr) 50px;min-height:74px;padding-top:calc(7px + env(safe-area-inset-top))}.headerButton{width:50px;height:50px;border-radius:18px}.headerButton ha-icon{--mdc-icon-size:27px}.headerTitle strong{font-size:21px}.headerTitle small{font-size:9.5px}.content{padding-top:9px}.hero{padding:14px;border-radius:24px}.heroHead h1{font-size:26px}.heroHead p{font-size:11.5px}.connectionBadge{padding:8px 11px;font-size:11px}.connectionWrap>small{font-size:7px}.systemDiagram{height:350px;margin-top:13px}.controller{left:2%;top:27%;width:20.5%;height:49%}.controller .body b{font-size:10px}.controller .body small{font-size:6px}.controllerCheck{left:17%;top:24%;width:28px;height:28px}.manifold{left:25%;top:40%;width:35%}.valve i{width:14px;height:47px}.zoneStack{right:1.5%;top:6.5%;width:36.5%;gap:5px}.diagramZone{grid-template-columns:42px minmax(0,1fr) auto 14px;gap:5px;min-height:47px;padding:4px 5px}.scene{width:42px;height:36px}.scene ha-icon{--mdc-icon-size:19px}.zoneText b{font-size:9px}.zoneText small{font-size:6px}.duration{font-size:10px}.readyIcon{--mdc-icon-size:13px}.rainSensor{left:47%;top:2%;padding:5px}.mainlineDevice{left:44%;bottom:6%}.mainlineLabel{left:35%;bottom:.5%}.metrics{gap:5px}.metric{grid-template-columns:27px minmax(0,1fr);min-height:62px;padding:6px}.metric ha-icon{--mdc-icon-size:22px}.metric small{font-size:6.2px}.metric b{font-size:11px}.nodeGrid,.modeGrid{gap:5px}.node{grid-template-columns:28px minmax(0,1fr);min-height:69px;padding:7px}.node>ha-icon{--mdc-icon-size:23px}.node small{font-size:6.5px}.node b{font-size:10.5px}.node em{font-size:6px}.mode{min-height:88px;padding:7px}.mode ha-icon{--mdc-icon-size:28px}.mode b{font-size:12px}.mode small{font-size:7px}.bottomNav button{min-height:63px}}
        @media(max-width:390px){.heroHead h1{font-size:23px}.connectionBadge{font-size:10px;padding:7px 9px}.systemDiagram{height:330px}.zoneStack{width:37.5%}.diagramZone{grid-template-columns:35px minmax(0,1fr) auto 12px}.scene{width:35px;height:31px}.zoneText b{font-size:8px}.duration{font-size:9px}.metrics,.nodeGrid,.modeGrid{grid-template-columns:repeat(2,1fr)}}
        /* v0.5.9: full-width manifold and confirmed irrigation-pressure source. */
        :host{--a:#078fe8;--green:#08a52b;--orange:#e89a12;--card:#fff;--bg:#f7f8fa;--text:#111317;--muted:#626a73;--line:#e2e6e9;--soft:#f7f9fa;--surface:#fff;--diagram:#fff;--accent-soft:#edf8fe;--green-soft:#eaf7ed;--orange-soft:#fff7e8;color-scheme:light;background:var(--bg);color:var(--text)}
        .appHeader{background:#f7f8faf2;border-bottom-color:#edf0f2}.headerButton{background:#fff;border-color:#e1e5e8;box-shadow:0 4px 14px #1118270d}.hero,.sectionCard,.detailCard,.zoneCard,.programList,.summaryGrid,.manualCard,.diagList,.lab{background:#fff;border-color:#e3e7ea;box-shadow:0 7px 24px #1118270d}.hero{background:#fff}.hero.ready{border-color:#ccebd4}.heroHead h1{color:#0f1114}.heroHead p{color:#4f565e}.connectionBadge.local{background:#eaf7ed;color:#079b29}
        .systemDiagram{height:auto;aspect-ratio:388/315;margin-top:14px;border:0;border-radius:0;background:#fff;box-shadow:none;overflow:hidden}
        .pipe{stroke-width:5}.pipe.water{stroke:#078fe8}.pipe.run{stroke:#078fe8}.pipe.queue{stroke:#e89a12}.pipe.supply{stroke:#078fe8}.supplyArrow{fill:#078fe8}.wire{fill:none;stroke:#6f7d88;stroke-width:2.5;stroke-linecap:square;stroke-linejoin:miter}.wire.rainWire{stroke-width:2.6}
        .controller{left:.7%;top:2%;width:24%;height:21.6%;padding:0;border:0;border-radius:0;background:transparent url("${APPROVED_VISUALS.controller}") center/contain no-repeat;box-shadow:none}.controller>*{visibility:hidden}.controllerCheck{display:none}
        .manifold{left:0;right:0;top:24%;width:auto;height:32%;background:#fff url("${APPROVED_VISUALS.manifold}") center/100% 100% no-repeat}.rail{display:none}.valves{inset:0;display:block;height:100%;opacity:1}.valve{position:absolute;top:0;bottom:0;width:1px}.valve:nth-child(1){left:7.97%}.valve:nth-child(2){left:24.4%}.valve:nth-child(3){left:41.1%}.valve:nth-child(4){left:57.5%}.valve:nth-child(5){left:73.9%}.valve:nth-child(6){left:90.3%}.valve b,.valve i,.valve em{opacity:0}.valve.running::after,.valve.queued::after{content:"";position:absolute;left:50%;top:27%;width:13px;height:13px;transform:translateX(-50%);border-radius:50%;box-shadow:0 0 0 3px #078fe855,0 0 14px #078fe8}.valve.queued::after{box-shadow:0 0 0 3px #e89a1255,0 0 14px #e89a12}
        .rainSensor{left:26%;top:1%;display:block;width:21%;height:19%;padding:0;border:0;background:#fff url("${APPROVED_VISUALS.rain}") left center/42% auto no-repeat;color:#454d55}.rainSensor ha-icon{display:none}.rainSensor span{position:absolute;left:44%;top:31%;font-size:11px;line-height:1.15;white-space:nowrap}
        .controlLabel{position:absolute;z-index:3;right:7%;top:22%;padding:2px 5px;border-radius:7px;background:#ffffffeb;color:#65727d;font-size:9px;white-space:nowrap}
        .zoneRow{position:absolute;z-index:2;left:.4%;right:2.1%;top:62%;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.zoneRow .diagramZone{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:47px auto auto;align-content:start;justify-items:stretch;gap:4px;min-width:0;min-height:112px;padding:6px 5px;border:1px solid #dce1e5;border-radius:14px;background:#fff;color:#111317;text-align:left;box-shadow:0 3px 10px #1118270b}.diagramZone.off,.diagramZone.unknown{filter:none;opacity:1}.diagramZone.unknown{border-style:solid}
        .zoneRow .scene{width:100%;height:47px;border-radius:9px;background-position:center;background-size:cover;background-repeat:no-repeat;box-shadow:inset 0 0 0 1px #0000000a}.zoneRow .scene ha-icon{display:none}.scene1{background-image:url("${APPROVED_VISUALS.zone1}")}.scene2{background-image:url("${APPROVED_VISUALS.zone2}")}.scene3{background-image:url("${APPROVED_VISUALS.zone3}")}.scene4{background-image:url("${APPROVED_VISUALS.zone4}")}.scene5{background-image:url("${APPROVED_VISUALS.zone5}")}.scene6{background-image:url("${APPROVED_VISUALS.zone6}")}
        .zoneRow .zoneText{min-width:0;text-align:left}.zoneRow .zoneText b{font-size:10px;line-height:1.05;color:#111317;white-space:nowrap}.zoneRow .zoneText small{margin-top:3px;color:#71777e;font-size:7px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.zoneRow .duration{display:flex;align-items:baseline;gap:3px;color:#111317;font-size:12px;text-align:left}.zoneRow .duration small{display:inline;color:#626a73;font-size:6.5px}.zoneRow .readyIcon{position:absolute;right:4px;top:58px;color:#08a52b;--mdc-icon-size:12px;filter:none}
        .mainlineDevice{display:none}.mainlineLabel{left:50%;bottom:.2%;transform:translateX(-50%);gap:4px;padding:3px 8px;border:0;background:#fff;color:#50565d;font-size:9px;white-space:nowrap;box-shadow:none}.mainlineLabel b{color:#079b29;font-size:9px}.mainlineLabel b.unknown{color:#6f7780}
        .metrics{gap:8px;margin-top:10px}.metric{grid-template-columns:38px minmax(0,1fr);gap:8px;min-height:76px;padding:9px;border-color:#e5e8eb;border-radius:18px;background:#fff;color:#111317}.metric ha-icon{--mdc-icon-size:30px}.metric small{font-size:8px}.metric b{font-size:15px}.metric em{font-size:7px}
        .node,.mode,.inlineBack,.programRow,.diagList button{background:#fff;color:#111317}.node.unknown{opacity:1}.node:nth-child(-n+2)::before{content:"";display:block;width:38px;height:52px;background-position:center;background-size:contain;background-repeat:no-repeat}.node:nth-child(-n+2)>ha-icon{display:none}.node:nth-child(1)::before{background-image:url("${APPROVED_VISUALS.nodeController}")}.node:nth-child(2)::before{background-image:url("${APPROVED_VISUALS.nodeValve}")}.node:nth-child(3){grid-template-columns:1fr;text-align:center}.node:nth-child(3)>ha-icon{display:none}.mode.active{background:#eef9fe}.mode.disabled{opacity:.62}.manualZone.active{background:#eef9fe}.bottomNav{background:#fffffff2;border-top-color:#e4e7ea}.bottomNav button.active{background:#e8f6fc}
        @media(max-width:520px){
          .app{padding-left:9px;padding-right:9px;padding-bottom:calc(82px + env(safe-area-inset-bottom))}
          .appHeader{grid-template-columns:36px minmax(0,1fr) 36px;gap:7px;min-height:52px;padding:calc(3px + env(safe-area-inset-top)) 0 3px}.headerButton{width:36px;height:36px;border-radius:13px}.headerButton ha-icon{--mdc-icon-size:22px}.headerTitle strong{font-size:19px}.headerTitle small{margin-top:4px;font-size:8.5px}.content{padding-top:2px}
          .hero{padding:8px 11px 11px;border-radius:22px}.heroHead{gap:8px}.heroHead small{font-size:8.5px}.heroHead h1{margin:2px 0;font-size:22px}.heroHead p{font-size:10.5px}.connectionBadge{gap:6px;padding:7px 10px;font-size:10.5px}.connectionBadge i{width:8px;height:8px}.connectionWrap>small{margin-top:4px;font-size:6.5px}
          .systemDiagram{height:auto;aspect-ratio:388/315;margin-top:8px}.controller{left:.7%;top:2%;width:24%;height:21.6%}.manifold{left:0;right:0;top:24%;height:32%}
          .rainSensor{left:26%;top:1%;width:22%;height:19%;background-size:42% auto}.rainSensor span{left:44%;top:31%}.controlLabel{right:3%;top:21.5%}
          .zoneRow{left:.4%;right:2.1%;top:62%;gap:5px}.zoneRow .diagramZone{grid-template-rows:34px auto auto;gap:3px;min-height:96px;padding:4px 3px;border-radius:10px}.zoneRow .scene{height:34px;border-radius:7px}.zoneRow .zoneText b{font-size:11px}.zoneRow .zoneText small{margin-top:2px}.zoneRow .duration{font-size:14px}.zoneRow .duration small{font-size:11px}.zoneRow .readyIcon{right:3px;top:5px;--mdc-icon-size:13px;filter:drop-shadow(0 1px 2px #fff)}
          .mainlineLabel{bottom:.2%;padding:2px 5px;font-size:6.5px}.mainlineLabel b{font-size:6.5px}
          .metrics{gap:5px;margin-top:8px}.metric{grid-template-columns:1fr;justify-items:center;align-content:center;gap:5px;min-height:112px;padding:7px;border-radius:16px;text-align:center}.metric ha-icon{--mdc-icon-size:24px}.metric span{min-width:0;width:100%}.metric b{font-size:14px}
          .sectionCard{margin-top:6px;padding:9px;border-radius:21px}.sectionTitle{margin-bottom:6px}.nodeGrid,.modeGrid{gap:5px}.node{grid-template-columns:1fr;justify-items:center;align-content:center;gap:5px;min-height:128px;padding:6px;border-radius:15px;text-align:center}.node:nth-child(-n+2)::before{width:44px;height:42px}.node>ha-icon{--mdc-icon-size:28px}.node span{min-width:0;width:100%}.node b{font-size:13px}.node em{margin-top:3px}.mode{min-height:88px;padding:6px;border-radius:16px}.mode ha-icon{--mdc-icon-size:24px}.mode b{margin-top:4px;font-size:13px}.mode small{margin-top:2px}
          .bottomNav{padding:6px 7px calc(6px + env(safe-area-inset-bottom))}.bottomNav button{min-height:62px;border-radius:15px}.bottomNav button ha-icon{--mdc-icon-size:23px}
        }
        @media(max-width:390px){.systemDiagram{height:auto;aspect-ratio:388/315}.heroHead h1{font-size:21px}.zoneRow{top:62%}.zoneRow .diagramZone{grid-template-rows:32px auto auto;min-height:96px}.zoneRow .scene{height:32px}}
        @media(max-width:520px){
          :host{--ui-copy-min:11px}
          small,em{font-size:var(--ui-copy-min)!important}
          .headerTitle small,.heroHead small,.heroHead p,.connectionWrap>small,.rainSensor span,.controlLabel,.zoneRow .zoneText b,.zoneRow .zoneText small,.zoneRow .duration small,.mainlineLabel,.mainlineLabel b,.metric small,.metric em,.sectionTitle,.node small,.node em,.mode small,.bottomNav button,.detailCard p,.lab p{font-size:var(--ui-copy-min)}
          .connectionBadge{font-size:var(--ui-copy-min)}.zoneRow .duration{font-size:14px}.metric b{font-size:14px}.node b,.mode b{font-size:13px}
        }
        /* v0.6.8: a single transform canvas keeps the HA shell at native scale. */
        .heroPressure{display:flex;align-items:baseline;justify-content:flex-end;gap:5px;margin:7px 0 0 auto;padding:4px 7px;border:1px solid #dfe5e8;border-radius:10px;background:#fff;color:#505861;white-space:nowrap}
        .heroPressure span{font-size:11px}.heroPressure b{color:#079b29;font-size:12px}.heroPressure b.unknown{color:#6f7780}
        .systemDiagram{aspect-ratio:920/500}
        .deviceWires{position:absolute;z-index:1;inset:0;width:100%;height:100%;pointer-events:none}
        .controller{left:1%;top:1%;width:25%;height:23%;background:transparent url("${APPROVED_VISUALS.controller}") center/contain no-repeat}
        .rainSensor{left:28%;top:.5%;width:30%;height:27%;background:transparent url("${APPROVED_VISUALS.rain}") left center/auto 50% no-repeat}
        .rainSensor span{left:28%;top:38%}
        .controlBus{position:absolute;z-index:1;left:8.33%;right:8.33%;top:29%;height:2px;border-top:2px solid #6f7d88}
        .controlBus span{position:absolute;right:0;bottom:8px;padding:2px 5px;border-radius:6px;background:#fffffff0;color:#65727d;font-size:11px;white-space:nowrap}
        .manifoldRail{position:absolute;z-index:1;left:3.8%;right:2.2%;top:46.5%;height:22px;border:1px solid #10161b;border-radius:11px;background:linear-gradient(180deg,#3e474e 0%,#20272d 48%,#101519 100%);box-shadow:0 4px 8px #0004,inset 0 1px 0 #ffffff26}
        .supplyLine{position:absolute;z-index:0;left:0;top:calc(46.5% + 8px);width:5%;height:5px;background:#078fe8}
        .schemaGrid{position:absolute;z-index:2;left:.2%;right:1%;top:26%;bottom:7%;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}
        .schemaColumn{position:relative;display:grid;grid-template-rows:28px 44% 12% minmax(0,1fr);justify-items:center;min-width:0}
        .valveNumber{z-index:4;display:grid;place-items:center;width:25px;height:25px;border:1.5px solid #7b8994;border-radius:50%;background:#fff;color:#4f5b65;font-size:12px;font-weight:800;line-height:1}
        .schemaColumn::before{content:"";position:absolute;z-index:0;left:50%;top:0;height:31px;border-left:2px solid #6f7d88;transform:translateX(-50%)}
        .valvePhoto{position:relative;z-index:3;display:block;width:100%;height:100%;background:transparent url("${APPROVED_VISUALS.nodeValve}") center/contain no-repeat;filter:drop-shadow(0 3px 3px #0004)}
        .valvePhoto.running{filter:drop-shadow(0 0 5px #078fe8)}.valvePhoto.queued{filter:drop-shadow(0 0 5px #e89a12)}
        .waterBranch{z-index:0;display:block;width:5px;height:100%;background:#078fe8}.waterBranch.queue{background:#e89a12}
        .schemaGrid .diagramZone{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:47px auto auto;align-content:start;justify-items:stretch;gap:4px;width:100%;min-width:0;min-height:0;height:100%;padding:6px 5px;border:1px solid #dce1e5;border-radius:14px;background:#fff;color:#111317;text-align:left;box-shadow:0 3px 10px #1118270b}
        .schemaGrid .scene{width:100%;height:47px;border-radius:9px;background-position:center;background-size:cover;background-repeat:no-repeat;box-shadow:inset 0 0 0 1px #0000000a}.schemaGrid .scene ha-icon{display:none}
        .schemaGrid .zoneText{min-width:0;text-align:left}.schemaGrid .zoneText b{font-size:11px;line-height:1.05;color:#111317;white-space:nowrap}.schemaGrid .zoneText small{margin-top:3px;color:#71777e;font-size:11px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
        .schemaGrid .duration{display:flex;align-items:baseline;gap:3px;color:#111317;font-size:14px;text-align:left}.schemaGrid .duration small{display:inline;color:#626a73;font-size:11px}.schemaGrid .readyIcon{position:absolute;right:4px;top:5px;color:#08a52b;--mdc-icon-size:14px;filter:drop-shadow(0 1px 2px #fff)}
        .mainlineLabel{bottom:.2%;font-size:11px}.mainlineLabel b{font-size:11px}
        .metrics{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}.metric{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;min-height:110px;padding:12px;border-radius:20px}.metric>small{font-size:11px;font-weight:800}.metric>div{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:9px;width:100%}.metric>div>ha-icon{--mdc-icon-size:36px}.metric>div span{min-width:0}.metric b{font-size:20px}.metric em{font-size:11px}
        .quickActions{margin-top:8px}.quickActions .modeGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.quickActions .mode{min-height:116px}.quickActions .mode ha-icon{--mdc-icon-size:38px}.quickActions .manualAction{border-color:#078fe855;background:linear-gradient(145deg,#079bd0,#087aec);color:#fff}.quickActions .manualAction ha-icon,.quickActions .manualAction b,.quickActions .manualAction small{color:#fff}
        .statusesCard{padding:12px}.statusesHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.statusesHead .sectionTitle{margin:0;color:#111317;font-size:18px;letter-spacing:0;text-transform:none}.statusesHead>span{color:#626a73;font-size:11px;font-weight:700}
        .statusesCard .nodeGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.statusesCard .node{display:grid;grid-template-columns:1fr;grid-template-rows:auto 48px auto;justify-items:center;align-content:start;gap:5px;min-height:142px;padding:9px 6px;text-align:center}.statusesCard .node>small{width:100%;color:#111317;font-size:11px;font-weight:800;text-align:left}.statusesCard .node>ha-icon{display:grid;grid-row:2;--mdc-icon-size:40px}.statusesCard .node>span{width:100%}.statusesCard .node b{font-size:14px}.statusesCard .node em{font-size:11px}.statusesCard .node:nth-child(1)::before,.statusesCard .node:nth-child(2)::before,.statusesCard .node:nth-child(4)::before{content:"";display:block;grid-row:2;width:58px;height:48px;background-position:center;background-size:contain;background-repeat:no-repeat}.statusesCard .node:nth-child(1)::before{background-image:url("${APPROVED_VISUALS.nodeController}")}.statusesCard .node:nth-child(2)::before{background-image:url("${APPROVED_VISUALS.nodeValve}")}.statusesCard .node:nth-child(4)::before{background-image:url("${APPROVED_VISUALS.rain}")}.statusesCard .node:nth-child(1)>ha-icon,.statusesCard .node:nth-child(2)>ha-icon,.statusesCard .node:nth-child(4)>ha-icon{display:none}.statusesCard .node:nth-child(3)>ha-icon{display:grid;color:#078fe8}
        @media(max-width:520px){
          .heroPressure{margin-top:5px;padding:3px 6px}.heroPressure span,.heroPressure b{font-size:11px}
          .systemDiagram{aspect-ratio:388/350;margin-top:8px}
          .controller{left:.5%;top:1%;width:26%;height:23%}.rainSensor{left:28%;top:.5%;width:30%;height:27%;background-size:auto 50%}.rainSensor span{left:28%;top:38%}
          .controlBus{top:29%;left:8.33%;right:8.33%}.controlBus span{right:0;bottom:19px;font-size:11px}
          .manifoldRail{left:3.5%;right:1.8%;top:46.5%;height:19px;border-radius:10px}.supplyLine{top:calc(46.5% + 7px);width:5%;height:5px}
          .schemaGrid{left:.2%;right:.8%;top:24%;bottom:4%;gap:5px}.schemaColumn{grid-template-rows:26px 35% 9% minmax(0,1fr)}
          .valveNumber{width:23px;height:23px;font-size:11px}.schemaColumn::before{top:11px;height:31px}.valvePhoto{width:116%;margin-top:0;background-size:contain}
          .waterBranch{position:relative;z-index:2;margin-top:-1px;height:calc(100% + 2px)}
          .schemaGrid .diagramZone{grid-template-rows:36px auto auto;gap:4px;min-height:100px;padding:5px 4px 7px;border-radius:10px}.schemaGrid .scene{height:36px;border-radius:7px}.schemaGrid .zoneText b,.schemaGrid .zoneText small,.schemaGrid .duration small{font-size:11px}.schemaGrid .duration{font-size:14px;line-height:1.15}.schemaGrid .readyIcon{right:3px;top:4px;--mdc-icon-size:13px}
          .mainlineLabel{bottom:0}
          .metrics{gap:5px}.metric{min-height:102px;padding:9px 7px}.metric>div{grid-template-columns:32px minmax(0,1fr);gap:6px}.metric>div>ha-icon{--mdc-icon-size:30px}.metric b{font-size:17px}
          .quickActions .modeGrid{gap:5px}.quickActions .mode{min-height:100px;padding:7px}.quickActions .mode ha-icon{--mdc-icon-size:31px}
          .statusesCard{margin-top:7px;padding:9px}.statusesHead{margin-bottom:6px}.statusesCard .nodeGrid{gap:5px}.statusesCard .node{grid-template-rows:auto 42px auto;min-height:132px;padding:7px 4px;border-radius:15px}.statusesCard .node:nth-child(1)::before,.statusesCard .node:nth-child(2)::before,.statusesCard .node:nth-child(4)::before{width:46px;height:42px}.statusesCard .node>ha-icon{--mdc-icon-size:34px}.statusesCard .node b{font-size:13px}
        }
        :host{height:100vh;height:100dvh;min-height:0;overflow:hidden}
        .app{display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:100%;max-width:920px;height:100vh;height:100dvh;min-height:0;margin:0 auto;padding:0 14px;overflow:hidden}
        .appHeader{position:relative;top:auto;z-index:60}
        .workViewport{position:relative;min-width:0;min-height:0;overflow:hidden;overscroll-behavior:none;touch-action:none;background:var(--bg)}
        .workCanvas{position:absolute;left:0;top:0;width:100%;min-height:100%;transform-origin:0 0;will-change:transform;touch-action:none;-webkit-user-select:none;user-select:none}
        .workCanvas .content{padding-top:5px;padding-bottom:18px}
        .scaleToast{position:absolute;z-index:80;left:50%;bottom:18px;transform:translate(-50%,12px);padding:8px 13px;border-radius:99px;background:#111d;color:#fff;font-size:12px;font-weight:750;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
        .scaleToast.show{opacity:1;transform:translate(-50%,0)}
        .bottomNav{position:relative;z-index:70;left:auto;right:auto;bottom:auto;margin:0 -14px;padding:7px 8px calc(7px + env(safe-area-inset-bottom))}
        @media(max-width:520px){.app{padding:0 9px}.bottomNav{margin:0 -9px;padding:6px 7px calc(6px + env(safe-area-inset-bottom))}.workCanvas .content{padding-top:2px;padding-bottom:14px}}
        /* v0.6.13: NikaS Specialized Panel UI Standard v1.6 shell. */
        .appHeader{grid-template-columns:52px minmax(0,1fr) 52px;gap:8px;min-height:calc(62px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 4px 0}
        .headerButton{width:44px;height:44px;justify-self:center;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 3px 12px #00000012;color:var(--text)}
        .headerButton ha-icon{--mdc-icon-size:25px}.refreshButton{color:var(--a)}
        .headerTitle strong{font-size:23px;font-weight:800;line-height:1.05}.headerTitle small{margin-top:3px;font-size:14px;font-weight:560;color:var(--muted)}
        .workViewport.isNative{overflow-x:hidden;overflow-y:auto;overscroll-behavior-x:none;overscroll-behavior-y:none;touch-action:pan-y;-webkit-overflow-scrolling:touch}
        .workViewport.isNative .workCanvas{position:relative;left:auto;top:auto;min-height:100%;touch-action:pan-y;-webkit-user-select:auto;user-select:auto;will-change:auto}
        .workViewport.isZoomed{overflow:hidden;overscroll-behavior:none;touch-action:none}
        .workViewport.isZoomed .workCanvas{position:absolute;left:0;top:0;touch-action:none;-webkit-user-select:none;user-select:none;will-change:transform}
        .bottomNav{background:color-mix(in srgb,var(--card) 97%,transparent);border-top:1px solid var(--line);box-shadow:0 -3px 14px #0000000d}
        .bottomNav button{min-height:52px;border-radius:14px;color:var(--muted);font-size:12px;font-weight:700}
        .bottomNav button ha-icon{--mdc-icon-size:28px}.bottomNav button span{font-size:12px!important;font-weight:700;white-space:nowrap}
        .bottomNav button.active{background:color-mix(in srgb,var(--a) 11%,transparent);color:var(--a);box-shadow:none}
        @media(max-width:520px){
          .appHeader{grid-template-columns:48px minmax(0,1fr) 48px;min-height:calc(60px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 2px 0}
          .headerButton{width:44px;height:44px;border-radius:16px}.headerButton ha-icon{--mdc-icon-size:25px}
          .headerTitle strong{font-size:21px}.headerTitle small{font-size:13px}
          .bottomNav button{min-height:52px;border-radius:14px}.bottomNav button ha-icon{--mdc-icon-size:28px}
        }
        /* Meaningful UI copy is 12–25 px; 10 px remains only for a redundant wiring caption. */
        .content small,.content em,.content p{font-size:12px!important}
        .heroHead h1,.pageIntro h2,.stepper>b{font-size:25px}
        .connectionBadge{font-size:16px;font-weight:700;color:var(--muted);background:color-mix(in srgb,var(--muted) 10%,var(--card));border:1px solid color-mix(in srgb,var(--muted) 30%,transparent)}
        .connectionBadge.local{color:var(--green);background:color-mix(in srgb,var(--green) 11%,var(--card));border-color:color-mix(in srgb,var(--green) 30%,transparent)}
        .connectionBadge.cloud{color:var(--a);background:color-mix(in srgb,var(--a) 10%,var(--card));border-color:color-mix(in srgb,var(--a) 30%,transparent)}
        .connectionWrap>small{font-size:13px!important;font-weight:600}
        .heroPressure span{font-size:12px}.heroPressure b{font-size:14px}
        .rainSensor span,.valveNumber,.schemaGrid .zoneText b,.schemaGrid .zoneText small,.schemaGrid .duration small,.mainlineLabel,.mainlineLabel b,.metric>small,.metric em,.statusesHead>span,.statusesCard .node>small,.statusesCard .node em,.programRow b,.diagList b{font-size:12px}
        .controlBus span{font-size:10px}
        @media(max-width:520px){.headerTitle strong{font-size:21px}.headerTitle small{font-size:13px}.connectionBadge{font-size:16px}.connectionWrap>small{font-size:13px!important}}
        /* v0.6.14: approved zone thumbnails and simplified rain-sensor wiring. */
        .schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);gap:0;padding:4px;overflow:hidden}
        .schemaGrid .diagramZone .scene{width:100%;height:100%;min-height:58px;border-radius:10px;background-position:center;background-size:cover;background-repeat:no-repeat}
        .schemaGrid .diagramZone .zoneText,.schemaGrid .diagramZone .duration,.schemaGrid .diagramZone .readyIcon{display:none!important}
        .schemaGrid .diagramZone.running{border-color:color-mix(in srgb,var(--a) 72%,#dce1e5);box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 18%,transparent)}
        .schemaGrid .diagramZone.queued{border-color:color-mix(in srgb,var(--orange) 68%,#dce1e5);box-shadow:0 0 0 2px color-mix(in srgb,var(--orange) 16%,transparent)}
        @media(max-width:520px){.schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);min-height:76px;padding:3px}.schemaGrid .diagramZone .scene{height:100%;min-height:68px;border-radius:8px}}
      `;
    }

    render() { this._queueRender(); }

    _render() {
      if (!this.shadowRoot) return;
      if (!VIEWS.includes(this._view)) this._view = "status";
      this._restoreTransform(false);
      const content = this._viewContent();
      const structureKey = this._structureKey();

      if (!this._shellMounted) {
        this.shadowRoot.innerHTML = `<style>${this.styles()}</style><div class="app">${this.header()}${this._workspace(content)}${this.bottomNav()}</div>`;
        this._shellMounted = true;
        this._renderedStructureKey = structureKey;
        const initialContent = this.shadowRoot.querySelector("[data-work-canvas] > .content");
        if (initialContent) this._viewNodeCache.set(structureKey, initialContent);
        this.bindActions();
      } else if (this._renderedStructureKey !== structureKey) {
        this._reuseWorkContent(content, structureKey);
        this._renderedStructureKey = structureKey;
      } else {
        this._patchWorkContent(content);
      }
      this._updateNavigationState();
      requestAnimationFrame(() => {
        this._clampAndApplyTransform(false);
        this._restoreNativeScroll();
      });
    }
  }

  if (!customElements.get("nikas-ho-sc-8w-panel")) {
    customElements.define("nikas-ho-sc-8w-panel", HOSC8WPanel);
  }
})();
