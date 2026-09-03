import "./irrigation-panel-v0656.mjs";

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
