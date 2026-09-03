import "./irrigation-panel-v0654.mjs";

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
