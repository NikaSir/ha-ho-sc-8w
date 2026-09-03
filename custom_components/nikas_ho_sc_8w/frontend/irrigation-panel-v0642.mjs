import "./irrigation-panel-v0641.mjs";

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
