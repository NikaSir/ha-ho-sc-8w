import "./irrigation-panel.js?v=0.6.31";

const UI_VERSION = "0.6.31";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousStyles = p.styles;
const previousUpdateNavigationState = p._updateNavigationState;

p.header = function headerV0631() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.activeRuntime = function activeRuntimeV0631(e) {
  const active = [...this.zoneSet(this.state(e.active))].map(Number).filter((z) => z >= 1 && z <= 6).sort((a,b) => a-b);
  if (!active.length) return null;
  const zone = active[0];
  const remainingRaw = this.state(e.zones[zone]?.remaining);
  const remaining = Number(String(remainingRaw).replace(",", "."));
  return { zone, remaining: Number.isFinite(remaining) && remaining > 0 ? Math.round(remaining) : null };
};

p.systemStatus = function systemStatusV0631(e) {
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

p.zonesView = function zonesViewV0631(e) {
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

p.currentMode = function currentModeV0631(e) {
  const operation = this.state(e.operation);
  const runtime = this.activeRuntime(e);
  const autoRunning = runtime && String(operation).toLowerCase() !== "manual";
  return `<section class="quickActions"><div class="modeGrid">
    <button class="mode ${operation === "Auto" ? "active" : ""}" data-entity="${this.esc(e.operation)}"><ha-icon icon="mdi:play"></ha-icon><b>${autoRunning ? "Полив идёт" : "Полив"}</b><small>${autoRunning ? `Зона ${runtime.zone}` : operation === "Auto" ? "Авто" : this.esc(this.human("operation", operation))}</small></button>
    <button class="mode disabled" disabled><ha-icon icon="mdi:pause-circle-outline"></ha-icon><b>Пауза</b><small>Недоступно</small></button>
    <button class="mode manualAction ${operation === "Manual" ? "active" : ""}" data-go="manual"><ha-icon icon="mdi:hand-back-right-outline"></ha-icon><b>Ручной</b><small>${operation === "Manual" ? "Активен" : "Настроить"}</small></button>
  </div></section>`;
};

p.stopManual = async function stopManualV0631() {
  if (this.rejectUnavailableCommand("stop_manual")) return;
  if (!window.confirm("Остановить ручной полив?\n\nКонтроллер вернётся в автоматический режим.")) return;
  this._manualBusy = true;
  this.render();
  try {
    await this._hass.callService("nikas_ho_sc_8w", "stop_manual", this.serviceTargetData());
    this.notify("Полив остановлен. Автоматический режим подтверждён контроллером");
    await this.refreshNow();
  } catch (error) {
    this.notify(this.serviceError(error, "Не удалось подтвердить остановку"));
  } finally {
    this._manualBusy = false;
    this.render();
  }
};

p._updateNavigationState = function updateNavigationStateV0631() {
  previousUpdateNavigationState.call(this);
  const viewport = this.shadowRoot.querySelector("[data-work-viewport]");
  if (viewport) viewport.classList.toggle("zonesFitsViewport", this._view === "zones" && !this._drillZone);
};

p.styles = function stylesV0631() {
  return `${previousStyles.call(this)}
    /* UI v0.6.31: explicit live watering state and full-height Zones view. */
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
