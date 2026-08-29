import "./irrigation-panel-v0632.mjs";

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
