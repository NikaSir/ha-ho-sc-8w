import "./irrigation-panel-v0646.mjs";

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
