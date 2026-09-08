const NIKAS_HO_SC_8W_UI_VERSION = "1.0.0";

(() => {
  const UI_VERSION = NIKAS_HO_SC_8W_UI_VERSION;
  const ASSET_VERSION = UI_VERSION;
  const ASSET_BASE = "/nikas-ho-sc-8w/assets";
  const assetUrl = (name) => `${ASSET_BASE}/${name}?v=${ASSET_VERSION}`;
  const APPROVED_VISUALS = Object.freeze({
    nodeController: assetUrl("ho-sc-8w-controller-node-v4.webp"),
    nodeValve: assetUrl("valve-v2.webp"),
    nodeMainline: assetUrl("mainline-node.webp"),
    controller: assetUrl("ho-sc-8w-controller-v4.webp"),
    rain: assetUrl("rain-sensor-v5.webp"),
    manifold: assetUrl("manifold-v1.webp"),
    zone1: assetUrl("zone-lawn-v2.webp"),
    zone2: assetUrl("zone-lawn-v2.webp"),
    zone3: assetUrl("zone-lawn-v2.webp"),
    zone4: assetUrl("zone-flowers-v2.webp"),
    zone5: assetUrl("zone-shrubs-v2.webp"),
    zone6: assetUrl("zone-greenhouse-v2.webp"),
  });
  const BAD = new Set(["unknown", "unavailable", "", null, undefined]);
  const VIEWS = ["status", "zones", "program", "manual", "diagnostics"];
  const VIEW_SCALE_MIN = 0.75;
  const VIEW_SCALE_MAX = 2;
  const VIEW_SCALE_SNAP_MIN = 0.97;
  const VIEW_SCALE_SNAP_MAX = 1.03;
  const VIEW_STATE_PREFIX = "nikas_ho_sc_8w.view_transform.v2";

const SOURCE_ROUTE_KEY = "nikas.specialized.source_route.v1";
  const SOURCE_ROUTE_AT_KEY = "nikas.specialized.source_route_at.v1";
  const RETURN_ROUTE_KEY = "nikas.ho_sc_8w.return_route.v1";
  const SAFE_DEFAULT_ROUTE = "/dashboard-actions/home";

  function safeReturnRoute(value) {
    if (!value) return null;
    try {
      const url = new URL(decodeURIComponent(String(value).trim()), window.location.origin);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname === "/dashboard-house-v11" || url.pathname.startsWith("/dashboard-house-v11/")) return "/dashboard-house-v11/home";
      if (url.pathname === "/dashboard-actions" || url.pathname.startsWith("/dashboard-actions/")) return "/dashboard-actions/home";
      if (url.pathname === "/dashboard-infrastructure" || url.pathname.startsWith("/dashboard-infrastructure/")) return "/dashboard-infrastructure/overview";
      return null;
    } catch (_error) {
      return null;
    }
  }

  function resolveReturnRoute(panel) {
    const current = new URL(window.location.href);
    const explicit = safeReturnRoute(current.searchParams.get("return_to")) || safeReturnRoute(current.searchParams.get("from"));
    let handedOff = null;
    let saved = null;
    try {
      const handedOffRaw = sessionStorage.getItem(SOURCE_ROUTE_KEY);
      const handedOffAtRaw = sessionStorage.getItem(SOURCE_ROUTE_AT_KEY);
      const handedOffAt = Number(handedOffAtRaw);
      const handedOffAge = Date.now() - handedOffAt;
      const handedOffFresh = handedOffRaw !== null
        && handedOffAtRaw !== null
        && Number.isFinite(handedOffAt)
        && handedOffAge >= 0
        && handedOffAge <= 30_000;
      handedOff = handedOffFresh ? safeReturnRoute(handedOffRaw) : null;
      sessionStorage.removeItem(SOURCE_ROUTE_KEY);
      sessionStorage.removeItem(SOURCE_ROUTE_AT_KEY);
      saved = safeReturnRoute(sessionStorage.getItem(RETURN_ROUTE_KEY));
    } catch (_error) {}
    const configured = safeReturnRoute(panel?._panel?.config?.parent_route || panel?._panel?.config?.parent_path);
    const route = explicit || handedOff || saved || safeReturnRoute(document.referrer) || configured || SAFE_DEFAULT_ROUTE;
    try { sessionStorage.setItem(RETURN_ROUTE_KEY, route); } catch (_error) {}
    return route;
  }

    class HOSC8WPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._view = "status";
      this._drillZone = null;
      this._manualQueue = [];
      this._manualDurations = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index + 1, 10]));
      this._manualBusy = false;
      this._seasonalBusy = false;
      this._seasonalDraft = null;
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
      this._transformFrame = 0;
      this._pendingTransform = null;
      this._nativeScrollPositions = new Map();
      this._pendingScrollTop = null;
      this._shellMounted = false;
      this._returnRoute = null;
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
      if (viewport) { viewport.classList.toggle("isZoomed", this._viewTransform.scale > 1); viewport.classList.toggle("isNative", this._viewTransform.scale <= 1); }
    }
    _scheduleGestureTransform(transform) {
      this._pendingTransform = transform;
      if (this._transformFrame) return;
      this._transformFrame = requestAnimationFrame(() => {
        this._transformFrame = 0;
        if (!this._pendingTransform) return;
        this._viewTransform = this._pendingTransform; this._pendingTransform = null; this._clampAndApplyTransform(false);
      });
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
    navigateParent() {
      const path = this._panel?.config?.parent_path || "/dashboard-actions";
      if (window.location.pathname === path) return;
      window.history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
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

    notify(message) {
      this.dispatchEvent(new CustomEvent("hass-notification", {
        detail: { message }, bubbles: true, composed: true,
      }));
    }

    serviceTargetData() {
      const entryId = this._panel?.config?.entry_id;
      return entryId ? { config_entry_id: entryId } : {};
    }

    commandBusy() {
      return this._manualBusy || this._seasonalBusy;
    }

    integrationServiceAvailable(service) {
      return Boolean(this._hass?.callService && this._hass?.services?.nikas_ho_sc_8w?.[service]);
    }

    controllerStateAvailable() {
      const entities = this.entities();
      return !this.bad(this.state(entities.connection)) && !this.bad(this.state(entities.operation));
    }

    commandAvailable(service) {
      return !this.commandBusy() && this.integrationServiceAvailable(service) && this.controllerStateAvailable();
    }

    rejectUnavailableCommand(service) {
      if (this.commandBusy()) return true;
      if (this.integrationServiceAvailable(service) && this.controllerStateAvailable()) return false;
      this.notify("Команда недоступна: Home Assistant не подтвердил сервис или состояние контроллера");
      return true;
    }

    serviceError(error, fallback) {
      return error?.message || error?.body?.message || fallback;
    }

    selectedManualZones() {
      return [...new Set(this._manualQueue || [])]
        .map(Number)
        .filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 6)
        .sort((a, b) => a - b);
    }

    toggleManualZone(zone) {
      const selected = new Set(this.selectedManualZones());
      if (selected.has(zone)) selected.delete(zone);
      else selected.add(zone);
      this._manualQueue = [...selected].sort((a, b) => a - b);
      this.render();
    }

    setManualDuration(zone, value) {
      const duration = Math.min(120, Math.max(1, Math.round(Number(value) || 1)));
      this._manualDurations = { ...this._manualDurations, [zone]: duration };
      return duration;
    }

    syncManualDurationInputs() {
      for (const input of this.shadowRoot.querySelectorAll("[data-queue-duration]")) {
        const zone = Number(input.dataset.queueDuration);
        const value = Number(input.value);
        if (!Number.isInteger(value) || value < 1 || value > 120) {
          this.notify(`Зона ${zone}: укажите целое время от 1 до 120 минут`);
          input.focus();
          return false;
        }
        this.setManualDuration(zone, value);
      }
      return true;
    }

    async startManualQueue() {
      if (this.rejectUnavailableCommand("start_manual_queue")) return;
      const selected = this.selectedManualZones();
      if (!selected.length) {
        this.notify("Добавьте хотя бы одну зону в очередь");
        return;
      }
      if (!this.syncManualDurationInputs()) return;
      const zones = selected.map((zone) => ({
        zone,
        duration_minutes: this._manualDurations[zone],
      }));
      const summary = zones.map((item) => `Зона ${item.zone} — ${item.duration_minutes} мин`).join("\n");
      if (!window.confirm(`Запустить ручной полив?\n\n${summary}\n\nКонтроллер перейдёт в ручной режим.`)) return;
      this._manualBusy = true;
      this.render();
      try {
        await this._hass.callService("nikas_ho_sc_8w", "start_manual_queue", {
          ...this.serviceTargetData(), zones,
        });
        this.notify("Очередь принята и подтверждена контроллером");
        await this.refreshNow();
      } catch (error) {
        this.notify(this.serviceError(error, "Не удалось подтвердить запуск очереди"));
      } finally {
        this._manualBusy = false;
        this.render();
      }
    }

    async stopManual() {
      if (this.rejectUnavailableCommand("stop_manual")) return;
      if (!window.confirm("Остановить ручной полив?\n\nКонтроллер перейдёт в режим OFF.")) return;
      this._manualBusy = true;
      this.render();
      try {
        await this._hass.callService("nikas_ho_sc_8w", "stop_manual", this.serviceTargetData());
        this.notify("Полив остановлен и подтверждён контроллером");
        await this.refreshNow();
      } catch (error) {
        this.notify(this.serviceError(error, "Не удалось подтвердить остановку"));
      } finally {
        this._manualBusy = false;
        this.render();
      }
    }

    async resumeAutomatic() {
      if (this.rejectUnavailableCommand("resume_automatic")) return;
      if (!window.confirm("Вернуть автоматический режим полива?")) return;
      this._manualBusy = true;
      this.render();
      try {
        await this._hass.callService("nikas_ho_sc_8w", "resume_automatic", this.serviceTargetData());
        this.notify("Режим Авто подтверждён контроллером");
        await this.refreshNow();
      } catch (error) {
        this.notify(this.serviceError(error, "Не удалось подтвердить режим Авто"));
      } finally {
        this._manualBusy = false;
        this.render();
      }
    }

    async applySeasonalAdjustment() {
      if (this.rejectUnavailableCommand("set_seasonal_adjustment")) return;
      const input = this.shadowRoot.querySelector("[data-season-value]");
      const value = Number(input?.value ?? this._seasonalDraft);
      if (!Number.isInteger(value) || value < -90 || value > 100 || value % 10 !== 0) {
        this.notify("Сезонная коррекция: от −90% до 100%, шаг 10%");
        input?.focus();
        return;
      }
      const current = this.state(this.entities().seasonal);
      if (String(value) === String(current)) {
        this.notify("Это значение уже установлено");
        return;
      }
      if (!window.confirm(`Применить сезонную коррекцию ${value}%?\n\nТекущее значение: ${current}%.`)) return;
      this._seasonalBusy = true;
      this.render();
      try {
        await this._hass.callService("nikas_ho_sc_8w", "set_seasonal_adjustment", {
          ...this.serviceTargetData(), value,
        });
        this._seasonalDraft = null;
        this.notify(`Сезонная коррекция ${value}% подтверждена контроллером`);
        await this.refreshNow();
      } catch (error) {
        this.notify(this.serviceError(error, "Не удалось подтвердить сезонную коррекцию"));
      } finally {
        this._seasonalBusy = false;
        this.render();
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
    rainPresentation(e) {
      const value = this.state(e.rain);
      if (this.bad(value)) return { label: "Нет данных", detail: "Состояние неизвестно", tone: "unknown", icon: "mdi:help-circle" };
      if (["enabled", "true", "on"].includes(String(value))) return { label: "Учитывается", detail: "Контроль включён", tone: "clear", icon: "mdi:check-circle" };
      if (["disabled", "false", "off"].includes(String(value))) return { label: "Не учитывается", detail: "Контроль выключен", tone: "blocked", icon: "mdi:umbrella-outline" };
      return { label: "Нет данных", detail: "Состояние неизвестно", tone: "unknown", icon: "mdi:help-circle" };
    }
    starts(attrs) { return Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : []; }
    fullStarts(attrs) {
      const starts = this.starts(attrs);
      return starts.length ? starts.join(" · ") : "—";
    }
    startChips(starts, className = "startTimes") {
      const values = starts.length ? starts : ["Нет запусков"];
      const label = starts.length ? `Запуски: ${starts.join(", ")}` : "Запуски не установлены";
      return `<span class="${className}" aria-label="${this.esc(label)}">${values.map((value) => `<span>${this.esc(value)}</span>`).join("")}</span>`;
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
        <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
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
    connectionIndicator(e) {
      const value = this.state(e.connection);
      const attrs = this.attrs(e.connection);
      const exists = Boolean(e.connection && this.states()[e.connection]);
      const stale = attrs.online === false || Number(attrs.fail_count || 0) > 0;
      let label = "Нет данных";
      let tone = "unknown";
      let freshness = "Нет данных";
      let freshnessTone = "nodata";
      if (exists && value === "local") {
        label = "Локально";
        tone = "ok";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "cloud") {
        label = "Облако";
        tone = "ok";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "reserve") {
        label = "Резерв";
        tone = "reserve";
        freshness = stale ? "Данные устарели" : "Данные актуальны";
        freshnessTone = stale ? "stale" : "current";
      } else if (exists && value === "unavailable") {
        label = "Нет связи";
        tone = "offline";
      }
      const pressure = this.pressurePresentation(e);
      const rain = this.rainPresentation(e);
      const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";
      const rainEntity = e.rain ? ` data-entity="${this.esc(e.rain)}"` : "";
      const connectionEntity = e.connection ? ` data-entity="${this.esc(e.connection)}"` : "";
      const aria = `${label}. ${freshness}`;
      return `<div class="connectionWrap"><button class="systemConnection ${tone}" data-connection-indicator${connectionEntity} aria-label="${this.esc(aria)}"><span class="systemConnectionMain"><i></i><b>${label}</b></span><small class="freshness ${freshnessTone}">${freshness}</small></button><button class="heroPressure"${pressureEntity}><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button><button class="rainStatusCard ${rain.tone}"${rainEntity}><span class="rainStatusPhoto" aria-hidden="true"></span><span class="rainStatusText"><b>Датчик дождя</b><strong>${this.esc(rain.label)}</strong><small>${this.esc(rain.detail)}</small></span><ha-icon icon="${rain.icon}"></ha-icon></button></div>`;
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
      if (isActive) { tone = "running"; label = "Полив"; }
      else if (isQueued) { tone = "queued"; label = "В очереди"; }
      else if (state === "disabled") tone = "off";
      else if (this.bad(state)) tone = "unknown";
      return {
        q, tone, label,
        duration: attrs.duration_min ?? attrs.duration_minutes ?? "—",
        starts: this.starts(attrs),
        start: this.fullStarts(attrs),
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
        const readyIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline" : z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";
        return `<div class="schemaColumn" data-axis="${zone}">
          <span class="valveNumber">${zone}</span>
          <span class="valvePhoto ${valveTone}" aria-hidden="true"></span>
          <span class="waterBranch ${branchTone}" aria-hidden="true"></span>
          <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">
            <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>
            <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>
            <span class="duration"><span><b>${this.esc(z.duration)}</b><small>мин</small></span><em>по программе</em></span>
            <ha-icon class="readyIcon" icon="${readyIcon}"></ha-icon>
          </button>
        </div>`;
      }).join("");
      return `<div class="systemDiagram">
        <svg class="deviceWires" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">
          <path class="wire controlLead" d="M 205 82 V 108 H 84"/>
        </svg>
        <button class="controller" data-entity="${this.esc(e.connection)}"><div class="cap"></div><div class="body"><b>HO-SC-8W</b><i></i><small>INKBIRD / HiOazo</small></div><div class="ports"><i></i><i></i></div></button>
        <div class="controlBus" aria-hidden="true"></div>
        <div class="manifoldRail" aria-hidden="true"></div>
        <div class="supplyLine" aria-hidden="true"></div>
        <div class="schemaGrid">${columns}</div>
      </div>`;
    }

    metrics(e) {
      const seasonal = this.state(e.seasonal);
      const operation = this.state(e.operation);
      const firstStart = Array.from({ length: 6 }, (_, i) => i + 1)
        .flatMap((zone) => this.zoneRuntime(e, zone).starts)
        .sort()[0] || "—";
      return `<div class="metrics">
        <button class="metric water" data-entity="${this.esc(e.zones[1].schedule)}"><small>ПРОГРАММА</small><div><ha-icon icon="mdi:calendar-blank-outline"></ha-icon><span><b>${this.esc(firstStart)}</b><em>Первый запуск</em></span></div></button>
        <button class="metric ${operation === "Auto" ? "active" : ""}" data-entity="${this.esc(e.operation)}"><small>РЕЖИМ</small><div><ha-icon icon="mdi:autorenew"></ha-icon><span><b>${this.esc(this.human("operation", operation))}</b><em>${this.esc(this.human("irrigation", this.state(e.irrigation)))}</em></span></div></button>
        <button class="metric ${this.bad(seasonal) ? "" : "active"}" data-entity="${this.esc(e.seasonal)}"><small>СЕЗОННАЯ КОРРЕКЦИЯ</small><div><ha-icon icon="mdi:percent-outline"></ha-icon><span><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b><em>Текущее значение</em></span></div></button>
      </div>`;
    }
    hero(e) {
      const status = this.systemStatus(e);
      return `<section class="hero ${status.tone}"><div class="heroHead"><div class="heroStatus"><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionIndicator(e)}</div>${this.irrigationDiagram(e)}</section>`;
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
        <button class="mode manualAction ${operation === "Manual" ? "active" : ""}" data-go="manual"><ha-icon icon="mdi:hand-back-right-outline"></ha-icon><b>Ручной</b><small>${operation === "Manual" ? "Активен" : "Настроить"}</small></button>
      </div></section>`;
    }
    statusView(e) { return `<div class="statusScreen">${this.hero(e)}${this.metrics(e)}${this.currentMode(e)}</div>`; }

    zoneDetail(e, zone) {
      const z = this.zoneRuntime(e, zone);
      const a = z.attrs;
      return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button><section class="detailCard"><div class="detailHead"><span class="scene scene${zone}" aria-hidden="true"></span><div><small>ЗОНА ${zone}</small><h2>${this.esc(z.label)}</h2></div></div><div class="detailGrid"><div><small>Длительность</small><b>${this.esc(z.duration)} мин</b></div><div><small>Старт</small><b>${this.esc(z.start)}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Датчик дождя</small><b>${a.rain_sensor_follow === true ? "Учитывается" : a.rain_sensor_follow === false ? "Не учитывается" : "Нет данных"}</b></div></div><p>Параметры программы доступны только для просмотра.</p></section>`;
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
      const rain = this.rainPresentation(e);
      const seasonalCommandAvailable = this.commandAvailable("set_seasonal_adjustment") && !this.bad(seasonal);
      const seasonalValue = this._seasonalDraft === null
        ? (this.bad(seasonal) ? "" : seasonal)
        : this._seasonalDraft;
      const firstStart = Array.from({ length: 6 }, (_, i) => i + 1)
        .flatMap((zone) => this.starts(this.zoneRuntime(e, zone).attrs))
        .sort()[0] || "—";
      const zoneRows = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
        const z = this.zoneRuntime(e, zone);
        return `<button class="programRow" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span class="programZone"><b>Зона ${zone}</b><small>${this.esc(z.duration)} мин</small></span>${this.startChips(z.starts, "programTimes")}<ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
      }).join("");
      return `<div class="pageIntro"><small>ПРОГРАММА</small><h2>Автоматический полив</h2><p>Программа зон доступна для просмотра. Сезонная коррекция изменяется отдельно с подтверждением.</p></div><section class="summaryGrid"><button data-entity="${this.esc(e.operation)}"><small>Режим</small><b>${this.esc(this.human("operation", this.state(e.operation)))}</b></button><div class="programSeasonEditor ${this.bad(seasonal) ? "" : "active"}"><small>Сезон</small><span class="programSeasonControls"><label class="seasonalInput"><input data-season-value type="number" inputmode="numeric" min="-90" max="100" step="10" value="${this.esc(seasonalValue)}" aria-label="Сезонная коррекция, процентов" ${seasonalCommandAvailable ? "" : "disabled"}><b>%</b></label><button data-season-apply ${seasonalCommandAvailable ? "" : "disabled"}>${this._seasonalBusy ? "Проверка…" : "Применить"}</button></span></div><button data-entity="${this.esc(e.rain)}"><small>Датчик дождя</small><b>${this.esc(rain.label)}</b></button><button data-entity="${this.esc(e.zones[1].schedule)}"><small>Первый запуск</small><b>${this.esc(firstStart)}</b></button></section><section class="programList">${zoneRows}</section>`;
    }
    manualView(e) {
      const operationRaw = this.state(e.operation);
      const operationKey = String(operationRaw).toLowerCase();
      const operation = this.human("operation", operationRaw);
      const active = [...this.zoneSet(this.state(e.active))].map(Number).filter(Boolean).sort((a, b) => a - b);
      const pending = [...this.zoneSet(this.state(e.queued))].map(Number).filter(Boolean).sort((a, b) => a - b);
      const selected = this.selectedManualZones();
      const startAvailable = this.commandAvailable("start_manual_queue");
      const stopAvailable = this.commandAvailable("stop_manual");
      const resumeAvailable = this.commandAvailable("resume_automatic");
      const selectedSet = new Set(selected);
      const zoneButtons = Array.from({ length: 6 }, (_, index) => index + 1).map((zone) => {
        const order = selected.indexOf(zone) + 1;
        return `<button class="manualZone ${selectedSet.has(zone) ? "active" : ""}" data-queue-toggle="${zone}" aria-pressed="${selectedSet.has(zone)}"><span>${selectedSet.has(zone) ? order : zone}</span><small>${selectedSet.has(zone) ? `В очереди · зона ${zone}` : `Зона ${zone}`}</small></button>`;
      }).join("");
      const queueRows = selected.map((zone, index) => `<div class="manualQueueRow"><span class="queueOrder">${index + 1}</span><span class="queueZone"><b>Зона ${zone}</b><small>по порядку контроллера</small></span><div class="queueDuration"><button data-queue-step="-1" data-queue-id="${zone}" aria-label="Уменьшить время зоны ${zone}">−</button><label><input data-queue-duration="${zone}" type="number" inputmode="numeric" min="1" max="120" step="1" value="${this.esc(this._manualDurations[zone])}"><span>мин</span></label><button data-queue-step="1" data-queue-id="${zone}" aria-label="Увеличить время зоны ${zone}">+</button></div></div>`).join("");
      const total = selected.reduce((sum, zone) => sum + Number(this._manualDurations[zone] || 0), 0);
      const watering = active.length || pending.length || operationKey === "manual";
      const runningText = active.length ? `Сейчас: зона ${active.join(", ")}` : "Активная зона ожидается";
      const pendingText = pending.length ? `Далее: ${pending.join(" → ")}` : "Очередь контроллера пуста";
      return `<div class="pageIntro"><small>РУЧНОЙ ПОЛИВ</small><h2>Очередь зон</h2><p>Выберите зоны и задайте отдельное время каждой.</p></div><section class="manualCard manualQueueCard">
        <div class="manualRuntime ${watering ? "running" : "idle"}"><ha-icon icon="${watering ? "mdi:water" : "mdi:playlist-check"}"></ha-icon><span><small>Текущий режим · ${this.esc(operation)}</small><b>${watering ? this.esc(runningText) : "Готово к настройке"}</b><em>${watering ? this.esc(pendingText) : "Выполнение по возрастанию номера зоны"}</em></span></div>
        ${watering ? `<div class="manualRunningActions"><button class="stopManual" data-manual-stop ${stopAvailable ? "" : "disabled"}><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${this._manualBusy ? "Проверка…" : "Остановить"}</button>${!active.length && !pending.length && operationKey !== "auto" ? `<button class="resumeAuto" data-resume-auto ${resumeAvailable ? "" : "disabled"}>Вернуть Авто</button>` : ""}</div>` : ""}
        <div class="manualZones" aria-label="Выбор зон">${zoneButtons}</div>
        <div class="manualQueueHead"><span>Очередь</span><b>${selected.length ? `${selected.length} зон · ${total} мин` : "Не выбрана"}</b></div>
        <div class="manualQueueList">${queueRows || `<div class="manualEmpty"><ha-icon icon="mdi:gesture-tap"></ha-icon><span>Нажмите на зоны выше, чтобы добавить их в очередь</span></div>`}</div>
        <button class="manualStart" data-manual-start ${!selected.length || watering || !startAvailable ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span><b>${this._manualBusy ? "Проверка контроллера…" : "Запустить очередь"}</b><small>${selected.length ? `${selected.length} зон · ${total} мин` : "Сначала выберите зоны"}</small></span></button>
        ${operationKey === "off" && !active.length && !pending.length ? `<button class="resumeAuto standalone" data-resume-auto ${resumeAvailable ? "" : "disabled"}>Вернуть автоматический режим</button>` : ""}
        <p class="manualNote">${this.controllerStateAvailable() ? "Команда отправляется только после подтверждения. Успех показывается после чтения DP101, DP107 и DP108." : "Управление отключено: нет подтверждённого состояния контроллера."}</p>
      </section>`;
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
          this._scheduleGestureTransform({ scale: nextScale, x: mid.x - start.contentX * nextScale, y: mid.y - start.contentY * nextScale });
          this._cancelLongPresses();
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
        this._scheduleGestureTransform({ ...this._viewTransform, x: start.x + dx, y: start.y + dy });
      }, { passive: false });

      const finishPointer = (event) => {
        if (this._pendingTransform) { this._viewTransform = this._pendingTransform; this._pendingTransform = null; }
        if (this._transformFrame) { cancelAnimationFrame(this._transformFrame); this._transformFrame = 0; }
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
        if (target.matches("[data-parent-nav]")) { this.navigateParent(); return; }
        if (target.hasAttribute("data-season-apply")) { this.applySeasonalAdjustment(); return; }
        if (target.dataset.queueToggle) { this.toggleManualZone(Number(target.dataset.queueToggle)); return; }
        if (target.dataset.queueStep) {
          const zone = Number(target.dataset.queueId);
          this.setManualDuration(zone, Number(this._manualDurations[zone] || 10) + Number(target.dataset.queueStep));
          this.render();
          return;
        }
        if (target.hasAttribute("data-manual-start")) { this.startManualQueue(); return; }
        if (target.hasAttribute("data-manual-stop")) { this.stopManual(); return; }
        if (target.hasAttribute("data-resume-auto")) { this.resumeAutomatic(); return; }
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
        if (target.dataset.entity) this.moreInfo(target.dataset.entity);
      });

      this.shadowRoot.addEventListener("input", (event) => {
        const input = event.target;
        if (input?.matches?.("[data-season-value]")) {
          this._seasonalDraft = input.value;
          return;
        }
        if (input?.matches?.("[data-queue-duration]")) {
          const value = Number(input.value);
          if (Number.isInteger(value) && value >= 1 && value <= 120) {
            this.setManualDuration(Number(input.dataset.queueDuration), value);
          }
        }
      });

      this.shadowRoot.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        if (event.target?.matches?.("[data-season-value]")) {
          event.preventDefault();
          this.applySeasonalAdjustment();
        }
      });

      viewport?.addEventListener("pointerleave", clearLongPress);
    }

    _viewContent() {
      if (!this._hass) {
        return `<section class="hero unknown"><div class="heroHead"><div><h1>Загрузка данных…</h1><p>Ожидание Home Assistant</p></div></div><div class="systemDiagram"></div></section>`;
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
      const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
      if (viewport) viewport.classList.toggle("statusFitsViewport", this._view === "status");
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
        :host{position:fixed;inset:0;display:block;width:auto;height:auto;min-width:0;min-height:0;overflow:hidden;overscroll-behavior:none}
        .app{position:absolute;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:100%;max-width:920px;height:auto;min-height:0;margin:0 auto;padding:0 14px;overflow:hidden;overscroll-behavior:none}
        .appHeader{position:relative;top:auto;z-index:60;touch-action:none}
        .workViewport{position:relative;min-width:0;min-height:0;overflow:hidden;overscroll-behavior:none;touch-action:none;background:var(--bg)}
        .workCanvas{position:absolute;left:0;top:0;width:100%;min-height:100%;transform-origin:0 0;will-change:transform;touch-action:none;-webkit-user-select:none;user-select:none}
        .workCanvas .content{padding-top:5px;padding-bottom:18px}
        .scaleToast{position:absolute;z-index:80;left:50%;bottom:18px;transform:translate(-50%,12px);padding:8px 13px;border-radius:99px;background:#111d;color:#fff;font-size:12px;font-weight:750;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
        .scaleToast.show{opacity:1;transform:translate(-50%,0)}
        .bottomNav{position:relative;z-index:70;left:auto;right:auto;bottom:auto;margin:0 -14px;padding:7px 8px calc(7px + env(safe-area-inset-bottom));touch-action:none}
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
        /* v0.6.15: standard connection indicator, no status strip, filled phone composition. */
        .statusScreen{display:block;min-width:0}
        .systemConnection{display:grid;gap:2px;min-width:168px;padding:8px 12px;border:1px solid color-mix(in srgb,var(--muted) 30%,transparent);border-radius:16px;background:color-mix(in srgb,var(--muted) 9%,var(--card));color:var(--muted);text-align:left;box-shadow:none}
        .systemConnectionMain{display:flex;align-items:center;gap:8px;min-width:0}.systemConnectionMain i{display:block;flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:currentColor}.systemConnectionMain b{font-size:16px;font-weight:700;line-height:1.05;white-space:nowrap}.systemConnection .freshness{display:block;margin-left:18px;color:var(--muted);font-size:13px!important;font-weight:600;line-height:1.1;white-space:nowrap}
        .systemConnection.ok{color:var(--green);background:color-mix(in srgb,var(--green) 10%,var(--card));border-color:color-mix(in srgb,var(--green) 30%,transparent)}.systemConnection.reserve{color:var(--orange);background:color-mix(in srgb,var(--orange) 10%,var(--card));border-color:color-mix(in srgb,var(--orange) 30%,transparent)}.systemConnection.offline{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,var(--card));border-color:color-mix(in srgb,var(--danger) 30%,transparent)}.systemConnection .freshness.stale{color:var(--orange)}.systemConnection.offline .freshness,.systemConnection .freshness.nodata{color:var(--muted)}
        .connectionWrap{display:flex;flex-direction:column;align-items:stretch;gap:6px;text-align:left}.heroPressure{width:100%;margin:0;justify-content:space-between;padding:5px 9px;border-radius:12px}
        .statusScreen .hero{display:flex;flex-direction:column;min-height:0}.statusScreen .systemDiagram{height:clamp(410px,50dvh,520px);aspect-ratio:auto;margin-top:10px}.statusScreen .metrics{margin-top:7px}.statusScreen .quickActions{margin-top:7px}
        .controller{left:1%;top:2%;width:28%;height:21%}.rainSensor{left:45.5%;top:2%;width:27%;height:21%;background-position:left center;background-size:auto 48%}.rainSensor span{left:43%;top:36%}.controlBus{top:29%;left:8.33%;right:8.33%}.controlBus span{left:50%;right:auto;bottom:9px;transform:translateX(-50%)}
        @media(max-width:520px){
          .heroHead{align-items:flex-start;gap:8px}.heroHead>div:first-child{padding-top:2px}.systemConnection{min-width:158px;padding:7px 10px;border-radius:15px}.systemConnectionMain{gap:7px}.systemConnectionMain i{width:9px;height:9px}.systemConnectionMain b{font-size:16px}.systemConnection .freshness{margin-left:16px;font-size:13px!important}.heroPressure{padding:4px 7px}
          .statusScreen .systemDiagram{height:clamp(420px,52dvh,470px);aspect-ratio:auto;margin-top:8px}.statusScreen .metrics{margin-top:6px}.statusScreen .quickActions{margin-top:6px}.statusScreen .metric{min-height:106px}.statusScreen .quickActions .mode{min-height:104px}
          .controller{left:.5%;top:2%;width:28.5%;height:21%}.rainSensor{left:45.5%;top:2%;width:28%;height:21%;background-size:auto 48%}.rainSensor span{left:43%;top:36%}
          .controlBus{top:29%}.controlBus span{left:50%;right:auto;bottom:9px;transform:translateX(-50%)}
          .manifoldRail{top:46.5%}.supplyLine{top:calc(46.5% + 7px)}.schemaGrid{top:24%;bottom:3%;gap:5px}.schemaColumn{grid-template-rows:26px 35% 9% minmax(0,1fr)}
        }
        /* v0.6.16: informative zone cards, compact schematic and fit-without-scroll status view. */
        .workViewport.isNative .workCanvas{height:100%}
        .workViewport.isNative .workCanvas>.content{height:100%;min-height:100%;padding-bottom:4px}
        .workViewport.isNative.statusFitsViewport{overflow-y:hidden}
        .workViewport.isNative .statusScreen{height:100%;min-height:0;overflow:hidden;display:grid;grid-template-rows:minmax(0,1fr) auto auto;gap:6px}
        .statusScreen .hero{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);padding:10px 12px 9px}
        .statusScreen .heroHead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px}
        .heroStatus{min-width:0;padding-top:1px}.heroStatus h1{margin:0 0 4px;font-size:25px;line-height:1;letter-spacing:-.045em}.heroStatus p{margin:0;font-size:12px;line-height:1.2}
        .connectionWrap{display:flex;flex-direction:column;align-items:stretch;gap:5px;min-width:146px}.systemConnection{min-width:146px;padding:6px 9px;border-radius:14px}.systemConnectionMain{gap:7px}.systemConnectionMain i{width:9px;height:9px}.systemConnectionMain b{font-size:16px}.systemConnection .freshness{margin-left:16px;font-size:13px!important}.heroPressure{width:100%;margin:0;padding:4px 7px;border-radius:11px;justify-content:space-between}.heroPressure span{font-size:12px}.heroPressure b{font-size:14px}
        .statusScreen .systemDiagram{height:auto;min-height:0;aspect-ratio:auto;margin-top:6px;border-radius:19px}
        .controller{left:1%;top:2%;width:28%;height:22%}.rainSensor{left:44%;top:2%;width:52%;height:22%;padding:0;border:0;background:transparent url("${APPROVED_VISUALS.rain}") left center/auto 52% no-repeat;color:var(--muted);text-align:left}.rainSensor .rainSensorText{position:absolute;left:30%;top:50%;display:grid;gap:3px;transform:translateY(-50%);white-space:nowrap}.rainSensor .rainSensorText b{font-size:12px;font-weight:750;line-height:1.05}.rainSensor .rainSensorText small{font-size:12px!important;font-weight:650;line-height:1.05;color:var(--muted)}.rainSensor.armed .rainSensorText small{color:var(--a)}.rainSensor.bypass .rainSensorText small{color:var(--green)}
        .controlBus{top:28%;left:8.33%;right:8.33%}.controlBus span{display:none!important}.manifoldRail{top:47%}.supplyLine{top:calc(47% + 7px)}
        .schemaGrid{top:27%;bottom:1.5%;gap:5px}.schemaColumn{grid-template-rows:24px 30% 7% minmax(0,1fr)}.schemaColumn::before{top:10px;height:28px}.valveNumber{width:23px;height:23px;font-size:12px}.valvePhoto{width:112%;background-size:contain}.waterBranch{height:100%}
        .schemaGrid .diagramZone{position:relative;display:grid!important;grid-template-columns:1fr;grid-template-rows:40px auto auto;align-content:start;gap:3px;height:100%;min-height:0;padding:4px 4px 5px;border-radius:10px;overflow:hidden;text-align:left}.schemaGrid .diagramZone .scene{display:block!important;width:100%;height:40px;min-height:0;border-radius:7px}.schemaGrid .diagramZone .zoneText{display:block!important;min-width:0;line-height:1.05}.schemaGrid .diagramZone .zoneText b{display:block;font-size:12px;line-height:1.05;white-space:nowrap}.schemaGrid .diagramZone .zoneText small{display:block;margin-top:2px;font-size:12px!important;line-height:1.05;white-space:normal;overflow:visible}.schemaGrid .diagramZone .duration{display:flex!important;align-items:baseline;gap:3px;margin-top:1px;color:var(--text);text-align:left}.schemaGrid .diagramZone .duration b{font-size:16px;font-weight:850;line-height:1}.schemaGrid .diagramZone .duration small{display:inline!important;font-size:12px!important;color:var(--muted)}.schemaGrid .diagramZone .readyIcon{display:block!important;position:absolute;right:3px;top:4px;--mdc-icon-size:14px;color:var(--green);filter:drop-shadow(0 1px 2px #fff)}.schemaGrid .diagramZone.running .readyIcon{color:var(--a)}.schemaGrid .diagramZone.queued .readyIcon{color:var(--orange)}.schemaGrid .diagramZone.off .readyIcon,.schemaGrid .diagramZone.unknown .readyIcon{color:var(--muted)}
        .statusScreen .metrics{margin-top:0;gap:5px}.statusScreen .metric{min-height:86px;padding:8px 7px;border-radius:16px}.statusScreen .metric>small{font-size:12px!important;line-height:1.05;min-height:25px}.statusScreen .metric>div{grid-template-columns:31px minmax(0,1fr);gap:6px}.statusScreen .metric>div>ha-icon{--mdc-icon-size:29px}.statusScreen .metric b{font-size:17px}.statusScreen .metric em{font-size:12px!important;line-height:1.05}
        .statusScreen .quickActions{margin-top:0}.statusScreen .quickActions .modeGrid{gap:5px}.statusScreen .quickActions .mode{min-height:88px;padding:6px;border-radius:16px}.statusScreen .quickActions .mode ha-icon{--mdc-icon-size:29px}.statusScreen .quickActions .mode b{font-size:14px}.statusScreen .quickActions .mode small{font-size:12px!important}
        @media(max-width:520px){
          .statusScreen .hero{padding:8px 10px 7px}.statusScreen .heroHead{gap:6px}.heroStatus h1{font-size:24px}.heroStatus p{font-size:12px}.connectionWrap{min-width:144px}.systemConnection{min-width:144px;padding:5px 8px}.heroPressure{padding:3px 6px}
          .statusScreen .systemDiagram{height:auto;min-height:0;margin-top:5px}.controller{left:.5%;top:2%;width:28.5%;height:22%}.rainSensor{left:43%;top:2%;width:54%;height:22%;background-size:auto 50%}.rainSensor .rainSensorText{left:29%}
          .controlBus{top:28%}.manifoldRail{top:47%;height:18px}.supplyLine{top:calc(47% + 6px);height:5px}.schemaGrid{top:27%;bottom:1%;gap:4px}.schemaColumn{grid-template-rows:23px 29% 7% minmax(0,1fr)}.schemaColumn::before{top:10px;height:27px}.valvePhoto{width:116%}
          .schemaGrid .diagramZone{grid-template-rows:37px auto auto;gap:2px;padding:3px 3px 4px;border-radius:9px}.schemaGrid .diagramZone .scene{height:37px;border-radius:6px}.schemaGrid .diagramZone .zoneText b,.schemaGrid .diagramZone .zoneText small{font-size:12px!important}.schemaGrid .diagramZone .duration b{font-size:15px}.schemaGrid .diagramZone .duration small{font-size:12px!important}.schemaGrid .diagramZone .readyIcon{right:2px;top:3px;--mdc-icon-size:13px}
          .statusScreen .metric{min-height:82px;padding:7px 6px}.statusScreen .metric>small{min-height:24px}.statusScreen .metric>div{grid-template-columns:28px minmax(0,1fr);gap:5px}.statusScreen .metric>div>ha-icon{--mdc-icon-size:27px}.statusScreen .metric b{font-size:16px}.statusScreen .quickActions .mode{min-height:84px;padding:5px}.statusScreen .quickActions .mode ha-icon{--mdc-icon-size:27px}
        }

        /* v0.6.17 smooth pinch */
        .workCanvas{will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform-origin:0 0}
        .rainSensor.blocked .rainSensorText small{color:var(--orange)}.rainSensor.clear .rainSensorText small{color:var(--green)}
        /* v0.6.18 approved rain card under pressure; no rain wire in schematic. */
        .rainStatusCard{position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) 22px;align-items:center;gap:7px;width:100%;min-height:62px;padding:6px 8px;border:1px solid color-mix(in srgb,var(--muted) 24%,transparent);border-radius:14px;background:var(--card);text-align:left;box-shadow:none}
        .rainStatusCard.clear{background:color-mix(in srgb,var(--green) 8%,var(--card));border-color:color-mix(in srgb,var(--green) 24%,transparent)}.rainStatusCard.blocked{background:color-mix(in srgb,var(--orange) 8%,var(--card));border-color:color-mix(in srgb,var(--orange) 35%,transparent)}
        .rainStatusPhoto{display:block;width:30px;height:48px;background:transparent url("${APPROVED_VISUALS.rain}") center/contain no-repeat}.rainStatusText{display:grid;gap:1px;min-width:0}.rainStatusText b{font-size:11px;line-height:1.05;color:var(--muted)}.rainStatusText strong{font-size:13px;line-height:1.05;color:var(--green);white-space:nowrap}.rainStatusText small{font-size:11px!important;line-height:1.05;color:var(--muted);white-space:nowrap}.rainStatusCard.blocked .rainStatusText strong,.rainStatusCard.blocked>ha-icon{color:var(--orange)}.rainStatusCard.clear>ha-icon{color:var(--green)}.rainStatusCard.unknown .rainStatusText strong,.rainStatusCard.unknown>ha-icon{color:var(--muted)}.rainStatusCard>ha-icon{--mdc-icon-size:20px}
        .statusScreen .systemDiagram{margin-top:5px}.controller{top:3%;height:24%}.controlBus{top:31%}.schemaGrid{top:30%}.manifoldRail{top:48%}.supplyLine{top:calc(48% + 7px)}
        .schemaGrid .diagramZone .zoneText small{color:var(--green)!important;font-weight:700}.schemaGrid .diagramZone.running .zoneText small{color:var(--a)!important}.schemaGrid .diagramZone.queued .zoneText small{color:var(--orange)!important}.schemaGrid .diagramZone.off .zoneText small,.schemaGrid .diagramZone.unknown .zoneText small{color:var(--muted)!important}
        .schemaGrid .diagramZone .duration{display:grid!important;gap:2px;align-content:start}.schemaGrid .diagramZone .duration>span{display:flex;align-items:baseline;gap:3px}.schemaGrid .diagramZone .duration em{display:block;font-size:9px;font-style:normal;font-weight:500;line-height:1;color:var(--muted);white-space:nowrap}
        @media(max-width:520px){.rainStatusCard{grid-template-columns:30px minmax(0,1fr) 20px;min-height:58px;padding:5px 7px;gap:6px}.rainStatusPhoto{width:27px;height:44px}.rainStatusText b{font-size:10px}.rainStatusText strong{font-size:12px}.rainStatusText small{font-size:10px!important}.statusScreen .systemDiagram{margin-top:4px}.controller{top:3%;height:24%}.controlBus{top:31%}.schemaGrid{top:30%}.manifoldRail{top:48%}.supplyLine{top:calc(48% + 6px)}.schemaGrid .diagramZone .duration em{font-size:8px}}
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
        this._returnRoute = resolveReturnRoute(this);
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

const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");

const p = Panel.prototype;
const baseStyles = p.styles;

p.header = function headerV0624() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${NIKAS_HO_SC_8W_UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

const renderBeforeVersionSync = p._render;
p._render = function renderV0624() {
  renderBeforeVersionSync.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  const expected = `UI v${NIKAS_HO_SC_8W_UI_VERSION}`;
  if (versionNode && versionNode.textContent !== expected) versionNode.textContent = expected;
};

p.connectionIndicator = function connectionIndicatorV0619(e) {
  const value = this.state(e.connection);
  const attrs = this.attrs(e.connection);
  const exists = Boolean(e.connection && this.states()[e.connection]);
  const stale = attrs.online === false || Number(attrs.fail_count || 0) > 0;
  let label = "Нет данных";
  let tone = "unknown";
  let freshness = "Нет данных";
  let freshnessTone = "nodata";
  if (exists && value === "local") {
    label = "Локально"; tone = "ok";
    freshness = stale ? "Данные устарели" : "Данные актуальны";
    freshnessTone = stale ? "stale" : "current";
  } else if (exists && value === "cloud") {
    label = "Облако"; tone = "ok";
    freshness = stale ? "Данные устарели" : "Данные актуальны";
    freshnessTone = stale ? "stale" : "current";
  } else if (exists && value === "reserve") {
    label = "Резерв"; tone = "reserve";
    freshness = stale ? "Данные устарели" : "Данные актуальны";
    freshnessTone = stale ? "stale" : "current";
  } else if (exists && value === "unavailable") {
    label = "Нет связи"; tone = "offline";
  }
  const entity = e.connection ? ` data-entity="${this.esc(e.connection)}"` : "";
  return `<div class="connectionWrap connectionOnly"><button class="systemConnection ${tone}" data-connection-indicator${entity} aria-label="${this.esc(`${label}. ${freshness}`)}"><span class="systemConnectionMain"><i></i><b>${label}</b></span><small class="freshness ${freshnessTone}">${freshness}</small></button></div>`;
};

p._zoneIndicators = function zoneIndicatorsV0625(z) {
  const configured = this.state(z.q.schedule) === "configured";
  const rain = z.attrs.rain_sensor_follow;
  const readyIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline" : z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";
  const readyClass = z.tone === "unknown" || z.tone === "off" ? "off" : "on";
  const programClass = configured ? "on" : "off";
  const rainClass = rain === true ? "on" : rain === false ? "off" : "unknown";
  const rainIcon = rain === true ? "mdi:umbrella" : rain === false ? "mdi:umbrella-outline" : "mdi:help-circle-outline";
  const rainTitle = rain === true ? "Датчик дождя учитывается" : rain === false ? "Датчик дождя не учитывается" : "Нет данных об учёте датчика дождя";
  return `<span class="zoneIndicators" aria-label="Готовность, участие в программе, учёт датчика дождя">
    <ha-icon class="${readyClass}" icon="${readyIcon}" title="Готовность зоны"></ha-icon>
    <ha-icon class="${programClass}" icon="mdi:calendar-check" title="Участие в программе"></ha-icon>
    <ha-icon class="${rainClass}" icon="${rainIcon}" title="${rainTitle}"></ha-icon>
  </span>`;
};

p.irrigationDiagram = function irrigationDiagramV0623(e) {
  const active = this.zoneSet(this.state(e.active));
  const queued = this.zoneSet(this.state(e.queued));
  const columns = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const branchTone = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "idle";
    return `<div class="schemaColumn" data-axis="${zone}">
      <span class="valveNumber">${zone}</span>
      <span class="zoneLink ${branchTone}" aria-hidden="true"></span>
      <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">
        <span class="scene scene${zone}" aria-hidden="true"></span>
        <span class="zoneText"><b>Зона ${zone}</b></span>
        <span class="duration"><span><b>${this.esc(z.duration)}</b><small>мин</small></span></span>
        ${this._zoneIndicators(z)}
      </button>
    </div>`;
  }).join("");
  return `<div class="systemDiagram approvedDiagram simplifiedDiagram">
    <button class="controller" data-entity="${this.esc(e.connection)}" aria-label="Контроллер HO-SC-8W"></button>
    <div class="controllerDrop" aria-hidden="true"></div>
    <div class="controlBus" aria-hidden="true"></div>
    <div class="schemaGrid">${columns}</div>
  </div>`;
};

p.infrastructureRow = function infrastructureRowV0619(e) {
  const pressure = this.pressurePresentation(e);
  const rain = this.rainPresentation(e);
  const pressureEntity = e.pressure ? ` data-entity="${this.esc(e.pressure)}"` : "";
  const rainEntity = e.rain ? ` data-entity="${this.esc(e.rain)}"` : "";
  return `<div class="infraRow">
    <button class="heroPressure"${pressureEntity}><ha-icon icon="mdi:gauge"></ha-icon><span>Давление полива</span><b class="${pressure.tone}">${this.esc(pressure.value)}</b></button>
    <button class="rainStatusCard ${rain.tone}"${rainEntity}><span class="rainStatusPhoto" aria-hidden="true"></span><span class="rainStatusText"><b>Датчик дождя</b><strong>${this.esc(rain.label)}</strong><small>${this.esc(rain.detail)}</small></span><ha-icon icon="${rain.icon}"></ha-icon></button>
  </div>`;
};

p.hero = function heroV0619(e) {
  const status = this.systemStatus(e);
  return `<section class="hero ${status.tone}"><div class="heroHead"><div class="heroStatus"><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>${this.connectionIndicator(e)}</div>${this.irrigationDiagram(e)}${this.infrastructureRow(e)}</section>`;
};

p.zonesView = function zonesViewV0623(e) {
  if (this._drillZone) return this.zoneDetail(e, this._drillZone);
  const cards = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const startTimes = z.starts.length
      ? `<span class="zoneCardTimes">${this.esc(z.start)}</span>`
      : `<span class="zoneCardTimes muted">Нет запусков</span>`;
    return `<button class="zoneCard ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span class="scene scene${zone}" aria-hidden="true"></span><span class="zoneCardText"><small>ЗОНА ${zone}</small><b>${this.esc(z.label)}</b><em>${this.esc(z.duration)} мин</em>${startTimes}</span>${this._zoneIndicators(z)}<ha-icon class="zoneChevron" icon="mdi:chevron-right"></ha-icon></button>`;
  }).join("");
  return `<div class="pageIntro"><small>ЗОНЫ 1–6</small><h2>Рабочие зоны</h2><p>Фактическое состояние и программа каждого канала.</p></div><div class="zoneCards">${cards}</div>`;
};

p.zoneDetail = function zoneDetailV0625(e, zone) {
  const z = this.zoneRuntime(e, zone);
  const a = z.attrs;
  const configured = this.state(z.q.schedule) === "configured";
  const rainLabel = a.rain_sensor_follow === true ? "Учитывается" : a.rain_sensor_follow === false ? "Не учитывается" : "Нет данных";
  const rainIcon = a.rain_sensor_follow === true ? "mdi:umbrella" : a.rain_sensor_follow === false ? "mdi:umbrella-outline" : "mdi:help-circle-outline";
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button><section class="detailCard"><div class="detailHead"><span class="scene scene${zone}" aria-hidden="true"></span><div><small>ЗОНА ${zone}</small><h2>${this.esc(z.label)}</h2></div></div><div class="detailGrid"><div><small>Длительность</small><b>${this.esc(z.duration)} мин</b></div><div class="detailStarts"><small>Время запуска</small>${this.startChips(z.starts, "detailStartTimes")}</div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Датчик дождя</small><b>${rainLabel}</b></div></div><div class="detailStateList"><div><ha-icon class="${z.tone === "unknown" || z.tone === "off" ? "off" : "on"}" icon="mdi:check-circle"></ha-icon><span><small>Состояние зоны</small><b>${this.esc(z.label)}</b></span></div><div><ha-icon class="${configured ? "on" : "off"}" icon="mdi:calendar-check"></ha-icon><span><small>Автоматическая программа</small><b>${configured ? "Участвует" : "Не участвует"}</b></span></div><div><ha-icon class="${a.rain_sensor_follow === true ? "on" : a.rain_sensor_follow === false ? "off" : "unknown"}" icon="${rainIcon}"></ha-icon><span><small>Контроль датчика дождя</small><b>${rainLabel}</b></span></div></div><p class="detailNote">Параметры программы доступны только для просмотра.</p></section>`;
};

p._bindWorkspaceGestures = function bindWorkspaceGesturesV0619() {
  const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
  if (!viewport || viewport.dataset.zoomV0619 === "1") return;
  viewport.dataset.zoomV0619 = "1";
  let nativeTouchY = null;
  const point = (event) => {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const distance = (a, b) => Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
  const startPinch = () => {
    const points = [...this._gesturePointers.values()];
    if (points.length < 2) return;
    const mid = midpoint(points[0], points[1]);
    if (this._viewTransform.scale <= 1 && viewport.scrollTop) {
      this._viewTransform = { scale: 1, x: 0, y: -viewport.scrollTop };
      viewport.scrollTop = 0;
      this._applyTransform();
    }
    this._gestureStart = { type: "pinch", lastDistance: distance(points[0], points[1]), lastMid: mid };
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const current = point(event);
    this._gesturePointers.set(event.pointerId, current);
    if (this._gesturePointers.size === 1) {
      this._gestureMoved = false;
      this._hadMultiTouch = false;
      if (this._viewTransform.scale > 1) {
        try { viewport.setPointerCapture(event.pointerId); } catch (_error) {}
        this._gestureStart = { type: "pan", point: current, x: this._viewTransform.x, y: this._viewTransform.y };
      } else {
        this._gestureStart = { type: "native", point: current };
      }
    } else if (this._gesturePointers.size === 2) {
      for (const id of this._gesturePointers.keys()) {
        try { viewport.setPointerCapture(id); } catch (_error) {}
      }
      this._hadMultiTouch = true;
      this._suppressClicksUntil = Date.now() + 500;
      this._cancelLongPresses();
      startPinch();
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!this._gesturePointers.has(event.pointerId)) return;
    const current = point(event);
    this._gesturePointers.set(event.pointerId, current);
    if (this._gesturePointers.size >= 2) {
      event.preventDefault();
      const points = [...this._gesturePointers.values()];
      if (this._gestureStart?.type !== "pinch") startPinch();
      const start = this._gestureStart;
      if (!start || start.type !== "pinch") return;
      const mid = midpoint(points[0], points[1]);
      const d = distance(points[0], points[1]);
      const rawRatio = d / Math.max(8, start.lastDistance);
      const ratio = Math.min(1.045, Math.max(0.955, rawRatio));
      const old = this._viewTransform;
      const nextScale = this._clampScale(old.scale * ratio);
      const contentX = (start.lastMid.x - old.x) / old.scale;
      const contentY = (start.lastMid.y - old.y) / old.scale;
      const next = { scale: nextScale, x: mid.x - contentX * nextScale, y: mid.y - contentY * nextScale };
      if (Math.abs(nextScale - old.scale) > 0.002 || Math.hypot(mid.x - start.lastMid.x, mid.y - start.lastMid.y) > 2) this._gestureMoved = true;
      start.lastDistance = d;
      start.lastMid = mid;
      this._scheduleGestureTransform(next);
      this._cancelLongPresses();
      return;
    }
    const start = this._gestureStart;
    if (start?.type === "native") {
      const deltaY = current.y - start.point.y;
      const atTop = viewport.scrollTop <= 0;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;
      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        event.preventDefault();
        return;
      }
      if (Math.hypot(current.x - start.point.x, deltaY) > 4) { this._gestureMoved = true; this._cancelLongPresses(); }
      return;
    }
    if (!start || start.type !== "pan" || this._viewTransform.scale <= 1) return;
    const dx = current.x - start.point.x;
    const dy = current.y - start.point.y;
    if (Math.hypot(dx, dy) > 4) { this._gestureMoved = true; this._cancelLongPresses(); }
    if (!this._gestureMoved) return;
    event.preventDefault();
    this._scheduleGestureTransform({ ...this._viewTransform, x: start.x + dx, y: start.y + dy });
  }, { passive: false });

  const finishPointer = (event) => {
    if (this._pendingTransform) { this._viewTransform = this._pendingTransform; this._pendingTransform = null; }
    if (this._transformFrame) { cancelAnimationFrame(this._transformFrame); this._transformFrame = 0; }
    if (!this._gesturePointers.has(event.pointerId)) return;
    this._gesturePointers.delete(event.pointerId);
    try { viewport.releasePointerCapture(event.pointerId); } catch (_error) {}
    if (this._gesturePointers.size === 1) {
      const remaining = [...this._gesturePointers.values()][0];
      this._gestureStart = this._viewTransform.scale > 1 ? { type: "pan", point: remaining, x: this._viewTransform.x, y: this._viewTransform.y } : { type: "native", point: remaining };
      return;
    }
    if (this._gesturePointers.size) return;
    const now = Date.now();
    if (this._hadMultiTouch && !this._gestureMoved) {
      if (now - this._twoFingerTapAt < 450) { this._twoFingerTapAt = 0; this._resetTransform(true); }
      else this._twoFingerTapAt = now;
    } else if (this._hadMultiTouch && this._viewTransform.scale >= 0.97 && this._viewTransform.scale <= 1.03) {
      this._viewTransform = { scale: 1, x: 0, y: 0 };
      this._clampAndApplyTransform(true);
      this._showScaleToast("Масштаб 100%");
    } else {
      this._clampAndApplyTransform(true);
    }
    if (this._gestureMoved) this._suppressClicksUntil = now + 350;
    this._gestureStart = null;
    this._gestureMoved = false;
    this._hadMultiTouch = false;
    if (this._renderDeferred) { this._renderDeferred = false; this._queueRender(); }
  };
  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);
  viewport.addEventListener("touchstart", (event) => {
    nativeTouchY = event.touches.length === 1 && this._viewTransform.scale <= 1
      ? event.touches[0].clientY
      : null;
  }, { passive: true });
  viewport.addEventListener("touchmove", (event) => {
    if (nativeTouchY === null || event.touches.length !== 1 || this._viewTransform.scale > 1) return;
    const deltaY = event.touches[0].clientY - nativeTouchY;
    const atTop = viewport.scrollTop <= 0;
    const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;
    if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) event.preventDefault();
  }, { passive: false });
  const clearNativeTouch = () => { nativeTouchY = null; };
  viewport.addEventListener("touchend", clearNativeTouch, { passive: true });
  viewport.addEventListener("touchcancel", clearNativeTouch, { passive: true });
  viewport.addEventListener("click", (event) => {
    if (Date.now() < this._suppressClicksUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  viewport.addEventListener("scroll", () => {
    if (this._viewTransform.scale <= 1) this._nativeScrollPositions.set(this._transformStorageKey(), viewport.scrollTop);
  }, { passive: true });
  viewport.addEventListener("wheel", (event) => {
    if (this._viewTransform.scale <= 1) return;
    event.preventDefault();
    this._viewTransform = { ...this._viewTransform, x: this._viewTransform.x - event.deltaX, y: this._viewTransform.y - event.deltaY };
    this._clampAndApplyTransform(false);
    clearTimeout(this._wheelSaveTimer);
    this._wheelSaveTimer = setTimeout(() => this._saveTransform(), 180);
  }, { passive: false });
};

p.styles = function stylesV0628() {
  return `${baseStyles.call(this)}
    /* UI v0.6.30: canonical Autowatering identity and viewport-locked chrome */
    .app{width:min(100%,1280px);max-width:1280px}
    .bottomNavInner{max-width:1280px}
    .heroHead{align-items:flex-start}.connectionOnly{display:block}.connectionOnly .systemConnection{min-width:170px}
    .approvedDiagram{margin-top:0}.approvedDiagram .controller{left:37.5%!important;top:1%!important;width:25%!important;height:25%!important;transform:none!important}
    .approvedDiagram .controllerDrop{position:absolute;z-index:1;left:50%;top:23%;height:9%;border-left:2px solid #6f7d88;transform:translateX(-50%)}
    .approvedDiagram .controlBus{top:31%!important}
    .approvedDiagram .schemaGrid{top:28%!important;bottom:3%!important}
    .simplifiedDiagram .manifoldRail,.simplifiedDiagram .supplyLine,.simplifiedDiagram .valvePhoto,.simplifiedDiagram .waterBranch{display:none!important}
    .simplifiedDiagram .schemaColumn{grid-template-rows:28px 15% minmax(0,1fr)!important}.simplifiedDiagram .schemaColumn::before{display:none!important}.zoneLink{display:block;justify-self:center;width:4px;height:100%;border-radius:4px;background:#a8b2ba}.zoneLink.idle{background:#a8b2ba}.zoneLink.run{background:var(--a);box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 18%,transparent)}.zoneLink.queue{background:var(--orange)}
    .diagramZone{overflow:hidden}.schemaGrid .diagramZone{grid-template-rows:minmax(48px,1fr) auto auto auto!important;gap:4px!important;padding:6px 5px 7px!important}
    .schemaGrid .scene{height:100%!important;min-height:48px}.schemaGrid .zoneText small,.schemaGrid .duration em,.schemaGrid .readyIcon{display:none!important}
    .zoneIndicators{display:grid;grid-template-columns:repeat(3,minmax(15px,1fr));align-items:center;justify-items:center;gap:3px;width:100%;min-width:0;margin-top:1px;overflow:visible}.zoneIndicators ha-icon{display:block;min-width:15px;--mdc-icon-size:15px;color:#08a52b}.zoneIndicators ha-icon.off{color:#9aa1a8}.zoneIndicators ha-icon.unknown{color:#9aa1a8}
    .scene1,.scene2,.scene3{background-image:url('/nikas-ho-sc-8w/assets/zone-lawn-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}')!important}.scene4{background-image:url('/nikas-ho-sc-8w/assets/zone-flowers-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}')!important}.scene5{background-image:url('/nikas-ho-sc-8w/assets/zone-shrubs-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}')!important}.scene6{background-image:url('/nikas-ho-sc-8w/assets/zone-greenhouse-v2.webp?v=${NIKAS_HO_SC_8W_UI_VERSION}')!important}.scene>ha-icon{display:none!important}
    .zoneCard .scene,.detailHead .scene{background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important;background-color:color-mix(in srgb,var(--card) 92%,var(--text) 8%)}
    .infraRow{display:grid;grid-template-columns:.9fr 1.35fr;gap:8px;margin-top:8px}.infraRow .heroPressure,.infraRow .rainStatusCard{position:relative;inset:auto;width:100%;min-height:64px;margin:0}.infraRow .heroPressure{display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;text-align:left;padding:8px 10px}.infraRow .heroPressure>ha-icon{grid-row:1/3;--mdc-icon-size:29px;color:var(--a)}.infraRow .heroPressure span{font-size:12px}.infraRow .heroPressure b{font-size:19px}.infraRow .rainStatusCard{display:grid;grid-template-columns:42px minmax(0,1fr) 24px;align-items:center;padding:7px 9px}.infraRow .rainStatusPhoto{width:38px;height:44px}.infraRow .rainStatusText b,.infraRow .rainStatusText strong,.infraRow .rainStatusText small{display:block}.infraRow .rainStatusText b,.infraRow .rainStatusText small{font-size:12px!important}.infraRow .rainStatusText strong{font-size:14px}.infraRow .rainStatusCard>ha-icon{--mdc-icon-size:24px}
    .zoneCards{padding-bottom:64px}.zoneCard{grid-template-columns:70px minmax(0,1fr) auto 24px!important;gap:10px!important;min-height:96px!important}.zoneCard .scene{width:70px!important;height:70px!important}.zoneCard .zoneIndicators{width:auto;grid-template-columns:repeat(3,21px);gap:9px}.zoneCard .zoneIndicators ha-icon{min-width:21px;--mdc-icon-size:21px}.zoneCard .zoneChevron{--mdc-icon-size:22px}.zoneCardText{min-width:0}.zoneCardText em{display:block!important;margin-top:3px;color:var(--muted);font-size:12px!important;font-style:normal;line-height:1.2}.zoneCardTimes{display:block;margin-top:5px;color:var(--text);font-size:14px;font-weight:750;line-height:1.25;white-space:normal}.zoneCardTimes.muted{color:var(--muted);font-size:12px;font-weight:500}
    .programRow{grid-template-columns:minmax(72px,.55fr) minmax(0,1.45fr) 20px!important;min-height:72px!important;padding:9px 13px!important}.programZone b,.programZone small{display:block}.programZone b{font-size:14px}.programZone small{margin-top:3px;color:var(--muted)}.programTimes,.detailStartTimes{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px;min-width:0}.programTimes>span,.detailStartTimes>span{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:4px 8px;border-radius:9px;background:color-mix(in srgb,var(--a) 9%,var(--card));color:var(--text);font-size:12px;font-weight:750;white-space:nowrap}.detailStarts{min-width:0}.detailStartTimes{justify-content:flex-start;margin-top:7px}
    .headerTitle{appearance:none;justify-self:center;min-width:min(290px,100%);max-width:100%;min-height:44px;padding:5px 14px;border:1px solid color-mix(in srgb,var(--primary-color,#03a9d9) 24%,var(--divider-color,#dfe3e8));border-radius:16px;background:color-mix(in srgb,var(--primary-color,#03a9d9) 5%,var(--card-background-color,#fff));box-shadow:0 5px 16px rgba(23,45,76,.06);color:var(--text);cursor:pointer}.headerTitle strong{font-size:23px;font-weight:800;line-height:1.05;letter-spacing:.08em}.headerTitle small{margin-top:3px;font-size:14px;font-weight:560;line-height:1.2;letter-spacing:.01em}.headerTitle:focus-visible{outline:2px solid var(--primary-color,#03a9d9);outline-offset:2px}.headerTitle:active{background:color-mix(in srgb,var(--primary-color,#03a9d9) 13%,var(--card-background-color,#fff));border-color:color-mix(in srgb,var(--primary-color,#03a9d9) 42%,var(--divider-color,#dfe3e8));box-shadow:0 2px 7px rgba(23,45,76,.05);transform:scale(.985)}
    .summaryGrid>.programSeasonEditor{display:grid;gap:7px;padding:10px;border:0;border-radius:14px;background:var(--soft);text-align:left}.programSeasonEditor>small{display:block;color:var(--muted);font-size:12px}.programSeasonControls{display:grid;grid-template-columns:minmax(62px,.75fr) minmax(88px,1.25fr);align-items:center;gap:6px}.seasonalInput{display:grid;grid-template-columns:minmax(0,1fr) 20px;align-items:center;width:100%;min-height:38px;padding:0 7px;border:1px solid var(--line);border-radius:10px;background:var(--card)}.seasonalInput input{width:100%;min-width:0;padding:4px 0;border:0;outline:0;background:transparent;color:var(--text);font-family:inherit;font-size:16px;font-weight:800;line-height:1;text-align:right}.seasonalInput b{margin:0!important;color:var(--muted)!important;font-size:12px!important}.programSeasonControls>button{min-height:38px;padding:5px 8px;border:1px solid color-mix(in srgb,var(--a) 50%,var(--line));border-radius:10px;background:var(--accent-soft);color:var(--a);font-size:12px;font-weight:750;line-height:1;text-align:center}.programSeasonControls>button:disabled{opacity:.58}.seasonalInput:focus-within{border-color:var(--a);box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 17%,transparent)}
    .manualQueueCard{display:grid;gap:12px;padding:14px}.manualRuntime{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:10px;padding:12px;border-radius:16px;background:var(--soft)}.manualRuntime>ha-icon{--mdc-icon-size:32px;color:var(--muted)}.manualRuntime.running{background:var(--accent-soft)}.manualRuntime.running>ha-icon{color:var(--a)}.manualRuntime span{display:grid;gap:2px;min-width:0}.manualRuntime small,.manualRuntime b,.manualRuntime em{display:block}.manualRuntime b{font-size:15px}.manualRuntime em{color:var(--muted);font-style:normal}.manualZones{gap:7px}.manualZone{min-height:72px;padding:7px;border-color:var(--line);background:var(--soft)}.manualZone span{font-size:21px;line-height:1}.manualZone small{margin-top:5px;line-height:1.05;text-align:center}.manualQueueHead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:0 2px}.manualQueueHead span{font-size:14px;font-weight:800}.manualQueueHead b{color:var(--muted);font-size:12px}.manualQueueList{display:grid;gap:7px}.manualQueueRow{display:grid;grid-template-columns:28px minmax(80px,1fr) auto;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:15px;background:var(--card)}.queueOrder{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--accent-soft);color:var(--a);font-size:13px;font-weight:800}.queueZone{display:grid;gap:2px;min-width:0}.queueZone b{font-size:14px}.queueZone small{color:var(--muted);line-height:1.05}.queueDuration{display:grid;grid-template-columns:38px 72px 38px;align-items:center;gap:4px}.queueDuration>button{display:grid;place-items:center;width:38px;height:42px;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--soft);font-size:23px}.queueDuration label{display:grid;grid-template-columns:minmax(0,1fr) 25px;align-items:center;height:42px;padding:0 5px;border:1px solid var(--line);border-radius:12px;background:var(--card)}.queueDuration input{width:100%;min-width:0;padding:0;border:0;outline:0;background:transparent;color:var(--text);font-family:inherit;font-size:16px;font-weight:800;line-height:1;text-align:right}.queueDuration label span{color:var(--muted);font-size:12px}.queueDuration label:focus-within{border-color:var(--a);box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 17%,transparent)}.manualEmpty{display:flex;align-items:center;justify-content:center;gap:9px;min-height:72px;padding:12px;border:1px dashed var(--line);border-radius:15px;color:var(--muted);text-align:center}.manualEmpty ha-icon{--mdc-icon-size:25px}.manualStart{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;justify-content:center;gap:9px;min-height:58px;padding:8px 16px;border:0;border-radius:17px;background:linear-gradient(145deg,#079bd0,#087aec);color:#fff;text-align:left}.manualStart>ha-icon{--mdc-icon-size:30px}.manualStart span{display:grid;gap:2px}.manualStart b,.manualStart small{color:inherit}.manualStart b{font-size:16px}.manualStart:disabled{background:var(--soft);color:var(--muted)}.manualRunningActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.manualRunningActions>button,.resumeAuto.standalone{min-height:48px;padding:8px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft);font-weight:750}.manualRunningActions>button{display:flex;align-items:center;justify-content:center;gap:6px}.stopManual{border-color:color-mix(in srgb,var(--danger) 42%,var(--line))!important;color:var(--danger)}.resumeAuto{color:var(--a)}.resumeAuto.standalone{width:100%}.manualRunningActions>button:disabled,.resumeAuto:disabled{opacity:.58}.manualNote{margin:0!important;color:var(--muted);line-height:1.35}.manualQueueCard button:focus-visible,.programSeasonControls>button:focus-visible{outline:3px solid color-mix(in srgb,var(--a) 30%,transparent);outline-offset:2px}
    .detailCard{min-height:430px}.detailHead{display:grid;grid-template-columns:112px minmax(0,1fr)!important}.detailHead .scene{width:112px!important;height:96px!important}.detailHead h2{font-size:25px}.detailGrid{margin-top:20px}.detailGrid small,.detailGrid b{font-size:14px}.detailGrid b{margin-top:6px}.detailStateList{display:grid;gap:8px;margin-top:18px}.detailStateList>div{display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:10px;padding:11px 13px;border-radius:15px;background:var(--soft)}.detailStateList ha-icon{--mdc-icon-size:27px;color:var(--green)}.detailStateList ha-icon.off,.detailStateList ha-icon.unknown{color:var(--muted)}.detailStateList small,.detailStateList b{display:block;font-size:13px}.detailStateList b{margin-top:2px}.detailNote{margin:16px 2px 0!important;font-size:12px!important}
    @media(max-width:520px){
      .approvedDiagram{aspect-ratio:388/365!important;margin-top:0!important}.approvedDiagram .controller{left:35%!important;width:30%!important;height:27%!important}.approvedDiagram .controllerDrop{top:24%;height:8%}.approvedDiagram .controlBus{top:32%!important}.approvedDiagram .schemaGrid{top:29%!important;bottom:2%!important}.simplifiedDiagram .schemaColumn{grid-template-rows:26px 14% minmax(0,1fr)!important}.schemaGrid .diagramZone{min-height:142px!important}.schemaGrid .scene{min-height:66px!important}.schemaGrid .zoneIndicators ha-icon{--mdc-icon-size:14px}
      .infraRow{grid-template-columns:.95fr 1.25fr;gap:6px}.infraRow .heroPressure,.infraRow .rainStatusCard{min-height:62px}.infraRow .heroPressure{grid-template-columns:28px minmax(0,1fr);padding:7px}.infraRow .heroPressure>ha-icon{--mdc-icon-size:25px}.infraRow .heroPressure b{font-size:17px}.infraRow .rainStatusCard{grid-template-columns:34px minmax(0,1fr) 20px;padding:6px}.infraRow .rainStatusPhoto{width:31px;height:39px}.infraRow .rainStatusText strong{font-size:13px}.infraRow .rainStatusText b,.infraRow .rainStatusText small{font-size:12px!important}
      .zoneCards{padding-bottom:72px}.zoneCard{grid-template-columns:62px minmax(0,1fr) auto 20px!important;gap:8px!important;min-height:98px!important}.zoneCard .scene{width:62px!important;height:62px!important}.zoneCard .zoneIndicators{grid-template-columns:repeat(3,19px);gap:5px}.zoneCard .zoneIndicators ha-icon{min-width:19px;--mdc-icon-size:19px}.zoneCardTimes{font-size:14px}.programRow{grid-template-columns:68px minmax(0,1fr) 18px!important;min-height:76px!important;padding:9px 11px!important}.programTimes{gap:4px}.programTimes>span,.detailStartTimes>span{min-height:27px;padding:4px 7px}.programSeasonControls{grid-template-columns:minmax(58px,.7fr) minmax(84px,1.3fr);gap:5px}.programSeasonControls>button{padding-inline:5px}
      .detailCard{min-height:420px;padding:18px}.detailHead{grid-template-columns:104px minmax(0,1fr)!important}.detailHead .scene{width:104px!important;height:92px!important}.headerTitle{min-width:0;width:100%;padding-inline:8px}.headerTitle strong{font-size:21px}.headerTitle small{font-size:13px}.manualQueueCard{padding:12px 10px}.manualQueueRow{grid-template-columns:25px minmax(64px,1fr) auto;gap:6px;padding:7px 6px}.queueOrder{width:25px;height:25px}.queueDuration{grid-template-columns:34px 64px 34px;gap:3px}.queueDuration>button{width:34px;height:42px}.queueDuration label{grid-template-columns:minmax(0,1fr) 22px}.manualRuntime{padding:10px}.manualRunningActions{grid-template-columns:1fr}
    }
  `;
};

// Consolidated release layer: irrigation-panel-v0632.mjs
{
const UI_VERSION = "0.6.32";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p.header = function headerV0632() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.activeRuntime = function activeRuntimeV0632(e) {
  const active = [...this.zoneSet(this.state(e.active))].map(Number).filter((z) => z >= 1 && z <= 6).sort((a,b) => a-b);
  if (!active.length) return null;
  const zone = active[0];
  const remainingRaw = this.state(e.zones[zone]?.remaining);
  const remaining = Number(String(remainingRaw).replace(",", "."));
  return { zone, remaining: Number.isFinite(remaining) && remaining > 0 ? Math.round(remaining) : null };
};

p.systemStatus = function systemStatusV0632(e) {
  const connection = this.state(e.connection);
  const operation = this.state(e.operation);
  const activeValue = this.state(e.active);
  const timerError = this.state(e.timerError);
  if (this.bad(connection) || this.bad(activeValue)) return { tone: "unknown", title: "Состояние неизвестно", sub: "Нет достоверных данных контроллера" };
  if (timerError === "active" || timerError === "true") return { tone: "warning", title: "Требуется внимание", sub: "Контроллер сообщает об ошибке таймера" };
  const runtime = this.activeRuntime(e);
  if (runtime) {
    const manual = String(operation).toLowerCase() === "manual";
    return {
      tone: "active",
      title: `${manual ? "Ручной полив" : "Автополив"} · зона ${runtime.zone}`,
      sub: runtime.remaining ? `Осталось ${runtime.remaining} мин` : "Полив выполняется",
    };
  }
  if (operation === "OFF") return { tone: "off", title: "Система выключена", sub: "Контроллер находится в режиме OFF" };
  return { tone: "ready", title: "Система готова", sub: "Автополив работает штатно" };
};

p.zonesView = function zonesViewV0632(e) {
  if (this._drillZone) return this.zoneDetail(e, this._drillZone);
  const runtime = this.activeRuntime(e);
  const cards = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const isActive = runtime?.zone === zone;
    const runtimeLine = isActive
      ? `<span class="zoneLive">${runtime.remaining ? `Полив · осталось ${runtime.remaining} мин` : "Полив выполняется"}</span>`
      : "";
    const startTimes = z.starts.length
      ? `<span class="zoneCardTimes">${this.esc(z.start)}</span>`
      : `<span class="zoneCardTimes muted">Нет запусков</span>`;
    return `<button class="zoneCard ${z.tone} ${isActive ? "liveActive" : ""}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span class="scene scene${zone}" aria-hidden="true"></span><span class="zoneCardText"><small>ЗОНА ${zone}</small><b>${this.esc(z.label)}</b>${runtimeLine}<em>${this.esc(z.duration)} мин · по программе</em>${startTimes}</span>${this._zoneIndicators(z)}<ha-icon class="zoneChevron" icon="mdi:chevron-right"></ha-icon></button>`;
  }).join("");
  return `<div class="zonesScreen"><div class="zonesIntro">Фактическое состояние и программа каждого канала.</div><div class="zoneCards">${cards}</div></div>`;
};

p.currentMode = function currentModeV0632(e) {
  const operation = this.state(e.operation);
  const runtime = this.activeRuntime(e);
  const autoRunning = runtime && String(operation).toLowerCase() !== "manual";
  return `<section class="quickActions"><div class="modeGrid">
    <button class="mode ${operation === "Auto" ? "active" : ""}" data-entity="${this.esc(e.operation)}"><ha-icon icon="mdi:play"></ha-icon><b>${autoRunning ? "Полив идёт" : "Полив"}</b><small>${autoRunning ? `Зона ${runtime.zone}` : operation === "Auto" ? "Авто" : this.esc(this.human("operation", operation))}</small></button>
    <button class="mode disabled" disabled><ha-icon icon="mdi:pause-circle-outline"></ha-icon><b>Пауза</b><small>Недоступно</small></button>
    <button class="mode manualAction ${operation === "Manual" ? "active" : ""}" data-go="manual"><ha-icon icon="mdi:hand-back-right-outline"></ha-icon><b>Ручной</b><small>${operation === "Manual" ? "Активен" : "Настроить"}</small></button>
  </div></section>`;
};

p.stopManual = async function stopManualV0632() {
  if (this.rejectUnavailableCommand("stop_manual")) return;
  if (!window.confirm("Остановить весь ручной полив?")) return;
  this._manualBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "stop_manual", this.serviceTargetData());
    this.notify("Команда Stop All подтверждена контроллером");
    await this.refreshNow();
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить Stop All"));
  } finally {
    this._manualBusy = false;
    this.render();
  }
};

p._updateNavigationState = function updateNavigationStateV0632() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
  if (viewport) viewport.classList.toggle("zonesFitsViewport", this._view === "zones" && !this._drillZone);
};

p.styles = function stylesV0632() {
  return `${previousStyles.call(this)}
    /* UI v0.6.32: explicit live watering state and full-height Zones view. */
    .hero.active .heroStatus h1{color:var(--a)}
    .heroStatus h1{max-width:100%;text-wrap:balance}
    .schemaGrid .diagramZone.running{background:color-mix(in srgb,var(--a) 10%,#fff)!important;border-color:color-mix(in srgb,var(--a) 65%,#dce1e5)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 18%,transparent),0 5px 14px #078fe820!important}
    .zonesScreen{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px}
    .zonesIntro{padding:5px 5px 4px;color:var(--muted);font-size:15px;font-weight:650;line-height:1.25}
    .workViewport.isNative.zonesFitsViewport{overflow-y:hidden}
    .workViewport.isNative.zonesFitsViewport .workCanvas{height:100%}
    .workViewport.isNative.zonesFitsViewport .workCanvas>.content{height:100%;min-height:100%;padding-bottom:4px}
    .zonesScreen .zoneCards{min-height:0;height:100%;display:grid;grid-template-rows:repeat(6,minmax(0,1fr));gap:8px;padding-bottom:0}
    .zonesScreen .zoneCard{height:100%;min-height:0!important;padding:8px 12px!important}
    .zonesScreen .zoneCard.liveActive{background:color-mix(in srgb,var(--a) 11%,var(--card));border-color:color-mix(in srgb,var(--a) 68%,var(--line));box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 15%,transparent),0 7px 20px #078fe818}
    .zonesScreen .zoneCard.liveActive .scene{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--a) 45%,transparent)}
    .zonesScreen .zoneCard.liveActive .zoneCardText>b{color:var(--a)}
    .zoneLive{display:block;margin-top:3px;color:var(--a);font-size:13px;font-weight:800;line-height:1.1}
    .zonesScreen .zoneCardText>small{font-size:12px!important}.zonesScreen .zoneCardText>b{font-size:17px}.zonesScreen .zoneCardText em{margin-top:2px!important}.zonesScreen .zoneCardTimes{margin-top:3px}
    @media(max-width:520px){
      .heroStatus h1{font-size:clamp(20px,5.8vw,24px);line-height:1.02}
      .zonesIntro{font-size:15px;padding:4px 4px 3px}
      .zonesScreen{gap:6px}.zonesScreen .zoneCards{gap:6px}
      .zonesScreen .zoneCard{grid-template-columns:66px minmax(0,1fr) auto 20px!important;gap:8px!important;padding:6px 10px!important}
      .zonesScreen .zoneCard .scene{width:66px!important;height:min(72px,100%)!important;min-height:54px}
      .zonesScreen .zoneCardText>b{font-size:17px}.zoneLive{font-size:13px}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0633.mjs
{
const UI_VERSION = "0.6.33";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;
const previousToggleManualZone = p.toggleManualZone;

p.header = function headerV0633() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.toggleManualZone = function toggleManualZoneV0633(zone) {
  const runtime = this.activeRuntime(this.entities());
  if (runtime?.zone === Number(zone)) {
    this.stopManual();
    return;
  }
  previousToggleManualZone.call(this, Number(zone));
};

p.manualView = function manualViewV0633(e) {
  const runtime = this.activeRuntime(e);
  const selected = new Set(this._manualQueue || []);
  const watering = Boolean(runtime);
  const cards = Array.from({ length: 6 }, (_, index) => index + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const active = runtime?.zone === zone;
    const enabled = selected.has(zone) || active;
    const duration = Number(this._manualDurations?.[zone] || z.duration || 10);
    const scene = `scene scene${zone}`;
    const timeDisabled = !enabled || watering;
    const switchDisabled = watering && !active;
    return `<article class="manualZoneCard ${enabled ? "selected" : ""} ${active ? "running" : ""}" data-manual-zone-card="${zone}">
      <span class="${scene}" aria-hidden="true"></span>
      <span class="manualZoneIdentity"><small>ЗОНА ${zone}</small><b>${active ? "Полив" : "Готова"}</b></span>
      <span class="manualDuration" aria-label="Длительность зоны ${zone}">
        <button type="button" class="manualTimeButton" data-queue-step="-1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Уменьшить время зоны ${zone}">−</button>
        <strong>${duration}<small>мин</small></strong>
        <button type="button" class="manualTimeButton" data-queue-step="1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Увеличить время зоны ${zone}">+</button>
      </span>
      <button type="button" class="manualZoneSwitch ${enabled ? "on" : ""}" data-queue-toggle="${zone}" role="switch" aria-checked="${enabled}" ${switchDisabled ? "disabled" : ""} aria-label="${active ? "Остановить" : enabled ? "Исключить" : "Включить"} зону ${zone}"><span></span></button>
    </article>`;
  }).join("");
  const total = [...selected].reduce((sum, zone) => sum + Number(this._manualDurations?.[zone] || 0), 0);
  const startDisabled = selected.size === 0 || this._manualBusy || watering || !this.commandAvailable("start_manual_queue");
  return `<section class="manualApprovedScreen">
    <div class="manualApprovedIntro">
      <div><small>РУЧНОЙ РЕЖИМ</small><h1>Управление зонами</h1><p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p></div>
      <button type="button" class="manualStartTop" data-manual-start ${startDisabled ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>${watering ? "Полив" : "Старт"}</span><small>${watering ? `зона ${runtime.zone}` : total ? `${total} мин` : ""}</small></button>
    </div>
    <div class="manualZoneCards">${cards}</div>
  </section>`;
};

p._updateNavigationState = function updateNavigationStateV0633() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
  if (viewport) viewport.classList.toggle("manualFitsViewport", this._view === "manual");
};

p.styles = function stylesV0633() {
  return `${previousStyles.call(this)}
    /* UI v0.6.33 — approved manual zone-card layout, NikaS v1.9 shell. */
    .manualApprovedScreen{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px}
    .manualApprovedIntro{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:10px;padding:2px 4px 4px}
    .manualApprovedIntro>div>small{display:block;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.12em;margin-bottom:4px}
    .manualApprovedIntro h1{margin:0;font-size:24px;line-height:1.05}
    .manualApprovedIntro p{margin:6px 0 0;color:var(--muted);font-size:14px;line-height:1.28}
    .manualStartTop{min-width:118px;height:58px;border:0;border-radius:18px;background:linear-gradient(135deg,#119de7,#087ee6);color:#fff;display:grid;grid-template-columns:28px auto;grid-template-rows:1fr auto;align-items:center;justify-content:center;column-gap:6px;padding:8px 14px;font:inherit;font-weight:800;box-shadow:0 8px 20px #078fe826}
    .manualStartTop ha-icon{grid-row:1/3;--mdc-icon-size:28px}.manualStartTop span{font-size:18px}.manualStartTop small{font-size:11px;opacity:.85}.manualStartTop:disabled{opacity:.42;box-shadow:none}
    .manualZoneCards{min-height:0;height:100%;display:grid;grid-template-rows:repeat(6,minmax(0,1fr));gap:7px}
    .manualZoneCard{min-height:0;border:1px solid var(--line);border-radius:20px;background:var(--card);display:grid;grid-template-columns:72px minmax(92px,1fr) minmax(174px,1.35fr) 62px;align-items:center;gap:10px;padding:7px 12px;box-shadow:0 5px 16px #0b2b4210}
    .manualZoneCard.running{background:color-mix(in srgb,var(--a) 10%,var(--card));border-color:color-mix(in srgb,var(--a) 62%,var(--line))}
    .manualZoneCard .scene{width:72px;height:min(76px,100%);min-height:56px;border-radius:12px;background-size:cover;background-position:center}
    .manualZoneIdentity{min-width:0}.manualZoneIdentity small{display:block;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.08em}.manualZoneIdentity b{display:block;margin-top:4px;font-size:18px;line-height:1.05}.manualZoneCard.running .manualZoneIdentity b{color:var(--a)}
    .manualDuration{height:100%;max-height:70px;min-height:54px;display:grid;grid-template-columns:minmax(50px,1fr) minmax(66px,1.15fr) minmax(50px,1fr);align-items:stretch;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff}
    .manualDuration strong{display:flex;align-items:center;justify-content:center;gap:4px;font-size:30px;line-height:1;font-weight:800;white-space:nowrap}.manualDuration strong small{font-size:13px;color:var(--muted);font-weight:700;text-transform:uppercase}
    .manualTimeButton{border:0;background:#fff;font:inherit;font-size:32px;font-weight:500;line-height:1;color:var(--text);touch-action:manipulation}.manualTimeButton:first-child{border-right:1px solid var(--line)}.manualTimeButton:last-child{border-left:1px solid var(--line)}.manualTimeButton:disabled{color:#aeb6bd;background:#f6f8f9}
    .manualZoneSwitch{justify-self:end;width:58px;height:34px;border:0;border-radius:999px;background:#dfe4e8;padding:3px;transition:background .16s ease;touch-action:manipulation}.manualZoneSwitch span{display:block;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 2px 6px #0002;transform:translateX(0);transition:transform .16s ease}.manualZoneSwitch.on{background:var(--a)}.manualZoneSwitch.on span{transform:translateX(24px)}.manualZoneSwitch:disabled{opacity:.45}
    .workViewport.isNative.manualFitsViewport{overflow-y:hidden}.workViewport.isNative.manualFitsViewport .workCanvas{height:100%}.workViewport.isNative.manualFitsViewport .workCanvas>.content{height:100%;min-height:100%;padding-bottom:4px}
    @media(max-width:520px){
      .manualApprovedScreen{gap:6px}.manualApprovedIntro{gap:7px;padding:1px 3px 3px}.manualApprovedIntro h1{font-size:21px}.manualApprovedIntro p{font-size:12.5px;margin-top:4px}.manualApprovedIntro>div>small{font-size:11px;margin-bottom:3px}
      .manualStartTop{min-width:102px;height:52px;border-radius:16px;padding:6px 10px;grid-template-columns:24px auto}.manualStartTop ha-icon{--mdc-icon-size:24px}.manualStartTop span{font-size:16px}
      .manualZoneCards{gap:5px}.manualZoneCard{grid-template-columns:62px minmax(76px,1fr) minmax(150px,1.4fr) 52px;gap:7px;padding:5px 8px;border-radius:17px}.manualZoneCard .scene{width:62px;height:min(66px,100%);min-height:50px}.manualZoneIdentity small{font-size:10.5px}.manualZoneIdentity b{font-size:16px;margin-top:2px}.manualDuration{min-height:48px;max-height:58px;grid-template-columns:minmax(44px,1fr) minmax(62px,1.15fr) minmax(44px,1fr);border-radius:14px}.manualDuration strong{font-size:27px}.manualDuration strong small{font-size:11px}.manualTimeButton{font-size:29px}.manualZoneSwitch{width:50px;height:30px}.manualZoneSwitch span{width:24px;height:24px}.manualZoneSwitch.on span{transform:translateX(20px)}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0634.mjs
{
const UI_VERSION = "0.6.34";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramView = p.programView;

p.header = function headerV0634() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.programView = function programViewV0634(e) {
  return previousProgramView.call(this, e).replace("<small>ПРОГРАММА</small>", "");
};
}

// Consolidated release layer: irrigation-panel-v0635.mjs
{
const UI_VERSION = "0.6.35";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramView = p.programView;
const previousRender = p._render;
const previousStyles = p.styles;

p.header = function headerV0635() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.programView = function programViewV0635(e) {
  return previousProgramView.call(this, e)
    .replace('class="pageIntro"', 'class="pageIntro programPageIntro"')
    .replace(
      "Программа зон доступна для просмотра. Сезонная коррекция изменяется отдельно с подтверждением.",
      "Зоны — просмотр. Сезон — изменение с подтверждением.",
    );
};

p._render = function renderV0635() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0635() {
  return `${previousStyles.call(this)}
    .programPageIntro{padding-bottom:8px}
    .programPageIntro p{white-space:nowrap}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0636.mjs
{
const UI_VERSION = "0.6.36";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p.header = function headerV0636() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._render = function renderV0636() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0637.mjs
{
const UI_VERSION = "0.6.37";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousToggleManualZone = p.toggleManualZone;

p.header = function headerV0637() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.stopCurrentManual = async function stopCurrentManualV0637(zone) {
  if (this.rejectUnavailableCommand("skip_current_manual")) return;
  if (!window.confirm(`Остановить полив зоны ${zone} и перейти к следующей?\n\nОставшаяся очередь будет сохранена.`)) return;
  this._manualBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "skip_current_manual", this.serviceTargetData());
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

p.toggleManualZone = function toggleManualZoneV0637(zone) {
  const runtime = this.activeRuntime(this.entities());
  if (runtime?.zone === Number(zone)) {
    this.stopCurrentManual(Number(zone));
    return;
  }
  previousToggleManualZone.call(this, Number(zone));
};

p.manualView = function manualViewV0637(e) {
  const runtime = this.activeRuntime(e);
  const localSelection = this._manualQueue || [];
  const selected = new Set(runtime
    ? localSelection.map(Number).filter((zone) => zone >= runtime.zone)
    : localSelection);
  const watering = Boolean(runtime);
  const cards = Array.from({ length: 6 }, (_, index) => index + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const active = runtime?.zone === zone;
    const enabled = selected.has(zone) || active;
    const duration = Number(this._manualDurations?.[zone] || z.duration || 10);
    const scene = `scene scene${zone}`;
    const timeDisabled = !enabled || watering;
    const switchDisabled = watering
      ? (!active || !this.commandAvailable("skip_current_manual"))
      : false;
    const switchLabel = active
      ? `Остановить зону ${zone} и перейти к следующей`
      : `${enabled ? "Исключить" : "Включить"} зону ${zone}`;
    return `<article class="manualZoneCard ${enabled ? "selected" : ""} ${active ? "running" : ""}" data-manual-zone-card="${zone}">
      <span class="${scene}" aria-hidden="true"></span>
      <span class="manualZoneIdentity"><small>ЗОНА ${zone}</small><b>${active ? "Полив" : "Готова"}</b></span>
      <span class="manualDuration" aria-label="Длительность зоны ${zone}">
        <button type="button" class="manualTimeButton" data-queue-step="-1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Уменьшить время зоны ${zone}">−</button>
        <strong>${duration}<small>мин</small></strong>
        <button type="button" class="manualTimeButton" data-queue-step="1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Увеличить время зоны ${zone}">+</button>
      </span>
      <button type="button" class="manualZoneSwitch ${enabled ? "on" : ""}" data-queue-toggle="${zone}" role="switch" aria-checked="${enabled}" ${switchDisabled ? "disabled" : ""} aria-label="${switchLabel}"><span></span></button>
    </article>`;
  }).join("");
  const total = [...selected].reduce((sum, zone) => sum + Number(this._manualDurations?.[zone] || 0), 0);
  const startDisabled = selected.size === 0 || this._manualBusy || !this.commandAvailable("start_manual_queue");
  const topAction = watering
    ? `<button type="button" class="manualStartTop" data-manual-stop ${this._manualBusy || !this.commandAvailable("stop_manual") ? "disabled" : ""}><ha-icon icon="mdi:stop"></ha-icon><span>Стоп всё</span><small>очередь</small></button>`
    : `<button type="button" class="manualStartTop" data-manual-start ${startDisabled ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>Старт</span><small>${total ? `${total} мин` : ""}</small></button>`;
  return `<section class="manualApprovedScreen">
    <div class="manualApprovedIntro">
      <div><small>РУЧНОЙ РЕЖИМ</small><h1>Управление зонами</h1><p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p></div>
      ${topAction}
    </div>
    <div class="manualZoneCards">${cards}</div>
  </section>`;
};

p._render = function renderV0637() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0638.mjs
{
const UI_VERSION = "0.6.38";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p.header = function headerV0638() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._render = function renderV0638() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;

  const runtime = this.activeRuntime(this.entities());
  for (const node of this.shadowRoot?.querySelectorAll(".manualZoneRemaining") || []) {
    if (!node.closest(".manualZoneCard.running")) node.remove();
  }
  const identity = this.shadowRoot?.querySelector(".manualZoneCard.running .manualZoneIdentity");
  if (!identity || !runtime) return;

  let remainingNode = identity.querySelector(".manualZoneRemaining");
  if (!remainingNode) {
    remainingNode = document.createElement("span");
    remainingNode.className = "manualZoneRemaining";
    remainingNode.setAttribute("role", "status");
    remainingNode.setAttribute("aria-live", "polite");
    identity.append(remainingNode);
  }
  remainingNode.textContent = runtime.remaining
    ? `Осталось ${runtime.remaining} мин`
    : "Полив выполняется";
};

p.styles = function stylesV0638() {
  return `${previousStyles.call(this)}
    /* UI v0.6.38 — factual active-zone remaining time in Manual. */
    .manualZoneRemaining{display:block;margin-top:4px;color:var(--a);font-size:12px;font-weight:800;line-height:1.08;white-space:nowrap}
    @media(max-width:520px){.manualZoneRemaining{margin-top:3px;font-size:10.5px;white-space:normal}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0639.mjs
{
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
}

// Consolidated release layer: irrigation-panel-v0640.mjs
{
const UI_VERSION = "0.6.40";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._ensureZone8LabEvents = function ensureZone8LabEventsV0640() {
  // The base element can be upgraded and connected while an earlier module in
  // the import chain is still evaluating.  Bind from render as well as from
  // connectedCallback so Zone 8 drafts never depend on module timing.
  if (this._zone8LabEventsBound) return;
  this._zone8LabEventsBound = true;
  this.shadowRoot.addEventListener("input", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = {
      ...(this._zone8LabDrafts || {}),
      [input.dataset.zone8Field]: input.value,
    };
  });
  this.shadowRoot.addEventListener("change", (event) => {
    const input = event.target;
    if (!input?.matches?.("[data-zone8-field]")) return;
    this._zone8LabDrafts = {
      ...(this._zone8LabDrafts || {}),
      [input.dataset.zone8Field]: input.value,
    };
  });
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.(
      "[data-zone8-apply], [data-zone8-restore]"
    );
    if (!target) return;
    if (target.dataset.zone8Apply) {
      this.applyZone8LabField(target.dataset.zone8Apply);
    } else {
      this.restoreZone8Lab();
    }
  });
};

p._render = function renderV0640() {
  previousRender.call(this);
  this._ensureZone8LabEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0640() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0641.mjs
{
const UI_VERSION = "0.6.41";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p.diagnosticsView = function diagnosticsViewV0641(entities) {
  return previousDiagnosticsView.call(this, entities).replace(
    "Каждая кнопка меняет только одно поле. Успех показывается лишь после точного чтения 20-байтного блока из контроллера.",
    "Запись DP38 аварийно отключена: тест зоны 8 изменил производственные расписания. Доступен только просмотр."
  );
};

p.applyZone8LabField = function applyZone8LabFieldV0641() {
  this.notify("Запись DP38 отключена для защиты программы полива");
};

p.restoreZone8Lab = function restoreZone8LabV0641() {
  this.notify("Восстановление одного блока зоны 8 отключено: операция не изолирована от других зон");
};

p._render = function renderV0641() {
  previousRender.call(this);
  for (const control of this.shadowRoot?.querySelectorAll(
    "[data-zone8-field], [data-zone8-apply], [data-zone8-restore]"
  ) || []) {
    control.disabled = true;
  }
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0641() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0642.mjs
{
const UI_VERSION = "0.6.42";
const CONFIRMATION = "ZONE8_DP38_HEX_PROBE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.commandBusy = function commandBusyV0642() {
  return previousCommandBusy.call(this) || Boolean(this._zone8HexProbeBusy);
};

p._zone8HexProbeStatusText = function zone8HexProbeStatusText(status) {
  return {
    idle: "Тест ещё не запускался",
    reading_before: "Чтение всех восьми зон перед тестом",
    testing_no_change: "Проверка точной записи без изменения",
    testing_change: "Проверка одного бита только зоны 8",
    restoring_zone8: "Возврат исходного блока зоны 8",
    verified: "HEX-запись подтверждена, зона 8 восстановлена",
    failed: "Тест не пройден",
  }[status] || String(status || "Нет данных");
};

p.runZone8HexProbe = async function runZone8HexProbe() {
  if (this.rejectUnavailableCommand("probe_zone8_dp38_hex")) return;
  const entities = this.entities();
  if (String(this.state(entities.operation)).toLowerCase() !== "off") {
    this.notify("Перед тестом физически переведите контроллер в режим OFF");
    return;
  }
  const warning = [
    "Контрольный тест записи DP38 только для свободной зоны 8.",
    "",
    "Будут выполнены:",
    "1. точная HEX-запись текущей зоны 8 без изменения;",
    "2. изменение одного бита датчика дождя зоны 8;",
    "3. возврат исходного блока зоны 8.",
    "",
    "До и после каждого шага сравниваются все 8 зон. Тест не восстанавливает зоны 1, 2 и 4.",
    "",
    "Контроллер должен быть физически в режиме OFF, полив и очередь остановлены. Запустить тест?",
  ].join("\n");
  if (!window.confirm(warning)) return;
  this._zone8HexProbeBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "probe_zone8_dp38_hex", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Тест DP38 завершён: проверьте результат на вкладке «Диагн.»");
  } catch (error) {
    this.notify(this.serviceError(error, "Контрольный тест DP38 не пройден"));
  } finally {
    this._zone8HexProbeBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0642(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = attrs.hex_probe_status || "idle";
  const operationOff = String(this.state(entities.operation)).toLowerCase() === "off";
  const probeReady = attrs.hex_probe_allowed === true
    && operationOff
    && !this._zone8HexProbeBusy
    && this.commandAvailable("probe_zone8_dp38_hex");
  const tone = status === "verified" ? "ok" : status === "failed" ? "error" : "";
  return `${content}
    <section class="lab zone8HexProbe">
      <div class="zone8ProbeHead">
        <span><small>DP38 · КОНТРОЛЬНЫЙ ТЕСТ</small><h3>HEX-запись зоны 8</h3></span>
        <b class="${operationOff ? "ready" : "blocked"}">${operationOff ? "Контроллер OFF" : "Нужен режим OFF"}</b>
      </div>
      <p>Три защищённых шага: запись без изменения, один бит зоны 8, точный возврат. На каждом шаге сравниваются все восемь зон.</p>
      <div class="zone8ProbeResult ${tone}" role="status" aria-live="polite">
        <small>Результат</small>
        <b>${this.esc(this._zone8HexProbeStatusText(status))}</b>
        ${attrs.hex_probe_detail ? `<span>${this.esc(attrs.hex_probe_detail)}</span>` : ""}
      </div>
      <button type="button" class="zone8ProbeButton" data-zone8-hex-probe ${probeReady ? "" : "disabled"}>
        <ha-icon icon="mdi:shield-check-outline"></ha-icon>
        ${this._zone8HexProbeBusy ? "Тест выполняется" : "Проверить HEX на зоне 8"}
      </button>
      <p class="zone8ProbeWarning">Это проверка транспорта, не восстановление повреждённых зон 1, 2 и 4.</p>
    </section>`;
};

p._ensureZone8HexProbeEvents = function ensureZone8HexProbeEvents() {
  if (this._zone8HexProbeEventsBound) return;
  this._zone8HexProbeEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-zone8-hex-probe]");
    if (target) this.runZone8HexProbe();
  });
};

p._render = function renderV0642() {
  previousRender.call(this);
  this._ensureZone8HexProbeEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0642() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0642() {
  return `${previousStyles.call(this)}
    .zone8HexProbe{display:grid;gap:10px;padding:14px}.zone8ProbeHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.zone8ProbeHead small{color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em}.zone8ProbeHead h3{margin:3px 0 0;font-size:20px}.zone8ProbeHead>b{padding:6px 9px;border-radius:99px;background:var(--soft);color:var(--muted);font-size:11px;white-space:nowrap}.zone8ProbeHead>b.ready{background:color-mix(in srgb,var(--green) 12%,var(--card));color:var(--green)}
    .zone8HexProbe>p{margin:0;color:var(--muted);font-size:12px;line-height:1.35}.zone8ProbeResult{display:grid;gap:2px;padding:10px;border-radius:13px;background:var(--soft)}.zone8ProbeResult small,.zone8ProbeResult span{color:var(--muted);font-size:11px}.zone8ProbeResult b{font-size:13px}.zone8ProbeResult.ok{background:color-mix(in srgb,var(--green) 10%,var(--card));color:var(--green)}.zone8ProbeResult.error{background:color-mix(in srgb,var(--danger) 9%,var(--card));color:var(--danger)}
    .zone8ProbeButton{display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;border:1px solid color-mix(in srgb,var(--a) 48%,var(--line));border-radius:13px;background:var(--accent-soft);color:var(--a);font-weight:800}.zone8ProbeButton:disabled{border-color:var(--line);background:var(--soft);color:var(--muted);opacity:.62}.zone8ProbeWarning{font-weight:700}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0643.mjs
{
const UI_VERSION = "0.6.43";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0643(status) {
  return {
    idle: "Тест ещё не запускался",
    reading_before: "Активный сбор свежих DP38 — требуется 8 из 8 зон",
    testing_no_change: "Проверка точной записи без изменения",
    testing_change: "Проверка одного бита только зоны 8",
    restoring_zone8: "Возврат исходного блока зоны 8",
    verified: "HEX-запись подтверждена, зона 8 восстановлена",
    failed: "Тест остановлен защитой до записи",
  }[status] || String(status || "Нет данных");
};

p._render = function renderV0643() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0643() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0644.mjs
{
const UI_VERSION = "0.6.44";
const CONFIRMATION = "ZONE8_DP38_HEX_PROBE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0644(status) {
  return {
    idle: "Тест ещё не запускался",
    reading_before: "Двойное чтение текущего блока зоны 8",
    verified: "Текущий блок зоны 8 прочитан без записи",
    failed: "Чтение не выполнено",
  }[status] || String(status || "Нет данных");
};

p.runZone8HexProbe = async function runZone8HexProbeV0644() {
  if (this.rejectUnavailableCommand("probe_zone8_dp38_hex")) return;
  const entities = this.entities();
  if (String(this.state(entities.operation)).toLowerCase() !== "off") {
    this.notify("Перед тестом физически переведите контроллер в режим OFF");
    return;
  }
  this._zone8HexProbeBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "probe_zone8_dp38_hex", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Текущий блок зоны 8 прочитан без записи");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось прочитать DP38 зоны 8"));
  } finally {
    this._zone8HexProbeBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0644(entities) {
  return previousDiagnosticsView.call(this, entities)
    .replace("DP38 · КОНТРОЛЬНЫЙ ТЕСТ", "DP38 · ЧТЕНИЕ")
    .replace("HEX-запись зоны 8", "Текущая программа зоны 8")
    .replace(
      "Три защищённых шага: запись без изменения, один бит зоны 8, точный возврат. На каждом шаге сравниваются все восемь зон.",
      "Два одинаковых свежих чтения текущего блока DP38 зоны 8. Команды записи не отправляются.",
    )
    .replace("Проверить HEX на зоне 8", "Прочитать зону 8")
    .replace(
      "Это проверка транспорта, не восстановление повреждённых зон 1, 2 и 4.",
      "Только чтение зоны 8. Запись и восстановление всех расписаний отключены.",
    );
};

p._render = function renderV0644() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0644() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0645.mjs
{
const UI_VERSION = "0.6.45";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0645(status) {
  return {
    idle: "Чтение ещё не запускалось",
    reading_before: "Собираю ответы DP38 зоны 8",
    verified: "Получен стабильный ответ зоны 8",
    observed_variants: "Контроллер вернул разные ответы",
    failed: "Зона 8 не ответила",
  }[status] || String(status || "Нет данных");
};

p._zone8SampleSummary = function zone8SampleSummaryV0645(sample) {
  const starts = Array.isArray(sample.start_times) && sample.start_times.length
    ? sample.start_times.join(" · ") : "нет запусков";
  const rain = sample.rain_sensor_follow_inferred ? "дождь: да" : "дождь: нет";
  return `${sample.duration_minutes ?? "—"} мин · ${starts} · цикл ${sample.cycle_mode_raw ?? "—"}/${sample.cycle_value ?? "—"} · ${sample.anchor_date || "дата не задана"} · ${rain}`;
};

p.diagnosticsView = function diagnosticsViewV0645(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const attrs = this.attrs(entities.zones[8].schedule);
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  if (!samples.length) return content;
  const cards = `<div class="zone8Samples">${samples.map((sample, index) => `
    <article>
      <b>Ответ ${index + 1}${Number(sample.count) > 1 ? ` × ${sample.count}` : ""}</b>
      <code>${this.esc(sample.raw_hex || "")}</code>
      <span>${this.esc(this._zone8SampleSummary(sample))}</span>
    </article>`).join("")}</div>`;
  return content.replace(
    '<button type="button" class="zone8ProbeButton"',
    `${cards}<button type="button" class="zone8ProbeButton"`,
  );
};

p._render = function renderV0645() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0645() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0645() {
  return `${previousStyles.call(this)}
    .zone8Samples{display:grid;gap:7px}.zone8Samples article{display:grid;gap:4px;padding:9px;border:1px solid var(--line);border-radius:11px;background:var(--card)}.zone8Samples b{font-size:12px}.zone8Samples code{overflow-wrap:anywhere;font-size:11px;font-weight:700}.zone8Samples span{color:var(--muted);font-size:11px;line-height:1.35}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0646.mjs
{
const UI_VERSION = "0.6.46";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0646(status) {
  return {
    idle: "Чтение ещё не запускалось",
    reading_before: "Собираю все ответы DP38",
    verified: "Получен стабильный ответ зоны 8",
    observed_variants: "Зона 8 вернула разные ответы",
    observed_other_zones: "DP38 ответил другой зоной",
    cached_only: "Свежего ответа нет — показан кэш",
    no_dp38: "Контроллер не вернул DP38",
    failed: "Чтение не выполнено",
  }[status] || String(status || "Нет данных");
};

p._zone8SampleSummary = function zone8SampleSummaryV0646(sample) {
  if (sample.valid === false) return `Невалидный блок: ${sample.error || "неизвестный формат"}`;
  const starts = Array.isArray(sample.start_times) && sample.start_times.length
    ? sample.start_times.join(" · ") : "нет запусков";
  const rain = sample.rain_sensor_follow_inferred ? "дождь: да" : "дождь: нет";
  return `${sample.duration_minutes ?? "—"} мин · ${starts} · цикл ${sample.cycle_mode_raw ?? "—"}/${sample.cycle_value ?? "—"} · ${sample.anchor_date || "дата не задана"} · ${rain}`;
};

p.diagnosticsView = function diagnosticsViewV0646(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const trace = attrs.hex_probe_trace || {};
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  let content = previousDiagnosticsView.call(this, entities)
    .replace(
      "Два одинаковых свежих чтения текущего блока DP38 зоны 8. Команды записи не отправляются.",
      "Собираются все ответы DP38 без фильтра по зоне. Команды записи не отправляются.",
    );
  if (samples.length) {
    const cards = `<div class="zone8Samples">${samples.map((sample, index) => {
      const source = sample.fresh === false ? "ранее сохранён" : "свежий ответ";
      const station = Number(sample.station) || "?";
      return `<article>
        <b>Блок ${index + 1} · зона ${station} · ${source}${Number(sample.count) > 1 ? ` · повторов: ${sample.count}` : ""}</b>
        <code>${this.esc(sample.raw_hex || "")}</code>
        <span>${this.esc(this._zone8SampleSummary(sample))}</span>
      </article>`;
    }).join("")}</div>`;
    content = content.replace(
      /<div class="zone8Samples">[\s\S]*?<\/div><button type="button" class="zone8ProbeButton"/,
      `${cards}<button type="button" class="zone8ProbeButton"`,
    );
  }
  const traceText = Number.isFinite(Number(trace.active_requests))
    ? `<div class="zone8Trace">Запросов: ${Number(trace.active_requests)} · ответов: ${Number(trace.responses || 0)} · варианты DP38: ${Number(trace.dp38_variants || 0)} · DP: ${this.esc((trace.dps_seen || []).join(", ") || "нет")}</div>`
    : "";
  if (traceText) {
    content = content.replace(
      '<button type="button" class="zone8ProbeButton"',
      `${traceText}<button type="button" class="zone8ProbeButton"`,
    );
  }
  return content;
};

p._render = function renderV0646() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0646() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

const previousStyles = p.styles;
p.styles = function stylesV0646() {
  return `${previousStyles.call(this)}
    .zone8Trace{padding:8px 9px;border-radius:10px;background:var(--soft);color:var(--muted);font-size:11px;line-height:1.35}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0647.mjs
{
const UI_VERSION = "0.6.47";
const CONFIRMATION = "RESTORE_ZONE8_KNOWN_BACKUP";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.commandBusy = function commandBusyV0647() {
  return previousCommandBusy.call(this) || Boolean(this._zone8KnownRestoreBusy);
};

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0647(status) {
  return {
    idle: "Чтение ещё не запускалось",
    reading_before: "Собираю все ответы DP38",
    verified: "Получен стабильный ответ зоны 8",
    corrupt_zone8: "Получен повреждённый блок зоны 8",
    observed_variants: "Зона 8 вернула разные ответы",
    observed_other_zones: "DP38 ответил другой зоной",
    cached_only: "Свежего ответа нет — показан кэш",
    no_dp38: "Контроллер не вернул DP38",
    failed: "Чтение не выполнено",
  }[status] || String(status || "Нет данных");
};

p._zone8KnownRestoreStatusText = function zone8KnownRestoreStatusText(status) {
  return {
    idle: "Восстановление ещё не запускалось",
    reading_before: "Проверяю точный исходный блок",
    writing_once: "Отправлена единственная запись зоны 8",
    reading_after: "Проверяю записанный блок",
    restored: "Зона 8 восстановлена и прочитана",
    readback_mismatch: "Ответ не совпал — повторной записи не было",
    blocked: "Восстановление остановлено защитой",
  }[status] || String(status || "Нет данных");
};

p.runZone8KnownRestore = async function runZone8KnownRestore() {
  if (this.rejectUnavailableCommand("restore_zone8_known_backup")) return;
  const entities = this.entities();
  const attrs = this.attrs(entities.zones[8].schedule);
  const fromHex = attrs.known_restore_expected_from_hex || "";
  const toHex = attrs.known_restore_expected_to_hex || "";
  const warning = [
    "Восстановить только зону 8 из известной резервной копии?",
    "",
    `ДО: ${fromHex}`,
    `ПОСЛЕ: ${toHex}`,
    "",
    "Интеграция сначала потребует два одинаковых свежих ответа ДО, отправит ровно одну запись и подтвердит ПОСЛЕ повторными чтениями.",
    "Зоны 1–6 не записываются. Автоматический откат отключён.",
  ].join("\n");
  if (!window.confirm(warning)) return;
  this._zone8KnownRestoreBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "restore_zone8_known_backup", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Зона 8 восстановлена и подтверждена чтением");
  } catch (error) {
    this.notify(this.serviceError(error, "Восстановление зоны 8 остановлено"));
  } finally {
    this._zone8KnownRestoreBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0647(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = attrs.known_restore_status || "idle";
  const operationOff = String(this.state(entities.operation)).toLowerCase() === "off";
  const expected = attrs.known_restore_expected_from_hex || "";
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  const exactCurrent = samples.some((sample) =>
    Number(sample.station) === 8
    && Number(sample.length) === 20
    && Number(sample.count) >= 2
    && String(sample.raw_hex || "").toUpperCase() === String(expected).toUpperCase());
  const ready = attrs.known_restore_allowed === true
    && operationOff
    && exactCurrent
    && !this._zone8KnownRestoreBusy
    && this.commandAvailable("restore_zone8_known_backup");
  const tone = status === "restored" ? "ok"
    : ["blocked", "readback_mismatch"].includes(status) ? "error" : "";
  return `${content}
    <section class="lab zone8KnownRestore">
      <div class="zone8ProbeHead">
        <span><small>DP38 · ВОССТАНОВЛЕНИЕ</small><h3>Резервная копия зоны 8</h3></span>
        <b class="${ready ? "ready" : "blocked"}">${ready ? "Точный блок ДО найден" : "Сначала прочитайте зону 8"}</b>
      </div>
      <p>Единственная разрешённая запись: известный повреждённый блок заменяется точной резервной копией только зоны 8.</p>
      <div class="zone8HexPair"><small>ДО</small><code>${this.esc(expected)}</code><small>ПОСЛЕ</small><code>${this.esc(attrs.known_restore_expected_to_hex || "")}</code></div>
      <div class="zone8ProbeResult ${tone}" role="status" aria-live="polite">
        <small>Результат</small>
        <b>${this.esc(this._zone8KnownRestoreStatusText(status))}</b>
        ${attrs.known_restore_detail ? `<span>${this.esc(attrs.known_restore_detail)}</span>` : ""}
        ${attrs.known_restore_readback_hex ? `<code>${this.esc(attrs.known_restore_readback_hex)}</code>` : ""}
      </div>
      <button type="button" class="zone8ProbeButton" data-zone8-known-restore ${ready ? "" : "disabled"}>
        <ha-icon icon="mdi:backup-restore"></ha-icon>
        ${this._zone8KnownRestoreBusy ? "Восстановление выполняется" : "Восстановить исходную зону 8"}
      </button>
      <p class="zone8ProbeWarning">Зоны 1–6 заблокированы. При несовпадении чтения повторной записи и отката не будет.</p>
    </section>`;
};

p._ensureZone8KnownRestoreEvents = function ensureZone8KnownRestoreEvents() {
  if (this._zone8KnownRestoreEventsBound) return;
  this._zone8KnownRestoreEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-zone8-known-restore]");
    if (target) this.runZone8KnownRestore();
  });
};

p._render = function renderV0647() {
  previousRender.call(this);
  this._ensureZone8KnownRestoreEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0647() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0647() {
  return `${previousStyles.call(this)}
    .zone8KnownRestore{display:grid;gap:10px;padding:14px}.zone8KnownRestore>p{margin:0;color:var(--muted);font-size:12px;line-height:1.35}.zone8HexPair{display:grid;grid-template-columns:auto 1fr;gap:5px 8px;padding:10px;border-radius:13px;background:var(--soft)}.zone8HexPair small{color:var(--muted);font-weight:800}.zone8HexPair code,.zone8KnownRestore .zone8ProbeResult code{overflow-wrap:anywhere;font-size:11px;font-weight:700}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0648.mjs
{
const UI_VERSION = "0.6.48";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p._render = function renderV0648() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0648() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0649.mjs
{
const UI_VERSION = "0.6.49";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousSampleSummary = p._zone8SampleSummary;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8SampleSummary = function zone8SampleSummaryV0649(sample) {
  const summary = previousSampleSummary.call(this, sample);
  const station = Number(sample.station);
  if (!Number.isInteger(station) || station < 1 || station > 8) return summary;
  const comparison = sample.matches_known_backup === true
    ? "резерв: совпадает"
    : "резерв: отличается";
  return `${summary} · ${comparison}`;
};

p.diagnosticsView = function diagnosticsViewV0649(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const trace = attrs.hex_probe_trace || {};
  const zones = Array.isArray(trace.zones_seen) ? trace.zones_seen.join(", ") : "нет";
  let content = previousDiagnosticsView.call(this, entities)
    .replaceAll("Сначала прочитайте зону 8", "Запись аварийно остановлена")
    .replaceAll("Восстановить исходную зону 8", "Запись DP38 отключена")
    .replaceAll(
      "Единственная разрешённая запись: известный повреждённый блок заменяется точной резервной копией только зоны 8.",
      "После несовпадения ответа все записи DP38 остановлены. Доступен только полный снимок зон 1–8.",
    );
  content = content.replace(
    /<div class="zone8Trace">[\s\S]*?<\/div>/,
    `<div class="zone8Trace">Запросов: ${Number(trace.active_requests || 0)} · ответов: ${Number(trace.responses || 0)} · зоны: ${this.esc(zones)} · полный круг: ${trace.complete_round === true ? "да" : "нет"} · DP: ${this.esc((trace.dps_seen || []).join(", ") || "нет")}</div>`,
  );
  return content;
};

p._render = function renderV0649() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0649() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
}

// Consolidated release layer: irrigation-panel-v0650.mjs
{
const UI_VERSION = "0.6.50";
const CONFIRMATION = "WRITE_ZONE8_ANCHOR_DATE_2026_09_02_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;
const previousZone8LabCurrent = p._zone8LabCurrent;

p.commandBusy = function commandBusyV0650() {
  return previousCommandBusy.call(this) || Boolean(this._zone8AnchorDateTestBusy);
};

p._zone8AnchorDateTestStatusText = function zone8AnchorDateTestStatusText(status) {
  return {
    idle: "Запись ещё не выполнялась",
    reading_before: "Проверяю точный исходный блок",
    writing_once: "Отправлена единственная запись",
    reading_after: "Проверяю новую дату чтением",
    confirmed: "Дата 02.09.2026 записана и прочитана",
    readback_mismatch: "Ответ не совпал — повтора и отката не было",
    blocked: "Тест остановлен защитой",
  }[status] || String(status || "Нет данных");
};

p._zone8LatestDecoded = function zone8LatestDecoded(attrs) {
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  const sample = samples
    .filter((item) => Number(item.station) === 8
      && Number(item.length) === 20
      && Number(item.count) >= 2
      && item.fresh !== false
      && item.valid !== false)
    .sort((left, right) => Number(right.count || 0) - Number(left.count || 0))[0];
  const rawHex = String(sample?.raw_hex || "").toUpperCase();
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
  const anchorDate = bytes[16] && bytes[17] && bytes[18]
    ? `${2000 + bytes[16]}-${String(bytes[17]).padStart(2, "0")}-${String(bytes[18]).padStart(2, "0")}`
    : "";
  return {
    rawHex,
    duration: bytes[1],
    starts,
    mode,
    cycleValue: bytes[15],
    anchorDate,
    rain: (bytes[19] & 0x01) === 0x01 ? "true" : "false",
  };
};

p._zone8LabCurrent = function zone8LabCurrentV0650(field, attrs) {
  const decoded = this._zone8LatestDecoded(attrs);
  if (!decoded) return previousZone8LabCurrent.call(this, field, attrs);
  if (field.startsWith("start_time_")) {
    const slot = Number(field.slice(-1)) - 1;
    return decoded.starts[slot] || "";
  }
  if (field === "duration_minutes") return decoded.duration;
  if (field === "cycle_mode") return decoded.mode;
  if (field === "cycle_value") return decoded.cycleValue;
  if (field === "anchor_date") return decoded.anchorDate;
  if (field === "rain_sensor_follow") return decoded.rain;
  return previousZone8LabCurrent.call(this, field, attrs);
};

p._zone8LabValue = function zone8LabValueV0650(field, attrs) {
  return this._zone8LabCurrent(field, attrs);
};

p.runZone8AnchorDateWrite = async function runZone8AnchorDateWrite() {
  if (this.rejectUnavailableCommand("test_zone8_anchor_date_write")) return;
  const attrs = this.attrs(this.entities().zones[8].schedule);
  const before = attrs.anchor_date_test_expected_from_hex || "";
  const after = attrs.anchor_date_test_expected_to_hex || "";
  const warning = [
    "Изменить только опорную дату зоны 8?",
    "",
    "03.09.2026 → 02.09.2026",
    `ДО: ${before}`,
    `ПОСЛЕ: ${after}`,
    "",
    "Будет отправлена ровно одна запись DP38. Длительность останется 0 минут, запусков нет. Контроллер должен быть в OFF.",
    "При несовпадении ответа повторной записи и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(warning)) return;
  this._zone8AnchorDateTestBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "test_zone8_anchor_date_write", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Зона 8: дата 02.09.2026 подтверждена чтением");
  } catch (error) {
    this.notify(this.serviceError(error, "Тест записи даты зоны 8 остановлен"));
  } finally {
    this._zone8AnchorDateTestBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0650(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const decoded = this._zone8LatestDecoded(attrs);
  const status = attrs.anchor_date_test_status || "idle";
  const expected = String(attrs.anchor_date_test_expected_from_hex || "").toUpperCase();
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  const stableZone8 = samples.some((sample) =>
    Number(sample.station) === 8
    && Number(sample.length) === 20
    && Number(sample.count) >= 2
    && sample.fresh !== false
    && sample.valid !== false);
  const exactCurrent = samples.some((sample) =>
    Number(sample.station) === 8
    && Number(sample.length) === 20
    && Number(sample.count) >= 2
    && sample.fresh !== false
    && sample.valid !== false
    && String(sample.raw_hex || "").toUpperCase() === expected);
  const operationOff = String(this.state(entities.operation)).toLowerCase() === "off";
  const attempted = attrs.anchor_date_test_attempted === true;
  const ready = attrs.anchor_date_test_allowed === true
    && exactCurrent
    && operationOff
    && !attempted
    && !this._zone8AnchorDateTestBusy
    && this.commandAvailable("test_zone8_anchor_date_write");
  const badge = attempted ? "Запись уже отправлялась"
    : ready ? "Точный блок ДО найден"
      : !operationOff ? "Переведите контроллер в OFF"
        : !stableZone8 ? "Сначала прочитайте зону 8"
          : "Исходный блок отличается";
  const tone = status === "confirmed" ? "ok"
    : ["blocked", "readback_mismatch"].includes(status) ? "error" : "";
  const cycleLabel = decoded?.mode === "interval" ? "Интервал, дней"
    : decoded?.mode === "weekly" ? "Дни недели, маска"
      : "Значение цикла";

  let content = previousDiagnosticsView.call(this, entities);
  content = content
    .replace("Программа зоны 8", "Расшифрованное состояние зоны 8")
    .replace("Значение цикла", cycleLabel)
    .replace("Изменений ещё не было", "Последний стабильный ответ DP38")
    .replace(
      "Запись DP38 аварийно отключена: тест зоны 8 изменил производственные расписания. Доступен только просмотр.",
      "Поля расшифрованы из последнего стабильного ответа DP38 зоны 8. Универсальная запись отключена.",
    );
  content = content.replace(
    /<section class="lab zone8KnownRestore">[\s\S]*?<\/section>/,
    "",
  );
  return `${content}
    <section class="lab zone8AnchorDateTest">
      <div class="zone8ProbeHead">
        <span><small>DP38 · ОДНОРАЗОВЫЙ ТЕСТ</small><h3>Дата начала зоны 8</h3></span>
        <b class="${ready ? "ready" : "blocked"}">${this.esc(badge)}</b>
      </div>
      <p>Меняется один байт: день опорной даты <b>03 → 02</b>. Длительность зоны 8 остаётся 0 минут, запусков нет.</p>
      <div class="zone8DateChange"><span>03.09.2026</span><ha-icon icon="mdi:arrow-right"></ha-icon><strong>02.09.2026</strong></div>
      <div class="zone8HexPair"><small>ДО</small><code>${this.esc(expected)}</code><small>ПОСЛЕ</small><code>${this.esc(attrs.anchor_date_test_expected_to_hex || "")}</code></div>
      <div class="zone8ProbeResult ${tone}" role="status" aria-live="polite">
        <small>Результат</small>
        <b>${this.esc(this._zone8AnchorDateTestStatusText(status))}</b>
        ${attrs.anchor_date_test_detail ? `<span>${this.esc(attrs.anchor_date_test_detail)}</span>` : ""}
        ${attrs.anchor_date_test_readback_hex ? `<code>${this.esc(attrs.anchor_date_test_readback_hex)}</code>` : ""}
      </div>
      <button type="button" class="zone8ProbeButton" data-zone8-anchor-date-test ${ready ? "" : "disabled"}>
        <ha-icon icon="mdi:calendar-edit"></ha-icon>
        ${this._zone8AnchorDateTestBusy ? "Проверка выполняется" : "Записать дату 02.09.2026 один раз"}
      </button>
      <p class="zone8ProbeWarning">Перед нажатием: контроллер OFF, полив остановлен. После теста проверьте дату зоны 8 на самом приборе.</p>
    </section>`;
};

p._ensureZone8AnchorDateTestEvents = function ensureZone8AnchorDateTestEvents() {
  if (this._zone8AnchorDateTestEventsBound) return;
  this._zone8AnchorDateTestEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-zone8-anchor-date-test]");
    if (target) this.runZone8AnchorDateWrite();
  });
};

p._render = function renderV0650() {
  previousRender.call(this);
  this._ensureZone8AnchorDateTestEvents();
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0650() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0650() {
  return `${previousStyles.call(this)}
    .zone8ProgramLab [data-zone8-apply],.zone8ProgramLab [data-zone8-restore]{display:none}.zone8ProgramLab .zone8LabControl{grid-template-columns:minmax(0,1fr)}.zone8ProgramLab [data-zone8-field]:disabled{opacity:1;color:var(--text);-webkit-text-fill-color:var(--text)}
    .zone8AnchorDateTest{display:grid;gap:10px;padding:14px}.zone8AnchorDateTest>p{margin:0;color:var(--muted);font-size:12px;line-height:1.35}.zone8DateChange{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:10px;border-radius:13px;background:var(--soft);text-align:center}.zone8DateChange span,.zone8DateChange strong{font-size:15px}.zone8DateChange ha-icon{width:20px;height:20px;color:var(--a)}.zone8AnchorDateTest .zone8ProbeResult code{overflow-wrap:anywhere;font-size:11px;font-weight:700}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0651.mjs
{
const UI_VERSION = "0.6.51";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.runZone8AnchorDateWrite = async function runZone8AnchorDateWriteDisabled() {
  this.notify("Запись DP38 полностью отключена после изменения зоны 4");
};

p.diagnosticsView = function diagnosticsViewV0651(entities) {
  const content = previousDiagnosticsView.call(this, entities).replace(
    /<section class="lab zone8AnchorDateTest">[\s\S]*?<\/section>/,
    "",
  );
  return `${content}
    <section class="lab zone8WriteIncident">
      <div class="zone8ProbeHead">
        <span><small>DP38 · БЕЗОПАСНОСТЬ</small><h3>Запись расписаний отключена</h3></span>
        <b class="blocked">Только чтение</b>
      </div>
      <p>Одиночный блок с идентификатором зоны 8 не оказался изолированным: зона 8 осталась без изменений, а контроллер применил нулевую длительность, пустые старты и дату теста к зоне 4, одновременно заменив ежедневный период недельной маской.</p>
      <div class="zone8IncidentFacts">
        <span><small>Зона 8</small><b>Не изменилась</b></span>
        <span><small>Зона 4</small><b>Затронута тестом</b></span>
      </div>
      <p class="zone8ProbeWarning">Все записи DP38, включая повтор, откат и восстановление, заблокированы до расшифровки адресации контроллера. Кнопка «Прочитать зону 8» безопасна и остаётся доступной.</p>
    </section>`;
};

p._render = function renderV0651() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0651() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0651() {
  return `${previousStyles.call(this)}
    .zone8AnchorDateTest{display:none!important}.zone8WriteIncident{display:grid;gap:10px;padding:14px}.zone8WriteIncident>p{margin:0;color:var(--muted);font-size:12px;line-height:1.4}.zone8IncidentFacts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.zone8IncidentFacts span{display:grid;gap:3px;padding:10px;border-radius:13px;background:var(--soft)}.zone8IncidentFacts small{color:var(--muted);font-size:11px}.zone8IncidentFacts b{font-size:13px}.zone8IncidentFacts span:first-child b{color:var(--green)}.zone8IncidentFacts span:last-child b{color:var(--danger)}`;
};
}

// Consolidated release layer: irrigation-panel-v0652.mjs
{
const UI_VERSION = "0.6.52";
const DAY_MS = 86_400_000;
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

const parseLocalDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
};

const formatLocalDate = (value) => {
  const parsed = parseLocalDate(value);
  if (!parsed) return value ? "Некорректная дата" : "Не задана";
  return `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()}`;
};

const dayWord = (value) => {
  const amount = Math.abs(Number(value));
  if (amount % 10 === 1 && amount % 100 !== 11) return "день";
  if ([2, 3, 4].includes(amount % 10) && ![12, 13, 14].includes(amount % 100)) return "дня";
  return "дней";
};

const startWord = (value) => {
  const amount = Math.abs(Number(value));
  if (amount % 10 === 1 && amount % 100 !== 11) return "запуск";
  if ([2, 3, 4].includes(amount % 10) && ![12, 13, 14].includes(amount % 100)) return "запуска";
  return "запусков";
};

p._zoneProgramSlots = function zoneProgramSlots(attrs) {
  const explicit = Array.isArray(attrs.start_slots) ? attrs.start_slots : [];
  const compact = Array.isArray(attrs.start_times) ? attrs.start_times.filter(Boolean) : [];
  return Array.from({ length: 6 }, (_, index) => {
    const raw = explicit.length ? explicit[index] : compact[index];
    const value = raw === null || raw === undefined || raw === "" ? "" : String(raw);
    return {
      index: index + 1,
      value,
      present: Boolean(value),
      valid: !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
    };
  });
};

p._zoneCyclePresentation = function zoneCyclePresentation(attrs) {
  const mode = String(attrs.calendar_mode || attrs.cycle_mode || "unknown");
  const rawMode = Number(attrs.cycle_mode_raw);
  const cycleValue = Number(attrs.cycle_value);
  if (mode === "interval") {
    const interval = Number(attrs.interval_days ?? attrs.cycle_value);
    if (!Number.isInteger(interval) || interval < 1) {
      return { mode, value: "Интервал не задан", detail: "Проверьте значение цикла" };
    }
    return {
      mode,
      value: interval === 1 ? "Каждый день" : `Каждые ${interval} ${dayWord(interval)}`,
      detail: `Период: ${interval} ${dayWord(interval)}`,
    };
  }
  if (mode === "weekly") {
    const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const selected = weekdays.filter((_label, index) => Number.isInteger(cycleValue) && (cycleValue & (1 << index)) !== 0);
    return {
      mode,
      value: "По дням недели",
      detail: selected.length === 7 ? "Все дни недели" : selected.length ? selected.join(" · ") : "Дни не выбраны",
    };
  }
  if (mode === "odd") return { mode, value: "По нечётным датам", detail: "Нечётные числа месяца" };
  if (mode === "even") return { mode, value: "По чётным датам", detail: "Чётные числа месяца" };
  if (mode === "disabled") return { mode, value: "Выключен", detail: "Повтор не задан" };
  return {
    mode,
    value: "Неизвестный режим",
    detail: Number.isFinite(rawMode) ? `Код режима: ${rawMode}` : "Нет данных",
  };
};

p._zoneRunsOnDate = function zoneRunsOnDate(date, attrs, cycle) {
  if (cycle.mode === "weekly") {
    const mask = Number(attrs.cycle_value);
    return Number.isInteger(mask) && mask > 0 && (mask & (1 << date.getDay())) !== 0;
  }
  if (cycle.mode === "odd") return date.getDate() % 2 === 1;
  if (cycle.mode === "even") return date.getDate() % 2 === 0;
  if (cycle.mode !== "interval") return false;
  const interval = Number(attrs.interval_days ?? attrs.cycle_value);
  const anchor = parseLocalDate(attrs.anchor_date || attrs.interval_start);
  if (!anchor || !Number.isInteger(interval) || interval < 1) return false;
  const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const elapsedDays = Math.round((currentDay.getTime() - anchor.getTime()) / DAY_MS);
  return elapsedDays >= 0 && elapsedDays % interval === 0;
};

p._zoneNextStart = function zoneNextStart(attrs, enabled) {
  if (!enabled) return { value: "Не запланирован", detail: "Программа зоны выключена" };
  const slots = this._zoneProgramSlots(attrs);
  const starts = slots
    .filter((slot) => slot.present && slot.valid)
    .map((slot) => {
      const [hour, minute] = slot.value.split(":").map(Number);
      return { hour, minute, value: slot.value };
    })
    .sort((left, right) => left.hour - right.hour || left.minute - right.minute);
  if (!starts.length) {
    const hasInvalid = slots.some((slot) => slot.present && !slot.valid);
    return {
      value: hasInvalid ? "Не рассчитан" : "Не запланирован",
      detail: hasInvalid ? "Есть некорректное время" : "Время запуска не задано",
    };
  }
  const cycle = this._zoneCyclePresentation(attrs);
  if (!["interval", "weekly", "odd", "even"].includes(cycle.mode)) {
    return { value: "Не рассчитан", detail: "Неизвестный режим повторения" };
  }
  if (cycle.mode === "interval" && !parseLocalDate(attrs.anchor_date || attrs.interval_start)) {
    return { value: "Не рассчитан", detail: "Не задана дата начала цикла" };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  for (let offset = 0; offset <= 800; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0, 0);
    if (!this._zoneRunsOnDate(day, attrs, cycle)) continue;
    for (const start of starts) {
      const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.hour, start.minute, 0, 0);
      if (candidate.getTime() <= now.getTime()) continue;
      const dayLabel = offset === 0 ? "Сегодня" : offset === 1 ? "Завтра" : new Intl.DateTimeFormat("ru-RU", {
        weekday: "short", day: "numeric", month: "short",
      }).format(candidate);
      return { value: `${dayLabel}, ${start.value}`, detail: "Расчёт по программе" };
    }
  }
  return { value: "Не рассчитан", detail: "В пределах ближайших 800 дней запусков нет" };
};

p.zoneDetail = function zoneDetailV0652(e, zone) {
  const z = this.zoneRuntime(e, zone);
  const attrs = z.attrs;
  const enabled = this.state(z.q.schedule) === "configured";
  const slots = this._zoneProgramSlots(attrs);
  const startsCount = slots.filter((slot) => slot.present).length;
  const cycle = this._zoneCyclePresentation(attrs);
  const nextStart = this._zoneNextStart(attrs, enabled);
  const seasonalRaw = this.state(e.seasonal);
  const seasonal = this.bad(seasonalRaw) ? "Нет данных" : `${seasonalRaw} %`;
  const rain = attrs.rain_sensor_follow === true ? "Учитывается"
    : attrs.rain_sensor_follow === false ? "Не учитывается" : "Нет данных";
  const statusIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline"
    : z.tone === "unknown" || z.tone === "off" ? "mdi:help-circle-outline" : "mdi:check-circle";
  const slotCards = slots.map((slot) => `<div class="zoneProgramSlot ${slot.present ? "filled" : "empty"} ${slot.valid ? "" : "invalid"}">
    <small>Запуск ${slot.index}</small>
    <b>${slot.present ? this.esc(slot.value) : "Не задан"}</b>
  </div>`).join("");
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button>
    <section class="detailCard zoneProgramDetail">
      <div class="zoneProgramHero">
        <span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>
        <div class="zoneProgramIdentity">
          <small>ЗОНА ${zone}</small>
          <h2>Зона ${zone}</h2>
          <span class="zoneProgramStatus ${this.esc(z.tone)}"><ha-icon icon="${statusIcon}"></ha-icon>${this.esc(z.label)}</span>
          <span class="zoneProgramCount">${startsCount} ${startWord(startsCount)}</span>
        </div>
      </div>

      <div class="zoneProgramFacts">
        <article class="zoneProgramFact"><small>Базовая длительность</small><b>${this.esc(z.duration)} мин</b><span>До сезонной коррекции</span></article>
        <article class="zoneProgramFact"><small>Сезонная коррекция</small><b>${this.esc(seasonal)}</b><span>Общая для контроллера</span></article>
        <article class="zoneProgramFact"><small>Повтор</small><b>${this.esc(cycle.value)}</b><span>${this.esc(cycle.detail)}</span></article>
        <article class="zoneProgramFact"><small>Дата начала цикла</small><b>${this.esc(formatLocalDate(attrs.anchor_date || attrs.interval_start))}</b><span>Опорная дата программы</span></article>
        <article class="zoneProgramFact"><small>Датчик дождя</small><b>${rain}</b><span>Правило этой зоны</span></article>
        <article class="zoneProgramFact next"><small>Ближайший запуск</small><b>${this.esc(nextStart.value)}</b><span>${this.esc(nextStart.detail)}</span></article>
      </div>

      <section class="zoneProgramStarts" aria-label="Все времена запуска">
        <div class="zoneProgramStartsHead"><span><small>ВРЕМЯ ЗАПУСКА</small><h3>Все шесть слотов</h3></span><b>${startsCount} из 6</b></div>
        <div class="zoneProgramSlots">${slotCards}</div>
      </section>
      <p class="zoneProgramNote"><ha-icon icon="mdi:eye-outline"></ha-icon><span>Параметры доступны только для просмотра. Ближайший запуск рассчитан по сохранённой программе; фактический полив зависит от режима контроллера и датчика дождя.</span></p>
    </section>`;
};

p._render = function renderV0652() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0652() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0652() {
  return `${previousStyles.call(this)}
    /* UI v0.6.52 — complete decoded zone program form. */
    .zoneProgramDetail{min-height:0!important;display:grid;gap:14px;padding:16px!important}
    .zoneProgramHero{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:stretch;gap:14px}
    .zoneProgramScene{display:block!important;width:112px!important;height:112px!important;align-self:stretch;border:1px solid var(--line);border-radius:17px!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;background-color:var(--soft)!important;box-shadow:inset 0 0 0 1px #ffffff35,0 5px 14px #11182712}
    .zoneProgramIdentity{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;align-content:center;gap:5px 8px;min-width:0;padding:2px 0}
    .zoneProgramIdentity>small{grid-column:1/3;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.11em}
    .zoneProgramIdentity h2{grid-column:1/3;margin:0;color:var(--text);font-size:25px;line-height:1.05}
    .zoneProgramStatus,.zoneProgramCount{display:inline-flex;align-items:center;min-height:30px;border-radius:999px;font-size:12px;font-weight:800;white-space:nowrap}
    .zoneProgramStatus{gap:5px;justify-self:start;padding:4px 9px;background:var(--green-soft);color:var(--green)}.zoneProgramStatus ha-icon{--mdc-icon-size:18px}
    .zoneProgramStatus.running,.zoneProgramStatus.queued{background:var(--accent-soft);color:var(--a)}.zoneProgramStatus.unknown,.zoneProgramStatus.off{background:var(--soft);color:var(--muted)}
    .zoneProgramCount{justify-self:end;padding:4px 10px;background:var(--soft);color:var(--muted)}
    .zoneProgramFacts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .zoneProgramFact{display:grid;align-content:start;gap:4px;min-height:86px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);border-radius:15px;background:var(--soft)}
    .zoneProgramFact>small{color:var(--muted);font-size:12px;font-weight:650}.zoneProgramFact>b{color:var(--text);font-size:15px;line-height:1.18}.zoneProgramFact>span{color:var(--muted);font-size:12px;line-height:1.25}
    .zoneProgramFact.next{background:color-mix(in srgb,var(--a) 7%,var(--card));border-color:color-mix(in srgb,var(--a) 18%,var(--line))}.zoneProgramFact.next>b{color:var(--a)}
    .zoneProgramStarts{display:grid;gap:9px;padding:12px;border:1px solid var(--line);border-radius:17px;background:var(--card)}
    .zoneProgramStartsHead{display:flex;align-items:end;justify-content:space-between;gap:12px}.zoneProgramStartsHead small{display:block;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.1em}.zoneProgramStartsHead h3{margin:3px 0 0;font-size:17px;line-height:1.1}.zoneProgramStartsHead>b{padding:5px 9px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:12px;white-space:nowrap}
    .zoneProgramSlots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.zoneProgramSlot{display:grid;gap:3px;min-width:0;padding:9px 10px;border-radius:13px;background:var(--soft)}.zoneProgramSlot small{color:var(--muted);font-size:11px}.zoneProgramSlot b{overflow:hidden;color:var(--text);font-size:14px;line-height:1.15;text-overflow:ellipsis}.zoneProgramSlot.empty b{color:var(--muted);font-weight:600}.zoneProgramSlot.invalid{background:color-mix(in srgb,var(--danger) 8%,var(--card));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--danger) 24%,transparent)}.zoneProgramSlot.invalid b{color:var(--danger)}
    .zoneProgramNote{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:start;gap:8px;margin:0!important;padding:11px 12px;border-radius:15px;background:var(--soft);color:var(--muted)!important;font-size:12px!important;line-height:1.38!important}.zoneProgramNote ha-icon{--mdc-icon-size:22px;color:var(--a)}
    @media(max-width:520px){
      .zoneProgramDetail{gap:11px;padding:13px!important}.zoneProgramHero{grid-template-columns:94px minmax(0,1fr);gap:11px}.zoneProgramScene{width:94px!important;height:94px!important;border-radius:15px!important}.zoneProgramIdentity{gap:4px 6px}.zoneProgramIdentity h2{font-size:22px}.zoneProgramStatus,.zoneProgramCount{min-height:27px;padding:3px 7px;font-size:11px}.zoneProgramStatus ha-icon{--mdc-icon-size:16px}
      .zoneProgramFacts{gap:7px}.zoneProgramFact{min-height:82px;padding:10px}.zoneProgramFact>b{font-size:14px}.zoneProgramFact>small,.zoneProgramFact>span{font-size:11px}.zoneProgramSlots{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.zoneProgramSlot{padding:8px 9px}.zoneProgramStarts{padding:11px}.zoneProgramNote{padding:10px}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0653.mjs
{
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
}

// Consolidated release layer: irrigation-panel-v0654.mjs
{
const UI_VERSION = "0.6.54";
const SNAPSHOT_CONFIRMATION = "DP38_FULL_SNAPSHOT_READ_ONLY";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

p.runDp38FullSnapshot = async function runDp38FullSnapshotV0654(phase) {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  const entities = this.entities();
  const attrs = this.attrs(entities.zones[8].schedule);
  const operation = String(this.state(entities.operation)).toLowerCase();
  if (operation !== "auto") {
    this.notify("Для обхода зон включите контроллер и установите режим Auto");
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
      "Контроллер должен быть включён, находиться в режиме Auto и не выполнять полив.",
      "После запуска последовательно откройте на приборе зоны 1 → 8, ничего не изменяя. На сбор отведено до 35 секунд.",
      "",
      "Команды записи DP38 не отправляются.",
    ].join("\n")
    : [
      "Снять контрольный снимок и сравнить с исходным?",
      "",
      "Контроллер должен быть включён, находиться в режиме Auto и не выполнять полив.",
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

p._render = function renderV0654() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0655.mjs
{
const UI_VERSION = "0.6.55";
const CONFIRMATION = "WRITE_FULL_DP38_FRAME_ZONE8_DATE_2026_09_05_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.commandBusy = function commandBusyV0655() {
  return previousCommandBusy.call(this) || Boolean(this._dp38FullFrameBusy);
};

p._fullFrameStatusText = function fullFrameStatusText(status) {
  return {
    idle: "Сначала снимите свежий исходный снимок 1–8",
    preflight: "Проверяю полный снимок и состояние контроллера",
    writing_once: "Отправляется одна полнокадровая запись",
    awaiting_compare: "Запись отправлена — нужен контрольный снимок 1–8",
    confirmed: "Подтверждено: изменилась только дата зоны 8",
    comparison_mismatch: "Контрольный снимок не совпал с ожидаемым результатом",
    dispatch_unknown: "Результат отправки неизвестен — повтор запрещён",
    blocked: "Запись остановлена защитой до отправки",
  }[status] || String(status || "Нет данных");
};

p.runZone8FullFrameTest = async function runZone8FullFrameTest() {
  if (this.rejectUnavailableCommand("test_zone8_full_frame_write")) return;
  const attrs = this.attrs(this.entities().zones[8].schedule);
  if (attrs.full_frame_test_allowed !== true) {
    this.notify("Сначала переснимите исходный снимок 1–8 при текущей дате зоны 8 — 04.09.2026");
    return;
  }
  const message = [
    "Отправить одну полную запись DP38 зон 1–8?",
    "",
    "В исходном снимке зона 8 должна иметь дату 04.09.2026.",
    "Будут отправлены все восемь исходных блоков; изменится только байт 18 зоны 8: 04 → 05.",
    "",
    "Повтора и автоматического отката не будет. После записи потребуется контрольный снимок всех зон.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._dp38FullFrameBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "test_zone8_full_frame_write", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Одна полнокадровая запись отправлена. Снимите контрольный снимок зон 1–8");
  } catch (error) {
    this.notify(this.serviceError(error, "Полнокадровая запись остановлена"));
  } finally {
    this._dp38FullFrameBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0655(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = String(attrs.full_frame_test_status || "idle");
  const allowed = attrs.full_frame_test_allowed === true
    && this.commandAvailable("test_zone8_full_frame_write")
    && !this._dp38FullFrameBusy;
  const tone = status === "confirmed" ? "ok"
    : status === "awaiting_compare" ? "waiting"
      : ["comparison_mismatch", "dispatch_unknown", "blocked"].includes(status) ? "error" : "";
  const card = `<section class="lab dp38FullFrameTest">
    <div class="zone8ProbeHead"><span><small>DP38 · ПОЛНЫЙ КАДР 1–8</small><h3>Дата зоны 8: 04 → 05 сентября</h3></span><b class="${allowed ? "ready" : "blocked"}">${status === "awaiting_compare" ? "Нужна проверка" : "Одна запись"}</b></div>
    <p>В запись входят точные блоки всех восьми зон из свежего исходного снимка. В кадре разрешено изменить только байт 18 зоны 8.</p>
    <div class="fullFrameHex"><span><small>ДО</small><code>${this.esc(attrs.full_frame_test_from_hex || "")}</code></span><span><small>ПОСЛЕ</small><code>${this.esc(attrs.full_frame_test_to_hex || "")}</code></span></div>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite"><small>Результат</small><b>${this.esc(this._fullFrameStatusText(status))}</b>${attrs.full_frame_test_detail ? `<span>${this.esc(attrs.full_frame_test_detail)}</span>` : ""}</div>
    <button type="button" class="zone8ProbeButton" data-zone8-full-frame-test ${allowed ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._dp38FullFrameBusy ? "Проверка…" : "Записать дату 05.09.2026 один раз"}</button>
    <p class="zone8ProbeWarning">Перед записью: контроллер Auto/ON, полив остановлен, свежий исходный снимок 8 из 8. После записи сразу снимите контрольный снимок и откройте зоны 1→8.</p>
  </section>`;
  const content = previousDiagnosticsView.call(this, entities);
  if (content.includes('<section class="lab zone8WriteIncident">')) {
    return content.replace('<section class="lab zone8WriteIncident">', `${card}<section class="lab zone8WriteIncident">`);
  }
  return `${content}${card}`;
};

p._ensureFullFrameEvents = function ensureFullFrameEvents() {
  if (this._fullFrameEventsBound) return;
  this._fullFrameEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone8-full-frame-test]")) this.runZone8FullFrameTest();
  });
};

p._render = function renderV0655() {
  previousRender.call(this);
  this._ensureFullFrameEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0655() {
  return `${previousStyles.call(this)}
    /* UI v0.6.55 — guarded one-shot 160-byte DP38 frame test. */
    .dp38FullFrameTest{display:grid;gap:11px}.dp38FullFrameTest>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.fullFrameHex{display:grid;gap:7px;padding:10px;border-radius:14px;background:var(--soft)}.fullFrameHex span{display:grid;grid-template-columns:48px minmax(0,1fr);gap:7px;align-items:start}.fullFrameHex small{color:var(--muted);font-size:11px;font-weight:800}.fullFrameHex code{overflow-wrap:anywhere;font-size:10.5px;font-weight:800}.dp38SnapshotState.waiting{background:#fff6df;color:#956500}.dp38FullFrameTest>.zone8ProbeButton{min-height:62px}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0656.mjs
{
const UI_VERSION = "0.6.56";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;

p._programSectionName = function programSectionNameV0656() {
  return "zones";
};

p._programZoneNumber = function programZoneNumberV0656() {
  const zone = Number(this._programZone);
  return Number.isInteger(zone) && zone >= 1 && zone <= 8 ? zone : 1;
};

p.programView = function programViewV0656(entities) {
  const zone = this._programZoneNumber();
  const buttons = Array.from({ length: 8 }, (_, index) => index + 1).map((number) => {
    const selected = number === zone;
    return `<button type="button" class="${selected ? "active" : ""}" data-program-zone="${number}" aria-label="Показать программу зоны ${number}" aria-pressed="${selected}">${number}</button>`;
  }).join("");
  return `<nav class="programZoneTabs" aria-label="Выбор зоны">${buttons}</nav>
    <div class="programSectionBody programZoneBody">${this._programZoneForm(entities, zone)}</div>`;
};

p._structureKey = function structureKeyV0656() {
  if (this._view === "program") return `program:zone:${this._programZoneNumber()}`;
  return previousStructureKey.call(this);
};

p.header = function headerV0656() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p._syncProgramHeader = function syncProgramHeaderV0656() {
  const refresh = this.shadowRoot?.querySelector("[data-refresh]");
  if (refresh) refresh.hidden = false;
};

p._ensureProgramZoneTabsEvents = function ensureProgramZoneTabsEvents() {
  if (this._programZoneTabsEventsBound) return;
  this._programZoneTabsEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-program-zone]");
    if (!button) return;
    const zone = Number(button.dataset.programZone);
    if (!Number.isInteger(zone) || zone < 1 || zone > 8 || zone === this._programZoneNumber()) return;
    this._programZone = zone;
    this._pendingScrollTop = 0;
    this.render();
  });
};

p._render = function renderV0656() {
  previousRender.call(this);
  this._ensureProgramZoneTabsEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0656() {
  return `${previousStyles.call(this)}
    /* UI v0.6.56 — direct zone program navigation without redundant sections. */
    .programZoneTabs{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;margin:2px 0 10px;padding:7px;border:1px solid var(--line);border-radius:18px;background:var(--soft);box-shadow:0 5px 16px #11182708}
    .programZoneTabs button{display:grid;place-items:center;min-width:0;min-height:42px;padding:0;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--muted);font-weight:850;cursor:pointer}
    .programZoneTabs button.active{border-color:color-mix(in srgb,var(--a) 30%,var(--line));background:var(--card);color:var(--a);box-shadow:0 3px 10px #11182712}
    .programZoneTabs button:focus-visible{outline:3px solid color-mix(in srgb,var(--a) 28%,transparent);outline-offset:1px}
    .programZoneBody{padding-bottom:72px}.programZoneBody .zoneProgramDetail{margin:0}.programZoneBody .zoneProgramIdentity>small{display:none}.programZoneBody .zoneProgramIdentity{grid-template-rows:auto auto;align-content:center}.programZoneBody .zoneProgramIdentity h2{grid-column:1/3}.programZoneBody .zoneProgramScene.scene7,.programZoneBody .zoneProgramScene.scene8{display:grid!important;place-items:center;background-image:none!important;background-color:var(--soft)!important;color:var(--muted)}.programZoneBody .zoneProgramScene.scene7::after,.programZoneBody .zoneProgramScene.scene8::after{font-size:34px;font-weight:850}.programZoneBody .zoneProgramScene.scene7::after{content:"7"}.programZoneBody .zoneProgramScene.scene8::after{content:"8"}
    @media(max-width:520px){.programZoneTabs{gap:4px;margin-top:1px;padding:5px;border-radius:15px}.programZoneTabs button{min-height:38px;border-radius:10px;font-size:14px}.programZoneBody .zoneProgramDetail{padding-top:12px!important}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0657.mjs
{
const UI_VERSION = "0.6.57";
const CONFIRMATION = "WRITE_DP38_ZONE8_MASK_80_DATE_2026_09_05_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p.commandBusy = function commandBusyV0656() {
  return previousCommandBusy.call(this) || Boolean(this._dp38MaskWriteBusy);
};

p._maskWriteStatusText = function maskWriteStatusText(status) {
  return {
    idle: "Сначала снимите свежий исходный снимок 1–8",
    preflight: "Проверяю снимок и состояние контроллера",
    writing_once: "Отправляется один 20-байтовый блок",
    awaiting_compare: "Запись отправлена — нужен контрольный снимок 1–8",
    confirmed: "Подтверждено: изменилась только дата зоны 8",
    comparison_mismatch: "Контрольный снимок не совпал с ожидаемым результатом",
    dispatch_unknown: "Результат отправки неизвестен — повтор запрещён",
    blocked: "Запись остановлена защитой до отправки",
  }[status] || String(status || "Нет данных");
};

p.runZone8MaskWriteTest = async function runZone8MaskWriteTest() {
  if (this.rejectUnavailableCommand("test_zone8_mask_write")) return;
  const attrs = this.attrs(this.entities().zones[8].schedule);
  if (attrs.mask_write_test_allowed !== true) {
    this.notify("Нужны Auto/ON, остановленный полив и свежий исходный снимок 8 из 8 с датой зоны 8 — 04.09.2026");
    return;
  }
  const message = [
    "Отправить один блок DP38 для зоны 8?",
    "",
    "Первый байт записи: 80 — битовая маска зоны 8.",
    "Передаётся ровно 20 байт; дата меняется 04 → 05 сентября.",
    "",
    "Повтора и автоматического отката не будет. После записи потребуется контрольный снимок всех зон.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._dp38MaskWriteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "test_zone8_mask_write", {
      ...this.serviceTargetData(), confirmation: CONFIRMATION,
    });
    await this.refreshNow();
    this.notify("Один блок с маской 80 отправлен. Снимите контрольный снимок зон 1–8");
  } catch (error) {
    this.notify(this.serviceError(error, "Запись зоны 8 остановлена"));
  } finally {
    this._dp38MaskWriteBusy = false;
    this.render();
  }
};

p.diagnosticsView = function diagnosticsViewV0656(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const status = String(attrs.mask_write_test_status || "idle");
  const allowed = attrs.mask_write_test_allowed === true
    && this.commandAvailable("test_zone8_mask_write")
    && !this._dp38MaskWriteBusy;
  const tone = status === "confirmed" ? "ok"
    : status === "awaiting_compare" ? "waiting"
      : ["comparison_mismatch", "dispatch_unknown", "blocked"].includes(status) ? "error" : "";
  const card = `<section class="lab dp38MaskWriteTest">
    <div class="zone8ProbeHead"><span><small>DP38 · МАСКА ЗОНЫ</small><h3>Дата зоны 8: 04 → 05 сентября</h3></span><b class="${allowed ? "ready" : "blocked"}">${status === "awaiting_compare" ? "Нужна проверка" : "Одна запись"}</b></div>
    <p>Передаётся один блок 20 байт. При чтении первый байт <code>08</code> — номер зоны; при записи <code>80</code> — битовая маска зоны 8.</p>
    <div class="maskWriteHex"><span><small>ИСХОДНЫЙ ОТВЕТ</small><code>${this.esc(attrs.mask_write_test_current_read_hex || "")}</code></span><span><small>ПАКЕТ ЗАПИСИ</small><code>${this.esc(attrs.mask_write_test_payload_hex || "")}</code></span><span><small>ОЖИДАЕМЫЙ ОТВЕТ</small><code>${this.esc(attrs.mask_write_test_expected_read_hex || "")}</code></span></div>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite"><small>Результат</small><b>${this.esc(this._maskWriteStatusText(status))}</b>${attrs.mask_write_test_detail ? `<span>${this.esc(attrs.mask_write_test_detail)}</span>` : ""}</div>
    <button type="button" class="zone8ProbeButton" data-zone8-mask-write-test ${allowed ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._dp38MaskWriteBusy ? "Проверка…" : "Записать дату 05.09.2026 один раз"}</button>
    <p class="zone8ProbeWarning">Перед записью: контроллер Auto/ON, полив остановлен, свежий исходный снимок 8 из 8. После записи сразу снимите контрольный снимок и откройте зоны 1→8.</p>
  </section>`;
  let content = previousDiagnosticsView.call(this, entities);
  content = content.replace(/<section class="lab dp38FullFrameTest">[\s\S]*?<\/section>/, "");
  if (content.includes('<section class="lab zone8WriteIncident">')) {
    return content.replace('<section class="lab zone8WriteIncident">', `${card}<section class="lab zone8WriteIncident">`);
  }
  return `${content}${card}`;
};

p._ensureMaskWriteEvents = function ensureMaskWriteEvents() {
  if (this._maskWriteEventsBound) return;
  this._maskWriteEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone8-mask-write-test]")) this.runZone8MaskWriteTest();
  });
};

p._render = function renderV0656() {
  previousRender.call(this);
  this._ensureMaskWriteEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0656() {
  return `${previousStyles.call(this)}
    /* UI v0.6.57 — one 20-byte DP38 block with the Zone 8 write mask. */
    .dp38MaskWriteTest{display:grid;gap:11px}.dp38MaskWriteTest>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.dp38MaskWriteTest>p code{font-weight:900;color:var(--ink)}.maskWriteHex{display:grid;gap:8px;padding:10px;border-radius:14px;background:var(--soft)}.maskWriteHex span{display:grid;gap:3px}.maskWriteHex small{color:var(--muted);font-size:10px;font-weight:800}.maskWriteHex code{overflow-wrap:anywhere;font-size:10.5px;font-weight:800}.dp38MaskWriteTest>.zone8ProbeButton{min-height:62px}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0658.mjs
{
const UI_VERSION = "0.6.58";
const ASSET_BASE = "/nikas-ho-sc-8w/assets";
const ARTWORK_STORAGE_KEY = "nikas_ho_sc_8w.zone_artwork.v1";
const ARTWORKS = Object.freeze({
  lawn: { label: "Газон", file: "zone-lawn-v2.webp" },
  flowers: { label: "Цветы", file: "zone-flowers-v2.webp" },
  shrubs: { label: "Кустарники", file: "zone-shrubs-v2.webp" },
  greenhouse: { label: "Теплица", file: "zone-greenhouse-v2.webp" },
  none: { label: "Без картинки", file: null },
});
const DEFAULT_ARTWORKS = Object.freeze({
  1: "lawn", 2: "lawn", 3: "lawn", 4: "flowers",
  5: "shrubs", 6: "greenhouse", 7: "none", 8: "none",
});

const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramZoneForm = p._programZoneForm;
const previousRender = p._render;
const previousStyles = p.styles;

p.bottomNav = function bottomNavV0657() {
  const tabs = [
    ["status", "mdi:tune-variant", "Система"],
    ["zones", "mdi:sprinkler", "Зоны"],
    ["program", "mdi:calendar-clock", "Программа"],
    ["manual", "mdi:hand-back-right-outline", "Ручной"],
    ["diagnostics", "mdi:stethoscope", "Диагн."],
  ];
  return `<nav class="bottomNav"><div class="bottomNavInner">${tabs.map(([id, icon, label]) => `<button class="${this._view === id ? "active" : ""}" data-view="${id}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</div></nav>`;
};

p.statusView = function statusViewV0657(entities) {
  const status = this.systemStatus(entities);
  const pressure = this.pressurePresentation(entities);
  const rain = this.rainPresentation(entities);
  const operation = this.state(entities.operation);
  const seasonal = this.state(entities.seasonal);
  const active = [...this.zoneSet(this.state(entities.active))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const queued = [...this.zoneSet(this.state(entities.queued))].map(Number).filter(Boolean).sort((a, b) => a - b);
  const controllerEntity = entities.connection ? ` data-entity="${this.esc(entities.connection)}"` : "";
  const pressureEntity = entities.pressure ? ` data-entity="${this.esc(entities.pressure)}"` : "";
  const rainEntity = entities.rain ? ` data-entity="${this.esc(entities.rain)}"` : "";
  const operationEntity = entities.operation ? ` data-entity="${this.esc(entities.operation)}"` : "";
  const seasonalEntity = entities.seasonal ? ` data-entity="${this.esc(entities.seasonal)}"` : "";
  const queueText = active.length
    ? `Полив: зона ${active.join(", ")}`
    : queued.length ? `Очередь: ${queued.join(" → ")}` : "Зоны 1–6 · по порядку";
  return `<div class="systemCompactScreen">
    <section class="systemOverview ${this.esc(status.tone)}">
      <button class="systemControllerPhoto"${controllerEntity} aria-label="Контроллер HO-SC-8W"></button>
      ${this.connectionIndicator(entities)}
      <div class="systemReadiness"><h1>${this.esc(status.title)}</h1><p>${this.esc(status.sub)}</p></div>
    </section>
    <section class="systemCompactGrid" aria-label="Параметры системы">
      <button class="systemCompactItem"${operationEntity}><ha-icon icon="mdi:autorenew"></ha-icon><span><small>Режим</small><b>${this.esc(this.human("operation", operation))}</b><em>${this.esc(queueText)}</em></span></button>
      <button class="systemCompactItem ${this.esc(rain.tone)}"${rainEntity}><ha-icon icon="${rain.icon}"></ha-icon><span><small>Датчик дождя</small><b>${this.esc(rain.label)}</b><em>${this.esc(rain.detail)}</em></span></button>
      <button class="systemCompactItem"${pressureEntity}><ha-icon icon="mdi:gauge"></ha-icon><span><small>Давление</small><b>${this.esc(pressure.value)}</b><em>Линия полива</em></span></button>
      <button class="systemCompactItem"${seasonalEntity}><ha-icon icon="mdi:percent-outline"></ha-icon><span><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b><em>Общее значение</em></span></button>
    </section>
  </div>`;
};

p._zoneArtworkState = function zoneArtworkState() {
  if (this.__zoneArtworkState) return this.__zoneArtworkState;
  let saved = {};
  try { saved = JSON.parse(window.localStorage.getItem(ARTWORK_STORAGE_KEY) || "{}"); } catch (_error) {}
  this.__zoneArtworkState = Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
    const zone = index + 1;
    const choice = ARTWORKS[saved[zone]] ? saved[zone] : DEFAULT_ARTWORKS[zone];
    return [zone, choice];
  }));
  return this.__zoneArtworkState;
};

p._applyZoneArtwork = function applyZoneArtwork() {
  const state = this._zoneArtworkState();
  for (let zone = 1; zone <= 8; zone += 1) {
    const choice = ARTWORKS[state[zone]] ? state[zone] : DEFAULT_ARTWORKS[zone];
    const artwork = ARTWORKS[choice];
    const image = artwork.file ? `url("${ASSET_BASE}/${artwork.file}?v=${UI_VERSION}")` : "none";
    this.style.setProperty(`--zone-artwork-${zone}`, image);
    this.toggleAttribute(`data-zone-artwork-${zone}-none`, choice === "none");
  }
};

p._setZoneArtwork = function setZoneArtwork(zone, choice) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 8 || !ARTWORKS[choice]) return;
  const state = { ...this._zoneArtworkState(), [zone]: choice };
  this.__zoneArtworkState = state;
  try { window.localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(state)); } catch (_error) {}
  this._applyZoneArtwork();
};

p._programZoneForm = function programZoneFormV0657(entities, zone) {
  const state = this._zoneArtworkState();
  const choice = ARTWORKS[state[zone]] ? state[zone] : DEFAULT_ARTWORKS[zone];
  const options = Object.entries(ARTWORKS).map(([id, artwork]) => {
    const preview = artwork.file
      ? ` style="--artwork-preview:url('${ASSET_BASE}/${artwork.file}?v=${UI_VERSION}')"`
      : "";
    return `<button type="button" class="zoneArtworkOption ${choice === id ? "active" : ""}" data-zone-artwork-choice="${id}" data-zone-artwork-zone="${zone}"${preview}><span class="zoneArtworkPreview ${id === "none" ? "empty" : ""}" aria-hidden="true"></span><b>${artwork.label}</b>${choice === id ? '<ha-icon icon="mdi:check-circle"></ha-icon>' : ""}</button>`;
  }).join("");
  const original = previousProgramZoneForm.call(this, entities, zone);
  const picture = `<button type="button" class="scene scene${zone} zoneProgramScene zoneArtworkButton" data-zone-artwork-open="${zone}" aria-label="Выбрать картинку зоны ${zone}"><span class="zoneArtworkEdit"><ha-icon icon="mdi:image-edit-outline"></ha-icon></span></button>`;
  const form = original.replace(`<span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>`, picture);
  return `${form}<dialog class="zoneArtworkDialog" data-zone-artwork-dialog="${zone}"><form method="dialog" class="zoneArtworkSheet"><div class="zoneArtworkHead"><span><small>ЗОНА ${zone}</small><h3>Выберите картинку</h3></span><button type="submit" aria-label="Закрыть"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="zoneArtworkOptions">${options}</div><p>Выбор хранится только в этом браузере и не изменяет программу контроллера.</p></form></dialog>`;
};

p._ensureZoneArtworkEvents = function ensureZoneArtworkEvents() {
  if (this._zoneArtworkEventsBound) return;
  this._zoneArtworkEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const open = event.target.closest?.("[data-zone-artwork-open]");
    if (open) {
      const dialog = this.shadowRoot.querySelector(`[data-zone-artwork-dialog="${open.dataset.zoneArtworkOpen}"]`);
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }
    const option = event.target.closest?.("[data-zone-artwork-choice]");
    if (!option) return;
    const zone = Number(option.dataset.zoneArtworkZone);
    this._setZoneArtwork(zone, option.dataset.zoneArtworkChoice);
    option.closest("dialog")?.close();
    this.render();
  });
};

p._render = function renderV0657() {
  this._applyZoneArtwork();
  previousRender.call(this);
  this._ensureZoneArtworkEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0657() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small data-ui-version>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0657() {
  return `${previousStyles.call(this)}
    /* UI v0.6.58 — compact System workspace and local zone artwork picker. */
    .scene1{background-image:var(--zone-artwork-1)!important}.scene2{background-image:var(--zone-artwork-2)!important}.scene3{background-image:var(--zone-artwork-3)!important}.scene4{background-image:var(--zone-artwork-4)!important}.scene5{background-image:var(--zone-artwork-5)!important}.scene6{background-image:var(--zone-artwork-6)!important}.scene7{background-image:var(--zone-artwork-7)!important}.scene8{background-image:var(--zone-artwork-8)!important}
    :host([data-zone-artwork-1-none]) .scene1,:host([data-zone-artwork-2-none]) .scene2,:host([data-zone-artwork-3-none]) .scene3,:host([data-zone-artwork-4-none]) .scene4,:host([data-zone-artwork-5-none]) .scene5,:host([data-zone-artwork-6-none]) .scene6,:host([data-zone-artwork-7-none]) .scene7,:host([data-zone-artwork-8-none]) .scene8{background-color:#e8ecef!important}
    :host([data-zone-artwork-7-none]) .zoneProgramScene.scene7::after,:host([data-zone-artwork-8-none]) .zoneProgramScene.scene8::after{display:none}
    .systemCompactScreen{display:grid;gap:10px;padding-bottom:72px}.systemOverview{display:grid;grid-template-columns:minmax(118px,.82fr) minmax(160px,1.18fr);gap:10px;padding:12px;border:1px solid color-mix(in srgb,var(--green) 24%,var(--line));border-radius:22px;background:var(--card);box-shadow:0 7px 22px #1118270b}.systemControllerPhoto{min-height:116px;border:0;border-radius:17px;background:var(--soft) url('${ASSET_BASE}/ho-sc-8w-controller-v4.webp?v=${UI_VERSION}') center/contain no-repeat}.systemOverview>.connectionWrap{align-self:center;width:100%;min-width:0}.systemOverview .systemConnection{width:100%;min-height:58px;padding:12px 14px;border-radius:18px}.systemReadiness{grid-column:1/3;padding:1px 3px 2px}.systemReadiness h1{margin:0;font-size:25px;line-height:1.08}.systemReadiness p{margin:4px 0 0;color:var(--muted);font-size:13px;line-height:1.3}
    .systemCompactGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.systemCompactItem{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;min-height:92px;padding:11px;border:1px solid var(--line);border-radius:17px;background:var(--card);color:var(--text);text-align:left;box-shadow:0 5px 16px #11182708}.systemCompactItem>ha-icon{--mdc-icon-size:29px;color:var(--a)}.systemCompactItem>span{display:grid;gap:2px;min-width:0}.systemCompactItem small,.systemCompactItem b,.systemCompactItem em{display:block}.systemCompactItem small{color:var(--muted);font-size:12px;font-weight:700}.systemCompactItem b{font-size:17px;line-height:1.12}.systemCompactItem em{overflow:hidden;color:var(--muted);font-size:11px;font-style:normal;line-height:1.25;text-overflow:ellipsis}.systemCompactItem.clear>ha-icon,.systemCompactItem.clear b{color:var(--green)}.systemCompactItem.blocked>ha-icon,.systemCompactItem.blocked b{color:var(--orange)}
    .zoneArtworkButton{position:relative;padding:0;cursor:pointer}.zoneArtworkEdit{position:absolute;right:6px;bottom:6px;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#fffffff0;color:var(--a);box-shadow:0 3px 10px #1118272b}.zoneArtworkEdit ha-icon{display:block!important;--mdc-icon-size:20px}.zoneArtworkButton:focus-visible{outline:3px solid color-mix(in srgb,var(--a) 30%,transparent);outline-offset:2px}
    .zoneArtworkDialog{width:min(460px,calc(100vw - 28px));max-height:min(680px,calc(100dvh - 40px));padding:0;border:0;border-radius:23px;background:var(--card);color:var(--text);box-shadow:0 22px 70px #1118274a}.zoneArtworkDialog::backdrop{background:#11182775;backdrop-filter:blur(3px)}.zoneArtworkSheet{display:grid;gap:12px;padding:16px}.zoneArtworkHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.zoneArtworkHead small{color:var(--muted);font-size:11px;font-weight:850;letter-spacing:.1em}.zoneArtworkHead h3{margin:3px 0 0;font-size:21px}.zoneArtworkHead>button{display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:14px;background:var(--soft);color:var(--text)}.zoneArtworkOptions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zoneArtworkOption{position:relative;display:grid;grid-template-columns:58px minmax(0,1fr) 22px;align-items:center;gap:9px;min-height:72px;padding:7px;border:1px solid var(--line);border-radius:16px;background:var(--soft);color:var(--text);text-align:left}.zoneArtworkOption.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:var(--accent-soft)}.zoneArtworkPreview{display:block;width:58px;height:58px;border-radius:12px;background:var(--soft) var(--artwork-preview) center/cover no-repeat}.zoneArtworkPreview.empty{background:#dfe4e8}.zoneArtworkOption b{font-size:13px}.zoneArtworkOption>ha-icon{--mdc-icon-size:21px;color:var(--a)}.zoneArtworkSheet>p{margin:0;color:var(--muted);font-size:11px;line-height:1.35}
    @media(max-width:520px){.systemOverview{grid-template-columns:minmax(105px,.8fr) minmax(145px,1.2fr);gap:8px;padding:10px}.systemControllerPhoto{min-height:104px}.systemReadiness h1{font-size:23px}.systemCompactGrid{gap:7px}.systemCompactItem{grid-template-columns:30px minmax(0,1fr);min-height:88px;padding:9px;gap:7px}.systemCompactItem>ha-icon{--mdc-icon-size:26px}.systemCompactItem b{font-size:15px}.zoneArtworkOptions{grid-template-columns:1fr}.zoneArtworkDialog{max-height:calc(100dvh - 24px)}.zoneArtworkSheet{padding:14px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0659.mjs
{
const UI_VERSION = "0.6.59";
const PHYSICAL_ZONES_STORAGE_KEY = "nikas_ho_sc_8w.physical_zones.v1";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousProgramZoneForm = p._programZoneForm;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;
const previousStatusView = p.statusView;

p._physicalZoneNumbers = function physicalZoneNumbersV0659() {
  if (this.__physicalZoneNumbers) return this.__physicalZoneNumbers;
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(PHYSICAL_ZONES_STORAGE_KEY) || "null"); } catch (_error) {}
  const zones = Array.isArray(saved)
    ? [...new Set(saved.map(Number))].filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8).sort((a, b) => a - b)
    : [];
  this.__physicalZoneNumbers = zones.length ? zones : [1, 2, 3, 4, 5, 6];
  return this.__physicalZoneNumbers;
};

p._togglePhysicalZone = function togglePhysicalZoneV0659(zone) {
  if (!Number.isInteger(zone) || zone < 1 || zone > 8) return;
  const selected = new Set(this._physicalZoneNumbers());
  if (selected.has(zone)) {
    if (selected.size === 1) {
      this.notify("Должна остаться хотя бы одна физическая зона");
      return;
    }
    selected.delete(zone);
  } else {
    selected.add(zone);
  }
  const zones = [...selected].sort((a, b) => a - b);
  this.__physicalZoneNumbers = zones;
  this._manualQueue = (this._manualQueue || []).map(Number).filter((item) => selected.has(item));
  if (this._drillZone && !selected.has(Number(this._drillZone))) this._drillZone = null;
  if (!selected.has(Number(this._programZone))) this._programZone = zones[0];
  try { window.localStorage.setItem(PHYSICAL_ZONES_STORAGE_KEY, JSON.stringify(zones)); } catch (_error) {}
  this.render();
};

p.activeRuntime = function activeRuntimeV0659(entities) {
  const active = [...this.zoneSet(this.state(entities.active))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8)
    .sort((a, b) => a - b);
  if (!active.length) return null;
  const zone = active[0];
  const remainingRaw = this.state(entities.zones[zone]?.remaining);
  const remaining = Number(String(remainingRaw).replace(",", "."));
  return { zone, remaining: Number.isFinite(remaining) && remaining > 0 ? Math.round(remaining) : null };
};

p._nextPhysicalZone = function nextPhysicalZoneV0659(entities) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  for (let offset = 0; offset <= 800; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0, 0);
    const candidates = [];
    for (const zone of this._physicalZoneNumbers()) {
      const runtime = this.zoneRuntime(entities, zone);
      if (this.state(runtime.q.schedule) !== "configured") continue;
      const cycle = this._zoneCyclePresentation(runtime.attrs);
      if (!this._zoneRunsOnDate(day, runtime.attrs, cycle)) continue;
      for (const slot of this._zoneProgramSlots(runtime.attrs)) {
        if (!slot.present || !slot.valid) continue;
        const [hour, minute] = slot.value.split(":").map(Number);
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
        if (at.getTime() > now.getTime()) candidates.push({ zone, at, time: slot.value });
      }
    }
    if (!candidates.length) continue;
    candidates.sort((left, right) => left.at - right.at || left.zone - right.zone);
    const next = candidates[0];
    const dayLabel = offset === 0 ? "Сегодня" : offset === 1 ? "Завтра" : new Intl.DateTimeFormat("ru-RU", {
      weekday: "short", day: "numeric", month: "short",
    }).format(next.at);
    return { ...next, label: `${dayLabel}, ${next.time}` };
  }
  return null;
};

p._systemZoneSummaryCard = function systemZoneSummaryCardV0659(entities) {
  const active = this.activeRuntime(entities);
  if (active) {
    const entity = entities.zones[active.zone]?.remaining || entities.active;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem active"${attribute}><ha-icon icon="mdi:water"></ha-icon><span><small>Активная зона</small><b>Зона ${active.zone}</b><em>${active.remaining ? `Осталось ${active.remaining} мин` : "Полив выполняется"}</em></span></button>`;
  }
  const physical = new Set(this._physicalZoneNumbers());
  const queued = [...this.zoneSet(this.state(entities.queued))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && physical.has(zone))
    .sort((a, b) => a - b);
  if (queued.length) {
    const zone = queued[0];
    const entity = entities.zones[zone]?.schedule || entities.queued;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem"${attribute}><ha-icon icon="mdi:clock-outline"></ha-icon><span><small>Следующая в очереди</small><b>Зона ${zone}</b><em>${queued.length > 1 ? `Далее: ${queued.slice(1).join(" → ")}` : "Ожидает запуска"}</em></span></button>`;
  }
  const next = this._nextPhysicalZone(entities);
  if (next) {
    const entity = entities.zones[next.zone]?.schedule;
    const attribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
    return `<button class="systemCompactItem"${attribute}><ha-icon icon="mdi:calendar-clock"></ha-icon><span><small>Следующая по программе</small><b>Зона ${next.zone}</b><em>${this.esc(next.label)}</em></span></button>`;
  }
  return '<div class="systemCompactItem"><ha-icon icon="mdi:calendar-remove-outline"></ha-icon><span><small>Следующая по программе</small><b>Не запланирована</b><em>Нет ближайших запусков</em></span></div>';
};

p.statusView = function statusViewV0659(entities) {
  if (this._systemSettingsOpen) return this._systemSettingsView(entities);
  const content = previousStatusView.call(this, entities)
    .replace(/<button class="systemCompactItem"[\s\S]*?<\/button>/, this._systemZoneSummaryCard(entities));
  const action = '<button type="button" class="systemSettingsButton" data-system-settings><ha-icon icon="mdi:cog-outline"></ha-icon><span><b>Настройки</b><small>Зоны, картинки и параметры</small></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>';
  const end = content.lastIndexOf("</div>");
  return end < 0 ? `${content}${action}` : `${content.slice(0, end)}${action}${content.slice(end)}`;
};

p._systemSettingsView = function systemSettingsViewV0659(entities) {
  const zones = this._physicalZoneNumbers();
  const buttons = Array.from({ length: 8 }, (_, index) => index + 1).map((zone) => {
    const selected = zones.includes(zone);
    return `<button type="button" class="${selected ? "active" : ""}" data-physical-zone-toggle="${zone}" role="switch" aria-checked="${selected}" aria-label="${selected ? "Скрыть" : "Показать"} зону ${zone}">${zone}</button>`;
  }).join("");
  const artworkRows = zones.map((zone) => `<button type="button" class="settingsArtworkRow" data-zone-artwork-open="${zone}"><span class="scene scene${zone}" aria-hidden="true"></span><span><small>ЗОНА ${zone}</small><b>Картинка зоны</b></span><ha-icon icon="mdi:image-edit-outline"></ha-icon></button>`).join("");
  const seasonal = this.state(entities.seasonal);
  const seasonalAvailable = this.commandAvailable("set_seasonal_adjustment") && !this.bad(seasonal);
  const seasonalValue = this._seasonalDraft === null ? (this.bad(seasonal) ? "" : seasonal) : this._seasonalDraft;
  const rain = this.rainPresentation(entities);
  const overlay = this._zoneArtworkPickerZone
    ? artworkSheet(previousProgramZoneForm.call(this, entities, this._zoneArtworkPickerZone), this._zoneArtworkPickerZone).overlay
    : "";
  return `<div class="settingsScreen">
    <button type="button" class="inlineBack" data-settings-back><ha-icon icon="mdi:arrow-left"></ha-icon>Система</button>
    <div class="pageIntro settingsIntro"><small>НАСТРОЙКИ</small><h2>Параметры автополива</h2><p>Состав зон и оформление хранятся в этом браузере. Сезонная коррекция передаётся контроллеру с подтверждением.</p></div>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ФИЗИЧЕСКИЕ ЗОНЫ</small><b>${zones.length} из 8 подключено</b></span></div><div class="physicalZoneButtons" aria-label="Физически подключённые зоны">${buttons}</div><p>Во всех рабочих вкладках отображаются только отмеченные зоны.</p></section>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ОФОРМЛЕНИЕ</small><b>Картинки зон</b></span></div><div class="settingsArtworkList">${artworkRows}</div></section>
    <section class="settingsCard"><div class="settingsSectionHead"><span><small>ОБЩИЕ ПАРАМЕТРЫ</small><b>Контроллер</b></span></div><div class="settingsParameterGrid">
      <button type="button" data-entity="${this.esc(entities.operation)}"><small>Режим</small><b>${this.esc(this.human("operation", this.state(entities.operation)))}</b></button>
      <button type="button" data-entity="${this.esc(entities.rain)}"><small>Датчик дождя</small><b>${this.esc(rain.label)}</b></button>
    </div><div class="settingsSeasonal"><span><small>Сезонная коррекция</small><em>Общее значение для всех зон</em></span><label><input data-season-value type="number" inputmode="numeric" min="-90" max="100" step="10" value="${this.esc(seasonalValue)}" aria-label="Сезонная коррекция, процентов" ${seasonalAvailable ? "" : "disabled"}><b>%</b></label><button type="button" data-season-apply ${seasonalAvailable ? "" : "disabled"}>${this._seasonalBusy ? "Проверка…" : "Применить"}</button></div></section>
    ${overlay}
  </div>`;
};

p._programZoneNumber = function programZoneNumberV0659() {
  const zones = this._physicalZoneNumbers();
  const selected = Number(this._programZone);
  return zones.includes(selected) ? selected : zones[0];
};

p.programView = function programViewV0659(entities) {
  const zones = this._physicalZoneNumbers();
  const zone = this._programZoneNumber();
  const buttons = zones.map((number) => {
    const selected = number === zone;
    return `<button type="button" class="${selected ? "active" : ""}" data-program-zone="${number}" aria-label="Показать программу зоны ${number}" aria-pressed="${selected}">${number}</button>`;
  }).join("");
  return `<nav class="programZoneTabs" style="--physical-zone-count:${zones.length}" aria-label="Выбор зоны">${buttons}</nav>
    <div class="programSectionBody programZoneBody">${this._programZoneForm(entities, zone)}</div>`;
};

function artworkSheet(markup, zone) {
  const dialogStart = markup.indexOf('<dialog class="zoneArtworkDialog"');
  if (dialogStart < 0) return { form: markup, overlay: "" };
  const form = markup.slice(0, dialogStart);
  if (zone === null) return { form, overlay: "" };
  const dialog = markup.slice(dialogStart);
  const innerStart = dialog.indexOf(">");
  const innerEnd = dialog.lastIndexOf("</dialog>");
  if (innerStart < 0 || innerEnd < 0) return { form, overlay: "" };
  const sheet = dialog.slice(innerStart + 1, innerEnd)
    .replace('<form method="dialog" class="zoneArtworkSheet">', `<section class="zoneArtworkSheet" role="dialog" aria-modal="true" aria-label="Картинка зоны ${zone}">`)
    .replace("</form>", "</section>")
    .replace('type="submit" aria-label="Закрыть"', 'type="button" data-zone-artwork-close aria-label="Закрыть"');
  return {
    form,
    overlay: `<div class="zoneArtworkOverlay" data-zone-artwork-overlay="${zone}" role="presentation">${sheet}</div>`,
  };
}

p._programZoneForm = function programZoneFormV0659(entities, zone) {
  const markup = previousProgramZoneForm.call(this, entities, zone);
  const parts = artworkSheet(markup, null);
  return parts.form.replace(
    /<button type="button" class="scene scene\d+ zoneProgramScene zoneArtworkButton"[\s\S]*?<\/button>/,
    `<span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>`,
  );
};

p._structureKey = function structureKeyV0659() {
  const key = previousStructureKey.call(this);
  if (this._view === "status" && this._systemSettingsOpen) {
    return `status:settings${this._zoneArtworkPickerZone ? `:artwork:${this._zoneArtworkPickerZone}` : ""}`;
  }
  return key;
};

p._closeZoneArtworkPicker = function closeZoneArtworkPickerV0659() {
  if (!this._zoneArtworkPickerZone) return;
  this._zoneArtworkPickerZone = null;
  this.render();
};

p._ensureZoneArtworkOverlayEvents = function ensureZoneArtworkOverlayEventsV0659() {
  if (this._zoneArtworkOverlayEventsBound) return;
  this._zoneArtworkOverlayEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const settings = event.target.closest?.("[data-system-settings]");
    if (settings) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._systemSettingsOpen = true;
      this._pendingScrollTop = 0;
      this.render();
      return;
    }
    const settingsBack = event.target.closest?.("[data-settings-back]");
    if (settingsBack) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._systemSettingsOpen = false;
      this._zoneArtworkPickerZone = null;
      this._pendingScrollTop = 0;
      this.render();
      return;
    }
    const navigation = event.target.closest?.("[data-view]");
    if (navigation && this._systemSettingsOpen) {
      this._systemSettingsOpen = false;
      this._zoneArtworkPickerZone = null;
      if (navigation.dataset.view === "status") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this._pendingScrollTop = 0;
        this.render();
        return;
      }
    }
    const physicalZone = event.target.closest?.("[data-physical-zone-toggle]");
    if (physicalZone) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._togglePhysicalZone(Number(physicalZone.dataset.physicalZoneToggle));
      return;
    }
    const open = event.target.closest?.("[data-zone-artwork-open]");
    if (open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const zone = Number(open.dataset.zoneArtworkOpen);
      if (!Number.isInteger(zone) || zone < 1 || zone > 8) return;
      this._zoneArtworkPickerZone = zone;
      this.render();
      requestAnimationFrame(() => this.shadowRoot.querySelector("[data-zone-artwork-close]")?.focus());
      return;
    }
    const option = event.target.closest?.("[data-zone-artwork-choice]");
    if (option) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const zone = Number(option.dataset.zoneArtworkZone);
      this._setZoneArtwork(zone, option.dataset.zoneArtworkChoice);
      this._zoneArtworkPickerZone = null;
      this.render();
      return;
    }
    const close = event.target.closest?.("[data-zone-artwork-close]");
    const backdrop = event.target.matches?.("[data-zone-artwork-overlay]");
    if (!close && !backdrop) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this._closeZoneArtworkPicker();
  }, true);
  this.shadowRoot.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !this._zoneArtworkPickerZone) return;
    event.preventDefault();
    this._closeZoneArtworkPicker();
  }, true);
};

p.zonesView = function zonesViewV0659(entities) {
  if (this._drillZone) return this.zoneDetail(entities, this._drillZone);
  const zones = this._physicalZoneNumbers();
  const cards = zones.map((zone) => {
    const runtime = this.zoneRuntime(entities, zone);
    const startTimes = runtime.starts.length
      ? `<span class="zoneCardTimes">${this.esc(runtime.start)}</span>`
      : '<span class="zoneCardTimes muted">Нет запусков</span>';
    const entity = runtime.q.schedule ? ` data-entity="${this.esc(runtime.q.schedule)}"` : "";
    return `<button class="zoneCard ${runtime.tone}" data-zone="${zone}"${entity}><span class="scene scene${zone}" aria-hidden="true"></span><span class="zoneCardText"><small>ЗОНА ${zone}</small><b>${this.esc(runtime.label)}</b><em>${this.esc(runtime.duration)} мин</em>${startTimes}</span>${this._zoneIndicators(runtime)}<ha-icon class="zoneChevron" icon="mdi:chevron-right"></ha-icon></button>`;
  }).join("");
  return `<div class="pageIntro"><small>ИСПОЛЬЗУЕМЫЕ ЗОНЫ · ${zones.length}</small><h2>Рабочие зоны</h2><p>Фактическое состояние и программа каждого подключённого канала.</p></div><div class="zoneCards">${cards}</div>`;
};

p.selectedManualZones = function selectedManualZonesV0659() {
  const physical = new Set(this._physicalZoneNumbers());
  return [...new Set(this._manualQueue || [])]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && zone >= 1 && zone <= 8 && physical.has(zone))
    .sort((a, b) => a - b);
};

p.manualView = function manualViewV0659(entities) {
  const runtime = this.activeRuntime(entities);
  const physicalZones = this._physicalZoneNumbers();
  const displayZones = runtime && !physicalZones.includes(runtime.zone)
    ? [...physicalZones, runtime.zone].sort((a, b) => a - b)
    : physicalZones;
  for (const zone of displayZones) {
    if (!Number.isFinite(Number(this._manualDurations?.[zone]))) {
      const duration = Number(this.zoneRuntime(entities, zone).duration || 10);
      this._manualDurations = { ...this._manualDurations, [zone]: duration };
    }
  }
  const localSelection = this._manualQueue || [];
  const selected = new Set(runtime
    ? localSelection.map(Number).filter((zone) => zone >= runtime.zone && physicalZones.includes(zone))
    : localSelection.map(Number).filter((zone) => physicalZones.includes(zone)));
  const watering = Boolean(runtime);
  const cards = displayZones.map((zone) => {
    const item = this.zoneRuntime(entities, zone);
    const active = runtime?.zone === zone;
    const enabled = selected.has(zone) || active;
    const duration = Number(this._manualDurations?.[zone] || item.duration || 10);
    const timeDisabled = !enabled || watering;
    const switchDisabled = watering ? (!active || !this.commandAvailable("skip_current_manual")) : false;
    const switchLabel = active
      ? `Остановить зону ${zone} и перейти к следующей`
      : `${enabled ? "Исключить" : "Включить"} зону ${zone}`;
    return `<article class="manualZoneCard ${enabled ? "selected" : ""} ${active ? "running" : ""}" data-manual-zone-card="${zone}">
      <span class="scene scene${zone}" aria-hidden="true"></span>
      <span class="manualZoneIdentity"><small>ЗОНА ${zone}</small><b>${active ? "Полив" : "Готова"}</b></span>
      <span class="manualDuration" aria-label="Длительность зоны ${zone}">
        <button type="button" class="manualTimeButton" data-queue-step="-1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Уменьшить время зоны ${zone}">−</button>
        <strong>${duration}<small>мин</small></strong>
        <button type="button" class="manualTimeButton" data-queue-step="1" data-queue-id="${zone}" ${timeDisabled ? "disabled" : ""} aria-label="Увеличить время зоны ${zone}">+</button>
      </span>
      <button type="button" class="manualZoneSwitch ${enabled ? "on" : ""}" data-queue-toggle="${zone}" role="switch" aria-checked="${enabled}" ${switchDisabled ? "disabled" : ""} aria-label="${switchLabel}"><span></span></button>
    </article>`;
  }).join("");
  const total = [...selected].reduce((sum, zone) => sum + Number(this._manualDurations?.[zone] || 0), 0);
  const startDisabled = selected.size === 0 || this._manualBusy || !this.commandAvailable("start_manual_queue");
  const topAction = watering
    ? `<button type="button" class="manualStartTop" data-manual-stop ${this._manualBusy || !this.commandAvailable("stop_manual") ? "disabled" : ""}><ha-icon icon="mdi:stop"></ha-icon><span>Стоп всё</span><small>очередь</small></button>`
    : `<button type="button" class="manualStartTop" data-manual-start ${startDisabled ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>Старт</span><small>${total ? `${total} мин` : ""}</small></button>`;
  return `<section class="manualApprovedScreen">
    <div class="manualApprovedIntro">
      <div><small>РУЧНОЙ РЕЖИМ</small><h1>Управление зонами</h1><p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p></div>
      ${topAction}
    </div>
    <div class="manualZoneCards" style="--physical-zone-count:${physicalZones.length}">${cards}</div>
  </section>`;
};

p._render = function renderV0659() {
  previousRender.call(this);
  this._ensureZoneArtworkOverlayEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0659() {
  return `${previousStyles.call(this)}
    /* UI v0.6.59 — stable artwork sheet and complete read-only zone list. */
    .zoneArtworkOverlay{position:fixed;inset:0;z-index:1000;display:grid;align-items:end;justify-items:center;padding:14px;background:#11182775;backdrop-filter:blur(3px)}
    .zoneArtworkOverlay .zoneArtworkSheet{width:min(460px,100%);max-height:calc(100dvh - 28px);overflow:auto;border-radius:23px;background:var(--card);color:var(--text);box-shadow:0 22px 70px #1118274a}
    .systemSettingsButton{position:fixed;z-index:19;left:max(14px,calc((100vw - 892px)/2));right:max(14px,calc((100vw - 892px)/2));bottom:calc(82px + env(safe-area-inset-bottom));display:grid;grid-template-columns:34px minmax(0,1fr) 24px;align-items:center;gap:10px;min-height:58px;padding:9px 14px;border:1px solid color-mix(in srgb,var(--a) 34%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--card) 93%,var(--a) 7%);color:var(--a);text-align:left;box-shadow:0 9px 28px #1118271f;backdrop-filter:blur(16px)}.systemSettingsButton>ha-icon:first-child{--mdc-icon-size:29px}.systemSettingsButton>span{display:grid;gap:1px}.systemSettingsButton b{font-size:16px}.systemSettingsButton small{color:var(--muted);font-size:10px}.systemSettingsButton>ha-icon:last-child{--mdc-icon-size:22px}.settingsScreen{display:grid;gap:10px;padding-bottom:72px}.settingsScreen>.inlineBack{justify-self:start;margin-bottom:0}.settingsIntro{padding-bottom:4px}.settingsCard{display:grid;gap:10px;padding:13px;border:1px solid var(--line);border-radius:19px;background:var(--card);box-shadow:0 5px 16px #11182708}.settingsSectionHead span{display:grid;gap:3px}.settingsSectionHead small{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.09em}.settingsSectionHead b{font-size:17px}.settingsCard>p{margin:0;color:var(--muted);font-size:10px;line-height:1.3}.physicalZoneButtons{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}.physicalZoneButtons button{display:grid;place-items:center;min-width:0;min-height:38px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--muted);font-weight:800}.physicalZoneButtons button.active{border-color:color-mix(in srgb,var(--a) 42%,var(--line));background:var(--accent-soft);color:var(--a)}.settingsArtworkList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.settingsArtworkRow{display:grid;grid-template-columns:54px minmax(0,1fr) 24px;align-items:center;gap:9px;min-height:68px;padding:7px;border:1px solid var(--line);border-radius:15px;background:var(--soft);text-align:left}.settingsArtworkRow .scene{width:54px;height:54px}.settingsArtworkRow>span:nth-child(2){display:grid;gap:2px}.settingsArtworkRow small{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.07em}.settingsArtworkRow b{font-size:13px}.settingsArtworkRow>ha-icon{color:var(--a);--mdc-icon-size:21px}.settingsParameterGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.settingsParameterGrid button{display:grid;gap:3px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--soft);text-align:left}.settingsParameterGrid small,.settingsSeasonal small{color:var(--muted);font-size:10px}.settingsParameterGrid b{font-size:14px}.settingsSeasonal{display:grid;grid-template-columns:minmax(0,1fr) 92px minmax(100px,.8fr);align-items:center;gap:7px}.settingsSeasonal>span{display:grid;gap:2px}.settingsSeasonal em{color:var(--muted);font-size:9px;font-style:normal}.settingsSeasonal label{display:grid;grid-template-columns:1fr auto;align-items:center;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}.settingsSeasonal input{min-width:0;width:100%;border:0;outline:0;background:transparent;color:var(--text);font-size:18px;font-weight:800;text-align:right}.settingsSeasonal button{min-height:42px;border:1px solid color-mix(in srgb,var(--a) 48%,var(--line));border-radius:13px;background:var(--accent-soft);color:var(--a);font-weight:800}.settingsSeasonal button:disabled{opacity:.5}.programZoneTabs{grid-template-columns:repeat(var(--physical-zone-count),minmax(0,1fr))}.manualZoneCards{height:auto!important;grid-template-rows:none!important;grid-auto-rows:minmax(92px,auto)}
    @media(min-width:600px){.zoneArtworkOverlay{align-items:center}}
    @media(max-width:520px){.systemSettingsButton{left:10px;right:10px}.physicalZoneButtons{gap:3px}.physicalZoneButtons button{min-height:34px;border-radius:9px;font-size:13px}.settingsArtworkList{grid-template-columns:1fr}.settingsSeasonal{grid-template-columns:minmax(0,1fr) 78px}.settingsSeasonal>button{grid-column:1/3}.settingsArtworkRow{min-height:64px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0660.mjs
{
const UI_VERSION = "0.6.60";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p._updateNavigationState = function updateNavigationStateV0660() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
  if (!viewport) return;

  // The compact six-zone layouts used to suppress scrolling. The current
  // screens can contain up to eight zones and Settings is taller than Status.
  viewport.classList.remove("zonesFitsViewport", "manualFitsViewport");
  if (this._view === "status" && this._systemSettingsOpen) {
    viewport.classList.remove("statusFitsViewport");
  }
};

p._render = function renderV0660() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0660() {
  return `${previousStyles.call(this)}
    /* UI v0.6.60 — scrollable long views and persistent program-zone tabs. */
    .workViewport.isNative.zonesFitsViewport,
    .workViewport.isNative.manualFitsViewport{overflow-y:auto}
    .workViewport.isNative.statusFitsViewport .settingsScreen{overflow:visible}
    .programZoneTabs{position:sticky;top:0;z-index:18;margin-top:0;background:color-mix(in srgb,var(--bg) 96%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
    .settingsArtworkRow .scene,.settingsScreen .zoneArtworkPreview{background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;background-color:var(--soft)}
    .systemSettingsButton{bottom:calc(68px + env(safe-area-inset-bottom))}
    @media(max-width:520px){.systemSettingsButton{bottom:calc(66px + env(safe-area-inset-bottom))}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0661.mjs
{
const UI_VERSION = "0.6.61";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p._updateNavigationState = function updateNavigationStateV0661() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot?.querySelector("[data-work-viewport]");
  if (!viewport) return;
  const longContent = (this._view === "status" && this._systemSettingsOpen)
    || this._view === "zones"
    || this._view === "manual";
  viewport.classList.toggle("longContentViewport", longContent);
};

p.manualView = function manualViewV0661(entities) {
  return previousManualView.call(this, entities)
    .replace(
      '<button type="button" class="manualStartTop" data-manual-start',
      '<button type="button" class="manualStartTop manualStartWide" data-manual-start',
    )
    .replace('<ha-icon icon="mdi:play"></ha-icon><span>Старт</span>', '<span>Старт полива</span>');
};

p._render = function renderV0661() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0661() {
  return `${previousStyles.call(this)}
    /* UI v0.6.61 — true auto-height scrolling and full-width Manual start. */
    .workViewport.isNative.longContentViewport{overflow-x:hidden;overflow-y:auto}
    .workViewport.isNative.longContentViewport .workCanvas{height:auto;min-height:100%}
    .workViewport.isNative.longContentViewport .workCanvas>.content{height:auto;min-height:100%;padding-bottom:18px}
    .manualApprovedIntro:has(.manualStartWide){grid-template-columns:minmax(0,1fr)}
    .manualStartWide{width:100%;min-width:0;height:52px;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 16px}
    .manualStartWide>span{font-size:19px}.manualStartWide>small:empty{display:none}
    @media(max-width:520px){.workViewport.isNative.longContentViewport .workCanvas>.content{padding-bottom:14px}.manualStartWide{height:48px;border-radius:16px}.manualStartWide>span{font-size:18px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0662.mjs
{
const UI_VERSION = "0.6.62";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStatusView = p.statusView;
const previousStyles = p.styles;
const previousZonesView = p.zonesView;

p._systemWideZoneCard = function systemWideZoneCardV0662(entities) {
  const active = this.activeRuntime(entities);
  const physical = new Set(this._physicalZoneNumbers());
  const queued = [...this.zoneSet(this.state(entities.queued))]
    .map(Number)
    .filter((zone) => Number.isInteger(zone) && physical.has(zone))
    .sort((left, right) => left - right);
  const next = active || queued.length
    ? null
    : this._nextPhysicalZone(entities);
  const zone = active?.zone || queued[0] || next?.zone;

  if (!zone) {
    return `<div class="systemZoneStatus empty"><span class="systemZoneStatusIcon"><ha-icon icon="mdi:calendar-remove-outline"></ha-icon></span><span><small>БЛИЖАЙШИЙ ПОЛИВ</small><b>Не запланирован</b><em>В подключённых зонах нет ближайших запусков</em></span></div>`;
  }

  const runtime = this.zoneRuntime(entities, zone);
  const entity = active
    ? (entities.zones[zone]?.remaining || entities.active || "")
    : (entities.zones[zone]?.schedule || entities.queued || "");
  const entityAttribute = entity ? ` data-entity="${this.esc(entity)}"` : "";
  const kind = active ? "АКТИВНАЯ ЗОНА" : queued.length ? "СЛЕДУЮЩАЯ В ОЧЕРЕДИ" : "СЛЕДУЮЩАЯ ПО ПРОГРАММЕ";
  const state = active ? "Полив выполняется" : queued.length ? "Ожидает запуска" : "Запланирована";
  const timing = active
    ? (active.remaining ? `Осталось ${active.remaining} мин` : `${runtime.duration} мин`)
    : queued.length
      ? `${runtime.duration} мин${queued.length > 1 ? ` · далее ${queued.slice(1).join(" → ")}` : ""}`
      : `${next.label} · ${runtime.duration} мин`;
  return `<button class="systemZoneStatus ${active ? "active" : ""}"${entityAttribute}><span class="scene scene${zone}" aria-hidden="true"></span><span class="systemZoneStatusText"><small>${kind}</small><b>Зона ${zone}</b><strong>${state}</strong><em>${this.esc(timing)}</em></span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
};

p.statusView = function statusViewV0662(entities) {
  if (this._systemSettingsOpen) return previousStatusView.call(this, entities);
  const operation = this.state(entities.operation);
  const operationEntity = entities.operation ? ` data-entity="${this.esc(entities.operation)}"` : "";
  const modeCard = `<button class="systemCompactItem"${operationEntity}><ha-icon icon="mdi:autorenew"></ha-icon><span><small>Режим</small><b>${this.esc(this.human("operation", operation))}</b><em>Зоны ${this._physicalZoneNumbers().join(", ")} · по порядку</em></span></button>`;
  return previousStatusView.call(this, entities)
    .replace(/<button class="systemCompactItem[^"]*"[\s\S]*?<\/button>|<div class="systemCompactItem[^"]*"[\s\S]*?<\/div>/, modeCard)
    .replace('<button type="button" class="systemSettingsButton"', `${this._systemWideZoneCard(entities)}<button type="button" class="systemSettingsButton"`);
};

p.zonesView = function zonesViewV0662(entities) {
  if (this._drillZone) return previousZonesView.call(this, entities);
  return `${previousZonesView.call(this, entities)
    .replace("<p>Фактическое состояние и программа каждого подключённого канала.</p>", "")}<p class="viewFootnote"><b>Примечание.</b> Показаны фактическое состояние и программа каждого подключённого канала.</p>`;
};

p.manualView = function manualViewV0662(entities) {
  return previousManualView.call(this, entities)
    .replace("<p>Включите нужные зоны и задайте длительность.<br>Контроллер выполнит их по порядку сверху вниз.</p>", "")
    .replace("</section>", '<p class="viewFootnote"><b>Примечание.</b> Выберите зоны и задайте длительность. Контроллер выполнит очередь сверху вниз.</p></section>');
};

p._render = function renderV0662() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0662() {
  return `${previousStyles.call(this)}
    /* UI v0.6.62 — top-first zone views and operational System summary. */
    .pageIntro:has(+.zoneCards){padding-bottom:5px}.pageIntro:has(+.zoneCards)>h2{margin-bottom:0}
    .viewFootnote{margin:10px 4px 2px!important;padding:9px 11px;border-radius:13px;background:var(--soft);color:var(--muted);font-size:11px!important;line-height:1.35}.viewFootnote b{color:var(--text)}
    .systemCompactScreen{height:100%;min-height:0;grid-template-rows:auto auto minmax(0,1fr) auto;padding-bottom:4px}
    .systemZoneStatus{align-self:start;display:grid;grid-template-columns:82px minmax(0,1fr) 24px;align-items:center;gap:12px;width:100%;min-height:108px;padding:11px;border:1px solid var(--line);border-radius:19px;background:var(--card);color:var(--text);text-align:left;box-shadow:0 5px 16px #11182708}.systemZoneStatus.active{border-color:color-mix(in srgb,var(--a) 48%,var(--line));background:color-mix(in srgb,var(--a) 5%,var(--card))}.systemZoneStatus>.scene{width:82px;height:82px;border-radius:15px;background-position:center;background-size:cover}.systemZoneStatusText{display:grid;gap:2px;min-width:0}.systemZoneStatusText small{color:var(--muted);font-size:10px!important;font-weight:850;letter-spacing:.08em}.systemZoneStatusText b{font-size:21px;line-height:1.05}.systemZoneStatusText strong{color:var(--green);font-size:14px}.systemZoneStatus.active .systemZoneStatusText strong{color:var(--a)}.systemZoneStatusText em{overflow:hidden;color:var(--muted);font-size:12px!important;font-style:normal;line-height:1.2;text-overflow:ellipsis}.systemZoneStatus>ha-icon{color:var(--a);--mdc-icon-size:23px}.systemZoneStatus.empty{grid-template-columns:58px minmax(0,1fr);min-height:92px}.systemZoneStatus.empty>span:nth-child(2){display:grid;gap:3px}.systemZoneStatus.empty small{color:var(--muted);font-size:10px!important;font-weight:850;letter-spacing:.08em}.systemZoneStatus.empty b{font-size:18px}.systemZoneStatus.empty em{color:var(--muted);font-size:11px!important;font-style:normal}.systemZoneStatusIcon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:var(--soft);color:var(--muted)}.systemZoneStatusIcon ha-icon{--mdc-icon-size:28px}
    .systemSettingsButton{position:static;z-index:auto;align-self:end;width:100%;min-height:56px;margin:0;background:var(--card);box-shadow:0 5px 16px #1118270c;backdrop-filter:none;-webkit-backdrop-filter:none}
    .manualApprovedScreen{height:auto;min-height:100%;grid-template-rows:auto auto auto}.manualApprovedIntro{align-items:start}.manualApprovedIntro>div{align-self:center}
    @media(max-width:520px){.systemZoneStatus{grid-template-columns:70px minmax(0,1fr) 20px;gap:9px;min-height:94px;padding:9px;border-radius:17px}.systemZoneStatus>.scene{width:70px;height:70px;border-radius:13px}.systemZoneStatusText b{font-size:19px}.systemSettingsButton{min-height:52px}.pageIntro:has(+.zoneCards){padding-top:3px}.manualApprovedIntro h1{margin-bottom:1px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0663.mjs
{
const UI_VERSION = "0.6.63";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousConnectionIndicator = p.connectionIndicator;
const previousRender = p._render;
const previousStyles = p.styles;

p.connectionIndicator = function connectionIndicatorV0663(entities) {
  return previousConnectionIndicator.call(this, entities)
    .replace(
      '<span class="systemConnectionMain"><i></i><b>',
      '<i class="systemConnectionLamp" aria-hidden="true"></i><span class="systemConnectionCopy"><b>',
    )
    .replace(
      '</b></span><small class="freshness ',
      '</b><small class="freshness ',
    )
    .replace(
      '</small></button></div>',
      '</small></span></button></div>',
    );
};

p._render = function renderV0663() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0663() {
  return `${previousStyles.call(this)}
    /* UI v0.6.63 — NikaS Specialized Panel UI Standard v2.2 connection plaque. */
    .systemOverview>.connectionWrap{
      align-self:center;
      justify-self:end;
      width:168px;
      min-width:168px;
      max-width:100%;
      text-align:left;
    }
    .systemOverview .systemConnection{
      justify-self:end;
      display:grid;
      grid-template-columns:10px minmax(0,1fr);
      align-items:center;
      column-gap:11px;
      width:168px;
      min-width:168px;
      max-width:100%;
      min-height:58px;
      padding:12px 14px;
      border:1px solid color-mix(in srgb,var(--divider-color,#dfe3e8) 72%,transparent);
      border-radius:18px;
      background:var(--card-background-color,#fff);
      color:var(--disabled-text-color,var(--secondary-text-color,#6f6f72));
      box-shadow:0 4px 14px rgba(0,0,0,.055);
      white-space:nowrap;
    }
    .systemOverview .systemConnectionLamp{
      display:block;
      width:10px;
      height:10px;
      border-radius:50%;
      background:currentColor;
    }
    .systemOverview .systemConnectionCopy{
      display:flex;
      min-width:0;
      flex-direction:column;
      gap:3px;
    }
    .systemOverview .systemConnectionCopy b{
      color:currentColor;
      font-size:16px;
      font-weight:700;
      line-height:1.05;
      white-space:nowrap;
    }
    .systemOverview .systemConnectionCopy .freshness{
      display:block;
      margin:0;
      color:var(--secondary-text-color,#6f6f72);
      font-size:13px!important;
      font-weight:600;
      line-height:1.05;
      white-space:nowrap;
    }
    .systemOverview .systemConnection.ok{
      color:var(--success-color,#43a047);
      background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.reserve{
      color:var(--warning-color,#f6a623);
      background:color-mix(in srgb,var(--warning-color,#f6a623) 10%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--warning-color,#f6a623) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.offline{
      color:var(--error-color,#db4437);
      background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--error-color,#db4437) 30%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnection.unknown{
      color:var(--disabled-text-color,var(--secondary-text-color,#6f6f72));
      background:color-mix(in srgb,var(--secondary-text-color,#6f6f72) 8%,var(--card-background-color,#fff));
      border-color:color-mix(in srgb,var(--secondary-text-color,#6f6f72) 28%,var(--divider-color,#dfe3e8));
    }
    .systemOverview .systemConnectionCopy .freshness.stale{
      color:var(--warning-color,#f6a623);
      font-weight:600;
    }
    .systemOverview .systemConnectionCopy .freshness.nodata{
      color:var(--secondary-text-color,#6f6f72);
    }
    @media(max-width:520px){
      .systemOverview>.connectionWrap,
      .systemOverview .systemConnection{
        width:168px;
        min-width:168px;
        max-width:100%;
      }
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0664.mjs
{
const UI_VERSION = "0.6.64";
const SEASONAL_VALUES = Object.freeze(
  Array.from({ length: 20 }, (_, index) => -90 + index * 10),
);
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;
const previousSystemSettingsView = p._systemSettingsView;

function seasonalOptionLabel(value) {
  if (value > 0) return `+${value} %`;
  if (value < 0) return `−${Math.abs(value)} %`;
  return "0 %";
}

function validSeasonalValue(value) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return SEASONAL_VALUES.includes(numeric) ? numeric : null;
}

p._seasonalSelectMarkup = function seasonalSelectMarkupV0664(entities) {
  const currentRaw = this.state(entities.seasonal);
  const current = validSeasonalValue(currentRaw);
  const draft = this._seasonalDraft === null
    ? current
    : validSeasonalValue(this._seasonalDraft);
  const selected = draft === null ? current : draft;
  const available = current !== null
    && this.commandAvailable("set_seasonal_adjustment");
  const options = SEASONAL_VALUES.map((value) => (
    `<option value="${value}"${value === selected ? " selected" : ""}>${seasonalOptionLabel(value)}</option>`
  )).join("");
  const placeholder = selected === null
    ? '<option value="" selected>Нет данных</option>'
    : "";
  return `<label class="seasonalSelectControl">
    <select data-season-value data-seasonal-select aria-label="Сезонная коррекция, процентов" ${available ? "" : "disabled"}>${placeholder}${options}</select>
    <ha-icon icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
  </label>`;
};

p._systemSettingsView = function systemSettingsViewV0664(entities) {
  return previousSystemSettingsView.call(this, entities).replace(
    /<label><input data-season-value[\s\S]*?<\/label>/,
    this._seasonalSelectMarkup(entities),
  );
};

p._ensureSeasonalSelectEvents = function ensureSeasonalSelectEventsV0664() {
  if (this._seasonalSelectEventsBound) return;
  this._seasonalSelectEventsBound = true;
  this.shadowRoot.addEventListener("change", (event) => {
    const select = event.target.closest?.("[data-seasonal-select]");
    if (!select) return;
    this._seasonalDraft = select.value;
  });
};

p._render = function renderV0664() {
  previousRender.call(this);
  this._ensureSeasonalSelectEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0664() {
  return `${previousStyles.call(this)}
    /* UI v0.6.64 — fixed-value seasonal adjustment selector. */
    .settingsSeasonal{grid-template-columns:minmax(0,1fr) 116px minmax(100px,.8fr)}
    .settingsSeasonal .seasonalSelectControl{
      position:relative;
      display:grid;
      grid-template-columns:minmax(0,1fr) 20px;
      align-items:center;
      min-width:0;
      min-height:42px;
      padding:0 8px 0 10px;
      border:1px solid var(--line);
      border-radius:13px;
      background:var(--soft);
    }
    .settingsSeasonal .seasonalSelectControl:focus-within{
      border-color:var(--a);
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 17%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl select{
      appearance:none;
      -webkit-appearance:none;
      width:100%;
      min-width:0;
      height:40px;
      padding:0;
      border:0;
      outline:0;
      background:transparent;
      color:var(--text);
      font:inherit;
      font-size:18px;
      font-weight:800;
      line-height:1;
      text-align:center;
      text-align-last:center;
    }
    .settingsSeasonal .seasonalSelectControl select:disabled{opacity:.52}
    .settingsSeasonal .seasonalSelectControl select option{
      background:var(--card);
      color:var(--text);
      font-size:18px;
    }
    .settingsSeasonal .seasonalSelectControl ha-icon{
      pointer-events:none;
      color:var(--a);
      --mdc-icon-size:20px;
    }
    .settingsSeasonal .seasonalSelectControl:has(select:disabled) ha-icon{
      color:var(--muted);
      opacity:.52;
    }
    @media(max-width:520px){
      .settingsSeasonal{grid-template-columns:minmax(0,1fr) 116px}
      .settingsSeasonal>button{grid-column:1/3}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0665.mjs
{
const UI_VERSION = "0.6.65";
const FEEDBACK_DURATION_MS = 1500;
const FEEDBACK_KINDS = new Set(["success", "same", "error"]);
const FEEDBACK_CLASSES = Object.freeze([
  "seasonalFeedback-success",
  "seasonalFeedback-same",
  "seasonalFeedback-error",
]);
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

function seasonalValue(value) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return Number.isInteger(numeric)
    && numeric >= -90
    && numeric <= 100
    && numeric % 10 === 0
    ? numeric
    : null;
}

p._currentSeasonalValue = function currentSeasonalValueV0665() {
  return seasonalValue(this.state(this.entities().seasonal));
};

p._syncSeasonalApplyState = function syncSeasonalApplyStateV0665(selectedOverride) {
  const select = this.shadowRoot?.querySelector("[data-seasonal-select]");
  const button = this.shadowRoot?.querySelector("[data-season-apply]");
  if (!select || !button) return;
  const selected = seasonalValue(selectedOverride ?? select.value);
  const current = this._currentSeasonalValue();
  const changed = selected !== null && current !== null && selected !== current;
  const enabled = changed && this.commandAvailable("set_seasonal_adjustment");
  button.disabled = !enabled;
  button.setAttribute("aria-disabled", String(!enabled));
  button.dataset.seasonalChanged = changed ? "true" : "false";
};

p._applySeasonalFeedbackState = function applySeasonalFeedbackStateV0665() {
  const now = Date.now();
  if (this._seasonalFeedbackKind && now >= Number(this._seasonalFeedbackUntil || 0)) {
    this._seasonalFeedbackKind = null;
    this._seasonalFeedbackUntil = 0;
  }
  const control = this.shadowRoot?.querySelector(
    ".settingsSeasonal .seasonalSelectControl",
  );
  if (!control) return;
  control.classList.remove(...FEEDBACK_CLASSES);
  delete control.dataset.seasonalFeedback;
  const kind = this._seasonalFeedbackKind;
  if (!FEEDBACK_KINDS.has(kind)) return;
  control.classList.add(`seasonalFeedback-${kind}`);
  control.dataset.seasonalFeedback = kind;
};

p._clearSeasonalFeedback = function clearSeasonalFeedbackV0665() {
  clearTimeout(this._seasonalFeedbackTimer);
  this._seasonalFeedbackTimer = null;
  this._seasonalFeedbackToken = Number(this._seasonalFeedbackToken || 0) + 1;
  this._seasonalFeedbackKind = null;
  this._seasonalFeedbackUntil = 0;
  this._applySeasonalFeedbackState();
};

p._setSeasonalFeedback = function setSeasonalFeedbackV0665(kind) {
  if (!FEEDBACK_KINDS.has(kind)) return;
  clearTimeout(this._seasonalFeedbackTimer);
  const token = Number(this._seasonalFeedbackToken || 0) + 1;
  this._seasonalFeedbackToken = token;
  this._seasonalFeedbackKind = kind;
  this._seasonalFeedbackUntil = Date.now() + FEEDBACK_DURATION_MS;
  this.render();
  requestAnimationFrame(() => {
    if (this._seasonalFeedbackToken !== token) return;
    this._applySeasonalFeedbackState();
    this._syncSeasonalApplyState();
  });
  this._seasonalFeedbackTimer = setTimeout(() => {
    if (this._seasonalFeedbackToken !== token) return;
    this._seasonalFeedbackKind = null;
    this._seasonalFeedbackUntil = 0;
    this._seasonalFeedbackTimer = null;
    this._applySeasonalFeedbackState();
    this._syncSeasonalApplyState();
  }, FEEDBACK_DURATION_MS + 40);
};

p._ensureSeasonalFeedbackEvents = function ensureSeasonalFeedbackEventsV0665() {
  if (this._seasonalFeedbackEventsBound) return;
  this._seasonalFeedbackEventsBound = true;
  this.shadowRoot.addEventListener("change", (event) => {
    const select = event.target.closest?.("[data-seasonal-select]");
    if (!select) return;
    this._seasonalDraft = select.value;
    const selected = seasonalValue(select.value);
    const current = this._currentSeasonalValue();
    if (selected !== null && current !== null && selected === current) {
      this._setSeasonalFeedback("same");
    } else {
      this._clearSeasonalFeedback();
    }
    this._syncSeasonalApplyState(select.value);
  }, true);
};

p.applySeasonalAdjustment = async function applySeasonalAdjustmentV0665() {
  if (this.rejectUnavailableCommand("set_seasonal_adjustment")) {
    this._setSeasonalFeedback("error");
    return;
  }
  const input = this.shadowRoot.querySelector("[data-season-value]");
  const value = seasonalValue(input?.value ?? this._seasonalDraft);
  if (value === null) {
    this.notify("Сезонная коррекция: от −90% до 100%, шаг 10%");
    input?.focus();
    this._setSeasonalFeedback("error");
    return;
  }
  const currentRaw = this.state(this.entities().seasonal);
  const current = seasonalValue(currentRaw);
  if (current !== null && value === current) {
    this._setSeasonalFeedback("same");
    this._syncSeasonalApplyState(value);
    return;
  }
  if (!window.confirm(`Применить сезонную коррекцию ${value}%?\n\nТекущее значение: ${currentRaw}%.`)) return;
  this._clearSeasonalFeedback();
  this._seasonalBusy = true;
  this.render();
  let feedback = null;
  try {
    await this._hass.callService("nikas_ho_sc_8w", "set_seasonal_adjustment", {
      ...this.serviceTargetData(), value,
    });
    this._seasonalDraft = null;
    await this.refreshNow();
    feedback = "success";
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить сезонную коррекцию"));
    feedback = "error";
  } finally {
    this._seasonalBusy = false;
    if (feedback) this._setSeasonalFeedback(feedback);
    else this.render();
  }
};

p._render = function renderV0665() {
  previousRender.call(this);
  this._ensureSeasonalFeedbackEvents();
  this._applySeasonalFeedbackState();
  this._syncSeasonalApplyState();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0665() {
  return `${previousStyles.call(this)}
    /* UI v0.6.65 — local write feedback and change-gated Apply action. */
    .settingsSeasonal .seasonalSelectControl{
      transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease;
    }
    .settingsSeasonal [data-season-apply]:disabled{
      opacity:1;
      border-color:var(--line);
      background:var(--soft);
      color:var(--muted);
      box-shadow:none;
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-success{
      background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--soft));
      border-color:color-mix(in srgb,var(--success-color,#43a047) 34%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--success-color,#43a047) 12%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-success ha-icon{
      color:var(--success-color,#43a047);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-same{
      background:color-mix(in srgb,var(--a) 7%,var(--soft));
      border-color:color-mix(in srgb,var(--a) 28%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 8%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-error{
      background:color-mix(in srgb,var(--error-color,#db4437) 8%,var(--soft));
      border-color:color-mix(in srgb,var(--error-color,#db4437) 34%,var(--line));
      box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 10%,transparent);
    }
    .settingsSeasonal .seasonalSelectControl.seasonalFeedback-error ha-icon{
      color:var(--error-color,#db4437);
    }
    @media(prefers-reduced-motion:reduce){
      .settingsSeasonal .seasonalSelectControl{transition:none}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0666.mjs
{
const UI_VERSION = "0.6.66";
const EXECUTE_CONFIRMATION = "WRITE_ZONE7_DURATION_17_ONCE";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousCommandBusy = p.commandBusy;
const previousDiagnosticsView = p.diagnosticsView;
const previousManualView = p.manualView;
const previousRender = p._render;
const previousStyles = p.styles;

function labStatus(result) {
  const status = String(result?.status || "idle");
  return {
    idle: "Не подготовлено",
    prepared: "Dry-run подготовлен — запись ещё не выполнялась",
    verified: "Подтверждено полным read-back 1–8",
    mismatch: "Read-back не совпал — дальнейшие записи запрещены",
  }[status] || status;
}

function labTone(result) {
  const status = String(result?.status || "idle");
  if (status === "verified") return "ok";
  if (status === "prepared") return "waiting";
  if (status === "mismatch") return "error";
  return "";
}

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => {
    const offset = Number(item?.offset);
    const field = String(item?.field || "byte");
    const before = String(item?.before ?? item?.source ?? "??");
    const after = String(item?.after ?? item?.target ?? "??");
    return `byte ${Number.isInteger(offset) ? offset : "?"} · ${field}: ${before} → ${after}`;
  }).join("\n");
}

p.manualView = function manualViewV0666(entities) {
  return previousManualView.call(this, entities)
    .replace(
      "<h1>Управление зонами</h1>",
      '<h1>Управление зонами</h1><p class="manualDurationHint">Выберите зоны и задайте длительность полива в минутах.</p>',
    )
    .replace(
      /<strong>(\d+)<small>мин<\/small><\/strong>/g,
      "<strong>$1</strong>",
    )
    .replace(
      '<p class="viewFootnote"><b>Примечание.</b> Выберите зоны и задайте длительность. Контроллер выполнит очередь сверху вниз.</p>',
      '<p class="viewFootnote"><b>Примечание.</b> Контроллер выполнит выбранные зоны по порядку сверху вниз.</p>',
    );
};

p.commandBusy = function commandBusyV0666() {
  return previousCommandBusy.call(this)
    || Boolean(this._zone7LabPrepareBusy)
    || Boolean(this._zone7LabExecuteBusy);
};

p.prepareZone7Duration17 = async function prepareZone7Duration17V0666() {
  if (this.rejectUnavailableCommand("prepare_zone7_duration17")) return;
  this._zone7LabPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_duration17", {
      ...this.serviceTargetData(),
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (result.status === "prepared") {
      this.notify("Dry-run зоны 7 подготовлен. Проверьте HEX и diff перед записью");
    } else {
      this.notify("Dry-run выполнен, но статус плана требует проверки");
    }
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест зоны 7"));
  } finally {
    this._zone7LabPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Duration17 = async function executeZone7Duration17V0666() {
  if (this.rejectUnavailableCommand("execute_zone7_duration17")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const prepared = result.status === "prepared"
    && String(result.field || "") === "duration_minutes"
    && String(result.value || "") === "17";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run зоны 7 = 17 минут");
    return;
  }

  const diffText = formatDiff(result.diff);
  const message = [
    "Выполнить единственную лабораторную запись DP38 зоны 7?",
    "",
    "Цель: длительность зоны 7 = 17 минут.",
    "Перед записью контроллер повторно считает все 8 зон и отменит устаревший план.",
    "После записи будут снова считаны все 8 зон.",
    "",
    `Dry-run:\n${diffText}`,
    "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;

  this._zone7LabExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_duration17", {
      ...this.serviceTargetData(), confirmation: EXECUTE_CONFIRMATION,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (updated.verified === true) {
      this.notify("Зона 7 подтверждена; зоны 1–6 и 8 не изменились");
    } else {
      this.notify("Тест завершён без полного подтверждения — дальнейшие записи не выполнять");
    }
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Запись зоны 7 не подтверждена"));
  } finally {
    this._zone7LabExecuteBusy = false;
    this.render();
  }
};

p._zone7LabCard = function zone7LabCardV0666(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const status = String(result.status || "idle");
  const prepared = status === "prepared"
    && String(result.field || "") === "duration_minutes"
    && String(result.value || "") === "17";
  const prepareAvailable = this.commandAvailable("prepare_zone7_duration17")
    && !this._zone7LabPrepareBusy
    && !this._zone7LabExecuteBusy;
  const executeAvailable = prepared
    && this.commandAvailable("execute_zone7_duration17")
    && !this._zone7LabPrepareBusy
    && !this._zone7LabExecuteBusy;
  const source = result.source_read_hex || plan.source_read_hex || "";
  const write = result.write_hex || plan.write_hex || "";
  const expected = result.expected_read_hex || plan.expected_read_hex || "";
  const actual = result.actual_read_hex || "";
  const collateral = Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет"
    : "—";
  const diff = formatDiff(result.diff || plan.diff);
  const readbackDiff = formatDiff(result.readback_diff);

  return `<section class="lab zone7Dp38Lab">
    <div class="zone8ProbeHead"><span><small>DP38 · ЛАБОРАТОРИЯ</small><h3>Зона 7 · длительность 17 минут</h3></span><b class="${executeAvailable ? "ready" : prepared ? "waiting" : "blocked"}">${prepared ? "Готов к записи" : status === "verified" ? "Подтверждено" : "Dry-run"}</b></div>
    <p>Тест изменяет только длительность свободной зоны 7. Этап «Подготовить» строго read-only. Запись выполняется отдельно и только один раз после повторного снимка всех восьми зон.</p>
    <div class="zone7LabSteps" aria-label="Этапы теста">
      <span class="${status !== "idle" ? "done" : "active"}"><b>1</b><em>Снимок 1–8</em></span>
      <span class="${prepared || status === "verified" || status === "mismatch" ? "active" : ""}"><b>2</b><em>Dry-run</em></span>
      <span class="${status === "verified" ? "done" : status === "mismatch" ? "error" : ""}"><b>3</b><em>Read-back 1–8</em></span>
    </div>
    <div class="maskWriteHex zone7LabHex">
      <span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span>
      <span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span>
      <span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>
      ${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}
    </div>
    <div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div>
    ${result.readback_diff?.length ? `<div class="zone7LabDiff error"><small>READ-BACK MISMATCH</small><pre>${this.esc(readbackDiff)}</pre></div>` : ""}
    <div class="dp38SnapshotState ${labTone(result)}" role="status" aria-live="polite"><small>Статус</small><b>${this.esc(labStatus(result))}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div>
    <div class="zone7LabActions">
      <button type="button" class="zone8ProbeButton secondary" data-zone7-duration17-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7LabPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button>
      <button type="button" class="zone8ProbeButton danger" data-zone7-duration17-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7LabExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button>
    </div>
    <p class="zone8ProbeWarning"><b>Защита.</b> Зоны 1–6 и 8 должны остаться byte-for-byte неизменными. При stale baseline, активном поливе, несовпадении plan или read-back запись считается неподтверждённой и не повторяется.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0666(entities) {
  const card = this._zone7LabCard(entities);
  const content = previousDiagnosticsView.call(this, entities);
  const marker = '<section class="lab dp38MaskWriteTest">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  const incident = '<section class="lab zone8WriteIncident">';
  if (content.includes(incident)) return content.replace(incident, `${card}${incident}`);
  return `${card}${content}`;
};

p._ensureZone7LabEvents = function ensureZone7LabEventsV0666() {
  if (this._zone7LabEventsBound) return;
  this._zone7LabEventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-duration17-prepare]")) {
      this.prepareZone7Duration17();
      return;
    }
    if (event.target.closest?.("[data-zone7-duration17-execute]")) {
      this.executeZone7Duration17();
    }
  });
};

p._render = function renderV0666() {
  previousRender.call(this);
  this._ensureZone7LabEvents();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0666() {
  return `${previousStyles.call(this)}
    /* UI v0.6.66 — one shared minutes explanation and guarded Zone 7 DP38 lab. */
    .manualApprovedIntro .manualDurationHint{margin:5px 0 0;color:var(--muted);font-size:12px!important;line-height:1.3}
    .manualDuration strong{display:grid;place-items:center;min-width:0;font-variant-numeric:tabular-nums}
    .zone7Dp38Lab{display:grid;gap:11px;border-color:color-mix(in srgb,var(--a) 28%,var(--line));background:color-mix(in srgb,var(--a) 2.5%,var(--card))}
    .zone7Dp38Lab>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.zone7Dp38Lab>p b{color:var(--text)}
    .zone7LabSteps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.zone7LabSteps span{display:grid;grid-template-columns:26px minmax(0,1fr);align-items:center;gap:6px;min-height:42px;padding:6px 8px;border:1px solid var(--line);border-radius:12px;background:var(--soft);color:var(--muted)}.zone7LabSteps b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--card);font-size:11px}.zone7LabSteps em{font-size:10px;font-style:normal;font-weight:750;line-height:1.15}.zone7LabSteps span.active{border-color:color-mix(in srgb,var(--a) 38%,var(--line));color:var(--a)}.zone7LabSteps span.done{border-color:color-mix(in srgb,var(--green) 35%,var(--line));color:var(--green)}.zone7LabSteps span.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));color:var(--error-color,#db4437)}
    .zone7LabHex code{font-size:10px;line-height:1.35}.zone7LabDiff{display:grid;gap:4px;padding:9px 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}.zone7LabDiff small{color:var(--muted);font-size:10px;font-weight:850}.zone7LabDiff pre{margin:0;overflow:auto;color:var(--text);font:700 10.5px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.zone7LabDiff.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 5%,var(--card))}
    .zone7LabActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zone7LabActions .zone8ProbeButton{min-height:58px}.zone7LabActions .secondary{background:var(--soft);color:var(--a)}.zone7LabActions .danger:not(:disabled){border-color:color-mix(in srgb,var(--error-color,#db4437) 40%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 7%,var(--card));color:var(--error-color,#db4437)}
    @media(max-width:520px){.manualApprovedIntro .manualDurationHint{margin-top:4px}.zone7LabSteps{grid-template-columns:1fr}.zone7LabActions{grid-template-columns:1fr}.zone7LabActions .zone8ProbeButton{min-height:52px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0667.mjs
{
const UI_VERSION = "0.6.67";
const SNAPSHOT_CONFIRMATION = "DP38_FULL_SNAPSHOT_READ_ONLY";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousSwitchView = p._switchView;
const previousProgramView = p.programView;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const previousStyles = p.styles;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => {
    const offset = Number(item?.offset);
    const field = String(item?.field || "byte");
    const before = String(item?.before ?? item?.source ?? "??");
    const after = String(item?.after ?? item?.target ?? "??");
    return `byte ${Number.isInteger(offset) ? offset : "?"} · ${field}: ${before} → ${after}`;
  }).join("\n");
}

p.commandBusy = function commandBusyV0667() {
  return previousCommandBusy.call(this)
    || Boolean(this._programDp38RefreshBusy)
    || Boolean(this._zone7RainPrepareBusy)
    || Boolean(this._zone7RainExecuteBusy);
};

p.refreshProgramDp38 = async function refreshProgramDp38V0667() {
  if (this._programDp38RefreshBusy) return;
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) {
    this._programDp38RefreshStatus = "unavailable";
    this.render();
    return;
  }
  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(),
      phase: "baseline",
      confirmation: SNAPSHOT_CONFIRMATION,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const snapshot = attrs.dp38_snapshot_baseline || {};
    const complete = Object.keys(snapshot).length === 8;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    this._programDp38RefreshAt = Date.now();
    if (!complete) this.notify("DP38: получен неполный снимок программ");
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._switchView = function switchViewV0667(view) {
  previousSwitchView.call(this, view);
  if (view === "program") queueMicrotask(() => this.refreshProgramDp38());
};

p.programView = function programViewV0667(entities) {
  const content = previousProgramView.call(this, entities);
  const status = String(this._programDp38RefreshStatus || "idle");
  const labels = {
    idle: "Ожидание обновления",
    reading: "Читаю программы 1–8 с контроллера…",
    fresh: "Программы 1–8 получены с контроллера",
    incomplete: "Получен неполный снимок — редактирование DP38 запрещено",
    unavailable: "Native DP38 refresh недоступен",
    error: "Не удалось получить свежие программы — редактирование DP38 запрещено",
  };
  const tone = status === "fresh" ? "ok" : status === "reading" || status === "idle" ? "waiting" : "error";
  const banner = `<section class="programFreshness ${tone}" role="status" aria-live="polite"><ha-icon icon="${status === "fresh" ? "mdi:database-check-outline" : status === "reading" ? "mdi:database-sync-outline" : "mdi:database-alert-outline"}"></ha-icon><span><small>DP38 · АКТУАЛЬНОСТЬ</small><b>${this.esc(labels[status] || status)}</b><em>При подготовке любой записи выполняется отдельный повторный preflight 1–8.</em></span></section>`;
  return `${banner}${content}`;
};

p.prepareZone7RainFalse = async function prepareZone7RainFalseV0667() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7RainPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: "rain_sensor_follow", value: "false",
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (result.status === "prepared" && result.field === "rain_sensor_follow" && String(result.value) === "false") {
      this.notify("Dry-run дождя зоны 7 подготовлен. Проверьте byte 19 перед записью");
    } else {
      this.notify("Dry-run дождя требует проверки; запись не выполняйте");
    }
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Rain Sensor зоны 7"));
  } finally {
    this._zone7RainPrepareBusy = false;
    this.render();
  }
};

p.executeZone7RainFalse = async function executeZone7RainFalseV0667() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared" && String(result.field || "") === "rain_sensor_follow" && String(result.value || "") === "false";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run Rain Sensor зоны 7");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "", "Цель: Rain Sensor Follow = Нет.",
    "Ожидается изменение только low nibble byte 19: 11 → 10.",
    "Перед dispatch будет повторный полный preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "", "Повтора и автоматического rollback не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7RainExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    if (updated.verified === true) this.notify("Rain Sensor зоны 7 подтверждён; соседние зоны не изменились");
    else this.notify("Rain Sensor test не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Rain Sensor test зоны 7 не подтверждён"));
  } finally {
    this._zone7RainExecuteBusy = false;
    this.render();
  }
};

p._zone7RainCard = function zone7RainCardV0667(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const status = String(result.status || "idle");
  const ours = String(result.field || "") === "rain_sensor_follow" && String(result.value || "") === "false";
  const prepared = ours && status === "prepared";
  const verified = ours && status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones) ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7RainLab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · дождь Да → Нет</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>После подтверждённой длительности проверяем только флаг Rain Sensor. Ожидаем единственное информационное изменение в byte 19: <b>11 → 10</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-rain-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7RainPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-rain-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7RainExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0667(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7RainCard(entities);
  const marker = '<section class="lab dp38MaskWriteTest">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${content}${card}`;
};

p._ensureV0667Events = function ensureV0667Events() {
  if (this._v0667EventsBound) return;
  this._v0667EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-rain-prepare]")) { this.prepareZone7RainFalse(); return; }
    if (event.target.closest?.("[data-zone7-rain-execute]")) this.executeZone7RainFalse();
  });
};

p._render = function renderV0667() {
  previousRender.call(this);
  this._ensureV0667Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0667() {
  return `${previousStyles.call(this)}
    .programFreshness{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;margin:0 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
    .programFreshness ha-icon{color:var(--muted)}.programFreshness span{display:grid;gap:1px}.programFreshness small{font-size:9px;font-weight:850;color:var(--muted)}.programFreshness b{font-size:12px}.programFreshness em{font-size:10px;font-style:normal;color:var(--muted);line-height:1.3}
    .programFreshness.ok{border-color:color-mix(in srgb,var(--green) 35%,var(--line));background:color-mix(in srgb,var(--green) 7%,var(--card))}.programFreshness.ok ha-icon,.programFreshness.ok b{color:var(--green)}
    .programFreshness.waiting{border-color:color-mix(in srgb,var(--a) 30%,var(--line))}.programFreshness.waiting ha-icon{color:var(--a)}
    .programFreshness.error{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,var(--line));background:color-mix(in srgb,var(--error-color,#db4437) 6%,var(--card))}.programFreshness.error ha-icon,.programFreshness.error b{color:var(--error-color,#db4437)}
    .zone7RainLab{display:grid;gap:11px;border-color:color-mix(in srgb,var(--green) 25%,var(--line))}.zone7RainLab>p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.zone7RainLab>p b{color:var(--text)}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0668.mjs
{
const UI_VERSION = "0.6.68";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0667 panel is not registered");
const p = Panel.prototype;
const previousProgramView = p.programView;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;
const previousStyles = p.styles;

function readLastFresh() {
  try {
    const value = Number(localStorage.getItem(LAST_FRESH_KEY) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (_) {
    return 0;
  }
}

function rememberLastFresh(value) {
  try { localStorage.setItem(LAST_FRESH_KEY, String(value)); } catch (_) {}
}

function formatSnapshotTime(value) {
  if (!value) return "время полного снимка неизвестно";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "время полного снимка неизвестно";
  const pad = (part) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

p.refreshProgramDp38 = async function refreshProgramDp38V0668() {
  await previousRefreshProgramDp38.call(this);
  if (this._programDp38RefreshStatus === "fresh") {
    const now = Date.now();
    this._programDp38LastFreshAt = now;
    rememberLastFresh(now);
  } else if (!this._programDp38LastFreshAt) {
    this._programDp38LastFreshAt = readLastFresh();
  }
  this.render();
};

p.programView = function programViewV0668(entities) {
  const content = previousProgramView.call(this, entities);
  return content.replace(/<section class="programFreshness[\s\S]*?<\/section>/, "");
};

p._decorateProgramFreshnessV0668 = function decorateProgramFreshnessV0668() {
  const root = this.shadowRoot;
  if (!root) return;
  root.querySelectorAll(".programFreshness").forEach((node) => node.remove());

  const headings = [...root.querySelectorAll("h1,h2,h3,h4")];
  const heading = headings.find((node) => /^Зона\s+[1-8]$/.test((node.textContent || "").trim()));
  if (!heading) return;

  const status = String(this._programDp38RefreshStatus || "idle");
  const fresh = status === "fresh";
  const lastFresh = fresh
    ? (this._programDp38LastFreshAt || Date.now())
    : (this._programDp38LastFreshAt || readLastFresh());

  let line = root.querySelector(".dp38InlineFreshness");
  if (!line) {
    line = document.createElement("span");
    line.className = "dp38InlineFreshness";
  }
  line.classList.toggle("fresh", fresh);
  line.classList.toggle("stale", !fresh);
  line.innerHTML = fresh
    ? `<i></i><b>Данные свежие</b><em>Данные получены: ${formatSnapshotTime(lastFresh)}</em>`
    : `<i></i><b>Данные устарели</b><em>Последний полный снимок: ${formatSnapshotTime(lastFresh)}</em>`;

  const titleArea = heading.parentElement;
  const ready = titleArea ? [...titleArea.querySelectorAll("span,b,div")].find((node) => /^(Готова|Готов|Данные устарели)$/.test((node.textContent || "").trim())) : null;
  if (ready?.parentElement) ready.parentElement.insertAdjacentElement("afterend", line);
  else heading.insertAdjacentElement("afterend", line);

  const section = heading.closest("section") || heading.parentElement?.parentElement;
  if (!section) return;
  section.classList.toggle("dp38SnapshotFresh", fresh);
  section.classList.toggle("dp38SnapshotStale", !fresh);

  const labels = ["Базовая длительность", "Сезонная коррекция", "Повтор", "Дата начала цикла", "Датчик дождя", "Ближайший запуск"];
  for (const node of section.querySelectorAll("small,span,b,div")) {
    const text = (node.textContent || "").trim();
    if (!labels.includes(text)) continue;
    let card = node.parentElement;
    while (card && card !== section && (card.textContent || "").length < 240) {
      if (card.children.length >= 2) break;
      card = card.parentElement;
    }
    if (!card || card === section) continue;
    card.classList.toggle("dp38DataFresh", fresh);
    card.classList.toggle("dp38DataStale", !fresh);
  }
};

p._render = function renderV0668() {
  previousRender.call(this);
  if (!this._programDp38LastFreshAt) this._programDp38LastFreshAt = readLastFresh();
  this._decorateProgramFreshnessV0668();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0668() {
  return `${previousStyles.call(this)}
    .programFreshness{display:none!important}
    .dp38InlineFreshness{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:5px;font-size:11px;line-height:1.25;color:var(--muted)}
    .dp38InlineFreshness i{width:9px;height:9px;border-radius:50%;flex:0 0 9px;background:currentColor}
    .dp38InlineFreshness b{font-size:11px}.dp38InlineFreshness em{font-size:10.5px;font-style:normal;color:var(--muted)}
    .dp38InlineFreshness.fresh{color:var(--green)}
    .dp38InlineFreshness.stale{color:var(--warning-color,#d98200)}
    .dp38DataFresh{background:color-mix(in srgb,var(--green) 6%,var(--card))!important;border-color:color-mix(in srgb,var(--green) 22%,var(--line))!important}
    .dp38DataStale{background:color-mix(in srgb,var(--warning-color,#d98200) 7%,var(--card))!important;border-color:color-mix(in srgb,var(--warning-color,#d98200) 28%,var(--line))!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0669.mjs
{
const UI_VERSION = "0.6.69";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0668 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousDecorateProgramFreshness = p._decorateProgramFreshnessV0668;
const previousRender = p._render;
const previousStyles = p.styles;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

p.refreshProgramDp38 = async function refreshProgramDp38V0669() {
  if (this._programDp38RefreshBusy) return;
  let attempts = 0;
  do {
    attempts += 1;
    await previousRefreshProgramDp38.call(this);
    if (this._programDp38RefreshStatus === "fresh") break;
    if (attempts < 3) await sleep(450);
  } while (attempts < 3);
  this._programDp38RefreshAttempts = attempts;
  this.render();
};

p._decorateProgramFreshnessV0668 = function decorateProgramFreshnessV0669() {
  previousDecorateProgramFreshness.call(this);
  const root = this.shadowRoot;
  if (!root) return;
  const line = root.querySelector(".dp38InlineFreshness");
  if (!line) return;
  const heading = [...root.querySelectorAll("h1,h2,h3,h4")]
    .find((node) => /^Зона\s+[1-8]$/.test((node.textContent || "").trim()));
  if (!heading) return;
  const section = heading.closest("section") || heading.parentElement?.parentElement;
  if (!section) return;
  const headerBlock = [...section.children].find((child) => child.contains?.(heading));
  if (headerBlock && line.parentElement !== section) {
    headerBlock.insertAdjacentElement("afterend", line);
  } else if (line.parentElement !== section) {
    section.prepend(line);
  }
  line.classList.add("fullWidth");
};

p._render = function renderV0669() {
  previousRender.call(this);
  this._decorateProgramFreshnessV0668();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0669() {
  return `${previousStyles.call(this)}
    .dp38InlineFreshness.fullWidth{width:100%;max-width:none;box-sizing:border-box;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:0;grid-column:1/-1;align-self:stretch}
    .dp38InlineFreshness.fullWidth b{white-space:nowrap}
    .dp38InlineFreshness.fullWidth em{min-width:0;flex:1 1 240px;white-space:normal;overflow-wrap:normal;word-break:normal}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0670.mjs
{
const UI_VERSION = "0.6.70";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0669 panel is not registered");
const p = Panel.prototype;
const previousSwitchView = p._switchView;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

p.refreshProgramDp38 = async function refreshProgramDp38V0670() {
  if (this._programSuppressImmediateRefresh) {
    this._programSuppressImmediateRefresh = false;
    if (this._programAutoRefreshTimer) window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = window.setTimeout(() => {
      this._programAutoRefreshTimer = null;
      previousRefreshProgramDp38.call(this);
    }, 900);
    return;
  }
  return previousRefreshProgramDp38.call(this);
};

p._switchView = function switchViewV0670(view) {
  if (view === "program") this._programSuppressImmediateRefresh = true;
  previousSwitchView.call(this, view);
  if (view !== "program" && this._programAutoRefreshTimer) {
    window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = null;
  }
};

p._render = function renderV0670() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0671.mjs
{
const UI_VERSION = "0.6.71";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0670 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotComplete(panel) {
  const schedule = panel.entities()?.zones?.[7]?.schedule;
  const attrs = schedule ? panel.attrs(schedule) : {};
  const snapshot = attrs.dp38_snapshot_baseline || {};
  const zones = Object.keys(snapshot)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 8);
  return new Set(zones).size === 8;
}

function rememberFresh(panel) {
  const now = Date.now();
  panel._programDp38LastFreshAt = now;
  try { localStorage.setItem(LAST_FRESH_KEY, String(now)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0671() {
  if (this._programSuppressImmediateRefresh) {
    this._programSuppressImmediateRefresh = false;
    if (this._programAutoRefreshTimer) window.clearTimeout(this._programAutoRefreshTimer);
    this._programAutoRefreshTimer = window.setTimeout(() => {
      this._programAutoRefreshTimer = null;
      this.refreshProgramDp38();
    }, 900);
    return;
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  let complete = false;
  let attempts = 0;
  try {
    while (attempts < 3 && !complete) {
      attempts += 1;
      // Deliberately use exactly the same HA entity-refresh path as the blue header ↻ button.
      await this.refreshNow();
      await sleep(700);
      complete = snapshotComplete(this);
      if (!complete && attempts < 3) await sleep(500);
    }

    this._programDp38RefreshAttempts = attempts;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this);
    } else {
      this.notify("DP38: автоматическое обновление не получило полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0671() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0672.mjs
{
const UI_VERSION = "0.6.72";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0671 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
  const schedule = panel.entities()?.zones?.[7]?.schedule;
  const state = schedule ? panel.states()?.[schedule] : null;
  const attrs = schedule ? panel.attrs(schedule) : {};
  const snapshot = attrs.dp38_snapshot_baseline || {};
  const zones = Object.keys(snapshot)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 8);
  return {
    complete: new Set(zones).size === 8,
    stamp: String(state?.last_reported || state?.last_updated || state?.last_changed || ""),
  };
}

function rememberFresh(panel) {
  const now = Date.now();
  panel._programDp38LastFreshAt = now;
  try { localStorage.setItem(LAST_FRESH_KEY, String(now)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0672() {
  // Preserve v0670's delayed entry trigger, but replace the actual refresh body.
  if (this._programSuppressImmediateRefresh) {
    return previousRefreshProgramDp38.call(this);
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  const before = snapshotInfo(this);
  let complete = false;
  let elapsedMs = 0;
  try {
    // Exactly the same command as the blue header refresh button.
    await this.refreshNow();

    // update_entity can return before HA has propagated the refreshed entity attributes
    // back to the panel. Wait for a new state stamp and a complete 1–8 snapshot.
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      await sleep(400);
      elapsedMs += 400;
      const current = snapshotInfo(this);
      const newState = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (newState || !before.complete)) {
        complete = true;
        break;
      }
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshWaitMs = elapsedMs;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this);
    } else {
      this.notify("DP38: после обновления не получен новый полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0672() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0673.mjs
{
const UI_VERSION = "0.6.73";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0672 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
  // Full DP38 snapshot metadata is intentionally exposed by the zone-8 schedule entity.
  const schedule = panel.entities()?.zones?.[8]?.schedule;
  const attrs = schedule ? panel.attrs(schedule) : {};
  return {
    complete: attrs.dp38_snapshot_baseline_available === true,
    stamp: String(attrs.dp38_snapshot_baseline_at || ""),
  };
}

function rememberFresh(panel, stamp) {
  const parsed = stamp ? Date.parse(stamp) : NaN;
  const at = Number.isFinite(parsed) ? parsed : Date.now();
  panel._programDp38LastFreshAt = at;
  try { localStorage.setItem(LAST_FRESH_KEY, String(at)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0673() {
  // Preserve the existing delayed entry trigger, replacing only the snapshot validation.
  if (this._programSuppressImmediateRefresh) {
    return previousRefreshProgramDp38.call(this);
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  const before = snapshotInfo(this);
  let complete = false;
  let elapsedMs = 0;
  let acceptedStamp = "";
  try {
    // Exactly the same read path as the working blue header refresh button.
    await this.refreshNow();

    // Wait for the backend's canonical full-snapshot timestamp to advance.
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      await sleep(400);
      elapsedMs += 400;
      const current = snapshotInfo(this);
      const newSnapshot = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (newSnapshot || !before.complete)) {
        complete = true;
        acceptedStamp = current.stamp;
        break;
      }
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshWaitMs = elapsedMs;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this, acceptedStamp);
    } else {
      this.notify("DP38: после обновления backend не подтвердил новый полный снимок 1–8");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически обновить программы 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0673() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0674.mjs
{
const UI_VERSION = "0.6.74";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0673 panel is not registered");
const p = Panel.prototype;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function snapshotInfo(panel) {
  const schedule = panel.entities()?.zones?.[8]?.schedule;
  const attrs = schedule ? panel.attrs(schedule) : {};
  return {
    complete: attrs.dp38_snapshot_baseline_available === true,
    stamp: String(attrs.dp38_snapshot_baseline_at || ""),
  };
}

function rememberFresh(panel, stamp) {
  const parsed = stamp ? Date.parse(stamp) : NaN;
  const at = Number.isFinite(parsed) ? parsed : Date.now();
  panel._programDp38LastFreshAt = at;
  try { localStorage.setItem(LAST_FRESH_KEY, String(at)); } catch (_) {}
}

p.refreshProgramDp38 = async function refreshProgramDp38V0674() {
  // Keep the delayed entry trigger from the prior UI layer.
  if (this._programSuppressImmediateRefresh) {
    return previousRefreshProgramDp38.call(this);
  }
  if (this._programDp38RefreshBusy) return;

  this._programDp38RefreshBusy = true;
  this._programDp38RefreshStatus = "reading";
  this.render();

  const before = snapshotInfo(this);
  let complete = false;
  let acceptedStamp = "";
  try {
    // Use the exact read-only backend operation proven by the manual 1–8 snapshot button.
    // The service itself waits while the controller emits all DP38 blocks; on this device
    // that normally takes about 10–15 seconds.
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(),
      phase: "baseline",
      confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });

    // Ask HA to publish the newly stored backend attributes, then allow a short
    // propagation window for the zone-8 schedule entity to reach the panel.
    await this.refreshNow();
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      const current = snapshotInfo(this);
      const advanced = current.stamp && current.stamp !== before.stamp;
      if (current.complete && (advanced || !before.complete)) {
        complete = true;
        acceptedStamp = current.stamp;
        break;
      }
      await sleep(400);
    }

    this._programDp38RefreshAttempts = 1;
    this._programDp38RefreshStatus = complete ? "fresh" : "incomplete";
    if (complete) {
      rememberFresh(this, acceptedStamp);
    } else {
      this.notify("DP38: полный снимок 1–8 завершён, но его метаданные ещё не появились в панели");
    }
  } catch (error) {
    this._programDp38RefreshStatus = "error";
    this.notify(this.serviceError(error, "Не удалось автоматически получить полный снимок программ 1–8"));
  } finally {
    this._programDp38RefreshBusy = false;
    this.render();
  }
};

p._render = function renderV0674() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0675.mjs
{
const UI_VERSION = "0.6.75";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0674 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0675() {
  return previousCommandBusy.call(this)
    || Boolean(this._zone7StartPrepareBusy)
    || Boolean(this._zone7StartExecuteBusy);
};

p.prepareZone7Start0630 = async function prepareZone7Start0630V0675() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7StartPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: "start_time_1", value: "06:30",
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared"
      && result.field === "start_time_1"
      && String(result.value) === "06:30";
    this.notify(ok
      ? "Dry-run запуска 06:30 подготовлен. Проверьте byte 2 и byte 8"
      : "Dry-run запуска требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест запуска 06:30 зоны 7"));
  } finally {
    this._zone7StartPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Start0630 = async function executeZone7Start0630V0675() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared"
    && result.field === "start_time_1"
    && String(result.value) === "06:30";
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run Z7 Запуск 1 = 06:30");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Цель: Запуск 1 = 06:30.",
    "Ожидается: byte 2 FF → 06 и byte 8 FF → 1E.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7StartExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true
      ? "Запуск 1 зоны 7 = 06:30 подтверждён; соседние зоны не изменились"
      : "Тест запуска не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест запуска 06:30 зоны 7 не подтверждён"));
  } finally {
    this._zone7StartExecuteBusy = false;
    this.render();
  }
};

p._zone7Start0630Card = function zone7Start0630CardV0675(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === "start_time_1" && String(result.value || "") === "06:30";
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7StartLab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Запуск 1 → 06:30</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Первый тест банка времени. Разрешён только при шести пустых слотах Z7. Ожидаем <b>byte 2: FF → 06</b> и <b>byte 8: FF → 1E</b>; остальные информационные байты должны сохраниться.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-start-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7StartPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-start-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7StartExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0675(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Start0630Card(entities);
  const marker = '<section class="lab zone7RainLab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0675Events = function ensureV0675Events() {
  if (this._v0675EventsBound) return;
  this._v0675EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-start-prepare]")) { this.prepareZone7Start0630(); return; }
    if (event.target.closest?.("[data-zone7-start-execute]")) this.executeZone7Start0630();
  });
};

p._render = function renderV0675() {
  previousRender.call(this);
  this._ensureV0675Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0676.mjs
{
const UI_VERSION = "0.6.76";
const TARGET_VALUE = "06:30,12:45";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0675 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0676() {
  return previousCommandBusy.call(this)
    || Boolean(this._zone7Start2PrepareBusy)
    || Boolean(this._zone7Start2ExecuteBusy);
};

p.prepareZone7Start2_1245 = async function prepareZone7Start2_1245V0676() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7Start2PrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: "start_time_1", value: TARGET_VALUE,
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared"
      && result.field === "start_time_1"
      && String(result.value) === TARGET_VALUE;
    this.notify(ok
      ? "Dry-run второго запуска 12:45 подготовлен. Проверьте byte 3 и byte 9"
      : "Dry-run второго запуска требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест второго запуска 12:45 зоны 7"));
  } finally {
    this._zone7Start2PrepareBusy = false;
    this.render();
  }
};

p.executeZone7Start2_1245 = async function executeZone7Start2_1245V0676() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared"
    && result.field === "start_time_1"
    && String(result.value) === TARGET_VALUE;
  if (!prepared) {
    this.notify("Сначала подготовьте актуальный dry-run Z7: 06:30 + 12:45");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Текущее ожидаемое состояние: Запуск 1 = 06:30.",
    "Цель: добавить Запуск 2 = 12:45.",
    "Ожидается: byte 3 FF → 0C и byte 9 FF → 2D.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7Start2ExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true
      ? "Запуск 2 зоны 7 = 12:45 подтверждён; соседние зоны не изменились"
      : "Тест второго запуска не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест второго запуска 12:45 зоны 7 не подтверждён"));
  } finally {
    this._zone7Start2ExecuteBusy = false;
    this.render();
  }
};

p._zone7Start2Card = function zone7Start2CardV0676(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === "start_time_1" && String(result.value || "") === TARGET_VALUE;
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7Start2Lab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Запуск 2 → 12:45</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Проверяем независимость второго временного слота. Разрешено только если свежий Z7 содержит <b>Запуск 1 = 06:30</b>, а слоты 2–6 пусты. Ожидаем только <b>byte 3: FF → 0C</b> и <b>byte 9: FF → 2D</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-start2-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7Start2PrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-start2-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7Start2ExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0676(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Start2Card(entities);
  const marker = '<section class="lab zone7StartLab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0676Events = function ensureV0676Events() {
  if (this._v0676EventsBound) return;
  this._v0676EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-start2-prepare]")) { this.prepareZone7Start2_1245(); return; }
    if (event.target.closest?.("[data-zone7-start2-execute]")) this.executeZone7Start2_1245();
  });
};

p._render = function renderV0676() {
  previousRender.call(this);
  this._ensureV0676Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0677.mjs
{
const UI_VERSION = "0.6.77";
const TARGET_VALUE = "06:30,12:45,23:59";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0676 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0677() {
  return previousCommandBusy.call(this) || Boolean(this._zone7Start3PrepareBusy) || Boolean(this._zone7Start3ExecuteBusy);
};

p.prepareZone7Start3_2359 = async function prepareZone7Start3_2359V0677() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7Start3PrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", { ...this.serviceTargetData(), field: "start_time_1", value: TARGET_VALUE });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared" && result.field === "start_time_1" && String(result.value) === TARGET_VALUE;
    this.notify(ok ? "Dry-run третьего запуска 23:59 подготовлен. Проверьте byte 4 и byte 10" : "Dry-run третьего запуска требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест третьего запуска 23:59 зоны 7"));
  } finally {
    this._zone7Start3PrepareBusy = false;
    this.render();
  }
};

p.executeZone7Start3_2359 = async function executeZone7Start3_2359V0677() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared" && result.field === "start_time_1" && String(result.value) === TARGET_VALUE;
  if (!prepared) { this.notify("Сначала подготовьте актуальный dry-run Z7: 06:30 + 12:45 + 23:59"); return; }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) { this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена"); return; }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Текущее ожидаемое состояние: Запуск 1 = 06:30, Запуск 2 = 12:45.",
    "Цель: добавить Запуск 3 = 23:59.",
    "Ожидается: byte 4 FF → 17 и byte 10 FF → 3B.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7Start3ExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", { ...this.serviceTargetData(), plan_id: planId, confirmation });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true ? "Запуск 3 зоны 7 = 23:59 подтверждён; соседние зоны не изменились" : "Тест третьего запуска не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест третьего запуска 23:59 зоны 7 не подтверждён"));
  } finally {
    this._zone7Start3ExecuteBusy = false;
    this.render();
  }
};

p._zone7Start3Card = function zone7Start3CardV0677(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === "start_time_1" && String(result.value || "") === TARGET_VALUE;
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones) ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7Start3Lab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Запуск 3 → 23:59</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Проверяем третий слот и граничные значения времени. Разрешено только если свежий Z7 содержит <b>06:30</b> и <b>12:45</b>, а слоты 3–6 пусты. Ожидаем только <b>byte 4: FF → 17</b> и <b>byte 10: FF → 3B</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-start3-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7Start3PrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-start3-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7Start3ExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0677(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Start3Card(entities);
  const marker = '<section class="lab zone7Start2Lab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0677Events = function ensureV0677Events() {
  if (this._v0677EventsBound) return;
  this._v0677EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-start3-prepare]")) { this.prepareZone7Start3_2359(); return; }
    if (event.target.closest?.("[data-zone7-start3-execute]")) this.executeZone7Start3_2359();
  });
};

p._render = function renderV0677() {
  previousRender.call(this);
  this._ensureV0677Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0678.mjs
{
const UI_VERSION = "0.6.78";
const TARGET_FIELD = "cycle_value";
const TARGET_VALUE = "2";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0677 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0678() {
  return previousCommandBusy.call(this) || Boolean(this._zone7Interval2PrepareBusy) || Boolean(this._zone7Interval2ExecuteBusy);
};

p.prepareZone7Interval2 = async function prepareZone7Interval2V0678() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7Interval2PrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", { ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const ok = result.status === "prepared" && result.field === TARGET_FIELD && String(result.value) === TARGET_VALUE;
    this.notify(ok ? "Dry-run периода 2 дня подготовлен. Ожидается только byte 15: 01 → 02" : "Dry-run периода требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест периода 2 дня зоны 7"));
  } finally {
    this._zone7Interval2PrepareBusy = false;
    this.render();
  }
};

p.executeZone7Interval2 = async function executeZone7Interval2V0678() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const prepared = result.status === "prepared" && result.field === TARGET_FIELD && String(result.value) === TARGET_VALUE;
  if (!prepared) { this.notify("Сначала подготовьте актуальный dry-run Z7: Каждый день → Каждые 2 дня"); return; }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) { this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена"); return; }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Текущее состояние: интервальный режим, период 1 день (Каждый день).",
    "Цель: период 2 дня (Каждые 2 дня).",
    "Ожидается единственное информационное изменение: byte 15 01 → 02.",
    "byte 14 (режим 03), длительность, времена, дата и дождь должны сохраниться.",
    "Перед записью будет свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7Interval2ExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", { ...this.serviceTargetData(), plan_id: planId, confirmation });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(updated.verified === true ? "Период зоны 7 = 2 дня подтверждён; соседние зоны не изменились" : "Тест периода не получил полного подтверждения — дальнейшие записи запрещены");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест периода 2 дня зоны 7 не подтверждён"));
  } finally {
    this._zone7Interval2ExecuteBusy = false;
    this.render();
  }
};

p._zone7Interval2Card = function zone7Interval2CardV0678(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified";
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones) ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  return `<section class="lab zone7Interval2Lab"><div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Каждый день → Каждые 2 дня</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : "Dry-run"}</b></div><p>Проверяем только значение интервального периода. Исходный Z7 должен точно соответствовать состоянию после подтверждённых тестов: 17 мин, старты <b>06:30 / 12:45 / 23:59</b>, mode <b>03</b>, period <b>01</b>, дата 03.09.2026, дождь выключен. Ожидаем только <b>byte 15: 01 → 02</b>.</p>${source ? `<div class="maskWriteHex zone7LabHex"><span><small>ИСХОДНЫЙ READ · Z7</small><code>${this.esc(source)}</code></span><span><small>WRITE · MASK 40</small><code>${this.esc(write)}</code></span><span><small>ОЖИДАЕМЫЙ READ · Z7</small><code>${this.esc(expected)}</code></span>${actual ? `<span><small>ФАКТИЧЕСКИЙ READ · Z7</small><code>${this.esc(actual)}</code></span>` : ""}</div>` : ""}<div class="zone7LabDiff"><small>ПОБАЙТОВЫЙ DIFF</small><pre>${this.esc(diff)}</pre></div><div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span></div><div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-interval2-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7Interval2PrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-interval2-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7Interval2ExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div></section>`;
};

p.diagnosticsView = function diagnosticsViewV0678(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7Interval2Card(entities);
  const marker = '<section class="lab zone7Start3Lab">';
  if (content.includes(marker)) return content.replace(marker, `${card}${marker}`);
  return `${card}${content}`;
};

p._ensureV0678Events = function ensureV0678Events() {
  if (this._v0678EventsBound) return;
  this._v0678EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-interval2-prepare]")) { this.prepareZone7Interval2(); return; }
    if (event.target.closest?.("[data-zone7-interval2-execute]")) this.executeZone7Interval2();
  });
};

p._render = function renderV0678() {
  previousRender.call(this);
  this._ensureV0678Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0679.mjs
{
const UI_VERSION = "0.6.79";
const TARGET_FIELD = "anchor_date";
const TARGET_VALUE = "2026-09-04";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0678 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

p.commandBusy = function commandBusyV0679() {
  return previousCommandBusy.call(this) || Boolean(this._zone7AnchorDatePrepareBusy) || Boolean(this._zone7AnchorDateExecuteBusy);
};

p.prepareZone7AnchorDate = async function prepareZone7AnchorDateV0679() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7AnchorDatePrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const result = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(isOurs(result) && result.status === "prepared"
      ? "Dry-run даты 04.09.2026 подготовлен. Проверьте byte 18: 03 → 04"
      : "Dry-run даты требует проверки; запись не выполняйте");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест даты зоны 7"));
  } finally {
    this._zone7AnchorDatePrepareBusy = false;
    this.render();
  }
};

p.executeZone7AnchorDate = async function executeZone7AnchorDateV0679() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!isOurs(result) || result.status !== "prepared") {
    this.notify("Сначала подготовьте актуальный dry-run Z7: дата 03.09 → 04.09.2026");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Дата начала цикла: 03.09.2026 → 04.09.2026.",
    "Ожидается только byte 18: 03 → 04 и служебный selector 07 → 40.",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, интервал 2 дня, дождь выключен.",
    "При периоде 2 дня новая опорная дата сдвигает календарные дни полива.",
    "Запись разрешена только при отсутствии активного полива и очереди, в Auto/ON.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7AnchorDateExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    const verified = isOurs(updated) && updated.plan_id === planId && updated.verified === true;
    this.notify(verified
      ? "Дата зоны 7 = 04.09.2026 подтверждена; соседние зоны не изменились"
      : "Тест даты не получил полного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест даты зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7AnchorDateExecuteBusy = false;
    this.render();
  }
};

p._zone7AnchorDateCard = function zone7AnchorDateCardV0679(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const status = ours ? String(result.status || "idle") : "idle";
  const prepared = status === "prepared";
  const verified = status === "verified" && result.verified === true;
  const failed = ["blocked", "mismatch", "failed"].includes(status);
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7AnchorDateLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Дата 03.09 → 04.09.2026</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Проверяем только день опорной даты. Исходный Z7: <b>17 мин</b>, старты <b>06:30 / 12:45 / 23:59</b>, интервал <b>2 дня</b>, дата <b>03.09.2026</b>, дождь выключен. Ожидаем <b>byte 18: 03 → 04</b>. Год, месяц и остальные параметры сохраняются.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run подготовлен — запись ещё не выполнялась" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-anchor-date-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7AnchorDatePrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-anchor-date-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7AnchorDateExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Защита.</b> Нужны Auto/ON, отсутствие активного полива и очереди. Зоны 1–6 и 8 должны остаться побайтно неизменными. При периоде 2 дня смена опорной даты сдвигает календарные дни полива.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0679(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7AnchorDateCard(entities);
  const marker = '<section class="lab zone7Interval2Lab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0679Events = function ensureV0679Events() {
  if (this._v0679EventsBound) return;
  this._v0679EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-anchor-date-prepare]")) { this.prepareZone7AnchorDate(); return; }
    if (event.target.closest?.("[data-zone7-anchor-date-execute]")) this.executeZone7AnchorDate();
  });
};

p._render = function renderV0679() {
  previousRender.call(this);
  this._ensureV0679Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0680.mjs
{
const UI_VERSION = "0.6.80";
const TARGET_FIELD = "cycle_mode";
const TARGET_VALUE = "weekly";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF03021A090410";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00021A090410";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00021A090410";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0679 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;

function formatDiff(diff) {
  if (!Array.isArray(diff) || !diff.length) return "Нет изменений";
  return diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n");
}

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 14 && String(diff[1]?.before) === "03" && String(diff[1]?.after) === "00";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0680() {
  return previousCommandBusy.call(this) || Boolean(this._zone7WeeklyPrepareBusy) || Boolean(this._zone7WeeklyExecuteBusy);
};

p.prepareZone7Weekly = async function prepareZone7WeeklyV0680() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7WeeklyPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run Weekly подготовлен. Проверьте: только byte 14: 03 → 00"
      : "Dry-run Weekly не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Interval → Weekly зоны 7"));
  } finally {
    this._zone7WeeklyPrepareBusy = false;
    this.render();
  }
};

p.executeZone7Weekly = async function executeZone7WeeklyV0680() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run Interval → Weekly не подтверждён — запись запрещена");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Режим: Интервал (03) → Недельный (00).",
    "byte 15 остаётся 02. По APK-карте в Weekly это маска только понедельника.",
    "Ожидается единственное информационное изменение: byte 14 03 → 00.",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, byte 15=02, дата 04.09.2026, дождь выключен.",
    "Этот опыт подтверждает код режима 00. Семантику битов дней недели проверим отдельным следующим тестом.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7WeeklyExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Weekly mode зоны 7 подтверждён: byte 14 = 00; соседние зоны не изменились"
      : "Weekly-тест не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Weekly-тест зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7WeeklyExecuteBusy = false;
    this.render();
  }
};

p._zone7WeeklyCard = function zone7WeeklyCardV0680(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7WeeklyLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Интервал → По дням недели</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Изолируем <b>byte 14</b>. Текущий Z7 должен быть: 17 мин, <b>06:30 / 12:45 / 23:59</b>, interval <b>2 дня</b>, дата <b>04.09.2026</b>, дождь выключен. Цель — weekly mode <b>00</b>. <b>byte 15 остаётся 02</b>; по APK-гипотезе это понедельник. Ожидаем только <b>byte 14: 03 → 00</b>.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-weekly-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7WeeklyPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-weekly-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7WeeklyExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> Этот тест подтверждает сохранение режима <b>00</b> контроллером. Битовое соответствие дней недели будет физически проверено следующим отдельным изменением byte 15.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0680(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7WeeklyCard(entities);
  const marker = '<section class="lab zone7AnchorDateLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0680Events = function ensureV0680Events() {
  if (this._v0680EventsBound) return;
  this._v0680EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-weekly-prepare]")) { this.prepareZone7Weekly(); return; }
    if (event.target.closest?.("[data-zone7-weekly-execute]")) this.executeZone7Weekly();
  });
};

p._render = function renderV0680() {
  previousRender.call(this);
  this._ensureV0680Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0681.mjs
{
const UI_VERSION = "0.6.81";
const TARGET_FIELD = "weekdays";
const TARGET_VALUE = "tue";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF00021A090410";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00041A090410";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00041A090410";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0680 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;
const formatDiff = (diff) => Array.isArray(diff) && diff.length
  ? diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n")
  : "Нет изменений";

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 15 && String(diff[1]?.before) === "02" && String(diff[1]?.after) === "04";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0681() {
  return previousCommandBusy.call(this) || Boolean(this._zone7TuePrepareBusy) || Boolean(this._zone7TueExecuteBusy);
};

p.prepareZone7Tuesday = async function prepareZone7TuesdayV0681() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7TuePrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run Пн → Вт подготовлен. Проверьте: только byte 15: 02 → 04"
      : "Dry-run недельной маски не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Пн → Вт зоны 7"));
  } finally {
    this._zone7TuePrepareBusy = false;
    this.render();
  }
};

p.executeZone7Tuesday = async function executeZone7TuesdayV0681() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run Пн → Вт не подтверждён — запись запрещена");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Weekly day: Понедельник → Вторник.",
    "Режим byte 14 остаётся 00.",
    "Ожидается единственное информационное изменение: byte 15 02 → 04.",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, дата 04.09.2026, дождь выключен.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7TueExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Weekly mask зоны 7 подтверждена: byte 15 = 04; соседние зоны не изменились"
      : "Тест недельной маски не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест недельной маски зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7TueExecuteBusy = false;
    this.render();
  }
};

p._zone7TuesdayCard = function zone7TuesdayCardV0681(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7TuesdayLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Понедельник → Вторник</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Изолируем недельную маску <b>byte 15</b>. Исходный Z7 должен быть Weekly <b>00</b> с маской <b>02</b> (Пн). Цель — маска <b>04</b> (Вт). Ожидаем только <b>byte 15: 02 → 04</b>; byte 14 и все остальные параметры сохраняются.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-tue-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7TuePrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-tue-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7TueExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> Этот опыт физически проверяет переход маски <b>02 → 04</b> при неизменном weekly mode 00. После подтверждения проверим комбинацию нескольких дней отдельным тестом.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0681(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7TuesdayCard(entities);
  const marker = '<section class="lab zone7WeeklyLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0681Events = function ensureV0681Events() {
  if (this._v0681EventsBound) return;
  this._v0681EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-tue-prepare]")) { this.prepareZone7Tuesday(); return; }
    if (event.target.closest?.("[data-zone7-tue-execute]")) this.executeZone7Tuesday();
  });
};

p._render = function renderV0681() {
  previousRender.call(this);
  this._ensureV0681Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0682.mjs
{
const UI_VERSION = "0.6.82";
const TARGET_FIELD = "weekdays";
const TARGET_VALUE = "tue,thu";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF00041A090410";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00141A090410";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00141A090410";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0681 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;
const formatDiff = (diff) => Array.isArray(diff) && diff.length
  ? diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n")
  : "Нет изменений";

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 15 && String(diff[1]?.before) === "04" && String(diff[1]?.after) === "14";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0682() {
  return previousCommandBusy.call(this) || Boolean(this._zone7TueThuPrepareBusy) || Boolean(this._zone7TueThuExecuteBusy);
};

p.prepareZone7TuesdayThursday = async function prepareZone7TuesdayThursdayV0682() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7TueThuPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run Вт → Вт+Чт подготовлен. Проверьте: только byte 15: 04 → 14"
      : "Dry-run составной недельной маски не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест Вт → Вт+Чт зоны 7"));
  } finally {
    this._zone7TueThuPrepareBusy = false;
    this.render();
  }
};

p.executeZone7TuesdayThursday = async function executeZone7TuesdayThursdayV0682() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run Вт → Вт+Чт не подтверждён — запись запрещена");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Weekly days: Вторник → Вторник + Четверг.",
    "Режим byte 14 остаётся 00.",
    "Ожидается единственное информационное изменение: byte 15 04 → 14.",
    "0x14 = 0x04 (Вт) | 0x10 (Чт).",
    "Сохраняются: 17 мин, 06:30 / 12:45 / 23:59, дата 04.09.2026, дождь выключен.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7TueThuExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Составная weekly mask подтверждена: byte 15 = 14; соседние зоны не изменились"
      : "Тест составной недельной маски не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест составной weekly mask не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7TueThuExecuteBusy = false;
    this.render();
  }
};

p._zone7TuesdayThursdayCard = function zone7TuesdayThursdayCardV0682(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7TuesdayThursdayLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Вторник → Вторник + Четверг</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Проверяем побитовое сложение weekly mask. Исходный Z7 должен быть Weekly <b>00</b> с маской <b>04</b> (Вт). Цель — <b>14</b> = <b>04 | 10</b>, то есть Вт + Чт. Ожидаем только <b>byte 15: 04 → 14</b>; byte 14 и все остальные параметры сохраняются.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-tue-thu-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7TueThuPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-tue-thu-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7TueThuExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> Успешный read-back <b>14</b> при неизменном byte 14 подтвердит, что недельные дни объединяются одной OR-маской.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0682(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7TuesdayThursdayCard(entities);
  const marker = '<section class="lab zone7TuesdayLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0682Events = function ensureV0682Events() {
  if (this._v0682EventsBound) return;
  this._v0682EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-tue-thu-prepare]")) { this.prepareZone7TuesdayThursday(); return; }
    if (event.target.closest?.("[data-zone7-tue-thu-execute]")) this.executeZone7TuesdayThursday();
  });
};

p._render = function renderV0682() {
  previousRender.call(this);
  this._ensureV0682Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0683.mjs
{
const UI_VERSION = "0.6.83";
const TARGET_FIELD = "program_enabled";
const TARGET_VALUE = "false";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF00141A090410";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00141A090400";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00141A090400";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0682 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;
const formatDiff = (diff) => Array.isArray(diff) && diff.length
  ? diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n")
  : "Нет изменений";

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 19 && String(diff[1]?.before) === "10" && String(diff[1]?.after) === "00";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0683() {
  return previousCommandBusy.call(this) || Boolean(this._zone7ProgramOffPrepareBusy) || Boolean(this._zone7ProgramOffExecuteBusy);
};

p.prepareZone7ProgramOff = async function prepareZone7ProgramOffV0683() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7ProgramOffPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run включена → отключена подготовлен. Проверьте: только byte 19: 10 → 00"
      : "Dry-run флага программы не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест отключения программы зоны 7"));
  } finally {
    this._zone7ProgramOffPrepareBusy = false;
    this.render();
  }
};

p.executeZone7ProgramOff = async function executeZone7ProgramOffV0683() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run отключения программы не подтверждён — запись запрещена");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Программа зоны: включена → отключена.",
    "Ожидается единственное информационное изменение: byte 19 10 → 00.",
    "Высокий nibble меняется 1 → 0; низкий nibble дождя остаётся 0.",
    "Сохраняются: Weekly Вт+Чт, 17 мин, 06:30 / 12:45 / 23:59, дата 04.09.2026.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7ProgramOffExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Флаг программы зоны 7 подтверждён: byte 19 = 00; соседние зоны не изменились"
      : "Тест флага программы не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест флага программы зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7ProgramOffExecuteBusy = false;
    this.render();
  }
};

p._zone7ProgramOffCard = function zone7ProgramOffCardV0683(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7ProgramOffLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Программа Вкл → Выкл</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Изолируем высокий nibble <b>byte 19</b>. Исходный Z7 должен быть Weekly Вт+Чт с флагом <b>10</b>. Цель — <b>00</b>: программа отключена, а низкий nibble Rain Sensor остаётся 0. Ожидаем только <b>byte 19: 10 → 00</b>.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-program-off-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7ProgramOffPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-program-off-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7ProgramOffExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> После подтверждения отдельно вернём программу в ON и тем же способом проверим обратный переход <b>00 → 10</b>.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0683(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7ProgramOffCard(entities);
  const marker = '<section class="lab zone7TuesdayThursdayLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0683Events = function ensureV0683Events() {
  if (this._v0683EventsBound) return;
  this._v0683EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-program-off-prepare]")) { this.prepareZone7ProgramOff(); return; }
    if (event.target.closest?.("[data-zone7-program-off-execute]")) this.executeZone7ProgramOff();
  });
};

p._render = function renderV0683() {
  previousRender.call(this);
  this._ensureV0683Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0684.mjs
{
const UI_VERSION = "0.6.84";
const TARGET_FIELD = "program_enabled";
const TARGET_VALUE = "true";
const EXPECTED_SOURCE = "0711060C17FFFFFF1E2D3BFFFFFF00141A090400";
const EXPECTED_WRITE = "4011060C17FFFFFF1E2D3BFFFFFF00141A090410";
const EXPECTED_READ = "0711060C17FFFFFF1E2D3BFFFFFF00141A090410";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0683 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

const isOurs = (result) => result.field === TARGET_FIELD && String(result.value || "") === TARGET_VALUE;
const formatDiff = (diff) => Array.isArray(diff) && diff.length
  ? diff.map((item) => `byte ${item.offset} · ${item.field || "byte"}: ${item.before ?? "??"} → ${item.after ?? "??"}`).join("\n")
  : "Нет изменений";

function exactPrepared(result, plan) {
  if (!isOurs(result) || result.status !== "prepared") return false;
  const source = String(result.source_read_hex || plan.source_read_hex || "").toUpperCase();
  const write = String(result.write_hex || plan.write_hex || "").toUpperCase();
  const expected = String(result.expected_read_hex || plan.expected_read_hex || "").toUpperCase();
  const diff = result.diff || plan.diff || [];
  return source === EXPECTED_SOURCE && write === EXPECTED_WRITE && expected === EXPECTED_READ
    && Array.isArray(diff) && diff.length === 2
    && Number(diff[0]?.offset) === 0 && String(diff[0]?.before) === "07" && String(diff[0]?.after) === "40"
    && Number(diff[1]?.offset) === 19 && String(diff[1]?.before) === "00" && String(diff[1]?.after) === "10";
}

function exactVerified(result) {
  return isOurs(result) && result.status === "verified" && result.verified === true
    && String(result.expected_read_hex || "").toUpperCase() === EXPECTED_READ
    && String(result.actual_read_hex || "").toUpperCase() === EXPECTED_READ
    && Array.isArray(result.collateral_changed_zones)
    && result.collateral_changed_zones.length === 0;
}

p.commandBusy = function commandBusyV0684() {
  return previousCommandBusy.call(this) || Boolean(this._zone7ProgramOnPrepareBusy) || Boolean(this._zone7ProgramOnExecuteBusy);
};

p.prepareZone7ProgramOn = async function prepareZone7ProgramOnV0684() {
  if (this.rejectUnavailableCommand("prepare_zone7_lab")) return;
  this._zone7ProgramOnPrepareBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "prepare_zone7_lab", {
      ...this.serviceTargetData(), field: TARGET_FIELD, value: TARGET_VALUE,
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[7].schedule);
    const result = attrs.zone7_lab_result || {};
    const plan = attrs.zone7_lab_plan || {};
    this.notify(exactPrepared(result, plan)
      ? "Dry-run выключена → включена подготовлен. Проверьте: только byte 19: 00 → 10"
      : "Dry-run включения программы не совпал с фиксированным планом — запись запрещена");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подготовить тест включения программы зоны 7"));
  } finally {
    this._zone7ProgramOnPrepareBusy = false;
    this.render();
  }
};

p.executeZone7ProgramOn = async function executeZone7ProgramOnV0684() {
  if (this.rejectUnavailableCommand("execute_zone7_lab")) return;
  const attrs = this.attrs(this.entities().zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  if (!exactPrepared(result, plan)) {
    this.notify("Фиксированный dry-run включения программы не подтверждён — запись запрещена");
    return;
  }
  const planId = String(result.plan_id || plan.plan_id || "");
  const confirmation = String(result.confirmation || plan.confirmation || "");
  if (!planId || !confirmation) {
    this.notify("У dry-run отсутствует plan_id/confirmation — запись запрещена");
    return;
  }
  const message = [
    "Выполнить единственную запись DP38 зоны 7?", "",
    "Программа зоны: выключена → включена.",
    "Ожидается единственное информационное изменение: byte 19 00 → 10.",
    "Высокий nibble меняется 0 → 1; низкий nibble дождя остаётся 0.",
    "Сохраняются: Weekly Вт+Чт, 17 мин, 06:30 / 12:45 / 23:59, дата 04.09.2026.",
    "Запись разрешена только при Auto/ON и отсутствии активного полива/очереди.",
    "Перед записью — свежий preflight 1–8, после — полный read-back 1–8.", "",
    `Dry-run:\n${formatDiff(result.diff || plan.diff)}`, "",
    "Повтора и автоматического отката не будет.",
  ].join("\n");
  if (!window.confirm(message)) return;
  this._zone7ProgramOnExecuteBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "execute_zone7_lab", {
      ...this.serviceTargetData(), plan_id: planId, confirmation,
    });
    await this.refreshNow();
    const updated = this.attrs(this.entities().zones[7].schedule).zone7_lab_result || {};
    this.notify(exactVerified(updated)
      ? "Флаг программы зоны 7 подтверждён: byte 19 = 10; соседние зоны не изменились"
      : "Тест включения программы не получил точного подтверждения — повторную запись не выполняйте");
  } catch (error) {
    await this.refreshNow().catch(() => {});
    this.notify(this.serviceError(error, "Тест включения программы зоны 7 не подтверждён; запись не повторяйте"));
  } finally {
    this._zone7ProgramOnExecuteBusy = false;
    this.render();
  }
};

p._zone7ProgramOnCard = function zone7ProgramOnCardV0684(entities) {
  const attrs = this.attrs(entities.zones[7].schedule);
  const result = attrs.zone7_lab_result || {};
  const plan = attrs.zone7_lab_plan || {};
  const ours = isOurs(result);
  const prepared = exactPrepared(result, plan);
  const verified = exactVerified(result);
  const failed = ours && ["blocked", "mismatch", "failed"].includes(String(result.status || ""));
  const source = ours ? (result.source_read_hex || plan.source_read_hex || "") : "";
  const write = ours ? (result.write_hex || plan.write_hex || "") : "";
  const expected = ours ? (result.expected_read_hex || plan.expected_read_hex || "") : "";
  const actual = ours ? (result.actual_read_hex || "") : "";
  const diff = verified ? "Нет расхождений с ожидаемым ответом"
    : ours ? formatDiff(result.diff || plan.diff) : "Сначала подготовьте dry-run";
  const collateral = ours && Array.isArray(result.collateral_changed_zones)
    ? result.collateral_changed_zones.join(", ") || "нет" : "—";
  const reason = ours ? String(result.reason || "") : "";
  const prepareAvailable = this.commandAvailable("prepare_zone7_lab") && !this.commandBusy();
  const executeAvailable = prepared && this.commandAvailable("execute_zone7_lab") && !this.commandBusy();
  const blocks = [["ИСХОДНЫЙ READ · Z7", source], ["WRITE · MASK 40", write],
    ["ОЖИДАЕМЫЙ READ · Z7", expected], ["ФАКТИЧЕСКИЙ READ · Z7", actual]]
    .filter(([, value]) => value).map(([label, value]) => `<span><small>${label}</small><code>${this.esc(value)}</code></span>`).join("");
  return `<section class="lab zone7ProgramOnLab">
    <div class="zone8ProbeHead"><span><small>DP38 · СЛЕДУЮЩИЙ ТЕСТ</small><h3>Зона 7 · Программа Выкл → Вкл</h3></span><b class="${verified ? "ready" : prepared ? "waiting" : "blocked"}">${verified ? "Подтверждено" : prepared ? "Готов к записи" : failed ? "Заблокировано" : "Dry-run"}</b></div>
    <p>Проверяем обратный переход высокого nibble <b>byte 19</b>. Исходный Z7 должен быть Weekly Вт+Чт с флагом <b>00</b>. Цель — <b>10</b>: программа снова включена, а низкий nibble Rain Sensor остаётся 0. Ожидаем только <b>byte 19: 00 → 10</b>.</p>
    ${blocks ? `<div class="maskWriteHex zone7LabHex">${blocks}</div>` : ""}
    <div class="zone7LabDiff"><small>${verified ? "СВЕРКА READ-BACK" : "ПОБАЙТОВЫЙ DIFF"}</small><pre>${this.esc(diff)}</pre></div>
    <div class="dp38SnapshotState ${verified ? "ok" : prepared ? "waiting" : ""}"><small>Статус</small><b>${verified ? "Подтверждено полным read-back 1–8" : prepared ? "Dry-run совпал с фиксированным планом" : failed ? "Запись не подтверждена / заблокирована" : "Не подготовлено"}</b><span>Изменённые соседние зоны: ${this.esc(collateral)}</span>${reason ? `<span>${this.esc(reason)}</span>` : ""}</div>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-zone7-program-on-prepare ${prepareAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7ProgramOnPrepareBusy ? "Читаю 1–8…" : "1. Подготовить dry-run"}</button><button type="button" class="zone8ProbeButton danger" data-zone7-program-on-execute ${executeAvailable ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7ProgramOnExecuteBusy ? "Проверка…" : "2. Записать один раз"}</button></div>
    <p><b>Важно.</b> Успешный read-back <b>00 → 10</b> подтвердит двустороннее управление флагом включения программы зоны.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0684(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const card = this._zone7ProgramOnCard(entities);
  const marker = '<section class="lab zone7ProgramOffLab">';
  return content.includes(marker) ? content.replace(marker, `${card}${marker}`) : `${card}${content}`;
};

p._ensureV0684Events = function ensureV0684Events() {
  if (this._v0684EventsBound) return;
  this._v0684EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-zone7-program-on-prepare]")) { this.prepareZone7ProgramOn(); return; }
    if (event.target.closest?.("[data-zone7-program-on-execute]")) this.executeZone7ProgramOn();
  });
};

p._render = function renderV0684() {
  previousRender.call(this);
  this._ensureV0684Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0685.mjs
{
const UI_VERSION = "0.6.85";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0684 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;

function cleanCompletedLabs(html) {
  return String(html || "").replace(/<section class="lab\s+([^\"]*zone7[^\"]*)">[\s\S]*?<\/section>/gi, "");
}

function pretty(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
}

p.commandBusy = function commandBusyV0685() {
  return previousCommandBusy.call(this) || Boolean(this._rainDryBusy) || Boolean(this._rainWetBusy);
};

p.captureRainDry = async function captureRainDryV0685() {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  this._rainDryBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase: "baseline", confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[8].schedule);
    this._rainDryTrace = attrs.dp38_snapshot_trace || {};
    this._rainDryAt = attrs.dp38_snapshot_baseline_at || "";
    this.notify("Состояние «Сухо» сохранено. Дождитесь реального дождя и нажмите «Идёт дождь».");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось сохранить состояние «Сухо»"));
  } finally {
    this._rainDryBusy = false;
    this.render();
  }
};

p.captureRainWet = async function captureRainWetV0685() {
  if (this.rejectUnavailableCommand("capture_dp38_snapshot")) return;
  this._rainWetBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "capture_dp38_snapshot", {
      ...this.serviceTargetData(), phase: "compare", confirmation: "DP38_FULL_SNAPSHOT_READ_ONLY",
    });
    await this.refreshNow();
    const attrs = this.attrs(this.entities().zones[8].schedule);
    this._rainWetTrace = attrs.dp38_snapshot_trace || {};
    this._rainWetAt = attrs.dp38_snapshot_current_at || "";
    this.notify("Состояние «Идёт дождь» сохранено и сопоставлено с «Сухо».");
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось сохранить состояние «Идёт дождь»"));
  } finally {
    this._rainWetBusy = false;
    this.render();
  }
};

p._rainSensorProbeCard = function rainSensorProbeCardV0685(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const baseline = attrs.dp38_snapshot_baseline || [];
  const current = attrs.dp38_snapshot_current || [];
  const diff = attrs.dp38_snapshot_diff || [];
  const baselineAt = this._rainDryAt || attrs.dp38_snapshot_baseline_at || "";
  const currentAt = this._rainWetAt || attrs.dp38_snapshot_current_at || "";
  const dryTrace = this._rainDryTrace || {};
  const wetTrace = this._rainWetTrace || attrs.dp38_snapshot_trace || {};
  const hasDry = Array.isArray(baseline) && baseline.length === 8;
  const hasWet = Array.isArray(current) && current.length === 8 && Boolean(currentAt);
  const busy = this.commandBusy();
  const available = this.commandAvailable("capture_dp38_snapshot") && !busy;
  const diffText = Array.isArray(diff) && diff.length ? pretty(diff) : (hasWet ? "Изменений DP38 не обнаружено" : "Снимок «Идёт дождь» ещё не сохранён");
  return `<section class="lab rainSensorProbeLab">
    <div class="zone8ProbeHead"><span><small>RAIN SENSOR · READ-ONLY</small><h3>Сухо / Идёт дождь</h3></span><b class="${hasDry && hasWet ? "ready" : hasDry ? "waiting" : "blocked"}">${hasDry && hasWet ? "Есть два снимка" : hasDry ? "Ждём дождь" : "Нет baseline"}</b></div>
    <p>Две кнопки только читают контроллер. Никаких DP-записей не выполняется. Сначала сохраните состояние при сухом датчике, затем — во время реального дождя.</p>
    <div class="zone7LabActions"><button type="button" class="zone8ProbeButton secondary" data-rain-dry ${available ? "" : "disabled"}><ha-icon icon="mdi:weather-sunny"></ha-icon>${this._rainDryBusy ? "Снимаю…" : "Сухо"}</button><button type="button" class="zone8ProbeButton secondary" data-rain-wet ${available && hasDry ? "" : "disabled"}><ha-icon icon="mdi:weather-rainy"></ha-icon>${this._rainWetBusy ? "Снимаю…" : "Идёт дождь"}</button></div>
    <div class="maskWriteHex zone7LabHex"><span><small>СУХО · ВРЕМЯ</small><code>${this.esc(baselineAt || "—")}</code></span><span><small>ИДЁТ ДОЖДЬ · ВРЕМЯ</small><code>${this.esc(currentAt || "—")}</code></span></div>
    <div class="zone7LabDiff"><small>DP38 · DIFF СУХО → ДОЖДЬ</small><pre>${this.esc(diffText)}</pre></div>
    <details class="dp38SnapshotFold"><summary>Служебные DP · Сухо</summary><pre>${this.esc(pretty(dryTrace))}</pre></details>
    <details class="dp38SnapshotFold"><summary>Служебные DP · Идёт дождь</summary><pre>${this.esc(pretty(wetTrace))}</pre></details>
    <p><b>Важно.</b> Для анализа пришлите фото этой карточки в состоянии «Сухо» и после фиксации «Идёт дождь». Особый интерес: DP102, DP107/108 и изменения byte 19.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0685(entities) {
  const raw = previousDiagnosticsView.call(this, entities);
  const cleaned = cleanCompletedLabs(raw);
  const rain = this._rainSensorProbeCard(entities);
  const marker = '<section class="lab dp38SnapshotLab">';
  if (cleaned.includes(marker)) return cleaned.replace(marker, `${rain}${marker}`);
  const snapshotTitle = "DP38 · СНИМОК 1–8";
  const titleAt = cleaned.indexOf(snapshotTitle);
  if (titleAt >= 0) {
    const sectionAt = cleaned.lastIndexOf('<section class="lab', titleAt);
    if (sectionAt >= 0) return `${cleaned.slice(0, sectionAt)}${rain}${cleaned.slice(sectionAt)}`;
  }
  return `${rain}${cleaned}`;
};

p._ensureV0685Events = function ensureV0685Events() {
  if (this._v0685EventsBound) return;
  this._v0685EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    if (event.target.closest?.("[data-rain-dry]")) { this.captureRainDry(); return; }
    if (event.target.closest?.("[data-rain-wet]")) this.captureRainWet();
  });
};

p._render = function renderV0685() {
  previousRender.call(this);
  this._ensureV0685Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0686.mjs
{
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
}

// Consolidated release layer: irrigation-panel-v0687.mjs
{
const UI_VERSION = "0.6.87";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0686 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorNativeControlActive = function programEditorNativeControlActiveV0687() {
  if (this._view !== "program") return false;
  const active = this.shadowRoot?.activeElement;
  return Boolean(
    this._programNativePickerOpen ||
    active?.matches?.("[data-program-zone-edit], [data-program-start]")
  );
};

p._ensureV0687Events = function ensureV0687Events() {
  if (this._v0687EventsBound) return;
  this._v0687EventsBound = true;

  this.shadowRoot.addEventListener("pointerdown", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit], [data-program-start]");
    this._programNativePickerOpen = Boolean(control);
  }, true);

  this.shadowRoot.addEventListener("focusin", (event) => {
    if (event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) {
      this._programNativePickerOpen = true;
    }
  }, true);

  this.shadowRoot.addEventListener("focusout", (event) => {
    if (!event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
    window.setTimeout(() => {
      const active = this.shadowRoot?.activeElement;
      if (active?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
      this._programNativePickerOpen = false;
      if (this._view === "program") {
        this._programForceRender = true;
        try { this.render(); } finally { this._programForceRender = false; }
      }
    }, 80);
  }, true);

  this.shadowRoot.addEventListener("change", (event) => {
    if (!event.target?.matches?.("[data-program-zone-edit], [data-program-start]")) return;
    window.setTimeout(() => {
      this._programNativePickerOpen = false;
      if (this._view === "program") {
        this._programForceRender = true;
        try { this.render(); } finally { this._programForceRender = false; }
      }
    }, 120);
  }, true);
};

p._render = function renderV0687() {
  if (!this._programForceRender && this._programEditorNativeControlActive()) {
    const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
    if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
    return;
  }
  previousRender.call(this);
  this._ensureV0687Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0687() {
  return `${previousStyles.call(this)}
    /* UI v0.6.87 — native picker stability and approved zone imagery. */
    .zoneProgramScene,.zoneRow .scene,.manualZone .scene{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
    .scene1{background-image:url("/nikas-ho-sc-8w/assets/zone-lawn-v2.webp")!important}
    .scene2{background-image:url("/nikas-ho-sc-8w/assets/zone-lawn-v2.webp")!important}
    .scene3{background-image:url("/nikas-ho-sc-8w/assets/zone-lawn-v2.webp")!important}
    .scene4{background-image:url("/nikas-ho-sc-8w/assets/zone-flowers-v2.webp")!important}
    .scene5{background-image:url("/nikas-ho-sc-8w/assets/zone-shrubs-v2.webp")!important}
    .scene6{background-image:url("/nikas-ho-sc-8w/assets/zone-greenhouse-v2.webp")!important}
    .programEditField input,.programEditField select,.programEditStart input,.programInterval input{touch-action:manipulation}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0688.mjs
{
const UI_VERSION = "0.6.88";
const APPLY_SERVICE = "apply_zone_schedule";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0687 panel is not registered");
const p = Panel.prototype;
const previousProgramEditorCard = p._programEditorCard;
const previousProgramEditorPatch = p._programEditorPatch;
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
    // Keep all six physical slot positions. null means FF/FF for that exact
    // slot; never compact the array because that would shift later starts up.
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
  if (Object.prototype.hasOwnProperty.call(patch, "start_times")) {
    rows.push(`Запуски: ${Array.from({ length: 6 }, (_, index) => patch.start_times[index] || "--:--").join(" · ")}`);
  }
  if (patch.cycle_mode === "weekly") rows.push(`Повтор: по дням недели`);
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
  if (validation) {
    this.notify(validation);
    return;
  }
  const permission = this._programEditorPermission(entities);
  if (!permission.allowed) {
    this.notify(permission.text);
    return;
  }

  const requestedFields = logicalFields(patch);
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
  this._programFieldFeedback = null;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", APPLY_SERVICE, {
      ...this.serviceTargetData(), zone, schedule: patch,
    });
    delete this._programDrafts?.[zone];
    await this.refreshNow();
    this._programApplyFeedback = { zone, kind: "success", until: Date.now() + 5000 };
    this._programFieldFeedback = {
      zone,
      confirmed: [...requestedFields],
      rejected: [],
      until: Date.now() + 5000,
    };
    this.notify(`Программа зоны ${zone} записана и подтверждена полным read-back 1–8`);
  } catch (error) {
    // A single DP38 frame can be accepted partially/canonically by firmware.
    // Re-read the controller even after service failure so the editor base is
    // reconciled with factual state instead of remaining on a stale baseline.
    await this.refreshNow().catch(() => {});
    const refreshed = this._programEditorState(this.entities(), zone);
    const remainingPatch = this._programEditorPatch(refreshed);
    const remainingFields = logicalFields(remainingPatch);
    const confirmed = [...requestedFields].filter((field) => !remainingFields.has(field));
    const rejected = [...requestedFields].filter((field) => remainingFields.has(field));
    this._programApplyFeedback = { zone, kind: "error", until: Date.now() + 6000 };
    this._programFieldFeedback = {
      zone,
      confirmed,
      rejected,
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

  const feedback = this._programFieldFeedback?.zone === zone && Date.now() < Number(this._programFieldFeedback?.until || 0)
    ? this._programFieldFeedback : null;
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
    input.replaceWith(shell);
    shell.append(input);

    const empty = document.createElement("span");
    empty.className = "programTimeEmpty";
    empty.setAttribute("aria-hidden", "true");
    empty.textContent = "--:--";
    shell.append(empty);

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "programTimeClear";
    clear.dataset.programStartClear = `${zone}:${slot}`;
    clear.disabled = !input.value;
    clear.setAttribute("aria-label", `Очистить время запуска ${slot + 1}`);
    clear.setAttribute("title", "Очистить время");
    clear.innerHTML = '<ha-icon icon="mdi:close"></ha-icon>';
    shell.append(clear);
  });

  return template.innerHTML;
};

p._ensureV0688Events = function ensureV0688Events() {
  if (this._v0688EventsBound) return;
  this._v0688EventsBound = true;

  this.shadowRoot.addEventListener("click", (event) => {
    const clear = event.target?.closest?.("[data-program-start-clear]");
    if (!clear) return;

    event.preventDefault();
    event.stopPropagation();

    const [zoneText, slotText] = String(clear.dataset.programStartClear || "").split(":");
    const zone = Number(zoneText);
    const slot = Number(slotText);
    const state = this._programDrafts?.[zone];
    if (!state || !Number.isInteger(slot) || slot < 0 || slot > 5) return;

    state.values.start_times[slot] = "";
    this._programFieldFeedback = null;
    this._programNativePickerOpen = false;
    this._programForceRender = true;
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
    /* UI v0.6.88 — explicit time clearing, factual read-back feedback. */
    .programEditField,.programRepeatEditor,.programStartsEditor,.programEditStart{transition:background .16s ease,border-color .16s ease,box-shadow .16s ease}
    .programEditField.confirmed,.programRepeatEditor.confirmed,.programStartsEditor.confirmed,.programEditStart.confirmed{border-color:color-mix(in srgb,var(--green) 42%,var(--line))!important;background:color-mix(in srgb,var(--green) 8%,var(--card))!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--green) 7%,transparent)!important}
    .programEditField.confirmed input,.programEditField.confirmed select,.programEditStart.confirmed input{border-color:color-mix(in srgb,var(--green) 38%,var(--line))!important}
    .programEditField.rejected,.programRepeatEditor.rejected,.programStartsEditor.rejected,.programEditStart.rejected{border-color:color-mix(in srgb,var(--error-color,#db4437) 46%,var(--line))!important;background:color-mix(in srgb,var(--error-color,#db4437) 6%,var(--card))!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 6%,transparent)!important}
    .programEditField.rejected input,.programEditField.rejected select,.programEditStart.rejected input{border-color:color-mix(in srgb,var(--error-color,#db4437) 42%,var(--line))!important}
    .programTimeInputShell{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 38px;align-items:center;gap:6px;width:100%;min-width:0}
    .programTimeInputShell>input{position:relative;z-index:1;min-width:0!important;width:100%!important;background:var(--card)!important}
    .programTimeInputShell.empty>input{color:transparent!important}
    .programTimeInputShell.empty:focus-within>input{color:var(--text)!important}
    .programTimeEmpty{position:absolute;z-index:2;left:0;right:44px;top:0;height:42px;display:grid;place-items:center;color:var(--muted);font-size:16px;font-weight:800;letter-spacing:.04em;pointer-events:none;opacity:0}
    .programTimeInputShell.empty .programTimeEmpty{opacity:1}
    .programTimeInputShell.empty:focus-within .programTimeEmpty{opacity:0}
    .programTimeClear{display:grid;place-items:center;width:38px;height:42px;padding:0;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--a);outline:0;touch-action:manipulation}
    .programTimeClear ha-icon{--mdc-icon-size:21px}
    .programTimeClear:disabled{color:var(--muted);opacity:.28}
    .programTimeClear:not(:disabled):active{transform:scale(.96)}
    @media(max-width:520px){.programTimeInputShell{grid-template-columns:minmax(0,1fr) 36px;gap:5px}.programTimeEmpty{right:41px}.programTimeClear{width:36px;height:42px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0689.mjs
{
const UI_VERSION = "0.6.89";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0688 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._dp38SnapshotLabV0689 = function dp38SnapshotLabV0689(entities) {
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
  const tone = status === "baseline_saved" || status === "compared_unchanged"
    ? "ok"
    : status === "compared_changes"
      ? "changed"
      : status === "incomplete" ? "error" : "";

  return `<section class="lab dp38SnapshotLab dp38FullSnapshot">
    <div class="zone8ProbeHead">
      <span><small>DP38 · СНИМОК 1–8</small><h3>До и после изменения на приборе</h3></span>
      <b class="${allowed ? "ready" : "blocked"}">Только чтение</b>
    </div>
    <p>Сохраняются точные 20-байтовые блоки всех зон. При контрольном чтении сравнивается каждый байт каждой зоны.</p>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite">
      <small>Результат</small><b>${this.esc(this._dp38SnapshotStatusText(status))}</b>
      ${attrs.dp38_snapshot_detail ? `<span>${this.esc(attrs.dp38_snapshot_detail)}</span>` : ""}
    </div>
    ${this._dp38SnapshotDiff(diff, status)}
    <details class="dp38SnapshotDetails" ${baselineAvailable && !current.length ? "open" : ""}>
      <summary>Исходный снимок · ${baseline.length || 0} из 8</summary>
      ${this._dp38SnapshotRows(baseline, "Исходный снимок отсутствует")}
    </details>
    ${current.length ? `<details class="dp38SnapshotDetails"><summary>Контрольный снимок · ${current.length} из 8</summary>${this._dp38SnapshotRows(current, "Контрольный снимок отсутствует")}</details>` : ""}
    ${Number.isFinite(Number(trace.active_requests)) ? `<div class="zone8Trace">Запросов: ${Number(trace.active_requests)} · ответов: ${Number(trace.responses || 0)} · зоны: ${this.esc((trace.zones_seen || []).join(", ") || "нет")}</div>` : ""}
    <div class="dp38SnapshotActions">
      <button type="button" class="zone8ProbeButton secondary" data-dp38-snapshot-phase="baseline" ${allowed ? "" : "disabled"}>
        <ha-icon icon="mdi:camera-outline"></ha-icon>${this._dp38SnapshotBusy ? "Идёт чтение" : baselineAvailable ? "Переснять исходный снимок 1–8" : "Снять исходный снимок 1–8"}
      </button>
      <button type="button" class="zone8ProbeButton" data-dp38-snapshot-phase="compare" ${allowed && baselineAvailable ? "" : "disabled"}>
        <ha-icon icon="mdi:compare"></ha-icon>Снять контрольный снимок и сравнить
      </button>
    </div>
    <p class="zone8ProbeWarning">Во время каждого снимка последовательно откройте на самом приборе зоны 1–8. Ничего не редактируйте до завершения чтения.</p>
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0689(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const snapshot = this._dp38SnapshotLabV0689(entities);
  const rainMarker = '<section class="lab rainSensorProbeLab">';
  if (content.includes(rainMarker)) return content.replace(rainMarker, `${snapshot}${rainMarker}`);
  return `${snapshot}${content}`;
};

p._render = function renderV0689() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0690.mjs
{
const UI_VERSION = "0.6.90";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0689 panel is not registered");
const p = Panel.prototype;
const previousZoneDetail = p.zoneDetail;
const previousRender = p._render;
const previousStructureKey = p._structureKey;
const previousStyles = p.styles;

const WEEKDAY_LABELS = Object.freeze({ sun: "Вс", mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб" });

p._programReadOnlyCardV0690 = function programReadOnlyCardV0690(entities, zone) {
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const base = this._programEditorBase(entities, zone);
  const seasonal = this.state(entities.seasonal);
  const starts = Array.from({ length: 6 }, (_, index) => base.start_times[index] || "--:--");
  const startsCount = base.start_times.filter(Boolean).length;
  let repeatTitle = String(base.cycle_mode || "Нет данных");
  let repeatDetail = "Из DP38";
  if (base.cycle_mode === "interval") {
    repeatTitle = "Интервал";
    repeatDetail = `Каждые ${this.esc(base.interval_days)} дн.`;
  } else if (base.cycle_mode === "weekly") {
    repeatTitle = "По дням недели";
    repeatDetail = (base.weekdays || []).map((day) => WEEKDAY_LABELS[day] || day).join(" · ") || "Дни не заданы";
  } else if (base.cycle_mode === "odd") {
    repeatTitle = "Нечётные дни";
  } else if (base.cycle_mode === "even") {
    repeatTitle = "Чётные дни";
  }
  const date = base.anchor_date && /^\d{4}-\d{2}-\d{2}$/.test(base.anchor_date)
    ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${base.anchor_date}T12:00:00`))
    : "Не задана";
  const rain = base.rain_sensor_follow === true ? "Учитывать" : base.rain_sensor_follow === false ? "Не учитывать" : "Нет данных";
  const enabled = attrs.dp38_program_enabled === true ? "Включена" : attrs.dp38_program_enabled === false ? "Выключена" : "Нет данных";
  const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  return `<section class="detailCard zoneProgramDetail programReadOnly">
    <div class="zoneProgramHero">
      <span class="scene scene${zone} zoneProgramScene" aria-hidden="true"></span>
      <div class="zoneProgramIdentity"><small>ЗОНА ${zone}</small><h2>Зона ${zone}</h2><span class="zoneProgramStatus ready"><ha-icon icon="mdi:eye-outline"></ha-icon>Просмотр</span><span class="zoneProgramCount">${startsCount} из 6</span></div>
    </div>
    <div class="programReadFresh"><span><i></i><b>Фактическая программа контроллера</b></span>${received ? `<em>${this.esc(received)}</em>` : ""}</div>
    <div class="programReadGrid">
      <article><small>Базовая длительность</small><b>${this.esc(base.duration_minutes)} мин</b><em>До сезонной коррекции</em></article>
      <article><small>Сезонная коррекция</small><b>${this.bad(seasonal) ? "Нет данных" : `${this.esc(seasonal)} %`}</b><em>Общая для всех зон</em></article>
      <article><small>Режим повтора</small><b>${this.esc(repeatTitle)}</b><em>${this.esc(repeatDetail)}</em></article>
      <article><small>Опорная дата</small><b>${this.esc(date)}</b><em>Фактическое значение DP38</em></article>
      <article><small>Датчик дождя</small><b>${this.esc(rain)}</b><em>Правило этой зоны</em></article>
      <article><small>Состояние программы</small><b>${this.esc(enabled)}</b><em>High nibble byte 19</em></article>
    </div>
    <section class="programReadStarts"><div class="programEditorSectionHead"><span><small>ВРЕМЯ ЗАПУСКА</small><b>Все шесть слотов</b></span><em>${startsCount} из 6</em></div><div>${starts.map((value, index) => `<article class="${value === "--:--" ? "empty" : ""}"><small>Запуск ${index + 1}</small><b>${this.esc(value)}</b></article>`).join("")}</div></section>
    <p class="programReadNote"><ha-icon icon="mdi:database-eye-outline"></ha-icon><span>Только просмотр. Здесь показывается фактическое состояние DP38 контроллера; черновики редактора сюда не подмешиваются. Редактирование выполняется через «Зоны» → выбранная зона.</span></p>
  </section>`;
};

p.programView = function programViewV0690(entities) {
  const zones = this._physicalZoneNumbers ? this._physicalZoneNumbers() : Array.from({ length: 8 }, (_, i) => i + 1);
  const selected = Number(this._programZone);
  const zone = zones.includes(selected) ? selected : zones[0];
  this._programZone = zone;
  const tabs = zones.map((number) => `<button type="button" class="${number === zone ? "active" : ""}" data-program-zone="${number}" aria-pressed="${number === zone}">${number}</button>`).join("");
  return `<nav class="programZoneTabs" style="--physical-zone-count:${zones.length}" aria-label="Выбор зоны">${tabs}</nav><div class="programSectionBody programZoneBody">${this._programReadOnlyCardV0690(entities, zone)}</div>`;
};

p.zoneDetail = function zoneDetailV0690(entities, zone) {
  const number = Number(zone);
  if (!Number.isInteger(number) || number < 1 || number > 8) return previousZoneDetail.call(this, entities, zone);
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button>${this._programEditorCard(entities, number)}`;
};

p._structureKey = function structureKeyV0690() {
  if (this._view === "program") return `program:readonly:${Number(this._programZone) || 1}`;
  return previousStructureKey.call(this);
};

p._render = function renderV0690() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0690() {
  return `${previousStyles.call(this)}
    .programReadOnly{gap:12px!important}.programReadFresh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px;color:var(--muted);font-size:11px}.programReadFresh>span{display:flex;align-items:center;gap:7px}.programReadFresh i{width:9px;height:9px;border-radius:50%;background:var(--green)}.programReadFresh b{color:var(--green);font-size:12px}.programReadFresh em{font-style:normal}.programReadGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.programReadGrid article{display:grid;align-content:start;gap:5px;min-height:100px;padding:11px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}.programReadGrid small,.programReadStarts small{color:var(--muted);font-size:11px;font-weight:800}.programReadGrid b{font-size:18px;line-height:1.15}.programReadGrid em{color:var(--muted);font-size:10.5px;font-style:normal;line-height:1.25}.programReadStarts{display:grid;gap:8px;padding:12px;border:1px solid var(--line);border-radius:18px;background:var(--card)}.programReadStarts>div:last-child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.programReadStarts article{display:grid;gap:5px;padding:10px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.programReadStarts article b{font-size:18px;text-align:center}.programReadStarts article.empty b{color:var(--muted)}.programReadNote{display:grid!important;grid-template-columns:28px minmax(0,1fr);align-items:start;gap:7px;margin:0!important;padding:10px;border-radius:14px;background:var(--soft);color:var(--muted)!important;font-size:10.5px!important;line-height:1.35}.programReadNote ha-icon{color:var(--a);--mdc-icon-size:22px}.programReadOnly .zoneProgramStatus.ready{color:var(--green)}
    @media(max-width:520px){.programReadGrid{gap:7px}.programReadGrid article{min-height:96px;padding:10px}.programReadStarts>div:last-child{gap:6px}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0691.mjs
{
const UI_VERSION = "0.6.91";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0690 panel is not registered");
const p = Panel.prototype;
const previousStatusView = p.statusView;
const previousRender = p._render;
const previousStyles = p.styles;

p.statusView = function statusViewV0691(entities) {
  const content = previousStatusView.call(this, entities);
  if (this._systemSettingsOpen) return content;

  const template = document.createElement("template");
  template.innerHTML = content;
  const screen = template.content.querySelector(".systemCompactScreen");
  if (!screen) return content;

  const zone = screen.querySelector(".systemZoneStatus");
  const settings = screen.querySelector(".systemSettingsButton");
  const manual = screen.querySelector(".systemManualAction");

  // Approved order on the System page: zone → settings → manual start/stop.
  // append() moves existing nodes without recreating them, so all data/action
  // attributes and event handlers remain unchanged.
  if (zone) screen.append(zone);
  if (settings) screen.append(settings);
  if (manual) screen.append(manual);

  return template.innerHTML;
};

p._render = function renderV0691() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0691() {
  return `${previousStyles.call(this)}
    /* UI v0.6.91 — equal System cards, compact top-to-bottom action flow. */
    .systemCompactScreen{
      height:auto!important;
      min-height:100%;
      grid-template-rows:auto auto auto auto auto!important;
      align-content:start!important;
      gap:10px!important;
      padding-bottom:4px!important;
    }
    .systemZoneStatus,
    .systemSettingsButton,
    .systemManualAction{
      box-sizing:border-box;
      align-self:stretch!important;
      width:100%;
      height:108px!important;
      min-height:108px!important;
      max-height:108px!important;
      margin:0!important;
    }
    .systemSettingsButton,
    .systemManualAction{
      position:static!important;
      inset:auto!important;
    }
    .systemSettingsButton{
      display:grid;
      grid-template-columns:58px minmax(0,1fr) 24px;
      align-items:center;
      gap:12px;
      padding:11px 14px!important;
    }
    .systemSettingsButton>ha-icon:first-child{
      justify-self:center;
      --mdc-icon-size:34px;
    }
    .systemSettingsButton>span{
      display:grid;
      gap:3px;
      min-width:0;
      text-align:left;
    }
    .systemSettingsButton>span b{font-size:18px;line-height:1.08}
    .systemSettingsButton>span small{font-size:12px;line-height:1.2}
    .systemManualAction{
      padding:11px 14px!important;
      border-radius:19px!important;
    }
    .systemManualActionIcon{
      flex:0 0 58px!important;
      width:58px!important;
      height:58px!important;
    }
    @media(max-width:520px){
      .systemCompactScreen{gap:9px!important}
      .systemZoneStatus,
      .systemSettingsButton,
      .systemManualAction{
        height:94px!important;
        min-height:94px!important;
        max-height:94px!important;
      }
      .systemSettingsButton{
        grid-template-columns:52px minmax(0,1fr) 20px;
        gap:9px;
        padding:9px 12px!important;
        border-radius:17px!important;
      }
      .systemSettingsButton>ha-icon:first-child{--mdc-icon-size:31px}
      .systemSettingsButton>span b{font-size:17px}
      .systemSettingsButton>span small{font-size:11px}
      .systemManualAction{
        padding:9px 12px!important;
        border-radius:17px!important;
      }
      .systemManualActionIcon{
        flex-basis:52px!important;
        width:52px!important;
        height:52px!important;
      }
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0692.mjs
{
const UI_VERSION = "0.6.92";
const APPLY_SERVICE = "apply_zone_schedule";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0691 panel is not registered");
const p = Panel.prototype;
const previousEditorBase = p._programEditorBase;
const previousEditorPatch = p._programEditorPatch;
const previousEditorSummary = p._programEditorSummary;
const previousEditorCard = p._programEditorCard;
const previousRender = p._render;
const previousStyles = p.styles;

const logicalFields = (patch) => {
  const fields = new Set();
  if (Object.prototype.hasOwnProperty.call(patch || {}, "duration_minutes")) fields.add("duration_minutes");
  if (["cycle_mode", "weekdays", "interval_days"].some((key) => Object.prototype.hasOwnProperty.call(patch || {}, key))) fields.add("repeat");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "anchor_date")) fields.add("anchor_date");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "rain_sensor_follow")) fields.add("rain_sensor_follow");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "start_times")) fields.add("start_times");
  if (Object.prototype.hasOwnProperty.call(patch || {}, "program_enabled")) fields.add("program_enabled");
  return fields;
};

p._programEditorBase = function programEditorBaseV0692(entities, zone) {
  const base = previousEditorBase.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  base.program_enabled = attrs.dp38_program_enabled === true
    ? true
    : attrs.dp38_program_enabled === false ? false : null;
  return base;
};

p._programEditorPatch = function programEditorPatchV0692(state) {
  const patch = previousEditorPatch.call(this, state);
  const base = state?.base || {};
  const draft = state?.values || {};
  if (typeof draft.program_enabled === "boolean" && draft.program_enabled !== base.program_enabled) {
    patch.program_enabled = draft.program_enabled;
  }
  return patch;
};

p._programEditorSummary = function programEditorSummaryV0692(patch) {
  const rows = previousEditorSummary.call(this, patch);
  if (Object.prototype.hasOwnProperty.call(patch, "program_enabled")) {
    rows.push(`Программа зоны: ${patch.program_enabled ? "включить" : "выключить"}`);
  }
  return rows;
};

p.applyProgramDraft = async function applyProgramDraftV0692(zone) {
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

p._programEditorCard = function programEditorCardV0692(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousEditorCard.call(this, entities, zone);
  const state = this._programEditorState(entities, zone);
  const draft = state.values;
  const changed = this._programEditorChanged(state, "program_enabled");
  const feedback = this._programFieldFeedback?.zone === zone && Date.now() < Number(this._programFieldFeedback?.until || 0)
    ? this._programFieldFeedback : null;
  const confirmed = new Set(feedback?.confirmed || []);
  const rejected = new Set(feedback?.rejected || []);

  const oldHighNibble = [...template.content.querySelectorAll(".programEditField")]
    .find((node) => node.textContent.includes("high nibble byte 19"));
  if (oldHighNibble) {
    const card = document.createElement("div");
    card.className = `programEditField programEnabledField ${changed ? "changed" : ""} ${confirmed.has("program_enabled") ? "confirmed" : ""} ${rejected.has("program_enabled") ? "rejected" : ""}`;
    const known = typeof draft.program_enabled === "boolean";
    card.innerHTML = `<small>Программа зоны</small>
      <button type="button" class="programEnabledToggle ${draft.program_enabled === true ? "on" : draft.program_enabled === false ? "off" : "unknown"}" data-program-enabled-toggle="${zone}" ${known ? "" : "disabled"} aria-pressed="${draft.program_enabled === true}">
        <ha-icon icon="${draft.program_enabled === true ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"}"></ha-icon>
        <b>${draft.program_enabled === true ? "Включена" : draft.program_enabled === false ? "Выключена" : "Нет данных"}</b>
      </button>
      <em>Локальный флаг программы этой зоны</em>`;
    oldHighNibble.replaceWith(card);
  }

  const note = template.content.querySelector(".programEditorNote span");
  if (note) {
    note.textContent = "Изменения накапливаются только в панели. После «Применить» выполняются свежий preflight 1–8, одна запись выбранной зоны и полный read-back 1–8.";
  }
  return template.innerHTML;
};

p._ensureV0692Events = function ensureV0692Events() {
  if (this._v0692EventsBound) return;
  this._v0692EventsBound = true;
  this.shadowRoot.addEventListener("click", (event) => {
    const control = event.target?.closest?.("[data-program-enabled-toggle]");
    if (!control || control.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const zone = Number(control.dataset.programEnabledToggle);
    const state = this._programEditorState(this.entities(), zone);
    if (typeof state.values.program_enabled !== "boolean") return;
    state.values.program_enabled = !state.values.program_enabled;
    this._programFieldFeedback = null;
    this._programForceRender = true;
    try { this.render(); } finally { this._programForceRender = false; }
  }, true);
};

p._render = function renderV0692() {
  previousRender.call(this);
  this._ensureV0692Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0692() {
  return `${previousStyles.call(this)}
    /* UI 0.6.92: neutral editor at rest; blue draft; green only verified; red mismatch. */
    .programEditor .programEditField,
    .programEditor .programRepeatEditor,
    .programEditor .programStartsEditor,
    .programEditor .programEditStart{
      border-color:var(--line)!important;
      background:var(--card)!important;
      box-shadow:none!important;
    }
    .programEditor .programEditField.readOnly{background:var(--soft)!important}
    .programEditor .programEditField.changed,
    .programEditor .programRepeatEditor.changed,
    .programEditor .programStartsEditor.changed,
    .programEditor .programEditStart.changed,
    .programEditor .programEnabledField.changed{
      border-color:color-mix(in srgb,var(--a) 54%,var(--line))!important;
      background:color-mix(in srgb,var(--a) 7%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 8%,transparent)!important;
    }
    .programEditor .confirmed{
      border-color:color-mix(in srgb,var(--green) 46%,var(--line))!important;
      background:color-mix(in srgb,var(--green) 8%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--green) 7%,transparent)!important;
    }
    .programEditor .rejected{
      border-color:color-mix(in srgb,var(--error-color,#db4437) 48%,var(--line))!important;
      background:color-mix(in srgb,var(--error-color,#db4437) 7%,var(--card))!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--error-color,#db4437) 7%,transparent)!important;
    }
    .programEnabledField{display:grid;align-content:start;gap:7px}
    .programEnabledToggle{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:6px 10px;border:1px solid var(--line);border-radius:13px;background:var(--soft);color:var(--text);text-align:left}
    .programEnabledToggle ha-icon{--mdc-icon-size:27px;color:var(--muted)}
    .programEnabledToggle.on ha-icon{color:var(--green)}
    .programEnabledToggle.off ha-icon{color:var(--muted)}
    .programEnabledToggle b{font-size:16px}
    .programEnabledToggle:disabled{opacity:.58}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0693.mjs
{
const UI_VERSION = "0.6.93";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0692 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

// The schedule editor now lives under Zones. The old v0687 guard was scoped
// to _view === "program", so HA state refreshes could rebuild the DOM while a
// native select/time picker was open. Guard any active editor control instead.
p._programEditorNativeControlActive = function programEditorNativeControlActiveV0693() {
  const active = this.shadowRoot?.activeElement;
  return Boolean(
    this._programNativePickerOpen ||
    active?.matches?.("[data-program-zone-edit], [data-program-start]")
  );
};

p._render = function renderV0693() {
  if (!this._programForceRender && this._programEditorNativeControlActive()) {
    const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
    if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
    return;
  }
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0693() {
  return `${previousStyles.call(this)}
    /* UI 0.6.93 — stable native pickers in Zones editor and fixed clear-button geometry. */
    .programEditStart{min-width:0!important;overflow:hidden!important}
    .programEditStart .programTimeInputShell{
      position:relative!important;
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 42px!important;
      column-gap:8px!important;
      align-items:center!important;
      width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeInputShell>input{
      grid-column:1!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      margin:0!important;
    }
    .programEditStart .programTimeClear{
      position:static!important;
      grid-column:2!important;
      justify-self:end!important;
      align-self:center!important;
      width:42px!important;
      min-width:42px!important;
      max-width:42px!important;
      height:42px!important;
      min-height:42px!important;
      max-height:42px!important;
      margin:0!important;
      padding:0!important;
      border-radius:12px!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear ha-icon{--mdc-icon-size:22px!important}
    .programEditStart .programTimeEmpty{
      left:0!important;
      right:50px!important;
      width:auto!important;
    }
    @media(max-width:520px){
      .programEditStart .programTimeInputShell{
        grid-template-columns:minmax(0,1fr) 38px!important;
        column-gap:6px!important;
      }
      .programEditStart .programTimeClear{
        width:38px!important;
        min-width:38px!important;
        max-width:38px!important;
        height:38px!important;
        min-height:38px!important;
        max-height:38px!important;
      }
      .programEditStart .programTimeEmpty{right:44px!important}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0694.mjs
{
const UI_VERSION = "0.6.94";
const ARTWORK_STORAGE_KEY = "nikas_ho_sc_8w.zone_artwork.v1";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0693 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._zoneArtworkState = function zoneArtworkStateV0694() {
  if (this.__zoneArtworkState) return this.__zoneArtworkState;
  let saved = {};
  try { saved = JSON.parse(window.localStorage.getItem(ARTWORK_STORAGE_KEY) || "{}"); } catch (_error) {}
  this.__zoneArtworkState = Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
    const zone = index + 1;
    const choice = ["lawn", "flowers", "shrubs", "greenhouse", "none"].includes(saved?.[zone]) ? saved[zone] : "none";
    return [zone, choice];
  }));
  return this.__zoneArtworkState;
};

p._render = function renderV0694() {
  previousRender.call(this);
  // Re-apply the browser-local artwork state after every render. Explicit
  // Settings choices are authoritative; zones without a saved choice are gray.
  this._applyZoneArtwork?.();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0694() {
  return `${previousStyles.call(this)}
    /* UI 0.6.94 — browser-selected artwork is authoritative; unsaved zones are neutral gray. */
    .scene1{background-image:var(--zone-artwork-1)!important}
    .scene2{background-image:var(--zone-artwork-2)!important}
    .scene3{background-image:var(--zone-artwork-3)!important}
    .scene4{background-image:var(--zone-artwork-4)!important}
    .scene5{background-image:var(--zone-artwork-5)!important}
    .scene6{background-image:var(--zone-artwork-6)!important}
    .scene7{background-image:var(--zone-artwork-7)!important}
    .scene8{background-image:var(--zone-artwork-8)!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0695.mjs
{
const UI_VERSION = "0.6.95";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0694 panel is not registered");
const p = Panel.prototype;
const previousEditorBase = p._programEditorBase;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

function factualProgramEnabled(attrs) {
  if (attrs?.program_enabled === true || attrs?.enabled === true) return true;
  if (attrs?.program_enabled === false || attrs?.enabled === false) return false;
  return null;
}

p._programEditorBase = function programEditorBaseV0695(entities, zone) {
  const base = previousEditorBase.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  base.program_enabled = factualProgramEnabled(attrs);
  return base;
};

p._programReadOnlyCardV0690 = function programReadOnlyCardV0695(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const enabled = factualProgramEnabled(attrs);
  const articles = [...template.content.querySelectorAll(".programReadGrid > article")];

  // Duration, repeat/date/rain and valid seasonal correction are factual values
  // read from controller-backed entities. Give every known fact one visual tone.
  articles.forEach((article, index) => {
    const value = article.querySelector("b")?.textContent?.trim() || "";
    const unknown = value === "Нет данных" || value === "Не задана" || value === "—";
    if (!unknown) article.classList.add("factualConfirmed");
    else article.classList.add("factualUnknown");
    if (index === 5) {
      article.classList.toggle("factualConfirmed", typeof enabled === "boolean");
      article.classList.toggle("factualUnknown", typeof enabled !== "boolean");
      const valueNode = article.querySelector("b");
      if (valueNode) valueNode.textContent = enabled === true ? "Включена" : enabled === false ? "Выключена" : "Нет данных";
    }
  });

  for (const slot of template.content.querySelectorAll(".programReadStarts article")) {
    const value = slot.querySelector("b")?.textContent?.trim() || "--:--";
    slot.classList.add(value === "--:--" ? "factualEmpty" : "factualConfirmed");
  }
  return template.innerHTML;
};

p._render = function renderV0695() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0695() {
  return `${previousStyles.call(this)}
    /* UI 0.6.95 — one factual color language and corrected mobile editor geometry. */
    .programReadOnly .programReadGrid article.factualConfirmed,
    .programReadOnly .programReadStarts article.factualConfirmed{
      border-color:color-mix(in srgb,var(--green) 38%,var(--line))!important;
      background:color-mix(in srgb,var(--green) 7%,var(--card))!important;
    }
    .programReadOnly .programReadGrid article.factualUnknown,
    .programReadOnly .programReadStarts article.factualEmpty{
      border-color:var(--line)!important;
      background:var(--soft)!important;
    }

    /* Keep native date controls inside the two-column editor grid. */
    .programEditor [data-program-field="anchor_date"]{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
    }
    .programEditor [data-program-field="anchor_date"]::-webkit-date-and-time-value{
      min-width:0!important;
      text-align:center!important;
    }
    .programEditor .programEditField:has([data-program-field="anchor_date"]){
      min-width:0!important;
      overflow:hidden!important;
    }

    /* Time field is one control: value + clear action. No overlapping pills. */
    .programEditStart .programTimeInputShell{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 40px!important;
      column-gap:0!important;
      width:100%!important;
      min-width:0!important;
      height:44px!important;
      border:1px solid var(--line)!important;
      border-radius:13px!important;
      background:var(--card)!important;
      overflow:hidden!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeInputShell>input{
      grid-column:1!important;
      width:100%!important;
      min-width:0!important;
      height:42px!important;
      margin:0!important;
      padding:0 8px!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      text-align:center!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear{
      position:static!important;
      grid-column:2!important;
      width:40px!important;
      min-width:40px!important;
      max-width:40px!important;
      height:42px!important;
      min-height:42px!important;
      max-height:42px!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-left:1px solid var(--line)!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:var(--a)!important;
      box-sizing:border-box!important;
    }
    .programEditStart .programTimeClear:disabled{color:var(--muted)!important;opacity:.34!important}
    .programEditStart .programTimeClear ha-icon{--mdc-icon-size:20px!important}
    .programEditStart .programTimeEmpty{
      left:0!important;
      right:40px!important;
      height:42px!important;
      width:auto!important;
    }
    @media(max-width:520px){
      .programEditStart .programTimeInputShell{grid-template-columns:minmax(0,1fr) 38px!important;height:42px!important}
      .programEditStart .programTimeClear{width:38px!important;min-width:38px!important;max-width:38px!important;height:40px!important;min-height:40px!important;max-height:40px!important}
      .programEditStart .programTimeInputShell>input{height:40px!important}
      .programEditStart .programTimeEmpty{right:38px!important;height:40px!important}
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0696.mjs
{
const UI_VERSION = "0.6.96";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0695 panel is not registered");
const p = Panel.prototype;
const previousEditorState = p._programEditorState;
const previousEditorPatch = p._programEditorPatch;
const previousRender = p._render;

const repeatKeys = new Set(["cycle_mode", "weekdays", "interval_days"]);

function ensureIntent(state) {
  if (!state) return new Set();
  if (!(state.intent instanceof Set)) state.intent = new Set();
  return state.intent;
}

function markIntent(state, key) {
  const intent = ensureIntent(state);
  intent.add(repeatKeys.has(key) ? "repeat" : key);
}

p._programEditorState = function programEditorStateV0696(entities, zone) {
  const state = previousEditorState.call(this, entities, zone);
  const intent = ensureIntent(state);
  const fresh = this._programEditorBase(entities, zone);

  // Controller state is authoritative for every field the user has not touched.
  // This prevents a stale draft from becoming a new edit after a fresh read-back.
  const sync = (key) => {
    if (intent.has(key)) return;
    state.values[key] = structuredClone(fresh[key]);
  };
  sync("duration_minutes");
  sync("start_times");
  if (!intent.has("repeat")) {
    state.values.cycle_mode = fresh.cycle_mode;
    state.values.weekdays = structuredClone(fresh.weekdays);
    state.values.interval_days = fresh.interval_days;
  }
  sync("anchor_date");
  sync("rain_sensor_follow");
  sync("program_enabled");
  state.base = fresh;
  return state;
};

p._programEditorPatch = function programEditorPatchV0696(state) {
  const candidate = previousEditorPatch.call(this, state);
  const intent = ensureIntent(state);
  const patch = {};
  const copy = (key) => {
    if (Object.prototype.hasOwnProperty.call(candidate, key)) patch[key] = candidate[key];
  };
  if (intent.has("duration_minutes")) copy("duration_minutes");
  if (intent.has("start_times")) copy("start_times");
  if (intent.has("repeat")) {
    copy("cycle_mode"); copy("weekdays"); copy("interval_days");
  }
  if (intent.has("anchor_date")) copy("anchor_date");
  if (intent.has("rain_sensor_follow")) copy("rain_sensor_follow");
  if (intent.has("program_enabled")) copy("program_enabled");
  return patch;
};

p._ensureV0696Events = function ensureV0696Events() {
  if (this._v0696EventsBound) return;
  this._v0696EventsBound = true;
  const root = this.shadowRoot;
  const zoneFrom = (node) => Number(node?.dataset?.programZoneEdit || node?.closest?.("[data-program-zone-edit]")?.dataset?.programZoneEdit || 0);

  root.addEventListener("input", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit]");
    if (!control) return;
    const zone = zoneFrom(control);
    const state = this._programDrafts?.[zone];
    if (!state) return;
    if (control.matches("[data-program-start]")) markIntent(state, "start_times");
    else if (control.dataset.programField) markIntent(state, control.dataset.programField);
  }, true);

  root.addEventListener("change", (event) => {
    const control = event.target?.closest?.("[data-program-zone-edit]");
    if (!control) return;
    const zone = zoneFrom(control);
    const state = this._programDrafts?.[zone];
    if (!state) return;
    if (control.matches("[data-program-start]")) markIntent(state, "start_times");
    else if (control.dataset.programField) markIntent(state, control.dataset.programField);
  }, true);

  root.addEventListener("click", (event) => {
    const enabled = event.target?.closest?.("[data-program-enabled-toggle]");
    if (enabled) {
      const zone = Number(enabled.dataset.programEnabledToggle);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "program_enabled");
      return;
    }
    const clear = event.target?.closest?.("[data-program-start-clear]");
    if (clear) {
      const zone = Number(String(clear.dataset.programStartClear || "").split(":")[0]);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "start_times");
      return;
    }
    const weekday = event.target?.closest?.("[data-program-weekday]");
    if (weekday) {
      const zone = zoneFrom(weekday);
      const state = this._programDrafts?.[zone];
      if (state) markIntent(state, "repeat");
    }
  }, true);
};

// On any failed dispatch, discard the stale draft after factual refresh. The
// controller read-back becomes the new baseline; only a new user gesture can
// create another patch. This never retries a write.
const previousApply = p.applyProgramDraft;
p.applyProgramDraft = async function applyProgramDraftV0696(zone) {
  try {
    return await previousApply.call(this, zone);
  } finally {
    const state = this._programDrafts?.[zone];
    if (state && this._programApplyFeedback?.zone === zone && this._programApplyFeedback?.kind === "error") {
      delete this._programDrafts[zone];
      this._programForceRender = true;
      try { this.render(); } finally { this._programForceRender = false; }
    }
  }
};

p._render = function renderV0696() {
  previousRender.call(this);
  this._ensureV0696Events();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0697.mjs
{
const UI_VERSION = "0.6.97";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0696 panel is not registered");
const p = Panel.prototype;
const previousValidation = p._programEditorValidation;
const previousEditorCard = p._programEditorCard;
const previousRender = p._render;
const previousStyles = p.styles;

p._programEditorValidation = function programEditorValidationV0697(state) {
  const prior = previousValidation.call(this, state);
  if (prior) return prior;
  const draft = state?.values || {};
  const duration = Number(draft.duration_minutes);
  if (draft.program_enabled === true && duration === 0) {
    return "Для включённой программы длительность должна быть не меньше 1 минуты";
  }
  return "";
};

p._programEditorCard = function programEditorCardV0697(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousEditorCard.call(this, entities, zone);
  const state = this._programEditorState(entities, zone);
  const input = template.content.querySelector('[data-program-field="duration_minutes"]');
  if (input) input.min = state?.values?.program_enabled === true ? "1" : "0";
  const durationField = input?.closest(".programEditField");
  if (durationField && state?.values?.program_enabled === true) {
    const note = durationField.querySelector("em");
    if (note) note.textContent = "Включённая программа: минимум 1 мин";
  }
  const date = template.content.querySelector('[data-program-field="anchor_date"]');
  const dateField = date?.closest(".programEditField");
  if (dateField) dateField.classList.add("programAnchorDateField");
  return template.innerHTML;
};

p._render = function renderV0697() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0697() {
  return `${previousStyles.call(this)}
    .programEditor .programAnchorDateField{overflow:visible!important;min-width:0!important}
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]{
      display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
      height:44px!important;margin:0!important;padding:0 10px!important;box-sizing:border-box!important;
      border:1px solid var(--line)!important;border-radius:13px!important;background:var(--card)!important;
      box-shadow:none!important;color:var(--text)!important;font:inherit!important;font-size:16px!important;
      font-weight:800!important;text-align:center!important;-webkit-appearance:none!important;appearance:none!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-date-and-time-value{
      width:100%!important;min-width:0!important;margin:0!important;padding:0!important;text-align:center!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-calendar-picker-indicator{
      margin:0!important;padding:4px!important;opacity:.72!important;
    }
    @media(max-width:520px){.programEditor .programAnchorDateField>[data-program-field="anchor_date"]{height:42px!important;padding:0 7px!important;font-size:15px!important}}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0698.mjs
{
const UI_VERSION = "0.6.98";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0697 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._render = function renderV0698() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0698() {
  return `${previousStyles.call(this)}
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      line-height:1!important;
    }
    .programEditor .programAnchorDateField>[data-program-field="anchor_date"]::-webkit-date-and-time-value{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      height:100%!important;
      text-align:center!important;
      line-height:1!important;
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0699.mjs
{
const UI_VERSION = "0.6.99";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0698 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

p._applyProgramFreshnessToneV0699 = function applyProgramFreshnessToneV0699() {
  const root = this.shadowRoot;
  if (!root) return;
  const pageText = root.textContent || "";
  const stale = pageText.includes("Данные устарели");
  const fresh = pageText.includes("Данные свежие");
  for (const card of root.querySelectorAll(".programReadOnly")) {
    card.classList.toggle("programSnapshotStale", stale);
    card.classList.toggle("programSnapshotFresh", fresh && !stale);
  }
};

p._render = function renderV0699() {
  previousRender.call(this);
  this._applyProgramFreshnessToneV0699();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0699() {
  return `${previousStyles.call(this)}
    /* Factual DP38 values are green only while the full snapshot is fresh. */
    .programReadOnly.programSnapshotStale .programReadGrid article.factualConfirmed,
    .programReadOnly.programSnapshotStale .programReadStarts article.factualConfirmed{
      border-color:color-mix(in srgb,var(--warning-color,#f59e0b) 45%,var(--line))!important;
      background:color-mix(in srgb,var(--warning-color,#f59e0b) 8%,var(--card))!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh i{
      background:var(--warning-color,#f59e0b)!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh b,
    .programReadOnly.programSnapshotStale .zoneProgramStatus.ready{
      color:var(--warning-color,#f59e0b)!important;
    }
    .programReadOnly.programSnapshotStale .programReadFresh b::after{
      content:" · снимок устарел";
      font-weight:700;
    }
  `;
};
}

// Consolidated release layer: irrigation-panel-v0700.mjs
{
const UI_VERSION = "0.7.00";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0699 panel is not registered");
const p = Panel.prototype;
const previousSystemStatus = p.systemStatus;
const previousRender = p._render;
const previousStyles = p.styles;

function irrigationPressureState(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  const raw = panel.state(entity);
  if (panel.bad(raw)) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return { level: "unknown", value: null, label: "Нет данных", tone: "unknown" };
  if (value === 0) return { level: "danger", value, label: "Нет давления", tone: "danger" };
  if (value < 0.3) return { level: "danger", value, label: "Аварийно низкое", tone: "danger" };
  if (value < 2.5) return { level: "warning", value, label: "Недостаточное", tone: "warning" };
  if (value <= 3.5) return { level: "normal", value, label: "Норма", tone: "good" };
  if (value <= 4.0) return { level: "warning", value, label: "Повышенное", tone: "warning" };
  return { level: "danger", value, label: "Аварийно высокое", tone: "danger" };
}

p.pressurePresentation = function pressurePresentationV0700(e) {
  const state = irrigationPressureState(this, e);
  if (state.value == null) {
    return { value: "Нет данных", note: "Нет данных о давлении", tone: "unknown", status: state.label };
  }
  const formatted = state.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    value: `${formatted} bar`,
    note: state.label,
    tone: state.tone,
    status: state.label,
  };
};

p.systemStatus = function systemStatusV0700(e) {
  const base = previousSystemStatus.call(this, e);
  const pressure = irrigationPressureState(this, e);
  if (pressure.level === "unknown") {
    return { tone: "unknown", title: "Нет данных о давлении", sub: "Состояние поливочной линии не подтверждено" };
  }
  if (pressure.level === "danger") {
    if (pressure.value === 0) return { tone: "danger", title: "Нет давления", sub: "Поливочная линия: 0,00 bar" };
    if (pressure.value < 0.3) return { tone: "danger", title: "Аварийно низкое давление", sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
    return { tone: "danger", title: "Аварийно высокое давление", sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
  }
  if (pressure.level === "warning") {
    const title = pressure.value < 2.5 ? "Недостаточное давление" : "Повышенное давление";
    return { tone: "warning", title, sub: `Поливочная линия: ${pressure.value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bar` };
  }
  return base;
};

p._render = function renderV0700() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0700() {
  return `${previousStyles.call(this)}
    /* Pressure thresholds are canonical with NikaS Water Accounting irrigation contour. */
    .heroPressure b.good{color:var(--green)!important}
    .heroPressure b.warning{color:var(--orange,#f59e0b)!important}
    .heroPressure b.danger{color:var(--danger,#e53935)!important}
    .heroPressure b.unknown{color:var(--muted)!important}
    .hero.warning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 42%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 5%,var(--card))!important}
    .hero.warning .heroStatus h1{color:var(--orange,#f59e0b)!important}
    .hero.danger{border-color:color-mix(in srgb,var(--danger,#e53935) 46%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 5%,var(--card))!important}
    .hero.danger .heroStatus h1{color:var(--danger,#e53935)!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0701.mjs
{
const UI_VERSION = "0.7.01";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0700 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;
const previousStyles = p.styles;

const HERO_TONES = ["ready", "active", "warning", "danger", "unknown", "off"];
const PRESSURE_TONES = ["pressureGood", "pressureWarning", "pressureDanger", "pressureUnknown"];

function pressureTone(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return "pressureUnknown";
  const raw = panel.state(entity);
  if (panel.bad(raw)) return "pressureUnknown";
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return "pressureUnknown";
  if (value === 0 || value < 0.3 || value > 4.0) return "pressureDanger";
  if (value < 2.5 || value > 3.5) return "pressureWarning";
  return "pressureGood";
}

p._syncPressureVisualToneV0701 = function syncPressureVisualToneV0701() {
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const entities = this.entities();
  const status = this.systemStatus(entities);
  const hero = root.querySelector(".statusScreen .hero");
  if (hero) {
    hero.classList.remove(...HERO_TONES);
    hero.classList.add(HERO_TONES.includes(status?.tone) ? status.tone : "unknown");
  }
  const tone = pressureTone(this, entities);
  const pressureNodes = [...root.querySelectorAll(".statusScreen button")].filter((node) => {
    const title = node.querySelector("small")?.textContent?.trim().toLocaleLowerCase("ru-RU") || "";
    return title === "давление" || node.classList.contains("heroPressure");
  });
  for (const node of pressureNodes) {
    node.classList.remove(...PRESSURE_TONES);
    node.classList.add(tone);
  }
};

p._render = function renderV0701() {
  previousRender.call(this);
  this._syncPressureVisualToneV0701();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0701() {
  return `${previousStyles.call(this)}
    .statusScreen .hero.danger{border-color:color-mix(in srgb,var(--danger,#e53935) 62%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 7%,var(--card))!important}
    .statusScreen .hero.danger .heroStatus h1{color:var(--danger,#e53935)!important}
    .statusScreen .hero.warning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 58%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 7%,var(--card))!important}
    .statusScreen .hero.warning .heroStatus h1{color:var(--orange,#f59e0b)!important}
    .statusScreen button.pressureDanger{border-color:color-mix(in srgb,var(--danger,#e53935) 58%,var(--line))!important;background:color-mix(in srgb,var(--danger,#e53935) 8%,var(--card))!important}
    .statusScreen button.pressureDanger ha-icon,.statusScreen button.pressureDanger b{color:var(--danger,#e53935)!important}
    .statusScreen button.pressureWarning{border-color:color-mix(in srgb,var(--orange,#f59e0b) 55%,var(--line))!important;background:color-mix(in srgb,var(--orange,#f59e0b) 8%,var(--card))!important}
    .statusScreen button.pressureWarning ha-icon,.statusScreen button.pressureWarning b{color:var(--orange,#f59e0b)!important}
    .statusScreen button.pressureGood{border-color:color-mix(in srgb,var(--green,#08a52b) 48%,var(--line))!important;background:color-mix(in srgb,var(--green,#08a52b) 7%,var(--card))!important}
    .statusScreen button.pressureGood ha-icon,.statusScreen button.pressureGood b{color:var(--green,#08a52b)!important}
    .statusScreen button.pressureUnknown{border-color:var(--line)!important;background:var(--soft)!important}
    .statusScreen button.pressureUnknown ha-icon,.statusScreen button.pressureUnknown b{color:var(--muted)!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0702.mjs
{
const UI_VERSION = "0.7.02";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0701 panel is not registered");
const p = Panel.prototype;
const previousRender = p._render;

function pressureTone(panel, entities) {
  const entity = entities?.pressure;
  if (!entity) return "unknown";
  const raw = panel.state(entity);
  if (panel.bad(raw)) return "unknown";
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return "unknown";
  if (value === 0 || value < 0.3 || value > 4.0) return "danger";
  if (value < 2.5 || value > 3.5) return "warning";
  return "good";
}

function nearestVisualCard(node, root, minWidth = 140) {
  let current = node;
  while (current && current !== root) {
    const rect = current.getBoundingClientRect?.();
    const style = getComputedStyle(current);
    const radius = parseFloat(style.borderTopLeftRadius || "0");
    const border = parseFloat(style.borderTopWidth || "0");
    if (rect && rect.width >= minWidth && radius >= 10 && border > 0) return current;
    current = current.parentElement;
  }
  return null;
}

function applyTone(card, tone) {
  if (!card) return;
  const map = {
    danger: { fg: "var(--danger,#e53935)", bg: "color-mix(in srgb,var(--danger,#e53935) 9%,var(--card))", border: "color-mix(in srgb,var(--danger,#e53935) 68%,var(--line))" },
    warning: { fg: "var(--orange,#f59e0b)", bg: "color-mix(in srgb,var(--orange,#f59e0b) 9%,var(--card))", border: "color-mix(in srgb,var(--orange,#f59e0b) 62%,var(--line))" },
    good: { fg: "var(--green,#08a52b)", bg: "color-mix(in srgb,var(--green,#08a52b) 8%,var(--card))", border: "color-mix(in srgb,var(--green,#08a52b) 54%,var(--line))" },
    unknown: { fg: "var(--muted)", bg: "var(--soft)", border: "var(--line)" },
  };
  const c = map[tone] || map.unknown;
  card.style.setProperty("background", c.bg, "important");
  card.style.setProperty("border-color", c.border, "important");
  card.dataset.pressureTone = tone;
  for (const node of card.querySelectorAll("ha-icon,b,strong,h1")) {
    if ((node.textContent || "").includes("Локально")) continue;
    node.style.setProperty("color", c.fg, "important");
  }
}

p._syncActualPressureCardsV0702 = function syncActualPressureCardsV0702() {
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const entities = this.entities();
  const tone = pressureTone(this, entities);

  // Pressure metric: locate by its visible heading, then climb to the actual bordered card.
  const pressureLabel = [...root.querySelectorAll("small,b,span")].find((n) => (n.textContent || "").trim() === "Давление");
  applyTone(nearestVisualCard(pressureLabel, root, 140), tone);

  // Hero: locate the current status title and climb to the large bordered status card.
  const status = this.systemStatus(entities);
  const heroTitle = [...root.querySelectorAll("h1,h2,strong,b")].find((n) => (n.textContent || "").trim() === String(status?.title || "").trim());
  applyTone(nearestVisualCard(heroTitle, root, 300), status?.tone === "danger" ? "danger" : status?.tone === "warning" ? "warning" : status?.tone === "unknown" ? "unknown" : "good");
};

p._render = function renderV0702() {
  previousRender.call(this);
  this._syncActualPressureCardsV0702();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0703.mjs
{
const UI_VERSION = "0.7.03";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0702 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

p._programReadOnlyCardV0690 = function programReadOnlyCardV0703(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";

  // The green eye badge already establishes read-only mode. Keep only one
  // operational snapshot line below the hero: freshness + DP38 + timestamp.
  const status = card?.querySelector(".programReadFresh");
  if (status) {
    status.innerHTML = `<span><i></i><b>Данные актуальны · DP38${received ? ` · ${this.esc(received)}` : ""}</b></span>`;
  }
  return template.innerHTML;
};

p._applyProgramFreshnessToneV0699 = function applyProgramFreshnessToneV0703() {
  const root = this.shadowRoot;
  if (!root) return;
  for (const card of root.querySelectorAll(".programReadOnly")) {
    const zone = Number(this._programZone) || 1;
    const attrs = this.attrs(this.entities().zones[zone]?.schedule);
    const received = attrs.updated_at || attrs.received_at || attrs.last_update || "";
    const stale = (root.textContent || "").includes("Данные устарели");
    const fresh = !stale && (root.textContent || "").includes("Данные свежие");
    card.classList.toggle("programSnapshotStale", stale);
    card.classList.toggle("programSnapshotFresh", fresh);
    const label = card.querySelector(".programReadFresh b");
    if (label) label.textContent = `${stale ? "Данные устарели" : "Данные актуальны"} · DP38${received ? ` · ${received}` : ""}`;
  }
};

p._render = function renderV0703() {
  previousRender.call(this);
  this._applyProgramFreshnessToneV0699();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0703() {
  return `${previousStyles.call(this)}
    .programReadOnly .programReadFresh{justify-content:flex-start!important}
    .programReadOnly .programReadFresh b::after{content:none!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0704.mjs
{
const UI_VERSION = "0.7.04";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0703 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;
const previousStyles = p.styles;

p._programReadOnlyCardV0690 = function programReadOnlyCardV0704(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  if (!card) return template.innerHTML;

  // The legacy program hero contains a separate freshness row. Remove it from
  // Program view; .programReadFresh is the single canonical snapshot status.
  const legacyFresh = [...card.children].find((node) =>
    node !== card.querySelector(".programReadFresh") &&
    /Данные (свежие|устарели)/.test(node.textContent || "")
  );
  legacyFresh?.remove();
  return template.innerHTML;
};

p._syncSingleProgramFreshnessV0704 = function syncSingleProgramFreshnessV0704() {
  const root = this.shadowRoot;
  if (!root || this._view !== "program") return;
  const card = root.querySelector(".programReadOnly");
  if (!card) return;

  // Defensive cleanup for legacy markup inserted outside the read-only card.
  for (const node of root.querySelectorAll(".freshLine,.dataFresh,.programFresh,.zoneFresh,.detailFresh")) {
    if (node.closest(".programReadFresh")) continue;
    if (/Данные (свежие|устарели)/.test(node.textContent || "")) node.remove();
  }
};

p._render = function renderV0704() {
  previousRender.call(this);
  this._syncSingleProgramFreshnessV0704();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0704() {
  return `${previousStyles.call(this)}
    .programReadOnly>.freshLine,
    .programReadOnly>.dataFresh,
    .programReadOnly>.programFresh,
    .programReadOnly>.zoneFresh,
    .programReadOnly>.detailFresh{display:none!important}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0705.mjs
{
const UI_VERSION = "0.7.05";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0704 panel is not registered");
const p = Panel.prototype;
const previousReadOnlyCard = p._programReadOnlyCardV0690;
const previousRender = p._render;

const snapshotStamp = (text) => {
  const value = String(text || "");
  const ru = value.match(/\b\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\b/);
  if (ru) return ru[0];
  const iso = value.match(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?/);
  return iso ? iso[0].replace("T", " ") : "";
};

function consolidateProgramSnapshot(card, fallbackStamp = "") {
  if (!card) return;
  const hero = card.querySelector(":scope > .zoneProgramHero");
  const canonical = card.querySelector(":scope > .programReadFresh");
  if (!hero || !canonical) return;

  let stale = false;
  let stamp = snapshotStamp(canonical.textContent) || fallbackStamp;
  let node = hero.nextElementSibling;
  while (node && node !== canonical) {
    const next = node.nextElementSibling;
    const text = node.textContent || "";
    if (/Данные\s+устарели/i.test(text)) stale = true;
    if (!stamp) stamp = snapshotStamp(text);
    node.remove();
    node = next;
  }

  const label = canonical.querySelector("b");
  if (label) {
    label.textContent = `${stale ? "Данные устарели" : "Данные актуальны"} · DP38${stamp ? ` · ${stamp}` : ""}`;
  }
  card.classList.toggle("programSnapshotStale", stale);
  card.classList.toggle("programSnapshotFresh", !stale);
}

p._programReadOnlyCardV0690 = function programReadOnlyCardV0705(entities, zone) {
  const template = document.createElement("template");
  template.innerHTML = previousReadOnlyCard.call(this, entities, zone);
  const card = template.content.querySelector(".programReadOnly");
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const fallback = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  consolidateProgramSnapshot(card, snapshotStamp(fallback) || String(fallback || ""));
  return template.innerHTML;
};

p._syncSingleProgramFreshnessV0705 = function syncSingleProgramFreshnessV0705() {
  if (this._view !== "program") return;
  const entities = this.entities();
  const zone = Number(this._programZone) || 1;
  const attrs = this.attrs(entities.zones[zone]?.schedule);
  const fallback = attrs.updated_at || attrs.received_at || attrs.last_update || "";
  for (const card of this.shadowRoot?.querySelectorAll(".programReadOnly") || []) {
    consolidateProgramSnapshot(card, snapshotStamp(fallback) || String(fallback || ""));
  }
};

p._render = function renderV0705() {
  previousRender.call(this);
  this._syncSingleProgramFreshnessV0705();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Consolidated release layer: irrigation-panel-v0706.mjs
{
const UI_VERSION = "0.7.06";
const PREPARE = "prepare_zone7_parity";
const EXECUTE = "execute_zone7_parity";
const CONFIRMATION = "WRITE_ZONE7_PARITY_ONCE";
const MODE_LABEL = Object.freeze({ odd: "Нечётные дни", even: "Чётные дни" });
const STATUS_LABEL = Object.freeze({
  idle: "Выберите режим и подготовьте проверку",
  preparing: "Читаю все восемь зон…",
  prepared: "План подготовлен · запись ещё не выполнялась",
  noop: "Такое состояние уже на приборе · запись не нужна",
  preflight: "Проверяю, что исходные данные не изменились…",
  writing: "Отправляю одну команду…",
  reading: "Сверяю все восемь зон…",
  verified: "Запись подтверждена · остальные зоны без изменений",
  stale: "Состояние изменилось · подготовьте новый план",
  expired: "Срок плана истёк · подготовьте новый план",
  rejected: "Проверка условий не пройдена",
  mismatch: "Ответ отличается от ожидаемого · тест остановлен",
  uncertain: "Результат записи не подтверждён · тест остановлен",
});
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0705 panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousCommandBusy = p.commandBusy;
const previousRender = p._render;
const previousStyles = p.styles;

function blockSummary(hex) {
  if (!/^[0-9a-f]{40}$/i.test(String(hex || ""))) return "Нет полного блока";
  const bytes = hex.match(/../g).map((v) => parseInt(v, 16));
  const pad = (n) => String(n).padStart(2, "0");
  const slots = Array.from({ length: 6 }, (_, i) => bytes[i + 2] === 255 && bytes[i + 8] === 255
    ? "--:--" : `${pad(bytes[i + 2])}:${pad(bytes[i + 8])}`);
  const repeat = ["По дням недели", "Нечётные дни", "Чётные дни", `Каждые ${bytes[15]} дн.`][bytes[14]] || "Неизвестный режим";
  return `${bytes[1]} мин · ${repeat} · программа ${bytes[19] >> 4 ? "включена" : "выключена"} · дождь ${bytes[19] & 15 ? "учитывается" : "не учитывается"} · ${slots.join(" / ")}`;
}

p._zone7ParityState = function zone7ParityState() {
  return this.attrs(this.entities().zones[7]?.schedule).zone7_parity_probe || {};
};

p._zone7ParityWriteReady = function zone7ParityWriteReady(result) {
  return result.status === "prepared" && !result.locked
    && result.mode === (this._zone7ParityMode || "odd")
    && Boolean(result.plan_id) && result.confirmation === CONFIRMATION
    && Date.parse(result.expires_at) > Date.now()
    && !this._zone7ParityConsumedIds?.has(result.plan_id);
};

p.commandBusy = function commandBusyV0706() {
  return previousCommandBusy.call(this) || Boolean(this._zone7ParityBusy);
};

p.prepareZone7Parity = async function prepareZone7ParityV0706() {
  if (this.rejectUnavailableCommand(PREPARE) || this._zone7ParityState().locked) return;
  const mode = this._zone7ParityMode || "odd";
  if (!MODE_LABEL[mode]) return;
  this._zone7ParityBusy = "prepare";
  this._zone7ParityError = "";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", PREPARE, { ...this.serviceTargetData(), mode });
    // The service publishes its result through the coordinator. Do not start
    // another controller refresh or silently dispatch a write from preparation.
  } catch (error) {
    this._zone7ParityError = this.serviceError(error, "Не удалось подготовить проверку зоны 7");
    this.notify(this._zone7ParityError);
  } finally {
    this._zone7ParityBusy = "";
    this.render();
  }
};

p.executeZone7Parity = async function executeZone7ParityV0706() {
  if (this.rejectUnavailableCommand(EXECUTE)) return;
  const result = this._zone7ParityState();
  if (!this._zone7ParityWriteReady(result)) {
    this.notify("Подготовьте новый план выбранного режима");
    return;
  }
  if (!window.confirm([
    `Записать «${MODE_LABEL[result.mode]}» в зону 7 один раз?`,
    "Длительность, все шесть времён, включение программы и правило дождя сохраняются.",
    "Параметры интервала и его даты обнуляются согласно формату штатного приложения.",
    "Перед записью и после неё автоматически проверяются все восемь зон.",
    "Повтора и автоматического отката не будет.",
    "", `Пакет: ${result.write_hex}`,
  ].join("\n"))) return;
  // The user can keep the confirmation dialog open beyond the plan lifetime.
  if (!this._zone7ParityWriteReady(result)) {
    this.notify("Срок плана истёк · подготовьте новый план");
    return;
  }
  this._zone7ParityConsumedIds ||= new Set();
  this._zone7ParityConsumedIds.add(result.plan_id);
  this._zone7ParityBusy = "execute";
  this._zone7ParityError = "";
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", EXECUTE, {
      ...this.serviceTargetData(), plan_id: result.plan_id, confirmation: CONFIRMATION,
    });
  } catch (error) {
    this._zone7ParityError = this.serviceError(error, "Результат записи не подтверждён");
    this.notify(this._zone7ParityError);
  } finally {
    this._zone7ParityBusy = "";
    this.render();
  }
};

p.downloadZone7ParityReport = function downloadZone7ParityReport() {
  const result = this._zone7ParityState();
  if (!result.before_snapshot?.length) return;
  const report = { schema: "nikas.zone7-parity.v1", ui_version: UI_VERSION, exported_at: new Date().toISOString(), result };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ho-sc-8w-zone7-parity-report.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

p._zone7ParityCard = function zone7ParityCardV0706() {
  const result = this._zone7ParityState();
  const status = result.status || "idle";
  const mode = this._zone7ParityMode || "odd";
  const prepared = this._zone7ParityWriteReady(result);
  const verified = status === "verified" && result.verified === true;
  const prepareAllowed = this.commandAvailable(PREPARE) && !result.locked;
  const executeAllowed = this.commandAvailable(EXECUTE) && prepared;
  const diff = (result.expected_diff || []).map((item) => `Байт ${item.offset}: ${item.before} → ${item.after}`).join("\n");
  const hexRows = [["Исходный ответ", result.source_read_hex], ["Пакет записи · маска 40", result.write_hex],
    ["Ожидаемый ответ", result.expected_read_hex], ["Фактический ответ", result.actual_read_hex]]
    .filter(([, value]) => value).map(([label, value]) => `<div><small>${label}</small><code>${this.esc(value)}</code></div>`).join("");
  const snapshotRows = (rows) => (rows || []).map((row) => `<li><b>Зона ${Number(row.zone)}</b><code>${this.esc(row.raw_hex || "")}</code></li>`).join("");
  const changes = (result.changes || []).map((change) => `<li><b>Зона ${Number(change.zone)}</b><code>${this.esc(change.before_hex)}</code><span>↓</span><code>${this.esc(change.after_hex)}</code><span>Байты: ${this.esc((change.offsets || []).join(", "))}</span></li>`).join("");
  const history = (result.history || []).map((entry) => `<li><b>${this.esc(MODE_LABEL[entry.mode] || entry.mode)}</b><span>${this.esc(STATUS_LABEL[entry.status] || entry.status)}</span><code>${this.esc(entry.actual_read_hex || "")}</code></li>`).join("");
  const tone = verified ? "ok" : result.locked || status === "rejected" ? "error" : "";
  const label = status === "prepared" && !prepared && result.mode === mode ? "Срок плана истёк или запись уже запрошена" : STATUS_LABEL[status] || status;
  return `<section class="lab zone7ParityLab">
    <div class="zone8ProbeHead"><span><small>DP38 · ПРОВЕРКА ЗОНЫ 7</small><h3>Нечётные / чётные дни</h3></span><b class="${verified ? "ready" : "blocked"}">${verified ? "Ответ подтверждён" : "Испытание"}</b></div>
    <p>Проверяем каждый режим отдельно. Контроллер — ON/Auto, полив и очередь остановлены. Длительность зоны 7 — больше 0 минут.</p>
    <label class="parityModeLabel">Режим проверки<select data-zone7-parity-mode ${this._zone7ParityBusy || result.locked ? "disabled" : ""}>
      ${Object.entries(MODE_LABEL).map(([value, title]) => `<option value="${value}" ${value === mode ? "selected" : ""}>${title}</option>`).join("")}
    </select></label>
    <div class="dp38SnapshotState ${tone}" role="status" aria-live="polite"><small>${this.esc(MODE_LABEL[result.mode] || "Результат")}</small><b>${this.esc(label)}</b>${result.detail ? `<span>${this.esc(result.detail)}</span>` : ""}</div>
    ${this._zone7ParityError ? `<p class="parityError" role="alert">${this.esc(this._zone7ParityError)}</p>` : ""}
    ${result.source_read_hex ? `<div class="parityFacts"><small>Исходная программа зоны 7</small><span>${this.esc(blockSummary(result.source_read_hex))}</span>${result.actual_read_hex ? `<small>После записи</small><span>${this.esc(blockSummary(result.actual_read_hex))}</span>` : ""}</div>` : ""}
    ${hexRows ? `<details class="parityEvidence"><summary>Пакет и изменения по байтам</summary><div class="parityHex">${hexRows}</div><pre>${this.esc(diff || "Информационные байты уже совпадают")}</pre><p>Первый байт ответа 07 — зона 7; первый байт команды 40 — её маска. В режиме нечётных/чётных дней параметры интервала и его даты равны нулю.</p></details>` : ""}
    ${changes ? `<details class="parityEvidence"><summary>Изменились зоны: ${this.esc((result.changed_zones || []).join(", "))}</summary><ul>${changes}</ul></details>` : ""}
    ${result.before_snapshot?.length ? `<details class="parityEvidence"><summary>Снимки всех зон · до ${result.before_snapshot.length}/8 · после ${result.after_snapshot?.length || 0}/8</summary><b>До записи</b><ul>${snapshotRows(result.before_snapshot)}</ul><b>После записи</b><ul>${snapshotRows(result.after_snapshot)}</ul></details>` : ""}
    ${history ? `<details class="parityEvidence"><summary>Предыдущие проверки</summary><ul>${history}</ul></details>` : ""}
    <div class="zone7LabActions">
      <button type="button" class="zone8ProbeButton secondary" data-zone7-parity-prepare ${prepareAllowed ? "" : "disabled"}><ha-icon icon="mdi:database-search-outline"></ha-icon>${this._zone7ParityBusy === "prepare" ? "Читаю 1–8…" : "1. Подготовить план"}</button>
      <button type="button" class="zone8ProbeButton" data-zone7-parity-execute ${executeAllowed ? "" : "disabled"}><ha-icon icon="mdi:database-arrow-up-outline"></ha-icon>${this._zone7ParityBusy === "execute" ? "Запись и проверка…" : "2. Записать один раз"}</button>
      ${result.before_snapshot?.length ? '<button type="button" class="zone8ProbeButton secondary" data-zone7-parity-report><ha-icon icon="mdi:download-outline"></ha-icon>Скачать протокол проверки</button>' : ""}
    </div>
    <p>План действует 2 минуты. Чтение всех зон выполняется автоматически. После подтверждённой записи проверьте режим зоны 7 на экране прибора, затем отдельно проверьте второй режим.</p>
    ${result.locked ? '<p class="parityError">Дальнейшие записи этого теста остановлены. Сохраните протокол для разбора результата.</p>' : ""}
  </section>`;
};

p.diagnosticsView = function diagnosticsViewV0706(entities) {
  return `${this._zone7ParityCard()}${previousDiagnosticsView.call(this, entities)}`;
};

p._render = function renderV0706() {
  previousRender.call(this);
  if (this.shadowRoot && !this._zone7ParityEventsBound) {
    this._zone7ParityEventsBound = true;
    this.shadowRoot.addEventListener("change", (event) => {
      if (!event.target.matches?.("[data-zone7-parity-mode]")) return;
      if (MODE_LABEL[event.target.value]) this._zone7ParityMode = event.target.value;
      this._zone7ParityError = "";
      this.render();
    });
    this.shadowRoot.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-zone7-parity-prepare]")) this.prepareZone7Parity();
      else if (event.target.closest?.("[data-zone7-parity-execute]")) this.executeZone7Parity();
      else if (event.target.closest?.("[data-zone7-parity-report]")) this.downloadZone7ParityReport();
    });
  }
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0706() {
  return `${previousStyles.call(this)}
    .zone7ParityLab{min-width:0}.zone7ParityLab .zone8ProbeHead{flex-wrap:wrap}
    .parityModeLabel{display:grid;gap:8px;font-size:14px;font-weight:700}
    .parityModeLabel select{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--text);font:inherit;font-size:16px}
    .parityFacts,.parityHex{display:grid;gap:8px;min-width:0}.parityFacts{padding:12px;background:var(--soft);border-radius:14px}.parityFacts small,.parityHex small{display:block;color:var(--muted);font-size:12px}
    .parityEvidence{min-width:0;border:1px solid var(--line);border-radius:14px;padding:12px}.parityEvidence summary{cursor:pointer;font-size:14px;font-weight:700;line-height:1.4}.parityEvidence[open] summary{margin-bottom:12px}
    .parityEvidence code{display:block;font-size:12px;overflow-wrap:anywhere;word-break:break-all}.parityEvidence pre{white-space:pre-wrap;font-size:12px}.parityEvidence ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:10px}.parityEvidence li{display:grid;gap:4px;min-width:0}
    .zone7ParityLab .parityError{color:var(--danger)!important}.zone7ParityLab button{min-height:44px;white-space:normal}
  `;
};
}

// Consolidated release layer: irrigation-panel-v0709.mjs
{
const UI_VERSION = "0.7.09";
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


// Keep the accepted neutral controller card from UI 0.7.08.
const previousPressureSyncV0709 = p._syncActualPressureCardsV0702;
p._syncActualPressureCardsV0702 = function syncPressureCardsV0709() {
  previousPressureSyncV0709.call(this);
  const root = this.shadowRoot;
  if (!root || !this._hass) return;
  const status = this.systemStatus(this.entities());
  if (["danger", "warning", "unknown"].includes(status?.tone)) return;
  for (const card of root.querySelectorAll('[data-pressure-tone="good"]')) {
    const hasStatus = [...card.querySelectorAll("h1,h2,strong,b")].some(
      (node) => (node.textContent || "").trim() === String(status?.title || "").trim(),
    );
    if (!hasStatus) continue;
    card.style.setProperty("background", "var(--card)", "important");
    card.style.setProperty("border-color", "var(--line)", "important");
  }
};
}

// Consolidated release layer: irrigation-panel-v0710.mjs
{
const UI_VERSION = "0.7.10";
const REFRESH_FEEDBACK_MIN_MS = 900;
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0709 panel is not registered");
const p = Panel.prototype;
const previousRenderV0710 = p._render;
const previousStylesV0710 = p.styles;

p._setRefreshFeedbackV0710 = function setRefreshFeedbackV0710(busy) {
  const buttons = this.shadowRoot?.querySelectorAll?.("[data-refresh]") || [];
  for (const button of buttons) {
    button.disabled = busy;
    button.classList.toggle("busy", busy);
    if (busy) {
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-label", "Обновление данных");
    } else {
      button.removeAttribute("aria-busy");
      button.removeAttribute("aria-disabled");
      button.setAttribute("aria-label", "Обновить");
    }
  }
};

p.refreshNow = async function refreshNowV0710() {
  if (this._refreshBusy) return false;
  const startedAt = Date.now();
  this._refreshBusy = true;
  this._setRefreshFeedbackV0710(true);
  let updated = false;
  try {
    if (!this._hass?.callService) throw new Error("Home Assistant update service is unavailable");
    const e = this.entities();
    const ids = [
      e.connection, e.operation, e.irrigation, e.active, e.queued,
      e.rain, e.pressure, e.seasonal, e.timerError, e.cache,
      ...Object.values(e.zones || {}).flatMap((zone) => [zone.remaining, zone.elapsed, zone.schedule]),
    ].filter((id, index, all) => id && this.states()[id] && all.indexOf(id) === index);
    if (!ids.length) throw new Error("No entities are available for refresh");
    await this._hass.callService("homeassistant", "update_entity", { entity_id: ids });
    updated = true;
  } catch (_error) {
    this.notify("Не удалось обновить данные");
  } finally {
    const remaining = REFRESH_FEEDBACK_MIN_MS - (Date.now() - startedAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    this._refreshBusy = false;
    this._setRefreshFeedbackV0710(false);
  }
  return updated;
};

p.styles = function stylesV0710() {
  return `${previousStylesV0710.call(this)}
    /* UI v0.7.10 — unambiguous feedback for the global refresh action. */
    .refreshButton.busy{cursor:wait;background:color-mix(in srgb,var(--a) 11%,var(--card));border-color:color-mix(in srgb,var(--a) 38%,var(--line))}
    .refreshButton.busy ha-icon{animation:nikasRefreshSpin .9s linear infinite;transform-origin:center}
    @keyframes nikasRefreshSpin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.refreshButton.busy ha-icon{animation:none;opacity:.45}}
  `;
};

p._render = function renderV0710() {
  previousRenderV0710.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
  this._setRefreshFeedbackV0710(Boolean(this._refreshBusy));
};
}

// Consolidated release layer: irrigation-panel-v0711.mjs
{
const UI_VERSION = "0.7.11";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0710 panel is not registered");
const p = Panel.prototype;
const previousRenderV0711 = p._render;
const previousStylesV0711 = p.styles;

p.styles = function stylesV0711() {
  return `${previousStylesV0711.call(this)}
    /* UI v0.7.11 — pale-blue corner accent from the vacuum reference. */
    .systemOverview{position:relative;isolation:isolate;overflow:hidden}
    .systemOverview::before{content:"";position:absolute;top:-90px;right:-65px;width:200px;height:200px;border-radius:50%;background:rgba(0,160,200,.07);pointer-events:none;z-index:0}
    .systemOverview>.systemControllerPhoto,.systemOverview>.connectionWrap,.systemOverview>.systemReadiness{position:relative;z-index:1}
  `;
};

p._render = function renderV0711() {
  previousRenderV0711.call(this);
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};
}

// Stable UI release identity.
{
  const UI_VERSION = "1.0.0";
  const Panel = customElements.get("nikas-ho-sc-8w-panel");
  if (!Panel) throw new Error("HO-SC-8W production panel is not registered");
  const p = Panel.prototype;
  const previousRenderV1000 = p._render;
  p._render = function renderV1000() {
    previousRenderV1000.call(this);
    const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
    if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
  };
}
