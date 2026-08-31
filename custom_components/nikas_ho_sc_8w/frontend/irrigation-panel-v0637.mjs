import "./irrigation-panel-v0636.mjs";

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
