import "/nikas-ho-sc-8w/irrigation-panel.js?v=0.6.19-base";

const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");

const p = Panel.prototype;
const baseStyles = p.styles;

p.header = function headerV0619() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <div class="headerTitle"><strong>HO-SC-8W</strong><small>Система полива · UI v0.6.19</small></div>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
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

p._zoneIndicators = function zoneIndicatorsV0619(z) {
  const configured = this.state(z.q.schedule) === "configured";
  const rain = z.attrs.rain_sensor_follow;
  const readyIcon = z.tone === "running" ? "mdi:water" : z.tone === "queued" ? "mdi:clock-outline" : z.tone === "unknown" ? "mdi:help-circle" : z.tone === "off" ? "mdi:minus-circle" : "mdi:check-circle";
  const readyClass = z.tone === "unknown" || z.tone === "off" ? "off" : "on";
  const programClass = configured ? "on" : "off";
  const rainClass = rain === true ? "on" : rain === false ? "off" : "unknown";
  const rainIcon = rain === false ? "mdi:umbrella-off-outline" : rain === true ? "mdi:umbrella" : "mdi:help-circle-outline";
  return `<span class="zoneIndicators" aria-label="Готовность, участие в программе, учёт датчика дождя">
    <ha-icon class="${readyClass}" icon="${readyIcon}" title="Готовность зоны"></ha-icon>
    <ha-icon class="${programClass}" icon="mdi:calendar-check" title="Участие в программе"></ha-icon>
    <ha-icon class="${rainClass}" icon="${rainIcon}" title="Учёт датчика дождя"></ha-icon>
  </span>`;
};

p.irrigationDiagram = function irrigationDiagramV0619(e) {
  const active = this.zoneSet(this.state(e.active));
  const queued = this.zoneSet(this.state(e.queued));
  const columns = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    const valveTone = active.has(String(zone)) ? "running" : queued.has(String(zone)) ? "queued" : "";
    const branchTone = active.has(String(zone)) ? "run" : queued.has(String(zone)) ? "queue" : "water";
    return `<div class="schemaColumn" data-axis="${zone}">
      <span class="valveNumber">${zone}</span>
      <span class="valvePhoto ${valveTone}" aria-hidden="true"></span>
      <span class="waterBranch ${branchTone}" aria-hidden="true"></span>
      <button class="diagramZone ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}">
        <span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>
        <span class="zoneText"><b>Зона ${zone}</b></span>
        <span class="duration"><span><b>${this.esc(z.duration)}</b><small>мин</small></span></span>
        ${this._zoneIndicators(z)}
      </button>
    </div>`;
  }).join("");
  return `<div class="systemDiagram approvedDiagram">
    <button class="controller" data-entity="${this.esc(e.connection)}" aria-label="Контроллер HO-SC-8W"></button>
    <div class="controllerDrop" aria-hidden="true"></div>
    <div class="controlBus" aria-hidden="true"></div>
    <div class="manifoldRail" aria-hidden="true"></div>
    <div class="supplyLine" aria-hidden="true"></div>
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

p.zonesView = function zonesViewV0619(e) {
  if (this._drillZone) return this.zoneDetail(e, this._drillZone);
  const cards = Array.from({ length: 6 }, (_, i) => i + 1).map((zone) => {
    const z = this.zoneRuntime(e, zone);
    return `<button class="zoneCard ${z.tone}" data-zone="${zone}" data-entity="${this.esc(z.q.schedule)}"><span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span><span class="zoneCardText"><small>ЗОНА ${zone}</small><b>${this.esc(z.label)}</b><em>${this.esc(z.start)} · ${this.esc(z.duration)} мин</em></span>${this._zoneIndicators(z)}<ha-icon class="zoneChevron" icon="mdi:chevron-right"></ha-icon></button>`;
  }).join("");
  return `<div class="pageIntro"><small>ЗОНЫ 1–6</small><h2>Рабочие зоны</h2><p>Фактическое состояние и программа каждого канала.</p></div><div class="zoneCards">${cards}</div>`;
};

p.zoneDetail = function zoneDetailV0619(e, zone) {
  const z = this.zoneRuntime(e, zone);
  const a = z.attrs;
  return `<button class="inlineBack" data-drill-back><ha-icon icon="mdi:arrow-left"></ha-icon>Зоны</button><section class="detailCard"><div class="detailHead"><span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span><div><small>ЗОНА ${zone}</small><h2>${this.esc(z.label)}</h2></div>${this._zoneIndicators(z)}</div><div class="detailGrid"><div><small>Длительность</small><b>${this.esc(z.duration)} мин</b></div><div><small>Старт</small><b>${this.esc(z.start)}</b></div><div><small>Цикл</small><b>${this.esc(this.cycleText(a))}</b></div><div><small>Датчик дождя</small><b>${a.rain_sensor_follow === true ? "Учитывается" : a.rain_sensor_follow === false ? "Игнорируется" : "—"}</b></div></div><p>Фактические параметры DP38. Редактирование и raw-write из панели отсутствуют.</p></section>`;
};

p._bindWorkspaceGestures = function bindWorkspaceGesturesV0619() {
  const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
  if (!viewport || viewport.dataset.zoomV0619 === "1") return;
  viewport.dataset.zoomV0619 = "1";
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
      if (Math.hypot(current.x - start.point.x, current.y - start.point.y) > 4) { this._gestureMoved = true; this._cancelLongPresses(); }
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

p.styles = function stylesV0619() {
  return `${baseStyles.call(this)}
    /* UI v0.6.19 approved irrigation composition */
    .heroHead{align-items:flex-start}.connectionOnly{display:block}.connectionOnly .systemConnection{min-width:170px}
    .approvedDiagram{margin-top:0}.approvedDiagram .controller{left:37.5%!important;top:1%!important;width:25%!important;height:23%!important;transform:none!important}
    .approvedDiagram .controllerDrop{position:absolute;z-index:1;left:50%;top:21%;height:9%;border-left:2px solid #6f7d88;transform:translateX(-50%)}
    .approvedDiagram .controlBus{top:29%!important}
    .approvedDiagram .schemaGrid{top:26%!important;bottom:5%!important}
    .diagramZone{overflow:hidden}.schemaGrid .diagramZone{grid-template-rows:minmax(48px,1fr) auto auto auto!important;gap:4px!important;padding:6px 5px 7px!important}
    .schemaGrid .scene{height:100%!important;min-height:48px}.schemaGrid .zoneText small,.schemaGrid .duration em,.schemaGrid .readyIcon{display:none!important}
    .zoneIndicators{display:flex;align-items:center;justify-content:space-between;gap:3px;width:100%;margin-top:1px}.zoneIndicators ha-icon{--mdc-icon-size:15px;color:#08a52b}.zoneIndicators ha-icon.off{color:#9aa1a8}.zoneIndicators ha-icon.unknown{color:#9aa1a8}
    .scene1{background-image:url('/nikas-ho-sc-8w/assets/zone-1.webp?v=0.6.19')!important}.scene2{background-image:url('/nikas-ho-sc-8w/assets/zone-2.webp?v=0.6.19')!important}.scene3{background-image:url('/nikas-ho-sc-8w/assets/zone-3.webp?v=0.6.19')!important}.scene4{background-image:url('/nikas-ho-sc-8w/assets/zone-4.webp?v=0.6.19')!important}.scene5{background-image:url('/nikas-ho-sc-8w/assets/zone-5.webp?v=0.6.19')!important}.scene6{background-image:url('/nikas-ho-sc-8w/assets/zone-6.webp?v=0.6.19')!important}
    .infraRow{display:grid;grid-template-columns:.9fr 1.35fr;gap:8px;margin-top:8px}.infraRow .heroPressure,.infraRow .rainStatusCard{position:relative;inset:auto;width:100%;min-height:64px;margin:0}.infraRow .heroPressure{display:grid;grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;text-align:left;padding:8px 10px}.infraRow .heroPressure>ha-icon{grid-row:1/3;--mdc-icon-size:29px;color:var(--a)}.infraRow .heroPressure span{font-size:12px}.infraRow .heroPressure b{font-size:19px}.infraRow .rainStatusCard{display:grid;grid-template-columns:42px minmax(0,1fr) 24px;align-items:center;padding:7px 9px}.infraRow .rainStatusPhoto{width:38px;height:44px}.infraRow .rainStatusText b,.infraRow .rainStatusText strong,.infraRow .rainStatusText small{display:block}.infraRow .rainStatusText strong{font-size:14px}.infraRow .rainStatusCard>ha-icon{--mdc-icon-size:24px}
    .zoneCard{grid-template-columns:70px minmax(0,1fr) auto 24px!important;gap:10px!important}.zoneCard .scene{width:70px!important;height:70px!important}.zoneCard .zoneIndicators{width:auto;gap:9px}.zoneCard .zoneIndicators ha-icon{--mdc-icon-size:21px}.zoneCard .zoneChevron{--mdc-icon-size:22px}.zoneCardText{min-width:0}
    .detailHead{grid-template-columns:88px minmax(0,1fr) auto!important}.detailHead .scene{width:88px!important;height:88px!important}.detailHead .zoneIndicators{width:auto;gap:10px}.detailHead .zoneIndicators ha-icon{--mdc-icon-size:24px}
    @media(max-width:520px){
      .approvedDiagram{aspect-ratio:388/390!important;margin-top:0!important}.approvedDiagram .controller{left:35%!important;width:30%!important;height:24%!important}.approvedDiagram .controllerDrop{top:22%;height:8%}.approvedDiagram .schemaGrid{top:25%!important;bottom:3%!important}.schemaColumn{grid-template-rows:26px 32% 8% minmax(0,1fr)!important}.schemaGrid .diagramZone{min-height:122px!important}.schemaGrid .scene{min-height:52px!important}.schemaGrid .zoneIndicators ha-icon{--mdc-icon-size:14px}
      .infraRow{grid-template-columns:.95fr 1.25fr;gap:6px}.infraRow .heroPressure,.infraRow .rainStatusCard{min-height:62px}.infraRow .heroPressure{grid-template-columns:28px minmax(0,1fr);padding:7px}.infraRow .heroPressure>ha-icon{--mdc-icon-size:25px}.infraRow .heroPressure b{font-size:17px}.infraRow .rainStatusCard{grid-template-columns:34px minmax(0,1fr) 20px;padding:6px}.infraRow .rainStatusPhoto{width:31px;height:39px}.infraRow .rainStatusText strong{font-size:13px}.infraRow .rainStatusText small{font-size:11px!important}
      .zoneCard{grid-template-columns:62px minmax(0,1fr) auto 20px!important;gap:8px!important}.zoneCard .scene{width:62px!important;height:62px!important}.zoneCard .zoneIndicators{gap:6px}.zoneCard .zoneIndicators ha-icon{--mdc-icon-size:19px}
      .detailHead{grid-template-columns:78px minmax(0,1fr) auto!important}.detailHead .scene{width:78px!important;height:78px!important}.detailHead .zoneIndicators{gap:6px}.detailHead .zoneIndicators ha-icon{--mdc-icon-size:21px}
    }
  `;
};
